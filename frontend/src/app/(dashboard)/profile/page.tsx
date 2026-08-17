"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Loader2, LogOut, User, Sun, Moon, HelpCircle, FileText, Download, Upload, Edit2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CricketLoader from "@/components/CricketLoader";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("CPI CRICKET ACADEMY");
  const [isEditingCompany, setIsEditingCompany] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setRole(storedRole);

    const storedTheme = (localStorage.getItem("theme") as "light" | "dark") || "light";
    setTheme(storedTheme);

    api.get("/profile")
      .then((res) => {
        setProfile(res.data);
        const savedAvatar = localStorage.getItem(`profileAvatar_${res.data.id || 'default'}`);
        if (savedAvatar) {
          setCustomAvatar(savedAvatar);
        }
        const savedCompany = localStorage.getItem(`companyName_${res.data.id || 'default'}`);
        setCompanyName(savedCompany || res.data.organizationName || res.data.companyName || "CPI CRICKET ACADEMY");
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

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCustomAvatar(base64);
        localStorage.setItem(`profileAvatar_${profile?.id || 'default'}`, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadPicture = async () => {
    try {
      const avatarSrc = customAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || "User")}&background=ffedd5&color=ea580c&font-size=0.45&bold=true`;
      
      if (avatarSrc.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = avatarSrc;
        link.download = `${(profile?.name || "profile").toLowerCase().replace(/\s+/g, "_")}_picture.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const response = await fetch(avatarSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(profile?.name || "profile").toLowerCase().replace(/\s+/g, "_")}_picture.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download picture", err);
    }
  };

  const saveCompanyName = () => {
    setIsEditingCompany(false);
    localStorage.setItem(`companyName_${profile?.id || 'default'}`, companyName);
  };

  if (loading) {
    return <CricketLoader message="Loading Profile..." />;
  }

  const avatarUrl = customAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || "User")}&background=ffedd5&color=ea580c&font-size=0.45&bold=true`;

  return (
    <div className="space-y-6 pb-12 select-none text-center">
      
      <div className="space-y-2">
        <h1 className="text-zinc-500 font-black tracking-widest text-xs uppercase">USER DETAILS</h1>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">MY PROFILE</h2>
      </div>

      {profile && (
        <div className="space-y-6">
          
          {/* Avatar and Primary Details */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-4">
            <div className="relative w-24 h-24 mx-auto group">
              <img
                src={avatarUrl}
                alt={profile.name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-200 shadow-sm"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePictureUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Picture Actions */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer border border-slate-200"
              >
                <Upload className="w-3.5 h-3.5" />
                Change Picture
              </button>
              <button
                onClick={handleDownloadPicture}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs transition-all cursor-pointer border border-orange-200"
              >
                <Download className="w-3.5 h-3.5" />
                Download Picture
              </button>
            </div>

            <div className="space-y-1 pt-2">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
                {profile.name}
              </h3>
              
              {/* Company Name */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {isEditingCompany ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="px-2.5 py-1 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg uppercase text-center focus:outline-none focus:border-orange-500"
                      autoFocus
                    />
                    <button
                      onClick={saveCompanyName}
                      className="p-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 cursor-pointer"
                      title="Save Company Name"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      {companyName}
                    </p>
                    <button
                      onClick={() => setIsEditingCompany(true)}
                      className="text-zinc-400 hover:text-orange-500 transition-colors p-0.5 cursor-pointer"
                      title="Edit Company Name"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details & Settings Card */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 text-left">
            <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">EMAIL ADDRESS</span>
              <span className="text-sm font-bold text-slate-900 lowercase tracking-tight">{profile.email?.toLowerCase()}</span>
            </div>

            {/* Theme Selection */}
            <div className="space-y-2 py-2.5 border-b border-slate-200">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-widest block">THEME SELECTION</span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => toggleTheme("light")}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-black text-sm uppercase transition-all cursor-pointer ${
                    theme === "light"
                      ? "bg-white text-black border-white shadow-md"
                      : "bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-900"
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
                      : "bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-900"
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
              className="flex items-center justify-between py-3 text-orange-500 hover:text-orange-400 transition-colors font-black text-sm uppercase border-b border-slate-200"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                HELP & INFORMATION
              </span>
              <span className="text-xs font-black text-zinc-500">READ GUIDE &rarr;</span>
            </Link>

            {/* Terms Link */}
            <Link
              href="/terms"
              className="flex items-center justify-between py-3 text-orange-500 hover:text-orange-400 transition-colors font-black text-sm uppercase"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                TERMS & CONDITIONS
              </span>
              <span className="text-xs font-black text-zinc-500">VIEW TERMS &rarr;</span>
            </Link>
          </div>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl py-4 text-base font-black flex items-center justify-center gap-2.5 transition-all border border-red-600 shadow-lg shadow-red-600/25 cursor-pointer uppercase tracking-wider"
          >
            <LogOut className="w-5 h-5 stroke-[2.5]" />
            <span>SIGN OUT / EXIT</span>
          </button>

        </div>
      )}

    </div>
  );
}
