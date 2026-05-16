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

MODEL_ID = os.getenv("DEEPFAKE_MODEL_ID", "MelodyMachine/Deepfake-audio-detection")
TARGET_SR = 16000
MIN_DURATION_S = 1.0
MAX_DURATION_S = 15.0

_pipeline = None
_load_lock = Lock()
_load_failed = False


def _get_pipeline():
    global _pipeline, _load_failed
    if _pipeline is not None or _load_failed:
        return _pipeline

    with _load_lock:
        if _pipeline is not None or _load_failed:
            return _pipeline
        try:
            from transformers import pipeline  # heavy import deferred
            logger.info("Loading deepfake detector: %s", MODEL_ID)
            _pipeline = pipeline(
                task="audio-classification",
                model=MODEL_ID,
                device=-1,  # CPU
            )
            logger.info("Deepfake detector loaded")
        except Exception as exc:
            logger.warning("Could not load deepfake model %s: %s", MODEL_ID, exc)
            _load_failed = True
            _pipeline = None
    return _pipeline


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


def detect_deepfake(samples: np.ndarray, sr: int) -> dict | None:
    """
    Run the HF model on a mono float32 sample array. Returns
    {is_synthetic, confidence, model: MODEL_ID} or None if the model isn't
    available (caller should fall back to heuristic pipeline).
    """
    pipe = _get_pipeline()
    if pipe is None:
        return None

    duration = len(samples) / sr
    if duration < MIN_DURATION_S:
        return None
    if duration > MAX_DURATION_S:
        samples = samples[: int(MAX_DURATION_S * sr)]

    try:
        predictions = pipe({"array": samples.astype(np.float32), "sampling_rate": sr})
    except Exception as exc:
        logger.warning("Deepfake model inference failed: %s", exc)
        return None

    fake_score = _fake_score_from_predictions(predictions)
    pretty = ", ".join(f"{p['label']}={p['score']:.3f}" for p in predictions)
    logger.info(
        "deepfake duration=%.2fs preds=[%s] fake_score=%.3f",
        duration, pretty, fake_score,
    )
    return {
        "is_synthetic": fake_score >= 0.5,
        "confidence": fake_score,
        "model": MODEL_ID,
    }


def warmup() -> bool:
    """Trigger model load proactively. Returns True if model is ready."""
    return _get_pipeline() is not None
