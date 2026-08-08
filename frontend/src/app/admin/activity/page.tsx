"use client";

import React, { useState } from "react";
import { Activity, Search, Filter, CheckCircle2, User, Clock, ShieldCheck } from "lucide-react";
import { useAdminToast } from "../layout";

interface ActivityItem {
  id: number;
  user: string;
  role: string;
  action: string;
  entity: string;
  date: string;
  time: string;
  status: string;
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  { id: 1, user: "cpi@admin.com", role: "MASTER_ADMIN", action: "Updated CPI 7-Parameter Framework Definitions", entity: "CPI Framework", date: "2026-08-08", time: "21:04:19", status: "Success" },
  { id: 2, user: "cpi@admin.com", role: "MASTER_ADMIN", action: "Configured AI Coach System Prompts & Recommendation Rules", entity: "AI Management", date: "2026-08-08", time: "20:45:10", status: "Success" },
  { id: 3, user: "daryll@cpicoach.com", role: "HEAD_COACH", action: "Logged Practice Assessment (#LOG-101) for Rohan Sharma", entity: "Practice Assessment", date: "2026-08-08", time: "18:30:00", status: "Success" },
  { id: 4, user: "rajesh@nationalhub.org", role: "HEAD_COACH", action: "Logged Match Assessment (#LOG-102) for Ankit Patel", entity: "Match Assessment", date: "2026-08-07", time: "16:15:22", status: "Success" },
  { id: 5, user: "cpi@admin.com", role: "MASTER_ADMIN", action: "Activated Organization 'CPI Cricket Academy'", entity: "Organizations", date: "2026-08-06", time: "11:20:45", status: "Success" }
];

export default function AdminSystemActivityPage() {
  const { showToast } = useAdminToast();
  const [activities, setActivities] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = activities.filter((act) =>
    act.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.entity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">System Activity Audit Log</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold">
              Platform Audit Stream
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Immutable platform audit trail tracking administrative actions, logins, content changes, and evaluation activity.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity by user, action, or entity..."
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
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Action Executed</th>
                <th className="px-5 py-3.5">Target Entity</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-slate-900">{act.user}</td>
                  <td className="px-5 py-4 font-bold text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                      {act.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-800">{act.action}</td>
                  <td className="px-5 py-4 text-slate-600">{act.entity}</td>
                  <td className="px-5 py-4 text-slate-500">{act.date} {act.time}</td>
                  <td className="px-5 py-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {act.status}
                    </span>
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
