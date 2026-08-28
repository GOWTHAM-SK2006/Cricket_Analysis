from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.services.notes_summary_service import notes_summary_service

router = APIRouter(prefix="/api/v1", tags=["Notes Summary"])

class NotesSummaryRequest(BaseModel):
    playerName: str = Field(..., description="Player's full name")
    assessmentType: str = Field(..., description="'PRACTICE' or 'MATCH'")
    notesList: List[Dict[str, Any]] = Field(default=[], description="List of saved note objects containing date, notes, score")
    adminDirectives: Optional[Dict[str, Any]] = Field(default=None)

@router.post("/notes-summary", status_code=status.HTTP_200_OK)
async def generate_notes_summary_endpoint(request: NotesSummaryRequest):
    """
    POST /api/v1/notes-summary
    Analyzes ONLY the actual coach notes for a specific player and assessment type (Practice vs Match).
    Enforces strict grounding without hallucinated advice or facts.
    """
    try:
        response = await notes_summary_service.generate_summary(
            player_name=request.playerName,
            assessment_type=request.assessmentType,
            notes_list=request.notesList,
            admin_directives=request.adminDirectives
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Notes summary generation failed: {str(e)}"
        )
