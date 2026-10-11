"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import {
  Users2, Plus, Loader2, UserPlus, Trash2, Search,
  Edit2, Check, X, Shield, Sparkles, User, AlertCircle,
  FileText, Download, TrendingUp, TrendingDown, ArrowRightLeft,
  Calendar, CheckCircle2, Award, Target, Flame, ChevronDown,
  ChevronRight, BarChart2, Clock, Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CricketLoader from "@/components/CricketLoader";

interface Player {
  id: number;
  name: string;
  role?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  imageUrl?: string;
  photoUrl?: string;
  photo?: string;
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

const getPlayerImage = (player: Player) => {
  if (player.imageUrl) return player.imageUrl;
  if ((player as any).photoUrl) return (player as any).photoUrl;
  if ((player as any).photo) return (player as any).photo;
  const name = player.name || "Player";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=181B27&color=D4AF37&font-size=0.45&bold=true`;
};

const getPlayerCpiScore = (p: Player): string => {
  const ppiStr = formatScore(p.ppiScore);
  const mpiStr = formatScore(p.mpiScore);
  const ppi = ppiStr !== "N/A" ? Number(ppiStr) : 0;
  const mpi = mpiStr !== "N/A" ? Number(mpiStr) : 0;
  if (ppi > 0 && mpi > 0) return `${Math.round(ppi * 0.4 + mpi * 0.6)}`;
  if (ppi > 0) return `${ppi}`;
  if (mpi > 0) return `${mpi}`;
  return "N/A";
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
  { name: "Intensity", getVal: (a: AssessmentItem) => a.intensity }
];

const getCpiTier = (score: number | string | null | undefined): { label: string; color: string; bg: string; border: string } => {
  if (score === null || score === undefined || score === "N/A") {
    return { label: "Unrated", color: "text-zinc-400", bg: "bg-white/5", border: "border-white/10" };
  }
  const num = typeof score === "number" ? score : Number(score);
  if (isNaN(num) || num <= 0) {
    return { label: "Unrated", color: "text-zinc-400", bg: "bg-white/5", border: "border-white/10" };
  }
  if (num >= 85) return { label: "Elite", color: "text-[#F5BA4E]", bg: "bg-[#D4AF37]/15", border: "border-[#D4AF37]/35" };
  if (num >= 70) return { label: "High Perform", color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/15", border: "border-[#D4AF37]/35" };
  if (num >= 55) return { label: "Standard", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" };
  return { label: "Developing", color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30" };
};

export default function TeamPage() {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("cpi_teams_cache");
        if (cached) return false;
      } catch {}
    }
    return true;
  });

  const [allTeams, setAllTeams] = useState<Team[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("cpi_teams_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [team, setTeam] = useState<Team | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("cpi_teams_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
        }
      } catch {}
    }
    return null;
  });

  const [mySquad, setMySquad] = useState<Player[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("cpi_players_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  // Focused Navigation Tabs (Players Roster is primary!)
  const [activeTab, setActiveTab] = useState<"PLAYERS" | "ANALYTICS" | "NOTES" | "COMPARISON">("PLAYERS");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Search filter inside active squad
  const [squadSearchQuery, setSquadSearchQuery] = useState("");

  // Assessment & Notes Data
  const [practiceAssessments, setPracticeAssessments] = useState<AssessmentItem[]>([]);
  const [matchAssessments, setMatchAssessments] = useState<AssessmentItem[]>([]);
  const [teamNotes, setTeamNotes] = useState<TeamNote[]>([]);

  // Cache & Loading states
  const assessmentsCache = useRef<Map<number, { practiceAssessments: AssessmentItem[]; matchAssessments: AssessmentItem[] }>>(new Map());
  const notesCache = useRef<Map<number, TeamNote[]>>(new Map());
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

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

  // Comparison State
  const [teamAId, setTeamAId] = useState<number | null>(null);
  const [teamBId, setTeamBId] = useState<number | null>(null);
  const [teamAData, setTeamAData] = useState<{ team: Team; prac: AssessmentItem[]; match: AssessmentItem[] } | null>(null);
  const [teamBData, setTeamBData] = useState<{ team: Team; prac: AssessmentItem[]; match: AssessmentItem[] } | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [compParamFilter, setCompParamFilter] = useState<"OVERALL" | "PRACTICE" | "MATCH">("OVERALL");

  const fetchTeamData = async () => {
    try {
      const [allTeamsRes, squadRes] = await Promise.all([
        api.get("/teams").catch(() => ({ data: [] })),
        api.get("/players").catch(() => ({ data: [] }))
      ]);

      const teamsList = Array.isArray(allTeamsRes.data) ? allTeamsRes.data : [];
      setAllTeams(teamsList);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("cpi_teams_cache", JSON.stringify(teamsList));
          if (Array.isArray(squadRes.data)) {
            sessionStorage.setItem("cpi_players_cache", JSON.stringify(squadRes.data));
          }
        } catch {}
      }

      setTeam(prev => {
        if (prev && teamsList.some(t => t.id === prev.id)) {
          const updated = teamsList.find(t => t.id === prev.id) || prev;
          setEditName(updated.name || "");
          setEditDesc(updated.description || "");
          return updated;
        }
        const primary = teamsList[0] || null;
        if (primary) {
          setEditName(primary.name || "");
          setEditDesc(primary.description || "");
          setTeamAId(primary.id);
        }
        return primary;
      });

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

  const ensureAssessmentsLoaded = async (teamId: number, forceRefresh = false) => {
    if (!forceRefresh && assessmentsCache.current.has(teamId)) {
      const cached = assessmentsCache.current.get(teamId)!;
      setPracticeAssessments(cached.practiceAssessments);
      setMatchAssessments(cached.matchAssessments);
      return;
    }

    try {
      setLoadingAssessments(true);
      const res = await api.get(`/teams/${teamId}/assessments`).catch(() => ({ data: { practiceAssessments: [], matchAssessments: [] } }));
      const prac = res.data?.practiceAssessments || [];
      const match = res.data?.matchAssessments || [];
      assessmentsCache.current.set(teamId, { practiceAssessments: prac, matchAssessments: match });
      setPracticeAssessments(prac);
      setMatchAssessments(match);
    } catch (err) {
      console.error("Failed to load team assessments:", err);
    } finally {
      setLoadingAssessments(false);
    }
  };

  const ensureNotesLoaded = async (teamId: number, forceRefresh = false) => {
    if (!forceRefresh && notesCache.current.has(teamId)) {
      const cached = notesCache.current.get(teamId)!;
      setTeamNotes(cached);
      return;
    }

    try {
      setLoadingNotes(true);
      const res = await api.get(`/teams/${teamId}/notes`).catch(() => ({ data: [] }));
      const notes = Array.isArray(res.data) ? res.data : [];
      notesCache.current.set(teamId, notes);
      setTeamNotes(notes);
    } catch (err) {
      console.error("Failed to load team notes:", err);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (!team?.id) return;
    if (activeTab === "ANALYTICS") {
      ensureAssessmentsLoaded(team.id);
    } else if (activeTab === "NOTES") {
      ensureNotesLoaded(team.id);
    }
  }, [activeTab, team?.id]);

  useEffect(() => {
    if (activeTab !== "COMPARISON") return;

    const loadComparison = async () => {
      if (!teamAId && !teamBId) {
        setTeamAData(null);
        setTeamBData(null);
        return;
      }

      setLoadingComparison(true);
      try {
        if (teamAId) {
          const targetA = allTeams.find(t => t.id === teamAId);
          if (targetA) {
            let pracA: AssessmentItem[] = assessmentsCache.current.get(teamAId)?.practiceAssessments || [];
            let matchA: AssessmentItem[] = assessmentsCache.current.get(teamAId)?.matchAssessments || [];
            if (pracA.length === 0 && matchA.length === 0) {
              const resA = await api.get(`/teams/${teamAId}/assessments`).catch(() => ({ data: { practiceAssessments: [], matchAssessments: [] } }));
              pracA = resA.data?.practiceAssessments || [];
              matchA = resA.data?.matchAssessments || [];
              assessmentsCache.current.set(teamAId, { practiceAssessments: pracA, matchAssessments: matchA });
            }
            setTeamAData({ team: targetA, prac: pracA, match: matchA });
          }
        } else {
          setTeamAData(null);
        }

        if (teamBId) {
          const targetB = allTeams.find(t => t.id === teamBId);
          if (targetB) {
            let pracB: AssessmentItem[] = assessmentsCache.current.get(teamBId)?.practiceAssessments || [];
            let matchB: AssessmentItem[] = assessmentsCache.current.get(teamBId)?.matchAssessments || [];
            if (pracB.length === 0 && matchB.length === 0) {
              const resB = await api.get(`/teams/${teamBId}/assessments`).catch(() => ({ data: { practiceAssessments: [], matchAssessments: [] } }));
              pracB = resB.data?.practiceAssessments || [];
              matchB = resB.data?.matchAssessments || [];
              assessmentsCache.current.set(teamBId, { practiceAssessments: pracB, matchAssessments: matchB });
            }
            setTeamBData({ team: targetB, prac: pracB, match: matchB });
          }
        } else {
          setTeamBData(null);
        }
      } catch (e) {
        console.error("Error loading comparison data:", e);
      } finally {
        setLoadingComparison(false);
      }
    };

    loadComparison();
  }, [activeTab, teamAId, teamBId, allTeams]);

  const selectTeam = (selected: Team) => {
    setTeam(selected);
    setEditName(selected.name || "");
    setEditDesc(selected.description || "");
    setTeamAId(selected.id);
    setSquadSearchQuery("");

    if (activeTab === "ANALYTICS") {
      ensureAssessmentsLoaded(selected.id);
    } else if (activeTab === "NOTES") {
      ensureNotesLoaded(selected.id);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    try {
      setIsCreating(true);
      const res = await api.post("/teams", {
        name: createName.trim(),
        description: createDesc.trim(),
      });
      const newTeam = res.data;
      setAllTeams(prev => {
        const filtered = prev.filter(t => t.id !== newTeam.id);
        const updated = [...filtered, newTeam];
        try { sessionStorage.setItem("cpi_teams_cache", JSON.stringify(updated)); } catch {}
        return updated;
      });
      selectTeam(newTeam);
      setCreateName("");
      setCreateDesc("");
      setShowCreateModal(false);
      setActiveTab("PLAYERS");
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
      const updated = res.data;
      setTeam(updated);
      setAllTeams(prev => {
        const next = prev.map(t => t.id === updated.id ? updated : t);
        try { sessionStorage.setItem("cpi_teams_cache", JSON.stringify(next)); } catch {}
        return next;
      });
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
      const updated = res.data;
      setTeam(updated);
      setAllTeams(prev => {
        const next = prev.map(t => t.id === updated.id ? updated : t);
        try { sessionStorage.setItem("cpi_teams_cache", JSON.stringify(next)); } catch {}
        return next;
      });
      assessmentsCache.current.delete(team.id);
      if (activeTab === "ANALYTICS") {
        ensureAssessmentsLoaded(team.id, true);
      }
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
      const updated = res.data;
      setTeam(updated);
      setAllTeams(prev => {
        const next = prev.map(t => t.id === updated.id ? updated : t);
        try { sessionStorage.setItem("cpi_teams_cache", JSON.stringify(next)); } catch {}
        return next;
      });
      assessmentsCache.current.delete(team.id);
      if (activeTab === "ANALYTICS") {
        ensureAssessmentsLoaded(team.id, true);
      }
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
      const newNote = res.data;
      setTeamNotes(prev => {
        const updated = [newNote, ...prev];
        notesCache.current.set(team.id, updated);
        return updated;
      });
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
      setTeamNotes(prev => {
        const updated = prev.filter(n => n.id !== noteId);
        notesCache.current.set(team.id, updated);
        return updated;
      });
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
  const generateTeamPdfReport = async () => {
    if (!team) return;

    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const reportDateStr = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    const coachName = typeof window !== "undefined" ? localStorage.getItem("userName") || "Coach" : "Coach";

    doc.setFillColor(15, 23, 42);
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

    y += 24;

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
    doc.text("PLAYER FULL NAME", 18, y + 3.5);
    doc.text("CPI SCORE", 100, y + 3.5);
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
      doc.text(getPlayerCpiScore(p), 100, y + 3.2);
      doc.text(formatScore(p.ppiScore), 140, y + 3.2);
      doc.text(formatScore(p.mpiScore), 175, y + 3.2);

      y += 4.5;
    });

    doc.save(`${team.name.replace(/\s+/g, "_")}_Team_Report.pdf`);
  };

  if (loading) {
    return <CricketLoader fullScreen message="Loading Team..." subtext="Cricket Performance Index" />;
  }

  // Active squad and metrics calculation
  const squad = team?.players || [];
  const filteredSquad = squad.filter(p =>
    squadSearchQuery ? p.name.toLowerCase().includes(squadSearchQuery.toLowerCase()) : true
  );

  const allAssessments = [...practiceAssessments, ...matchAssessments];
  const hasAssessmentData = allAssessments.length > 0;

  const validPpi = squad.map(p => formatScore(p.ppiScore)).filter(s => s !== "N/A").map(s => Number(s));
  const validMpi = squad.map(p => formatScore(p.mpiScore)).filter(s => s !== "N/A").map(s => Number(s));

  const avgPpi = validPpi.length > 0 ? Math.round(validPpi.reduce((a, b) => a + b, 0) / validPpi.length) : "N/A";
  const avgMpi = validMpi.length > 0 ? Math.round(validMpi.reduce((a, b) => a + b, 0) / validMpi.length) : "N/A";

  const teamCpi = (typeof avgPpi === "number" && typeof avgMpi === "number")
    ? Math.round((avgPpi + avgMpi) / 2)
    : (typeof avgPpi === "number" ? avgPpi : (typeof avgMpi === "number" ? avgMpi : "N/A"));

  const teamTier = getCpiTier(teamCpi);

  // Comparison helper
  const calcComparisonStats = (data: { team: Team; prac: AssessmentItem[]; match: AssessmentItem[] } | null) => {
    if (!data) return null;

    const squadList = data.team.players || [];
    const allAss = [...data.prac, ...data.match];

    const pracAssScores = data.prac.map(a => a.ppiScore).filter((v): v is number => typeof v === "number" && v > 0);
    const squadPpiList = squadList.map(p => formatScore(p.ppiScore)).filter(s => s !== "N/A").map(s => Number(s));

    let ppiAvg: number | "N/A" = "N/A";
    if (pracAssScores.length > 0) {
      const avg = pracAssScores.reduce((a, b) => a + b, 0) / pracAssScores.length;
      ppiAvg = Math.round(avg <= 10 ? avg * 10 : avg);
    } else if (squadPpiList.length > 0) {
      ppiAvg = Math.round(squadPpiList.reduce((a, b) => a + b, 0) / squadPpiList.length);
    }

    const matchAssScores = data.match.map(a => a.mpiScore).filter((v): v is number => typeof v === "number" && v > 0);
    const squadMpiList = squadList.map(p => formatScore(p.mpiScore)).filter(s => s !== "N/A").map(s => Number(s));

    let mpiAvg: number | "N/A" = "N/A";
    if (matchAssScores.length > 0) {
      const avg = matchAssScores.reduce((a, b) => a + b, 0) / matchAssScores.length;
      mpiAvg = Math.round(avg <= 10 ? avg * 10 : avg);
    } else if (squadMpiList.length > 0) {
      mpiAvg = Math.round(squadMpiList.reduce((a, b) => a + b, 0) / squadMpiList.length);
    }

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

    return {
      squadSize: squadList.length,
      cpi: cpiVal,
      ppi: ppiAvg,
      mpi: mpiAvg,
      paramsMap
    };
  };

  const compStatsA = calcComparisonStats(teamAData);
  const compStatsB = calcComparisonStats(teamBData);

  return (
    <div className="relative space-y-5 sm:space-y-6 pb-28 sm:pb-20 max-w-full overflow-x-hidden">
      {/* Ambient background glow accents */}
      <div className="absolute -top-24 -right-20 w-96 h-96 bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)] pointer-events-none -z-10" />
      <div className="absolute top-96 -left-28 w-80 h-80 bg-[radial-gradient(circle,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none -z-10" />

      {/* ── 1. HEADER & PURPOSE (Clear, High-Impact) ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#181B27] via-[#12141D] to-[#0A0C12] border border-[#D4AF37]/30 shadow-2xl shadow-[#D4AF37]/10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-90" />

        <div className="space-y-1 min-w-0 z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#F5BA4E] text-[9.5px] font-black tracking-widest uppercase">
            <Shield className="w-3 h-3 text-[#D4AF37]" />
            <span>SQUAD ROSTER & TEAM MANAGEMENT</span>
          </div>

          <div className="flex items-center gap-2.5 pt-0.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white uppercase">
              TEAM{" "}
              <span className="bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent">
                MANAGEMENT
              </span>
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-zinc-400 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span>Organize your squads, assign players, and monitor team performance</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 z-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] hover:from-[#F8C868] hover:to-[#C69212] text-[#090A0E] font-black text-xs uppercase tracking-wider py-3 px-5 sm:px-6 rounded-2xl shadow-lg shadow-[#D4AF37]/25 hover:shadow-[#D4AF37]/40 transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#D4AF37]/50"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>CREATE NEW TEAM</span>
          </motion.button>

          {team && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => generateTeamPdfReport()}
              className="px-4 py-3 rounded-2xl bg-[#12141D]/90 hover:bg-[#181B27] text-zinc-300 hover:text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 border border-white/10 hover:border-[#D4AF37]/40 shadow-sm"
              title="Download Team PDF Report"
            >
              <Download className="w-4 h-4 text-[#D4AF37]" />
              <span className="hidden sm:inline">REPORT</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ── 2. TEAM SELECTOR (Clear, Instant Squad Switcher) ── */}
      {allTeams.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Users2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>SELECT SQUAD TO MANAGE ({allTeams.length})</span>
            </span>
            <span className="text-[10px] font-bold text-zinc-500">
              Active: <strong className="text-white">{team?.name || "None"}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {allTeams.map((t) => {
              const isSelected = team?.id === t.id;
              const count = t.players?.length || 0;
              return (
                <button
                  key={`pill-${t.id}`}
                  onClick={() => selectTeam(t)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer flex items-center gap-2.5 border ${
                    isSelected
                      ? "bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] text-[#090A0E] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/25"
                      : "bg-[#12141D] hover:bg-[#181B27] text-zinc-300 hover:text-white border-white/10 hover:border-[#D4AF37]/40"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${
                      isSelected ? "bg-[#090A0E]/20 text-[#090A0E]" : "bg-[#D4AF37]/20 text-[#D4AF37]"
                    }`}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <span>{t.name}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isSelected ? "bg-[#090A0E]/20 text-[#090A0E]" : "bg-white/10 text-zinc-400"
                    }`}
                  >
                    {count} {count === 1 ? "player" : "players"}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer flex items-center gap-1.5 bg-[#12141D]/60 hover:bg-[#181B27] text-zinc-400 hover:text-[#D4AF37] border border-dashed border-white/15 hover:border-[#D4AF37]/50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ NEW TEAM</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STATE 1: NO TEAMS CREATED YET ── */}
      {allTeams.length === 0 && !team && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl bg-gradient-to-b from-[#181B27]/95 to-[#12141D]/95 border border-[#D4AF37]/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden"
        >
          <div className="w-20 h-20 rounded-3xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] mx-auto flex items-center justify-center shadow-inner">
            <Shield className="w-10 h-10 stroke-[2]" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              NO TEAMS CREATED YET
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-medium leading-relaxed">
              Create your first team squad (e.g. "Senior Academy XI" or "U-19 Squad") to group athletes, assign players, and track collective CPI benchmarks.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] text-[#090A0E] rounded-2xl py-3.5 px-8 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#D4AF37]/25 cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>CREATE YOUR FIRST TEAM</span>
          </motion.button>
        </motion.div>
      )}

      {/* ── STATE 2: ACTIVE TEAM MANAGEMENT DASHBOARD ── */}
      {allTeams.length > 0 && team && (
        <div className="space-y-5">
          {/* ── ACTIVE TEAM CARD & BENCHMARKS ── */}
          <div className="rounded-3xl bg-gradient-to-b from-[#181B27]/95 via-[#12141D]/95 to-[#0E1017] border border-[#D4AF37]/30 p-5 sm:p-6 shadow-xl space-y-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] text-[#090A0E] font-black text-2xl flex items-center justify-center shrink-0 uppercase shadow-lg shadow-[#D4AF37]/25 border border-[#D4AF37]/50">
                  {team.name.charAt(0)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ACTIVE SQUAD
                    </span>
                    <span className="text-xs text-zinc-500 font-bold">
                      {squad.length} Athletes
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-0.5 truncate">
                    {team.name}
                  </h2>

                  {team.description && (
                    <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                      {team.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{isEditing ? "CANCEL" : "EDIT SQUAD"}</span>
                </button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedPlayerIds([]);
                    setShowAddModal(true);
                  }}
                  className="bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] hover:from-[#F8C868] text-[#090A0E] rounded-xl py-2 px-4 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-[#D4AF37]/25 cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ ADD PLAYERS</span>
                </motion.button>
              </div>
            </div>

            {/* Inline Edit Form */}
            {isEditing && (
              <form onSubmit={handleUpdateTeam} className="bg-[#0E1017] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>EDIT SQUAD DETAILS</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Team Name"
                    className="w-full bg-[#181B27] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Team Description (optional)"
                    className="w-full bg-[#181B27] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || !editName.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F5BA4E] to-[#D4AF37] text-[#090A0E] text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    <span>SAVE CHANGES</span>
                  </button>
                </div>
              </form>
            )}

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0E1017] border border-white/10 rounded-2xl p-3.5 text-center">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                  SQUAD ROSTER
                </span>
                <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
                  {squad.length}
                </span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5 block">
                  Assigned Athletes
                </span>
              </div>

              <div className="bg-[#0E1017] border border-[#D4AF37]/30 rounded-2xl p-3.5 text-center">
                <span className="text-[10px] font-extrabold text-[#F5BA4E] uppercase tracking-wider block">
                  TEAM CPI
                </span>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-[#D4AF37] font-mono">
                    {teamCpi}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border ${teamTier.color} ${teamTier.bg} ${teamTier.border}`}>
                    {teamTier.label}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5 block">
                  Collective Index
                </span>
              </div>

              <div className="bg-[#0E1017] border border-white/10 rounded-2xl p-3.5 text-center">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                  PRACTICE PPI
                </span>
                <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
                  {avgPpi}
                </span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5 block">
                  Practice Average
                </span>
              </div>

              <div className="bg-[#0E1017] border border-white/10 rounded-2xl p-3.5 text-center">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                  MATCH MPI
                </span>
                <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
                  {avgMpi}
                </span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5 block">
                  Match Average
                </span>
              </div>
            </div>
          </div>

          {/* ── 3. FOCUSED SUB-TABS (Players Roster is Front and Center!) ── */}
          <div className="bg-[#0E1017] border border-white/10 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-inner">
            {[
              { id: "PLAYERS", label: "SQUAD PLAYERS", count: squad.length, icon: Users2 },
              { id: "ANALYTICS", label: "TEAM ANALYTICS", icon: BarChart2 },
              { id: "NOTES", label: "COACH NOTES", count: teamNotes.length, icon: FileText },
              { id: "COMPARISON", label: "COMPARE SQUADS", icon: ArrowRightLeft }
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-4 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? "bg-gradient-to-r from-[#F5BA4E] via-[#D4AF37] to-[#B8860B] text-[#090A0E] font-black shadow-lg shadow-[#D4AF37]/25"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 stroke-[2.2] ${isActive ? "scale-110" : ""}`} />
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        isActive ? "bg-[#090A0E]/20 text-[#090A0E]" : "bg-white/10 text-zinc-300"
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── TAB 1: SQUAD PLAYERS (Core Player Management) ── */}
          {activeTab === "PLAYERS" && (
            <div className="space-y-4">
              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12141D] border border-white/10 rounded-2xl p-3.5 sm:p-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={squadSearchQuery}
                    onChange={(e) => setSquadSearchQuery(e.target.value)}
                    placeholder="Search player in squad by full name..."
                    className="w-full bg-[#0E1017] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <span className="text-xs font-bold text-zinc-400">
                    Showing <strong className="text-white">{filteredSquad.length}</strong> of {squad.length} athletes
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPlayerIds([]);
                      setShowAddModal(true);
                    }}
                    className="bg-[#D4AF37]/15 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#090A0E] border border-[#D4AF37]/35 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>ADD PLAYERS</span>
                  </button>
                </div>
              </div>

              {/* Player Cards Roster */}
              {squad.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-b from-[#181B27]/90 to-[#12141D]/90 border border-dashed border-white/15 rounded-3xl p-6 space-y-3">
                  <Users2 className="w-12 h-12 text-zinc-500 mx-auto" />
                  <div className="font-black text-white text-base uppercase">NO PLAYERS IN THIS SQUAD</div>
                  <p className="text-xs text-zinc-400 font-medium max-w-sm mx-auto">
                    Click "+ ADD PLAYERS" to select athletes from your roster and assign them to {team.name}.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedPlayerIds([]);
                      setShowAddModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F5BA4E] to-[#D4AF37] text-[#090A0E] text-xs font-black uppercase tracking-wider cursor-pointer shadow-md shadow-[#D4AF37]/25"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>ADD PLAYERS NOW</span>
                  </button>
                </div>
              ) : filteredSquad.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 font-bold text-xs bg-[#12141D] rounded-2xl border border-white/10">
                  No players match "{squadSearchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                  {filteredSquad.map((player) => {
                    const cpiDisplay = getPlayerCpiScore(player);
                    const ppiDisplay = formatScore(player.ppiScore);
                    const mpiDisplay = formatScore(player.mpiScore);

                    return (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        className="bg-gradient-to-b from-[#181B27]/95 to-[#12141D]/95 border border-white/10 hover:border-[#D4AF37]/50 rounded-2xl p-4 sm:p-4.5 transition-all duration-300 hover:shadow-xl hover:shadow-[#D4AF37]/10 flex flex-col justify-between gap-3 group"
                      >
                        {/* Top: Avatar, FULL Name, Remove Button */}
                        <div className="flex items-start gap-3.5 min-w-0">
                          {/* Profile Avatar */}
                          <div className="w-12 h-12 rounded-full bg-[#1B1E2C] ring-2 ring-[#D4AF37]/40 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                            <img
                              src={getPlayerImage(player)}
                              alt={player.name}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>

                          {/* FULL PLAYER NAME - NEVER TRUNCATED! */}
                          <div className="min-w-0 flex-1">
                            <h4
                              onClick={() => router.push(`/players?id=${player.id}`)}
                              className="text-sm sm:text-base font-black text-white break-words leading-tight hover:text-[#F5BA4E] transition-colors cursor-pointer"
                            >
                              {player.name}
                            </h4>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mt-0.5">
                              Squad Athlete
                            </span>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemovePlayer(player.id)}
                            disabled={removingPlayerId === player.id}
                            title="Remove player from team"
                            className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer shrink-0"
                          >
                            {removingPlayerId === player.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                            ) : (
                              <Trash2 className="w-4 h-4 stroke-[2]" />
                            )}
                          </button>
                        </div>

                        {/* Performance Scores Row: CPI, PPI, MPI */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/8 text-center">
                          <div className="bg-[#0E1017] rounded-xl py-1.5 px-2 border border-white/5">
                            <span className="text-[8px] font-bold text-[#F5BA4E] uppercase block leading-none">
                              CPI SCORE
                            </span>
                            <span className="text-sm sm:text-base font-black text-[#D4AF37] font-mono block mt-0.5">
                              {cpiDisplay}
                            </span>
                          </div>
                          <div className="bg-[#0E1017] rounded-xl py-1.5 px-2 border border-white/5">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase block leading-none">
                              PRACTICE PPI
                            </span>
                            <span className="text-sm sm:text-base font-black text-white font-mono block mt-0.5">
                              {ppiDisplay}
                            </span>
                          </div>
                          <div className="bg-[#0E1017] rounded-xl py-1.5 px-2 border border-white/5">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase block leading-none">
                              MATCH MPI
                            </span>
                            <span className="text-sm sm:text-base font-black text-white font-mono block mt-0.5">
                              {mpiDisplay}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: TEAM ANALYTICS ── */}
          {activeTab === "ANALYTICS" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl bg-gradient-to-b from-[#181B27]/95 via-[#12141D]/95 to-[#0E1017] border border-white/10 p-5 sm:p-7 shadow-xl space-y-6"
            >
              <div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#D4AF37] stroke-[2.5]" />
                  <span>5 CPI PARAMETERS PERFORMANCE</span>
                </h3>
                <p className="text-xs font-semibold text-zinc-400 mt-0.5">
                  Aggregate parameter breakdown across all members of {team.name}. Practice and match remain strictly separated.
                </p>
              </div>

              {loadingAssessments && practiceAssessments.length === 0 && matchAssessments.length === 0 ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37] mx-auto mb-2" />
                  <span className="text-xs font-bold text-zinc-400">Loading parameter analytics...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {PARAM_DEFINITIONS.map((p) => {
                    const pAvg = getParamAverage(practiceAssessments, p.getVal);
                    const mAvg = getParamAverage(matchAssessments, p.getVal);

                    const pPercent = pAvg !== null ? (pAvg / 100) * 100 : 0;
                    const mPercent = mAvg !== null ? (mAvg / 100) * 100 : 0;

                    return (
                      <div key={p.name} className="bg-[#0E1017] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                          <span className="font-black text-sm text-white uppercase tracking-tight">{p.name}</span>
                          <div className="flex items-center gap-3 text-xs font-bold">
                            <span className="text-zinc-400">
                              Practice: <strong className="text-[#F5BA4E] font-mono font-black">{pAvg !== null ? pAvg : "N/A"}</strong>
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-400">
                              Match: <strong className="text-[#D4AF37] font-mono font-black">{mAvg !== null ? mAvg : "N/A"}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5 text-[10px] font-bold text-zinc-400">
                            <span className="w-16 shrink-0 uppercase font-black text-zinc-300">PRACTICE</span>
                            <div className="flex-1 bg-[#181B27] h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                              <div
                                className="bg-gradient-to-r from-[#F5BA4E] to-[#D4AF37] h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(0, pPercent))}%` }}
                              />
                            </div>
                            <span className="w-8 text-right font-black text-white font-mono">{pAvg !== null ? pAvg : "N/A"}</span>
                          </div>

                          <div className="flex items-center gap-2.5 text-[10px] font-bold text-zinc-400">
                            <span className="w-16 shrink-0 uppercase font-black text-zinc-300">MATCH</span>
                            <div className="flex-1 bg-[#181B27] h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                              <div
                                className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(0, mPercent))}%` }}
                              />
                            </div>
                            <span className="w-8 text-right font-black text-white font-mono">{mAvg !== null ? mAvg : "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── TAB 3: COACH NOTES ── */}
          {activeTab === "NOTES" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl bg-gradient-to-b from-[#181B27]/95 via-[#12141D]/95 to-[#0E1017] border border-white/10 p-5 sm:p-7 shadow-xl space-y-6"
            >
              <div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#D4AF37] stroke-[2.5]" />
                  <span>TEAM COACH NOTES</span>
                </h3>
                <p className="text-xs font-semibold text-zinc-400 mt-0.5">
                  Record and maintain squad-level strategy notes, observations, and coaching feedback.
                </p>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleSaveTeamNote} className="bg-[#0E1017] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="font-black text-xs uppercase tracking-wider text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>ADD COACH NOTE FOR {team.name.toUpperCase()}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">
                      Note Category
                    </label>
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as any)}
                      className="w-full bg-[#181B27] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="PRACTICE">PRACTICE SESSION NOTE</option>
                      <option value="MATCH">MATCH ASSESSMENT NOTE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={noteDate}
                      onChange={(e) => setNoteDate(e.target.value)}
                      className="w-full bg-[#181B27] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <textarea
                    rows={3}
                    required
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Enter coaching notes, team tactical takeaways, or performance observations..."
                    className="w-full bg-[#181B27] border border-white/10 rounded-xl p-3.5 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSavingNote || !noteContent.trim()}
                    className="bg-gradient-to-r from-[#F5BA4E] to-[#D4AF37] hover:from-[#F8C868] disabled:opacity-50 text-[#090A0E] rounded-xl py-2.5 px-6 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#D4AF37]/20"
                  >
                    {isSavingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    <span>SAVE SQUAD NOTE</span>
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-3">
                {loadingNotes && teamNotes.length === 0 ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37] mx-auto mb-2" />
                    <span className="text-xs font-bold text-zinc-400">Loading squad notes...</span>
                  </div>
                ) : teamNotes.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 font-bold text-xs bg-[#0E1017] rounded-2xl border border-white/10">
                    No coach notes recorded for {team.name} yet.
                  </div>
                ) : (
                  teamNotes.map((n) => (
                    <div key={n.id} className="bg-[#0E1017] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                            n.type === "PRACTICE"
                              ? "bg-amber-500/15 text-[#F5BA4E] border border-amber-500/30"
                              : "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                          }`}>
                            {n.type} NOTE
                          </span>
                          <span className="text-xs font-bold text-zinc-400">
                            {new Date(n.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteTeamNote(n.id)}
                          title="Delete note"
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs font-medium text-zinc-200 whitespace-pre-wrap leading-relaxed">
                        {n.content}
                      </p>

                      <div className="text-[10px] font-semibold text-zinc-500 pt-2 border-t border-white/5 flex items-center justify-between">
                        <span>Author: {n.coachName || "Coach"}</span>
                        <span>Recorded for {team.name}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ── TAB 4: COMPARE SQUADS ── */}
          {activeTab === "COMPARISON" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl bg-gradient-to-b from-[#181B27]/95 via-[#12141D]/95 to-[#0E1017] border border-white/10 p-5 sm:p-7 shadow-xl space-y-6"
            >
              <div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-[#D4AF37] stroke-[2.5]" />
                  <span>COMPARE SQUADS SIDE-BY-SIDE</span>
                </h3>
                <p className="text-xs font-semibold text-zinc-400 mt-0.5">
                  Select any two existing teams to compare squad size, CPI averages, and parameter performance side-by-side.
                </p>
              </div>

              {/* Team Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0E1017] border border-white/10 rounded-2xl p-4 sm:p-5">
                <div>
                  <label className="block text-xs font-black uppercase text-zinc-400 tracking-wider mb-1.5">
                    PRIMARY SQUAD
                  </label>
                  <select
                    value={teamAId || ""}
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      setTeamAId(selectedId);
                      if (teamBId === selectedId) setTeamBId(null);
                    }}
                    className="w-full bg-[#181B27] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="" disabled>-- Select Primary Squad --</option>
                    {allTeams.map(t => (
                      <option key={`a-${t.id}`} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-zinc-400 tracking-wider mb-1.5">
                    COMPARE WITH
                  </label>
                  <select
                    value={teamBId || ""}
                    onChange={(e) => setTeamBId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-[#181B27] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">-- Select Second Squad to Compare --</option>
                    {allTeams
                      .filter(t => t.id !== teamAId)
                      .map(t => (
                        <option key={`b-${t.id}`} value={t.id}>{t.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              {loadingComparison ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37] mx-auto mb-2" />
                  <span className="text-xs font-bold text-zinc-400">Loading squad comparison...</span>
                </div>
              ) : (!teamAId || !teamBId || !teamAData || !teamBData) ? (
                <div className="text-center py-10 text-zinc-400 font-bold text-xs bg-[#0E1017] rounded-2xl border border-white/10">
                  Select two squads above to view side-by-side performance comparison.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SQUAD 1 CARD */}
                  <div className="bg-[#0E1017] border border-[#D4AF37]/30 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/8 pb-3">
                      <div>
                        <span className="text-[10px] font-black text-[#F5BA4E] uppercase tracking-wider block">
                          SQUAD 1
                        </span>
                        <h4 className="font-black text-base text-white uppercase truncate">
                          {teamAData.team.name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">TEAM CPI</span>
                        <span className="text-xl font-black text-[#D4AF37] font-mono">
                          {compStatsA?.cpi || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-[#181B27] rounded-xl p-2 border border-white/5">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">PLAYERS</span>
                        <span className="font-black text-white">{compStatsA?.squadSize || 0}</span>
                      </div>
                      <div className="bg-[#181B27] rounded-xl p-2 border border-white/5">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">PPI</span>
                        <span className="font-black text-white font-mono">{compStatsA?.ppi || "N/A"}</span>
                      </div>
                      <div className="bg-[#181B27] rounded-xl p-2 border border-white/5">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">MPI</span>
                        <span className="font-black text-white font-mono">{compStatsA?.mpi || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* SQUAD 2 CARD */}
                  <div className="bg-[#0E1017] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/8 pb-3">
                      <div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">
                          SQUAD 2
                        </span>
                        <h4 className="font-black text-base text-white uppercase truncate">
                          {teamBData.team.name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">TEAM CPI</span>
                        <span className="text-xl font-black text-[#D4AF37] font-mono">
                          {compStatsB?.cpi || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-[#181B27] rounded-xl p-2 border border-white/5">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">PLAYERS</span>
                        <span className="font-black text-white">{compStatsB?.squadSize || 0}</span>
                      </div>
                      <div className="bg-[#181B27] rounded-xl p-2 border border-white/5">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">PPI</span>
                        <span className="font-black text-white font-mono">{compStatsB?.ppi || "N/A"}</span>
                      </div>
                      <div className="bg-[#181B27] rounded-xl p-2 border border-white/5">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">MPI</span>
                        <span className="font-black text-white font-mono">{compStatsB?.mpi || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* ── MODAL: ADD PLAYERS TO TEAM ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-[#090A0E]/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-[#12141D] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#181B27]/80">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#D4AF37] stroke-[2.5]" />
                    <span>ADD ATHLETES TO {team?.name?.toUpperCase()}</span>
                  </h3>
                  <p className="text-xs font-semibold text-zinc-400 mt-0.5">
                    Select players from your roster to assign to this squad.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <div className="p-3.5 sm:p-4 border-b border-white/10 bg-[#0E1017]">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search player by full name..."
                    className="w-full bg-[#181B27] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Player list */}
              <div className="p-3.5 sm:p-4 overflow-y-auto space-y-2 flex-1">
                {mySquad.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 font-bold text-xs">
                    No players found in your roster. Add players under the PLAYERS tab first.
                  </div>
                ) : (
                  (() => {
                    const currentTeamPlayerIds = new Set((team?.players || []).map(p => p.id));
                    const filteredPlayers = mySquad.filter(p =>
                      p.name.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    if (filteredPlayers.length === 0) {
                      return (
                        <div className="text-center py-6 text-zinc-400 font-bold text-xs">
                          No players match "{searchQuery}"
                        </div>
                      );
                    }

                    return filteredPlayers.map((player) => {
                      const isAlreadyInTeam = currentTeamPlayerIds.has(player.id);
                      const isSelected = selectedPlayerIds.includes(player.id);
                      const cpiDisplay = getPlayerCpiScore(player);

                      return (
                        <div
                          key={player.id}
                          onClick={() => {
                            if (!isAlreadyInTeam) togglePlayerSelection(player.id);
                          }}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                            isAlreadyInTeam
                              ? "bg-[#0E1017] border-white/5 opacity-50 cursor-not-allowed"
                              : isSelected
                              ? "bg-[#D4AF37]/15 border-[#D4AF37] shadow-sm cursor-pointer"
                              : "bg-[#181B27] border-white/5 hover:border-white/20 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-full bg-[#1B1E2C] ring-1 ring-[#D4AF37]/40 flex items-center justify-center shrink-0 overflow-hidden">
                              <img
                                src={getPlayerImage(player)}
                                alt={player.name}
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            </div>

                            {/* FULL PLAYER NAME - NO TRUNCATION */}
                            <div className="min-w-0 flex-1 pr-2">
                              <h5 className="font-black text-xs sm:text-sm text-white break-words leading-tight">
                                {player.name}
                              </h5>
                              <span className="text-[10px] font-bold text-zinc-400 font-mono mt-0.5 block">
                                CPI Score: <strong className="text-[#D4AF37]">{cpiDisplay}</strong>
                              </span>
                            </div>
                          </div>

                          {isAlreadyInTeam ? (
                            <span className="text-[10px] font-black text-zinc-400 bg-white/5 px-2.5 py-1 rounded-md uppercase shrink-0">
                              IN SQUAD
                            </span>
                          ) : (
                            <div
                              className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                                isSelected
                                  ? "bg-[#D4AF37] border-[#D4AF37] text-[#090A0E]"
                                  : "border-white/20 bg-[#0E1017]"
                              }`}
                            >
                              {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()
                )}
              </div>

              {/* Footer */}
              <div className="p-3.5 sm:p-4 border-t border-white/10 bg-[#0E1017] flex items-center justify-between">
                <span className="text-xs font-black text-zinc-400">
                  <strong className="text-[#D4AF37]">{selectedPlayerIds.length}</strong> Selected
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    CANCEL
                  </button>

                  <button
                    type="button"
                    onClick={handleAddSelectedPlayers}
                    disabled={isAddingPlayers || selectedPlayerIds.length === 0}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F5BA4E] to-[#D4AF37] hover:from-[#F8C868] disabled:opacity-50 text-[#090A0E] text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#D4AF37]/20"
                  >
                    {isAddingPlayers ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>ADDING...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>ADD TO SQUAD</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: CREATE NEW TEAM ── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-[#090A0E]/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-[#12141D] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden z-10"
            >
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#181B27]/80">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#D4AF37] stroke-[2.5]" />
                    <span>CREATE NEW SQUAD</span>
                  </h3>
                  <p className="text-xs font-semibold text-zinc-400 mt-0.5">
                    Organize your players into a dedicated team squad.
                  </p>
                </div>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTeam} className="p-5 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-zinc-300 tracking-wider mb-1.5">
                    Squad Name <span className="text-[#D4AF37]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Senior Academy XI / U-19 Squad"
                    className="w-full bg-[#0E1017] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-zinc-300 tracking-wider mb-1.5">
                    Description <span className="text-zinc-500 font-medium">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    placeholder="e.g. Primary squad for 2026 regional championship preparation"
                    className="w-full bg-[#0E1017] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold cursor-pointer"
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    disabled={isCreating || !createName.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F5BA4E] to-[#D4AF37] hover:from-[#F8C868] disabled:opacity-50 text-[#090A0E] text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#D4AF37]/20"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>CREATING...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>CREATE TEAM</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
