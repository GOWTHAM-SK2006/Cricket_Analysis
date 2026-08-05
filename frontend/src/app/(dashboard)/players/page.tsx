"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Search, Plus, Loader2, ArrowLeft, Clipboard, ShieldCheck, 
  Sparkles, ListCollapse, Award, Flame, Heart, Brain, X, Camera, CheckCircle2,
  Filter, Check, Copy, Target, Edit2, TrendingUp, ChevronDown
} from "lucide-react";
import PerformanceTrendChart from "@/components/PerformanceTrendChart";

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
}

const formatScoreValue = (val: number | null | undefined) => {
  if (val === null || val === undefined || val === 0) return "N/A";
  if (val <= 10) {
    return Math.round(val * 10).toString();
  }
  return Math.round(val).toString();
};

export default function PlayersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [role, setRole] = useState<string | null>(null);

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
  const [showRecsOverlay, setShowRecsOverlay] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Filter States
  const [showFilterOverlay, setShowFilterOverlay] = useState(false);
  const [sortBy, setSortBy] = useState<"highest_cpi" | "lowest_cpi" | "highest_ppi" | "lowest_ppi" | "highest_mpi" | "lowest_mpi" | "recently_assessed">("highest_cpi");
  const [quickFilter, setQuickFilter] = useState<"all" | "top_performers" | "needs_attention" | "assessed_today" | "not_assessed_recently">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "batsman" | "bowler" | "all_rounder" | "wicket_keeper">("all");
  const [copiedCode, setCopiedCode] = useState(false);
  const [expandedFocus, setExpandedFocus] = useState<number | null>(null);

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
      const val = storedTarget ? parseInt(storedTarget, 10) : 85;
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
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

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
    const ppi = p.ppiScore && p.ppiScore > 0 ? p.ppiScore : null;
    const mpi = p.mpiScore && p.mpiScore > 0 ? p.mpiScore : null;
    const cpi = ppi && mpi 
      ? (ppi + mpi) / 2 
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
                  className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4 text-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "SAVE PLAYER"}
                </button>
              </form>
            </div>
          )}

          {/* Player Cards list */}
          {loading ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-zinc-500 font-bold uppercase tracking-wider text-xs">Loading Squad...</p>
            </div>
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
                        <p className="text-sm font-semibold text-zinc-400 uppercase tracking-tight">Last: {assessDate}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-zinc-500 tracking-widest uppercase">{scoreLabel}</div>
                      <div className="text-2xl font-bold text-orange-500 tracking-tight">{scoreDisplay}</div>
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
        <div className="flex flex-col items-center py-40 gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-zinc-500 font-bold uppercase tracking-wider text-xs">Loading Profile...</p>
        </div>
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

        // Comprehensive coaching recommendation map from Coach's Plan of Action
        const coachingRecommendations: Record<string, { title: string; detail: string }> = {
          "Technical Execution": {
            title: "Strengthen Technical Execution Under Pressure",
            detail: "This player's technical execution needs targeted improvement. The issue may not be a lack of ability — the skill may exist in practice but is not yet stable enough to survive match pressure. Begin by separating outcome from method: identify whether the player executed poorly or produced a poor result despite sound technique. Focus on finding the recurring fault rather than reacting to every individual mistake. Design future practice sessions that reproduce the type of delivery, bowler, match situation and pitch conditions that exposed the weakness. Provide one clear technical correction the player can understand and apply immediately. Use controlled drop-feed and throw-down drills to isolate correct bat-face angle, contact point and timing. Monitor consistency across 20+ repetitions before increasing pace or adding competitive pressure. The goal is not technical perfection — it is a technique the player can trust and execute when the match demands it."
          },
          "Skills Level": {
            title: "Develop Core Skill Level & Match Readiness",
            detail: "The player's overall skill level requires focused development to meet competitive demands. Start by protecting what already works — do not make unnecessary technical changes after a strong drill or isolated success. Instead, increase the challenge by testing the player's skills under greater speed, fatigue, match pressure and unpredictability. Develop the player's self-awareness by asking them to explain why their method works and what they feel when performing well. Monitor whether the same quality transfers from practice to competitive situations. Where skills are lacking, prioritise one correction at a time with a clear coaching cue. Simplify drills by reducing speed or complexity until the movement is performed correctly, then rebuild through quality repetition. Progress gradually from controlled environments to realistic, pressure-based practice that mirrors match scenarios the player will face."
          },
          "Intensity": {
            title: "Elevate Practice & Match Intensity",
            detail: "This player's intensity levels suggest they are not yet bringing the competitive energy and purpose required to improve and perform under pressure. First identify the root cause — whether the low intensity stems from fatigue, poor health, low confidence, boredom, unclear expectations or a lack of motivation. Clarify exactly what good intensity looks like in movement, effort, communication and response between repetitions. Create short, measurable targets within sessions that give the player an immediate purpose and something to compete against. Use competitive drills with clear roles and regular feedback to keep the player mentally and physically engaged. Channel energy into controlled, purposeful effort rather than rushed or reckless activity. Monitor sustainability — the player must maintain intensity throughout the session without burning out or losing discipline. The goal is the right intensity, for the right task, maintained for the right length of time."
          },
          "Concentration": {
            title: "Build Sustained Concentration & Mental Presence",
            detail: "The player's concentration score indicates difficulty remaining mentally present and connected to the task throughout sessions and matches. Start by identifying the root cause — whether the lapses come from fatigue, boredom, anxiety, unclear instructions, external distractions or poor mental habits. Shorten the focus period by breaking sessions into smaller tasks with one clear objective and an immediate review point. Teach a simple reset routine the player can use after every attempt, mistake or interruption: step away, breathe, refocus on the next ball. Increase active involvement through questions, targets and specific responsibilities to prevent passive participation. Track the pattern of when concentration drops, what triggers it and how quickly the player reconnects. Introduce changing targets, tactical problems and match-related decisions that demand sustained awareness. The goal is not uninterrupted concentration — it is the ability to recognise when focus has drifted, reset quickly and return attention to the next important action."
          },
          "Decision Making": {
            title: "Sharpen In-Game Decision Making",
            detail: "This player needs to improve their ability to make effective decisions under the pressure and time constraints of competitive cricket. Poor decision making may stem from unclear role understanding, limited game awareness, technical uncertainty or anxiety about consequences. Begin by clarifying the player's role in specific match situations — what decisions they should be making, when, and based on what information. Use scenario-based training that places the player in realistic situations requiring quick judgement: changing required rates, field adjustments, bowling plan shifts and batting partnerships under pressure. Encourage the player to verbalise their thinking process — 'What did you see? What options did you consider? Why did you choose that response?' Develop forward thinking by practising anticipation of the next delivery, possible field change or tactical adjustment. Provide immediate, specific feedback after each decision rather than waiting until the end of a session. The goal is confident, clear decision making grounded in match awareness and role clarity."
          },
          "Preparation": {
            title: "Establish Consistent Pre-Match & Pre-Session Preparation",
            detail: "This player's preparation habits are limiting their ability to arrive ready to compete and perform from the first ball. Identify whether the weakness lies in poor organisation, unclear expectations, tiredness, lack of support, low motivation or simple forgetfulness. Set clear standards for what the player must complete and understand before arriving at the ground and before play begins. Create a simple, repeatable preparation checklist covering equipment, clothing, nutrition, hydration, warm-up routine, personal role clarity and key match information. Rehearse match-day routines during practice sessions so they become familiar and automatic. Build accountability gradually — assign age-appropriate responsibility rather than allowing others to prepare everything for the player. Connect preparation directly to performance outcomes by reviewing how poor preparation affected confidence, concentration and early involvement. Develop match-day habits that can be repeated before every match, trial or important performance regardless of the occasion. The goal is not simply to arrive at the ground — it is to arrive ready physically, mentally and practically to make the session count."
          },
          "Game Awareness": {
            title: "Develop Tactical Game Awareness & Match Reading",
            detail: "This player is not yet reading the wider match context effectively — they may be so focused on their own individual performance that they stop tracking the score, opposition plans, field changes and shifting momentum. Begin by identifying what the player consistently misses during matches and clarify which details matter most at different stages of the game. Use simple awareness questions regularly during practice: 'What's happening?', 'What might happen next?' and 'What does your role require right now?' Recreate match situations through scenario-based games that require players to respond to changing scores, conditions and tactical demands in real time. Review specific moments where the player became disconnected from the contest and discuss what information could have helped them respond differently. Develop forward thinking by encouraging anticipation of the next delivery, possible field change, bowling adjustment or batting response. The goal is not simply to watch the game — it is to recognise what is changing, understand what it means and respond before the opportunity has passed."
          },
          "Adaptability": {
            title: "Build Adaptability & Response to Changing Conditions",
            detail: "This player struggles to adjust when conditions, instructions, roles or challenges change during play. The resistance may stem from confusion, anxiety, technical limitation, rigid thinking or fear of making mistakes. Start by explaining what has changed before asking the player to adjust their response — clarity reduces anxiety. Offer two or three practical solutions rather than overwhelming them with instructions. Introduce small, controlled variations gradually before progressing to more unpredictable and demanding scenarios. After each adaptation challenge, review what the player noticed, what they tried and what they would do differently next time. Develop independent thinking by asking the player what adjustment is required and why they have chosen a particular response. Test decision-making under pressure by introducing time limits, changing targets and competitive consequences. Protect the fundamentals throughout — ensure the player adapts without abandoning the technical and tactical basics that support reliable performance. The goal is not to change for the sake of change — it is to recognise what the situation demands and make the smallest effective adjustment."
          },
          "Discipline": {
            title: "Strengthen Discipline & Behavioural Standards",
            detail: "This player's discipline score suggests difficulty following instructions, maintaining standards and controlling behaviour consistently. Identify whether the cause is unclear expectations, boredom, frustration, immaturity, poor habits or problems outside cricket. Clarify exactly what acceptable behaviour looks like in practice and matches — punctuality, effort, self-control and respect for the environment. Set fair, consistent, age-appropriate consequences that correct behaviour without humiliating the player. Give the player ownership by asking them to reflect on the behaviour, its effect on teammates and what they will do differently. Monitor patterns to identify the situations, people or emotions that trigger poor discipline. Build responsibility gradually through leadership tasks, personal targets and greater ownership of their own development. Protect independent thinking — ensure discipline does not become fear, silence or an unwillingness to question and learn. The goal is not a player who behaves only when watched — it is a player who chooses the right standard because they understand its value to themselves and the team."
          },
          "Teamwork": {
            title: "Improve Team Contribution & Collaborative Play",
            detail: "This player is not yet contributing effectively to the collective performance of the team. The cause may be excessive focus on personal performance, unclear role understanding, frustration with teammates or lacking confidence. Clarify what effective teamwork looks like in partnerships, communication, fielding support and response to mistakes. Assign specific responsibilities such as communicating between overs with a partner, supporting a bowler during a difficult spell or maintaining fielding energy during quiet periods. Address any negative behaviour directly — challenge blaming, poor body language, selfish decision making or withdrawal from the contest. Help the player understand how their behaviour affects teammates, momentum and the team's ability to compete collectively. Encourage specific, useful match communication about the pitch, field changes, scoring options and bowling plans rather than empty noise. Build visible leadership through urgency in the field, positive body language, backing up every throw and encouraging composure under pressure. The goal is not simply to play in a team — it is to understand your role, support others and contribute to something greater than your own performance."
          },
          "Coachability": {
            title: "Enhance Coachability & Openness to Feedback",
            detail: "This player shows resistance to coaching feedback, which may stem from confusion, embarrassment, defensiveness, fear of failure or insufficient trust in the coaching relationship. Improve the delivery of feedback by making it clear, specific, age-appropriate and focused on behaviour or performance rather than personality. Limit instruction to one useful correction at a time and allow enough opportunity for the player to apply it before adding more. Invite participation by asking the player what they noticed, what they think went wrong and what solution they would try — this builds ownership of the learning process. Build trust gradually by recognising effort, improvement and honest questions so the player feels safe enough to learn from mistakes without fear of judgement. Deepen conversations by asking what the player understood, what they felt and how they intend to apply feedback in the next session. The goal is not a player who silently accepts every instruction — it is a player who listens carefully, thinks critically and turns useful feedback into meaningful improvement."
          },
          "Work Ethic": {
            title: "Develop Consistent Work Ethic & Competitive Drive",
            detail: "This player's work ethic needs strengthening to meet the demands of sustained improvement and competitive performance. Identify whether the issue stems from low motivation, unclear goals, fatigue, lack of purpose or insufficient challenge in training. Set clear, measurable expectations for effort, communication and involvement in every session — not just when the player feels motivated. Create short-term targets that provide immediate purpose and connect daily effort to longer-term development goals. Use competitive drills with clear consequences to build the habit of sustained application under pressure. Monitor whether the player's effort remains consistent across the full session, not just during drills they enjoy or when receiving individual attention. Encourage the player to take ownership of their development by setting personal goals, tracking their own progress and arriving at sessions with a clear plan of what they want to improve. Build accountability by reviewing effort patterns honestly and connecting work habits directly to match performance outcomes. The goal is a player who competes with purpose, maintains standards without supervision and understands that consistent work ethic is the foundation of all meaningful improvement."
          },
          "Emotional Control": {
            title: "Develop Emotional Regulation & Composure",
            detail: "This player struggles to manage frustration, excitement, anxiety or disappointment during competitive play, which directly impacts their decision making and execution. Begin by identifying the specific triggers — whether the player reacts most strongly to mistakes, dismissal, dropped chances, poor deliveries, criticism, sledging or umpiring decisions. Teach a simple reset response: step away from the crease or mark, take a controlled breath, name the emotion internally and refocus attention on the next ball. Set clear behavioural boundaries — anger, dissent, blaming teammates and damaging equipment are unacceptable responses regardless of the situation. Review incidents privately, focusing on the behaviour, its impact on the team and a better response next time. Practise pressure deliberately by recreating difficult scenarios so the player can rehearse remaining calm and making effective decisions under emotional load. Do not label the player as emotional or difficult — young cricketers often need structured support to understand what they feel and how to respond constructively. The goal is not to remove emotion from cricket — it is to ensure that emotion provides energy without taking away judgement, discipline or control."
          }
        };

        // Dynamically generate focus areas from weakest metrics
        let focusAreas: { title: string; detail: string }[] = [];

        if (Object.keys(metricSums).length > 0) {
          // Sort metrics by average ascending (weakest first)
          const sortedMetrics = Object.entries(metricSums)
            .map(([name, data]) => ({ name, avg: data.sum / data.count }))
            .sort((a, b) => a.avg - b.avg);

          // Pick the 3 weakest metrics that have coaching recommendations
          const weakest3 = sortedMetrics
            .filter(m => coachingRecommendations[m.name])
            .slice(0, 3);

          focusAreas = weakest3.map(m => ({
            title: `${coachingRecommendations[m.name].title} (Avg: ${m.avg.toFixed(1)}/10)`,
            detail: coachingRecommendations[m.name].detail
          }));
        }

        // Fallback if no assessment data exists — use role-based defaults
        if (focusAreas.length === 0) {
          const playerRole = selectedPlayer.role ? selectedPlayer.role.toLowerCase() : "";
          if (playerRole.includes("bowler")) {
            focusAreas = [
              coachingRecommendations["Technical Execution"],
              coachingRecommendations["Concentration"],
              coachingRecommendations["Adaptability"]
            ];
          } else if (playerRole.includes("batsman") || playerRole.includes("batter")) {
            focusAreas = [
              coachingRecommendations["Technical Execution"],
              coachingRecommendations["Decision Making"],
              coachingRecommendations["Concentration"]
            ];
          } else if (playerRole.includes("all-rounder") || playerRole.includes("all rounder")) {
            focusAreas = [
              coachingRecommendations["Game Awareness"],
              coachingRecommendations["Adaptability"],
              coachingRecommendations["Intensity"]
            ];
          } else if (playerRole.includes("wicketkeeper") || playerRole.includes("keeper")) {
            focusAreas = [
              coachingRecommendations["Concentration"],
              coachingRecommendations["Preparation"],
              coachingRecommendations["Discipline"]
            ];
          } else {
            focusAreas = [
              coachingRecommendations["Technical Execution"],
              coachingRecommendations["Concentration"],
              coachingRecommendations["Preparation"]
            ];
          }
        }

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

        const formatScoreValue = (val: number | null | undefined) => {
          if (val === null || val === undefined) return "N/A";
          if (val <= 10) {
            return Math.round(val * 10).toString();
          }
          return Math.round(val).toString();
        };

        const currentPpi = selectedPlayer.ppiScore && selectedPlayer.ppiScore > 0 ? selectedPlayer.ppiScore : null;
        const currentMpi = selectedPlayer.mpiScore && selectedPlayer.mpiScore > 0 ? selectedPlayer.mpiScore : null;
        const currentCpi = currentPpi && currentMpi 
          ? (currentPpi + currentMpi) / 2 
          : currentPpi 
            ? currentPpi 
            : currentMpi 
              ? currentMpi 
              : null;

        // Compute Trend data
        const last5Prac = [...practiceHistory]
          .sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime())
          .slice(-5);

        const last5Match = [...matchHistory]
          .sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime())
          .slice(-5);

        const cpiVal = currentCpi ? parseInt(formatScoreValue(currentCpi), 10) : 0;
        const gapVal = targetCpi - cpiVal;
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
            {/* Back Header */}
            {role !== "player" && (
              <div className="flex items-center gap-3 text-left">
                <button
                  onClick={() => { setView("list"); router.replace("/players"); }}
                  className="h-11 px-4 bg-white bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center gap-2 text-zinc-400 font-bold uppercase text-xs hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[3]" />
                  BACK TO LIST
                </button>
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
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5.5 space-y-4 text-left">
              <div className="flex flex-col gap-0.5 border-b border-slate-200 pb-2">
                <span className="text-sm font-bold text-orange-500 uppercase tracking-widest">QUESTION 1</span>
                <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  CURRENT STATUS
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center pt-1">
                <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
                    Current CPI
                  </p>
                  <p className="text-3xl font-bold text-orange-400 font-mono leading-none">
                    {formatScoreValue(currentCpi)}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-xs font-bold text-zinc-550 uppercase tracking-wider mb-1">
                    Current PPI
                  </p>
                  <p className="text-3xl font-bold text-slate-900 font-mono leading-none">
                    {formatScoreValue(currentPpi)}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-xs font-bold text-zinc-550 uppercase tracking-wider mb-1">
                    Current MPI
                  </p>
                  <p className="text-3xl font-bold text-slate-900 font-mono leading-none">
                    {formatScoreValue(currentMpi)}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 3 – PROGRESS */}
            <div className="bg-white bg-white border border-slate-200 rounded-3xl p-5.5 space-y-4 text-left">
              <div className="flex flex-col gap-0.5 border-b border-slate-200 pb-2">
                <span className="text-sm font-bold text-orange-500 uppercase tracking-widest">QUESTION 2</span>
                <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  PROGRESS
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Last 5 Practice */}
                <div className="space-y-2">
                  <span className="text-sm font-bold text-zinc-550 uppercase tracking-widest block border-b border-slate-200 pb-1">
                    Last 5 Practice Assessments
                  </span>
                  {last5Prac.length === 0 ? (
                    <span className="text-xs text-zinc-650 font-bold uppercase block py-2">No Practice Data</span>
                  ) : (
                    <div className="space-y-2">
                      {last5Prac.map((p, idx) => {
                        const prevScore = idx > 0 ? last5Prac[idx - 1].ppiScore : null;
                        const currentScore = p.ppiScore;
                        return (
                          <div key={p.id || idx} className="flex justify-between items-center text-xs font-bold bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200">
                            <span className="text-zinc-400 uppercase">
                              {new Date(p.date || p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                {formatScoreValue(currentScore)}
                              </span>
                              {prevScore !== null && currentScore !== null && (
                                currentScore > prevScore ? (
                                  <span className="text-green-500 font-extrabold text-xs">↑</span>
                                ) : currentScore < prevScore ? (
                                  <span className="text-red-500 font-extrabold text-xs">↓</span>
                                ) : (
                                  <span className="text-zinc-650 font-bold text-xs">•</span>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Last 5 Match */}
                <div className="space-y-2">
                  <span className="text-sm font-bold text-zinc-550 uppercase tracking-widest block border-b border-slate-200 pb-1">
                    Last 5 Match Assessments
                  </span>
                  {last5Match.length === 0 ? (
                    <span className="text-xs text-zinc-655 font-bold uppercase block py-2">No Match Data</span>
                  ) : (
                    <div className="space-y-2">
                      {last5Match.map((m, idx) => {
                        const prevScore = idx > 0 ? last5Match[idx - 1].mpiScore : null;
                        const currentScore = m.mpiScore;
                        return (
                          <div key={m.id || idx} className="flex justify-between items-center text-xs font-bold bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200">
                            <span className="text-zinc-400 uppercase">
                              {new Date(m.date || m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                {formatScoreValue(currentScore)}
                              </span>
                              {prevScore !== null && currentScore !== null && (
                                currentScore > prevScore ? (
                                  <span className="text-green-500 font-extrabold text-xs">↑</span>
                                ) : currentScore < prevScore ? (
                                  <span className="text-red-500 font-extrabold text-xs">↓</span>
                                ) : (
                                  <span className="text-zinc-650 font-bold text-xs">•</span>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 4 – TARGETS (WHERE DO I WANT TO BE?) */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5.5 space-y-4 text-left">
              <div className="flex flex-col gap-0.5 border-b border-slate-200 pb-2">
                <span className="text-sm font-bold text-orange-500 uppercase tracking-widest">QUESTION 3</span>
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
                        className="bg-white border-2 border-slate-200 rounded-xl px-2 py-1.5 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        {[70, 75, 80, 85, 90, 95, 100].map((v) => (
                          <option key={v} value={v}>{v}</option>
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
                      <span className="text-xl font-bold text-orange-500 font-mono">{targetCpi}</span>
                      <Edit2 className="w-3.5 h-3.5 text-zinc-500 group-hover:text-orange-500 transition-colors" />
                    </div>
                  )}
                </div>

                {/* Progress Bar toward Target */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm font-bold text-zinc-500 uppercase tracking-wider px-1">
                    <span>Progress to Target</span>
                    <span className="font-mono text-orange-500">{targetPercent}%</span>
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
              <div className="flex flex-col gap-0.5 border-b border-slate-200 pb-2">
                <span className="text-sm font-bold text-orange-500 uppercase tracking-widest">QUESTION 4</span>
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
                      <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-2">
                        <p className="text-[11px] font-semibold text-zinc-400 leading-[1.7] whitespace-pre-line">
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
              <h3 className="text-xs font-bold tracking-widest text-zinc-400 uppercase border-b border-slate-200 pb-2 flex items-center gap-2">
                <Brain className="w-4 h-4 text-orange-500" />
                ASSESSMENT HISTORY
              </h3>
              
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
                        <div key={p.id || idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">Practice Assessment</span>
                            <span className="text-xs text-zinc-550">{new Date(p.date || p.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span className="font-bold text-orange-500 font-mono text-sm">PPI {formatScoreValue(p.ppiScore)}</span>
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
                        <div key={m.id || idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">Match Assessment</span>
                            <span className="text-xs text-zinc-550">{new Date(m.date || m.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span className="font-bold text-orange-500 font-mono text-sm">MPI {formatScoreValue(m.mpiScore)}</span>
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
              { label: "TECHNICAL EXECUTION", key: "technicalExecution", desc: "Technique, mechanics, and physical execution" },
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
              className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4.5 text-xl font-bold transition-all flex items-center justify-center cursor-pointer border-2 border-white shadow-xl active:scale-98"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : "SAVE ASSESSMENT"}
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
              { label: "TECHNICAL EXECUTION", key: "technicalExecution", desc: "Fundamentals under pressure and match execution" },
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
              className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4.5 text-xl font-bold transition-all flex items-center justify-center cursor-pointer border-2 border-white shadow-xl active:scale-98"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : "SAVE ASSESSMENT"}
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
              className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4.5 text-xl font-bold transition-all flex items-center justify-center cursor-pointer border-2 border-white shadow-xl active:scale-98"
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
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center">
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
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center">
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

    </div>
  );
}
