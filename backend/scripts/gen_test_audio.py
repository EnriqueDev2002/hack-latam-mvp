"""
Genera audio sintético de prueba SIN API externa, para verificar que
el pipeline de calibración funciona antes de tener la MiniMax API key.

Produce dos archivos:
  tests/audio_samples/synthetic/sine_tts_like.wav  → tono monótono (simula TTS básico)
  tests/audio_samples/real/natural_speech_sim.wav  → ruido con variación (simula voz real)

Uso:
  cd backend
  python scripts/gen_test_audio.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
import soundfile as sf

SR = 16000
DURATION = 3.0  # seconds


def make_monotone_tts(sr: int = SR, duration: float = DURATION) -> np.ndarray:
    """Sinusoidal with constant pitch — mimics basic TTS monotony."""
    t = np.linspace(0, duration, int(sr * duration))
    # Fixed pitch at 120 Hz, low pitch_std, low spectral complexity
    signal = 0.4 * np.sin(2 * np.pi * 120 * t)
    # Add harmonics but no pitch variation
    signal += 0.15 * np.sin(2 * np.pi * 240 * t)
    signal += 0.08 * np.sin(2 * np.pi * 360 * t)
    # Very small random noise to avoid perfectly flat spectrum
    signal += 0.005 * np.random.randn(len(t))
    return signal.astype(np.float32)


def make_natural_speech_sim(sr: int = SR, duration: float = DURATION) -> np.ndarray:
    """
    Noise-modulated signal with pitch variation to mimic natural speech.
    pitch_std will be higher, mfcc_std_1 will be higher.
    """
    rng = np.random.default_rng(42)
    t = np.linspace(0, duration, int(sr * duration))

    # Varying pitch (80–200 Hz) across utterance
    pitch_hz = np.interp(
        t,
        [0, 0.3, 0.7, 1.2, 1.8, 2.5, 3.0],
        [130, 160, 120, 180, 110, 155, 140],
    )
    signal = 0.3 * np.sin(2 * np.pi * np.cumsum(pitch_hz / sr))
    # Formant-like modulation
    signal += 0.2 * np.sin(2 * np.pi * 800 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 4 * t))
    signal += 0.1 * np.sin(2 * np.pi * 1800 * t) * (0.3 + 0.7 * rng.random(len(t)))
    # Amplitude envelope (speech-like silences)
    envelope = np.clip(np.sin(2 * np.pi * 2.5 * t) + 0.6, 0, 1)
    signal *= envelope
    # Breath noise
    signal += 0.03 * rng.standard_normal(len(t))
    return signal.astype(np.float32)


def main():
    out_synth = Path("tests/audio_samples/synthetic/sine_tts_like.wav")
    out_real = Path("tests/audio_samples/real/natural_speech_sim.wav")

    out_synth.parent.mkdir(parents=True, exist_ok=True)
    out_real.parent.mkdir(parents=True, exist_ok=True)

    sf.write(str(out_synth), make_monotone_tts(), SR)
    print(f"Generado (sintético): {out_synth}")

    sf.write(str(out_real), make_natural_speech_sim(), SR)
    print(f"Generado (real sim): {out_real}")

    print("\nEjecuta ahora:")
    print(f"  python scripts/calibrate.py --real {out_real} --synthetic {out_synth}")


if __name__ == "__main__":
    main()
