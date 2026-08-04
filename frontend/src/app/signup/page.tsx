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

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        createOrganization: true,
        organizationName: `${formData.name.trim()}'s Academy`,
        organizationType: "Academy",
        sport: "Cricket",
        country: "India",
        city: "Default"
      };

      const response = await api.post("/auth/signup", payload);
      if (response.data.token) {
        // Clear any previous session before storing the new one
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userRole", "coach");
        router.push("/dashboard");
      }
    } catch (err: any) {
      // Extract the most useful error message from the backend response
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
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white flex flex-col justify-between p-6 select-none transition-colors">
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
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-1 uppercase">CREATE ACCOUNT</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg font-bold">Join Cricket Performance Index</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border-2 border-red-500 text-red-600 dark:text-red-300 p-4 rounded-2xl text-sm font-bold text-center uppercase tracking-wide">
              {error}
            </div>
          )}

          <div className="space-y-2 text-left">
            <label className="text-xs font-black tracking-widest text-zinc-500 dark:text-zinc-400 block uppercase">FULL NAME</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 text-base text-zinc-900 dark:text-white font-semibold focus:outline-none focus:border-orange-500 transition-all shadow-sm"
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-xs font-black tracking-widest text-zinc-500 dark:text-zinc-400 block uppercase">EMAIL ADDRESS</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 text-base text-zinc-900 dark:text-white font-semibold focus:outline-none focus:border-orange-500 transition-all shadow-sm"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-xs font-black tracking-widest text-zinc-500 dark:text-zinc-400 block uppercase">PASSWORD</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 text-base text-zinc-900 dark:text-white font-semibold focus:outline-none focus:border-orange-500 transition-all shadow-sm"
              placeholder="Enter password (min 8 chars)"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black rounded-2xl py-4.5 text-lg font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : "REGISTER"}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="text-orange-600 dark:text-orange-500 hover:underline text-base font-black tracking-wide block py-2"
          >
            ALREADY HAVE AN ACCOUNT? LOG IN
          </Link>
        </div>

      </div>

      <div className="text-center text-xs text-zinc-400 dark:text-zinc-600 font-bold uppercase tracking-widest py-4">
        Mobile Sunlight Optimized • Simple UX
      </div>
    </div>
  );
}

