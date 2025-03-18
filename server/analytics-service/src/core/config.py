# src/core/config.py
from pydantic import BaseModel
import os
from databases import Database
from contextlib import asynccontextmanager

class Settings(BaseModel):
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_USER: str = os.getenv("DB_USER", "user")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "password")
    DB_NAME: str = os.getenv("DB_NAME", "healthcare_analytics")
    
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://localhost:4001")

    @property
    def database_url(self):
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

settings = Settings()

# Database connection pool
database = Database(settings.database_url)

@asynccontextmanager
async def get_db():
    try:
        await database.connect()
        yield database
    finally:
        await database.disconnect()