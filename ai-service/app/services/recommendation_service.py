from datetime import datetime
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.groq_service import groq_service
from app.utils.helpers import load_prompt_file, format_player_context
from app.utils.logger import logger

class RecommendationService:
    def __init__(self):
        pass

    async def generate_recommendation(self, request: RecommendationRequest) -> RecommendationResponse:
        system_prompt = load_prompt_file("system_prompt.txt")
        coach_plan_of_action = load_prompt_file("coach_plan_of_action.txt")

        context_dict = request.context.model_dump()
        formatted_context = format_player_context(context_dict)
        
        json_schema_prompt = (
            "Analyse the following cricket player assessment context and generate a complete performance recommendation.\n"
            "STRICT MANDATE: YOU MUST USE ONLY EXACT SENTENCES AND PHRASES COPIED CHARACTER-FOR-CHARACTER FROM THE APPROVED COACH PLAN OF ACTION TEXT FILE.\n"
            "ONLY USE THE APPROVED 7 PARAMETERS: Technical Execution, Skill Level, Game Plan, Preparation, Intensity, Focus, Resilience.\n"
            "DO NOT PARAPHRASE, REWRITE, SIMPLIFY, SUMMARISE, OR GENERATE ANY NEW WORDS.\n"
            "Respond ONLY with a valid JSON object matching this exact structure:\n"
            "{\n"
            '  "summary": "Exact coach summary sentence from approved source file",\n'
            '  "strengths": ["Exact High Score statement from source", "Exact High Score statement from source"],\n'
            '  "weaknesses": ["Exact Low Score statement from source", "Exact Low Score statement from source"],\n'
            '  "improvementAreas": ["Exact Low Score statement from source"],\n'
            '  "top5Drills": [\n'
            '    {\n'
            '      "title": "Exact source title",\n'
            '      "category": "Parameter Name",\n'
            '      "description": "Exact statement from approved source text"\n'
            "    }\n"
            "  ],\n"
            '  "trainingFocus": "Exact statement from approved source text",\n'
            '  "motivationalMessage": "Exact goal statement from approved source text"\n'
            "}\n"
        )
        
        messages = [
            {"role": "system", "content": f"{system_prompt}\n\nCOACH PLAN OF ACTION / GUIDELINES:\n{coach_plan_of_action}\n\n{json_schema_prompt}"},
            {"role": "user", "content": formatted_context}
        ]

        logger.info(f"Generating Groq AI recommendation for Player ID {request.playerId}")
        raw_json = await groq_service.generate_structured_json(messages=messages)

        return RecommendationResponse(
            success=True,
            summary=raw_json.get("summary", "Player assessment summary."),
            strengths=raw_json.get("strengths", []),
            weaknesses=raw_json.get("weaknesses", []),
            improvementAreas=raw_json.get("improvementAreas", []),
            top5Drills=raw_json.get("top5Drills", []),
            trainingFocus=raw_json.get("trainingFocus", "Focus on core consistency."),
            motivationalMessage=raw_json.get("motivationalMessage", "Keep training hard!"),
            timestamp=datetime.utcnow().isoformat() + "Z"
        )

recommendation_service = RecommendationService()
