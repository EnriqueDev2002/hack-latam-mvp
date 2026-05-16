import subprocess
from io import BytesIO

import imageio_ffmpeg
import librosa
import numpy as np
import soundfile as sf

_FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def _ffmpeg_decode(raw: bytes, target_sr: int) -> tuple[np.ndarray, int]:
    """Pipe arbitrary audio through ffmpeg, get back mono float32 PCM."""
    proc = subprocess.run(
        [
            _FFMPEG, "-nostdin", "-hide_banner", "-loglevel", "error",
            "-i", "pipe:0",
            "-f", "f32le", "-ac", "1", "-ar", str(target_sr),
            "pipe:1",
        ],
        input=raw,
        capture_output=True,
        check=True,
    )
    samples = np.frombuffer(proc.stdout, dtype=np.float32).copy()
    return samples, target_sr


def load_audio(raw: bytes, target_sr: int = 16000) -> tuple[np.ndarray, int]:
    # Fast path for WAV/FLAC/OGG/AIFF (no subprocess)
    try:
        samples, sr = sf.read(BytesIO(raw))
        if samples.ndim > 1:
            samples = samples.mean(axis=1)
        samples = samples.astype(np.float32)
        if sr != target_sr:
            samples = librosa.resample(samples, orig_sr=sr, target_sr=target_sr)
        return samples, target_sr
    except Exception:
        pass

    # WebM/Opus/MP3/M4A via bundled ffmpeg (browser MediaRecorder output)
    try:
        return _ffmpeg_decode(raw, target_sr)
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
