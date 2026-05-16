"""Compare HF model vs heuristic detector on the latest captured audio."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from services.audio_processing import extract_features, load_audio
from services.deepfake_detector import detect_deepfake


def heuristic_score(features: dict) -> tuple[float, dict]:
    pitch_std = features["pitch_std"]
    sf_mean = features["spectral_flatness_mean"]
    mfcc_std_1 = features["mfcc_std_1"]
    zcr = features["zcr_mean"]

    if pitch_std == 0.0:
        ind_pitch = 0.5
    elif pitch_std < 10:
        ind_pitch = 0.8
    elif pitch_std < 20:
        ind_pitch = 0.4
    else:
        ind_pitch = 0.0

    if sf_mean < 0.03 or sf_mean > 0.55:
        ind_flatness = 0.7
    elif sf_mean < 0.05 or sf_mean > 0.40:
        ind_flatness = 0.3
    else:
        ind_flatness = 0.0

    ind_mfcc = 0.8 if mfcc_std_1 < 8 else (0.3 if mfcc_std_1 < 15 else 0.0)
    ind_zcr = 0.6 if (zcr < 0.01 or zcr > 0.25) else 0.0

    total = ind_pitch*0.35 + ind_flatness*0.25 + ind_mfcc*0.25 + ind_zcr*0.15
    return total, {
        "pitch_std": pitch_std, "ind_pitch": ind_pitch,
        "sf_mean": sf_mean, "ind_flatness": ind_flatness,
        "mfcc_std_1": mfcc_std_1, "ind_mfcc": ind_mfcc,
        "zcr": zcr, "ind_zcr": ind_zcr,
    }


def main():
    cap_dir = Path("data/captures")
    files = sorted(cap_dir.glob("*.webm"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not files:
        print("No captures")
        return
    target = files[0]
    raw = target.read_bytes()
    samples, sr = load_audio(raw)
    print(f"File: {target.name}  duration={len(samples)/sr:.2f}s\n")

    # Heuristics
    feats = extract_features(samples, sr)
    h_score, breakdown = heuristic_score(feats)
    print(f"HEURISTIC score: {h_score:.3f}  (>=0.45 -> synthetic)")
    for k, v in breakdown.items():
        print(f"  {k}: {v:.4f}")

    # HF
    print()
    hf = detect_deepfake(samples, sr)
    if hf:
        print(f"HF MODEL score:  {hf['confidence']:.4f}  is_synthetic={hf['is_synthetic']}")
    else:
        print("HF MODEL: unavailable")

    print()
    print("=" * 50)
    if hf:
        h_real = h_score < 0.45
        hf_fake = hf["confidence"] >= 0.5
        if h_real and hf_fake:
            print("DISAGREEMENT: heuristics say REAL, HF says FAKE")
            print("  -> likely HF false positive on mic recording")
        elif not h_real and hf_fake:
            print("AGREEMENT: both say synthetic")
        elif h_real and not hf_fake:
            print("AGREEMENT: both say real")
        else:
            print("DISAGREEMENT: heuristics say fake, HF says real")


if __name__ == "__main__":
    main()
