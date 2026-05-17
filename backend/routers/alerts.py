from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from db import get_session
from models.contact import Contact
from models.incident import Incident
from services.notifications import send_alert

router = APIRouter()


class AlertRequest(BaseModel):
    incident_id: str
    contact_id: str


class AlertResponse(BaseModel):
    sent: bool
    channel: Literal["whatsapp", "sms"] | None


@router.post("/alert", response_model=AlertResponse)
async def trigger_alert(payload: AlertRequest, session: Session = Depends(get_session)):
    contact = session.get(Contact, payload.contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="contact not found")
    if not contact.phone:
        raise HTTPException(status_code=400, detail="contact has no phone configured")

    incident = session.get(Incident, payload.incident_id)
    risk = incident.risk_level if incident else "alta"
    matched = incident.matched_contact if incident and incident.matched_contact else None

    if matched:
        message = (
            f"⚠️ VoiceGuard detectó una posible suplantación de {matched} "
            f"en una llamada reciente (riesgo {risk}). Verifica con {matched} por otro medio antes de actuar."
        )
    else:
        message = (
            f"⚠️ VoiceGuard detectó una posible voz clonada en una llamada reciente "
            f"(riesgo {risk}). Verifica la identidad antes de actuar."
        )

    sent, channel = await send_alert(contact.phone, message)

    if sent and incident:
        incident.alerted = True
        session.add(incident)
        session.commit()

    return AlertResponse(sent=sent, channel=channel)
