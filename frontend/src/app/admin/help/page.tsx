"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle, Save, RotateCcw, Loader2, Info, BookOpen, Layers, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useAdminToast } from "../layout";

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

interface FullHelpConfig {
  coachPlanData: CoachPlanItem[];
  ppiDescription: string;
  mpiDescription: string;
  cpiDescription: string;
  below5Text: string;
  between5And7Text: string;
  above7Text: string;
}

const DEFAULT_COACH_PLAN_DATA: CoachPlanItem[] = [
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

const DEFAULT_FULL_HELP: FullHelpConfig = {
  coachPlanData: DEFAULT_COACH_PLAN_DATA,
  ppiDescription: "The Practice Performance Index (PPI) is a structured coaching tool used to assess how effectively a young cricketer trains and develops during practice. It measures performance across key areas on a 0 – 10 scale: technique, intensity, execution, adaptability, discipline, concentration, coachability and preparation.",
  mpiDescription: "The Match Performance Index is a structured coaching tool used to assess how effectively a young cricketer performs and responds during competitive play on a 0 – 10 scale. It measures key areas such as technical execution, decision making, game awareness, resilience, emotional control, teamwork, match impact and preparation.",
  cpiDescription: "The Cricket Performance Index (CPI) is a structured coaching tool built around one simple truth: how you practise is how you will play. By measuring key performance areas in both practice and matches on a 0 – 10 scale, the CPI shows what is transferring, where performance is breaking down and what is holding a player back.",
  below5Text: "Performance is being limited in one or more key areas. Identify the main cause and make it a coaching priority.",
  between5And7Text: "There are positive signs, but performance is still inconsistent. Focus on improving consistency and transfer into matches.",
  above7Text: "Performance is strong across the key areas. Protect what is working, maintain standards and continue to challenge the player."
};

export default function AdminHelpPage() {
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [helpConfig, setHelpConfig] = useState<FullHelpConfig>(DEFAULT_FULL_HELP);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
  const [scoreTab, setScoreTab] = useState<"high" | "low">("high");
  const [fullConfigRaw, setFullConfigRaw] = useState<any>({});

  useEffect(() => {
    fetchHelpConfig();
  }, []);

  const fetchHelpConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token");
      const res = await fetch("/api/admin/config", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFullConfigRaw(data);
        if (data.helpJson) {
          try {
            const parsed = JSON.parse(data.helpJson);
            if (parsed && typeof parsed === "object") {
              if (parsed.coachPlanData && Array.isArray(parsed.coachPlanData)) {
                setHelpConfig({
                  coachPlanData: parsed.coachPlanData,
                  ppiDescription: parsed.ppiDescription || DEFAULT_FULL_HELP.ppiDescription,
                  mpiDescription: parsed.mpiDescription || DEFAULT_FULL_HELP.mpiDescription,
                  cpiDescription: parsed.cpiDescription || DEFAULT_FULL_HELP.cpiDescription,
                  below5Text: parsed.below5Text || DEFAULT_FULL_HELP.below5Text,
                  between5And7Text: parsed.between5And7Text || DEFAULT_FULL_HELP.between5And7Text,
                  above7Text: parsed.above7Text || DEFAULT_FULL_HELP.above7Text,
                });
              }
            }
          } catch (e) {
            console.error("Error parsing helpJson", e);
          }
        }
      }
    } catch (err) {
      showToast("Could not fetch Help & Information configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = helpConfig.coachPlanData[selectedPlanIndex] || DEFAULT_COACH_PLAN_DATA[0];

  const updateCurrentPlanField = (field: string, val: any) => {
    const updatedList = [...helpConfig.coachPlanData];
    updatedList[selectedPlanIndex] = {
      ...updatedList[selectedPlanIndex],
      [field]: val
    };
    setHelpConfig({ ...helpConfig, coachPlanData: updatedList });
  };

  const updateActionPoint = (tab: "high" | "low", index: number, field: "title" | "detail", val: string) => {
    const updatedList = [...helpConfig.coachPlanData];
    const plan = { ...updatedList[selectedPlanIndex] };
    const pointsKey = tab === "high" ? "highPoints" : "lowPoints";
    const points = [...plan[pointsKey]];
    points[index] = { ...points[index], [field]: val };
    plan[pointsKey] = points;
    updatedList[selectedPlanIndex] = plan;
    setHelpConfig({ ...helpConfig, coachPlanData: updatedList });
  };

  const updateCoachSummaryField = (field: "overview" | "high" | "low" | "goal", val: string) => {
    const updatedList = [...helpConfig.coachPlanData];
    const plan = { ...updatedList[selectedPlanIndex] };
    plan.coachSummary = { ...plan.coachSummary, [field]: val };
    updatedList[selectedPlanIndex] = plan;
    setHelpConfig({ ...helpConfig, coachPlanData: updatedList });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token");
      const updatedPayload = {
        ...fullConfigRaw,
        helpJson: JSON.stringify(helpConfig),
        changeLogsJson: JSON.stringify([
          { time: new Date().toISOString(), section: "Help & Information", action: "Updated Coach's Plan of Action & Help documentation", user: "cpi@admin.com" }
        ])
      };

      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedPayload)
      });

      if (!res.ok) throw new Error("Failed to save Help & Information configuration");

      showToast("Coach Help & Information content saved and synchronized!", "success");
    } catch (err: any) {
      showToast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Coach Help & Information Governance</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
              Direct Sync to Coach App (/help)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Edit the exact Coach's Plan of Action, parameter overviews, 5-point action items, summary boxes, and score interpretation text. All edits instantly update on the Coach Help page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setHelpConfig(DEFAULT_FULL_HELP)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/30 transition-all disabled:opacity-50 uppercase cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Help Content</span>
          </button>
        </div>
      </div>

      {/* Editor Grid: Left Parameter List, Right Rich Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Parameter Tabs */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
          <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Select Coach Plan Parameter
          </div>
          {helpConfig.coachPlanData.map((plan, idx) => {
            const isActive = idx === selectedPlanIndex;
            return (
              <button
                key={plan.id}
                onClick={() => { setSelectedPlanIndex(idx); setScoreTab("high"); }}
                className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between border cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                      isActive ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-extrabold text-xs leading-snug">{plan.name}</p>
                    <p className={`text-[10px] line-clamp-1 font-medium ${isActive ? "text-slate-400" : "text-slate-500"}`}>
                      {plan.description}
                    </p>
                  </div>
                </div>
                {isActive && <BookOpen className="w-4 h-4 text-orange-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>

        {/* Right Editor Form */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 font-black text-sm flex items-center justify-center">
                #{selectedPlanIndex + 1}
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900">Coach's Plan of Action — {currentPlan.name}</h2>
                <p className="text-xs text-slate-500 font-medium">Edit parameter overview, action points, and summary box</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
              Parameter #{selectedPlanIndex + 1}
            </span>
          </div>

          {/* 1. Parameter Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              1. Parameter Overview Description
            </label>
            <textarea
              rows={3}
              value={currentPlan.description}
              onChange={(e) => updateCurrentPlanField("description", e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 leading-relaxed"
            />
          </div>

          {/* 2. High vs Low Score Action Points Toggle */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. 5-Point Action Plans ({scoreTab === "high" ? "High Score >7" : "Low Score <5"})
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setScoreTab("high")}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                    scoreTab === "high" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  If Score is High (&gt;7)
                </button>
                <button
                  onClick={() => setScoreTab("low")}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                    scoreTab === "low" ? "bg-rose-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  If Score is Low (&lt;5)
                </button>
              </div>
            </div>

            {/* 5 Action Points */}
            <div className="space-y-3">
              {(scoreTab === "high" ? currentPlan.highPoints : currentPlan.lowPoints).map((pt, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                      scoreTab === "high" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={pt.title}
                      onChange={(e) => updateActionPoint(scoreTab, i, "title", e.target.value)}
                      placeholder="Point Title"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-extrabold text-slate-900 uppercase focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={pt.detail}
                    onChange={(e) => updateActionPoint(scoreTab, i, "detail", e.target.value)}
                    placeholder="Point Explanation Detail"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500 leading-relaxed"
                  />
                </div>
              ))}
            </div>

            {/* High Summary Banner text */}
            {scoreTab === "high" && (
              <div>
                <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
                  High Score Green Summary Banner Text
                </label>
                <textarea
                  rows={2}
                  value={currentPlan.highSummary}
                  onChange={(e) => updateCurrentPlanField("highSummary", e.target.value)}
                  className="w-full bg-emerald-50/80 border border-emerald-300 rounded-xl p-3 text-xs font-semibold text-emerald-950 leading-relaxed italic focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* 3. The Coach's Summary Box */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. The Coach's Summary Box — {currentPlan.name}
            </label>
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 border border-slate-800">
              <div>
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-1">Summary Overview</span>
                <textarea
                  rows={2}
                  value={currentPlan.coachSummary.overview}
                  onChange={(e) => updateCoachSummaryField("overview", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-medium text-slate-100 focus:outline-none focus:border-orange-500 leading-relaxed"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">High Score Directive</span>
                  <input
                    type="text"
                    value={currentPlan.coachSummary.high}
                    onChange={(e) => updateCoachSummaryField("high", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Low Score Directive</span>
                  <input
                    type="text"
                    value={currentPlan.coachSummary.low}
                    onChange={(e) => updateCoachSummaryField("low", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-black text-orange-300 uppercase tracking-widest block mb-1">The Goal Directive</span>
                <input
                  type="text"
                  value={currentPlan.coachSummary.goal}
                  onChange={(e) => updateCoachSummaryField("goal", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Edits automatically update on the Coach Help page.
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/30 transition-all disabled:opacity-50 uppercase cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Help Content</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Help Sections (PPI, MPI, CPI & Score Interpretation) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-orange-600" />
            <span>4. Index Descriptions & Score Interpretation Texts</span>
          </h2>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">Global Card Texts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Practice Performance (PPI) Text</span>
              <span className="text-[10px] text-slate-400 font-medium">Practice Index</span>
            </label>
            <textarea
              rows={7}
              value={helpConfig.ppiDescription}
              onChange={(e) => setHelpConfig({ ...helpConfig, ppiDescription: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Match Performance (MPI) Text</span>
              <span className="text-[10px] text-slate-400 font-medium">Match Index</span>
            </label>
            <textarea
              rows={7}
              value={helpConfig.mpiDescription}
              onChange={(e) => setHelpConfig({ ...helpConfig, mpiDescription: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Cricket Performance (CPI) Text</span>
              <span className="text-[10px] text-slate-400 font-medium">Overall Rating Index</span>
            </label>
            <textarea
              rows={7}
              value={helpConfig.cpiDescription}
              onChange={(e) => setHelpConfig({ ...helpConfig, cpiDescription: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            5. How to Interpret Scores (Out of 10) Texts
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-[11px] font-black text-red-500 block mb-1.5 uppercase tracking-wide">
                Below 5.0 - Needs Attention
              </span>
              <textarea
                rows={5}
                value={helpConfig.below5Text}
                onChange={(e) => setHelpConfig({ ...helpConfig, below5Text: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
              />
            </div>
            <div>
              <span className="text-[11px] font-black text-amber-500 block mb-1.5 uppercase tracking-wide">
                5.0 to 7.0 - Developing
              </span>
              <textarea
                rows={5}
                value={helpConfig.between5And7Text}
                onChange={(e) => setHelpConfig({ ...helpConfig, between5And7Text: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
              />
            </div>
            <div>
              <span className="text-[11px] font-black text-emerald-500 block mb-1.5 uppercase tracking-wide">
                7.0 and Above - Strong
              </span>
              <textarea
                rows={5}
                value={helpConfig.above7Text}
                onChange={(e) => setHelpConfig({ ...helpConfig, above7Text: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all leading-relaxed shadow-xs"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/30 transition-all disabled:opacity-50 uppercase cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Help Content</span>
          </button>
        </div>
      </div>
    </div>
  );
}
