"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useAdminToast } from "../layout";

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useAdminToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg("Please enter Master Admin credentials.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: username.trim(),
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Invalid Master Admin credentials");
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem("cpi_admin_token", data.token);
        localStorage.setItem("jwt_token", data.token);
        showToast("Master Admin authentication successful", "success");
        router.push("/admin/dashboard");
      } else {
        throw new Error("Token missing from authentication response");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Check credentials.");
      showToast(err.message || "Authentication failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl p-8 text-slate-100">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-600/40 mb-3">
          CPI
        </div>
        <h2 className="text-xl font-black tracking-wider uppercase text-white">CPI MASTER ADMINISTRATION</h2>
        <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mt-1">Platform Control Console</p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-6 p-3.5 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center gap-2.5 font-bold">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Administrator Username / Email
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. cpi@admin.com or cpicoach"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs py-3.5 px-4 rounded-2xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 uppercase tracking-wider cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to Master Admin</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-slate-900 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Spring Boot JWT Backend Authentication Enforced</span>
        </div>
      </div>
    </div>
  );
}
