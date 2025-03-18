# src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Update imports to be relative
from api.endpoints import health, predictions
from core.config import settings

app = FastAPI(
    title="Healthcare Analytics ML Service",
    description="ML service for healthcare analytics and predictions",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(predictions.router, prefix="/predictions", tags=["predictions"])

# Test endpoint
@app.get("/test")
async def test_endpoint():
    return {"status": "ok", "service": "ml-service"}