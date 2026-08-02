import os
import io
import json
import zipfile
import threading
import queue
from urllib.parse import urlparse

import requests as req_lib
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from crawler_service import crawl_website
from excel_service import create_excel

# ── App setup ────────────────────────────────────────────────────────────────

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

# ── Shared state (for /status and download endpoints) ─────────────────────────

_state_lock = threading.Lock()
_state = {
    "running":    False,
    "pages":      0,
    "pdf_found":  0,
    "downloaded": 0,
    "total":      0,
    "progress":   0,
    "phase":      "idle",
    "result":     None,
    "error":      None,
}


def _set_state(**kwargs):
    with _state_lock:
        _state.update(kwargs)


# ── Inline PDF downloader (no registry, no download_service) ─────────────────

def download_pdf(link: str, folder: str):
    """Download a single PDF. Returns local path on success, None on failure."""
    fname = link.split("/")[-1].split("?")[0].strip() or "document.pdf"
    if not fname.lower().endswith(".pdf"):
        fname += ".pdf"
    path = os.path.join(folder, fname)

    # Skip if already on disk and looks complete
    if os.path.exists(path) and os.path.getsize(path) > 500:
        return path

    try:
        r = req_lib.get(
            link,
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=20,
            stream=True,
        )
        r.raise_for_status()
        ct = r.headers.get("content-type", "").lower()
        if "pdf" not in ct and not link.lower().endswith(".pdf"):
            return None
        with open(path, "wb") as f:
            for chunk in r.iter_content(65536):
                if chunk:
                    f.write(chunk)
        return path
    except Exception:
        return None


# ── SSE helper ────────────────────────────────────────────────────────────────

def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "DocPlus API Running"}


@app.get("/status")
def get_status():
    with _state_lock:
        return dict(_state)


@app.get("/crawl-stream")
def crawl_stream(url: str):
    """
    SSE endpoint.  Streams progress events in real-time while the crawl and
    downloads run, then signals completion with a 'done' event.
    """
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Invalid URL — must start with http:// or https://")

    def generate():
        # ── Reset shared state ────────────────────────────────────────
        _set_state(
            running=True, phase="crawling",
            pages=0, pdf_found=0, downloaded=0, total=0,
            progress=0, result=None, error=None,
        )

        # ── Phase 1: Crawl via background thread + queue ──────────────
        crawl_q: queue.Queue = queue.Queue()
        result_holder = [None]
        error_holder  = [None]

        def on_progress(pages: int, found: int):
            progress = min(int(pages / 2), 50)
            _set_state(pages=pages, pdf_found=found, progress=progress)
            crawl_q.put({
                "type":      "progress",
                "phase":     "crawling",
                "pages":     pages,
                "pdf_found": found,
                "progress":  progress,
            })

        def run_crawl():
            try:
                links = crawl_website(url, progress_callback=on_progress)
                result_holder[0] = links
            except Exception as exc:
                error_holder[0] = str(exc)
            finally:
                crawl_q.put(None)  # sentinel

        t = threading.Thread(target=run_crawl, daemon=True)
        t.start()

        # Drain progress events while crawl runs
        while True:
            try:
                item = crawl_q.get(timeout=120)
            except queue.Empty:
                error_holder[0] = "Crawl timed out after 120 s waiting for progress."
                break
            if item is None:
                break
            yield _sse(item)

        if error_holder[0]:
            _set_state(running=False, phase="error", error=error_holder[0])
            yield _sse({"type": "error", "message": error_holder[0]})
            return

        pdf_links = result_holder[0] or []
        total = len(pdf_links)

        if total == 0:
            msg = "No PDF links found on this website."
            _set_state(running=False, phase="error", error=msg)
            yield _sse({"type": "error", "message": msg})
            return

        # Emit a final crawl-phase update so UI sees full pdf_found
        with _state_lock:
            pages_final = _state["pages"]
        _set_state(pdf_found=total, total=total, progress=50, phase="downloading")
        yield _sse({
            "type":      "progress",
            "phase":     "downloading",
            "pages":     pages_final,
            "pdf_found": total,
            "downloaded": 0,
            "total":     total,
            "progress":  50,
        })

        # ── Determine download folder ──────────────────────────────────
        domain  = urlparse(url).netloc
        parts   = domain.replace("www.", "").split(".")
        name    = parts[-2] if len(parts) >= 2 else parts[0]
        folder_path = os.path.join("downloads", name)
        os.makedirs(folder_path, exist_ok=True)

        # ── Phase 2: Download one by one, yield progress events ───────
        downloaded_files = []
        downloaded_count = 0

        for link in pdf_links:
            path = download_pdf(link, folder_path)
            if path:
                downloaded_files.append({"name": os.path.basename(path), "path": path})
            downloaded_count += 1
            pct = 50 + int((downloaded_count / total) * 40)
            _set_state(downloaded=downloaded_count, progress=pct)
            yield _sse({
                "type":        "progress",
                "phase":       "downloading",
                "pages":       pages_final,
                "pdf_found":   total,
                "downloaded":  downloaded_count,
                "total":       total,
                "progress":    pct,
            })

        # ── Phase 3: Create Excel (90-100%) ───────────────────────────
        _set_state(phase="packaging", progress=90)
        yield _sse({
            "type":       "progress",
            "phase":      "packaging",
            "pdf_found":  total,
            "downloaded": len(downloaded_files),
            "total":      total,
            "progress":   90,
        })

        try:
            excel_path = create_excel(pdf_links, folder_path)
        except Exception as exc:
            excel_path = None
            print(f"[EXCEL ERROR] {exc}")

        # ── Done ───────────────────────────────────────────────────────
        result = {
            "success":    True,
            "pdf_found":  total,
            "downloaded": len(downloaded_files),
            "pages":      pages_final,
            "folder":     folder_path,
            "excel_file": excel_path or "",
            "zip_ready":  len(downloaded_files) > 0,
            "files":      downloaded_files,
            "message":    "Crawl completed successfully",
        }
        _set_state(running=False, phase="done", progress=100, result=result)

        yield _sse({
            "type":       "done",
            "pdf_found":  total,
            "downloaded": len(downloaded_files),
            "pages":      pages_final,
            "progress":   100,
            "excel_file": excel_path or "",
            "zip_ready":  len(downloaded_files) > 0,
            "folder":     folder_path,
        })

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":    "no-cache",
            "X-Accel-Buffering": "no",
            "Connection":       "keep-alive",
        },
    )


@app.delete("/crawl")
def cancel_crawl():
    """Reset state — useful if a previous crawl left a stale result."""
    _set_state(
        running=False, phase="idle",
        pages=0, pdf_found=0, downloaded=0, total=0,
        progress=0, result=None, error=None,
    )
    return {"message": "State cleared"}


@app.get("/download-excel")
def download_excel():
    with _state_lock:
        result = _state.get("result")
    if not result or not result.get("excel_file"):
        raise HTTPException(status_code=404, detail="No Excel file available. Run a crawl first.")
    excel_path = result["excel_file"]
    if not os.path.exists(excel_path):
        raise HTTPException(status_code=404, detail="Excel file not found on disk.")

    filename = os.path.basename(excel_path)

    def iter_file():
        with open(excel_path, "rb") as f:
            while chunk := f.read(65536):
                yield chunk

    return StreamingResponse(
        iter_file(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/download-zip")
def download_zip():
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
        headers={"Content-Disposition": f'attachment; filename="{zipname}"'},
    )
