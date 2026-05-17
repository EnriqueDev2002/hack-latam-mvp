import uuid

import numpy as np
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
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
    phone: str | None
    enrolled_at: str


class ContactsResponse(BaseModel):
    contacts: list[ContactOut]


@router.post("/enroll", response_model=EnrollResponse)
async def enroll(
    audio: UploadFile,
    name: str = Form(...),
    phone: str | None = Form(None),
    session: Session = Depends(get_session),
):
    raw = await audio.read()
    embedding = compute_embedding(raw)

    # Resemblyzer returns L2-normalised embeddings (norm≈1.0 on success, 0.0 on failure)
    quality = round(min(1.0, float(np.linalg.norm(embedding))), 3)

    contact = Contact(
        id=str(uuid.uuid4()),
        name=name,
        phone=phone.strip() if phone else None,
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
            ContactOut(
                id=c.id,
                name=c.name,
                phone=c.phone,
                enrolled_at=c.enrolled_at.isoformat(),
            )
            for c in rows
        ]
    )


class ContactUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None


@router.patch("/contacts/{contact_id}", response_model=ContactOut)
def update_contact(
    contact_id: str,
    payload: ContactUpdate,
    session: Session = Depends(get_session),
):
    contact = session.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="contact not found")
    if payload.name is not None:
        name = payload.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="name cannot be empty")
        contact.name = name
    if payload.phone is not None:
        contact.phone = payload.phone.strip() or None
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return ContactOut(
        id=contact.id,
        name=contact.name,
        phone=contact.phone,
        enrolled_at=contact.enrolled_at.isoformat(),
    )


@router.delete("/contacts/{contact_id}", status_code=204)
def delete_contact(contact_id: str, session: Session = Depends(get_session)):
    contact = session.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="contact not found")
    session.delete(contact)
    session.commit()
    return None
