"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Crown, Sparkles, ShieldCheck, Zap, ArrowRight, Star, HelpCircle } from "lucide-react";

interface PremiumPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumPlansModal({ isOpen, onClose }: PremiumPlansModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [selectedPlanToast, setSelectedPlanToast] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUpgradeClick = (planName: string) => {
    setSelectedPlanToast(`Upgrade to ${planName} will be available soon! Payment processing coming in the next release.`);
    setTimeout(() => {
      setSelectedPlanToast(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      {/* Background overlay click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-slate-50 border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto text-slate-900 select-none">
        
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white border-b border-slate-800">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700 shadow-md"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-black uppercase tracking-widest">
              <Crown className="w-4 h-4 fill-orange-400 stroke-orange-400" />
              <span>CPI PREMIUM PLANS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              Upgrade Your Coaching Superpowers
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Unlock advanced player telemetry, AI coaching insights, unlimited squad reports, and custom academy synchronization.
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="mt-6 inline-flex items-center bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-orange-500 text-black shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer ${
                billingCycle === "annual"
                  ? "bg-orange-500 text-black shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-black text-[9px] font-black">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Upgrade Toast Notification */}
        {selectedPlanToast && (
          <div className="bg-orange-500 text-black px-6 py-3 font-bold text-xs flex items-center justify-between animate-slideDown shadow-inner">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{selectedPlanToast}</span>
            </div>
            <button onClick={() => setSelectedPlanToast(null)} className="font-black text-xs hover:underline cursor-pointer">
              DISMISS
            </button>
          </div>
        )}

        {/* Plans Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

          {/* 1. HOBBY (CURRENT PLAN) */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-sm hover:border-slate-300 transition-all relative">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black tracking-widest text-slate-400 uppercase">TIER 01</span>
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase flex items-center gap-1">
                  <Check className="w-3 h-3 text-slate-600" />
                  CURRENT PLAN
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-900 uppercase">HOBBY</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                Essential tracking for individual coaches & small practice groups.
              </p>

              <div className="my-5 pb-5 border-b border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">$0</span>
                  <span className="text-xs font-extrabold text-slate-400">/ month</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mt-1">Free Forever</span>
              </div>

              <div className="space-y-3 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Plan Includes:</span>
                <ul className="space-y-2.5 font-semibold text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Up to <strong>5 Players</strong> Tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Basic PPI & MPI Scoring</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Out-of-10 Rating Engine</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Standard Action Plan Guide</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Standard PDF Export</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-400 line-through">
                    <X className="w-4 h-4 text-slate-300 shrink-0" />
                    <span>AI Coach Recommendations</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-400 line-through">
                    <X className="w-4 h-4 text-slate-300 shrink-0" />
                    <span>Unlimited Squad Reports</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              disabled
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 text-slate-500 font-black text-xs uppercase cursor-default border border-slate-200 text-center"
            >
              CURRENT ACTIVE PLAN
            </button>
          </div>


          {/* 2. PRO (RECOMMENDED / MOST POPULAR) */}
          <div className="bg-white border-2 border-orange-500 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl shadow-orange-500/10 hover:shadow-orange-500/20 transition-all relative transform lg:-translate-y-2">
            {/* Recommended Ribbon */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-[10px] uppercase tracking-widest shadow-md flex items-center gap-1 border border-orange-300">
              <Star className="w-3 h-3 fill-black stroke-black" />
              RECOMMENDED
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 pt-1">
                <span className="text-xs font-black tracking-widest text-orange-600 uppercase">TIER 02</span>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black uppercase">
                  MOST POPULAR
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-2">
                <span>PRO</span>
                <Zap className="w-5 h-5 fill-orange-500 text-orange-500" />
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                For professional coaches & growing cricket academies.
              </p>

              <div className="my-5 pb-5 border-b border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">
                    {billingCycle === "monthly" ? "$29" : "$23"}
                  </span>
                  <span className="text-xs font-extrabold text-slate-400">/ month</span>
                </div>
                <span className="text-[10px] text-orange-600 font-bold uppercase block mt-1">
                  {billingCycle === "annual" ? "Billed $276 annually" : "Billed monthly"}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 block">Everything in Hobby, plus:</span>
                <ul className="space-y-2.5 font-semibold text-slate-800">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-orange-500 shrink-0 stroke-[3]" />
                    <span>Up to <strong>25 Active Players</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-orange-500 shrink-0 stroke-[3]" />
                    <span>Full 7-Parameter Deep Analytics</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-orange-500 shrink-0 stroke-[3]" />
                    <span><strong>AI Coach Insights & Action Plans</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-orange-500 shrink-0 stroke-[3]" />
                    <span><strong>Unlimited Date-Filtered PDF Reports</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-orange-500 shrink-0 stroke-[3]" />
                    <span>Historical Performance Trend Charts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-orange-500 shrink-0 stroke-[3]" />
                    <span>Squad Leaderboard & Role Badges</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-orange-500 shrink-0 stroke-[3]" />
                    <span>Priority Support</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => handleUpgradeClick("Pro Plan")}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs uppercase shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>UPGRADE TO PRO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>


          {/* 3. ELITE (PREMIUM / HIGHEST TIER) */}
          <div className="bg-slate-900 text-white border-2 border-amber-400/80 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-2xl hover:border-amber-400 transition-all relative">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black tracking-widest text-amber-400 uppercase">TIER 03</span>
                <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-300" />
                  ELITE ACADEMY
                </span>
              </div>

              <h3 className="text-xl font-black text-white uppercase flex items-center gap-2">
                <span>ELITE</span>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-300 font-semibold leading-relaxed mt-1">
                For elite high-performance academies & franchise teams.
              </p>

              <div className="my-5 pb-5 border-b border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">
                    {billingCycle === "monthly" ? "$79" : "$63"}
                  </span>
                  <span className="text-xs font-extrabold text-slate-400">/ month</span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold uppercase block mt-1">
                  {billingCycle === "annual" ? "Billed $756 annually" : "Billed monthly"}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">Everything in Pro, plus:</span>
                <ul className="space-y-2.5 font-semibold text-slate-200">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />
                    <span><strong>Unlimited Players & Squads</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />
                    <span>Multi-Coach Sync & Roles</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />
                    <span>Custom AI Prompts & Framework Tuning</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />
                    <span>White-Label Academy PDF Reports</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />
                    <span>Video Telemetry Integration</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />
                    <span>Dedicated Performance Manager</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />
                    <span>24/7 VIP Direct Support</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => handleUpgradeClick("Elite Plan")}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase shadow-lg shadow-amber-400/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>UPGRADE TO ELITE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Footer Note */}
        <div className="bg-slate-100 p-4 text-center border-t border-slate-200 text-xs text-slate-500 font-semibold flex items-center justify-center gap-2 flex-wrap">
          <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
          <span>Need a custom enterprise agreement for state associations or national leagues?</span>
          <button onClick={() => handleUpgradeClick("Enterprise")} className="text-orange-600 font-black hover:underline cursor-pointer">
            Contact Sales
          </button>
        </div>

      </div>
    </div>
  );
}
