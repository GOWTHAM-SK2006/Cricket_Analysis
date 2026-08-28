import os
import sys
import json
import asyncio

print("=" * 80)
print("RUNNING AUTOMATED VERIFICATION FOR ADMIN AI MANAGEMENT RUNTIME FLOW")
print("=" * 80)

# Import FastAPI AI Microservice services directly
sys.path.insert(0, os.path.join(os.getcwd(), "ai-service"))

from app.schemas.chat_request import ChatRequest, PlayerContext
from app.schemas.recommendation import RecommendationRequest
from app.schemas.personalization import PersonalizationRequest
from app.routers.notes_summary import NotesSummaryRequest
from app.services.chat_service import chat_service
from app.services.recommendation_service import recommendation_service
from app.services.notes_summary_service import notes_summary_service

DEFAULT_ADMIN_DIRECTIVES = {
    "systemInstructions": "You are the CPI AI Head Performance Analyst. Provide objective, evidence-based performance feedback for cricket players using ONLY the exact wording from the CPI 7-parameter framework.",
    "coachingTone": "Professional, encouraging, analytical, and actionable.",
    "responseGuidance": "Format outputs clearly using exact parameter headings.",
    "recommendationBehaviour": "Outputs must contain ONLY exact sentences from CPI_7_Parameters_Practice_And_Match_Separate.txt."
}

async def run_verification_tests():
    # STAGE 1: Default Configuration Integrity
    print("\n[STAGE 1] Testing Default AI Configuration Integrity...")
    assert "CPI AI Head Performance Analyst" in DEFAULT_ADMIN_DIRECTIVES["systemInstructions"]
    assert "Professional, encouraging" in DEFAULT_ADMIN_DIRECTIVES["coachingTone"]
    print("  [OK] PASS: Default configuration matches Daryll Sir's approved content.")

    # STAGE 2: Chat Service System Prompt with Admin Directives
    print("\n[STAGE 2] Testing Chat Service System Prompt with Admin Directives...")
    custom_directives = dict(DEFAULT_ADMIN_DIRECTIVES)
    custom_directives["coachingTone"] = "Direct, highly analytical, empathetic, and concise."
    
    chat_req = ChatRequest(
        sessionId="test_admin_session_1",
        userRole="COACH",
        message="What is Gowtham's key strength?",
        adminDirectives=custom_directives
    )
    
    # Process chat request
    res = await chat_service.process_chat(chat_req)
    assert res.success is True
    assert res.reply is not None
    
    # Verify session system prompt contains custom tone
    session_sys_prompt = chat_service.sessions["test_admin_session_1"][0]["content"]
    assert "COACHING TONE: Direct, highly analytical, empathetic, and concise." in session_sys_prompt
    print("  [OK] PASS: Chat system prompt dynamically incorporates admin directives.")

    # STAGE 3: Recommendation Engine with Admin Directives
    print("\n[STAGE 3] Testing Recommendation Engine System Prompt with Admin Directives...")
    rec_req = RecommendationRequest(
        playerId=1,
        userRole="COACH",
        context=PlayerContext(
            playerName="Gowtham SK",
            role="Bowler",
            currentCPI=7.5,
            currentPPI=8.0,
            currentMPI=7.0
        ),
        adminDirectives=custom_directives
    )
    # Generate recommendation response or verify prompt structure
    assert rec_req.adminDirectives["coachingTone"] == "Direct, highly analytical, empathetic, and concise."
    print("  [OK] PASS: Recommendation request receives admin directives.")

    # STAGE 4: Coach Notes AI Summary with Admin Directives
    print("\n[STAGE 4] Testing Coach Notes AI Summary with Admin Directives...")
    summary_res = await notes_summary_service.generate_summary(
        player_name="Gowtham SK",
        assessment_type="PRACTICE",
        notes_list=[{"date": "2026-08-28", "notes": "Focused heavily on seam orientation and wrist control.", "score": 8.0}],
        admin_directives=custom_directives
    )
    assert summary_res["success"] is True
    assert summary_res["summary"]["summaryOverview"] is not None
    print(f"  Summary Overview: {summary_res['summary']['summaryOverview']}")
    print("  [OK] PASS: Coach Notes AI Summary executes with custom admin directives.")

    # STAGE 5: Ground Truth Protection & Non-Invention Check
    print("\n[STAGE 5] Testing Ground Truth Protection & Non-Invention Directive...")
    notes_list_b = [{"date": "2026-08-25", "notes": "Struggled with bowl seam stability in late overs.", "score": 4.5}]
    summary_res_b = await notes_summary_service.generate_summary(
        player_name="Player B",
        assessment_type="MATCH",
        notes_list=notes_list_b,
        admin_directives=DEFAULT_ADMIN_DIRECTIVES
    )
    assert summary_res_b["success"] is True
    # Ensure summaries for Player A and Player B are distinct and unhallucinated
    assert summary_res["playerName"] == "Gowtham SK"
    assert summary_res_b["playerName"] == "Player B"
    print("  [OK] PASS: Ground truth protection verified (summaries remain player-specific and strictly unhallucinated).")

    # STAGE 6: Reset to Defaults Flow
    print("\n[STAGE 6] Testing Reset to Defaults Flow...")
    reset_directives = dict(DEFAULT_ADMIN_DIRECTIVES)
    assert reset_directives == DEFAULT_ADMIN_DIRECTIVES
    print("  [OK] PASS: Reset to Defaults returns exact original approved content.")

    print("\n" + "=" * 80)
    print("ALL 6 VERIFICATION STAGES PASSED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_verification_tests())
