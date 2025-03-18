# src/api/endpoints/metrics.py
from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
from src.models.schemas import HealthMetric, MetricsSummary
from src.services.analytics_service import AnalyticsService
from src.services.time_series_service import TimeSeriesService

router = APIRouter()
analytics_service = AnalyticsService()
time_series_service = TimeSeriesService()

@router.get("/summary", response_model=MetricsSummary)
async def get_metrics_summary(
    time_period: str = Query(..., description="Time period for summary (daily, weekly, monthly)"),
    department_id: Optional[str] = Query(None, description="Filter by department ID")
):
    """
    Get a summary of key metrics for the specified time period
    """
    try:
        return await analytics_service.get_metrics_summary(time_period, department_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/health-metrics", status_code=201)
async def record_health_metrics(metric: HealthMetric):
    """
    Record new health metrics for a patient
    """
    try:
        return await time_series_service.record_health_metrics(metric)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patient/{patient_id}/history")
async def get_patient_metrics(
    patient_id: str,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    metric_type: Optional[str] = Query(None)
):
    """
    Get historical health metrics for a specific patient
    """
    try:
        return await time_series_service.get_patient_metrics(
            patient_id, 
            start_date, 
            end_date, 
            metric_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/department/{department_id}/utilization")
async def get_department_utilization(
    department_id: str,
    period: str = Query(..., description="hourly, daily, or weekly"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """
    Get department utilization metrics over time
    """
    try:
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=30)
            
        return await analytics_service.get_department_utilization(
            department_id,
            period,
            start_date,
            end_date
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))