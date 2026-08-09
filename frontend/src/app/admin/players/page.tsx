"use client";

import React, { useState, useEffect } from "react";
import { UserCheck, Search, Filter, CheckCircle2, Eye, Award } from "lucide-react";
import { useAdminToast } from "../layout";

interface GlobalPlayerItem {
  id: number;
  name: string;
  organization: string;
  coachName: string;
  cpi: string;
  ppi: string;
  mpi: string;
  lastAssessment: string;
  status: string;
}

const DEFAULT_GLOBAL_PLAYERS: GlobalPlayerItem[] = [
  { id: 1, name: "Player A", organization: "CPI Cricket Academy", coachName: "Daryll Cullinan", cpi: "8.4 / 10", ppi: "8.1 / 10", mpi: "8.7 / 10", lastAssessment: "2 days ago", status: "Active" },
  { id: 2, name: "Rohan Sharma", organization: "CPI Cricket Academy", coachName: "Gowtham SK", cpi: "7.9 / 10", ppi: "8.0 / 10", mpi: "7.8 / 10", lastAssessment: "1 day ago", status: "Active" }
];

export default function AdminGlobalPlayersPage() {
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<GlobalPlayerItem[]>(DEFAULT_GLOBAL_PLAYERS);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token");
      const res = await fetch("/api/admin/players", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPlayers(data);
        }
      }
    } catch (err) {
      console.error("Error fetching global players", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.coachName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Global Player Directory Overview</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Platform-Wide Player Index
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global high-level overview of all player profiles, assigned coaches, academies, and normalized CPI index scores.
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by player name, coach, or organization..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Player Name</th>
                <th className="px-5 py-3.5">Organization</th>
                <th className="px-5 py-3.5">Assigned Coach</th>
                <th className="px-5 py-3.5">Overall CPI</th>
                <th className="px-5 py-3.5">Practice PPI</th>
                <th className="px-5 py-3.5">Match MPI</th>
                <th className="px-5 py-3.5">Last Assessment</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPlayers.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-black text-xs">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900">{p.name}</p>
                        <p className="text-[10px] text-slate-400">ID: PLR-00{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-800 font-bold">{p.organization}</td>
                  <td className="px-5 py-4 text-slate-600 font-semibold">{p.coachName}</td>
                  <td className="px-5 py-4 font-black text-orange-600 bg-orange-50/50 rounded-lg">{p.cpi}</td>
                  <td className="px-5 py-4 font-black text-slate-900">{p.ppi}</td>
                  <td className="px-5 py-4 font-black text-slate-900">{p.mpi}</td>
                  <td className="px-5 py-4 text-slate-500">{p.lastAssessment}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => showToast(`Global player metric record viewed for ${p.name}`, "info")}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" /> View Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
