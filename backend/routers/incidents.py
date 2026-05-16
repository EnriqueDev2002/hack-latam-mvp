from typing import Literal

from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter()


class Incident(BaseModel):
    id: str
    created_at: str
    risk_level: Literal["low", "medium", "high"]
    confidence: float
    matched_contact: str | None
    alerted: bool


class IncidentsResponse(BaseModel):
    incidents: list[Incident]


@router.get("/incidents", response_model=IncidentsResponse)
def list_incidents(
    limit: int = Query(20, ge=1, le=100),
    risk: Literal["low", "medium", "high"] | None = None,
):
    # TODO Persona A: leer de DB con filtros
    _ = (limit, risk)
    return IncidentsResponse(incidents=[])
