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
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

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
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    {
      sender: "bot",
      text: "Hello! I am your AI Cricket Coach. How can I assist you with player performance, practice drills, or match strategies today?"
    }
  ]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;

    const userText = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setIsSending(true);

    try {
      const res = await api.post("/ai/chat", {
        sessionId: "dash_session_user",
        userRole: role === "player" ? "PLAYER" : "COACH",
        message: userText
      });

      if (res && res.data && res.data.reply) {
        setChatMessages((prev) => [...prev, { sender: "bot", text: res.data.reply }]);
      } else if (res && res.data && res.data.message) {
        setChatMessages((prev) => [...prev, { sender: "bot", text: res.data.message }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { sender: "bot", text: "AI Service is temporarily unavailable." }
        ]);
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.response?.data?.reply || "AI Service is temporarily unavailable.";
      setChatMessages((prev) => [
        ...prev,
        { sender: "bot", text: errorMsg }
      ]);
    } finally {
      setIsSending(false);
    }
  };

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
        className="text-left relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-white via-orange-50 to-orange-100 border border-orange-200/50 shadow-xl min-h-[120px]"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
        {/* Batsman Hero Image */}
        <div className="absolute right-0 top-0 bottom-0 w-[80%] md:w-[60%] flex items-end justify-end pointer-events-none">
          <Image 
            src="/batsman-hero.png" 
            alt="Cricket Batsman Hero" 
            fill
            className="object-cover object-right"
            priority
          />
        </div>
        <div className="relative z-10">
          <h2 className="text-xs font-bold tracking-widest text-orange-600 uppercase">
            WELCOME BACK COACH
          </h2>
          <h1 className="text-4xl font-black text-black uppercase tracking-tight mt-1 leading-none flex items-center gap-2">
            {coachName || "GOWTHAM"}
            <span className="inline-block animate-pulse text-orange-500">⚡</span>
          </h1>
        </div>
      </motion.div>

      {/* 2. TODAY'S SNAPSHOT */}
      <div id="tour-snapshot" className="space-y-3">
        <h3 className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 uppercase pl-1 flex items-center gap-2">
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
            className="bg-zinc-950 border border-zinc-900/80 rounded-3xl p-5 text-left space-y-2 relative overflow-hidden transition-all duration-300 group shadow-md"
          >
            <div className="absolute top-3 right-3 w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total Players</span>
            <span className="text-3.5xl font-black text-white block leading-none">{stats?.totalPlayers || 0}</span>
          </motion.div>
          
          {/* Card 2: Average CPI */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02, borderColor: "rgba(249, 115, 22, 0.4)", boxShadow: "0 10px 30px -10px rgba(249,115,22,0.1)" }}
            className="bg-zinc-950 border border-zinc-900/80 rounded-3xl p-5 text-left space-y-2 relative overflow-hidden transition-all duration-300 group shadow-md"
          >
            <div className="absolute top-3 right-3 w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Average CPI</span>
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
            <div className="absolute top-3 right-3 w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Average PPI</span>
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
            <div className="absolute top-3 right-3 w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Average MPI</span>
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


          
        </motion.div>
      ) : (
        <div id="tour-quick-actions" className="space-y-3">
          <h3 className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 uppercase pl-1 flex items-center gap-2">
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
            <div className="flex items-center justify-between pl-1">
              <h3 className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 uppercase flex items-center gap-2">
                <Star className="w-4 h-4 text-orange-500" />
                TOP PERFORMERS
              </h3>
              <button onClick={() => router.push('/players')} className="text-[10px] font-bold text-orange-500 uppercase tracking-widest hover:text-orange-400 cursor-pointer flex items-center gap-1">
                VIEW ALL <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="bg-zinc-950 border border-zinc-900/80 rounded-3.5xl divide-y divide-zinc-900/40 overflow-hidden shadow-lg">
              {stats?.topPerformers && stats.topPerformers.length > 0 ? (
                stats.topPerformers.map((p, idx) => {
                  const lastDate = lastAssessmentDates[p.name.toLowerCase()] || "No assessments";
                  const initials = p.name.substring(0, 2).toUpperCase();
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ backgroundColor: "rgba(249, 115, 22, 0.03)", x: 4 }}
                      onClick={() => navigateToPlayer(p.name)}
                      className="p-4 flex justify-between items-center cursor-pointer transition-colors active:bg-zinc-900/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500 font-black text-xs uppercase flex-shrink-0">
                          {initials}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-base font-black text-white uppercase block tracking-tight">{p.name}</span>
                          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
                            Last Assessed: {lastDate}
                          </span>
                        </div>
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
            <div className="flex items-center justify-between pl-1">
              <h3 className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                PLAYERS NEEDING ATTENTION
              </h3>
              <button onClick={() => router.push('/players')} className="text-[10px] font-bold text-orange-500 uppercase tracking-widest hover:text-orange-400 cursor-pointer flex items-center gap-1">
                VIEW ALL <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="bg-zinc-950 border border-zinc-900/80 rounded-3.5xl divide-y divide-zinc-900/40 overflow-hidden shadow-lg">
              {stats?.playersNeedingAttention && stats.playersNeedingAttention.length > 0 ? (
                stats.playersNeedingAttention.map((p, idx) => {
                  const lastDate = lastAssessmentDates[p.name.toLowerCase()] || "No assessments";
                  const initials = p.name.substring(0, 2).toUpperCase();
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.03)", x: 4 }}
                      onClick={() => navigateToPlayer(p.name)}
                      className="p-4 flex justify-between items-center cursor-pointer transition-colors active:bg-zinc-900/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-black text-xs uppercase flex-shrink-0">
                          {initials}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-base font-black text-white uppercase block tracking-tight">{p.name}</span>
                          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
                            Last Assessed: {lastDate}
                          </span>
                        </div>
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

        </div>
      )}

      {/* Floating AI Chatbot Button & Modal */}
      <div className="fixed bottom-28 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowChatModal(!showChatModal)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-2xl flex items-center justify-center cursor-pointer border-2 border-orange-300 active:scale-95 transition-all"
          title="Ask AI Cricket Coach"
        >
          <Bot className="w-7 h-7 stroke-[2.5]" />
        </motion.button>
      </div>

      {/* AI Chatbot Overlay Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl w-full max-w-lg h-[600px] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-500">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">AI CRICKET COACH</h3>
                  <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Powered by OpenRouter AI</p>
                </div>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed font-medium ${
                      msg.sender === "user"
                        ? "bg-orange-500 text-black font-bold rounded-tr-none"
                        : "bg-zinc-900 border border-zinc-800 text-white rounded-tl-none w-full"
                    }`}
                  >
                    {msg.sender === "user" ? msg.text : parseMarkdown(msg.text)}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 p-3 rounded-2xl text-xs flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    <span>Analyzing performance & coach guidelines...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-zinc-900/50 border-t border-zinc-850 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about batting, bowling, drills..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={isSending || !chatInput.trim()}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Premium structured Markdown parser helper for bot responses
const parseMarkdown = (text: string): React.ReactNode => {
  if (!text) return "";
  const lines = text.split("\n");
  let inList = false;
  const elements: React.ReactNode[] = [];
  
  // Basic bold regex: **text**
  const boldRegex = /\*\*(.*?)\*\*/g;
  
  const renderText = (txt: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    boldRegex.lastIndex = 0;
    while ((match = boldRegex.exec(txt)) !== null) {
      if (match.index > lastIndex) {
        parts.push(txt.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={match.index} className="font-extrabold text-orange-500">
          {match[1]}
        </strong>
      );
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < txt.length) {
      parts.push(txt.substring(lastIndex));
    }
    return parts.length > 0 ? <>{parts}</> : txt;
  };

  let listItems: React.ReactNode[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (inList) {
        elements.push(
          <ul key={`list-${i}`} className="list-disc pl-5 my-2 space-y-1 text-zinc-300">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      continue;
    }
    
    // Bullet list: starts with "* " or "- "
    if (line.startsWith("* ") || line.startsWith("- ")) {
      inList = true;
      const content = line.substring(2);
      listItems.push(
        <li key={`li-${i}`} className="text-zinc-300">
          {renderText(content)}
        </li>
      );
    } else {
      if (inList) {
        elements.push(
          <ul key={`list-${i}`} className="list-disc pl-5 my-2 space-y-1 text-zinc-300">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      
      // Table check
      if (line.startsWith("|") && line.endsWith("|")) {
        const tableRows: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
          tableRows.push(lines[i].trim());
          i++;
        }
        i--; // Adjust index
        
        if (tableRows.length > 0) {
          const parsedRows = tableRows.map(row => 
            row.split("|")
              .map(cell => cell.trim())
              .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          );
          
          // Check if second row is separator like |---|---|
          const hasSeparator = parsedRows.length > 1 && parsedRows[1].every(cell => cell.startsWith("-") || cell.includes("---"));
          const headerRow = parsedRows[0];
          const dataRows = parsedRows.slice(hasSeparator ? 2 : 1);
          
          elements.push(
            <div key={`table-${i}`} className="overflow-x-auto my-3 border border-zinc-800 rounded-xl">
              <table className="min-w-full divide-y divide-zinc-800 text-[11px]">
                <thead className="bg-zinc-950">
                  <tr>
                    {headerRow.map((cell, idx) => (
                      <th key={idx} className="px-3 py-2 text-left font-black text-white uppercase tracking-wider border-r border-zinc-850 last:border-r-0">
                        {renderText(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 bg-zinc-950/40">
                  {dataRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-zinc-900/30">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-zinc-350 border-r border-zinc-850 last:border-r-0">
                          {renderText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      } else {
        // Normal paragraph
        elements.push(
          <p key={`p-${i}`} className="my-1 leading-relaxed">
            {renderText(line)}
          </p>
        );
      }
    }
  }
  
  if (inList) {
    elements.push(
      <ul key="list-end" className="list-disc pl-5 my-2 space-y-1 text-zinc-300">
        {listItems}
      </ul>
    );
  }
  
  return <div className="space-y-1.5">{elements}</div>;
};

