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
        <p className="text-sm font-bold text-zinc-400 leading-relaxed">
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
        <p className="text-xs font-bold text-zinc-400 leading-relaxed">
          The Practice Performance Index (PPI) is a structured coaching tool used to assess how effectively a young cricketer trains and develops during practice. It measures performance across 8 key areas: technique, intensity, execution, adaptability, discipline, concentration, coachability and preparation.
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Its purpose is not simply to give a player a score. It is to help the coach identify what is working well, where development may be required and what action should follow. By tracking these areas consistently, the coach can move beyond general impressions and build a clearer picture of the player’s strengths, weaknesses and progress over time. It also creates better coaching conversations by giving both coach and player something specific to review, discuss and improve.
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          The Practice Performance Index is therefore both a measurement tool and a problem-solving tool. It helps the coach answer three important questions:
        </p>
        <ul className="text-xs font-bold text-zinc-300 space-y-1 pl-4 list-disc">
          <li>What is the player doing well?</li>
          <li>What is limiting their development?</li>
          <li>What should we work on next?</li>
        </ul>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Used properly, it gives practice greater purpose, helps young players take more ownership of their development and allows the coach to make more informed decisions about how best to coach and mentor each individual.
        </p>
        <div className="pt-2 border-t border-zinc-900 space-y-2">
          <ul className="text-xs font-medium text-zinc-400 space-y-2 pl-2">
            <li><span className="text-white font-bold">Technique:</span> The quality and repeatability of the basic technique and skills a player uses to perform their role effectively.</li>
            <li><span className="text-white font-bold">Intensity:</span> The energy, purpose and competitive effort a player brings to every part of his and the team practice.</li>
            <li><span className="text-white font-bold">Execution:</span> The player’s ability to turn the practiced skill or technique required, into an effective and repeatable action under pressure or instruction.</li>
            <li><span className="text-white font-bold">Adaptability:</span> The player’s ability to adjust their approach, technique and decision-making when conditions, challenges or situations change during practice or are not to their liking.</li>
            <li><span className="text-white font-bold">Discipline:</span> The player’s ability to follow instructions, maintain standards, stay committed to the task and make responsible choices throughout practice.</li>
            <li><span className="text-white font-bold">Concentration:</span> The player’s ability to stay mentally focused, remain engaged in the practice and give full attention to each skill, repetition and instruction.</li>
            <li><span className="text-white font-bold">Coachability:</span> The player’s willingness and ability to listen, understand feedback, apply coaching advice and instruction and ask questions to improve their performance.</li>
            <li><span className="text-white font-bold">Preparation:</span> How well a player arrives physically, mentally and practically ready to perform their role and make the most of the practice session.</li>
          </ul>
        </div>
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
        <p className="text-xs font-bold text-zinc-400 leading-relaxed">
          The Match Performance Index is a structured coaching tool used to assess how effectively a young cricketer performs and responds during competitive play. It measures key areas such as technical execution, decision making, game awareness, resilience, emotional control, teamwork, match impact and preparation.
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Its purpose is not simply to give a player a score or judge them by runs, wickets, catches or the result of the match. It’s to help the coach understand what worked, what broke down under pressure and what needs to be developed next.
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          By tracking these areas consistently, the coach can move beyond statistics and build a clearer picture of how the player applies their skills in real competition. It also creates better post-match conversations by giving both coach and player something specific to review, discuss and improve.
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          The Match Performance Index is therefore both a measurement tool and a problem-solving tool.
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          It helps the coach answer three important questions:
        </p>
        <ul className="text-xs font-bold text-zinc-300 space-y-1 pl-4 list-disc">
          <li>What did the player do well?</li>
          <li>What limited their performance?</li>
          <li>What should we work on next?</li>
        </ul>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Used properly, it turns every match into a learning opportunity, helps young players understand their own performance more clearly and allows the coach to connect what happens in competition directly back to future practice and development.
        </p>
        <div className="pt-2 border-t border-zinc-900 space-y-2">
          <ul className="text-xs font-medium text-zinc-400 space-y-2 pl-2">
            <li><span className="text-white font-bold">Technical Execution:</span> How confidently and effectively the player applied their core skills and technique in the match, under the pressure, conditions and demands of competition.</li>
            <li><span className="text-white font-bold">Decision Making:</span> This measures how well the player read the situation, understood what was required, and chose the right option at the right time.</li>
            <li><span className="text-white font-bold">Game Awareness:</span> How well the player understood what was happening in the match and adjusted their role, game plan and decisions accordingly.</li>
            <li><span className="text-white font-bold">Resilience:</span> How well the player responds to mistakes, setbacks and pressure during the match, and how quickly they can reset, stay involved and perform effectively again.</li>
            <li><span className="text-white font-bold">Emotional Control:</span> How well the player managed pressure, intimidation, frustration, excitement and disappointment during the match while staying composed, focused and able to perform their role effectively.</li>
            <li><span className="text-white font-bold">Teamwork:</span> How effectively the player supported teammates, fulfilled their role and contributed to the team’s overall performance throughout the match.</li>
            <li><span className="text-white font-bold">Match Impact:</span> Measures how effectively the player’s overall performance, presence and actions influenced the course of the match and helped the team’s chances of success.</li>
            <li><span className="text-white font-bold">Preparation:</span> How well the player arrived physically, mentally and practically ready to perform their role to meet the demands of the match.</li>
          </ul>
        </div>
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
            <span className="text-zinc-400">Needs Immediate Guidance / Development</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold py-1 border-b border-zinc-900">
            <span className="text-amber-500">5.0 - 7.5</span>
            <span className="text-zinc-400">Consistent Performance / Standard Level</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold py-1 border-b border-zinc-900">
            <span className="text-emerald-500">7.5 - 10.0</span>
            <span className="text-zinc-400">Outstanding Capability / Elite Potential</span>
          </div>
        </div>
      </div>

      {/* Restart Tour */}
      <button
        onClick={() => {
          localStorage.setItem("cpi_onboarding_completed", "false");
          localStorage.setItem("cpi_players_tour_completed", "false");
          window.location.href = "/dashboard";
        }}
        className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-4.5 text-base font-black flex items-center justify-center gap-2 transition-all border border-orange-450 cursor-pointer uppercase"
      >
        Restart Tour
      </button>

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
