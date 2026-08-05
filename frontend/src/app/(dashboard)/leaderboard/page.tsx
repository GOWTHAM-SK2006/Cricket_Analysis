"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Trophy, Target, Flame, Zap, ChevronRight, Users, TrendingUp, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Player {
  id: number;
  name: string;
  role: string;
  ppiScore: number | null;
  mpiScore: number | null;
}

const formatScore = (val: number | null | undefined) => {
  if (val === null || val === undefined || val === 0) return 0;
  if (val <= 10) return Math.round(val * 10);
  return Math.round(val);
};

const getRoleEmoji = (roleStr: string) => {
  const r = (roleStr || "").toLowerCase();
  if (r.includes("batsman") || r.includes("batter")) return "🏏";
  if (r.includes("bowler")) return "⚾";
  if (r.includes("wicketkeeper") || r.includes("wicket-keeper") || r.includes("wicket keeper") || r.includes("keeper")) return "🧤";
  if (r.includes("all-rounder") || r.includes("all rounder") || r.includes("allrounder")) return "⚡";
  return "🏏";
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 14 } }
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricTab, setMetricTab] = useState<"cpi" | "ppi" | "mpi">("cpi");

  useEffect(() => {
    api.get("/players")
      .then((res) => {
        setPlayers(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch leaderboard data", err);
        setLoading(false);
      });
  }, []);

  const getPlayerScores = (p: Player) => {
    const ppi = formatScore(p.ppiScore);
    const mpi = formatScore(p.mpiScore);
    let cpi = 0;
    if (ppi > 0 && mpi > 0) {
      cpi = Math.round(ppi * 0.4 + mpi * 0.6);
    } else if (ppi > 0) {
      cpi = ppi;
    } else if (mpi > 0) {
      cpi = mpi;
    }
    return { cpi, ppi, mpi };
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const aScores = getPlayerScores(a);
    const bScores = getPlayerScores(b);
    return bScores[metricTab] - aScores[metricTab];
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 select-none">
        <Loader2 className="w-9 h-9 text-orange-500 animate-spin" />
        <p className="text-slate-400 font-extrabold uppercase tracking-widest text-xs">Loading Squad Rankings...</p>
      </div>
    );
  }

  const topThree = sortedPlayers.slice(0, 3);
  
  // Calculate summary stats
  const totalPlayers = sortedPlayers.length;
  const avgCpi = totalPlayers > 0 
    ? Math.round(sortedPlayers.reduce((acc, p) => acc + getPlayerScores(p).cpi, 0) / totalPlayers) 
    : 0;
  const highestCpi = sortedPlayers.length > 0 ? getPlayerScores(sortedPlayers[0]).cpi : 0;

  // Mock month variations for realistic visual
  const getRankDelta = (index: number) => {
    if (index === 0) return { dir: "up", val: 4 };
    if (index === 1) return { dir: "down", val: 1 };
    return { dir: "down", val: 2 };
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-6 pb-16 select-none text-left max-w-2xl mx-auto"
    >
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="space-y-1.5 text-center pt-1">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-orange-200 text-orange-600 shadow-xs mb-1">
          <Trophy className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="text-[11px] font-black uppercase tracking-wider">SQUAD RANKINGS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">
          LEADER<span className="text-orange-500">BOARD</span>
        </h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Top performers based on performance index
        </p>
      </motion.div>

      {/* Metric Segmented Filter Switcher */}
      <motion.div variants={itemVariants} className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-3 gap-2">
        {[
          { id: "cpi", label: "CPI INDEX", icon: Zap },
          { id: "ppi", label: "PPI INDEX", icon: Target },
          { id: "mpi", label: "MPI INDEX", icon: Flame }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = metricTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMetricTab(tab.id as any)}
              className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-white text-orange-600 border border-orange-300 shadow-md shadow-orange-500/10"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4 stroke-[2.5]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Premium 3-Podium Display */}
      {topThree.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 items-end pt-4 pb-1">
          
          {/* RANK 2 - SILVER */}
          {topThree[1] ? (
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => router.push(`/players?id=${topThree[1].id}`)}
              className="bg-white border-2 border-slate-200 rounded-3xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-between min-h-[220px] relative group shadow-sm hover:shadow-md"
            >
              <div className="absolute -top-3 w-8 h-8 rounded-full bg-slate-200 border-2 border-slate-300 text-slate-700 font-mono font-black text-xs flex items-center justify-center shadow-xs">
                2
              </div>
              <div className="pt-2 w-full flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-black text-sm uppercase">
                  {topThree[1].name.substring(0, 2).toUpperCase()}
                </div>
                <div className="w-full space-y-0.5">
                  <p className="text-sm font-black text-slate-900 uppercase truncate px-1">{topThree[1].name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{topThree[1].role}</p>
                </div>
              </div>
              <div className="w-full space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">CPI SCORE</span>
                <span className="text-2xl font-black text-slate-800 font-mono block">
                  {getPlayerScores(topThree[1])[metricTab] || "0"}
                </span>
                {/* Micro trendline graphic */}
                <div className="w-full h-4 mt-1">
                  <svg className="w-full h-full text-slate-400 stroke-current fill-none" viewBox="0 0 100 20">
                    <path d="M0 15 L12 5 L25 15 L37 5 L50 15 L62 5 L75 15 L87 5 L100 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ) : <div />}

          {/* RANK 1 - GOLD CHAMPION */}
          {topThree[0] && (
            <motion.div
              whileHover={{ y: -6 }}
              onClick={() => router.push(`/players?id=${topThree[0].id}`)}
              className="bg-white border-2 border-orange-400 rounded-3.5xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-between min-h-[250px] relative shadow-lg shadow-orange-500/10 group"
            >
              <div className="absolute -top-4 w-9 h-9 rounded-full bg-amber-400 border-2 border-amber-300 text-amber-950 font-black text-sm flex items-center justify-center shadow-md">
                👑
              </div>
              <div className="pt-3 w-full flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center text-orange-600 font-black text-base uppercase">
                  {topThree[0].name.substring(0, 2).toUpperCase()}
                </div>
                <div className="w-full space-y-0.5">
                  <p className="text-base font-black text-slate-900 uppercase truncate px-1 tracking-tight">{topThree[0].name}</p>
                  <p className="text-[10px] font-extrabold text-orange-600 uppercase truncate">{topThree[0].role}</p>
                </div>
              </div>
              <div className="w-full space-y-1">
                <span className="text-[9px] font-black text-orange-600 uppercase block tracking-wider bg-orange-50 py-0.5 rounded-full">CPI SCORE</span>
                <span className="text-3xl font-black text-orange-600 font-mono block">
                  {getPlayerScores(topThree[0])[metricTab] || "0"}
                </span>
                {/* Micro trendline graphic */}
                <div className="w-full h-5 mt-1">
                  <svg className="w-full h-full text-orange-500 stroke-current fill-none" viewBox="0 0 100 20">
                    <path d="M0 16 L12 4 L25 16 L37 4 L50 16 L62 4 L75 16 L87 4 L100 16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </motion.div>
          )}

          {/* RANK 3 - BRONZE */}
          {topThree[2] ? (
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => router.push(`/players?id=${topThree[2].id}`)}
              className="bg-white border-2 border-slate-200 rounded-3xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-between min-h-[220px] relative group shadow-sm hover:shadow-md"
            >
              <div className="absolute -top-3 w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-300 text-amber-800 font-mono font-black text-xs flex items-center justify-center shadow-xs">
                3
              </div>
              <div className="pt-2 w-full flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-black text-sm uppercase">
                  {topThree[2].name.substring(0, 2).toUpperCase()}
                </div>
                <div className="w-full space-y-0.5">
                  <p className="text-sm font-black text-slate-900 uppercase truncate px-1">{topThree[2].name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{topThree[2].role}</p>
                </div>
              </div>
              <div className="w-full space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">CPI SCORE</span>
                <span className="text-2xl font-black text-orange-600 font-mono block">
                  {getPlayerScores(topThree[2])[metricTab] || "0"}
                </span>
                {/* Micro trendline graphic */}
                <div className="w-full h-4 mt-1">
                  <svg className="w-full h-full text-orange-400 stroke-current fill-none" viewBox="0 0 100 20">
                    <path d="M0 15 L12 5 L25 15 L37 5 L50 15 L62 5 L75 15 L87 5 L100 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ) : <div />}

        </motion.div>
      )}

      {/* Full Squad Rankings List */}
      <motion.div variants={itemVariants} className="space-y-3 pt-2">
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black tracking-wider text-slate-700 uppercase flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              FULL SQUAD RANKINGS
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {sortedPlayers.length} PLAYERS
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {sortedPlayers.map((player, index) => {
              const scores = getPlayerScores(player);
              const scoreVal = scores[metricTab];
              const rank = index + 1;
              const initials = player.name.substring(0, 2).toUpperCase();
              const delta = getRankDelta(index);

              return (
                <div
                  key={player.id}
                  onClick={() => router.push(`/players?id=${player.id}`)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className={`w-8 h-8 rounded-full font-mono text-xs font-black flex items-center justify-center shrink-0 ${
                      rank === 1 ? "bg-orange-500 text-white" : rank === 2 ? "bg-slate-200 text-slate-700" : rank === 3 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                    }`}>
                      #{rank}
                    </div>

                    {/* Avatar & Details */}
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-black text-xs uppercase">
                          {initials}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[9px] shadow-xs z-10" title={player.role}>
                          {getRoleEmoji(player.role)}
                        </div>
                      </div>
                      <div className="text-left space-y-0.5">
                        <span className="text-sm font-black text-slate-900 uppercase block leading-tight tracking-tight group-hover:text-orange-600 transition-colors">
                          {player.name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                          {player.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Delta & CPI Score */}
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-col items-center text-center">
                      <span className={`text-[11px] font-black flex items-center gap-0.5 ${delta.dir === "up" ? "text-emerald-600" : "text-rose-500"}`}>
                        {delta.dir === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {delta.val}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">VS LAST MONTH</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider">CPI SCORE</span>
                      <span className="text-base font-black text-slate-900 font-mono block">
                        {scoreVal > 0 ? scoreVal : "0"}
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Footer Summary Stats Cards (Total Players, Average CPI, Highest CPI) */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 pt-2">
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900 font-mono leading-none">{totalPlayers}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">TOTAL PLAYERS</p>
          </div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900 font-mono leading-none">{avgCpi}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">AVERAGE CPI</p>
          </div>
        </div>

        <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900 font-mono leading-none">{highestCpi}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">HIGHEST CPI</p>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}

