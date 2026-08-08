"use client";

import { useState, useEffect } from "react";
import { 
  HelpCircle, ChevronRight, Clipboard, ShieldCheck, TrendingUp, 
  Target, Sparkles, Flame, CheckCircle2, AlertTriangle, BookOpen, Layers
} from "lucide-react";
import Link from "next/link";

interface ActionPoint {
  title: string;
  detail: string;
}

interface CoachPlanItem {
  id: string;
  name: string;
  description: string;
  highPoints: ActionPoint[];
  highSummary: string;
  lowPoints: ActionPoint[];
  coachSummary: {
    overview: string;
    high: string;
    low: string;
    goal: string;
  };
}

const coachPlanData: CoachPlanItem[] = [
  {
    id: "technical_execution",
    name: "Technical Execution",
    description: "Technical Execution measures how consistently and effectively a player performs the basic techniques required for their role in both practice and matches when the difficulty and demands increase.",
    highPoints: [
      { title: "Confirm what is working", detail: "Help the player understand which parts of their technique are allowing them to perform consistently." },
      { title: "Protect the basics", detail: "Avoid unnecessary changes when the player has a method that is working." },
      { title: "Increase the challenge", detail: "Test the technique against greater speed, pressure, fatigue and more difficult cricket situations." },
      { title: "Encourage self-correction", detail: "Help the player recognise when something feels wrong and make simple adjustments themselves." },
      { title: "Monitor transfer", detail: "Check that the same technical quality shown in practice is being carried into matches." }
    ],
    highSummary: "A high score shows that the player has a reliable technique that is standing up to the demands of practice and competition. The next step is to strengthen it under even greater pressure.",
    lowPoints: [
      { title: "Identify the main problem", detail: "Find the technical issue that is having the greatest effect on performance." },
      { title: "Keep the correction simple", detail: "Work on one clear adjustment rather than trying to change everything at once." },
      { title: "Return to the basics", detail: "Slow the skill down and rebuild the movement before increasing the difficulty." },
      { title: "Recreate the problem in practice", detail: "Use drills and scenarios that mirror where the technique is breaking down in matches." },
      { title: "Track the improvement", detail: "Look for whether the correction becomes more consistent in practice and then transfers into competition." }
    ],
    coachSummary: {
      overview: "The Technical Execution Index helps the coach understand whether the player's technique is reliable enough to perform in both practice and matches.",
      high: "protect, challenge and refine.",
      low: "identify, simplify and rebuild.",
      goal: "develop a technique the player can trust and repeat when the game places it under pressure."
    }
  },
  {
    id: "skill_level",
    name: "Skill Level",
    description: "Skill Level measures how effectively a player applies their range of cricket-specific skills in both practice and matches. It is not simply about how many skills they have. It is about how well they can use those skills as the level of difficulty, pressure and competition increases.",
    highPoints: [
      { title: "Identify the strengths", detail: "Understand which skills the player performs consistently and confidently." },
      { title: "Increase the difficulty", detail: "Challenge the player with greater speed, variation, pressure and more demanding situations." },
      { title: "Expand the skill set", detail: "Introduce new skills that complement what the player already does well." },
      { title: "Encourage smart use of skills", detail: "Help the player understand when and where each skill is most effective." },
      { title: "Monitor transfer", detail: "Check that skills performed successfully in practice are also being used effectively in matches." }
    ],
    highSummary: "A high score shows that the player has a strong and reliable skill set. The next step is to make those skills more adaptable, consistent and effective under pressure.",
    lowPoints: [
      { title: "Identify the gap", detail: "Establish which important skills are missing, inconsistent or limiting performance." },
      { title: "Prioritise the basics", detail: "Focus on the most important skills for the player's role before adding greater complexity." },
      { title: "Build through repetition", detail: "Give the player enough quality practice to develop confidence and consistency." },
      { title: "Match the challenge to the player", detail: "Avoid asking for skills that are beyond their current level of development." },
      { title: "Track the progress", detail: "Look for improvement in practice first, then whether that improvement transfers into matches." }
    ],
    coachSummary: {
      overview: "The Skill Level Index helps the coach understand whether the player has the range and quality of skills needed to meet the demands of practice and competition.",
      high: "challenge, expand and apply.",
      low: "identify, build and repeat.",
      goal: "develop the right skills, then make sure the player can use them when the game demands them."
    }
  },
  {
    id: "gameplan",
    name: "Game Plan",
    description: "Game Plan measures how clearly a player understands what they are trying to achieve and how they intend to go about it in both practice and matches. The key question for the coach is simple: does the player give the impression that they have a plan? They should show purpose in their decisions, understand their role and be able to adjust when the situation changes.",
    highPoints: [
      { title: "Confirm the thinking", detail: "Ask the player what their plan was and why they chose it." },
      { title: "Reinforce role clarity", detail: "Make sure the player understands what their role requires in different situations." },
      { title: "Increase the challenge", detail: "Use changing practice and match scenarios that force the player to think and adjust." },
      { title: "Encourage independence", detail: "Allow the player to make tactical decisions without constant instruction." },
      { title: "Monitor adaptability", detail: "Check that the player can stick to a good plan but also recognise when it needs to change." }
    ],
    highSummary: "A high score shows that the player performs with purpose and understands what they are trying to achieve. The next step is to make that thinking more flexible and effective under pressure.",
    lowPoints: [
      { title: "Establish whether there is a plan", detail: "Ask the player what they were trying to do and listen for clarity or uncertainty." },
      { title: "Simplify the thinking", detail: "Give the player one or two clear objectives for their role." },
      { title: "Connect practice to matches", detail: "Create scenarios that require the player to practise the same plans they will need in competition." },
      { title: "Teach adjustment", detail: "Help the player recognise when conditions, opposition or the match situation require a different approach." },
      { title: "Review the decisions", detail: "Discuss whether the player followed the plan, abandoned it too quickly or never had one clearly in mind." }
    ],
    coachSummary: {
      overview: "The Game Plan Index helps the coach understand whether the player is performing with clear purpose or simply reacting to what happens.",
      high: "confirm, challenge and adapt.",
      low: "clarify, simplify and rehearse.",
      goal: "every player should know what they are trying to do, why they are doing it and when the game requires them to change."
    }
  },
  {
    id: "preparation",
    name: "Preparation",
    description: "Preparation measures how physically, mentally and practically ready a player is to perform in both practice and matches. The key question is: does the player arrive ready to make the most of the session or game? Good preparation gives performance a better chance before the first ball is even bowled.",
    highPoints: [
      { title: "Confirm the routine", detail: "Identify the habits that help the player arrive organised, focused and ready." },
      { title: "Build ownership", detail: "Encourage the player to take responsibility for equipment, warm-up, hydration and personal goals." },
      { title: "Connect preparation to performance", detail: "Help them see how good preparation improves confidence, concentration and execution." },
      { title: "Prepare for different demands", detail: "Teach the player to adjust for travel, weather, pitch conditions, aggressive opposition, questionable umpires and different roles." },
      { title: "Monitor consistency", detail: "Make sure preparation standards remain high for every practice and match." }
    ],
    highSummary: "A high score shows that the player is giving themselves the best possible chance to perform well. The next step is to make those habits automatic and player-led.",
    lowPoints: [
      { title: "Identify what is missing", detail: "Is the issue poor planning, low energy, unclear goals, lack of passion, lack of interest or weak routines?" },
      { title: "Set clear expectations", detail: "Make sure the player knows what ready should look like." },
      { title: "Create a simple checklist", detail: "Keep equipment, hydration, warm-up and role preparation easy to follow." },
      { title: "Build responsibility gradually", detail: "Give the player age-appropriate ownership instead of letting others do everything for them." },
      { title: "Review the impact", detail: "Show how poor preparation may have affected the quality of practice or match performance." }
    ],
    coachSummary: {
      overview: "The Preparation Index helps the coach understand whether the player is ready to perform or already playing catch-up before they begin.",
      high: "reinforce, own and maintain.",
      low: "clarify, organise and improve.",
      goal: "arrive ready, so performance has the best possible chance to follow."
    }
  },
  {
    id: "intensity",
    name: "Intensity",
    description: "Intensity measures the energy, purpose and competitive intent a player brings to both practice and matches. It's not about being loud or overactive. The key question is: does the player look fully engaged and ready to compete in the moment? Good intensity should support skill, decision making and team performance.",
    highPoints: [
      { title: "Confirm what is working", detail: "Identify the habits that help the player stay switched on and competitive." },
      { title: "Channel the energy", detail: "Make sure intensity remains controlled and does not become rushed or reckless." },
      { title: "Increase the challenge", detail: "Use tougher drills and match situations at practice that demand sustained effort." },
      { title: "Protect skill quality", detail: "Check that technique and decision making remain strong as intensity rises." },
      { title: "Encourage positive influence", detail: "Use the player's energy to lift teammates and team standards." }
    ],
    highSummary: "A high score shows that the player brings strong purpose and competitive effort. The next step is to make that intensity controlled, consistent and useful.",
    lowPoints: [
      { title: "Identify the reason", detail: "Is the player tired, distracted, bored, low on confidence or unclear about the task?" },
      { title: "Clarify the standard", detail: "Explain what good intensity should look like in movement, effort and involvement." },
      { title: "Set short targets", detail: "Give the player immediate goals to create urgency and focus." },
      { title: "Increase involvement", detail: "Use competitive drills and clearer roles to keep the player engaged." },
      { title: "Review the response", detail: "Check whether the player's energy improves when the challenge becomes more meaningful." }
    ],
    coachSummary: {
      overview: "The Intensity Index helps the coach understand whether the player is fully engaged or simply present.",
      high: "channel, challenge and sustain.",
      low: "identify, engage and rebuild.",
      goal: "bring the right energy, with the right purpose, for the demands of the moment."
    }
  },
  {
    id: "focus",
    name: "Focus",
    description: "Focus measures how well a player stays mentally present, attentive and connected to the task in both practice and matches. The key question is: does the player stay engaged with what matters, or does their concentration drift when pressure, fatigue or distractions increase?",
    highPoints: [
      { title: "Confirm the routine", detail: "Identify what helps the player stay present, mentally switched on and preserving their concentration energy." },
      { title: "Increase the challenge", detail: "Use longer, more demanding drills and match scenarios in practice that test concentration." },
      { title: "Reinforce reset habits", detail: "Encourage simple routines between balls, overs or repetitions." },
      { title: "Protect calm thinking", detail: "Make sure strong focus does not become tension or overthinking." },
      { title: "Monitor consistency", detail: "Check whether the player can stay focused when tired, frustrated or under pressure." }
    ],
    highSummary: "A high score shows that the player can stay connected to the task and give each moment proper attention. The next step is to make that focus more durable under pressure.",
    lowPoints: [
      { title: "Identify the cause", detail: "Is the player distracted, tired, anxious, bored or unclear about what matters?" },
      { title: "Simplify the task", detail: "Give one clear focus point rather than too many instructions." },
      { title: "Teach a reset", detail: "Use a simple routine to help the player reconnect after mistakes or distractions." },
      { title: "Create shorter challenges", detail: "Break practice into smaller, purposeful blocks." },
      { title: "Review the pattern", detail: "Look for when focus drops and what tends to trigger it." }
    ],
    coachSummary: {
      overview: "The Focus Index helps the coach understand whether the player is mentally present or only physically involved.",
      high: "reinforce, challenge and sustain.",
      low: "simplify, reset and rebuild.",
      goal: "stay present, reset quickly and give the next ball your full attention."
    }
  },
  {
    id: "resilience",
    name: "Resilience",
    description: "Resilience measures how well a player responds to adversity, pressure, mistakes and setbacks in both practice and matches. The key question is: does the player maintain effort, focus and body language when things go wrong, or do they fold under pressure?",
    highPoints: [
      { title: "Confirm the mindset", detail: "Acknowledge the player's mental toughness and ability to handle high-pressure crunch overs." },
      { title: "Expose to extreme scenarios", detail: "Test resilience in net drills with high consequence for wickets lost." },
      { title: "Develop squad leadership", detail: "Position the player to guide teammates through tough match phases." },
      { title: "Maintain emotional control", detail: "Ensure competitive drive does not spill over into frustration." },
      { title: "Track response consistency", detail: "Check that resilience remains high across consecutive difficult matches." }
    ],
    highSummary: "A high score shows that the player thrives under pressure and bounces back quickly from errors. The next step is to anchor that resilience as a core team asset.",
    lowPoints: [
      { title: "Identify error triggers", detail: "Pinpoint whether dropped catches, early wickets, or umpire calls trigger emotional drops." },
      { title: "Implement 5-second reset", detail: "Teach a quick physical reset routine (breath, body language) post-error." },
      { title: "Separate identity from outcome", detail: "Remind the player that one mistake does not define their skill level." },
      { title: "Simulate low-stakes pressure", detail: "Build confidence gradually through controlled pressure scenarios in practice." },
      { title: "Celebrate bounce-back effort", detail: "Reward positive body language and recovery efforts after setbacks." }
    ],
    coachSummary: {
      overview: "The Resilience Index helps the coach understand whether the player has the mental toughness to handle pressure and bounce back from setbacks.",
      high: "anchor, challenge and lead.",
      low: "identify, reset and rebuild.",
      goal: "develop unshakeable mental toughness under competitive pressure."
    }
  }
];

export default function HelpPage() {
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
  const [scoreTab, setScoreTab] = useState<"high" | "low">("high");
  const [plans, setPlans] = useState<CoachPlanItem[]>(coachPlanData);
  const [ppiDesc, setPpiDesc] = useState<string>(
    "The Practice Performance Index (PPI) is a structured coaching tool used to assess how effectively a young cricketer trains and develops during practice. It measures performance across key areas on a 0 – 10 scale: technique, intensity, execution, adaptability, discipline, concentration, coachability and preparation."
  );
  const [mpiDesc, setMpiDesc] = useState<string>(
    "The Match Performance Index is a structured coaching tool used to assess how effectively a young cricketer performs and responds during competitive play on a 0 – 10 scale. It measures key areas such as technical execution, decision making, game awareness, resilience, emotional control, teamwork, match impact and preparation."
  );
  const [cpiDesc, setCpiDesc] = useState<string>(
    "The Cricket Performance Index (CPI) is a structured coaching tool built around one simple truth: how you practise is how you will play. By measuring key performance areas in both practice and matches on a 0 – 10 scale, the CPI shows what is transferring, where performance is breaking down and what is holding a player back."
  );
  const [below5, setBelow5] = useState<string>(
    "Performance is being limited in one or more key areas. Identify the main cause and make it a coaching priority."
  );
  const [between5And7, setBetween5And7] = useState<string>(
    "There are positive signs, but performance is still inconsistent. Focus on improving consistency and transfer into matches."
  );
  const [above7, setAbove7] = useState<string>(
    "Performance is strong across the key areas. Protect what is working, maintain standards and continue to challenge the player."
  );

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/public/config");
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.helpJson && typeof data.helpJson === "string") {
          const parsed = JSON.parse(data.helpJson);
          if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed.coachPlanData) && parsed.coachPlanData.length > 0) {
              const sanitized = parsed.coachPlanData.map((item: any, i: number) => {
                const fallback = coachPlanData[i] || coachPlanData[0];
                return {
                  id: String(item?.id || fallback.id),
                  name: String(item?.name || item?.parameter || fallback.name),
                  description: String(item?.description || item?.explanation || fallback.description),
                  highPoints: Array.isArray(item?.highPoints) && item.highPoints.length > 0
                    ? item.highPoints.map((pt: any, pIdx: number) => ({
                        title: String(pt?.title || fallback.highPoints[pIdx]?.title || "Action Point"),
                        detail: String(pt?.detail || fallback.highPoints[pIdx]?.detail || "")
                      }))
                    : fallback.highPoints,
                  highSummary: String(item?.highSummary || item?.rangeHigh || fallback.highSummary),
                  lowPoints: Array.isArray(item?.lowPoints) && item.lowPoints.length > 0
                    ? item.lowPoints.map((pt: any, pIdx: number) => ({
                        title: String(pt?.title || fallback.lowPoints[pIdx]?.title || "Action Point"),
                        detail: String(pt?.detail || fallback.lowPoints[pIdx]?.detail || "")
                      }))
                    : fallback.lowPoints,
                  coachSummary: {
                    overview: String(item?.coachSummary?.overview || fallback.coachSummary.overview),
                    high: String(item?.coachSummary?.high || fallback.coachSummary.high),
                    low: String(item?.coachSummary?.low || fallback.coachSummary.low),
                    goal: String(item?.coachSummary?.goal || fallback.coachSummary.goal)
                  }
                };
              });
              setPlans(sanitized);
            }
            if (typeof parsed.ppiDescription === "string") setPpiDesc(parsed.ppiDescription);
            if (typeof parsed.mpiDescription === "string") setMpiDesc(parsed.mpiDescription);
            if (typeof parsed.cpiDescription === "string") setCpiDesc(parsed.cpiDescription);
            if (typeof parsed.below5Text === "string") setBelow5(parsed.below5Text);
            if (typeof parsed.between5And7Text === "string") setBetween5And7(parsed.between5And7Text);
            if (typeof parsed.above7Text === "string") setAbove7(parsed.above7Text);
          }
        }
      } catch (err) {
        console.warn("Could not load dynamic help config, using local default:", err);
      }
    }
    loadConfig();
  }, []);

  const currentPlan = plans[selectedPlanIndex] || plans[0] || coachPlanData[0];
  const safeName = currentPlan?.name || "Parameter";
  const safeDescription = currentPlan?.description || "";
  const safeHighPoints = Array.isArray(currentPlan?.highPoints) ? currentPlan.highPoints : [];
  const safeLowPoints = Array.isArray(currentPlan?.lowPoints) ? currentPlan.lowPoints : [];
  const activePoints = scoreTab === "high" ? safeHighPoints : safeLowPoints;
  const safeHighSummary = currentPlan?.highSummary || "";
  const safeCoachSummary = currentPlan?.coachSummary || {
    overview: "Overview of parameter performance.",
    high: "protect and refine.",
    low: "simplify and rebuild.",
    goal: "develop consistent performance under pressure."
  };

  return (
    <div className="space-y-6 pb-12 select-none max-w-2xl mx-auto text-left">
      
      {/* Title */}
      <div className="space-y-2 text-center">
        <h1 className="text-zinc-500 font-black tracking-widest text-xs uppercase">DOCUMENTATION</h1>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">HELP & INFORMATION</h2>
      </div>

      {/* Intro Card */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
        <p className="text-sm font-bold text-slate-900 leading-relaxed">
          Welcome to the Cricket Performance Index (CPI) platform. This guide explains how our index works, how to interpret scores on an out-of-10 scale, and provides the complete Coach’s Plan of Action for player development.
        </p>
      </div>

      {/* ========================================== */}
      {/* THE COACH’S PLAN OF ACTION - INTERACTIVE SECTION */}
      {/* ========================================== */}
      <div className="bg-white border-2 border-orange-500/40 rounded-3xl p-5 space-y-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full pointer-events-none" />

        {/* Section Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-black flex items-center justify-center font-black">
            <BookOpen className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">THE COACH’S PLAN OF ACTION</h3>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Parameter Development Guide & Action Plans</p>
          </div>
        </div>

        {/* Parameter Selector Pills (Slider / Scrollable Tabs) */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Select Index Parameter:</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {plans.map((plan, idx) => (
              <button
                key={plan.id}
                onClick={() => { setSelectedPlanIndex(idx); setScoreTab("high"); }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase whitespace-nowrap transition-all cursor-pointer border ${
                  selectedPlanIndex === idx
                    ? "bg-orange-500 text-black border-orange-500 shadow-md scale-[1.02]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                {plan.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Parameter Details */}
        <div className="space-y-4 pt-1 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
            <span className="text-xs font-black text-orange-600 uppercase tracking-wider block">
              {safeName} Index Overview
            </span>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              {safeDescription}
            </p>
          </div>

          {/* High vs Low Score Action Toggle */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1.5">
            <button
              onClick={() => setScoreTab("high")}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                scoreTab === "high"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              IF SCORE IS HIGH (&gt;7)
            </button>
            <button
              onClick={() => setScoreTab("low")}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                scoreTab === "low"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              IF SCORE IS LOW (&lt;5)
            </button>
          </div>

          {/* Action Points Content */}
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider block text-slate-800">
              {scoreTab === "high" ? `High ${safeName} Score Action Points:` : `Low ${safeName} Score Action Points:`}
            </span>
            <div className="space-y-2">
              {activePoints.map((pt, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex gap-3 items-start text-xs">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-black text-[10px] shrink-0 mt-0.5 ${
                    scoreTab === "high" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-rose-100 text-rose-800 border border-rose-300"
                  }`}>
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-black text-slate-900 block uppercase">{pt.title}</span>
                    <span className="font-medium text-slate-700 leading-relaxed">{pt.detail}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* High/Low Summary Banner */}
            {scoreTab === "high" && safeHighSummary && (
              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 text-xs font-semibold text-emerald-950 leading-relaxed italic">
                {safeHighSummary}
              </div>
            )}
          </div>

          {/* THE COACH’S SUMMARY BOX */}
          <div className="bg-slate-900 text-white p-4.5 rounded-2.5xl space-y-2.5 text-xs shadow-md">
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block">
              THE COACH’S SUMMARY — {safeName.toUpperCase()}
            </span>
            <p className="font-medium text-slate-200 leading-relaxed">
              {safeCoachSummary.overview}
            </p>
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <p><span className="text-emerald-400 font-bold uppercase">High score:</span> <span className="text-slate-300 capitalize">{safeCoachSummary.high}</span></p>
              <p><span className="text-rose-400 font-bold uppercase">Low score:</span> <span className="text-slate-300 capitalize">{safeCoachSummary.low}</span></p>
              <p className="pt-1 text-orange-300 font-bold"><span className="uppercase text-orange-400">The goal:</span> {safeCoachSummary.goal}</p>
            </div>
          </div>
        </div>
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
          {ppiDesc}
        </p>
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
          {mpiDesc}
        </p>
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
          {cpiDesc}
        </p>
      </div>

      {/* HOW TO INTERPRET CPI SCORES (OUT OF 10) */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">HOW TO INTERPRET SCORES (OUT OF 10)</h3>
        <div className="space-y-4 pt-1">
          <div className="space-y-1 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-red-500 uppercase tracking-wider">BELOW 5.0</span>
              <span className="text-xs font-black text-slate-900 uppercase">- NEEDS ATTENTION</span>
            </div>
            <p className="text-xs font-medium text-slate-900 leading-relaxed">
              {below5}
            </p>
          </div>
          <div className="space-y-1 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-500 uppercase tracking-wider">5.0 TO 7.0</span>
              <span className="text-xs font-black text-slate-900 uppercase">- DEVELOPING</span>
            </div>
            <p className="text-xs font-medium text-slate-900 leading-relaxed">
              {between5And7}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-500 uppercase tracking-wider">7.0 AND ABOVE</span>
              <span className="text-xs font-black text-slate-900 uppercase">- STRONG</span>
            </div>
            <p className="text-xs font-medium text-slate-900 leading-relaxed">
              {above7}
            </p>
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
        className="w-full bg-slate-100 hover:bg-slate-100 text-slate-900 rounded-2xl py-4.5 text-base font-extrabold flex items-center justify-center gap-2 transition-all border border-slate-200 cursor-pointer text-center block"
      >
        BACK TO PROFILE
      </Link>

    </div>
  );
}
