import uuid

from fastapi import APIRouter, Form, UploadFile
from pydantic import BaseModel

router = APIRouter()


class EnrollResponse(BaseModel):
    contact_id: str
    embedding_quality: float


class Contact(BaseModel):
    id: str
    name: str
    enrolled_at: str


class ContactsResponse(BaseModel):
    contacts: list[Contact]


@router.post("/enroll", response_model=EnrollResponse)
async def enroll(audio: UploadFile, name: str = Form(...)):
    # TODO Persona A: extraer embedding con resemblyzer y persistir
    _ = await audio.read()
    _ = name
    return EnrollResponse(contact_id=str(uuid.uuid4()), embedding_quality=0.85)


@router.get("/contacts", response_model=ContactsResponse)
def list_contacts():
    # TODO Persona A: leer de DB
    return ContactsResponse(contacts=[])
