"use client";

import React, { useState, useEffect } from "react";
import { Building2, Search, Filter, CheckCircle2, XCircle, Eye, SlidersHorizontal, Plus } from "lucide-react";
import { useAdminToast } from "../layout";

interface OrganizationItem {
  id: number;
  name: string;
  location: string;
  coachesCount: number;
  playersCount: number;
  assessmentsCount: number;
  status: "Active" | "Inactive";
  createdDate: string;
  lastActive: string;
}

const DEFAULT_ORGS: OrganizationItem[] = [
  { id: 1, name: "CPI Cricket Academy", location: "Chennai, India", coachesCount: 3, playersCount: 11, assessmentsCount: 1240, status: "Active", createdDate: "2025-01-15", lastActive: "Just now" }
];

export default function AdminOrganizationsPage() {
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<OrganizationItem[]>(DEFAULT_ORGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token");
      const res = await fetch("/api/admin/organizations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrgs(data);
        }
      }
    } catch (err) {
      console.error("Error fetching organizations", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (id: number) => {
    setOrgs((prev) =>
      prev.map((org) => {
        if (org.id === id) {
          const nextStatus = org.status === "Active" ? "Inactive" : "Active";
          showToast(`Organization "${org.name}" status set to ${nextStatus}`, "info");
          return { ...org, status: nextStatus };
        }
        return org;
      })
    );
  };

  const filteredOrgs = orgs.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Organization Management</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
              Platform Academies & Centers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global directory of all cricket academies, centers, and institutes onboarded onto the CPI platform.
          </p>
        </div>

        <button
          onClick={() => showToast("Add Organization modal triggered", "info")}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/30 transition-all self-start sm:self-auto cursor-pointer uppercase"
        >
          <Plus className="w-4 h-4" />
          <span>Add Organization</span>
        </button>
      </div>

      {/* Table Controls (Search + Filters) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by organization name or location..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {(["All", "Active", "Inactive"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === st ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Organization</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Coaches</th>
                <th className="px-5 py-3.5">Players</th>
                <th className="px-5 py-3.5">Assessments</th>
                <th className="px-5 py-3.5">Joined Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-orange-400 flex items-center justify-center font-bold text-xs">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900">{org.name}</p>
                        <p className="text-[10px] text-slate-400">ID: ORG-00{org.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-semibold">{org.location}</td>
                  <td className="px-5 py-4 text-slate-900 font-extrabold">{org.coachesCount} Coaches</td>
                  <td className="px-5 py-4 text-slate-900 font-extrabold">{org.playersCount} Players</td>
                  <td className="px-5 py-4 text-slate-900 font-extrabold">{org.assessmentsCount.toLocaleString()} Logs</td>
                  <td className="px-5 py-4 text-slate-500">{org.createdDate}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        org.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {org.status === "Active" ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                      {org.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => showToast(`Viewing details for ${org.name}`, "info")}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" /> View
                      </button>
                      <button
                        onClick={() => toggleStatus(org.id)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                          org.status === "Active"
                            ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {org.status === "Active" ? "Deactivate" : "Activate"}
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
