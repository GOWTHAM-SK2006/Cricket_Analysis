"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Loader2, Eye, EyeOff } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "615869393937-9ib5l28morbhm0blc9a72a2si34h1mqp.apps.googleusercontent.com";
const isGoogleConfigured = Boolean(
  GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes("102938475612")
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

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
        setError(err.response?.data?.message || "Google authentication failed");
      } finally {
        setGoogleLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!isGoogleConfigured) return;

    const scriptId = "google-gis-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initGis = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);

        const profileRes = await api.get("/profile", {
          headers: { Authorization: `Bearer ${response.data.token}` }
        });

        const userEmail = (profileRes.data.email || "").toLowerCase();
        if (
          profileRes.data.role === "ADMIN" &&
          (userEmail === "cpi@admin.com" || userEmail === "cpicoach@cpi.com")
        ) {
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
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF3EC] via-[#FFF8F4] to-[#FFF3EC] text-slate-900 flex flex-col justify-between p-6 select-none transition-colors">
      <div className="my-auto max-w-md w-full mx-auto space-y-8">
        {/* Logo and Welcome */}
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
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2 uppercase">
            WELCOME
          </h1>
          <p className="text-slate-500 text-lg font-bold">
            Cricket Performance Index
          </p>
        </div>

        {/* Main form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-600 p-4 rounded-2xl text-sm font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-2 text-left">
            <label className="text-xs font-black tracking-widest text-slate-500 block uppercase">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-4 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500 transition-all shadow-sm"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-xs font-black tracking-widest text-slate-500 block uppercase">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-4 pr-12 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500 transition-all shadow-sm"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 focus:outline-none transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-slate-500" />
                ) : (
                  <Eye className="w-5 h-5 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl py-4.5 text-lg font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : (
              "SIGN IN"
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
          {isGoogleConfigured ? (
            <div
              ref={googleBtnRef}
              className="w-full min-h-[44px] flex justify-center"
            />
          ) : (
            <button
              type="button"
              onClick={() =>
                setError(
                  "Google Sign-In is not configured yet. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend/.env.local or sign in with your email address and password above."
                )
              }
              className="w-full border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-full flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>
          )}
        </div>

        <div className="text-center pt-2">
          <Link
            href="/signup"
            className="text-orange-600 hover:underline text-base font-black tracking-wide block py-2"
          >
            CREATE NEW ACCOUNT
          </Link>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest py-4">
        Mobile Sunlight Optimized • Simple UX
      </div>
    </div>
  );
}
