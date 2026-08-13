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
    name: "Technique",
    description: "The Technique Index measures how strong a player's basic technique is during practice and matches.",
    highPoints: [
      { title: "Fundamentals Are Reliable", detail: "Fundamentals Are Reliable" },
      { title: "Technique Holds Up", detail: "Technique Holds Up" },
      { title: "Movement Is Consistent", detail: "Movement Is Consistent" },
      { title: "Self-Correction Is Strong", detail: "Self-Correction Is Strong" },
      { title: "Technique Enables Performance", detail: "Technique Enables Performance" }
    ],
    highSummary: "A strong score (7–10) shows reliable fundamentals, consistent movement, and strong self-correction under pressure. Technique enables high-level performance.",
    mediumPoints: [
      { title: "Basics Are Sound", detail: "Basics Are Sound" },
      { title: "Execution Is Improving", detail: "Execution Is Improving" },
      { title: "Pressure Causes Drift", detail: "Pressure Causes Drift" },
      { title: "Gaps Are Specific", detail: "Gaps Are Specific" },
      { title: "Transfer Is Good", detail: "Transfer Is Good" }
    ],
    mediumSummary: "A developing score (5–7) shows sound basics with execution improving, though pressure can cause drift. Focus on specific technical gaps and consistent match transfer.",
    lowPoints: [
      { title: "Basics Break Down", detail: "Basics Break Down" },
      { title: "Movement Lacks Control", detail: "Movement Lacks Control" },
      { title: "Pressure Exposes Faults", detail: "Pressure Exposes Faults" },
      { title: "Faults Keep Returning", detail: "Faults Keep Returning" },
      { title: "Technique Limits Performance", detail: "Technique Limits Performance" }
    ],
    lowSummary: "A score needing attention (0–5) shows that basic technique breaks down under pressure and limits performance. Focus on controlled movement and fundamental mechanics.",
    coachSummary: {
      overview: "The Technique Index measures how strong a player's basic technique is during practice and matches.",
      high: "Fundamentals are reliable, technique holds up, and self-correction is strong.",
      medium: "Basics are sound and execution is improving, but pressure can cause drift.",
      low: "Basics break down under pressure, movement lacks control, and technique limits performance.",
      goal: "Technique enables performance through reliable, consistent fundamentals under match pressure."
    }
  },
  {
    id: "skill_level",
    name: "Skill Level",
    description: "The Skill Level Index measures the quality and range of a player's skills during practice and matches.",
    highPoints: [
      { title: "Broad Skill Set", detail: "Broad Skill Set" },
      { title: "Skills Are Reliable", detail: "Skills Are Reliable" },
      { title: "Skills Hold Under Pressure", detail: "Skills Hold Under Pressure" },
      { title: "Skills Are Adaptable", detail: "Skills Are Adaptable" },
      { title: "Advanced Development Is Possible", detail: "Advanced Development Is Possible" }
    ],
    highSummary: "A strong score (7–10) shows a broad, adaptable skill set that holds under pressure, enabling advanced development and game control.",
    mediumPoints: [
      { title: "Good Core Skills", detail: "Good Core Skills" },
      { title: "Attack and Defence Are Developing", detail: "Attack and Defence Are Developing" },
      { title: "Range Needs Expanding", detail: "Range Needs Expanding" },
      { title: "Application Is Inconsistent", detail: "Application Is Inconsistent" },
      { title: "Adaptability Is Growing", detail: "Adaptability Is Growing" }
    ],
    mediumSummary: "A developing score (5–7) shows good core skills with growing adaptability, but range needs expansion and application remains inconsistent.",
    lowPoints: [
      { title: "Skill Set Is Limited", detail: "Skill Set Is Limited" },
      { title: "Core Skills Are Unreliable", detail: "Core Skills Are Unreliable" },
      { title: "Options Are Limited", detail: "Options Are Limited" },
      { title: "Pressure Reduces Skill", detail: "Pressure Reduces Skill" },
      { title: "Below Current Requirement", detail: "Below Current Requirement" }
    ],
    lowSummary: "A score needing attention (0–5) shows a limited skill set with unreliable core skills under pressure. Focus on core skill repetition and building options.",
    coachSummary: {
      overview: "The Skill Level Index measures the quality and range of a player's skills during practice and matches.",
      high: "Broad, reliable skill set that holds under pressure and adapts quickly.",
      medium: "Good core skills with growing adaptability, but range needs expanding.",
      low: "Skill set is limited, core skills are unreliable, and pressure reduces execution.",
      goal: "Build a broad, versatile skill set that remains reliable under match pressure."
    }
  },
  {
    id: "gameplan",
    name: "Game Plan",
    description: "The Game Plan Index measures whether the player has a clear and effective plan to train, practice and compete.",
    highPoints: [
      { title: "Clear Strategy and Purpose", detail: "Clear Strategy and Purpose" },
      { title: "Plan Fits the Situation and Role", detail: "Plan Fits the Situation and Role" },
      { title: "Stays Ahead of the Game", detail: "Stays Ahead of the Game" },
      { title: "Adapts Quickly", detail: "Adapts Quickly" },
      { title: "Thinks Independently", detail: "Thinks Independently" }
    ],
    highSummary: "A strong score (7–10) shows a clear strategy and purpose that fits every role and situation, allowing the player to stay ahead of the game.",
    mediumPoints: [
      { title: "Basic Plan Is Evident", detail: "Basic Plan Is Evident" },
      { title: "Role Awareness Is Good", detail: "Role Awareness Is Good" },
      { title: "Plan Works in Periods", detail: "Plan Works in Periods" },
      { title: "Adjustment Can Be Slow", detail: "Adjustment Can Be Slow" },
      { title: "Independent Thinking Is Growing", detail: "Independent Thinking Is Growing" }
    ],
    mediumSummary: "A developing score (5–7) shows good role awareness and a basic plan that works in periods, though in-game tactical adjustments can be slow.",
    lowPoints: [
      { title: "No Clear Plan", detail: "No Clear Plan" },
      { title: "Role Is Unclear", detail: "Role Is Unclear" },
      { title: "Mostly Reactive", detail: "Mostly Reactive" },
      { title: "Plan Does Not Fit Role", detail: "Plan Does Not Fit Role" },
      { title: "Relies on Instruction", detail: "Relies on Instruction" }
    ],
    lowSummary: "A score needing attention (0–5) shows an unclear role and reactive play, relying heavily on coach instruction. Focus on defining a simple match strategy.",
    coachSummary: {
      overview: "The Game Plan Index measures whether the player has a clear and effective plan to train, practice and compete.",
      high: "Clear strategy and purpose, stays ahead of the game, and adapts quickly.",
      medium: "Basic plan is evident with good role awareness, but tactical adjustments can be slow.",
      low: "No clear plan, role is unclear, mostly reactive, and relies heavily on instruction.",
      goal: "Develop independent tactical thinking with a clear strategy that fits every game situation."
    }
  },
  {
    id: "preparation",
    name: "Preparation",
    description: "The Preparation Index measures how well the player prepares physically and mentally for practices and matches.",
    highPoints: [
      { title: "Preparation Is Consistent", detail: "Preparation Is Consistent" },
      { title: "Physically Ready", detail: "Physically Ready" },
      { title: "Mentally Ready", detail: "Mentally Ready" },
      { title: "Tactically Prepared", detail: "Tactically Prepared" },
      { title: "Player-Led", detail: "Player-Led" }
    ],
    highSummary: "A strong score (7–10) shows consistent, player-led physical, mental, and tactical preparation before every session and match.",
    mediumPoints: [
      { title: "Basic Routine Exists", detail: "Basic Routine Exists" },
      { title: "Usually Ready to Perform", detail: "Usually Ready to Perform" },
      { title: "Some Tactical Preparation", detail: "Some Tactical Preparation" },
      { title: "Detail Is Inconsistent", detail: "Detail Is Inconsistent" },
      { title: "Ownership Is Growing", detail: "Ownership Is Growing" }
    ],
    mediumSummary: "A developing score (5–7) shows a basic routine with growing player ownership, though attention to preparation detail remains inconsistent.",
    lowPoints: [
      { title: "Physical Readiness Is Poor", detail: "Physical Readiness Is Poor" },
      { title: "Mental Readiness Is Low", detail: "Mental Readiness Is Low" },
      { title: "Little Tactical Thought", detail: "Little Tactical Thought" },
      { title: "Purpose Is Unclear", detail: "Purpose Is Unclear" },
      { title: "Coach Dependent", detail: "Coach Dependent" }
    ],
    lowSummary: "A score needing attention (0–5) shows poor physical/mental readiness and lack of tactical thought prior to play. Focus on basic pre-session routines.",
    coachSummary: {
      overview: "The Preparation Index measures how well the player prepares physically and mentally for practices and matches.",
      high: "Consistent, player-led preparation; physically, mentally, and tactically ready.",
      medium: "Basic routine exists and usually ready, with growing personal ownership.",
      low: "Physical and mental readiness is poor, purpose is unclear, and coach dependent.",
      goal: "Build player-led, consistent preparation routines for physical, mental, and tactical readiness."
    }
  },
  {
    id: "intensity",
    name: "Intensity",
    description: "The Intensity Index measures the mental focus and competitive intent the player brings to practices and matches.",
    highPoints: [
      { title: "Intensity Is Consistent", detail: "Intensity Is Consistent" },
      { title: "Work Rate Remains High", detail: "Work Rate Remains High" },
      { title: "No Distracted", detail: "No Distracted" },
      { title: "Pressure Raises Engagement", detail: "Pressure Raises Engagement" },
      { title: "Self-Driven Standards", detail: "Self-Driven Standards" }
    ],
    highSummary: "A strong score (7–10) shows consistent intensity, high work rate, and self-driven standards where pressure raises competitive engagement.",
    mediumPoints: [
      { title: "Generally Good Energy", detail: "Generally Good Energy" },
      { title: "Standards Occasionally Drop", detail: "Standards Occasionally Drop" },
      { title: "Fatigue Has an Effect", detail: "Fatigue Has an Effect" },
      { title: "Responds to Reminders", detail: "Responds to Reminders" },
      { title: "Consistency Is Growing", detail: "Consistency Is Growing" }
    ],
    mediumSummary: "A developing score (5–7) shows good energy and growing consistency, though fatigue can affect standards and occasional reminders are needed.",
    lowPoints: [
      { title: "Effort Is Inconsistent", detail: "Effort Is Inconsistent" },
      { title: "Energy Drops Easily", detail: "Energy Drops Easily" },
      { title: "Fatigue Reduces Standards", detail: "Fatigue Reduces Standards" },
      { title: "Competitive Intent Is Limited", detail: "Competitive Intent Is Limited" },
      { title: "Needs External Motivation", detail: "Needs External Motivation" }
    ],
    lowSummary: "A score needing attention (0–5) shows inconsistent effort, energy drops, and limited competitive intent without external motivation.",
    coachSummary: {
      overview: "The Intensity Index measures the mental focus and competitive intent the player brings to practices and matches.",
      high: "Consistent high work rate, focused without distraction, and self-driven standards under pressure.",
      medium: "Generally good energy with growing consistency, responding well to coach reminders.",
      low: "Inconsistent effort, energy drops easily under fatigue, requiring external motivation.",
      goal: "Maintain self-driven competitive intent and high intensity throughout every session and match."
    }
  },
  {
    id: "focus",
    name: "Focus",
    description: "The Focus Index measures the player’s ability to stay mentally present despite setbacks or distractions during practices and matches.",
    highPoints: [
      { title: "Present Ball by Ball", detail: "Present Ball by Ball" },
      { title: "Resets Quickly", detail: "Resets Quickly" },
      { title: "Filters Distractions", detail: "Filters Distractions" },
      { title: "Focus Lasts", detail: "Focus Lasts" },
      { title: "Self-Manages Attention", detail: "Self-Manages Attention" }
    ],
    highSummary: "A strong score (7–10) shows present ball-by-ball concentration, fast mental resets, and total filtering of external distractions.",
    mediumPoints: [
      { title: "Focus Is Generally Good", detail: "Focus Is Generally Good" },
      { title: "Concentration Can Drift", detail: "Concentration Can Drift" },
      { title: "Reset Takes Time", detail: "Reset Takes Time" },
      { title: "Pressure Tests Attention", detail: "Pressure Tests Attention" },
      { title: "Routines Are Developing", detail: "Routines Are Developing" }
    ],
    mediumSummary: "A developing score (5–7) shows generally good focus with developing reset routines, though concentration can drift under pressure.",
    lowPoints: [
      { title: "Attention Regularly Drifts", detail: "Attention Regularly Drifts" },
      { title: "Previous Moments Carry Over", detail: "Previous Moments Carry Over" },
      { title: "Reads Situation Poorly", detail: "Reads Situation Poorly" },
      { title: "Distractions Take Over", detail: "Distractions Take Over" },
      { title: "Needs Frequent Reminders", detail: "Needs Frequent Reminders" }
    ],
    lowSummary: "A score needing attention (0–5) shows regular attention drift, distraction, and carrying errors from previous balls.",
    coachSummary: {
      overview: "The Focus Index measures the player’s ability to stay mentally present despite setbacks or distractions during practices and matches.",
      high: "Present ball by ball, resets quickly, filters distractions, and self-manages attention.",
      medium: "Generally good focus with developing routines, though reset after error takes time.",
      low: "Attention regularly drifts, previous moments carry over, and distractions take over.",
      goal: "Stay mentally present ball by ball, filter distractions, and reset instantly after every error."
    }
  },
  {
    id: "resilience",
    name: "Resilience",
    description: "The Resilience Index measures how well a player responds when things don't go their way during practices and matches.",
    highPoints: [
      { title: "Responds Constructively", detail: "Responds Constructively" },
      { title: "Composure Holds", detail: "Composure Holds" },
      { title: "Confidence Remains Stable", detail: "Confidence Remains Stable" },
      { title: "Next Moment Is Protected", detail: "Next Moment Is Protected" },
      { title: "Recovers Independently", detail: "Recovers Independently" }
    ],
    highSummary: "A strong score (7–10) shows constructive response to adversity, holding composure and stable confidence while protecting the next moment independently.",
    mediumPoints: [
      { title: "Usually Recovers", detail: "Usually Recovers" },
      { title: "Temporary Drop-Off", detail: "Temporary Drop-Off" },
      { title: "Reset Habits Are Emerging", detail: "Reset Habits Are Emerging" },
      { title: "Certain Triggers Remain", detail: "Certain Triggers Remain" },
      { title: "Returns to the Contest", detail: "Returns to the Contest" }
    ],
    mediumSummary: "A developing score (5–7) shows the player usually recovers from setbacks with emerging reset habits, returning to the contest after temporary drop-offs.",
    lowPoints: [
      { title: "Setbacks Have a Visible Effect", detail: "Setbacks Have a Visible Effect" },
      { title: "Confidence Drops", detail: "Confidence Drops" },
      { title: "Mistakes Compound", detail: "Mistakes Compound" },
      { title: "Recovery Is Slow", detail: "Recovery Is Slow" },
      { title: "Needs External Support", detail: "Needs External Support" }
    ],
    lowSummary: "A score needing attention (0–5) shows visible emotional drop-off after setbacks, compounding errors, and slow recovery.",
    coachSummary: {
      overview: "The Resilience Index measures how well a player responds when things don't go their way during practices and matches.",
      high: "Responds constructively, composure holds, confidence remains stable, and recovers independently.",
      medium: "Usually recovers with emerging reset habits, returning to the contest after temporary drop-offs.",
      low: "Setbacks have a visible effect, confidence drops, mistakes compound, and recovery is slow.",
      goal: "Respond constructively to adversity, maintain emotional composure, and protect the next moment."
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
        let helpJsonStr: string | null = null;
        try {
          const res = await fetch("/api/public/config");
          if (res.ok) {
            const data = await res.json();
            if (data && data.helpJson) {
              helpJsonStr = typeof data.helpJson === "string" ? data.helpJson : JSON.stringify(data.helpJson);
            }
          }
        } catch (e) {}

        if (!helpJsonStr && typeof window !== "undefined") {
          helpJsonStr = localStorage.getItem("cpi_help_config");
        }

        if (helpJsonStr) {
          const parsed = typeof helpJsonStr === "string" ? JSON.parse(helpJsonStr) : helpJsonStr;
          if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed.coachPlanData) && parsed.coachPlanData.length > 0) {
              const sanitized = parsed.coachPlanData.map((item: any, i: number) => {
                const fallback = coachPlanData[i] || coachPlanData[0];
                const isOldPts = (pts: any[]) => {
                  if (!Array.isArray(pts) || pts.length !== 5) return true;
                  const t = String(pts[0]?.title || "").toUpperCase();
                  return t.includes("PRESSURE") || t.includes("IDENTIFY") || t.includes("REFINE") || t.includes("EXPAND") || t.includes("CONSOLIDATE") || t.includes("AUTOMATE") || t.includes("CHANNEL");
                };

                return {
                  id: String(item?.id || fallback.id),
                  name: String(item?.name || item?.parameter || fallback.name),
                  description: String(item?.description || item?.explanation || fallback.description),
                  highPoints: !isOldPts(item?.highPoints)
                    ? item.highPoints.map((pt: any, pIdx: number) => ({
                        title: String(pt?.title || fallback.highPoints[pIdx]?.title || "Benchmark Point"),
                        detail: String(pt?.detail || fallback.highPoints[pIdx]?.detail || "")
                      }))
                    : fallback.highPoints,
                  highSummary: String(item?.highSummary || item?.rangeHigh || fallback.highSummary),
                  mediumPoints: !isOldPts(item?.mediumPoints)
                    ? item.mediumPoints.map((pt: any, pIdx: number) => ({
                        title: String(pt?.title || fallback.mediumPoints?.[pIdx]?.title || "Benchmark Point"),
                        detail: String(pt?.detail || fallback.mediumPoints?.[pIdx]?.detail || "")
                      }))
                    : fallback.mediumPoints || [],
                  mediumSummary: String(item?.mediumSummary || fallback.mediumSummary || ""),
                  lowPoints: !isOldPts(item?.lowPoints)
                    ? item.lowPoints.map((pt: any, pIdx: number) => ({
                        title: String(pt?.title || fallback.lowPoints[pIdx]?.title || "Benchmark Point"),
                        detail: String(pt?.detail || fallback.lowPoints[pIdx]?.detail || "")
                      }))
                    : fallback.lowPoints,
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
  const safeHighPoints = Array.isArray(currentPlan?.highPoints) ? currentPlan.highPoints : [];
  const safeMediumPoints = Array.isArray(currentPlan?.mediumPoints) ? currentPlan.mediumPoints : [];
  const safeLowPoints = Array.isArray(currentPlan?.lowPoints) ? currentPlan.lowPoints : [];
  const activePoints = (scoreTab === "high" ? safeHighPoints : scoreTab === "medium" ? safeMediumPoints : safeLowPoints).slice(0, 10);
  const safeHighSummary = currentPlan?.highSummary || coachPlanData[selectedPlanIndex]?.highSummary || "";
  const safeMediumSummary = currentPlan?.mediumSummary || coachPlanData[selectedPlanIndex]?.mediumSummary || coachPlanData[0]?.mediumSummary || "";
  const safeLowSummary = currentPlan?.lowSummary || coachPlanData[selectedPlanIndex]?.lowSummary || "";
  const safeCoachSummary = currentPlan?.coachSummary || {
    overview: "Overview of parameter performance.",
    high: "protect and refine.",
    medium: "refine and stabilize.",
    low: "identify and rebuild.",
    goal: "develop consistent performance under pressure."
  };

  return (
    <div className="space-y-6 pb-12 text-left select-none max-w-lg mx-auto">
      
      {/* HEADER BANNER */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 text-left shadow-sm">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold text-[10px] tracking-widest uppercase border border-orange-500/20">
            FRAMEWORK AND ASSESSMENT GUIDE
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] uppercase tracking-tight leading-snug">
          WELCOME TO THE CRICKET PERFORMANCE INDEX (CPI)
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-3">
          {welcomeText}
        </p>
      </div>

      {/* THE COACH’S PLAN OF ACTION */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase">HOW TO SCORE A PLAYER</h3>
          </div>
        </div>

        {/* Parameter Selector Tabs */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block">
            THE 7 INDEX PARAMETERS
          </span>
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
          {/* BENCHMARK GUIDING PRINCIPLES SUMMARY */}
          <div className="bg-orange-50/80 border border-orange-200 p-4 rounded-2.5xl space-y-2 text-xs">
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block">
              SUMMARY GUIDING PRINCIPLES
            </span>
            <ul className="space-y-1.5 font-bold text-slate-900">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                Watch the pattern, not the moment
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                Score the evidence, not the impression
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                Have a clear reason what earned the score
              </li>
            </ul>
          </div>

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
                  : "text-slate-800 hover:text-slate-900"
              }`}
            >
              A SCORE (&gt;7)
            </button>
            <button
              onClick={() => setScoreTab("medium")}
              className={`flex-1 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                scoreTab === "medium"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-800 hover:text-slate-900"
              }`}
            >
              A SCORE (5-7)
            </button>
            <button
              onClick={() => setScoreTab("low")}
              className={`flex-1 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                scoreTab === "low"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-800 hover:text-slate-900"
              }`}
            >
              A SCORE (&lt;5)
            </button>
          </div>

          {/* Action Points Content */}
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider block text-slate-800">
              {scoreTab === "high" ? `STRONG ${safeName.toUpperCase()} BENCHMARKS:` : scoreTab === "medium" ? `DEVELOPING ${safeName.toUpperCase()} BENCHMARKS:` : `LOW ${safeName.toUpperCase()} BENCHMARKS:`}
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
                    {pt.detail && pt.detail.trim().toLowerCase() !== pt.title.trim().toLowerCase() && (
                      <span className="font-medium text-slate-700 leading-relaxed">{pt.detail}</span>
                    )}
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
              <p><span className="text-emerald-400 font-bold uppercase">Strong Score:</span> <span className="text-slate-300 capitalize">{safeCoachSummary.high}</span></p>
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
