from typing import Dict, List
from app.schemas.chat_request import ChatRequest
from app.schemas.chat_response import ChatResponse
from app.services.groq_service import groq_service
from app.utils.helpers import load_prompt_file, format_player_context
from app.utils.logger import logger
import re

# Keywords that indicate the user needs deep coaching/plan-of-action analysis
DEEP_ANALYSIS_KEYWORDS = re.compile(
    r'\b(plan of action|recommend|recommendation|improve|weakness|strength|analyze|analysis|report|performance|training|drill|focus area|coaching|develop|strategy|assessment)\b',
    re.IGNORECASE
)

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

    def _needs_deep_analysis(self, message: str) -> bool:
        """Check if the user message requires the heavy coach plan of action context."""
        if not message:
            return False
        return bool(DEEP_ANALYSIS_KEYWORDS.search(message))

    async def process_chat(self, request: ChatRequest) -> ChatResponse:
        session_id = request.sessionId
        user_message = request.message or ""
        needs_plan = self._needs_deep_analysis(user_message)
        directives = request.adminDirectives or {}
        
        sys_inst = directives.get("systemInstructions") or self.system_prompt or "You are the CPI AI Head Performance Analyst. Provide objective, evidence-based performance feedback for cricket players using ONLY the exact wording from the CPI 7-parameter framework."
        tone = directives.get("coachingTone") or "Professional, encouraging, analytical, and actionable."
        guidance = directives.get("responseGuidance") or ""
        
        admin_content_block = f"{sys_inst}\nCOACHING TONE: {tone}\nRESPONSE GUIDANCE: {guidance}".strip()

        # Build system prompt — inject admin directives & role prompt
        if session_id not in self.sessions:
            role_prompt = self._get_role_prompt(request.userRole)
            if needs_plan:
                system_content = f"{admin_content_block}\n\n{role_prompt}\n\nCOACH PLAN OF ACTION / GUIDELINES:\n{self.coach_plan_of_action}"
            else:
                system_content = f"{admin_content_block}\n\n{role_prompt}"
            initial_messages = [
                {"role": "system", "content": system_content}
            ]
            self.sessions[session_id] = initial_messages
        else:
            # Refresh system prompt with active admin directives
            role_prompt = self._get_role_prompt(request.userRole)
            if needs_plan:
                self.sessions[session_id][0]["content"] = f"{admin_content_block}\n\n{role_prompt}\n\nCOACH PLAN OF ACTION / GUIDELINES:\n{self.coach_plan_of_action}"
            else:
                self.sessions[session_id][0]["content"] = f"{admin_content_block}\n\n{role_prompt}"

        messages = list(self.sessions[session_id])
        
        # Inject player context into user message if provided
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

        # Use lower max_tokens for simple queries, higher for analysis
        max_tokens = 800 if needs_plan else 400

        logger.info(f"Processing chat session {session_id} for role {request.userRole} via OpenRouter API (deep_analysis={needs_plan}, max_tokens={max_tokens})")
        reply_text = await groq_service.generate_chat_completion(messages=messages, max_tokens=max_tokens)

        # Update in-memory session history
        self.sessions[session_id].append({"role": "user", "content": request.message})
        self.sessions[session_id].append({"role": "assistant", "content": reply_text})

        return ChatResponse(
            success=True,
            reply=reply_text,
            sessionId=session_id
        )

chat_service = ChatService()
