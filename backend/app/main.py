# app/main.py
"""
Aplicación principal de FastAPI - StudyForge.
Sistema de apoyo al aprendizaje con IA.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, summaries, quizzes, quiz_attempts, stats

app = FastAPI(
    title="StudyForge API",
    description="API para sistema de apoyo al aprendizaje con IA",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
async def health_check():
    """Endpoint de salud del sistema."""
    return {
        "status": "ok",
        "service": "StudyForge API",
        "version": "2.0.0"
    }


# Incluir routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(summaries.router, prefix="/summaries", tags=["summaries"])
app.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
app.include_router(quiz_attempts.router, prefix="/quiz-attempts", tags=["quiz-attempts"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
