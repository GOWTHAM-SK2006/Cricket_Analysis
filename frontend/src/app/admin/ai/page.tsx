"use client";

import React, { useState, useEffect } from "react";
import { Bot, Save, RotateCcw, Loader2, Sparkles, ShieldCheck, Layers, Award, CheckCircle2, AlertTriangle, BookOpen } from "lucide-react";
import { useAdminToast } from "../layout";
import CricketLoader from "@/components/CricketLoader";
import { 
  CPI_PREDEFINED_SOURCE, 
  APPROVED_CPI_7_PARAMETERS, 
  ApprovedCpiParameter, 
  DISPLAY_PARAMETER_NAMES 
} from "@/lib/cpiPredefinedSource";

export interface ParameterEditorItem {
  name: string;
  keyName: ApprovedCpiParameter;
  description: string;
  howToCoach: string;
  highActionPoints: string[];
  highSummary: string;
  lowActionPoints: string[];
  lowSummary: string;
  goal?: string;
}

export interface AiCoachConfig {
  systemInstructions: string;
  coachingTone: string;
  responseGuidance: string;
  recommendationBehaviour: string;
  practiceParameters: Record<ApprovedCpiParameter, ParameterEditorItem>;
  matchParameters: Record<ApprovedCpiParameter, ParameterEditorItem>;
}

const DEFAULT_GLOBAL_DIRECTIVES = {
  systemInstructions: "You are the CPI AI Head Performance Analyst. Provide objective, evidence-based performance feedback for cricket players using ONLY the exact wording from the CPI 7-parameter framework.",
  coachingTone: "Professional, encouraging, analytical, and actionable.",
  responseGuidance: "Format outputs clearly using exact parameter headings (HOW TO COACH TECHNIQUE, HOW TO COACH SKILL LEVEL, HOW TO COACH GAME PLAN, HOW TO COACH PREPARATION, HOW TO COACH INTENSITY, HOW TO COACH FOCUS, HOW TO COACH RESILIENCE).",
  recommendationBehaviour: "Outputs must contain ONLY exact sentences from CPI_7_Parameters_Practice_And_Match_Separate.txt. Do not paraphrase or add new wording."
};

const buildDefaultParameterMap = (context: "practice" | "match"): Record<ApprovedCpiParameter, ParameterEditorItem> => {
  const map: any = {};
  APPROVED_CPI_7_PARAMETERS.forEach((param) => {
    const src = CPI_PREDEFINED_SOURCE[param];
    const block = src[context];
    map[param] = {
      name: DISPLAY_PARAMETER_NAMES[param] || param,
      keyName: param,
      description: src.description,
      howToCoach: block.overview || src.description,
      highActionPoints: [...block.high.actionPoints],
      highSummary: block.high.summary,
      lowActionPoints: [...block.low.actionPoints],
      lowSummary: block.low.summary,
      goal: block.goal
    };
  });
  return map;
};

const DEFAULT_AI_COACH: AiCoachConfig = {
  ...DEFAULT_GLOBAL_DIRECTIVES,
  practiceParameters: buildDefaultParameterMap("practice"),
  matchParameters: buildDefaultParameterMap("match")
};

const parseAiConfig = (jsonStr: any): AiCoachConfig => {
  const fallback = DEFAULT_AI_COACH;
  if (!jsonStr) return fallback;
  try {
    let parsed = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    if (parsed && typeof parsed === "object") {
      const practiceParams = parsed.practiceParameters || buildDefaultParameterMap("practice");
      const matchParams = parsed.matchParameters || buildDefaultParameterMap("match");

      // Sanitize all parameters to ensure key completeness
      APPROVED_CPI_7_PARAMETERS.forEach((p) => {
        if (!practiceParams[p]) practiceParams[p] = fallback.practiceParameters[p];
        if (!matchParams[p]) matchParams[p] = fallback.matchParameters[p];
      });

      return {
        systemInstructions: parsed.systemInstructions ?? fallback.systemInstructions,
        coachingTone: parsed.coachingTone ?? fallback.coachingTone,
        responseGuidance: parsed.responseGuidance ?? fallback.responseGuidance,
        recommendationBehaviour: parsed.recommendationBehaviour ?? fallback.recommendationBehaviour,
        practiceParameters: practiceParams,
        matchParameters: matchParams
      };
    }
  } catch (e) {
    console.error("Error parsing aiCoachJson", e);
  }
  return fallback;
};

export default function AdminAiPage() {
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"directives" | "practice" | "match">("directives");
  const [selectedParam, setSelectedParam] = useState<ApprovedCpiParameter>("Technique");

  const [aiConfig, setAiConfig] = useState<AiCoachConfig>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cpi_ai_coach_config");
        if (cached) {
          return parseAiConfig(cached);
        }
      } catch (e) {}
    }
    return DEFAULT_AI_COACH;
  });
  const [fullConfigRaw, setFullConfigRaw] = useState<any>({});

  useEffect(() => {
    fetchAiConfig();
  }, []);

  const fetchAiConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token") || localStorage.getItem("token");
      const res = await fetch("/api/admin/config", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFullConfigRaw(data);
        if (data.aiCoachJson) {
          const parsed = parseAiConfig(data.aiCoachJson);
          setAiConfig(parsed);
          try {
            localStorage.setItem(
              "cpi_ai_coach_config",
              typeof data.aiCoachJson === "string" ? data.aiCoachJson : JSON.stringify(data.aiCoachJson)
            );
          } catch (e) {}
        }
      }
    } catch (err) {
      showToast("Could not fetch AI configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateParameterField = (
    context: "practice" | "match",
    paramKey: ApprovedCpiParameter,
    field: keyof ParameterEditorItem,
    val: any
  ) => {
    const key = context === "practice" ? "practiceParameters" : "matchParameters";
    const targetMap = { ...aiConfig[key] };
    const currentItem = { ...targetMap[paramKey] };
    (currentItem as any)[field] = val;
    targetMap[paramKey] = currentItem;
    setAiConfig({ ...aiConfig, [key]: targetMap });
  };

  const updateActionPoint = (
    context: "practice" | "match",
    paramKey: ApprovedCpiParameter,
    scoreType: "high" | "low",
    idx: number,
    val: string
  ) => {
    const key = context === "practice" ? "practiceParameters" : "matchParameters";
    const targetMap = { ...aiConfig[key] };
    const currentItem = { ...targetMap[paramKey] };
    const pointsField = scoreType === "high" ? "highActionPoints" : "lowActionPoints";
    const newPoints = [...currentItem[pointsField]];
    newPoints[idx] = val;
    currentItem[pointsField] = newPoints;
    targetMap[paramKey] = currentItem;
    setAiConfig({ ...aiConfig, [key]: targetMap });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem("cpi_ai_coach_config", JSON.stringify(aiConfig));
    } catch (e) {}

    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token") || localStorage.getItem("token");
      const updatedPayload = {
        ...fullConfigRaw,
        aiCoachJson: JSON.stringify(aiConfig),
        changeLogsJson: JSON.stringify([
          { time: new Date().toISOString(), section: "AI Management", action: "Updated AI Directives and Practice/Match Parameter Ground Truth Wording", user: "cpi@admin.com" }
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
        throw new Error("Failed to save to backend database");
      }

      showToast("AI Directives & Parameter Ground Truth updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setAiConfig(DEFAULT_AI_COACH);
    showToast("Reset all directives and parameters to Daryll Sir's exact approved default content.", "info");
  };

  if (loading && typeof window !== "undefined" && !localStorage.getItem("cpi_ai_coach_config")) {
    return <CricketLoader message="Loading AI Configuration..." />;
  }

  const activeParamObj = activeTab === "practice" 
    ? aiConfig.practiceParameters[selectedParam] 
    : aiConfig.matchParameters[selectedParam];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">AI Coach Directives & Parameter Ground Truth</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold uppercase">
              Central Control Layer
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Configure system prompts, tone of voice, output guidelines, and Daryll Sir’s word-for-word 7-parameter Practice and Match content.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            title="Restore Daryll Sir's original approved content"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to Daryll Default</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/30 transition-all disabled:opacity-50 uppercase cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save AI Settings</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab("directives")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === "directives"
              ? "bg-white text-orange-600 shadow-sm border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>GLOBAL AI DIRECTIVES & TONE (4)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("practice")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === "practice"
              ? "bg-white text-purple-600 shadow-sm border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>PRACTICE CPI PARAMETERS (7)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("match")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === "match"
              ? "bg-white text-blue-600 shadow-sm border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>MATCH CPI PARAMETERS (7)</span>
        </button>
      </div>

      {/* TAB 1: GLOBAL AI DIRECTIVES & TONE */}
      {activeTab === "directives" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                1. SYSTEM PROMPT INSTRUCTIONS
              </label>
              <textarea
                rows={3}
                value={aiConfig.systemInstructions}
                onChange={(e) => setAiConfig({ ...aiConfig, systemInstructions: e.target.value })}
                className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  2. COACHING TONE & VOICE STYLE
                </label>
                <textarea
                  rows={3}
                  value={aiConfig.coachingTone}
                  onChange={(e) => setAiConfig({ ...aiConfig, coachingTone: e.target.value })}
                  className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  3. RESPONSE GUIDANCE & OUTPUT CONSTRAINTS
                </label>
                <textarea
                  rows={3}
                  value={aiConfig.responseGuidance}
                  onChange={(e) => setAiConfig({ ...aiConfig, responseGuidance: e.target.value })}
                  className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                4. RECOMMENDATION BEHAVIOUR DIRECTIVES
              </label>
              <textarea
                rows={3}
                value={aiConfig.recommendationBehaviour}
                onChange={(e) => setAiConfig({ ...aiConfig, recommendationBehaviour: e.target.value })}
                className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* TABS 2 & 3: PRACTICE / MATCH PARAMETER EDITORS */}
      {(activeTab === "practice" || activeTab === "match") && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Parameter Selector Sidebar */}
          <div className="md:col-span-1 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {activeTab.toUpperCase()} PARAMETERS (7)
            </div>
            {APPROVED_CPI_7_PARAMETERS.map((param) => {
              const displayName = DISPLAY_PARAMETER_NAMES[param];
              const isSelected = selectedParam === param;
              return (
                <button
                  key={param}
                  type="button"
                  onClick={() => setSelectedParam(param)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    isSelected
                      ? activeTab === "practice"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-blue-600 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{displayName}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>

          {/* Parameter Editor Form */}
          <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {DISPLAY_PARAMETER_NAMES[selectedParam]} ({activeTab.toUpperCase()})
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Word-for-word ground truth wording for {activeTab} assessments.
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                activeTab === "practice" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
              }`}>
                {activeTab} Mode
              </span>
            </div>

            {/* HOW TO COACH SECTION */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                HOW TO COACH {DISPLAY_PARAMETER_NAMES[selectedParam].toUpperCase()} (DEFINITION)
              </label>
              <textarea
                rows={3}
                value={activeParamObj.howToCoach}
                onChange={(e) => updateParameterField(activeTab, selectedParam, "howToCoach", e.target.value)}
                className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            {/* IF SCORE IS HIGH */}
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                  IF THE {DISPLAY_PARAMETER_NAMES[selectedParam].toUpperCase()} SCORE IS HIGH
                </h3>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                  High Score Summary Overview
                </label>
                <input
                  type="text"
                  value={activeParamObj.highSummary}
                  onChange={(e) => updateParameterField(activeTab, selectedParam, "highSummary", e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 bg-white border border-emerald-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-emerald-900">
                  High Score Action Points (1 - 5)
                </label>
                {activeParamObj.highActionPoints.map((pt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-700 w-4">{idx + 1}.</span>
                    <input
                      type="text"
                      value={pt}
                      onChange={(e) => updateActionPoint(activeTab, selectedParam, "high", idx, e.target.value)}
                      className="flex-1 text-xs font-medium text-slate-800 bg-white border border-emerald-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* IF SCORE IS LOW */}
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                  IF THE {DISPLAY_PARAMETER_NAMES[selectedParam].toUpperCase()} SCORE IS LOW
                </h3>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Low Score Summary Overview
                </label>
                <input
                  type="text"
                  value={activeParamObj.lowSummary}
                  onChange={(e) => updateParameterField(activeTab, selectedParam, "lowSummary", e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 bg-white border border-amber-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-amber-900">
                  Low Score Action Points (1 - 5)
                </label>
                {activeParamObj.lowActionPoints.map((pt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-700 w-4">{idx + 1}.</span>
                    <input
                      type="text"
                      value={pt}
                      onChange={(e) => updateActionPoint(activeTab, selectedParam, "low", idx, e.target.value)}
                      className="flex-1 text-xs font-medium text-slate-800 bg-white border border-amber-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
