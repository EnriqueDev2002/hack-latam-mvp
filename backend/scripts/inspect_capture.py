"""Inspect a captured user audio: duration, model predictions, full breakdown."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
from services.audio_processing import load_audio
from services.deepfake_detector import MODEL_ID, _get_pipeline


def main():
    cap_dir = Path("data/captures")
    files = sorted(cap_dir.glob("*.webm"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not files:
        print("No captures in data/captures/")
        return
    target = files[0]
    raw = target.read_bytes()
    print(f"File:     {target.name}  ({len(raw):,} bytes)")

    samples, sr = load_audio(raw)
    duration = len(samples) / sr
    print(f"Duration: {duration:.2f}s @ {sr}Hz mono")
    print(f"Stats:    min={samples.min():.4f} max={samples.max():.4f} "
          f"mean={samples.mean():.4f} rms={np.sqrt((samples**2).mean()):.4f}")
    silent_ratio = float(np.mean(np.abs(samples) < 0.01))
    print(f"Silence:  {silent_ratio*100:.1f}% of samples below |0.01|")

    pipe = _get_pipeline()
    if pipe is None:
        print("Model not loaded")
        return
    print(f"\nModel:    {MODEL_ID}")
    print(f"Labels:   {pipe.model.config.id2label}")

    # Try on full audio
    preds_full = pipe({"array": samples.astype(np.float32), "sampling_rate": sr})
    print("\nFull audio predictions:")
    for p in preds_full:
        print(f"  {p['label']:<10} {p['score']:.4f}")

    # Try trimming silence (basic threshold)
    voiced = samples[np.abs(samples) > 0.02]
    if len(voiced) > sr:
        preds_trim = pipe({"array": voiced.astype(np.float32), "sampling_rate": sr})
        print(f"\nVoiced-only ({len(voiced)/sr:.2f}s) predictions:")
        for p in preds_trim:
            print(f"  {p['label']:<10} {p['score']:.4f}")

    # Try middle 5 seconds (skip beginning, often noisy)
    if duration > 6:
        mid_start = int(sr * 1.5)
        mid_end = mid_start + int(sr * 5)
        mid = samples[mid_start:mid_end]
        preds_mid = pipe({"array": mid.astype(np.float32), "sampling_rate": sr})
        print(f"\nMiddle 5s predictions (skip first 1.5s):")
        for p in preds_mid:
            print(f"  {p['label']:<10} {p['score']:.4f}")


if __name__ == "__main__":
    main()
