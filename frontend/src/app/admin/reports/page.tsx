"use client";

import React, { useState, useEffect } from "react";
import { Save, RotateCcw, Loader2, Eye, FileText, TrendingUp, HelpCircle, Info, Sliders } from "lucide-react";
import { useAdminToast } from "../layout";

interface ReportConfig {
  heading: string;
  subheading: string;
  section3Title: string;
  recommendationWording: string;
  strengthWeaknessWording: string;
  scoreFormatNote: string;
}

const DEFAULT_REPORT_CONFIG: ReportConfig = {
  heading: "CPI Comprehensive Player Performance Assessment Report",
  subheading: "Detailed 7-Parameter Evaluation & AI Coach Performance Breakdown",
  section3Title: "Complete Parameter Performance Breakdown (Strongest → Weakest)",
  recommendationWording: "Targeted Development Plan based on current CPI Parameter Scores:",
  strengthWeaknessWording: "Full 7-Parameter Spectrum Analysis:",
  scoreFormatNote: "All scores normalized to 10-point CPI scale (e.g. 7.7 / 10)"
};

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

interface MockParamScore {
  name: string;
  score: number;
  recommendation: string;
}

const MOCK_PLAYER_SCORES: MockParamScore[] = [
  { name: "Resilience", score: 8.8, recommendation: "Position player in high-pressure match crunch overs." },
  { name: "Focus", score: 8.6, recommendation: "Maintain laser concentration through ball-by-ball reset triggers." },
  { name: "Game Plan", score: 8.3, recommendation: "Encourage player to lead field placement decisions and tactical discussions." },
  { name: "Preparation", score: 8.1, recommendation: "Designate player as preparation mentor for squad members." },
  { name: "Skill Level", score: 7.9, recommendation: "Practice target bowling and specific boundary options." },
  { name: "Intensity", score: 7.5, recommendation: "Set sprint benchmark targets for running between wickets." },
  { name: "Technical Execution", score: 7.2, recommendation: "Focus on high-volume mirror drills and video review to refine bat path." }
];

export default function AdminReportsPage() {
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportConfig>(DEFAULT_REPORT_CONFIG);
  const [helpConfig, setHelpConfig] = useState<HelpItem[]>(DEFAULT_HELP);
  const [selectedParamIndex, setSelectedParamIndex] = useState<number>(0);
  const [fullConfigRaw, setFullConfigRaw] = useState<any>({});
  const [previewTab, setPreviewTab] = useState<"editor" | "preview">("preview");

  const parseReportsConfig = (data: any) => {
    let helpItemsParsed: HelpItem[] | null = null;

    if (data.reportsJson) {
      try {
        let parsed = typeof data.reportsJson === "string" ? JSON.parse(data.reportsJson) : data.reportsJson;
        if (typeof parsed === "string") {
          parsed = JSON.parse(parsed);
        }
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setReportConfig({
            heading: parsed.heading ?? DEFAULT_REPORT_CONFIG.heading,
            subheading: parsed.subheading ?? DEFAULT_REPORT_CONFIG.subheading,
            section3Title: parsed.section3Title ?? DEFAULT_REPORT_CONFIG.section3Title,
            recommendationWording: parsed.recommendationWording ?? DEFAULT_REPORT_CONFIG.recommendationWording,
            strengthWeaknessWording: parsed.strengthWeaknessWording ?? DEFAULT_REPORT_CONFIG.strengthWeaknessWording,
            scoreFormatNote: parsed.scoreFormatNote ?? DEFAULT_REPORT_CONFIG.scoreFormatNote,
          });

          if (Array.isArray(parsed.helpItems) && parsed.helpItems.length > 0) {
            helpItemsParsed = parsed.helpItems;
          }
        }
      } catch (e) {
        console.error("Error parsing reportsJson", e);
      }
    }

    if (!helpItemsParsed && data.helpJson) {
      try {
        let parsedHelp = typeof data.helpJson === "string" ? JSON.parse(data.helpJson) : data.helpJson;
        if (typeof parsedHelp === "string") {
          parsedHelp = JSON.parse(parsedHelp);
        }
        if (Array.isArray(parsedHelp) && parsedHelp.length > 0) {
          helpItemsParsed = parsedHelp;
        }
      } catch (e) {
        console.error("Error parsing helpJson in reports page", e);
      }
    }

    if (helpItemsParsed) {
      setHelpConfig(helpItemsParsed);
    }
  };

  useEffect(() => {
    fetchReportConfig();
  }, []);

  const fetchReportConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token") || localStorage.getItem("token");
      const res = await fetch("/api/admin/config", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFullConfigRaw(data);
        parseReportsConfig(data);
      }
    } catch (err) {
      showToast("Could not load report configuration", "error");
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
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token") || localStorage.getItem("token");
      
      const reportsPayloadObj = {
        ...reportConfig,
        helpItems: helpConfig
      };

      const { helpJson, ...cleanConfigRaw } = fullConfigRaw;

      const updatedPayload = {
        ...cleanConfigRaw,
        reportsJson: JSON.stringify(reportsPayloadObj),
        changeLogsJson: JSON.stringify([
          { time: new Date().toISOString(), section: "Reports Management", action: "Updated report templates & Help & Information guides", user: "cpi@admin.com" }
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

      if (!res.ok) throw new Error("Failed to save configuration");

      const data = await res.json();
      setFullConfigRaw(data);
      parseReportsConfig(data);

      showToast("Report templates and Help & Information content saved successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const sortedScores = [...MOCK_PLAYER_SCORES].sort((a, b) => b.score - a.score);
  const activeHelp = helpConfig[selectedParamIndex] || DEFAULT_HELP[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Report Content & Live Preview</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              7 Parameters Ranked 1 to 7
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Edit report headings, section titles, wording, Help & Information content, and view real-time live preview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setPreviewTab("editor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                previewTab === "editor" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Edit Content</span>
            </button>
            <button
              onClick={() => setPreviewTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                previewTab === "preview" ? "bg-white text-orange-600 shadow-sm font-black" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Report Preview</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/30 transition-all disabled:opacity-50 uppercase cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Report Config</span>
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Editor */}
        <div className={`lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-8 ${previewTab === "preview" ? "hidden lg:block" : ""}`}>
          
          {/* SECTION A: Report Wording Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-orange-600" />
                <span>1. Report Template Wording Editor</span>
              </h2>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">Template Config</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Report Main Heading
              </label>
              <input
                type="text"
                value={reportConfig.heading}
                onChange={(e) => setReportConfig({ ...reportConfig, heading: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Report Subheading
              </label>
              <input
                type="text"
                value={reportConfig.subheading}
                onChange={(e) => setReportConfig({ ...reportConfig, subheading: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Section 3 Title (All 7 Parameters)
              </label>
              <input
                type="text"
                value={reportConfig.section3Title}
                onChange={(e) => setReportConfig({ ...reportConfig, section3Title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Recommendation Wording Prefix
              </label>
              <input
                type="text"
                value={reportConfig.recommendationWording}
                onChange={(e) => setReportConfig({ ...reportConfig, recommendationWording: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Strength & Weakness Wording
              </label>
              <input
                type="text"
                value={reportConfig.strengthWeaknessWording}
                onChange={(e) => setReportConfig({ ...reportConfig, strengthWeaknessWording: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          {/* SECTION B: Help & Information Content Editor */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-sky-600" />
                <span>2. Help & Information Content Editor</span>
              </h2>
              <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-bold">7 Parameters Info</span>
            </div>

            {/* Select parameter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Parameter Help Guide
              </label>
              <select
                value={selectedParamIndex}
                onChange={(e) => setSelectedParamIndex(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500"
              >
                {helpConfig.map((item, idx) => (
                  <option key={idx} value={idx}>
                    {idx + 1}. {item.parameter}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {activeHelp.parameter} — Explanation Text
              </label>
              <textarea
                rows={2}
                value={activeHelp.explanation}
                onChange={(e) => handleHelpChange("explanation", e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                High Score Information (8.0 - 10.0)
              </label>
              <textarea
                rows={2}
                value={activeHelp.rangeHigh}
                onChange={(e) => handleHelpChange("rangeHigh", e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Average Score Information (5.0 - 7.9)
              </label>
              <textarea
                rows={2}
                value={activeHelp.rangeAvg}
                onChange={(e) => handleHelpChange("rangeAvg", e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Low Score Information (1.0 - 4.9)
              </label>
              <textarea
                rows={2}
                value={activeHelp.rangeLow}
                onChange={(e) => handleHelpChange("rangeLow", e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-500 leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black rounded-xl shadow-md shadow-orange-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 uppercase cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Report & Help Settings</span>
            </button>
          </div>
        </div>

        {/* Right Live Report Preview Card */}
        <div className={`lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-6 text-slate-100 space-y-6 ${previewTab === "editor" ? "hidden lg:block" : ""}`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-orange-400 uppercase tracking-widest">Live Player Report Preview</span>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
              Exact Player Output
            </span>
          </div>

          <div className="bg-white text-slate-900 rounded-xl p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-extrabold uppercase tracking-wider">
                  Official CPI Player Report
                </span>
                <span className="text-xs text-slate-500 font-bold">CPI Index Score: <span className="text-orange-600 font-black text-sm">8.1 / 10</span></span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-2">{reportConfig.heading}</h3>
              <p className="text-xs text-slate-500 font-medium">{reportConfig.subheading}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-extrabold">Overall CPI</p>
                <p className="text-base font-black text-orange-600">8.1 / 10</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-extrabold">Practice PPI</p>
                <p className="text-base font-black text-slate-800">8.3 / 10</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-extrabold">Match MPI</p>
                <p className="text-base font-black text-slate-800">7.9 / 10</p>
              </div>
            </div>

            {/* SECTION 3: ALL 7 PARAMETERS RANKED STRONGEST → WEAKEST */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  <span>{reportConfig.section3Title}</span>
                </h4>
                <span className="text-[10px] font-extrabold text-slate-400">Ordered by Actual Score</span>
              </div>

              <p className="text-[11px] text-slate-600 font-medium italic">
                {reportConfig.strengthWeaknessWording}
              </p>

              {/* 1 to 7 Parameters List */}
              <div className="space-y-2.5">
                {sortedScores.map((item, index) => (
                  <div
                    key={item.name}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-md text-[11px] font-black flex items-center justify-center ${
                            index === 0
                              ? "bg-emerald-600 text-white"
                              : index === 6
                              ? "bg-rose-600 text-white"
                              : "bg-slate-800 text-white"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="font-bold text-xs text-slate-900">{item.name}</span>
                        {index === 0 && (
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded">
                            Strongest
                          </span>
                        )}
                        {index === 6 && (
                          <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 font-bold text-[9px] rounded">
                            Weakest
                          </span>
                        )}
                      </div>
                      <span className="font-black text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                        {item.score.toFixed(1)} / 10
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 pl-7 leading-relaxed font-medium">
                      <span className="font-bold text-slate-800">AI Coach Recommendation: </span>
                      {item.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-center">
              <p className="text-[10px] text-slate-400 font-medium">
                {reportConfig.scoreFormatNote} — Generated by CPI AI Performance System
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
