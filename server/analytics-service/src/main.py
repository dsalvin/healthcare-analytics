# src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app
from api.endpoints import health, metrics, trends, reports
from core.config import database

app = FastAPI(
    title="Healthcare Analytics Service",
    description="Advanced analytics and time-series processing for healthcare data",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(health.router, tags=["health"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(trends.router, prefix="/api/trends", tags=["trends"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()