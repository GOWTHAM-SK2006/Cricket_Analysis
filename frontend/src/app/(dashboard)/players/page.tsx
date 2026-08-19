"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { uploadPlayerImage } from "@/lib/supabase";
import {
  Search, Plus, Loader2, ArrowLeft, Clipboard, ShieldCheck,
  Sparkles, ListCollapse, Award, Flame, Heart, Brain, X, Camera, CheckCircle2,
  Filter, Check, Copy, Target, Edit2, ChevronDown, FileText, Download, Trash2, TrendingUp, Zap
} from "lucide-react";
import PerformanceTrendChart from "@/components/PerformanceTrendChart";
import CricketLoader from "@/components/CricketLoader";
import jsPDF from "jspdf";
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
        summaryHeader: "THE COACH'S SUMMARY",
        summaryOverview: src.practice.overview,
        highScoreStatement: "High score: " + pHigh.summary,
        lowScoreStatement: "Low score: " + pLow.summary,
        goalStatement: src.practice.goal
      },
      low: {
        header: "",
        bullets: pLow.actionPoints,
        summaryHeader: "THE COACH'S SUMMARY",
        summaryOverview: src.practice.overview,
        highScoreStatement: "High score: " + pHigh.summary,
        lowScoreStatement: "Low score: " + pLow.summary,
        goalStatement: src.practice.goal
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
    { name: "Game Plan", keys: ["gamePlan", "decisionMaking", "gameAwareness"] },
    { name: "Preparation", keys: ["preparation"] },
    { name: "Intensity", keys: ["intensity"] },
    { name: "Focus", keys: ["focus", "concentration"] },
    { name: "Resilience", keys: ["resilience", "emotionalControl", "adaptability"] }
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
        ["technicalExecution", "skillsLevel", "gamePlan", "preparation", "intensity", "focus", "resilience"].forEach((k) => {
          if (typeof s[k] === "number" && s[k] > 0) availableScores.push(s[k]);
        });
      });
      matchList.forEach((s: any) => {
        ["technicalExecution", "skillsLevel", "gamePlan", "preparation", "intensity", "focus", "resilience"].forEach((k) => {
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

    const actionPointsText = block.actionPoints.map((pt) => `• ${pt}`).join("\n");
    const summaryHeader = "THE COACH'S SUMMARY";
    const summaryBody = `${src[context].overview}\n${isHigh ? `High score: ${block.summary}` : `Low score: ${block.summary}`}\n${src[context].goal}`;

    const detail = `THE COACH'S PLAN OF ACTION\n${actionPointsText}\n\n${summaryHeader}\n${summaryBody}`;

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
  // PAGE 1: Header, Player Information, 1. Summary, 2. 7 Key Performance Areas, 3. Strengths & 4. Improvements
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

  // 2. 7 KEY PERFORMANCE AREAS
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("2. 7 KEY PERFORMANCE AREAS", 14, y);

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
    { name: "Intensity", key: "intensity" },
    { name: "Focus", key: "focus" },
    { name: "Resilience", key: "resilience" }
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
          if (trimmed === "THE COACH'S PLAN OF ACTION") {
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

  const prevAssessment = (allAssessments.length > 1) ? allAssessments[1] : null;
  const prevCpi = prevAssessment ? (prevAssessment.ppiScore || prevAssessment.mpiScore || 70) : Math.max(0, cpiNum - 3);
  const diff = cpiNum - prevCpi;

  doc.setFontSize(8.0);
  doc.setFont("helvetica", "bold");

  doc.setTextColor(234, 88, 12);
  doc.text("•", 18, y + 6.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`CPI Trend: Currently at ${cpiNum} CPI — Overall performance trajectory is ${diff >= 0 ? "improving" : "declining"}.`, 22, y + 6.5);

  doc.setTextColor(234, 88, 12);
  doc.text("•", 18, y + 12.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`PPI Trend: Practice Performance Index score currently at ${ppiNum || "N/A"} (${last5Prac?.length || 0} practice sessions recorded).`, 22, y + 12.5);

  doc.setTextColor(234, 88, 12);
  doc.text("•", 18, y + 18.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`MPI Trend: Match Performance Index score currently at ${mpiNum || "N/A"} (${last5Match?.length || 0} match assessments recorded).`, 22, y + 18.5);

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
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);

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

    const savedUserName = localStorage.getItem("userName");
    if (savedUserName) {
      setCurrentCoachName(savedUserName);
    } else {
      api.get("/profile").then((res) => {
        if (res.data && res.data.name) {
          setCurrentCoachName(res.data.name);
          localStorage.setItem("userName", res.data.name);
        }
      }).catch(() => { });
    }

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
  setIsHistoryLoading(true);
  setPracticeHistory([]);
  setMatchHistory([]);
  setSelfHistory([]);
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

    const localSelf = localStorage.getItem(`self_assess_${playerId}`);
    const rawSelf = localSelf ? JSON.parse(localSelf) : [];
    const selfData = [...rawSelf].sort(
      (a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
    );
    setSelfHistory(selfData);
  } catch (err) {
    console.error("Failed to load assessments history", err);
  } finally {
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
              className={`h-14 w-14 rounded-2xl flex items-center justify-center border shrink-0 cursor-pointer transition-all active:scale-95 ${sortBy !== "highest_cpi" || quickFilter !== "all" || roleFilter !== "all"
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
                  className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 hover:border-orange-500 cursor-pointer flex flex-col items-center justify-center overflow-hidden relative group shadow-xs"
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

              const cachedPhoto = player.imageUrl || null;
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
                      <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden shadow-xs">
                        <img
                          src={cachedPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=ffedd5&color=ea580c&font-size=0.45&bold=true`}
                          alt={player.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-xs shadow-xs z-10" title={player.role}>
                        {getRoleEmoji(player.role)}
                      </div>
                    </div>

                    <div className="min-w-0 text-left space-y-0.5">
                      <h4 className="text-xl font-bold text-slate-900 truncate tracking-tight leading-none">{player.name}</h4>
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
      // Dynamically generate focus areas from the 7 CPI parameters ranked Strongest to Weakest
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
        { name: "Intensity", val: latestPractice ? (latestPractice.intensity ?? "7.0") : "7.0" },
        { name: "Focus", val: latestPractice ? (latestPractice.focus ?? latestPractice.concentration ?? "7.0") : "7.0" },
        { name: "Resilience", val: latestPractice ? (latestPractice.resilience ?? "7.0") : "7.0" }
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


          {/* SECTION 4 – TARGETS (PLAYER'S CPI GOAL) */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5.5 space-y-4 text-left">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black tracking-wider text-slate-900 uppercase flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" />
                PLAYER'S CPI GOAL
              </h3>
            </div>

            <div className="space-y-4 pt-1">
              {/* Target CPI Editing Card */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-sm font-black text-slate-900 uppercase tracking-widest block">TARGET CPI</span>
                  <span className="text-xs font-extrabold text-slate-600 uppercase block mt-0.5">
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
                <div className="flex justify-between items-center text-sm font-black text-slate-900 uppercase tracking-wider px-1">
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

          {/* SECTION 5 – KEY PERFORMANCE HIGHLIGHTS (CPI PERFORMANCE PROFILE LINE GRAPH) */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-5 text-left shadow-xs">
            {/* Header */}
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-black tracking-widest text-slate-900 uppercase flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-500" />
                  KEY PERFORMANCE HIGHLIGHTS
                </h3>
                <p className="text-[11px] sm:text-xs font-extrabold text-slate-500 tracking-wider uppercase mt-0.5">
                  CPI PERFORMANCE PROFILE
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                <span>2D PERFORMANCE GRAPH</span>
              </div>
            </div>

            {isHistoryLoading ? (
              <div className="flex items-center justify-center p-10 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3 text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-wide">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                  <span>Loading performance profile...</span>
                </div>
              </div>
            ) : practiceHistory.length === 0 && matchHistory.length === 0 ? (
              <div className="flex items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  No assessment data recorded yet for this player.
                </span>
              </div>
            ) : (() => {
              // Extract exact scores in FIXED CPI framework order (single source of truth from focusAreas)
              const fixedParams = [
                "Technique",
                "Skill Level",
                "Game Plan",
                "Preparation",
                "Intensity",
                "Focus",
                "Resilience"
              ];

              const cpiLineChartData = fixedParams.map((paramName) => {
                const found = focusAreas.find(
                  (item) => item.title.toLowerCase() === paramName.toLowerCase()
                );
                const score = found && typeof found.avg === "number" ? found.avg : 7.0;
                return {
                  name: paramName,
                  score: Math.min(10, Math.max(0, Math.round(score * 10) / 10))
                };
              });

              // Summary stats for top banner
              const totalScoreSum = cpiLineChartData.reduce((acc, curr) => acc + curr.score, 0);
              const avgProfileScore = (totalScoreSum / 7).toFixed(1);
              const topParam = [...cpiLineChartData].sort((a, b) => b.score - a.score)[0];
              const highParamsCount = cpiLineChartData.filter((p) => p.score >= 7.0).length;

              return (
                <div className="space-y-4 pt-1">
                  {/* Executive Summary Metrics Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 font-bold shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">PROFILE AVERAGE</p>
                        <p className="text-base font-black text-slate-900 font-mono leading-none mt-0.5">{avgProfileScore} <span className="text-xs text-slate-400 font-bold">/ 10</span></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200/80 pt-2 sm:pt-0 sm:pl-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">PEAK PARAMETER</p>
                        <p className="text-xs font-black text-slate-900 truncate mt-0.5">{topParam.name} ({topParam.score.toFixed(1)})</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200/80 pt-2 sm:pt-0 sm:pl-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 font-bold shrink-0">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">BENCHMARK STATUS</p>
                        <p className="text-xs font-black text-slate-900 mt-0.5">{highParamsCount} of 7 High (&ge;7.0)</p>
                      </div>
                    </div>
                  </div>

                  {/* Premium 2D Line Chart Canvas */}
                  <div className="relative bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden select-none">
                    <svg
                      viewBox="0 0 860 360"
                      className="w-full h-auto overflow-visible"
                    >
                      <defs>
                        {/* Gradient Fill under Line */}
                        <linearGradient id="cpiAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                        </linearGradient>

                        {/* Drop shadow for nodes */}
                        <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.12" />
                        </filter>
                      </defs>

                      {/* Subtle Grid Lines (Y-Axis Levels: 0, 2, 4, 6, 8, 10) */}
                      {[10, 8, 6, 4, 2, 0].map((level) => {
                        const y = 50 + (1 - level / 10) * 220;
                        return (
                          <g key={level}>
                            <line
                              x1="65"
                              y1={y}
                              x2="805"
                              y2={y}
                              stroke="#e2e8f0"
                              strokeWidth="1"
                              strokeDasharray={level === 0 || level === 10 ? "none" : "4 4"}
                            />
                            <text
                              x="48"
                              y={y + 4}
                              textAnchor="end"
                              fill="#475569"
                              fontSize="13"
                              fontWeight="800"
                              fontFamily="monospace"
                            >
                              {level}
                            </text>
                          </g>
                        );
                      })}

                      {/* 7.0 Benchmark Reference Line */}
                      {(() => {
                        const benchY = 50 + (1 - 7.0 / 10) * 220;
                        return (
                          <g>
                            <line
                              x1="65"
                              y1={benchY}
                              x2="805"
                              y2={benchY}
                              stroke="#10b981"
                              strokeWidth="1.5"
                              strokeDasharray="6 6"
                              opacity="0.6"
                            />
                            <text
                              x="800"
                              y={benchY - 6}
                              textAnchor="end"
                              fill="#10b981"
                              fontSize="11"
                              fontWeight="800"
                              letterSpacing="1"
                              fontFamily="sans-serif"
                            >
                              7.0 HIGH BENCHMARK
                            </text>
                          </g>
                        );
                      })()}

                      {/* Y-Axis Title */}
                      <text
                        x="18"
                        y="28"
                        fill="#64748b"
                        fontSize="12"
                        fontWeight="900"
                        fontFamily="sans-serif"
                        letterSpacing="1.5"
                      >
                        SCORE
                      </text>

                      {/* Gradient Fill under the line */}
                      {(() => {
                        const firstX = 65;
                        const lastX = 805;
                        const bottomY = 270;

                        const linePoints = cpiLineChartData
                          .map((param, i) => {
                            const x = 65 + i * (740 / 6);
                            const y = 50 + (1 - param.score / 10) * 220;
                            return `${x},${y}`;
                          })
                          .join(" L ");

                        const areaD = `M ${firstX},${bottomY} L ${linePoints} L ${lastX},${bottomY} Z`;

                        return <path d={areaD} fill="url(#cpiAreaGradient)" />;
                      })()}

                      {/* Connecting Line across all 7 parameters */}
                      {(() => {
                        const pathD = cpiLineChartData
                          .map((param, i) => {
                            const x = 65 + i * (740 / 6);
                            const y = 50 + (1 - param.score / 10) * 220;
                            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                          })
                          .join(" ");

                        return (
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        );
                      })()}

                      {/* Data Points, Score Badges, Labels, and Interactive Touch/Hover */}
                      {cpiLineChartData.map((param, i) => {
                        const x = 65 + i * (740 / 6);
                        const y = 50 + (1 - param.score / 10) * 220;
                        const isHovered = hoveredParamIndex === i;

                        // X-Axis Parameter Name split into lines
                        const nameParts = param.name.split(" ");
                        const line1 = nameParts[0] || param.name;
                        const line2 = nameParts.slice(1).join(" ");

                        // Status badge border color for node pill
                        const statusColor = param.score >= 7.0 ? "#10b981" : param.score >= 5.0 ? "#f59e0b" : "#ef4444";

                        return (
                          <g
                            key={param.name}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredParamIndex(i)}
                            onMouseLeave={() => setHoveredParamIndex(null)}
                            onClick={() => setHoveredParamIndex(hoveredParamIndex === i ? null : i)}
                          >
                            {/* Invisible touch/hover hit zone */}
                            <circle cx={x} cy={y} r="24" fill="transparent" />

                            {/* Halo Ring on Hover */}
                            {isHovered && (
                              <circle cx={x} cy={y} r="15" fill="rgba(249, 115, 22, 0.2)" stroke="#f97316" strokeWidth="2" />
                            )}

                            {/* Node Shadow & Outer Ring */}
                            <circle cx={x} cy={y} r="11" fill="#f97316" opacity="0.15" />
                            <circle
                              cx={x}
                              cy={y}
                              r={isHovered ? "8" : "6.5"}
                              fill="#ffffff"
                              stroke="#f97316"
                              strokeWidth="3.5"
                              filter="url(#nodeShadow)"
                            />
                            <circle cx={x} cy={y} r={isHovered ? "4" : "3"} fill="#ea580c" />

                            {/* Floating Score Badge above node */}
                            <g transform={`translate(${x - 25}, ${y - 36})`}>
                              <rect
                                x="0"
                                y="0"
                                width="50"
                                height="22"
                                rx="7"
                                fill="#ffffff"
                                stroke={statusColor}
                                strokeWidth="2"
                                filter="url(#nodeShadow)"
                              />
                              <text
                                x="25"
                                y="15.5"
                                textAnchor="middle"
                                fill="#0f172a"
                                fontSize="13"
                                fontWeight="900"
                                fontFamily="monospace"
                              >
                                {param.score.toFixed(1)}
                              </text>
                            </g>

                            {/* X-Axis Step Number Indicator */}
                            <g transform={`translate(${x - 11}, 282)`}>
                              <rect
                                x="0"
                                y="0"
                                width="22"
                                height="16"
                                rx="5"
                                fill={isHovered ? "#ffedd5" : "#f1f5f9"}
                                stroke={isHovered ? "#fdba74" : "#cbd5e1"}
                                strokeWidth="1.2"
                              />
                              <text
                                x="11"
                                y="12"
                                textAnchor="middle"
                                fill={isHovered ? "#ea580c" : "#475569"}
                                fontSize="11"
                                fontWeight="900"
                                fontFamily="monospace"
                              >
                                {i + 1}
                              </text>
                            </g>

                            {/* X-Axis Parameter Name Label */}
                            {line2 ? (
                              <>
                                <text
                                  x={x}
                                  y="312"
                                  textAnchor="middle"
                                  fill={isHovered ? "#ea580c" : "#0f172a"}
                                  fontSize="12.5"
                                  fontWeight="900"
                                >
                                  {line1}
                                </text>
                                <text
                                  x={x}
                                  y="327"
                                  textAnchor="middle"
                                  fill={isHovered ? "#ea580c" : "#0f172a"}
                                  fontSize="12.5"
                                  fontWeight="900"
                                >
                                  {line2}
                                </text>
                              </>
                            ) : (
                              <text
                                x={x}
                                y="320"
                                textAnchor="middle"
                                fill={isHovered ? "#ea580c" : "#0f172a"}
                                fontSize="12.5"
                                fontWeight="900"
                              >
                                {param.name}
                              </text>
                            )}

                            {/* Hover / Tap Floating Tooltip */}
                            {isHovered && (
                              <g transform={`translate(${Math.max(10, Math.min(680, x - 85))}, ${Math.max(5, y - 68)})`}>
                                <rect
                                  x="0"
                                  y="0"
                                  width="170"
                                  height="48"
                                  rx="10"
                                  fill="#0f172a"
                                  opacity="0.96"
                                  filter="url(#nodeShadow)"
                                />
                                <text
                                  x="85"
                                  y="20"
                                  textAnchor="middle"
                                  fill="#ffffff"
                                  fontSize="12"
                                  fontWeight="800"
                                >
                                  {param.name}
                                </text>
                                <text
                                  x="85"
                                  y="36"
                                  textAnchor="middle"
                                  fill="#f97316"
                                  fontSize="13"
                                  fontWeight="900"
                                  fontFamily="monospace"
                                >
                                  Score: {param.score.toFixed(1)} / 10
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
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
            {isHistoryLoading ? (
              <div className="flex items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3 text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-wide">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  <span>Loading key performance areas...</span>
                </div>
              </div>
            ) : practiceHistory.length === 0 && matchHistory.length === 0 ? (
              <div className="flex items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  No assessment data recorded yet for this player.
                </span>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {focusAreas.map((focus, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden transition-all duration-300 cursor-pointer hover:border-orange-300"
                    onClick={() => setExpandedFocus(expandedFocus === idx ? null : idx)}
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
                          <p className="text-xs font-semibold text-slate-800 leading-[1.75] whitespace-pre-line">
                            {focus.detail}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
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
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
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
                <span className="text-xl font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">{(practiceForm as any)[metric.key]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={(practiceForm as any)[metric.key]}
                onPointerDown={handleSliderInteraction}
                onTouchStart={handleSliderInteraction}
                onFocus={handleSliderInteraction}
                onChange={(e) => {
                  handleSliderInteraction();
                  setPracticeForm({ ...practiceForm, [metric.key]: parseInt(e.target.value) });
                }}
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
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
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
                <span className="text-xl font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">{(matchForm as any)[metric.key]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={(matchForm as any)[metric.key]}
                onPointerDown={handleSliderInteraction}
                onTouchStart={handleSliderInteraction}
                onFocus={handleSliderInteraction}
                onChange={(e) => {
                  handleSliderInteraction();
                  setMatchForm({ ...matchForm, [metric.key]: parseInt(e.target.value) });
                }}
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
                <span className="text-xl font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">{(selfForm as any)[metric.key]}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={(selfForm as any)[metric.key]}
                onPointerDown={handleSliderInteraction}
                onTouchStart={handleSliderInteraction}
                onFocus={handleSliderInteraction}
                onChange={(e) => {
                  handleSliderInteraction();
                  setSelfForm({ ...selfForm, [metric.key]: parseInt(e.target.value) });
                }}
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
                { label: "Game Plan", val: selectedAssessmentDetail.data.gamePlan || selectedAssessmentDetail.data.decisionMaking },
                { label: "Preparation", val: selectedAssessmentDetail.data.preparation },
                { label: "Intensity", val: selectedAssessmentDetail.data.intensity },
                { label: "Focus", val: selectedAssessmentDetail.data.focus || selectedAssessmentDetail.data.concentration },
                { label: "Resilience", val: selectedAssessmentDetail.data.resilience || selectedAssessmentDetail.data.emotionalControl || selectedAssessmentDetail.data.adaptability }
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${sortBy === opt.val
                      ? "bg-orange-500 text-black border-orange-450"
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${quickFilter === opt.val
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${roleFilter === opt.val
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
                className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 hover:border-orange-500 cursor-pointer flex flex-col items-center justify-center overflow-hidden relative group"
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
