"use client";

import React, { useState, useEffect } from "react";
import { FileText, Save, RotateCcw, Loader2, Globe, HelpCircle, FileCode, CheckCircle2, Info } from "lucide-react";
import { useAdminToast } from "../layout";

interface SystemContent {
  homepageTitle: string;
  homepageSubtitle: string;
  faqItem1: string;
  faqAnswer1: string;
  tooltipPpi: string;
  tooltipMpi: string;
  tooltipCpi: string;
  footerText: string;
}

const DEFAULT_CONTENT: SystemContent = {
  homepageTitle: "Cricket Performance Index (CPI) Platform",
  homepageSubtitle: "Comprehensive 7-Parameter Evaluation & AI Coach Longitudinal Tracking",
  faqItem1: "What is the Cricket Performance Index (CPI)?",
  faqAnswer1: "CPI is a normalized 10-point evaluation metric combining Practice (PPI) and Match (MPI) performance parameters.",
  tooltipPpi: "Practice Performance Index: Evaluates mechanics, execution rate, and effort during net drills.",
  tooltipMpi: "Match Performance Index: Evaluates tactical awareness, game plan adherence, and resilience under pressure.",
  tooltipCpi: "Cricket Performance Index: Normalized aggregate of PPI and MPI on a 10-point scale.",
  footerText: "© 2026 CPI – Cricket Performance Index. All rights reserved."
};

export default function AdminContentManagementPage() {
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<SystemContent>(DEFAULT_CONTENT);
  const [fullConfigRaw, setFullConfigRaw] = useState<any>({});

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token");
      const res = await fetch("/api/admin/config", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFullConfigRaw(data);
        if (data.contentJson) {
          try {
            const parsed = JSON.parse(data.contentJson);
            if (parsed && typeof parsed === "object") {
              setContent(parsed);
            }
          } catch (e) {
            console.error("Error parsing contentJson", e);
          }
        }
      }
    } catch (err) {
      showToast("Could not load system content configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token");
      const updatedPayload = {
        ...fullConfigRaw,
        contentJson: JSON.stringify(content),
        changeLogsJson: JSON.stringify([
          { time: new Date().toISOString(), section: "Content Management", action: "Updated system content, FAQ & page tooltips", user: "cpi@admin.com" }
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

      if (!res.ok) throw new Error("Failed to save content configuration");

      showToast("Platform System Content updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">System Content Management</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
              Global Text & Tooltips
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Edit application titles, subheadings, FAQs, tooltips, and footer disclaimers without redeploying code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setContent(DEFAULT_CONTENT)}
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
            <span>Save Content</span>
          </button>
        </div>
      </div>

      {/* Editor Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            1. Platform Main Heading
          </label>
          <input
            type="text"
            value={content.homepageTitle}
            onChange={(e) => setContent({ ...content, homepageTitle: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            2. Platform Subheading
          </label>
          <input
            type="text"
            value={content.homepageSubtitle}
            onChange={(e) => setContent({ ...content, homepageSubtitle: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
            3. System Tooltip Explanations
          </label>
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">PPI Tooltip</span>
              <input
                type="text"
                value={content.tooltipPpi}
                onChange={(e) => setContent({ ...content, tooltipPpi: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">MPI Tooltip</span>
              <input
                type="text"
                value={content.tooltipMpi}
                onChange={(e) => setContent({ ...content, tooltipMpi: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">CPI Tooltip</span>
              <input
                type="text"
                value={content.tooltipCpi}
                onChange={(e) => setContent({ ...content, tooltipCpi: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
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
            <span>Save System Content</span>
          </button>
        </div>
      </div>
    </div>
  );
}
