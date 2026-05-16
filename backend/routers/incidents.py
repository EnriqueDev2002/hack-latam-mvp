import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, func, select

from db import get_session
from models.contact import Contact
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


class StatsResponse(BaseModel):
    total_analyses: int
    fraud_detected: int  # high + medium risk
    high_risk: int
    medium_risk: int
    low_risk: int
    contacts_protected: int
    alerts_sent: int
    last_7_days_analyses: int


@router.get("/stats", response_model=StatsResponse)
def stats(session: Session = Depends(get_session)):
    def count_where(*conditions) -> int:
        stmt = select(func.count()).select_from(IncidentModel)
        for c in conditions:
            stmt = stmt.where(c)
        return int(session.exec(stmt).one())

    total = count_where()
    high = count_where(IncidentModel.risk_level == "high")
    medium = count_where(IncidentModel.risk_level == "medium")
    low = count_where(IncidentModel.risk_level == "low")
    alerts = count_where(IncidentModel.alerted == True)  # noqa: E712
    contacts = int(session.exec(select(func.count()).select_from(Contact)).one())

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    last_7 = count_where(IncidentModel.created_at >= week_ago)

    return StatsResponse(
        total_analyses=total,
        fraud_detected=high + medium,
        high_risk=high,
        medium_risk=medium,
        low_risk=low,
        contacts_protected=contacts,
        alerts_sent=alerts,
        last_7_days_analyses=last_7,
    )
