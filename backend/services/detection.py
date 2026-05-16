from typing import Literal

from pydantic import BaseModel


class DetectionResult(BaseModel):
    is_synthetic: bool
    confidence: float
    risk_level: Literal["low", "medium", "high"]


def run_pipeline(audio_bytes: bytes) -> DetectionResult:
    """Pipeline principal: audio -> features -> deteccion sintetico.

    TODO Persona A: orquestar audio_processing + clasificador.
    Calibrar umbrales con voces generadas en MiniMax.
    """
    _ = audio_bytes
    raise NotImplementedError


def risk_from_confidence(confidence: float) -> Literal["low", "medium", "high"]:
    if confidence >= 0.75:
        return "high"
    if confidence >= 0.45:
        return "medium"
    return "low"
