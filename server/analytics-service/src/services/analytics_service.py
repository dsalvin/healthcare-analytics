# src/services/analytics_service.py
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import pandas as pd
import numpy as np
from sqlalchemy import text
from src.models.schemas import MetricsSummary
from src.core.config import get_db

class AnalyticsService:
    async def get_metrics_summary(self, time_period: str, department_id: Optional[str] = None) -> MetricsSummary:
        """
        Generate a summary of key metrics for the specified time period
        """
        async with get_db() as db:
            # Calculate time window
            end_date = datetime.now()
            if time_period == 'daily':
                start_date = end_date - timedelta(days=1)
            elif time_period == 'weekly':
                start_date = end_date - timedelta(weeks=1)
            elif time_period == 'monthly':
                start_date = end_date - timedelta(days=30)
            else:
                raise ValueError(f"Invalid time period: {time_period}")

            # Build query
            query = """
                WITH patient_metrics AS (
                    SELECT 
                        COUNT(DISTINCT patient_id) as total_patients,
                        AVG(risk_score) as avg_risk,
                        COUNT(CASE WHEN risk_score > 75 THEN 1 END) as high_risk
                    FROM patient_analytics
                    WHERE updated_at BETWEEN :start_date AND :end_date
                ),
                dept_metrics AS (
                    SELECT AVG(utilization_rate) as avg_utilization
                    FROM department_metrics
                    WHERE timestamp BETWEEN :start_date AND :end_date
                    {dept_filter}
                ),
                conditions AS (
                    SELECT diagnosis_code, COUNT(*) as count
                    FROM treatment_outcomes
                    WHERE created_at BETWEEN :start_date AND :end_date
                    GROUP BY diagnosis_code
                    ORDER BY count DESC
                    LIMIT 5
                )
                SELECT 
                    pm.total_patients,
                    pm.avg_risk,
                    pm.high_risk,
                    dm.avg_utilization,
                    array_agg(c.diagnosis_code) as top_conditions
                FROM patient_metrics pm
                CROSS JOIN dept_metrics dm
                CROSS JOIN conditions c
                GROUP BY pm.total_patients, pm.avg_risk, pm.high_risk, dm.avg_utilization
            """

            dept_filter = "AND department_id = :dept_id" if department_id else ""
            query = query.format(dept_filter=dept_filter)

            params = {
                "start_date": start_date,
                "end_date": end_date,
                "dept_id": department_id
            }

            result = await db.fetch_one(query, params)

            return MetricsSummary(
                time_period=time_period,
                total_patients=result['total_patients'],
                avg_risk_score=float(result['avg_risk']),
                high_risk_count=result['high_risk'],
                department_utilization=float(result['avg_utilization']),
                top_conditions=result['top_conditions']
            )

    async def get_department_utilization(
        self,
        department_id: str,
        period: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """
        Get department utilization metrics aggregated by the specified period
        """
        async with get_db() as db:
            interval = {
                'hourly': '1 hour',
                'daily': '1 day',
                'weekly': '1 week'
            }.get(period)

            if not interval:
                raise ValueError(f"Invalid period: {period}")

            query = """
                SELECT 
                    time_bucket(:interval, timestamp) as period,
                    AVG(patient_count) as avg_patients,
                    AVG(utilization_rate) as avg_utilization,
                    MAX(patient_count) as peak_patients,
                    AVG(EXTRACT(epoch FROM avg_wait_time))/60 as avg_wait_minutes
                FROM department_metrics
                WHERE 
                    department_id = :dept_id
                    AND timestamp BETWEEN :start_date AND :end_date
                GROUP BY time_bucket(:interval, timestamp)
                ORDER BY period
            """

            params = {
                "interval": interval,
                "dept_id": department_id,
                "start_date": start_date,
                "end_date": end_date
            }

            results = await db.fetch_all(query, params)
            
            return [
                {
                    "period": row['period'].isoformat(),
                    "average_patients": float(row['avg_patients']),
                    "utilization_rate": float(row['avg_utilization']),
                    "peak_patients": int(row['peak_patients']),
                    "average_wait_time": float(row['avg_wait_minutes'])
                }
                for row in results
            ]