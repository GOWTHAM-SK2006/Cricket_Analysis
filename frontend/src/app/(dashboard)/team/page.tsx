"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Users2, Plus, Loader2, UserPlus, Trash2, Search,
  Edit2, Check, X, Shield, Sparkles, User, AlertCircle,
  FileText, Download, TrendingUp, TrendingDown, ArrowRightLeft,
  Calendar, CheckCircle2, Award, Target, Flame
} from "lucide-react";
import CricketLoader from "@/components/CricketLoader";
import jsPDF from "jspdf";

interface Player {
  id: number;
  name: string;
  role: string;
  battingStyle?: string;
  bowlingStyle?: string;
  imageUrl?: string;
  ppiScore?: number | null;
  mpiScore?: number | null;
}

interface Team {
  id: number;
  name: string;
  description?: string;
  coachId?: number;
  players: Player[];
  createdAt?: string;
}

interface TeamNote {
  id: number;
  teamId: number;
  coachName: string;
  type: "PRACTICE" | "MATCH";
  date: string;
  content: string;
  createdAt: string;
}

interface AssessmentItem {
  id: number;
  date: string;
  player: Player;
  technicalExecution?: number;
  skillsLevel?: number;
  gamePlan?: number;
  preparation?: number;
  intensity?: number;
  focus?: number;
  concentration?: number;
  resilience?: number;
  ppiScore?: number;
  mpiScore?: number;
  notes?: string;
}

const formatScore = (val: number | null | undefined): string => {
  if (val === null || val === undefined || val === 0) return "N/A";
  let num = typeof val === "number" ? val : parseFloat(val as any);
  if (isNaN(num) || num <= 0) return "N/A";
  const score100 = num <= 10 ? Math.round(num * 10) : Math.round(num);
  return `${score100}`;
};

const getParamAverage = (assessments: AssessmentItem[], getVal: (a: AssessmentItem) => number | undefined): number | null => {
  const validVals = assessments
    .map(a => getVal(a))
    .filter((v): v is number => typeof v === "number" && v > 0);

  if (validVals.length === 0) return null;
  const sum = validVals.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / validVals.length;
  return Math.round((avg <= 10 ? avg * 10 : avg) * 10) / 10;
};

const PARAM_DEFINITIONS = [
  { name: "Technique", getVal: (a: AssessmentItem) => a.technicalExecution },
  { name: "Skill Level", getVal: (a: AssessmentItem) => a.skillsLevel },
  { name: "Game Plan", getVal: (a: AssessmentItem) => a.gamePlan },
  { name: "Preparation", getVal: (a: AssessmentItem) => a.preparation },
  { name: "Intensity", getVal: (a: AssessmentItem) => a.intensity },
  { name: "Focus", getVal: (a: AssessmentItem) => a.focus ?? a.concentration },
  { name: "Resilience", getVal: (a: AssessmentItem) => a.resilience }
];

export default function TeamPage() {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [mySquad, setMySquad] = useState<Player[]>([]);
  
  // Navigation Sub-Tabs
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "7PARAMS" | "HISTORY" | "NOTES" | "COMPARISON">("OVERVIEW");

  // Assessment & Notes Data
  const [practiceAssessments, setPracticeAssessments] = useState<AssessmentItem[]>([]);
  const [matchAssessments, setMatchAssessments] = useState<AssessmentItem[]>([]);
  const [teamNotes, setTeamNotes] = useState<TeamNote[]>([]);

  // Create Team Form State
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit Team Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Add Players Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingPlayers, setIsAddingPlayers] = useState(false);

  // Removing player state
  const [removingPlayerId, setRemovingPlayerId] = useState<number | null>(null);

  // Team Notes Form State
  const [noteType, setNoteType] = useState<"PRACTICE" | "MATCH">("PRACTICE");
  const [noteDate, setNoteDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [noteContent, setNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteFilter, setNoteFilter] = useState<"ALL" | "PRACTICE" | "MATCH">("ALL");

  // Assessment History Filter State
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "PRACTICE" | "MATCH">("ALL");

  // Comparison State (Team A vs Team B)
  const [teamAId, setTeamAId] = useState<number | null>(null);
  const [teamBId, setTeamBId] = useState<number | null>(null);
  const [teamAData, setTeamAData] = useState<{ team: Team; prac: AssessmentItem[]; match: AssessmentItem[] } | null>(null);
  const [teamBData, setTeamBData] = useState<{ team: Team; prac: AssessmentItem[]; match: AssessmentItem[] } | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const [teamRes, allTeamsRes, squadRes] = await Promise.all([
        api.get("/teams/my-team").catch(() => ({ data: null })),
        api.get("/teams").catch(() => ({ data: [] })),
        api.get("/players").catch(() => ({ data: [] }))
      ]);

      const teamsList = Array.isArray(allTeamsRes.data) ? allTeamsRes.data : [];
      setAllTeams(teamsList);

      const primaryTeam = teamRes.data && teamRes.data.id ? teamRes.data : (teamsList[0] || null);

      if (primaryTeam && primaryTeam.id) {
        setTeam(primaryTeam);
        setEditName(primaryTeam.name || "");
        setEditDesc(primaryTeam.description || "");

        // Set default teams for comparison if available
        setTeamAId(primaryTeam.id);
        if (teamsList.length > 1) {
          const second = teamsList.find((t: Team) => t.id !== primaryTeam.id);
          if (second) setTeamBId(second.id);
        }

        // Fetch team assessments and notes
        const [assessmentsRes, notesRes] = await Promise.all([
          api.get(`/teams/${primaryTeam.id}/assessments`).catch(() => ({ data: { practiceAssessments: [], matchAssessments: [] } })),
          api.get(`/teams/${primaryTeam.id}/notes`).catch(() => ({ data: [] }))
        ]);

        setPracticeAssessments(assessmentsRes.data.practiceAssessments || []);
        setMatchAssessments(assessmentsRes.data.matchAssessments || []);
        setTeamNotes(Array.isArray(notesRes.data) ? notesRes.data : []);
      } else {
        setTeam(null);
      }

      setMySquad(Array.isArray(squadRes.data) ? squadRes.data : []);
    } catch (err) {
      console.error("Failed to load team data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  // Fetch comparison data when teamAId or teamBId changes
  useEffect(() => {
    if (!teamAId && !teamBId) return;

    const loadComparison = async () => {
      setLoadingComparison(true);
      try {
        if (teamAId) {
          const targetA = allTeams.find(t => t.id === teamAId);
          if (targetA) {
            const resA = await api.get(`/teams/${teamAId}/assessments`).catch(() => ({ data: { practiceAssessments: [], matchAssessments: [] } }));
            setTeamAData({
              team: targetA,
              prac: resA.data.practiceAssessments || [],
              match: resA.data.matchAssessments || []
            });
          }
        }
        if (teamBId) {
          const targetB = allTeams.find(t => t.id === teamBId);
          if (targetB) {
            const resB = await api.get(`/teams/${teamBId}/assessments`).catch(() => ({ data: { practiceAssessments: [], matchAssessments: [] } }));
            setTeamBData({
              team: targetB,
              prac: resB.data.practiceAssessments || [],
              match: resB.data.matchAssessments || []
            });
          }
        }
      } catch (e) {
        console.error("Error loading comparison data:", e);
      } finally {
        setLoadingComparison(false);
      }
    };

    loadComparison();
  }, [teamAId, teamBId, allTeams]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    try {
      setIsCreating(true);
      const res = await api.post("/teams", {
        name: createName.trim(),
        description: createDesc.trim(),
      });
      setTeam(res.data);
      setAllTeams(prev => [...prev, res.data]);
      setCreateName("");
      setCreateDesc("");
      fetchTeamData();
    } catch (err) {
      console.error("Failed to create team", err);
      alert("Failed to create team. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !editName.trim()) return;

    try {
      setIsUpdating(true);
      const res = await api.put(`/teams/${team.id}`, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      setTeam(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update team", err);
      alert("Failed to update team details.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddSelectedPlayers = async () => {
    if (!team || selectedPlayerIds.length === 0) return;

    try {
      setIsAddingPlayers(true);
      const res = await api.post(`/teams/${team.id}/players`, {
        playerIds: selectedPlayerIds
      });
      setTeam(res.data);
      setShowAddModal(false);
      setSelectedPlayerIds([]);
    } catch (err) {
      console.error("Failed to add players to team", err);
      alert("Failed to add selected players.");
    } finally {
      setIsAddingPlayers(false);
    }
  };

  const handleRemovePlayer = async (playerId: number) => {
    if (!team) return;

    try {
      setRemovingPlayerId(playerId);
      const res = await api.delete(`/teams/${team.id}/players/${playerId}`);
      setTeam(res.data);
    } catch (err) {
      console.error("Failed to remove player from team", err);
      alert("Failed to remove player from team.");
    } finally {
      setRemovingPlayerId(null);
    }
  };

  const handleSaveTeamNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !noteContent.trim()) return;

    try {
      setIsSavingNote(true);
      const res = await api.post(`/teams/${team.id}/notes`, {
        type: noteType,
        date: noteDate,
        content: noteContent.trim()
      });
      setTeamNotes(prev => [res.data, ...prev]);
      setNoteContent("");
    } catch (err) {
      console.error("Failed to save team note", err);
      alert("Failed to save team note.");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteTeamNote = async (noteId: number) => {
    if (!team) return;

    try {
      await api.delete(`/teams/${team.id}/notes/${noteId}`);
      setTeamNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      console.error("Failed to delete team note", err);
      alert("Failed to delete team note.");
    }
  };

  const togglePlayerSelection = (id: number) => {
    setSelectedPlayerIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // PDF Team Report Generator
  const generateTeamPdfReport = () => {
    if (!team) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const reportDateStr = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    const coachName = typeof window !== "undefined" ? localStorage.getItem("userName") || "Coach" : "Coach";

    // Header
    doc.setFillColor(15, 23, 42); // Dark slate header
    doc.rect(0, 0, pageWidth, 22, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text("CRICKET PERFORMANCE INDEX (CPI)", 14, 10);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(248, 250, 252);
    doc.text(`Official Team Report — ${team.name}`, 14, 17);

    doc.setFontSize(8);
    doc.text(`Date: ${reportDateStr}`, pageWidth - 14, 10, { align: "right" });
    doc.text(`Coach: ${coachName}`, pageWidth - 14, 17, { align: "right" });

    let y = 28;

    // Team Information Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, "FD");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`TEAM: ${team.name.toUpperCase()}`, 18, y + 7);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Description: ${team.description || "N/A"}`, 18, y + 14);
    doc.text(`Squad Size: ${squad.length} Players`, pageWidth - 18, y + 14, { align: "right" });

    y += 25;

    // Summary Metrics Boxes
    const boxW = (pageWidth - 28 - 9) / 4;

    const calcTeamAvg = (getVal: (a: AssessmentItem) => number | undefined, items: AssessmentItem[]) => {
      const vals = items.map(getVal).filter((v): v is number => typeof v === "number" && v > 0);
      if (vals.length === 0) return "N/A";
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return `${Math.round(avg <= 10 ? avg * 10 : avg)}`;
    };

    const pracPpi = calcTeamAvg(a => a.ppiScore, practiceAssessments);
    const matchMpi = calcTeamAvg(a => a.mpiScore, matchAssessments);

    const cpiNumPrac = pracPpi !== "N/A" ? Number(pracPpi) : null;
    const cpiNumMatch = matchMpi !== "N/A" ? Number(matchMpi) : null;
    let teamCpiStr = "N/A";
    if (cpiNumPrac !== null && cpiNumMatch !== null) teamCpiStr = `${Math.round((cpiNumPrac + cpiNumMatch) / 2)}`;
    else if (cpiNumPrac !== null) teamCpiStr = `${cpiNumPrac}`;
    else if (cpiNumMatch !== null) teamCpiStr = `${cpiNumMatch}`;

    const metrics = [
      { label: "SQUAD SIZE", val: `${squad.length}` },
      { label: "TEAM CPI", val: teamCpiStr },
      { label: "PRACTICE PPI", val: pracPpi },
      { label: "MATCH MPI", val: matchMpi }
    ];

    metrics.forEach((m, idx) => {
      const x = 14 + idx * (boxW + 3);
      doc.setFillColor(255, 247, 237);
      doc.setDrawColor(254, 215, 170);
      doc.roundedRect(x, y, boxW, 16, 2, 2, "FD");

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(194, 65, 12);
      doc.text(m.label, x + 4, y + 5);

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(m.val, x + 4, y + 12);
    });

    y += 22;

    // 7 CPI Parameter Performance Section
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("TEAM 7-PARAMETER PERFORMANCE", 14, y);

    y += 5;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 6, "F");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("PARAMETER", 18, y + 4.2);
    doc.text("PRACTICE AVG", 90, y + 4.2);
    doc.text("MATCH AVG", 135, y + 4.2);
    doc.text("OVERALL", 175, y + 4.2);

    y += 6;

    PARAM_DEFINITIONS.forEach((param, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, pageWidth - 28, 5, "F");
      }

      const pAvg = getParamAverage(practiceAssessments, param.getVal);
      const mAvg = getParamAverage(matchAssessments, param.getVal);

      const pStr = pAvg !== null ? `${pAvg}` : "N/A";
      const mStr = mAvg !== null ? `${mAvg}` : "N/A";

      let oStr = "N/A";
      if (pAvg !== null && mAvg !== null) oStr = `${Math.round((pAvg + mAvg) / 2 * 10) / 10}`;
      else if (pAvg !== null) oStr = `${pAvg}`;
      else if (mAvg !== null) oStr = `${mAvg}`;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(param.name, 18, y + 3.6);

      doc.setFont("helvetica", "bold");
      doc.text(pStr, 90, y + 3.6);
      doc.text(mStr, 135, y + 3.6);
      doc.text(oStr, 175, y + 3.6);

      y += 5;
    });

    y += 8;

    // Team Strengths & Development Areas
    const allAssessments = [...practiceAssessments, ...matchAssessments];
    const hasData = allAssessments.length > 0;

    const paramScores = PARAM_DEFINITIONS.map(p => {
      const avg = getParamAverage(allAssessments, p.getVal);
      return { name: p.name, avg };
    }).filter(p => p.avg !== null) as { name: string; avg: number }[];

    paramScores.sort((a, b) => b.avg - a.avg);

    const colW = (pageWidth - 28 - 6) / 2;

    // Strengths Box
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, y, colW, 22, 2, 2, "FD");

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(21, 128, 61);
    doc.text("TEAM STRENGTHS", 18, y + 5);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);

    if (hasData && paramScores.length > 0) {
      paramScores.slice(0, 3).forEach((s, idx) => {
        doc.text(`• ${s.name} (${s.avg})`, 18, y + 10 + idx * 3.8);
      });
    } else {
      doc.text("Insufficient assessment data", 18, y + 11);
    }

    // Development Areas Box
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(14 + colW + 6, y, colW, 22, 2, 2, "FD");

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 83, 9);
    doc.text("TEAM DEVELOPMENT AREAS", 18 + colW + 6, y + 5);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);

    if (hasData && paramScores.length > 0) {
      const devAreas = [...paramScores].reverse().slice(0, 3);
      devAreas.forEach((imp, idx) => {
        doc.text(`• ${imp.name} (${imp.avg})`, 18 + colW + 6, y + 10 + idx * 3.8);
      });
    } else {
      doc.text("Insufficient assessment data", 18 + colW + 6, y + 11);
    }

    y += 28;

    // Team Squad List Summary
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("TEAM SQUAD ROSTER", 14, y);

    y += 5;

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 5, "F");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("PLAYER NAME", 18, y + 3.5);
    doc.text("ROLE", 85, y + 3.5);
    doc.text("PPI", 140, y + 3.5);
    doc.text("MPI", 175, y + 3.5);

    y += 5;

    squad.forEach((p, idx) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 15;
      }
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, pageWidth - 28, 4.5, "F");
      }
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(p.name, 18, y + 3.2);
      doc.text(p.role || "Player", 85, y + 3.2);
      doc.text(formatScore(p.ppiScore), 140, y + 3.2);
      doc.text(formatScore(p.mpiScore), 175, y + 3.2);

      y += 4.5;
    });

    // Footer
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Cricket Performance Index (CPI) • Official Confidential Team Report", 14, pageHeight - 8);

    doc.save(`${team.name.replace(/\s+/g, "_")}_Team_Report.pdf`);
  };

  if (loading) {
    return <CricketLoader fullScreen message="Loading Team..." subtext="Cricket Performance Index" />;
  }

  // Calculate Primary Team Performance Data
  const squad = team?.players || [];
  const allAssessments = [...practiceAssessments, ...matchAssessments];
  const hasAssessmentData = allAssessments.length > 0;

  // Calculate 7 Parameter Averages for Practice & Match
  const practiceParamScores = PARAM_DEFINITIONS.map(p => ({
    name: p.name,
    avg: getParamAverage(practiceAssessments, p.getVal)
  }));

  const matchParamScores = PARAM_DEFINITIONS.map(p => ({
    name: p.name,
    avg: getParamAverage(matchAssessments, p.getVal)
  }));

  const overallParamScores = PARAM_DEFINITIONS.map(p => {
    const avg = getParamAverage(allAssessments, p.getVal);
    return { name: p.name, avg };
  }).filter(p => p.avg !== null) as { name: string; avg: number }[];

  overallParamScores.sort((a, b) => b.avg - a.avg);

  const strongestParam = overallParamScores.length > 0 ? overallParamScores[0] : null;
  const weakestParam = overallParamScores.length > 0 ? overallParamScores[overallParamScores.length - 1] : null;

  // Practice & Match overall scores
  const validPpi = squad.map(p => formatScore(p.ppiScore)).filter(s => s !== "N/A").map(s => Number(s));
  const validMpi = squad.map(p => formatScore(p.mpiScore)).filter(s => s !== "N/A").map(s => Number(s));

  const avgPpi = validPpi.length > 0 ? Math.round(validPpi.reduce((a, b) => a + b, 0) / validPpi.length) : "N/A";
  const avgMpi = validMpi.length > 0 ? Math.round(validMpi.reduce((a, b) => a + b, 0) / validMpi.length) : "N/A";

  const teamCpi = (typeof avgPpi === "number" && typeof avgMpi === "number")
    ? Math.round((avgPpi + avgMpi) / 2)
    : (typeof avgPpi === "number" ? avgPpi : (typeof avgMpi === "number" ? avgMpi : "N/A"));

  // Comparison helper functions for Team A vs Team B
  const calcComparisonStats = (data: { team: Team; prac: AssessmentItem[]; match: AssessmentItem[] } | null) => {
    if (!data) return null;

    const squadList = data.team.players || [];
    const allAss = [...data.prac, ...data.match];

    const ppiList = squadList.map(p => formatScore(p.ppiScore)).filter(s => s !== "N/A").map(s => Number(s));
    const mpiList = squadList.map(p => formatScore(p.mpiScore)).filter(s => s !== "N/A").map(s => Number(s));

    const ppiAvg = ppiList.length > 0 ? Math.round(ppiList.reduce((a, b) => a + b, 0) / ppiList.length) : "N/A";
    const mpiAvg = mpiList.length > 0 ? Math.round(mpiList.reduce((a, b) => a + b, 0) / mpiList.length) : "N/A";

    const cpiVal = (typeof ppiAvg === "number" && typeof mpiAvg === "number")
      ? Math.round((ppiAvg + mpiAvg) / 2)
      : (typeof ppiAvg === "number" ? ppiAvg : (typeof mpiAvg === "number" ? mpiAvg : "N/A"));

    const paramsMap: Record<string, { prac: string; match: string; overall: string }> = {};

    PARAM_DEFINITIONS.forEach(p => {
      const pAvg = getParamAverage(data.prac, p.getVal);
      const mAvg = getParamAverage(data.match, p.getVal);
      const oAvg = getParamAverage(allAss, p.getVal);

      paramsMap[p.name] = {
        prac: pAvg !== null ? `${pAvg}` : "N/A",
        match: mAvg !== null ? `${mAvg}` : "N/A",
        overall: oAvg !== null ? `${oAvg}` : "N/A"
      };
    });

    const paramScoresSorted = PARAM_DEFINITIONS.map(p => {
      const avg = getParamAverage(allAss, p.getVal);
      return { name: p.name, avg };
    }).filter(p => p.avg !== null) as { name: string; avg: number }[];

    paramScoresSorted.sort((a, b) => b.avg - a.avg);

    const strengths = paramScoresSorted.length > 0 ? paramScoresSorted.slice(0, 3).map(s => `${s.name} (${s.avg})`) : [];
    const devAreas = paramScoresSorted.length > 0 ? [...paramScoresSorted].reverse().slice(0, 3).map(s => `${s.name} (${s.avg})`) : [];

    return {
      squadSize: squadList.length,
      cpi: cpiVal,
      ppi: ppiAvg,
      mpi: mpiAvg,
      paramsMap,
      strengths,
      devAreas,
      hasData: allAss.length > 0
    };
  };

  const compStatsA = calcComparisonStats(teamAData);
  const compStatsB = calcComparisonStats(teamBData);

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-20 max-w-full overflow-x-hidden">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <Users2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-orange-400 uppercase bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                  COACH DASHBOARD
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1 uppercase truncate">
                {team ? team.name : "TEAM MANAGEMENT"}
              </h1>
            </div>
          </div>

          {team && (
            <button
              onClick={generateTeamPdfReport}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border border-orange-400/50"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>DOWNLOAD TEAM REPORT</span>
            </button>
          )}
        </div>
      </div>

      {/* STATE 1: CREATE YOUR TEAM (If coach has no team) */}
      {!team && (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
          <div className="text-center max-w-lg mx-auto space-y-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-orange-100 border border-orange-200 text-orange-600 mx-auto flex items-center justify-center shadow-inner">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
              CREATE YOUR TEAM
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed">
              Organize your players into a dedicated team squad to evaluate collective performance metrics, track CPI averages, and manage group analytics.
            </p>
          </div>

          <form onSubmit={handleCreateTeam} className="max-w-md mx-auto space-y-4 pt-2">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-2">
                Team Name <span className="text-orange-600">*</span>
              </label>
              <input
                type="text"
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Senior Academy XI / U-19 Squad"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-2">
                Team Description <span className="text-slate-400 font-medium">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="e.g. Primary squad for 2026 regional championship preparation"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || !createName.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-2xl py-3.5 px-6 font-black text-sm uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  CREATING TEAM...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  CREATE TEAM
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* STATE 2: TEAM DASHBOARD VIEW */}
      {team && (
        <div className="space-y-5 sm:space-y-6">
          {/* Sub-Navigation Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveTab("OVERVIEW")}
              className={`px-3.5 py-2.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                activeTab === "OVERVIEW"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              SQUAD & OVERVIEW
            </button>
            <button
              onClick={() => setActiveTab("7PARAMS")}
              className={`px-3.5 py-2.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                activeTab === "7PARAMS"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              7-PARAMETER ANALYTICS
            </button>
            <button
              onClick={() => setActiveTab("HISTORY")}
              className={`px-3.5 py-2.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                activeTab === "HISTORY"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              ASSESSMENT HISTORY
            </button>
            <button
              onClick={() => setActiveTab("NOTES")}
              className={`px-3.5 py-2.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                activeTab === "NOTES"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              TEAM COACH NOTES
            </button>
            <button
              onClick={() => setActiveTab("COMPARISON")}
              className={`px-3.5 py-2.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                activeTab === "COMPARISON"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              TEAM A VS TEAM B
            </button>
          </div>

          {/* TAB 1: SQUAD & OVERVIEW */}
          {activeTab === "OVERVIEW" && (
            <div className="space-y-5 sm:space-y-6">
              {/* Team Details Header Card */}
              <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black tracking-wider text-orange-600 uppercase bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200">
                        ACTIVE TEAM
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        Created {new Date(team.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
                      {team.name}
                    </h2>
                    {team.description && (
                      <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                        {team.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>EDIT DETAILS</span>
                    </button>
                  </div>
                </div>

                {/* Inline Edit Details Form */}
                {isEditing && (
                  <form onSubmit={handleUpdateTeam} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="font-black text-xs uppercase tracking-wider text-slate-700">EDIT TEAM INFO</div>
                    <div>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Team Name"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Team Description (optional)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdating || !editName.trim()}
                        className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1"
                      >
                        {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        SAVE
                      </button>
                    </div>
                  </form>
                )}

                {/* Team Quick Snapshot Stats (2 Columns on Mobile, 4 Columns on Tablet/Desktop) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 pt-2">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 sm:p-4 text-center">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">TOTAL PLAYERS</span>
                    <span className="text-lg sm:text-2xl font-black text-slate-900">{squad.length}</span>
                  </div>
                  <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-3 sm:p-4 text-center">
                    <span className="text-[10px] sm:text-xs font-black text-orange-600 uppercase tracking-wider block mb-1">AVERAGE CPI</span>
                    <span className="text-lg sm:text-2xl font-black text-orange-600">{teamCpi}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 sm:p-4 text-center">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">AVERAGE PPI</span>
                    <span className="text-lg sm:text-2xl font-black text-slate-800">{avgPpi}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 sm:p-4 text-center">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">AVERAGE MPI</span>
                    <span className="text-lg sm:text-2xl font-black text-slate-800">{avgMpi}</span>
                  </div>
                </div>

                {/* Team Strengths & Development Areas Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-2">
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                      <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">TEAM STRENGTHS</span>
                    </div>
                    {hasAssessmentData && overallParamScores.length > 0 ? (
                      <ul className="space-y-1.5">
                        {overallParamScores.slice(0, 3).map(s => (
                          <li key={s.name} className="text-xs font-bold text-slate-800 flex items-center justify-between">
                            <span>• {s.name}</span>
                            <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px] font-extrabold">{s.avg}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs font-bold text-slate-500 italic">
                        Insufficient assessment data
                      </p>
                    )}
                  </div>

                  <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-amber-600 stroke-[2.5]" />
                      <span className="text-xs font-black text-amber-800 uppercase tracking-wider">TEAM DEVELOPMENT AREAS</span>
                    </div>
                    {hasAssessmentData && overallParamScores.length > 0 ? (
                      <ul className="space-y-1.5">
                        {[...overallParamScores].reverse().slice(0, 3).map(s => (
                          <li key={s.name} className="text-xs font-bold text-slate-800 flex items-center justify-between">
                            <span>• {s.name}</span>
                            <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-[11px] font-extrabold">{s.avg}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs font-bold text-slate-500 italic">
                        Insufficient assessment data
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* TEAM SQUAD SECTION */}
              <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-5 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <span>TEAM SQUAD</span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-extrabold">
                        {squad.length}
                      </span>
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">
                      Players currently assigned to {team.name}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPlayerIds([]);
                      setShowAddModal(true);
                    }}
                    className="w-full sm:w-auto justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-2xl py-2.5 px-4 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                    <span>+ ADD PLAYERS</span>
                  </button>
                </div>

                {/* SQUAD PLAYER CARDS (1 Card Per Row on Mobile, 2 Cards Per Row on Desktop md:) */}
                {squad.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 space-y-3">
                    <Users2 className="w-10 h-10 text-slate-300 mx-auto" />
                    <div className="font-black text-slate-700 text-sm uppercase">NO PLAYERS IN SQUAD</div>
                    <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto">
                      Click "+ ADD PLAYERS" to select existing players from your coach squad and assign them to this team.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedPlayerIds([]);
                        setShowAddModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase tracking-wider hover:bg-orange-600 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>ADD PLAYERS NOW</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                    {squad.map((player) => {
                      const ppiDisplay = formatScore(player.ppiScore);
                      const mpiDisplay = formatScore(player.mpiScore);

                      return (
                        <div
                          key={player.id}
                          className="bg-white border border-slate-200 hover:border-orange-300 rounded-2xl p-3.5 sm:p-4 transition-all hover:shadow-md space-y-3 relative group w-full"
                        >
                          <div className="flex items-start gap-3">
                            {/* Circular Player Photo Avatar */}
                            <div className="w-12 h-12 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-black text-lg uppercase shrink-0 overflow-hidden shadow-sm">
                              {player.imageUrl ? (
                                <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                player.name.charAt(0).toUpperCase()
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-base sm:text-lg text-slate-900 truncate uppercase tracking-tight">
                                {player.name}
                              </h4>
                              <span className="inline-block mt-0.5 text-xs font-extrabold uppercase px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                {player.role || "Player"}
                              </span>
                              {(player.battingStyle || player.bowlingStyle) && (
                                <p className="text-xs font-medium text-slate-400 truncate mt-1">
                                  {[player.battingStyle, player.bowlingStyle].filter(Boolean).join(" • ")}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleRemovePlayer(player.id)}
                              disabled={removingPlayerId === player.id}
                              title="Remove player from team"
                              className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                            >
                              {removingPlayerId === player.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                              ) : (
                                <Trash2 className="w-4 h-4 stroke-[2]" />
                              )}
                            </button>
                          </div>

                          {/* Performance Scores Row */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                            <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">PPI SCORE</span>
                              <span className="text-sm font-black text-slate-900">{ppiDisplay}</span>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">MPI SCORE</span>
                              <span className="text-sm font-black text-slate-900">{mpiDisplay}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 7-PARAMETER ANALYTICS */}
          {activeTab === "7PARAMS" && (
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-5 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600 stroke-[2.5]" />
                  <span>TEAM 7-PARAMETER PERFORMANCE</span>
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Aggregate parameter-by-parameter analysis across all squad members. Practice & Match remain strictly separated.
                </p>
              </div>

              {/* Highlights Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">STRONGEST PARAMETER</span>
                    <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
                      {strongestParam ? strongestParam.name : "N/A"}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl">
                    {strongestParam ? strongestParam.avg : "N/A"}
                  </div>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">WEAKEST PARAMETER</span>
                    <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
                      {weakestParam ? weakestParam.name : "N/A"}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-xl">
                    {weakestParam ? weakestParam.avg : "N/A"}
                  </div>
                </div>
              </div>

              {/* 7 Parameters Grid Breakdown */}
              <div className="space-y-4 pt-2">
                <div className="font-black text-xs text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                  7 CPI PARAMETERS (PRACTICE VS MATCH)
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {PARAM_DEFINITIONS.map((p) => {
                    const pAvg = getParamAverage(practiceAssessments, p.getVal);
                    const mAvg = getParamAverage(matchAssessments, p.getVal);

                    const pPercent = pAvg !== null ? (pAvg / 100) * 100 : 0;
                    const mPercent = mAvg !== null ? (mAvg / 100) * 100 : 0;

                    return (
                      <div key={p.name} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                          <span className="font-black text-sm text-slate-900 uppercase">{p.name}</span>
                          <div className="flex items-center gap-3 text-xs font-bold">
                            <span className="text-slate-600">
                              Practice: <strong className="text-slate-900">{pAvg !== null ? pAvg : "N/A"}</strong>
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600">
                              Match: <strong className="text-slate-900">{mAvg !== null ? mAvg : "N/A"}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar Rows */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                            <span className="w-16 shrink-0 uppercase">PRACTICE</span>
                            <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-orange-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, pPercent))}%` }}
                              />
                            </div>
                            <span className="w-8 text-right font-black text-slate-700">{pAvg !== null ? pAvg : "N/A"}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                            <span className="w-16 shrink-0 uppercase">MATCH</span>
                            <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-slate-800 h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, mPercent))}%` }}
                              />
                            </div>
                            <span className="w-8 text-right font-black text-slate-700">{mAvg !== null ? mAvg : "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ASSESSMENT HISTORY */}
          {activeTab === "HISTORY" && (
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-5 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600 stroke-[2.5]" />
                    <span>TEAM ASSESSMENT HISTORY</span>
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    Complete historical log of practice and match assessments for players in this team squad.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => setHistoryFilter("ALL")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      historyFilter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setHistoryFilter("PRACTICE")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      historyFilter === "PRACTICE" ? "bg-orange-500 text-white shadow-sm" : "text-slate-500"
                    }`}
                  >
                    PRACTICE
                  </button>
                  <button
                    onClick={() => setHistoryFilter("MATCH")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      historyFilter === "MATCH" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500"
                    }`}
                  >
                    MATCH
                  </button>
                </div>
              </div>

              {/* Assessment List */}
              {(() => {
                const combinedList = [
                  ...practiceAssessments.map(a => ({ ...a, type: "PRACTICE" as const })),
                  ...matchAssessments.map(a => ({ ...a, type: "MATCH" as const }))
                ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

                const filtered = combinedList.filter(a => historyFilter === "ALL" || a.type === historyFilter);

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6">
                      <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <div className="font-black text-slate-700 text-sm uppercase">NO ASSESSMENT RECORDS FOUND</div>
                      <p className="text-xs text-slate-400 font-semibold mt-1">
                        Assessments completed for squad players will automatically appear in this history log.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filtered.map((item, idx) => (
                      <div
                        key={`${item.type}-${item.id}-${idx}`}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2 hover:bg-slate-100/60 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shrink-0 ${
                              item.type === "PRACTICE"
                                ? "bg-orange-100 text-orange-700 border border-orange-200"
                                : "bg-slate-900 text-white"
                            }`}>
                              {item.type}
                            </span>
                            <div className="min-w-0">
                              <h5 className="font-black text-sm text-slate-900 uppercase truncate">
                                {item.player?.name || "Squad Player"}
                              </h5>
                              <span className="text-xs font-semibold text-slate-400">
                                {new Date(item.date || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              {item.type === "PRACTICE" ? "PPI SCORE" : "MPI SCORE"}
                            </span>
                            <span className="text-base font-black text-slate-900">
                              {formatScore(item.ppiScore || item.mpiScore)}
                            </span>
                          </div>
                        </div>

                        {item.notes && (
                          <p className="text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl p-2.5 italic mt-1">
                            "{item.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 4: TEAM COACH NOTES */}
          {activeTab === "NOTES" && (
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-5 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600 stroke-[2.5]" />
                  <span>TEAM COACH NOTES</span>
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Record and maintain team-level observations, strategy notes, and coaching feedback.
                </p>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleSaveTeamNote} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-orange-600" />
                  ADD TEAM COACH NOTE
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      Assessment Type
                    </label>
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="PRACTICE">PRACTICE TEAM NOTE</option>
                      <option value="MATCH">MATCH TEAM NOTE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={noteDate}
                      onChange={(e) => setNoteDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <textarea
                    rows={3}
                    required
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Enter team coaching notes, strategy takeaways, or practice focus points..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSavingNote || !noteContent.trim()}
                    className="w-full sm:w-auto justify-center bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl py-2 px-5 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {isSavingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    <span>SAVE TEAM NOTE</span>
                  </button>
                </div>
              </form>

              {/* Team Notes List */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="font-black text-xs text-slate-700 uppercase tracking-wider">
                    SAVED TEAM NOTES ({teamNotes.length})
                  </span>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                    <button
                      onClick={() => setNoteFilter("ALL")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        noteFilter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                      }`}
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => setNoteFilter("PRACTICE")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        noteFilter === "PRACTICE" ? "bg-orange-500 text-white shadow-sm" : "text-slate-500"
                      }`}
                    >
                      PRACTICE
                    </button>
                    <button
                      onClick={() => setNoteFilter("MATCH")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        noteFilter === "MATCH" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500"
                      }`}
                    >
                      MATCH
                    </button>
                  </div>
                </div>

                {(() => {
                  const filteredNotes = teamNotes.filter(n => noteFilter === "ALL" || n.type === noteFilter);

                  if (filteredNotes.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-400 font-bold text-xs">
                        No team notes found for selected filter.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filteredNotes.map((n) => (
                        <div key={n.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                                n.type === "PRACTICE"
                                  ? "bg-orange-100 text-orange-700 border border-orange-200"
                                  : "bg-slate-900 text-white"
                              }`}>
                                {n.type} TEAM NOTE
                              </span>
                              <span className="text-xs font-bold text-slate-400">
                                {new Date(n.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>

                            <button
                              onClick={() => handleDeleteTeamNote(n.id)}
                              title="Delete note"
                              className="text-slate-300 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-xs font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {n.content}
                          </p>

                          <div className="text-[10px] font-semibold text-slate-400 pt-1 border-t border-slate-200/50">
                            By {n.coachName || "Coach"}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 5: TEAM A VS TEAM B COMPARISON */}
          {activeTab === "COMPARISON" && (
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-5 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-orange-600 stroke-[2.5]" />
                  <span>TEAM A VS TEAM B COMPARISON</span>
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Select any two existing teams to compare squad size, CPI averages, 7-parameter scores, and performance side-by-side.
                </p>
              </div>

              {/* Team Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-1.5">
                    SELECT TEAM A
                  </label>
                  <select
                    value={teamAId || ""}
                    onChange={(e) => setTeamAId(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Select Team A --</option>
                    {allTeams.map(t => (
                      <option key={`a-${t.id}`} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-1.5">
                    SELECT TEAM B
                  </label>
                  <select
                    value={teamBId || ""}
                    onChange={(e) => setTeamBId(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Select Team B --</option>
                    {allTeams.map(t => (
                      <option key={`b-${t.id}`} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingComparison ? (
                <div className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-500">Loading comparison data...</span>
                </div>
              ) : (
                <div className="space-y-5 sm:space-y-6">
                  {/* Side-by-side Snapshot Cards */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* TEAM A CARD */}
                    <div className="bg-orange-50/50 border border-orange-200 rounded-2xl p-3.5 sm:p-4 space-y-3">
                      <div className="border-b border-orange-200 pb-2">
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block">TEAM A</span>
                        <h4 className="font-black text-sm sm:text-base text-slate-900 uppercase truncate">
                          {teamAData ? teamAData.team.name : "Select Team A"}
                        </h4>
                      </div>

                      <div className="space-y-2 text-xs font-bold">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Players:</span>
                          <span className="text-slate-900">{compStatsA ? compStatsA.squadSize : "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Average CPI:</span>
                          <span className="text-orange-600 font-black">{compStatsA ? compStatsA.cpi : "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Practice PPI:</span>
                          <span className="text-slate-900">{compStatsA ? compStatsA.ppi : "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Match MPI:</span>
                          <span className="text-slate-900">{compStatsA ? compStatsA.mpi : "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* TEAM B CARD */}
                    <div className="bg-slate-100/70 border border-slate-300 rounded-2xl p-3.5 sm:p-4 space-y-3">
                      <div className="border-b border-slate-300 pb-2">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">TEAM B</span>
                        <h4 className="font-black text-sm sm:text-base text-slate-900 uppercase truncate">
                          {teamBData ? teamBData.team.name : "Select Team B"}
                        </h4>
                      </div>

                      <div className="space-y-2 text-xs font-bold">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Players:</span>
                          <span className="text-slate-900">{compStatsB ? compStatsB.squadSize : "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Average CPI:</span>
                          <span className="text-slate-900 font-black">{compStatsB ? compStatsB.cpi : "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Practice PPI:</span>
                          <span className="text-slate-900">{compStatsB ? compStatsB.ppi : "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Match MPI:</span>
                          <span className="text-slate-900">{compStatsB ? compStatsB.mpi : "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 7 Parameter Side-by-side Table */}
                  <div className="space-y-3 pt-2">
                    <div className="font-black text-xs text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                      7 CPI PARAMETERS COMPARISON
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3">
                      {PARAM_DEFINITIONS.map(p => {
                        const valA = compStatsA ? compStatsA.paramsMap[p.name]?.overall : "N/A";
                        const valB = compStatsB ? compStatsB.paramsMap[p.name]?.overall : "N/A";

                        const numA = valA !== "N/A" ? Number(valA) : 0;
                        const numB = valB !== "N/A" ? Number(valB) : 0;

                        return (
                          <div key={`comp-${p.name}`} className="space-y-1.5 border-b border-slate-200/50 pb-2.5 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-orange-600 font-black">{valA}</span>
                              <span className="font-black text-slate-900 uppercase">{p.name}</span>
                              <span className="text-slate-700 font-black">{valB}</span>
                            </div>

                            {/* Dual Bar Comparison */}
                            <div className="grid grid-cols-2 gap-2 h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
                              <div className="flex justify-end bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="bg-orange-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, Math.max(0, (numA / 100) * 100))}%` }}
                                />
                              </div>
                              <div className="flex justify-start bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="bg-slate-800 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, Math.max(0, (numB / 100) * 100))}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD PLAYERS TO TEAM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-orange-600 stroke-[2.5]" />
                  <span>ADD PLAYERS TO TEAM</span>
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Select players from your existing squad to add to {team?.name}.
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search Filter */}
            <div className="p-3 sm:p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search player name or role..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Modal Player Selection List */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1">
              {mySquad.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-bold text-xs">
                  No existing players found in your squad. Create players first under PLAYERS tab.
                </div>
              ) : (
                (() => {
                  const currentTeamPlayerIds = new Set((team?.players || []).map(p => p.id));
                  const filteredPlayers = mySquad.filter(p =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.role && p.role.toLowerCase().includes(searchQuery.toLowerCase()))
                  );

                  if (filteredPlayers.length === 0) {
                    return (
                      <div className="text-center py-6 text-slate-400 font-bold text-xs">
                        No players match "{searchQuery}"
                      </div>
                    );
                  }

                  return filteredPlayers.map((player) => {
                    const isAlreadyInTeam = currentTeamPlayerIds.has(player.id);
                    const isSelected = selectedPlayerIds.includes(player.id);

                    return (
                      <div
                        key={player.id}
                        onClick={() => {
                          if (!isAlreadyInTeam) togglePlayerSelection(player.id);
                        }}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isAlreadyInTeam
                            ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "bg-orange-50 border-orange-400 shadow-sm cursor-pointer"
                            : "bg-white border-slate-200 hover:border-slate-300 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-black text-sm uppercase shrink-0 overflow-hidden">
                            {player.imageUrl ? (
                              <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              player.name.charAt(0).toUpperCase()
                            )}
                          </div>

                          <div className="min-w-0">
                            <h5 className="font-black text-xs text-slate-900 uppercase tracking-tight truncate">
                              {player.name}
                            </h5>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">
                              {player.role || "Player"}
                            </span>
                          </div>
                        </div>

                        {isAlreadyInTeam ? (
                          <span className="text-[10px] font-black text-slate-500 bg-slate-200 px-2 py-1 rounded-md uppercase shrink-0">
                            IN TEAM
                          </span>
                        ) : (
                          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                            isSelected
                              ? "bg-orange-500 border-orange-500 text-white"
                              : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-black text-slate-600">
                {selectedPlayerIds.length} Selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
                >
                  CANCEL
                </button>

                <button
                  type="button"
                  onClick={handleAddSelectedPlayers}
                  disabled={isAddingPlayers || selectedPlayerIds.length === 0}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isAddingPlayers ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>ADDING...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>ADD PLAYERS</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
