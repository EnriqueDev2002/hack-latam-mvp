"""
Pre-trained deepfake audio detector using a HuggingFace wav2vec2 model
fine-tuned on synthetic-vs-real speech classification.

Two modes:
- Local pipeline (default): downloads model on first use, runs on CPU.
- HF Inference API (HF_USE_INFERENCE_API=1 + HF_TOKEN): sends WAV bytes to
  HuggingFace's hosted inference endpoint. No local memory used; needed for
  Railway/small-RAM deploys where Stafford's ~1.2GB footprint OOMs.
"""
import io
import logging
import os
from threading import Lock

import numpy as np

logger = logging.getLogger(__name__)

MODEL_ID = os.getenv("DEEPFAKE_MODEL_ID", "garystafford/wav2vec2-deepfake-voice-detector")
HF_USE_INFERENCE_API = os.getenv("HF_USE_INFERENCE_API", "0") == "1"
HF_TOKEN = os.getenv("HF_TOKEN", "").strip()
TARGET_SR = 16000
MIN_DURATION_S = 1.0
MAX_DURATION_S = 15.0

_pipelines: dict[str, object] = {}
_load_lock = Lock()
_failed_ids: set[str] = set()

HF_INFERENCE_BASE = "https://api-inference.huggingface.co/models"


def _get_pipeline(model_id: str = MODEL_ID):
    if model_id in _pipelines:
        return _pipelines[model_id]
    if model_id in _failed_ids:
        return None

    with _load_lock:
        if model_id in _pipelines:
            return _pipelines[model_id]
        if model_id in _failed_ids:
            return None
        try:
            from transformers import pipeline  # heavy import deferred
            logger.info("Loading deepfake detector: %s", model_id)
            pipe = pipeline(
                task="audio-classification",
                model=model_id,
                device=-1,  # CPU
            )
            _pipelines[model_id] = pipe
            logger.info("Deepfake detector loaded: %s", model_id)
            return pipe
        except Exception as exc:
            logger.warning("Could not load deepfake model %s: %s", model_id, exc)
            _failed_ids.add(model_id)
            return None


def _samples_to_wav_bytes(samples: np.ndarray, sr: int) -> bytes:
    import soundfile as sf  # ships with librosa
    buf = io.BytesIO()
    sf.write(buf, samples.astype(np.float32), sr, format="WAV", subtype="PCM_16")
    return buf.getvalue()


def _predict_via_api(model_id: str, samples: np.ndarray, sr: int) -> list[dict] | None:
    """POST WAV bytes directly to HF's hosted inference endpoint."""
    if not HF_TOKEN:
        logger.warning("HF_USE_INFERENCE_API=1 but HF_TOKEN not set")
        return None
    import httpx  # already a project dep
    wav_bytes = _samples_to_wav_bytes(samples, sr)
    url = f"{HF_INFERENCE_BASE}/{model_id}"
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "audio/wav",
        "Accept": "application/json",
    }
    try:
        resp = httpx.post(url, content=wav_bytes, headers=headers, timeout=30)
    except Exception as exc:
        logger.warning("HF Inference API request error (%s): %r", model_id, exc)
        return None

    if resp.status_code == 503:
        # Cold start: model is loading, retry-after gives ETA
        logger.warning("HF Inference API cold start (%s): %s", model_id, resp.text[:200])
        return None
    if resp.status_code >= 400:
        logger.warning(
            "HF Inference API failed (%s) http=%s body=%s",
            model_id, resp.status_code, resp.text[:300],
        )
        return None

    try:
        data = resp.json()
    except Exception as exc:
        logger.warning("HF Inference API bad json (%s): %r", model_id, exc)
        return None

    if isinstance(data, dict) and "error" in data:
        logger.warning("HF Inference API error (%s): %s", model_id, data.get("error"))
        return None
    if not isinstance(data, list):
        logger.warning("HF Inference API unexpected shape (%s): %s", model_id, str(data)[:200])
        return None
    return data


def _fake_score_from_predictions(predictions: list[dict]) -> float:
    """Normalise the model output into a 'probability of synthetic' score."""
    fake_labels = {"fake", "spoof", "spoofed", "synthetic", "deepfake", "ai", "generated"}
    real_labels = {"real", "bonafide", "human", "genuine", "original"}

    for p in predictions:
        if p["label"].lower() in fake_labels:
            return float(p["score"])
    for p in predictions:
        if p["label"].lower() in real_labels:
            return float(1.0 - p["score"])
    # Unknown label scheme — assume highest score is the positive class
    top = max(predictions, key=lambda p: p["score"])
    return float(top["score"]) if "fake" in top["label"].lower() else float(1.0 - top["score"])


def _predict(model_id: str, samples: np.ndarray, sr: int) -> tuple[list[dict] | None, float]:
    """Dispatch between HF Inference API and local pipeline. Returns (preds, duration)."""
    duration = len(samples) / sr
    if duration < MIN_DURATION_S:
        return None, duration
    if duration > MAX_DURATION_S:
        samples = samples[: int(MAX_DURATION_S * sr)]
        duration = MAX_DURATION_S

    if HF_USE_INFERENCE_API:
        return _predict_via_api(model_id, samples, sr), duration

    pipe = _get_pipeline(model_id)
    if pipe is None:
        return None, duration
    try:
        preds = pipe({"array": samples.astype(np.float32), "sampling_rate": sr})
        return preds, duration
    except Exception as exc:
        logger.warning("Deepfake model inference failed (%s): %s", model_id, exc)
        return None, duration


def _run(model_id: str, samples: np.ndarray, sr: int) -> dict | None:
    predictions, duration = _predict(model_id, samples, sr)
    if predictions is None:
        return None

    fake_score = _fake_score_from_predictions(predictions)
    pretty = ", ".join(f"{p['label']}={p['score']:.3f}" for p in predictions)
    mode = "api" if HF_USE_INFERENCE_API else "local"
    logger.info(
        "deepfake mode=%s model=%s duration=%.2fs preds=[%s] fake_score=%.3f",
        mode, model_id, duration, pretty, fake_score,
    )
    return {"is_synthetic": fake_score >= 0.5, "confidence": fake_score, "model": model_id}


def detect_deepfake(samples: np.ndarray, sr: int) -> dict | None:
    """Run the primary HF model. Returns None if unavailable."""
    return _run(MODEL_ID, samples, sr)


def detect_deepfake_with(model_id: str, samples: np.ndarray, sr: int) -> dict | None:
    """Run a specific HF model by id (for lab side-by-side comparisons)."""
    return _run(model_id, samples, sr)


def warmup() -> bool:
    """Pre-warm the configured backend. Returns True if ready."""
    if HF_USE_INFERENCE_API:
        if not HF_TOKEN:
            logger.warning("HF_USE_INFERENCE_API=1 but HF_TOKEN not set")
            return False
        logger.info("Deepfake detector configured in remote mode (model=%s)", MODEL_ID)
        return True
    return _get_pipeline(MODEL_ID) is not None
