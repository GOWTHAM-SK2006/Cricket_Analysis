"use client";

import { FileText, Shield, UserCheck, Lock, HelpCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Title */}
      <div className="space-y-2 text-center">
        <h1 className="text-zinc-500 font-black tracking-widest text-xs uppercase">LEGAL AGREEMENTS</h1>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">TERMS & CONDITIONS</h2>
      </div>

      {/* Intro Card */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3">
        <p className="text-sm font-bold text-zinc-400 leading-relaxed">
          Welcome to the Cricket Performance Index (CPI). These Terms and Conditions govern your access and use of the CPI platform, services, and related applications. By registering or using our platform, you agree to comply with these terms.
        </p>
        <p className="text-xs text-zinc-500 font-medium">Last updated: July 2026</p>
      </div>

      {/* Terms list */}
      <div className="space-y-4">
        
        {/* Section 1 */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">1. Platform Services</h3>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Scope and Usage</p>
            </div>
          </div>
          <p className="text-xs font-bold text-zinc-400 leading-relaxed">
            CPI provides coaching staff, academies, and players with performance tracking tools, rating systems (PPI and MPI), and data visualization. 
          </p>
          <ul className="text-xs font-bold text-zinc-400 space-y-2 pl-4 list-disc">
            <li>The platform is provided "as is" and as an athletic performance assessment aid.</li>
            <li>We reserve the right to modify, suspend, or discontinue any feature at any time.</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">2. Accounts & Registration</h3>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Access Requirements</p>
            </div>
          </div>
          <p className="text-xs font-bold text-zinc-400 leading-relaxed">
            To use CPI, users must register an account by providing accurate and complete registration details.
          </p>
          <ul className="text-xs font-bold text-zinc-400 space-y-2 pl-4 list-disc">
            <li>You are responsible for keeping your login credentials confidential.</li>
            <li>Accounts cannot be shared or transferred to other individuals without permission.</li>
            <li>Coaching credentials must be verified and approved by the academy administrator.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">3. Privacy & Performance Data</h3>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Information & Privacy</p>
            </div>
          </div>
          <p className="text-xs font-bold text-zinc-400 leading-relaxed">
            By using the platform, you agree to let CPI process athletic performance metrics, coaching feedback, and training logs.
          </p>
          <ul className="text-xs font-bold text-zinc-400 space-y-2 pl-4 list-disc">
            <li>Coaches can view and grade individual players' practice and match metrics.</li>
            <li>Administrators may generate reports summarizing collective or individual progress.</li>
            <li>Performance logs are secured and not shared with unauthorized third parties.</li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">4. Code of Conduct</h3>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Fair Play & Respect</p>
            </div>
          </div>
          <p className="text-xs font-bold text-zinc-400 leading-relaxed">
            Users must maintain professional and respectful behavior. Fair play and integrity are central values of the CPI platform.
          </p>
          <ul className="text-xs font-bold text-zinc-400 space-y-2 pl-4 list-disc">
            <li>Inputting false metrics or spamming reviews is strictly prohibited.</li>
            <li>Abusive behavior or harassment toward other players or staff will lead to account suspension.</li>
          </ul>
        </div>

        {/* Section 5 */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">5. Liability & Disclaimers</h3>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Limit of Responsibility</p>
            </div>
          </div>
          <p className="text-xs font-bold text-zinc-400 leading-relaxed">
            CPI ratings are subjective coaching assessments designed solely to support developmental training.
          </p>
          <ul className="text-xs font-bold text-zinc-400 space-y-2 pl-4 list-disc">
            <li>Ratings do not guarantee selection for official league matches or professional contracts.</li>
            <li>We are not responsible for any physical injury incurred during training, practice, or match situations.</li>
          </ul>
        </div>

      </div>

      {/* Back Button */}
      <Link
        href="/profile"
        className="w-full bg-slate-100 hover:bg-slate-100 text-slate-900 rounded-2xl py-4.5 text-base font-extrabold flex items-center justify-center gap-2 transition-all border border-slate-200 cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
        BACK TO PROFILE
      </Link>

    </div>
  );
}
