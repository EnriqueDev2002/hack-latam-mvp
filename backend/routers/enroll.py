import uuid

import numpy as np
from fastapi import APIRouter, Depends, Form, UploadFile
from pydantic import BaseModel
from sqlmodel import Session, select

from db import get_session
from models.contact import Contact
from services.speaker_verify import compute_embedding

router = APIRouter()


class EnrollResponse(BaseModel):
    contact_id: str
    embedding_quality: float


class ContactOut(BaseModel):
    id: str
    name: str
    enrolled_at: str


class ContactsResponse(BaseModel):
    contacts: list[ContactOut]


@router.post("/enroll", response_model=EnrollResponse)
async def enroll(
    audio: UploadFile,
    name: str = Form(...),
    session: Session = Depends(get_session),
):
    raw = await audio.read()
    embedding = compute_embedding(raw)

    # Resemblyzer returns L2-normalised embeddings (norm≈1.0 on success, 0.0 on failure)
    quality = round(min(1.0, float(np.linalg.norm(embedding))), 3)

    contact = Contact(
        id=str(uuid.uuid4()),
        name=name,
        embedding_blob=embedding.tobytes(),
    )
    session.add(contact)
    session.commit()

    return EnrollResponse(contact_id=contact.id, embedding_quality=quality)


@router.get("/contacts", response_model=ContactsResponse)
def list_contacts(session: Session = Depends(get_session)):
    rows = session.exec(select(Contact)).all()
    return ContactsResponse(
        contacts=[
            ContactOut(id=c.id, name=c.name, enrolled_at=c.enrolled_at.isoformat())
            for c in rows
        ]
    )
