# src/api/endpoints/predictions.py
from fastapi import APIRouter, Depends, HTTPException
from models.schemas import RiskPredictionRequest, RiskPredictionResponse
from core.security import verify_token
from services.ml_service import MLService
from datetime import datetime

router = APIRouter()
ml_service = MLService()

@router.post("/risk-assessment", response_model=RiskPredictionResponse)
async def predict_risk(
    request: RiskPredictionRequest,
    user: dict = Depends(verify_token)
):
    """
    Predict health risks based on patient metrics and history
    """
    try:
        prediction = ml_service.predict_risk(request)
        return RiskPredictionResponse(
            risk_score=prediction.risk_score,
            risk_factors=prediction.risk_factors,
            recommendations=prediction.recommendations,
            prediction_time=datetime.now(),
            confidence_score=prediction.confidence_score
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )