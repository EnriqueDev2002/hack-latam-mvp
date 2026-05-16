from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class AlertRequest(BaseModel):
    incident_id: str
    contact_phone: str


class AlertResponse(BaseModel):
    sent: bool
    channel: Literal["whatsapp", "sms"]


@router.post("/alert", response_model=AlertResponse)
def send_alert(payload: AlertRequest):
    # TODO Persona A: llamar a services.notifications.send_via_zavu()
    _ = payload
    return AlertResponse(sent=True, channel="whatsapp")
