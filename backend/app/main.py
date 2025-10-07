# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.health import router as health_router
from app.routers.documents import router as documents_router

app = FastAPI(title="StudyForge API")

# CORS para desarrollo (Vite en 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Ya no creamos tablas al iniciar; Alembic maneja las migraciones
# (el user `studyforge_app` solo ejecuta CRUD)

# Rutas principales
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(documents_router, prefix="/documents", tags=["documents"])
