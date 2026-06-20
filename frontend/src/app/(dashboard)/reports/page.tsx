"use client";

import { motion } from "framer-motion";
import { FileBarChart, TrendingUp, Users, Target } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6 px-4">
      <div>
        <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">Reports</h1>
        <p className="text-zinc-400 text-xs lg:text-[15px] mt-1">View team and player performance reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-all duration-200 group shadow-md"
        >
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold mb-1 text-white group-hover:text-orange-500 transition-colors">Performance Trends</h3>
          <p className="text-zinc-450 text-xs leading-normal mb-3">
            Track PPI and MPI scores over time. Identify improvement patterns and areas needing attention.
          </p>
          <div className="flex items-center gap-1.5 text-orange-500 font-bold text-[9px] uppercase tracking-wider">
            Coming Soon
            <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-[8px]">v2.1</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-all duration-200 group shadow-md"
        >
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold mb-1 text-white group-hover:text-orange-500 transition-colors">Team Comparison</h3>
          <p className="text-zinc-455 text-xs leading-normal mb-3">
            Compare squads side-by-side. Benchmark team CPI scores across age groups and seasons.
          </p>
          <div className="flex items-center gap-1.5 text-orange-500 font-bold text-[9px] uppercase tracking-wider">
            Coming Soon
            <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-[8px]">v2.1</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-all duration-200 group shadow-md"
        >
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold mb-1 text-white group-hover:text-orange-500 transition-colors">Player Profiles</h3>
          <p className="text-zinc-450 text-xs leading-normal mb-3">
            Individual radar charts, strengths, weaknesses, and personalised coaching recommendations.
          </p>
          <div className="flex items-center gap-1.5 text-orange-500 font-bold text-[9px] uppercase tracking-wider">
            Coming Soon
            <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-[8px]">v2.1</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-all duration-200 group shadow-md"
        >
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileBarChart className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold mb-1 text-white group-hover:text-orange-500 transition-colors">Export &amp; Share</h3>
          <p className="text-zinc-450 text-xs leading-normal mb-3">
            Generate PDF reports for parents, players, and management. Share progress with stakeholders.
          </p>
          <div className="flex items-center gap-1.5 text-orange-500 font-bold text-[9px] uppercase tracking-wider">
            Coming Soon
            <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-[8px]">v2.1</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
