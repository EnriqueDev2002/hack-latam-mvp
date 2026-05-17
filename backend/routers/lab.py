"""Hidden lab endpoint: same pipeline as /api/analyze but exposes raw scores
and (optionally) a side-by-side comparison with a secondary HF model.

Enable comparison by setting COMPARE_DEEPFAKE_MODEL_ID in backend/.env.
"""
import os
import uuid
from typing import Any, Literal

import numpy as np
from fastapi import APIRouter, Depends, UploadFile, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlmodel import Session, select

from db import engine, get_session
from models.contact import Contact
from services.detection import run_pipeline_debug
from services.speaker_verify import (
    compute_embedding,
    cosine_similarity,
    match_against_contacts,
)

router = APIRouter()
ws_router = APIRouter()

SPEAKER_MATCH_THRESHOLD = 0.80


class LabAnalyzeResponse(BaseModel):
    is_synthetic: bool
    confidence: float
    risk_level: Literal["low", "medium", "high"]
    speaker_match: bool | None
    speaker_match_score: float | None
    speaker_match_threshold: float
    matched_contact: str | None
    analysis_id: str
    debug: dict[str, Any]


def _compare_model_id() -> str | None:
    val = os.getenv("COMPARE_DEEPFAKE_MODEL_ID", "").strip()
    return val or None


@router.post("/lab/analyze", response_model=LabAnalyzeResponse)
async def lab_analyze(audio: UploadFile, session: Session = Depends(get_session)):
    raw = await audio.read()
    detection, debug = run_pipeline_debug(raw, compare_model_id=_compare_model_id())

    speaker_match: bool | None = None
    speaker_match_score: float | None = None
    matched_contact_name: str | None = None

    contacts = session.exec(select(Contact)).all()
    if contacts:
        embedding = compute_embedding(raw)
        contact_embeddings = {
            c.id: np.frombuffer(c.embedding_blob, dtype=np.float32) for c in contacts
        }
        matched_id, best = match_against_contacts(
            embedding, contact_embeddings, threshold=SPEAKER_MATCH_THRESHOLD
        )
        speaker_match_score = round(float(best), 4) if best else 0.0
        speaker_match = matched_id is not None
        if matched_id is not None:
            matched = session.get(Contact, matched_id)
            matched_contact_name = matched.name if matched else None

    return LabAnalyzeResponse(
        is_synthetic=detection.is_synthetic,
        confidence=detection.confidence,
        risk_level=detection.risk_level,
        speaker_match=speaker_match,
        speaker_match_score=speaker_match_score,
        speaker_match_threshold=SPEAKER_MATCH_THRESHOLD,
        matched_contact=matched_contact_name,
        analysis_id=str(uuid.uuid4()),
        debug=debug,
    )


@ws_router.websocket("/ws/lab/analyze")
async def ws_lab_analyze(websocket: WebSocket):
    await websocket.accept()

    contact_names: dict[str, str] = {}
    contact_embeddings: dict[str, np.ndarray] = {}
    with Session(engine) as session:
        for c in session.exec(select(Contact)).all():
            contact_names[c.id] = c.name
            contact_embeddings[c.id] = np.frombuffer(c.embedding_blob, dtype=np.float32)

    buffer = b""
    next_threshold = 16384
    max_buffer = 500_000
    iteration = 0
    speaker_check_every = 3
    last_speaker_match: bool | None = None
    last_speaker_match_score: float | None = None
    last_matched_contact: str | None = None

    try:
        while True:
            chunk = await websocket.receive_bytes()
            buffer += chunk
            if len(buffer) >= next_threshold:
                detection, debug = run_pipeline_debug(buffer, compare_model_id=_compare_model_id())
                iteration += 1

                if contact_embeddings and iteration % speaker_check_every == 0 and len(buffer) >= 32_000:
                    try:
                        emb = compute_embedding(buffer)
                        if emb.any():
                            best_id = None
                            best_score = 0.0
                            for cid, ref in contact_embeddings.items():
                                s = cosine_similarity(emb, ref)
                                if s > best_score:
                                    best_score = s
                                    best_id = cid
                            last_speaker_match_score = round(float(best_score), 4)
                            if best_score >= SPEAKER_MATCH_THRESHOLD:
                                last_speaker_match = True
                                last_matched_contact = contact_names.get(best_id) if best_id else None
                            else:
                                last_speaker_match = False
                                last_matched_contact = None
                    except Exception:
                        pass

                await websocket.send_json({
                    "type": "score",
                    "data": {
                        "is_synthetic": detection.is_synthetic,
                        "confidence": detection.confidence,
                        "risk_level": detection.risk_level,
                        "speaker_match": last_speaker_match,
                        "speaker_match_score": last_speaker_match_score,
                        "speaker_match_threshold": SPEAKER_MATCH_THRESHOLD,
                        "matched_contact": last_matched_contact,
                        "analysis_id": str(uuid.uuid4()),
                        "debug": debug,
                    },
                })
                next_threshold = len(buffer) + 16384
                if len(buffer) > max_buffer:
                    buffer = buffer[:4096] + buffer[-(max_buffer - 4096):]
                    next_threshold = len(buffer) + 16384
    except WebSocketDisconnect:
        return
