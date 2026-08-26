from fastapi import APIRouter, HTTPException, status
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.schemas.personalization import PersonalizationRequest, PersonalizationResponse
from app.services.recommendation_service import recommendation_service

router = APIRouter(prefix="/api/v1", tags=["Recommendation Engine"])

@router.post("/recommendation", response_model=RecommendationResponse, status_code=status.HTTP_200_OK)
async def recommendation_endpoint(request: RecommendationRequest):
    """
    POST /api/v1/recommendation
    Generates structured AI player performance analytics, strengths, weaknesses, top 5 drills, and training focus.
    """
    try:
        response = await recommendation_service.generate_recommendation(request)
        return response
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation generation failed: {str(e)}"
        )

@router.post("/recommendation/personalize", response_model=PersonalizationResponse, status_code=status.HTTP_200_OK)
async def personalization_endpoint(request: PersonalizationRequest):
    """
    POST /api/v1/recommendation/personalize
    Generates AI personalized parameter guidance grounded on Daryll's approved CPI source text.
    """
    try:
        response = await recommendation_service.generate_personalized_parameter_guidance(request)
        return response
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Personalization generation failed: {str(e)}"
        )
