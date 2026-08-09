"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "102938475612-cpi-coach.apps.googleusercontent.com";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleGoogleCredentialResponse = useCallback(
    async (response: any) => {
      if (!response || !response.credential) return;
      setGoogleLoading(true);
      setError("");

      try {
        const res = await api.post("/auth/google", {
          idToken: response.credential
        });

        if (res.data.token) {
          localStorage.clear();
          sessionStorage.clear();
          localStorage.setItem("token", res.data.token);

          const profileRes = await api.get("/profile", {
            headers: { Authorization: `Bearer ${res.data.token}` }
          });

          const userEmail = (profileRes.data.email || "").toLowerCase();
          if (
            profileRes.data.role === "ADMIN" &&
            (userEmail === "cpi@admin.com" || userEmail === "cpicoach@cpi.com")
          ) {
            localStorage.setItem("cpi_admin_token", res.data.token);
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
    },
    [router]
  );

  useEffect(() => {
    const scriptId = "google-gis-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initGis = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: true,
            cancel_on_tap_outside: false
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = "";
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: "outline",
              size: "large",
              type: "standard",
              shape: "pill",
              text: "continue_with",
              width: "380",
              logo_alignment: "left"
            });
          }

          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed()) {
              console.log(
                "One Tap not displayed reason:",
                notification.getNotDisplayedReason()
              );
            }
          });
        } catch (err) {
          console.error("Failed to initialize Google Identity Services", err);
        }
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGis;
      document.body.appendChild(script);
    } else {
      initGis();
    }
  }, [handleGoogleCredentialResponse]);

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
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1 uppercase">
            COACH SIGN UP
          </h1>
          <p className="text-slate-500 text-lg font-bold">
            Join Cricket Performance Index
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-5">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-600 p-4 rounded-2xl text-sm font-bold text-center uppercase tracking-wide">
              {error}
            </div>
          )}

          <div className="space-y-2 text-left">
            <label className="text-xs font-black tracking-widest text-slate-500 block uppercase">
              COACH NAME
            </label>
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
            <label className="text-xs font-black tracking-widest text-slate-500 block uppercase">
              EMAIL ADDRESS
            </label>
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
            <label className="text-xs font-black tracking-widest text-slate-500 block uppercase">
              PASSWORD
            </label>
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
            <label className="text-xs font-black tracking-widest text-slate-500 block uppercase">
              CONFIRM PASSWORD
            </label>
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
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : (
              "REGISTER"
            )}
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

        {/* Google Official GIS Button Container */}
        <div className="space-y-3">
          {googleLoading && (
            <div className="flex items-center justify-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wide py-2">
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
              <span>Authenticating with Google...</span>
            </div>
          )}
          <div
            ref={googleBtnRef}
            className="w-full min-h-[44px] flex justify-center"
          />
        </div>

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
    </div>
  );
}
