"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, LogOut, User, Sun, Moon, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setRole(storedRole);

    const storedTheme = (localStorage.getItem("theme") as "light" | "dark") || "light";
    setTheme(storedTheme);

    api.get("/profile")
      .then((res) => {
        setProfile(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load profile details", err);
        setLoading(false);
      });
  }, []);

  const toggleTheme = (targetTheme: "light" | "dark") => {
    setTheme(targetTheme);
    localStorage.setItem("theme", targetTheme);
    if (targetTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    sessionStorage.clear();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-wider text-xs">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 select-none text-center">
      
      <div className="space-y-2">
        <h1 className="text-zinc-500 font-black tracking-widest text-xs uppercase">USER DETAILS</h1>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">MY PROFILE</h2>
      </div>

      {profile && (
        <div className="space-y-6">
          
          {/* Avatar and Primary Details */}
          <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-6 space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-orange-500">
              <User className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">
                {profile.name}
              </h3>
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                {role === "player" ? "ACADEMY PLAYER" : "COACHING STAFF"}
              </p>
            </div>
          </div>

          {/* Details & Settings Card */}
          <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5 space-y-4 text-left">
            <div className="flex justify-between items-center py-2.5 border-b border-zinc-900">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">EMAIL ADDRESS</span>
              <span className="text-sm font-bold text-white uppercase tracking-tight">{profile.email}</span>
            </div>

            {/* Theme Selection */}
            <div className="space-y-2 py-2.5 border-b border-zinc-900">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-widest block">THEME SELECTION</span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => toggleTheme("light")}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-black text-sm uppercase transition-all cursor-pointer ${
                    theme === "light"
                      ? "bg-white text-black border-white shadow-md"
                      : "bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  LIGHT MODE
                </button>
                <button
                  onClick={() => toggleTheme("dark")}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-black text-sm uppercase transition-all cursor-pointer ${
                    theme === "dark"
                      ? "bg-white text-black border-white shadow-md"
                      : "bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  DARK MODE
                </button>
              </div>
            </div>

            {/* Help Link */}
            <Link
              href="/help"
              className="flex items-center justify-between py-3 text-orange-500 hover:text-orange-400 transition-colors font-black text-sm uppercase"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                HELP & INFORMATION
              </span>
              <span className="text-xs font-black text-zinc-500">READ GUIDE &rarr;</span>
            </Link>
          </div>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-650 hover:bg-red-750 text-white rounded-2xl py-5 text-xl font-extrabold flex items-center justify-center gap-3 transition-all border border-red-500 shadow-md cursor-pointer"
          >
            <LogOut className="w-6 h-6" />
            SIGN OUT / EXIT
          </button>

        </div>
      )}

    </div>
  );
}
