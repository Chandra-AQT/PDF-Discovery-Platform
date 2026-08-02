import os
import requests
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed

from registry_service import file_exists, register_file

BASE_DIR = "downloads"
os.makedirs(BASE_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    )
}


def get_folder_name(url: str) -> str:
    """
    Derive a consistent folder name from the URL domain.
    e.g. https://www.redmi.com/... -> downloads/redmi
         https://i02.appmifile.com/... -> downloads/mi  (strip leading 'app')
    The same domain always maps to the same folder — no numbered suffixes.
    """
    domain = urlparse(url).netloc
    parts = domain.split(".")

    # Drop 'www', common CDN prefixes, numeric subdomains
    skip_prefixes = {"www", "image01", "image02", "i02", "i01", "cdn", "static", "assets"}
    clean_parts = [p for p in parts if p not in skip_prefixes and not p.isdigit()]

    # Use second-level domain (e.g. 'redmi' from redmi.com, 'appmifile' from appmifile.com)
    if len(clean_parts) >= 2:
        name = clean_parts[-2]          # second-level domain
    elif clean_parts:
        name = clean_parts[0]
    else:
        name = "site"

    # Strip common app/download prefixes that make ugly folder names
    for prefix in ("app", "download"):
        if name.startswith(prefix) and len(name) > len(prefix):
            name = name[len(prefix):]

    name = name.lower().strip("-_") or "site"
    return os.path.join(BASE_DIR, name)


def safe_filename_from_url(link: str) -> str:
    filename = link.split("/")[-1].split("?")[0].strip()
    if not filename:
        filename = "document.pdf"
    if not filename.lower().endswith(".pdf"):
        filename += ".pdf"
    return filename


def download_single(link: str, folder: str):
    """Download one PDF. Returns the saved path or None on skip/failure."""
    if file_exists(link):
        print(f"[SKIP] Already downloaded: {link}")
        return None

    try:
        filename = safe_filename_from_url(link)
        path = os.path.join(folder, filename)

        response = requests.get(
            link,
            headers=HEADERS,
            timeout=25,
            allow_redirects=True,
            stream=True,
        )
        response.raise_for_status()

        content_type = response.headers.get("content-type", "").lower()
        if "pdf" not in content_type and not link.lower().endswith(".pdf"):
            print(f"[SKIP] Not a PDF resource: {link}")
            return None

        with open(path, "wb") as file:
            for chunk in response.iter_content(chunk_size=65536):
                if chunk:
                    file.write(chunk)

        register_file(link)
        print(f"[DOWNLOADED] {path}")
        return path

    except Exception as e:
        print(f"[DOWNLOAD ERROR] Failed to download {link}: {e}")
        return None


def download_all_pdfs(pdf_links: list, start_url: str, max_workers: int = 8):
    """
    Download all PDFs into a folder derived from start_url.
    Returns (list_of_saved_paths, folder_path).
    """
    folder = get_folder_name(start_url)
    os.makedirs(folder, exist_ok=True)

    downloaded_files = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(download_single, link, folder): link for link in pdf_links}
        for future in as_completed(futures):
            result = future.result()
            if result:
                downloaded_files.append(result)

    return downloaded_files, folder
