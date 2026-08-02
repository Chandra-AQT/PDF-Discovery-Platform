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

_executor = ThreadPoolExecutor(max_workers=2)

_state_lock = threading.Lock()
_state = {
    "running":    False,
    "phase":      "idle",      # idle | crawling | downloading | packaging | done
    "pages":      0,
    "pdf_found":  0,
    "downloaded": 0,
    "total_to_download": 0,
    "progress":   0,           # 0-100 percentage
    "result":     None,
    "error":      None,
}


def _reset_state():
    with _state_lock:
        _state.update({
            "running": True, "phase": "crawling",
            "pages": 0, "pdf_found": 0,
            "downloaded": 0, "total_to_download": 0,
            "progress": 0, "result": None, "error": None,
        })


def _update_crawl_progress(pages: int, pdf_found: int):
    with _state_lock:
        _state["pages"]     = pages
        _state["pdf_found"] = pdf_found
        # Crawling = 0-50% of total progress
        _state["progress"]  = min(int(pages / 2), 50)


def _update_download_progress(downloaded: int, total: int):
    with _state_lock:
        _state["downloaded"]        = downloaded
        _state["total_to_download"] = total
        # Downloading = 50-90% of total progress
        pct = int((downloaded / total) * 40) if total > 0 else 0
        _state["progress"] = 50 + pct
        _state["phase"]    = "downloading"


def _finish_state(result=None, error=None):
    with _state_lock:
        _state["running"]  = False
        _state["progress"] = 100 if result else _state["progress"]
        _state["phase"]    = "done" if result else "error"
        if result:
            _state["pdf_found"]  = result.get("pdf_found",  _state["pdf_found"])
            _state["downloaded"] = result.get("downloaded", _state["downloaded"])
            _state["pages"]      = result.get("pages",      _state["pages"])
            _state["result"]     = result
        if error:
            _state["error"] = error


def _run_crawl(url: str):
    try:
        # ── Phase 1: Crawl ──────────────────────────────────────────────
        with _state_lock:
            _state["phase"] = "crawling"

        found_pdf_links = crawl_website(url, progress_callback=_update_crawl_progress)

        if not found_pdf_links:
            _finish_state(error="No PDF links found on this website.")
            return

        total = len(found_pdf_links)
        with _state_lock:
            _state["pdf_found"]          = total
            _state["total_to_download"]  = total
            _state["progress"]           = 50
            _state["phase"]              = "downloading"

        # ── Phase 2: Download with live progress ────────────────────────
        # Use a custom downloader that reports progress per file
        from registry_service import file_exists, register_file
        import requests as req_lib
        from urllib.parse import urlparse
        from concurrent.futures import ThreadPoolExecutor as TPE, as_completed

        domain = urlparse(url).netloc
        parts  = domain.replace("www.", "").split(".")
        name   = parts[-2] if len(parts) >= 2 else parts[0]
        folder = os.path.join("downloads", name)
        os.makedirs(folder, exist_ok=True)

        HEADERS = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        downloaded_count = [0]
        downloaded_files = []
        lock = threading.Lock()

        def dl_one(link):
            # Clear registry check — always try to download fresh on Railway
            fname = link.split("/")[-1].split("?")[0].strip() or "document.pdf"
            if not fname.lower().endswith(".pdf"):
                fname += ".pdf"
            path = os.path.join(folder, fname)

            # Skip if already exists on disk
            if os.path.exists(path) and os.path.getsize(path) > 0:
                with lock:
                    downloaded_count[0] += 1
                    _update_download_progress(downloaded_count[0], total)
                return path

            try:
                r = req_lib.get(link, headers=HEADERS, timeout=20,
                                allow_redirects=True, stream=True)
                r.raise_for_status()
                ct = r.headers.get("content-type", "").lower()
                if "pdf" not in ct and not link.lower().endswith(".pdf"):
                    return None
                with open(path, "wb") as f:
                    for chunk in r.iter_content(65536):
                        if chunk:
                            f.write(chunk)
                with lock:
                    downloaded_count[0] += 1
                    _update_download_progress(downloaded_count[0], total)
                return path
            except Exception as e:
                print(f"[DL ERROR] {link}: {e}")
                with lock:
                    downloaded_count[0] += 1
                    _update_download_progress(downloaded_count[0], total)
                return None

        with TPE(max_workers=10) as ex:
            futures = {ex.submit(dl_one, lnk): lnk for lnk in found_pdf_links}
            for fut in as_completed(futures):
                r = fut.result()
                if r:
                    downloaded_files.append(r)

        # ── Phase 3: Excel ──────────────────────────────────────────────
        with _state_lock:
            _state["phase"]    = "packaging"
            _state["progress"] = 92

        excel_path = create_excel(found_pdf_links, folder)

        with _state_lock:
            _state["progress"] = 100

        result = {
            "success":    True,
            "pdf_found":  total,
            "downloaded": len(downloaded_files),
            "pages":      _state["pages"],
            "folder":     folder,
            "excel_file": excel_path,
            "zip_ready":  len(downloaded_files) > 0,
            "files":      [{"name": os.path.basename(f), "path": f}
                           for f in downloaded_files],
            "message":    "Crawl completed successfully",
        }
        _finish_state(result=result)

    except Exception as e:
        print(f"[CRAWL ERROR] {e}")
        _finish_state(error=str(e))


class UrlRequest(BaseModel):
    url: str


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
            "total":      _state["total_to_download"],
            "progress":   _state["progress"],
            "phase":      _state["phase"],
            "running":    _state["running"],
            "error":      _state["error"],
            "result":     _state["result"],
        }


@app.post("/crawl")
async def crawl(req: UrlRequest):
    with _state_lock:
        if _state["running"]:
            raise HTTPException(status_code=409,
                detail="A crawl is already in progress.")

    if not req.url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400,
            detail="Please enter a valid URL starting with http:// or https://")

    # Reset state FIRST so polls see running=True immediately
    _reset_state()

    # Small delay to ensure state is flushed before thread reads it
    loop = asyncio.get_running_loop()
    loop.run_in_executor(_executor, _run_crawl, req.url)

    return {"message": "Crawl started", "running": True}


@app.delete("/crawl")
async def cancel_crawl():
    """Allow frontend to reset state if a stale result is stuck."""
    with _state_lock:
        _state.update({
            "running": False, "phase": "idle",
            "pages": 0, "pdf_found": 0,
            "downloaded": 0, "total_to_download": 0,
            "progress": 0, "result": None, "error": None,
        })
    return {"message": "State cleared"}


@app.get("/download-excel")
def download_excel():
    with _state_lock:
        result = _state.get("result")
    if not result or not result.get("excel_file"):
        raise HTTPException(status_code=404,
            detail="No Excel file available. Run a crawl first.")
    excel_path = result["excel_file"]
    if not os.path.exists(excel_path):
        raise HTTPException(status_code=404, detail="Excel file not found.")
    filename = os.path.basename(excel_path)
    def iter_file():
        with open(excel_path, "rb") as f:
            while chunk := f.read(65536):
                yield chunk
    return StreamingResponse(iter_file(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.get("/download-zip")
def download_zip():
    with _state_lock:
        result = _state.get("result")
    if not result or not result.get("files"):
        raise HTTPException(status_code=404,
            detail="No files available. Run a crawl first.")
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
    return StreamingResponse(generate_zip(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{zipname}"'})
