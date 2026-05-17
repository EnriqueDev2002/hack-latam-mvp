import logging
from typing import Any, Literal

from pydantic import BaseModel

from .audio_processing import extract_features, load_audio
from .deepfake_detector import MODEL_ID as HF_MODEL_ID, detect_deepfake, detect_deepfake_with

logger = logging.getLogger(__name__)


class DetectionResult(BaseModel):
    is_synthetic: bool
    confidence: float
    risk_level: Literal["low", "medium", "high"]


def _heuristic_score(features: dict) -> float:
    """4-indicator rule-based score (legacy detector)."""
    pitch_std = features["pitch_std"]
    if pitch_std == 0.0:
        ind_pitch = 0.5
    elif pitch_std < 10:
        ind_pitch = 0.8
    elif pitch_std < 20:
        ind_pitch = 0.4
    else:
        ind_pitch = 0.0

    sf_mean = features["spectral_flatness_mean"]
    if sf_mean < 0.03 or sf_mean > 0.55:
        ind_flatness = 0.7
    elif sf_mean < 0.05 or sf_mean > 0.40:
        ind_flatness = 0.3
    else:
        ind_flatness = 0.0

    mfcc_std_1 = features["mfcc_std_1"]
    ind_mfcc = 0.8 if mfcc_std_1 < 8 else (0.3 if mfcc_std_1 < 15 else 0.0)

    zcr = features["zcr_mean"]
    ind_zcr = 0.6 if (zcr < 0.01 or zcr > 0.25) else 0.0

    return ind_pitch * 0.35 + ind_flatness * 0.25 + ind_mfcc * 0.25 + ind_zcr * 0.15


def _ensemble(hf_score: float, features: dict) -> tuple[float, str]:
    """
    HF model is the primary signal; heuristics only nudge when both agree.
    Returns (final_score, reason).
    """
    h_score = _heuristic_score(features)

    if h_score >= 0.45 and hf_score >= 0.5:
        final = max(h_score, hf_score)
        return final, f"both_synthetic (h={h_score:.2f}, hf={hf_score:.2f})"

    if h_score < 0.25 and hf_score < 0.3:
        final = (h_score + hf_score) / 2
        return final, f"both_real (h={h_score:.2f}, hf={hf_score:.2f})"

    return hf_score, f"hf_primary (h={h_score:.2f}, hf={hf_score:.2f})"


def run_pipeline(audio_bytes: bytes) -> DetectionResult:
    try:
        samples, sr = load_audio(audio_bytes)
    except Exception:
        return DetectionResult(is_synthetic=False, confidence=0.1, risk_level="low")

    try:
        features = extract_features(samples, sr)
    except Exception:
        features = None

    hf_result = detect_deepfake(samples, sr)

    # If HF unavailable, fall back to heuristic-only
    if hf_result is None:
        if features is None:
            return DetectionResult(is_synthetic=False, confidence=0.1, risk_level="low")
        score = _heuristic_score(features)
        logger.info("detector=heuristic-only score=%.3f", score)
        return DetectionResult(
            is_synthetic=score >= 0.45,
            confidence=round(score, 4),
            risk_level=risk_from_confidence(score),
        )

    # If feature extraction failed, trust HF model alone
    if features is None:
        s = hf_result["confidence"]
        return DetectionResult(
            is_synthetic=hf_result["is_synthetic"],
            confidence=round(s, 4),
            risk_level=risk_from_confidence(s),
        )

    # Both signals available → ensemble
    score, reason = _ensemble(hf_result["confidence"], features)
    score = round(score, 4)
    logger.info("detector=ensemble score=%.3f reason=%s", score, reason)
    return DetectionResult(
        is_synthetic=score >= 0.5,
        confidence=score,
        risk_level=risk_from_confidence(score),
    )


def risk_from_confidence(confidence: float) -> Literal["low", "medium", "high"]:
    if confidence >= 0.75:
        return "high"
    if confidence >= 0.45:
        return "medium"
    return "low"


SYNTHETIC_THRESHOLD = 0.5


def run_pipeline_debug(
    audio_bytes: bytes,
    compare_model_id: str | None = None,
) -> tuple[DetectionResult, dict[str, Any]]:
    """Like run_pipeline but also returns a debug dict for the lab page."""
    debug: dict[str, Any] = {
        "hf_model_id": HF_MODEL_ID,
        "hf_fake_score": None,
        "heuristic_score": None,
        "ensemble_reason": "",
        "features": None,
        "duration_s": None,
        "synthetic_threshold": SYNTHETIC_THRESHOLD,
        "secondary": None,
    }

    try:
        samples, sr = load_audio(audio_bytes)
        debug["duration_s"] = round(len(samples) / sr, 2)
    except Exception:
        return DetectionResult(is_synthetic=False, confidence=0.1, risk_level="low"), debug

    try:
        features = extract_features(samples, sr)
        debug["features"] = features
    except Exception:
        features = None

    if features is not None:
        debug["heuristic_score"] = round(_heuristic_score(features), 4)

    hf_result = detect_deepfake(samples, sr)
    if hf_result is not None:
        debug["hf_fake_score"] = round(hf_result["confidence"], 4)

    if compare_model_id:
        try:
            sec = detect_deepfake_with(compare_model_id, samples, sr)
            if sec is not None:
                debug["secondary"] = {
                    "model_id": compare_model_id,
                    "fake_score": round(sec["confidence"], 4),
                    "is_synthetic": sec["is_synthetic"],
                }
        except Exception as exc:
            debug["secondary"] = {"model_id": compare_model_id, "error": str(exc)}

    if hf_result is None:
        if features is None:
            return DetectionResult(is_synthetic=False, confidence=0.1, risk_level="low"), debug
        score = _heuristic_score(features)
        debug["ensemble_reason"] = "heuristic-only"
        return (
            DetectionResult(
                is_synthetic=score >= 0.45,
                confidence=round(score, 4),
                risk_level=risk_from_confidence(score),
            ),
            debug,
        )

    if features is None:
        s = hf_result["confidence"]
        debug["ensemble_reason"] = "hf-only (no features)"
        return (
            DetectionResult(
                is_synthetic=hf_result["is_synthetic"],
                confidence=round(s, 4),
                risk_level=risk_from_confidence(s),
            ),
            debug,
        )

    score, reason = _ensemble(hf_result["confidence"], features)
    score = round(score, 4)
    debug["ensemble_reason"] = reason
    logger.info("detector=ensemble score=%.3f reason=%s", score, reason)
    return (
        DetectionResult(
            is_synthetic=score >= SYNTHETIC_THRESHOLD,
            confidence=score,
            risk_level=risk_from_confidence(score),
        ),
        debug,
    )
