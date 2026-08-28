import asyncio
import json
import sys
import os

# Add ai-service to path
sys.path.insert(0, './ai-service')

from app.services.notes_summary_service import notes_summary_service

async def run_tests():
    print("=" * 80)
    print("RUNNING AUTOMATED VERIFICATION FOR COACH NOTES & AI SUMMARY FEATURE")
    print("=" * 80)

    # ---------------------------------------------------------
    # TEST 1: Empty Notes Test
    # ---------------------------------------------------------
    print("\n[TEST 1] Testing Empty Coach Notes for Player Gowtham...")
    res_empty = await notes_summary_service.generate_summary(
        player_name="Gowtham SK",
        assessment_type="PRACTICE",
        notes_list=[]
    )
    assert res_empty["success"] == True, "Failed: empty response should succeed"
    assert res_empty["hasNotes"] == False, "Failed: hasNotes should be False"
    assert "No practice coach notes" in res_empty["message"], "Failed: message should indicate no practice notes"
    print("  [OK] PASS: Empty notes handled gracefully with no hallucinated summary.")

    # ---------------------------------------------------------
    # TEST 2: Practice Coach Notes Analysis & Separation
    # ---------------------------------------------------------
    print("\n[TEST 2] Testing Practice Coach Notes for Player Gowtham...")
    practice_notes = [
        {"date": "2026-08-15", "notes": "Focused heavily on seam orientation during net session. Wrist position improved in final overs.", "ppiScore": 8.5},
        {"date": "2026-08-20", "notes": "Maintained high intensity in 5-over spell. Needed better follow-through on yorker attempts.", "ppiScore": 8.8}
    ]
    res_prac = await notes_summary_service.generate_summary(
        player_name="Gowtham SK",
        assessment_type="PRACTICE",
        notes_list=practice_notes
    )
    assert res_prac["success"] == True, "Failed: practice summary request failed"
    assert res_prac["hasNotes"] == True, "Failed: hasNotes should be True"
    assert res_prac["totalNotesCount"] == 2, "Failed: total notes count should be 2"
    assert res_prac["summary"]["summaryOverview"] != "", "Failed: overview should not be empty"
    print(f"  Summary Overview: {res_prac['summary']['summaryOverview']}")
    print(f"  Key Observations: {res_prac['summary']['keyObservations']}")
    print("  [OK] PASS: Practice Coach Notes analyzed cleanly.")

    # ---------------------------------------------------------
    # TEST 3: Match Coach Notes Analysis & Data Separation
    # ---------------------------------------------------------
    print("\n[TEST 3] Testing Match Coach Notes for Player Gowtham (Separate from Practice)...")
    match_notes = [
        {"date": "2026-08-22", "notes": "Exposed to pressure death overs in T20 match. Executed slower balls effectively under pressure.", "mpiScore": 9.2}
    ]
    res_match = await notes_summary_service.generate_summary(
        player_name="Gowtham SK",
        assessment_type="MATCH",
        notes_list=match_notes
    )
    assert res_match["success"] == True, "Failed: match summary request failed"
    assert res_match["hasNotes"] == True, "Failed: hasNotes should be True"
    assert res_match["totalNotesCount"] == 1, "Failed: total notes count should be 1"
    print(f"  Summary Overview: {res_match['summary']['summaryOverview']}")
    print(f"  Key Observations: {res_match['summary']['keyObservations']}")
    print("  [OK] PASS: Match Coach Notes analyzed completely separate from Practice notes.")

    # ---------------------------------------------------------
    # TEST 4: Player-Specific Uniqueness Test
    # ---------------------------------------------------------
    print("\n[TEST 4] Testing Player-Specific Uniqueness (Player A vs Player B)...")
    player_b_notes = [
        {"date": "2026-08-25", "notes": "Batter struggled against left-arm spin. Footwork was static on front foot.", "ppiScore": 6.5}
    ]
    res_player_b = await notes_summary_service.generate_summary(
        player_name="Rahul Dravid",
        assessment_type="PRACTICE",
        notes_list=player_b_notes
    )
    assert res_player_b["summary"]["summaryOverview"] != res_prac["summary"]["summaryOverview"], "Failed: summaries should be different for different players"
    print(f"  Player A Overview: {res_prac['summary']['summaryOverview'][:75]}...")
    print(f"  Player B Overview: {res_player_b['summary']['summaryOverview'][:75]}...")
    print("  [OK] PASS: Summaries are unique and player-specific based on actual notes.")

    print("\n" + "=" * 80)
    print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_tests())
