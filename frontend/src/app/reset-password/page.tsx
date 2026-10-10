"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyToken() {
      if (!token || !token.trim()) {
        if (isMounted) {
          setValidating(false);
          setTokenValid(false);
          setTokenError("No password reset token was provided in the link.");
        }
        return;
      }

      try {
        const res = await api.get(
          `/auth/validate-reset-token?token=${encodeURIComponent(token.trim())}`
        );
        if (isMounted) {
          if (res.data?.valid) {
            setTokenValid(true);
            setMaskedEmail(res.data?.maskedEmail || "");
          } else {
            setTokenValid(false);
            setTokenError(
              res.data?.message ||
                "This password reset link is invalid, expired, or has already been used."
            );
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setTokenValid(false);
          setTokenError(
            err.response?.data?.message ||
              "Unable to verify reset link. Please check your internet connection and try again."
          );
        }
      } finally {
        if (isMounted) {
          setValidating(false);
        }
      }
    }

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (newPassword.length < 6) {
      setSubmitError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError("Passwords do not match. Please verify and re-enter.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/auth/reset-password", {
        token: token?.trim(),
        newPassword,
      });
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("cpi_admin_token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        sessionStorage.clear();
      }
      setResetSuccess(true);
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message ||
          "Failed to reset password. The link may have expired."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isPasswordValid = newPassword.length >= 6;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

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
            RESET PASSWORD
          </h1>
          <p className="text-slate-400 text-sm font-bold">
            Cricket Performance Index
          </p>
        </div>

        {/* State 1: Validating Token */}
        {validating && (
          <div className="bg-[#12141D] border border-white/10 rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37] mx-auto" />
            <p className="text-slate-300 font-semibold text-sm">
              Verifying security token...
            </p>
          </div>
        )}

        {/* State 2: Invalid or Expired Token */}
        {!validating && !tokenValid && (
          <div className="bg-[#12141D] border border-red-500/20 rounded-3xl p-8 text-center space-y-6 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-wide">
                LINK EXPIRED OR INVALID
              </h2>
              <p className="text-slate-400 text-sm">
                {tokenError ||
                  "This password reset link is invalid, has expired (after 15 minutes), or has already been used."}
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <Link
                href="/login"
                className="w-full bg-gradient-to-r from-[#E5A93C] via-[#D4AF37] to-[#B8860B] hover:opacity-95 text-[#090A0E] rounded-2xl py-4 text-base font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20"
              >
                REQUEST NEW LINK ON LOGIN
              </Link>

              <Link
                href="/login"
                className="text-slate-400 hover:text-white text-xs font-bold tracking-wider uppercase transition-colors inline-flex items-center gap-1.5 py-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Sign In
              </Link>
            </div>
          </div>
        )}

        {/* State 3: Successfully Reset */}
        {!validating && tokenValid && resetSuccess && (
          <div className="bg-[#12141D] border border-[#D4AF37]/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mx-auto shadow-lg shadow-[#D4AF37]/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-wide">
                PASSWORD UPDATED!
              </h2>
              <p className="text-slate-300 text-sm">
                Your password has been securely reset. You can now log into your
                CPI Coach account using your new credentials.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full bg-gradient-to-r from-[#E5A93C] via-[#D4AF37] to-[#B8860B] hover:opacity-95 text-[#090A0E] rounded-2xl py-4 text-base font-black tracking-wider uppercase transition-all shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
              >
                SIGN IN NOW
              </button>
            </div>
          </div>
        )}

        {/* State 4: Form to Enter New Password */}
        {!validating && tokenValid && !resetSuccess && (
          <form
            onSubmit={handleResetPassword}
            className="bg-[#12141D] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
          >
            {maskedEmail && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                  Account
                </span>
                <span className="text-sm text-[#FCE8B2] font-bold">
                  {maskedEmail}
                </span>
              </div>
            )}

            {submitError && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-300 p-3.5 rounded-2xl text-xs font-bold text-center">
                {submitError}
              </div>
            )}

            {/* New Password */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-black tracking-widest text-slate-400 block uppercase">
                NEW PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                  className="w-full bg-[#0E1017] border border-white/10 focus:border-[#D4AF37] rounded-2xl pl-11 pr-12 py-3.5 text-base text-white font-medium focus:outline-none transition-all placeholder:text-slate-500"
                  placeholder="At least 6 characters"
                />
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-black tracking-widest text-slate-400 block uppercase">
                CONFIRM NEW PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-[#0E1017] border border-white/10 focus:border-[#D4AF37] rounded-2xl pl-11 pr-12 py-3.5 text-base text-white font-medium focus:outline-none transition-all placeholder:text-slate-500"
                  placeholder="Re-enter your password"
                />
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Validation Checklist */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className={`w-4 h-4 ${
                    isPasswordValid ? "text-emerald-400" : "text-slate-500"
                  }`}
                />
                <span
                  className={
                    isPasswordValid ? "text-emerald-300" : "text-slate-400"
                  }
                >
                  At least 6 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className={`w-4 h-4 ${
                    isMatch ? "text-emerald-400" : "text-slate-500"
                  }`}
                />
                <span className={isMatch ? "text-emerald-300" : "text-slate-400"}>
                  Passwords match
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !isPasswordValid || !isMatch}
              className="w-full bg-gradient-to-r from-[#E5A93C] via-[#D4AF37] to-[#B8860B] hover:opacity-95 text-[#090A0E] rounded-2xl py-4 text-base font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#090A0E]" />
                  <span>UPDATING PASSWORD...</span>
                </>
              ) : (
                "SET NEW PASSWORD"
              )}
            </button>

            <div className="text-center pt-1">
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

      <div className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest py-4">
        Mobile Sunlight Optimized • Simple UX
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090A0E] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
