import io
import os
import requests
from PIL import Image

def fetch_bytes(path_or_url: str) -> bytes:
    if not path_or_url:
        return b""
    if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        r = requests.get(path_or_url, timeout=60)
        r.raise_for_status()
        return r.content
    # local file
    with open(path_or_url, "rb") as f:
        return f.read()

def open_image_from_bytes(data: bytes) -> Image.Image:
    return Image.open(io.BytesIO(data)).convert("RGB")
