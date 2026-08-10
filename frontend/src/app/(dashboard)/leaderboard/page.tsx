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
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-orange-100"></div>
          <div className="absolute inset-0 rounded-full border-2 border-t-orange-500 animate-spin"></div>
          <div className="absolute inset-1.5 rounded-full bg-orange-50 flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-orange-500" />
          </div>
        </div>
        <p className="text-slate-400 font-extrabold uppercase tracking-[0.15em] text-[9px]">Loading Rankings...</p>
      </div>
    );
  }

  const topThree = sortedPlayers.slice(0, 3);
  const totalPlayers = sortedPlayers.length;
  const avgCpi = totalPlayers > 0 ? Math.round(sortedPlayers.reduce((acc, p) => acc + getPlayerScores(p).cpi, 0) / totalPlayers) : 0;
  const highestCpi = sortedPlayers.length > 0 ? getPlayerScores(sortedPlayers[0]).cpi : 0;
  const maxScore = sortedPlayers.length > 0 ? Math.max(...sortedPlayers.map(p => getPlayerScores(p)[metricTab])) : 10;

  const tabs = [
    { id: "cpi", label: "CPI Index", icon: Zap },
    { id: "ppi", label: "PPI Index", icon: Target },
    { id: "mpi", label: "MPI Index", icon: Flame },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 pb-12 max-w-md sm:max-w-lg mx-auto px-2 select-none"
    >
      {/* ── COMPACT HERO HEADER ── */}
      <div className="text-center pt-1 space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-orange-600 shadow-2xs">
          <Trophy className="w-3 h-3 stroke-[2.5]" />
          <span className="text-[9px] font-black uppercase tracking-wider">Squad Rankings</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">
          Leader<span className="text-orange-500">board</span>
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Top performers based on performance index
        </p>
      </div>

      {/* ── SLEEK ANIMATED METRIC TAB SWITCHER ── */}
      <div className="bg-slate-100/80 p-1 rounded-2xl border border-slate-200/70 grid grid-cols-3 gap-1 shadow-2xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = metricTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMetricTab(tab.id as any)}
              className={`relative py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer z-10 ${
                isActive ? "text-orange-600" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/60"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={`w-3.5 h-3.5 stroke-[2.5] relative z-10 ${isActive ? "text-orange-500" : "text-slate-400"}`} />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── SLEEK & COMPACT PODIUM DISPLAY ── */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 items-end pt-2">

          {/* RANK 2 — Silver */}
          {topThree[1] ? (
            <motion.div
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/players?id=${topThree[1].id}`)}
              className="bg-white border border-slate-200/80 rounded-2xl p-2.5 text-center cursor-pointer flex flex-col items-center gap-1.5 shadow-2xs hover:shadow-md transition-all relative group"
            >
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-slate-200 border border-slate-300 text-slate-700 font-mono font-black text-[10px] flex items-center justify-center shadow-2xs">
                2
              </div>

              <div className="pt-2 flex flex-col items-center gap-1 w-full">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-black text-xs uppercase">
                    {topThree[1].name.substring(0, 2)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[8px] z-10">
                    {getRoleEmoji(topThree[1].role)}
                  </div>
                </div>

                <div className="w-full truncate px-0.5">
                  <p className="text-[11px] font-black text-slate-900 uppercase truncate leading-tight">{topThree[1].name}</p>
                  <p className="text-[8px] font-semibold text-slate-400 uppercase truncate">{topThree[1].role}</p>
                </div>
              </div>

              <div className="w-full bg-slate-50 py-1 px-1 rounded-lg border border-slate-100 mt-0.5">
                <span className="text-[8px] font-bold text-slate-400 block uppercase leading-none">Score</span>
                <span className="text-sm font-black text-slate-800 font-mono block mt-0.5 leading-none">
                  {getPlayerScores(topThree[1])[metricTab] || "0"}
                </span>
              </div>
            </motion.div>
          ) : <div />}

          {/* RANK 1 — Gold Champion */}
          {topThree[0] && (
            <motion.div
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/players?id=${topThree[0].id}`)}
              className="bg-white border-2 border-orange-400/90 rounded-2xl p-3 text-center cursor-pointer flex flex-col items-center gap-1.5 shadow-md shadow-orange-100 transition-all relative group z-10"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-white">
                👑
              </div>

              <div className="pt-2 flex flex-col items-center gap-1 w-full">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 font-black text-sm uppercase shadow-inner">
                    {topThree[0].name.substring(0, 2)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-white border border-orange-200 rounded-full flex items-center justify-center text-[9px] z-10">
                    {getRoleEmoji(topThree[0].role)}
                  </div>
                </div>

                <div className="w-full truncate px-0.5">
                  <p className="text-xs font-black text-slate-900 uppercase truncate leading-tight tracking-tight">{topThree[0].name}</p>
                  <p className="text-[8px] font-extrabold text-orange-500 uppercase truncate">{topThree[0].role}</p>
                </div>
              </div>

              <div className="w-full bg-gradient-to-r from-orange-500 to-amber-500 py-1 px-1 rounded-lg text-white shadow-xs mt-0.5">
                <span className="text-[7px] font-extrabold uppercase text-orange-100 block leading-none">Score</span>
                <span className="text-base font-black font-mono block mt-0.5 leading-none">
                  {getPlayerScores(topThree[0])[metricTab] || "0"}
                </span>
              </div>
            </motion.div>
          )}

          {/* RANK 3 — Bronze */}
          {topThree[2] ? (
            <motion.div
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/players?id=${topThree[2].id}`)}
              className="bg-white border border-slate-200/80 rounded-2xl p-2.5 text-center cursor-pointer flex flex-col items-center gap-1.5 shadow-2xs hover:shadow-md transition-all relative group"
            >
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-mono font-black text-[10px] flex items-center justify-center shadow-2xs">
                3
              </div>

              <div className="pt-2 flex flex-col items-center gap-1 w-full">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-black text-xs uppercase">
                    {topThree[2].name.substring(0, 2)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[8px] z-10">
                    {getRoleEmoji(topThree[2].role)}
                  </div>
                </div>

                <div className="w-full truncate px-0.5">
                  <p className="text-[11px] font-black text-slate-900 uppercase truncate leading-tight">{topThree[2].name}</p>
                  <p className="text-[8px] font-semibold text-slate-400 uppercase truncate">{topThree[2].role}</p>
                </div>
              </div>

              <div className="w-full bg-amber-50/70 py-1 px-1 rounded-lg border border-amber-100 mt-0.5">
                <span className="text-[8px] font-bold text-amber-600/70 block uppercase leading-none">Score</span>
                <span className="text-sm font-black text-amber-700 font-mono block mt-0.5 leading-none">
                  {getPlayerScores(topThree[2])[metricTab] || "0"}
                </span>
              </div>
            </motion.div>
          ) : <div />}

        </div>
      )}

      {/* ── CLEAN SQUAD LIST ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-3.5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-orange-500" />
            Full Squad Rankings
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{sortedPlayers.length} Players</span>
        </div>

        <div className="divide-y divide-slate-100/70">
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
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                  onClick={() => router.push(`/players?id=${player.id}`)}
                  className="px-3 py-2.5 flex items-center justify-between hover:bg-orange-50/30 transition-colors cursor-pointer group"
                >
                  {/* Left: Rank + Avatar + Name */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`w-6 h-6 rounded-lg font-mono text-[10px] font-black flex items-center justify-center shrink-0 ${
                      rank === 1 ? "bg-orange-500 text-white shadow-2xs"
                      : rank === 2 ? "bg-slate-200 text-slate-700"
                      : rank === 3 ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-500"
                    }`}>
                      #{rank}
                    </div>

                    <div className="relative shrink-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] uppercase ${
                        rank === 1 ? "bg-orange-100 text-orange-600 border border-orange-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {initials}
                      </div>
                      <div className="absolute -bottom-1 -right-1 text-[8px]">
                        {getRoleEmoji(player.role)}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between pr-2">
                        <span className="text-[12px] font-black text-slate-900 uppercase truncate group-hover:text-orange-600 transition-colors leading-tight">
                          {player.name}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase ml-1 shrink-0">{player.role}</span>
                      </div>
                      {/* Slim Bar */}
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barPct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className={`h-full rounded-full ${rank === 1 ? "bg-orange-500" : "bg-slate-300"}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Score & Arrow */}
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className={`text-[10px] font-black flex items-center gap-0.5 ${delta.dir === "up" ? "text-emerald-500" : "text-rose-400"}`}>
                        {delta.dir === "up" ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {delta.val}
                      </span>
                    </div>

                    <div className="text-right min-w-[36px]">
                      <span className="text-[7px] font-bold text-slate-400 uppercase block leading-none">Score</span>
                      <span className={`text-sm font-black font-mono leading-tight block ${rank === 1 ? "text-orange-500" : "text-slate-800"}`}>
                        {scoreVal > 0 ? scoreVal : "0"}
                      </span>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* ── STATS SUMMARY CARDS ── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-blue-100 rounded-xl p-2.5 flex items-center gap-2 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 font-mono leading-none">{totalPlayers}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Players</p>
          </div>
        </div>

        <div className="bg-white border border-emerald-100 rounded-xl p-2.5 flex items-center gap-2 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <BarChart2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 font-mono leading-none">{avgCpi}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Avg CPI</p>
          </div>
        </div>

        <div className="bg-white border border-orange-100 rounded-xl p-2.5 flex items-center gap-2 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 font-mono leading-none">{highestCpi}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Max CPI</p>
          </div>
        </div>
      </div>

    </motion.div>
  );
}

