from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Optional

from app.analyzers.ocr import run_registration_ocr
from app.analyzers.vision import analyze_images
from app.analyzers.judge import llm_judge

app = FastAPI(title="DASM AI Review (Free Models)")

class AnalyzeRequest(BaseModel):
    car_id: int
    car: dict[str, Any]
    images: list[str] = []
    registration_card_image: Optional[str] = None

@app.post("/analyze-car")
def analyze_car(req: AnalyzeRequest):
    car = req.car or {}
    vin = str(car.get("vin", "")).upper().strip()

    ocr = run_registration_ocr(req.registration_card_image)
    vision = analyze_images(req.images)

    # Features (لـLLM + Heuristic)
    vin_found = vin in (ocr.get("vins") or [])
    features = {
        "vin_input": vin,
        "vin_found_in_doc": vin_found,
        "doc_has_any_vin": bool(ocr.get("vins")),
        "car_detections": vision.get("car_detections", 0),
        "best_car_conf": vision.get("best_conf", 0.0),
        "images_count": len(req.images or []),
        "has_registration_doc": bool(req.registration_card_image),
    }

    # LLM judge (TinyLlama محلي)
    llm = {}
    try:
        llm = llm_judge(features)
    except Exception:
        llm = {}

    # Heuristic fallback
    real = 0.25
    if features["has_registration_doc"]:
        real += 0.15
    if features["doc_has_any_vin"]:
        real += 0.15
    if features["vin_found_in_doc"]:
        real += 0.25
    if features["car_detections"] > 0 and float(features["best_car_conf"]) >= 0.35:
        real += 0.20

    real = max(0.0, min(real, 0.95))
    fake = 1.0 - real

    # لو الـLLM رجع أرقام منطقية، نستخدمها
    if isinstance(llm, dict):
        rp = llm.get("real_probability")
        fp = llm.get("fake_probability")
        if isinstance(rp, (int, float)) and isinstance(fp, (int, float)) and rp >= 0 and fp >= 0:
            s = float(rp) + float(fp)
            if s > 0:
                real = float(rp) / s
                fake = float(fp) / s

    reason = ""
    if isinstance(llm, dict):
        reason = str(llm.get("reason") or "").strip()

    if not reason:
        reason = (
            f"vin_in_doc={features['vin_found_in_doc']}, "
            f"car_detections={features['car_detections']}, "
            f"best_conf={features['best_car_conf']}"
        )

    return {
        "car_id": req.car_id,
        "real_probability": round(real, 4),
        "fake_probability": round(fake, 4),
        "reason": reason,
        "features": features,
        "ocr": {"vins": ocr.get("vins", [])},
        "vision": vision,
    }
