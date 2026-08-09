"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [googleNameInput, setGoogleNameInput] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const processGoogleAuth = async (emailToAuth: string, nameToAuth?: string) => {
    setGoogleLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/google", {
        email: emailToAuth.trim().toLowerCase(),
        name: nameToAuth ? nameToAuth.trim() : emailToAuth.split("@")[0]
      });

      if (response.data.token) {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem("token", response.data.token);

        const profileRes = await api.get("/profile", {
          headers: { Authorization: `Bearer ${response.data.token}` }
        });

        const userEmail = (profileRes.data.email || "").toLowerCase();
        if (profileRes.data.role === "ADMIN" && (userEmail === "cpi@admin.com" || userEmail === "cpicoach@cpi.com")) {
          localStorage.setItem("cpi_admin_token", response.data.token);
          localStorage.setItem("userRole", "admin");
          if (profileRes.data.name) {
            localStorage.setItem("userName", profileRes.data.name);
          }
          router.push("/admin/dashboard");
          return;
        }

        localStorage.setItem("userRole", "coach");
        if (profileRes.data.name) {
          localStorage.setItem("userName", profileRes.data.name);
        }
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Google Sign-Up failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setShowGoogleModal(true);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please verify your password.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };

      const response = await api.post("/auth/signup", payload);
      if (response.data.token) {
        // Clear any previous session before storing the new one
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userRole", "coach");
        if (formData.name.trim()) {
          localStorage.setItem("userName", formData.name.trim());
        }
        router.push("/dashboard");
      }
    } catch (err: any) {
      const backendMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : "") ||
        err.message ||
        "";

      if (
        backendMsg.toLowerCase().includes("already exists") ||
        backendMsg.toLowerCase().includes("duplicate key") ||
        backendMsg.toLowerCase().includes("duplicate entry")
      ) {
        setError("This email address is already registered. Please log in instead.");
      } else if (backendMsg) {
        setError(backendMsg);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-6 select-none transition-colors">
      <div className="my-auto max-w-md w-full mx-auto space-y-8">
        
        {/* Logo and Welcome */}
        <div className="text-center">
          <div className="relative w-24 h-28 mx-auto mb-4">
            <Image
              src="/cpi-logo.png"
              alt="CPI Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1 uppercase">COACH SIGN UP</h1>
          <p className="text-slate-500 text-lg font-bold">Join Cricket Performance Index</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-5">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-600 p-4 rounded-2xl text-sm font-bold text-center uppercase tracking-wide">
              {error}
            </div>
          )}

          <div className="space-y-2 text-left">
            <label className="text-xs font-black tracking-widest text-slate-500 block uppercase">COACH NAME</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-4 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500 transition-all shadow-sm"
              placeholder="Enter coach name"
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-xs font-black tracking-widest text-slate-500 block uppercase">EMAIL ADDRESS</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-4 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500 transition-all shadow-sm"
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-xs font-black tracking-widest text-slate-500 block uppercase">PASSWORD</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-4 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500 transition-all shadow-sm"
              placeholder="Enter password (min 8 chars)"
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-xs font-black tracking-widest text-slate-500 block uppercase">CONFIRM PASSWORD</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-4 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500 transition-all shadow-sm"
              placeholder="Confirm password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl py-4.5 text-lg font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 active:scale-[0.98] mt-2"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : "REGISTER"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-50 px-4 text-slate-400 font-extrabold tracking-widest">
              OR
            </span>
          </div>
        </div>

        {/* Sign in with Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full bg-white hover:bg-slate-100 text-slate-800 font-black rounded-2xl py-4 text-base tracking-wide border-2 border-slate-200 transition-all flex items-center justify-center gap-3 shadow-sm cursor-pointer active:scale-[0.98]"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span className="uppercase">{googleLoading ? "SIGNING IN WITH GOOGLE..." : "SIGN IN WITH GOOGLE"}</span>
        </button>

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="text-orange-600 hover:underline text-base font-black tracking-wide block py-2"
          >
            ALREADY HAVE AN ACCOUNT? LOG IN
          </Link>
        </div>

      </div>

      <div className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest py-4">
        Mobile Sunlight Optimized • Individual Coach Access
      </div>

      {/* Google Sign In Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in duration-150 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Sign in with Google</h3>
              </div>
              <button onClick={() => setShowGoogleModal(false)} className="text-slate-400 hover:text-slate-600 font-black text-sm cursor-pointer">✕</button>
            </div>

            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              Enter your Google Account email address to register / sign in seamlessly to your CPI Coach Account:
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black tracking-widest text-slate-400 block uppercase mb-1">Google Email Address</label>
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black tracking-widest text-slate-400 block uppercase mb-1">Coach Display Name (Optional)</label>
                <input
                  type="text"
                  value={googleNameInput}
                  onChange={(e) => setGoogleNameInput(e.target.value)}
                  placeholder="Enter coach name"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase py-3.5 rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (googleEmailInput.trim()) {
                    setShowGoogleModal(false);
                    processGoogleAuth(googleEmailInput, googleNameInput);
                  }
                }}
                disabled={!googleEmailInput.trim()}
                className="w-1/2 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase py-3.5 rounded-2xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
