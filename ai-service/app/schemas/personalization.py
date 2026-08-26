from pydantic import BaseModel, Field
from typing import List, Optional

class PersonalizationPoint(BaseModel):
    cpiAnchor: str = Field(description="Exact approved Daryll CPI source principle")
    personalizedGuidance: str = Field(description="Contextual guidance connecting Daryll's principle to player role and coach notes")

class PersonalizationRequest(BaseModel):
    playerId: Optional[int] = None
    playerName: Optional[str] = "Player"
    role: str = Field(default="All-Rounder", description="Player cricket role e.g. Fast Bowler, Top-Order Batter")
    parameterName: str = Field(default="Technique", description="Parameter name e.g. Technique")
    score: float = Field(default=5.0, description="Parameter average score")
    scoreCategory: str = Field(default="MEDIUM", description="LOW, MEDIUM, HIGH category")
    cpi: Optional[float] = 0.0
    ppi: Optional[float] = 0.0
    mpi: Optional[float] = 0.0
    coachNotes: Optional[List[str]] = []
    approvedCpiSourceText: List[str] = Field(description="Array of approved Daryll CPI bullet point strings")

class PersonalizationResponse(BaseModel):
    success: bool = True
    parameterName: str
    role: str
    personalizedPoints: List[PersonalizationPoint] = []
    timestamp: str
