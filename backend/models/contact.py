from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Contact(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    embedding_blob: bytes
    enrolled_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
