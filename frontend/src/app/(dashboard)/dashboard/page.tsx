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
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-left relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-slate-50/80 to-orange-50/30 border border-slate-200/80 shadow-sm p-5 sm:p-6 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/20 dark:border-slate-800"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-extrabold text-[9.5px] tracking-widest uppercase mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                WELCOME BACK COACH
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none flex items-center gap-2">
                {coachName || (typeof window !== "undefined" ? localStorage.getItem("userName") : "") || "COACH"}
                <span className="text-orange-500">⚡</span>
              </h1>
            </div>
            
            {/* Top Right Live Analytics Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[9.5px] font-black tracking-widest text-slate-700 dark:text-slate-300 uppercase">
                CPI HOBBY
              </span>
            </div>
          </div>

          {/* Bottom Info Row */}
          <div className="pt-2.5 mt-0.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="uppercase tracking-wider font-bold text-slate-600 dark:text-slate-400">Analytics Engine Active</span>
            </div>
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>CPI INDEX</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. TODAY'S SNAPSHOT */}
      <div id="tour-snapshot" className="space-y-2.5">
        <h3 className="text-[11px] font-black tracking-widest text-slate-700 uppercase pl-0.5 flex items-center gap-1.5">
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
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Players</span>
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
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average CPI</span>
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
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average PPI</span>
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
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average MPI</span>
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
          <h3 className="text-[11px] font-black tracking-widest text-slate-700 uppercase pl-0.5 flex items-center gap-1.5">
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
              className="w-full h-11 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-4 text-xs font-extrabold flex items-center justify-center gap-2 border border-slate-200/80 cursor-pointer uppercase tracking-wider transition-all duration-200"
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
        <h3 className="text-[11px] font-black tracking-widest text-slate-700 uppercase pl-0.5 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-orange-500" />
          PERFORMANCE CHART
        </h3>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
          {/* Distribution Overview Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-600">
              <span>CPI DISTRIBUTION</span>
              <span className="text-slate-400 font-mono">{players.length} TOTAL PLAYERS</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/80">
              {players.length > 0 ? (
                <>
                  <div
                    style={{ width: `${(bestCategoryPlayers.length / players.length) * 100}%` }}
                    className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                    title={`Best: ${bestCategoryPlayers.length}`}
                  />
                  <div
                    style={{ width: `${(avgCategoryPlayers.length / players.length) * 100}%` }}
                    className="bg-amber-400 h-full transition-all duration-500"
                    title={`Average: ${avgCategoryPlayers.length}`}
                  />
                  <div
                    style={{ width: `${(lowCategoryPlayers.length / players.length) * 100}%` }}
                    className="bg-rose-500 h-full rounded-r-full transition-all duration-500"
                    title={`Low: ${lowCategoryPlayers.length}`}
                  />
                </>
              ) : (
                <div className="w-full bg-slate-200 h-full rounded-full" />
              )}
            </div>
          </div>

          {/* 3 Category Cards: BEST, AVG, LOW */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* BEST: Above 7 CPI */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3 text-center space-y-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 font-extrabold text-[9px] uppercase tracking-wider">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                BEST
              </div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-tight">
                &gt; 7 CPI
              </span>
              <p className="text-xl font-black text-slate-900 font-mono pt-0.5">
                {bestCategoryPlayers.length}
              </p>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">
                {players.length > 0 ? Math.round((bestCategoryPlayers.length / players.length) * 100) : 0}% OF SQUAD
              </span>
            </div>

            {/* AVG: 5 to 7 CPI */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3 text-center space-y-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 font-extrabold text-[9px] uppercase tracking-wider">
                <span className="w-1 h-1 rounded-full bg-amber-500" />
                AVG
              </div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-tight">
                5 - 7 CPI
              </span>
              <p className="text-xl font-black text-slate-900 font-mono pt-0.5">
                {avgCategoryPlayers.length}
              </p>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">
                {players.length > 0 ? Math.round((avgCategoryPlayers.length / players.length) * 100) : 0}% OF SQUAD
              </span>
            </div>

            {/* LOW: Below 5 CPI */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3 text-center space-y-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-700 font-extrabold text-[9px] uppercase tracking-wider">
                <span className="w-1 h-1 rounded-full bg-rose-500" />
                LOW
              </div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-tight">
                &lt; 5 CPI
              </span>
              <p className="text-xl font-black text-slate-900 font-mono pt-0.5">
                {lowCategoryPlayers.length}
              </p>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">
                {players.length > 0 ? Math.round((lowCategoryPlayers.length / players.length) * 100) : 0}% OF SQUAD
              </span>
            </div>
          </div>
        </div>
      </motion.div>





      {/* AI Chatbot Overlay Modal Component */}
      <AIChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        userRole={role}
      />

    </div>
  );
}

