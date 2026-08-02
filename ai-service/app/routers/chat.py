from fastapi import APIRouter, HTTPException, status
from app.schemas.chat_request import ChatRequest
from app.schemas.chat_response import ChatResponse
from app.services.chat_service import chat_service

router = APIRouter(prefix="/api/v1", tags=["Chat"])

@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat_endpoint(request: ChatRequest):
    """
    POST /api/v1/chat
    Interacts with the AI Cricket Coach assistant. Supports player context injection and session memory.
    """
    try:
        response = await chat_service.process_chat(request)
        return response
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processing failed: {str(e)}"
        )
