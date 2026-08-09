"use client";

import React, { useState } from "react";
import { BarChart3, TrendingUp, Users2, Building2, UserCheck, Calendar, CheckCircle2 } from "lucide-react";
import { useAdminToast } from "../layout";

export default function AdminAnalyticsPage() {
  const { showToast } = useAdminToast();
  const [timeframe, setTimeframe] = useState<"Daily" | "Weekly" | "Monthly" | "Yearly">("Monthly");

  const growthData = [
    { period: "Jan 2026", coaches: 1, players: 3, assessments: 150 },
    { period: "Feb 2026", coaches: 2, players: 6, assessments: 450 },
    { period: "Mar 2026", coaches: 3, players: 9, assessments: 850 },
    { period: "Apr 2026", coaches: 3, players: 11, assessments: 1240 },
  ];

  const topActiveOrgs = [
    { name: "CPI Cricket Academy", location: "Chennai", logs: 1240, share: "100.0%" }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Platform-Wide Analytics</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
              Global Platform Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track macro platform trends, active coach & player growth, and longitudinal evaluation volume.
          </p>
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          {(["Daily", "Weekly", "Monthly", "Yearly"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => { setTimeframe(tf); showToast(`Timeframe switched to ${tf}`, "info"); }}
              className={`px-3 py-1 rounded-lg transition-all ${
                timeframe === tf ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Platform Activity Growth</span>
          <p className="text-2xl font-black text-slate-900">+100% Active</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">Active Longitudinal Tracking</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Coach Engagement Rate</span>
          <p className="text-2xl font-black text-slate-900">100% Active</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">Active Coaches Weekly</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Player Profile Growth</span>
          <p className="text-2xl font-black text-slate-900">11 Profiles</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">Active Players Managed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Practice vs Match Ratio</span>
          <p className="text-2xl font-black text-orange-600">58% / 42%</p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">720 Practice / 520 Match</p>
        </div>
      </div>

      {/* Growth Curves & Top Orgs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Growth Table Chart Representation */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Platform Growth Trajectory ({timeframe})</h2>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">Audit Dataset</span>
          </div>

          <div className="space-y-3">
            {growthData.map((d, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-xs text-slate-900">{d.period}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    {d.coaches} Coaches • {d.players} Players
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-orange-600">{d.assessments.toLocaleString()} Logs</p>
                  <p className="text-[10px] text-emerald-600 font-bold">+{(idx + 1) * 35}% volume</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Active Organizations */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Top Active Organizations</h2>
            <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-bold">By Log Volume</span>
          </div>

          <div className="space-y-3">
            {topActiveOrgs.map((org, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-xs text-slate-900">{org.name}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{org.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-900">{org.logs} Logs</p>
                  <span className="text-[10px] text-orange-600 font-bold">{org.share} share</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
