import os
import threading
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from crawler_service import crawl_website
from download_service import download_all_pdfs
from excel_service import create_excel
from zip_service import create_zip

app = FastAPI(title="PDF Discovery API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("downloads", exist_ok=True)
app.mount("/downloads", StaticFiles(directory="downloads"), name="downloads")

# ── Live crawl state (thread-safe) ────────────────────────────────────────────
_state_lock = threading.Lock()
_state = {
    "running": False,
    "pages": 0,
    "pdf_found": 0,
    "downloaded": 0,
}


def _reset_state():
    with _state_lock:
        _state["running"] = True
        _state["pages"] = 0
        _state["pdf_found"] = 0
        _state["downloaded"] = 0


def _update_progress(pages: int, pdf_found: int):
    with _state_lock:
        _state["pages"] = pages
        _state["pdf_found"] = pdf_found


def _finish_state(downloaded: int, pdf_found: int):
    with _state_lock:
        _state["running"] = False
        _state["downloaded"] = downloaded
        _state["pdf_found"] = pdf_found


# ── Models ─────────────────────────────────────────────────────────────────────
class UrlRequest(BaseModel):
    url: str


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "PDF Discovery API Running"}


@app.get("/status")
def status():
    with _state_lock:
        return {
            "pages":      _state["pages"],
            "pdf_found":  _state["pdf_found"],
            "downloaded": _state["downloaded"],
            "running":    _state["running"],
        }


@app.post("/crawl")
def crawl(req: UrlRequest):
    # Reject if another crawl is already running
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

    try:
        # Crawl with live progress updates
        found_pdf_links = crawl_website(
            req.url,
            progress_callback=_update_progress
        )

        if not found_pdf_links:
            _finish_state(downloaded=0, pdf_found=0)
            raise HTTPException(
                status_code=404,
                detail="No PDF links found on this website. The site may block crawling or have no PDFs."
            )

        # Update found count before download starts
        with _state_lock:
            _state["pdf_found"] = len(found_pdf_links)

        downloaded_files, folder = download_all_pdfs(found_pdf_links, req.url)

        # Update downloaded count live (download_service returns final list)
        with _state_lock:
            _state["downloaded"] = len(downloaded_files)

        excel_path = create_excel(found_pdf_links, folder)
        zip_path = create_zip(folder)

        _finish_state(
            downloaded=len(downloaded_files),
            pdf_found=len(found_pdf_links)
        )

        return {
            "success":      True,
            "pdf_found":    len(found_pdf_links),
            "downloaded":   len(downloaded_files),
            "folder":       folder,
            "excel_file":   f"/downloads/{os.path.relpath(excel_path, 'downloads').replace(os.sep, '/')}",
            "zip_download": f"/downloads/{os.path.relpath(zip_path, 'downloads').replace(os.sep, '/')}",
            "files":        [
                {
                    "name": os.path.basename(f),
                    "path": f,
                    "url":  f"/downloads/{os.path.relpath(f, 'downloads').replace(os.sep, '/')}",
                }
                for f in downloaded_files
            ],
            "message": "Crawl completed successfully",
        }

    except HTTPException:
        _finish_state(downloaded=0, pdf_found=0)
        raise
    except Exception as e:
        _finish_state(downloaded=0, pdf_found=0)
        print(f"[SERVER ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))
