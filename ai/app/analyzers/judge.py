import json
import re
from pathlib import Path

try:
    from llama_cpp import Llama  # optional
except Exception:
    Llama = None

MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
_llm = None

def _safe_json_extract(text: str) -> dict:
    if not text:
        return {}
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if not m:
        return {}
    try:
        return json.loads(m.group(0))
    except Exception:
        return {}

def llm_judge(features: dict) -> dict:
    # لو llama-cpp-python مش متثبت → نرجع {} ونخلّي main.py يعتمد على heuristic
    if Llama is None:
        return {}

    global _llm
    if _llm is None:
        _llm = Llama(model_path=str(MODEL_PATH), n_ctx=2048, n_threads=8)

    prompt = f"""
You are a strict fraud-check assistant for car listings.
Return JSON only with keys: real_probability, fake_probability, reason.
Probabilities must sum to 1.

Features:
{json.dumps(features, ensure_ascii=False)}

JSON:
""".strip()

    out = _llm(prompt, max_tokens=256, stop=["\n\n"])
    txt = (out.get("choices", [{}])[0].get("text") or "").strip()
    js = _safe_json_extract(txt)
    return js if isinstance(js, dict) else {}
