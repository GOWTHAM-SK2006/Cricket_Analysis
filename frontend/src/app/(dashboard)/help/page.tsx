"use client";

import { useState, useEffect } from "react";
import {
  HelpCircle,
  ChevronRight,
  Clipboard,
  ShieldCheck,
  TrendingUp,
  Target,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Layers,
  RotateCcw,
  User,
  Star,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
        goal: src.practice.goal,
      },
    };
  });
};

const coachPlanData: CoachPlanItem[] = buildCoachPlanDataFromSource();

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 14,
    },
  },
};

export default function HelpPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
  const [scoreTab, setScoreTab] = useState<"high" | "medium" | "low">("high");
  const [plans, setPlans] = useState<CoachPlanItem[]>(coachPlanData);
  const [welcomeText, setWelcomeText] = useState<string>(
    "Welcome to the Cricket Performance Index (CPI) platform. This guide explains how our index works, how to interpret scores on an out-of-10 scale, and provides the complete Coach’s Plan of Action for player development."
  );
  const [ppiDesc, setPpiDesc] = useState<string>(
    "The Practice Performance Index (PPI) is a structured coaching tool used to assess how effectively a young cricketer trains and develops during practice. It measures performance across the 5 core parameters on a 0 – 10 scale: technique, skill level, game plan, preparation, and intensity."
  );
  const [mpiDesc, setMpiDesc] = useState<string>(
    "The Match Performance Index (MPI) is a structured coaching tool used to assess how effectively a young cricketer performs during competitive play on a 0 – 10 scale. It measures performance across the 5 core parameters on a 0 – 10 scale: technique, skill level, game plan, preparation, and intensity."
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
                  return (
                    t.includes("PRESSURE") ||
                    t.includes("IDENTIFY") ||
                    t.includes("REFINE") ||
                    t.includes("EXPAND") ||
                    t.includes("CONSOLIDATE") ||
                    t.includes("AUTOMATE") ||
                    t.includes("CHANNEL")
                  );
                };

                return {
                  id: String(item?.id || fallback.id),
                  name: String(item?.name || item?.parameter || fallback.name),
                  description: String(item?.description || item?.explanation || fallback.description),
                  highPoints: !isOldPts(item?.highPoints)
                    ? item.highPoints.map((pt: any, pIdx: number) => ({
                        title: String(pt?.title || fallback.highPoints[pIdx]?.title || "Benchmark Point"),
                        detail: String(pt?.detail || fallback.highPoints[pIdx]?.detail || ""),
                      }))
                    : fallback.highPoints,
                  highSummary: String(item?.highSummary || item?.rangeHigh || fallback.highSummary),
                  mediumPoints: !isOldPts(item?.mediumPoints)
                    ? item.mediumPoints.map((pt: any, pIdx: number) => ({
                        title: String(pt?.title || fallback.mediumPoints?.[pIdx]?.title || "Benchmark Point"),
                        detail: String(pt?.detail || fallback.mediumPoints?.[pIdx]?.detail || ""),
                      }))
                    : fallback.mediumPoints || [],
                  mediumSummary: String(item?.mediumSummary || fallback.mediumSummary || ""),
                  lowPoints: !isOldPts(item?.lowPoints)
                    ? item.lowPoints.map((pt: any, pIdx: number) => ({
                        title: String(pt?.title || fallback.lowPoints[pIdx]?.title || "Benchmark Point"),
                        detail: String(pt?.detail || fallback.lowPoints[pIdx]?.detail || ""),
                      }))
                    : fallback.lowPoints,
                  lowSummary: String(item?.lowSummary || item?.rangeLow || fallback.lowSummary || ""),
                  coachSummary: {
                    overview: String(item?.coachSummary?.overview || fallback.coachSummary.overview),
                    high: String(item?.coachSummary?.high || fallback.coachSummary.high),
                    medium: String(item?.coachSummary?.medium || fallback.coachSummary.medium || "refine and stabilize"),
                    low: String(item?.coachSummary?.low || fallback.coachSummary.low),
                    goal: String(item?.coachSummary?.goal || fallback.coachSummary.goal),
                  },
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative space-y-6 pb-20 text-left select-none max-w-lg mx-auto px-3 sm:px-0"
    >
      {/* Ambient Depth Lighting */}
      <div className="absolute -top-16 -right-16 w-72 h-72 bg-[radial-gradient(circle,rgba(212,175,55,0.14)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-[radial-gradient(circle,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* ── 1. HEADER BANNER ── */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#181B27] via-[#12141D] to-[#0A0C12] border border-[#D4AF37]/35 shadow-2xl shadow-[#D4AF37]/10 p-5 sm:p-6 space-y-4 backdrop-blur-xl group"
      >
        {/* Subtle Gold Shimmer Sweep Top Border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-90" />

        {/* Ambient Radial Flare in corner */}
        <div className="absolute -top-14 -right-14 w-48 h-48 bg-[radial-gradient(circle,rgba(212,175,55,0.22)_0%,transparent_70%)] pointer-events-none" />

        <div className="space-y-2 z-10 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#F5BA4E] text-[9.5px] font-black tracking-widest uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]" />
            </span>
            <span>FRAMEWORK AND ASSESSMENT GUIDE</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-snug text-white pt-0.5">
            WELCOME TO THE{" "}
            <span className="bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent">
              CRICKET PERFORMANCE INDEX (CPI)
            </span>
          </h1>

          <p className="text-xs sm:text-[13px] text-zinc-300 font-medium leading-relaxed border-t border-white/8 pt-3">
            {welcomeText}
          </p>
        </div>
      </motion.div>

      {/* ── 2. PPI DETAILS ── */}
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -3, scale: 1.01 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#181B27]/95 to-[#12141D]/95 border border-white/10 hover:border-[#D4AF37]/50 p-5 space-y-3.5 shadow-xl hover:shadow-2xl hover:shadow-[#D4AF37]/10 transition-all duration-300 group"
      >
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center text-[#D4AF37] shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
            <Clipboard className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase group-hover:text-[#F5BA4E] transition-colors leading-tight">
              Practice Performance Index (PPI)
            </h3>
            <p className="text-[10px] font-black text-[#F5BA4E] uppercase tracking-wider mt-0.5">
              Practice Assessment Index
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-[13px] font-medium text-zinc-300 leading-relaxed">
          {ppiDesc}
        </p>
      </motion.div>

      {/* ── 3. MPI DETAILS ── */}
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -3, scale: 1.01 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#181B27]/95 to-[#12141D]/95 border border-white/10 hover:border-[#D4AF37]/50 p-5 space-y-3.5 shadow-xl hover:shadow-2xl hover:shadow-[#D4AF37]/10 transition-all duration-300 group"
      >
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center text-[#D4AF37] shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
            <ShieldCheck className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase group-hover:text-[#F5BA4E] transition-colors leading-tight">
              Match Performance Index (MPI)
            </h3>
            <p className="text-[10px] font-black text-[#F5BA4E] uppercase tracking-wider mt-0.5">
              Match Assessment Index
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-[13px] font-medium text-zinc-300 leading-relaxed">
          {mpiDesc}
        </p>
      </motion.div>

      {/* ── 4. CPI DETAILS ── */}
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -3, scale: 1.01 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#181B27]/95 to-[#12141D]/95 border border-[#D4AF37]/35 hover:border-[#D4AF37]/70 p-5 space-y-3.5 shadow-xl hover:shadow-2xl hover:shadow-[#D4AF37]/15 transition-all duration-300 group"
      >
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/45 flex items-center justify-center text-[#D4AF37] shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-md shadow-[#D4AF37]/20">
            <TrendingUp className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase group-hover:text-[#F5BA4E] transition-colors leading-tight">
              Cricket Performance Index (CPI)
            </h3>
            <p className="text-[10px] font-black text-[#F5BA4E] uppercase tracking-wider mt-0.5">
              Overall Player Rating Index
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-[13px] font-medium text-zinc-300 leading-relaxed">
          {cpiDesc}
        </p>
      </motion.div>

      {/* ── 5. THE COACH’S PLAN OF ACTION (HOW TO SCORE A PLAYER) ── */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#181B27]/95 to-[#12141D]/95 border border-white/10 p-5 sm:p-6 space-y-5 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center gap-3.5 border-b border-white/8 pb-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center text-[#D4AF37] shrink-0 shadow-sm">
            <BookOpen className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase leading-snug">
              HOW TO SCORE A PLAYER
            </h3>
            <span className="text-[10px] font-black text-[#F5BA4E] uppercase tracking-widest block mt-0.5">
              THE 5 KEY PERFORMANCE AREAS
            </span>
          </div>
        </div>

        {/* Parameter Selector Tabs */}
        <div className="space-y-2">
          <div className="bg-[#0E1017] p-1.5 rounded-2xl border border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {plans.map((plan, idx) => (
              <button
                key={plan.id}
                onClick={() => {
                  setSelectedPlanIndex(idx);
                  setScoreTab("high");
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all cursor-pointer border ${
                  selectedPlanIndex === idx
                    ? "bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] text-[#090A0E] border-[#D4AF37]/60 shadow-lg shadow-[#D4AF37]/25 scale-[1.02]"
                    : "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5 border-transparent"
                }`}
              >
                {plan.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Parameter Details */}
        <div className="space-y-4 pt-1 border-t border-white/8">
          <div className="bg-[#0E1017] p-4.5 rounded-2xl border border-white/10 space-y-1.5">
            <span className="text-xs font-black text-[#F5BA4E] uppercase tracking-wider block flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
              {safeName} Index Overview
            </span>
            <p className="text-xs sm:text-[13px] font-medium text-zinc-300 leading-relaxed">
              {safeDescription}
            </p>
          </div>

          {/* High vs Medium vs Low Score Action Toggle */}
          <div className="flex bg-[#0E1017] p-1.5 rounded-2xl border border-white/10 gap-1.5">
            <button
              onClick={() => setScoreTab("high")}
              className={`flex-1 py-2.5 px-2 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                scoreTab === "high"
                  ? "bg-emerald-500 text-[#090A0E] shadow-md shadow-emerald-500/25"
                  : "text-zinc-400 hover:text-emerald-400 hover:bg-white/5"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>A SCORE (&gt;7)</span>
            </button>
            <button
              onClick={() => setScoreTab("medium")}
              className={`flex-1 py-2.5 px-2 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                scoreTab === "medium"
                  ? "bg-gradient-to-r from-[#F5BA4E] to-[#D4AF37] text-[#090A0E] shadow-md shadow-[#D4AF37]/25"
                  : "text-zinc-400 hover:text-[#F5BA4E] hover:bg-white/5"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span>A SCORE (5-7)</span>
            </button>
            <button
              onClick={() => setScoreTab("low")}
              className={`flex-1 py-2.5 px-2 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                scoreTab === "low"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                  : "text-zinc-400 hover:text-rose-400 hover:bg-white/5"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>A SCORE (&lt;5)</span>
            </button>
          </div>

          {/* Action Points Content */}
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider block text-white">
              {scoreTab === "high"
                ? `STRONG ${safeName.toUpperCase()} BENCHMARKS:`
                : scoreTab === "medium"
                ? "AVERAGE BENCHMARKS:"
                : `LOW ${safeName.toUpperCase()} BENCHMARKS:`}
            </span>
            <div className="space-y-2.5">
              {activePoints.map((pt, i) => (
                <div
                  key={i}
                  className="bg-[#0E1017] p-3.5 rounded-2xl border border-white/10 flex gap-3.5 items-start text-xs hover:border-white/20 transition-colors"
                >
                  <span
                    className={`w-5.5 h-5.5 rounded-full flex items-center justify-center font-mono font-black text-[10px] shrink-0 mt-0.5 ${
                      scoreTab === "high"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : scoreTab === "medium"
                        ? "bg-[#D4AF37]/15 text-[#F5BA4E] border border-[#D4AF37]/30"
                        : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-black text-white block uppercase leading-tight">
                      {pt.title}
                    </span>
                    {pt.detail &&
                      pt.detail.trim().toLowerCase() !== pt.title.trim().toLowerCase() && (
                        <span className="font-medium text-zinc-300 leading-relaxed mt-1 block">
                          {pt.detail}
                        </span>
                      )}
                  </div>
                </div>
              ))}
            </div>

            {/* High/Medium/Low Summary Banner */}
            {scoreTab === "high" && safeHighSummary && (
              <div className="bg-emerald-950/30 p-4 rounded-2xl border border-emerald-500/30 text-xs font-semibold text-emerald-300 leading-relaxed italic shadow-sm">
                {safeHighSummary}
              </div>
            )}
            {scoreTab === "medium" && safeMediumSummary && (
              <div className="bg-[#D4AF37]/10 p-4 rounded-2xl border border-[#D4AF37]/30 text-xs font-semibold text-[#F5BA4E] leading-relaxed italic shadow-sm">
                {safeMediumSummary}
              </div>
            )}
            {scoreTab === "low" && safeLowSummary && (
              <div className="bg-rose-950/30 p-4 rounded-2xl border border-rose-500/30 text-xs font-semibold text-rose-300 leading-relaxed italic shadow-sm">
                {safeLowSummary}
              </div>
            )}
          </div>

          {/* BENCHMARK GUIDING PRINCIPLES SUMMARY */}
          <div className="bg-gradient-to-br from-[#D4AF37]/15 via-[#181B27] to-[#12141D] border border-[#D4AF37]/35 p-5 rounded-2.5xl space-y-2.5 text-xs shadow-md">
            <span className="text-[10px] font-black text-[#F5BA4E] uppercase tracking-widest block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
              SUMMARY GUIDING PRINCIPLES
            </span>
            <ul className="space-y-2 font-bold text-white">
              <li className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_6px_#D4AF37] shrink-0" />
                <span>Watch the pattern, not the moment</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_6px_#D4AF37] shrink-0" />
                <span>Score the evidence, not the impression</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_6px_#D4AF37] shrink-0" />
                <span>Have a clear reason what earned the score</span>
              </li>
            </ul>
          </div>

          {/* HOW TO INTERPRET CPI SCORES (OUT OF 10) */}
          <div className="bg-[#0E1017] p-5 rounded-2.5xl border border-white/10 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
              SCORE INTERPRETATION SUMMARY
            </h3>
            <div className="space-y-3.5">
              <div className="space-y-1.5 pb-3 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    BELOW 5.0
                  </span>
                  <span className="text-xs font-black text-white uppercase">- LOW</span>
                </div>
                <p className="text-xs font-medium text-zinc-300 leading-relaxed">
                  {below5}
                </p>
              </div>

              <div className="space-y-1.5 pb-3 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#F5BA4E] bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    5.0 TO 7.0
                  </span>
                  <span className="text-xs font-black text-white uppercase">- AVERAGE</span>
                </div>
                <p className="text-xs font-medium text-zinc-300 leading-relaxed">
                  {between5And7}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    7.0 AND ABOVE
                  </span>
                  <span className="text-xs font-black text-white uppercase">- HIGH</span>
                </div>
                <p className="text-xs font-medium text-zinc-300 leading-relaxed">
                  {above7}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 6. ACTION BUTTONS ── */}
      <motion.div variants={itemVariants} className="space-y-3 pt-2">
        {/* Restart Tour */}
        <motion.button
          whileHover={{ scale: 1.015, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            localStorage.setItem("cpi_onboarding_completed", "false");
            localStorage.setItem("cpi_players_tour_completed", "false");
            window.location.href = "/dashboard";
          }}
          className="w-full bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] hover:from-[#F8C868] hover:to-[#C69212] text-[#090A0E] rounded-2xl py-4 text-sm font-black flex items-center justify-center gap-2 shadow-xl shadow-[#D4AF37]/25 border border-[#D4AF37]/50 cursor-pointer uppercase tracking-wider active:scale-98 transition-all"
        >
          <RotateCcw className="w-4 h-4 stroke-[2.8]" />
          <span>RESTART TOUR</span>
        </motion.button>

        {/* Back to Profile */}
        <motion.div whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}>
          <Link
            href="/profile"
            className="w-full bg-[#12141D]/90 hover:bg-[#181B27] text-zinc-300 hover:text-white rounded-2xl py-4 text-sm font-black flex items-center justify-center gap-2 border border-white/10 hover:border-[#D4AF37]/40 shadow-sm cursor-pointer uppercase tracking-wider text-center block transition-all"
          >
            <User className="w-4 h-4 text-[#D4AF37]" />
            <span>BACK TO PROFILE</span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Footer Copyright */}
      <div className="text-center pt-2 pb-2">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          © 2026 CPI – Cricket Performance Index. All rights reserved.
        </p>
      </div>
    </motion.div>
  );
}
