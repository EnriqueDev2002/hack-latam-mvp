import logging
import os
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

from db import engine
from routers import alerts, analyze, challenge, enroll, incidents
from services.deepfake_detector import warmup as warmup_deepfake


@asynccontextmanager
async def lifespan(_: FastAPI):
    SQLModel.metadata.create_all(engine)
    warmup_deepfake()
    yield


app = FastAPI(title="VoiceGuard API", version="0.1.0", lifespan=lifespan)

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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
app.include_router(analyze.ws_router)
