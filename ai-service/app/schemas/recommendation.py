from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.chat_request import PlayerContext

class RecommendationRequest(BaseModel):
    playerId: int = Field(..., example=15)
    userRole: str = Field("COACH", example="COACH")
    context: PlayerContext
    adminDirectives: Optional[dict] = Field(default=None)

class DrillItem(BaseModel):
    title: str = Field(..., example="Target Zone Drop Feed Drill")
    category: str = Field(..., example="Technical / Footwork")
    description: str = Field(..., example="Execute 30 front-foot drives focusing on late contact point.")

class RecommendationResponse(BaseModel):
    success: bool = Field(True, example=True)
    summary: str = Field(..., example="Player shows high practice intensity (PPI 80) but struggles under match pressure (MPI 68).")
    strengths: List[str] = Field(..., example=["Solid technique in nets", "High practice commitment"])
    weaknesses: List[str] = Field(..., example=["Inconsistent strike rotation under match pressure", "Lapses in game awareness"])
    improvementAreas: List[str] = Field(..., example=["Front-foot contact point against spin", "Pacing run chases"])
    top5Drills: List[DrillItem] = Field(..., description="Top 5 recommended practical cricket drills")
    trainingFocus: str = Field(..., example="Focus next 3 sessions on match-scenario pressure drills and spin footwork.")
    motivationalMessage: str = Field(..., example="Keep trusting the process — small technical adjustments lead to big match results!")
    timestamp: str = Field(...)
