import uuid
from typing import Literal

from fastapi import APIRouter, UploadFile, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

router = APIRouter()
ws_router = APIRouter()


class AnalyzeResponse(BaseModel):
    is_synthetic: bool
    confidence: float
    risk_level: Literal["low", "medium", "high"]
    speaker_match: bool | None
    matched_contact: str | None
    analysis_id: str


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(audio: UploadFile):
    # TODO Persona A: reemplazar mock con services.detection.run_pipeline()
    _ = await audio.read()
    return AnalyzeResponse(
        is_synthetic=False,
        confidence=0.12,
        risk_level="low",
        speaker_match=None,
        matched_contact=None,
        analysis_id=str(uuid.uuid4()),
    )


@ws_router.websocket("/ws/analyze")
async def ws_analyze(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            chunk = await websocket.receive_bytes()
            # TODO Persona A: acumular chunks y correr deteccion incremental
            _ = chunk
            await websocket.send_json(
                {
                    "type": "score",
                    "data": {
                        "is_synthetic": False,
                        "confidence": 0.1,
                        "risk_level": "low",
                        "speaker_match": None,
                        "matched_contact": None,
                        "analysis_id": str(uuid.uuid4()),
                    },
                }
            )
    except WebSocketDisconnect:
        return
