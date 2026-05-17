import os

from sqlmodel import Session, create_engine

RAW_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/voiceguard.db")

# Supabase entrega connection strings con esquema `postgres://`, pero SQLAlchemy
# 2.x exige `postgresql://`. Normalizamos para evitar errores en deploy.
if RAW_DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = RAW_DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    DATABASE_URL = RAW_DATABASE_URL

is_sqlite = DATABASE_URL.startswith("sqlite")
is_postgres = DATABASE_URL.startswith("postgresql")

connect_args: dict = {}
if is_sqlite:
    connect_args["check_same_thread"] = False
elif is_postgres and "sslmode=" not in DATABASE_URL:
    # Supabase requiere SSL; lo forzamos si no viene en la URL.
    connect_args["sslmode"] = "require"

engine_kwargs: dict = {"echo": False, "connect_args": connect_args}
if is_postgres:
    # pool_pre_ping evita errores por conexiones cerradas por Supabase tras idle.
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(DATABASE_URL, **engine_kwargs)


def get_session():
    with Session(engine) as session:
        yield session
