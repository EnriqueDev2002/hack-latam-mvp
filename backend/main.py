import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from db import engine
from routers import alerts, analyze, enroll, incidents

load_dotenv()


@asynccontextmanager
async def lifespan(_: FastAPI):
    SQLModel.metadata.create_all(engine)
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
app.include_router(analyze.ws_router)
