"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { Home, Users, Clock, User, LogOut, Loader2, Sun, Moon, HelpCircle, Bell, Trophy, Crown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import OnboardingTour from "./OnboardingTour";
import PremiumPlansModal from "@/components/PremiumPlansModal";
import CricketLoader from "@/components/CricketLoader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"APPROVED" | "PENDING" | "REJECTED" | null>(null);
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [userName, setUserName] = useState("");
  const [showTour, setShowTour] = useState(false);
  const [tourPage, setTourPage] = useState<"dashboard" | "players">("dashboard");
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    if (!role) return;
    if (pathname === "/dashboard") {
      const done = localStorage.getItem("cpi_onboarding_completed");
      if (done !== "true") {
        setTourPage("dashboard");
        setShowTour(true);
        return;
      }
    }
    if (pathname === "/players") {
      const done = localStorage.getItem("cpi_players_tour_completed");
      if (done !== "true") {
        setTourPage("players");
        setShowTour(true);
        return;
      }
    }
    setShowTour(false);
  }, [pathname, role]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as "light" | "dark";
    const currentTheme = storedTheme || "light";
    setTheme(currentTheme);
    if (currentTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("userRole");
    setRole(storedRole);

    if (!token) {
      router.push("/login");
      return;
    }

    api.get("/profile")
      .then((res) => {
        const userEmail = (res.data.email || "").toLowerCase();
        if (res.data.role === "ADMIN" && (userEmail === "cpi@admin.com" || userEmail === "cpicoach@cpi.com")) {
          localStorage.setItem("cpi_admin_token", token);
          router.push("/admin/dashboard");
          return;
        }
        setStatus(res.data.approvalStatus || "APPROVED");
        setOrgName(res.data.organization?.name || "the Academy");
        setUserName(res.data.name || "");
        if (res.data.name) {
          localStorage.setItem("userName", res.data.name);
        }
        
        localStorage.setItem("userRole", "coach");
        setRole("coach");
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load profile", err);
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        router.push("/login");
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    sessionStorage.clear();
    router.push("/login");
  };

  if (loading) {
    return <CricketLoader fullScreen message="Loading Dashboard..." subtext="Cricket Performance Index" />;
  }

  // Bypasses Coach Pending Approval screen for Players
  const isPlayer = role === "player";
  if (!isPlayer && (status === "PENDING" || status === "REJECTED")) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-slate-900 text-center">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 space-y-6">
          <div className="relative w-20 h-24 mx-auto">
            <Image src="/cpi-logo.png" alt="CPI" fill className="object-contain" priority />
          </div>

          <h1 className="text-2xl font-black uppercase tracking-tight">
            {status === "PENDING" ? "Approval Pending" : "Request Rejected"}
          </h1>

          <p className="text-zinc-400 text-sm leading-relaxed font-bold">
            {status === "PENDING" ? (
              <>
                Your request to join <span className="text-slate-900 font-black">{orgName}</span> is pending review.
                Please contact the administrator.
              </>
            ) : (
              <>
                Your application to join <span className="text-slate-900 font-black">{orgName}</span> has been rejected.
              </>
            )}
          </p>

          <button
            onClick={handleLogout}
            className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-xl py-4 font-black transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            LOG OUT / SWITCH ACCOUNT
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { name: "HOME", path: "/dashboard", icon: Home },
    { name: "PLAYERS", path: "/players", icon: Users },
    { name: "LEADERBOARD", path: "/leaderboard", icon: Trophy },
    { name: "HELP", path: "/help", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-500/20 pb-24 font-sans">
      {/* Top Header – CPI branding left, notification + profile right */}
      <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm">
        {/* Left Side: CPI Logo + Text */}
        <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer">
          <div className="relative w-9 h-9">
            <Image src="/cpi-logo.png" alt="CPI" fill className="object-contain" />
          </div>
          <div className="leading-none">
            <span className="text-[11px] font-black tracking-wider text-slate-800 uppercase block">CRICKET</span>
            <span className="text-[11px] font-black tracking-wider text-orange-600 uppercase block">PERFORMANCE</span>
            <span className="text-[11px] font-black tracking-wider text-slate-800 uppercase block">INDEX</span>
          </div>
        </Link>

        {/* Right Side: PREMIUM Button + Notification Bell + Profile Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <button
            onClick={() => setShowPremiumModal(true)}
            id="premium-plans-header-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-[10px] sm:text-[11px] tracking-wider uppercase shadow-md shadow-orange-500/20 hover:scale-[1.03] active:scale-95 transition-all cursor-pointer border border-orange-400/50"
            title="View Premium Plans"
          >
            <Crown className="w-3.5 h-3.5 fill-black stroke-black shrink-0" />
            <span className="font-black">PREMIUM</span>
          </button>

          <button className="relative text-slate-500 hover:text-orange-600 transition-colors cursor-pointer p-1">
            <Bell className="w-5.5 h-5.5 stroke-[2]" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-orange-500 rounded-full text-[9px] font-black text-white flex items-center justify-center border-2 border-white">3</span>
          </button>
          <Link href="/profile" className="flex items-center justify-center cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-orange-300 flex items-center justify-center text-orange-700 font-black text-sm uppercase hover:border-orange-500 transition-colors shadow-sm">
              {userName ? userName.charAt(0).toUpperCase() : <User className="w-5 h-5 stroke-[2.5]" />}
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="p-4 md:p-6 max-w-3xl mx-auto">
        {children}
      </main>

      {/* Bottom 4-Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-18 bg-white border-t border-slate-200 z-40 flex items-center justify-around px-2 pb-safe shadow-lg">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              id={`nav-${tab.name.toLowerCase()}`}
              href={tab.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all ${
                isActive ? "text-orange-600 font-black" : "text-slate-400 font-bold hover:text-slate-600"
              }`}
            >
              <Icon className={`w-5.5 h-5.5 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
              <span className="text-[10px] tracking-wider uppercase font-extrabold">{tab.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-slate-400 font-semibold tracking-wide">
        © {new Date().getFullYear()} CPI – Cricket Performance Index. All rights reserved.
      </div>
      {showTour && role && (
        <OnboardingTour role={role} page={tourPage} onFinish={() => setShowTour(false)} />
      )}

      {/* Premium Plans Modal */}
      <PremiumPlansModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
}
