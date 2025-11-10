"""Punto de entrada de la API de StudyForge."""

import os
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.documents import router as documents_router
from app.routers.health import router as health_router
from app.routers.summaries import router as summaries_router  # <= IMPORTANTE

load_dotenv()  # Permite usar backend/.env también aquí


def _allowed_origins() -> List[str]:
    env_value = os.getenv("ALLOWED_ORIGINS")
    if env_value:
        return [origin.strip() for origin in env_value.split(",") if origin.strip()]
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


app = FastAPI(title="StudyForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_methods=["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # cachea la respuesta al preflight (menos latencia)
)

# Rutas
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(documents_router)

# 👇 OJO: el router de summaries YA trae prefix="/summaries"
# Así que NO le pongas otro prefix aquí.
app.include_router(summaries_router)
