import uuid
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from db import get_session
from models.incident import Incident as IncidentModel

router = APIRouter()


class IncidentOut(BaseModel):
    id: str
    created_at: str
    risk_level: Literal["low", "medium", "high"]
    confidence: float
    matched_contact: str | None
    alerted: bool


class IncidentsResponse(BaseModel):
    incidents: list[IncidentOut]


def _to_out(i: IncidentModel) -> IncidentOut:
    return IncidentOut(
        id=i.id,
        created_at=i.created_at.isoformat(),
        risk_level=i.risk_level,  # type: ignore[arg-type]
        confidence=i.confidence,
        matched_contact=i.matched_contact,
        alerted=i.alerted,
    )


def save_incident(
    session: Session,
    *,
    risk_level: str,
    confidence: float,
    matched_contact: str | None = None,
) -> IncidentModel:
    incident = IncidentModel(
        id=str(uuid.uuid4()),
        created_at=datetime.now(timezone.utc),
        risk_level=risk_level,
        confidence=confidence,
        matched_contact=matched_contact,
        alerted=False,
    )
    session.add(incident)
    session.commit()
    session.refresh(incident)
    return incident


def mark_alerted(session: Session, incident_id: str) -> None:
    incident = session.get(IncidentModel, incident_id)
    if incident:
        incident.alerted = True
        session.add(incident)
        session.commit()


@router.get("/incidents", response_model=IncidentsResponse)
def list_incidents(
    limit: int = Query(20, ge=1, le=100),
    risk: Literal["low", "medium", "high"] | None = None,
    session: Session = Depends(get_session),
):
    stmt = select(IncidentModel).order_by(IncidentModel.created_at.desc()).limit(limit)  # type: ignore[arg-type]
    if risk:
        stmt = stmt.where(IncidentModel.risk_level == risk)
    rows = session.exec(stmt).all()
    return IncidentsResponse(incidents=[_to_out(r) for r in rows])
