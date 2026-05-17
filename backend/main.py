import logging
import os
import re
from contextlib import asynccontextmanager

from dotenv import load_dotenv

# Must load .env BEFORE importing routers/services so module-level os.getenv reads work
load_dotenv()

# Surface app-level loggers (services.*) through uvicorn's stderr stream
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from db import engine, run_migrations
from routers import alerts, analyze, challenge, enroll, incidents, lab
from services.deepfake_detector import warmup as warmup_deepfake


@asynccontextmanager
async def lifespan(_: FastAPI):
    SQLModel.metadata.create_all(engine)
    run_migrations()
    warmup_deepfake()
    yield


app = FastAPI(title="VoiceGuard API", version="0.1.2", lifespan=lifespan)

_cors_items = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
_cors_exact = [o for o in _cors_items if "*" not in o]
_cors_wildcards = [o for o in _cors_items if "*" in o]
_cors_regex = None
if _cors_wildcards:
    _patterns = [re.escape(o).replace(r"\*", r".*") for o in _cors_wildcards]
    _cors_regex = "^(" + "|".join(_patterns) + ")$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_exact,
    allow_origin_regex=_cors_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(analyze.router, prefix="/api", tags=["analyze"])
app.include_router(enroll.router, prefix="/api", tags=["enroll"])
app.include_router(incidents.router, prefix="/api", tags=["incidents"])
app.include_router(alerts.router, prefix="/api", tags=["alerts"])
app.include_router(challenge.router, prefix="/api", tags=["challenge"])
app.include_router(lab.router, prefix="/api", tags=["lab"])
app.include_router(analyze.ws_router)
app.include_router(lab.ws_router)
