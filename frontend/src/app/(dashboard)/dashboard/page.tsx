"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Loader2,
  Plus,
  Users,
  ClipboardCheck,
  Clock,
  Target,
  Activity,
  Award,
} from "lucide-react";
import KpiCard from "@/components/KpiCard";
import PerformanceTrendChart from "@/components/PerformanceTrendChart";

interface TrendPoint {
  label: string;
  ppi: number;
  mpi: number;
  cpi: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  // Analytics states
  const [avgPpi, setAvgPpi] = useState<number | null>(null);
  const [avgMpi, setAvgMpi] = useState<number | null>(null);
  const [avgCpi, setAvgCpi] = useState<number | null>(null);
  const [chartData, setChartData] = useState<TrendPoint[]>([]);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setRole(storedRole);

    const loadDashboardData = async () => {
      try {
        // Fetch Profile
        const profileRes = await api.get("/profile");
        setUserName(profileRes.data.name);

        // Fetch Dashboard Stats
        const statsRes = await api.get("/dashboard/stats");
        const stats = statsRes.data;

        if (stats) {
          setAvgPpi(stats.avgPpi || 0);
          setAvgMpi(stats.avgMpi || 0);
          setAvgCpi(stats.avgCpi || 0);

          const pTrend = stats.practiceTrend || [];
          const mTrend = stats.matchTrend || [];
          const cTrend = stats.cpiTrend || [];

          // Map and align trend lines
          const mappedData: TrendPoint[] = cTrend.map((item: any, idx: number) => {
            const pMatch = pTrend.find((p: any) => p.label === item.label) || pTrend[idx];
            const mMatch = mTrend.find((m: any) => m.label === item.label) || mTrend[idx];
            return {
              label: item.label,
              ppi: pMatch ? pMatch.value : 0,
              mpi: mMatch ? mMatch.value : 0,
              cpi: item.value || 0,
            };
          });

          setChartData(mappedData);
        }
      } catch (err) {
        console.error("Failed to load dashboard statistics", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-wider text-xs">
          Loading Hub...
        </p>
      </div>
    );
  }

  const isPlayer = role === "player";

  // Safe formatting helpers for KPIs
  const formatKpi = (val: number | null) => {
    return val && val > 0 ? val.toFixed(1) : "N/A";
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Welcome Message */}
      <div className="space-y-1 text-center">
        <h1 className="text-zinc-500 font-black tracking-widest text-xs uppercase">
          WELCOME BACK
        </h1>
        <p className="text-3xl font-black text-white uppercase tracking-tight leading-none">
          {userName || (isPlayer ? "PLAYER" : "COACH")}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Average PPI"
          value={formatKpi(avgPpi)}
          subtitle="Practice performance rating"
          icon={Target}
          glowColor="amber"
        />
        <KpiCard
          title="Average MPI"
          value={formatKpi(avgMpi)}
          subtitle="Match performance rating"
          icon={Activity}
          glowColor="amber"
        />
        <KpiCard
          title="Average CPI"
          value={formatKpi(avgCpi)}
          subtitle="Overall cricket performance"
          icon={Award}
          glowColor="orange"
        />
      </div>

      {/* Trend Analysis Graph */}
      <PerformanceTrendChart data={chartData} />

      {/* Quick Action Navigation */}
      <div className="border border-zinc-900 rounded-3xl p-6 bg-zinc-950/40 space-y-4">
        <p className="text-zinc-400 font-black tracking-wide text-sm uppercase text-center">
          What would you like to do?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isPlayer ? (
            <>
              {/* Coach Action Paths */}
              <button
                onClick={() => router.push("/players?add=true")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-5 px-6 text-lg font-black flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-orange-400 shadow-lg cursor-pointer uppercase"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                ADD PLAYER
              </button>

              <button
                onClick={() => router.push("/players")}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl py-5 px-6 text-lg font-black flex items-center justify-center gap-3 transition-all active:scale-[0.98] border-2 border-zinc-805 shadow-md cursor-pointer uppercase"
              >
                <Users className="w-5 h-5" />
                VIEW PLAYERS
              </button>
            </>
          ) : (
            <>
              {/* Player Action Paths */}
              <button
                onClick={() => router.push(`/players?selfAssess=true`)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-5 px-6 text-lg font-black flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-orange-400 shadow-lg cursor-pointer uppercase"
              >
                <ClipboardCheck className="w-5 h-5 stroke-[3]" />
                SELF ASSESSMENT
              </button>

              <button
                onClick={() => router.push("/history")}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl py-5 px-6 text-lg font-black flex items-center justify-center gap-3 transition-all active:scale-[0.98] border-2 border-zinc-805 shadow-md cursor-pointer uppercase"
              >
                <Clock className="w-5 h-5" />
                VIEW MY HISTORY
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
