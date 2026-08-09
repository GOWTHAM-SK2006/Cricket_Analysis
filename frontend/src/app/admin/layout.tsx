"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users2,
  UserCheck,
  ClipboardList,
  BarChart3,
  FileText,
  Sliders,
  Bot,
  FileSpreadsheet,
  HelpCircle,
  Activity,
  History,
  Settings,
  LogOut,
  Search,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  Scale
} from "lucide-react";

// Toast Notification Context
interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useAdminToast = () => useContext(ToastContext);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [adminUser, setAdminUser] = useState<string>("CPI Master Admin");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("cpi_admin_token") || localStorage.getItem("jwt_token") || localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [pathname, router]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem("cpi_admin_token");
    localStorage.removeItem("token");
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("userRole");
    sessionStorage.clear();
    showToast("Logged out from CPI Master Admin Console", "info");
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Coaches", path: "/admin/coaches", icon: Users2 },
    { name: "Players Overview", path: "/admin/players", icon: UserCheck },
    { name: "Assessments Log", path: "/admin/assessments", icon: ClipboardList },
    { name: "Platform Analytics", path: "/admin/analytics", icon: BarChart3 },
    { name: "Content Management", path: "/admin/content", icon: FileText },
    { name: "Terms & Conditions", path: "/admin/terms", icon: Scale },
    { name: "Help & Information", path: "/admin/help", icon: HelpCircle },
    { name: "CPI Framework", path: "/admin/cpi-framework", icon: Sliders },
    { name: "AI Management", path: "/admin/ai", icon: Bot },
    { name: "Reports Management", path: "/admin/reports", icon: FileSpreadsheet },
    { name: "System Activity", path: "/admin/activity", icon: Activity },
    { name: "Version History", path: "/admin/versions", icon: History },
    { name: "System Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <ToastContext.Provider value={{ showToast }}>
      <div className="flex h-screen bg-slate-50 font-sans antialiased text-slate-800 overflow-hidden">
        {/* Dark Navy Sidebar */}
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 shadow-2xl z-20">
          {/* Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-600/30">
                CPI
              </div>
              <div>
                <h1 className="font-black text-white tracking-wider text-xs uppercase">CPI MASTER ADMIN</h1>
                <p className="text-[10px] text-orange-400 font-bold tracking-widest uppercase">Platform Console</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="px-3 pb-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
              Platform Modules
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? "bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
                  <span className="truncate">{item.name}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-80 shrink-0" />}
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-all group mt-3 border-t border-slate-800/80"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
              <span>Logout</span>
            </button>
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{adminUser}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">Master Administrator</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {/* Top Admin Header Bar with Global Search */}
          <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
            {/* Global Search Bar */}
            <div className="relative w-72 md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="Global Admin Search (Orgs, Coaches, Players, Content)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
              />
            </div>

          </header>

          {/* Scrollable Page Body */}
          <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
            {children}
          </main>
        </div>

        {/* Floating Toast Notification Container */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl shadow-xl text-xs font-bold border text-white transition-all ${
                toast.type === "success"
                  ? "bg-slate-900 border-emerald-500 text-emerald-100"
                  : toast.type === "error"
                  ? "bg-slate-900 border-red-500 text-red-100"
                  : "bg-slate-900 border-sky-500 text-sky-100"
              }`}
            >
              {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toast.type === "error" && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              {toast.type === "info" && <ShieldAlert className="w-4 h-4 text-sky-400 shrink-0" />}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
