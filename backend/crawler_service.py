import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from concurrent.futures import ThreadPoolExecutor
import threading

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    )
}


def process_page(url, domain, visited_set, pdf_set, lock):
    """Crawl a single page, collect PDF links and internal links."""
    try:
        response = requests.get(
            url,
            headers=HEADERS,
            timeout=15,
            allow_redirects=True
        )
        response.raise_for_status()

        content_type = response.headers.get("content-type", "").lower()
        if "text/html" not in content_type:
            return []

        soup = BeautifulSoup(response.text, "html.parser")
        discovered_links = []

        for tag in soup.find_all("a", href=True):
            href = tag["href"].strip()
            if not href:
                continue

            full_link = urljoin(url, href)
            full_link = full_link.split("#")[0]

            parsed = urlparse(full_link)
            if not parsed.scheme.startswith("http"):
                continue

            if full_link.lower().endswith(".pdf"):
                with lock:
                    pdf_set.add(full_link)
            elif parsed.netloc == domain:
                discovered_links.append(full_link)

        return discovered_links

    except Exception as e:
        print(f"[CRAWL ERROR] Failed to process {url}: {e}")
        return []


def crawl_website(start_url, max_pages=200, batch_size=10, max_workers=10,
                  progress_callback=None):
    """
    Crawl start_url and return a list of discovered PDF links.

    progress_callback(pages_visited, pdfs_found) is called after each batch
    so callers can update live status.
    """
    visited_set = set()
    pdf_set = set()
    lock = threading.Lock()

    parsed_start = urlparse(start_url)
    domain = parsed_start.netloc

    if not domain:
        raise ValueError("Invalid start URL")

    queue = [start_url]

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        while queue and len(visited_set) < max_pages:
            current_batch = []

            while queue and len(current_batch) < batch_size and len(visited_set) < max_pages:
                next_url = queue.pop(0)
                with lock:
                    if next_url not in visited_set:
                        visited_set.add(next_url)
                        current_batch.append(next_url)

            if not current_batch:
                continue

            results = list(executor.map(
                lambda u: process_page(u, domain, visited_set, pdf_set, lock),
                current_batch
            ))

            for links in results:
                for link in links:
                    with lock:
                        if link not in visited_set and link not in queue:
                            queue.append(link)

            if progress_callback:
                with lock:
                    progress_callback(len(visited_set), len(pdf_set))

    return list(pdf_set)
