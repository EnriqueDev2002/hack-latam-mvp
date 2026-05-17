"""
Generate synthetic TTS audio via MiniMax API for detector calibration.

Usage (from backend/ directory):
  python scripts/gen_minimax.py --output tests/audio_samples/synthetic
  python scripts/gen_minimax.py --output tests/audio_samples/synthetic --voices 3

Requires MINIMAX_API_KEY in backend/.env
Optional: MINIMAX_GROUP_ID in backend/.env (needed for some account tiers)
"""
import argparse
import os
import sys
from pathlib import Path

# Allow running from backend/ or project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

import httpx

MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "").strip()

API_HOSTS = [
    "https://api-uw.minimax.io",
    "https://api.minimax.io",
]
MINIMAX_MODEL = "speech-2.8-hd"

# MiniMax built-in voices (en/es multilingual)
VOICES = [
    "Friendly_Person",
    "Calm_Woman",
    "Cute_Boy",
    "Warm_Woman",
]

# Spanish phrases similar to fraud call scenarios
TEXTS = [
    "Hola, soy tu familiar. Necesito que me ayudes urgentemente, por favor.",
    "Buenos días, te llamo del banco para confirmar una transacción sospechosa en tu cuenta.",
    "No le digas a nadie, pero necesito tu ayuda ahora mismo. Es muy urgente.",
]


def _call_api(host: str, text: str, voice_id: str) -> bytes:
    """Attempt a single TTS call to the given MiniMax host."""
    url = f"{host}/v1/t2a_v2"
    payload = {
        "model": MINIMAX_MODEL,
        "text": text,
        "voice_setting": {
            "voice_id": voice_id,
            "speed": 1.0,
            "vol": 1.0,
            "pitch": 0,
        },
        "audio_setting": {
            "sample_rate": 32000,
            "bitrate": 128000,
            "format": "mp3",
        },
    }
    headers = {
        "Authorization": f"Bearer {MINIMAX_API_KEY}",
        "Content-Type": "application/json",
    }

    resp = httpx.post(url, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()

    content_type = resp.headers.get("content-type", "")
    if content_type.startswith("audio/"):
        return resp.content

    data = resp.json()
    base_resp = data.get("base_resp", {})
    status_code = base_resp.get("status_code", 0)
    if status_code != 0:
        raise RuntimeError(
            f"{host}: status {status_code} - {base_resp.get('status_msg', 'unknown')}"
        )

    audio_hex = data.get("data", {}).get("audio", "")
    if not audio_hex:
        raise RuntimeError(f"{host}: respuesta inesperada {str(data)[:300]}")

    return bytes.fromhex(audio_hex)


def generate_audio(text: str, voice_id: str = "Friendly_Person") -> bytes:
    """Call MiniMax T2A v2 and return raw audio bytes (MP3). Tries both API hosts."""
    if not MINIMAX_API_KEY:
        raise RuntimeError(
            "MINIMAX_API_KEY no configurado en backend/.env"
        )

    last_err: Exception | None = None
    for host in API_HOSTS:
        try:
            return _call_api(host, text, voice_id)
        except Exception as exc:
            last_err = exc
            continue

    raise RuntimeError(f"Todos los hosts fallaron. Ultimo error: {last_err}")


def main() -> list[str]:
    parser = argparse.ArgumentParser(description="Genera audio TTS sintético via MiniMax")
    parser.add_argument(
        "--output",
        default="tests/audio_samples/synthetic",
        help="Directorio de salida para archivos MP3 generados",
    )
    parser.add_argument(
        "--voices",
        type=int,
        default=2,
        choices=range(1, len(VOICES) + 1),
        metavar=f"1-{len(VOICES)}",
        help="Cantidad de voces distintas a usar",
    )
    parser.add_argument(
        "--texts",
        type=int,
        default=2,
        choices=range(1, len(TEXTS) + 1),
        metavar=f"1-{len(TEXTS)}",
        help="Cantidad de frases por voz",
    )
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    voices = VOICES[: args.voices]
    texts = TEXTS[: args.texts]
    generated: list[str] = []

    print(f"Generando {len(voices) * len(texts)} muestras en {output_dir}/")
    print()

    for voice in voices:
        for i, text in enumerate(texts):
            out_path = output_dir / f"{voice}_{i + 1}.mp3"
            short_text = text[:50] + "..." if len(text) > 50 else text
            print(f"  [{voice}] texto {i + 1}: '{short_text}'  ->  ", end="", flush=True)
            try:
                audio_bytes = generate_audio(text, voice)
                out_path.write_bytes(audio_bytes)
                print(f"OK  ({len(audio_bytes):,} bytes)  {out_path.name}")
                generated.append(str(out_path))
            except Exception as exc:
                print(f"ERROR: {exc}")

    print()
    print(f"Total generados: {len(generated)} archivos")
    return generated


if __name__ == "__main__":
    main()
