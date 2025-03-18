# src/services/time_series_service.py
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from src.models.schemas import HealthMetric
from src.core.config import get_db

class TimeSeriesService:
    async def record_health_metrics(self, metric: HealthMetric) -> Dict[str, Any]:
        """
        Record new health metrics and calculate trends
        """
        async with get_db() as db:
            query = """
                INSERT INTO health_metrics (
                    patient_id, timestamp, heart_rate, blood_pressure_systolic,
                    blood_pressure_diastolic, temperature, oxygen_saturation,
                    respiratory_rate
                ) VALUES (
                    :patient_id, :timestamp, :heart_rate, :blood_pressure_systolic,
                    :blood_pressure_diastolic, :temperature, :oxygen_saturation,
                    :respiratory_rate
                )
                RETURNING id
            """
            values = metric.dict()
            result = await db.fetch_one(query, values)
            
            # Calculate trends based on recent data
            trends = await self.calculate_trends(metric.patient_id)
            
            return {
                "id": result['id'],
                "status": "recorded",
                "trends": trends
            }

    async def calculate_trends(self, patient_id: str) -> Dict[str, Any]:
        """
        Calculate trends from recent patient data
        """
        async with get_db() as db:
            # Get last 24 hours of data
            query = """
                SELECT *
                FROM health_metrics
                WHERE 
                    patient_id = :patient_id
                    AND timestamp > NOW() - INTERVAL '24 hours'
                ORDER BY timestamp DESC
            """
            results = await db.fetch_all(query, {"patient_id": patient_id})
            
            if not results:
                return {"status": "insufficient_data"}

            # Convert to pandas DataFrame for analysis
            df = pd.DataFrame(results)
            
            trends = {}
            metrics = ['heart_rate', 'blood_pressure_systolic', 'oxygen_saturation']
            
            for metric in metrics:
                if metric in df.columns:
                    values = df[metric].dropna()
                    if len(values) >= 3:  # Need at least 3 points for trend
                        trend = self._calculate_metric_trend(values)
                        trends[metric] = trend

            return {
                "status": "analyzed",
                "trends": trends
            }

    def _calculate_metric_trend(self, values: pd.Series) -> Dict[str, Any]:
        """
        Calculate trend metrics for a single health measurement
        """
        # Basic statistics
        current = float(values.iloc[0])
        mean = float(values.mean())
        std = float(values.std())
        
        # Calculate trend direction
        slope = np.polyfit(range(len(values)), values, 1)[0]
        
        # Determine volatility
        volatility = float(std / mean) if mean != 0 else 0
        
        # Simple forecasting using Exponential Smoothing
        if len(values) >= 5:
            model = ExponentialSmoothing(values, trend='add', seasonal=None)
            fitted = model.fit()
            forecast = fitted.forecast(1)[0]
        else:
            forecast = current
        
        return {
            "current_value": current,
            "mean": mean,
            "std": std,
            "trend_direction": "increasing" if slope > 0 else "decreasing",
            "volatility": volatility,
            "forecast_next": float(forecast)
        }

    async def get_patient_metrics(
        self,
        patient_id: str,
        start_date: datetime,
        end_date: datetime,
        metric_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get historical metrics with analysis
        """
        async with get_db() as db:
            query = """
                SELECT *
                FROM health_metrics
                WHERE 
                    patient_id = :patient_id
                    AND timestamp BETWEEN :start_date AND :end_date
                ORDER BY timestamp
            """
            results = await db.fetch_all(
                query,
                {
                    "patient_id": patient_id,
                    "start_date": start_date,
                    "end_date": end_date
                }
            )

            if not results:
                return []

            df = pd.DataFrame(results)
            
            # If specific metric requested, filter analysis
            metrics = [metric_type] if metric_type else [
                'heart_rate', 'blood_pressure_systolic',
                'blood_pressure_diastolic', 'oxygen_saturation'
            ]
            
            analysis = {}
            for metric in metrics:
                if metric in df.columns:
                    values = df[metric].dropna()
                    if len(values) > 0:
                        analysis[metric] = self._analyze_metric_history(values)

            return [{
                "metrics": analysis,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "data_points": len(df)
            }]

    def _analyze_metric_history(self, values: pd.Series) -> Dict[str, Any]:
        """
        Perform detailed analysis on historical metric data
        """
        return {
            "min": float(values.min()),
            "max": float(values.max()),
            "mean": float(values.mean()),
            "median": float(values.median()),
            "std": float(values.std()),
            "percentile_25": float(values.quantile(0.25)),
            "percentile_75": float(values.quantile(0.75)),
            "trend_strength": float(self._calculate_trend_strength(values))
        }

    def _calculate_trend_strength(self, values: pd.Series) -> float:
        """
        Calculate the strength of the trend using regression
        Returns a value between -1 and 1 indicating trend strength and direction
        """
        x = np.arange(len(values))
        slope, _ = np.polyfit(x, values, 1)
        correlation = np.corrcoef(x, values)[0, 1]
        return correlation