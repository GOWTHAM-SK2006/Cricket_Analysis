"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Loader2,
  Plus,
  Target,
  Activity,
  Zap,
  ChevronRight,
  AlertTriangle,
  Award,
  Clipboard,
  MessageSquare,
  Bot,
  X,
  BarChart3,
  TrendingUp,
  Trophy,
  Users,
  Star,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import CricketLoader from "@/components/CricketLoader";
import Image from "next/image";
import AIChatModal from "@/components/AIChatModal";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
};

interface Player {
  id: number;
  name: string;
  role: string;
  ppiScore: number | null;
  mpiScore: number | null;
}

interface DashboardStats {
  totalPlayers: number;
  avgPpi: number;
  avgMpi: number;
  avgCpi: number;
  bestCount?: number;
  avgCount?: number;
  lowCount?: number;
  playersNeedingAttention: Array<{
    name: string;
    cpi: number;
    role: string;
  }>;
  topPerformers: Array<{
    name: string;
    cpi: number;
    role: string;
  }>;
  recentAssessments: Array<{
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

  const coachMpi = (stats?.recentAssessments || []).filter(a => a.assessmentType === "MATCH").slice(0, 5);
  const coachPpi = (stats?.recentAssessments || []).filter(a => a.assessmentType === "PRACTICE").slice(0, 5);

  const totalCount = stats?.totalPlayers || 0;
  const bestCount = stats?.bestCount ?? 0;
  const avgCount = stats?.avgCount ?? 0;
  const lowCount = stats?.lowCount ?? 0;

  // Player specific state for dashboard
  const [coachFeedback, setCoachFeedback] = useState<string[]>([]);
  const [lastFiveMpi, setLastFiveMpi] = useState<any[]>([]);
  const [lastFivePpi, setLastFivePpi] = useState<any[]>([]);

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

  const getPlayerIdByName = (name: string) => {
    const p = players.find(x => x.name.toLowerCase() === name.toLowerCase());
    return p ? p.id : null;
  };

  const navigateToPlayer = (name: string) => {
    const id = getPlayerIdByName(name);
    if (id) {
      router.push(`/players?id=${id}`);
    } else {
      router.push(`/players`);
    }
  };

  const formatActivityDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    
    const isToday = d.getDate() === now.getDate() && 
                    d.getMonth() === now.getMonth() && 
                    d.getFullYear() === now.getFullYear();
                    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.getDate() === yesterday.getDate() && 
                        d.getMonth() === yesterday.getMonth() && 
                        d.getFullYear() === yesterday.getFullYear();
                        
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatScoreValue = (val: number | null | undefined, showMax: boolean = false) => {
    if (val === null || val === undefined || val === 0) return "N/A";
    let num = typeof val === "number" ? val : parseFloat(val as any);
    if (isNaN(num) || num <= 0) return "N/A";
    const score100 = num <= 10 ? Math.round(num * 10) : Math.round(num);
    return `${score100}`;
  };

  if (loading) {
    return <CricketLoader message="Loading Coach Assistant..." />;
  }

  return (
    <div className="space-y-8 pb-16 select-none max-w-lg mx-auto text-left">
      
      {/* 1. WELCOME SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-left relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-slate-50/80 to-orange-50/30 border border-slate-200/80 shadow-sm p-5 sm:p-6"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 font-extrabold text-[9.5px] tracking-widest uppercase mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                WELCOME BACK COACH
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight leading-none flex items-center gap-2">
                {coachName || (typeof window !== "undefined" ? localStorage.getItem("userName") : "") || "COACH"}
                <span className="text-orange-500">⚡</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowChatModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Bot className="w-4 h-4 stroke-[2.2]" />
                <span>AI Coach</span>
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-[9.5px] font-black tracking-widest text-slate-700 uppercase">
                  CPI HOBBY
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Info Row */}
          <div className="pt-2.5 mt-0.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="uppercase tracking-wider font-bold text-slate-600">Analytics Engine Active</span>
            </div>
            <div className="flex items-center gap-1 text-orange-600 font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>CPI INDEX</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. TODAY'S SNAPSHOT */}
      <div id="tour-snapshot" className="space-y-2.5">
        <h3 className="text-[11px] font-black tracking-widest text-slate-900 uppercase pl-0.5 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-orange-500" />
          TODAY'S SNAPSHOT
        </h3>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3"
        >
          {/* Card 1: Total Players */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -2, borderColor: "rgba(249, 115, 22, 0.3)" }}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 text-left space-y-1.5 relative overflow-hidden transition-all duration-200 shadow-2xs group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">Total Players</span>
              <div className="w-7 h-7 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-orange-500" />
              </div>
            </div>
            <span className="text-2xl font-black text-slate-900 block leading-none">{stats?.totalPlayers || 0}</span>
          </motion.div>
          
          {/* Card 2: Average CPI */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -2, borderColor: "rgba(249, 115, 22, 0.4)" }}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 text-left space-y-1.5 relative overflow-hidden transition-all duration-200 shadow-2xs group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">AVERAGE CPI</span>
              <div className="w-7 h-7 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-orange-500" />
              </div>
            </div>
            <span className="text-2xl font-black text-orange-500 block leading-none">
              {stats?.avgCpi ? formatScoreValue(stats.avgCpi) : "N/A"}
            </span>
          </motion.div>

          {/* Card 3: Average PPI */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -2, borderColor: "rgba(249, 115, 22, 0.3)" }}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 text-left space-y-1.5 relative overflow-hidden transition-all duration-200 shadow-2xs group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">AVERAGE PPI</span>
              <div className="w-7 h-7 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
              </div>
            </div>
            <span className="text-2xl font-black text-slate-900 block leading-none">
              {stats?.avgPpi ? formatScoreValue(stats.avgPpi) : "N/A"}
            </span>
          </motion.div>

          {/* Card 4: Average MPI */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -2, borderColor: "rgba(249, 115, 22, 0.3)" }}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 text-left space-y-1.5 relative overflow-hidden transition-all duration-200 shadow-2xs group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">AVERAGE MPI</span>
              <div className="w-7 h-7 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5 text-orange-500" />
              </div>
            </div>
            <span className="text-2xl font-black text-slate-900 block leading-none">
              {stats?.avgMpi ? formatScoreValue(stats.avgMpi) : "N/A"}
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* 3. QUICK ACTIONS / SELF ASSESSMENT */}
      {role === "player" ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          
          {/* SELF ASSESSMENT */}
          <motion.div id="tour-self-assessment" variants={itemVariants} className="space-y-2.5">
            <h3 className="text-[11px] font-black tracking-widest text-slate-700 uppercase pl-0.5">
              SELF ASSESSMENT
            </h3>
            <motion.button
              whileHover={{ scale: 1.005, y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push("/players?selfAssess=true")}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 text-sm font-extrabold flex items-center justify-between cursor-pointer uppercase tracking-wider shadow-xs transition-all duration-200"
            >
              <span className="flex items-center gap-2.5">
                <Clipboard className="w-4 h-4" />
                Start Self Assessment
              </span>
              <ChevronRight className="w-4 h-4 opacity-80" />
            </motion.button>
          </motion.div>

          {/* LATEST COACH FEEDBACK */}
          <motion.div id="tour-coach-feedback" variants={itemVariants} className="space-y-2.5">
            <h3 className="text-[11px] font-black tracking-widest text-slate-700 uppercase flex items-center gap-1.5 pl-0.5">
              <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
              LATEST COACH FEEDBACK
            </h3>
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
              {coachFeedback.length > 0 ? (
                coachFeedback.map((feedbackStr, idx) => (
                  <div key={idx} className="border-l-2 border-orange-500 pl-3 py-1 text-xs text-slate-700 font-semibold leading-relaxed italic relative">
                    {feedbackStr}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 font-medium italic text-center py-1">
                  No feedback recorded yet.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <div id="tour-quick-actions" className="space-y-2.5">
          <h3 className="text-[11px] font-black tracking-widest text-slate-900 uppercase pl-0.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-orange-500" />
            QUICK ACTIONS
          </h3>
          <div className="space-y-2.5">
            {/* Action 1: Start Practice Assessment */}
            <motion.button
              whileHover={{ scale: 1.005, y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push("/players?action=practice")}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 text-sm font-extrabold flex items-center justify-between cursor-pointer uppercase tracking-wider shadow-xs transition-all duration-200"
            >
              <span className="flex items-center gap-2.5">
                <Target className="w-4 h-4" />
                Start Practice Assessment
              </span>
              <ChevronRight className="w-4 h-4 opacity-80" />
            </motion.button>

            {/* Action 2: Start Match Assessment */}
            <motion.button
              whileHover={{ scale: 1.005, y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push("/players?action=match")}
              className="w-full h-12 bg-white hover:bg-slate-50 text-slate-800 rounded-xl px-4 text-sm font-extrabold flex items-center justify-between border border-slate-200/90 shadow-2xs cursor-pointer uppercase tracking-wider transition-all duration-200"
            >
              <span className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-orange-500" />
                Start Match Assessment
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </motion.button>

            {/* Action 3: Add Player */}
            <motion.button
              id="tour-add-player"
              whileHover={{ scale: 1.005, y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push("/players?add=true")}
              className="w-full h-11 bg-white hover:bg-slate-50 text-slate-900 rounded-xl px-4 text-xs font-extrabold flex items-center justify-center gap-2 border border-slate-200/80 cursor-pointer uppercase tracking-wider transition-all duration-200"
            >
              <Plus className="w-4 h-4 text-orange-500 stroke-[2.5]" />
              Add Player
            </motion.button>
          </div>
        </div>
      )}

      {/* 4. PERFORMANCE CHART (BEST / AVG / LOW) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2.5 text-left"
      >
        <h3 className="text-[11px] font-black tracking-widest text-slate-900 uppercase pl-0.5 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-orange-500" />
          PERFORMANCE CHART
        </h3>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
          {/* Distribution Overview Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-800">
              <span>CPI DISTRIBUTION</span>
              <span className="text-slate-600 font-mono">{totalCount} TOTAL PLAYERS</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/80">
              {totalCount > 0 ? (
                <>
                  <div
                    style={{ width: `${(bestCount / totalCount) * 100}%` }}
                    className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                    title={`Best: ${bestCount}`}
                  />
                  <div
                    style={{ width: `${(avgCount / totalCount) * 100}%` }}
                    className="bg-amber-400 h-full transition-all duration-500"
                    title={`Average: ${avgCount}`}
                  />
                  <div
                    style={{ width: `${(lowCount / totalCount) * 100}%` }}
                    className="bg-rose-500 h-full rounded-r-full transition-all duration-500"
                    title={`Low: ${lowCount}`}
                  />
                </>
              ) : (
                <div className="w-full bg-slate-200 h-full rounded-full" />
              )}
            </div>
          </div>

          {/* 3 Category Cards: BEST, AVG, LOW */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* BEST: Above 70 CPI */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3 text-center space-y-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 font-extrabold text-[9px] uppercase tracking-wider">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                BEST
              </div>
              <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-tight">
                &gt; 70 CPI
              </span>
              <p className="text-xl font-black text-slate-900 font-mono pt-0.5">
                {bestCount}
              </p>
              <span className="text-[9px] font-bold text-slate-600 block uppercase">
                {totalCount > 0 ? Math.round((bestCount / totalCount) * 100) : 0}% OF SQUAD
              </span>
            </div>

            {/* AVG: 50 to 70 CPI */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3 text-center space-y-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 font-extrabold text-[9px] uppercase tracking-wider">
                <span className="w-1 h-1 rounded-full bg-amber-500" />
                AVG
              </div>
              <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-tight">
                50 - 70 CPI
              </span>
              <p className="text-xl font-black text-slate-900 font-mono pt-0.5">
                {avgCount}
              </p>
              <span className="text-[9px] font-bold text-slate-600 block uppercase">
                {totalCount > 0 ? Math.round((avgCount / totalCount) * 100) : 0}% OF SQUAD
              </span>
            </div>

            {/* LOW: Below 50 CPI */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3 text-center space-y-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-700 font-extrabold text-[9px] uppercase tracking-wider">
                <span className="w-1 h-1 rounded-full bg-rose-500" />
                LOW
              </div>
              <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-tight">
                &lt; 50 CPI
              </span>
              <p className="text-xl font-black text-slate-900 font-mono pt-0.5">
                {lowCount}
              </p>
              <span className="text-[9px] font-bold text-slate-600 block uppercase">
                {totalCount > 0 ? Math.round((lowCount / totalCount) * 100) : 0}% OF SQUAD
              </span>
            </div>
          </div>
        </div>
      </motion.div>





      {/* Floating AI Chatbot Launcher Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowChatModal(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black p-3.5 sm:px-4 sm:py-3 rounded-full shadow-xl shadow-orange-500/30 border border-orange-400/60 flex items-center gap-2.5 transition-all cursor-pointer group"
        title="Open AI Cricket Coach Assistant"
      >
        <div className="relative flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-slate-950 text-orange-400 flex items-center justify-center font-bold shadow-inner border border-orange-500/30">
            <Bot className="w-4 h-4 stroke-[2.2] group-hover:rotate-12 transition-transform text-orange-400" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-white animate-ping opacity-75" />
          </span>
        </div>
        <span className="hidden sm:inline-block text-xs font-black uppercase tracking-wider text-slate-950">
          AI COACH
        </span>
        <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950 animate-pulse hidden sm:inline-block" />
      </motion.button>

      {/* AI Chatbot Overlay Modal Component */}
      <AIChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        userRole={role}
      />

    </div>
  );
}

