import uuid

from fastapi import APIRouter, Depends, UploadFile, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlmodel import Session, select
from typing import Literal
import numpy as np

from db import get_session
from models.contact import Contact
from models.incident import Incident
from services.detection import run_pipeline
from services.speaker_verify import compute_embedding, match_against_contacts

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
async def analyze(audio: UploadFile, session: Session = Depends(get_session)):
    raw = await audio.read()

    detection = run_pipeline(raw)

    speaker_match: bool | None = None
    matched_contact_name: str | None = None

    contacts = session.exec(select(Contact)).all()
    if contacts:
        embedding = compute_embedding(raw)
        contact_embeddings = {
            c.id: np.frombuffer(c.embedding_blob, dtype=np.float32)
            for c in contacts
        }
        matched_id, _ = match_against_contacts(embedding, contact_embeddings)
        if matched_id is not None:
            matched = session.get(Contact, matched_id)
            speaker_match = True
            matched_contact_name = matched.name if matched else None
        else:
            speaker_match = False

    incident = Incident(
        id=str(uuid.uuid4()),
        risk_level=detection.risk_level,
        confidence=detection.confidence,
        matched_contact=matched_contact_name,
        alerted=False,
    )
    session.add(incident)
    session.commit()

    return AnalyzeResponse(
        is_synthetic=detection.is_synthetic,
        confidence=detection.confidence,
        risk_level=detection.risk_level,
        speaker_match=speaker_match,
        matched_contact=matched_contact_name,
        analysis_id=incident.id,
    )


@ws_router.websocket("/ws/analyze")
async def ws_analyze(websocket: WebSocket):
    await websocket.accept()
    buffer = b""
    try:
        while True:
            chunk = await websocket.receive_bytes()
            buffer += chunk
            # Run detection once we accumulate at least 2 seconds of audio (at ~16kHz webm ~= 8KB)
            if len(buffer) >= 8192:
                detection = run_pipeline(buffer)
                await websocket.send_json({
                    "type": "score",
                    "data": {
                        "is_synthetic": detection.is_synthetic,
                        "confidence": detection.confidence,
                        "risk_level": detection.risk_level,
                        "speaker_match": None,
                        "matched_contact": None,
                        "analysis_id": str(uuid.uuid4()),
                    },
                })
                buffer = b""
    except WebSocketDisconnect:
        return
