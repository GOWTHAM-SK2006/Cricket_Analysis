"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  Target, 
  Trophy, 
  FileBarChart, 
  LogOut, 
  Building, 
  Menu, 
  X, 
  ChevronDown,
  Sparkles
} from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface CoachProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  organization?: {
    name: string;
  };
}

export function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    api.get("/profile")
      .then((res) => {
        setProfile(res.data);
        if (res.data.role === "ADMIN") {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Teams", href: "/teams", icon: Users },
    { name: "Players", href: "/players", icon: UserSquare2 },
    { name: "Practice (PPI)", href: "/practice", icon: Target },
    { name: "Matches (MPI)", href: "/matches", icon: Trophy },
    { name: "Reports", href: "/reports", icon: FileBarChart },
  ];

  if (isAdmin) {
    navItems.push({ name: "Organization", href: "/organization", icon: Building });
  }

  const currentItem = navItems.find((item) => item.href === pathname);
  const pageTitle = currentItem ? currentItem.name : "CPI";

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.replace("/login");
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-md border-b border-white/10 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-bold text-white tracking-tight">{pageTitle}</span>
        </div>
        {/* Mobile header brand logo */}
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-9 flex-shrink-0">
            <Image
              src="/cpi-logo.png"
              alt="CPI Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-sm font-bold text-white">CPI</span>
        </div>
      </header>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={clsx(
          "w-[260px] max-w-[260px] border-r border-white/10 bg-[#060606] h-[100dvh] fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4.5 flex flex-col h-full justify-between select-none">
          {/* Top content */}
          <div className="flex flex-col flex-1 min-h-0">
            {/* Sidebar Header — CPI Logo */}
            <div className="flex items-center justify-between mb-8 px-1">
              <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 group">
                <div className="relative w-9 h-10 flex-shrink-0">
                  <Image
                    src="/cpi-logo.png"
                    alt="CPI Logo"
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-200"
                    priority
                  />
                </div>
                <div className="flex flex-col leading-none pt-0.5">
                  <span className="text-[20px] font-black tracking-tight text-white">CPI</span>
                  <span className="text-[8px] text-zinc-550 uppercase font-bold tracking-widest mt-0.5">Performance Index</span>
                </div>
              </Link>
              {/* Close button for mobile */}
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-1.5 text-zinc-400 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="space-y-1.5 overflow-y-auto flex-1 pr-1 scrollbar-none">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 text-[13px] relative overflow-hidden",
                      isActive
                        ? "bg-gradient-to-r from-orange-500/15 to-orange-650/5 border border-orange-500/20 text-orange-500 shadow-md shadow-orange-500/5 font-extrabold"
                        : "text-zinc-400 hover:bg-white/[0.03] hover:text-white border border-transparent"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-orange-500 rounded-r-full" />
                    )}
                    <item.icon className="w-[18px] h-[18px]" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Performance Excellence Banner & Coach Widget */}
          <div className="space-y-4 pt-4 border-t border-white/5 mt-auto flex-shrink-0">
            {/* Banner card */}
            <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/10 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-orange-500/5 rounded-full blur-xl" />
              <div className="flex items-center gap-2 mb-1.5">
                <Trophy className="w-4 h-4 text-orange-500" />
                <span className="text-[11px] font-black text-white uppercase tracking-wider">Performance Excellence</span>
              </div>
              <p className="text-[10px] text-zinc-450 leading-relaxed font-semibold">
                Track. Analyze. Improve. Win Consistently.
              </p>
            </div>

            {/* Profile widget */}
            <div className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-zinc-800 shrink-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-500">
                    {profile ? profile.name.substring(0, 2).toUpperCase() : "CO"}
                  </span>
                </div>
                <div className="flex flex-col min-w-0 leading-none">
                  <span className="text-xs font-extrabold text-white truncate">
                    {profile ? profile.name : "Coach"}
                  </span>
                  <span className="text-[9px] text-zinc-550 font-bold mt-1 uppercase">
                    {profile ? (profile.role === "ADMIN" ? "Admin Coach" : "Head Coach") : "Coach"}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                title="Log Out"
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
