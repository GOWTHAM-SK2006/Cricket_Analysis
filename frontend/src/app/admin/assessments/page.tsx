"use client";

import React, { useState, useEffect } from "react";
import { ClipboardList, Search, Filter, CheckCircle2, Eye, ShieldCheck, Clipboard } from "lucide-react";
import { useAdminToast } from "../layout";

interface AssessmentLogItem {
  id: number;
  player: string;
  type: "Practice" | "Match";
  coach: string;
  score: string;
  date: string;
}

const DEFAULT_ASSESSMENTS: AssessmentLogItem[] = [];

export default function AdminAssessmentsPage() {
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AssessmentLogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Practice" | "Match">("All");

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token");
      const res = await fetch("/api/admin/assessments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.recentLogs && Array.isArray(data.recentLogs)) {
          const mapped = data.recentLogs.map((item: any) => ({
            id: item.id,
            player: item.player,
            type: item.type,
            coach: item.coach,
            score: item.cpi,
            date: item.date
          }));
          setLogs(mapped);
        }
      }
    } catch (err) {
      console.error("Error fetching assessment logs", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.player.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.coach.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "All" || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Platform Assessment Log Overview</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
              Practice & Match Evaluation Stream
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global audit stream of all practice grades and match assessments submitted by coaches.
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
            placeholder="Search by player or coach name..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          {(["All", "Practice", "Match"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3.5 py-1 rounded-lg transition-all ${
                typeFilter === t ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Log ID</th>
                <th className="px-5 py-3.5">Player</th>
                <th className="px-5 py-3.5">Assessment Type</th>
                <th className="px-5 py-3.5">Submitting Coach</th>
                <th className="px-5 py-3.5">Assessed Score</th>
                <th className="px-5 py-3.5">Log Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-slate-400">#LOG-{log.id}</td>
                  <td className="px-5 py-4 font-extrabold text-slate-900">{log.player}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        log.type === "Practice"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-indigo-50 text-indigo-800 border-indigo-200"
                      }`}
                    >
                      {log.type === "Practice" ? <Clipboard className="w-3 h-3 text-amber-600" /> : <ShieldCheck className="w-3 h-3 text-indigo-600" />}
                      {log.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-800 font-semibold">{log.coach}</td>
                  <td className="px-5 py-4 font-black text-orange-600 bg-orange-50/50 rounded-lg">{log.score}</td>
                  <td className="px-5 py-4 text-slate-500">{log.date}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => showToast(`Viewing assessment breakdown for #${log.id}`, "info")}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" /> View Breakdown
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
