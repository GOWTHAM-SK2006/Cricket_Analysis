"use client";

import { HelpCircle, ChevronRight, Clipboard, ShieldCheck, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Title */}
      <div className="space-y-2 text-center">
        <h1 className="text-zinc-500 font-black tracking-widest text-xs uppercase">DOCUMENTATION</h1>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">HELP & INFORMATION</h2>
      </div>

      {/* Intro Card */}
      <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5 space-y-3">
        <p className="text-sm font-bold text-zinc-350 leading-relaxed">
          Welcome to the Cricket Performance Index (CPI) platform. This guide explains how our index works and how to interpret scores.
        </p>
      </div>

      {/* PPI Details */}
      <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <Clipboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase">Practice Performance (PPI)</h3>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Practice Assessment Index</p>
          </div>
        </div>
        <p className="text-xs font-bold text-zinc-400 leading-normal">
          PPI measures a player's capability and mindset in practice nets and coaching sessions. It is rated out of 10 across 6 core parameters:
        </p>
        <ul className="text-xs font-bold text-zinc-300 space-y-2 pl-4 list-disc">
          <li><span className="text-white">Technique:</span> Mechanics, posture, and shot selection.</li>
          <li><span className="text-white">Intensity:</span> Energy levels and focus throughout drills.</li>
          <li><span className="text-white">Execution:</span> Ability to hit targets and execute instructions.</li>
          <li><span className="text-white">Adaptability:</span> Adjusting to different bowling actions or drills.</li>
          <li><span className="text-white">Discipline:</span> Respecting constraints and maintaining form.</li>
          <li><span className="text-white">Focus:</span> Concentration and mental resilience under pressure.</li>
        </ul>
      </div>

      {/* MPI Details */}
      <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase">Match Performance (MPI)</h3>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Match Play Assessment Index</p>
          </div>
        </div>
        <p className="text-xs font-bold text-zinc-400 leading-normal">
          MPI measures a player's real-game impact during matches and simulated match play. It is rated out of 10 across 6 core parameters:
        </p>
        <ul className="text-xs font-bold text-zinc-300 space-y-2 pl-4 list-disc">
          <li><span className="text-white">Technical Execution:</span> Playing key moments using sound technique.</li>
          <li><span className="text-white">Decision Making:</span> Risk management and situational choices.</li>
          <li><span className="text-white">Game Awareness:</span> Understanding run rate, field settings, and match state.</li>
          <li><span className="text-white">Pressure Handling:</span> Performing when stakes are high.</li>
          <li><span className="text-white">Team Contribution:</span> Fielding, running between wickets, backing up, team support.</li>
          <li><span className="text-white">Match Impact:</span> Game-changing contributions that lead to winning outcomes.</li>
        </ul>
      </div>

      {/* CPI Details */}
      <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase">Cricket Performance (CPI)</h3>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Overall Player Rating Index</p>
          </div>
        </div>
        <p className="text-xs font-bold text-zinc-400 leading-normal">
          CPI is the overall index calculated as the mathematical average of a player's latest PPI and MPI. 
        </p>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-center">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">CPI Calculation Formula</span>
          <span className="text-lg font-black text-white">CPI = ( PPI + MPI ) / 2</span>
        </div>
      </div>

      {/* Score Interpretation */}
      <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5 space-y-3">
        <h3 className="text-sm font-black text-white uppercase">How to Interpret Scores</h3>
        <div className="space-y-3 pt-1">
          <div className="flex justify-between items-center text-xs font-bold py-1 border-b border-zinc-900">
            <span className="text-red-500">Below 5.0</span>
            <span className="text-zinc-300">Needs Immediate Guidance / Development</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold py-1 border-b border-zinc-900">
            <span className="text-amber-500">5.0 - 7.5</span>
            <span className="text-zinc-300">Consistent Performance / Standard Level</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold py-1 border-b border-zinc-900">
            <span className="text-emerald-500">7.5 - 10.0</span>
            <span className="text-zinc-300">Outstanding Capability / Elite Potential</span>
          </div>
        </div>
      </div>

      {/* Back to Profile */}
      <Link
        href="/profile"
        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl py-4.5 text-base font-extrabold flex items-center justify-center gap-2 transition-all border border-zinc-800 cursor-pointer"
      >
        BACK TO PROFILE
      </Link>

    </div>
  );
}
