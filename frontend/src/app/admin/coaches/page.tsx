"use client";

import React, { useState, useEffect } from "react";
import { Users2, Search, CheckCircle2, XCircle, Eye, ShieldCheck, Mail, Building2 } from "lucide-react";
import { useAdminToast } from "../layout";

interface CoachItem {
  id: number;
  name: string;
  email: string;
  organization: string;
  playersCount: number;
  assessmentsCount: number;
  status: "Active" | "Inactive";
  joinedDate: string;
}

const DEFAULT_COACHES: CoachItem[] = [
  { id: 1, name: "Daryll Cullinan", email: "daryll@cpicoach.com", organization: "CPI Cricket Academy", playersCount: 42, assessmentsCount: 438, status: "Active", joinedDate: "2025-01-10" },
  { id: 2, name: "Gowtham SK", email: "gowtham@cpicoach.com", organization: "CPI Cricket Academy", playersCount: 38, assessmentsCount: 390, status: "Active", joinedDate: "2025-01-15" },
  { id: 3, name: "Rajesh Kumar", email: "rajesh@nationalhub.org", organization: "National High Performance Center", playersCount: 54, assessmentsCount: 520, status: "Active", joinedDate: "2025-02-05" },
  { id: 4, name: "Vikram Singh", email: "vikram@apexcricket.com", organization: "Apex Cricket Institute", playersCount: 29, assessmentsCount: 210, status: "Active", joinedDate: "2025-03-01" },
  { id: 5, name: "Shane Watson", email: "shane@melbournecricket.au", organization: "Melbourne Elite Cricket School", playersCount: 45, assessmentsCount: 412, status: "Active", joinedDate: "2025-04-10" }
];

export default function AdminCoachesPage() {
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState<CoachItem[]>(DEFAULT_COACHES);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token");
      const res = await fetch("/api/admin/coaches", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCoaches(data);
        }
      }
    } catch (err) {
      console.error("Error fetching coaches", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (id: number) => {
    setCoaches((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "Active" ? "Inactive" : "Active";
          showToast(`Coach "${c.name}" status updated to ${nextStatus}`, "info");
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const filteredCoaches = coaches.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Coach Directory Management</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
              Platform-Wide Coaches
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Overview and governance of all head coaches and performance analysts across platform organizations.
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
            placeholder="Search coach by name, email, or academy..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Coach Name</th>
                <th className="px-5 py-3.5">Email Contact</th>
                <th className="px-5 py-3.5">Organization</th>
                <th className="px-5 py-3.5">Managed Players</th>
                <th className="px-5 py-3.5">Assessments Logged</th>
                <th className="px-5 py-3.5">Joined Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredCoaches.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900">{c.name}</p>
                        <p className="text-[10px] text-slate-400">Coach ID: CCH-00{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-semibold">{c.email}</td>
                  <td className="px-5 py-4 text-slate-800 font-bold">{c.organization}</td>
                  <td className="px-5 py-4 text-slate-900 font-extrabold">{c.playersCount} Players</td>
                  <td className="px-5 py-4 text-slate-900 font-extrabold">{c.assessmentsCount} Logs</td>
                  <td className="px-5 py-4 text-slate-500">{c.joinedDate}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        c.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {c.status === "Active" ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => showToast(`Viewing profile for ${c.name}`, "info")}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" /> View
                      </button>
                      <button
                        onClick={() => toggleStatus(c.id)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                          c.status === "Active"
                            ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {c.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
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
