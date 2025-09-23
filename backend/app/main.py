from fastapi import FastAPI
from app.routers.health import router as health_router
from app.routers.documents import router as documents_router

app = FastAPI()

app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(documents_router, prefix="/documents", tags=["documents"])
