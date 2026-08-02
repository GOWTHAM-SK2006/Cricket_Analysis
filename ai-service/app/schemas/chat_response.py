from datetime import datetime
from pydantic import BaseModel, Field

class ChatResponse(BaseModel):
    success: bool = Field(True, example=True)
    reply: str = Field(..., example="To improve this player's batting under pressure...")
    sessionId: str = Field(..., example="abc123session")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
