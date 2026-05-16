"""Inspect HF deepfake model labels and predictions on the test audio files."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from services.audio_processing import load_audio
from services.deepfake_detector import MODEL_ID, _get_pipeline


def main():
    pipe = _get_pipeline()
    if pipe is None:
        print("Pipeline failed to load")
        return
    print("Model id:", MODEL_ID)
    print("Model labels (id2label):", pipe.model.config.id2label)
    print()

    files = [
        "tests/audio_samples/synthetic/sine_tts_like.webm",
        "tests/audio_samples/real/natural_speech_sim.wav",
    ]
    for f in files:
        raw = Path(f).read_bytes()
        samples, sr = load_audio(raw)
        preds = pipe({"array": samples.astype("float32"), "sampling_rate": sr})
        print(f"\n{f}:")
        for p in preds:
            label = p["label"]
            score = p["score"]
            print(f"  label={label!r:<25} score={score:.4f}")


if __name__ == "__main__":
    main()
