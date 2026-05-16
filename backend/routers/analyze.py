import os
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlmodel import Session, select
from typing import Literal
import numpy as np

from db import engine, get_session
from models.contact import Contact
from models.incident import Incident
from services.detection import run_pipeline
from services.speaker_verify import compute_embedding, match_against_contacts

router = APIRouter()
ws_router = APIRouter()

CAPTURE_DIR = Path("data/captures")


def _save_capture(raw: bytes, kind: str) -> None:
    # Read env at call time so .env changes apply without restart
    if os.getenv("DEBUG_SAVE_AUDIO", "0") != "1":
        return
    try:
        CAPTURE_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
        (CAPTURE_DIR / f"{ts}_{kind}.webm").write_bytes(raw)
    except Exception:
        pass


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
    _save_capture(raw, "analyze")

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

    # Load contacts once when WS opens — they don't change mid-call.
    contact_names: dict[str, str] = {}
    contact_embeddings: dict[str, np.ndarray] = {}
    with Session(engine) as session:
        for c in session.exec(select(Contact)).all():
            contact_names[c.id] = c.name
            contact_embeddings[c.id] = np.frombuffer(c.embedding_blob, dtype=np.float32)

    # Keep the full WebM stream so the container header (EBML) stays valid
    # for every decode. Cap at ~30s of audio to avoid unbounded growth.
    buffer = b""
    next_threshold = 16384  # ~2s of WebM/Opus from MediaRecorder
    max_buffer = 500_000     # ~30s
    iteration = 0
    speaker_check_every = 3  # run speaker match every Nth score (~6s)
    last_speaker_match: bool | None = None
    last_matched_contact: str | None = None

    try:
        while True:
            chunk = await websocket.receive_bytes()
            buffer += chunk
            if len(buffer) >= next_threshold:
                detection = run_pipeline(buffer)
                iteration += 1

                # Speaker matching: skip if no contacts enrolled, or until we have
                # enough audio (>=4s ≈ 32KB of WebM) for a reliable embedding.
                if contact_embeddings and iteration % speaker_check_every == 0 and len(buffer) >= 32_000:
                    try:
                        emb = compute_embedding(buffer)
                        if emb.any():  # non-zero embedding = decode succeeded
                            matched_id, _ = match_against_contacts(emb, contact_embeddings)
                            if matched_id is not None:
                                last_speaker_match = True
                                last_matched_contact = contact_names.get(matched_id)
                            else:
                                last_speaker_match = False
                                last_matched_contact = None
                    except Exception:
                        pass  # keep previous match state on error

                await websocket.send_json({
                    "type": "score",
                    "data": {
                        "is_synthetic": detection.is_synthetic,
                        "confidence": detection.confidence,
                        "risk_level": detection.risk_level,
                        "speaker_match": last_speaker_match,
                        "matched_contact": last_matched_contact,
                        "analysis_id": str(uuid.uuid4()),
                    },
                })
                # Re-arm threshold for next ~2s of audio
                next_threshold = len(buffer) + 16384
                if len(buffer) > max_buffer:
                    # Drop oldest data but keep header (first 4KB usually covers EBML)
                    buffer = buffer[:4096] + buffer[-(max_buffer - 4096):]
                    next_threshold = len(buffer) + 16384
    except WebSocketDisconnect:
        return
