"""
CLI text-to-speech con MiniMax (T2A v2).

Uso (desde la raíz del repo):
    python tests/tts.py "hola, esto es una prueba"
    python tests/tts.py "buenos dias" --voice Calm_Woman
    python tests/tts.py "texto" --output mi_audio.mp3

Salida por defecto: tests/fixtures/synthetic/tts_<timestamp>.mp3

Requiere MINIMAX_API_KEY en backend/.env (o variable de entorno).
Doc: https://platform.minimax.io/docs/api-reference/speech-t2a-http
"""
import argparse
import os
import sys
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT_DIR = REPO_ROOT / "tests" / "fixtures" / "synthetic"

load_dotenv(REPO_ROOT / "backend" / ".env")

# Hosts oficiales (la doc lista ambos como válidos).
API_HOSTS = [
    "https://api-uw.minimax.io",
    "https://api.minimax.io",
]
MINIMAX_MODEL = "speech-2.8-hd"

VOICES = ["Friendly_Person", "Calm_Woman", "Cute_Boy", "Warm_Woman"]


def _call(host: str, api_key: str, text: str, voice_id: str) -> bytes:
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
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    resp = httpx.post(url, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()

    content_type = resp.headers.get("content-type", "")
    if content_type.startswith("audio/"):
        return resp.content

    data = resp.json()
    base_resp = data.get("base_resp", {})
    if base_resp.get("status_code", 0) != 0:
        raise RuntimeError(
            f"{host}: status {base_resp.get('status_code')} - "
            f"{base_resp.get('status_msg', 'unknown')}"
        )

    audio_hex = data.get("data", {}).get("audio", "")
    if not audio_hex:
        raise RuntimeError(f"{host}: respuesta inesperada {str(data)[:200]}")
    return bytes.fromhex(audio_hex)


def synthesize(text: str, voice_id: str) -> bytes:
    api_key = os.getenv("MINIMAX_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("MINIMAX_API_KEY no configurado en backend/.env")

    last_err: Exception | None = None
    for host in API_HOSTS:
        try:
            return _call(host, api_key, text, voice_id)
        except Exception as exc:
            last_err = exc
            continue
    raise RuntimeError(f"Todos los hosts fallaron. Último error: {last_err}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Genera un MP3 TTS via MiniMax",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Voces disponibles:\n  - "
            + "\n  - ".join(VOICES)
            + "\n\nEjemplos:\n"
            "  python tests/tts.py \"hola mundo\"\n"
            "  python tests/tts.py \"buenos dias\" --voice Calm_Woman\n"
            "  python tests/tts.py \"texto\" --output mi_audio.mp3\n"
        ),
    )
    parser.add_argument("text", help="Texto a sintetizar (entre comillas)")
    parser.add_argument(
        "--voice",
        default=VOICES[0],
        choices=VOICES,
        metavar="VOICE",
        help=f"Voz a usar (default: {VOICES[0]}).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Ruta del .mp3 de salida (default: tests/fixtures/synthetic/tts_<timestamp>.mp3)",
    )
    args = parser.parse_args()

    if args.output is None:
        DEFAULT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        out_path = DEFAULT_OUTPUT_DIR / f"tts_{int(time.time())}.mp3"
    else:
        out_path = args.output
        out_path.parent.mkdir(parents=True, exist_ok=True)

    short = args.text[:60] + ("..." if len(args.text) > 60 else "")
    print(f"[{args.voice}] '{short}'  ->  ", end="", flush=True)

    try:
        audio = synthesize(args.text, args.voice)
    except Exception as exc:
        print(f"ERROR: {exc}")
        return 1

    out_path.write_bytes(audio)
    print(f"OK ({len(audio):,} bytes)  {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
