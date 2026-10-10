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
  "559180577956-7kl3l6joq4k0n6o8gtcd3gvocsf03cqq.apps.googleusercontent.com";
const isGoogleConfigured = Boolean(
  GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes("102938475612")
);

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const tokenClientRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleGoogleSuccess = useCallback(
    async (tokenOrCredential: { idToken?: string; accessToken?: string; email?: string; name?: string }) => {
      setGoogleLoading(true);
      setError("");

      try {
        let userEmail = tokenOrCredential.email || "";
        let userName = tokenOrCredential.name || "";

        // If access token is provided and email isn't yet available, retrieve user info from Google
        if (tokenOrCredential.accessToken && !userEmail) {
          try {
            const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${tokenOrCredential.accessToken}` }
            });
            if (userInfoRes.ok) {
              const userInfo = await userInfoRes.json();
              userEmail = userInfo.email || "";
              userName = userInfo.name || "";
            }
          } catch (e) {
            console.warn("Failed to fetch Google userinfo:", e);
          }
        }

        const res = await api.post("/auth/google", {
          idToken: tokenOrCredential.idToken || tokenOrCredential.accessToken,
          token: tokenOrCredential.accessToken || tokenOrCredential.idToken,
          email: userEmail,
          name: userName
        });

        if (res.data?.token) {
          localStorage.clear();
          sessionStorage.clear();
          localStorage.setItem("token", res.data.token);

          const profileRes = await api.get("/profile", {
            headers: { Authorization: `Bearer ${res.data.token}` }
          });

          const emailLower = (profileRes.data.email || "").toLowerCase();
          if (
            profileRes.data.role === "ADMIN" &&
            (emailLower === "cpi@admin.com" || emailLower === "cpicoach@cpi.com")
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
        setError(err.response?.data?.message || err.message || "Google Sign-Up failed");
      } finally {
        setGoogleLoading(false);
      }
    },
    [router]
  );

  // Initialize Google Identity Services and OAuth 2.0 Token Client
  useEffect(() => {
    if (!isGoogleConfigured) return;

    const scriptId = "google-gis-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initGoogle = () => {
      if (typeof window === "undefined" || !window.google) return;

      try {
        if (window.google.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: any) => {
              if (response?.credential) {
                handleGoogleSuccess({ idToken: response.credential });
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true
          });
        }

        if (window.google.accounts?.oauth2) {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: "email profile openid",
            callback: (tokenResponse: any) => {
              if (tokenResponse.error) {
                if (tokenResponse.error === "popup_closed_by_user" || tokenResponse.error === "access_denied") {
                  return;
                }
                const originHelp =
                  typeof window !== "undefined" && window.location.hostname === "localhost"
                    ? " (Note: Localhost is not configured in Google Cloud Console. Google Sign-In is configured for https://cpicoach.com)"
                    : "";
                setError((tokenResponse.error_description || tokenResponse.error) + originHelp);
                return;
              }

              if (tokenResponse.access_token) {
                handleGoogleSuccess({ accessToken: tokenResponse.access_token });
              }
            }
          });
        }
      } catch (err: any) {
        console.error("Failed to initialize Google services:", err);
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else {
      initGoogle();
    }
  }, [handleGoogleSuccess]);

  // Handle URL hash fragments from OAuth redirects (if applicable)
  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get("id_token");
    const accessToken = params.get("access_token");

    if (idToken || accessToken) {
      window.history.replaceState(null, "", window.location.pathname);
      handleGoogleSuccess({ idToken: idToken || undefined, accessToken: accessToken || undefined });
    }
  }, [handleGoogleSuccess]);

  const handleGoogleSignIn = () => {
    setError("");

    if (!isGoogleConfigured) {
      setError(
        "Google OAuth is not configured: Missing or invalid NEXT_PUBLIC_GOOGLE_CLIENT_ID. Please verify your environment configuration."
      );
      return;
    }

    if (tokenClientRef.current) {
      try {
        tokenClientRef.current.requestAccessToken({ prompt: "select_account" });
        return;
      } catch (err: any) {
        console.warn("Token client requestAccessToken error:", err);
      }
    }

    if (typeof window !== "undefined" && window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "email profile openid",
          callback: (tokenResponse: any) => {
            if (tokenResponse.access_token) {
              handleGoogleSuccess({ accessToken: tokenResponse.access_token });
            } else if (tokenResponse.error && tokenResponse.error !== "popup_closed_by_user") {
              setError(tokenResponse.error_description || tokenResponse.error);
            }
          }
        });
        tokenClientRef.current = client;
        client.requestAccessToken({ prompt: "select_account" });
        return;
      } catch (err: any) {
        console.warn("On-the-fly token client failed:", err);
      }
    }

    if (typeof window !== "undefined") {
      const redirectUri = window.location.origin + "/signup";
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        GOOGLE_CLIENT_ID
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token%20id_token&scope=openid%20email%20profile&nonce=${Date.now()}&prompt=select_account`;

      const width = 500;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        googleAuthUrl,
        "GoogleSignIn",
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        window.location.href = googleAuthUrl;
      }
    }
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
    <div className="min-h-screen bg-[#090A0E] text-[#F3F4F6] flex flex-col justify-between p-6 select-none transition-colors">
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-4 pr-12 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500 transition-all shadow-sm"
                placeholder="Enter password (min 8 chars)"
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

          <div className="space-y-2 text-left">
            <label className="text-xs font-black tracking-widest text-slate-500 block uppercase">
              CONFIRM PASSWORD
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-4 pr-12 text-base text-slate-900 font-semibold focus:outline-none focus:border-orange-500 transition-all shadow-sm"
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 focus:outline-none transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
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

        {/* Google Sign-In Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full bg-[#12141D] hover:bg-[#181B27] active:scale-[0.98] border border-white/10 hover:border-white/20 text-white font-bold text-base rounded-2xl py-4.5 flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer shadow-lg shadow-black/40 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                <span className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                  Authenticating with Google...
                </span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
              </>
            )}
          </button>
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
