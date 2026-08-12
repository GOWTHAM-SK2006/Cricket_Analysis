"use client";

import { useState, useEffect } from "react";
import { 
  HelpCircle, ChevronRight, Clipboard, ShieldCheck, TrendingUp, 
  Target, Sparkles, Flame, CheckCircle2, AlertTriangle, BookOpen, Layers
} from "lucide-react";
import Link from "next/link";
import CricketLoader from "@/components/CricketLoader";

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
  mediumPoints?: ActionPoint[];
  mediumSummary?: string;
  lowPoints: ActionPoint[];
  lowSummary?: string;
  coachSummary: {
    overview: string;
    high: string;
    medium?: string;
    low: string;
    goal: string;
  };
}

const coachPlanData: CoachPlanItem[] = [
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

export default function HelpPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
  const [scoreTab, setScoreTab] = useState<"high" | "medium" | "low">("high");
  const [plans, setPlans] = useState<CoachPlanItem[]>(coachPlanData);
  const [welcomeText, setWelcomeText] = useState<string>(
    "Welcome to the Cricket Performance Index (CPI) platform. This guide explains how our index works, how to interpret scores on an out-of-10 scale, and provides the complete Coach’s Plan of Action for player development."
  );
  const [ppiDesc, setPpiDesc] = useState<string>(
    "The Practice Performance Index (PPI) is a structured coaching tool used to assess how effectively a young cricketer trains and develops during practice. It measures performance across key areas on a 0 – 10 scale: technique, intensity, execution, adaptability, discipline, concentration, coachability and preparation."
  );
  const [mpiDesc, setMpiDesc] = useState<string>(
    "The Match Performance Index is a structured coaching tool used to assess how effectively a young cricketer performs and responds during competitive play on a 0 – 10 scale. It measures key areas such as technical execution, decision making, game awareness, resilience, emotional control, teamwork, match impact and preparation."
  );
  const [cpiDesc, setCpiDesc] = useState<string>(
    "The Cricket Performance Index (CPI) is a structured coaching tool built around one simple truth: how you practise is how you will play. By measuring key performance areas in both practice and matches on a 0 – 10 scale, the CPI shows what is transferring, where performance is breaking down and what is holding a player back."
  );
  const [below5, setBelow5] = useState<string>(
    "Performance is being limited in one or more key areas. Identify the main cause and make it a coaching priority."
  );
  const [between5And7, setBetween5And7] = useState<string>(
    "There are positive signs, but performance is still inconsistent. Focus on improving consistency and transfer into matches."
  );
  const [above7, setAbove7] = useState<string>(
    "Performance is strong across the key areas. Protect what is working, maintain standards and continue to challenge the player."
  );

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const res = await fetch("/api/public/config");
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.helpJson && typeof data.helpJson === "string") {
          const parsed = JSON.parse(data.helpJson);
          if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed.coachPlanData) && parsed.coachPlanData.length > 0) {
              const sanitized = parsed.coachPlanData.map((item: any, i: number) => {
                const fallback = coachPlanData[i] || coachPlanData[0];
                return {
                  id: String(item?.id || fallback.id),
                  name: String(item?.name || item?.parameter || fallback.name),
                  description: String(item?.description || item?.explanation || fallback.description),
                  highPoints: Array.isArray(item?.highPoints) && item.highPoints.length > 0
                    ? item.highPoints.slice(0, 3).map((pt: any, pIdx: number) => ({
                        title: String(pt?.title || fallback.highPoints[pIdx]?.title || "Action Point"),
                        detail: String(pt?.detail || fallback.highPoints[pIdx]?.detail || "")
                      }))
                    : fallback.highPoints.slice(0, 3),
                  highSummary: String(item?.highSummary || item?.rangeHigh || fallback.highSummary),
                  mediumPoints: Array.isArray(item?.mediumPoints) && item.mediumPoints.length > 0
                    ? item.mediumPoints.slice(0, 3).map((pt: any, pIdx: number) => ({
                        title: String(pt?.title || fallback.mediumPoints?.[pIdx]?.title || "Action Point"),
                        detail: String(pt?.detail || fallback.mediumPoints?.[pIdx]?.detail || "")
                      }))
                    : fallback.mediumPoints?.slice(0, 3) || [],
                  mediumSummary: String(item?.mediumSummary || fallback.mediumSummary || ""),
                  lowPoints: Array.isArray(item?.lowPoints) && item.lowPoints.length > 0
                    ? item.lowPoints.slice(0, 3).map((pt: any, pIdx: number) => ({
                        title: String(pt?.title || fallback.lowPoints[pIdx]?.title || "Action Point"),
                        detail: String(pt?.detail || fallback.lowPoints[pIdx]?.detail || "")
                      }))
                    : fallback.lowPoints.slice(0, 3),
                  lowSummary: String(item?.lowSummary || item?.rangeLow || fallback.lowSummary || ""),
                  coachSummary: {
                    overview: String(item?.coachSummary?.overview || fallback.coachSummary.overview),
                    high: String(item?.coachSummary?.high || fallback.coachSummary.high),
                    medium: String(item?.coachSummary?.medium || fallback.coachSummary.medium || "refine and stabilize"),
                    low: String(item?.coachSummary?.low || fallback.coachSummary.low),
                    goal: String(item?.coachSummary?.goal || fallback.coachSummary.goal)
                  }
                };
              });
              setPlans(sanitized);
            }
            if (typeof parsed.welcomeText === "string") setWelcomeText(parsed.welcomeText);
            if (typeof parsed.ppiDescription === "string") setPpiDesc(parsed.ppiDescription);
            if (typeof parsed.mpiDescription === "string") setMpiDesc(parsed.mpiDescription);
            if (typeof parsed.cpiDescription === "string") setCpiDesc(parsed.cpiDescription);
            if (typeof parsed.below5Text === "string") setBelow5(parsed.below5Text);
            if (typeof parsed.between5And7Text === "string") setBetween5And7(parsed.between5And7Text);
            if (typeof parsed.above7Text === "string") setAbove7(parsed.above7Text);
          }
        }
      } catch (err) {
        console.warn("Could not load dynamic help config, using local default:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  if (loading) {
    return <CricketLoader message="Loading Help & Information..." />;
  }

  const currentPlan = plans[selectedPlanIndex] || plans[0] || coachPlanData[0];
  const safeName = currentPlan?.name || "Parameter";
  const safeDescription = currentPlan?.description || "";
  const safeHighPoints = Array.isArray(currentPlan?.highPoints) ? currentPlan.highPoints.slice(0, 3) : [];
  const safeMediumPoints = Array.isArray(currentPlan?.mediumPoints) ? currentPlan.mediumPoints.slice(0, 3) : [];
  const safeLowPoints = Array.isArray(currentPlan?.lowPoints) ? currentPlan.lowPoints.slice(0, 3) : [];
  const activePoints = (scoreTab === "high" ? safeHighPoints : scoreTab === "medium" ? safeMediumPoints : safeLowPoints).slice(0, 3);
  const safeHighSummary = currentPlan?.highSummary || coachPlanData[selectedPlanIndex]?.highSummary || "";
  const safeMediumSummary = currentPlan?.mediumSummary || coachPlanData[selectedPlanIndex]?.mediumSummary || coachPlanData[0]?.mediumSummary || "";
  const safeLowSummary = currentPlan?.lowSummary || coachPlanData[selectedPlanIndex]?.lowSummary || "";
  const safeCoachSummary = currentPlan?.coachSummary || {
    overview: "Overview of parameter performance.",
    high: "protect and refine.",
    medium: "refine and stabilize.",
    low: "simplify and rebuild.",
    goal: "develop consistent performance under pressure."
  };

  return (
    <div className="space-y-6 pb-12 select-none max-w-2xl mx-auto text-left">
      
      {/* Title */}
      <div className="space-y-2 text-center">
        <h1 className="text-zinc-500 font-black tracking-widest text-xs uppercase">DOCUMENTATION</h1>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">HELP & INFORMATION</h2>
      </div>

      {/* Intro Card */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
        <p className="text-sm font-bold text-slate-900 leading-relaxed">
          {welcomeText}
        </p>
      </div>

      {/* ========================================== */}
      {/* THE COACH’S PLAN OF ACTION - INTERACTIVE SECTION */}
      {/* ========================================== */}
      <div className="bg-white border-2 border-orange-500/40 rounded-3xl p-5 space-y-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full pointer-events-none" />

        {/* Section Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-black flex items-center justify-center font-black">
            <BookOpen className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">THE COACH’S PLAN OF ACTION</h3>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Parameter Development Guide & Action Plans</p>
          </div>
        </div>

        {/* Parameter Selector Pills (Slider / Scrollable Tabs) */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Select Index Parameter:</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {plans.map((plan, idx) => (
              <button
                key={plan.id}
                onClick={() => { setSelectedPlanIndex(idx); setScoreTab("high"); }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase whitespace-nowrap transition-all cursor-pointer border ${
                  selectedPlanIndex === idx
                    ? "bg-orange-500 text-black border-orange-500 shadow-md scale-[1.02]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                {plan.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Parameter Details */}
        <div className="space-y-4 pt-1 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
            <span className="text-xs font-black text-orange-600 uppercase tracking-wider block">
              {safeName} Index Overview
            </span>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              {safeDescription}
            </p>
          </div>

          {/* High vs Medium vs Low Score Action Toggle */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1 sm:gap-1.5">
            <button
              onClick={() => setScoreTab("high")}
              className={`flex-1 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                scoreTab === "high"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              IF SCORE IS (&gt;7)
            </button>
            <button
              onClick={() => setScoreTab("medium")}
              className={`flex-1 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                scoreTab === "medium"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              IF SCORE IS (5 TO 7)
            </button>
            <button
              onClick={() => setScoreTab("low")}
              className={`flex-1 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                scoreTab === "low"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              IF SCORE IS (&lt;5)
            </button>
          </div>

          {/* Action Points Content */}
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider block text-slate-800">
              {scoreTab === "high" ? `High ${safeName} Score Action Points:` : scoreTab === "medium" ? `Medium ${safeName} Score Action Points:` : `Low ${safeName} Score Action Points:`}
            </span>
            <div className="space-y-2">
              {activePoints.map((pt, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex gap-3 items-start text-xs">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-black text-[10px] shrink-0 mt-0.5 ${
                    scoreTab === "high" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                    scoreTab === "medium" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                    "bg-rose-100 text-rose-800 border border-rose-300"
                  }`}>
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-black text-slate-900 block uppercase">{pt.title}</span>
                    <span className="font-medium text-slate-700 leading-relaxed">{pt.detail}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* High/Medium/Low Summary Banner */}
            {scoreTab === "high" && safeHighSummary && (
              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 text-xs font-semibold text-emerald-950 leading-relaxed italic">
                {safeHighSummary}
              </div>
            )}
            {scoreTab === "medium" && safeMediumSummary && (
              <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 text-xs font-semibold text-amber-950 leading-relaxed italic">
                {safeMediumSummary}
              </div>
            )}
            {scoreTab === "low" && safeLowSummary && (
              <div className="bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200 text-xs font-semibold text-rose-950 leading-relaxed italic">
                {safeLowSummary}
              </div>
            )}
          </div>

          {/* THE COACH’S SUMMARY BOX */}
          <div className="bg-slate-900 text-white p-4.5 rounded-2.5xl space-y-2.5 text-xs shadow-md">
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block">
              THE COACH’S SUMMARY — {safeName.toUpperCase()}
            </span>
            <p className="font-medium text-slate-200 leading-relaxed">
              {safeCoachSummary.overview}
            </p>
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <p><span className="text-emerald-400 font-bold uppercase">Elite Score:</span> <span className="text-slate-300 capitalize">{safeCoachSummary.high}</span></p>
              <p><span className="text-amber-400 font-bold uppercase">Developing Score:</span> <span className="text-slate-300 capitalize">{safeCoachSummary.medium || "refine and stabilize."}</span></p>
              <p><span className="text-rose-400 font-bold uppercase">Priority Score:</span> <span className="text-slate-300 capitalize">{safeCoachSummary.low}</span></p>
              <p className="pt-1 text-orange-300 font-bold"><span className="uppercase text-orange-400">The goal:</span> {safeCoachSummary.goal}</p>
            </div>
          </div>
        </div>
      </div>

      {/* PPI Details */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <Clipboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase">Practice Performance (PPI)</h3>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Practice Assessment Index</p>
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-900 leading-relaxed">
          {ppiDesc}
        </p>
      </div>

      {/* MPI Details */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase">Match Performance (MPI)</h3>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Match Play Assessment Index</p>
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-900 leading-relaxed">
          {mpiDesc}
        </p>
      </div>

      {/* CPI Details */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase">Cricket Performance (CPI)</h3>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Overall Player Rating Index</p>
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-900 leading-relaxed">
          {cpiDesc}
        </p>
      </div>

      {/* HOW TO INTERPRET CPI SCORES (OUT OF 10) */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">HOW TO INTERPRET SCORES (OUT OF 10)</h3>
        <div className="space-y-4 pt-1">
          <div className="space-y-1 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-red-500 uppercase tracking-wider">BELOW 5.0</span>
              <span className="text-xs font-black text-slate-900 uppercase">- NEEDS ATTENTION</span>
            </div>
            <p className="text-xs font-medium text-slate-900 leading-relaxed">
              {below5}
            </p>
          </div>
          <div className="space-y-1 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-500 uppercase tracking-wider">5.0 TO 7.0</span>
              <span className="text-xs font-black text-slate-900 uppercase">- DEVELOPING</span>
            </div>
            <p className="text-xs font-medium text-slate-900 leading-relaxed">
              {between5And7}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-500 uppercase tracking-wider">7.0 AND ABOVE</span>
              <span className="text-xs font-black text-slate-900 uppercase">- STRONG</span>
            </div>
            <p className="text-xs font-medium text-slate-900 leading-relaxed">
              {above7}
            </p>
          </div>
        </div>
      </div>

      {/* Restart Tour */}
      <button
        onClick={() => {
          localStorage.setItem("cpi_onboarding_completed", "false");
          localStorage.setItem("cpi_players_tour_completed", "false");
          window.location.href = "/dashboard";
        }}
        className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-4.5 text-base font-black flex items-center justify-center gap-2 transition-all border border-orange-450 cursor-pointer uppercase"
      >
        Restart Tour
      </button>

      {/* Back to Profile */}
      <Link
        href="/profile"
        className="w-full bg-slate-100 hover:bg-slate-100 text-slate-900 rounded-2xl py-4.5 text-base font-extrabold flex items-center justify-center gap-2 transition-all border border-slate-200 cursor-pointer text-center block"
      >
        BACK TO PROFILE
      </Link>

    </div>
  );
}
