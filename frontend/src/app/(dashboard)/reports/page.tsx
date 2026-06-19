"use client";

import { motion } from "framer-motion";
import { FileBarChart, TrendingUp, Users, Target } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-zinc-400 mt-1">View team and player performance reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors group"
        >
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold mb-2">Performance Trends</h3>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Track PPI and MPI scores over time. Identify improvement patterns and areas needing attention.
          </p>
          <div className="flex items-center gap-2 text-orange-500 font-medium text-sm">
            Coming Soon
            <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-xs">v2.1</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors group"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold mb-2">Team Comparison</h3>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Compare squads side-by-side. Benchmark team CPI scores across age groups and seasons.
          </p>
          <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
            Coming Soon
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-xs">v2.1</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors group"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold mb-2">Player Profiles</h3>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Individual radar charts, strengths, weaknesses, and personalised coaching recommendations.
          </p>
          <div className="flex items-center gap-2 text-blue-400 font-medium text-sm">
            Coming Soon
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-xs">v2.1</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors group"
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FileBarChart className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold mb-2">Export &amp; Share</h3>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Generate PDF reports for parents, players, and management. Share progress with stakeholders.
          </p>
          <div className="flex items-center gap-2 text-purple-400 font-medium text-sm">
            Coming Soon
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-xs">v2.1</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
