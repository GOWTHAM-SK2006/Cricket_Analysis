"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { UserSquare2, Plus, Loader2 } from "lucide-react";

interface Team { id: number; name: string; }
interface Player {
  id: number;
  name: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  ppiScore: number;
  mpiScore: number;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: "", role: "Batsman", battingStyle: "Right-hand", bowlingStyle: "Right-arm Fast", teamId: "" });

  const fetchData = async () => {
    try {
      const [playersRes, teamsRes] = await Promise.all([
        api.get("/players"),
        api.get("/teams")
      ]);
      setPlayers(playersRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/players", newPlayer);
      setShowCreate(false);
      setNewPlayer({ name: "", role: "Batsman", battingStyle: "Right-hand", bowlingStyle: "Right-arm Fast", teamId: "" });
      fetchData();
    } catch (error) {
      console.error("Failed to create player", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Player Roster</h1>
          <p className="text-zinc-400 mt-1">Manage individual players and view their performance indexes.</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          disabled={teams.length === 0}
          className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {showCreate ? "Cancel" : "Add Player"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-8">
          <h3 className="text-lg font-medium mb-4">Add New Player</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Select Team</label>
              <select required value={newPlayer.teamId} onChange={e => setNewPlayer({...newPlayer, teamId: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-orange-500 outline-none">
                <option value="">Choose...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name</label>
              <input type="text" required value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-orange-500 outline-none" placeholder="John Doe"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Role</label>
              <select value={newPlayer.role} onChange={e => setNewPlayer({...newPlayer, role: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-orange-500 outline-none">
                <option>Batsman</option>
                <option>Bowler</option>
                <option>All-rounder</option>
                <option>Wicketkeeper</option>
              </select>
            </div>
            <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-2.5 font-medium transition-colors">
              Save Player
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
      ) : players.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center">
          <h3 className="text-xl font-medium mb-2">No Players Found</h3>
          <p className="text-zinc-400 mb-6">You haven't added any players to your teams yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {players.map(player => (
            <div key={player.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <UserSquare2 className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{player.name}</h3>
                  <p className="text-sm text-zinc-400">{player.role} • {player.battingStyle}</p>
                </div>
              </div>
              <div className="flex gap-8 text-center">
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">PPI</p>
                  <p className="font-bold text-orange-500">{player.ppiScore.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">MPI</p>
                  <p className="font-bold text-emerald-400">{player.mpiScore.toFixed(1)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
