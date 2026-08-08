"use client";

import React, { useState } from "react";
import { History, Search, RotateCcw, Eye, ArrowLeftRight, CheckCircle2 } from "lucide-react";
import { useAdminToast } from "../layout";

interface VersionItem {
  version: string;
  section: string;
  changedBy: string;
  date: string;
  time: string;
  summary: string;
}

const DEFAULT_VERSIONS: VersionItem[] = [
  { version: "v2.5", section: "CPI Framework", changedBy: "cpi@admin.com", date: "2026-08-08", time: "21:04", summary: "Updated 7 CPI core parameter guidance notes & ratings" },
  { version: "v2.4", section: "AI Directives", changedBy: "cpi@admin.com", date: "2026-08-08", time: "20:45", summary: "Configured AI Coach system prompt & tone directives" },
  { version: "v2.3", section: "Reports Generator", changedBy: "cpi@admin.com", date: "2026-08-07", time: "18:20", summary: "Set Section 3 to rank 1 to 7 Strongest to Weakest" },
  { version: "v2.0", section: "Initial Seed", changedBy: "System Seeder", date: "2026-06-20", time: "12:14", summary: "Initial default CPI content configuration template" }
];

export default function AdminVersionHistoryPage() {
  const { showToast } = useAdminToast();
  const [versions, setVersions] = useState<VersionItem[]>(DEFAULT_VERSIONS);
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(null);

  const handleRestore = (ver: VersionItem) => {
    showToast(`Restored configuration to ${ver.version} (${ver.section})`, "success");
    setSelectedVersion(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Configuration Version History</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
              Rollback & Comparison Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Inspect previous configuration snapshots, compare parameter modifications, and execute single-click rollbacks.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Version tag</th>
                <th className="px-5 py-3.5">Target Section</th>
                <th className="px-5 py-3.5">Changed By</th>
                <th className="px-5 py-3.5">Change Summary</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {versions.map((ver, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-mono font-black text-orange-600">{ver.version}</td>
                  <td className="px-5 py-4 font-bold text-slate-900">{ver.section}</td>
                  <td className="px-5 py-4 text-slate-600 font-semibold">{ver.changedBy}</td>
                  <td className="px-5 py-4 text-slate-800 font-medium">{ver.summary}</td>
                  <td className="px-5 py-4 text-slate-500">{ver.date} {ver.time}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedVersion(ver)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" /> Compare
                      </button>
                      <button
                        onClick={() => handleRestore(ver)}
                        className="px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-orange-600" /> Restore
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compare Modal */}
      {selectedVersion && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Compare Snapshot: {selectedVersion.version}</h3>
              <button onClick={() => setSelectedVersion(null)} className="text-slate-400 hover:text-slate-900 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Target Section</span>
                <p className="font-bold text-slate-900">{selectedVersion.section}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Change Summary</span>
                <p className="font-medium text-slate-800">{selectedVersion.summary}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedVersion(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => handleRestore(selectedVersion)}
                className="px-5 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md uppercase"
              >
                Restore This Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
