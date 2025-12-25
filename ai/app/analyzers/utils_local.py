import os
import pytesseract
from PIL import Image


def _setup_tesseract() -> None:
    """
    Configure Tesseract executable path and tessdata directory if provided via env.
    - TESSERACT_CMD: full path to tesseract.exe (Windows)
    - TESSDATA_PREFIX: path to tessdata folder containing ara.traineddata / eng.traineddata
    """
    cmd = os.getenv("TESSERACT_CMD")
    if cmd:
        pytesseract.pytesseract.tesseract_cmd = cmd

    tessdata = os.getenv("TESSDATA_PREFIX")
    if tessdata:
        # ensure the process sees it
        os.environ["TESSDATA_PREFIX"] = tessdata


def image_to_text(img: Image.Image) -> str:
    _setup_tesseract()

    # عربي + إنجليزي (مع بعض)
    lang = os.getenv("TESSERACT_LANG", "ara+eng")

    # config اختياري لتحسين القراءة (ممكن تغيّره لو تحب)
    # --oem 3: default engine, --psm 6: assume a block of text
    config = os.getenv("TESSERACT_CONFIG", "--oem 3 --psm 6")

    try:
        text = pytesseract.image_to_string(img, lang=lang, config=config) or ""
        if text.strip():
            return text
    except Exception:
        pass

    # fallback 1: عربي فقط
    try:
        text = pytesseract.image_to_string(img, lang="ara", config=config) or ""
        if text.strip():
            return text
    except Exception:
        pass

    # fallback 2: إنجليزي فقط
    return pytesseract.image_to_string(img, lang="eng", config=config) or ""
