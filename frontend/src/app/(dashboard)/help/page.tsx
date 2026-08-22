"use client";

import { useState, useEffect } from "react";
import { 
  HelpCircle, ChevronRight, Clipboard, ShieldCheck, TrendingUp, 
  Target, Sparkles, Flame, CheckCircle2, AlertTriangle, BookOpen, Layers
} from "lucide-react";
import Link from "next/link";
import CricketLoader from "@/components/CricketLoader";

import { CPI_PREDEFINED_SOURCE, ApprovedCpiParameter } from "@/lib/cpiPredefinedSource";

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

const buildCoachPlanDataFromSource = (): CoachPlanItem[] => {
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

const coachPlanData: CoachPlanItem[] = buildCoachPlanDataFromSource();

export default function HelpPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
  const [scoreTab, setScoreTab] = useState<"high" | "medium" | "low">("high");
  const [plans, setPlans] = useState<CoachPlanItem[]>(coachPlanData);
  const [welcomeText, setWelcomeText] = useState<string>(
    "Welcome to the Cricket Performance Index (CPI) platform. This guide explains how our index works, how to interpret scores on an out-of-10 scale, and provides the complete Coach’s Plan of Action for player development."
  );
  const [ppiDesc, setPpiDesc] = useState<string>(
    "The Practice Performance Index (PPI) is a structured coaching tool used to assess how effectively a young cricketer trains and develops during practice. It measures performance across key areas on a 0 – 10 scale: technique, intensity, execution, adaptability, discipline, concentration, coachability and preparation."
  );
  const [mpiDesc, setMpiDesc] = useState<string>(
    "The Match Performance Index is a structured coaching tool used to assess how effectively a young cricketer performs and responds during competitive play on a 0 – 10 scale. It measures key areas such as technique, decision making, game awareness, resilience, emotional control, teamwork, match impact and preparation."
  );
  const [cpiDesc, setCpiDesc] = useState<string>(
    "The Cricket Performance Index (CPI) is a structured coaching tool built around one simple truth: how you practise is how you will play. By measuring key performance areas in both practice and matches on a 0 – 10 scale, the CPI shows what is transferring, where performance is breaking down and what is holding a player back."
  );
  const [below5, setBelow5] = useState<string>(
    "Performance is being limited in one or more key areas. Identify the main cause and make it a coaching priority."
  );
  const [between5And7, setBetween5And7] = useState<string>(
    "There are positive signs, but performance is still inconsistent. Focus on improving consistency and transfer into matches."
  );
  const [above7, setAbove7] = useState<string>(
    "Performance is strong across the key areas. Protect what is working, maintain standards and continue to challenge the player."
  );

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        let helpJsonStr: string | null = null;
        try {
          const res = await fetch("/api/public/config");
          if (res.ok) {
            const data = await res.json();
            if (data && data.helpJson) {
              helpJsonStr = typeof data.helpJson === "string" ? data.helpJson : JSON.stringify(data.helpJson);
            }
          }
        } catch (e) {}

        if (!helpJsonStr && typeof window !== "undefined") {
          helpJsonStr = localStorage.getItem("cpi_help_config");
        }

        if (helpJsonStr) {
          const parsed = typeof helpJsonStr === "string" ? JSON.parse(helpJsonStr) : helpJsonStr;
          if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed.coachPlanData) && parsed.coachPlanData.length > 0) {
              const sanitized = parsed.coachPlanData.map((item: any, i: number) => {
                const fallback = coachPlanData[i] || coachPlanData[0];
                const isOldPts = (pts: any[]) => {
                  if (!Array.isArray(pts) || pts.length !== 5) return true;
                  const t = String(pts[0]?.title || "").toUpperCase();
                  return t.includes("PRESSURE") || t.includes("IDENTIFY") || t.includes("REFINE") || t.includes("EXPAND") || t.includes("CONSOLIDATE") || t.includes("AUTOMATE") || t.includes("CHANNEL");
                };

                return {
                  id: String(item?.id || fallback.id),
                  name: String(item?.name || item?.parameter || fallback.name),
                  description: String(item?.description || item?.explanation || fallback.description),
                  highPoints: !isOldPts(item?.highPoints)
                    ? item.highPoints.map((pt: any, pIdx: number) => ({
                        title: String(pt?.title || fallback.highPoints[pIdx]?.title || "Benchmark Point"),
                        detail: String(pt?.detail || fallback.highPoints[pIdx]?.detail || "")
                      }))
                    : fallback.highPoints,
                  highSummary: String(item?.highSummary || item?.rangeHigh || fallback.highSummary),
                  mediumPoints: !isOldPts(item?.mediumPoints)
                    ? item.mediumPoints.map((pt: any, pIdx: number) => ({
                        title: String(pt?.title || fallback.mediumPoints?.[pIdx]?.title || "Benchmark Point"),
                        detail: String(pt?.detail || fallback.mediumPoints?.[pIdx]?.detail || "")
                      }))
                    : fallback.mediumPoints || [],
                  mediumSummary: String(item?.mediumSummary || fallback.mediumSummary || ""),
                  lowPoints: !isOldPts(item?.lowPoints)
                    ? item.lowPoints.map((pt: any, pIdx: number) => ({
                        title: String(pt?.title || fallback.lowPoints[pIdx]?.title || "Benchmark Point"),
                        detail: String(pt?.detail || fallback.lowPoints[pIdx]?.detail || "")
                      }))
                    : fallback.lowPoints,
                  lowSummary: String(item?.lowSummary || item?.rangeLow || fallback.lowSummary || ""),
                  coachSummary: {
                    overview: String(item?.coachSummary?.overview || fallback.coachSummary.overview),
                    high: String(item?.coachSummary?.high || fallback.coachSummary.high),
                    medium: String(item?.coachSummary?.medium || fallback.coachSummary.medium || "refine and stabilize"),
                    low: String(item?.coachSummary?.low || fallback.coachSummary.low),
                    goal: String(item?.coachSummary?.goal || fallback.coachSummary.goal)
                  }
                };
              });
              setPlans(sanitized);
            }
            if (typeof parsed.welcomeText === "string") setWelcomeText(parsed.welcomeText);
            if (typeof parsed.ppiDescription === "string") setPpiDesc(parsed.ppiDescription);
            if (typeof parsed.mpiDescription === "string") setMpiDesc(parsed.mpiDescription);
            if (typeof parsed.cpiDescription === "string") setCpiDesc(parsed.cpiDescription);
            if (typeof parsed.below5Text === "string") setBelow5(parsed.below5Text);
            if (typeof parsed.between5And7Text === "string") setBetween5And7(parsed.between5And7Text);
            if (typeof parsed.above7Text === "string") setAbove7(parsed.above7Text);
          }
        }
      } catch (err) {
        console.warn("Could not load dynamic help config, using local default:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  if (loading) {
    return <CricketLoader message="Loading Help & Information..." />;
  }

  const currentPlan = plans[selectedPlanIndex] || plans[0] || coachPlanData[0];
  const safeName = currentPlan?.name || "Parameter";
  const safeDescription = currentPlan?.description || "";
  const safeHighPoints = Array.isArray(currentPlan?.highPoints) ? currentPlan.highPoints : [];
  const safeMediumPoints = Array.isArray(currentPlan?.mediumPoints) ? currentPlan.mediumPoints : [];
  const safeLowPoints = Array.isArray(currentPlan?.lowPoints) ? currentPlan.lowPoints : [];
  const activePoints = (scoreTab === "high" ? safeHighPoints : scoreTab === "medium" ? safeMediumPoints : safeLowPoints).slice(0, 10);
  const safeHighSummary = currentPlan?.highSummary || coachPlanData[selectedPlanIndex]?.highSummary || "";
  const safeMediumSummary = currentPlan?.mediumSummary || coachPlanData[selectedPlanIndex]?.mediumSummary || coachPlanData[0]?.mediumSummary || "";
  const safeLowSummary = currentPlan?.lowSummary || coachPlanData[selectedPlanIndex]?.lowSummary || "";
  const safeCoachSummary = currentPlan?.coachSummary || {
    overview: "Overview of parameter performance.",
    high: "protect and refine.",
    medium: "refine and stabilize.",
    low: "identify and rebuild.",
    goal: "develop consistent performance under pressure."
  };

  return (
    <div className="space-y-6 pb-12 text-left select-none max-w-lg mx-auto">
      
      {/* HEADER BANNER */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 text-left shadow-sm">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold text-[10px] tracking-widest uppercase border border-orange-500/20">
            FRAMEWORK AND ASSESSMENT GUIDE
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] uppercase tracking-tight leading-snug">
          WELCOME TO THE CRICKET PERFORMANCE INDEX (CPI)
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-3">
          {welcomeText}
        </p>
      </div>

      {/* PPI Details */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <Clipboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase">Practice Performance Index (PPI)</h3>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Practice Assessment Index</p>
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-900 leading-relaxed">
          {ppiDesc}
        </p>
      </div>

      {/* MPI Details */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase">Match Performance Index (MPI)</h3>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Match Assessment Index</p>
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-900 leading-relaxed">
          {mpiDesc}
        </p>
      </div>

      {/* CPI Details */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase">Cricket Performance Index (CPI)</h3>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Overall Player Rating Index</p>
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-900 leading-relaxed">
          {cpiDesc}
        </p>
      </div>

      {/* THE COACH’S PLAN OF ACTION */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase leading-snug">HOW TO SCORE A PLAYER</h3>
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block mt-0.5">
              THE 7 KEY PERFORMANCE AREAS
            </span>
          </div>
        </div>

        {/* Parameter Selector Tabs */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {plans.map((plan, idx) => (
              <button
                key={plan.id}
                onClick={() => { setSelectedPlanIndex(idx); setScoreTab("high"); }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase whitespace-nowrap transition-all cursor-pointer border ${
                  selectedPlanIndex === idx
                    ? "bg-orange-500 text-black border-orange-500 shadow-md scale-[1.02]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                {plan.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Parameter Details */}
        <div className="space-y-4 pt-1 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
            <span className="text-xs font-black text-orange-600 uppercase tracking-wider block">
              {safeName} Index Overview
            </span>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              {safeDescription}
            </p>
          </div>

          {/* High vs Medium vs Low Score Action Toggle */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1 sm:gap-1.5">
            <button
              onClick={() => setScoreTab("high")}
              className={`flex-1 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                scoreTab === "high"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-800 hover:text-slate-900"
              }`}
            >
              A SCORE (&gt;7)
            </button>
            <button
              onClick={() => setScoreTab("medium")}
              className={`flex-1 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                scoreTab === "medium"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-800 hover:text-slate-900"
              }`}
            >
              A SCORE (5-7)
            </button>
            <button
              onClick={() => setScoreTab("low")}
              className={`flex-1 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                scoreTab === "low"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-800 hover:text-slate-900"
              }`}
            >
              A SCORE (&lt;5)
            </button>
          </div>

          {/* Action Points Content */}
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider block text-slate-800">
              {scoreTab === "high" ? `STRONG ${safeName.toUpperCase()} BENCHMARKS:` : scoreTab === "medium" ? "AVERAGE" : `LOW ${safeName.toUpperCase()} BENCHMARKS:`}
            </span>
            <div className="space-y-2">
              {activePoints.map((pt, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex gap-3 items-start text-xs">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-black text-[10px] shrink-0 mt-0.5 ${
                    scoreTab === "high" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                    scoreTab === "medium" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                    "bg-rose-100 text-rose-800 border border-rose-300"
                  }`}>
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-black text-slate-900 block uppercase">{pt.title}</span>
                    {pt.detail && pt.detail.trim().toLowerCase() !== pt.title.trim().toLowerCase() && (
                      <span className="font-medium text-slate-700 leading-relaxed">{pt.detail}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* High/Medium/Low Summary Banner */}
            {scoreTab === "high" && safeHighSummary && (
              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 text-xs font-semibold text-emerald-950 leading-relaxed italic">
                {safeHighSummary}
              </div>
            )}
            {scoreTab === "medium" && safeMediumSummary && (
              <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 text-xs font-semibold text-amber-950 leading-relaxed italic">
                {safeMediumSummary}
              </div>
            )}
            {scoreTab === "low" && safeLowSummary && (
              <div className="bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200 text-xs font-semibold text-rose-950 leading-relaxed italic">
                {safeLowSummary}
              </div>
            )}
          </div>

          {/* BENCHMARK GUIDING PRINCIPLES SUMMARY */}
          <div className="bg-orange-50/80 border border-orange-200 p-4 rounded-2.5xl space-y-2 text-xs">
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block">
              SUMMARY GUIDING PRINCIPLES
            </span>
            <ul className="space-y-1.5 font-bold text-slate-900">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                Watch the pattern, not the moment
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                Score the evidence, not the impression
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                Have a clear reason what earned the score
              </li>
            </ul>
          </div>

          {/* HOW TO INTERPRET CPI SCORES (OUT OF 10) */}
          <div className="bg-slate-50/80 p-4.5 rounded-2.5xl border border-slate-200 space-y-3.5 shadow-xs">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">SCORE INTERPRETATION SUMMARY</h3>
            <div className="space-y-3.5">
              <div className="space-y-1 pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-red-500 uppercase tracking-wider">BELOW 5.0</span>
                  <span className="text-xs font-black text-slate-900 uppercase">- LOW</span>
                </div>
                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                  {below5}
                </p>
              </div>
              <div className="space-y-1 pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-500 uppercase tracking-wider">5.0 TO 7.0</span>
                  <span className="text-xs font-black text-slate-900 uppercase">- AVERAGE</span>
                </div>
                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                  {between5And7}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-500 uppercase tracking-wider">7.0 AND ABOVE</span>
                  <span className="text-xs font-black text-slate-900 uppercase">- HIGH</span>
                </div>
                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                  {above7}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restart Tour */}
      <button
        onClick={() => {
          localStorage.setItem("cpi_onboarding_completed", "false");
          localStorage.setItem("cpi_players_tour_completed", "false");
          window.location.href = "/dashboard";
        }}
        className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-4.5 text-base font-black flex items-center justify-center gap-2 transition-all border border-orange-450 cursor-pointer uppercase"
      >
        Restart Tour
      </button>

      {/* Back to Profile */}
      <Link
        href="/profile"
        className="w-full bg-slate-100 hover:bg-slate-100 text-slate-900 rounded-2xl py-4.5 text-base font-extrabold flex items-center justify-center gap-2 transition-all border border-slate-200 cursor-pointer text-center block"
      >
        BACK TO PROFILE
      </Link>

    </div>
  );
}
