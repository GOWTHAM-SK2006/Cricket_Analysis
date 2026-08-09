"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Save, 
  RotateCcw, 
  Loader2, 
  Globe, 
  HelpCircle, 
  CheckCircle2, 
  Info,
  Shield,
  UserCheck,
  Lock,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Scale,
  AlertCircle,
  Eye,
  Edit3
} from "lucide-react";
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

interface TermsSection {
  id: string;
  number: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  bullets: string[];
}

interface TermsConfig {
  title: string;
  subtitle: string;
  introText: string;
  lastUpdated: string;
  sections: TermsSection[];
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

const DEFAULT_TERMS: TermsConfig = {
  title: "TERMS & CONDITIONS",
  subtitle: "LEGAL AGREEMENTS",
  introText: "Welcome to the Cricket Performance Index (CPI). These Terms and Conditions govern your access and use of the CPI platform, services, and related applications. By registering or using our platform, you agree to comply with these terms.",
  lastUpdated: "July 2026",
  sections: [
    {
      id: "1",
      number: "1.",
      title: "PLATFORM SERVICES",
      category: "SCOPE AND USAGE",
      icon: "Shield",
      description: "CPI provides coaching staff, academies, and players with performance tracking tools, rating systems (PPI and MPI), and data visualization.",
      bullets: [
        "The platform is provided \"as is\" and as an athletic performance assessment aid.",
        "We reserve the right to modify, suspend, or discontinue any feature at any time."
      ]
    },
    {
      id: "2",
      number: "2.",
      title: "ACCOUNTS & REGISTRATION",
      category: "ACCESS REQUIREMENTS",
      icon: "UserCheck",
      description: "To use CPI, users must register an account by providing accurate and complete registration details.",
      bullets: [
        "You are responsible for keeping your login credentials confidential.",
        "Accounts cannot be shared or transferred to other individuals without permission.",
        "Coaching credentials must be verified and approved by the academy administrator."
      ]
    },
    {
      id: "3",
      number: "3.",
      title: "PRIVACY & PERFORMANCE DATA",
      category: "INFORMATION & PRIVACY",
      icon: "Lock",
      description: "By using the platform, you agree to let CPI process athletic performance metrics, coaching feedback, and training logs.",
      bullets: [
        "Coaches can view and grade individual players' practice and match metrics.",
        "Administrators may generate reports summarizing collective or individual progress.",
        "Performance logs are secured and not shared with unauthorized third parties."
      ]
    },
    {
      id: "4",
      number: "4.",
      title: "CODE OF CONDUCT",
      category: "FAIR PLAY & RESPECT",
      icon: "FileText",
      description: "Users must maintain professional and respectful behavior. Fair play and integrity are central values of the CPI platform.",
      bullets: [
        "Inputting false metrics or spamming reviews is strictly prohibited.",
        "Abusive behavior or harassment toward other players or staff will lead to account suspension."
      ]
    },
    {
      id: "5",
      number: "5.",
      title: "LIABILITY & DISCLAIMERS",
      category: "LIMIT OF RESPONSIBILITY",
      icon: "HelpCircle",
      description: "CPI ratings are subjective coaching assessments designed solely to support developmental training.",
      bullets: [
        "Ratings do not guarantee selection for official league matches or professional contracts.",
        "We are not responsible for any physical injury incurred during training, practice, or match situations."
      ]
    }
  ]
};

const ICON_OPTIONS = [
  { value: "Shield", label: "Shield (Security/Scope)" },
  { value: "UserCheck", label: "UserCheck (Accounts/Access)" },
  { value: "Lock", label: "Lock (Privacy/Security)" },
  { value: "FileText", label: "FileText (Document/Conduct)" },
  { value: "HelpCircle", label: "HelpCircle (Disclaimer/Info)" },
  { value: "Scale", label: "Scale (Legal/Rules)" },
  { value: "AlertCircle", label: "AlertCircle (Warning/Notice)" },
  { value: "CheckCircle2", label: "CheckCircle (Compliance)" },
  { value: "Info", label: "Info (General Info)" },
];

export default function AdminContentManagementPage() {
  const { showToast } = useAdminToast();
  const [activeTab, setActiveTab] = useState<"general" | "terms">("terms");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<SystemContent>(DEFAULT_CONTENT);
  const [termsConfig, setTermsConfig] = useState<TermsConfig>(DEFAULT_TERMS);
  const [fullConfigRaw, setFullConfigRaw] = useState<any>({});
  const [showPreview, setShowPreview] = useState(false);

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
            if (parsed && typeof parsed === "object") setContent(parsed);
          } catch (e) {
            console.error("Error parsing contentJson", e);
          }
        }
        if (data.termsJson) {
          try {
            const parsedTerms = JSON.parse(data.termsJson);
            if (parsedTerms && typeof parsedTerms === "object" && Array.isArray(parsedTerms.sections)) {
              setTermsConfig(parsedTerms);
            }
          } catch (e) {
            console.error("Error parsing termsJson", e);
          }
        }
      }
    } catch (err) {
      showToast("Could not load system content configuration", "error");
    } fontally {
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
        termsJson: JSON.stringify(termsConfig),
        changeLogsJson: JSON.stringify([
          { 
            time: new Date().toISOString(), 
            section: "Content Management", 
            action: "Updated system content & Terms & Conditions", 
            user: "cpi@admin.com" 
          }
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

      showToast("Terms & Conditions & System Content updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  // Section Editors Handlers
  const handleUpdateSection = (index: number, field: keyof TermsSection, value: any) => {
    const updatedSections = [...termsConfig.sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    setTermsConfig({ ...termsConfig, sections: updatedSections });
  };

  const handleAddSection = () => {
    const nextNum = termsConfig.sections.length + 1;
    const newSec: TermsSection = {
      id: String(Date.now()),
      number: `${nextNum}.`,
      title: "NEW TERMS SECTION",
      category: "SECTION CATEGORY",
      icon: "Shield",
      description: "Enter detailed terms description and scope here...",
      bullets: ["First requirement or terms bullet point."]
    };
    setTermsConfig({ ...termsConfig, sections: [...termsConfig.sections, newSec] });
    showToast("Added new Terms Section", "info");
  };

  const handleDeleteSection = (index: number) => {
    if (termsConfig.sections.length <= 1) {
      showToast("At least one terms section must remain", "error");
      return;
    }
    const updated = termsConfig.sections.filter((_, i) => i !== index);
    setTermsConfig({ ...termsConfig, sections: updated });
    showToast("Terms section removed", "info");
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= termsConfig.sections.length) return;
    const updated = [...termsConfig.sections];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setTermsConfig({ ...termsConfig, sections: updated });
  };

  // Bullet Handlers
  const handleAddBullet = (secIndex: number) => {
    const updated = [...termsConfig.sections];
    updated[secIndex].bullets.push("New rule or compliance requirement.");
    setTermsConfig({ ...termsConfig, sections: updated });
  };

  const handleUpdateBullet = (secIndex: number, bulletIndex: number, text: string) => {
    const updated = [...termsConfig.sections];
    updated[secIndex].bullets[bulletIndex] = text;
    setTermsConfig({ ...termsConfig, sections: updated });
  };

  const handleDeleteBullet = (secIndex: number, bulletIndex: number) => {
    const updated = [...termsConfig.sections];
    updated[secIndex].bullets = updated[secIndex].bullets.filter((_, i) => i !== bulletIndex);
    setTermsConfig({ ...termsConfig, sections: updated });
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "UserCheck": return <UserCheck className="w-5 h-5" />;
      case "Lock": return <Lock className="w-5 h-5" />;
      case "FileText": return <FileText className="w-5 h-5" />;
      case "HelpCircle": return <HelpCircle className="w-5 h-5" />;
      case "Scale": return <Scale className="w-5 h-5" />;
      case "AlertCircle": return <AlertCircle className="w-5 h-5" />;
      case "CheckCircle2": return <CheckCircle2 className="w-5 h-5" />;
      case "Info": return <Info className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">System Content & Terms Management</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider">
              Live Coach Page Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Easily update Terms & Conditions, platform titles, tooltips, and disclaimers. Edits reflect instantly on the coach panel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === "terms") setTermsConfig(DEFAULT_TERMS);
              else setContent(DEFAULT_CONTENT);
              showToast("Reset to default configuration", "info");
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
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
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("terms")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "terms"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <FileText className="w-4 h-4 text-orange-500" />
            <span>Terms & Conditions Page</span>
            <span className="ml-1 px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 text-[10px]">
              {termsConfig.sections.length} Sections
            </span>
          </button>

          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "general"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>General Platform Titles & Tooltips</span>
          </button>
        </div>

        {activeTab === "terms" && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>{showPreview ? "Hide Coach Page Preview" : "Show Live Coach Preview"}</span>
          </button>
        )}
      </div>

      {/* TABS CONTENT */}

      {/* TAB 1: TERMS & CONDITIONS MANAGER */}
      {activeTab === "terms" && (
        <div className="space-y-6">
          {/* Header Metadata Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-orange-600" />
              1. Terms Page Header & Intro Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tagline / Category Header
                </label>
                <input
                  type="text"
                  value={termsConfig.subtitle}
                  onChange={(e) => setTermsConfig({ ...termsConfig, subtitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  placeholder="LEGAL AGREEMENTS"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Main Page Heading
                </label>
                <input
                  type="text"
                  value={termsConfig.title}
                  onChange={(e) => setTermsConfig({ ...termsConfig, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  placeholder="TERMS & CONDITIONS"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Last Updated Date String
              </label>
              <input
                type="text"
                value={termsConfig.lastUpdated}
                onChange={(e) => setTermsConfig({ ...termsConfig, lastUpdated: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                placeholder="Last updated: July 2026"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Introductory Card Description Text
              </label>
              <textarea
                rows={3}
                value={termsConfig.introText}
                onChange={(e) => setTermsConfig({ ...termsConfig, introText: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                placeholder="Welcome to the Cricket Performance Index..."
              />
            </div>
          </div>

          {/* Terms Sections Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-600" />
                2. Terms Sections ({termsConfig.sections.length})
              </h2>
              <button
                onClick={handleAddSection}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Terms Section</span>
              </button>
            </div>

            {termsConfig.sections.map((section, idx) => (
              <div key={section.id || idx} className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 space-y-4 relative">
                {/* Section Top Control Bar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="text-xs font-black text-slate-900 uppercase">
                      Section {idx + 1}: {section.title || "Untitled Section"}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveSection(idx, "up")}
                      disabled={idx === 0}
                      title="Move Section Up"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveSection(idx, "down")}
                      disabled={idx === termsConfig.sections.length - 1}
                      title="Move Section Down"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(idx)}
                      title="Delete Section"
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Section Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => handleUpdateSection(idx, "title", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                      Category Tag / Subtitle
                    </label>
                    <input
                      type="text"
                      value={section.category}
                      onChange={(e) => handleUpdateSection(idx, "category", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-orange-600 uppercase focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                      Section Icon
                    </label>
                    <select
                      value={section.icon}
                      onChange={(e) => handleUpdateSection(idx, "icon", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                    Section Main Description Paragraph
                  </label>
                  <textarea
                    rows={2}
                    value={section.description}
                    onChange={(e) => handleUpdateSection(idx, "description", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Bullets List Editor */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                      Bullet Points ({section.bullets?.length || 0})
                    </span>
                    <button
                      onClick={() => handleAddBullet(idx)}
                      className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Bullet</span>
                    </button>
                  </div>

                  {section.bullets?.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2">
                      <span className="text-slate-400 font-black text-xs">•</span>
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => handleUpdateBullet(idx, bIdx, e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        onClick={() => handleDeleteBullet(idx, bIdx)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                        title="Delete bullet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={handleAddSection}
              className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-orange-500 hover:bg-orange-500/5 text-slate-600 hover:text-orange-600 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ADD NEW TERMS SECTION</span>
            </button>
          </div>

          {/* LIVE COACH PAGE PREVIEW */}
          {showPreview && (
            <div className="mt-8 border-t-2 border-slate-300 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-orange-600 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Live Preview (How Coaches See This Page at /terms)
                </span>
                <span className="text-[10px] text-slate-400 font-bold">CPI Mobile/Desktop View</span>
              </div>

              <div className="bg-slate-100 p-6 rounded-3xl border border-slate-300 space-y-6">
                <div className="space-y-1 text-center">
                  <h1 className="text-zinc-500 font-black tracking-widest text-xs uppercase">
                    {termsConfig.subtitle}
                  </h1>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                    {termsConfig.title}
                  </h2>
                </div>

                <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
                  <p className="text-xs font-bold text-zinc-400 leading-relaxed">
                    {termsConfig.introText}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-medium">{termsConfig.lastUpdated}</p>
                </div>

                <div className="space-y-4">
                  {termsConfig.sections.map((sec, i) => (
                    <div key={i} className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                          {renderIcon(sec.icon)}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase">
                            {sec.number ? `${sec.number} ` : ""}{sec.title}
                          </h3>
                          <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">
                            {sec.category}
                          </p>
                        </div>
                      </div>

                      {sec.description && (
                        <p className="text-xs font-bold text-zinc-400 leading-relaxed">
                          {sec.description}
                        </p>
                      )}

                      {sec.bullets && sec.bullets.length > 0 && (
                        <ul className="text-xs font-bold text-zinc-400 space-y-2 pl-4 list-disc">
                          {sec.bullets.map((b, bI) => (
                            <li key={bI}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-orange-600/30 transition-all disabled:opacity-50 uppercase cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save & Publish Terms to Coach Panel</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL SYSTEM CONTENT & TOOLTIPS */}
      {activeTab === "general" && (
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
      )}
    </div>
  );
}
