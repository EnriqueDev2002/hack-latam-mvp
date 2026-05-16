from io import BytesIO

import numpy as np


def load_audio(raw: bytes, target_sr: int = 16000) -> tuple[np.ndarray, int]:
    """Decodifica bytes de audio a un array mono float32 a target_sr.

    TODO Persona A: implementar con librosa.load + soundfile fallback.
    """
    _ = (raw, target_sr, BytesIO)
    raise NotImplementedError


def extract_features(samples: np.ndarray, sr: int) -> dict[str, float]:
    """Extrae features acusticos para el clasificador.

    MFCC mean/std, spectral flatness, spectral centroid, pitch variance, etc.
    TODO Persona A: implementar.
    """
    _ = (samples, sr)
    raise NotImplementedError
