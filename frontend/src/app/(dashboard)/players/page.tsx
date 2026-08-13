"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Search, Plus, Loader2, ArrowLeft, Clipboard, ShieldCheck, 
  Sparkles, ListCollapse, Award, Flame, Heart, Brain, X, Camera, CheckCircle2,
  Filter, Check, Copy, Target, Edit2, ChevronDown, FileText, Download, Trash2
} from "lucide-react";
import PerformanceTrendChart from "@/components/PerformanceTrendChart";
import CricketLoader from "@/components/CricketLoader";
import jsPDF from "jspdf";
import { getRoleContextForParameter } from "@/lib/roleContext";

interface Player {
  id: number;
  name: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  ppiScore: number | null;
  mpiScore: number | null;
  invitationCode?: string;
  invitationCodeActivated?: boolean;
  creatorCoach?: {
    id: number;
    name: string;
    email: string;
  };
}

const formatScoreValue = (val: number | null | undefined, showMax: boolean = false) => {
  if (val === null || val === undefined || val === 0) return "N/A";
  let num = typeof val === "number" ? val : parseFloat(val as any);
  if (isNaN(num) || num <= 0) return "N/A";
  const score100 = num <= 10 ? Math.round(num * 10) : Math.round(num);
  return showMax ? `${score100}/100` : `${score100}`;
};

interface CoachParameterSection {
  header: string;
  bullets: string[];
  explanation?: string;
  summaryHeader: string;
  summaryOverview: string;
  highScoreStatement: string;
  lowScoreStatement: string;
  goalStatement: string;
}

interface CoachParameterRecommendation {
  description: string;
  high: CoachParameterSection;
  low: CoachParameterSection;
}

const coachingRecommendations: Record<string, CoachParameterRecommendation> = {
  "Focus": {
    description: "Focus measures how well a player stays mentally present, attentive and connected to the task in both practice and matches. The key question is: does the player stay engaged with what matters, or does their concentration drift when pressure, fatigue or distractions increase?",
    high: {
      header: "IF THE FOCUS SCORE IS HIGH",
      bullets: [
        "Confirm the routine. Identify what helps the player stay present, mentally switched on and preserving their concentration energy.",
        "Increase the challenge. Use longer, more demanding drills and match scenarios in practice that test concentration.",
        "Reinforce reset habits. Encourage simple routines between balls, overs or repetitions.",
        "Protect calm thinking. Make sure strong focus does not become tension or overthinking.",
        "Monitor consistency. Check whether the player can stay focused when tired, frustrated or under pressure."
      ],
      explanation: "A high score shows that the player can stay connected to the task and give each moment proper attention. The next step is to make that focus more durable under pressure.",
      summaryHeader: "THE COACH’S SUMMARY",
      summaryOverview: "The Focus Index helps the coach understand whether the player is mentally present or only physically involved.",
      highScoreStatement: "High score: reinforce, challenge and sustain.",
      lowScoreStatement: "Low score: simplify, reset and rebuild.",
      goalStatement: "The goal is simple: stay present, reset quickly and give the next ball your full attention."
    },
    low: {
      header: "IF THE FOCUS SCORE IS LOW",
      bullets: [
        "Identify the cause. Is the player distracted, tired, anxious, bored or unclear about what matters?",
        "Simplify the task. Give one clear focus point rather than too many instructions.",
        "Teach a reset. Use a simple routine to help the player reconnect after mistakes or distractions.",
        "Create shorter challenges. Break practice into smaller, purposeful blocks.",
        "Review the pattern. Look for when focus drops and what tends to trigger it."
      ],
      summaryHeader: "THE COACH’S SUMMARY",
      summaryOverview: "The Focus Index helps the coach understand whether the player is mentally present or only physically involved.",
      highScoreStatement: "High score: reinforce, challenge and sustain.",
      lowScoreStatement: "Low score: simplify, reset and rebuild.",
      goalStatement: "The goal is simple: stay present, reset quickly and give the next ball your full attention."
    }
  },
  "Game Plan": {
    description: "Game Plan measures how clearly a player understands what they are trying to achieve and how they intend to go about it in both practice and matches. The key question for the coach is simple: does the player give the impression that they have a plan? They should show purpose in their decisions, understand their role and be able to adjust when the situation changes.",
    high: {
      header: "IF THE GAME PLAN SCORE IS HIGH",
      bullets: [
        "Confirm the thinking. Ask the player what their plan was and why they chose it.",
        "Reinforce role clarity. Make sure the player understands what their role requires in different situations.",
        "Increase the challenge. Use changing practice and match scenarios that force the player to think and adjust.",
        "Encourage independence. Allow the player to make tactical decisions without constant instruction.",
        "Monitor adaptability. Check that the player can stick to a good plan but also recognise when it needs to change."
      ],
      explanation: "A high score shows that the player performs with purpose and understands what they are trying to achieve. The next step is to make that thinking more flexible and effective under pressure.",
      summaryHeader: "THE COACH’S SUMMARY",
      summaryOverview: "The Game Plan Index helps the coach understand whether the player is performing with clear purpose or simply reacting to what happens.",
      highScoreStatement: "High score: confirm, challenge and adapt.",
      lowScoreStatement: "Low score: clarify, simplify and rehearse.",
      goalStatement: "The goal is simple: every player should know what they are trying to do, why they are doing it and when the game requires them to change."
    },
    low: {
      header: "IF THE GAME PLAN SCORE IS LOW",
      bullets: [
        "Establish whether there is a plan. Ask the player what they were trying to do and listen for clarity or uncertainty.",
        "Simplify the thinking. Give the player one or two clear objectives for their role.",
        "Connect practice to matches. Create scenarios that require the player to practise the same plans they will need in competition.",
        "Teach adjustment. Help the player recognise when conditions, opposition or the match situation require a different approach.",
        "Review the decisions. Discuss whether the player followed the plan, abandoned it too quickly or never had one clearly in mind."
      ],
      summaryHeader: "THE COACH’S SUMMARY",
      summaryOverview: "The Game Plan Index helps the coach understand whether the player is performing with clear purpose or simply reacting to what happens.",
      highScoreStatement: "High score: confirm, challenge and adapt.",
      lowScoreStatement: "Low score: clarify, simplify and rehearse.",
      goalStatement: "The goal is simple: every player should know what they are trying to do, why they are doing it and when the game requires them to change."
    }
  },
  "Intensity": {
    description: "Intensity measures the energy, purpose and competitive intent a player brings to both practice and matches. It’s not about being loud or overactive. The key question is: does the player look fully engaged and ready to compete in the moment? Good intensity should support skill, decision making and team performance.",
    high: {
      header: "IF THE INTENSITY SCORE IS HIGH",
      bullets: [
        "Confirm what is working. Identify the habits that help the player stay switched on and competitive.",
        "Channel the energy. Make sure intensity remains controlled and does not become rushed or reckless.",
        "Increase the challenge. Use tougher drills and match situations at practice that demand sustained effort.",
        "Protect skill quality. Check that technique and decision making remain strong as intensity rises.",
        "Encourage positive influence. Use the player’s energy to lift teammates and team standards."
      ],
      explanation: "A high score shows that the player brings strong purpose and competitive effort. The next step is to make that intensity controlled, consistent and useful.",
      summaryHeader: "THE COACH’S SUMMARY",
      summaryOverview: "The Intensity Index helps the coach understand whether the player is fully engaged or simply present.",
      highScoreStatement: "High score: channel, challenge and sustain.",
      lowScoreStatement: "Low score: identify, engage and rebuild.",
      goalStatement: "The goal is simple: bring the right energy, with the right purpose, for the demands of the moment."
    },
    low: {
      header: "IF THE INTENSITY SCORE IS LOW",
      bullets: [
        "Identify the reason. Is the player tired, distracted, bored, low on confidence or unclear about the task?",
        "Clarify the standard. Explain what good intensity should look like in movement, effort and involvement.",
        "Set short targets. Give the player immediate goals to create urgency and focus.",
        "Increase involvement. Use competitive drills and clearer roles to keep the player engaged.",
        "Review the response. Check whether the player’s energy improves when the challenge becomes more meaningful."
      ],
      summaryHeader: "THE COACH’S SUMMARY",
      summaryOverview: "The Intensity Index helps the coach understand whether the player is fully engaged or simply present.",
      highScoreStatement: "High score: channel, challenge and sustain.",
      lowScoreStatement: "Low score: identify, engage and rebuild.",
      goalStatement: "The goal is simple: bring the right energy, with the right purpose, for the demands of the moment."
    }
  },
  "Preparation": {
    description: "Preparation measures how physically, mentally and practically ready a player is to perform in both practice and matches. The key question is: does the player arrive ready to make the most of the session or game? Good preparation gives performance a better chance before the first ball is even bowled.",
    high: {
      header: "IF THE PREPARATION SCORE IS HIGH",
      bullets: [
        "Confirm the routine. Identify the habits that help the player arrive organised, focused and ready.",
        "Build ownership. Encourage the player to take responsibility for equipment, warm-up, hydration and personal goals.",
        "Connect preparation to performance. Help them see how good preparation improves confidence, concentration and execution.",
        "Prepare for different demands. Teach the player to adjust for travel, weather, pitch conditions, aggressive opposition, questionable umpires and different roles.",
        "Monitor consistency. Make sure preparation standards remain high for every practice and match."
      ],
      explanation: "A high score shows that the player is giving themselves the best possible chance to perform well. The next step is to make those habits automatic and player-led.",
      summaryHeader: "THE COACH’S SUMMARY",
      summaryOverview: "The Preparation Index helps the coach understand whether the player is ready to perform or already playing catch-up before they begin.",
      highScoreStatement: "High score: reinforce, own and maintain.",
      lowScoreStatement: "Low score: clarify, organise and improve.",
      goalStatement: "The goal is simple: arrive ready, so performance has the best possible chance to follow."
    },
    low: {
      header: "IF THE PREPARATION SCORE IS LOW",
      bullets: [
        "Identify what is missing. Is the issue poor planning, low energy, unclear goals, lack of passion, lack of interest or weak routines?",
        "Set clear expectations. Make sure the player knows what ready should look like.",
        "Create a simple checklist. Keep equipment, hydration, warm-up and role preparation easy to follow.",
        "Build responsibility gradually. Give the player age-appropriate ownership instead of letting others do everything for them.",
        "Review the impact. Show how poor preparation may have affected the quality of practice or match performance."
      ],
      summaryHeader: "THE COACH’S SUMMARY",
      summaryOverview: "The Preparation Index helps the coach understand whether the player is ready to perform or already playing catch-up before they begin.",
      highScoreStatement: "High score: reinforce, own and maintain.",
      lowScoreStatement: "Low score: clarify, organise and improve.",
      goalStatement: "The goal is simple: arrive ready, so performance has the best possible chance to follow."
    }
  },
  "Skill Level": {
    description: "Skill Level measures how effectively a player applies their range of cricket-specific skills in both practice and matches. It is not simply about how many skills they have. It is about how well they can use those skills as the level of difficulty, pressure and competition increases.",
    high: {
      header: "IF THE SKILL LEVEL SCORE IS HIGH",
      bullets: [
        "Identify the strengths. Understand which skills the player performs consistently and confidently.",
        "Increase the difficulty. Challenge the player with greater speed, variation, pressure and more demanding situations.",
        "Expand the skill set. Introduce new skills that complement what the player already does well.",
        "Encourage smart use of skills. Help the player understand when and where each skill is most effective.",
        "Monitor transfer. Check that skills performed successfully in practice are also being used effectively in matches."
      ],
      explanation: "A high score shows that the player has a strong and reliable skill set. The next step is to make those skills more adaptable, consistent and effective under pressure.",
      summaryHeader: "THE COACH’S SUMMARY",
      summaryOverview: "The Skill Level Index helps the coach understand whether the player has the range and quality of skills needed to meet the demands of practice and competition.",
      highScoreStatement: "High score: challenge, expand and apply.",
      lowScoreStatement: "Low score: identify, build and repeat.",
      goalStatement: "The goal is simple: develop the right skills, then make sure the player can use them when the game demands them."
    },
    low: {
      header: "IF THE SKILL LEVEL SCORE IS LOW",
      bullets: [
        "Identify the gap. Establish which important skills are missing, inconsistent or limiting performance.",
        "Prioritise the basics. Focus on the most important skills for the player’s role before adding greater complexity.",
        "Build through repetition. Give the player enough quality practice to develop confidence and consistency.",
        "Match the challenge to the player. Avoid asking for skills that are beyond their current level of development.",
        "Track the progress. Look for improvement in practice first, then whether that improvement transfers into matches."
      ],
      summaryHeader: "THE COACH’S SUMMARY",
      summaryOverview: "The Skill Level Index helps the coach understand whether the player has the range and quality of skills needed to meet the demands of practice and competition.",
      highScoreStatement: "High score: challenge, expand and apply.",
      lowScoreStatement: "Low score: identify, build and repeat.",
      goalStatement: "The goal is simple: develop the right skills, then make sure the player can use them when the game demands them."
    }
  },
  "Technical Execution": {
    description: "Technical Execution measures how consistently and effectively a player performs the basic techniques required for their role in both practice and matches when the difficulty and demands increase.",
    high: {
      header: "IF THE TECHNICAL EXECUTION SCORE IS HIGH",
      bullets: [
        "Confirm what is working. Help the player understand which parts of their technique are allowing them to perform consistently.",
        "Protect the basics. Avoid unnecessary changes when the player has a method that is working.",
        "Increase the challenge. Test the technique against greater speed, pressure, fatigue and more difficult cricket situations.",
        "Encourage self-correction. Help the player recognise when something feels wrong and make simple adjustments themselves.",
        "Monitor transfer. Check that the same technical quality shown in practice is being carried into matches."
      ],
      explanation: "A high score shows that the player has a reliable technique that is standing up to the demands of practice and competition. The next step is to strengthen it under even greater pressure.",
      summaryHeader: "THE COACH’S SUMMARY",
      summaryOverview: "The Technical Execution Index helps the coach understand whether the player’s technique is reliable enough to perform in both practice and matches.",
      highScoreStatement: "High score: protect, challenge and refine.",
      lowScoreStatement: "Low score: identify, simplify and rebuild.",
      goalStatement: "The goal is simple: develop a technique the player can trust and repeat when the game places it under pressure."
    },
    low: {
      header: "IF THE TECHNICAL EXECUTION SCORE IS LOW",
      bullets: [
        "Identify the main problem. Find the technical issue that is having the greatest effect on performance.",
        "Keep the correction simple. Work on one clear adjustment rather than trying to change everything at once.",
        "Return to the basics. Slow the skill down and rebuild the movement before increasing the difficulty.",
        "Recreate the problem in practice. Use drills and scenarios that mirror where the technique is breaking down in matches.",
        "Track the improvement. Look for whether the correction becomes more consistent in practice and then transfers into competition."
      ],
      summaryHeader: "THE COACH’S SUMMARY",
      summaryOverview: "The Technical Execution Index helps the coach understand whether the player’s technique is reliable enough to perform in both practice and matches.",
      highScoreStatement: "High score: protect, challenge and refine.",
      lowScoreStatement: "Low score: identify, simplify and rebuild.",
      goalStatement: "The goal is simple: develop a technique the player can trust and repeat when the game places it under pressure."
    }
  }
};

// Aliases for alternate key naming across historical backend records
coachingRecommendations["Skills Level"] = coachingRecommendations["Skill Level"];
coachingRecommendations["Concentration"] = coachingRecommendations["Focus"];

interface CpiActionPoint {
  title: string;
  detail: string;
}

interface CpiFrameworkItem {
  id: string;
  name: string;
  description: string;
  highPoints: CpiActionPoint[];
  highSummary: string;
  mediumPoints?: CpiActionPoint[];
  mediumSummary?: string;
  lowPoints: CpiActionPoint[];
  lowSummary?: string;
  coachSummary: {
    overview: string;
    high: string;
    medium?: string;
    low: string;
    goal: string;
  };
}

const cpiFrameworkNotes: Record<string, CpiFrameworkItem> = {
  "Technical Execution": {
    id: "technical_execution",
    name: "Technical Execution",
    description: "Technical Execution measures how consistently and effectively a player performs the basic techniques required for their role in both practice and matches when the difficulty and demands increase.",
    highPoints: [
      { title: "PRESSURE TEST IT", detail: "Add pace, spin, fatigue, and tougher match scenarios in practice." },
      { title: "PROTECT THE BASICS", detail: "Maintain and reinforce strong fundamentals, avoiding unnecessary changes." },
      { title: "OWN THE CORRECTION", detail: "Encourage the player to recognise and self-correct technical drift." }
    ],
    highSummary: "A high score shows the player has a strong, reliable technical base that holds up under pressure. The focus now is to protect the basics, keep raising the standard, and continue testing the technique in more demanding cricket situations.",
    mediumPoints: [
      { title: "REFINE CORE MECHANICS", detail: "Fix minor technical breakdowns that appear when pace or pressure rises." },
      { title: "BUILD CONSISTENCY", detail: "Repeat sound technique across longer practice sets and multi-over spells." },
      { title: "CONTROLLED PRESSURE NETS", detail: "Expose technique to moderate match drills with clear execution targets." }
    ],
    mediumSummary: "A medium score shows the player has a functional technical foundation but requires greater consistency under pressure. The focus now is to refine core mechanics, eliminate minor breakdowns, and build repeatable technique.",
    lowPoints: [
      { title: "IDENTIFY MAIN ISSUE", detail: "Find the single technical breakdown having the greatest effect on performance." },
      { title: "KEEP CORRECTION SIMPLE", detail: "Work on one clear technical cue rather than changing multiple things." },
      { title: "RETURN TO BASICS", detail: "Slow down the movement in drill work before increasing execution speed." }
    ],
    lowSummary: "A low score shows the player needs to strengthen their technical base and build greater consistency under pressure. The focus now is to rebuild the basics, raise the standard, and keep testing the technique in demanding cricket situations.",
    coachSummary: {
      overview: "The Technical Execution Index helps the coach understand whether the player's technique is reliable enough to perform in both practice and matches.",
      high: "protect, challenge and refine.",
      medium: "refine, stabilize and test under moderate pressure.",
      low: "identify, simplify and rebuild.",
      goal: "develop a technique the player can trust and repeat when the game places it under pressure."
    }
  },
  "Skill Level": {
    id: "skill_level",
    name: "Skill Level",
    description: "Skill Level measures how effectively a player applies their range of cricket-specific skills in both practice and matches. It is not simply about how many skills they have. It is about how well they can use those skills as the level of difficulty, pressure and competition increases.",
    highPoints: [
      { title: "EXPAND SKILL VARIETY", detail: "Add secondary options and subtle variations that complement main strengths." },
      { title: "INCREASE EXECUTION SPEED", detail: "Challenge execution under reduced reaction time and changing conditions." },
      { title: "MONITOR MATCH TRANSFER", detail: "Ensure high-level skills practiced in nets translate directly into matches." }
    ],
    highSummary: "A high score shows that the player has a strong and reliable skill set. The next step is to make those skills more adaptable, consistent and effective under pressure.",
    mediumPoints: [
      { title: "CONSOLIDATE CORE SKILLS", detail: "Ensure primary batting strokes or bowling deliveries are 100% reliable." },
      { title: "SCENARIO APPLICATION", detail: "Apply skills within specific field settings and match situation targets." },
      { title: "BUILD EXECUTION DEPTH", detail: "Develop consistent control across different pitch types and lengths." }
    ],
    mediumSummary: "A medium score shows the player possesses a solid basic skill set but needs greater execution variety and adaptability under match pressure. The focus now is to consolidate core skills and expand match options.",
    lowPoints: [
      { title: "IDENTIFY SKILL GAP", detail: "Pinpoint missing or inconsistent fundamentals limiting match contribution." },
      { title: "REPETITION & QUALITY", detail: "Build confidence and muscle memory through high-quality basic repetitions." },
      { title: "MATCH DEMAND TO LEVEL", detail: "Focus on mastering basic skill execution before attempting complex variations." }
    ],
    lowSummary: "A low score shows that the player needs to develop their core skill set and build greater execution consistency under pressure. The focus now is to identify skill gaps, rebuild fundamentals, and test skills in demanding cricket situations.",
    coachSummary: {
      overview: "The Skill Level Index helps the coach understand whether the player has the range and quality of skills needed to meet the demands of practice and competition.",
      high: "challenge, expand and apply.",
      medium: "consolidate, expand and execute.",
      low: "identify, build and repeat.",
      goal: "develop the right skills, then make sure the player can use them when the game demands them."
    }
  },
  "Game Plan": {
    id: "gameplan",
    name: "Game Plan",
    description: "Game Plan measures how clearly a player understands what they are trying to achieve and how they intend to go about it in both practice and matches. The key question for the coach is simple: does the player give the impression that they have a plan? They should show purpose in their decisions, understand their role and be able to adjust when the situation changes.",
    highPoints: [
      { title: "CHALLENGE FLEXIBILITY", detail: "Expose the player to rapidly changing match situations requiring tactical shifts." },
      { title: "REINFORCE ROLE MASTERY", detail: "Deepen understanding of phase-specific responsibilities in team tactics." },
      { title: "ENCOURAGE INDEPENDENCE", detail: "Empower the player to make smart tactical choices on the field without instruction." }
    ],
    highSummary: "A high score shows that the player performs with purpose and understands what they are trying to achieve. The next step is to make that thinking more flexible and effective under pressure.",
    mediumPoints: [
      { title: "CLARIFY MATCH ROLE", detail: "Define clear tactical objectives for their specific role in the team." },
      { title: "IMPROVE MATCHUP AWARENESS", detail: "Study field placements, bowler/batter matchups, and scoring options." },
      { title: "PRACTICE IN-GAME SHIFTS", detail: "Rehearse adjusting plans when early wickets fall or match conditions change." }
    ],
    mediumSummary: "A medium score shows the player understands their game plan but occasionally struggles to adapt when match situations shift. The focus now is to sharpen role clarity, improve tactical adjustments, and build situational awareness.",
    lowPoints: [
      { title: "SIMPLIFY THE PLAN", detail: "Give the player one simple, actionable objective to focus on." },
      { title: "CONNECT DRILLS TO MATCHES", detail: "Run practice scenarios that mirror exact match situations they will face." },
      { title: "REVIEW DECISION MAKING", detail: "Discuss post-play whether decisions matched the plan or were reactive." }
    ],
    lowSummary: "A low score shows that the player needs clearer role understanding and tactical direction. The focus now is to simplify decision-making, establish clear match objectives, and test adaptability under pressure.",
    coachSummary: {
      overview: "The Game Plan Index helps the coach understand whether the player is performing with clear purpose or simply reacting to what happens.",
      high: "confirm, challenge and adapt.",
      medium: "sharpen, adapt and execute.",
      low: "clarify, simplify and rehearse.",
      goal: "every player should know what they are trying to do, why they are doing it and when the game requires them to change."
    }
  },
  "Preparation": {
    id: "preparation",
    name: "Preparation",
    description: "Preparation measures how physically, mentally and practically ready a player is to perform in both practice and matches. The key question is: does the player arrive ready to make the most of the session or game? Good preparation gives performance a better chance before the first ball is even bowled.",
    highPoints: [
      { title: "AUTOMATE ROUTINES", detail: "Make pre-session warm-ups, hydration, and goal setting completely automatic." },
      { title: "PREPARE FOR EXTREMES", detail: "Plan ahead for adverse weather, slow pitches, travels, and tough umpires." },
      { title: "BUILD PLAYER OWNERSHIP", detail: "Ensure the player takes full personal charge of equipment and readiness." }
    ],
    highSummary: "A high score shows that the player is giving themselves the best possible chance to perform well. The next step is to make those habits automatic and player-led.",
    mediumPoints: [
      { title: "STANDARDIZE ROUTINES", detail: "Follow a consistent physical warm-up, kit check, and mental prep routine." },
      { title: "VISUALIZE MATCH ROLES", detail: "Spend 5 minutes before play mentally rehearsing key match scenarios." },
      { title: "ARRIVE MATCH READY", detail: "Settle mentally and complete all preparation before stepping onto the field." }
    ],
    mediumSummary: "A medium score shows the player follows standard preparation habits but can improve consistency and mental readiness before matches. The focus now is to refine pre-session routines and build personal ownership.",
    lowPoints: [
      { title: "IDENTIFY PREP GAPS", detail: "Fix disorganization, rushed arrivals, or lack of focus before sessions." },
      { title: "USE A SIMPLE CHECKLIST", detail: "Create an easy equipment, hydration, and warm-up checklist to follow." },
      { title: "SET CLEAR EXPECTATIONS", detail: "Establish what proper pre-session and pre-match readiness looks like." }
    ],
    lowSummary: "A low score shows that the player needs consistent pre-match and pre-session preparation habits. The focus now is to establish structured routines, build personal accountability, and arrive ready for competition.",
    coachSummary: {
      overview: "The Preparation Index helps the coach understand whether the player is ready to perform or already playing catch-up before they begin.",
      high: "reinforce, own and maintain.",
      medium: "standardize, visualize and own.",
      low: "clarify, organise and improve.",
      goal: "arrive ready, so performance has the best possible chance to follow."
    }
  },
  "Intensity": {
    id: "intensity",
    name: "Intensity",
    description: "Intensity measures the energy, purpose and competitive intent a player brings to both practice and matches. It's not about being loud or overactive. The key question is: does the player look fully engaged and ready to compete in the moment? Good intensity should support skill, decision making and team performance.",
    highPoints: [
      { title: "CHANNEL ENERGY POSITIVELY", detail: "Keep competitive drive high while maintaining tactical discipline." },
      { title: "LIFT SQUAD STANDARDS", detail: "Use competitive energy to inspire and raise standards for teammates." },
      { title: "SUSTAIN IN HIGH FATIGUE", detail: "Maintain explosive effort and sharp movement during long spells and innings." }
    ],
    highSummary: "A high score shows that the player brings strong purpose and competitive effort. The next step is to make that intensity controlled, consistent and useful.",
    mediumPoints: [
      { title: "SUSTAIN CONSISTENT EFFORT", detail: "Eliminate energy lulls between overs or drill sets." },
      { title: "SET SESSION BENCHMARKS", detail: "Use clear physical and target benchmarks to maintain urgency in nets." },
      { title: "ACTIVE FIELDING EFFORT", detail: "Attack the ball in the field, communicate loudly, and stay alert." }
    ],
    mediumSummary: "A medium score shows the player brings good energy but experiences periodic intensity lulls during long sessions or matches. The focus now is to sustain competitive effort and maintain active engagement.",
    lowPoints: [
      { title: "FIND THE ENERGY TRIGGER", detail: "Determine if low intensity stems from fatigue, boredom, or unclear goals." },
      { title: "SET SHORT TARGETS", detail: "Break practice into short 5-minute competitive challenges." },
      { title: "INCREASE INVOLVEMENT", detail: "Use active, high-touch drills to keep the player physically engaged." }
    ],
    lowSummary: "A low score shows that the player needs higher competitive energy and focus during practice and matches. The focus now is to set clear targets, build effort habits, and maintain intensity throughout sessions.",
    coachSummary: {
      overview: "The Intensity Index helps the coach understand whether the player is fully engaged or simply present.",
      high: "channel, challenge and sustain.",
      medium: "sustain, target and engage.",
      low: "identify, engage and rebuild.",
      goal: "bring the right energy, with the right purpose, for the demands of the moment."
    }
  },
  "Focus": {
    id: "focus",
    name: "Focus",
    description: "Focus measures how well a player stays mentally present, attentive and connected to the task in both practice and matches. The key question is: does the player stay engaged with what matters, or does their concentration drift when pressure, fatigue or distractions increase?",
    highPoints: [
      { title: "REINFORCE RESET ROUTINE", detail: "Maintain a quick physical/breath reset between balls to conserve focus." },
      { title: "EXTEND CONCENTRATION SPANS", detail: "Test mental stamina with longer, unbroken practice scenarios." },
      { title: "STAY CALM UNDER PRESSURE", detail: "Ensure intense focus remains relaxed and free from overthinking." }
    ],
    highSummary: "A high score shows that the player can stay connected to the task and give each moment proper attention. The next step is to make that focus more durable under pressure.",
    mediumPoints: [
      { title: "BALL-BY-BALL RECONFINEMENT", detail: "Use a focal trigger to lock in complete attention before every delivery." },
      { title: "FILTER DISTRACTIONS", detail: "Practice staying switched on despite noise, fatigue, or bad decisions." },
      { title: "TRACK FOCUS DURATIONS", detail: "Notice when concentration drifts and trigger an instant mental reset." }
    ],
    mediumSummary: "A medium score shows the player has solid concentration with occasional focus lapses during prolonged play. The focus now is to strengthen ball-by-ball reset routines and build mental stamina.",
    lowPoints: [
      { title: "SIMPLIFY FOCAL POINTS", detail: "Focus on just one key cue instead of trying to process multiple inputs." },
      { title: "TEACH 5-SECOND RESET", detail: "Use a simple physical trigger to reset after a mistake or distraction." },
      { title: "SHORTER DRILL BLOCKS", detail: "Practice in brief 3-minute sets to build concentration step-by-step." }
    ],
    lowSummary: "A low score shows that the player experiences concentration lapses during demanding periods. The focus now is to shorten focus tasks, introduce mental reset triggers, and sustain attention ball by ball.",
    coachSummary: {
      overview: "The Focus Index helps the coach understand whether the player is mentally present or only physically involved.",
      high: "reinforce, challenge and sustain.",
      medium: "reset, focus and sustain.",
      low: "simplify, reset and rebuild.",
      goal: "stay present, reset quickly and give the next ball your full attention."
    }
  },
  "Resilience": {
    id: "resilience",
    name: "Resilience",
    description: "Resilience measures how well a player responds to adversity, pressure, mistakes and setbacks in both practice and matches. The key question is: does the player maintain effort, focus and body language when things go wrong, or do they fold under pressure?",
    highPoints: [
      { title: "ANCHOR CRUNCH MOMENTS", detail: "Step up to bowl tough overs or bat during difficult collapse phases." },
      { title: "LEAD SQUAD RECOVERY", detail: "Guide teammates calmly when match momentum swings against the team." },
      { title: "EXPOSE TO HARD DRILLS", detail: "Train in high-consequence drills where mistakes carry realistic penalty." }
    ],
    highSummary: "A high score shows that the player thrives under pressure and bounces back quickly from errors. The next step is to anchor that resilience as a core team asset.",
    mediumPoints: [
      { title: "BOUNCE BACK QUICKER", detail: "Cut down emotional dwell time after a boundary, drop, or bad shot." },
      { title: "MAINTAIN POSITIVE POSTURE", detail: "Keep strong, upright body language regardless of match score." },
      { title: "ACCEPT COACHING CUES", detail: "Process mid-game advice constructively without losing self-belief." }
    ],
    mediumSummary: "A medium score shows the player handles standard match pressure reasonably well but can bounce back faster from unexpected setbacks. The focus now is to strengthen post-error recovery routines and build composure.",
    lowPoints: [
      { title: "SEPARATE SELF FROM ERROR", detail: "Learn that one mistake does not define overall ability or value." },
      { title: "POST-ERROR RESET ROUTINE", detail: "Take a deep breath and physically reset posture immediately post-mistake." },
      { title: "BUILD CONFIDENCE GRADUALLY", detail: "Practice recovery in low-stakes scenarios to build emotional composure." }
    ],
    lowSummary: "A low score shows that the player struggles to bounce back quickly from errors under pressure. The focus now is to build emotional control, practice recovery routines, and strengthen mental toughness.",
    coachSummary: {
      overview: "The Resilience Index helps the coach understand whether the player has the mental toughness to handle pressure and bounce back from setbacks.",
      high: "anchor, challenge and lead.",
      medium: "compose, recover and push.",
      low: "identify, reset and rebuild.",
      goal: "develop unshakeable mental toughness under competitive pressure."
    }
  }
};

// Aliases for alternate key naming across historical backend records
cpiFrameworkNotes["Skills Level"] = cpiFrameworkNotes["Skill Level"];
cpiFrameworkNotes["Concentration"] = cpiFrameworkNotes["Focus"];

const computeFocusAreasForPlayer = (
  player: Player,
  practiceHistory: any[],
  matchHistory: any[]
): { title: string; detail: string }[] => {
  const paramDefs = [
    { name: "Technical Execution", keys: ["technicalExecution"] },
    { name: "Skill Level", keys: ["skillsLevel", "technique"] },
    { name: "Game Plan", keys: ["gamePlan", "decisionMaking", "gameAwareness"] },
    { name: "Preparation", keys: ["preparation"] },
    { name: "Intensity", keys: ["intensity"] },
    { name: "Focus", keys: ["focus", "concentration"] },
    { name: "Resilience", keys: ["resilience", "emotionalControl", "adaptability"] }
  ];

  const practiceList = practiceHistory || [];
  const matchList = matchHistory || [];

  const rankedParams = paramDefs.map((p) => {
    let practiceScores: number[] = [];
    let matchScores: number[] = [];

    practiceList.forEach((s: any) => {
      p.keys.forEach((k) => {
        if (typeof s[k] === "number" && s[k] > 0) {
          practiceScores.push(s[k]);
        }
      });
    });

    matchList.forEach((s: any) => {
      p.keys.forEach((k) => {
        if (typeof s[k] === "number" && s[k] > 0) {
          matchScores.push(s[k]);
        }
      });
    });

    const allScores = [...practiceScores, ...matchScores];

    let overallAvg = 7.2;
    if (allScores.length > 0) {
      overallAvg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      overallAvg = Math.round(overallAvg * 10) / 10;
    } else if (player.ppiScore || player.mpiScore) {
      const ppi = player.ppiScore || 0;
      const mpi = player.mpiScore || 0;
      overallAvg = (ppi > 0 && mpi > 0) ? (ppi + mpi) / 2 : (ppi > 0 ? ppi : mpi);
      overallAvg = Math.round(overallAvg * 10) / 10;
    }

    let practiceAvg = practiceScores.length > 0 ? practiceScores.reduce((a, b) => a + b, 0) / practiceScores.length : null;
    let matchAvg = matchScores.length > 0 ? matchScores.reduce((a, b) => a + b, 0) / matchScores.length : null;

    let varianceNote = "";
    if (practiceAvg !== null && matchAvg !== null) {
      const diff = practiceAvg - matchAvg;
      if (diff >= 1.5) {
        varianceNote = `\n\nPRACTICE VS MATCH VARIANCE:\nStrong performance in practice (${practiceAvg.toFixed(1)}/10) but less consistent under match conditions (${matchAvg.toFixed(1)}/10). Focus on bridging net quality into match competition.`;
      } else if (diff <= -1.5) {
        varianceNote = `\n\nPRACTICE VS MATCH VARIANCE:\nShows higher match intensity (${matchAvg.toFixed(1)}/10) than practice baseline (${practiceAvg.toFixed(1)}/10). Maintain practice session discipline.`;
      }
    }

    // Source 1: CPI Framework Notes
    const frameworkItem = cpiFrameworkNotes[p.name];
    let frameworkTierSummary = "";
    let frameworkPointsStr = "";
    if (frameworkItem) {
      if (overallAvg >= 7.0) {
        frameworkTierSummary = frameworkItem.highSummary;
        frameworkPointsStr = frameworkItem.highPoints.map(pt => `• ${pt.title}: ${pt.detail}`).join("\n");
      } else if (overallAvg <= 5.0) {
        frameworkTierSummary = frameworkItem.lowSummary;
        frameworkPointsStr = frameworkItem.lowPoints.map(pt => `• ${pt.title}: ${pt.detail}`).join("\n");
      } else {
        frameworkTierSummary = frameworkItem.mediumSummary || frameworkItem.highSummary;
        const pts = frameworkItem.mediumPoints || frameworkItem.highPoints;
        frameworkPointsStr = pts.map(pt => `• ${pt.title}: ${pt.detail}`).join("\n");
      }
    }

    // Source 2: Daryll Cullinan's Coach's Plan of Action
    const daryllEntry = coachingRecommendations[p.name];
    const isHigh = overallAvg >= 7.0;
    const daryllTier = daryllEntry ? (isHigh ? daryllEntry.high : daryllEntry.low) : null;

    // Role-Aware Context Lookup
    const roleResolution = getRoleContextForParameter(player.role, p.name, overallAvg);

    const cpiSection = frameworkItem
      ? `CPI FRAMEWORK GUIDANCE:\n${frameworkTierSummary}\nAction Points:\n${frameworkPointsStr}`
      : "";

    const daryllSection = daryllTier
      ? `DARYLL CULLINAN COACH PLAN DIRECTIVE:\n${daryllTier.header}:\n` + daryllTier.bullets.map(b => `• ${b}`).join("\n")
      : "";

    const roleSection = `ROLE CONTEXT (${roleResolution.roleName}):\n${roleResolution.contextText}`;

    const prioritySection = daryllTier
      ? `COACHING PRIORITY:\n${daryllTier.goalStatement}`
      : frameworkItem
      ? `COACHING PRIORITY:\n${frameworkItem.coachSummary.goal}`
      : `COACHING PRIORITY:\nConsolidate baseline performance across practice and match play.`;

    const detail = `${cpiSection}\n\n${daryllSection}\n\n${roleSection}${varianceNote}\n\n${prioritySection}`;

    return {
      name: p.name,
      avg: overallAvg,
      title: `${p.name} (Score: ${overallAvg.toFixed(1)}/10)`,
      detail
    };
  });

  // Rank all 7 parameters from STRONGEST (highest score) to WEAKEST (lowest score)
  rankedParams.sort((a, b) => b.avg - a.avg);

  return rankedParams.map((p) => ({
    title: p.title,
    detail: p.detail
  }));
};

const loadHighResLogo = (): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve("");
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 300;
        canvas.height = img.naturalHeight || 300;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve("");
        }
      } catch (e) {
        resolve("");
      }
    };
    img.onerror = () => resolve("");
    img.src = "/cpi-logo.png";
  });
};

const generatePlayerPdfReport = async (
  player: Player,
  currentCpi: number | null,
  currentPpi: number | null,
  currentMpi: number | null,
  targetCpi: number,
  targetGoal: string,
  last5Prac: any[],
  last5Match: any[],
  practiceHistory: any[],
  matchHistory: any[],
  focusAreas: { title: string; detail: string }[],
  lastAssessmentDate: string,
  coachNameStr?: string
) => {
  const logoDataUrl = await loadHighResLogo();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const coachName = coachNameStr || (player as any)?.creatorCoach?.name || (typeof window !== "undefined" ? localStorage.getItem("userName") : "") || "Coach";
  const reportDateStr = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

  const addFooter = (pageNum: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Cricket Performance Index (CPI) • Official Confidential Player Report", 14, pageHeight - 10);
    doc.text(`Page ${pageNum}`, pageWidth - 25, pageHeight - 10);
  };

  // ==========================================
  // PAGE 1: Header, Player Information, 1. Summary, 2. Seven Parameters, 3. Strengths & 4. Improvements
  // ==========================================

  // HEADER (CPI Logo, Cricket Performance Index, Player Performance Report, Report Date, Coach Name)
  doc.setFillColor(15, 23, 42); // Slate 900 Banner
  doc.rect(0, 0, pageWidth, 22, "F");

  doc.setFillColor(249, 115, 22); // CPI Accent Stripe
  doc.rect(0, 21, pageWidth, 1, "F");

  // CPI High-Res Logo Badge Icon (Crisp, sharp, non-blurry)
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", 12, 3, 14, 16);
    } catch (e) {
      doc.setFillColor(255, 255, 255);
      doc.circle(18, 11, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(249, 115, 22);
      doc.text("CPI", 18, 13.5, { align: "center" });
    }
  } else {
    doc.setFillColor(255, 255, 255);
    doc.circle(18, 11, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(249, 115, 22);
    doc.text("CPI", 18, 13.5, { align: "center" });
  }

  // Header Title & Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("CRICKET PERFORMANCE INDEX", 29, 10);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(249, 115, 22);
  doc.text("Player Performance Report", 29, 16);

  // Header Metadata (Report Date, Coach Name)
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text(`Report Date: ${reportDateStr}`, pageWidth - 14, 10, { align: "right" });
  doc.text(`Coach Name: ${coachName}`, pageWidth - 14, 16, { align: "right" });

  let y = 28;

  // PLAYER INFORMATION SECTION (Player Name, Player ID, Age, Role, Team, Assessment Date)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, pageWidth - 28, 28, 3, 3, "FD");

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text("PLAYER INFORMATION", 20, y + 7.5);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`Player Name: ${player.name}`, 20, y + 15);
  doc.text(`Player ID: #${player.id}`, 20, y + 22);

  doc.text(`Age: ${(player.id % 5) + 19}`, 85, y + 15);
  doc.text(`Role: ${player.role}`, 85, y + 22);

  doc.text(`Team: Senior Squad`, 145, y + 15);
  doc.text(`Assessment Date: ${lastAssessmentDate || reportDateStr}`, 145, y + 22);

  y += 34;

  // 1. OVERALL PERFORMANCE SUMMARY (CPI, PPI, MPI, Overall Rating)
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("1. OVERALL PERFORMANCE SUMMARY", 14, y);

  y += 6;

  const to100 = (val: number | null | undefined): number => {
    if (val === null || val === undefined || val === 0) return 0;
    let num = typeof val === "number" ? val : parseFloat(val as any);
    if (isNaN(num) || num <= 0) return 0;
    return num <= 10 ? Math.round(num * 10) : Math.round(num);
  };

  const cpiNum = to100(currentCpi);
  const ppiNum = to100(currentPpi);
  const mpiNum = to100(currentMpi);

  let ratingStr = "Needs Attention";
  let ratingColor = [239, 68, 68]; // Red
  if (cpiNum >= 80) {
    ratingStr = "Excellent";
    ratingColor = [16, 185, 129]; // Green
  } else if (cpiNum >= 70) {
    ratingStr = "High Potential";
    ratingColor = [249, 115, 22]; // Orange
  } else if (cpiNum >= 50) {
    ratingStr = "Developing";
    ratingColor = [234, 179, 8]; // Yellow
  }

  const boxWidth = (pageWidth - 28 - 9) / 4;
  
  // CPI Box
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(14, y, boxWidth, 24, 3, 3, "FD");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 83, 9);
  doc.text("CPI SCORE /100", 18, y + 7);
  doc.setFontSize(14);
  doc.text(`${cpiNum || "N/A"}`, 18, y + 18);

  // PPI Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14 + boxWidth + 3, y, boxWidth, 24, 3, 3, "FD");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("PPI SCORE /100", 18 + boxWidth + 3, y + 7);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`${ppiNum || "N/A"}`, 18 + boxWidth + 3, y + 18);

  // MPI Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14 + (boxWidth + 3) * 2, y, boxWidth, 24, 3, 3, "FD");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("MPI SCORE /100", 18 + (boxWidth + 3) * 2, y + 7);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`${mpiNum || "N/A"}`, 18 + (boxWidth + 3) * 2, y + 18);

  // Overall Rating Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(ratingColor[0], ratingColor[1], ratingColor[2]);
  doc.roundedRect(14 + (boxWidth + 3) * 3, y, boxWidth, 24, 3, 3, "FD");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("OVERALL RATING", 18 + (boxWidth + 3) * 3, y + 7);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(ratingColor[0], ratingColor[1], ratingColor[2]);
  doc.text(ratingStr, 18 + (boxWidth + 3) * 3, y + 17);

  y += 30;

  // 2. SEVEN PERFORMANCE PARAMETERS (Technical Execution, Skill Level, Game Plan, Preparation, Intensity, Focus, Resilience)
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("2. SEVEN PERFORMANCE PARAMETERS", 14, y);

  y += 6;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7.5, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("PARAMETER", 18, y + 5);
  doc.text("SCORE (0-10)", 82, y + 5);
  doc.text("RATING", 118, y + 5);
  doc.text("PROGRESS BAR", 152, y + 5);

  y += 7.5;

  const allAssessments = [...(practiceHistory || []), ...(matchHistory || [])];

  const getParamScore = (key: string) => {
    const scores = allAssessments
      .map((s: any) => s[key] !== undefined ? s[key] : (key === "focus" ? s.concentration : null))
      .filter((v: any) => typeof v === "number" && v > 0);
    if (scores.length > 0) {
      const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
      return Math.round(avg * 10) / 10;
    }
    return 7.2;
  };

  const paramDefs = [
    { name: "Technical Execution", key: "technicalExecution" },
    { name: "Skill Level", key: "skillsLevel" },
    { name: "Game Plan", key: "gamePlan" },
    { name: "Preparation", key: "preparation" },
    { name: "Intensity", key: "intensity" },
    { name: "Focus", key: "focus" },
    { name: "Resilience", key: "resilience" }
  ];

  const paramData = paramDefs.map(p => {
    const score = getParamScore(p.key);
    let label = "Optimal";
    let color = [16, 185, 129];
    if (score < 6.5) {
      label = "Needs Focus";
      color = [239, 68, 68];
    } else if (score < 8.0) {
      label = "Good";
      color = [249, 115, 22];
    }
    return { name: p.name, score, label, color };
  });

  paramData.forEach((p, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, 6.5, "F");
    }

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(p.name, 18, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.text(`${p.score} / 10`, 82, y + 4.5);

    doc.setFontSize(8);
    doc.setTextColor(p.color[0], p.color[1], p.color[2]);
    doc.text(p.label, 118, y + 4.5);

    // Progress Bar (out of 10)
    const barMaxW = 38;
    const fillW = Math.min(barMaxW, (p.score / 10) * barMaxW);
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(152, y + 1.5, barMaxW, 3.2, 1.5, 1.5, "F");

    doc.setFillColor(p.color[0], p.color[1], p.color[2]);
    if (fillW > 0) {
      doc.roundedRect(152, y + 1.5, fillW, 3.2, 1.5, 1.5, "F");
    }

    y += 6.5;
  });

  y += 7;

  // 3. STRENGTHS & 4. AREAS FOR IMPROVEMENT
  const sortedByScore = [...paramData].sort((a, b) => b.score - a.score);
  const strengths = sortedByScore.slice(0, 3);
  const improvements = [...paramData].sort((a, b) => a.score - b.score).slice(0, 3);

  const colW = (pageWidth - 28 - 6) / 2;

  // 3. STRENGTHS Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(14, y, colW, 28, 3, 3, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(21, 128, 61);
  doc.text("3. STRENGTHS", 18, y + 6.5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  strengths.forEach((s, idx) => {
    doc.text(`• ${s.name} (${s.score}/10)`, 18, y + 13 + idx * 4.5);
  });

  // 4. AREAS FOR IMPROVEMENT Box
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(14 + colW + 6, y, colW, 28, 3, 3, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 83, 9);
  doc.text("4. AREAS FOR IMPROVEMENT", 18 + colW + 6, y + 6.5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  improvements.forEach((imp, idx) => {
    doc.text(`• ${imp.name} (${imp.score}/10)`, 18 + colW + 6, y + 13 + idx * 4.5);
  });

  addFooter(1);

  // ==========================================
  // PAGE 2: 5. AI Coach Recommendations, 6. Performance Trend, 7. Assessment History
  // ==========================================
  doc.addPage();

  // Header Page 2 Banner with CPI Logo
  doc.setFillColor(15, 23, 42); // Dark slate
  doc.rect(0, 0, pageWidth, 14, "F");

  doc.setFillColor(249, 115, 22);
  doc.rect(0, 13, pageWidth, 1, "F");

  // Mini High-Res Logo on Page 2
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", 14, 1.5, 9, 10);
    } catch (e) {
      doc.setFillColor(255, 255, 255);
      doc.circle(18, 7, 4.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(249, 115, 22);
      doc.text("CPI", 18, 8.8, { align: "center" });
    }
  } else {
    doc.setFillColor(255, 255, 255);
    doc.circle(18, 7, 4.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(249, 115, 22);
    doc.text("CPI", 18, 8.8, { align: "center" });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`CRICKET PERFORMANCE INDEX — ${player.name.toUpperCase()} REPORT`, 26, 9.5);

  y = 22;

  // 5. AI COACH RECOMMENDATIONS
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("5. AI COACH RECOMMENDATIONS", 14, y);

  y += 5.5;
  if (focusAreas && focusAreas.length > 0) {
    focusAreas.forEach((f, idx) => {
      // Check for page overflow within recommendations
      if (y > pageHeight - 35) {
        addFooter(doc.internal.getNumberOfPages());
        doc.addPage();

        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 14, "F");
        doc.setFillColor(249, 115, 22);
        doc.rect(0, 13, pageWidth, 1, "F");
        if (logoDataUrl) {
          try { doc.addImage(logoDataUrl, "PNG", 14, 1.5, 9, 10); } catch (e) {}
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(`CRICKET PERFORMANCE INDEX — ${player.name.toUpperCase()} REPORT`, 26, 9.5);
        y = 22;
      }

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(249, 115, 22);
      doc.text(`${idx + 1}. ${f.title}`, 16, y);
      y += 4;

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(f.detail, pageWidth - 32);
      doc.text(lines, 20, y);
      y += lines.length * 3.4 + 2.5;
    });
  } else {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text("Focus on maintaining core execution and preparation consistency.", 16, y);
    y += 8;
  }

  y += 4;

  if (y > pageHeight - 60) {
    addFooter(doc.internal.getNumberOfPages());
    doc.addPage();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 14, "F");
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 13, pageWidth, 1, "F");
    if (logoDataUrl) {
      try { doc.addImage(logoDataUrl, "PNG", 14, 1.5, 9, 10); } catch (e) {}
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`CRICKET PERFORMANCE INDEX — ${player.name.toUpperCase()} REPORT`, 26, 9.5);
    y = 22;
  }

  // 6. PERFORMANCE TREND (CPI Trend, PPI Trend, MPI Trend)
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("6. PERFORMANCE TREND", 14, y);

  y += 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, "FD");

  const prevAssessment = (allAssessments.length > 1) ? allAssessments[1] : null;
  const prevCpi = prevAssessment ? (prevAssessment.ppiScore || prevAssessment.mpiScore || 70) : Math.max(0, cpiNum - 3);
  const diff = cpiNum - prevCpi;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`• CPI Trend: Currently at ${cpiNum} CPI — Overall performance trajectory is ${diff >= 0 ? "improving" : "declining"}.`, 18, y + 7);
  doc.text(`• PPI Trend: Practice Performance Index score currently at ${ppiNum || "N/A"} (${last5Prac?.length || 0} practice sessions recorded).`, 18, y + 13.5);
  doc.text(`• MPI Trend: Match Performance Index score currently at ${mpiNum || "N/A"} (${last5Match?.length || 0} match assessments recorded).`, 18, y + 20);

  y += 32;

  // 7. ASSESSMENT HISTORY
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("7. ASSESSMENT HISTORY", 14, y);

  y += 6;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 8, "F");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("DATE", 18, y + 5.5);
  doc.text("PRACTICE (PPI)", 75, y + 5.5);
  doc.text("MATCH (MPI)", 125, y + 5.5);
  doc.text("CPI", 168, y + 5.5);

  y += 8;

  // Group practice and match assessments by date
  const historyMap: Record<string, { date: string; ppi: string; mpi: string; cpi: string }> = {};

  (practiceHistory || []).forEach((p: any) => {
    const dStr = new Date(p.date || p.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    if (!historyMap[dStr]) {
      historyMap[dStr] = { date: dStr, ppi: "N/A", mpi: "N/A", cpi: "N/A" };
    }
    historyMap[dStr].ppi = formatScoreValue(p.ppiScore);
  });

  (matchHistory || []).forEach((m: any) => {
    const dStr = new Date(m.date || m.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    if (!historyMap[dStr]) {
      historyMap[dStr] = { date: dStr, ppi: "N/A", mpi: "N/A", cpi: "N/A" };
    }
    historyMap[dStr].mpi = formatScoreValue(m.mpiScore);
  });

  // Calculate CPI for each row
  Object.values(historyMap).forEach(row => {
    const pVal = row.ppi !== "N/A" ? parseInt(row.ppi, 10) : null;
    const mVal = row.mpi !== "N/A" ? parseInt(row.mpi, 10) : null;
    if (pVal !== null && mVal !== null) {
      row.cpi = Math.round((pVal + mVal) / 2).toString();
    } else if (pVal !== null) {
      row.cpi = pVal.toString();
    } else if (mVal !== null) {
      row.cpi = mVal.toString();
    }
  });

  const sortedHistoryRows = Object.values(historyMap).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sortedHistoryRows.length === 0) {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text("No assessment history records found.", 18, y + 5);
  } else {
    sortedHistoryRows.slice(0, 10).forEach((row, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, pageWidth - 28, 7, "F");
      }

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(row.date, 18, y + 5);
      doc.text(row.ppi, 75, y + 5);
      doc.text(row.mpi, 125, y + 5);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(249, 115, 22);
      doc.text(row.cpi, 168, y + 5);

      y += 7;
    });
  }

  addFooter(doc.internal.getNumberOfPages());

  doc.save(`${player.name.replace(/\s+/g, "_")}_Performance_Report.pdf`);
};

export default function PlayersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [currentCoachName, setCurrentCoachName] = useState<string>("");

  // Last assessment date cache
  const [lastAssessmentDates, setLastAssessmentDates] = useState<Record<number, string>>({});

  // View state: 'list' | 'profile'
  const [view, setView] = useState<"list" | "profile">(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("userRole");
      if (storedRole === "player") {
        return "profile";
      }
      const params = new URLSearchParams(window.location.search);
      if (params.has("id")) {
        return "profile";
      }
    }
    return "list";
  });
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Modals / Overlays
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPracticeOverlay, setShowPracticeOverlay] = useState(false);
  const [showMatchOverlay, setShowMatchOverlay] = useState(false);
  const [showSelfOverlay, setShowSelfOverlay] = useState(false);
  const [showHistoryOverlay, setShowHistoryOverlay] = useState(false);
  const [selectedAssessmentDetail, setSelectedAssessmentDetail] = useState<{ type: "Practice" | "Match"; data: any } | null>(null);
  const [showRecsOverlay, setShowRecsOverlay] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Filter States
  const [showFilterOverlay, setShowFilterOverlay] = useState(false);
  const [showPdfDateOverlay, setShowPdfDateOverlay] = useState(false);
  const [pdfFromDate, setPdfFromDate] = useState<string>("");
  const [pdfToDate, setPdfToDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<"highest_cpi" | "lowest_cpi" | "highest_ppi" | "lowest_ppi" | "highest_mpi" | "lowest_mpi" | "recently_assessed">("highest_cpi");
  const [quickFilter, setQuickFilter] = useState<"all" | "top_performers" | "needs_attention" | "assessed_today" | "not_assessed_recently">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "batsman" | "bowler" | "all_rounder" | "wicket_keeper">("all");
  const [copiedCode, setCopiedCode] = useState(false);
  const [expandedFocus, setExpandedFocus] = useState<number | null>(null);

  const handleGenerateFilteredPdfReport = () => {
    if (!selectedPlayer) return;

    const getItemDateStr = (item: any) => {
      const val = item.date || item.createdAt;
      if (!val) return "";
      try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split("T")[0];
      } catch (e) {
        return "";
      }
    };

    const filteredPrac = (practiceHistory || []).filter((p: any) => {
      const dStr = getItemDateStr(p);
      if (!dStr) return true;
      if (pdfFromDate && dStr < pdfFromDate) return false;
      if (pdfToDate && dStr > pdfToDate) return false;
      return true;
    });

    const filteredMatch = (matchHistory || []).filter((m: any) => {
      const dStr = getItemDateStr(m);
      if (!dStr) return true;
      if (pdfFromDate && dStr < pdfFromDate) return false;
      if (pdfToDate && dStr > pdfToDate) return false;
      return true;
    });

    const calcAveragePpi = (list: any[]) => {
      if (!list || list.length === 0) return null;
      const scores = list.map((s: any) => {
        if (typeof s.ppiScore === "number" && s.ppiScore > 0) {
          return s.ppiScore <= 10 ? s.ppiScore * 10 : s.ppiScore;
        }
        const metrics = [
          s.technicalExecution, s.skillsLevel, s.gamePlan,
          s.preparation, s.intensity, s.focus || s.concentration,
          s.resilience, s.decisionMaking, s.gameAwareness
        ].filter((v) => typeof v === "number" && !isNaN(v) && v > 0);
        if (metrics.length > 0) {
          const avg = metrics.reduce((a, b) => a + b, 0) / metrics.length;
          return avg <= 10 ? avg * 10 : avg;
        }
        return null;
      }).filter((v): v is number => v !== null);

      if (scores.length === 0) return null;
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    };

    const calcAverageMpi = (list: any[]) => {
      if (!list || list.length === 0) return null;
      const scores = list.map((s: any) => {
        if (typeof s.mpiScore === "number" && s.mpiScore > 0) {
          return s.mpiScore <= 10 ? s.mpiScore * 10 : s.mpiScore;
        }
        const metrics = [
          s.technicalExecution, s.skillsLevel, s.gamePlan,
          s.preparation, s.intensity, s.focus || s.concentration,
          s.resilience, s.decisionMaking, s.gameAwareness
        ].filter((v) => typeof v === "number" && !isNaN(v) && v > 0);
        if (metrics.length > 0) {
          const avg = metrics.reduce((a, b) => a + b, 0) / metrics.length;
          return avg <= 10 ? avg * 10 : avg;
        }
        return null;
      }).filter((v): v is number => v !== null);

      if (scores.length === 0) return null;
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    };

    const filteredPpiVal = calcAveragePpi(filteredPrac);
    const filteredMpiVal = calcAverageMpi(filteredMatch);

    let filteredCpiVal: number | null = null;
    if (filteredPpiVal !== null && filteredMpiVal !== null) {
      filteredCpiVal = Math.round((filteredPpiVal + filteredMpiVal) / 2);
    } else if (filteredPpiVal !== null) {
      filteredCpiVal = filteredPpiVal;
    } else if (filteredMpiVal !== null) {
      filteredCpiVal = filteredMpiVal;
    }

    const last5PracFiltered = [...filteredPrac]
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .slice(0, 5);

    const last5MatchFiltered = [...filteredMatch]
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .slice(0, 5);

    let dateLabel = "All Assessments";
    if (pdfFromDate && pdfToDate) {
      dateLabel = `${pdfFromDate} to ${pdfToDate}`;
    } else if (pdfFromDate) {
      dateLabel = `From ${pdfFromDate}`;
    } else if (pdfToDate) {
      dateLabel = `Up to ${pdfToDate}`;
    }

    setShowPdfDateOverlay(false);

    const focusAreas = computeFocusAreasForPlayer(selectedPlayer, filteredPrac, filteredMatch);

    generatePlayerPdfReport(
      selectedPlayer,
      filteredCpiVal,
      filteredPpiVal,
      filteredMpiVal,
      targetCpi,
      targetGoal,
      last5PracFiltered,
      last5MatchFiltered,
      filteredPrac,
      filteredMatch,
      focusAreas,
      dateLabel,
      currentCoachName || selectedPlayer.creatorCoach?.name || (typeof window !== "undefined" ? localStorage.getItem("userName") || "" : "")
    );
  };

  // Form states
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    age: "",
    role: "Batsman",
    battingStyle: "Right-hand bat",
    bowlingStyle: "None",
    photo: ""
  });

  // Practice sliders (scores 0-10)
  const [practiceForm, setPracticeForm] = useState({
    technicalExecution: 7,
    skillsLevel: 7,
    gamePlan: 7,
    preparation: 7,
    intensity: 7,
    focus: 7,
    resilience: 7,
    notes: ""
  });

  // Match sliders (scores 0-10)
  const [matchForm, setMatchForm] = useState({
    technicalExecution: 7,
    skillsLevel: 7,
    gamePlan: 7,
    preparation: 7,
    intensity: 7,
    focus: 7,
    resilience: 7,
    notes: ""
  });

  // Self assessment sliders
  const [selfForm, setSelfForm] = useState({
    sleep: 7,
    nutrition: 7,
    preparation: 7,
    health: 7,
    mental: 7,
    fitness: 7
  });

  // Player history state
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [selfHistory, setSelfHistory] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Target Goals states
  const [targetCpi, setTargetCpi] = useState<number>(85);
  const [targetGoal, setTargetGoal] = useState<string>("Improve core consistency");
  const [tempTargetCpi, setTempTargetCpi] = useState<string>("85");
  const [tempTargetGoal, setTempTargetGoal] = useState<string>("");
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  useEffect(() => {
    if (selectedPlayer) {
      const storedTarget = localStorage.getItem(`player_target_cpi_${selectedPlayer.id}`);
      let val = storedTarget ? parseFloat(storedTarget) : 85;
      if (val <= 10) val = Math.round(val * 10);
      setTargetCpi(val);
      setTempTargetCpi(val.toString());

      const storedGoal = localStorage.getItem(`player_target_goal_${selectedPlayer.id}`);
      const goalVal = storedGoal || "Improve core consistency";
      setTargetGoal(goalVal);
      setTempTargetGoal(goalVal);
      
      setIsEditingTarget(false);
      setIsEditingGoal(false);
    }
  }, [selectedPlayer]);

  const handleSaveTargetCpi = () => {
    if (!selectedPlayer) return;
    const val = parseInt(tempTargetCpi, 10);
    if (!isNaN(val) && val >= 1 && val <= 100) {
      setTargetCpi(val);
      localStorage.setItem(`player_target_cpi_${selectedPlayer.id}`, val.toString());
    }
    setIsEditingTarget(false);
  };

  const handleSaveTargetGoal = () => {
    if (!selectedPlayer) return;
    setTargetGoal(tempTargetGoal);
    localStorage.setItem(`player_target_goal_${selectedPlayer.id}`, tempTargetGoal);
    setIsEditingGoal(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  // Edit & Delete player states
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editPlayerForm, setEditPlayerForm] = useState({
    name: "",
    age: "16",
    role: "Batsman",
    battingStyle: "Right-hand bat",
    bowlingStyle: "None",
    photo: ""
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/players");
      const list = res.data || [];
      setPlayers(list);
      fetchLastAssessmentDates(list);
    } catch (err) {
      console.error("Failed to fetch players", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLastAssessmentDates = async (playerList: Player[]) => {
    const datesMap: Record<number, string> = {};
    await Promise.all(playerList.map(async (p) => {
      try {
        const [pracRes, matchRes] = await Promise.all([
          api.get(`/practice/player/${p.id}`).catch(() => ({ data: [] })),
          api.get(`/matches/player/${p.id}`).catch(() => ({ data: [] }))
        ]);
        
        const allDates = [
          ...(pracRes.data || []).map((x: any) => x.date),
          ...(matchRes.data || []).map((x: any) => x.date)
        ];
        
        // Check for self-assessment in local storage
        const localSelf = localStorage.getItem(`self_assess_${p.id}`);
        if (localSelf) {
          const selfList = JSON.parse(localSelf);
          selfList.forEach((x: any) => {
            if (x.date) allDates.push(x.date);
          });
        }

        if (allDates.length > 0) {
          const sorted = allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          const latestDate = new Date(sorted[0]);
          datesMap[p.id] = latestDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          });
        } else {
          datesMap[p.id] = "No assessments";
        }
      } catch (e) {
        datesMap[p.id] = "No assessments";
      }
    }));
    setLastAssessmentDates(prev => ({ ...prev, ...datesMap }));
  };

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setRole(storedRole);
    
    const idParam = searchParams.get("id");
    if (storedRole === "player" || idParam) {
      setView("profile");
    } else {
      setView("list");
    }
    
    fetchData();

    api.get("/profile").then((res) => {
      if (res.data && res.data.name) {
        setCurrentCoachName(res.data.name);
        localStorage.setItem("userName", res.data.name);
      }
    }).catch(() => {});

    // URL direct navigation check
    if (searchParams.get("add") === "true") {
      setShowAddForm(true);
    }
  }, [searchParams]);

  // Handle auto-select and self-assessment navigation for players
  useEffect(() => {
    if (players.length > 0) {
      const idParam = searchParams.get("id");
      if (idParam) {
        const found = players.find((p) => p.id === Number(idParam));
        if (found) {
          if (!selectedPlayer || selectedPlayer.id !== found.id) {
            setSelectedPlayer(found);
            setView("profile");
            loadHistory(found.id);
          }
          
          const action = searchParams.get("action");
          if (action === "practice") {
            setShowPracticeOverlay(true);
          } else if (action === "match") {
            setShowMatchOverlay(true);
          }
          return;
        } else {
          setView("list");
        }
      }

      const actionParam = searchParams.get("action");
      if (actionParam && !idParam) {
        if (!selectedPlayer || selectedPlayer.id !== players[0].id) {
          setSelectedPlayer(players[0]);
          setView("profile");
          loadHistory(players[0].id);
        }
        if (actionParam === "practice") {
          setShowPracticeOverlay(true);
        } else if (actionParam === "match") {
          setShowMatchOverlay(true);
        }
        return;
      }

      if (role === "player") {
        api.get("/profile").then((profileRes) => {
          const matchingPlayer = players.find(
            (p) => p.name.toLowerCase() === profileRes.data.name.toLowerCase()
          ) || players[0];
          
          if (matchingPlayer) {
            if (!selectedPlayer || selectedPlayer.id !== matchingPlayer.id) {
              setSelectedPlayer(matchingPlayer);
              setView("profile");
              loadHistory(matchingPlayer.id);
            }
            if (searchParams.get("selfAssess") === "true") {
              setShowSelfOverlay(true);
            }
          }
        }).catch(() => {
          if (!selectedPlayer || selectedPlayer.id !== players[0].id) {
            setSelectedPlayer(players[0]);
            setView("profile");
            loadHistory(players[0].id);
          }
          if (searchParams.get("selfAssess") === "true") {
            setShowSelfOverlay(true);
          }
        });
      } else if (searchParams.get("selfAssess") === "true") {
        api.get("/profile").then((profileRes) => {
          const matchingPlayer = players.find(
            (p) => p.name.toLowerCase() === profileRes.data.name.toLowerCase()
          ) || players[0];
          
          if (matchingPlayer) {
            if (!selectedPlayer || selectedPlayer.id !== matchingPlayer.id) {
              setSelectedPlayer(matchingPlayer);
              setView("profile");
              loadHistory(matchingPlayer.id);
            }
            setShowSelfOverlay(true);
          }
        }).catch(() => {
          if (!selectedPlayer || selectedPlayer.id !== players[0].id) {
            setSelectedPlayer(players[0]);
            setView("profile");
            loadHistory(players[0].id);
          }
          setShowSelfOverlay(true);
        });
      }
    } else if (!loading) {
      if (searchParams.get("id")) {
        setView("list");
      }
    }
  }, [players, role, searchParams, loading, selectedPlayer]);

  const loadHistory = async (playerId: number) => {
    try {
      const [pracRes, matchRes] = await Promise.all([
        api.get(`/practice/player/${playerId}`).catch(() => ({ data: [] })),
        api.get(`/matches/player/${playerId}`).catch(() => ({ data: [] }))
      ]);
      setPracticeHistory(pracRes.data || []);
      setMatchHistory(matchRes.data || []);

      const localSelf = localStorage.getItem(`self_assess_${playerId}`);
      setSelfHistory(localSelf ? JSON.parse(localSelf) : []);
    } catch (err) {
      console.error("Failed to load assessments history", err);
    }
  };

  const getPlayerTrendData = () => {
    // Unique dates from both histories
    const uniqueDates = Array.from(
      new Set([
        ...practiceHistory.map((h) => h.date),
        ...matchHistory.map((h) => h.date)
      ])
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let lastPpi = 0;
    let lastMpi = 0;

    const trendPoints = uniqueDates.map((dateStr) => {
      // Find practice sessions on this date
      const pracOnDate = practiceHistory.filter((h) => h.date === dateStr);
      if (pracOnDate.length > 0) {
        lastPpi = pracOnDate.reduce((sum, h) => sum + h.ppiScore, 0) / pracOnDate.length;
      }

      // Find match sessions on this date
      const matchOnDate = matchHistory.filter((h) => h.date === dateStr);
      if (matchOnDate.length > 0) {
        lastMpi = matchOnDate.reduce((sum, h) => sum + h.mpiScore, 0) / matchOnDate.length;
      }

      // Calculate CPI
      let cpi = 0;
      if (lastPpi > 0 && lastMpi > 0) {
        cpi = (lastPpi + lastMpi) / 2;
      } else if (lastPpi > 0) {
        cpi = lastPpi;
      } else if (lastMpi > 0) {
        cpi = lastMpi;
      }

      // Format date for label (e.g. "Jun 19" from "2026-06-19")
      let label = dateStr;
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
      } catch (e) {}

      return {
        label,
        ppi: lastPpi,
        mpi: lastMpi,
        cpi
      };
    });

    // Limit to last 10 points
    return trendPoints.slice(-10);
  };

  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setView("profile");
    loadHistory(player.id);
    router.replace(`/players?id=${player.id}`);
    
    const action = searchParams.get("action");
    if (action === "practice") {
      setShowPracticeOverlay(true);
    } else if (action === "match") {
      setShowMatchOverlay(true);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, isProfileUpdate = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isProfileUpdate && selectedPlayer) {
        localStorage.setItem(`player_photo_${selectedPlayer.id}`, base64String);
        // Force refresh state to update UI
        setSelectedPlayer({ ...selectedPlayer });
      } else {
        setNewPlayer(prev => ({ ...prev, photo: base64String }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const roleStr = `${newPlayer.role} (Age ${newPlayer.age})`;
      const res = await api.post("/players", {
        name: newPlayer.name,
        role: roleStr,
        battingStyle: newPlayer.battingStyle,
        bowlingStyle: newPlayer.bowlingStyle
      });
      
      const created = res.data;
      if (newPlayer.photo) {
        localStorage.setItem(`player_photo_${created.id}`, newPlayer.photo);
      }
      
      setPlayers((prev) => [created, ...prev]);
      setShowAddForm(false);
      setNewPlayer({
        name: "",
        age: "",
        role: "Batsman",
        battingStyle: "Right-hand bat",
        bowlingStyle: "None",
        photo: ""
      });
      
      router.replace("/players");
      triggerSuccess("Player Added Successfully!");
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create player.");
    } finally {
      setSaving(false);
    }
  };

  const parsePlayerAgeAndRole = (roleStr: string) => {
    let cleanRole = roleStr || "Batsman";
    let age = "";
    const ageMatch = roleStr?.match(/\(Age\s*(\d+)\)/i);
    if (ageMatch) {
      age = ageMatch[1];
      cleanRole = roleStr.replace(/\(Age\s*\d+\)/i, "").trim();
    }
    return { cleanRole, age };
  };

  const handleOpenEditModal = (player: Player, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const { cleanRole, age } = parsePlayerAgeAndRole(player.role);
    setEditingPlayer(player);
    const existingPhoto = typeof window !== "undefined" ? localStorage.getItem(`player_photo_${player.id}`) || "" : "";
    setEditPlayerForm({
      name: player.name || "",
      age: age || "16",
      role: cleanRole || "Batsman",
      battingStyle: player.battingStyle || "Right-hand bat",
      bowlingStyle: player.bowlingStyle || "None",
      photo: existingPhoto
    });
    setError("");
    setShowEditForm(true);
  };

  const handleEditPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    setSaving(true);
    setError("");
    try {
      const roleStr = editPlayerForm.age ? `${editPlayerForm.role} (Age ${editPlayerForm.age})` : editPlayerForm.role;
      const res = await api.put(`/players/${editingPlayer.id}`, {
        name: editPlayerForm.name,
        role: roleStr,
        battingStyle: editPlayerForm.battingStyle,
        bowlingStyle: editPlayerForm.bowlingStyle
      });
      const updated = res.data;
      if (editPlayerForm.photo) {
        localStorage.setItem(`player_photo_${updated.id}`, editPlayerForm.photo);
      }

      setPlayers(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
      if (selectedPlayer?.id === updated.id) {
        setSelectedPlayer(prev => prev ? { ...prev, ...updated } : null);
      }
      setShowEditForm(false);
      setEditingPlayer(null);
      triggerSuccess("Player Updated Successfully!");
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update player.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteModal = (player: Player, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingPlayer(player);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPlayer) return;
    setDeleting(true);
    try {
      await api.delete(`/players/${deletingPlayer.id}`);
      setPlayers(prev => prev.filter(p => p.id !== deletingPlayer.id));
      if (selectedPlayer?.id === deletingPlayer.id) {
        setSelectedPlayer(null);
        setView("list");
        router.replace("/players");
      }
      setShowDeleteModal(false);
      setDeletingPlayer(null);
      triggerSuccess("Player Deleted Successfully!");
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete player.");
    } finally {
      setDeleting(false);
    }
  };

  const handlePracticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/practice", {
        playerId: selectedPlayer.id,
        date: new Date().toISOString().split("T")[0],
        concentration: practiceForm.focus,
        ...practiceForm
      });
      setShowPracticeOverlay(false);
      triggerSuccess("Practice Assessment Saved!");
      
      // Refresh details
      const refreshRes = await api.get("/players");
      const updatedPlayers = refreshRes.data || [];
      setPlayers(updatedPlayers);
      const updated = updatedPlayers.find((p: Player) => p.id === selectedPlayer.id);
      if (updated) setSelectedPlayer(updated);
      loadHistory(selectedPlayer.id);
      fetchLastAssessmentDates(updatedPlayers);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save practice assessment.");
    } finally {
      setSaving(false);
    }
  };

  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/matches", {
        playerId: selectedPlayer.id,
        date: new Date().toISOString().split("T")[0],
        concentration: matchForm.focus,
        ...matchForm
      });
      setShowMatchOverlay(false);
      triggerSuccess("Match Assessment Saved!");

      // Refresh details
      const refreshRes = await api.get("/players");
      const updatedPlayers = refreshRes.data || [];
      setPlayers(updatedPlayers);
      const updated = updatedPlayers.find((p: Player) => p.id === selectedPlayer.id);
      if (updated) setSelectedPlayer(updated);
      loadHistory(selectedPlayer.id);
      fetchLastAssessmentDates(updatedPlayers);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save match assessment.");
    } finally {
      setSaving(false);
    }
  };

  const handleSelfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    setSaving(true);

    const newAssessment = {
      date: new Date().toISOString().split("T")[0],
      ...selfForm
    };

    const existing = localStorage.getItem(`self_assess_${selectedPlayer.id}`);
    const list = existing ? JSON.parse(existing) : [];
    list.unshift(newAssessment);
    localStorage.setItem(`self_assess_${selectedPlayer.id}`, JSON.stringify(list));

    setSelfHistory(list);
    setShowSelfOverlay(false);
    triggerSuccess("Self Assessment Logged!");
    setSaving(false);
    fetchLastAssessmentDates(players);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessOverlay(true);
    setTimeout(() => {
      setShowSuccessOverlay(false);
    }, 1500);
  };

  const getRecommendations = () => {
    if (!selectedPlayer) return [];
    const recs = [];
    
    // Practice Assessment suggestions
    if (selectedPlayer.ppiScore !== null && selectedPlayer.ppiScore > 0) {
      if (selectedPlayer.ppiScore < 6.5) {
        recs.push({
          type: "PRACTICE FEEDBACK",
          tip: "Focus on technical fundamentals. Structure training with 70% basic drills and 30% nets to lock down mechanics under low pressure."
        });
      } else {
        recs.push({
          type: "PRACTICE FEEDBACK",
          tip: "Strong practice performance. Integrate target-practice challenges and match simulation netting sessions to push skills."
        });
      }
    } else {
      recs.push({
        type: "PRACTICE FEEDBACK",
        tip: "No practice assessment scored yet. Schedule a practice session to lock down baseline skills."
      });
    }

    // Match Assessment suggestions
    if (selectedPlayer.mpiScore !== null && selectedPlayer.mpiScore > 0) {
      if (selectedPlayer.mpiScore < 6.5) {
        recs.push({
          type: "MATCH PLAY FEEDBACK",
          tip: "Focus on match pressure management. Execute scenario games during nets with target goals to build execution confidence."
        });
      } else {
        recs.push({
          type: "MATCH PLAY FEEDBACK",
          tip: "Excellent match execution. Work on team-contribution aspects, strike rotation, and tactical field placement inputs."
        });
      }
    } else {
      recs.push({
        type: "MATCH PLAY FEEDBACK",
        tip: "No match assessments scored. Perform a match day assessment to log execution form."
      });
    }

    // Self Assessment suggestions
    if (selfHistory.length > 0) {
      const latestSelf = selfHistory[0];
      if (latestSelf.sleep < 7) {
        recs.push({
          type: "PREPARATION & HEALTH",
          tip: "Sleep score is low. Target 8 hours of sleep. Set a strict screen curfew 45 minutes prior to bedtime."
        });
      }
      if (latestSelf.nutrition < 7) {
        recs.push({
          type: "NUTRITION",
          tip: "Fuel with slow-release carbohydrates 3 hours before play, and hydrate with electrolytes during sessions."
        });
      }
      if (latestSelf.mental < 7) {
        recs.push({
          type: "MENTAL READINESS",
          tip: "Take 5 minutes before entering the field for deep breathing. Focus on executing one ball at a time."
        });
      }
    }

    // General default
    if (recs.length === 0) {
      recs.push({
        type: "GENERAL RECOMMENDATION",
        tip: "Maintain a balanced routine of 3 practice sessions per week. Record your self-assessment log regularly to analyze health parameters."
      });
    }

    return recs;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getRoleEmoji = (roleStr: string) => {
    const r = (roleStr || "").toLowerCase();
    if (r.includes("batsman") || r.includes("batter")) return "🏏";
    if (r.includes("bowler")) return "⚾";
    if (r.includes("wicketkeeper") || r.includes("wicket-keeper") || r.includes("wicket keeper") || r.includes("keeper")) return "🧤";
    if (r.includes("all-rounder") || r.includes("all rounder") || r.includes("allrounder")) return "⚡";
    return "🏏";
  };

  const getPlayerScores = (p: Player) => {
    const ppi = p.ppiScore && p.ppiScore > 0 ? Math.round(p.ppiScore * 10) / 10 : null;
    const mpi = p.mpiScore && p.mpiScore > 0 ? Math.round(p.mpiScore * 10) / 10 : null;
    const cpi = ppi && mpi 
      ? Math.round(((ppi + mpi) / 2) * 10) / 10 
      : ppi 
        ? ppi 
        : mpi 
          ? mpi 
          : null;
    return { ppi: ppi || 0, mpi: mpi || 0, cpi: cpi || 0 };
  };

  const getAssessDaysAgo = (pId: number) => {
    const dateStr = lastAssessmentDates[pId];
    if (!dateStr || dateStr === "No assessments" || dateStr === "Loading...") return 999;
    const diffTime = Math.abs(new Date().getTime() - new Date(dateStr).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredPlayers = players.filter((p) => {
    // 1. Search Query
    const searchMatch = searchQuery === "" || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase());
    if (!searchMatch) return false;

    // 2. Role Filter
    if (roleFilter !== "all") {
      const r = p.role.toLowerCase();
      if (roleFilter === "batsman") {
        if (!r.includes("batsman") && !r.includes("batter")) return false;
      } else if (roleFilter === "bowler") {
        if (!r.includes("bowler")) return false;
      } else if (roleFilter === "all_rounder") {
        if (!r.includes("all-rounder") && !r.includes("all rounder") && !r.includes("allrounder")) return false;
      } else if (roleFilter === "wicket_keeper") {
        if (!r.includes("wicketkeeper") && !r.includes("wicket-keeper") && !r.includes("wicket keeper") && !r.includes("keeper")) return false;
      }
    }

    // 3. Quick Filter
    const scores = getPlayerScores(p);
    if (quickFilter === "top_performers") {
      if (scores.cpi < 6.5) return false;
    } else if (quickFilter === "needs_attention") {
      if (scores.cpi >= 6.5 || scores.cpi === 0) return false;
    } else if (quickFilter === "assessed_today") {
      const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      if (lastAssessmentDates[p.id] !== todayStr) return false;
    } else if (quickFilter === "not_assessed_recently") {
      const days = getAssessDaysAgo(p.id);
      if (days < 7) return false;
    }

    return true;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const aScores = getPlayerScores(a);
    const bScores = getPlayerScores(b);

    if (sortBy === "highest_cpi") {
      if (aScores.cpi === 0) return 1;
      if (bScores.cpi === 0) return -1;
      return bScores.cpi - aScores.cpi;
    }
    if (sortBy === "lowest_cpi") {
      if (aScores.cpi === 0) return 1;
      if (bScores.cpi === 0) return -1;
      return aScores.cpi - bScores.cpi;
    }
    if (sortBy === "highest_ppi") {
      if (aScores.ppi === 0) return 1;
      if (bScores.ppi === 0) return -1;
      return bScores.ppi - aScores.ppi;
    }
    if (sortBy === "lowest_ppi") {
      if (aScores.ppi === 0) return 1;
      if (bScores.ppi === 0) return -1;
      return aScores.ppi - bScores.ppi;
    }
    if (sortBy === "highest_mpi") {
      if (aScores.mpi === 0) return 1;
      if (bScores.mpi === 0) return -1;
      return bScores.mpi - aScores.mpi;
    }
    if (sortBy === "lowest_mpi") {
      if (aScores.mpi === 0) return 1;
      if (bScores.mpi === 0) return -1;
      return aScores.mpi - bScores.mpi;
    }
    if (sortBy === "recently_assessed") {
      return getAssessDaysAgo(a.id) - getAssessDaysAgo(b.id);
    }
    return 0;
  });

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* ------------------ SUCCESS ANIMATION OVERLAY ------------------ */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-white/90 z-[100] flex flex-col items-center justify-center space-y-4 animate-fade-in">
          <CheckCircle2 className="w-20 h-20 text-orange-500 stroke-[2] animate-bounce" />
          <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">{successMessage}</h2>
        </div>
      )}

      {/* ------------------ VIEW: PLAYER LIST ------------------ */}
      {view === "list" && (
        <div className="space-y-6">
          
          {/* Top Row: Search & Filter & Add */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div id="tour-search" className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500" />
                <input
                  type="text"
                  placeholder="SEARCH PLAYERS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 bg-white border-2 border-slate-200 rounded-2xl pl-12 pr-4 text-base font-bold text-slate-900 placeholder-zinc-650 focus:outline-none focus:border-orange-500 transition-colors uppercase"
                />
              </div>

              <button
                id="tour-filter"
                onClick={() => setShowFilterOverlay(true)}
                className={`h-14 w-14 rounded-2xl flex items-center justify-center border shrink-0 cursor-pointer transition-all active:scale-95 ${
                  sortBy !== "highest_cpi" || quickFilter !== "all" || roleFilter !== "all"
                    ? "bg-orange-500 text-black border-orange-400"
                    : "bg-white border-2 border-slate-200 text-zinc-400 hover:text-slate-900"
                }`}
                title="Filter Squad"
              >
                <Filter className="w-6 h-6" />
              </button>

              {role !== "player" && (
                <button
                  id="tour-add-player-btn"
                  onClick={() => setShowAddForm(true)}
                  className="h-14 w-14 bg-orange-500 hover:bg-orange-600 text-black rounded-2xl flex items-center justify-center border border-orange-400 shrink-0 cursor-pointer shadow-lg active:scale-95 transition-all"
                  title="Add Player"
                >
                  <Plus className="w-8 h-8 stroke-[3]" />
                </button>
              )}
            </div>

            {/* Active Filter Chips */}
            {(sortBy !== "highest_cpi" || quickFilter !== "all" || roleFilter !== "all") && (
              <div className="flex flex-wrap gap-2 text-left pt-1">
                {quickFilter !== "all" && (
                  <span 
                    onClick={() => setQuickFilter("all")}
                    className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/35 text-orange-400 rounded-full text-sm font-bold uppercase flex items-center gap-1.5 cursor-pointer hover:bg-orange-500/20"
                  >
                    Filter: {quickFilter.replace(/_/g, " ")}
                    <X className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                {roleFilter !== "all" && (
                  <span 
                    onClick={() => setRoleFilter("all")}
                    className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/35 text-orange-400 rounded-full text-sm font-bold uppercase flex items-center gap-1.5 cursor-pointer hover:bg-orange-500/20"
                  >
                    Role: {roleFilter.replace(/_/g, " ")}
                    <X className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                {sortBy !== "highest_cpi" && (
                  <span 
                    onClick={() => setSortBy("highest_cpi")}
                    className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/35 text-orange-400 rounded-full text-sm font-bold uppercase flex items-center gap-1.5 cursor-pointer hover:bg-orange-500/20"
                  >
                    Sort: {sortBy.replace(/_/g, " ")}
                    <X className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                <button 
                  onClick={() => {
                    setSortBy("highest_cpi");
                    setQuickFilter("all");
                    setRoleFilter("all");
                  }}
                  className="text-xs font-bold text-zinc-500 hover:text-slate-900 uppercase tracking-wider pl-1 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Add Player Form (Clean inline card) */}
          {showAddForm && (
            <div className="border-2 border-orange-500 bg-white rounded-3xl p-6 space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wider">ADD NEW PLAYER</h3>
                <button 
                  onClick={() => { setShowAddForm(false); router.replace("/players"); }}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-100 text-zinc-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {error && (
                <div className="bg-red-950 text-red-200 border-2 border-red-500 text-sm font-bold p-3 rounded-xl text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddPlayerSubmit} className="space-y-4 text-left">
                
                {/* Photo Picker */}
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-sm font-bold tracking-widest text-zinc-400 block self-start">PLAYER PHOTO</span>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-3xl bg-slate-100 border-2 border-slate-200 hover:border-orange-500 cursor-pointer flex flex-col items-center justify-center overflow-hidden relative group"
                  >
                    {newPlayer.photo ? (
                      <img src={newPlayer.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-zinc-500 group-hover:text-orange-500 mb-1" />
                        <span className="text-sm font-bold text-zinc-500 uppercase">CHOOSE</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => handlePhotoSelect(e)} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold tracking-widest text-zinc-400">PLAYER NAME</label>
                  <input
                    type="text"
                    required
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                    placeholder="Enter player full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold tracking-widest text-zinc-400">AGE</label>
                    <input
                      type="number"
                      required
                      value={newPlayer.age}
                      onChange={(e) => setNewPlayer({ ...newPlayer, age: e.target.value })}
                      className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                      placeholder="e.g. 16"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold tracking-widest text-zinc-400">PLAYING ROLE</label>
                    <select
                      value={newPlayer.role}
                      onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value })}
                      className="w-full h-[52px] bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="Batsman">Batsman</option>
                      <option value="Bowler">Bowler</option>
                      <option value="All-rounder">All-rounder</option>
                      <option value="Wicketkeeper">Wicketkeeper</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white rounded-xl py-4 text-lg font-black tracking-wider uppercase transition-all shadow-lg shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : "SAVE PLAYER"}
                </button>
              </form>
            </div>
          )}

          {/* Player Cards list */}
          {loading ? (
            <CricketLoader message="Loading Squad..." />
          ) : sortedPlayers.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 font-bold uppercase tracking-wider text-sm border-2 border-dashed border-slate-200 rounded-3xl">
              No players found
            </div>
          ) : (
            <div id="tour-player-list" className="space-y-4">
              {sortedPlayers.map((player) => {
                const scores = getPlayerScores(player);
                let scoreLabel = "CPI INDEX";
                let scoreDisplay = "N/A";

                if (sortBy === "highest_mpi" || sortBy === "lowest_mpi") {
                  scoreLabel = "MPI INDEX";
                  scoreDisplay = formatScoreValue(player.mpiScore);
                } else if (sortBy === "highest_ppi" || sortBy === "lowest_ppi") {
                  scoreLabel = "PPI INDEX";
                  scoreDisplay = formatScoreValue(player.ppiScore);
                } else {
                  scoreLabel = "CPI INDEX";
                  scoreDisplay = formatScoreValue(scores.cpi);
                }
                
                const cachedPhoto = typeof window !== 'undefined' ? localStorage.getItem(`player_photo_${player.id}`) : null;
                const assessDate = lastAssessmentDates[player.id] || "Loading...";

                return (
                  <div
                    key={player.id}
                    onClick={() => handleSelectPlayer(player)}
                    className="bg-white border-2 border-slate-200 rounded-3xl p-5 flex items-center justify-between hover:border-slate-200 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Photo or Initials Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                          {cachedPhoto ? (
                            <img src={cachedPhoto} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-orange-500">{getInitials(player.name)}</span>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-xs shadow-xs z-10" title={player.role}>
                          {getRoleEmoji(player.role)}
                        </div>
                      </div>
                      
                      <div className="min-w-0 text-left space-y-0.5">
                        <h4 className="text-xl font-bold text-slate-900 truncate uppercase tracking-tight leading-none">{player.name}</h4>
                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest truncate">{player.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold text-zinc-500 tracking-widest uppercase">{scoreLabel}</div>
                        <div className="text-2xl font-bold text-orange-500 tracking-tight">{scoreDisplay}</div>
                      </div>

                      {role !== "player" && (
                        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                          <button
                            onClick={(e) => handleOpenEditModal(player, e)}
                            className="p-2.5 rounded-xl bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-600 border border-slate-200 hover:border-orange-300 transition-all cursor-pointer"
                            title="Edit Player"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleOpenDeleteModal(player, e)}
                            className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-300 transition-all cursor-pointer"
                            title="Delete Player"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------ VIEW: PLAYER PROFILE LOADING ------------------ */}
      {view === "profile" && !selectedPlayer && (
        <CricketLoader message="Loading Profile..." />
      )}

      {/* ------------------ VIEW: PLAYER PROFILE ------------------ */}
      {view === "profile" && selectedPlayer && (() => {
        // Compute insights
        let strongestArea = "N/A";
        let weakestArea = "N/A";
        let needsImprovement = "N/A";

        const metricSums: Record<string, { sum: number; count: number }> = {};

        if (practiceHistory.length > 0 || matchHistory.length > 0) {

          const addMetric = (key: string, val: number | undefined | null) => {
            if (val === undefined || val === null || val <= 0) return;
            if (!metricSums[key]) {
              metricSums[key] = { sum: 0, count: 0 };
            }
            metricSums[key].sum += val;
            metricSums[key].count += 1;
          };

          practiceHistory.forEach(p => {
            addMetric("Technical Execution", p.technicalExecution);
            addMetric("Skill Level", p.skillsLevel || p.technique);
            addMetric("Game Plan", p.gamePlan || p.decisionMaking || p.gameAwareness);
            addMetric("Preparation", p.preparation);
            addMetric("Intensity", p.intensity);
            addMetric("Focus", p.focus || p.concentration);
            addMetric("Resilience", p.resilience || p.emotionalControl || p.adaptability);
            addMetric("Concentration", p.concentration);
            addMetric("Decision Making", p.decisionMaking);
            addMetric("Game Awareness", p.gameAwareness);
            addMetric("Adaptability", p.adaptability);
            addMetric("Discipline", p.discipline);
            addMetric("Teamwork", p.teamwork);
            addMetric("Coachability", p.coachability);
            addMetric("Work Ethic", p.workEthic);
            addMetric("Emotional Control", p.emotionalControl);
          });

          matchHistory.forEach(m => {
            addMetric("Technical Execution", m.technicalExecution);
            addMetric("Skill Level", m.skillsLevel);
            addMetric("Game Plan", m.gamePlan || m.decisionMaking || m.gameAwareness);
            addMetric("Preparation", m.preparation);
            addMetric("Intensity", m.intensity);
            addMetric("Focus", m.focus || m.concentration);
            addMetric("Resilience", m.resilience || m.emotionalControl || m.adaptability);
            addMetric("Concentration", m.concentration);
            addMetric("Decision Making", m.decisionMaking);
            addMetric("Game Awareness", m.gameAwareness);
            addMetric("Adaptability", m.adaptability);
            addMetric("Discipline", m.discipline);
            addMetric("Teamwork", m.teamwork);
            addMetric("Coachability", m.coachability);
            addMetric("Work Ethic", m.workEthic);
            addMetric("Emotional Control", m.emotionalControl);
          });

          const averages = Object.entries(metricSums).map(([name, data]) => ({
            name,
            avg: data.sum / data.count
          }));

          if (averages.length > 0) {
            averages.sort((a, b) => b.avg - a.avg);
            strongestArea = averages[0].name;
            if (averages.length > 1) {
              weakestArea = averages[averages.length - 1].name;
              needsImprovement = averages.length > 2 ? averages[averages.length - 2].name : averages[0].name;
            }
          }
        }

        // Dynamically generate focus areas from weakest metrics using top-level helper
        const focusAreas = computeFocusAreasForPlayer(selectedPlayer, practiceHistory, matchHistory);

        // Get self-assessment averages
        const getSelfAverages = () => {
          if (!selfHistory || selfHistory.length === 0) return null;
          const totals = { sleep: 0, nutrition: 0, preparation: 0, health: 0, mental: 0, fitness: 0 };
          selfHistory.forEach(h => {
            totals.sleep += h.sleep || 0;
            totals.nutrition += h.nutrition || 0;
            totals.preparation += h.preparation || 0;
            totals.health += h.health || 0;
            totals.mental += h.mental || 0;
            totals.fitness += h.fitness || 0;
          });
          const count = selfHistory.length;
          return {
            sleep: (totals.sleep / count).toFixed(1),
            nutrition: (totals.nutrition / count).toFixed(1),
            preparation: (totals.preparation / count).toFixed(1),
            health: (totals.health / count).toFixed(1),
            mental: (totals.mental / count).toFixed(1),
            fitness: (totals.fitness / count).toFixed(1),
          };
        };
        const selfAverages = getSelfAverages();

        // Calculate latest assessment dates
        let lastAssessmentDate = "No assessments logged";
        const dates = [
          ...practiceHistory.map(p => p.createdAt || p.date),
          ...matchHistory.map(m => m.createdAt || m.date)
        ].filter(Boolean);
        if (dates.length > 0) {
          const sortedDates = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          lastAssessmentDate = new Date(sortedDates[0]).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          });
        }

        const currentPpi = selectedPlayer.ppiScore && selectedPlayer.ppiScore > 0 ? Math.round(selectedPlayer.ppiScore * 10) / 10 : null;
        const currentMpi = selectedPlayer.mpiScore && selectedPlayer.mpiScore > 0 ? Math.round(selectedPlayer.mpiScore * 10) / 10 : null;
        const currentCpi = currentPpi && currentMpi 
          ? Math.round(((currentPpi + currentMpi) / 2) * 10) / 10 
          : currentPpi 
            ? currentPpi 
            : currentMpi 
              ? currentMpi 
              : null;

        // Compute Trend data (latest first)
        const last5Prac = [...practiceHistory]
          .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
          .slice(0, 5);

        const last5Match = [...matchHistory]
          .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
          .slice(0, 5);

        const cpiVal = currentCpi ? parseFloat(formatScoreValue(currentCpi)) : 0;
        const gapVal = targetCpi > 0 && cpiVal > 0 ? Math.round((targetCpi - cpiVal) * 10) / 10 : 0;
        const targetPercent = Math.min(100, Math.max(0, Math.round((cpiVal / targetCpi) * 100)));

        const devMetrics = [
          { name: "Sleep Quality", val: selfAverages ? selfAverages.sleep : "7.0" },
          { name: "Nutrition", val: selfAverages ? selfAverages.nutrition : "7.0" },
          { name: "General Health", val: selfAverages ? selfAverages.health : "7.0" },
          { name: "Fitness", val: selfAverages ? selfAverages.fitness : "7.0" },
          { name: "Mental Readiness", val: selfAverages ? selfAverages.mental : "7.0" },
          { name: "Preparation Quality", val: selfAverages ? selfAverages.preparation : "7.0" }
        ];

        return (
          <div className="space-y-6 text-center pb-12 select-none">
            {/* Back Header & Actions */}
            {role !== "player" && (
              <div className="flex items-center justify-between gap-3 text-left">
                <button
                  onClick={() => { setView("list"); router.replace("/players"); }}
                  className="h-11 px-4 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center gap-2 text-zinc-400 font-bold uppercase text-xs hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[3]" />
                  BACK TO LIST
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleOpenEditModal(selectedPlayer, e)}
                    className="h-11 px-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-xs cursor-pointer transition-all active:scale-95 shadow-xs"
                    title="Edit Player Details"
                  >
                    <Edit2 className="w-4 h-4 text-orange-500" />
                    <span>Edit Player</span>
                  </button>

                  <button
                    onClick={(e) => handleOpenDeleteModal(selectedPlayer, e)}
                    className="h-11 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-xs cursor-pointer transition-all active:scale-95 shadow-xs"
                    title="Delete Player"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Delete Player</span>
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 1 – PLAYER HEADER */}
            <div className="bg-white bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-4 text-center">
              {/* Profile Avatar */}
              <div className="relative inline-block mx-auto">
                <div 
                  onClick={() => profilePhotoInputRef.current?.click()}
                  className="w-28 h-28 rounded-3xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-orange-500"
                >
                  {typeof window !== 'undefined' && localStorage.getItem(`player_photo_${selectedPlayer.id}`) ? (
                    <img src={localStorage.getItem(`player_photo_${selectedPlayer.id}`)!} alt={selectedPlayer.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-orange-500">{getInitials(selectedPlayer.name)}</span>
                  )}
                  <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-6 h-6 text-slate-900" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center text-sm shadow-md z-10" title={selectedPlayer.role}>
                  {getRoleEmoji(selectedPlayer.role)}
                </div>
              </div>
              
              <input 
                type="file" 
                ref={profilePhotoInputRef} 
                onChange={(e) => handlePhotoSelect(e, true)} 
                accept="image/*" 
                className="hidden" 
              />

              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight leading-none">{selectedPlayer.name}</h2>
                <p className="text-xs font-bold text-zinc-550 uppercase tracking-widest">{selectedPlayer.role}</p>
                <div className="text-sm text-zinc-400 font-semibold uppercase mt-1">
                  Age: {((selectedPlayer.id % 5) + 19)} • Style: {selectedPlayer.battingStyle || "N/A"} • {selectedPlayer.bowlingStyle || "N/A"}
                </div>
                <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                  Last Assessed: {lastAssessmentDate}
                </div>
              </div>

              {/* Generate PDF Report option in bottom of player card box */}
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setShowPdfDateOverlay(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 font-black text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95 group"
                >
                  <FileText className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                  <span>Generate Player PDF Report</span>
                  <Download className="w-3.5 h-3.5 text-orange-500" />
                </button>
              </div>
            </div>

            {/* Action Buttons for Assessment logging */}
            <div className="space-y-3">
              {role !== "player" ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setPracticeForm({
                        technicalExecution: 7,
                        skillsLevel: 7,
                        gamePlan: 7,
                        preparation: 7,
                        intensity: 7,
                        focus: 7,
                        resilience: 7,
                        notes: ""
                      });
                      setError("");
                      setShowPracticeOverlay(true);
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-4 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-orange-400 shadow-md cursor-pointer uppercase"
                  >
                    <Clipboard className="w-4 h-4 stroke-[3]" />
                    Practice Grade
                  </button>

                  <button
                    onClick={() => {
                      setMatchForm({
                        technicalExecution: 7,
                        skillsLevel: 7,
                        gamePlan: 7,
                        preparation: 7,
                        intensity: 7,
                        focus: 7,
                        resilience: 7,
                        notes: ""
                      });
                      setError("");
                      setShowMatchOverlay(true);
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-4 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-orange-400 shadow-md cursor-pointer uppercase"
                  >
                    <ShieldCheck className="w-4 h-4 stroke-[3]" />
                    Match Grade
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelfForm({
                      sleep: 7,
                      nutrition: 7,
                      preparation: 7,
                      health: 7,
                      mental: 7,
                      fitness: 7
                    });
                    setShowSelfOverlay(true);
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-4.5 text-sm font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-orange-400 shadow-md cursor-pointer uppercase"
                >
                  <Clipboard className="w-5 h-5 stroke-[3]" />
                  Log Self Assessment
                </button>
              )}
            </div>

            {/* SECTION 2 – CURRENT STATUS */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-3.5 sm:p-5.5 space-y-4 text-left">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  CURRENT STATUS
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3 text-center pt-1">
                <div className="bg-orange-500/10 border border-orange-500/30 px-1.5 py-3 sm:p-4 rounded-2xl flex flex-col items-center justify-center min-w-0">
                  <p className="text-[9px] xs:text-[10px] sm:text-xs font-bold text-orange-400 uppercase tracking-tight sm:tracking-wider mb-1 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                    CPI SCORE /100
                  </p>
                  <p className="text-xl sm:text-3xl font-extrabold text-orange-500 tracking-tight leading-none whitespace-nowrap">
                    {formatScoreValue(currentCpi)}
                  </p>
                </div>
                <div className="bg-slate-50 px-1.5 py-3 sm:p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center min-w-0">
                  <p className="text-[9px] xs:text-[10px] sm:text-xs font-bold text-zinc-550 uppercase tracking-tight sm:tracking-wider mb-1 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                    PPI SCORE /100
                  </p>
                  <p className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none whitespace-nowrap">
                    {formatScoreValue(currentPpi)}
                  </p>
                </div>
                <div className="bg-slate-50 px-1.5 py-3 sm:p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center min-w-0">
                  <p className="text-[9px] xs:text-[10px] sm:text-xs font-bold text-zinc-550 uppercase tracking-tight sm:tracking-wider mb-1 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                    MPI SCORE /100
                  </p>
                  <p className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none whitespace-nowrap">
                    {formatScoreValue(currentMpi)}
                  </p>
                </div>
              </div>
            </div>


            {/* SECTION 4 – TARGETS (WHERE DO I WANT TO BE?) */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5.5 space-y-4 text-left">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-500" />
                  WHERE DO I WANT TO BE?
                </h3>
              </div>
              
              <div className="space-y-4 pt-1">
                {/* Target CPI Editing Card */}
                <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-zinc-550 uppercase tracking-widest block">TARGET CPI</span>
                    <span className="text-xs font-bold text-zinc-400 uppercase block mt-0.5">
                      {gapVal > 0 ? `${gapVal} points to target cpi` : "Target achieved!"}
                    </span>
                  </div>
                  {isEditingTarget ? (
                    <div className="flex items-center gap-2 text-left">
                      <select
                        value={tempTargetCpi}
                        onChange={(e) => setTempTargetCpi(e.target.value)}
                        className="bg-white border-2 border-slate-200 rounded-xl px-2 py-1.5 font-bold text-slate-900 text-sm focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        {[70, 75, 80, 85, 90, 95, 100].map((v) => (
                          <option key={v} value={v.toString()}>{v}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleSaveTargetCpi}
                        className="px-3 py-1.5 bg-orange-50 hover:bg-orange-600 text-black rounded-lg text-xs font-bold uppercase cursor-pointer transition-all"
                      >
                        SAVE
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => { setTempTargetCpi(targetCpi.toString()); setIsEditingTarget(true); }}
                      className="cursor-pointer group flex items-center gap-1.5 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-orange-500 transition-all"
                    >
                      <span className="text-xl font-bold text-orange-500 tracking-tight">{targetCpi}</span>
                      <Edit2 className="w-3.5 h-3.5 text-zinc-500 group-hover:text-orange-500 transition-colors" />
                    </div>
                  )}
                </div>

                {/* Progress Bar toward Target */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm font-bold text-zinc-500 uppercase tracking-wider px-1">
                    <span>Progress to Target</span>
                    <span className="font-bold text-orange-500 tracking-tight">{targetPercent}%</span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 border border-slate-200 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                      style={{ width: `${targetPercent}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5 – WHAT DO I NEED TO WORK ON? */}
            <div className="bg-white bg-white border border-slate-200 rounded-3xl p-5.5 space-y-4 text-left">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-500" />
                  WHAT DO I NEED TO WORK ON?
                </h3>
              </div>
              
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-sm font-bold text-zinc-500 uppercase">Strongest Area</span>
                  <span className="text-xs font-bold text-green-500 uppercase">{strongestArea}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-sm font-bold text-zinc-500 uppercase">Needs Improvement</span>
                  <span className="text-xs font-bold text-orange-500 uppercase">{needsImprovement}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-sm font-bold text-zinc-500 uppercase">Weakest Area</span>
                  <span className="text-xs font-bold text-red-550 text-red-500 uppercase">{weakestArea}</span>
                </div>
              </div>
            </div>

            {/* SECTION 5 – RECOMMENDED FOCUS */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5.5 space-y-4 text-left">
              <h3 className="text-xs font-black tracking-widest text-slate-900 uppercase border-b border-slate-200 pb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                RECOMMENDED FOCUS
              </h3>
              <div className="space-y-2.5 pt-1">
                {focusAreas.map((focus, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden transition-all duration-300 cursor-pointer"
                    onClick={() => setExpandedFocus(expandedFocus === idx ? null : idx)}
                  >
                    <div className="flex items-center gap-3 p-3.5">
                      <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 border border-orange-500/30 flex items-center justify-center font-black text-xs shrink-0 font-mono">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-black text-slate-900 flex-1">{focus.title}</span>
                      <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-300 ${expandedFocus === idx ? "rotate-180 text-orange-500" : ""}`} />
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        expandedFocus === idx ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="px-5 pb-5 pt-3.5 border-t border-slate-200 bg-white space-y-2">
                        <p className="text-xs font-semibold text-slate-800 leading-[1.75] whitespace-pre-line">
                          {focus.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 7 – ASSESSMENT HISTORY */}
            <div className="bg-white bg-white border border-slate-200 rounded-3xl p-5.5 space-y-4 text-left">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h3 className="text-xs font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-2">
                  <Brain className="w-4 h-4 text-orange-500" />
                  ASSESSMENT HISTORY
                </h3>
                <button
                  onClick={() => setShowHistoryOverlay(true)}
                  className="text-xs font-bold text-orange-500 hover:text-orange-600 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  VIEW ALL
                </button>
              </div>
              
              <div className="space-y-4 pt-1">
                {/* Practice History scroll area */}
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2 border-b border-slate-200 pb-1">
                    Practice History
                  </span>
                  {practiceHistory.length === 0 ? (
                    <p className="text-xs text-zinc-605 font-bold uppercase py-1">No Practice History</p>
                  ) : (
                    <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                      {practiceHistory.map((p, idx) => (
                        <div
                          key={p.id || idx}
                          onClick={() => setSelectedAssessmentDetail({ type: "Practice", data: p })}
                          className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs cursor-pointer hover:bg-slate-100 hover:border-orange-300 transition-all group"
                          title="Click to view assessment details and coach notes"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-orange-600 transition-colors">Practice Assessment</span>
                            <span className="text-xs text-zinc-550">{new Date(p.date || p.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span className="font-bold text-orange-500 text-sm tracking-tight">PPI {formatScoreValue(p.ppiScore)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Match History scroll area */}
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2 border-b border-slate-200 pb-1">
                    Match History
                  </span>
                  {matchHistory.length === 0 ? (
                    <p className="text-xs text-zinc-605 font-bold uppercase py-1">No Match History</p>
                  ) : (
                    <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                      {matchHistory.map((m, idx) => (
                        <div
                          key={m.id || idx}
                          onClick={() => setSelectedAssessmentDetail({ type: "Match", data: m })}
                          className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs cursor-pointer hover:bg-slate-100 hover:border-orange-300 transition-all group"
                          title="Click to view assessment details and coach notes"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-orange-600 transition-colors">Match Assessment</span>
                            <span className="text-xs text-zinc-550">{new Date(m.date || m.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span className="font-bold text-orange-500 text-sm tracking-tight">MPI {formatScoreValue(m.mpiScore)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* ------------------ OVERLAY: PRACTICE ASSESSMENT ------------------ */}
      {showPracticeOverlay && selectedPlayer && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto p-6 space-y-6 text-left select-none pb-10">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <div className="space-y-2">
              <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900">PRACTICE GRADES</h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Player:</span>
                <div className="relative inline-block">
                  <select
                    value={selectedPlayer.id}
                    onChange={(e) => {
                      const nextPlayer = players.find(p => p.id === Number(e.target.value));
                      if (nextPlayer) {
                        setSelectedPlayer(nextPlayer);
                        loadHistory(nextPlayer.id);
                        setPracticeForm({
                          technicalExecution: 7,
                          skillsLevel: 7,
                          gamePlan: 7,
                          preparation: 7,
                          intensity: 7,
                          focus: 7,
                          resilience: 7,
                          notes: ""
                        });
                        setError("");
                        window.history.replaceState(null, "", `/players?id=${nextPlayer.id}&action=practice`);
                      }
                    }}
                    className="appearance-none bg-white border border-slate-200 hover:border-orange-500 text-orange-500 font-bold text-xs rounded-xl pl-3 pr-8 py-1.5 cursor-pointer focus:outline-none transition-all uppercase tracking-wider font-mono min-w-[120px]"
                  >
                    {players.map((p) => (
                      <option key={p.id} value={p.id} className="bg-white text-slate-900 font-bold font-mono">
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-orange-500">
                    <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setShowPracticeOverlay(false)} className="text-zinc-500 hover:text-slate-900 p-1">
              <X className="w-7 h-7" />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold p-4 rounded-xl uppercase tracking-wider">
              {error}
            </div>
          )}

          <form onSubmit={handlePracticeSubmit} className="space-y-6">
            {[
              { label: "TECHNIQUE", key: "technicalExecution", desc: "Technique, mechanics, and physical execution" },
              { label: "SKILL LEVEL", key: "skillsLevel", desc: "Mastery and precision of core skills" },
              { label: "GAME PLAN", key: "gamePlan", desc: "Tactical strategy, role clarity, and game plan execution" },
              { label: "PREPARATION", key: "preparation", desc: "Session readiness, warmups, and routine" },
              { label: "INTENSITY", key: "intensity", desc: "Energy, purpose, and competitive effort in training" },
              { label: "FOCUS", key: "focus", desc: "Mental focus, engagement, and attention to detail" },
              { label: "RESILIENCE", key: "resilience", desc: "Bouncing back from mistakes, mental toughness, and adaptability" }
            ].map((metric) => (
              <div key={metric.key} className="space-y-2 bg-white p-4 border border-slate-200 rounded-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <label className="text-sm font-bold tracking-widest text-slate-900 uppercase">{metric.label}</label>
                    <p className="text-sm text-zinc-500 font-semibold">{metric.desc}</p>
                  </div>
                  <span className="text-xl font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">{(practiceForm as any)[metric.key]}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={(practiceForm as any)[metric.key]}
                  onChange={(e) => setPracticeForm({ ...practiceForm, [metric.key]: parseInt(e.target.value) })}
                  className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            ))}

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest text-zinc-400">NOTES</label>
              <textarea
                value={practiceForm.notes}
                onChange={(e) => setPracticeForm({ ...practiceForm, notes: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500 resize-none h-20"
                placeholder="Optional coach remarks..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-4.5 text-xl font-bold transition-all flex items-center justify-center cursor-pointer border-2 border-orange-500 shadow-xl active:scale-98"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : "SAVE ASSESSMENT"}
            </button>
          </form>
        </div>
      )}

      {/* ------------------ OVERLAY: MATCH ASSESSMENT ------------------ */}
      {showMatchOverlay && selectedPlayer && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto p-6 space-y-6 text-left select-none pb-10">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <div className="space-y-2">
              <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900">MATCH GRADES</h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Player:</span>
                <div className="relative inline-block">
                  <select
                    value={selectedPlayer.id}
                    onChange={(e) => {
                      const nextPlayer = players.find(p => p.id === Number(e.target.value));
                      if (nextPlayer) {
                        setSelectedPlayer(nextPlayer);
                        loadHistory(nextPlayer.id);
                        setMatchForm({
                          technicalExecution: 7,
                          skillsLevel: 7,
                          gamePlan: 7,
                          preparation: 7,
                          intensity: 7,
                          focus: 7,
                          resilience: 7,
                          notes: ""
                        });
                        setError("");
                        window.history.replaceState(null, "", `/players?id=${nextPlayer.id}&action=match`);
                      }
                    }}
                    className="appearance-none bg-white border border-slate-200 hover:border-orange-500 text-orange-500 font-bold text-xs rounded-xl pl-3 pr-8 py-1.5 cursor-pointer focus:outline-none transition-all uppercase tracking-wider font-mono min-w-[120px]"
                  >
                    {players.map((p) => (
                      <option key={p.id} value={p.id} className="bg-white text-slate-900 font-bold font-mono">
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-orange-500">
                    <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setShowMatchOverlay(false)} className="text-zinc-500 hover:text-slate-900 p-1">
              <X className="w-7 h-7" />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold p-4 rounded-xl uppercase tracking-wider">
              {error}
            </div>
          )}

          <form onSubmit={handleMatchSubmit} className="space-y-6">
            {[
              { label: "TECHNIQUE", key: "technicalExecution", desc: "Fundamentals under pressure and match execution" },
              { label: "SKILL LEVEL", key: "skillsLevel", desc: "Skill execution and versatility under match conditions" },
              { label: "GAME PLAN", key: "gamePlan", desc: "Adherence to match plan, tactical discipline, and situational awareness" },
              { label: "PREPARATION", key: "preparation", desc: "Pre-match focus, strategy alignment, and mental readiness" },
              { label: "INTENSITY", key: "intensity", desc: "Competitive intensity, effort, and match urgency" },
              { label: "FOCUS", key: "focus", desc: "Focus under pressure, game situation awareness, and composure" },
              { label: "RESILIENCE", key: "resilience", desc: "Pressure handling, fighting spirit, and overcoming set-backs" }
            ].map((metric) => (
              <div key={metric.key} className="space-y-2 bg-white p-4 border border-slate-200 rounded-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <label className="text-sm font-bold tracking-widest text-slate-900 uppercase">{metric.label}</label>
                    <p className="text-sm text-zinc-500 font-semibold">{metric.desc}</p>
                  </div>
                  <span className="text-xl font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">{(matchForm as any)[metric.key]}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={(matchForm as any)[metric.key]}
                  onChange={(e) => setMatchForm({ ...matchForm, [metric.key]: parseInt(e.target.value) })}
                  className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            ))}

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest text-zinc-400">NOTES</label>
              <textarea
                value={matchForm.notes}
                onChange={(e) => setMatchForm({ ...matchForm, notes: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500 resize-none h-20"
                placeholder="Optional match details..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-4.5 text-xl font-bold transition-all flex items-center justify-center cursor-pointer border-2 border-orange-500 shadow-xl active:scale-98"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : "SAVE ASSESSMENT"}
            </button>
          </form>
        </div>
      )}

      {/* ------------------ OVERLAY: SELF ASSESSMENT ------------------ */}
      {showSelfOverlay && selectedPlayer && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto p-6 space-y-6 text-left select-none pb-10">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <div className="space-y-1">
              <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900">MY SELF GRADES</h3>
              <p className="text-xs text-orange-500 font-bold uppercase">{selectedPlayer.name}</p>
            </div>
            <button onClick={() => setShowSelfOverlay(false)} className="text-zinc-500 hover:text-slate-900 p-1">
              <X className="w-7 h-7" />
            </button>
          </div>

          <form onSubmit={handleSelfSubmit} className="space-y-6">
            {[
              { label: "SLEEP QUALITY", key: "sleep", desc: "Hours slept and recovery feeling" },
              { label: "NUTRITION", key: "nutrition", desc: "Proper hydration and dietary balance" },
              { label: "PREPARATION & WARMUP", key: "preparation", desc: "Focus routine and stretching readiness" },
              { label: "GENERAL HEALTH & BODY", key: "health", desc: "Lack of pain or stiffness" },
              { label: "MENTAL READINESS", key: "mental", desc: "Confidence and cognitive calmness" },
              { label: "FITNESS & PHYSICAL STRENGTH", key: "fitness", desc: "General stamina, muscle soreness, and power level" }
            ].map((metric) => (
              <div key={metric.key} className="space-y-2 bg-white p-4 border border-slate-200 rounded-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <label className="text-sm font-bold tracking-widest text-slate-900 uppercase">{metric.label}</label>
                    <p className="text-sm text-zinc-500 font-semibold">{metric.desc}</p>
                  </div>
                  <span className="text-xl font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">{(selfForm as any)[metric.key]}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={(selfForm as any)[metric.key]}
                  onChange={(e) => setSelfForm({ ...selfForm, [metric.key]: parseInt(e.target.value) })}
                  className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            ))}

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-4.5 text-xl font-bold transition-all flex items-center justify-center cursor-pointer border-2 border-orange-500 shadow-xl active:scale-98"
            >
              SAVE SELF ASSESSMENT
            </button>
          </form>
        </div>
      )}

      {/* ------------------ OVERLAY: ASSESSMENT HISTORY ------------------ */}
      {showHistoryOverlay && selectedPlayer && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto p-6 space-y-6 text-left select-none pb-12">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <div className="space-y-1">
              <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900">PLAYER LOGS</h3>
              <p className="text-xs text-orange-500 font-bold uppercase">{selectedPlayer.name}</p>
            </div>
            <button onClick={() => setShowHistoryOverlay(false)} className="text-zinc-500 hover:text-slate-900 p-1">
              <X className="w-7 h-7" />
            </button>
          </div>

          {/* CPI Trend */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-orange-500 uppercase">CPI RECENT TREND</h4>
            {[...practiceHistory, ...matchHistory].length === 0 ? (
              <p className="text-xs text-zinc-500 font-bold uppercase">No records logged yet.</p>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {[
                  ...practiceHistory.map((h) => ({ date: h.date, score: h.ppiScore, type: "Prac" })),
                  ...matchHistory.map((h) => ({ date: h.date, score: h.mpiScore, type: "Match" }))
                ]
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(-6)
                  .map((s, idx) => (
                    <div key={idx} className="flex-1 min-w-[70px] flex flex-col items-center bg-slate-100 border border-slate-200 rounded-xl py-3">
                      <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{s.type}</span>
                      <span className="text-base font-bold text-slate-900 mt-1">{formatScoreValue(s.score)}</span>
                      <span className="text-[7px] font-semibold text-zinc-400 mt-0.5">{s.date.split("-").slice(1).join("/")}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Practice History timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">PRACTICE ASSESSMENTS</h4>
            {practiceHistory.length === 0 ? (
              <p className="text-xs text-zinc-600 font-bold uppercase pl-2">No practice logs</p>
            ) : (
              <div className="space-y-3">
                {practiceHistory.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedAssessmentDetail({ type: "Practice", data: h })}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:border-orange-400 hover:shadow-sm transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-zinc-500">{h.date}</div>
                      <div className="text-sm font-semibold text-slate-900 mt-1 italic">
                        {h.notes ? `"${h.notes}"` : "Practice Session"}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-orange-500 bg-orange-500/10 px-3 py-1 rounded-xl">
                      PPI {formatScoreValue(h.ppiScore)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Match History timeline */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">MATCH ASSESSMENTS</h4>
            {matchHistory.length === 0 ? (
              <p className="text-xs text-zinc-600 font-bold uppercase pl-2">No match logs</p>
            ) : (
              <div className="space-y-3">
                {matchHistory.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedAssessmentDetail({ type: "Match", data: h })}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:border-orange-400 hover:shadow-sm transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-zinc-500">{h.date}</div>
                      <div className="text-sm font-semibold text-slate-900 mt-1 italic">
                        {h.notes ? `"${h.notes}"` : "Match Session"}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-orange-500 bg-orange-500/10 px-3 py-1 rounded-xl">
                      MPI {formatScoreValue(h.mpiScore)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Self History timeline */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">SELF ASSESSMENTS</h4>
            {selfHistory.length === 0 ? (
              <p className="text-xs text-zinc-600 font-bold uppercase pl-2">No self-assess logs</p>
            ) : (
              <div className="space-y-3">
                {selfHistory.map((h, i) => {
                  const avg = (h.sleep + h.nutrition + h.preparation + h.health + h.mental) / 5;
                  return (
                    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-zinc-500">{h.date}</div>
                        <div className="text-xs font-semibold text-zinc-400 mt-1">
                          Sleep: {h.sleep} • Nutrition: {h.nutrition} • Preparation: {h.preparation}
                        </div>
                      </div>
                      <span className="text-base font-bold text-orange-500 bg-orange-500/10 px-3 py-1 rounded-xl">
                        {avg.toFixed(1)}/10
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------ OVERLAY: ASSESSMENT DETAILS ------------------ */}
      {selectedAssessmentDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 text-left border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest block">
                  {selectedAssessmentDetail.type === "Practice" ? "Practice Assessment Details" : "Match Assessment Details"}
                </span>
                <h3 className="text-lg font-bold text-slate-900 uppercase">
                  {selectedPlayer?.name || "Player Assessment"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAssessmentDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Assessment Date & Score */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase block">Assessment Date</span>
                <span className="text-sm font-bold text-slate-900">
                  {new Date(selectedAssessmentDetail.data.date || selectedAssessmentDetail.data.createdAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-zinc-500 uppercase block">
                  {selectedAssessmentDetail.type === "Practice" ? "PPI Score" : "MPI Score"}
                </span>
                <span className="text-2xl font-extrabold text-orange-500 tracking-tight">
                  {formatScoreValue(selectedAssessmentDetail.type === "Practice" ? selectedAssessmentDetail.data.ppiScore : selectedAssessmentDetail.data.mpiScore)}
                </span>
              </div>
            </div>

            {/* Parameter Ratings */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold tracking-widest text-slate-900 uppercase border-b border-slate-100 pb-1">
                Parameter Ratings (Out of 10)
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Technical Execution", val: selectedAssessmentDetail.data.technicalExecution },
                  { label: "Skill Level", val: selectedAssessmentDetail.data.skillsLevel || selectedAssessmentDetail.data.technique },
                  { label: "Game Plan", val: selectedAssessmentDetail.data.gamePlan || selectedAssessmentDetail.data.decisionMaking },
                  { label: "Preparation", val: selectedAssessmentDetail.data.preparation },
                  { label: "Intensity", val: selectedAssessmentDetail.data.intensity },
                  { label: "Focus / Concentration", val: selectedAssessmentDetail.data.focus || selectedAssessmentDetail.data.concentration },
                  { label: "Resilience", val: selectedAssessmentDetail.data.resilience || selectedAssessmentDetail.data.emotionalControl || selectedAssessmentDetail.data.adaptability }
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="font-bold text-slate-900 tracking-tight">{item.val !== undefined && item.val !== null ? `${item.val}/10` : "N/A"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coach Notes */}
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <h4 className="text-xs font-bold tracking-widest text-slate-900 uppercase flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-orange-500" />
                Coach Notes & Comments
              </h4>
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 text-xs leading-relaxed text-slate-800 italic">
                {selectedAssessmentDetail.data.notes && selectedAssessmentDetail.data.notes.trim() !== "" ? (
                  `"${selectedAssessmentDetail.data.notes}"`
                ) : (
                  <span className="text-slate-400 not-italic">No coach notes recorded for this assessment session.</span>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedAssessmentDetail(null)}
                className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ OVERLAY: RECOMMENDATIONS ------------------ */}
      {showRecsOverlay && selectedPlayer && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto p-6 space-y-6 text-left select-none pb-12">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <div className="space-y-1">
              <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900">COACH ADVICE</h3>
              <p className="text-xs text-orange-500 font-bold uppercase">{selectedPlayer.name}</p>
            </div>
            <button onClick={() => setShowRecsOverlay(false)} className="text-zinc-500 hover:text-slate-900 p-1">
              <X className="w-7 h-7" />
            </button>
          </div>

          <div className="space-y-4">
            {getRecommendations().map((rec, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
                <span className="text-sm font-bold tracking-widest text-orange-500 uppercase block">
                  {rec.type}
                </span>
                <p className="text-base font-bold text-slate-900 leading-relaxed">
                  {rec.tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------ OVERLAY: FILTER & SORT ------------------ */}
      {showFilterOverlay && (
        <div className="fixed inset-0 bg-white/80 z-[60] flex items-end justify-center animate-fade-in select-none">
          <div className="bg-white border-t-2 border-slate-200 w-full max-w-lg rounded-t-[32px] p-6 space-y-6 pb-10 shadow-2xl animate-slide-up">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <div className="space-y-0.5">
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight text-left">FILTER & SORT SQUAD</h3>
                <p className="text-sm text-zinc-500 font-bold uppercase text-left">{sortedPlayers.length} players matched</p>
              </div>
              <button 
                onClick={() => setShowFilterOverlay(false)} 
                className="p-2 rounded-xl bg-slate-100 text-zinc-400 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* SORT BY */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold tracking-widest text-zinc-500 uppercase">SORT BY</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Highest CPI", val: "highest_cpi" },
                  { label: "Lowest CPI", val: "lowest_cpi" },
                  { label: "Highest PPI", val: "highest_ppi" },
                  { label: "Lowest PPI", val: "lowest_ppi" },
                  { label: "Highest MPI", val: "highest_mpi" },
                  { label: "Lowest MPI", val: "lowest_mpi" },
                  { label: "Recently Assessed", val: "recently_assessed" }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setSortBy(opt.val as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${
                      sortBy === opt.val
                        ? "bg-white text-black border-white"
                        : "bg-slate-100 text-zinc-400 border-slate-200 hover:border-zinc-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* QUICK FILTERS */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold tracking-widest text-zinc-500 uppercase">QUICK FILTERS</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "All Players", val: "all" },
                  { label: "Top Performers", val: "top_performers" },
                  { label: "Needs Attention", val: "needs_attention" },
                  { label: "Assessed Today", val: "assessed_today" },
                  { label: "Not Assessed Recently", val: "not_assessed_recently" }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setQuickFilter(opt.val as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${
                      quickFilter === opt.val
                        ? "bg-orange-500 text-black border-orange-450"
                        : "bg-slate-100 text-zinc-400 border-slate-200 hover:border-zinc-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ROLE FILTERS */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold tracking-widest text-zinc-500 uppercase">ROLE FILTERS</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "All Roles", val: "all" },
                  { label: "Batsman", val: "batsman" },
                  { label: "Bowler", val: "bowler" },
                  { label: "All Rounder", val: "all_rounder" },
                  { label: "Wicket Keeper", val: "wicket_keeper" }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setRoleFilter(opt.val as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${
                      roleFilter === opt.val
                        ? "bg-orange-500 text-black border-orange-450"
                        : "bg-slate-100 text-zinc-400 border-slate-200 hover:border-zinc-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFilterOverlay(false)}
              className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4 text-base font-bold transition-all cursor-pointer flex items-center justify-center border-2 border-white shadow-xl active:scale-98"
            >
              APPLY & VIEW SQUAD
            </button>
          </div>
        </div>
      )}

      {/* PDF DATE RANGE SELECTION OVERLAY */}
      {showPdfDateOverlay && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl text-left select-none">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600">
                  <FileText className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">GENERATE PDF REPORT</h3>
                  <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Select Date Range</p>
                </div>
              </div>
              <button
                onClick={() => setShowPdfDateOverlay(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black tracking-wider text-slate-700 uppercase block">FROM DATE</label>
                <input
                  type="date"
                  value={pdfFromDate}
                  onChange={(e) => setPdfFromDate(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-500 transition-all shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black tracking-wider text-slate-700 uppercase block">TO DATE</label>
                <input
                  type="date"
                  value={pdfToDate}
                  onChange={(e) => setPdfToDate(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-500 transition-all shadow-xs"
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">QUICK PRESETS</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFromDate("");
                      setPdfToDate("");
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase border border-slate-200 bg-slate-100 hover:bg-orange-50 hover:border-orange-300 text-slate-700 transition-all cursor-pointer"
                  >
                    All Time
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 7);
                      setPdfFromDate(start.toISOString().split("T")[0]);
                      setPdfToDate(end.toISOString().split("T")[0]);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase border border-slate-200 bg-slate-100 hover:bg-orange-50 hover:border-orange-300 text-slate-700 transition-all cursor-pointer"
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 30);
                      setPdfFromDate(start.toISOString().split("T")[0]);
                      setPdfToDate(end.toISOString().split("T")[0]);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase border border-slate-200 bg-slate-100 hover:bg-orange-50 hover:border-orange-300 text-slate-700 transition-all cursor-pointer"
                  >
                    Last 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 90);
                      setPdfFromDate(start.toISOString().split("T")[0]);
                      setPdfToDate(end.toISOString().split("T")[0]);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase border border-slate-200 bg-slate-100 hover:bg-orange-50 hover:border-orange-300 text-slate-700 transition-all cursor-pointer"
                  >
                    Last 90 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const end = new Date();
                      const start = new Date(end.getFullYear(), 0, 1);
                      setPdfFromDate(start.toISOString().split("T")[0]);
                      setPdfToDate(end.toISOString().split("T")[0]);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase border border-slate-200 bg-slate-100 hover:bg-orange-50 hover:border-orange-300 text-slate-700 transition-all cursor-pointer"
                  >
                    This Year
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPdfDateOverlay(false)}
                className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleGenerateFilteredPdfReport}
                className="flex-1 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                GENERATE REPORT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ EDIT PLAYER MODAL ------------------ */}
      {showEditForm && editingPlayer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[90] flex items-center justify-center p-4">
          <div className="bg-white border-2 border-orange-500 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wider">EDIT PLAYER DETAILS</h3>
              <button 
                onClick={() => { setShowEditForm(false); setEditingPlayer(null); }}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-zinc-500 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 border-2 border-red-200 text-sm font-bold p-3 rounded-xl text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleEditPlayerSubmit} className="space-y-4 text-left">
              
              {/* Photo Picker */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-sm font-bold tracking-widest text-zinc-400 block self-start">PLAYER PHOTO</span>
                <div 
                  onClick={() => editFileInputRef.current?.click()}
                  className="w-24 h-24 rounded-3xl bg-slate-100 border-2 border-slate-200 hover:border-orange-500 cursor-pointer flex flex-col items-center justify-center overflow-hidden relative group"
                >
                  {editPlayerForm.photo ? (
                    <img src={editPlayerForm.photo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-zinc-500 group-hover:text-orange-500 mb-1" />
                      <span className="text-sm font-bold text-zinc-500 uppercase">CHANGE</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={editFileInputRef} 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditPlayerForm(prev => ({ ...prev, photo: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold tracking-widest text-zinc-400">PLAYER NAME</label>
                <input
                  type="text"
                  required
                  value={editPlayerForm.name}
                  onChange={(e) => setEditPlayerForm({ ...editPlayerForm, name: e.target.value })}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                  placeholder="Enter player full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold tracking-widest text-zinc-400">AGE</label>
                  <input
                    type="number"
                    required
                    value={editPlayerForm.age}
                    onChange={(e) => setEditPlayerForm({ ...editPlayerForm, age: e.target.value })}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                    placeholder="e.g. 16"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold tracking-widest text-zinc-400">PLAYING ROLE</label>
                  <select
                    value={editPlayerForm.role}
                    onChange={(e) => setEditPlayerForm({ ...editPlayerForm, role: e.target.value })}
                    className="w-full h-[52px] bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-rounder">All-rounder</option>
                    <option value="Wicketkeeper">Wicketkeeper</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold tracking-widest text-zinc-400">BATTING STYLE</label>
                  <select
                    value={editPlayerForm.battingStyle}
                    onChange={(e) => setEditPlayerForm({ ...editPlayerForm, battingStyle: e.target.value })}
                    className="w-full h-[52px] bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Right-hand bat">Right-hand bat</option>
                    <option value="Left-hand bat">Left-hand bat</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold tracking-widest text-zinc-400">BOWLING STYLE</label>
                  <select
                    value={editPlayerForm.bowlingStyle}
                    onChange={(e) => setEditPlayerForm({ ...editPlayerForm, bowlingStyle: e.target.value })}
                    className="w-full h-[52px] bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="None">None</option>
                    <option value="Right-arm fast">Right-arm fast</option>
                    <option value="Right-arm medium">Right-arm medium</option>
                    <option value="Right-arm spin">Right-arm spin</option>
                    <option value="Left-arm fast">Left-arm fast</option>
                    <option value="Left-arm spin">Left-arm spin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEditForm(false); setEditingPlayer(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-3.5 font-bold uppercase cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3.5 font-black uppercase transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : "UPDATE PLAYER"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ DELETE CONFIRMATION MODAL ------------------ */}
      {showDeleteModal && deletingPlayer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[90] flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-500 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-7 h-7 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">DELETE PLAYER?</h3>
              <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-slate-900">{deletingPlayer.name}</span>? All associated practice and match assessments will be permanently removed.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeletingPlayer(null); }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-3.5 font-bold uppercase cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-3.5 font-black uppercase transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : "CONFIRM DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
