"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Target, Activity, Trophy, TrendingUp, Calendar, Loader2, Award } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";
import { api } from "@/lib/api";

interface Stats {
  totalTeams: number;
  totalPlayers: number;
  totalPracticeSessions: number;
  totalMatches: number;
  avgPpi: number;
  avgMpi: number;
  avgCpi: number;
  teamPerformance: { teamName: string; cpi: number }[];
  cpiTrend: { label: string; value: number }[];
  practiceTrend: { label: string; value: number }[];
  matchTrend: { label: string; value: number }[];
  activityFeed: { type: string; title: string; description: string; timestamp: string }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats");
        setStats(response.data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-zinc-400">Loading your performance metrics...</p>
      </div>
    );
  }

  const data = stats || {
    totalTeams: 0,
    totalPlayers: 0,
    totalPracticeSessions: 0,
    totalMatches: 0,
    avgPpi: 0,
    avgMpi: 0,
    avgCpi: 0,
    teamPerformance: [],
    cpiTrend: [],
    practiceTrend: [],
    matchTrend: [],
    activityFeed: []
  };

  // Helper for trend display
  const getTrendText = (val: number, label: string) => {
    return val > 0 ? `${val.toFixed(1)} average` : "No assessments";
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Welcome to your team's performance hub.</p>
      </div>

      {/* 7 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Teams" value={data.totalTeams} icon={Users} trend="Active teams" color="from-blue-500/20 to-indigo-500/20" iconColor="text-blue-500" />
        <StatCard title="Total Players" value={data.totalPlayers} icon={Award} trend="Registered squad" color="from-purple-500/20 to-pink-500/20" iconColor="text-purple-500" />
        <StatCard title="Practice Sessions" value={data.totalPracticeSessions} icon={Target} trend="PPI sessions recorded" color="from-orange-500/20 to-red-500/20" iconColor="text-orange-500" />
        <StatCard title="Total Matches" value={data.totalMatches} icon={Trophy} trend="MPI matches assessed" color="from-emerald-500/20 to-teal-500/20" iconColor="text-emerald-500" />
        <StatCard title="Average PPI" value={data.avgPpi.toFixed(1)} icon={Activity} trend={getTrendText(data.avgPpi, "PPI")} color="from-amber-500/20 to-orange-500/20" iconColor="text-amber-500" />
        <StatCard title="Average MPI" value={data.avgMpi.toFixed(1)} icon={TrendingUp} trend={getTrendText(data.avgMpi, "MPI")} color="from-emerald-500/20 to-green-500/20" iconColor="text-emerald-400" />
        <StatCard title="Average CPI" value={data.avgCpi.toFixed(1)} icon={Calendar} trend="Combined Performance" color="from-sky-500/20 to-blue-500/20" iconColor="text-sky-400" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CPI Trend */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-400" />
            CPI Trend
          </h3>
          <div className="h-[260px] flex items-center justify-center">
            {data.cpiTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.cpiTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCpi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="value" name="CPI" stroke="#38bdf8" fillOpacity={1} fill="url(#colorCpi)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-500 text-sm">Assess practice/matches to see CPI trend.</div>
            )}
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Team Performance
          </h3>
          <div className="h-[260px] flex items-center justify-center">
            {data.teamPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.teamPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="teamName" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="cpi" name="CPI Score" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-500 text-sm">Create teams and assess players to view performance.</div>
            )}
          </div>
        </div>

        {/* Practice Trend */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            Practice Trend (PPI)
          </h3>
          <div className="h-[260px] flex items-center justify-center">
            {data.practiceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.practiceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPpi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="value" name="PPI" stroke="#f97316" fillOpacity={1} fill="url(#colorPpi)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-500 text-sm">No practice sessions logged yet.</div>
            )}
          </div>
        </div>

        {/* Match Trend */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-500" />
            Match Trend (MPI)
          </h3>
          <div className="h-[260px] flex items-center justify-center">
            {data.matchTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.matchTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMpi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="value" name="MPI" stroke="#10b981" fillOpacity={1} fill="url(#colorMpi)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-500 text-sm">No match assessments logged yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
        <h3 className="text-xl font-medium mb-6">Activity Feed</h3>
        <div className="space-y-6">
          {data.activityFeed.length > 0 ? (
            data.activityFeed.map((activity, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={i} 
                className="flex gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  activity.type === "PLAYER_ADDED" ? "bg-purple-500/10 text-purple-400" :
                  activity.type === "TEAM_CREATED" ? "bg-blue-500/10 text-blue-400" :
                  activity.type === "PRACTICE_COMPLETED" ? "bg-orange-500/10 text-orange-400" :
                  "bg-emerald-500/10 text-emerald-400"
                }`}>
                  {activity.type === "PLAYER_ADDED" ? <Award className="w-5 h-5" /> :
                   activity.type === "TEAM_CREATED" ? <Users className="w-5 h-5" /> :
                   activity.type === "PRACTICE_COMPLETED" ? <Target className="w-5 h-5" /> :
                   <Trophy className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">{activity.title}</p>
                  <p className="text-sm text-zinc-400 mt-0.5">{activity.description}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {new Date(activity.timestamp).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-zinc-500 text-sm py-4">No recent activity found. Set up your team and assess players to see updates here.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color, iconColor }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${color} border border-white/10 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-zinc-400 font-medium text-sm tracking-wide uppercase">{title}</h3>
        <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center border border-white/5">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <div className="flex items-end justify-between relative z-10">
        <span className="text-4xl font-bold tracking-tight text-white">{value}</span>
        <span className="text-xs text-zinc-400 font-medium mb-1 bg-black/40 px-2.5 py-1 rounded-full border border-white/5">{trend}</span>
      </div>
    </motion.div>
  );
}
