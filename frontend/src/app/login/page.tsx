"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Loader2, Eye, EyeOff, Mail, CheckCircle2, X, ArrowLeft, KeyRound } from "lucide-react";

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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const tokenClientRef = useRef<any>(null);

  // Forgot Password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(true);

    try {
      const clientUrl = typeof window !== "undefined" ? window.location.origin : undefined;
      const res = await api.post("/auth/forgot-password", {
        email: forgotEmail,
        clientUrl,
      });
      setForgotSent(true);
      setForgotSuccess(
        res.data?.message ||
          "If an account with that email address exists, a password reset link has been dispatched."
      );
    } catch (err: any) {
      if (err.message && (err.message.includes("Network Error") || !err.response)) {
        setForgotError("Unable to connect to CPI server. Please check your network connection.");
      } else {
        setForgotError(
          err.response?.data?.message || "Failed to process password reset. Please try again."
        );
      }
    } finally {
      setForgotLoading(false);
    }
  };

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
        setError(err.response?.data?.message || err.message || "Google authentication failed");
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
        // 1. Initialize GIS for ID tokens / One Tap
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

        // 2. Initialize OAuth 2.0 Token Client for custom button click
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

    // Prepare optional hint without forced re-authentication prompts
    const options: any = {};
    if (email && email.includes("@")) {
      options.hint = email.trim();
    }

    // 1. Try Token Client popup (uses active Google session without password challenge)
    if (tokenClientRef.current) {
      try {
        tokenClientRef.current.requestAccessToken(options);
        return;
      } catch (err: any) {
        console.warn("Token client requestAccessToken error:", err);
      }
    }

    // 2. Try on-the-fly initialization if window.google.accounts.oauth2 is ready
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
        client.requestAccessToken(options);
        return;
      } catch (err: any) {
        console.warn("On-the-fly token client failed:", err);
      }
    }

    // 3. Fallback: Standard Google OAuth endpoint redirect / popup without forced prompt parameter
    if (typeof window !== "undefined") {
      const redirectUri = window.location.origin + "/login";
      let googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        GOOGLE_CLIENT_ID
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token%20id_token&scope=openid%20email%20profile&nonce=${Date.now()}`;

      if (email && email.includes("@")) {
        googleAuthUrl += `&login_hint=${encodeURIComponent(email.trim())}`;
      }

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data.token) {
        localStorage.removeItem("token");
        localStorage.removeItem("cpi_admin_token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        sessionStorage.clear();

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
      if (err.message && (err.message.includes("Network Error") || !err.response)) {
        setError("Unable to connect to CPI server. Please check your internet connection.");
      } else {
        setError(err.response?.data?.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0E] text-[#F3F4F6] flex flex-col justify-between p-6 select-none transition-colors">
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

          <div className="flex justify-end -mt-2">
            <button
              type="button"
              onClick={() => {
                setForgotEmail(email || "");
                setForgotOpen(true);
                setForgotSent(false);
                setForgotError("");
                setForgotSuccess("");
              }}
              className="text-xs font-bold tracking-wider text-[#D4AF37] hover:text-[#FCE8B2] hover:underline uppercase transition-colors cursor-pointer"
            >
              Forgot Password?
            </button>
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

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-[#12141D] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 text-[#F3F4F6]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mx-auto mb-3 shadow-lg shadow-[#D4AF37]/10">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black tracking-wide text-white uppercase">
                {forgotSent ? "CHECK YOUR EMAIL" : "FORGOT PASSWORD"}
              </h2>
              <p className="text-slate-400 text-sm font-medium">
                {forgotSent
                  ? "We've dispatched password reset instructions to your inbox."
                  : "Enter your registered email address and we'll send you a secure link to reset your password."}
              </p>
            </div>

            {forgotSent ? (
              <div className="space-y-6">
                <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#FCE8B2] p-4 rounded-2xl text-sm font-semibold flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-white">Reset Link Dispatched</p>
                    <p className="text-xs text-slate-300">
                      {forgotSuccess ||
                        "If an account with that email exists, a password reset link has been sent."}
                    </p>
                    <p className="text-[11px] text-[#D4AF37] font-semibold pt-1">
                      Link valid for 15 minutes. Check spam if not received.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen(false);
                    setForgotSent(false);
                  }}
                  className="w-full bg-gradient-to-r from-[#E5A93C] via-[#D4AF37] to-[#B8860B] hover:opacity-95 text-[#090A0E] rounded-2xl py-4 text-base font-black tracking-wider uppercase transition-all shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
                >
                  RETURN TO SIGN IN
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                {forgotError && (
                  <div className="bg-red-500/15 border border-red-500/30 text-red-300 p-3.5 rounded-2xl text-xs font-bold text-center">
                    {forgotError}
                  </div>
                )}

                <div className="space-y-2 text-left">
                  <label className="text-xs font-black tracking-widest text-slate-400 block uppercase">
                    REGISTERED EMAIL
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoFocus
                      className="w-full bg-[#0E1017] border border-white/10 focus:border-[#D4AF37] rounded-2xl pl-11 pr-4 py-3.5 text-base text-white font-medium focus:outline-none transition-all shadow-inner placeholder:text-slate-500"
                      placeholder="Enter your registered email"
                    />
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-gradient-to-r from-[#E5A93C] via-[#D4AF37] to-[#B8860B] hover:opacity-95 text-[#090A0E] rounded-2xl py-4 text-base font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20 active:scale-[0.98] disabled:opacity-60"
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-[#090A0E]" />
                      <span>SENDING LINK...</span>
                    </>
                  ) : (
                    "SEND RESET LINK"
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(false)}
                    className="text-slate-400 hover:text-white text-xs font-bold tracking-wider uppercase transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
