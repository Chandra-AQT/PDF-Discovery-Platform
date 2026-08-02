import os
import json
import threading

REGISTRY_FILE = "download_registry.json"

_lock = threading.Lock()
_registry: set = set()
_loaded = False


def _ensure_loaded():
    """Load registry from disk once at first use."""
    global _loaded
    if _loaded:
        return
    if os.path.exists(REGISTRY_FILE):
        try:
            with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    _registry.update(data)
        except Exception as e:
            print(f"[REGISTRY LOAD ERROR] {e}")
    _loaded = True


def _persist():
    """Write current in-memory registry to disk."""
    try:
        with open(REGISTRY_FILE, "w", encoding="utf-8") as f:
            json.dump(list(_registry), f, indent=2)
    except Exception as e:
        print(f"[REGISTRY SAVE ERROR] {e}")


def file_exists(link: str) -> bool:
    with _lock:
        _ensure_loaded()
        return link in _registry


def register_file(link: str):
    with _lock:
        _ensure_loaded()
        _registry.add(link)
        _persist()


def clear_registry():
    """Remove all entries — useful for testing or resetting state."""
    global _loaded
    with _lock:
        _registry.clear()
        _loaded = True
        _persist()
