"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Shield, 
  UserCheck, 
  Lock, 
  HelpCircle, 
  ArrowLeft,
  Scale,
  AlertCircle,
  CheckCircle2,
  Info
} from "lucide-react";
import Link from "next/link";

interface TermsSection {
  id?: string;
  number?: string;
  title: string;
  category: string;
  icon?: string;
  description: string;
  bullets?: string[];
}

interface TermsData {
  title: string;
  subtitle: string;
  introText: string;
  lastUpdated: string;
  sections: TermsSection[];
}

const DEFAULT_TERMS: TermsData = {
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

export default function TermsPage() {
  const [terms, setTerms] = useState<TermsData>(DEFAULT_TERMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTermsConfig() {
      try {
        const res = await fetch("/api/public/config");
        if (res.ok) {
          const data = await res.json();
          if (data && data.termsJson && typeof data.termsJson === "string") {
            const parsed = JSON.parse(data.termsJson);
            if (parsed && typeof parsed === "object" && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
              setTerms(parsed);
            }
          }
        }
      } catch (err) {
        console.error("Could not fetch terms config, using defaults", err);
      } finally {
        setLoading(false);
      }
    }
    loadTermsConfig();
  }, []);

  const renderIcon = (iconName?: string) => {
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
    <div className="space-y-6 pb-12 select-none">
      
      {/* Title */}
      <div className="space-y-2 text-center">
        <h1 className="text-zinc-500 font-black tracking-widest text-xs uppercase">{terms.subtitle}</h1>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{terms.title}</h2>
      </div>

      {/* Intro Card */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3">
        <p className="text-sm font-bold text-zinc-400 leading-relaxed">
          {terms.introText}
        </p>
        <p className="text-xs text-zinc-500 font-medium">
          {terms.lastUpdated.startsWith("Last updated:") ? terms.lastUpdated : `Last updated: ${terms.lastUpdated}`}
        </p>
      </div>

      {/* Terms list */}
      <div className="space-y-4">
        {terms.sections.map((section, idx) => {
          const displayNum = section.number ? section.number : `${idx + 1}.`;
          return (
            <div key={section.id || idx} className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                  {renderIcon(section.icon)}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">
                    {displayNum} {section.title}
                  </h3>
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">
                    {section.category}
                  </p>
                </div>
              </div>

              {section.description && (
                <p className="text-xs font-bold text-zinc-400 leading-relaxed">
                  {section.description}
                </p>
              )}

              {section.bullets && section.bullets.length > 0 && (
                <ul className="text-xs font-bold text-zinc-400 space-y-2 pl-4 list-disc">
                  {section.bullets.map((bullet, bIdx) => (
                    <li key={bIdx}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Back Button */}
      <Link
        href="/profile"
        className="w-full bg-slate-100 hover:bg-slate-100 text-slate-900 rounded-2xl py-4.5 text-base font-extrabold flex items-center justify-center gap-2 transition-all border border-slate-200 cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
        BACK TO PROFILE
      </Link>

    </div>
  );
}
