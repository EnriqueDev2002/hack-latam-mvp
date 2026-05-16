"""
Wrapper para generar muestras de voz sintética con MiniMax.

Uso (desde la raíz del repo):
    python tests/generate_voices.py                  # defaults: 2 voces x 2 frases
    python tests/generate_voices.py --voices 3       # 3 voces distintas
    python tests/generate_voices.py --voices 4 --texts 3

Delega en backend/scripts/gen_minimax.py. Las muestras (.mp3) se escriben
en tests/fixtures/synthetic/ y están ignoradas por git (ver .gitignore).

Requiere MINIMAX_API_KEY en backend/.env.
"""
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = REPO_ROOT / "backend"
GEN_SCRIPT = BACKEND_DIR / "scripts" / "gen_minimax.py"
OUTPUT_DIR = REPO_ROOT / "tests" / "fixtures" / "synthetic"


def main() -> int:
    if not GEN_SCRIPT.exists():
        print(f"ERROR: no encuentro {GEN_SCRIPT}", file=sys.stderr)
        return 1

    env_file = BACKEND_DIR / ".env"
    if not env_file.exists():
        print(
            f"ADVERTENCIA: {env_file} no existe. "
            "El script fallará si MINIMAX_API_KEY no está en el entorno.",
            file=sys.stderr,
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    user_args = sys.argv[1:]
    has_output = any(a == "--output" or a.startswith("--output=") for a in user_args)

    cmd = [sys.executable, str(GEN_SCRIPT)]
    if not has_output:
        cmd += ["--output", str(OUTPUT_DIR)]
    cmd += user_args

    print(f"→ {' '.join(cmd)}")
    return subprocess.call(cmd, cwd=str(BACKEND_DIR))


if __name__ == "__main__":
    sys.exit(main())
