import os
from typing import Dict, Any, Optional

def load_prompt_file(file_name: str) -> str:
    """Load a text prompt file from the app/prompts directory."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    prompt_path = os.path.join(base_dir, "prompts", file_name)
    if os.path.exists(prompt_path):
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read().strip()
    return ""

def format_player_context(context: Optional[Dict[str, Any]]) -> str:
    """Format player context data into a readable summary string for AI prompts."""
    if not context:
        return "No player context available."
    
    player_name = context.get("playerName", "Unknown Player")
    age = context.get("age", "N/A")
    role = context.get("role", "N/A")
    cpi = context.get("currentCPI", "N/A")
    ppi = context.get("currentPPI", "N/A")
    mpi = context.get("currentMPI", "N/A")
    target_cpi = context.get("targetCPI", "N/A")
    
    practice_history = context.get("practiceHistory", [])
    match_history = context.get("matchHistory", [])
    coach_feedback = context.get("coachFeedback", [])
    
    summary = (
        f"--- PLAYER PROFILE & PERFORMANCE CONTEXT ---\n"
        f"Player Name: {player_name}\n"
        f"Age: {age} | Role: {role}\n"
        f"Current CPI (Overall Index): {cpi}\n"
        f"Current PPI (Practice Index): {ppi}\n"
        f"Current MPI (Match Index): {mpi}\n"
        f"Target CPI Goal: {target_cpi}\n"
        f"Last Practice Assessments (PPI History): {practice_history}\n"
        f"Last Match Assessments (MPI History): {match_history}\n"
        f"Coach Feedback & Remarks: {', '.join(coach_feedback) if coach_feedback else 'None recorded'}\n"
    )

    category_keys = [
        "technicalExecution", "skillsLevel", "intensity", "concentration",
        "decisionMaking", "preparation", "gameAwareness", "adaptability",
        "discipline", "teamwork", "coachability", "workEthic", "emotionalControl"
    ]
    categories_found = []
    for key in category_keys:
        val = context.get(key)
        if val is not None:
            import re
            human_name = re.sub(r'(?<!^)(?=[A-Z])', ' ', key).title()
            categories_found.append(f"  - {human_name}: {val}")

    if categories_found:
        summary += "Detailed Performance Indices (Averages):\n" + "\n".join(categories_found) + "\n"

    summary += "--------------------------------------------"
    return summary
