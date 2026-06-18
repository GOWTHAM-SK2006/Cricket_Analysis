"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const METRICS = [
  "Technique",
  "Intensity",
  "Execution",
  "Adaptability",
  "Discipline",
  "Focus",
];

export default function PracticePage() {
  const [scores, setScores] = useState<Record<string, number>>(
    METRICS.reduce((acc, curr) => ({ ...acc, [curr]: 5 }), {})
  );
  
  const ppiScore = (Object.values(scores).reduce((a, b) => a + b, 0) / METRICS.length).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Practice Assessment</h1>
          <p className="text-zinc-400 mt-1">Calculate Practice Performance Index (PPI) for a player.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-400 font-medium uppercase tracking-wider mb-1">Total PPI</p>
          <div className="text-4xl font-bold text-orange-500">{ppiScore}</div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-8">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Select Player</label>
            <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500">
              <option value="">Choose a player...</option>
              <option value="1">John Doe</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Session Date</label>
            <input 
              type="date" 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 [color-scheme:dark]" 
            />
          </div>
        </div>

        <div className="space-y-8 border-t border-white/10 pt-8">
          {METRICS.map((metric) => (
            <div key={metric} className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-medium">{metric}</label>
                <span className="text-orange-500 font-bold bg-orange-500/10 px-3 py-1 rounded-lg">
                  {scores[metric]} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={scores[metric]}
                onChange={(e) => setScores({ ...scores, [metric]: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8">
          <label className="text-sm font-medium text-zinc-300 block mb-2">Coach Notes</label>
          <textarea 
            rows={4}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
            placeholder="Add observations about technique or areas of improvement..."
          />
        </div>

        <button className="w-full bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-4 font-medium transition-all text-lg shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]">
          Save Assessment
        </button>
      </div>
    </div>
  );
}
