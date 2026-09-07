"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Users2, Plus, Loader2, UserPlus, Trash2, Search,
  Edit2, Check, X, Shield, Sparkles, User, AlertCircle
} from "lucide-react";
import CricketLoader from "@/components/CricketLoader";

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

const formatScore = (val: number | null | undefined) => {
  if (val === null || val === undefined || val === 0) return "N/A";
  let num = typeof val === "number" ? val : parseFloat(val as any);
  if (isNaN(num) || num <= 0) return "N/A";
  return num <= 10 ? Math.round(num * 10) : Math.round(num);
};

export default function TeamPage() {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [mySquad, setMySquad] = useState<Player[]>([]);
  
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

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const [teamRes, squadRes] = await Promise.all([
        api.get("/teams/my-team").catch(() => ({ data: null })),
        api.get("/players").catch(() => ({ data: [] }))
      ]);

      if (teamRes.data && teamRes.data.id) {
        setTeam(teamRes.data);
        setEditName(teamRes.data.name || "");
        setEditDesc(teamRes.data.description || "");
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
      setCreateName("");
      setCreateDesc("");
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

  const togglePlayerSelection = (id: number) => {
    setSelectedPlayerIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  if (loading) {
    return <CricketLoader fullScreen message="Loading Team..." subtext="Cricket Performance Index" />;
  }

  // Calculate Team Performance Averages if players exist
  const squad = team?.players || [];
  const validPpi = squad.map(p => formatScore(p.ppiScore)).filter(s => s !== "N/A").map(s => Number(s));
  const validMpi = squad.map(p => formatScore(p.mpiScore)).filter(s => s !== "N/A").map(s => Number(s));

  const avgPpi = validPpi.length > 0 ? Math.round(validPpi.reduce((a, b) => a + b, 0) / validPpi.length) : "N/A";
  const avgMpi = validMpi.length > 0 ? Math.round(validMpi.reduce((a, b) => a + b, 0) / validMpi.length) : "N/A";

  const teamCpi = (typeof avgPpi === "number" && typeof avgMpi === "number")
    ? Math.round((avgPpi + avgMpi) / 2)
    : (typeof avgPpi === "number" ? avgPpi : (typeof avgMpi === "number" ? avgMpi : "N/A"));

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Users2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                  COACH DASHBOARD
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mt-1 uppercase">
                {team ? team.name : "TEAM MANAGEMENT"}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* STATE 1: CREATE YOUR TEAM (If coach has no team) */}
      {!team && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="text-center max-w-lg mx-auto space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-orange-100 border border-orange-200 text-orange-600 mx-auto flex items-center justify-center shadow-inner">
              <Shield className="w-8 h-8 stroke-[2]" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              CREATE YOUR TEAM
            </h2>
            <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
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
        <div className="space-y-6">
          {/* Team Details Header Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-wider text-orange-600 uppercase bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200">
                    ACTIVE TEAM
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    Created {new Date(team.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
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
                  EDIT DETAILS
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

            {/* Team Quick Snapshot Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">SQUAD SIZE</span>
                <span className="text-xl font-black text-slate-900">{squad.length} Players</span>
              </div>
              <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider block">TEAM CPI</span>
                <span className="text-xl font-black text-orange-600">{teamCpi}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">AVG PPI</span>
                <span className="text-xl font-black text-slate-800">{avgPpi}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">AVG MPI</span>
                <span className="text-xl font-black text-slate-800">{avgMpi}</span>
              </div>
            </div>
          </div>

          {/* TEAM SQUAD SECTION */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
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
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl py-2.5 px-4 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>+ ADD PLAYERS</span>
              </button>
            </div>

            {/* SQUAD PLAYER CARDS */}
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
                  ADD PLAYERS NOW
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {squad.map((player) => {
                  const ppiDisplay = formatScore(player.ppiScore);
                  const mpiDisplay = formatScore(player.mpiScore);

                  return (
                    <div
                      key={player.id}
                      className="bg-white border border-slate-200 hover:border-orange-300 rounded-2xl p-4 transition-all hover:shadow-md space-y-3 relative group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-black text-lg uppercase shrink-0 overflow-hidden shadow-sm">
                          {player.imageUrl ? (
                            <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            player.name.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-sm text-slate-900 truncate uppercase tracking-tight">
                            {player.name}
                          </h4>
                          <span className="inline-block mt-0.5 text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            {player.role || "Player"}
                          </span>
                          {(player.battingStyle || player.bowlingStyle) && (
                            <p className="text-[10px] font-semibold text-slate-400 truncate mt-1">
                              {[player.battingStyle, player.bowlingStyle].filter(Boolean).join(" • ")}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          disabled={removingPlayerId === player.id}
                          title="Remove player from team"
                          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          {removingPlayerId === player.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-4 h-4 stroke-[2]" />
                          )}
                        </button>
                      </div>

                      {/* Performance Scores Row */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <div className="bg-slate-50 rounded-xl p-2 text-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">PPI SCORE</span>
                          <span className="text-xs font-black text-slate-800">{ppiDisplay}</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2 text-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">MPI SCORE</span>
                          <span className="text-xs font-black text-slate-800">{mpiDisplay}</span>
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

      {/* MODAL: ADD PLAYERS TO TEAM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-orange-600 stroke-[2.5]" />
                  ADD PLAYERS TO TEAM
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Select players from your existing squad to add to {team?.name}.
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search Filter */}
            <div className="p-4 border-b border-slate-100 bg-white">
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
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
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
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-black text-sm uppercase shrink-0 overflow-hidden">
                            {player.imageUrl ? (
                              <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              player.name.charAt(0).toUpperCase()
                            )}
                          </div>

                          <div>
                            <h5 className="font-black text-xs text-slate-900 uppercase tracking-tight">
                              {player.name}
                            </h5>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">
                              {player.role || "Player"}
                            </span>
                          </div>
                        </div>

                        {isAlreadyInTeam ? (
                          <span className="text-[10px] font-black text-slate-500 bg-slate-200 px-2 py-1 rounded-md uppercase">
                            IN TEAM
                          </span>
                        ) : (
                          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
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
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-black text-slate-600">
                {selectedPlayerIds.length} Selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
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
                      ADDING...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      ADD PLAYERS
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
