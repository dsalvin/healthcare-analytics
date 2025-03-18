# src/core/config.py
from pydantic import BaseModel
from typing import List
import os

class Settings(BaseModel):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Healthcare Analytics ML Service"
    
    # Security
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-for-development")
    ALGORITHM: str = "HS256"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Model paths
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./models")
    
    # Service URLs
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://auth-service:4001")

    class Config:
        case_sensitive = True

settings = Settings()