from pathlib import Path
from ultralytics import YOLO
from ..utils import fetch_bytes, open_image_from_bytes

# وزن YOLO (اختياري تحطه يدويًا داخل ai/models)
WEIGHTS = Path(__file__).resolve().parents[2] / "models" / "yolov8n.pt"

_model = None

def get_model():
    global _model
    if _model is None:
        if WEIGHTS.exists():
            _model = YOLO(str(WEIGHTS))
        else:
            # ultralytics غالبًا هينزل yolov8n.pt تلقائي أول مرة (لو في نت)
            _model = YOLO("yolov8n.pt")
    return _model

def analyze_images(image_urls: list[str]) -> dict:
    if not image_urls:
        return {"car_detections": 0, "best_conf": 0.0}

    model = get_model()
    car_like = {"car", "truck", "bus", "motorcycle"}  # توسعة بسيطة

    total = 0
    best = 0.0

    for url in image_urls[:6]:  # حد أقصى 6 صور لتخفيف الضغط
        try:
            img_bytes = fetch_bytes(url)
            img = open_image_from_bytes(img_bytes)

            results = model.predict(img, verbose=False)
            r0 = results[0]
            names = r0.names  # dict: class_id -> name

            for box in r0.boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                name = names.get(cls_id, "")

                if name in car_like:
                    total += 1
                    best = max(best, conf)
        except Exception:
            continue

    return {"car_detections": total, "best_conf": round(best, 4)}
