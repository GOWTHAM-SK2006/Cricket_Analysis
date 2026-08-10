"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trophy, Target, Flame, Zap, ChevronRight, Users, TrendingUp, TrendingDown, BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Player {
  id: number;
  name: string;
  role: string;
  ppiScore: number | null;
  mpiScore: number | null;
}

const formatScore = (val: number | null | undefined): number => {
  if (val === null || val === undefined || val === 0) return 0;
  let num = typeof val === "number" ? val : parseFloat(val as any);
  if (isNaN(num) || num <= 0) return 0;
  if (num > 10) num = num / 10;
  return Math.round(num * 10) / 10;
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
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 16 } }
};

const getRankDelta = (index: number) => {
  if (index === 0) return { dir: "up", val: 4 };
  if (index === 1) return { dir: "down", val: 1 };
  return { dir: "down", val: 2 };
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricTab, setMetricTab] = useState<"cpi" | "ppi" | "mpi">("cpi");

  useEffect(() => {
    api.get("/players")
      .then((res) => { setPlayers(res.data || []); setLoading(false); })
      .catch((err) => { console.error("Failed to fetch leaderboard data", err); setLoading(false); });
  }, []);

  const getPlayerScores = (p: Player) => {
    const ppi = formatScore(p.ppiScore);
    const mpi = formatScore(p.mpiScore);
    let cpi = 0;
    if (ppi > 0 && mpi > 0) cpi = Math.round((ppi * 0.4 + mpi * 0.6) * 10) / 10;
    else if (ppi > 0) cpi = ppi;
    else if (mpi > 0) cpi = mpi;
    return { cpi, ppi, mpi };
  };

  const sortedPlayers = [...players].sort((a, b) => getPlayerScores(b)[metricTab] - getPlayerScores(a)[metricTab]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full bg-orange-50 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-orange-500" />
          </div>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Loading Squad Rankings...</p>
      </div>
    );
  }

  const topThree = sortedPlayers.slice(0, 3);
  const totalPlayers = sortedPlayers.length;
  const avgCpi = totalPlayers > 0
    ? Math.round(sortedPlayers.reduce((acc, p) => acc + getPlayerScores(p).cpi, 0) / totalPlayers)
    : 0;
  const highestCpi = sortedPlayers.length > 0 ? getPlayerScores(sortedPlayers[0]).cpi : 0;
  const maxScore = sortedPlayers.length > 0 ? Math.max(...sortedPlayers.map(p => getPlayerScores(p)[metricTab])) : 10;

  const tabs = [
    { id: "cpi", label: "CPI INDEX", icon: Zap },
    { id: "ppi", label: "PPI INDEX", icon: Target },
    { id: "mpi", label: "MPI INDEX", icon: Flame },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-7 pb-20 select-none max-w-2xl mx-auto px-1"
    >
      {/* ── HERO HEADER ── */}
      <motion.div variants={itemVariants} className="text-center pt-2 space-y-3">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 text-orange-600 shadow-sm shadow-orange-100">
          <Trophy className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Squad Rankings</span>
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-[-0.02em] leading-none">
            <span className="text-slate-900">LEADER</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">BOARD</span>
          </h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Top Performers Based on Performance Index
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-orange-200"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-orange-200"></div>
        </div>
      </motion.div>

      {/* ── METRIC TAB SWITCHER ── */}
      <motion.div variants={itemVariants}>
        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm grid grid-cols-3 gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = metricTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMetricTab(tab.id as any)}
                className={`relative py-3 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer overflow-hidden ${
                  isActive
                    ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {isActive && <div className="absolute inset-0 bg-white/10 rounded-xl"></div>}
                <Icon className={`w-4 h-4 stroke-[2.5] relative z-10 ${isActive ? "text-white" : ""}`} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── PREMIUM PODIUM ── */}
      {topThree.length > 0 && (
        <motion.div variants={itemVariants} className="relative">
          <div className="absolute inset-x-8 top-8 bottom-0 bg-gradient-to-b from-orange-100/60 to-transparent rounded-3xl blur-2xl pointer-events-none" />
          <div className="grid grid-cols-3 gap-3 items-end relative z-10 pt-6 pb-1">

            {/* RANK 2 — Silver */}
            {topThree[1] ? (
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/players?id=${topThree[1].id}`)}
                className="relative bg-white border border-slate-200/80 rounded-3xl p-4 text-center cursor-pointer flex flex-col items-center gap-3 min-h-[210px] shadow-sm hover:shadow-lg hover:shadow-slate-100 transition-all group"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-white font-black text-xs flex items-center justify-center shadow-md ring-2 ring-white">
                  2
                </div>
                <div className="pt-3 flex flex-col items-center gap-2.5 flex-1 w-full">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-sm uppercase shadow-inner">
                      {topThree[1].name.substring(0, 2)}
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[10px] shadow-sm z-10">
                      {getRoleEmoji(topThree[1].role)}
                    </div>
                  </div>
                  <div className="space-y-0.5 w-full px-1">
                    <p className="text-[13px] font-black text-slate-900 uppercase truncate tracking-tight">{topThree[1].name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate tracking-wider">{topThree[1].role}</p>
                  </div>
                </div>
                <div className="w-full bg-slate-50 rounded-xl px-2 py-2 border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{metricTab.toUpperCase()} Score</p>
                  <p className="text-2xl font-black text-slate-700 tracking-tight leading-none mt-0.5">{getPlayerScores(topThree[1])[metricTab] || "0"}</p>
                </div>
              </motion.div>
            ) : <div />}

            {/* RANK 1 — Gold Champion */}
            {topThree[0] && (
              <motion.div
                whileHover={{ y: -8, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/players?id=${topThree[0].id}`)}
                className="relative bg-white border-2 border-orange-400 rounded-3xl p-4 text-center cursor-pointer flex flex-col items-center gap-3 min-h-[245px] shadow-xl shadow-orange-200/60 group"
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-orange-300/50 ring-2 ring-white">
                  👑
                </div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-orange-50/40 to-transparent pointer-events-none" />
                <div className="pt-4 flex flex-col items-center gap-3 flex-1 w-full relative z-10">
                  <div className="relative">
                    <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 opacity-30 blur-sm" />
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-orange-300 flex items-center justify-center text-orange-600 font-black text-base uppercase shadow-inner">
                      {topThree[0].name.substring(0, 2)}
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-white border border-orange-200 rounded-full flex items-center justify-center text-[10px] shadow-sm z-10">
                      {getRoleEmoji(topThree[0].role)}
                    </div>
                  </div>
                  <div className="space-y-0.5 w-full px-1">
                    <p className="text-[15px] font-black text-slate-900 uppercase truncate tracking-tight">{topThree[0].name}</p>
                    <p className="text-[10px] font-extrabold text-orange-500 uppercase truncate tracking-wider">{topThree[0].role}</p>
                  </div>
                </div>
                <div className="w-full relative z-10">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl px-2 py-2.5 shadow-md shadow-orange-200">
                    <p className="text-[8px] font-black text-orange-100 uppercase tracking-wider">{metricTab.toUpperCase()} Score</p>
                    <p className="text-3xl font-black text-white tracking-tight leading-none mt-0.5">{getPlayerScores(topThree[0])[metricTab] || "0"}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* RANK 3 — Bronze */}
            {topThree[2] ? (
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/players?id=${topThree[2].id}`)}
                className="relative bg-white border border-amber-200/80 rounded-3xl p-4 text-center cursor-pointer flex flex-col items-center gap-3 min-h-[210px] shadow-sm hover:shadow-lg hover:shadow-amber-100 transition-all group"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-white font-black text-xs flex items-center justify-center shadow-md ring-2 ring-white">
                  3
                </div>
                <div className="pt-3 flex flex-col items-center gap-2.5 flex-1 w-full">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 font-black text-sm uppercase shadow-inner">
                      {topThree[2].name.substring(0, 2)}
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-white border border-amber-200 rounded-full flex items-center justify-center text-[10px] shadow-sm z-10">
                      {getRoleEmoji(topThree[2].role)}
                    </div>
                  </div>
                  <div className="space-y-0.5 w-full px-1">
                    <p className="text-[13px] font-black text-slate-900 uppercase truncate tracking-tight">{topThree[2].name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate tracking-wider">{topThree[2].role}</p>
                  </div>
                </div>
                <div className="w-full bg-amber-50 rounded-xl px-2 py-2 border border-amber-100">
                  <p className="text-[8px] font-black text-amber-500 uppercase tracking-wider">{metricTab.toUpperCase()} Score</p>
                  <p className="text-2xl font-black text-amber-600 tracking-tight leading-none mt-0.5">{getPlayerScores(topThree[2])[metricTab] || "0"}</p>
                </div>
              </motion.div>
            ) : <div />}

          </div>
        </motion.div>
      )}

      {/* ── FULL SQUAD RANKINGS ── */}
      <motion.div variants={itemVariants}>
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-white">
            <h3 className="text-[11px] font-black tracking-[0.15em] text-slate-700 uppercase flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-orange-500" />
              </div>
              Full Squad Rankings
            </h3>
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{sortedPlayers.length} Players</span>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            <AnimatePresence mode="wait">
              {sortedPlayers.map((player, index) => {
                const scores = getPlayerScores(player);
                const scoreVal = scores[metricTab];
                const rank = index + 1;
                const initials = player.name.substring(0, 2).toUpperCase();
                const delta = getRankDelta(index);
                const barPct = maxScore > 0 ? Math.min((scoreVal / maxScore) * 100, 100) : 0;

                return (
                  <motion.div
                    key={`${player.id}-${metricTab}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => router.push(`/players?id=${player.id}`)}
                    className="px-4 py-3.5 flex items-center justify-between hover:bg-orange-50/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-xl font-mono text-[11px] font-black flex items-center justify-center shrink-0 transition-all group-hover:scale-110 ${
                        rank === 1 ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200"
                        : rank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-sm"
                        : rank === 3 ? "bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500"
                      }`}>
                        #{rank}
                      </div>
                      <div className="relative shrink-0">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs uppercase transition-all ${
                          rank === 1 ? "bg-orange-100 border-2 border-orange-200 text-orange-600" : "bg-slate-100 border border-slate-200 text-slate-600"
                        }`}>
                          {initials}
                        </div>
                        <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[9px] shadow-xs z-10">
                          {getRoleEmoji(player.role)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div>
                          <span className="text-[13px] font-black text-slate-900 uppercase leading-none tracking-tight group-hover:text-orange-600 transition-colors block truncate">
                            {player.name}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{player.role}</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barPct}%` }}
                            transition={{ duration: 0.8, delay: index * 0.05, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              rank === 1 ? "bg-gradient-to-r from-orange-400 to-amber-400" : "bg-gradient-to-r from-slate-300 to-slate-400"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-3">
                      <div className="hidden sm:flex flex-col items-end gap-0.5">
                        <span className={`text-[11px] font-black flex items-center gap-0.5 ${delta.dir === "up" ? "text-emerald-500" : "text-rose-400"}`}>
                          {delta.dir === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {delta.val}
                        </span>
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider">vs last month</span>
                      </div>
                      <div className="text-right min-w-[48px]">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{metricTab.toUpperCase()}</p>
                        <p className={`text-lg font-black font-mono leading-none ${rank === 1 ? "text-orange-500" : "text-slate-800"}`}>
                          {scoreVal > 0 ? scoreVal : "0"}
                        </p>
                      </div>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center transition-all group-hover:bg-orange-100">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── STATS SUMMARY ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        <div className="relative bg-white border border-blue-100 rounded-2xl p-4 overflow-hidden hover:shadow-md hover:shadow-blue-50 transition-all">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-blue-50 opacity-60" />
          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono leading-none">{totalPlayers}</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Total Players</p>
        </div>
        <div className="relative bg-white border border-emerald-100 rounded-2xl p-4 overflow-hidden hover:shadow-md hover:shadow-emerald-50 transition-all">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-emerald-50 opacity-60" />
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
            <BarChart2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono leading-none">{avgCpi}</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Avg CPI</p>
        </div>
        <div className="relative bg-white border border-orange-100 rounded-2xl p-4 overflow-hidden hover:shadow-md hover:shadow-orange-50 transition-all">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-orange-50 opacity-60" />
          <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
            <Trophy className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono leading-none">{highestCpi}</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Highest CPI</p>
        </div>
      </motion.div>

    </motion.div>
  );
}
