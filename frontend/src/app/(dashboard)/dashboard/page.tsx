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
  MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";

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

  const coachMpi = (stats?.recentAssessments || []).filter(a => a.assessmentType === "MATCH").slice(0, 5);
  const coachPpi = (stats?.recentAssessments || []).filter(a => a.assessmentType === "PRACTICE").slice(0, 5);

  // Player list (to lookup IDs)
  const [players, setPlayers] = useState<Player[]>([]);
  const [lastAssessmentDates, setLastAssessmentDates] = useState<Record<string, string>>({});

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
    const storedRole = localStorage.getItem("userRole");
    setRole(storedRole);

    const loadDashboardData = async () => {
      try {
        const [profileRes, statsRes, playersRes] = await Promise.all([
          api.get("/profile"),
          api.get("/dashboard/stats"),
          api.get("/players")
        ]);

        setCoachName(profileRes.data.name);
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
            const calculatePpiScore = (session: any) => 
              (session.technique + session.intensity + session.execution + session.adaptability + session.discipline + session.focus) / 6;

            const calculateMpiScore = (session: any) => 
              (session.technicalExecution + session.decisionMaking + session.gameAwareness + session.pressureHandling + session.teamContribution + session.matchImpact) / 6;

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
    if (val <= 10) {
      return Math.round(val * 10);
    }
    return Math.round(val);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-zinc-550 font-bold uppercase tracking-wider text-xs">
          Loading Coach Assistant...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 select-none max-w-lg mx-auto text-left">
      
      {/* 1. WELCOME SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-left relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-orange-500/10 via-zinc-900/5 to-zinc-950/20 border border-zinc-900/50 backdrop-blur-md shadow-xl"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl" />
        <h2 className="text-xs font-bold tracking-widest text-orange-500/80 uppercase">
          WELCOME BACK COACH
        </h2>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight mt-1 leading-none flex items-center gap-2">
          {coachName || "GOWTHAM"}
          <span className="inline-block animate-pulse text-orange-500">⚡</span>
        </h1>
      </motion.div>

      {/* 2. TODAY'S SNAPSHOT */}
      <div id="tour-snapshot" className="space-y-3">
        <h3 className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 uppercase pl-1">
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
            className="bg-zinc-950 border border-zinc-900/80 rounded-3xl p-5 text-left space-y-2 relative overflow-hidden transition-all duration-300 group shadow-md"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-zinc-900 rounded-full -mr-4 -mt-4 transition-all duration-500 group-hover:scale-150 group-hover:bg-orange-500/5" />
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Players</span>
              <span className="text-zinc-650 group-hover:text-orange-500 transition-colors">👤</span>
            </div>
            <span className="text-3.5xl font-black text-white block leading-none">{stats?.totalPlayers || 0}</span>
          </motion.div>
          
          {/* Card 2: Average CPI */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02, borderColor: "rgba(249, 115, 22, 0.4)", boxShadow: "0 10px 30px -10px rgba(249,115,22,0.1)" }}
            className="bg-zinc-950 border border-zinc-900/80 rounded-3xl p-5 text-left space-y-2 relative overflow-hidden transition-all duration-300 group shadow-md"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full -mr-4 -mt-4 transition-all duration-500 group-hover:scale-150 group-hover:bg-orange-500/10" />
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Average CPI</span>
              <Zap className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <span className="text-3.5xl font-black text-orange-500 block leading-none">
              {stats?.avgCpi ? formatScoreValue(stats.avgCpi) : "N/A"}
            </span>
          </motion.div>

          {/* Card 3: Average PPI */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02, borderColor: "rgba(249, 115, 22, 0.2)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
            className="bg-zinc-950 border border-zinc-900/80 rounded-3xl p-5 text-left space-y-2 relative overflow-hidden transition-all duration-300 group shadow-md"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-zinc-900 rounded-full -mr-4 -mt-4 transition-all duration-500 group-hover:scale-150 group-hover:bg-orange-500/5" />
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Average PPI</span>
              <span className="text-zinc-650 group-hover:text-orange-500 transition-colors">🏏</span>
            </div>
            <span className="text-3.5xl font-black text-white block leading-none">
              {stats?.avgPpi ? formatScoreValue(stats.avgPpi) : "N/A"}
            </span>
          </motion.div>

          {/* Card 4: Average MPI */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02, borderColor: "rgba(249, 115, 22, 0.2)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
            className="bg-zinc-950 border border-zinc-900/80 rounded-3xl p-5 text-left space-y-2 relative overflow-hidden transition-all duration-300 group shadow-md"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-zinc-900 rounded-full -mr-4 -mt-4 transition-all duration-500 group-hover:scale-150 group-hover:bg-orange-500/5" />
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Average MPI</span>
              <span className="text-zinc-655 group-hover:text-orange-500 transition-colors">🏆</span>
            </div>
            <span className="text-3.5xl font-black text-white block leading-none">
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
            <h3 className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 uppercase pl-1">
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
            <h3 className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 uppercase flex items-center gap-2 pl-1">
              <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
              LATEST COACH FEEDBACK
            </h3>
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-4 shadow-lg">
              {coachFeedback.length > 0 ? (
                coachFeedback.map((feedbackStr, idx) => (
                  <div key={idx} className="border-l-2 border-orange-500 pl-4 py-1 text-sm text-zinc-300 font-semibold leading-relaxed italic relative">
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

          {/* LAST ASSESSMENT */}
          <motion.div variants={itemVariants} className="space-y-3">
            <h3 className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 uppercase flex items-center gap-2 pl-1">
              <Activity className="w-3.5 h-3.5 text-orange-500" />
              LAST ASSESSMENT
            </h3>
            <div className="grid grid-cols-2 gap-4">
              
              {/* Left Side: Last 5 MPI */}
              <div id="tour-last-mpi" className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-4 shadow-lg">
                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block text-center border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-2">
                  LAST 5 MPI
                </span>
                <div className="space-y-3">
                  {lastFiveMpi.length > 0 ? (
                    lastFiveMpi.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">
                          {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className="text-sm font-black text-white font-mono bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-850">
                          {formatScoreValue(item.score)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] font-bold text-zinc-600 text-center uppercase py-2">
                      No MPI Data
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Last 5 PPI */}
              <div id="tour-last-ppi" className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-4 shadow-lg">
                <span className="text-[11px] font-bold text-zinc-655 dark:text-zinc-405 uppercase tracking-wider block text-center border-b border-zinc-900 pb-2 mb-2">
                  LAST 5 PPI
                </span>
                <div className="space-y-3">
                  {lastFivePpi.length > 0 ? (
                    lastFivePpi.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">
                          {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className="text-sm font-black text-white font-mono bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-850">
                          {formatScoreValue(item.score)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] font-bold text-zinc-600 text-center uppercase py-2">
                      No PPI Data
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
          
        </motion.div>
      ) : (
        <div id="tour-quick-actions" className="space-y-3">
          <h3 className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 uppercase pl-1">
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
              className="w-full bg-zinc-900 hover:bg-zinc-850 text-white rounded-2.5xl py-4.5 px-5 text-base font-black flex items-center justify-between border border-zinc-850 cursor-pointer uppercase tracking-tight transition-all duration-200"
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
              className="w-full bg-zinc-950 border border-zinc-900 hover:border-zinc-850 text-white rounded-2.5xl py-4 px-5 text-sm font-black flex items-center justify-center gap-2 cursor-pointer uppercase transition-all duration-200"
            >
              <Plus className="w-4.5 h-4.5 stroke-[3] text-orange-500" />
              Add Player
            </motion.button>
          </div>
        </div>
      )}

      {/* COACH SPECIFIC SECTIONS */}
      {role !== "player" && (
        <div className="space-y-8">
          
          {/* 4. TOP PERFORMERS */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="space-y-3 text-left"
          >
            <h3 className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 uppercase flex items-center gap-2 pl-1">
              <Award className="w-4 h-4 text-orange-500" />
              TOP PERFORMERS
            </h3>
            <div className="bg-zinc-950 border border-zinc-900/80 rounded-3.5xl divide-y divide-zinc-900/40 overflow-hidden shadow-lg">
              {stats?.topPerformers && stats.topPerformers.length > 0 ? (
                stats.topPerformers.map((p, idx) => {
                  const lastDate = lastAssessmentDates[p.name.toLowerCase()] || "No assessments";
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ backgroundColor: "rgba(249, 115, 22, 0.03)", x: 4 }}
                      onClick={() => navigateToPlayer(p.name)}
                      className="p-5 flex justify-between items-center cursor-pointer transition-colors active:bg-zinc-900/60"
                    >
                      <div className="space-y-0.5">
                        <span className="text-base font-black text-white uppercase block tracking-tight">{p.name}</span>
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
                          Last Assessed: {lastDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-xl uppercase tracking-wider font-mono">
                          CPI {p.cpi > 0 ? formatScoreValue(p.cpi) : "N/A"}
                        </span>
                        <ChevronRight className="w-4 h-4 text-zinc-650" />
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-5 text-center text-[13px] text-zinc-500 font-semibold uppercase tracking-wide">
                  No assessments logged yet.
                </div>
              )}
            </div>
          </motion.div>

          {/* 5. PLAYERS NEEDING ATTENTION */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-3 text-left"
          >
            <h3 className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 uppercase flex items-center gap-2 pl-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              PLAYERS NEEDING ATTENTION
            </h3>
            <div className="bg-zinc-950 border border-zinc-900/80 rounded-3.5xl divide-y divide-zinc-900/40 overflow-hidden shadow-lg">
              {stats?.playersNeedingAttention && stats.playersNeedingAttention.length > 0 ? (
                stats.playersNeedingAttention.map((p, idx) => {
                  const lastDate = lastAssessmentDates[p.name.toLowerCase()] || "No assessments";
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.03)", x: 4 }}
                      onClick={() => navigateToPlayer(p.name)}
                      className="p-5 flex justify-between items-center cursor-pointer transition-colors active:bg-zinc-900/60"
                    >
                      <div className="space-y-0.5">
                        <span className="text-base font-black text-white uppercase block tracking-tight">{p.name}</span>
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
                          Last Assessed: {lastDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-red-500 bg-red-500/10 px-3 py-1.5 rounded-xl uppercase tracking-wider font-mono">
                          CPI {p.cpi > 0 ? formatScoreValue(p.cpi) : "N/A"}
                        </span>
                        <ChevronRight className="w-4 h-4 text-zinc-650" />
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-5 text-center text-[13px] text-zinc-500 font-semibold uppercase tracking-wide">
                  No players currently needing attention.
                </div>
              )}
            </div>
          </motion.div>

          {/* 6. LAST ASSESSMENT */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-3 text-left"
          >
            <h3 className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 uppercase flex items-center gap-2 pl-1">
              <Activity className="w-4 h-4 text-orange-500" />
              LAST ASSESSMENT
            </h3>
            <div className="grid grid-cols-2 gap-4">
              
              {/* Left Side: Last 5 MPI */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-4 shadow-lg">
                <span className="text-[11px] font-bold text-zinc-650 dark:text-zinc-405 uppercase tracking-wider block text-center border-b border-zinc-900 pb-2 mb-2">
                  LAST 5 MPI
                </span>
                <div className="space-y-3">
                  {coachMpi.length > 0 ? (
                    coachMpi.map((item, idx) => (
                      <motion.div 
                        key={idx}
                        whileHover={{ x: 2, backgroundColor: "rgba(259, 259, 259, 0.03)" }}
                        onClick={() => navigateToPlayer(item.playerName)}
                        className="flex justify-between items-center p-1.5 -m-1.5 rounded-xl cursor-pointer transition-all duration-200"
                      >
                        <div className="text-left min-w-0 pr-2">
                          <span className="text-sm font-black text-white uppercase block truncate">{item.playerName}</span>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mt-0.5">
                            {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <span className="text-sm font-black text-white font-mono bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-850 shrink-0">
                          {formatScoreValue(item.score)}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-[10px] font-bold text-zinc-600 text-center uppercase py-2">
                      No MPI Data
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Last 5 PPI */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-4 shadow-lg">
                <span className="text-[11px] font-bold text-zinc-655 dark:text-zinc-405 uppercase tracking-wider block text-center border-b border-zinc-900 pb-2 mb-2">
                  LAST 5 PPI
                </span>
                <div className="space-y-3">
                  {coachPpi.length > 0 ? (
                    coachPpi.map((item, idx) => (
                      <motion.div 
                        key={idx}
                        whileHover={{ x: 2, backgroundColor: "rgba(259, 259, 259, 0.03)" }}
                        onClick={() => navigateToPlayer(item.playerName)}
                        className="flex justify-between items-center p-1.5 -m-1.5 rounded-xl cursor-pointer transition-all duration-200"
                      >
                        <div className="text-left min-w-0 pr-2">
                          <span className="text-sm font-black text-white uppercase block truncate">{item.playerName}</span>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mt-0.5">
                            {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <span className="text-sm font-black text-white font-mono bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-850 shrink-0">
                          {formatScoreValue(item.score)}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-[10px] font-bold text-zinc-600 text-center uppercase py-2">
                      No PPI Data
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
