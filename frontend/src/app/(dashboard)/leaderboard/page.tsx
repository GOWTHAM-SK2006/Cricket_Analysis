"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Trophy, Medal, Flame, Target, Zap, ChevronRight, Award } from "lucide-react";
import { useRouter } from "next/navigation";

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
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 select-none">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-wider text-xs">Loading Leaderboard...</p>
      </div>
    );
  }

  const topThree = sortedPlayers.slice(0, 3);
  const remainingRankings = sortedPlayers.slice(3);

  return (
    <div className="space-y-6 pb-16 select-none text-left">
      
      {/* Header */}
      <div className="space-y-1 text-center">
        <div className="flex items-center justify-center gap-2 text-orange-500">
          <Trophy className="w-6 h-6 stroke-[2.5]" />
          <span className="text-xs font-black uppercase tracking-widest">SQUAD RANKINGS</span>
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">LEADERBOARD</h1>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Top performers based on performance index
        </p>
      </div>

      {/* Metric Filter Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900">
        <button
          onClick={() => setMetricTab("cpi")}
          className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            metricTab === "cpi"
              ? "bg-orange-500 text-black shadow-md"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          CPI INDEX
        </button>
        <button
          onClick={() => setMetricTab("ppi")}
          className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            metricTab === "ppi"
              ? "bg-orange-500 text-black shadow-md"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          PPI INDEX
        </button>
        <button
          onClick={() => setMetricTab("mpi")}
          className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            metricTab === "mpi"
              ? "bg-orange-500 text-black shadow-md"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          MPI INDEX
        </button>
      </div>

      {/* Podium Display (Top 3) */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-3 gap-2 items-end pt-4 pb-2">
          
          {/* Rank 2 (Silver) */}
          {topThree[1] ? (
            <div
              onClick={() => router.push(`/players?id=${topThree[1].id}`)}
              className="bg-zinc-950 border border-zinc-850 rounded-2xl p-3 text-center space-y-2 cursor-pointer hover:border-zinc-700 transition-all flex flex-col items-center justify-end h-40 relative group"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-black flex items-center justify-center absolute -top-3 shadow-md">
                2
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-black text-white uppercase truncate max-w-[90px]">{topThree[1].name}</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase truncate">{topThree[1].role}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1 text-orange-500 font-mono text-base font-black">
                {getPlayerScores(topThree[1])[metricTab] || "N/A"}
              </div>
            </div>
          ) : <div />}

          {/* Rank 1 (Gold) */}
          {topThree[0] && (
            <div
              onClick={() => router.push(`/players?id=${topThree[0].id}`)}
              className="bg-gradient-to-b from-orange-500/20 to-zinc-950 border-2 border-orange-500/60 rounded-3xl p-3.5 text-center space-y-2 cursor-pointer hover:border-orange-500 transition-all flex flex-col items-center justify-end h-48 relative shadow-xl group"
            >
              <div className="w-9 h-9 rounded-full bg-orange-500 text-black text-sm font-black flex items-center justify-center absolute -top-4 shadow-lg">
                👑
              </div>
              <div className="space-y-0.5">
                <p className="text-base font-black text-white uppercase truncate max-w-[100px]">{topThree[0].name}</p>
                <p className="text-[10px] font-bold text-orange-400 uppercase truncate">{topThree[0].role}</p>
              </div>
              <div className="bg-orange-500 text-black rounded-xl px-3.5 py-1.5 font-mono text-lg font-black shadow-md">
                {getPlayerScores(topThree[0])[metricTab] || "N/A"}
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {topThree[2] ? (
            <div
              onClick={() => router.push(`/players?id=${topThree[2].id}`)}
              className="bg-zinc-950 border border-zinc-850 rounded-2xl p-3 text-center space-y-2 cursor-pointer hover:border-zinc-700 transition-all flex flex-col items-center justify-end h-36 relative group"
            >
              <div className="w-8 h-8 rounded-full bg-amber-900/60 border border-amber-800 text-amber-500 text-xs font-black flex items-center justify-center absolute -top-3 shadow-md">
                3
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-black text-white uppercase truncate max-w-[90px]">{topThree[2].name}</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase truncate">{topThree[2].role}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1 text-orange-500 font-mono text-base font-black">
                {getPlayerScores(topThree[2])[metricTab] || "N/A"}
              </div>
            </div>
          ) : <div />}

        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase pl-1">
          FULL SQUAD RANKINGS
        </h3>

        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl divide-y divide-zinc-900/60 overflow-hidden shadow-lg">
          {sortedPlayers.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-zinc-500 uppercase">
              No player records found.
            </div>
          ) : (
            sortedPlayers.map((player, index) => {
              const scores = getPlayerScores(player);
              const scoreVal = scores[metricTab];
              const rank = index + 1;
              const initials = player.name.substring(0, 2).toUpperCase();

              return (
                <div
                  key={player.id}
                  onClick={() => router.push(`/players?id=${player.id}`)}
                  className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors cursor-pointer active:bg-zinc-900/80"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank Badge */}
                    <div className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 ${
                      rank === 1 ? "bg-orange-500 text-black" :
                      rank === 2 ? "bg-zinc-700 text-white" :
                      rank === 3 ? "bg-amber-900/70 text-amber-400" :
                      "bg-zinc-900 text-zinc-500"
                    }`}>
                      #{rank}
                    </div>

                    {/* Avatar & Details */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-black text-xs uppercase shrink-0">
                        {initials}
                      </div>
                      <div className="text-left space-y-0.5">
                        <span className="text-sm font-black text-white uppercase block leading-none">{player.name}</span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase block">{player.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score & Arrow */}
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-orange-500 font-mono bg-orange-500/10 px-3 py-1 rounded-xl border border-orange-500/20">
                      {scoreVal > 0 ? scoreVal : "N/A"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-650" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
