import numpy as np


def compute_embedding(audio_bytes: bytes) -> np.ndarray:
    """Genera embedding de voz con resemblyzer.

    TODO Persona A: implementar.
    """
    _ = audio_bytes
    raise NotImplementedError


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
