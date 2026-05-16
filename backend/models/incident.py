from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Incident(SQLModel, table=True):
    id: str = Field(primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    risk_level: str
    confidence: float
    matched_contact: str | None = None
    alerted: bool = False
