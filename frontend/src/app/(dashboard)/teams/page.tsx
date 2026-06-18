"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Users, Plus, Loader2 } from "lucide-react";

interface Team {
  id: number;
  name: string;
  level: string;
  teamCpiScore: number;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", level: "" });

  const fetchTeams = async () => {
    try {
      const res = await api.get("/teams");
      setTeams(res.data);
    } catch (error) {
      console.error("Failed to fetch teams", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/teams", newTeam);
      setShowCreate(false);
      setNewTeam({ name: "", level: "" });
      fetchTeams();
    } catch (error) {
      console.error("Failed to create team", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams Management</h1>
          <p className="text-zinc-400 mt-1">Create, view, and manage your cricket squads.</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-medium hover:bg-zinc-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showCreate ? "Cancel" : "New Team"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-8">
          <h3 className="text-lg font-medium mb-4">Create New Team</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Team Name</label>
              <input 
                type="text" 
                required
                value={newTeam.name}
                onChange={e => setNewTeam({...newTeam, name: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-orange-500 outline-none" 
                placeholder="E.g. Under 19s"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Level/Age Group</label>
              <input 
                type="text" 
                required
                value={newTeam.level}
                onChange={e => setNewTeam({...newTeam, level: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-orange-500 outline-none" 
                placeholder="E.g. U19, Senior"
              />
            </div>
            <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-2.5 font-medium transition-colors">
              Save Team
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
      ) : teams.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center">
          <h3 className="text-xl font-medium mb-2">No Teams Found</h3>
          <p className="text-zinc-400 mb-6">You haven't created any teams yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {teams.map(team => (
            <div key={team.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold">{team.name}</h3>
              <p className="text-zinc-400 text-sm mb-4">{team.level}</p>
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <span className="text-sm text-zinc-400">CPI Score</span>
                <span className="font-bold text-orange-500">{team.teamCpiScore.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
