from datetime import datetime
from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/api/v1", tags=["Health & Status"])

@router.get("/health")
async def health_check():
    """
    GET /api/v1/health
    Returns service health status and configured environment information.
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "model": settings.OPENROUTER_MODEL,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
