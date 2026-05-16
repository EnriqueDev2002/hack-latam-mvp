from io import BytesIO

import librosa
import numpy as np
import soundfile as sf


def load_audio(raw: bytes, target_sr: int = 16000) -> tuple[np.ndarray, int]:
    try:
        samples, sr = sf.read(BytesIO(raw))
        # soundfile returns (samples, sr); enforce mono float32 at target_sr
        if samples.ndim > 1:
            samples = samples.mean(axis=1)
        samples = samples.astype(np.float32)
        if sr != target_sr:
            samples = librosa.resample(samples, orig_sr=sr, target_sr=target_sr)
        return samples, target_sr
    except Exception:
        pass

    try:
        samples, _ = librosa.load(BytesIO(raw), sr=target_sr, mono=True)
        return samples.astype(np.float32), target_sr
    except Exception:
        pass

    raise ValueError("Could not decode audio: unsupported format or corrupt data")


def extract_features(samples: np.ndarray, sr: int) -> dict[str, float]:
    if len(samples) / sr < 0.5:
        raise ValueError("Audio too short: minimum 0.5 seconds required")

    features: dict[str, float] = {}

    mfccs = librosa.feature.mfcc(y=samples, sr=sr, n_mfcc=13)
    for i in range(13):
        features[f"mfcc_mean_{i}"] = float(np.nan_to_num(np.mean(mfccs[i])))
        features[f"mfcc_std_{i}"] = float(np.nan_to_num(np.std(mfccs[i])))

    flatness = librosa.feature.spectral_flatness(y=samples)
    features["spectral_flatness_mean"] = float(np.nan_to_num(np.mean(flatness)))

    centroid = librosa.feature.spectral_centroid(y=samples, sr=sr)
    # normalize by sr so the value is scale-independent
    features["spectral_centroid_std"] = float(np.nan_to_num(np.std(centroid) / sr))

    zcr = librosa.feature.zero_crossing_rate(y=samples)
    features["zcr_mean"] = float(np.nan_to_num(np.mean(zcr)))

    f0 = librosa.yin(samples, fmin=50, fmax=400, sr=sr)
    voiced = f0[f0 > 0]
    features["pitch_mean"] = float(np.nan_to_num(np.mean(voiced))) if len(voiced) > 0 else 0.0
    features["pitch_std"] = float(np.nan_to_num(np.std(voiced))) if len(voiced) > 0 else 0.0

    rms = librosa.feature.rms(y=samples)
    features["rms_std"] = float(np.nan_to_num(np.std(rms)))

    return features
