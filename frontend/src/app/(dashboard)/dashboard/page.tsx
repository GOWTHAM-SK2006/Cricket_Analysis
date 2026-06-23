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
  Award
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
  
  // Dashboard stats
  const [stats, setStats] = useState<DashboardStats | null>(null);

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

  useEffect(() => {
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
      <div className="text-left">
        <h2 className="text-[10px] font-black tracking-widest text-zinc-550 uppercase">
          WELCOME BACK COACH
        </h2>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight mt-1 leading-none">
          {coachName || "GOWTHAM"}
        </h1>
      </div>

      {/* 2. TODAY'S SNAPSHOT */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">
          TODAY'S SNAPSHOT
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 text-left space-y-1">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">Total Players</span>
            <span className="text-3xl font-black text-white block leading-none">{stats?.totalPlayers || 0}</span>
          </div>
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 text-left space-y-1">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">Average CPI</span>
            <span className="text-3xl font-black text-orange-500 block leading-none">
              {stats?.avgCpi ? formatScoreValue(stats.avgCpi) : "N/A"}
            </span>
          </div>
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 text-left space-y-1">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">Average PPI</span>
            <span className="text-3xl font-black text-white block leading-none">
              {stats?.avgPpi ? formatScoreValue(stats.avgPpi) : "N/A"}
            </span>
          </div>
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 text-left space-y-1">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">Average MPI</span>
            <span className="text-3xl font-black text-white block leading-none">
              {stats?.avgMpi ? formatScoreValue(stats.avgMpi) : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTIONS */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">
          QUICK ACTIONS
        </h3>
        <div className="space-y-3">
          <button
            onClick={() => router.push("/players?action=practice")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-4.5 px-5 text-base font-black flex items-center justify-between transition-all active:scale-[0.99] border border-orange-400 shadow-lg cursor-pointer uppercase tracking-tight"
          >
            <span className="flex items-center gap-3">
              <Target className="w-5.5 h-5.5 stroke-[3]" />
              Start Practice Assessment
            </span>
            <ChevronRight className="w-5.5 h-5.5 stroke-[3]" />
          </button>

          <button
            onClick={() => router.push("/players?action=match")}
            className="w-full bg-zinc-900 hover:bg-zinc-850 text-white rounded-2xl py-4.5 px-5 text-base font-black flex items-center justify-between transition-all active:scale-[0.99] border border-zinc-850 shadow-md cursor-pointer uppercase tracking-tight"
          >
            <span className="flex items-center gap-3">
              <Activity className="w-5.5 h-5.5 stroke-[2]" />
              Start Match Assessment
            </span>
            <ChevronRight className="w-5.5 h-5.5 stroke-[2]" />
          </button>

          <button
            onClick={() => router.push("/players?add=true")}
            className="w-full bg-zinc-950 border border-zinc-900 hover:border-zinc-850 text-white rounded-2xl py-4 px-5 text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer uppercase"
          >
            <Plus className="w-4.5 h-4.5 stroke-[3] text-orange-500" />
            Add Player
          </button>
        </div>
      </div>

      {/* 4. PLAYERS NEEDING ATTENTION */}
      <div className="space-y-3 text-left">
        <h3 className="text-[10px] font-black tracking-widest text-zinc-500 uppercase flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          PLAYERS NEEDING ATTENTION
        </h3>
        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl divide-y divide-zinc-900/60 overflow-hidden">
          {stats?.playersNeedingAttention && stats.playersNeedingAttention.length > 0 ? (
            stats.playersNeedingAttention.map((p, idx) => {
              const lastDate = lastAssessmentDates[p.name.toLowerCase()] || "No assessments";
              return (
                <div
                  key={idx}
                  onClick={() => navigateToPlayer(p.name)}
                  className="p-5 flex justify-between items-center hover:bg-zinc-900/40 cursor-pointer transition-colors active:bg-zinc-900/60"
                >
                  <div className="space-y-0.5">
                    <span className="text-base font-black text-white uppercase block">{p.name}</span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide block">
                      Last Assessed: {lastDate}
                    </span>
                  </div>
                  <span className="text-sm font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-xl uppercase tracking-wider">
                    CPI {p.cpi > 0 ? formatScoreValue(p.cpi) : "N/A"}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-5 text-center text-xs text-zinc-650 font-bold uppercase">
              No players currently needing attention.
            </div>
          )}
        </div>
      </div>

      {/* 5. TOP PERFORMERS */}
      <div className="space-y-3 text-left">
        <h3 className="text-[10px] font-black tracking-widest text-zinc-500 uppercase flex items-center gap-2">
          <Award className="w-3.5 h-3.5 text-orange-500" />
          TOP PERFORMERS
        </h3>
        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl divide-y divide-zinc-900/60 overflow-hidden">
          {stats?.topPerformers && stats.topPerformers.length > 0 ? (
            stats.topPerformers.map((p, idx) => {
              const lastDate = lastAssessmentDates[p.name.toLowerCase()] || "No assessments";
              return (
                <div
                  key={idx}
                  onClick={() => navigateToPlayer(p.name)}
                  className="p-5 flex justify-between items-center hover:bg-zinc-900/40 cursor-pointer transition-colors active:bg-zinc-900/60"
                >
                  <div className="space-y-0.5">
                    <span className="text-base font-black text-white uppercase block">{p.name}</span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide block">
                      Last Assessed: {lastDate}
                    </span>
                  </div>
                  <span className="text-sm font-black text-orange-400 bg-orange-500/10 px-3 py-1 rounded-xl uppercase tracking-wider">
                    CPI {p.cpi > 0 ? formatScoreValue(p.cpi) : "N/A"}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-5 text-center text-xs text-zinc-650 font-bold uppercase">
              No assessments logged yet.
            </div>
          )}
        </div>
      </div>

      {/* 6. RECENT ACTIVITY */}
      <div className="space-y-3 text-left">
        <h3 className="text-[10px] font-black tracking-widest text-zinc-500 uppercase flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-orange-500" />
          RECENT ACTIVITY
        </h3>
        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl divide-y divide-zinc-900/60 overflow-hidden">
          {stats?.recentAssessments && stats.recentAssessments.length > 0 ? (
            stats.recentAssessments.map((a, idx) => (
              <div
                key={idx}
                onClick={() => navigateToPlayer(a.playerName)}
                className="p-5 flex justify-between items-center hover:bg-zinc-900/40 cursor-pointer transition-colors active:bg-zinc-900/60"
              >
                <div className="space-y-0.5 text-left">
                  <span className="text-base font-black text-white uppercase block">{a.playerName}</span>
                  <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wide block mt-0.5">
                    {a.assessmentType === "PRACTICE" ? "Practice Assessment" : "Match Assessment"}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-850 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                  {formatActivityDate(a.date)}
                </span>
              </div>
            ))
          ) : (
            <div className="p-5 text-center text-xs text-zinc-650 font-bold uppercase">
              No recent assessment activity logged.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
