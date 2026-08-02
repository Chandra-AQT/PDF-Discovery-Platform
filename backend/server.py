import os
import io
import asyncio
import zipfile
import threading
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from crawler_service import crawl_website
from download_service import download_all_pdfs
from excel_service import create_excel

app = FastAPI(title="DocPlus API")

# CORS
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

# ── Thread pool ────────────────────────────────────────────────────────────────
_executor = ThreadPoolExecutor(max_workers=2)

# ── Live state ─────────────────────────────────────────────────────────────────
_state_lock = threading.Lock()
_state = {
    "running":    False,
    "pages":      0,
    "pdf_found":  0,
    "downloaded": 0,
    "result":     None,
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


# ── Crawl worker ───────────────────────────────────────────────────────────────
def _run_crawl(url: str):
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

        result = {
            "success":      True,
            "pdf_found":    len(found_pdf_links),
            "downloaded":   len(downloaded_files),
            "pages":        _state["pages"],   # include final page count
            "folder":       folder,
            "excel_file":   excel_path,
            "zip_ready":    True,
            "files":        [
                {"name": os.path.basename(f), "path": f}
                for f in downloaded_files
            ],
            "message": "Crawl completed successfully",
        }
        _finish_state(result=result)

    except Exception as e:
        print(f"[CRAWL ERROR] {e}")
        _finish_state(error=str(e))


# ── Models ──────────────────────────────────────────────────────────────────────
class UrlRequest(BaseModel):
    url: str


# ── Routes ──────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "DocPlus API Running"}


@app.get("/status")
def status():
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
    with _state_lock:
        if _state["running"]:
            raise HTTPException(
                status_code=409,
                detail="A crawl is already in progress."
            )

    if not req.url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid URL starting with http:// or https://"
        )

    _reset_state()
    loop = asyncio.get_running_loop()
    loop.run_in_executor(_executor, _run_crawl, req.url)
    return {"message": "Crawl started", "running": True}


@app.get("/download-excel")
def download_excel():
    """Stream the latest Excel file directly to the browser."""
    with _state_lock:
        result = _state.get("result")

    if not result or not result.get("excel_file"):
        raise HTTPException(status_code=404, detail="No Excel file available. Run a crawl first.")

    excel_path = result["excel_file"]
    if not os.path.exists(excel_path):
        raise HTTPException(status_code=404, detail="Excel file not found on server.")

    filename = os.path.basename(excel_path)

    def iter_file():
        with open(excel_path, "rb") as f:
            while chunk := f.read(65536):
                yield chunk

    return StreamingResponse(
        iter_file(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@app.get("/download-zip")
def download_zip():
    """Build a ZIP of all downloaded PDFs in-memory and stream to browser."""
    with _state_lock:
        result = _state.get("result")

    if not result or not result.get("files"):
        raise HTTPException(status_code=404, detail="No files available. Run a crawl first.")

    files   = result["files"]
    folder  = result.get("folder", "downloads")
    zipname = os.path.basename(folder) + ".zip"

    def generate_zip():
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for f in files:
                path = f.get("path", "")
                if os.path.exists(path):
                    zf.write(path, f.get("name", os.path.basename(path)))
        buf.seek(0)
        while chunk := buf.read(65536):
            yield chunk

    return StreamingResponse(
        generate_zip(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{zipname}"'}
    )
