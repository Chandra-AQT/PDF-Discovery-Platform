import os
import asyncio
import threading
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from crawler_service import crawl_website
from download_service import download_all_pdfs
from excel_service import create_excel
from zip_service import create_zip

app = FastAPI(title="DocPlus API")

# In production set ALLOWED_ORIGINS env var to your Vercel URL
# e.g. ALLOWED_ORIGINS=https://docplus.vercel.app
_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [o.strip() for o in _origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("downloads", exist_ok=True)

# Mount AFTER all routes to avoid 405 conflicts
# Serves downloaded PDFs and ZIP files
try:
    from fastapi.staticfiles import StaticFiles
    app.mount("/downloads", StaticFiles(directory="downloads"), name="downloads")
except Exception as e:
    print(f"[WARN] Static files mount failed: {e}")

# ── Thread pool for running blocking crawl off the async event loop ────────────
_executor = ThreadPoolExecutor(max_workers=2)

# ── Live crawl state (thread-safe) ────────────────────────────────────────────
_state_lock = threading.Lock()
_state = {
    "running":    False,
    "pages":      0,
    "pdf_found":  0,
    "downloaded": 0,
    "result":     None,   # stores final result for polling after completion
    "error":      None,
}


def _reset_state():
    with _state_lock:
        _state["running"]    = True
        _state["pages"]      = 0
        _state["pdf_found"]  = 0
        _state["downloaded"] = 0
        _state["result"]     = None
        _state["error"]      = None


def _update_progress(pages: int, pdf_found: int):
    with _state_lock:
        _state["pages"]     = pages
        _state["pdf_found"] = pdf_found


def _update_downloaded(downloaded: int):
    with _state_lock:
        _state["downloaded"] = downloaded


def _finish_state(result=None, error=None):
    with _state_lock:
        _state["running"] = False
        if result:
            _state["pdf_found"]  = result.get("pdf_found",  _state["pdf_found"])
            _state["downloaded"] = result.get("downloaded", _state["downloaded"])
            _state["result"]     = result
        if error:
            _state["error"] = error


# ── The actual blocking crawl — runs in thread pool ───────────────────────────
def _run_crawl(url: str):
    """Blocking function: crawl → download → excel → zip. Returns result dict."""
    try:
        found_pdf_links = crawl_website(url, progress_callback=_update_progress)

        if not found_pdf_links:
            _finish_state(error="No PDF links found on this website.")
            return

        with _state_lock:
            _state["pdf_found"] = len(found_pdf_links)

        downloaded_files, folder = download_all_pdfs(found_pdf_links, url)
        _update_downloaded(len(downloaded_files))

        excel_path = create_excel(found_pdf_links, folder)
        zip_path   = create_zip(folder)

        result = {
            "success":      True,
            "pdf_found":    len(found_pdf_links),
            "downloaded":   len(downloaded_files),
            "folder":       folder,
            "excel_file":   f"/downloads/{os.path.relpath(excel_path, 'downloads').replace(os.sep, '/')}",
            "zip_download": f"/downloads/{os.path.relpath(zip_path,   'downloads').replace(os.sep, '/')}",
            "files": [
                {
                    "name": os.path.basename(f),
                    "path": f,
                    "url":  f"/downloads/{os.path.relpath(f, 'downloads').replace(os.sep, '/')}",
                }
                for f in downloaded_files
            ],
            "message": "Crawl completed successfully",
        }
        _finish_state(result=result)

    except Exception as e:
        print(f"[CRAWL THREAD ERROR] {e}")
        _finish_state(error=str(e))


# ── Models ─────────────────────────────────────────────────────────────────────
class UrlRequest(BaseModel):
    url: str


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "DocPlus API Running"}


@app.get("/status")
def status():
    """Returns live crawl progress. Always responds immediately."""
    with _state_lock:
        return {
            "pages":      _state["pages"],
            "pdf_found":  _state["pdf_found"],
            "downloaded": _state["downloaded"],
            "running":    _state["running"],
            "error":      _state["error"],
            "result":     _state["result"],
        }


@app.post("/crawl")
async def crawl(req: UrlRequest):
    """
    Kicks off the crawl in a background thread and returns immediately.
    The frontend polls /status for live progress and the final result.
    """
    with _state_lock:
        if _state["running"]:
            raise HTTPException(
                status_code=409,
                detail="A crawl is already in progress. Please wait for it to finish."
            )

    if not req.url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid URL starting with http:// or https://"
        )

    _reset_state()

    # Run blocking crawl in thread pool — doesn't block the event loop
    loop = asyncio.get_running_loop()
    loop.run_in_executor(_executor, _run_crawl, req.url)

    # Return immediately — frontend polls /status
    return {"message": "Crawl started", "running": True}
