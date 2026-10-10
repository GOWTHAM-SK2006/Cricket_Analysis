"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { Loader2, Mail, CheckCircle2, ArrowLeft, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const clientUrl = typeof window !== "undefined" ? window.location.origin : undefined;
      const res = await api.post("/auth/forgot-password", { email, clientUrl });
      setSent(true);
      setSuccess(
        res.data?.message ||
          "If an account with that email address exists, a password reset link has been dispatched."
      );
    } catch (err: any) {
      if (err.message && (err.message.includes("Network Error") || !err.response)) {
        setError("Unable to connect to CPI server. Please check your network connection.");
      } else {
        setError(
          err.response?.data?.message || "Failed to process password reset. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0E] text-[#F3F4F6] flex flex-col justify-between p-6 select-none transition-colors">
      <div className="my-auto max-w-md w-full mx-auto space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="relative w-28 h-32 mx-auto mb-6">
            <Image
              src="/cpi-logo.png"
              alt="CPI Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">
            FORGOT PASSWORD
          </h1>
          <p className="text-slate-400 text-sm font-bold">
            Cricket Performance Index
          </p>
        </div>

        <div className="bg-[#12141D] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mx-auto mb-3 shadow-lg shadow-[#D4AF37]/10">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black tracking-wide text-white uppercase">
              {sent ? "CHECK YOUR EMAIL" : "RESET YOUR PASSWORD"}
            </h2>
            <p className="text-slate-400 text-sm">
              {sent
                ? "Password reset instructions have been sent to your inbox."
                : "Enter your registered email address and we'll send you a secure link to reset your password."}
            </p>
          </div>

          {sent ? (
            <div className="space-y-6">
              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#FCE8B2] p-4 rounded-2xl text-sm font-semibold flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-white">Reset Link Dispatched</p>
                  <p className="text-xs text-slate-300">
                    {success ||
                      "If an account with that email exists, a password reset link has been sent."}
                  </p>
                  <p className="text-[11px] text-[#D4AF37] font-semibold pt-1">
                    Link valid for 15 minutes. Check spam folder if not received.
                  </p>
                </div>
              </div>

              <Link
                href="/login"
                className="w-full bg-gradient-to-r from-[#E5A93C] via-[#D4AF37] to-[#B8860B] hover:opacity-95 text-[#090A0E] rounded-2xl py-4 text-base font-black tracking-wider uppercase transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center"
              >
                RETURN TO SIGN IN
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-300 p-3.5 rounded-2xl text-xs font-bold text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2 text-left">
                <label className="text-xs font-black tracking-widest text-slate-400 block uppercase">
                  REGISTERED EMAIL
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-[#0E1017] border border-white/10 focus:border-[#D4AF37] rounded-2xl pl-11 pr-4 py-3.5 text-base text-white font-medium focus:outline-none transition-all placeholder:text-slate-500"
                    placeholder="Enter your registered email"
                  />
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#E5A93C] via-[#D4AF37] to-[#B8860B] hover:opacity-95 text-[#090A0E] rounded-2xl py-4 text-base font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#090A0E]" />
                    <span>SENDING LINK...</span>
                  </>
                ) : (
                  "SEND RESET LINK"
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-slate-400 hover:text-white text-xs font-bold tracking-wider uppercase transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest py-4">
        Mobile Sunlight Optimized • Simple UX
      </div>
    </div>
  );
}
