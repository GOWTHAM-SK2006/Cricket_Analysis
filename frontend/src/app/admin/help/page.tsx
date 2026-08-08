"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle, Save, RotateCcw, Loader2, Info, CheckCircle2, Sliders } from "lucide-react";
import { useAdminToast } from "../layout";

interface HelpItem {
  parameter: string;
  explanation: string;
  rangeHigh: string;
  rangeAvg: string;
  rangeLow: string;
}

const DEFAULT_HELP: HelpItem[] = [
  { parameter: "Technical Execution", explanation: "Refers to how biomechanically sound and repeatable a player's fundamental techniques are.", rangeHigh: "Scores 8.0-10.0: Flawless technique, balanced weight distribution, precise bat path.", rangeAvg: "Scores 5.0-7.9: Solid core technique with occasional mechanical flaws under pressure.", rangeLow: "Scores 1.0-4.9: Significant technical breakdowns requiring fundamental rework." },
  { parameter: "Skill Level", explanation: "Refers to stroke repertoire, bowling variations, and fielding dexterity.", rangeHigh: "Scores 8.0-10.0: Masterful control over all shot/bowling variations.", rangeAvg: "Scores 5.0-7.9: Good standard skillset with limited advanced variations.", rangeLow: "Scores 1.0-4.9: Restricted skill set with execution difficulties." },
  { parameter: "Game Plan", explanation: "Tactical comprehension of match scenarios, field settings, and match pace.", rangeHigh: "Scores 8.0-10.0: Elite tactical execution and situational awareness.", rangeAvg: "Scores 5.0-7.9: Understands strategy but occasionally deviates under stress.", rangeLow: "Scores 1.0-4.9: Poor situational decisions and strategy execution." },
  { parameter: "Preparation", explanation: "Professionalism in warmup, mental readiness, and physical prep.", rangeHigh: "Scores 8.0-10.0: Meticulous professional warmup and mental visualization.", rangeAvg: "Scores 5.0-7.9: Standard preparation routine lacking deep focus.", rangeLow: "Scores 1.0-4.9: Casual or rushed preparation leading to slow starts." },
  { parameter: "Intensity", explanation: "Physical energy, sprinting between wickets, and fielding commitment.", rangeHigh: "Scores 8.0-10.0: Relentless high energy and total physical effort.", rangeAvg: "Scores 5.0-7.9: Inconsistent energy output across match phases.", rangeLow: "Scores 1.0-4.9: Passive body language and low physical intensity." },
  { parameter: "Focus", explanation: "Concentration maintenance and ball-by-ball cognitive reset.", rangeHigh: "Scores 8.0-10.0: Laser concentration and instant mental reset.", rangeAvg: "Scores 5.0-7.9: Solid focus with occasional middle-session lapses.", rangeLow: "Scores 1.0-4.9: Easily distracted, carrying errors from ball to ball." },
  { parameter: "Resilience", explanation: "Mental toughness under pressure and bounce-back capacity.", rangeHigh: "Scores 8.0-10.0: Thrives in high-pressure crunch situations.", rangeAvg: "Scores 5.0-7.9: Competent response to setback with occasional hesitation.", rangeLow: "Scores 1.0-4.9: Folds quickly when match pressure escalates." }
];

export default function AdminHelpPage() {
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [helpConfig, setHelpConfig] = useState<HelpItem[]>(DEFAULT_HELP);
  const [selectedParamIndex, setSelectedParamIndex] = useState<number>(0);
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
            if (Array.isArray(parsed) && parsed.length > 0) {
              setHelpConfig(parsed);
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

  const handleHelpChange = (field: keyof HelpItem, value: string) => {
    setHelpConfig((prev) =>
      prev.map((item, idx) => (idx === selectedParamIndex ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token");
      const updatedPayload = {
        ...fullConfigRaw,
        helpJson: JSON.stringify(helpConfig),
        changeLogsJson: JSON.stringify([
          { time: new Date().toISOString(), section: "Help & Information", action: "Updated 7-parameter help guides & scoring criteria", user: "cpi@admin.com" }
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

      showToast("Help & Information content saved successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const activeHelp = helpConfig[selectedParamIndex] || DEFAULT_HELP[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Help & Information Governance</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
              7 Parameters Help Guides
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage parameter explanations, scoring criteria descriptions, and score tier interpretation guides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setHelpConfig(DEFAULT_HELP)}
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

      {/* Selector & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Parameter List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
          <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Select Core Parameter (1 of 7)
          </div>
          {helpConfig.map((item, idx) => {
            const isActive = idx === selectedParamIndex;
            return (
              <button
                key={idx}
                onClick={() => setSelectedParamIndex(idx)}
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
                    <p className="font-extrabold text-xs leading-snug">{item.parameter}</p>
                    <p className={`text-[10px] line-clamp-1 font-medium ${isActive ? "text-slate-400" : "text-slate-500"}`}>
                      {item.explanation}
                    </p>
                  </div>
                </div>
                {isActive && <HelpCircle className="w-4 h-4 text-orange-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>

        {/* Right Form Editor */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 font-black text-sm flex items-center justify-center">
                #{selectedParamIndex + 1}
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900">{activeHelp.parameter}</h2>
                <p className="text-xs text-slate-500 font-medium">Editing Help & Information criteria</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 text-[10px] font-bold border border-sky-200">
              Help Content Guide
            </span>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Parameter Concept Explanation
              </label>
              <textarea
                rows={3}
                value={activeHelp.explanation}
                onChange={(e) => handleHelpChange("explanation", e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                High Score Interpretation (8.0 - 10.0)
              </label>
              <textarea
                rows={3}
                value={activeHelp.rangeHigh}
                onChange={(e) => handleHelpChange("rangeHigh", e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Average Score Interpretation (5.0 - 7.9)
              </label>
              <textarea
                rows={3}
                value={activeHelp.rangeAvg}
                onChange={(e) => handleHelpChange("rangeAvg", e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Low Score Interpretation (1.0 - 4.9)
              </label>
              <textarea
                rows={3}
                value={activeHelp.rangeLow}
                onChange={(e) => handleHelpChange("rangeLow", e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition-all leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Help content edits are instantly synchronized across Coach Help pages.
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/30 transition-all disabled:opacity-50 uppercase cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Help Guide #{selectedParamIndex + 1}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
