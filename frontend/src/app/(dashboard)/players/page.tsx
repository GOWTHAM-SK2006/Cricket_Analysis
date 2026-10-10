"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { uploadPlayerImage } from "@/lib/supabase";
import {
  Search, Plus, Loader2, ArrowLeft, Clipboard, ShieldCheck,
  Sparkles, ListCollapse, Award, Flame, Heart, Brain, X, Camera, CheckCircle2,
  Filter, Check, Copy, Target, Edit2, ChevronDown, FileText, Download, Trash2, TrendingUp, Zap, AlertTriangle, Activity,
  Users, Crown, ChevronRight, SlidersHorizontal, UserCheck, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PerformanceTrendChart from "@/components/PerformanceTrendChart";
import CricketLoader from "@/components/CricketLoader";
import { getRoleContextForParameter } from "@/lib/roleContext";
import { CPI_PREDEFINED_SOURCE, ApprovedCpiParameter, normalizeCpiParameterName } from "@/lib/cpiPredefinedSource";

interface Player {
  id: number;
  name: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  imageUrl?: string;
  ppiScore: number | null;
  mpiScore: number | null;
  invitationCode?: string;
  invitationCodeActivated?: boolean;
  creatorCoach?: {
    id: number;
    name: string;
    email: string;
  };
  lastPracticeDate?: string;
  lastMatchDate?: string;
}

const formatScoreValue = (val: number | null | undefined, showMax: boolean = false) => {
  if (val === null || val === undefined || val === 0) return "N/A";
  let num = typeof val === "number" ? val : parseFloat(val as any);
  if (isNaN(num) || num <= 0) return "N/A";
  const score100 = num <= 10 ? Math.round(num * 10) : Math.round(num);
  return `${score100}`;
};

interface CoachParameterSection {
  header: string;
  bullets: string[];
  summaryHeader: string;
  summaryOverview: string;
  highScoreStatement: string;
  lowScoreStatement: string;
  goalStatement: string;
}

interface CoachParameterRecommendation {
  description: string;
  high: CoachParameterSection;
  medium?: CoachParameterSection;
  low: CoachParameterSection;
}

const buildCoachingRecommendationsFromSource = (): Record<string, CoachParameterRecommendation> => {
  const recs: Record<string, CoachParameterRecommendation> = {};
  
  (Object.keys(CPI_PREDEFINED_SOURCE) as ApprovedCpiParameter[]).forEach((paramName) => {
    const src = CPI_PREDEFINED_SOURCE[paramName];
    const pHigh = src.practice.high;
    const pLow = src.practice.low;
    
    recs[paramName] = {
      description: src.description,
      high: {
        header: "",
        bullets: pHigh.actionPoints,
        summaryHeader: "",
        summaryOverview: "",
        highScoreStatement: "",
        lowScoreStatement: "",
        goalStatement: ""
      },
      low: {
        header: "",
        bullets: pLow.actionPoints,
        summaryHeader: "",
        summaryOverview: "",
        highScoreStatement: "",
        lowScoreStatement: "",
        goalStatement: ""
      }
    };
  });

  recs["Skills Level"] = recs["Skill Level"];
  recs["Concentration"] = recs["Focus"];

  return recs;
};

const coachingRecommendations = buildCoachingRecommendationsFromSource();

interface CpiActionPoint {
  title: string;
  detail: string;
}

interface CpiFrameworkItem {
  id: string;
  name: string;
  description: string;
  highPoints: CpiActionPoint[];
  highSummary?: string;
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

const buildFrameworkNotesFromSource = (): Record<string, CpiFrameworkItem> => {
  const notes: Record<string, CpiFrameworkItem> = {};
  
  (Object.keys(CPI_PREDEFINED_SOURCE) as ApprovedCpiParameter[]).forEach((paramName) => {
    const src = CPI_PREDEFINED_SOURCE[paramName];
    const pHigh = src.practice.high;
    const pLow = src.practice.low;
    
    notes[paramName] = {
      id: paramName.toLowerCase().replace(/\s+/g, "_"),
      name: paramName,
      description: src.description,
      highPoints: pHigh.actionPoints.map((pt) => {
        const parts = pt.split(". ");
        return {
          title: (parts[0] || pt).toUpperCase(),
          detail: parts.slice(1).join(". ") || pt
        };
      }),
      lowPoints: pLow.actionPoints.map((pt) => {
        const parts = pt.split(". ");
        return {
          title: (parts[0] || pt).toUpperCase(),
          detail: parts.slice(1).join(". ") || pt
        };
      }),
      coachSummary: {
        overview: src.practice.overview,
        high: pHigh.summary,
        low: pLow.summary,
        goal: src.practice.goal
      }
    };
  });
  
  notes["Skills Level"] = notes["Skill Level"];
  notes["Concentration"] = notes["Focus"];
  
  return notes;
};

const cpiFrameworkNotes = buildFrameworkNotesFromSource();

export interface CpiFocusArea {
  title: string;
  avg: number;
  cpiGuidance: string;
  actionPoints: { title: string; detail: string }[];
  daryllDirectives: string[];
  roleContext: string;
  coachingPriority: string;
  detail: string;
}

export const computeKeyPerformanceHighlightsFromFocusAreas = (
  focusAreas: { title: string; avg: number }[]
) => {
  if (!focusAreas || focusAreas.length === 0) {
    return {
      strongestArea: "N/A",
      needsImprovement: "N/A",
      weakestArea: "N/A"
    };
  }

  // Group parameters by score rounded to 1 decimal place
  const scoreMap = new Map<number, string[]>();
  focusAreas.forEach((item) => {
    const rounded = Math.round(item.avg * 10) / 10;
    if (!scoreMap.has(rounded)) {
      scoreMap.set(rounded, []);
    }
    scoreMap.get(rounded)!.push(item.title);
  });

  // Unique distinct scores in ascending order (lowest to highest)
  const distinctScores = Array.from(scoreMap.keys()).sort((a, b) => a - b);

  if (distinctScores.length === 0) {
    return {
      strongestArea: "N/A",
      needsImprovement: "N/A",
      weakestArea: "N/A"
    };
  }

  const formatGroup = (score: number) => {
    const params = scoreMap.get(score) || [];
    const scoreStr = score.toFixed(1).replace(/\.0$/, '.0');
    return params.map((p) => `${p} (${scoreStr})`).join(", ");
  };

  const highestScore = distinctScores[distinctScores.length - 1];
  const lowestScore = distinctScores[0];

  const strongestArea = formatGroup(highestScore);

  let weakestArea = "N/A";
  let needsImprovement = "N/A";

  if (distinctScores.length > 1) {
    weakestArea = formatGroup(lowestScore);
    const nextLowestScore = distinctScores[1]; // Next-lowest distinct score above weakest score
    needsImprovement = formatGroup(nextLowestScore);
  }

  return { strongestArea, needsImprovement, weakestArea };
};

const computeFocusAreasForPlayer = (
  player: Player,
  practiceHistory: any[],
  matchHistory: any[]
): CpiFocusArea[] => {
  const paramDefs: { name: string; keys: string[] }[] = [
    { name: "Technique", keys: ["technicalExecution", "technique"] },
    { name: "Skill Level", keys: ["skillsLevel", "skillLevel"] },
    { name: "Game Plan", keys: ["gamePlan"] },
    { name: "Preparation", keys: ["preparation"] },
    { name: "Intensity", keys: ["intensity"] }
  ];

  const practiceList = practiceHistory || [];
  const matchList = matchHistory || [];

  // Determine assessment context: "match" if latest assessment is a match, otherwise "practice"
  let context: "practice" | "match" = "practice";
  if (matchList.length > 0 && practiceList.length > 0) {
    const latestP = new Date(practiceList[0]?.date || practiceList[0]?.createdAt || 0).getTime();
    const latestM = new Date(matchList[0]?.date || matchList[0]?.createdAt || 0).getTime();
    if (latestM > latestP) {
      context = "match";
    }
  } else if (matchList.length > 0) {
    context = "match";
  }

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

    let overallAvg = 7.0;
    if (allScores.length > 0) {
      overallAvg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      overallAvg = Math.round(overallAvg * 10) / 10;
    } else {
      const availableScores: number[] = [];
      practiceList.forEach((s: any) => {
        ["technicalExecution", "skillsLevel", "gamePlan", "preparation", "intensity"].forEach((k) => {
          if (typeof s[k] === "number" && s[k] > 0) availableScores.push(s[k]);
        });
      });
      matchList.forEach((s: any) => {
        ["technicalExecution", "skillsLevel", "gamePlan", "preparation", "intensity"].forEach((k) => {
          if (typeof s[k] === "number" && s[k] > 0) availableScores.push(s[k]);
        });
      });
      if (availableScores.length > 0) {
        overallAvg = availableScores.reduce((a, b) => a + b, 0) / availableScores.length;
        overallAvg = Math.round(overallAvg * 10) / 10;
      } else {
        overallAvg = 7.0;
      }
    }

    const isHigh = overallAvg >= 7.0;
    const normName = normalizeCpiParameterName(p.name);
    const src = CPI_PREDEFINED_SOURCE[normName] || CPI_PREDEFINED_SOURCE["Technique"];
    const block = isHigh ? src[context].high : src[context].low;

    const planHeadings: Record<string, string> = {
      "Technique": "HOW TO COACH TECHNIQUE",
      "Skill Level": "HOW TO COACH SKILL LEVEL",
      "Game Plan": "HOW TO COACH GAME PLAN",
      "Preparation": "HOW TO COACH PREPARATION",
      "Intensity": "HOW TO COACH INTENSITY"
    };
    const planHeader = planHeadings[normName] || `HOW TO COACH ${normName.toUpperCase()}`;

    const actionPointsText = block.actionPoints.map((pt) => `• ${pt}`).join("\n");
    const detail = `${planHeader}\n${actionPointsText}`;

    const actionPoints = block.actionPoints.map((pt) => {
      const parts = pt.split(". ");
      return { title: parts[0] || pt, detail: parts.slice(1).join(". ") || pt };
    });

    return {
      name: p.name,
      avg: overallAvg,
      title: p.name,
      cpiGuidance: block.summary,
      actionPoints,
      daryllDirectives: block.actionPoints,
      roleContext: "",
      coachingPriority: src[context].goal,
      detail
    };
  });

  // Sort from Strongest to Weakest (highest score to lowest score)
  rankedParams.sort((a, b) => b.avg - a.avg);

  return rankedParams.map((p) => ({
    title: p.title,
    avg: p.avg,
    cpiGuidance: p.cpiGuidance,
    actionPoints: p.actionPoints,
    daryllDirectives: p.daryllDirectives,
    roleContext: p.roleContext,
    coachingPriority: p.coachingPriority,
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
  const { default: jsPDF } = await import("jspdf");
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
    doc.text(`Page ${pageNum} of 2`, pageWidth - 14, pageHeight - 10, { align: "right" });
  };

  // ==========================================
  // PAGE 1: Header, Player Information, 1. Summary, 2. 5 Key Performance Areas, 3. Strengths & 4. Improvements
  // ==========================================

  // HEADER (CPI Logo, Cricket Performance Index, Player Performance Report, Report Date, Coach Name)
  doc.setFillColor(255, 255, 255); // White Banner Background
  doc.rect(0, 0, pageWidth, 20, "F");

  doc.setFillColor(226, 232, 240); // Subtle Slate Divider Line
  doc.rect(0, 19.5, pageWidth, 0.8, "F");

  // CPI High-Res Logo Badge Icon (Crisp on white background)
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", 12, 2.5, 14, 15);
    } catch (e) {
      doc.setFillColor(15, 23, 42);
      doc.circle(18, 10, 6.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text("CPI", 18, 12.5, { align: "center" });
    }
  } else {
    doc.setFillColor(15, 23, 42);
    doc.circle(18, 10, 6.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("CPI", 18, 12.5, { align: "center" });
  }

  // Header Title & Subtitle (Executive dark slate text)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text("CRICKET PERFORMANCE INDEX", 29, 9.5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Player Performance Report", 29, 15.0);

  // Header Metadata (Report Date, Coach Name)
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text(`Report Date: ${reportDateStr}`, pageWidth - 14, 10, { align: "right" });
  doc.text(`Coach Name: ${coachName}`, pageWidth - 14, 16, { align: "right" });

  let y = 23;

  // PLAYER INFORMATION SECTION (Player Name, Player ID, Age, Role, Team, Assessment Date)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, pageWidth - 28, 27, 2.5, 2.5, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("PLAYER INFORMATION", 18, y + 5.5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text(`Player Name: ${player.name}`, 18, y + 12.0);
  doc.text(`Team: Senior Squad`, 110, y + 12.0);

  doc.text(`Player ID: #${player.id}`, 18, y + 17.5);
  doc.text(`Role: ${player.role}`, 110, y + 17.5);

  doc.text(`Assessment Date: ${lastAssessmentDate || reportDateStr}`, 18, y + 23.0);

  y += 32;

  // 1. OVERALL PERFORMANCE SUMMARY (CPI, PPI, MPI, Overall Rating)
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("1. OVERALL PERFORMANCE SUMMARY", 14, y);

  y += 5.0;

  const to100 = (val: number | null | undefined): number => {
    if (val === null || val === undefined || val === 0) return 0;
    let num = typeof val === "number" ? val : parseFloat(val as any);
    if (isNaN(num) || num <= 0) return 0;
    return num <= 10 ? Math.round(num * 10) : Math.round(num);
  };

  const cpiNum = to100(currentCpi);
  const ppiNum = to100(currentPpi);
  const mpiNum = to100(currentMpi);

  let ratingStr = "Low";
  let ratingColor = [225, 29, 72]; // Rose/Red
  if (cpiNum >= 70) {
    ratingStr = "High";
    ratingColor = [16, 185, 129]; // Green
  } else if (cpiNum >= 50) {
    ratingStr = "Average";
    ratingColor = [217, 119, 6]; // Amber
  }

  const boxWidth = (pageWidth - 28 - 9) / 4;

  // CPI Box
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, boxWidth, 20, 2.5, 2.5, "FD");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(194, 65, 12);
  doc.text("CPI SCORE", 18, y + 6.0);
  doc.setFontSize(12);
  doc.text(`${cpiNum || "N/A"}`, 18, y + 15.0);

  // PPI Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14 + boxWidth + 3, y, boxWidth, 20, 2.5, 2.5, "FD");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text("PPI SCORE", 18 + boxWidth + 3, y + 6.0);
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${ppiNum || "N/A"}`, 18 + boxWidth + 3, y + 15.0);

  // MPI Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14 + (boxWidth + 3) * 2, y, boxWidth, 20, 2.5, 2.5, "FD");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text("MPI SCORE", 18 + (boxWidth + 3) * 2, y + 6.0);
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${mpiNum || "N/A"}`, 18 + (boxWidth + 3) * 2, y + 15.0);

  // Overall Rating Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14 + (boxWidth + 3) * 3, y, boxWidth, 20, 2.5, 2.5, "FD");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text("OVERALL RATING", 18 + (boxWidth + 3) * 3, y + 6.0);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(ratingColor[0], ratingColor[1], ratingColor[2]);
  doc.text(ratingStr, 18 + (boxWidth + 3) * 3, y + 14.5);

  y += 25;

  // 2. 5 KEY PERFORMANCE AREAS
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("2. 5 KEY PERFORMANCE AREAS", 14, y);

  y += 5.0;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 6.5, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("PARAMETER", 18, y + 4.5);
  doc.text("SCORE (0-10)", 80, y + 4.5);
  doc.text("RATING", 116, y + 4.5);
  doc.text("PROGRESS BAR", 150, y + 4.5);

  y += 6.5;

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
    { name: "Technique", key: "technicalExecution" },
    { name: "Skill Level", key: "skillsLevel" },
    { name: "Game Plan", key: "gamePlan" },
    { name: "Preparation", key: "preparation" },
    { name: "Intensity", key: "intensity" }
  ];

  const paramData = paramDefs.map(p => {
    const score = getParamScore(p.key);
    let label = "High";
    let color = [16, 185, 129];
    if (score < 5.0) {
      label = "Low";
      color = [225, 29, 72];
    } else if (score < 7.0) {
      label = "Average";
      color = [217, 119, 6];
    }
    return { name: p.name, score, label, color };
  });

  paramData.forEach((p, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, 5.0, "F");
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(p.name, 18, y + 3.6);

    doc.setFont("helvetica", "bold");
    doc.text(`${p.score}`, 80, y + 3.6);

    doc.setFontSize(7.5);
    doc.setTextColor(p.color[0], p.color[1], p.color[2]);
    doc.text(p.label, 116, y + 3.6);

    // Progress Bar (out of 10)
    const barMaxW = 38;
    const fillW = Math.min(barMaxW, (p.score / 10) * barMaxW);
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(150, y + 0.9, barMaxW, 2.6, 1.2, 1.2, "F");

    doc.setFillColor(p.color[0], p.color[1], p.color[2]);
    if (fillW > 0) {
      doc.roundedRect(150, y + 0.9, fillW, 2.6, 1.2, 1.2, "F");
    }

    y += 5.0;
  });

  y += 5;

  // 3. STRENGTHS & 4. AREAS FOR IMPROVEMENT
  const sortedByScore = [...paramData].sort((a, b) => b.score - a.score);
  const strengths = sortedByScore.slice(0, 3);
  const improvements = [...paramData].sort((a, b) => a.score - b.score).slice(0, 3);

  const colW = (pageWidth - 28 - 6) / 2;

  // 3. STRENGTHS Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, y, colW, 23, 2.5, 2.5, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(21, 128, 61);
  doc.text("3. STRENGTHS", 18, y + 5.5);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  strengths.forEach((s, idx) => {
    doc.text(`• ${s.name} (${s.score})`, 18, y + 11 + idx * 3.8);
  });

  // 4. AREAS FOR IMPROVEMENT Box
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(14 + colW + 6, y, colW, 23, 2.5, 2.5, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 83, 9);
  doc.text("4. AREAS FOR IMPROVEMENT", 18 + colW + 6, y + 5.5);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  improvements.forEach((imp, idx) => {
    doc.text(`• ${imp.name} (${imp.score})`, 18 + colW + 6, y + 11 + idx * 3.8);
  });

  y += 28;

  // Helper for dynamic multi-page breaks
  const checkPageBreak = (neededHeight: number = 6) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      
      // Page Header Banner for Page 2+
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 16, "F");
      doc.setFillColor(226, 232, 240);
      doc.rect(0, 15.5, pageWidth, 0.6, "F");

      if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, "PNG", 14, 1.5, 9, 10); } catch (e) { }
      } else {
        doc.setFillColor(15, 23, 42);
        doc.circle(18, 7, 4.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.5);
        doc.setTextColor(255, 255, 255);
        doc.text("CPI", 18, 8.8, { align: "center" });
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`CRICKET PERFORMANCE INDEX — ${player.name} REPORT`, 26, 9.5);

      y = 22;
    }
  };

  // 5. KEY PERFORMANCE AREAS — STRONGEST TO WEAKEST
  checkPageBreak(12);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("5. KEY PERFORMANCE AREAS — STRONGEST TO WEAKEST", 14, y);

  y += 6.0;

  if (focusAreas && focusAreas.length > 0) {
    focusAreas.forEach((f: any) => {
      checkPageBreak(12);

      // PARAMETER NAME (e.g. Intensity (9.8))
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const scoreStr = typeof f.avg === "number" ? ` (${f.avg})` : "";
      doc.text(`${f.title}${scoreStr}`, 14, y);
      y += 3.8;

      // Thin divider line under parameter title
      doc.setFillColor(226, 232, 240);
      doc.rect(14, y, pageWidth - 28, 0.2, "F");
      y += 3.6;

      const detailText = f.detail || "";
      if (detailText) {
        const lines = detailText.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === "THE COACH'S SUMMARY") {
            break;
          }
          if (trimmed.startsWith("HOW TO COACH ") || trimmed === "THE COACH'S PLAN OF ACTION") {
            checkPageBreak(10);
            doc.setFontSize(8.0);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.text(trimmed, 14, y);
            y += 4.5;
          } else if (trimmed === "") {
            y += 1.5;
          } else {
            const wrappedLines = doc.splitTextToSize(line, pageWidth - 28);
            wrappedLines.forEach((wLine: string) => {
              checkPageBreak(5);
              doc.setFontSize(7.5);
              doc.setFont("helvetica", "normal");
              doc.setTextColor(51, 65, 85);
              doc.text(wLine, 14, y);
              y += 3.6;
            });
          }
        }
        y += 4.0;
      }
    });
  }

  y += 2.0;

  // 6. PERFORMANCE TREND (CPI Trend, PPI Trend, MPI Trend)
  checkPageBreak(35);
  doc.setFillColor(234, 88, 12);
  doc.roundedRect(14, y, pageWidth - 28, 6.5, 1.5, 1.5, "F");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("6. PERFORMANCE TREND", 18, y + 4.5);

  y += 8.0;

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(253, 186, 116);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, pageWidth - 28, 23, 2.5, 2.5, "FD");

  // 1. CPI Trend Calculation
  const trendHistoryMap: Record<string, { timestamp: number; ppi: number | null; mpi: number | null; cpi: number | null }> = {};

  (practiceHistory || []).forEach((p: any) => {
    const rawDate = p.date || p.createdAt;
    if (!rawDate) return;
    const dObj = new Date(rawDate);
    const dStr = dObj.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    const score = to100(p.ppiScore);
    if (!trendHistoryMap[dStr]) {
      trendHistoryMap[dStr] = { timestamp: dObj.getTime(), ppi: null, mpi: null, cpi: null };
    }
    if (score > 0) trendHistoryMap[dStr].ppi = score;
  });

  (matchHistory || []).forEach((m: any) => {
    const rawDate = m.date || m.createdAt;
    if (!rawDate) return;
    const dObj = new Date(rawDate);
    const dStr = dObj.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    const score = to100(m.mpiScore);
    if (!trendHistoryMap[dStr]) {
      trendHistoryMap[dStr] = { timestamp: dObj.getTime(), ppi: null, mpi: null, cpi: null };
    }
    if (score > 0) trendHistoryMap[dStr].mpi = score;
  });

  Object.values(trendHistoryMap).forEach(row => {
    if (row.ppi !== null && row.mpi !== null) {
      row.cpi = Math.round((row.ppi + row.mpi) / 2);
    } else if (row.ppi !== null) {
      row.cpi = row.ppi;
    } else if (row.mpi !== null) {
      row.cpi = row.mpi;
    }
  });

  const sortedCpiHistory = Object.values(trendHistoryMap)
    .filter(row => row.cpi !== null)
    .sort((a, b) => b.timestamp - a.timestamp);

  let cpiTrendText = "";
  if (sortedCpiHistory.length >= 2) {
    const currentCpiVal = cpiNum > 0 ? cpiNum : sortedCpiHistory[0].cpi!;
    const prevCpiVal = (sortedCpiHistory[0].cpi === currentCpiVal) ? sortedCpiHistory[1].cpi! : sortedCpiHistory[0].cpi!;
    if (currentCpiVal > prevCpiVal) {
      cpiTrendText = `CPI Trend: ${currentCpiVal} CPI \u2014 \u2191 Improving from the previous assessment period.`;
    } else if (currentCpiVal < prevCpiVal) {
      cpiTrendText = `CPI Trend: ${currentCpiVal} CPI \u2014 \u2193 Declining from the previous assessment period.`;
    } else {
      cpiTrendText = `CPI Trend: ${currentCpiVal} CPI \u2014 \u2192 Stable from the previous assessment period.`;
    }
  } else if (cpiNum > 0 || sortedCpiHistory.length === 1) {
    const val = cpiNum > 0 ? cpiNum : sortedCpiHistory[0]?.cpi;
    cpiTrendText = `CPI Trend: ${val} CPI \u2014 Trend: Insufficient data`;
  } else {
    cpiTrendText = `CPI Trend: Trend: Insufficient data`;
  }

  // 2. PPI Trend Calculation
  const validPracticeHistory = (practiceHistory || [])
    .map((p: any) => ({
      score: to100(p.ppiScore),
      timestamp: new Date(p.date || p.createdAt).getTime()
    }))
    .filter((p: any) => p.score > 0)
    .sort((a: any, b: any) => b.timestamp - a.timestamp);

  let ppiTrendText = "";
  if (validPracticeHistory.length >= 2) {
    const currentPpiVal = ppiNum > 0 ? ppiNum : validPracticeHistory[0].score;
    const prevPpiVal = (validPracticeHistory[0].score === currentPpiVal) ? validPracticeHistory[1].score : validPracticeHistory[0].score;
    if (currentPpiVal > prevPpiVal) {
      ppiTrendText = `PPI Trend: ${currentPpiVal} PPI \u2014 \u2191 Improving from the previous assessment period.`;
    } else if (currentPpiVal < prevPpiVal) {
      ppiTrendText = `PPI Trend: ${currentPpiVal} PPI \u2014 \u2193 Declining from the previous assessment period.`;
    } else {
      ppiTrendText = `PPI Trend: ${currentPpiVal} PPI \u2014 \u2192 Stable from the previous assessment period.`;
    }
  } else if (ppiNum > 0 || validPracticeHistory.length === 1) {
    const val = ppiNum > 0 ? ppiNum : validPracticeHistory[0]?.score;
    ppiTrendText = `PPI Trend: ${val} PPI \u2014 Trend: Insufficient data`;
  } else {
    ppiTrendText = `PPI Trend: Trend: Insufficient data`;
  }

  // 3. MPI Trend Calculation
  const validMatchHistory = (matchHistory || [])
    .map((m: any) => ({
      score: to100(m.mpiScore),
      timestamp: new Date(m.date || m.createdAt).getTime()
    }))
    .filter((m: any) => m.score > 0)
    .sort((a: any, b: any) => b.timestamp - a.timestamp);

  let mpiTrendText = "";
  if (validMatchHistory.length >= 2) {
    const currentMpiVal = mpiNum > 0 ? mpiNum : validMatchHistory[0].score;
    const prevMpiVal = (validMatchHistory[0].score === currentMpiVal) ? validMatchHistory[1].score : validMatchHistory[0].score;
    if (currentMpiVal > prevMpiVal) {
      mpiTrendText = `MPI Trend: ${currentMpiVal} MPI \u2014 \u2191 Improving from the previous assessment period.`;
    } else if (currentMpiVal < prevMpiVal) {
      mpiTrendText = `MPI Trend: ${currentMpiVal} MPI \u2014 \u2193 Declining from the previous assessment period.`;
    } else {
      mpiTrendText = `MPI Trend: ${currentMpiVal} MPI \u2014 \u2192 Stable from the previous assessment period.`;
    }
  } else if (mpiNum > 0 || validMatchHistory.length === 1) {
    const val = mpiNum > 0 ? mpiNum : validMatchHistory[0]?.score;
    mpiTrendText = `MPI Trend: ${val} MPI \u2014 Trend: Insufficient data`;
  } else {
    mpiTrendText = `MPI Trend: Trend: Insufficient data`;
  }

  doc.setFontSize(8.0);
  doc.setFont("helvetica", "bold");

  doc.setTextColor(234, 88, 12);
  doc.text("•", 18, y + 6.5);
  doc.setTextColor(15, 23, 42);
  doc.text(cpiTrendText, 22, y + 6.5);

  doc.setTextColor(234, 88, 12);
  doc.text("•", 18, y + 12.5);
  doc.setTextColor(15, 23, 42);
  doc.text(ppiTrendText, 22, y + 12.5);

  doc.setTextColor(234, 88, 12);
  doc.text("•", 18, y + 18.5);
  doc.setTextColor(15, 23, 42);
  doc.text(mpiTrendText, 22, y + 18.5);

  y += 28;

  // 7. ASSESSMENT HISTORY
  checkPageBreak(30);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("7. ASSESSMENT HISTORY", 14, y);

  y += 5.0;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 6.5, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("DATE", 18, y + 4.5);
  doc.text("PRACTICE (PPI)", 75, y + 4.5);
  doc.text("MATCH (MPI)", 125, y + 4.5);
  doc.text("CPI", 168, y + 4.5);

  y += 6.5;

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
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text("No assessment history records found.", 18, y + 4.5);
  } else {
    sortedHistoryRows.slice(0, 10).forEach((row, idx) => {
      checkPageBreak(6);
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, pageWidth - 28, 5.5, "F");
      }

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(row.date, 18, y + 4.0);
      doc.text(row.ppi, 75, y + 4.0);
      doc.text(row.mpi, 125, y + 4.0);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(194, 65, 12);
      doc.text(row.cpi, 168, y + 4.0);

      y += 5.5;
    });
  }

  // Draw footers across all dynamic pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Cricket Performance Index (CPI) • Official Confidential Player Report", 14, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: "right" });
  }

  doc.save(`${player.name.replace(/\s+/g, "_")}_Performance_Report.pdf`);
};

export default function PlayersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSliderInteraction = () => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      if (document.activeElement.tagName === "TEXTAREA" || document.activeElement.tagName === "INPUT") {
        document.activeElement.blur();
      }
    }
  };

  const [players, setPlayers] = useState<Player[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("cpi_cached_players");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("cpi_cached_players");
        if (saved && JSON.parse(saved).length > 0) return false;
      } catch (e) {}
    }
    return true;
  });
  const [fetchError, setFetchError] = useState<string | null>(null);
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
      if (params.has("id") || params.get("action") === "practice" || params.get("action") === "match") {
        return "profile";
      }
    }
    return "list";
  });
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("cpi_cached_players");
        if (saved) {
          const list = JSON.parse(saved);
          const params = new URLSearchParams(window.location.search);
          const idParam = params.get("id");
          if (idParam) {
            return list.find((p: Player) => p.id === Number(idParam)) || null;
          }
          if (params.get("action") === "practice" || params.get("action") === "match") {
            return list[0] || null;
          }
        }
      } catch (e) {}
    }
    return null;
  });

  // Modals / Overlays
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPracticeOverlay, setShowPracticeOverlay] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("action") === "practice";
    }
    return false;
  });
  const [showMatchOverlay, setShowMatchOverlay] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("action") === "match";
    }
    return false;
  });
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
  const [pdfPreset, setPdfPreset] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"highest_cpi" | "lowest_cpi" | "highest_ppi" | "lowest_ppi" | "highest_mpi" | "lowest_mpi" | "recently_assessed">("highest_cpi");
  const [quickFilter, setQuickFilter] = useState<"all" | "top_performers" | "needs_attention" | "assessed_today" | "not_assessed_recently">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "batsman" | "bowler" | "all_rounder" | "wicket_keeper">("all");
  const [copiedCode, setCopiedCode] = useState(false);
  const [expandedFocus, setExpandedFocus] = useState<number | null>(null);
  const [hoveredParamIndex, setHoveredParamIndex] = useState<number | null>(null);

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
          s.preparation, s.intensity
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
          s.preparation, s.intensity
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
  const [newPlayer, setNewPlayer] = useState<{
    name: string;
    age: string;
    role: string;
    battingStyle: string;
    bowlingStyle: string;
    photo: string;
    photoFile: File | null;
  }>({
    name: "",
    age: "",
    role: "Batsman",
    battingStyle: "Right-hand bat",
    bowlingStyle: "None",
    photo: "",
    photoFile: null
  });

  // Practice sliders (scores 0-10)
  const [practiceForm, setPracticeForm] = useState({
    technicalExecution: 7,
    skillsLevel: 7,
    gamePlan: 7,
    preparation: 7,
    intensity: 7,
    notes: ""
  });

  // Match sliders (scores 0-10)
  const [matchForm, setMatchForm] = useState({
    technicalExecution: 7,
    skillsLevel: 7,
    gamePlan: 7,
    preparation: 7,
    intensity: 7,
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
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);

  // Coach Notes & AI Summary States
  const [activeNotesTab, setActiveNotesTab] = useState<"practice" | "match">("practice");
  const [practiceAiSummary, setPracticeAiSummary] = useState<any | null>(null);
  const [matchAiSummary, setMatchAiSummary] = useState<any | null>(null);
  const [generatingPracticeSummary, setGeneratingPracticeSummary] = useState(false);
  const [generatingMatchSummary, setGeneratingMatchSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const handleGeneratePracticeSummary = async () => {
    if (!selectedPlayer) return;
    setGeneratingPracticeSummary(true);
    setSummaryError(null);
    try {
      const res = await api.post("/ai/coach-notes-summary", {
        playerId: selectedPlayer.id,
        assessmentType: "PRACTICE"
      });
      if (res.data && res.data.summary) {
        setPracticeAiSummary(res.data);
      } else {
        setSummaryError(res.data?.message || "Failed to generate Practice AI Summary.");
      }
    } catch (err: any) {
      console.error("Error generating Practice AI summary:", err);
      setSummaryError("Unable to connect to AI Summary service. Please check your network or try again.");
    } finally {
      setGeneratingPracticeSummary(false);
    }
  };

  const handleGenerateMatchSummary = async () => {
    if (!selectedPlayer) return;
    setGeneratingMatchSummary(true);
    setSummaryError(null);
    try {
      const res = await api.post("/ai/coach-notes-summary", {
        playerId: selectedPlayer.id,
        assessmentType: "MATCH"
      });
      if (res.data && res.data.summary) {
        setMatchAiSummary(res.data);
      } else {
        setSummaryError(res.data?.message || "Failed to generate Match AI Summary.");
      }
    } catch (err: any) {
      console.error("Error generating Match AI summary:", err);
      setSummaryError("Unable to connect to AI Summary service. Please check your network or try again.");
    } finally {
      setGeneratingMatchSummary(false);
    }
  };

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Target Goals states
  const [targetCpi, setTargetCpi] = useState<number>(85);
  const [targetGoal, setTargetGoal] = useState<string>("Improve core consistency");
  const [tempTargetCpi, setTempTargetCpi] = useState<string>("85");
  const [tempTargetGoal, setTempTargetGoal] = useState<string>("");
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // AI Technique Personalization State
  const [techniquePersonalizedPoints, setTechniquePersonalizedPoints] = useState<Array<{ cpiAnchor: string; personalizedGuidance: string }> | null>(null);
  const [loadingTechniquePersonalization, setLoadingTechniquePersonalization] = useState(false);

  useEffect(() => {
    if (selectedPlayer) {
      setTechniquePersonalizedPoints(null);
      setLoadingTechniquePersonalization(false);
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

  const fetchTechniquePersonalization = async (
    player: Player,
    avg: number,
    approvedDirectives: string[]
  ) => {
    if (loadingTechniquePersonalization || techniquePersonalizedPoints) return;
    setLoadingTechniquePersonalization(true);

    const notes: string[] = [];
    [...practiceHistory, ...matchHistory].forEach((a: any) => {
      if (a.coachFeedback && a.coachFeedback.trim() !== "") {
        notes.push(a.coachFeedback.trim());
      }
    });

    const currentPpiVal = player.ppiScore && player.ppiScore > 0 ? Math.round(player.ppiScore * 10) / 10 : 0;
    const currentMpiVal = player.mpiScore && player.mpiScore > 0 ? Math.round(player.mpiScore * 10) / 10 : 0;
    const currentCpiVal = currentPpiVal > 0 && currentMpiVal > 0 ? Math.round(((currentPpiVal + currentMpiVal) / 2) * 10) / 10 : currentPpiVal || currentMpiVal || 0;

    const cat = avg >= 7.0 ? "HIGH" : avg >= 5.0 ? "MEDIUM" : "LOW";

    try {
      const res = await api.post("/ai/personalize-coaching", {
        playerId: player.id,
        playerName: player.name,
        role: player.role,
        parameterName: "Technique",
        score: avg,
        scoreCategory: cat,
        cpi: currentCpiVal,
        ppi: currentPpiVal,
        mpi: currentMpiVal,
        coachNotes: notes.slice(0, 5),
        approvedCpiSourceText: approvedDirectives
      });

      if (res.data && res.data.personalizedPoints && res.data.personalizedPoints.length > 0) {
        setTechniquePersonalizedPoints(res.data.personalizedPoints);
      }
    } catch (err) {
      console.error("Technique personalization fetch failed, falling back to static predefined source:", err);
    } finally {
      setLoadingTechniquePersonalization(false);
    }
  };

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
  const [editPlayerForm, setEditPlayerForm] = useState<{
    name: string;
    age: string;
    role: string;
    battingStyle: string;
    bowlingStyle: string;
    photo: string;
    photoFile: File | null;
  }>({
    name: "",
    age: "16",
    role: "Batsman",
    battingStyle: "Right-hand bat",
    bowlingStyle: "None",
    photo: "",
    photoFile: null
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      if (players.length === 0) {
        setLoading(true);
      }
      setFetchError(null);
      const res = await api.get("/players");
      const list = res.data || [];
      setPlayers(list);
      try {
        sessionStorage.setItem("cpi_cached_players", JSON.stringify(list));
      } catch (e) {}
      fetchLastAssessmentDates(list);
    } catch (err: any) {
      console.error("Failed to fetch players", err);
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        setFetchError("Connection timed out while reaching backend. Please verify backend service and retry.");
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setFetchError("Authentication required. Please log in again to view your squad.");
      } else if (err.response?.status === 404) {
        setFetchError("Player endpoint not found (404). Please verify backend server configuration.");
      } else if (err.response?.status >= 500) {
        setFetchError(`Server error (${err.response.status}). Please try again later.`);
      } else {
        setFetchError("Unable to load player squad. Please check network connection or try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLastAssessmentDates = (playerList: Player[]) => {
    const datesMap: Record<number, string> = {};
    playerList.forEach((p) => {
      const allDates: string[] = [];
      if (p.lastPracticeDate) allDates.push(p.lastPracticeDate);
      if (p.lastMatchDate) allDates.push(p.lastMatchDate);

      // Check for self-assessment in local storage
      const localSelf = localStorage.getItem(`self_assess_${p.id}`);
      if (localSelf) {
        try {
          const selfList = JSON.parse(localSelf);
          selfList.forEach((x: any) => {
            if (x.date) allDates.push(x.date);
          });
        } catch (e) { }
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
    });
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

    const cachedProfile = sessionStorage.getItem("cpi_user_profile");
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        if (parsed.name) setCurrentCoachName(parsed.name);
      } catch (e) {}
    } else {
      const savedUserName = localStorage.getItem("userName");
      if (savedUserName) {
        setCurrentCoachName(savedUserName);
      }
    }

    // URL direct navigation check
    if (searchParams.get("add") === "true") {
      setShowAddForm(true);
    }
  }, [searchParams]);

  const loadedHistoryPlayerIdRef = useRef<number | null>(null);
  const inFlightHistoryRef = useRef<number | null>(null);

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
      const savedName = localStorage.getItem("userName");
      const matchingPlayer = savedName 
        ? (players.find((p) => p.name.toLowerCase() === savedName.toLowerCase()) || players[0])
        : players[0];

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
    } else if (searchParams.get("selfAssess") === "true") {
      const savedName = localStorage.getItem("userName");
      const matchingPlayer = savedName 
        ? (players.find((p) => p.name.toLowerCase() === savedName.toLowerCase()) || players[0])
        : players[0];

      if (matchingPlayer) {
        if (!selectedPlayer || selectedPlayer.id !== matchingPlayer.id) {
          setSelectedPlayer(matchingPlayer);
          setView("profile");
          loadHistory(matchingPlayer.id);
        }
        setShowSelfOverlay(true);
      }
    }
  } else if (!loading) {
    if (searchParams.get("id")) {
      setView("list");
    }
  }
}, [players, role, searchParams, loading]);

const loadHistory = async (playerId: number, forceRefresh: boolean = false) => {
  if (!forceRefresh) {
    if (inFlightHistoryRef.current === playerId) {
      return;
    }
    if (loadedHistoryPlayerIdRef.current === playerId && (practiceHistory.length > 0 || matchHistory.length > 0)) {
      return;
    }
  }
  inFlightHistoryRef.current = playerId;
  loadedHistoryPlayerIdRef.current = playerId;
  setIsHistoryLoading(true);
  try {
    const [pracRes, matchRes] = await Promise.all([
      api.get(`/practice/player/${playerId}`).catch(() => ({ data: [] })),
      api.get(`/matches/player/${playerId}`).catch(() => ({ data: [] }))
    ]);
    const pracData = (pracRes.data || []).sort(
      (a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
    );
    const matchData = (matchRes.data || []).sort(
      (a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
    );

    setPracticeHistory(pracData);
    setMatchHistory(matchData);
    setPracticeAiSummary(null);
    setMatchAiSummary(null);
    setSummaryError(null);

    const localSelf = localStorage.getItem(`self_assess_${playerId}`);
    const rawSelf = localSelf ? JSON.parse(localSelf) : [];
    const selfData = [...rawSelf].sort(
      (a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
    );
    setSelfHistory(selfData);
  } catch (err) {
    console.error("Failed to load assessments history", err);
  } finally {
    inFlightHistoryRef.current = null;
    setIsHistoryLoading(false);
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
    } catch (e) { }

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
  setIsHistoryLoading(true);
  setPracticeHistory([]);
  setMatchHistory([]);
  setSelfHistory([]);
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

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
};

const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>, isProfileUpdate = false) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    if (isProfileUpdate && selectedPlayer) {
      setSaving(true);
      const uploadedUrl = await uploadPlayerImage(file);
      if (uploadedUrl) {
        const updated = { ...selectedPlayer, imageUrl: uploadedUrl };
        setSelectedPlayer(updated);
        setPlayers((prev) => prev.map((p) => p.id === selectedPlayer.id ? { ...p, imageUrl: uploadedUrl } : p));
        await api.put(`/players/${selectedPlayer.id}`, { imageUrl: uploadedUrl });
      }
      setSaving(false);
    } else {
      const previewUrl = await compressImage(file);
      setNewPlayer(prev => ({ ...prev, photo: previewUrl, photoFile: file }));
    }
  } catch (err) {
    console.error("Failed to process photo", err);
    setSaving(false);
  }
};

const triggerSuccess = (msg: string) => {
  setSuccessMessage(msg);
  setShowSuccessOverlay(true);
  setTimeout(() => {
    setShowSuccessOverlay(false);
  }, 1500);
};

const handleAddPlayerSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (saving) return;
  setSaving(true);
  setError("");
  try {
    let finalImageUrl = "";
    if (newPlayer.photoFile) {
      finalImageUrl = await uploadPlayerImage(newPlayer.photoFile);
    } else if (newPlayer.photo) {
      finalImageUrl = newPlayer.photo;
    }

    const roleStr = `${newPlayer.role} (Age ${newPlayer.age})`;
    const res = await api.post("/players", {
      name: newPlayer.name,
      role: roleStr,
      battingStyle: newPlayer.battingStyle,
      bowlingStyle: newPlayer.bowlingStyle,
      imageUrl: finalImageUrl
    });

    const created = res.data;
    if (created && created.id) {
      setPlayers((prev) => {
        if (prev.some(p => p.id === created.id)) return prev;
        return [created, ...prev];
      });
      setShowAddForm(false);
      setNewPlayer({
        name: "",
        age: "",
        role: "Batsman",
        battingStyle: "Right-hand bat",
        bowlingStyle: "None",
        photo: "",
        photoFile: null
      });

      triggerSuccess("Player Added Successfully!");
    }
  } catch (err: any) {
    console.error("Error creating player:", err);
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
  const existingPhoto = player.imageUrl || "";
  setEditPlayerForm({
    name: player.name || "",
    age: age || "16",
    role: cleanRole || "Batsman",
    battingStyle: player.battingStyle || "Right-hand bat",
    bowlingStyle: player.bowlingStyle || "None",
    photo: existingPhoto,
    photoFile: null
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
    let finalImageUrl = editPlayerForm.photo || "";
    if (editPlayerForm.photoFile) {
      finalImageUrl = await uploadPlayerImage(editPlayerForm.photoFile);
    }

    const roleStr = editPlayerForm.age ? `${editPlayerForm.role} (Age ${editPlayerForm.age})` : editPlayerForm.role;
    const res = await api.put(`/players/${editingPlayer.id}`, {
      name: editPlayerForm.name,
      role: roleStr,
      battingStyle: editPlayerForm.battingStyle,
      bowlingStyle: editPlayerForm.bowlingStyle,
      imageUrl: finalImageUrl
    });
    const updated = res.data;

    setPlayers(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    if (selectedPlayer?.id === updated.id) {
      setSelectedPlayer(prev => prev ? { ...prev, ...updated } : null);
    }
    setShowEditForm(false);
    setEditingPlayer(null);
    triggerSuccess("Player Updated Successfully!");
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
    const formattedForm = {
      technicalExecution: Math.round(Number(practiceForm.technicalExecution)),
      skillsLevel: Math.round(Number(practiceForm.skillsLevel)),
      gamePlan: Math.round(Number(practiceForm.gamePlan)),
      preparation: Math.round(Number(practiceForm.preparation)),
      intensity: Math.round(Number(practiceForm.intensity)),
      notes: practiceForm.notes
    };
    await api.post("/practice", {
      playerId: selectedPlayer.id,
      date: new Date().toISOString().split("T")[0],
      ...formattedForm
    });
    setShowPracticeOverlay(false);
    triggerSuccess("Practice Assessment Saved!");

    // Refresh details
    const refreshRes = await api.get("/players");
    const updatedPlayers = refreshRes.data || [];
    setPlayers(updatedPlayers);
    const updated = updatedPlayers.find((p: Player) => p.id === selectedPlayer.id);
    if (updated) setSelectedPlayer(updated);
    loadHistory(selectedPlayer.id, true);
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
    const formattedForm = {
      technicalExecution: Math.round(Number(matchForm.technicalExecution)),
      skillsLevel: Math.round(Number(matchForm.skillsLevel)),
      gamePlan: Math.round(Number(matchForm.gamePlan)),
      preparation: Math.round(Number(matchForm.preparation)),
      intensity: Math.round(Number(matchForm.intensity)),
      notes: matchForm.notes
    };
    await api.post("/matches", {
      playerId: selectedPlayer.id,
      date: new Date().toISOString().split("T")[0],
      ...formattedForm
    });
    setShowMatchOverlay(false);
    triggerSuccess("Match Assessment Saved!");

    // Refresh details
    const refreshRes = await api.get("/players");
    const updatedPlayers = refreshRes.data || [];
    setPlayers(updatedPlayers);
    const updated = updatedPlayers.find((p: Player) => p.id === selectedPlayer.id);
    if (updated) setSelectedPlayer(updated);
    loadHistory(selectedPlayer.id, true);
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

  const formattedSelf = {
    sleep: Math.round(Number(selfForm.sleep)),
    nutrition: Math.round(Number(selfForm.nutrition)),
    preparation: Math.round(Number(selfForm.preparation)),
    health: Math.round(Number(selfForm.health)),
    mental: Math.round(Number(selfForm.mental)),
    fitness: Math.round(Number(selfForm.fitness))
  };

  const newAssessment = {
    date: new Date().toISOString().split("T")[0],
    ...formattedSelf
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
  if (r.includes("bowler")) return "🔴";
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

const squadStats = (() => {
  const total = players.length;
  if (total === 0) return { total: 0, avgCpi: "N/A", topPlayer: null, assessedCount: 0 };
  
  let assessedCount = 0;
  let cpiSum = 0;
  let topPlayer: Player | null = null;
  let maxCpi = -1;

  players.forEach((p) => {
    const scores = getPlayerScores(p);
    if (scores.cpi > 0) {
      assessedCount++;
      cpiSum += scores.cpi;
      if (scores.cpi > maxCpi) {
        maxCpi = scores.cpi;
        topPlayer = p;
      }
    }
  });

  const avgCpi = assessedCount > 0 ? (cpiSum / assessedCount <= 10 ? Math.round((cpiSum / assessedCount) * 10) : Math.round(cpiSum / assessedCount)) : "N/A";

  return {
    total,
    avgCpi,
    topPlayer,
    assessedCount
  };
})();

const roleCounts = (() => {
  let batsmen = 0;
  let bowlers = 0;
  let allRounders = 0;
  let wicketKeepers = 0;

  players.forEach((p) => {
    const r = (p.role || "").toLowerCase();
    if (r.includes("batsman") || r.includes("batter")) batsmen++;
    else if (r.includes("bowler")) bowlers++;
    else if (r.includes("all-rounder") || r.includes("all rounder") || r.includes("allrounder")) allRounders++;
    else if (r.includes("wicketkeeper") || r.includes("wicket-keeper") || r.includes("wicket keeper") || r.includes("keeper")) wicketKeepers++;
  });

  return {
    all: players.length,
    batsman: batsmen,
    bowler: bowlers,
    all_rounder: allRounders,
    wicket_keeper: wicketKeepers
  };
})();

return (
  <div className="space-y-6 pb-12 select-none">

    {/* ------------------ SUCCESS ANIMATION OVERLAY ------------------ */}
    {showSuccessOverlay && (
      <div className="fixed inset-0 bg-[#090A0E]/85 backdrop-blur-md z-[100] flex flex-col items-center justify-center space-y-4 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
          <CheckCircle2 className="w-12 h-12 text-[#D4AF37] stroke-[2.5] animate-bounce" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">{successMessage}</h2>
      </div>
    )}

    {/* ------------------ VIEW: PLAYER LIST ------------------ */}
    {view === "list" && (
      <div className="space-y-6">

        {/* SQUAD HERO COMMAND HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#181B27]/95 via-[#12141D] to-[#0A0B10] border border-white/8 p-5 sm:p-7 shadow-2xl">
          {/* Ambient background glows */}
          <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/8">
            <div className="space-y-1.5 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                SQUAD ROSTER & DIRECTORY
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-[#D4AF37] bg-clip-text text-transparent">
                Squad Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Track player benchmarks, assess training progression, and elevate match readiness.
              </p>
            </div>

            {role !== "player" && (
              <button
                id="tour-add-player-btn"
                onClick={() => setShowAddForm(true)}
                className="self-start sm:self-center flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] hover:from-[#FAD06C] hover:to-[#C99615] text-[#090A0E] font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-[#D4AF37]/50"
                title="Add Player"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Player</span>
              </button>
            )}
          </div>

          {/* Quick Squad Performance Stats Grid */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-4 sm:pt-5">
            <div className="bg-[#12141D]/90 border border-white/8 hover:border-[#D4AF37]/30 rounded-2xl p-3 sm:p-3.5 transition-all text-left">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Squad</span>
                <Users className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">{players.length}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">Active Roster</div>
            </div>

            <div className="bg-[#12141D]/90 border border-white/8 hover:border-[#D4AF37]/30 rounded-2xl p-3 sm:p-3.5 transition-all text-left">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Squad Avg CPI</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#D4AF37]">{squadStats.avgCpi}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">{squadStats.assessedCount} Assessed</div>
            </div>

            <div className="bg-[#12141D]/90 border border-white/8 hover:border-[#D4AF37]/30 rounded-2xl p-3 sm:p-3.5 transition-all text-left">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Top CPI Player</span>
                <Crown className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white truncate">
                {squadStats.topPlayer ? squadStats.topPlayer.name.split(" ")[0] : "—"}
              </div>
              <div className="text-[10px] text-[#D4AF37] font-black uppercase mt-0.5">
                {squadStats.topPlayer ? `${formatScoreValue(getPlayerScores(squadStats.topPlayer).cpi)} CPI` : "Pending"}
              </div>
            </div>

            <div className="bg-[#12141D]/90 border border-white/8 hover:border-[#D4AF37]/30 rounded-2xl p-3 sm:p-3.5 transition-all text-left">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Assessed Rate</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">
                {players.length > 0 ? `${Math.round((squadStats.assessedCount / players.length) * 100)}%` : "0%"}
              </div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">{squadStats.assessedCount} of {players.length} Done</div>
            </div>
          </div>
        </div>

        {/* Controls: Search Bar & Role Tabs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div id="tour-search" className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]/70 group-focus-within:text-[#D4AF37] transition-colors" />
              <input
                type="text"
                placeholder="SEARCH PLAYERS BY NAME OR ROLE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-13 sm:h-14 bg-[#12141D]/90 border border-white/10 group-hover:border-white/20 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 rounded-2xl pl-12 pr-10 text-sm sm:text-base font-bold text-white placeholder-zinc-500 focus:outline-none transition-all uppercase"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              id="tour-filter"
              onClick={() => setShowFilterOverlay(true)}
              className={`h-13 sm:h-14 px-4 sm:px-5 rounded-2xl flex items-center justify-center gap-2 border shrink-0 cursor-pointer transition-all active:scale-95 font-black text-xs uppercase tracking-wider ${
                sortBy !== "highest_cpi" || quickFilter !== "all" || roleFilter !== "all"
                  ? "bg-[#D4AF37] text-[#090A0E] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20"
                  : "bg-[#12141D] border-white/10 text-zinc-300 hover:text-white hover:border-white/20"
              }`}
              title="Filter Squad"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Quick Role Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { id: "all", label: "All", count: roleCounts.all, icon: Users },
              { id: "batsman", label: "Batsmen", count: roleCounts.batsman, emoji: "🏏" },
              { id: "bowler", label: "Bowlers", count: roleCounts.bowler, emoji: "🎯" },
              { id: "all_rounder", label: "All-Rounders", count: roleCounts.all_rounder, emoji: "⚡" },
              { id: "wicket_keeper", label: "Keepers", count: roleCounts.wicket_keeper, emoji: "🧤" },
            ].map((tab) => {
              const active = roleFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRoleFilter(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer border ${
                    active
                      ? "bg-[#D4AF37] text-[#090A0E] border-[#D4AF37] shadow-md shadow-[#D4AF37]/20"
                      : "bg-[#12141D]/90 text-zinc-400 border-white/8 hover:text-white hover:border-white/20"
                  }`}
                >
                  {tab.emoji ? <span>{tab.emoji}</span> : <tab.icon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    active ? "bg-[#090A0E]/20 text-[#090A0E]" : "bg-white/5 text-zinc-400"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Filter Chips */}
          {(sortBy !== "highest_cpi" || quickFilter !== "all" || roleFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-2 text-left pt-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Active:</span>
              {quickFilter !== "all" && (
                <span
                  onClick={() => setQuickFilter("all")}
                  className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] rounded-full text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer hover:bg-[#D4AF37]/20 transition-all"
                >
                  Filter: {quickFilter.replace(/_/g, " ")}
                  <X className="w-3 h-3 stroke-[3]" />
                </span>
              )}
              {roleFilter !== "all" && (
                <span
                  onClick={() => setRoleFilter("all")}
                  className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] rounded-full text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer hover:bg-[#D4AF37]/20 transition-all"
                >
                  Role: {roleFilter.replace(/_/g, " ")}
                  <X className="w-3 h-3 stroke-[3]" />
                </span>
              )}
              {sortBy !== "highest_cpi" && (
                <span
                  onClick={() => setSortBy("highest_cpi")}
                  className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] rounded-full text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer hover:bg-[#D4AF37]/20 transition-all"
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
                className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider pl-1 cursor-pointer transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Add Player Inline Form (Obsidian Glass) */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="border border-[#D4AF37]/40 bg-gradient-to-br from-[#181B27] via-[#12141D] to-[#0A0B10] rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/8">
                <div className="space-y-0.5 text-left">
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Plus className="w-5 h-5 text-[#D4AF37]" />
                    Add New Player
                  </h3>
                  <p className="text-xs text-zinc-400">Enroll a player into your squad roster for CPI tracking</p>
                </div>
                <button
                  onClick={() => { setShowAddForm(false); router.replace("/players"); }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 text-red-300 border border-red-500/30 text-xs font-bold p-3 rounded-xl text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddPlayerSubmit} className="space-y-4 text-left">
                {/* Photo Picker */}
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-xs font-bold tracking-widest text-zinc-400 block self-start">PLAYER PHOTO</span>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full bg-[#1B1E2C] border-2 border-dashed border-white/20 hover:border-[#D4AF37] cursor-pointer flex flex-col items-center justify-center overflow-hidden relative group transition-all"
                  >
                    {newPlayer.photo ? (
                      <img src={newPlayer.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-7 h-7 text-zinc-400 group-hover:text-[#D4AF37] mb-1 transition-colors" />
                        <span className="text-[11px] font-bold text-zinc-400 uppercase">CHOOSE</span>
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
                  <label className="text-xs font-bold tracking-widest text-zinc-400 uppercase">PLAYER FULL NAME</label>
                  <input
                    type="text"
                    required
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    className="w-full bg-[#1B1E2C] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-[#D4AF37]"
                    placeholder="Enter player full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold tracking-widest text-zinc-400 uppercase">AGE</label>
                    <input
                      type="number"
                      required
                      value={newPlayer.age}
                      onChange={(e) => setNewPlayer({ ...newPlayer, age: e.target.value })}
                      className="w-full bg-[#1B1E2C] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-[#D4AF37]"
                      placeholder="e.g. 19"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold tracking-widest text-zinc-400 uppercase">PLAYING ROLE</label>
                    <select
                      value={newPlayer.role}
                      onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value })}
                      className="w-full h-[46px] bg-[#1B1E2C] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-[#D4AF37] cursor-pointer"
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
                  className="w-full bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] hover:from-[#FAD06C] hover:to-[#C99615] text-[#090A0E] rounded-xl py-3.5 text-sm font-black tracking-wider uppercase transition-all shadow-lg shadow-[#D4AF37]/20 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin text-[#090A0E]" /> : "SAVE PLAYER TO ROSTER"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player Cards list */}
        {loading ? (
          <CricketLoader message="Loading Squad..." />
        ) : fetchError ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 text-red-400 mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white uppercase tracking-wide">Failed to Load Squad</h4>
            <p className="text-sm font-medium text-red-300 max-w-md mx-auto">{fetchError}</p>
            <button
              onClick={() => fetchData()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#D4AF37] hover:bg-amber-400 active:scale-95 text-[#090A0E] font-black rounded-xl shadow-md transition-all cursor-pointer uppercase text-xs tracking-wider"
            >
              Retry
            </button>
          </div>
        ) : sortedPlayers.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#12141D]/60 border border-dashed border-white/10 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-zinc-500">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white uppercase">No Players Found</h4>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              No squad members match the current search or filters.
            </p>
            <button
              onClick={() => { setSearchQuery(""); setRoleFilter("all"); setQuickFilter("all"); }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-[#D4AF37] uppercase tracking-wider cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div id="tour-player-list" className="space-y-3">
            {sortedPlayers.map((player, idx) => {
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

              const cachedPhoto = player.imageUrl || null;
              const assessDate = lastAssessmentDates[player.id];
              const { cleanRole, age } = parsePlayerAgeAndRole(player.role);
              const isTopPerformer = scores.cpi >= 80;

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  whileHover={{ y: -2 }}
                  onClick={() => handleSelectPlayer(player)}
                  className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#181B27]/95 via-[#12141D] to-[#0D0E15] border border-white/8 hover:border-[#D4AF37]/50 p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(212,175,55,0.12)] cursor-pointer"
                >
                  {/* Subtle background hover glow */}
                  <div className="pointer-events-none absolute -right-16 -top-16 w-40 h-40 bg-[#D4AF37]/0 rounded-full blur-2xl group-hover:bg-[#D4AF37]/10 transition-all duration-500" />

                  {/* Left Column: Avatar & Player Meta */}
                  <div className="flex items-center gap-3.5 sm:gap-4.5 min-w-0 relative z-10">
                    {/* Avatar with Glow Ring */}
                    <div className="relative shrink-0">
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] transition-all duration-300 ${
                        isTopPerformer
                          ? "bg-gradient-to-tr from-[#D4AF37] via-amber-300 to-[#D4AF37]/40 shadow-md shadow-[#D4AF37]/20"
                          : "bg-gradient-to-tr from-white/20 via-white/5 to-[#D4AF37]/30 group-hover:from-[#D4AF37]/60 group-hover:to-amber-300/60"
                      }`}>
                        <div className="w-full h-full rounded-full bg-[#12141D] overflow-hidden flex items-center justify-center">
                          <img
                            src={cachedPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=1B1E2C&color=D4AF37&font-size=0.45&bold=true`}
                            alt={player.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                      </div>

                      {/* Role Emoji Badge */}
                      <div
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#090A0E] border border-white/20 rounded-full flex items-center justify-center text-xs shadow-md z-10"
                        title={player.role}
                      >
                        {getRoleEmoji(player.role)}
                      </div>
                    </div>

                    {/* Name & Details */}
                    <div className="min-w-0 text-left space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-black text-white truncate tracking-tight group-hover:text-amber-300 transition-colors">
                          {player.name}
                        </h4>
                        {isTopPerformer && (
                          <Crown className="w-4 h-4 text-[#D4AF37] shrink-0 fill-[#D4AF37]/20" />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-left">
                        {/* Clean Role Badge */}
                        <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-black uppercase tracking-wider">
                          {cleanRole}
                        </span>

                        {/* Age Badge */}
                        {age && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                            Age {age}
                          </span>
                        )}

                        {/* Batting/Bowling style */}
                        {player.battingStyle && (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-zinc-400 text-[10px] font-medium truncate max-w-[120px]">
                            {player.battingStyle}
                          </span>
                        )}
                      </div>

                      {/* Assessment Recency Indicator */}
                      {assessDate && (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium pt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                          <span>{assessDate === "Loading..." ? "Assessing..." : `Assessed: ${assessDate}`}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Score Metric & Actions */}
                  <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 relative z-10">
                    {/* Score Pill */}
                    <div className="text-right px-3 py-1.5 rounded-xl bg-[#090A0E]/60 border border-white/8 group-hover:border-[#D4AF37]/30 transition-all min-w-[70px] sm:min-w-[85px]">
                      <div className="text-[9px] font-black text-zinc-400 tracking-widest uppercase">
                        {scoreLabel}
                      </div>
                      <div className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-[#D4AF37] bg-clip-text text-transparent tracking-tight">
                        {scoreDisplay}
                      </div>
                      {/* Micro PPI & MPI preview if both exist */}
                      {player.ppiScore && player.mpiScore ? (
                        <div className="hidden sm:flex items-center justify-end gap-1.5 text-[9px] font-bold text-zinc-500 pt-0.5">
                          <span>P:{Math.round(player.ppiScore <= 10 ? player.ppiScore * 10 : player.ppiScore)}</span>
                          <span>•</span>
                          <span>M:{Math.round(player.mpiScore <= 10 ? player.mpiScore * 10 : player.mpiScore)}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Coach Edit & Delete actions */}
                    {role !== "player" && (
                      <div className="flex items-center gap-1.5 border-l border-white/10 pl-2.5 sm:pl-3">
                        <button
                          onClick={(e) => handleOpenEditModal(player, e)}
                          className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 text-zinc-400 hover:text-[#D4AF37] border border-white/8 hover:border-[#D4AF37]/40 transition-all cursor-pointer"
                          title="Edit Player"
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={(e) => handleOpenDeleteModal(player, e)}
                          className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/8 hover:border-rose-500/30 transition-all cursor-pointer"
                          title="Delete Player"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    )}

                    {/* View Arrow Cue */}
                    <div className="hidden sm:flex items-center justify-center text-zinc-500 group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all">
                      <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  </div>
                </motion.div>
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
      // Dynamically generate focus areas from the 5 CPI parameters ranked Strongest to Weakest
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

      const latestPractice = last5Prac[0] || null;

      const cpiVal = currentCpi ? parseFloat(formatScoreValue(currentCpi)) : 0;
      const gapVal = targetCpi > 0 && cpiVal > 0 ? Math.round((targetCpi - cpiVal) * 10) / 10 : 0;
      const targetPercent = Math.min(100, Math.max(0, Math.round((cpiVal / targetCpi) * 100)));

      const devMetrics = [
        { name: "Technique", val: latestPractice ? (latestPractice.technicalExecution ?? latestPractice.technique ?? "7.0") : "7.0" },
        { name: "Skill Level", val: latestPractice ? (latestPractice.skillsLevel ?? latestPractice.skillLevel ?? "7.0") : "7.0" },
        { name: "Game Plan", val: latestPractice ? (latestPractice.gamePlan ?? "7.0") : "7.0" },
        { name: "Preparation", val: latestPractice ? (latestPractice.preparation ?? "7.0") : "7.0" },
        { name: "Intensity", val: latestPractice ? (latestPractice.intensity ?? "7.0") : "7.0" }
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
                className="w-28 h-28 rounded-full bg-slate-100 border-3 border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-orange-500 shadow-md"
              >
                <img
                  src={selectedPlayer.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPlayer.name)}&background=ffedd5&color=ea580c&font-size=0.45&bold=true`}
                  alt={selectedPlayer.name}
                  className="w-full h-full object-cover rounded-full"
                />
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
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{selectedPlayer.name}</h2>
              <p className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">{selectedPlayer.role}</p>
              <div className="text-sm text-slate-600 font-bold uppercase mt-1">
                Style: {selectedPlayer.battingStyle || "N/A"} • {selectedPlayer.bowlingStyle || "N/A"}
              </div>
              <div className="text-xs text-slate-800 font-extrabold uppercase tracking-wider">
                Last Assessed: {lastAssessmentDate}
              </div>
            </div>

            {/* Generate PDF Report option in bottom of player card box */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => {
                  let minDate: string | null = null;
                  const allLogs = [...(practiceHistory || []), ...(matchHistory || []), ...(selfHistory || [])];
                  allLogs.forEach((item: any) => {
                    const val = item.date || item.createdAt;
                    if (val) {
                      const dStr = typeof val === "string" ? val.split("T")[0] : new Date(val).toISOString().split("T")[0];
                      if (dStr && (!minDate || dStr < minDate)) minDate = dStr;
                    }
                  });
                  if (!minDate) {
                    const defaultStart = new Date();
                    defaultStart.setFullYear(defaultStart.getFullYear() - 2);
                    minDate = defaultStart.toISOString().split("T")[0];
                  }
                  const todayStr = new Date().toISOString().split("T")[0];
                  setPdfFromDate(minDate);
                  setPdfToDate(todayStr);
                  setPdfPreset("all");
                  setShowPdfDateOverlay(true);
                }}
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

          {/* SECTION 2 – PLAYER'S CURRENT STATUS */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5.5 space-y-4 text-left">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-xs sm:text-sm font-black tracking-widest text-slate-900 uppercase flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />
                PLAYER'S CURRENT STATUS
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 text-center pt-1">
              <div className="bg-orange-50 border border-orange-200 p-3 sm:p-4 rounded-2xl flex flex-col items-center justify-center min-w-0">
                <p className="text-[10px] sm:text-xs font-black text-orange-600 uppercase tracking-wider mb-1 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  CPI SCORE
                </p>
                <p className="text-2xl sm:text-4xl font-black text-orange-600 tracking-tight leading-none whitespace-nowrap">
                  {formatScoreValue(currentCpi)}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-2xl flex flex-col items-center justify-center min-w-0">
                <p className="text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider mb-1 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  PPI SCORE
                </p>
                <p className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none whitespace-nowrap">
                  {formatScoreValue(currentPpi)}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-2xl flex flex-col items-center justify-center min-w-0">
                <p className="text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider mb-1 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  MPI SCORE
                </p>
                <p className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none whitespace-nowrap">
                  {formatScoreValue(currentMpi)}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 5 – KEY PERFORMANCE HIGHLIGHTS */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5 text-left shadow-xs">
            {/* Header */}
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-black tracking-widest text-slate-900 uppercase flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-500" />
                  KEY PERFORMANCE HIGHLIGHTS
                </h3>
                <p className="text-[11px] sm:text-xs font-extrabold text-slate-500 tracking-wider uppercase mt-0.5">
                  BITE-SIZED COACHING SUMMARY
                </p>
              </div>
            </div>

            {(() => {
              // Fixed CPI parameters in order
              const fixedParams = [
                { name: "Technique", keys: ["technicalExecution", "technique"] },
                { name: "Skill Level", keys: ["skillsLevel", "skillLevel"] },
                { name: "Game Plan", keys: ["gamePlan"] },
                { name: "Preparation", keys: ["preparation"] },
                { name: "Intensity", keys: ["intensity"] }
              ];

              // 1 & 2: Current scores for STRONGEST and WEAKEST
              const currentScores = fixedParams.map((p) => {
                const found = focusAreas.find(
                  (item) => item.title.toLowerCase() === p.name.toLowerCase()
                );
                const score = found && typeof found.avg === "number" ? found.avg : 7.0;
                return {
                  name: p.name,
                  score: Math.min(10, Math.max(0, Math.round(score * 10) / 10))
                };
              });

              const sortedByScoreDesc = [...currentScores].sort((a, b) => b.score - a.score);
              const strongestItem = sortedByScoreDesc[0];
              const weakestItem = sortedByScoreDesc[sortedByScoreDesc.length - 1];

              const strongestText = strongestItem ? `${strongestItem.name} — ${strongestItem.score.toFixed(1)}` : "N/A";
              const weakestText = weakestItem ? `${weakestItem.name} — ${weakestItem.score.toFixed(1)}` : "N/A";

              // Historical assessments for improvement & consistency
              const allAssessments = [...(practiceHistory || []), ...(matchHistory || [])]
                .map((s: any) => ({
                  ...s,
                  timestamp: new Date(s.date || s.createdAt || 0).getTime()
                }))
                .filter((s: any) => s.timestamp > 0)
                .sort((a: any, b: any) => a.timestamp - b.timestamp);

              const paramHistories: {
                name: string;
                scores: number[];
                diff: number;
                stdDev: number;
              }[] = [];

              fixedParams.forEach((p) => {
                const scores: number[] = [];
                allAssessments.forEach((s: any) => {
                  for (const k of p.keys) {
                    if (typeof s[k] === "number" && s[k] > 0) {
                      let val = s[k];
                      if (val > 10) val = val / 10;
                      val = Math.min(10, Math.max(0, Math.round(val * 10) / 10));
                      scores.push(val);
                      break;
                    }
                  }
                });

                if (scores.length >= 2) {
                  const earliest = scores[0];
                  const latest = scores[scores.length - 1];
                  const diff = Math.round((latest - earliest) * 10) / 10;
                  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
                  const variance = scores.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / scores.length;
                  const stdDev = Math.sqrt(variance);

                  paramHistories.push({
                    name: p.name,
                    scores,
                    diff,
                    stdDev
                  });
                }
              });

              // 3 & 4: FASTEST MOVER & SLOWEST MOVER
              const positiveImprovements = paramHistories
                .filter((ph) => ph.diff > 0)
                .sort((a, b) => b.diff - a.diff);

              let fastestMoverText = "Insufficient data";
              let slowestMoverText = "Insufficient data";

              if (positiveImprovements.length > 0) {
                const fastest = positiveImprovements[0];
                fastestMoverText = `${fastest.name} — ↑ ${fastest.diff.toFixed(1)}`;

                if (positiveImprovements.length >= 2) {
                  const slowest = positiveImprovements[positiveImprovements.length - 1];
                  slowestMoverText = `${slowest.name} — ↑ ${slowest.diff.toFixed(1)}`;
                } else {
                  slowestMoverText = `${fastest.name} — ↑ ${fastest.diff.toFixed(1)}`;
                }
              }

              const highlightItems = [
                {
                  label: "STRONGEST",
                  value: strongestText,
                  icon: Zap,
                  iconBg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                },
                {
                  label: "WEAKEST",
                  value: weakestText,
                  icon: Target,
                  iconBg: "bg-rose-500/10 text-rose-600 border-rose-500/20"
                },
                {
                  label: "FASTEST MOVER",
                  value: fastestMoverText,
                  icon: TrendingUp,
                  iconBg: "bg-orange-500/10 text-orange-600 border-orange-500/20"
                },
                {
                  label: "SLOWEST MOVER",
                  value: slowestMoverText,
                  icon: Flame,
                  iconBg: "bg-amber-500/10 text-amber-600 border-amber-500/20"
                }
              ];

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {highlightItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="bg-slate-50/90 p-4.5 sm:p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-3 text-left transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold shrink-0 ${item.iconBg}`}>
                            <IconComponent className="w-4.5 h-4.5" />
                          </div>
                          <span className="text-xs sm:text-sm font-extrabold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                            {item.label}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                          {item.value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* SECTION 5 – KEY PERFORMANCE AREAS (STRONGEST TO WEAKEST) */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5.5 space-y-4 text-left">
            <h3 className="text-xs font-black tracking-widest text-slate-900 uppercase border-b border-slate-200 pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              KEY PERFORMANCE AREAS — STRONGEST TO WEAKEST
            </h3>
            <div className="space-y-2.5 pt-1">
                {focusAreas.map((focus, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden transition-all duration-300 cursor-pointer hover:border-orange-300"
                    onClick={() => {
                      const isExpanding = expandedFocus !== idx;
                      setExpandedFocus(isExpanding ? idx : null);
                      if (isExpanding && focus.title === "Technique" && !techniquePersonalizedPoints && !loadingTechniquePersonalization) {
                        fetchTechniquePersonalization(selectedPlayer, focus.avg, focus.daryllDirectives);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 p-3.5">
                      <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 border border-orange-500/30 flex items-center justify-center font-black text-xs shrink-0 font-mono">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-black text-slate-900 flex-1 min-w-0 truncate">{focus.title}</span>
                      {typeof focus.avg === "number" && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="w-[64px] text-center text-[11px] font-bold text-slate-700 bg-white px-1.5 py-1 rounded-lg border border-slate-200 font-mono inline-block">
                            {focus.avg}
                          </span>
                          <span
                            className={`w-[105px] text-center text-[10px] font-extrabold px-2 py-1 rounded-full uppercase tracking-wider inline-flex items-center justify-center ${focus.avg >= 7.0
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                : focus.avg >= 5.0
                                  ? "bg-amber-100 text-amber-700 border border-amber-300"
                                  : "bg-red-100 text-red-700 border border-red-300"
                              }`}
                          >
                            {focus.avg >= 7.0 ? "High" : focus.avg >= 5.0 ? "Average" : "Low"}
                          </span>
                        </div>
                      )}
                      <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-300 ${expandedFocus === idx ? "rotate-180 text-orange-500" : ""}`} />
                    </div>
                    {focus.detail ? (
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedFocus === idx ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                          }`}
                      >
                        <div className="px-5 pb-5 pt-3.5 border-t border-slate-200 bg-white space-y-2">
                          {focus.title === "Technique" && techniquePersonalizedPoints && techniquePersonalizedPoints.length > 0 ? (
                            <div className="space-y-3 pt-1">
                              <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 font-extrabold text-[10px] uppercase tracking-wider">
                                  <Sparkles className="w-3 h-3 text-orange-500" />
                                  AI PERSONALIZED FOR {selectedPlayer.role.toUpperCase()}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  Grounded on Daryll's CPI Framework
                                </span>
                              </div>

                              <div className="space-y-2.5">
                                {techniquePersonalizedPoints.map((pt, pIdx) => (
                                  <div key={pIdx} className="bg-orange-50/40 border border-orange-200/70 rounded-xl p-3 space-y-1.5 text-left">
                                    <p className="text-xs font-bold text-slate-900 leading-relaxed">
                                      {pt.personalizedGuidance}
                                    </p>
                                    <div className="flex items-center gap-1.5 pt-1 border-t border-orange-100 text-[10px] font-extrabold text-orange-700">
                                      <span className="shrink-0 bg-orange-500/20 text-orange-700 px-1.5 py-0.5 rounded font-mono uppercase">
                                        CPI ANCHOR
                                      </span>
                                      <span className="truncate italic font-semibold text-slate-600">
                                        "{pt.cpiAnchor}"
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : loadingTechniquePersonalization && focus.title === "Technique" ? (
                            <div className="py-4 flex items-center justify-center gap-2 text-xs font-bold text-orange-600">
                              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                              <span>Personalizing Technique guidance for {selectedPlayer.role}...</span>
                            </div>
                          ) : (
                            <p className="text-xs font-semibold text-slate-800 leading-[1.75] whitespace-pre-line">
                              {focus.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
          </div>

          {/* SECTION 7 – ASSESSMENT HISTORY */}
          <div className="bg-white bg-white border border-slate-200 rounded-3xl p-5.5 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="text-xs sm:text-sm font-black tracking-widest text-slate-900 uppercase flex items-center gap-2">
                <Brain className="w-4 h-4 text-orange-500" />
                ASSESSMENT HISTORY
              </h3>
              <button
                onClick={() => setShowHistoryOverlay(true)}
                className="text-xs font-black text-orange-600 hover:text-orange-700 uppercase tracking-wider transition-colors cursor-pointer"
              >
                VIEW ALL
              </button>
            </div>

            <div className="space-y-4 pt-1">
              {/* Practice History scroll area */}
              <div>
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-2 border-b border-slate-200 pb-1.5">
                  PRACTICE HISTORY – {practiceHistory.length} {practiceHistory.length === 1 ? "ASSESSMENT" : "ASSESSMENTS"} DONE
                </span>
                {practiceHistory.length === 0 ? (
                  <p className="text-xs text-slate-600 font-bold uppercase py-1">No Practice History</p>
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
                          <span className="text-xs text-slate-600 font-semibold">{new Date(p.date || p.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className="font-extrabold text-orange-600 text-sm tracking-tight">PPI {formatScoreValue(p.ppiScore)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Match History scroll area */}
              <div>
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-2 border-b border-slate-200 pb-1.5">
                  MATCH HISTORY – {matchHistory.length} {matchHistory.length === 1 ? "ASSESSMENT" : "ASSESSMENTS"} DONE
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

          {/* COACH NOTES & AI SUMMARY SECTION */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5.5 space-y-4 text-left shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
              <h3 className="text-xs sm:text-sm font-black tracking-widest text-slate-900 uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                COACH NOTES & AI SUMMARY
              </h3>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveNotesTab("practice")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeNotesTab === "practice"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Practice Notes ({practiceHistory.filter((p: any) => p.notes && p.notes.trim()).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveNotesTab("match")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeNotesTab === "match"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Match Notes ({matchHistory.filter((m: any) => m.notes && m.notes.trim()).length})
                </button>
              </div>
            </div>

            {summaryError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold p-3 rounded-xl flex items-center justify-between">
                <span>{summaryError}</span>
                <button onClick={() => setSummaryError(null)} className="text-red-400 hover:text-red-700 text-xs font-bold">Dismiss</button>
              </div>
            )}

            {/* PRACTICE NOTES TAB CONTENT */}
            {activeNotesTab === "practice" && (
              <div className="space-y-4 pt-1">
                <div>
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                    PRACTICE COACH NOTES LOG
                  </span>
                  {practiceHistory.filter((p: any) => p.notes && p.notes.trim()).length === 0 ? (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200 text-center">
                      <p className="text-xs text-slate-500 font-bold uppercase">No Practice Coach Notes Saved Yet</p>
                      <p className="text-[11px] text-slate-400 mt-1">Enter remarks while completing a Practice Assessment to save notes here.</p>
                    </div>
                  ) : (
                    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                      {practiceHistory
                        .filter((p: any) => p.notes && p.notes.trim())
                        .map((p: any, idx: number) => (
                          <div key={p.id || idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-extrabold text-slate-700">{new Date(p.date || p.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</span>
                              <span className="font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200/50">PPI {formatScoreValue(p.ppiScore)}</span>
                            </div>
                            <p className="text-xs text-slate-800 italic bg-white p-2.5 rounded-xl border border-slate-200/60 font-mono">
                              "{p.notes.trim()}"
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-orange-500" />
                      PRACTICE AI SUMMARY
                    </span>
                    <button
                      type="button"
                      disabled={generatingPracticeSummary || practiceHistory.filter((p: any) => p.notes && p.notes.trim()).length === 0}
                      onClick={handleGeneratePracticeSummary}
                      className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      {generatingPracticeSummary ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                          {practiceAiSummary ? "Regenerate Practice AI Summary" : "Generate Practice AI Summary"}
                        </>
                      )}
                    </button>
                  </div>

                  {practiceAiSummary ? (
                    <div className="bg-orange-50/40 border border-orange-200/70 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                      {practiceAiSummary.summary?.summaryOverview && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black tracking-widest uppercase text-orange-600 block">Overview</span>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            {practiceAiSummary.summary.summaryOverview}
                          </p>
                        </div>
                      )}

                      {practiceAiSummary.summary?.keyObservations?.length > 0 && (
                        <div className="space-y-1 pt-2 border-t border-orange-200/40">
                          <span className="text-[10px] font-black tracking-widest uppercase text-orange-600 block">Key Observations</span>
                          <ul className="space-y-1">
                            {practiceAiSummary.summary.keyObservations.map((obs: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                                <span className="text-orange-500 font-bold">•</span>
                                <span>{obs}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {practiceAiSummary.summary?.recurringPatterns?.length > 0 && (
                        <div className="space-y-1 pt-2 border-t border-orange-200/40">
                          <span className="text-[10px] font-black tracking-widest uppercase text-orange-600 block">Recurring Patterns</span>
                          <ul className="space-y-1">
                            {practiceAiSummary.summary.recurringPatterns.map((pat: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                                <span className="text-orange-500 font-bold">•</span>
                                <span>{pat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                      <p className="text-xs text-slate-500 font-medium">
                        {practiceHistory.filter((p: any) => p.notes && p.notes.trim()).length === 0
                          ? "Save Practice Coach Notes during assessments to generate an AI summary."
                          : "Click 'Generate Practice AI Summary' to analyze saved practice coach notes."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MATCH NOTES TAB CONTENT */}
            {activeNotesTab === "match" && (
              <div className="space-y-4 pt-1">
                <div>
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                    MATCH COACH NOTES LOG
                  </span>
                  {matchHistory.filter((m: any) => m.notes && m.notes.trim()).length === 0 ? (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200 text-center">
                      <p className="text-xs text-slate-500 font-bold uppercase">No Match Coach Notes Saved Yet</p>
                      <p className="text-[11px] text-slate-400 mt-1">Enter remarks while completing a Match Assessment to save notes here.</p>
                    </div>
                  ) : (
                    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                      {matchHistory
                        .filter((m: any) => m.notes && m.notes.trim())
                        .map((m: any, idx: number) => (
                          <div key={m.id || idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-extrabold text-slate-700">{new Date(m.date || m.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</span>
                              <span className="font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200/50">MPI {formatScoreValue(m.mpiScore)}</span>
                            </div>
                            <p className="text-xs text-slate-800 italic bg-white p-2.5 rounded-xl border border-slate-200/60 font-mono">
                              "{m.notes.trim()}"
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-orange-500" />
                      MATCH AI SUMMARY
                    </span>
                    <button
                      type="button"
                      disabled={generatingMatchSummary || matchHistory.filter((m: any) => m.notes && m.notes.trim()).length === 0}
                      onClick={handleGenerateMatchSummary}
                      className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      {generatingMatchSummary ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                          {matchAiSummary ? "Regenerate Match AI Summary" : "Generate Match AI Summary"}
                        </>
                      )}
                    </button>
                  </div>

                  {matchAiSummary ? (
                    <div className="bg-orange-50/40 border border-orange-200/70 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                      {matchAiSummary.summary?.summaryOverview && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black tracking-widest uppercase text-orange-600 block">Overview</span>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            {matchAiSummary.summary.summaryOverview}
                          </p>
                        </div>
                      )}

                      {matchAiSummary.summary?.keyObservations?.length > 0 && (
                        <div className="space-y-1 pt-2 border-t border-orange-200/40">
                          <span className="text-[10px] font-black tracking-widest uppercase text-orange-600 block">Key Observations</span>
                          <ul className="space-y-1">
                            {matchAiSummary.summary.keyObservations.map((obs: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                                <span className="text-orange-500 font-bold">•</span>
                                <span>{obs}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {matchAiSummary.summary?.recurringPatterns?.length > 0 && (
                        <div className="space-y-1 pt-2 border-t border-orange-200/40">
                          <span className="text-[10px] font-black tracking-widest uppercase text-orange-600 block">Recurring Patterns</span>
                          <ul className="space-y-1">
                            {matchAiSummary.summary.recurringPatterns.map((pat: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                                <span className="text-orange-500 font-bold">•</span>
                                <span>{pat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                      <p className="text-xs text-slate-500 font-medium">
                        {matchHistory.filter((m: any) => m.notes && m.notes.trim()).length === 0
                          ? "Save Match Coach Notes during assessments to generate an AI summary."
                          : "Click 'Generate Match AI Summary' to analyze saved match coach notes."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      );
    })()}

    {/* ------------------ OVERLAY: PRACTICE ASSESSMENT ------------------ */}
    {showPracticeOverlay && selectedPlayer && (() => {
      const keys = ["technicalExecution", "skillsLevel", "gamePlan", "preparation", "intensity"] as const;
      const sum = keys.reduce((acc, k) => acc + Number((practiceForm as any)[k] || 0), 0);
      const avg = sum / keys.length;
      const ppi100 = (avg * 10).toFixed(1);
      const calcScore = Number(avg.toFixed(1));

      let tierTitle = "Solid Performer";
      let tierBadgeStyle = "bg-amber-500/15 text-amber-300 border-amber-500/30";
      let tierDesc = "Good physical and technical foundation with scope for further improvement in intensity and game plan execution.";
      if (calcScore >= 8.5) {
        tierTitle = "Elite Tier";
        tierBadgeStyle = "bg-purple-500/15 text-purple-300 border-purple-500/30";
        tierDesc = "Exceptional technical execution, tactical clarity, and competitive intensity across all core training metrics.";
      } else if (calcScore >= 7.0) {
        tierTitle = "First-Class / Academy Tier";
        tierBadgeStyle = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
        tierDesc = "Solid technical foundation with high growth potential in tactical decision-making and execution.";
      } else if (calcScore < 5.0) {
        tierTitle = "Developmental Tier";
        tierBadgeStyle = "bg-rose-500/15 text-rose-300 border-rose-500/30";
        tierDesc = "Fundamental stance, technique, and session preparation adjustments needed to elevate performance consistency.";
      }

      return (
        <div className="fixed inset-0 h-[100dvh] bg-[#090A0E]/90 backdrop-blur-xl z-50 flex items-start justify-center p-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4 sm:items-center text-left select-none font-montserrat overflow-hidden">
          <div className="w-full max-w-lg md:max-w-xl h-full sm:h-auto max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:max-h-[92vh] bg-gradient-to-b from-[#181B27]/98 via-[#12141D] to-[#0A0B10] border border-white/10 sm:border-[#D4AF37]/35 rounded-2xl sm:rounded-3xl p-3 sm:p-4.5 shadow-2xl flex flex-col justify-between my-0 sm:my-auto relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="pointer-events-none absolute -top-20 -left-20 w-52 h-52 bg-[#D4AF37]/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl" />

            {/* Header: Centered Prominent Title & Close Button */}
            <div className="relative z-10 flex items-center justify-center pb-2.5 border-b border-white/8 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                <h2 className="text-sm sm:text-base font-black tracking-wider text-white uppercase text-center font-montserrat">
                  Practice Assessment
                </h2>
              </div>

              {/* Close Button at top-right */}
              <button
                type="button"
                onClick={() => setShowPracticeOverlay(false)}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Player Profile Section Directly Below Heading */}
            <div className="relative z-10 flex items-center justify-between gap-3 bg-[#12141D] border border-white/8 hover:border-[#D4AF37]/30 rounded-2xl p-2.5 sm:p-3 shrink-0 transition-all">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Real Player Profile Image */}
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-br from-[#D4AF37] to-amber-700 shrink-0 shadow-md">
                  <img
                    src={selectedPlayer.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPlayer.name)}&background=181B27&color=D4AF37&font-size=0.45&bold=true`}
                    alt={selectedPlayer.name}
                    className="w-full h-full object-cover rounded-full bg-[#181B27]"
                  />
                </div>

                {/* Player Name & Role */}
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide truncate">
                    {selectedPlayer.name}
                  </h3>
                  {selectedPlayer.role ? (
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#D4AF37] tracking-wider uppercase block truncate">
                      {selectedPlayer.role}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                      Player #{selectedPlayer.id}
                    </span>
                  )}
                </div>
              </div>

              {/* Player Selector Dropdown Capsule */}
              <div className="flex items-center gap-1.5 bg-[#1B1E2C] border border-white/10 hover:border-[#D4AF37]/40 rounded-xl px-2.5 py-1.5 text-xs shrink-0 transition-colors">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">SWITCH:</span>
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
                          notes: ""
                        });
                        setError("");
                        window.history.replaceState(null, "", `/players?id=${nextPlayer.id}&action=practice`);
                      }
                    }}
                    className="appearance-none bg-transparent font-black text-xs text-[#D4AF37] pr-4 cursor-pointer focus:outline-none uppercase tracking-wider"
                  >
                    {players.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#12141D] text-white font-bold">
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute inset-y-0 right-0 my-auto w-3 h-3 text-[#D4AF37]" />
                </div>
              </div>
            </div>

            {error && (
              <div className="relative z-10 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold p-1.5 rounded-xl uppercase tracking-wider text-center shrink-0 my-1">
                {error}
              </div>
            )}

            {/* Form: 5 Indexes -> Large Result Card -> Remarks -> Save CTA */}
            <form onSubmit={handlePracticeSubmit} className="relative z-10 flex-1 min-h-0 overflow-y-auto pr-1 pt-2 space-y-3 sm:space-y-4">
              {/* Stacked Single-Column List for the 5 Indexes */}
              <div className="space-y-2 sm:space-y-2.5">
                {[
                  { label: "TECHNIQUE", key: "technicalExecution" },
                  { label: "SKILL LEVEL", key: "skillsLevel" },
                  { label: "GAME PLAN", key: "gamePlan" },
                  { label: "PREPARATION", key: "preparation" },
                  { label: "INTENSITY", key: "intensity" }
                ].map((metric) => {
                  const numVal = Number((practiceForm as any)[metric.key]);
                  const intScore = Math.round(numVal);
                  const pct = Math.min(100, Math.max(0, (numVal / 10) * 100));

                  let statusLabel = "DEV";
                  let statusBadgeColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                  if (intScore >= 7) {
                    statusLabel = "STRONG";
                    statusBadgeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                  } else if (intScore >= 4) {
                    statusLabel = "MODERATE";
                    statusBadgeColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                  }

                  return (
                    <div
                      key={metric.key}
                      className="w-full bg-[#12141D] hover:bg-[#181B27] px-3.5 py-2 sm:px-4 sm:py-2.5 border border-white/8 hover:border-[#D4AF37]/40 rounded-xl shadow-xs transition-all flex flex-col justify-between gap-1.5"
                    >
                      {/* Metric Header Row */}
                      <div className="flex justify-between items-center gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <label className="text-[11px] sm:text-xs font-black tracking-wider text-white uppercase truncate">
                            {metric.label}
                          </label>
                          <span className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded border uppercase tracking-wider shrink-0 ${statusBadgeColor}`}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* Score Value Pill */}
                        <div className="flex items-baseline gap-0.5 bg-[#1B1E2C] border border-white/10 px-2.5 py-0.5 rounded-lg shrink-0">
                          <span className="text-sm font-black text-[#D4AF37] leading-none">
                            {intScore}
                          </span>
                          <span className="text-[9px] font-bold text-zinc-500">/10</span>
                        </div>
                      </div>

                      {/* Slider Track Row */}
                      <div className="relative pt-0.5">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.01"
                          value={(practiceForm as any)[metric.key]}
                          onPointerDown={handleSliderInteraction}
                          onTouchStart={handleSliderInteraction}
                          onFocus={handleSliderInteraction}
                          onChange={(e) => {
                            handleSliderInteraction();
                            setPracticeForm({ ...practiceForm, [metric.key]: parseFloat(e.target.value) });
                          }}
                          style={{
                            background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${pct}%, #1B1E2C ${pct}%, #1B1E2C 100%)`,
                            touchAction: "none"
                          }}
                          className="ppi-mpi-slider w-full h-1.5 sm:h-2 rounded-full appearance-none cursor-pointer touch-none focus:outline-none"
                        />
                        <div className="flex justify-between items-center text-[7.5px] sm:text-[8px] font-bold text-zinc-500 px-0.5 pt-0.5 leading-none">
                          <span>0</span>
                          <span>5</span>
                          <span>10</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Large Prominent Calculated PPI Score Result Card (Matching CPI Diagnostic Simulator) */}
              <div className="rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-b from-[#181B27] via-[#12141D] to-[#0A0B10] p-4 sm:p-5 text-center shadow-xl space-y-2.5 my-2">
                <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-widest block">
                  CALCULATED PPI SCORE
                </span>

                <div className="flex items-baseline justify-center gap-1.5 pt-0.5">
                  <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-[#D4AF37] bg-clip-text text-transparent leading-none tracking-tight">
                    {ppi100}
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-zinc-400">
                    /100
                  </span>
                </div>

                <div className="pt-0.5">
                  <span className="inline-block px-4 py-1 rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold tracking-wide">
                    {tierTitle}
                  </span>
                </div>

                <p className="text-[11px] sm:text-xs text-zinc-400 font-medium leading-relaxed max-w-md mx-auto pt-0.5">
                  {tierDesc}
                </p>
              </div>

              {/* Coach Remarks Input */}
              <div className="relative pt-0.5">
                <input
                  type="text"
                  value={practiceForm.notes}
                  onChange={(e) => setPracticeForm({ ...practiceForm, notes: e.target.value })}
                  placeholder="Coach Remarks & Drill Observations (Optional)..."
                  className="w-full h-10 sm:h-11 bg-[#1B1E2C] border border-white/10 rounded-xl px-3.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37] transition-all font-montserrat"
                />
              </div>

              {/* Save Assessment Action Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] hover:from-[#FAD06C] hover:to-[#C99615] text-[#090A0E] rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20 active:scale-98 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#090A0E]" />
                    <span>Saving Assessment...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Save Assessment</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      );
    })()}

    {/* ------------------ OVERLAY: MATCH ASSESSMENT ------------------ */}
    {showMatchOverlay && selectedPlayer && (() => {
      const keys = ["technicalExecution", "skillsLevel", "gamePlan", "preparation", "intensity"] as const;
      const sum = keys.reduce((acc, k) => acc + Number((matchForm as any)[k] || 0), 0);
      const avg = sum / keys.length;
      const mpi100 = (avg * 10).toFixed(1);
      const calcScore = Number(avg.toFixed(1));

      let tierTitle = "Solid Performer";
      let tierBadgeStyle = "bg-amber-500/15 text-amber-300 border-amber-500/30";
      let tierDesc = "Good physical and technical foundation with scope for further improvement in intensity and game plan execution.";
      if (calcScore >= 8.5) {
        tierTitle = "Elite Tier";
        tierBadgeStyle = "bg-purple-500/15 text-purple-300 border-purple-500/30";
        tierDesc = "Exceptional technical execution, tactical clarity, and competitive intensity across all match conditions.";
      } else if (calcScore >= 7.0) {
        tierTitle = "First-Class / Academy Tier";
        tierBadgeStyle = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
        tierDesc = "Solid technical foundation with high growth potential in match decision-making and execution.";
      } else if (calcScore < 5.0) {
        tierTitle = "Developmental Tier";
        tierBadgeStyle = "bg-rose-500/15 text-rose-300 border-rose-500/30";
        tierDesc = "Fundamental stance, technique, and match preparation adjustments needed to elevate performance under pressure.";
      }

      return (
        <div className="fixed inset-0 h-[100dvh] bg-[#090A0E]/90 backdrop-blur-xl z-50 flex items-start justify-center p-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4 sm:items-center text-left select-none font-montserrat overflow-hidden">
          <div className="w-full max-w-lg md:max-w-xl h-full sm:h-auto max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:max-h-[92vh] bg-gradient-to-b from-[#181B27]/98 via-[#12141D] to-[#0A0B10] border border-white/10 sm:border-[#D4AF37]/35 rounded-2xl sm:rounded-3xl p-3 sm:p-4.5 shadow-2xl flex flex-col justify-between my-0 sm:my-auto relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="pointer-events-none absolute -top-20 -left-20 w-52 h-52 bg-[#D4AF37]/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl" />

            {/* Header: Centered Prominent Title & Close Button */}
            <div className="relative z-10 flex items-center justify-center pb-2.5 border-b border-white/8 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                <h2 className="text-sm sm:text-base font-black tracking-wider text-white uppercase text-center font-montserrat">
                  Match Assessment
                </h2>
              </div>

              {/* Close Button at top-right */}
              <button
                type="button"
                onClick={() => setShowMatchOverlay(false)}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Player Profile Section Directly Below Heading */}
            <div className="relative z-10 flex items-center justify-between gap-3 bg-[#12141D] border border-white/8 hover:border-[#D4AF37]/30 rounded-2xl p-2.5 sm:p-3 shrink-0 transition-all">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Real Player Profile Image */}
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-br from-[#D4AF37] to-amber-700 shrink-0 shadow-md">
                  <img
                    src={selectedPlayer.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPlayer.name)}&background=181B27&color=D4AF37&font-size=0.45&bold=true`}
                    alt={selectedPlayer.name}
                    className="w-full h-full object-cover rounded-full bg-[#181B27]"
                  />
                </div>

                {/* Player Name & Role */}
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide truncate">
                    {selectedPlayer.name}
                  </h3>
                  {selectedPlayer.role ? (
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#D4AF37] tracking-wider uppercase block truncate">
                      {selectedPlayer.role}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                      Player #{selectedPlayer.id}
                    </span>
                  )}
                </div>
              </div>

              {/* Player Selector Dropdown Capsule */}
              <div className="flex items-center gap-1.5 bg-[#1B1E2C] border border-white/10 hover:border-[#D4AF37]/40 rounded-xl px-2.5 py-1.5 text-xs shrink-0 transition-colors">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">SWITCH:</span>
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
                          notes: ""
                        });
                        setError("");
                        window.history.replaceState(null, "", `/players?id=${nextPlayer.id}&action=match`);
                      }
                    }}
                    className="appearance-none bg-transparent font-black text-xs text-[#D4AF37] pr-4 cursor-pointer focus:outline-none uppercase tracking-wider"
                  >
                    {players.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#12141D] text-white font-bold">
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute inset-y-0 right-0 my-auto w-3 h-3 text-[#D4AF37]" />
                </div>
              </div>
            </div>

            {error && (
              <div className="relative z-10 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold p-1.5 rounded-xl uppercase tracking-wider text-center shrink-0 my-1">
                {error}
              </div>
            )}

            {/* Form: 5 Indexes -> Large Result Card -> Remarks -> Save CTA */}
            <form onSubmit={handleMatchSubmit} className="relative z-10 flex-1 min-h-0 overflow-y-auto pr-1 pt-2 space-y-3 sm:space-y-4">
              {/* Stacked Single-Column List for the 5 Indexes */}
              <div className="space-y-2 sm:space-y-2.5">
                {[
                  { label: "TECHNIQUE", key: "technicalExecution" },
                  { label: "SKILL LEVEL", key: "skillsLevel" },
                  { label: "GAME PLAN", key: "gamePlan" },
                  { label: "PREPARATION", key: "preparation" },
                  { label: "INTENSITY", key: "intensity" }
                ].map((metric) => {
                  const numVal = Number((matchForm as any)[metric.key]);
                  const intScore = Math.round(numVal);
                  const pct = Math.min(100, Math.max(0, (numVal / 10) * 100));

                  let statusLabel = "DEV";
                  let statusBadgeColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                  if (intScore >= 7) {
                    statusLabel = "STRONG";
                    statusBadgeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                  } else if (intScore >= 4) {
                    statusLabel = "MODERATE";
                    statusBadgeColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                  }

                  return (
                    <div
                      key={metric.key}
                      className="w-full bg-[#12141D] hover:bg-[#181B27] px-3.5 py-2 sm:px-4 sm:py-2.5 border border-white/8 hover:border-[#D4AF37]/40 rounded-xl shadow-xs transition-all flex flex-col justify-between gap-1.5"
                    >
                      {/* Metric Header Row */}
                      <div className="flex justify-between items-center gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <label className="text-[11px] sm:text-xs font-black tracking-wider text-white uppercase truncate">
                            {metric.label}
                          </label>
                          <span className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded border uppercase tracking-wider shrink-0 ${statusBadgeColor}`}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* Score Value Pill */}
                        <div className="flex items-baseline gap-0.5 bg-[#1B1E2C] border border-white/10 px-2.5 py-0.5 rounded-lg shrink-0">
                          <span className="text-sm font-black text-[#D4AF37] leading-none">
                            {intScore}
                          </span>
                          <span className="text-[9px] font-bold text-zinc-500">/10</span>
                        </div>
                      </div>

                      {/* Slider Track Row */}
                      <div className="relative pt-0.5">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.01"
                          value={(matchForm as any)[metric.key]}
                          onPointerDown={handleSliderInteraction}
                          onTouchStart={handleSliderInteraction}
                          onFocus={handleSliderInteraction}
                          onChange={(e) => {
                            handleSliderInteraction();
                            setMatchForm({ ...matchForm, [metric.key]: parseFloat(e.target.value) });
                          }}
                          style={{
                            background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${pct}%, #1B1E2C ${pct}%, #1B1E2C 100%)`,
                            touchAction: "none"
                          }}
                          className="ppi-mpi-slider w-full h-1.5 sm:h-2 rounded-full appearance-none cursor-pointer touch-none focus:outline-none"
                        />
                        <div className="flex justify-between items-center text-[7.5px] sm:text-[8px] font-bold text-zinc-500 px-0.5 pt-0.5 leading-none">
                          <span>0</span>
                          <span>5</span>
                          <span>10</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Large Prominent Calculated MPI Score Result Card (Matching CPI Diagnostic Simulator) */}
              <div className="rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-b from-[#181B27] via-[#12141D] to-[#0A0B10] p-4 sm:p-5 text-center shadow-xl space-y-2.5 my-2">
                <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-widest block">
                  CALCULATED MPI SCORE
                </span>

                <div className="flex items-baseline justify-center gap-1.5 pt-0.5">
                  <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-[#D4AF37] bg-clip-text text-transparent leading-none tracking-tight">
                    {mpi100}
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-zinc-400">
                    /100
                  </span>
                </div>

                <div className="pt-0.5">
                  <span className="inline-block px-4 py-1 rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold tracking-wide">
                    {tierTitle}
                  </span>
                </div>

                <p className="text-[11px] sm:text-xs text-zinc-400 font-medium leading-relaxed max-w-md mx-auto pt-0.5">
                  {tierDesc}
                </p>
              </div>

              {/* Coach Remarks Input */}
              <div className="relative pt-0.5">
                <input
                  type="text"
                  value={matchForm.notes}
                  onChange={(e) => setMatchForm({ ...matchForm, notes: e.target.value })}
                  placeholder="Coach Remarks & Match Performance Highlights (Optional)..."
                  className="w-full h-10 sm:h-11 bg-[#1B1E2C] border border-white/10 rounded-xl px-3.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37] transition-all font-montserrat"
                />
              </div>

              {/* Save Assessment Action Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] hover:from-[#FAD06C] hover:to-[#C99615] text-[#090A0E] rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20 active:scale-98 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#090A0E]" />
                    <span>Saving Assessment...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Save Assessment</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      );
    })()}

    {/* ------------------ OVERLAY: SELF ASSESSMENT ------------------ */}
    {showSelfOverlay && selectedPlayer && (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto p-6 space-y-6 text-left select-none pb-10">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
          <div className="space-y-1">
            <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900">MY SELF GRADES</h3>
            <p className="text-xs text-orange-500 font-bold">{selectedPlayer.name}</p>
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
                <span className="text-xl font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">
                  {Math.round(Number((selfForm as any)[metric.key]))}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.01"
                value={(selfForm as any)[metric.key]}
                onPointerDown={handleSliderInteraction}
                onTouchStart={handleSliderInteraction}
                onFocus={handleSliderInteraction}
                onChange={(e) => {
                  handleSliderInteraction();
                  setSelfForm({ ...selfForm, [metric.key]: parseFloat(e.target.value) });
                }}
                style={{ touchAction: "none" }}
                className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500 touch-none"
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
            <p className="text-xs text-orange-500 font-bold">{selectedPlayer.name}</p>
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
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            PRACTICE HISTORY – {practiceHistory.length} {practiceHistory.length === 1 ? "ASSESSMENT" : "ASSESSMENTS"} DONE
          </h4>
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
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            MATCH HISTORY – {matchHistory.length} {matchHistory.length === 1 ? "ASSESSMENT" : "ASSESSMENTS"} DONE
          </h4>
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
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            SELF ASSESSMENT HISTORY – {selfHistory.length} {selfHistory.length === 1 ? "ASSESSMENT" : "ASSESSMENTS"} DONE
          </h4>
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
                      {avg.toFixed(1)}
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
              Parameter Ratings
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Technique", val: selectedAssessmentDetail.data.technicalExecution },
                { label: "Skill Level", val: selectedAssessmentDetail.data.skillsLevel || selectedAssessmentDetail.data.technique },
                { label: "Game Plan", val: selectedAssessmentDetail.data.gamePlan },
                { label: "Preparation", val: selectedAssessmentDetail.data.preparation },
                { label: "Intensity", val: selectedAssessmentDetail.data.intensity }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">{item.label}</span>
                  <span className="font-bold text-slate-900 tracking-tight">{item.val !== undefined && item.val !== null ? `${item.val}` : "N/A"}</span>
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
            <p className="text-xs text-orange-500 font-bold">{selectedPlayer.name}</p>
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
      <div className="fixed inset-0 bg-[#090A0E]/85 backdrop-blur-md z-[60] flex items-end justify-center animate-fade-in select-none">
        <div className="bg-[#12141D] border-t border-[#D4AF37]/30 w-full max-w-lg rounded-t-[32px] p-6 sm:p-7 space-y-6 pb-10 shadow-2xl animate-slide-up">

          <div className="flex justify-between items-center pb-3 border-b border-white/8">
            <div className="space-y-0.5">
              <h3 className="text-xl font-black text-white uppercase tracking-tight text-left">Filter & Sort Squad</h3>
              <p className="text-xs text-zinc-400 font-bold uppercase text-left">{sortedPlayers.length} players matched</p>
            </div>
            <button
              onClick={() => setShowFilterOverlay(false)}
              className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SORT BY */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-black tracking-widest text-zinc-400 uppercase">SORT BY</label>
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${sortBy === opt.val
                      ? "bg-[#D4AF37] text-[#090A0E] border-[#D4AF37] shadow-md shadow-[#D4AF37]/20 font-black"
                      : "bg-[#181B27] text-zinc-400 border-white/8 hover:text-white hover:border-white/20"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* QUICK FILTERS */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-black tracking-widest text-zinc-400 uppercase">QUICK FILTERS</label>
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${quickFilter === opt.val
                      ? "bg-[#D4AF37] text-[#090A0E] border-[#D4AF37] shadow-md shadow-[#D4AF37]/20 font-black"
                      : "bg-[#181B27] text-zinc-400 border-white/8 hover:text-white hover:border-white/20"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ROLE FILTERS */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-black tracking-widest text-zinc-400 uppercase">ROLE FILTERS</label>
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${roleFilter === opt.val
                      ? "bg-[#D4AF37] text-[#090A0E] border-[#D4AF37] shadow-md shadow-[#D4AF37]/20 font-black"
                      : "bg-[#181B27] text-zinc-400 border-white/8 hover:text-white hover:border-white/20"
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
            className="w-full bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] hover:from-[#FAD06C] hover:to-[#C99615] text-[#090A0E] rounded-xl py-4 text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-xl active:scale-98"
          >
            Apply & View Squad
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
                onChange={(e) => {
                  setPdfFromDate(e.target.value);
                  setPdfPreset("");
                }}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-500 transition-all shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black tracking-wider text-slate-700 uppercase block">TO DATE</label>
              <input
                type="date"
                value={pdfToDate}
                onChange={(e) => {
                  setPdfToDate(e.target.value);
                  setPdfPreset("");
                }}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-500 transition-all shadow-xs"
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">QUICK PRESETS</label>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    id: "all",
                    label: "ALL TIME",
                    getDates: () => {
                      let minDate: string | null = null;
                      const allLogs = [...(practiceHistory || []), ...(matchHistory || []), ...(selfHistory || [])];
                      allLogs.forEach((item: any) => {
                        const val = item.date || item.createdAt;
                        if (val) {
                          const dStr = typeof val === "string" ? val.split("T")[0] : new Date(val).toISOString().split("T")[0];
                          if (dStr && (!minDate || dStr < minDate)) minDate = dStr;
                        }
                      });
                      if (!minDate) {
                        const defaultStart = new Date();
                        defaultStart.setFullYear(defaultStart.getFullYear() - 2);
                        minDate = defaultStart.toISOString().split("T")[0];
                      }
                      return { start: minDate, end: new Date().toISOString().split("T")[0] };
                    }
                  },
                  {
                    id: "7_days",
                    label: "LAST 7 DAYS",
                    getDates: () => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 7);
                      return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
                    }
                  },
                  {
                    id: "30_days",
                    label: "LAST 30 DAYS",
                    getDates: () => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 30);
                      return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
                    }
                  },
                  {
                    id: "90_days",
                    label: "LAST 90 DAYS",
                    getDates: () => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 90);
                      return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
                    }
                  },
                  {
                    id: "this_year",
                    label: "THIS YEAR",
                    getDates: () => {
                      const end = new Date();
                      const start = new Date(end.getFullYear(), 0, 1);
                      return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
                    }
                  }
                ].map((preset) => {
                  const isActive = pdfPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        const { start, end } = preset.getDates();
                        setPdfFromDate(start);
                        setPdfToDate(end);
                        setPdfPreset(preset.id);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${isActive
                          ? "bg-orange-500 text-white border-2 border-orange-500 shadow-md shadow-orange-500/25 scale-[1.02]"
                          : "border border-slate-200 bg-slate-100 hover:bg-slate-200 hover:border-slate-300 text-slate-700 font-bold"
                        }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
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
      <div className="fixed inset-0 bg-[#090A0E]/85 backdrop-blur-md z-[90] flex items-center justify-center p-4">
        <div className="bg-[#12141D] border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center pb-3 border-b border-white/8">
            <h3 className="text-xl font-black text-white uppercase tracking-wider">Edit Player Details</h3>
            <button
              onClick={() => { setShowEditForm(false); setEditingPlayer(null); }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-300 border border-red-500/30 text-xs font-bold p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleEditPlayerSubmit} className="space-y-4 text-left">

            {/* Photo Picker */}
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xs font-bold tracking-widest text-zinc-400 block self-start">PLAYER PHOTO</span>
              <div
                onClick={() => editFileInputRef.current?.click()}
                className="w-24 h-24 rounded-full bg-[#1B1E2C] border-2 border-dashed border-white/20 hover:border-[#D4AF37] cursor-pointer flex flex-col items-center justify-center overflow-hidden relative group transition-all"
              >
                {editPlayerForm.photo ? (
                  <img src={editPlayerForm.photo} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-7 h-7 text-zinc-400 group-hover:text-[#D4AF37] mb-1 transition-colors" />
                    <span className="text-[11px] font-bold text-zinc-400 uppercase">CHANGE</span>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={editFileInputRef}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const compressed = await compressImage(file);
                    if (compressed) {
                      setEditPlayerForm(prev => ({ ...prev, photo: compressed, photoFile: file }));
                    }
                  }
                }}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold tracking-widest text-zinc-400 uppercase">PLAYER NAME</label>
              <input
                type="text"
                required
                value={editPlayerForm.name}
                onChange={(e) => setEditPlayerForm({ ...editPlayerForm, name: e.target.value })}
                className="w-full bg-[#1B1E2C] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-[#D4AF37]"
                placeholder="Enter player full name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold tracking-widest text-zinc-400 uppercase">AGE</label>
                <input
                  type="number"
                  required
                  value={editPlayerForm.age}
                  onChange={(e) => setEditPlayerForm({ ...editPlayerForm, age: e.target.value })}
                  className="w-full bg-[#1B1E2C] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-[#D4AF37]"
                  placeholder="e.g. 19"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold tracking-widest text-zinc-400 uppercase">PLAYING ROLE</label>
                <select
                  value={editPlayerForm.role}
                  onChange={(e) => setEditPlayerForm({ ...editPlayerForm, role: e.target.value })}
                  className="w-full h-[46px] bg-[#1B1E2C] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-rounder">All-rounder</option>
                  <option value="Wicketkeeper">Wicketkeeper</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold tracking-widest text-zinc-400 uppercase">BATTING STYLE</label>
                <select
                  value={editPlayerForm.battingStyle}
                  onChange={(e) => setEditPlayerForm({ ...editPlayerForm, battingStyle: e.target.value })}
                  className="w-full h-[46px] bg-[#1B1E2C] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="Right-hand bat">Right-hand bat</option>
                  <option value="Left-hand bat">Left-hand bat</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold tracking-widest text-zinc-400 uppercase">BOWLING STYLE</label>
                <select
                  value={editPlayerForm.bowlingStyle}
                  onChange={(e) => setEditPlayerForm({ ...editPlayerForm, bowlingStyle: e.target.value })}
                  className="w-full h-[46px] bg-[#1B1E2C] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-[#D4AF37] cursor-pointer"
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
                className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl py-3.5 font-bold uppercase transition-colors cursor-pointer text-xs tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] hover:from-[#FAD06C] hover:to-[#C99615] text-[#090A0E] rounded-xl py-3.5 font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 text-xs"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin text-[#090A0E]" /> : "Update Player"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* ------------------ DELETE CONFIRMATION MODAL ------------------ */}
    {showDeleteModal && deletingPlayer && (
      <div className="fixed inset-0 bg-[#090A0E]/85 backdrop-blur-md z-[90] flex items-center justify-center p-4">
        <div className="bg-[#12141D] border border-rose-500/40 rounded-3xl p-6 sm:p-7 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
            <Trash2 className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Delete Player?</h3>
            <p className="text-xs font-semibold text-zinc-400 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">{deletingPlayer.name}</span>? All associated practice and match assessments will be permanently removed.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowDeleteModal(false); setDeletingPlayer(null); }}
              className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl py-3.5 font-bold uppercase transition-colors cursor-pointer text-xs tracking-wider"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3.5 font-black uppercase transition-all shadow-lg shadow-rose-600/30 cursor-pointer flex items-center justify-center gap-2 text-xs tracking-wider"
            >
              {deleting ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : "Confirm Delete"}
            </button>
          </div>
        </div>
      </div>
    )}

  </div>
);
}
