from typing import Dict, List
from app.schemas.chat_request import ChatRequest
from app.schemas.chat_response import ChatResponse
from app.services.groq_service import groq_service
from app.utils.helpers import load_prompt_file, format_player_context
from app.utils.logger import logger

class ChatService:
    def __init__(self):
        self.sessions: Dict[str, List[Dict[str, str]]] = {}
        self.system_prompt = load_prompt_file("system_prompt.txt")
        self.coach_prompt = load_prompt_file("coach_prompt.txt")
        self.player_prompt = load_prompt_file("player_prompt.txt")
        self.coach_plan_of_action = load_prompt_file("coach_plan_of_action.txt")

    def _get_role_prompt(self, role: str) -> str:
        if role and role.upper() == "PLAYER":
            return self.player_prompt
        return self.coach_prompt

    async def process_chat(self, request: ChatRequest) -> ChatResponse:
        session_id = request.sessionId
        
        # Initialize session history if new
        if session_id not in self.sessions:
            role_prompt = self._get_role_prompt(request.userRole)
            initial_messages = [
                {"role": "system", "content": f"{self.system_prompt}\n\n{role_prompt}\n\nCOACH PLAN OF ACTION / GUIDELINES:\n{self.coach_plan_of_action}"}
            ]
            self.sessions[session_id] = initial_messages

        messages = list(self.sessions[session_id])
        
        # Inject player context into system or latest message if provided
        if request.context:
            context_str = format_player_context(request.context.model_dump())
            user_message_content = f"{context_str}\n\nUser Question: {request.message}"
        else:
            user_message_content = request.message

        messages.append({"role": "user", "content": user_message_content})

        # Keep sliding memory window (max 10 recent messages)
        if len(messages) > 12:
            system_msg = messages[0]
            messages = [system_msg] + messages[-10:]

        logger.info(f"Processing chat session {session_id} for role {request.userRole} via Groq API")
        reply_text = await groq_service.generate_chat_completion(messages=messages)

        # Update in-memory session history
        self.sessions[session_id].append({"role": "user", "content": request.message})
        self.sessions[session_id].append({"role": "assistant", "content": reply_text})

        return ChatResponse(
            success=True,
            reply=reply_text,
            sessionId=session_id
        )

chat_service = ChatService()
