"use client";

import { HelpCircle, ChevronRight, Clipboard, ShieldCheck, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Title */}
      <div className="space-y-2 text-center">
        <h1 className="text-zinc-500 font-black tracking-widest text-xs uppercase">DOCUMENTATION</h1>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">HELP & INFORMATION</h2>
      </div>

      {/* Intro Card */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3">
        <p className="text-sm font-bold text-slate-900 leading-relaxed">
          Welcome to the Cricket Performance Index (CPI) platform. This guide explains how our index works and how to interpret scores.
        </p>
      </div>

      {/* PPI Details */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <Clipboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase">Practice Performance (PPI)</h3>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Practice Assessment Index</p>
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-900 leading-relaxed">
          The Practice Performance Index (PPI) is a structured coaching tool used to assess how effectively a young cricketer trains and develops during practice. It measures performance across 8 key areas: technique, intensity, execution, adaptability, discipline, concentration, coachability and preparation.
        </p>
        <p className="text-xs font-medium text-slate-900 leading-relaxed">
          Its purpose is not simply to give a player a score. It is to help the coach identify what is working well, where development may be required and what action should follow. By tracking these areas consistently, the coach can move beyond general impressions and build a clearer picture of the player’s strengths, weaknesses and progress over time. It also creates better coaching conversations by giving both coach and player something specific to review, discuss and improve.
        </p>
        <p className="text-xs font-medium text-slate-900 leading-relaxed">
          The Practice Performance Index is therefore both a measurement tool and a problem-solving tool. It helps the coach answer three important questions:
        </p>
        <ul className="text-xs font-bold text-slate-900 space-y-1 pl-4 list-disc">
          <li>What is the player doing well?</li>
          <li>What is limiting their development?</li>
          <li>What should we work on next?</li>
        </ul>
        <p className="text-xs font-medium text-slate-900 leading-relaxed">
          Used properly, it gives practice greater purpose, helps young players take more ownership of their development and allows the coach to make more informed decisions about how best to coach and mentor each individual.
        </p>
        <div className="pt-2 border-t border-slate-200 space-y-2">
          <ul className="text-xs font-medium text-zinc-100 space-y-2 pl-2">
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Technique:</span> <span className="text-slate-900 font-medium">The quality and repeatability of the basic technique and skills a player uses to perform their role effectively.</span></li>
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Intensity:</span> <span className="text-slate-900 font-medium">The energy, purpose and competitive effort a player brings to every part of his and the team practice.</span></li>
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Execution:</span> <span className="text-slate-900 font-medium">The player’s ability to turn the practiced skill or technique required, into an effective and repeatable action under pressure or instruction.</span></li>
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Adaptability:</span> <span className="text-slate-900 font-medium">The player’s ability to adjust their approach, technique and decision-making when conditions, challenges or situations change during practice or are not to their liking.</span></li>
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Discipline:</span> <span className="text-slate-900 font-medium">The player’s ability to follow instructions, maintain standards, stay committed to the task and make responsible choices throughout practice.</span></li>
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Concentration:</span> <span className="text-slate-900 font-medium">The player’s ability to stay mentally focused, remain engaged in the practice and give full attention to each skill, repetition and instruction.</span></li>
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Coachability:</span> <span className="text-slate-900 font-medium">The player’s willingness and ability to listen, understand feedback, apply coaching advice and instruction and ask questions to improve their performance.</span></li>
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Preparation:</span> <span className="text-slate-900 font-medium">How well a player arrives physically, mentally and practically ready to perform their role and make the most of the practice session.</span></li>
          </ul>
        </div>
      </div>

      {/* MPI Details */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase">Match Performance (MPI)</h3>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Match Play Assessment Index</p>
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-900 leading-relaxed">
          The Match Performance Index is a structured coaching tool used to assess how effectively a young cricketer performs and responds during competitive play. It measures key areas such as technical execution, decision making, game awareness, resilience, emotional control, teamwork, match impact and preparation.
        </p>
        <p className="text-xs font-medium text-slate-900 leading-relaxed">
          Its purpose is not simply to give a player a score or judge them by runs, wickets, catches or the result of the match. It’s to help the coach understand what worked, what broke down under pressure and what needs to be developed next.
        </p>
        <p className="text-xs font-medium text-slate-900 leading-relaxed">
          By tracking these areas consistently, the coach can move beyond statistics and build a clearer picture of how the player applies their skills in real competition. It also creates better post-match conversations by giving both coach and player something specific to review, discuss and improve.
        </p>
        <p className="text-xs font-medium text-slate-900 leading-relaxed">
          The Match Performance Index is therefore both a measurement tool and a problem-solving tool.
        </p>
        <p className="text-xs font-medium text-slate-900 leading-relaxed">
          It helps the coach answer three important questions:
        </p>
        <ul className="text-xs font-bold text-slate-900 space-y-1 pl-4 list-disc">
          <li>What did the player do well?</li>
          <li>What limited their performance?</li>
          <li>What should we work on next?</li>
        </ul>
        <p className="text-xs font-medium text-slate-900 leading-relaxed">
          Used properly, it turns every match into a learning opportunity, helps young players understand their own performance more clearly and allows the coach to connect what happens in competition directly back to future practice and development.
        </p>
        <div className="pt-2 border-t border-slate-200 space-y-2">
          <ul className="text-xs font-medium text-zinc-100 space-y-2 pl-2">
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Technical Execution:</span> <span className="text-slate-900 font-medium">How confidently and effectively the player applied their core skills and technique in the match, under the pressure, conditions and demands of competition.</span></li>
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Decision Making:</span> <span className="text-slate-900 font-medium">This measures how well the player read the situation, understood what was required, and chose the right option at the right time.</span></li>
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Game Awareness:</span> <span className="text-slate-900 font-medium">How well the player understood what was happening in the match and adjusted their role, game plan and decisions accordingly.</span></li>
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Resilience:</span> <span className="text-slate-900 font-medium">How well the player responds to mistakes, setbacks and pressure during the match, and how quickly they can reset, stay involved and perform effectively again.</span></li>
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Emotional Control:</span> <span className="text-slate-900 font-medium">How well the player managed pressure, intimidation, frustration, excitement and disappointment during the match while staying composed, focused and able to perform their role effectively.</span></li>
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Teamwork:</span> <span className="text-slate-900 font-medium">How effectively the player supported teammates, fulfilled their role and contributed to the team’s overall performance throughout the match.</span></li>
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Match Impact:</span> <span className="text-slate-900 font-medium">Measures how effectively the player’s overall performance, presence and actions influenced the course of the match and helped the team’s chances of success.</span></li>
            <li><span className="text-slate-900 font-extrabold underline decoration-orange-500/40">Preparation:</span> <span className="text-slate-900 font-medium">How well the player arrived physically, mentally and practically ready to perform their role to meet the demands of the match.</span></li>
          </ul>
        </div>
      </div>

      {/* CPI Details */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase">Cricket Performance (CPI)</h3>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Overall Player Rating Index</p>
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-900 leading-relaxed">
          The Cricket Performance Index (CPI) is a structured coaching tool built around one simple truth: how you practise is how you will play. By measuring key performance areas in both practice and matches, the CPI shows what is transferring, where performance is breaking down and what is holding a player back. It moves player development beyond results and personal opinion, giving coaches and players a clearer, evidence based view of the relationship between practice and competition.
        </p>
      </div>

      {/* HOW TO INTERPRET CPI SCORES */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">HOW TO INTERPRET CPI SCORES</h3>
        <div className="space-y-4 pt-1">
          <div className="space-y-1 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-red-500 uppercase tracking-wider">BELOW 50</span>
              <span className="text-xs font-black text-slate-900 uppercase">- NEEDS ATTENTION</span>
            </div>
            <p className="text-xs font-medium text-slate-900 leading-relaxed">
              Performance is being limited in one or more key areas. Identify the main cause and make it a coaching priority.
            </p>
          </div>
          <div className="space-y-1 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-500 uppercase tracking-wider">50 TO 70</span>
              <span className="text-xs font-black text-slate-900 uppercase">- DEVELOPING</span>
            </div>
            <p className="text-xs font-medium text-slate-900 leading-relaxed">
              There are positive signs, but performance is still inconsistent. Focus on improving consistency and transfer into matches.
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-500 uppercase tracking-wider">70 AND ABOVE</span>
              <span className="text-xs font-black text-slate-900 uppercase">- STRONG</span>
            </div>
            <p className="text-xs font-medium text-slate-900 leading-relaxed">
              Performance is strong across the key areas. Protect what is working, maintain standards and continue to challenge the player.
            </p>
          </div>
        </div>
      </div>

      {/* HOW TO USE THE CPI AS A COACH */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">HOW TO USE THE CPI AS A COACH</h3>
        <p className="text-xs font-semibold text-slate-900 leading-relaxed">
          When assessing a player across the Practice Performance Index (PPI) and Match Performance Index (MPI), the coach should keep a broad view of the player’s total game, because all 16 indexes contribute to the overall picture.
        </p>
        <p className="text-xs font-medium text-slate-900 leading-relaxed">
          Where possible, score the player during or immediately after practice and matches, while your observations are still fresh. Add short, thoughtful notes that explain the score and provide context.
        </p>
        <p className="text-xs font-medium text-slate-900 leading-relaxed">
          Use the CPI to:
        </p>
        <ul className="text-xs font-bold text-slate-900 space-y-2 pl-4 list-disc">
          <li>Assess the whole performance, not one skill, moment or result.</li>
          <li>Compare PPI and MPI scores to see what is transferring from practice into competition.</li>
          <li>Identify low-scoring indexes and use the accompanying coaching notes to help decide what should be addressed at the next practice.</li>
          <li>Track scores and player notes over time to identify improvement, recurring weaknesses and early warning signs of declining form.</li>
          <li>Use the CPI resources and Daryll Cullinan videos for practical ideas, coaching suggestions and guidance on what the CPI, PPI and MPI may be telling you.</li>
        </ul>
        <p className="text-xs font-medium text-slate-900 leading-relaxed">
          Over time, the CPI App can reveal patterns that are difficult to see through observation alone. The supporting notes and videos then help the coach interpret those patterns, understand what may be driving them and turn that information into practical coaching interventions.
        </p>
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
        className="w-full bg-slate-100 hover:bg-slate-100 text-slate-900 rounded-2xl py-4.5 text-base font-extrabold flex items-center justify-center gap-2 transition-all border border-slate-200 cursor-pointer"
      >
        BACK TO PROFILE
      </Link>

    </div>
  );
}
