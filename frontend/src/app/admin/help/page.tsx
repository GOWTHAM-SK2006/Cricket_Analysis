"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle, Save, RotateCcw, Loader2, Info, BookOpen, Layers, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useAdminToast } from "../layout";
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

interface FullHelpConfig {
  welcomeText?: string;
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
    name: "Technique",
    description: "The Technique Index measures how strong a player's basic technique is during practice and matches.",
    highPoints: [
      { title: "Fundamentals Are Reliable", detail: "Fundamentals Are Reliable" },
      { title: "Technique Holds Up", detail: "Technique Holds Up" },
      { title: "Movement Is Consistent", detail: "Movement Is Consistent" },
      { title: "Self-Correction Is Strong", detail: "Self-Correction Is Strong" },
      { title: "Technique Enables Performance", detail: "Technique Enables Performance" }
    ],
    highSummary: "An elite score (7–10) shows reliable fundamentals, consistent movement, and strong self-correction under pressure. Technique enables high-level performance.",
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
    highSummary: "An elite score (7–10) shows a broad, adaptable skill set that holds under pressure, enabling advanced development and game control.",
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
    highSummary: "An elite score (7–10) shows a clear strategy and purpose that fits every role and situation, allowing the player to stay ahead of the game.",
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
    highSummary: "An elite score (7–10) shows consistent, player-led physical, mental, and tactical preparation before every session and match.",
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
    highSummary: "An elite score (7–10) shows consistent intensity, high work rate, and self-driven standards where pressure raises competitive engagement.",
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
    highSummary: "An elite score (7–10) shows present ball-by-ball concentration, fast mental resets, and total filtering of external distractions.",
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
    highSummary: "An elite score (7–10) shows constructive response to adversity, holding composure and stable confidence while protecting the next moment independently.",
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

const DEFAULT_WELCOME_TEXT = "Welcome to the Cricket Performance Index (CPI) platform. This guide explains how our index works, how to interpret scores on an out-of-10 scale, and provides the complete Coach’s Plan of Action for player development.";

const DEFAULT_FULL_HELP: FullHelpConfig = {
  welcomeText: DEFAULT_WELCOME_TEXT,
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

  const parseHelpJson = (raw: any): FullHelpConfig | null => {
    if (!raw) return null;
    try {
      let parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const rawData = Array.isArray(parsed.coachPlanData) && parsed.coachPlanData.length > 0
          ? parsed.coachPlanData
          : (Array.isArray(parsed.coachPlan) ? parsed.coachPlan : null);

        const sanitizedPlans = DEFAULT_COACH_PLAN_DATA.map((defPlan, idx) => {
          const item = (rawData && rawData[idx]) ? rawData[idx] : {};
          return {
            ...defPlan,
            ...item,
            id: item.id || defPlan.id,
            name: item.name || defPlan.name,
            description: item.description || defPlan.description,
            highPoints: Array.isArray(item.highPoints) && item.highPoints.length > 0 ? item.highPoints.slice(0, 3) : defPlan.highPoints.slice(0, 3),
            mediumPoints: Array.isArray(item.mediumPoints) && item.mediumPoints.length > 0 ? item.mediumPoints.slice(0, 3) : (defPlan.mediumPoints?.slice(0, 3) || []),
            lowPoints: Array.isArray(item.lowPoints) && item.lowPoints.length > 0 ? item.lowPoints.slice(0, 3) : defPlan.lowPoints.slice(0, 3),
            highSummary: item.highSummary || defPlan.highSummary,
            mediumSummary: item.mediumSummary || defPlan.mediumSummary,
            lowSummary: item.lowSummary || defPlan.lowSummary,
            coachSummary: {
              overview: item.coachSummary?.overview || defPlan.coachSummary.overview,
              high: item.coachSummary?.high || defPlan.coachSummary.high,
              medium: item.coachSummary?.medium || defPlan.coachSummary.medium,
              low: item.coachSummary?.low || defPlan.coachSummary.low,
              goal: item.coachSummary?.goal || defPlan.coachSummary.goal
            }
          };
        });

        return {
          welcomeText: parsed.welcomeText ?? DEFAULT_FULL_HELP.welcomeText,
          coachPlanData: sanitizedPlans,
          ppiDescription: parsed.ppiDescription ?? DEFAULT_FULL_HELP.ppiDescription,
          mpiDescription: parsed.mpiDescription ?? DEFAULT_FULL_HELP.mpiDescription,
          cpiDescription: parsed.cpiDescription ?? DEFAULT_FULL_HELP.cpiDescription,
          below5Text: parsed.below5Text ?? DEFAULT_FULL_HELP.below5Text,
          between5And7Text: parsed.between5And7Text ?? DEFAULT_FULL_HELP.between5And7Text,
          above7Text: parsed.above7Text ?? DEFAULT_FULL_HELP.above7Text,
        };
      }
    } catch (e) {
      console.error("Error parsing helpJson", e);
    }
    return null;
  };

  useEffect(() => {
    fetchHelpConfig();
  }, []);

  const fetchHelpConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token") || localStorage.getItem("token");
      const res = await fetch("/api/admin/config", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFullConfigRaw(data);
        if (data.helpJson) {
          const parsed = parseHelpJson(data.helpJson);
          if (parsed) {
            setHelpConfig(parsed);
          }
        }
      }
    } catch (err) {
      showToast("Could not fetch Help & Information configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = helpConfig.coachPlanData[selectedPlanIndex] || DEFAULT_COACH_PLAN_DATA[selectedPlanIndex] || DEFAULT_COACH_PLAN_DATA[0];
  const defaultFallbackPlan = DEFAULT_COACH_PLAN_DATA[selectedPlanIndex] || DEFAULT_COACH_PLAN_DATA[0];

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
    const pointsKey = (tab === "high" ? "highPoints" : tab === "medium" ? "mediumPoints" : "lowPoints") as keyof Pick<CoachPlanItem, "highPoints" | "mediumPoints" | "lowPoints">;
    const points = [...((plan[pointsKey] as ActionPoint[] | undefined) || (defaultFallbackPlan[pointsKey] as ActionPoint[] | undefined) || [])];
    points[index] = { ...points[index], [field]: val };
    (plan as any)[pointsKey] = points;
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
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token") || localStorage.getItem("token");
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

      const data = await res.json();
      setFullConfigRaw(data);
      if (data.helpJson) {
        const parsed = parseHelpJson(data.helpJson);
        if (parsed) {
          setHelpConfig(parsed);
        }
      }

      showToast("Coach Help & Information content saved and synchronized!", "success");
    } catch (err: any) {
      showToast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <CricketLoader message="Loading Coach Help Governance..." />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left select-none">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Coach Help & Information Governance</h1>
            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wider border border-orange-200">
              Direct Sync to Coach App (/help)
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Manage the Coach's Plan of Action, index descriptions, 3-point action items, summary callouts, and out-of-10 score interpretation guides.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setHelpConfig(DEFAULT_FULL_HELP)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-2xl transition-all cursor-pointer border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black rounded-2xl shadow-md shadow-orange-600/30 transition-all disabled:opacity-50 uppercase cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Help Content</span>
          </button>
        </div>
      </div>

      {/* Editor Grid: Left Parameter List, Right Rich Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Parameter Selector */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-2">
          <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1">
            Select Coach Plan Parameter:
          </div>
          <div className="space-y-2">
            {helpConfig.coachPlanData.map((plan, idx) => {
              const isActive = idx === selectedPlanIndex;
              return (
                <button
                  key={plan.id}
                  onClick={() => { setSelectedPlanIndex(idx); setScoreTab("high"); }}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between border cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-orange-500/30"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/80"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shrink-0 ${
                        isActive ? "bg-orange-500 text-black shadow-xs" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-black text-xs leading-snug truncate uppercase">{plan.name}</p>
                      <p className={`text-[10px] truncate font-medium ${isActive ? "text-slate-400" : "text-slate-500"}`}>
                        {plan.description}
                      </p>
                    </div>
                  </div>
                  {isActive && <BookOpen className="w-4 h-4 text-orange-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Editor Form */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-2xl bg-orange-500 text-black font-black text-xs flex items-center justify-center shadow-xs">
                #{selectedPlanIndex + 1}
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Coach's Plan of Action — {currentPlan.name}</h2>
                <p className="text-xs text-slate-500 font-medium">Edit parameter overview, action points, and summary box</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wider">
              Parameter #{selectedPlanIndex + 1}
            </span>
          </div>

          {/* 1. Parameter Description */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
              1. Parameter Overview Description
            </label>
            <textarea
              rows={3}
              value={currentPlan.description}
              onChange={(e) => updateCurrentPlanField("description", e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
            />
          </div>

          {/* 2. High vs Medium vs Low Score Action Points Toggle */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                2. 3-Point Action Plans ({scoreTab === "high" ? "High Score >7" : scoreTab === "medium" ? "Medium Score 5 to 7" : "Low Score <5"})
              </label>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
                <button
                  onClick={() => setScoreTab("high")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                    scoreTab === "high" ? "bg-emerald-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  If Score is (&gt;7)
                </button>
                <button
                  onClick={() => setScoreTab("medium")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                    scoreTab === "medium" ? "bg-amber-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  If Score is (5 to 7)
                </button>
                <button
                  onClick={() => setScoreTab("low")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                    scoreTab === "low" ? "bg-rose-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  If Score is (&lt;5)
                </button>
              </div>
            </div>

            {/* 5 Action Points / Benchmarks */}
            <div className="space-y-3">
              {(scoreTab === "high"
                ? (currentPlan.highPoints || defaultFallbackPlan.highPoints)
                : scoreTab === "medium"
                ? (currentPlan.mediumPoints || defaultFallbackPlan.mediumPoints || [])
                : (currentPlan.lowPoints || defaultFallbackPlan.lowPoints)
              ).slice(0, 10).map((pt, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                      scoreTab === "high" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                      scoreTab === "medium" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                      "bg-rose-100 text-rose-800 border border-rose-300"
                    }`}>
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={pt.title}
                      onChange={(e) => updateActionPoint(scoreTab, i, "title", e.target.value)}
                      placeholder="Point Title"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-1.5 text-xs font-black text-slate-900 uppercase focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={pt.detail}
                    onChange={(e) => updateActionPoint(scoreTab, i, "detail", e.target.value)}
                    placeholder="Point Explanation Detail"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed"
                  />
                </div>
              ))}
            </div>

            {/* High Summary Banner text */}
            {scoreTab === "high" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-emerald-800 uppercase tracking-wider">
                  High Score Green Summary Banner Text
                </label>
                <textarea
                  rows={2}
                  value={currentPlan.highSummary || defaultFallbackPlan.highSummary}
                  onChange={(e) => updateCurrentPlanField("highSummary", e.target.value)}
                  className="w-full bg-emerald-50/80 border border-emerald-300 rounded-2xl p-4 text-xs font-semibold text-emerald-950 leading-relaxed italic focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}
            {/* Medium Summary Banner text */}
            {scoreTab === "medium" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-amber-800 uppercase tracking-wider">
                  Medium Score Amber Summary Banner Text
                </label>
                <textarea
                  rows={2}
                  value={currentPlan.mediumSummary || defaultFallbackPlan.mediumSummary || "A medium score shows functional performance requiring greater consistency under match pressure."}
                  onChange={(e) => updateCurrentPlanField("mediumSummary", e.target.value)}
                  className="w-full bg-amber-50/80 border border-amber-300 rounded-2xl p-4 text-xs font-semibold text-amber-950 leading-relaxed italic focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            )}
            {/* Low Summary Banner text */}
            {scoreTab === "low" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-rose-800 uppercase tracking-wider">
                  Low Score Red Summary Banner Text
                </label>
                <textarea
                  rows={2}
                  value={currentPlan.lowSummary || defaultFallbackPlan.lowSummary}
                  onChange={(e) => updateCurrentPlanField("lowSummary", e.target.value)}
                  className="w-full bg-rose-50/80 border border-rose-300 rounded-2xl p-4 text-xs font-semibold text-rose-950 leading-relaxed italic focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            )}
          </div>

          {/* 3. The Coach's Summary Box */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
              3. The Coach's Summary Box — {currentPlan.name}
            </label>
            <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-4 border border-slate-800 shadow-md">
              <div>
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-1">Summary Overview</span>
                <textarea
                  rows={2}
                  value={currentPlan.coachSummary.overview}
                  onChange={(e) => updateCoachSummaryField("overview", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-xs font-medium text-slate-100 focus:outline-none focus:border-orange-500 leading-relaxed"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Elite Score Directive</span>
                  <input
                    type="text"
                    value={currentPlan.coachSummary.high}
                    onChange={(e) => updateCoachSummaryField("high", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-1">Developing Score Directive</span>
                  <input
                    type="text"
                    value={currentPlan.coachSummary.medium || defaultFallbackPlan.coachSummary.medium || "refine and stabilize."}
                    onChange={(e) => updateCoachSummaryField("medium", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Priority Score Directive</span>
                  <input
                    type="text"
                    value={currentPlan.coachSummary.low}
                    onChange={(e) => updateCoachSummaryField("low", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-black text-orange-300 uppercase tracking-widest block mb-1">The Goal Directive</span>
                <input
                  type="text"
                  value={currentPlan.coachSummary.goal}
                  onChange={(e) => updateCoachSummaryField("goal", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              Edits automatically update on the Coach Help page.
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black rounded-2xl shadow-md shadow-orange-600/30 transition-all disabled:opacity-50 uppercase cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Help Content</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Help Sections (Welcome Content, PPI, MPI, CPI & Score Interpretation) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-orange-600" />
            <span>4. Welcome Banner, Index Descriptions & Score Interpretation Texts</span>
          </h2>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase">Global Card Texts</span>
        </div>

        {/* Welcome & Overview Intro Banner Text */}
        <div className="space-y-1.5 pb-4 border-b border-slate-100">
          <label className="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>Welcome & Overview Intro Text (Top Banner on /help)</span>
            <span className="text-[10px] text-orange-500 font-bold uppercase">Main Help Header Text</span>
          </label>
          <textarea
            rows={3}
            value={helpConfig.welcomeText || DEFAULT_WELCOME_TEXT}
            onChange={(e) => setHelpConfig({ ...helpConfig, welcomeText: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Practice Performance (PPI) Text</span>
              <span className="text-[10px] text-slate-400 font-bold">Practice Index</span>
            </label>
            <textarea
              rows={7}
              value={helpConfig.ppiDescription}
              onChange={(e) => setHelpConfig({ ...helpConfig, ppiDescription: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Match Performance (MPI) Text</span>
              <span className="text-[10px] text-slate-400 font-bold">Match Index</span>
            </label>
            <textarea
              rows={7}
              value={helpConfig.mpiDescription}
              onChange={(e) => setHelpConfig({ ...helpConfig, mpiDescription: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Cricket Performance (CPI) Text</span>
              <span className="text-[10px] text-slate-400 font-bold">Overall Rating Index</span>
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
          <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
            5. How to Interpret Scores (Out of 10) Texts
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black text-red-500 block uppercase tracking-wide">
                Below 5.0 - Needs Attention
              </span>
              <textarea
                rows={5}
                value={helpConfig.below5Text}
                onChange={(e) => setHelpConfig({ ...helpConfig, below5Text: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-black text-amber-500 block uppercase tracking-wide">
                5.0 to 7.0 - Developing
              </span>
              <textarea
                rows={5}
                value={helpConfig.between5And7Text}
                onChange={(e) => setHelpConfig({ ...helpConfig, between5And7Text: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-black text-emerald-500 block uppercase tracking-wide">
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
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black rounded-2xl shadow-md shadow-orange-600/30 transition-all disabled:opacity-50 uppercase cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Help Content</span>
          </button>
        </div>
      </div>
    </div>
  );
}
