from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class PlayerContext(BaseModel):
    model_config = ConfigDict(extra="allow")

    playerName: Optional[str] = Field(None, example="John")
    age: Optional[int] = Field(None, example=19)
    role: Optional[str] = Field(None, example="Batsman")
    currentCPI: Optional[float] = Field(None, example=74.0)
    currentPPI: Optional[float] = Field(None, example=80.0)
    currentMPI: Optional[float] = Field(None, example=68.0)
    targetCPI: Optional[float] = Field(None, example=90.0)
    practiceHistory: Optional[List[float]] = Field(default=[], example=[78, 80, 76, 82, 84])
    matchHistory: Optional[List[float]] = Field(default=[], example=[65, 66, 70, 68, 72])
    coachFeedback: Optional[List[str]] = Field(default=[], example=["Good timing", "Needs better footwork"])
    allPlayersList: Optional[List[Dict[str, Any]]] = Field(default=None)

class ChatRequest(BaseModel):
    sessionId: str = Field(..., example="abc123session")
    userRole: str = Field("COACH", example="COACH")  # COACH or PLAYER
    playerId: Optional[int] = Field(None, example=15)
    message: str = Field(..., example="How can I improve this player's batting under pressure?")
    context: Optional[PlayerContext] = Field(default=None)
