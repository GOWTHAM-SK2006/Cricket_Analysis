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
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
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

  // Player list (to lookup IDs)
  const [players, setPlayers] = useState<Player[]>([]);
  const [lastAssessmentDates, setLastAssessmentDates] = useState<Record<string, string>>({});

  const getPlayerCpiScore = (p: Player) => {
    let ppi = p.ppiScore ? (p.ppiScore > 10 ? p.ppiScore / 10 : p.ppiScore) : 0;
    let mpi = p.mpiScore ? (p.mpiScore > 10 ? p.mpiScore / 10 : p.mpiScore) : 0;
    if (ppi > 0 && mpi > 0) return Math.round((ppi * 0.4 + mpi * 0.6) * 10) / 10;
    if (ppi > 0) return Math.round(ppi * 10) / 10;
    if (mpi > 0) return Math.round(mpi * 10) / 10;
    return 0;
  };

  const bestCategoryPlayers = players.filter((p) => getPlayerCpiScore(p) > 7.0);
  const avgCategoryPlayers = players.filter((p) => {
    const score = getPlayerCpiScore(p);
    return score >= 5.0 && score <= 7.0;
  });
  const lowCategoryPlayers = players.filter((p) => {
    const score = getPlayerCpiScore(p);
    return score < 5.0;
  });

  const fetchLastAssessmentDates = async (playerList: Player[]) => {
    const datesMap: Record<string, string> = {};
    await Promise.all(playerList.map(async (p) => {
      try {
        const [pracRes, matchRes] = await Promise.all([
          api.get(`/practice/player/${p.id}`).catch(() => ({ data: [] })),
          api.get(`/matches/player/${p.id}`).catch(() => ({ data: [] }))
        ]);
        
        const allDates = [
          ...(pracRes.data || []).map((x: any) => x.date),
          ...(matchRes.data || []).map((x: any) => x.date)
        ];
        
        // Check for self-assessment in local storage
        const localSelf = localStorage.getItem(`self_assess_${p.id}`);
        if (localSelf) {
          const selfList = JSON.parse(localSelf);
          selfList.forEach((x: any) => {
            if (x.date) allDates.push(x.date);
          });
        }

        if (allDates.length > 0) {
          const sorted = allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          const latestDate = new Date(sorted[0]);
          datesMap[p.name.toLowerCase()] = latestDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          });
        } else {
          datesMap[p.name.toLowerCase()] = "No assessments";
        }
      } catch (e) {
        datesMap[p.name.toLowerCase()] = "No assessments";
      }
    }));
    setLastAssessmentDates(datesMap);
  };

  // Player specific state for dashboard
  const [coachFeedback, setCoachFeedback] = useState<string[]>([]);
  const [lastFiveMpi, setLastFiveMpi] = useState<any[]>([]);
  const [lastFivePpi, setLastFivePpi] = useState<any[]>([]);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") || "coach";
    setRole(storedRole === "player" ? "player" : "coach");

    const loadDashboardData = async () => {
      try {
        const [profileRes, statsRes, playersRes] = await Promise.all([
          api.get("/profile"),
          api.get("/dashboard/stats"),
          api.get("/players")
        ]);

        setCoachName(profileRes.data.name);
        if (profileRes.data.name) {
          localStorage.setItem("userName", profileRes.data.name);
        }
        setStats(statsRes.data);
        const playerList = playersRes.data || [];
        setPlayers(playerList);

        fetchLastAssessmentDates(playerList);

        if (storedRole === "player") {
          const matchedPlayer = playerList.find(
            (p: any) => p.name.toLowerCase() === profileRes.data.name.toLowerCase()
          );

          if (matchedPlayer) {
            const [pracRes, matchRes] = await Promise.all([
              api.get(`/practice/player/${matchedPlayer.id}`).catch(() => ({ data: [] })),
              api.get(`/matches/player/${matchedPlayer.id}`).catch(() => ({ data: [] }))
            ]);

            const pHistory = (pracRes.data || []).sort(
              (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            const mHistory = (matchRes.data || []).sort(
              (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            // Calculate scores for PPI (practice) and MPI (match)
            const calculatePpiScore = (session: any) => {
              if (typeof session.ppiScore === "number" && session.ppiScore > 0) return session.ppiScore;
              const vals = [
                session.technicalExecution, session.skillsLevel, session.gamePlan,
                session.preparation, session.intensity, session.focus || session.concentration,
                session.resilience, session.decisionMaking, session.gameAwareness
              ].filter((v) => typeof v === "number" && !isNaN(v) && v > 0);
              return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            };

            const calculateMpiScore = (session: any) => {
              if (typeof session.mpiScore === "number" && session.mpiScore > 0) return session.mpiScore;
              const vals = [
                session.technicalExecution, session.skillsLevel, session.gamePlan,
                session.preparation, session.intensity, session.focus || session.concentration,
                session.resilience, session.decisionMaking, session.gameAwareness
              ].filter((v) => typeof v === "number" && !isNaN(v) && v > 0);
              return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            };

            setLastFivePpi(pHistory.slice(0, 5).map((s: any) => ({ date: s.date, score: calculatePpiScore(s) })));
            setLastFiveMpi(mHistory.slice(0, 5).map((s: any) => ({ date: s.date, score: calculateMpiScore(s) })));

            // Extract feedback from recent assessments
            const feedback: string[] = [];
            const allAssessments = [...pHistory, ...mHistory].sort(
              (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            
            for (const a of allAssessments) {
              if (a.coachFeedback && a.coachFeedback.trim() !== "") {
                feedback.push(a.coachFeedback.trim());
              }
              if (feedback.length >= 3) break;
            }
            setCoachFeedback(feedback);
          }
        }
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

  const formatScoreValue = (val: number) => {
    if (!val || val === 0) return "N/A";
    let num = typeof val === "number" ? val : parseFloat(val as any);
    if (isNaN(num) || num <= 0) return "N/A";
    if (num > 10) num = num / 10;
    return (Math.round(num * 10) / 10).toFixed(1);
  };

  if (loading) {
    return <CricketLoader message="Loading Coach Assistant..." />;
  }

  return (
    <div className="space-y-8 pb-16 select-none max-w-lg mx-auto text-left">
      
      {/* 1. WELCOME SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-left relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50/90 to-orange-50/40 border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-7 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/20 dark:border-slate-800"
      >
        {/* Ambient Orange Glow Effect */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-36 h-36 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.08] pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-extrabold text-[10px] tracking-widest uppercase mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                WELCOME BACK COACH
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none flex items-center gap-2.5">
                {coachName || (typeof window !== "undefined" ? localStorage.getItem("userName") : "") || "COACH"}
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30 text-sm">
                  ⚡
                </span>
              </h1>
            </div>
            
            {/* Top Right Live Analytics Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <span className="text-[10px] font-black tracking-widest text-slate-700 dark:text-slate-300 uppercase">
                CPI PRO
              </span>
            </div>
          </div>

          {/* Bottom Info Row */}
          <div className="pt-3 mt-1 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="uppercase tracking-wider text-[10px] font-bold text-slate-600 dark:text-slate-400">Analytics Engine Ready</span>
            </div>
            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-extrabold uppercase text-[10px] tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CPI INDEX</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. TODAY'S SNAPSHOT */}
      <div id="tour-snapshot" className="space-y-3">
        <h3 className="text-xs font-black tracking-widest text-slate-800 uppercase pl-1 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-500" />
          TODAY'S SNAPSHOT
        </h3>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4"
        >
          {/* Card 1: Total Players */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02, borderColor: "rgba(249, 115, 22, 0.2)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
            className="bg-white border border-slate-200 rounded-3xl p-5 text-left space-y-2 relative overflow-hidden transition-all duration-300 group shadow-md"
          >
            <div className="absolute top-3 right-3 w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Total Players</span>
            <span className="text-3.5xl font-black text-slate-900 block leading-none">{stats?.totalPlayers || 0}</span>
          </motion.div>
          
          {/* Card 2: Average CPI */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02, borderColor: "rgba(249, 115, 22, 0.4)", boxShadow: "0 10px 30px -10px rgba(249,115,22,0.1)" }}
            className="bg-white border border-slate-200 rounded-3xl p-5 text-left space-y-2 relative overflow-hidden transition-all duration-300 group shadow-md"
          >
            <div className="absolute top-3 right-3 w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Average CPI</span>
            <span className="text-3.5xl font-black text-orange-500 block leading-none">
              {stats?.avgCpi ? formatScoreValue(stats.avgCpi) : "N/A"}
            </span>
          </motion.div>

          {/* Card 3: Average PPI */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02, borderColor: "rgba(249, 115, 22, 0.2)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
            className="bg-white border border-slate-200 rounded-3xl p-5 text-left space-y-2 relative overflow-hidden transition-all duration-300 group shadow-md"
          >
            <div className="absolute top-3 right-3 w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Average PPI</span>
            <span className="text-3.5xl font-black text-slate-900 block leading-none">
              {stats?.avgPpi ? formatScoreValue(stats.avgPpi) : "N/A"}
            </span>
          </motion.div>

          {/* Card 4: Average MPI */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02, borderColor: "rgba(249, 115, 22, 0.2)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
            className="bg-white border border-slate-200 rounded-3xl p-5 text-left space-y-2 relative overflow-hidden transition-all duration-300 group shadow-md"
          >
            <div className="absolute top-3 right-3 w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Average MPI</span>
            <span className="text-3.5xl font-black text-slate-900 block leading-none">
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
          className="space-y-8"
        >
          
          {/* SELF ASSESSMENT */}
          <motion.div id="tour-self-assessment" variants={itemVariants} className="space-y-3">
            <h3 className="text-xs font-black tracking-widest text-slate-800 uppercase pl-1">
              SELF ASSESSMENT
            </h3>
            <motion.button
              whileHover={{ scale: 1.01, translateY: -2, boxShadow: "0 10px 25px -5px rgba(249, 115, 22, 0.4)" }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push("/players?selfAssess=true")}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-black rounded-2.5xl py-4.5 px-5 text-base font-black flex items-center justify-between border border-orange-400 cursor-pointer uppercase tracking-tight transition-all duration-200"
            >
              <span className="flex items-center gap-3">
                <Clipboard className="w-5.5 h-5.5 stroke-[3] animate-pulse" />
                Start Self Assessment
              </span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <ChevronRight className="w-5.5 h-5.5 stroke-[3]" />
              </motion.div>
            </motion.button>
          </motion.div>

          {/* LATEST COACH FEEDBACK */}
          <motion.div id="tour-coach-feedback" variants={itemVariants} className="space-y-3">
            <h3 className="text-xs font-black tracking-widest text-slate-800 uppercase flex items-center gap-2 pl-1">
              <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
              LATEST COACH FEEDBACK
            </h3>
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-lg">
              {coachFeedback.length > 0 ? (
                coachFeedback.map((feedbackStr, idx) => (
                  <div key={idx} className="border-l-2 border-orange-500 pl-4 py-1 text-sm text-slate-700 font-semibold leading-relaxed italic relative">
                    <span className="absolute -left-2.5 top-0 text-3xl text-orange-500/20 font-serif leading-none">"</span>
                    {feedbackStr}
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-semibold italic text-center py-2">
                  No feedback recorded yet.
                </p>
              )}
            </div>
          </motion.div>


          
        </motion.div>
      ) : (
        <div id="tour-quick-actions" className="space-y-3">
          <h3 className="text-xs font-black tracking-widest text-slate-800 uppercase pl-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            QUICK ACTIONS
          </h3>
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.01, translateY: -2, boxShadow: "0 10px 25px -5px rgba(249, 115, 22, 0.4)" }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push("/players?action=practice")}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-black rounded-2.5xl py-4.5 px-5 text-base font-black flex items-center justify-between border border-orange-400 cursor-pointer uppercase tracking-tight transition-all duration-200"
            >
              <span className="flex items-center gap-3">
                <Target className="w-5.5 h-5.5 stroke-[3] animate-pulse" />
                Start Practice Assessment
              </span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <ChevronRight className="w-5.5 h-5.5 stroke-[3]" />
              </motion.div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01, translateY: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push("/players?action=match")}
              className="w-full bg-white hover:bg-slate-50 text-slate-900 rounded-2.5xl py-4.5 px-5 text-base font-black flex items-center justify-between border border-slate-300 cursor-pointer uppercase tracking-tight transition-all duration-200"
            >
              <span className="flex items-center gap-3">
                <Activity className="w-5.5 h-5.5 stroke-[2] text-orange-500" />
                Start Match Assessment
              </span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <ChevronRight className="w-5.5 h-5.5 stroke-[2] text-orange-500" />
              </motion.div>
            </motion.button>

            <motion.button
              id="tour-add-player"
              whileHover={{ scale: 1.01, translateY: -1, borderColor: "rgba(249, 115, 22, 0.4)" }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push("/players?add=true")}
              className="w-full bg-white border border-slate-300 hover:border-orange-300 text-slate-900 rounded-2.5xl py-4 px-5 text-sm font-black flex items-center justify-center gap-2 cursor-pointer uppercase transition-all duration-200"
            >
              <Plus className="w-4.5 h-4.5 stroke-[3] text-orange-500" />
              Add Player
            </motion.button>
          </div>
        </div>
      )}

      {/* PERFORMANCE CHART (BEST / AVG / LOW) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3 pt-2 text-left"
      >
        <h3 className="text-xs font-black tracking-widest text-slate-800 uppercase pl-1 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-500" />
          PERFORMANCE CHART
        </h3>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-5 shadow-lg">
          {/* Distribution Overview Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-700">
              <span>CPI DISTRIBUTION</span>
              <span className="text-slate-400 font-mono text-[11px]">{players.length} TOTAL PLAYERS</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200">
              {players.length > 0 ? (
                <>
                  <div
                    style={{ width: `${(bestCategoryPlayers.length / players.length) * 100}%` }}
                    className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                    title={`Best: ${bestCategoryPlayers.length}`}
                  />
                  <div
                    style={{ width: `${(avgCategoryPlayers.length / players.length) * 100}%` }}
                    className="bg-yellow-400 h-full transition-all duration-500"
                    title={`Average: ${avgCategoryPlayers.length}`}
                  />
                  <div
                    style={{ width: `${(lowCategoryPlayers.length / players.length) * 100}%` }}
                    className="bg-red-500 h-full rounded-r-full transition-all duration-500"
                    title={`Low: ${lowCategoryPlayers.length}`}
                  />
                </>
              ) : (
                <div className="w-full bg-slate-200 h-full rounded-full" />
              )}
            </div>
          </div>

          {/* 3 Category Cards: BEST (Green), AVG (Yellow), LOW (Red) */}
          <div className="grid grid-cols-3 gap-3">
            {/* BEST: Above 7 CPI - GREEN */}
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2.5xl p-3.5 text-center space-y-1 shadow-xs">
              <div className="flex items-center justify-center gap-1 text-emerald-800">
                <span className="text-[11px] font-black uppercase tracking-wider">BEST</span>
              </div>
              <span className="text-xs font-black text-emerald-700 block uppercase tracking-tight">
                &gt; 7 CPI
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono pt-0.5">
                {bestCategoryPlayers.length}
              </p>
              <span className="text-[9.5px] font-extrabold text-emerald-800 block uppercase">
                {players.length > 0 ? Math.round((bestCategoryPlayers.length / players.length) * 100) : 0}% OF SQUAD
              </span>
            </div>

            {/* AVG: 5 to 7 CPI - YELLOW */}
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2.5xl p-3.5 text-center space-y-1 shadow-xs">
              <div className="flex items-center justify-center gap-1 text-yellow-900">
                <span className="text-[11px] font-black uppercase tracking-wider">AVG</span>
              </div>
              <span className="text-xs font-black text-yellow-800 block uppercase tracking-tight">
                5 - 7 CPI
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono pt-0.5">
                {avgCategoryPlayers.length}
              </p>
              <span className="text-[9.5px] font-extrabold text-yellow-900 block uppercase">
                {players.length > 0 ? Math.round((avgCategoryPlayers.length / players.length) * 100) : 0}% OF SQUAD
              </span>
            </div>

            {/* LOW: Below 5 CPI - RED */}
            <div className="bg-red-50 border-2 border-red-500 rounded-2.5xl p-3.5 text-center space-y-1 shadow-xs">
              <div className="flex items-center justify-center gap-1 text-red-800">
                <span className="text-[11px] font-black uppercase tracking-wider">LOW</span>
              </div>
              <span className="text-xs font-black text-red-700 block uppercase tracking-tight">
                &lt; 5 CPI
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono pt-0.5">
                {lowCategoryPlayers.length}
              </p>
              <span className="text-[9.5px] font-extrabold text-red-800 block uppercase">
                {players.length > 0 ? Math.round((lowCategoryPlayers.length / players.length) * 100) : 0}% OF SQUAD
              </span>
            </div>
          </div>

        </div>
      </motion.div>



      {/* Floating AI Chatbot Button & Modal */}
      <div className="fixed bottom-28 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowChatModal(true)}
          className="relative group w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-400 text-slate-950 shadow-xl shadow-orange-500/25 flex items-center justify-center cursor-pointer border-2 border-orange-300/60 active:scale-95 transition-all"
          title="Ask AI Cricket Coach"
        >
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500 border-2 border-white"></span>
          </span>
          <Bot className="w-7 h-7 stroke-[2.4]" />
        </motion.button>
      </div>

      {/* AI Chatbot Overlay Modal Component */}
      <AIChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        userRole={role}
      />

    </div>
  );
}

