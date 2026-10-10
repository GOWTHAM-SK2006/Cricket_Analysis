"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Target,
  Activity,
  Zap,
  ChevronRight,
  Clipboard,
  MessageSquare,
  Bot,
  BarChart3,
  TrendingUp,
  Trophy,
  Users,
  ShieldCheck,
  Sparkles,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import CricketLoader from "@/components/CricketLoader";
import AIChatModal from "@/components/AIChatModal";

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

interface DashboardStats {
  totalPlayers: number;
  avgPpi: number;
  avgMpi: number;
  avgCpi: number;
  bestCount?: number;
  avgCount?: number;
  lowCount?: number;
  playersNeedingAttention?: Array<{
    name: string;
    cpi: number;
    role: string;
  }>;
  topPerformers?: Array<{
    name: string;
    cpi: number;
    role: string;
  }>;
  recentAssessments?: Array<{
    playerName: string;
    assessmentType: string;
    score: number;
    date: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [coachName, setCoachName] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  // Dashboard stats
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Chatbot modal state
  const [showChatModal, setShowChatModal] = useState(false);

  const totalCount = stats?.totalPlayers || 0;
  const bestCount = stats?.bestCount ?? 0;
  const avgCount = stats?.avgCount ?? 0;
  const lowCount = stats?.lowCount ?? 0;

  // Player specific state for dashboard
  const [coachFeedback, setCoachFeedback] = useState<string[]>([]);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") || "coach";
    setRole(storedRole === "player" ? "player" : "coach");

    const cachedProfile = sessionStorage.getItem("cpi_user_profile");
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        setCoachName(parsed.name || "");
      } catch (e) {}
    } else {
      setCoachName(localStorage.getItem("userName") || "");
    }

    const loadDashboardData = async () => {
      try {
        const statsRes = await api.get("/dashboard/stats");
        setStats(statsRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatActivityDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatScoreValue = (val: number | null | undefined) => {
    if (val === null || val === undefined || val === 0) return "N/A";
    const num = typeof val === "number" ? val : parseFloat(val as any);
    if (isNaN(num) || num <= 0) return "N/A";
    const score100 = num <= 10 ? Math.round(num * 10) : Math.round(num);
    return `${score100}`;
  };

  if (loading) {
    return <CricketLoader message="Loading Coach Assistant..." />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative space-y-7 pb-20 select-none max-w-lg mx-auto text-left"
    >
      {/* Ambient Depth Lighting */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-72 h-72 bg-[#F59E0B]/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. HERO WELCOME SECTION */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#181B27] via-[#12141D] to-[#0A0C12] border border-[#D4AF37]/30 shadow-2xl shadow-[#D4AF37]/10 p-5 sm:p-6 backdrop-blur-xl group"
      >
        {/* Subtle Gold Shimmer Sweep Top Border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-90" />

        {/* Ambient Radial Glow */}
        <div className="absolute -top-14 -right-14 w-48 h-48 bg-[radial-gradient(circle,rgba(212,175,55,0.22)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#F5BA4E] font-black text-[9.5px] tracking-widest uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]" />
                </span>
                WELCOME BACK COACH
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-none flex items-center gap-2 pt-0.5">
                <span className="bg-gradient-to-r from-white via-[#F3F4F6] to-[#FCE8B2] bg-clip-text text-transparent">
                  {coachName || (typeof window !== "undefined" ? localStorage.getItem("userName") : "") || "COACH"}
                </span>
                <motion.span
                  animate={{ rotate: [0, -12, 12, -6, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  className="inline-block text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.6)] cursor-default"
                >
                  ⚡
                </motion.span>
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowChatModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] hover:from-[#F8C868] hover:to-[#C69212] text-[#090A0E] font-black text-xs shadow-md shadow-[#D4AF37]/30 transition-all cursor-pointer"
              >
                <Bot className="w-4 h-4 stroke-[2.5]" />
                <span>AI Coach</span>
              </motion.button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#090A0E]/80 border border-[#D4AF37]/30 backdrop-blur-md shadow-inner">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[9.5px] font-black tracking-widest text-[#D4AF37] uppercase">
                  CPI HOBBY
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Info Row */}
          <div className="pt-2.5 mt-0.5 border-t border-white/10 flex items-center justify-between text-[10px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_#34D399]" />
              </span>
              <span className="uppercase tracking-wider font-extrabold text-zinc-300">
                Analytics Engine Active
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#F5BA4E] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
              <span className="bg-gradient-to-r from-[#F5BA4E] to-[#D4AF37] bg-clip-text text-transparent">
                CPI INDEX
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. TODAY'S SNAPSHOT */}
      <motion.div id="tour-snapshot" variants={itemVariants} className="space-y-3">
        <h3 className="text-[11px] font-black tracking-widest text-zinc-300 uppercase pl-0.5 flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
            <BarChart3 className="w-2.5 h-2.5 text-[#D4AF37]" />
          </div>
          TODAY'S SNAPSHOT
        </h3>

        <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
          {/* Card 1: Total Players */}
          <motion.div
            whileHover={{ y: -3, scale: 1.015 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#181B27]/95 to-[#12141D]/95 border border-white/10 hover:border-[#D4AF37]/50 p-4 text-left space-y-2 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-[#D4AF37]/10 group"
          >
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[10.5px] font-black text-zinc-400 uppercase tracking-wider block group-hover:text-zinc-200 transition-colors">
                Total Players
              </span>
              <div className="w-7 h-7 rounded-xl bg-[#1B1E2C] border border-white/10 group-hover:border-[#D4AF37]/40 flex items-center justify-center transition-all duration-300">
                <Users className="w-3.5 h-3.5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white block leading-none tracking-tight">
                {stats?.totalPlayers || 0}
              </span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pt-1 block">
                Squad Roster
              </span>
            </div>
          </motion.div>

          {/* Card 2: Average CPI */}
          <motion.div
            whileHover={{ y: -3, scale: 1.015 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#181B27]/95 to-[#12141D]/95 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 p-4 text-left space-y-2 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-[#D4AF37]/15 group"
          >
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[10.5px] font-black text-[#F5BA4E] uppercase tracking-wider block">
                AVERAGE CPI
              </span>
              <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center transition-all duration-300">
                <BarChart3 className="w-3.5 h-3.5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-[#D4AF37] block leading-none tracking-tight drop-shadow-[0_0_12px_rgba(212,175,55,0.45)]">
                {stats?.avgCpi ? formatScoreValue(stats.avgCpi) : "N/A"}
              </span>
              <span className="text-[9px] font-bold text-[#D4AF37]/75 uppercase tracking-widest pt-1 block">
                Overall Index
              </span>
            </div>
          </motion.div>

          {/* Card 3: Average PPI */}
          <motion.div
            whileHover={{ y: -3, scale: 1.015 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#181B27]/95 to-[#12141D]/95 border border-white/10 hover:border-[#D4AF37]/50 p-4 text-left space-y-2 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-[#D4AF37]/10 group"
          >
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[10.5px] font-black text-zinc-400 uppercase tracking-wider block group-hover:text-zinc-200 transition-colors">
                AVERAGE PPI
              </span>
              <div className="w-7 h-7 rounded-xl bg-[#1B1E2C] border border-white/10 group-hover:border-[#D4AF37]/40 flex items-center justify-center transition-all duration-300">
                <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white block leading-none tracking-tight">
                {stats?.avgPpi ? formatScoreValue(stats.avgPpi) : "N/A"}
              </span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pt-1 block">
                Practice Index
              </span>
            </div>
          </motion.div>

          {/* Card 4: Average MPI */}
          <motion.div
            whileHover={{ y: -3, scale: 1.015 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#181B27]/95 to-[#12141D]/95 border border-white/10 hover:border-[#D4AF37]/50 p-4 text-left space-y-2 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-[#D4AF37]/10 group"
          >
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[10.5px] font-black text-zinc-400 uppercase tracking-wider block group-hover:text-zinc-200 transition-colors">
                AVERAGE MPI
              </span>
              <div className="w-7 h-7 rounded-xl bg-[#1B1E2C] border border-white/10 group-hover:border-[#D4AF37]/40 flex items-center justify-center transition-all duration-300">
                <Trophy className="w-3.5 h-3.5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white block leading-none tracking-tight">
                {stats?.avgMpi ? formatScoreValue(stats.avgMpi) : "N/A"}
              </span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pt-1 block">
                Match Index
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* 3. QUICK ACTIONS / SELF ASSESSMENT */}
      {role === "player" ? (
        <motion.div variants={itemVariants} className="space-y-6">
          {/* SELF ASSESSMENT */}
          <div id="tour-self-assessment" className="space-y-3">
            <h3 className="text-[11px] font-black tracking-widest text-zinc-300 uppercase pl-0.5 flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
                <Clipboard className="w-2.5 h-2.5 text-[#D4AF37]" />
              </div>
              SELF ASSESSMENT
            </h3>
            <motion.button
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/players?selfAssess=true")}
              className="w-full h-13 bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] hover:from-[#F8C868] hover:to-[#C69212] text-[#090A0E] rounded-2xl px-4 sm:px-5 text-sm font-black flex items-center justify-between cursor-pointer uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 border border-[#D4AF37]/40 transition-all duration-200 group"
            >
              <span className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#090A0E]/15 flex items-center justify-center">
                  <Clipboard className="w-4 h-4 text-[#090A0E] stroke-[2.5]" />
                </div>
                <span>Start Self Assessment</span>
              </span>
              <div className="w-7 h-7 rounded-xl bg-[#090A0E]/10 flex items-center justify-center group-hover:bg-[#090A0E]/20 transition-colors">
                <ChevronRight className="w-4 h-4 text-[#090A0E] stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </motion.button>
          </div>

          {/* LATEST COACH FEEDBACK */}
          <div id="tour-coach-feedback" className="space-y-3">
            <h3 className="text-[11px] font-black tracking-widest text-zinc-300 uppercase flex items-center gap-1.5 pl-0.5">
              <div className="w-4 h-4 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
                <MessageSquare className="w-2.5 h-2.5 text-[#D4AF37]" />
              </div>
              LATEST COACH FEEDBACK
            </h3>
            <div className="bg-gradient-to-b from-[#181B27]/90 to-[#12141D]/90 border border-white/10 rounded-2xl p-4.5 space-y-3 shadow-md backdrop-blur-md">
              {coachFeedback.length > 0 ? (
                coachFeedback.map((feedbackStr, idx) => (
                  <div
                    key={idx}
                    className="border-l-2 border-[#D4AF37] pl-3 py-1 text-xs text-zinc-200 font-semibold leading-relaxed italic relative"
                  >
                    {feedbackStr}
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400 font-medium italic text-center py-2">
                  No feedback recorded yet.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div id="tour-quick-actions" variants={itemVariants} className="space-y-3">
          <h3 className="text-[11px] font-black tracking-widest text-zinc-300 uppercase pl-0.5 flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-[#D4AF37]" />
            </div>
            QUICK ACTIONS
          </h3>
          <div className="space-y-2.5">
            {/* Action 1: Start Practice Assessment */}
            <motion.button
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/players?action=practice")}
              className="w-full h-13 bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] hover:from-[#F8C868] hover:to-[#C69212] text-[#090A0E] rounded-2xl px-4 sm:px-5 text-sm font-black flex items-center justify-between cursor-pointer uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 border border-[#D4AF37]/40 transition-all duration-200 group"
            >
              <span className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#090A0E]/15 flex items-center justify-center">
                  <Target className="w-4 h-4 text-[#090A0E] stroke-[2.5]" />
                </div>
                <span>Start Practice Assessment</span>
              </span>
              <div className="w-7 h-7 rounded-xl bg-[#090A0E]/10 flex items-center justify-center group-hover:bg-[#090A0E]/20 transition-colors">
                <ChevronRight className="w-4 h-4 text-[#090A0E] stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </motion.button>

            {/* Action 2: Start Match Assessment */}
            <motion.button
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/players?action=match")}
              className="w-full h-13 bg-gradient-to-b from-[#181B27] to-[#12141D] hover:from-[#1F2333] hover:to-[#181B27] text-white rounded-2xl px-4 sm:px-5 text-sm font-black flex items-center justify-between border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 shadow-md cursor-pointer uppercase tracking-wider transition-all duration-200 group"
            >
              <span className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#D4AF37] stroke-[2.5]" />
                </div>
                <span>Start Match Assessment</span>
              </span>
              <div className="w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </motion.button>

            {/* Action 3: Add Player */}
            <motion.button
              id="tour-add-player"
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/players?add=true")}
              className="w-full h-12 bg-[#12141D]/80 hover:bg-[#181B27] text-zinc-300 hover:text-white rounded-2xl px-4 text-xs font-black flex items-center justify-center gap-2 border border-white/10 hover:border-[#D4AF37]/40 cursor-pointer uppercase tracking-wider transition-all duration-200 shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#D4AF37] stroke-[3]" />
              <span>Add Player</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* 4. PERFORMANCE CHART (BEST / AVG / LOW) */}
      <motion.div variants={itemVariants} className="space-y-3 text-left">
        <h3 className="text-[11px] font-black tracking-widest text-zinc-300 uppercase pl-0.5 flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
            <BarChart3 className="w-2.5 h-2.5 text-[#D4AF37]" />
          </div>
          PERFORMANCE CHART
        </h3>

        <div className="bg-gradient-to-b from-[#181B27]/95 to-[#12141D]/95 border border-white/10 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl backdrop-blur-xl">
          {/* Distribution Overview Bar */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
              <span className="text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                CPI DISTRIBUTION
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#090A0E] border border-white/10 text-zinc-300 font-mono text-[9.5px]">
                {totalCount} TOTAL PLAYERS
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="h-3.5 bg-[#090A0E] rounded-full p-0.5 border border-white/10 overflow-hidden flex relative shadow-inner">
              {totalCount > 0 ? (
                <>
                  <div
                    style={{ width: `${(bestCount / totalCount) * 100}%` }}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-l-full shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-700"
                    title={`Best: ${bestCount}`}
                  />
                  <div
                    style={{ width: `${(avgCount / totalCount) * 100}%` }}
                    className="bg-gradient-to-r from-[#E5A93C] to-[#D4AF37] h-full shadow-[0_0_8px_rgba(212,175,55,0.5)] transition-all duration-700"
                    title={`Average: ${avgCount}`}
                  />
                  <div
                    style={{ width: `${(lowCount / totalCount) * 100}%` }}
                    className="bg-gradient-to-r from-rose-500 to-rose-400 h-full rounded-r-full shadow-[0_0_8px_rgba(244,63,94,0.5)] transition-all duration-700"
                    title={`Low: ${lowCount}`}
                  />
                </>
              ) : (
                <div className="w-full bg-[#1B1E2C] h-full rounded-full" />
              )}
            </div>
          </div>

          {/* 3 Category Cards: BEST, AVG, LOW */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {/* BEST: Above 70 CPI */}
            <div className="bg-[#181B27]/80 hover:bg-[#1B1E2C] border border-emerald-500/25 hover:border-emerald-500/50 rounded-2xl p-3 sm:p-3.5 text-center space-y-1.5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 group">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-[9px] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34D399]" />
                BEST
              </div>
              <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-tight">
                &gt; 70 CPI
              </span>
              <p className="text-2xl font-black text-white font-mono pt-0.5 leading-none drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                {bestCount}
              </p>
              <span className="text-[9px] font-extrabold text-emerald-400/80 block uppercase tracking-wider">
                {totalCount > 0 ? Math.round((bestCount / totalCount) * 100) : 0}% OF SQUAD
              </span>
            </div>

            {/* AVG: 50 to 70 CPI */}
            <div className="bg-[#181B27]/80 hover:bg-[#1B1E2C] border border-[#D4AF37]/25 hover:border-[#D4AF37]/50 rounded-2xl p-3 sm:p-3.5 text-center space-y-1.5 transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/10 hover:-translate-y-0.5 group">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F5BA4E] font-black text-[9px] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse shadow-[0_0_6px_#D4AF37]" />
                AVG
              </div>
              <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-tight">
                50 - 70 CPI
              </span>
              <p className="text-2xl font-black text-[#D4AF37] font-mono pt-0.5 leading-none drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                {avgCount}
              </p>
              <span className="text-[9px] font-extrabold text-[#D4AF37]/80 block uppercase tracking-wider">
                {totalCount > 0 ? Math.round((avgCount / totalCount) * 100) : 0}% OF SQUAD
              </span>
            </div>

            {/* LOW: Below 50 CPI */}
            <div className="bg-[#181B27]/80 hover:bg-[#1B1E2C] border border-rose-500/25 hover:border-rose-500/50 rounded-2xl p-3 sm:p-3.5 text-center space-y-1.5 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/10 hover:-translate-y-0.5 group">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-black text-[9px] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shadow-[0_0_6px_#FB7185]" />
                LOW
              </div>
              <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-tight">
                &lt; 50 CPI
              </span>
              <p className="text-2xl font-black text-white font-mono pt-0.5 leading-none drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                {lowCount}
              </p>
              <span className="text-[9px] font-extrabold text-rose-400/80 block uppercase tracking-wider">
                {totalCount > 0 ? Math.round((lowCount / totalCount) * 100) : 0}% OF SQUAD
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 5. RECENT ACTIVITY (IF AVAILABLE) */}
      {stats?.recentAssessments && stats.recentAssessments.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3 text-left">
          <h3 className="text-[11px] font-black tracking-widest text-zinc-300 uppercase pl-0.5 flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
              <Activity className="w-2.5 h-2.5 text-[#D4AF37]" />
            </div>
            RECENT ASSESSMENTS
          </h3>
          <div className="bg-gradient-to-b from-[#181B27]/90 to-[#12141D]/90 border border-white/10 rounded-2xl p-4 divide-y divide-white/5 space-y-2.5">
            {stats.recentAssessments.slice(0, 3).map((a, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between ${idx > 0 ? "pt-2.5" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                      a.assessmentType === "MATCH"
                        ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30"
                        : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {a.assessmentType === "MATCH" ? "M" : "P"}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">{a.playerName}</div>
                    <div className="text-[10px] text-zinc-400 font-semibold">
                      {a.assessmentType === "MATCH" ? "Match Assessment" : "Practice Assessment"} •{" "}
                      {formatActivityDate(a.date)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-[#D4AF37] font-mono">
                    {formatScoreValue(a.score)}
                  </span>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Score</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Footer Copyright */}
      <div className="text-center pt-2 pb-2">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          © 2026 CPI – Cricket Performance Index. All rights reserved.
        </p>
      </div>

      {/* Floating AI Chatbot Launcher Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setShowChatModal(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] hover:from-[#F8C868] hover:to-[#C69212] text-[#090A0E] font-black p-3 sm:px-4.5 sm:py-3 rounded-full shadow-2xl shadow-[#D4AF37]/30 border border-[#D4AF37]/60 flex items-center gap-2.5 transition-all cursor-pointer group"
        title="Open AI Cricket Coach Assistant"
      >
        <div className="relative flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-[#090A0E] text-[#D4AF37] flex items-center justify-center font-bold shadow-inner border border-[#D4AF37]/40">
            <Bot className="w-4 h-4 stroke-[2.3] group-hover:rotate-12 transition-transform text-[#D4AF37]" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#090A0E] flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-white animate-ping opacity-75" />
          </span>
        </div>
        <span className="hidden sm:inline-block text-xs font-black uppercase tracking-wider text-[#090A0E]">
          AI COACH
        </span>
        <Sparkles className="w-3.5 h-3.5 text-[#090A0E] fill-[#090A0E] animate-pulse hidden sm:inline-block" />
      </motion.button>

      {/* AI Chatbot Overlay Modal Component */}
      <AIChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        userRole={role}
      />
    </motion.div>
  );
}
