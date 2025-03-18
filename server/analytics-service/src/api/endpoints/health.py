# src/api/endpoints/health.py
from fastapi import APIRouter
from datetime import datetime
import psutil

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Provides system health metrics including memory usage and CPU load
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "analytics-service",
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage_percent": psutil.disk_usage('/').percent
        }
    }