from typing import List, Dict, Any, Optional
from app.services.groq_service import groq_service
from app.utils.logger import logger
import json

class NotesSummaryService:
    def __init__(self):
        pass

    async def generate_summary(
        self,
        player_name: str,
        assessment_type: str,
        notes_list: List[Dict[str, Any]],
        admin_directives: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze ONLY actual coach notes saved for a player and assessment type.
        Practice notes and Match notes are strictly separated.
        Strict non-hallucination rules enforced.
        """
        directives = admin_directives or {}
        tone = directives.get("coachingTone") or "Professional, encouraging, analytical, and actionable."
        guidance = directives.get("responseGuidance") or ""

        clean_notes = []
        for item in notes_list:
            note_text = item.get("notes") or item.get("note") or ""
            date_str = item.get("date") or item.get("createdAt") or "Unknown Date"
            score = item.get("ppiScore") or item.get("mpiScore") or item.get("score")
            if note_text and note_text.strip():
                clean_notes.append({
                    "date": str(date_str),
                    "notes": note_text.strip(),
                    "score": score
                })

        # Standard empty fallback if no notes exist
        if not clean_notes:
            return {
                "success": True,
                "playerName": player_name,
                "assessmentType": assessment_type,
                "hasNotes": False,
                "message": f"No {assessment_type.lower()} coach notes available for {player_name}.",
                "summary": {
                    "keyObservations": [],
                    "recurringPatterns": [],
                    "summaryOverview": f"No {assessment_type.lower()} coach notes recorded yet. Enter notes when completing {assessment_type.lower()} assessments to generate an AI summary."
                }
            }

        # Build formatted text of actual notes
        notes_formatted = []
        for idx, n in enumerate(clean_notes, 1):
            score_str = f" (Score: {n['score']})" if n['score'] else ""
            notes_formatted.append(f"{idx}. [{n['date']}]{score_str}: \"{n['notes']}\"")
        formatted_text = "\n".join(notes_formatted)

        system_instruction = (
            f"You are an elite, objective sports performance analyst for the Cricket Performance Index (CPI).\n"
            f"COACHING TONE: {tone}\n"
            f"RESPONSE GUIDANCE: {guidance}\n\n"
            f"Your task is to analyze ONLY the provided coach notes for a player's {assessment_type} assessments.\n\n"
            f"CRITICAL INSTRUCTIONS FOR STRICT GROUNDING:\n"
            f"1. Base your analysis STRICTLY AND ONLY on the actual coach notes provided.\n"
            f"2. DO NOT invent, assume, extrapolate, or hallucinate any observations, performance issues, techniques, or advice that are NOT explicitly mentioned in the coach notes.\n"
            f"3. Keep Practice and Match analysis completely distinct — this analysis is strictly for {assessment_type} Coach Notes.\n"
            f"4. Generate a clear player-specific summary reflecting the unique observations recorded in the notes.\n"
            f"5. If notes are brief, summarize only what is explicitly written without guessing missing details.\n\n"
            f"You MUST return a JSON object with this EXACT structure:\n"
            f"{{\n"
            f'  "keyObservations": [ "Observation 1 from notes", "Observation 2 from notes" ],\n'
            f'  "recurringPatterns": [ "Pattern 1 from notes", "Pattern 2 from notes" ],\n'
            f'  "summaryOverview": "A clear 2-3 sentence overview synthesizing the actual coach notes recorded."\n'
            f"}}"
        )

        user_content = (
            f"Player Name: {player_name}\n"
            f"Assessment Type: {assessment_type}\n"
            f"Notes Count: {len(clean_notes)}\n\n"
            f"Actual Coach Notes Log:\n{formatted_text}\n\n"
            f"Analyze the above coach notes strictly adhering to non-hallucination rules and return the JSON object."
        )

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_content}
        ]

        try:
            logger.info(f"Generating AI Coach Notes Summary for player '{player_name}', type '{assessment_type}', notes count={len(clean_notes)}")
            ai_json = await groq_service.generate_structured_json(messages, temperature=0.1)

            key_obs = ai_json.get("keyObservations") or ai_json.get("key_observations") or []
            patterns = ai_json.get("recurringPatterns") or ai_json.get("recurring_patterns") or []
            overview = ai_json.get("summaryOverview") or ai_json.get("summary_overview") or ""

            if not isinstance(key_obs, list):
                key_obs = [str(key_obs)]
            if not isinstance(patterns, list):
                patterns = [str(patterns)]

            return {
                "success": True,
                "playerName": player_name,
                "assessmentType": assessment_type,
                "hasNotes": True,
                "totalNotesCount": len(clean_notes),
                "summary": {
                    "keyObservations": [str(x) for x in key_obs if x],
                    "recurringPatterns": [str(x) for x in patterns if x],
                    "summaryOverview": str(overview).strip()
                }
            }

        except Exception as e:
            logger.error(f"AI Service error generating notes summary: {e}. Falling back to clean notes synthesis.")
            # Graceful local fallback built strictly from actual notes
            fallback_obs = [f"Session {n['date']}: {n['notes']}" for n in clean_notes[:3]]
            fallback_overview = f"Coach notes summary for {player_name} ({assessment_type}): " + " ".join([n['notes'] for n in clean_notes])

            return {
                "success": True,
                "playerName": player_name,
                "assessmentType": assessment_type,
                "hasNotes": True,
                "totalNotesCount": len(clean_notes),
                "isFallback": True,
                "summary": {
                    "keyObservations": fallback_obs,
                    "recurringPatterns": [f"Recorded across {len(clean_notes)} {assessment_type.lower()} session(s)."],
                    "summaryOverview": fallback_overview
                }
            }

notes_summary_service = NotesSummaryService()
