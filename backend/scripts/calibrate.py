"""
Calibration tool for VoiceGuard voice detection pipeline.

Analyzes audio files, prints feature breakdowns, computes per-indicator
contributions, compares real vs synthetic distributions, and suggests
threshold adjustments.

Usage (from backend/ directory):
  # Compare sets of real vs synthetic audio files
  python scripts/calibrate.py --real path/real.wav --synthetic path/tts.mp3

  # Multiple files on each side
  python scripts/calibrate.py \
      --real tests/audio_samples/real/*.wav \
      --synthetic tests/audio_samples/synthetic/*.mp3

  # First generate MiniMax samples, then calibrate
  python scripts/gen_minimax.py --voices 2 --texts 2
  python scripts/calibrate.py \
      --real tests/audio_samples/real/*.wav \
      --synthetic tests/audio_samples/synthetic/*.mp3

  # Analyze a single file (no comparison)
  python scripts/calibrate.py --real my_recording.wav
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from services.audio_processing import extract_features, load_audio
from services.detection import run_pipeline


# ─── Analysis helpers ────────────────────────────────────────────────────────

def analyze_file(path: str) -> dict:
    raw = Path(path).read_bytes()
    samples, sr = load_audio(raw)
    features = extract_features(samples, sr)
    result = run_pipeline(raw)
    return {"path": path, "features": features, "result": result}


def compute_indicators(f: dict) -> dict:
    """Replicate detection.py scoring to show per-indicator breakdown."""
    pitch_std = f["pitch_std"]
    sf_mean = f["spectral_flatness_mean"]
    mfcc_std_1 = f["mfcc_std_1"]
    zcr = f["zcr_mean"]

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

    total = ind_pitch * 0.35 + ind_flatness * 0.25 + ind_mfcc * 0.25 + ind_zcr * 0.15
    return {
        "pitch": ind_pitch,
        "flatness": ind_flatness,
        "mfcc": ind_mfcc,
        "zcr": ind_zcr,
        "total": total,
    }


# ─── Report printers ─────────────────────────────────────────────────────────

def print_file_report(data: dict, label: str) -> None:
    f = data["features"]
    r = data["result"]
    ind = compute_indicators(f)

    verdict = "SINTETICO [X]" if r.is_synthetic else "REAL [OK]"
    print(f"\n{'-' * 66}")
    print(f"  [{label.upper()}]  {Path(data['path']).name}")
    print(f"  -> {verdict}   confianza={r.confidence:.3f}   riesgo={r.risk_level.upper()}")
    print(f"{'-' * 66}")

    W = 22
    print(f"  {'Feature':<{W}} {'Valor':>9}  {'Indicador':>10}  {'Peso':>5}  {'Aporte':>7}")
    print(f"  {'-' * 58}")
    rows = [
        ("pitch_std",          f["pitch_std"],                ind["pitch"],   0.35),
        ("spectral_flatness",  f["spectral_flatness_mean"],   ind["flatness"],0.25),
        ("mfcc_std_1",         f["mfcc_std_1"],               ind["mfcc"],    0.25),
        ("zcr_mean",           f["zcr_mean"],                 ind["zcr"],     0.15),
    ]
    for name, val, indicator, weight in rows:
        print(
            f"  {name:<{W}} {val:>9.4f}  {indicator:>10.2f}  {weight:>5.2f}  "
            f"{indicator * weight:>7.3f}"
        )
    print(f"  {'-' * 58}")
    print(f"  {'TOTAL':<{W}} {'':>9}  {'':>10}  {'':>5}  {ind['total']:>7.3f}  "
          f"(umbral >=0.45 -> sintetico)")

    # Feature ranges for context
    print(f"\n  Rangos de referencia:")
    pitch_note = "bajo (monotono)" if f["pitch_std"] < 15 else "normal"
    sf_note = "normal" if 0.05 <= f["spectral_flatness_mean"] <= 0.35 else "fuera de rango"
    mfcc_note = "bajo (comprimido)" if f["mfcc_std_1"] < 12 else "normal"
    zcr_note = "normal" if 0.01 <= f["zcr_mean"] <= 0.25 else "fuera de rango"
    print(f"    pitch_std: natural 15-50 Hz    : {pitch_note}")
    print(f"    flatness:  natural 0.05-0.35   : {sf_note}")
    print(f"    mfcc_std1: natural >12          : {mfcc_note}")
    print(f"    zcr_mean:  natural 0.01-0.25   : {zcr_note}")


def print_calibration_summary(reals: list, synthetics: list) -> None:
    if not reals and not synthetics:
        return

    print(f"\n{'=' * 66}")
    print(f"  RESUMEN DE CALIBRACION")
    print(f"{'=' * 66}")

    if reals:
        real_scores = [d["result"].confidence for d in reals]
        real_avg = sum(real_scores) / len(real_scores)
        real_max = max(real_scores)
        real_min = min(real_scores)
        real_correct = sum(1 for d in reals if not d["result"].is_synthetic)
        print(f"  REALES      ({len(reals)} archivo{'s' if len(reals) > 1 else ''})")
        print(f"    scores:   min={real_min:.3f}  avg={real_avg:.3f}  max={real_max:.3f}")
        print(f"    correctos: {real_correct}/{len(reals)} clasificados como reales (score < 0.45)")
    else:
        real_max = None

    if synthetics:
        synth_scores = [d["result"].confidence for d in synthetics]
        synth_avg = sum(synth_scores) / len(synth_scores)
        synth_max = max(synth_scores)
        synth_min = min(synth_scores)
        synth_correct = sum(1 for d in synthetics if d["result"].is_synthetic)
        print(f"\n  SINTETICOS  ({len(synthetics)} archivo{'s' if len(synthetics) > 1 else ''})")
        print(f"    scores:   min={synth_min:.3f}  avg={synth_avg:.3f}  max={synth_max:.3f}")
        print(f"    detectados: {synth_correct}/{len(synthetics)} detectados como sinteticos")
    else:
        synth_min = None

    if real_max is not None and synth_min is not None:
        separation = synth_min - real_max
        print(f"\n  Separacion (synth_min - real_max): {separation:+.3f}")

        if separation > 0.15:
            optimal = real_max + separation / 2
            print(f"  [OK] Excelente separacion. Umbral optimo sugerido: {optimal:.2f}")
            print(f"       Sin cambios necesarios en detection.py (umbral actual=0.45)")
        elif separation > 0.05:
            optimal = real_max + separation / 2
            print(f"  [!]  Separacion estrecha. Umbral sugerido: {optimal:.2f}")
            if optimal < 0.45:
                print(f"       -> Bajar umbral en detection.py a {optimal:.2f}")
            elif optimal > 0.45:
                print(f"       -> Subir umbral en detection.py a {optimal:.2f}")
        elif separation > 0:
            print(f"  [!]  Separacion muy estrecha. Riesgo de falsos positivos/negativos.")
            _print_threshold_suggestions(reals, synthetics)
        else:
            print(f"  [X]  Superposicion en los scores (separation={separation:.3f})")
            print(f"       Los indicadores no distinguen bien real vs sintetico.")
            _print_threshold_suggestions(reals, synthetics)

    print()


def _print_threshold_suggestions(reals: list, synthetics: list) -> None:
    """Hint which indicator has the most discriminative power."""
    features_to_check = [
        ("pitch_std",         lambda f: f["pitch_std"]),
        ("mfcc_std_1",        lambda f: f["mfcc_std_1"]),
        ("spectral_flatness", lambda f: f["spectral_flatness_mean"]),
    ]
    print(f"\n  Valores promedio por clase para diagnosis:")
    diffs = []
    rows_data = []
    for name, getter in features_to_check:
        real_vals = [getter(d["features"]) for d in reals] if reals else []
        synth_vals = [getter(d["features"]) for d in synthetics] if synthetics else []
        real_avg = sum(real_vals) / len(real_vals) if real_vals else float("nan")
        synth_avg = sum(synth_vals) / len(synth_vals) if synth_vals else float("nan")
        diff = abs(synth_avg - real_avg) if real_vals and synth_vals else 0
        diffs.append(diff)
        rows_data.append((name, real_avg, synth_avg, diff))
    max_diff = max(diffs) if diffs else 0
    for name, real_avg, synth_avg, diff in rows_data:
        marker = "  <- mayor discriminacion" if diff == max_diff and max_diff > 0 else ""
        print(f"    {name:<22}: real={real_avg:6.3f}  synth={synth_avg:6.3f}  delta={diff:.3f}{marker}")
    print(f"  Sugerencia: revisar thresholds en detection.py por feature.")


# ─── Main ────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Calibración del detector de voces sintéticas de VoiceGuard",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--real",
        nargs="+",
        metavar="FILE",
        help="Archivo(s) de voz real (WAV, MP3, WebM…)",
    )
    parser.add_argument(
        "--synthetic",
        nargs="+",
        metavar="FILE",
        help="Archivo(s) de voz sintética/TTS (WAV, MP3…)",
    )
    args = parser.parse_args()

    if not args.real and not args.synthetic:
        parser.print_help()
        sys.exit(0)

    reals: list[dict] = []
    synthetics: list[dict] = []

    if args.real:
        print(f"\n{'#' * 66}")
        print(f"  ANALIZANDO ARCHIVOS REALES  ({len(args.real)} archivo(s))")
        print(f"{'#' * 66}")
        for path in args.real:
            try:
                data = analyze_file(path)
                print_file_report(data, "real")
                reals.append(data)
            except Exception as exc:
                print(f"\n  ERROR procesando {path}: {exc}")

    if args.synthetic:
        print(f"\n{'#' * 66}")
        print(f"  ANALIZANDO ARCHIVOS SINTETICOS  ({len(args.synthetic)} archivo(s))")
        print(f"{'#' * 66}")
        for path in args.synthetic:
            try:
                data = analyze_file(path)
                print_file_report(data, "sintetico")
                synthetics.append(data)
            except Exception as exc:
                print(f"\n  ERROR procesando {path}: {exc}")

    print_calibration_summary(reals, synthetics)


if __name__ == "__main__":
    main()
