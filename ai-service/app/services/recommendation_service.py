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
        
        directives = request.adminDirectives or {}
        sys_inst = directives.get("systemInstructions") or system_prompt or "You are the CPI AI Head Performance Analyst. Provide objective, evidence-based performance feedback for cricket players using ONLY the exact wording from the CPI 7-parameter framework."
        tone = directives.get("coachingTone") or "Professional, encouraging, analytical, and actionable."
        rec_behaviour = directives.get("recommendationBehaviour") or ""
        param_analysis = directives.get("parameterAnalysisInstructions") or ""
        coach_action = directives.get("coachActionPlanDirectives") or ""
        rec_focus = directives.get("recommendedFocusDirectives") or ""

        admin_block = (
            f"SYSTEM DIRECTIVE: {sys_inst}\n"
            f"COACHING TONE: {tone}\n"
            f"RECOMMENDATION DIRECTIVE: {rec_behaviour}\n"
            f"PARAMETER ANALYSIS DIRECTIVE: {param_analysis}\n"
            f"ACTION PLAN DIRECTIVE: {coach_action}\n"
            f"RECOMMENDED FOCUS DIRECTIVE: {rec_focus}\n"
        ).strip()
        
        json_schema_prompt = (
            "Analyse the following cricket player assessment context and generate a complete performance recommendation.\n"
            "STRICT MANDATE: YOU MUST USE ONLY EXACT SENTENCES AND PHRASES COPIED CHARACTER-FOR-CHARACTER FROM THE APPROVED CPI SOURCE TEXT FILE.\n"
            "ONLY USE THE APPROVED 7 PARAMETERS: Technique, Skill Level, Game Plan, Preparation, Intensity, Focus, Resilience.\n"
            "PARAMETER HEADINGS MUST BE EXACTLY: 'HOW TO COACH TECHNIQUE', 'HOW TO COACH SKILL LEVEL', 'HOW TO COACH GAME PLAN', 'HOW TO COACH PREPARATION', 'HOW TO COACH INTENSITY', 'HOW TO COACH FOCUS', 'HOW TO COACH RESILIENCE'.\n"
            "DO NOT GENERATE, DISPLAY, OR REFERENCE ANY 'COACH'S SUMMARY' OR 'THE COACH'S SUMMARY' SECTIONS AT ALL.\n"
            "DO NOT PARAPHRASE, REWRITE, SIMPLIFY, SUMMARISE, OR GENERATE ANY UNAPPROVED NEW WORDS OR DRILLS.\n"
            "Respond ONLY with a valid JSON object matching this exact structure:\n"
            "{\n"
            '  "summary": "Exact action point statement from approved source file",\n'
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
            {"role": "system", "content": f"{admin_block}\n\nCOACH PLAN OF ACTION / GUIDELINES:\n{coach_plan_of_action}\n\n{json_schema_prompt}"},
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

    async def generate_personalized_parameter_guidance(self, request) -> dict:
        """
        Generates player-specific guidance grounded strictly on Daryll's approved CPI source text.
        Enforces 100% strict grounding: zero unapproved technical concepts, ungrounded cues, or inferred theories.
        """
        approved_text = request.approvedCpiSourceText or []
        notes_str = ", ".join(request.coachNotes) if request.coachNotes else "None recorded"
        directives = request.adminDirectives or {}
        tone = directives.get("coachingTone") or "Professional, encouraging, analytical, and actionable."
        param_analysis = directives.get("parameterAnalysisInstructions") or ""
        
        system_prompt = (
            "You are an expert AI Cricket Coach Assistant strictly enforcing Daryll's Cullinan Performance Index (CPI) framework.\n\n"
            f"COACHING TONE: {tone}\n"
            f"PARAMETER ANALYSIS DIRECTIVE: {param_analysis}\n\n"
            "STRICT ZERO-INVENTION GROUNDING MANDATE:\n"
            "1. Daryll's approved CPI source bullet points are the IMMUTABLE source of truth.\n"
            "2. 'cpiAnchor' MUST BE AN EXACT, UNALTERED STRING FROM approvedCpiSourceText.\n"
            "3. 'personalizedGuidance' MUST ONLY contextualize Daryll's exact principle using facts explicitly present in the player data (Player Name, Role, Score, Coach Remarks).\n"
            "4. ABSOLUTELY FORBIDDEN INVENTIONS (DO NOT USE):\n"
            "   - DO NOT invent unapproved drills, coaching cues, technical corrections, or physical/mental theories.\n"
            "   - DO NOT introduce terms such as: 'run-up rhythm', 'shot selection', 'stamina', 'balance', 'energy transfer', 'muscle memory', 'biomechanics', 'hip rotation', 'foot placement', 'stride angle', 'full-length overs'.\n"
            "5. CONSERVATIVE PRINCIPLE: If coach notes or data do not explicitly state a technical cause, simply state how Daryll's exact principle applies to this player's role ({role}) and score ({score:.1f}/10) without guessing or inferring technical causes.\n\n"
            "RESPOND ONLY WITH A VALID JSON OBJECT MATCHING THIS EXACT STRUCTURE:\n"
            "{\n"
            '  "personalizedPoints": [\n'
            '    {\n'
            '      "cpiAnchor": "Exact string copied from approvedCpiSourceText",\n'
            '      "personalizedGuidance": "Strictly grounded application of Daryll\'s exact principle for this player role and coach remark without any invented concepts"\n'
            '    }\n'
            '  ]\n'
            "}\n"
        )

        user_content = (
            f"--- PLAYER PROFILE & CONTEXT ---\n"
            f"Player Name: {request.playerName}\n"
            f"Role: {request.role}\n"
            f"Parameter: {request.parameterName}\n"
            f"Score: {request.score:.1f} / 10 ({request.scoreCategory})\n"
            f"Current CPI: {request.cpi:.1f} (PPI: {request.ppi:.1f}, MPI: {request.mpi:.1f})\n"
            f"Coach Remarks & Observations: {notes_str}\n\n"
            f"--- APPROVED DARYLL CPI SOURCE BULLET POINTS (IMMUTABLE ANCHORS) ---\n"
            + "\n".join([f"• {pt}" for pt in approved_text])
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        logger.info(f"Generating personalized {request.parameterName} guidance for player {request.playerName} ({request.role})")
        raw_json = await groq_service.generate_structured_json(messages=messages)
        
        raw_points = raw_json.get("personalizedPoints", [])
        approved_set = set(approved_text)
        validated_points = []

        FORBIDDEN_JARGON = [
            "run-up rhythm", "shot selection", "stamina", "balance", "energy transfer",
            "muscle memory", "biomechanics", "hip rotation", "foot placement", "stride angle",
            "full-length overs"
        ]

        # Server-side validation: enforce exact anchor and sanitize guidance from unapproved jargon
        for idx, pt in enumerate(raw_points):
            anchor = pt.get("cpiAnchor", "").strip()
            guidance = pt.get("personalizedGuidance", "").strip()
            
            # Snap anchor to exact approved text if LLM altered formatting
            if anchor not in approved_set:
                if idx < len(approved_text):
                    anchor = approved_text[idx]
                elif approved_text:
                    anchor = approved_text[0]
            
            # Sanitize guidance: if guidance contains forbidden jargon, clean or replace with conservative grounded phrasing
            contains_forbidden = any(bad in guidance.lower() for bad in FORBIDDEN_JARGON)
            if contains_forbidden or not guidance:
                if notes_str != "None recorded":
                    guidance = f"For {request.playerName} ({request.role}, {request.parameterName} score {request.score:.1f}/10): Apply Daryll's principle '{anchor}' directly to address the coach observation: '{notes_str}'."
                else:
                    guidance = f"For {request.playerName} ({request.role}, {request.parameterName} score {request.score:.1f}/10): Apply Daryll's principle '{anchor}' during training sessions."

            validated_points.append({
                "cpiAnchor": anchor,
                "personalizedGuidance": guidance
            })
        
        # Fallback formatting if AI returns empty
        if not validated_points and approved_text:
            validated_points = [
                {
                    "cpiAnchor": pt,
                    "personalizedGuidance": f"For {request.playerName} ({request.role}, {request.parameterName} score {request.score:.1f}/10): Apply Daryll's principle '{pt}'."
                }
                for pt in approved_text
            ]

        return {
            "success": True,
            "parameterName": request.parameterName,
            "role": request.role,
            "personalizedPoints": validated_points,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

recommendation_service = RecommendationService()
