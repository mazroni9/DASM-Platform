import os
import re
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from .utils_local import image_to_text
from ..utils import fetch_bytes, open_image_from_bytes

VIN_RE = re.compile(r"\b[A-HJ-NPR-Z0-9]{11,17}\b", re.IGNORECASE)

def ocr_from_image_bytes(img_bytes: bytes) -> str:
    img = open_image_from_bytes(img_bytes)
    return image_to_text(img)

def ocr_from_pdf_bytes(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    texts = []
    for i in range(min(2, doc.page_count)):  # أول صفحتين كفاية كبداية
        page = doc.load_page(i)
        pix = page.get_pixmap(dpi=200)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        texts.append(image_to_text(img))
    return "\n".join(texts)

def extract_vins(text: str) -> list[str]:
    return list(dict.fromkeys([m.group(0).upper() for m in VIN_RE.finditer(text or "")]))

def run_registration_ocr(registration_url: str | None) -> dict:
    if not registration_url:
        return {"text": "", "vins": []}

    data = fetch_bytes(registration_url)
    if not data:
        return {"text": "", "vins": []}

    # detect pdf
    if registration_url.lower().endswith(".pdf") or data[:4] == b"%PDF":
        text = ocr_from_pdf_bytes(data)
    else:
        text = ocr_from_image_bytes(data)

    return {"text": text, "vins": extract_vins(text)}
