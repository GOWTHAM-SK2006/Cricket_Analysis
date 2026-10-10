"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Trophy,
  Target,
  Flame,
  Zap,
  ChevronRight,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Crown,
  Sparkles,
  Award,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CricketLoader from "@/components/CricketLoader";

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
  return num <= 10 ? Math.round(num * 10) : Math.round(num);
};

const getPlayerImage = (player: Player) => {
  if ((player as any).imageUrl) return (player as any).imageUrl;
  if ((player as any).photoUrl) return (player as any).photoUrl;
  if ((player as any).photo) return (player as any).photo;
  const name = player.name || "Player";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=181B27&color=D4AF37&font-size=0.45&bold=true`;
};

const getRoleEmoji = (roleStr: string) => {
  const r = (roleStr || "").toLowerCase();
  if (r.includes("batsman") || r.includes("batter")) return "🏏";
  if (r.includes("bowler")) return "🔴";
  if (
    r.includes("wicketkeeper") ||
    r.includes("wicket-keeper") ||
    r.includes("wicket keeper") ||
    r.includes("keeper")
  )
    return "🧤";
  if (
    r.includes("all-rounder") ||
    r.includes("all rounder") ||
    r.includes("allrounder")
  )
    return "⚡";
  return "🏏";
};

const getRankDelta = (index: number) => {
  if (index === 0) return { dir: "up", val: 4 };
  if (index === 1) return { dir: "down", val: 1 };
  return { dir: "down", val: 2 };
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
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

export default function LeaderboardPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricTab, setMetricTab] = useState<"cpi" | "ppi" | "mpi">("cpi");

  useEffect(() => {
    api
      .get("/players")
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
    if (ppi > 0 && mpi > 0) cpi = Math.round(ppi * 0.4 + mpi * 0.6);
    else if (ppi > 0) cpi = ppi;
    else if (mpi > 0) cpi = mpi;
    return { cpi, ppi, mpi };
  };

  const sortedPlayers = [...players].sort(
    (a, b) => getPlayerScores(b)[metricTab] - getPlayerScores(a)[metricTab]
  );

  if (loading) {
    return (
      <CricketLoader
        message="Loading Rankings..."
        subtext="Leaderboard Rankings"
      />
    );
  }

  const topThree = sortedPlayers.slice(0, 3);
  const totalPlayers = sortedPlayers.length;
  const avgCpi =
    totalPlayers > 0
      ? Math.round(
          sortedPlayers.reduce((acc, p) => acc + getPlayerScores(p).cpi, 0) /
            totalPlayers
        )
      : 0;
  const highestCpi =
    sortedPlayers.length > 0 ? getPlayerScores(sortedPlayers[0]).cpi : 0;
  const maxScore =
    sortedPlayers.length > 0
      ? Math.max(...sortedPlayers.map((p) => getPlayerScores(p)[metricTab]))
      : 100;

  const tabs = [
    { id: "cpi", label: "CPI", icon: Zap, sub: "Overall" },
    { id: "ppi", label: "PPI", icon: Target, sub: "Practice" },
    { id: "mpi", label: "MPI", icon: Flame, sub: "Match" },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative space-y-6 sm:space-y-7 pb-20 max-w-xl sm:max-w-2xl mx-auto px-3 sm:px-6 select-none"
    >
      {/* Ambient Radial Luxury Lighting */}
      <div className="absolute -top-16 -right-16 w-72 h-72 bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-[radial-gradient(circle,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* ── 1. COMPACT HERO HEADER ── */}
      <motion.div variants={itemVariants} className="text-center pt-2 pb-1 space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#F5BA4E] shadow-sm">
          <Trophy className="w-3.5 h-3.5 stroke-[2.5] text-[#D4AF37]" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            SQUAD RANKINGS
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-none">
          LEADER
          <span className="bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent">
            BOARD
          </span>
        </h1>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#D4AF37] animate-pulse" />
          <span>Top performers based on performance index</span>
        </p>
      </motion.div>

      {/* ── 2. SLEEK METRIC TAB SWITCHER ── */}
      <motion.div
        variants={itemVariants}
        className="bg-[#0E1017] p-1.5 rounded-2xl border border-white/10 grid grid-cols-3 gap-1.5 shadow-inner backdrop-blur-md"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = metricTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMetricTab(tab.id as any)}
              className={`relative py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer z-10 ${
                isActive
                  ? "text-[#090A0E] font-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] rounded-xl shadow-lg shadow-[#D4AF37]/25 border border-[#D4AF37]/50"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <Icon
                className={`w-4 h-4 stroke-[2.5] relative z-10 transition-transform ${
                  isActive ? "text-[#090A0E] scale-110" : "text-zinc-400"
                }`}
              />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* ── 3. SLEEK & GLORIOUS PODIUM DISPLAY ── */}
      {topThree.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-3 sm:gap-4 items-end pt-3 pb-2"
        >
          {/* RANK 2 — Silver */}
          {topThree[1] ? (
            <motion.div
              whileHover={{ y: -4, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/players?id=${topThree[1].id}`)}
              className="relative rounded-3xl bg-gradient-to-b from-[#181B27]/95 via-[#12141D]/95 to-[#0E1017] border border-slate-400/40 hover:border-slate-300 p-4 sm:p-4.5 text-center cursor-pointer flex flex-col items-center justify-between min-h-[185px] shadow-lg hover:shadow-xl hover:shadow-slate-400/10 transition-all group overflow-hidden"
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-slate-300/15 border border-slate-300/30 text-slate-300 text-[8.5px] font-black uppercase tracking-wider">
                2ND
              </div>

              <div className="pt-4 flex flex-col items-center gap-2 w-full">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-[#1B1E2C] ring-2 ring-slate-400/60 overflow-hidden shadow-md flex items-center justify-center">
                    <img
                      src={getPlayerImage(topThree[1])}
                      alt={topThree[1].name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#090A0E] border border-slate-400/60 rounded-full flex items-center justify-center text-[10px] z-10 shadow-xs">
                    {getRoleEmoji(topThree[1].role)}
                  </div>
                </div>

                <div className="w-full truncate px-0.5">
                  <p className="text-xs sm:text-sm font-black text-white truncate leading-tight group-hover:text-slate-200 transition-colors">
                    {topThree[1].name}
                  </p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase truncate mt-0.5">
                    {topThree[1].role}
                  </p>
                </div>
              </div>

              <div className="w-full bg-[#0E1017] py-1.5 px-2 rounded-xl border border-white/10 mt-2">
                <span className="text-[8px] font-bold text-zinc-500 block uppercase leading-none">
                  Score
                </span>
                <span className="text-base font-black text-white font-mono block mt-0.5 leading-none">
                  {getPlayerScores(topThree[1])[metricTab] || "0"}
                </span>
              </div>
            </motion.div>
          ) : (
            <div />
          )}

          {/* RANK 1 — Gold Champion */}
          {topThree[0] && (
            <motion.div
              whileHover={{ y: -6, scale: 1.025 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/players?id=${topThree[0].id}`)}
              className="relative rounded-3xl bg-gradient-to-b from-[#221F14] via-[#161512] to-[#0E1017] border-2 border-[#D4AF37] p-4 sm:p-5 text-center cursor-pointer flex flex-col items-center justify-between min-h-[210px] shadow-2xl shadow-[#D4AF37]/20 transition-all group z-10 overflow-hidden"
            >
              {/* Champion Crown Badge */}
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-b-xl bg-gradient-to-r from-[#F5BA4E] to-[#D4AF37] text-[#090A0E] font-black text-[9px] uppercase tracking-wider shadow-md shadow-[#D4AF37]/40 flex items-center gap-1 z-20">
                <Crown className="w-3 h-3 stroke-[3]" />
                <span>1ST</span>
              </div>

              {/* Ambient Gold Flare */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[radial-gradient(circle,rgba(212,175,55,0.25)_0%,transparent_70%)] pointer-events-none" />

              <div className="pt-4 flex flex-col items-center gap-2 w-full relative z-10">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-[#1B1E2C] ring-4 ring-[#D4AF37] shadow-xl shadow-[#D4AF37]/35 overflow-hidden flex items-center justify-center">
                    <img
                      src={getPlayerImage(topThree[0])}
                      alt={topThree[0].name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#090A0E] border border-[#D4AF37] rounded-full flex items-center justify-center text-[10px] z-10 shadow-xs">
                    {getRoleEmoji(topThree[0].role)}
                  </div>
                </div>

                <div className="w-full truncate px-0.5">
                  <p className="text-sm font-black text-white truncate leading-tight tracking-tight group-hover:text-[#F5BA4E] transition-colors">
                    {topThree[0].name}
                  </p>
                  <p className="text-[9px] font-extrabold text-[#D4AF37] uppercase truncate mt-0.5">
                    {topThree[0].role}
                  </p>
                </div>
              </div>

              <div className="w-full bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] py-2 px-2.5 rounded-2xl text-[#090A0E] shadow-lg shadow-[#D4AF37]/30 mt-2 relative z-10">
                <span className="text-[8px] font-black uppercase text-[#090A0E]/80 block leading-none">
                  Score
                </span>
                <span className="text-xl font-black font-mono block mt-1 leading-none drop-shadow-xs">
                  {getPlayerScores(topThree[0])[metricTab] || "0"}
                </span>
              </div>
            </motion.div>
          )}

          {/* RANK 3 — Bronze */}
          {topThree[2] ? (
            <motion.div
              whileHover={{ y: -4, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/players?id=${topThree[2].id}`)}
              className="relative rounded-3xl bg-gradient-to-b from-[#1C1714]/95 via-[#12141D]/95 to-[#0E1017] border border-amber-600/40 hover:border-amber-500 p-4 sm:p-4.5 text-center cursor-pointer flex flex-col items-center justify-between min-h-[185px] shadow-lg hover:shadow-xl hover:shadow-amber-600/10 transition-all group overflow-hidden"
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-600/15 border border-amber-600/30 text-amber-300 text-[8.5px] font-black uppercase tracking-wider">
                3RD
              </div>

              <div className="pt-4 flex flex-col items-center gap-2 w-full">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-[#1B1E2C] ring-2 ring-amber-600/60 overflow-hidden shadow-md flex items-center justify-center">
                    <img
                      src={getPlayerImage(topThree[2])}
                      alt={topThree[2].name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#090A0E] border border-amber-600/60 rounded-full flex items-center justify-center text-[10px] z-10 shadow-xs">
                    {getRoleEmoji(topThree[2].role)}
                  </div>
                </div>

                <div className="w-full truncate px-0.5">
                  <p className="text-xs sm:text-sm font-black text-white truncate leading-tight group-hover:text-amber-300 transition-colors">
                    {topThree[2].name}
                  </p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase truncate mt-0.5">
                    {topThree[2].role}
                  </p>
                </div>
              </div>

              <div className="w-full bg-[#0E1017] py-1.5 px-2 rounded-xl border border-white/10 mt-2">
                <span className="text-[8px] font-bold text-zinc-500 block uppercase leading-none">
                  Score
                </span>
                <span className="text-base font-black text-[#F5BA4E] font-mono block mt-0.5 leading-none">
                  {getPlayerScores(topThree[2])[metricTab] || "0"}
                </span>
              </div>
            </motion.div>
          ) : (
            <div />
          )}
        </motion.div>
      )}

      {/* ── 4. FULL SQUAD RANKINGS TABLE CARD ── */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-b from-[#181B27]/95 to-[#12141D]/95 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl"
      >
        <div className="px-4 sm:px-5 py-4 bg-[#0E1017]/90 border-b border-white/8 flex items-center justify-between">
          <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span>Full Squad Rankings</span>
          </span>
          <span className="text-[10px] font-mono font-bold text-zinc-400 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
            {sortedPlayers.length} PLAYERS
          </span>
        </div>

        <div className="divide-y divide-white/5">
          <AnimatePresence mode="wait">
            {sortedPlayers.map((player, index) => {
              const scores = getPlayerScores(player);
              const scoreVal = scores[metricTab];
              const rank = index + 1;
              const delta = getRankDelta(index);
              const barPct =
                maxScore > 0 ? Math.min((scoreVal / maxScore) * 100, 100) : 0;

              return (
                <motion.div
                  key={`${player.id}-${metricTab}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  onClick={() => router.push(`/players?id=${player.id}`)}
                  className="px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  {/* Left: Rank + Avatar + Name */}
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-7 h-7 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 ${
                        rank === 1
                          ? "bg-gradient-to-r from-[#F5BA4E] to-[#D4AF37] text-[#090A0E] shadow-md shadow-[#D4AF37]/30 ring-1 ring-[#D4AF37]/50"
                          : rank === 2
                          ? "bg-slate-300 text-slate-950 ring-1 ring-slate-400/50"
                          : rank === 3
                          ? "bg-amber-600 text-white ring-1 ring-amber-500/50"
                          : "bg-[#0E1017] border border-white/10 text-zinc-400"
                      }`}
                    >
                      #{rank}
                    </div>

                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border ${
                          rank === 1
                            ? "bg-[#1B1E2C] border-[#D4AF37]/60 ring-2 ring-[#D4AF37]/30"
                            : rank === 2
                            ? "bg-[#1B1E2C] border-slate-400/60"
                            : rank === 3
                            ? "bg-[#1B1E2C] border-amber-600/60"
                            : "bg-[#0E1017] border-white/10"
                        }`}
                      >
                        <img
                          src={getPlayerImage(player)}
                          alt={player.name}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 text-[9px] shadow-xs">
                        {getRoleEmoji(player.role)}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between pr-2">
                        <span className="text-sm font-black text-white truncate group-hover:text-[#F5BA4E] transition-colors leading-tight">
                          {player.name}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase ml-2 shrink-0">
                          {player.role}
                        </span>
                      </div>
                      {/* Slim Animated Bar */}
                      <div className="w-full h-1.5 bg-[#0E1017] rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barPct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            rank === 1
                              ? "bg-gradient-to-r from-[#F5BA4E] to-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.5)]"
                              : rank === 2
                              ? "bg-gradient-to-r from-slate-400 to-slate-200"
                              : rank === 3
                              ? "bg-gradient-to-r from-amber-500 to-amber-300"
                              : "bg-gradient-to-r from-zinc-600 to-zinc-400"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Score & Arrow */}
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0 ml-3">
                    <div className="hidden sm:flex flex-col items-end">
                      <span
                        className={`text-[10px] font-black flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
                          delta.dir === "up"
                            ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                            : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                        }`}
                      >
                        {delta.dir === "up" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {delta.val}
                      </span>
                    </div>

                    <div className="text-right min-w-[44px]">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase block leading-none">
                        Score
                      </span>
                      <span
                        className={`text-base sm:text-lg font-black font-mono leading-tight block mt-0.5 ${
                          rank === 1
                            ? "text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                            : "text-white"
                        }`}
                      >
                        {scoreVal > 0 ? scoreVal : "0"}
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── 5. STATS SUMMARY CARDS ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-b from-[#181B27]/90 to-[#12141D]/90 border border-white/10 hover:border-blue-500/40 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-md transition-all duration-300 group">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-base sm:text-lg font-black text-white font-mono leading-none">
              {totalPlayers}
            </p>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1">
              Players
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#181B27]/90 to-[#12141D]/90 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-md transition-all duration-300 group">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-base sm:text-lg font-black text-white font-mono leading-none">
              {avgCpi}
            </p>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1">
              Avg CPI
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#181B27]/90 to-[#12141D]/90 border border-white/10 hover:border-[#D4AF37]/40 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-md transition-all duration-300 group">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <p className="text-base sm:text-lg font-black text-[#D4AF37] font-mono leading-none drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
              {highestCpi}
            </p>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1">
              Max CPI
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer Copyright */}
      <div className="text-center pt-2 pb-2">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          © 2026 CPI – Cricket Performance Index. All rights reserved.
        </p>
      </div>
    </motion.div>
  );
}
