# tests/

Carpeta para fixtures y utilidades de prueba que no son del dominio puro de backend ni frontend.

## generate_voices.py — muestras sintéticas con MiniMax

Wrapper que invoca `backend/scripts/gen_minimax.py` y guarda los `.mp3` en `tests/fixtures/synthetic/`.

### Setup

Asegúrate de tener `MINIMAX_API_KEY` (y opcionalmente `MINIMAX_GROUP_ID`) en `backend/.env`:

```
MINIMAX_API_KEY=tu_key_aqui
MINIMAX_GROUP_ID=opcional
```

Y las dependencias del backend instaladas:

```
cd backend
pip install -r requirements.txt
```

### Uso

Desde la raíz del repo:

```
python tests/generate_voices.py                 # 2 voces x 2 frases (default)
python tests/generate_voices.py --voices 4      # las 4 voces, 2 frases
python tests/generate_voices.py --voices 3 --texts 3
```

Los argumentos `--voices` y `--texts` se pasan al script de backend; ver `backend/scripts/gen_minimax.py` para detalles.

### Salida

`tests/fixtures/synthetic/<voice_id>_<n>.mp3`

Los `.mp3` están gitignored — son artefactos locales para alimentar `backend/tests/test_detection.py` o calibración manual.
