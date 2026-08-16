"use client";

import React, { useState, useEffect } from "react";
import { Bot, Save, RotateCcw, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { useAdminToast } from "../layout";
import CricketLoader from "@/components/CricketLoader";

interface AiCoachConfig {
  systemInstructions: string;
  coachingTone: string;
  responseGuidance: string;
  recommendationBehaviour: string;
  parameterAnalysisInstructions: string;
  coachActionPlanDirectives: string;
  recommendedFocusDirectives: string;
}

const DEFAULT_AI_COACH: AiCoachConfig = {
  systemInstructions: "You are the CPI AI Head Performance Analyst. Provide objective, evidence-based performance feedback for cricket players using the CPI 7-parameter framework.",
  coachingTone: "Professional, encouraging, analytical, and actionable.",
  responseGuidance: "Format outputs clearly with executive summary, 5-part parameter recommendations, and practice vs match variance analysis.",
  recommendationBehaviour: "Interpret approved Daryll Cullinan Coach Plan in the context of the player's role (Batsman, Bowler, Wicketkeeper, Fielder). Never contradict high scores or invent unapproved technical drills.",
  parameterAnalysisInstructions: "Evaluate all 7 parameters (Technique, Skill Level, Game Plan, Preparation, Intensity, Focus, Resilience) ranked from strongest to weakest based on actual assessment scores.",
  coachActionPlanDirectives: "Use the Coach's Action Plan as the primary foundational framework. Align development objectives directly with approved Daryll Cullinan drills and technical action points.",
  recommendedFocusDirectives: "Prioritize high-impact focus areas based on the player's key weakness parameters and role requirements (Batsman, Bowler, All-rounder, Wicketkeeper)."
};

const parseAiConfig = (jsonStr: any): AiCoachConfig | null => {
  if (!jsonStr) return null;
  try {
    let parsed = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    if (parsed && typeof parsed === "object") {
      return {
        systemInstructions: parsed.systemInstructions ?? DEFAULT_AI_COACH.systemInstructions,
        coachingTone: parsed.coachingTone ?? DEFAULT_AI_COACH.coachingTone,
        responseGuidance: parsed.responseGuidance ?? DEFAULT_AI_COACH.responseGuidance,
        recommendationBehaviour: parsed.recommendationBehaviour ?? DEFAULT_AI_COACH.recommendationBehaviour,
        parameterAnalysisInstructions: parsed.parameterAnalysisInstructions ?? DEFAULT_AI_COACH.parameterAnalysisInstructions,
        coachActionPlanDirectives: parsed.coachActionPlanDirectives ?? DEFAULT_AI_COACH.coachActionPlanDirectives,
        recommendedFocusDirectives: parsed.recommendedFocusDirectives ?? DEFAULT_AI_COACH.recommendedFocusDirectives,
      };
    }
  } catch (e) {
    console.error("Error parsing aiCoachJson", e);
  }
  return null;
};

export default function AdminAiPage() {
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiConfig, setAiConfig] = useState<AiCoachConfig>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cpi_ai_coach_config");
        if (cached) {
          const parsed = parseAiConfig(cached);
          if (parsed) return parsed;
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
          if (parsed) {
            setAiConfig(parsed);
            try {
              localStorage.setItem(
                "cpi_ai_coach_config",
                typeof data.aiCoachJson === "string" ? data.aiCoachJson : JSON.stringify(data.aiCoachJson)
              );
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      showToast("Could not fetch AI configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token") || localStorage.getItem("token");
      const updatedPayload = {
        ...fullConfigRaw,
        aiCoachJson: JSON.stringify(aiConfig),
        changeLogsJson: JSON.stringify([
          { time: new Date().toISOString(), section: "AI Management", action: "Updated AI Coach system prompts & directives", user: "cpi@admin.com" }
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
        let msg = "Failed to save AI configuration";
        try {
          const errJson = JSON.parse(errText);
          if (errJson.message) msg = errJson.message;
        } catch (e) {}
        throw new Error(msg);
      }

      const data = await res.json();
      setFullConfigRaw(data);
      if (data.aiCoachJson) {
        const parsed = parseAiConfig(data.aiCoachJson);
        if (parsed) {
          setAiConfig(parsed);
          try {
            localStorage.setItem(
              "cpi_ai_coach_config",
              typeof data.aiCoachJson === "string" ? data.aiCoachJson : JSON.stringify(data.aiCoachJson)
            );
          } catch (e) {}
        }
      }

      showToast("AI Management settings updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading && typeof window !== "undefined" && !localStorage.getItem("cpi_ai_coach_config")) {
    return <CricketLoader message="Loading AI Configuration..." />;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">AI Coach Directives & Configuration</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
              Prompt & Tone Directives
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Configure system prompts, tone of voice, parameter analysis instructions, and response behavior for the AI Coach.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAiConfig(DEFAULT_AI_COACH)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Defaults</span>
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

      {/* Security Note Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-white">Security & API Key Isolation</p>
            <p className="text-[11px] text-slate-400 font-medium">
              API Keys and microservice credentials are standardly isolated in backend environment variables. No API keys are exposed or saved in frontend code.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[10px] shrink-0 font-bold">
          API Keys Hidden
        </span>
      </div>

      {/* Form Fields */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            1. System Prompt Instructions
          </label>
          <textarea
            rows={4}
            value={aiConfig.systemInstructions}
            onChange={(e) => setAiConfig({ ...aiConfig, systemInstructions: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              2. Coaching Tone & Voice Style
            </label>
            <input
              type="text"
              value={aiConfig.coachingTone}
              onChange={(e) => setAiConfig({ ...aiConfig, coachingTone: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              3. Response Guidance & Output Constraints
            </label>
            <input
              type="text"
              value={aiConfig.responseGuidance}
              onChange={(e) => setAiConfig({ ...aiConfig, responseGuidance: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            4. Recommendation Behaviour Directives
          </label>
          <textarea
            rows={3}
            value={aiConfig.recommendationBehaviour}
            onChange={(e) => setAiConfig({ ...aiConfig, recommendationBehaviour: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            5. Parameter Analysis Directives (7 CPI Parameters)
          </label>
          <textarea
            rows={3}
            value={aiConfig.parameterAnalysisInstructions}
            onChange={(e) => setAiConfig({ ...aiConfig, parameterAnalysisInstructions: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            6. Coach's Action Plan Directives
          </label>
          <textarea
            rows={3}
            value={aiConfig.coachActionPlanDirectives}
            onChange={(e) => setAiConfig({ ...aiConfig, coachActionPlanDirectives: e.target.value })}
            placeholder="Directives for integrating Coach's Action Plan into AI analysis..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            7. Recommended Focus Directives
          </label>
          <textarea
            rows={3}
            value={aiConfig.recommendedFocusDirectives}
            onChange={(e) => setAiConfig({ ...aiConfig, recommendedFocusDirectives: e.target.value })}
            placeholder="Directives for generating targeted Recommended Focus areas..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed font-medium"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            Directives guide real-time AI responses generated for player reports.
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/30 transition-all disabled:opacity-50 uppercase cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save AI Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
