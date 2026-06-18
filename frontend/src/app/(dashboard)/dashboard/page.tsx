"use client";

import { motion } from "framer-motion";
import { Users, Target, Activity, TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { name: "Week 1", ppi: 6.2, mpi: 5.8 },
  { name: "Week 2", ppi: 6.8, mpi: 6.0 },
  { name: "Week 3", ppi: 7.4, mpi: 6.8 },
  { name: "Week 4", ppi: 8.1, mpi: 7.5 },
  { name: "Week 5", ppi: 8.5, mpi: 8.2 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-zinc-400 mt-1">Welcome to your team's performance hub.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Teams" value="3" icon={Users} trend="+1 this month" />
        <StatCard title="Total Players" value="45" icon={Target} trend="+5 this month" />
        <StatCard title="Avg PPI" value="8.5" icon={Activity} trend="+0.4 this week" />
        <StatCard title="Avg MPI" value="8.2" icon={TrendingUp} trend="+0.7 this week" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 p-6 rounded-3xl">
          <h3 className="text-lg font-medium mb-6">Performance Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPpi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMpi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="ppi" stroke="#f97316" fillOpacity={1} fill="url(#colorPpi)" />
                <Area type="monotone" dataKey="mpi" stroke="#eab308" fillOpacity={1} fill="url(#colorMpi)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col">
          <h3 className="text-lg font-medium mb-6">Recent Activity</h3>
          <div className="space-y-6 flex-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">Practice Assessed</p>
                  <p className="text-sm text-zinc-400">You scored John Doe an 8.5 in Technique.</p>
                  <p className="text-xs text-zinc-500 mt-1">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 p-6 rounded-3xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-zinc-400 font-medium">{title}</h3>
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          <Icon className="w-5 h-5 text-orange-500" />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-4xl font-bold">{value}</span>
        <span className="text-sm text-emerald-400 font-medium mb-1">{trend}</span>
      </div>
    </motion.div>
  );
}
