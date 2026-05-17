"""
Pre-trained deepfake audio detector using a HuggingFace wav2vec2 model
fine-tuned on synthetic-vs-real speech classification.

The model is downloaded on first use (~360 MB) and cached locally by HF Hub.
Falls back gracefully if loading fails so the pipeline always returns a result.
"""
import logging
import os
from threading import Lock

import numpy as np

logger = logging.getLogger(__name__)

MODEL_ID = os.getenv("DEEPFAKE_MODEL_ID", "garystafford/wav2vec2-deepfake-voice-detector")
TARGET_SR = 16000
MIN_DURATION_S = 1.0
MAX_DURATION_S = 15.0

_pipelines: dict[str, object] = {}
_load_lock = Lock()
_failed_ids: set[str] = set()


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


def _run_pipe(pipe, samples: np.ndarray, sr: int, model_id: str) -> dict | None:
    duration = len(samples) / sr
    if duration < MIN_DURATION_S:
        return None
    if duration > MAX_DURATION_S:
        samples = samples[: int(MAX_DURATION_S * sr)]

    try:
        predictions = pipe({"array": samples.astype(np.float32), "sampling_rate": sr})
    except Exception as exc:
        logger.warning("Deepfake model inference failed (%s): %s", model_id, exc)
        return None

    fake_score = _fake_score_from_predictions(predictions)
    pretty = ", ".join(f"{p['label']}={p['score']:.3f}" for p in predictions)
    logger.info(
        "deepfake model=%s duration=%.2fs preds=[%s] fake_score=%.3f",
        model_id, duration, pretty, fake_score,
    )
    return {"is_synthetic": fake_score >= 0.5, "confidence": fake_score, "model": model_id}


def detect_deepfake(samples: np.ndarray, sr: int) -> dict | None:
    """Run the primary HF model. Returns None if unavailable."""
    pipe = _get_pipeline(MODEL_ID)
    if pipe is None:
        return None
    return _run_pipe(pipe, samples, sr, MODEL_ID)


def detect_deepfake_with(model_id: str, samples: np.ndarray, sr: int) -> dict | None:
    """Run a specific HF model by id (for lab side-by-side comparisons)."""
    pipe = _get_pipeline(model_id)
    if pipe is None:
        return None
    return _run_pipe(pipe, samples, sr, model_id)


def warmup() -> bool:
    """Trigger primary model load proactively. Returns True if ready."""
    return _get_pipeline(MODEL_ID) is not None
