import os

from sqlmodel import Session, create_engine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/voiceguard.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def get_session():
    with Session(engine) as session:
        yield session


def run_migrations() -> None:
    """Idempotent ALTERs for SQLite + Postgres. SQLModel.create_all does not ALTER."""
    with engine.connect() as conn:
        if DATABASE_URL.startswith("sqlite"):
            cols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(contact)")}
            if "phone" not in cols:
                conn.exec_driver_sql("ALTER TABLE contact ADD COLUMN phone TEXT")
                conn.commit()
        else:
            # Postgres / others: ADD COLUMN IF NOT EXISTS is idempotent.
            conn.exec_driver_sql("ALTER TABLE contact ADD COLUMN IF NOT EXISTS phone TEXT")
            conn.commit()
