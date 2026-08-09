"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle, Save, RotateCcw, Loader2, Info, BookOpen, Layers, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useAdminToast } from "../layout";

interface ActionPoint {
  title: string;
  detail: string;
}

interface CoachPlanItem {
  id: string;
  name: string;
  description: string;
  highPoints: ActionPoint[];
  highSummary: string;
  lowPoints: ActionPoint[];
  lowSummary?: string;
  coachSummary: {
    overview: string;
    high: string;
    low: string;
    goal: string;
  };
}

interface FullHelpConfig {
  coachPlanData: CoachPlanItem[];
  ppiDescription: string;
  mpiDescription: string;
  cpiDescription: string;
  below5Text: string;
  between5And7Text: string;
  above7Text: string;
}

const DEFAULT_COACH_PLAN_DATA: CoachPlanItem[] = [
  {
    id: "technical_execution",
    name: "Technical Execution",
    description: "Technical Execution measures how consistently and effectively a player performs the basic techniques required for their role in both practice and matches when the difficulty and demands increase.",
    highPoints: [
      { title: "PRESSURE TEST IT", detail: "Add pace, spin, fatigue, and tougher match scenarios in practice." },
      { title: "PROTECT THE BASICS", detail: "Maintain and reinforce strong fundamentals, avoiding unnecessary changes." },
      { title: "OWN THE CORRECTION", detail: "Encourage the player to recognise and self-correct technical drift." }
    ],
    highSummary: "A high score shows the player has a strong, reliable technical base that holds up under pressure. The focus now is to protect the basics, keep raising the standard, and continue testing the technique in more demanding cricket situations.",
    mediumPoints: [
      { title: "REFINE CORE MECHANICS", detail: "Fix minor technical breakdowns that appear when pace or pressure rises." },
      { title: "BUILD CONSISTENCY", detail: "Repeat sound technique across longer practice sets and multi-over spells." },
      { title: "CONTROLLED PRESSURE NETS", detail: "Expose technique to moderate match drills with clear execution targets." }
    ],
    mediumSummary: "A medium score shows the player has a functional technical foundation but requires greater consistency under pressure. The focus now is to refine core mechanics, eliminate minor breakdowns, and build repeatable technique.",
    lowPoints: [
      { title: "IDENTIFY MAIN ISSUE", detail: "Find the single technical breakdown having the greatest effect on performance." },
      { title: "KEEP CORRECTION SIMPLE", detail: "Work on one clear technical cue rather than changing multiple things." },
      { title: "RETURN TO BASICS", detail: "Slow down the movement in drill work before increasing execution speed." }
    ],
    lowSummary: "A low score shows the player needs to strengthen their technical base and build greater consistency under pressure. The focus now is to rebuild the basics, raise the standard, and keep testing the technique in demanding cricket situations.",
    coachSummary: {
      overview: "The Technical Execution Index helps the coach understand whether the player's technique is reliable enough to perform in both practice and matches.",
      high: "protect, challenge and refine.",
      medium: "refine, stabilize and test under moderate pressure.",
      low: "identify, simplify and rebuild.",
      goal: "develop a technique the player can trust and repeat when the game places it under pressure."
    }
  },
  {
    id: "skill_level",
    name: "Skill Level",
    description: "Skill Level measures how effectively a player applies their range of cricket-specific skills in both practice and matches. It is not simply about how many skills they have. It is about how well they can use those skills as the level of difficulty, pressure and competition increases.",
    highPoints: [
      { title: "EXPAND SKILL VARIETY", detail: "Add secondary options and subtle variations that complement main strengths." },
      { title: "INCREASE EXECUTION SPEED", detail: "Challenge execution under reduced reaction time and changing conditions." },
      { title: "MONITOR MATCH TRANSFER", detail: "Ensure high-level skills practiced in nets translate directly into matches." }
    ],
    highSummary: "A high score shows that the player has a strong and reliable skill set. The next step is to make those skills more adaptable, consistent and effective under pressure.",
    mediumPoints: [
      { title: "CONSOLIDATE CORE SKILLS", detail: "Ensure primary batting strokes or bowling deliveries are 100% reliable." },
      { title: "SCENARIO APPLICATION", detail: "Apply skills within specific field settings and match situation targets." },
      { title: "BUILD EXECUTION DEPTH", detail: "Develop consistent control across different pitch types and lengths." }
    ],
    mediumSummary: "A medium score shows the player possesses a solid basic skill set but needs greater execution variety and adaptability under match pressure. The focus now is to consolidate core skills and expand match options.",
    lowPoints: [
      { title: "IDENTIFY SKILL GAP", detail: "Pinpoint missing or inconsistent fundamentals limiting match contribution." },
      { title: "REPETITION & QUALITY", detail: "Build confidence and muscle memory through high-quality basic repetitions." },
      { title: "MATCH DEMAND TO LEVEL", detail: "Focus on mastering basic skill execution before attempting complex variations." }
    ],
    lowSummary: "A low score shows that the player needs to develop their core skill set and build greater execution consistency under pressure. The focus now is to identify skill gaps, rebuild fundamentals, and test skills in demanding cricket situations.",
    coachSummary: {
      overview: "The Skill Level Index helps the coach understand whether the player has the range and quality of skills needed to meet the demands of practice and competition.",
      high: "challenge, expand and apply.",
      medium: "consolidate, expand and execute.",
      low: "identify, build and repeat.",
      goal: "develop the right skills, then make sure the player can use them when the game demands them."
    }
  },
  {
    id: "gameplan",
    name: "Game Plan",
    description: "Game Plan measures how clearly a player understands what they are trying to achieve and how they intend to go about it in both practice and matches. The key question for the coach is simple: does the player give the impression that they have a plan? They should show purpose in their decisions, understand their role and be able to adjust when the situation changes.",
    highPoints: [
      { title: "CHALLENGE FLEXIBILITY", detail: "Expose the player to rapidly changing match situations requiring tactical shifts." },
      { title: "REINFORCE ROLE MASTERY", detail: "Deepen understanding of phase-specific responsibilities in team tactics." },
      { title: "ENCOURAGE INDEPENDENCE", detail: "Empower the player to make smart tactical choices on the field without instruction." }
    ],
    highSummary: "A high score shows that the player performs with purpose and understands what they are trying to achieve. The next step is to make that thinking more flexible and effective under pressure.",
    mediumPoints: [
      { title: "CLARIFY MATCH ROLE", detail: "Define clear tactical objectives for their specific role in the team." },
      { title: "IMPROVE MATCHUP AWARENESS", detail: "Study field placements, bowler/batter matchups, and scoring options." },
      { title: "PRACTICE IN-GAME SHIFTS", detail: "Rehearse adjusting plans when early wickets fall or match conditions change." }
    ],
    mediumSummary: "A medium score shows the player understands their game plan but occasionally struggles to adapt when match situations shift. The focus now is to sharpen role clarity, improve tactical adjustments, and build situational awareness.",
    lowPoints: [
      { title: "SIMPLIFY THE PLAN", detail: "Give the player one simple, actionable objective to focus on." },
      { title: "CONNECT DRILLS TO MATCHES", detail: "Run practice scenarios that mirror exact match situations they will face." },
      { title: "REVIEW DECISION MAKING", detail: "Discuss post-play whether decisions matched the plan or were reactive." }
    ],
    lowSummary: "A low score shows that the player needs clearer role understanding and tactical direction. The focus now is to simplify decision-making, establish clear match objectives, and test adaptability under pressure.",
    coachSummary: {
      overview: "The Game Plan Index helps the coach understand whether the player is performing with clear purpose or simply reacting to what happens.",
      high: "confirm, challenge and adapt.",
      medium: "sharpen, adapt and execute.",
      low: "clarify, simplify and rehearse.",
      goal: "every player should know what they are trying to do, why they are doing it and when the game requires them to change."
    }
  },
  {
    id: "preparation",
    name: "Preparation",
    description: "Preparation measures how physically, mentally and practically ready a player is to perform in both practice and matches. The key question is: does the player arrive ready to make the most of the session or game? Good preparation gives performance a better chance before the first ball is even bowled.",
    highPoints: [
      { title: "AUTOMATE ROUTINES", detail: "Make pre-session warm-ups, hydration, and goal setting completely automatic." },
      { title: "PREPARE FOR EXTREMES", detail: "Plan ahead for adverse weather, slow pitches, travels, and tough umpires." },
      { title: "BUILD PLAYER OWNERSHIP", detail: "Ensure the player takes full personal charge of equipment and readiness." }
    ],
    highSummary: "A high score shows that the player is giving themselves the best possible chance to perform well. The next step is to make those habits automatic and player-led.",
    mediumPoints: [
      { title: "STANDARDIZE ROUTINES", detail: "Follow a consistent physical warm-up, kit check, and mental prep routine." },
      { title: "VISUALIZE MATCH ROLES", detail: "Spend 5 minutes before play mentally rehearsing key match scenarios." },
      { title: "ARRIVE MATCH READY", detail: "Settle mentally and complete all preparation before stepping onto the field." }
    ],
    mediumSummary: "A medium score shows the player follows standard preparation habits but can improve consistency and mental readiness before matches. The focus now is to refine pre-session routines and build personal ownership.",
    lowPoints: [
      { title: "IDENTIFY PREP GAPS", detail: "Fix disorganization, rushed arrivals, or lack of focus before sessions." },
      { title: "USE A SIMPLE CHECKLIST", detail: "Create an easy equipment, hydration, and warm-up checklist to follow." },
      { title: "SET CLEAR EXPECTATIONS", detail: "Establish what proper pre-session and pre-match readiness looks like." }
    ],
    lowSummary: "A low score shows that the player needs consistent pre-match and pre-session preparation habits. The focus now is to establish structured routines, build personal accountability, and arrive ready for competition.",
    coachSummary: {
      overview: "The Preparation Index helps the coach understand whether the player is ready to perform or already playing catch-up before they begin.",
      high: "reinforce, own and maintain.",
      medium: "standardize, visualize and own.",
      low: "clarify, organise and improve.",
      goal: "arrive ready, so performance has the best possible chance to follow."
    }
  },
  {
    id: "intensity",
    name: "Intensity",
    description: "Intensity measures the energy, purpose and competitive intent a player brings to both practice and matches. It's not about being loud or overactive. The key question is: does the player look fully engaged and ready to compete in the moment? Good intensity should support skill, decision making and team performance.",
    highPoints: [
      { title: "CHANNEL ENERGY POSITIVELY", detail: "Keep competitive drive high while maintaining tactical discipline." },
      { title: "LIFT SQUAD STANDARDS", detail: "Use competitive energy to inspire and raise standards for teammates." },
      { title: "SUSTAIN IN HIGH FATIGUE", detail: "Maintain explosive effort and sharp movement during long spells and innings." }
    ],
    highSummary: "A high score shows that the player brings strong purpose and competitive effort. The next step is to make that intensity controlled, consistent and useful.",
    mediumPoints: [
      { title: "SUSTAIN CONSISTENT EFFORT", detail: "Eliminate energy lulls between overs or drill sets." },
      { title: "SET SESSION BENCHMARKS", detail: "Use clear physical and target benchmarks to maintain urgency in nets." },
      { title: "ACTIVE FIELDING EFFORT", detail: "Attack the ball in the field, communicate loudly, and stay alert." }
    ],
    mediumSummary: "A medium score shows the player brings good energy but experiences periodic intensity lulls during long sessions or matches. The focus now is to sustain competitive effort and maintain active engagement.",
    lowPoints: [
      { title: "FIND THE ENERGY TRIGGER", detail: "Determine if low intensity stems from fatigue, boredom, or unclear goals." },
      { title: "SET SHORT TARGETS", detail: "Break practice into short 5-minute competitive challenges." },
      { title: "INCREASE INVOLVEMENT", detail: "Use active, high-touch drills to keep the player physically engaged." }
    ],
    lowSummary: "A low score shows that the player needs higher competitive energy and focus during practice and matches. The focus now is to set clear targets, build effort habits, and maintain intensity throughout sessions.",
    coachSummary: {
      overview: "The Intensity Index helps the coach understand whether the player is fully engaged or simply present.",
      high: "channel, challenge and sustain.",
      medium: "sustain, target and engage.",
      low: "identify, engage and rebuild.",
      goal: "bring the right energy, with the right purpose, for the demands of the moment."
    }
  },
  {
    id: "focus",
    name: "Focus",
    description: "Focus measures how well a player stays mentally present, attentive and connected to the task in both practice and matches. The key question is: does the player stay engaged with what matters, or does their concentration drift when pressure, fatigue or distractions increase?",
    highPoints: [
      { title: "REINFORCE RESET ROUTINE", detail: "Maintain a quick physical/breath reset between balls to conserve focus." },
      { title: "EXTEND CONCENTRATION SPANS", detail: "Test mental stamina with longer, unbroken practice scenarios." },
      { title: "STAY CALM UNDER PRESSURE", detail: "Ensure intense focus remains relaxed and free from overthinking." }
    ],
    highSummary: "A high score shows that the player can stay connected to the task and give each moment proper attention. The next step is to make that focus more durable under pressure.",
    mediumPoints: [
      { title: "BALL-BY-BALL RECONFINEMENT", detail: "Use a focal trigger to lock in complete attention before every delivery." },
      { title: "FILTER DISTRACTIONS", detail: "Practice staying switched on despite noise, fatigue, or bad decisions." },
      { title: "TRACK FOCUS DURATIONS", detail: "Notice when concentration drifts and trigger an instant mental reset." }
    ],
    mediumSummary: "A medium score shows the player has solid concentration with occasional focus lapses during prolonged play. The focus now is to strengthen ball-by-ball reset routines and build mental stamina.",
    lowPoints: [
      { title: "SIMPLIFY FOCAL POINTS", detail: "Focus on just one key cue instead of trying to process multiple inputs." },
      { title: "TEACH 5-SECOND RESET", detail: "Use a simple physical trigger to reset after a mistake or distraction." },
      { title: "SHORTER DRILL BLOCKS", detail: "Practice in brief 3-minute sets to build concentration step-by-step." }
    ],
    lowSummary: "A low score shows that the player experiences concentration lapses during demanding periods. The focus now is to shorten focus tasks, introduce mental reset triggers, and sustain attention ball by ball.",
    coachSummary: {
      overview: "The Focus Index helps the coach understand whether the player is mentally present or only physically involved.",
      high: "reinforce, challenge and sustain.",
      medium: "reset, focus and sustain.",
      low: "simplify, reset and rebuild.",
      goal: "stay present, reset quickly and give the next ball your full attention."
    }
  },
  {
    id: "resilience",
    name: "Resilience",
    description: "Resilience measures how well a player responds to adversity, pressure, mistakes and setbacks in both practice and matches. The key question is: does the player maintain effort, focus and body language when things go wrong, or do they fold under pressure?",
    highPoints: [
      { title: "ANCHOR CRUNCH MOMENTS", detail: "Step up to bowl tough overs or bat during difficult collapse phases." },
      { title: "LEAD SQUAD RECOVERY", detail: "Guide teammates calmly when match momentum swings against the team." },
      { title: "EXPOSE TO HARD DRILLS", detail: "Train in high-consequence drills where mistakes carry realistic penalty." }
    ],
    highSummary: "A high score shows that the player thrives under pressure and bounces back quickly from errors. The next step is to anchor that resilience as a core team asset.",
    mediumPoints: [
      { title: "BOUNCE BACK QUICKER", detail: "Cut down emotional dwell time after a boundary, drop, or bad shot." },
      { title: "MAINTAIN POSITIVE POSTURE", detail: "Keep strong, upright body language regardless of match score." },
      { title: "ACCEPT COACHING CUES", detail: "Process mid-game advice constructively without losing self-belief." }
    ],
    mediumSummary: "A medium score shows the player handles standard match pressure reasonably well but can bounce back faster from unexpected setbacks. The focus now is to strengthen post-error recovery routines and build composure.",
    lowPoints: [
      { title: "SEPARATE SELF FROM ERROR", detail: "Learn that one mistake does not define overall ability or value." },
      { title: "POST-ERROR RESET ROUTINE", detail: "Take a deep breath and physically reset posture immediately post-mistake." },
      { title: "BUILD CONFIDENCE GRADUALLY", detail: "Practice recovery in low-stakes scenarios to build emotional composure." }
    ],
    lowSummary: "A low score shows that the player struggles to bounce back quickly from errors under pressure. The focus now is to build emotional control, practice recovery routines, and strengthen mental toughness.",
    coachSummary: {
      overview: "The Resilience Index helps the coach understand whether the player has the mental toughness to handle pressure and bounce back from setbacks.",
      high: "anchor, challenge and lead.",
      medium: "compose, recover and push.",
      low: "identify, reset and rebuild.",
      goal: "develop unshakeable mental toughness under competitive pressure."
    }
  }
];

const DEFAULT_FULL_HELP: FullHelpConfig = {
  coachPlanData: DEFAULT_COACH_PLAN_DATA,
  ppiDescription: "The Practice Performance Index (PPI) is a structured coaching tool used to assess how effectively a young cricketer trains and develops during practice. It measures performance across key areas on a 0 – 10 scale: technique, intensity, execution, adaptability, discipline, concentration, coachability and preparation.",
  mpiDescription: "The Match Performance Index is a structured coaching tool used to assess how effectively a young cricketer performs and responds during competitive play on a 0 – 10 scale. It measures key areas such as technical execution, decision making, game awareness, resilience, emotional control, teamwork, match impact and preparation.",
  cpiDescription: "The Cricket Performance Index (CPI) is a structured coaching tool built around one simple truth: how you practise is how you will play. By measuring key performance areas in both practice and matches on a 0 – 10 scale, the CPI shows what is transferring, where performance is breaking down and what is holding a player back.",
  below5Text: "Performance is being limited in one or more key areas. Identify the main cause and make it a coaching priority.",
  between5And7Text: "There are positive signs, but performance is still inconsistent. Focus on improving consistency and transfer into matches.",
  above7Text: "Performance is strong across the key areas. Protect what is working, maintain standards and continue to challenge the player."
};

export default function AdminHelpPage() {
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [helpConfig, setHelpConfig] = useState<FullHelpConfig>(DEFAULT_FULL_HELP);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
  const [scoreTab, setScoreTab] = useState<"high" | "medium" | "low">("high");
  const [fullConfigRaw, setFullConfigRaw] = useState<any>({});

  useEffect(() => {
    fetchHelpConfig();
  }, []);

  const fetchHelpConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token");
      const res = await fetch("/api/admin/config", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFullConfigRaw(data);
        if (data.helpJson) {
          try {
            const parsed = JSON.parse(data.helpJson);
            if (parsed && typeof parsed === "object") {
              if (parsed.coachPlanData && Array.isArray(parsed.coachPlanData)) {
                setHelpConfig({
                  coachPlanData: parsed.coachPlanData,
                  ppiDescription: parsed.ppiDescription || DEFAULT_FULL_HELP.ppiDescription,
                  mpiDescription: parsed.mpiDescription || DEFAULT_FULL_HELP.mpiDescription,
                  cpiDescription: parsed.cpiDescription || DEFAULT_FULL_HELP.cpiDescription,
                  below5Text: parsed.below5Text || DEFAULT_FULL_HELP.below5Text,
                  between5And7Text: parsed.between5And7Text || DEFAULT_FULL_HELP.between5And7Text,
                  above7Text: parsed.above7Text || DEFAULT_FULL_HELP.above7Text,
                });
              }
            }
          } catch (e) {
            console.error("Error parsing helpJson", e);
          }
        }
      }
    } catch (err) {
      showToast("Could not fetch Help & Information configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = helpConfig.coachPlanData[selectedPlanIndex] || DEFAULT_COACH_PLAN_DATA[0];

  const updateCurrentPlanField = (field: string, val: any) => {
    const updatedList = [...helpConfig.coachPlanData];
    updatedList[selectedPlanIndex] = {
      ...updatedList[selectedPlanIndex],
      [field]: val
    };
    setHelpConfig({ ...helpConfig, coachPlanData: updatedList });
  };

  const updateActionPoint = (tab: "high" | "medium" | "low", index: number, field: "title" | "detail", val: string) => {
    const updatedList = [...helpConfig.coachPlanData];
    const plan = { ...updatedList[selectedPlanIndex] };
    const pointsKey = tab === "high" ? "highPoints" : tab === "medium" ? "mediumPoints" : "lowPoints";
    const points = [...(plan[pointsKey] || [])];
    points[index] = { ...points[index], [field]: val };
    plan[pointsKey] = points;
    updatedList[selectedPlanIndex] = plan;
    setHelpConfig({ ...helpConfig, coachPlanData: updatedList });
  };

  const updateCoachSummaryField = (field: "overview" | "high" | "medium" | "low" | "goal", val: string) => {
    const updatedList = [...helpConfig.coachPlanData];
    const plan = { ...updatedList[selectedPlanIndex] };
    plan.coachSummary = { ...plan.coachSummary, [field]: val };
    updatedList[selectedPlanIndex] = plan;
    setHelpConfig({ ...helpConfig, coachPlanData: updatedList });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token");
      const updatedPayload = {
        ...fullConfigRaw,
        helpJson: JSON.stringify(helpConfig),
        changeLogsJson: JSON.stringify([
          { time: new Date().toISOString(), section: "Help & Information", action: "Updated Coach's Plan of Action & Help documentation", user: "cpi@admin.com" }
        ])
      };

      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedPayload)
      });

      if (!res.ok) throw new Error("Failed to save Help & Information configuration");

      showToast("Coach Help & Information content saved and synchronized!", "success");
    } catch (err: any) {
      showToast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Coach Help & Information Governance</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
              Direct Sync to Coach App (/help)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Edit the exact Coach's Plan of Action, parameter overviews, 5-point action items, summary boxes, and score interpretation text. All edits instantly update on the Coach Help page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setHelpConfig(DEFAULT_FULL_HELP)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/30 transition-all disabled:opacity-50 uppercase cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Help Content</span>
          </button>
        </div>
      </div>

      {/* Editor Grid: Left Parameter List, Right Rich Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Parameter Tabs */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
          <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Select Coach Plan Parameter
          </div>
          {helpConfig.coachPlanData.map((plan, idx) => {
            const isActive = idx === selectedPlanIndex;
            return (
              <button
                key={plan.id}
                onClick={() => { setSelectedPlanIndex(idx); setScoreTab("high"); }}
                className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between border cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                      isActive ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-extrabold text-xs leading-snug">{plan.name}</p>
                    <p className={`text-[10px] line-clamp-1 font-medium ${isActive ? "text-slate-400" : "text-slate-500"}`}>
                      {plan.description}
                    </p>
                  </div>
                </div>
                {isActive && <BookOpen className="w-4 h-4 text-orange-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>

        {/* Right Editor Form */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 font-black text-sm flex items-center justify-center">
                #{selectedPlanIndex + 1}
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900">Coach's Plan of Action — {currentPlan.name}</h2>
                <p className="text-xs text-slate-500 font-medium">Edit parameter overview, action points, and summary box</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
              Parameter #{selectedPlanIndex + 1}
            </span>
          </div>

          {/* 1. Parameter Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              1. Parameter Overview Description
            </label>
            <textarea
              rows={3}
              value={currentPlan.description}
              onChange={(e) => updateCurrentPlanField("description", e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 leading-relaxed"
            />
          </div>

          {/* 2. High vs Medium vs Low Score Action Points Toggle */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. 3-Point Action Plans ({scoreTab === "high" ? "High Score >7" : scoreTab === "medium" ? "Medium Score 5 to 7" : "Low Score <5"})
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                <button
                  onClick={() => setScoreTab("high")}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                    scoreTab === "high" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  If Score is (&gt;7)
                </button>
                <button
                  onClick={() => setScoreTab("medium")}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                    scoreTab === "medium" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  If Score is (5 to 7)
                </button>
                <button
                  onClick={() => setScoreTab("low")}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                    scoreTab === "low" ? "bg-rose-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  If Score is (&lt;5)
                </button>
              </div>
            </div>

            {/* 5 Action Points */}
            <div className="space-y-3">
              {(scoreTab === "high" ? (currentPlan.highPoints || []) : scoreTab === "medium" ? (currentPlan.mediumPoints || []) : (currentPlan.lowPoints || [])).map((pt, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                      scoreTab === "high" ? "bg-emerald-100 text-emerald-800" :
                      scoreTab === "medium" ? "bg-amber-100 text-amber-800" :
                      "bg-rose-100 text-rose-800"
                    }`}>
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={pt.title}
                      onChange={(e) => updateActionPoint(scoreTab, i, "title", e.target.value)}
                      placeholder="Point Title"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-extrabold text-slate-900 uppercase focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={pt.detail}
                    onChange={(e) => updateActionPoint(scoreTab, i, "detail", e.target.value)}
                    placeholder="Point Explanation Detail"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500 leading-relaxed"
                  />
                </div>
              ))}
            </div>

            {/* High Summary Banner text */}
            {scoreTab === "high" && (
              <div>
                <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
                  High Score Green Summary Banner Text
                </label>
                <textarea
                  rows={2}
                  value={currentPlan.highSummary}
                  onChange={(e) => updateCurrentPlanField("highSummary", e.target.value)}
                  className="w-full bg-emerald-50/80 border border-emerald-300 rounded-xl p-3 text-xs font-semibold text-emerald-950 leading-relaxed italic focus:outline-none"
                />
              </div>
            )}
            {/* Medium Summary Banner text */}
            {scoreTab === "medium" && (
              <div>
                <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5">
                  Medium Score Amber Summary Banner Text
                </label>
                <textarea
                  rows={2}
                  value={currentPlan.mediumSummary || ""}
                  onChange={(e) => updateCurrentPlanField("mediumSummary", e.target.value)}
                  className="w-full bg-amber-50/80 border border-amber-300 rounded-xl p-3 text-xs font-semibold text-amber-950 leading-relaxed italic focus:outline-none"
                />
              </div>
            )}
            {/* Low Summary Banner text */}
            {scoreTab === "low" && (
              <div>
                <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1.5">
                  Low Score Red Summary Banner Text
                </label>
                <textarea
                  rows={2}
                  value={currentPlan.lowSummary || ""}
                  onChange={(e) => updateCurrentPlanField("lowSummary", e.target.value)}
                  className="w-full bg-rose-50/80 border border-rose-300 rounded-xl p-3 text-xs font-semibold text-rose-950 leading-relaxed italic focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* 3. The Coach's Summary Box */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. The Coach's Summary Box — {currentPlan.name}
            </label>
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 border border-slate-800">
              <div>
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-1">Summary Overview</span>
                <textarea
                  rows={2}
                  value={currentPlan.coachSummary.overview}
                  onChange={(e) => updateCoachSummaryField("overview", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-medium text-slate-100 focus:outline-none focus:border-orange-500 leading-relaxed"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Elite Score Directive</span>
                  <input
                    type="text"
                    value={currentPlan.coachSummary.high}
                    onChange={(e) => updateCoachSummaryField("high", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-1">Developing Score Directive</span>
                  <input
                    type="text"
                    value={currentPlan.coachSummary.medium || "refine and stabilize."}
                    onChange={(e) => updateCoachSummaryField("medium", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Priority Score Directive</span>
                  <input
                    type="text"
                    value={currentPlan.coachSummary.low}
                    onChange={(e) => updateCoachSummaryField("low", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-black text-orange-300 uppercase tracking-widest block mb-1">The Goal Directive</span>
                <input
                  type="text"
                  value={currentPlan.coachSummary.goal}
                  onChange={(e) => updateCoachSummaryField("goal", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Edits automatically update on the Coach Help page.
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/30 transition-all disabled:opacity-50 uppercase cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Help Content</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Help Sections (PPI, MPI, CPI & Score Interpretation) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-orange-600" />
            <span>4. Index Descriptions & Score Interpretation Texts</span>
          </h2>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">Global Card Texts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Practice Performance (PPI) Text</span>
              <span className="text-[10px] text-slate-400 font-medium">Practice Index</span>
            </label>
            <textarea
              rows={7}
              value={helpConfig.ppiDescription}
              onChange={(e) => setHelpConfig({ ...helpConfig, ppiDescription: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Match Performance (MPI) Text</span>
              <span className="text-[10px] text-slate-400 font-medium">Match Index</span>
            </label>
            <textarea
              rows={7}
              value={helpConfig.mpiDescription}
              onChange={(e) => setHelpConfig({ ...helpConfig, mpiDescription: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Cricket Performance (CPI) Text</span>
              <span className="text-[10px] text-slate-400 font-medium">Overall Rating Index</span>
            </label>
            <textarea
              rows={7}
              value={helpConfig.cpiDescription}
              onChange={(e) => setHelpConfig({ ...helpConfig, cpiDescription: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            5. How to Interpret Scores (Out of 10) Texts
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-[11px] font-black text-red-500 block mb-1.5 uppercase tracking-wide">
                Below 5.0 - Needs Attention
              </span>
              <textarea
                rows={5}
                value={helpConfig.below5Text}
                onChange={(e) => setHelpConfig({ ...helpConfig, below5Text: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
              />
            </div>
            <div>
              <span className="text-[11px] font-black text-amber-500 block mb-1.5 uppercase tracking-wide">
                5.0 to 7.0 - Developing
              </span>
              <textarea
                rows={5}
                value={helpConfig.between5And7Text}
                onChange={(e) => setHelpConfig({ ...helpConfig, between5And7Text: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
              />
            </div>
            <div>
              <span className="text-[11px] font-black text-emerald-500 block mb-1.5 uppercase tracking-wide">
                7.0 and Above - Strong
              </span>
              <textarea
                rows={5}
                value={helpConfig.above7Text}
                onChange={(e) => setHelpConfig({ ...helpConfig, above7Text: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/30 transition-all disabled:opacity-50 uppercase cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Help Content</span>
          </button>
        </div>
      </div>
    </div>
  );
}
