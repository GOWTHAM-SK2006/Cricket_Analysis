"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Loader2,
  Plus,
  Users,
  ClipboardCheck,
  Target,
  Activity,
  Zap,
  ChevronRight,
  UserCheck
} from "lucide-react";

interface Player {
  id: number;
  name: string;
  role: string;
  ppiScore: number | null;
  mpiScore: number | null;
}

interface DashboardStats {
  totalPlayers: number;
  playersAssessedToday: number;
  practicesToday: number;
  matchesToday: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  
  // Dashboard stats (Today's Snapshot)
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Player Selection list
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedPlayerData, setSelectedPlayerData] = useState<Player | null>(null);
  const [lastAssessmentDate, setLastAssessmentDate] = useState<string>("No assessments logged");
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setRole(storedRole);

    const loadDashboardData = async () => {
      try {
        // Load profile & general stats
        const [profileRes, statsRes, playersRes] = await Promise.all([
          api.get("/profile"),
          api.get("/dashboard/stats"),
          api.get("/players")
        ]);

        setUserName(profileRes.data.name);
        setStats(statsRes.data);
        
        const playerList = playersRes.data || [];
        setPlayers(playerList);
        
        if (playerList.length > 0) {
          setSelectedPlayerId(playerList[0].id);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Fetch player details and history to find last assessment date
  useEffect(() => {
    if (!selectedPlayerId) {
      setSelectedPlayerData(null);
      setLastAssessmentDate("No assessments logged");
      return;
    }

    const loadPlayerHistory = async () => {
      setLoadingHistory(true);
      try {
        const found = players.find(p => p.id === selectedPlayerId);
        if (found) setSelectedPlayerData(found);

        const [pracRes, matchRes] = await Promise.all([
          api.get(`/practice/player/${selectedPlayerId}`).catch(() => ({ data: [] })),
          api.get(`/matches/player/${selectedPlayerId}`).catch(() => ({ data: [] }))
        ]);
        
        const pracLogs = pracRes.data || [];
        const matchLogs = matchRes.data || [];

        let lastDate = "No assessments logged";
        const dates = [
          ...pracLogs.map((p: any) => p.createdAt || p.date),
          ...matchLogs.map((m: any) => m.createdAt || m.date)
        ].filter(Boolean);

        if (dates.length > 0) {
          const sortedDates = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          lastDate = new Date(sortedDates[0]).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          });
        }
        setLastAssessmentDate(lastDate);
      } catch (err) {
        console.error("Failed to load player history logs", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadPlayerHistory();
  }, [selectedPlayerId, players]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-zinc-550 font-bold uppercase tracking-wider text-xs">
          Loading Coaching Hub...
        </p>
      </div>
    );
  }

  const isPlayer = role === "player";

  // Today's Snapshot details
  const totalPlayers = stats?.totalPlayers || players.length || 0;
  const playersAssessedToday = stats?.playersAssessedToday || 0;
  const practicesToday = stats?.practicesToday || 0;
  const matchesToday = stats?.matchesToday || 0;

  // Selected Player details
  const currentPpi = selectedPlayerData?.ppiScore && selectedPlayerData.ppiScore > 0 ? selectedPlayerData.ppiScore.toFixed(1) : "N/A";
  const currentMpi = selectedPlayerData?.mpiScore && selectedPlayerData.mpiScore > 0 ? selectedPlayerData.mpiScore.toFixed(1) : "N/A";

  let currentCpi = "N/A";
  if (selectedPlayerData?.ppiScore && selectedPlayerData?.mpiScore && selectedPlayerData.ppiScore > 0 && selectedPlayerData.mpiScore > 0) {
    currentCpi = ((selectedPlayerData.ppiScore + selectedPlayerData.mpiScore) / 2).toFixed(1);
  } else if (selectedPlayerData?.ppiScore && selectedPlayerData.ppiScore > 0) {
    currentCpi = selectedPlayerData.ppiScore.toFixed(1);
  } else if (selectedPlayerData?.mpiScore && selectedPlayerData.mpiScore > 0) {
    currentCpi = selectedPlayerData.mpiScore.toFixed(1);
  }

  const formatScoreValue = (val: number) => {
    if (val <= 10) {
      return Math.round(val * 10);
    }
    return Math.round(val);
  };

  return (
    <div className="space-y-8 pb-16 select-none max-w-lg mx-auto text-left">
      {/* Welcome Header */}
      <div className="space-y-1 py-2 border-b border-zinc-900 flex justify-between items-center">
        <div>
          <h1 className="text-zinc-500 font-black tracking-widest text-[10px] uppercase">
            COACHING HUB
          </h1>
          <p className="text-2xl font-black text-white uppercase tracking-tight leading-none">
            {userName || "COACH"}
          </p>
        </div>
        <span className="text-[10px] font-bold bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full border border-orange-500/20 uppercase tracking-widest">
          {role || "Coach"}
        </span>
      </div>

      {/* SECTION 1: TODAY'S SNAPSHOT */}
      <div className="space-y-3">
        <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-orange-500" />
          Today's Snapshot
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Total Squad</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-black text-white">{totalPlayers}</span>
              <Users className="w-5 h-5 text-zinc-650" />
            </div>
          </div>
          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Assessed Today</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-black text-orange-500">{playersAssessedToday}</span>
              <ClipboardCheck className="w-5 h-5 text-orange-600/50" />
            </div>
          </div>
          <div className="bg-zinc-955 bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Nets / Practices</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-black text-white">{practicesToday}</span>
              <Target className="w-5 h-5 text-zinc-650" />
            </div>
          </div>
          <div className="bg-zinc-955 bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Matches Scored</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-black text-white">{matchesToday}</span>
              <Activity className="w-5 h-5 text-zinc-650" />
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="space-y-3">
        <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-orange-500" />
          Field Quick Actions
        </h3>
        <div className="space-y-3">
          {!isPlayer ? (
            <>
              <button
                onClick={() => router.push("/players?action=practice")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-4.5 px-5 text-sm font-black flex items-center justify-between transition-all active:scale-[0.99] border border-orange-400 shadow-lg cursor-pointer uppercase tracking-tight"
              >
                <span className="flex items-center gap-3">
                  <Target className="w-5 h-5 stroke-[3]" />
                  Start Practice Assessment
                </span>
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </button>

              <button
                onClick={() => router.push("/players?action=match")}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl py-4.5 px-5 text-sm font-black flex items-center justify-between transition-all active:scale-[0.99] border border-zinc-850 shadow-md cursor-pointer uppercase tracking-tight"
              >
                <span className="flex items-center gap-3">
                  <Activity className="w-5 h-5 stroke-[2]" />
                  Start Match Assessment
                </span>
                <ChevronRight className="w-5 h-5 stroke-[2]" />
              </button>

              <button
                onClick={() => router.push("/players?add=true")}
                className="w-full bg-zinc-950 border-2 border-dashed border-zinc-800 hover:border-zinc-700 text-zinc-400 rounded-2xl py-4 px-5 text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer uppercase"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Add Player to Squad
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/players?selfAssess=true")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-4.5 px-5 text-sm font-black flex items-center justify-between transition-all active:scale-[0.99] border border-orange-400 shadow-lg cursor-pointer uppercase"
              >
                <span className="flex items-center gap-3">
                  <ClipboardCheck className="w-5 h-5 stroke-[3]" />
                  Log Self Assessment
                </span>
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* PLAYER PERFORMANCE SNAPSHOT SECTION */}
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <label className="text-xs font-black text-orange-500 tracking-widest uppercase flex items-center gap-2">
            <Users className="w-4 h-4" />
            Player Performance Snapshot
          </label>
          <div className="relative">
            <select
              value={selectedPlayerId || ""}
              onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
              className="w-full h-14 bg-zinc-950 border border-zinc-900 rounded-2xl px-4 text-sm font-black text-white focus:outline-none focus:border-orange-500 cursor-pointer appearance-none uppercase"
            >
              <option value="" disabled>Select Player ▼</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role.split(" (")[0]})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-550">
              <span className="text-xs font-black">▼</span>
            </div>
          </div>
        </div>

        {selectedPlayerData ? (
          <div className="border border-zinc-900 rounded-3xl p-6 bg-zinc-950/40 space-y-6">
            {/* Player details header */}
            <div className="flex justify-between items-start border-b border-zinc-900/80 pb-4 text-left">
              <div>
                <h4 className="text-[9px] font-black text-zinc-500 tracking-widest uppercase">COACH SELECTION</h4>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none mt-1">
                  {selectedPlayerData.name}
                </h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
                  {selectedPlayerData.role}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-black text-zinc-550 tracking-widest block uppercase">LAST ASSESSMENT</span>
                <span className="text-xs font-bold text-zinc-300">
                  {loadingHistory ? "..." : lastAssessmentDate}
                </span>
              </div>
            </div>

            {/* Main Score Snapshots */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-900">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-wider mb-1">
                  Current PPI
                </p>
                <p className="text-xl font-black text-white font-mono">
                  {currentPpi !== "N/A" ? formatScoreValue(Number(currentPpi)) : "N/A"}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-900">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-wider mb-1">
                  Current MPI
                </p>
                <p className="text-xl font-black text-white font-mono">
                  {currentMpi !== "N/A" ? formatScoreValue(Number(currentMpi)) : "N/A"}
                </p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-2xl">
                <p className="text-[8px] font-black text-orange-400 uppercase tracking-wider mb-1">
                  Overall CPI
                </p>
                <p className="text-xl font-black text-orange-400 font-mono">
                  {currentCpi !== "N/A" ? formatScoreValue(Number(currentCpi)) : "N/A"}
                </p>
              </div>
            </div>

            {/* View Full Player Profile Button */}
            <button
              onClick={() => router.push(`/players?id=${selectedPlayerData.id}`)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-4 px-5 text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[0.99] border border-orange-400 shadow-md cursor-pointer uppercase"
            >
              <UserCheck className="w-5 h-5 stroke-[2.5]" />
              View Full Player Profile
            </button>
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-600 font-bold uppercase text-xs border border-dashed border-zinc-900 rounded-3xl">
            No players available in the squad. Add a player first!
          </div>
        )}
      </div>
    </div>
  );
}
