"""
Liveness challenge: generates a random phrase the caller must repeat.
Two strategies combined to make pre-recorded TTS attacks ineffective:
  1) Unpredictable filler phrases (random words/numbers) — defeats canned replies.
  2) Personal-knowledge prompts tied to enrolled contacts — only the real
     contact can answer, even if a clone's voice is perfect.
"""
import random
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


# Random phrases the caller must repeat verbatim. Each has unpredictable
# elements (numbers, unusual word pairs) that wouldn't show up in a pre-canned
# script a scammer might have prepared.
_FILLER_PHRASES = [
    "Diga los números: {n1} {n2} {n3}",
    "Repita la frase: el {color} {animal} corre en el jardín",
    "Diga: hoy es {dia} y el cielo está {clima}",
    "Repita: {fruta} con {fruta2} para el desayuno",
    "Pronuncie: la {objeto} azul cuesta {n1} pesos",
]

# Question prompts a scammer wouldn't know — caller MUST give a coherent
# personalised answer. The app doesn't verify the answer, but the elderly user
# does (they know their grandkid's school, pet name, etc.).
_PERSONAL_PROMPTS = [
    "Pregúntele: ¿en qué calle vivíamos cuando eras niño?",
    "Pregúntele: ¿cómo se llama nuestra mascota?",
    "Pregúntele: ¿qué cenamos en la última reunión familiar?",
    "Pregúntele: ¿quién es su padrino o madrina?",
    "Pregúntele: ¿cuál fue tu primer trabajo?",
    "Pregúntele: ¿cómo se llamaba su maestra de primaria favorita?",
    "Pregúntele: ¿cuál es el segundo nombre de su mamá?",
]

_NUMBERS = ["dos", "cinco", "siete", "nueve", "tres", "ocho", "uno", "cuatro", "seis"]
_COLORS = ["rojo", "verde", "azul", "amarillo", "naranja", "morado"]
_ANIMALS = ["perro", "gato", "caballo", "conejo", "pájaro", "tigre"]
_DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
_CLIMAS = ["soleado", "nublado", "lluvioso", "despejado"]
_FRUTAS = ["manzana", "plátano", "naranja", "pera", "uvas", "fresas", "sandía"]
_OBJETOS = ["silla", "mesa", "lámpara", "caja", "taza", "pelota"]


def _fill_template(template: str) -> str:
    return template.format(
        n1=random.choice(_NUMBERS),
        n2=random.choice(_NUMBERS),
        n3=random.choice(_NUMBERS),
        color=random.choice(_COLORS),
        animal=random.choice(_ANIMALS),
        dia=random.choice(_DIAS),
        clima=random.choice(_CLIMAS),
        fruta=random.choice(_FRUTAS),
        fruta2=random.choice(_FRUTAS),
        objeto=random.choice(_OBJETOS),
    )


class ChallengeResponse(BaseModel):
    id: str
    kind: str  # "filler" | "personal"
    prompt: str
    instructions: str
    expires_at: str


@router.get("/challenge", response_model=ChallengeResponse)
def get_challenge() -> ChallengeResponse:
    """
    Returns a fresh challenge prompt for the user to read aloud to the caller.
    Mixes filler-phrase and personal-knowledge prompts ~50/50.
    """
    use_personal = random.random() < 0.5
    if use_personal:
        prompt = random.choice(_PERSONAL_PROMPTS)
        instructions = (
            "Solo el familiar real conoce la respuesta. "
            "Si duda, tartamudea o responde algo genérico, podría ser una llamada falsa."
        )
        kind = "personal"
    else:
        prompt = _fill_template(random.choice(_FILLER_PHRASES))
        instructions = (
            "Una IA con voz clonada no puede responder esta frase improvisada. "
            "Pídale al llamador que la repita textualmente."
        )
        kind = "filler"

    return ChallengeResponse(
        id=str(uuid.uuid4()),
        kind=kind,
        prompt=prompt,
        instructions=instructions,
        expires_at=(datetime.now(timezone.utc) + timedelta(minutes=2)).isoformat(),
    )
