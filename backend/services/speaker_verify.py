import io
import logging
import numpy as np
import librosa
from resemblyzer import VoiceEncoder, preprocess_wav

_encoder: VoiceEncoder | None = None


def _get_encoder() -> VoiceEncoder:
    global _encoder
    if _encoder is None:
        _encoder = VoiceEncoder(device="cpu")
    return _encoder


def compute_embedding(audio_bytes: bytes) -> np.ndarray:
    samples, _ = librosa.load(io.BytesIO(audio_bytes), sr=16000, mono=True)
    wav = preprocess_wav(samples, source_sr=16000)
    try:
        embedding = _get_encoder().embed_utterance(wav)
    except Exception as exc:  # noqa: BLE001
        # embed_utterance fails on clips shorter than ~1 second
        logging.warning("compute_embedding failed (audio likely too short): %s", exc)
        return np.zeros(256, dtype=np.float32)
    return embedding


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0.0:
        return 0.0
    return float(np.dot(a, b) / denom)


def match_against_contacts(
    embedding: np.ndarray, contact_embeddings: dict[str, np.ndarray], threshold: float = 0.75
) -> tuple[str | None, float]:
    """Devuelve el contact_id con mayor similitud si supera el umbral."""
    best_id: str | None = None
    best_score = 0.0
    for contact_id, ref in contact_embeddings.items():
        score = cosine_similarity(embedding, ref)
        if score > best_score:
            best_score = score
            best_id = contact_id
    if best_score >= threshold:
        return best_id, best_score
    return None, best_score
