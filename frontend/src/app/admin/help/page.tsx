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

import { CPI_PREDEFINED_SOURCE, ApprovedCpiParameter } from "@/lib/cpiPredefinedSource";

const buildDefaultCoachPlanDataFromSource = (): CoachPlanItem[] => {
  return (Object.keys(CPI_PREDEFINED_SOURCE) as ApprovedCpiParameter[]).map((paramName) => {
    const src = CPI_PREDEFINED_SOURCE[paramName];
    const pHigh = src.practice.high;
    const pLow = src.practice.low;
    
    return {
      id: paramName.toLowerCase().replace(/\s+/g, "_"),
      name: paramName,
      description: src.description,
      highPoints: pHigh.actionPoints.map((pt) => {
        const parts = pt.split(". ");
        return { title: parts[0] || pt, detail: parts.slice(1).join(". ") || pt };
      }),
      highSummary: pHigh.summary,
      lowPoints: pLow.actionPoints.map((pt) => {
        const parts = pt.split(". ");
        return { title: parts[0] || pt, detail: parts.slice(1).join(". ") || pt };
      }),
      lowSummary: pLow.summary,
      coachSummary: {
        overview: src.practice.overview,
        high: pHigh.summary,
        low: pLow.summary,
        goal: src.practice.goal
      }
    };
  });
};

const DEFAULT_COACH_PLAN_DATA: CoachPlanItem[] = buildDefaultCoachPlanDataFromSource();

const DEFAULT_WELCOME_TEXT = "Welcome to the Cricket Performance Index (CPI) platform. This guide explains how our index works, how to interpret scores on an out-of-10 scale, and provides the complete Coach’s Plan of Action for player development.";

const DEFAULT_FULL_HELP: FullHelpConfig = {
  welcomeText: DEFAULT_WELCOME_TEXT,
  coachPlanData: DEFAULT_COACH_PLAN_DATA,
  ppiDescription: "The Practice Performance Index (PPI) is a structured coaching tool used to assess how effectively a young cricketer trains and develops during practice. It measures performance across key areas on a 0 – 10 scale: technique, intensity, execution, adaptability, discipline, concentration, coachability and preparation.",
  mpiDescription: "The Match Performance Index is a structured coaching tool used to assess how effectively a young cricketer performs and responds during competitive play on a 0 – 10 scale. It measures key areas such as technique, decision making, game awareness, resilience, emotional control, teamwork, match impact and preparation.",
  cpiDescription: "The Cricket Performance Index (CPI) is a structured coaching tool built around one simple truth: how you practise is how you will play. By measuring key performance areas in both practice and matches on a 0 – 10 scale, the CPI shows what is transferring, where performance is breaking down and what is holding a player back.",
  below5Text: "Performance is being limited in one or more key areas. Identify the main cause and make it a coaching priority.",
  between5And7Text: "There are positive signs, but performance is still inconsistent. Focus on improving consistency and transfer into matches.",
  above7Text: "Performance is strong across the key areas. Protect what is working, maintain standards and continue to challenge the player."
};

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

      const isOldPts = (pts: any[]) => {
        if (!Array.isArray(pts) || pts.length !== 5) return true;
        const t = String(pts[0]?.title || "").toUpperCase();
        return t.includes("PRESSURE") || t.includes("IDENTIFY") || t.includes("REFINE") || t.includes("EXPAND") || t.includes("CONSOLIDATE") || t.includes("AUTOMATE") || t.includes("CHANNEL");
      };

      const sanitizedPlans = DEFAULT_COACH_PLAN_DATA.map((defPlan, idx) => {
        const item = (rawData && rawData[idx]) ? rawData[idx] : {};
        return {
          ...defPlan,
          ...item,
          id: item.id || defPlan.id,
          name: item.name || defPlan.name,
          description: item.description || defPlan.description,
          highPoints: !isOldPts(item.highPoints) ? item.highPoints : defPlan.highPoints,
          mediumPoints: !isOldPts(item.mediumPoints) ? item.mediumPoints : (defPlan.mediumPoints || []),
          lowPoints: !isOldPts(item.lowPoints) ? item.lowPoints : defPlan.lowPoints,
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

export default function AdminHelpPage() {
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [helpConfig, setHelpConfig] = useState<FullHelpConfig>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cpi_help_config");
        if (cached) {
          const parsed = parseHelpJson(cached);
          if (parsed) return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_FULL_HELP;
  });
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
  const [scoreTab, setScoreTab] = useState<"high" | "medium" | "low">("high");
  const [fullConfigRaw, setFullConfigRaw] = useState<any>({});

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
            try {
              localStorage.setItem("cpi_help_config", typeof data.helpJson === "string" ? data.helpJson : JSON.stringify(data.helpJson));
            } catch (e) {}
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
      localStorage.setItem("cpi_help_config", JSON.stringify(helpConfig));
    } catch (e) {}

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

      if (!res.ok) {
        const errText = await res.text();
        let msg = "Failed to save Help & Information configuration";
        try {
          const errJson = JSON.parse(errText);
          if (errJson.message) msg = errJson.message;
        } catch (e) {}
        throw new Error(msg);
      }

      const data = await res.json();
      setFullConfigRaw(data);
      if (data.helpJson) {
        const parsed = parseHelpJson(data.helpJson);
        if (parsed) {
          setHelpConfig(parsed);
          try {
            localStorage.setItem("cpi_help_config", typeof data.helpJson === "string" ? data.helpJson : JSON.stringify(data.helpJson));
          } catch (e) {}
        }
      }

      showToast("Coach Help & Information content saved and synchronized!", "success");
    } catch (err: any) {
      showToast(err.message || "Saved locally! Server sync pending.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading && typeof window !== "undefined" && !localStorage.getItem("cpi_help_config")) {
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
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">What to Look for When Scoring a Player — {currentPlan.name}</h2>
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
                  A SCORE (&gt;7)
                </button>
                <button
                  onClick={() => setScoreTab("medium")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                    scoreTab === "medium" ? "bg-amber-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  A SCORE (5-7)
                </button>
                <button
                  onClick={() => setScoreTab("low")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                    scoreTab === "low" ? "bg-rose-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  A SCORE (&lt;5)
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
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Strong Score Directive</span>
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
            value={helpConfig.welcomeText ?? DEFAULT_WELCOME_TEXT}
            onChange={(e) => setHelpConfig({ ...helpConfig, welcomeText: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Practice Performance Index (PPI) Text</span>
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
              <span>Match Performance Index (MPI) Text</span>
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
              <span>Cricket Performance Index (CPI) Text</span>
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
                Below 5.0 - Low
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
                5.0 to 7.0 - Average
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
                7.0 and Above - High
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
