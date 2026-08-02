from datetime import datetime
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.openrouter_service import openrouter_service
from app.utils.helpers import load_prompt_file, format_player_context
from app.utils.logger import logger

class RecommendationService:
    def __init__(self):
        self.system_prompt = load_prompt_file("system_prompt.txt")

    async def generate_recommendation(self, request: RecommendationRequest) -> RecommendationResponse:
        context_dict = request.context.model_dump()
        formatted_context = format_player_context(context_dict)
        
        json_schema_prompt = (
            "Analyse the following cricket player assessment context and generate a complete performance recommendation.\n"
            "Respond ONLY with a valid JSON object matching this exact structure:\n"
            "{\n"
            '  "summary": "Overall summary of player state and performance trends",\n'
            '  "strengths": ["Strength 1", "Strength 2"],\n'
            '  "weaknesses": ["Weakness 1", "Weakness 2"],\n'
            '  "improvementAreas": ["Improvement 1", "Improvement 2"],\n'
            '  "top5Drills": [\n'
            '    {\n'
            '      "title": "Drill Title",\n'
            '      "category": "Drill Category",\n'
            '      "description": "Step-by-step execution instructions"\n'
            "    }\n"
            "  ],\n"
            '  "trainingFocus": "Specific training priorities for next week",\n'
            '  "motivationalMessage": "Encouraging closing coach remark"\n'
            "}\n"
        )
        
        messages = [
            {"role": "system", "content": f"{self.system_prompt}\n\n{json_schema_prompt}"},
            {"role": "user", "content": formatted_context}
        ]

        logger.info(f"Generating AI recommendation for Player ID {request.playerId}")
        raw_json = await openrouter_service.generate_structured_json(messages=messages)

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
