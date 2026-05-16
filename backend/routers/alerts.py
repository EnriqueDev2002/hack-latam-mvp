from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session

from db import get_session
from models.incident import Incident
from services.notifications import send_via_zavu

router = APIRouter()


class AlertRequest(BaseModel):
    incident_id: str
    contact_phone: str


class AlertResponse(BaseModel):
    sent: bool
    channel: Literal["whatsapp", "sms"]


@router.post("/alert", response_model=AlertResponse)
async def send_alert(payload: AlertRequest, session: Session = Depends(get_session)):
    message = "⚠️ VoiceGuard: Se detectó una voz posiblemente clonada en una llamada reciente. Verifica con tu familiar."

    sent = await send_via_zavu(payload.contact_phone, message)

    if sent:
        incident = session.get(Incident, payload.incident_id)
        if incident:
            incident.alerted = True
            session.add(incident)
            session.commit()

    return AlertResponse(sent=sent, channel="whatsapp")
