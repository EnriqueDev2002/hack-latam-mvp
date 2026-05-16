from typing import Literal

from pydantic import BaseModel

from .audio_processing import extract_features, load_audio


class DetectionResult(BaseModel):
    is_synthetic: bool
    confidence: float
    risk_level: Literal["low", "medium", "high"]


def run_pipeline(audio_bytes: bytes) -> DetectionResult:
    try:
        samples, sr = load_audio(audio_bytes)
        features = extract_features(samples, sr)
    except Exception:
        return DetectionResult(is_synthetic=False, confidence=0.1, risk_level="low")

    pitch_std = features["pitch_std"]

    # Indicator 1: pitch stability (weight 0.35)
    # Low pitch_std → monotone → synthetic; zero → no voiced frames → inconclusive
    if pitch_std == 0.0:
        ind_pitch = 0.5
    elif pitch_std < 10:
        ind_pitch = 0.8
    elif pitch_std < 20:
        ind_pitch = 0.4
    else:
        ind_pitch = 0.0

    # Indicator 2: spectral flatness (weight 0.25)
    # Natural speech sits in 0.05–0.35; extremes suggest TTS artifacts
    sf_mean = features["spectral_flatness_mean"]
    if sf_mean < 0.03 or sf_mean > 0.55:
        ind_flatness = 0.7
    elif sf_mean < 0.05 or sf_mean > 0.40:
        ind_flatness = 0.3
    else:
        ind_flatness = 0.0

    # Indicator 3: MFCC variance (weight 0.25)
    # Low std on MFCC[1] → compressed dynamic range → synthetic
    mfcc_std_1 = features["mfcc_std_1"]
    if mfcc_std_1 < 8:
        ind_mfcc = 0.8
    elif mfcc_std_1 < 15:
        ind_mfcc = 0.3
    else:
        ind_mfcc = 0.0

    # Indicator 4: zero-crossing rate (weight 0.15)
    # Values outside 0.01–0.25 are atypical for natural speech
    zcr = features["zcr_mean"]
    if zcr < 0.01 or zcr > 0.25:
        ind_zcr = 0.6
    else:
        ind_zcr = 0.0

    synthetic_score = (
        ind_pitch * 0.35
        + ind_flatness * 0.25
        + ind_mfcc * 0.25
        + ind_zcr * 0.15
    )

    is_synthetic = synthetic_score >= 0.45
    risk_level = risk_from_confidence(synthetic_score)
    return DetectionResult(
        is_synthetic=is_synthetic,
        confidence=round(synthetic_score, 4),
        risk_level=risk_level,
    )


def risk_from_confidence(confidence: float) -> Literal["low", "medium", "high"]:
    if confidence >= 0.75:
        return "high"
    if confidence >= 0.45:
        return "medium"
    return "low"
