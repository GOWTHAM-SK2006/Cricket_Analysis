"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Save, RotateCcw, Loader2, Info, CheckCircle2 } from "lucide-react";
import { useAdminToast } from "../layout";
import CricketLoader from "@/components/CricketLoader";

interface ParameterItem {
  id: number;
  name: string;
  description: string;
  ratingDescription: string;
  guidance: string;
  instructions: string;
  recommendation: string;
}

const DEFAULT_7_PARAMETERS: ParameterItem[] = [
  {
    id: 1,
    name: "Technical Execution",
    description: "Assessment of biomechanical efficiency, shot technique, and mechanical consistency.",
    ratingDescription: "Evaluates footwork, bat path, body balance, and follow-through quality.",
    guidance: "Observe head position at impact and balance through shot completion.",
    instructions: "Rate from 1-10 based on mechanical perfection and repeatability under pressure.",
    recommendation: "Focus on high-volume mirror drills and video review to eliminate technical leaks."
  },
  {
    id: 2,
    name: "Skill Level",
    description: "Raw capability, stroke versatility, bowling variations, and positional adaptability.",
    ratingDescription: "Evaluates range of shots, control over spin/seam variations, and fielding range.",
    guidance: "Assess execution accuracy when trying advanced variations in match scenarios.",
    instructions: "Evaluate execution rate across different line and length variations.",
    recommendation: "Expand repertoire by practicing non-dominant strokes and specialized variations."
  },
  {
    id: 3,
    name: "Game Plan",
    description: "Tactical awareness, match situations awareness, and strategy execution.",
    ratingDescription: "Evaluates field placement reading, target pacing, and bowler targeting tactics.",
    guidance: "Look for deliberate decision-making tailored to dynamic pitch conditions.",
    instructions: "Rate tactical discipline and adherence to agreed team match strategies.",
    recommendation: "Conduct post-match tactical debriefs to sharpen situational decision-making."
  },
  {
    id: 4,
    name: "Preparation",
    description: "Pre-match routines, physical warmup, mental focus, and equipment readiness.",
    ratingDescription: "Evaluates punctuality, pre-game visualization, hydration, and warmup structure.",
    guidance: "Observe arrival time, warmup intensity, and focus prior to session start.",
    instructions: "Assess consistency and thoroughness of pre-performance preparation.",
    recommendation: "Establish a rigid 45-minute structured pre-match warmup and visualization protocol."
  },
  {
    id: 5,
    name: "Intensity",
    description: "Energy output, running between wickets, fielding urgency, and pitch presence.",
    ratingDescription: "Evaluates effort levels on every ball, backup running, and body language.",
    guidance: "Measure sprint speeds between wickets and diving commitment in fielding.",
    instructions: "Rate sustained high-energy effort from first ball to session completion.",
    recommendation: "Incorporate high-intensity interval conditioning into regular practice sessions."
  },
  {
    id: 6,
    name: "Focus",
    description: "Concentration, ball-by-ball reset capability, and distraction management.",
    ratingDescription: "Evaluates focus maintenance over long innings/spells and post-error recovery.",
    guidance: "Track concentration lapses during middle overs or after contentious calls.",
    instructions: "Rate ability to maintain clear cognitive focus across full match duration.",
    recommendation: "Practice breathwork and 5-second reset routines between deliveries."
  },
  {
    id: 7,
    name: "Resilience",
    description: "Mental toughness, response to adversity, fight under pressure, and bounce-back capacity.",
    ratingDescription: "Evaluates performance after getting hit, dropping a catch, or early wicket loss.",
    guidance: "Observe body language and aggressiveness after making an error.",
    instructions: "Rate emotional stability and determination when team is under severe pressure.",
    recommendation: "Simulate high-pressure match scenarios during net sessions to build mental toughness."
  }
];

export default function AdminCpiFrameworkPage() {
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parameters, setParameters] = useState<ParameterItem[]>(DEFAULT_7_PARAMETERS);
  const [activeParamId, setActiveParamId] = useState<number>(1);
  const [fullConfigRaw, setFullConfigRaw] = useState<any>({});

  useEffect(() => {
    fetchParameters();
  }, []);

  const fetchParameters = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token");
      const res = await fetch("/api/admin/config", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFullConfigRaw(data);
        if (data.parametersJson) {
          try {
            const parsed = JSON.parse(data.parametersJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setParameters(parsed);
            }
          } catch (e) {
            console.error("Error parsing parametersJson", e);
          }
        }
      }
    } catch (err) {
      showToast("Could not fetch CPI Framework configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: keyof ParameterItem, value: string) => {
    setParameters((prev) =>
      prev.map((p) => (p.id === activeParamId ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token");
      const updatedPayload = {
        ...fullConfigRaw,
        parametersJson: JSON.stringify(parameters),
        changeLogsJson: JSON.stringify([
          { time: new Date().toISOString(), section: "CPI Framework", action: "Updated 7-parameter definitions & guidance", user: "cpi@admin.com" }
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

      if (!res.ok) throw new Error("Failed to save CPI Framework configuration");

      showToast("7 CPI Performance Parameters updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save parameters", "error");
    } finally {
      setSaving(false);
    }
  };

  const activeParam = parameters.find((p) => p.id === activeParamId) || parameters[0];

  if (loading) {
    return <CricketLoader message="Loading CPI Framework..." />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">CPI Framework Governance</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
              Exactly 7 Core Parameters
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure parameter names, descriptions, rating criteria, coach guidance, scoring instructions, and recommendation text.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setParameters(DEFAULT_7_PARAMETERS)}
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
            <span>Save All Parameters</span>
          </button>
        </div>
      </div>

      {/* Grid: 7 Parameters Sidebar + Form Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Parameters Selector */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
          <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Select Core Parameter (1 of 7)
          </div>
          {parameters.map((p, index) => {
            const isActive = p.id === activeParamId;
            return (
              <button
                key={p.id}
                onClick={() => setActiveParamId(p.id)}
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
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-extrabold text-xs leading-snug">{p.name}</p>
                    <p className={`text-[10px] line-clamp-1 font-medium ${isActive ? "text-slate-400" : "text-slate-500"}`}>
                      {p.description}
                    </p>
                  </div>
                </div>
                {isActive && <Sliders className="w-4 h-4 text-orange-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>

        {/* Right Form Editor */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 font-black text-sm flex items-center justify-center">
                #{activeParam.id}
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900">{activeParam.name}</h2>
                <p className="text-xs text-slate-500 font-medium">Editing parameter configuration fields</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
              Protected Core Parameter
            </span>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Parameter Name
              </label>
              <input
                type="text"
                value={activeParam.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                rows={2}
                value={activeParam.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Rating Criteria Description
              </label>
              <textarea
                rows={2}
                value={activeParam.ratingDescription}
                onChange={(e) => handleFieldChange("ratingDescription", e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Observation Guidance for Coaches
              </label>
              <textarea
                rows={2}
                value={activeParam.guidance}
                onChange={(e) => handleFieldChange("guidance", e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Scoring Instructions
              </label>
              <textarea
                rows={2}
                value={activeParam.instructions}
                onChange={(e) => handleFieldChange("instructions", e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Actionable Recommendation Wording
              </label>
              <textarea
                rows={2}
                value={activeParam.recommendation}
                onChange={(e) => handleFieldChange("recommendation", e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed font-medium"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Changes saved here propagate directly to Coach UI & AI reports.
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/30 transition-all disabled:opacity-50 uppercase cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Parameter #{activeParam.id}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
