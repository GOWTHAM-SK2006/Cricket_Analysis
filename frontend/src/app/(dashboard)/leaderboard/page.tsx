"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Trophy, Medal, Flame, Target, Zap, ChevronRight, Award, Crown, Sparkles, TrendingUp, ShieldCheck, User } from "lucide-react";
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
        <p className="text-zinc-500 font-extrabold uppercase tracking-widest text-xs">Computing Squad Rankings...</p>
      </div>
    );
  }

  const topThree = sortedPlayers.slice(0, 3);
  const remainingRankings = sortedPlayers.slice(3);

  // Helper for rank badge styling
  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-br from-amber-400 to-orange-500 text-black shadow-lg shadow-orange-500/25";
    if (rank === 2) return "bg-zinc-800 border border-zinc-700 text-zinc-200";
    if (rank === 3) return "bg-amber-950/80 border border-amber-800/60 text-amber-500";
    return "bg-zinc-900 border border-zinc-850 text-zinc-500 font-mono";
  };

  const getTierColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 60) return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    return "text-amber-500 bg-amber-500/10 border-amber-500/30";
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-7 pb-20 select-none text-left max-w-xl mx-auto"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="space-y-1.5 text-center pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 mb-1">
          <Trophy className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="text-[10px] font-black uppercase tracking-widest">SQUAD RANKINGS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight leading-none">
          LEADERBOARD
        </h1>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
          Top performers based on performance index
        </p>
      </motion.div>

      {/* Metric Segmented Control */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-1.5 bg-zinc-950 p-1.5 rounded-2.5xl border border-zinc-900 shadow-xl">
        {[
          { id: "cpi", label: "CPI INDEX", icon: Zap, desc: "Combined" },
          { id: "ppi", label: "PPI INDEX", icon: Target, desc: "Practice" },
          { id: "mpi", label: "MPI INDEX", icon: Flame, desc: "Match" }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = metricTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMetricTab(tab.id as any)}
              className={`py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-lg shadow-orange-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{tab.label}</span>
              </div>
            </button>
          );
        })}
      </motion.div>

      {/* Premium Podium Display */}
      {topThree.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 items-end pt-6 pb-2">
          
          {/* RANK 2 - SILVER */}
          {topThree[1] ? (
            <motion.div
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              onClick={() => router.push(`/players?id=${topThree[1].id}`)}
              className="bg-zinc-950 border-2 border-zinc-850 hover:border-zinc-700 rounded-3xl p-3.5 text-center space-y-3 cursor-pointer transition-all flex flex-col items-center justify-between h-44 relative group shadow-xl"
            >
              <div className="absolute -top-4 w-9 h-9 rounded-full bg-zinc-800 border-2 border-zinc-700 text-zinc-200 font-mono font-black text-sm flex items-center justify-center shadow-lg">
                2
              </div>
              <div className="pt-3 w-full flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 font-black text-sm uppercase shadow-inner">
                  {topThree[1].name.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-0.5 w-full">
                  <p className="text-xs font-black text-white uppercase truncate px-1">{topThree[1].name}</p>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase truncate">{topThree[1].role}</p>
                </div>
              </div>
              <div className="w-full bg-zinc-900 border border-zinc-850 rounded-xl py-1.5 text-orange-400 font-mono text-base font-black tracking-tight">
                {getPlayerScores(topThree[1])[metricTab] || "N/A"}
              </div>
            </motion.div>
          ) : <div />}

          {/* RANK 1 - GOLD CHAMPION */}
          {topThree[0] && (
            <motion.div
              whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
              onClick={() => router.push(`/players?id=${topThree[0].id}`)}
              className="bg-gradient-to-b from-orange-500/20 via-zinc-950 to-zinc-950 border-2 border-orange-500 hover:border-orange-400 rounded-3.5xl p-4 text-center space-y-3 cursor-pointer transition-all flex flex-col items-center justify-between h-52 relative shadow-2xl shadow-orange-500/10 group"
            >
              <div className="absolute -top-5 w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black text-base flex items-center justify-center shadow-xl shadow-orange-500/30">
                👑
              </div>
              <div className="pt-3 w-full flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border-2 border-orange-500/40 flex items-center justify-center text-orange-400 font-black text-base uppercase shadow-lg">
                  {topThree[0].name.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-0.5 w-full">
                  <p className="text-sm font-black text-white uppercase truncate px-1 tracking-tight">{topThree[0].name}</p>
                  <p className="text-[10px] font-extrabold text-orange-400 uppercase truncate">{topThree[0].role}</p>
                </div>
              </div>
              <div className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-black rounded-xl py-1.5 font-mono text-lg font-black tracking-tight shadow-md">
                {getPlayerScores(topThree[0])[metricTab] || "N/A"}
              </div>
            </motion.div>
          )}

          {/* RANK 3 - BRONZE */}
          {topThree[2] ? (
            <motion.div
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              onClick={() => router.push(`/players?id=${topThree[2].id}`)}
              className="bg-zinc-950 border-2 border-zinc-850 hover:border-zinc-700 rounded-3xl p-3.5 text-center space-y-3 cursor-pointer transition-all flex flex-col items-center justify-between h-40 relative group shadow-xl"
            >
              <div className="absolute -top-4 w-9 h-9 rounded-full bg-amber-950 border-2 border-amber-800 text-amber-500 font-mono font-black text-sm flex items-center justify-center shadow-lg">
                3
              </div>
              <div className="pt-3 w-full flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-500 font-black text-sm uppercase shadow-inner">
                  {topThree[2].name.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-0.5 w-full">
                  <p className="text-xs font-black text-white uppercase truncate px-1">{topThree[2].name}</p>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase truncate">{topThree[2].role}</p>
                </div>
              </div>
              <div className="w-full bg-zinc-900 border border-zinc-850 rounded-xl py-1.5 text-orange-400 font-mono text-base font-black tracking-tight">
                {getPlayerScores(topThree[2])[metricTab] || "N/A"}
              </div>
            </motion.div>
          ) : <div />}

        </motion.div>
      )}

      {/* Full Squad Rankings List */}
      <motion.div variants={itemVariants} className="space-y-3 pt-2">
        <div className="flex items-center justify-between pl-1">
          <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-500" />
            FULL SQUAD RANKINGS
          </h3>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            {sortedPlayers.length} PLAYERS
          </span>
        </div>

        <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3.5xl divide-y divide-zinc-900/60 overflow-hidden shadow-2xl">
          {sortedPlayers.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <User className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">No player records registered.</p>
            </div>
          ) : (
            sortedPlayers.map((player, index) => {
              const scores = getPlayerScores(player);
              const scoreVal = scores[metricTab];
              const rank = index + 1;
              const initials = player.name.substring(0, 2).toUpperCase();

              return (
                <motion.div
                  key={player.id}
                  whileHover={{ backgroundColor: "rgba(249, 115, 22, 0.04)", x: 4 }}
                  onClick={() => router.push(`/players?id=${player.id}`)}
                  className="p-4 flex items-center justify-between transition-all cursor-pointer active:bg-zinc-900/80 group"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank Badge */}
                    <div className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 shadow-sm ${getRankBadgeStyle(rank)}`}>
                      #{rank}
                    </div>

                    {/* Avatar & Details */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-orange-500 font-black text-xs uppercase shrink-0 group-hover:border-orange-500/40 transition-colors">
                        {initials}
                      </div>
                      <div className="text-left space-y-0.5">
                        <span className="text-sm font-black text-white uppercase block leading-tight tracking-tight group-hover:text-orange-400 transition-colors">
                          {player.name}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider">
                          {player.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score & Navigation Arrow */}
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-xl border font-mono font-black text-sm tracking-tight ${getTierColor(scoreVal)}`}>
                      {scoreVal > 0 ? scoreVal : "N/A"}
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

    </motion.div>
  );
}
