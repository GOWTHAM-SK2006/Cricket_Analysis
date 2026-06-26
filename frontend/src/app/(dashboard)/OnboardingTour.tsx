"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  Target,
  Users,
  History as HistoryIcon,
  HelpCircle,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  UserPlus,
  ListChecks
} from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  targetId?: string;
  iconName: string;
}

interface OnboardingTourProps {
  role: string;
  page?: "dashboard" | "players";
  onFinish: () => void;
}

/* ─────────────── DASHBOARD TOURS ─────────────── */
const COACH_DASHBOARD_STEPS: TourStep[] = [
  {
    title: "Welcome to CPI",
    description: "Welcome to Cricket Performance Index. This dashboard helps you monitor your squad and improve every player's practice and match performance.",
    iconName: "welcome"
  },
  {
    title: "Today's Snapshot",
    description: "View your squad summary — Total Players, Average PPI, Average MPI, and Average CPI at a glance.",
    targetId: "tour-snapshot",
    iconName: "snapshot"
  },
  {
    title: "Quick Actions",
    description: "Start a Practice Assessment or Match Assessment quickly from here.",
    targetId: "tour-quick-actions",
    iconName: "actions"
  },
  {
    title: "Add Player",
    description: "Add new players to your squad. Every player automatically receives a unique invitation code.",
    targetId: "tour-add-player",
    iconName: "add"
  },
  {
    title: "Players Tab",
    description: "View all players, search, filter, compare performances, and open detailed player profiles.",
    targetId: "nav-players",
    iconName: "players"
  },
  {
    title: "History Tab",
    description: "Review previous assessments and track improvement over time.",
    targetId: "nav-history",
    iconName: "history"
  },
  {
    title: "Help & Information",
    description: "Open the Help page anytime to understand every score, index, and feature.",
    targetId: "nav-help",
    iconName: "help"
  },
  {
    title: "You're all set!",
    description: "Start assessing players and help them improve every practice.",
    iconName: "finish"
  }
];

const PLAYER_DASHBOARD_STEPS: TourStep[] = [
  {
    title: "Welcome to CPI",
    description: "CPI helps you understand where you are, where you came from, and what you need to improve.",
    iconName: "welcome"
  },
  {
    title: "Self Assessment",
    description: "Complete your self-assessment after practice to reflect on your own performance.",
    targetId: "tour-self-assessment",
    iconName: "actions"
  },
  {
    title: "Current Status",
    description: "View your latest CPI, PPI, and MPI scores here.",
    targetId: "tour-snapshot",
    iconName: "snapshot"
  },
  {
    title: "Coach Feedback",
    description: "Read your coach's latest comments and recommendations.",
    targetId: "tour-coach-feedback",
    iconName: "welcome"
  },
  {
    title: "Last 5 Practice Sessions",
    description: "Review your recent PPI scores to see how your practice is progressing.",
    targetId: "tour-last-ppi",
    iconName: "snapshot"
  },
  {
    title: "Last 5 Match Sessions",
    description: "Review your recent MPI scores and compare them with your practice.",
    targetId: "tour-last-mpi",
    iconName: "snapshot"
  },
  {
    title: "History Tab",
    description: "View all your previous assessments and performance records.",
    targetId: "nav-history",
    iconName: "history"
  },
  {
    title: "Help & Information",
    description: "Learn what every index and score means using the built-in guide.",
    targetId: "nav-help",
    iconName: "help"
  },
  {
    title: "You're ready!",
    description: "Focus on improving your practice every day and let your CPI reflect your progress.",
    iconName: "finish"
  }
];

/* ─────────────── PLAYERS PAGE TOURS ─────────────── */
const COACH_PLAYERS_STEPS: TourStep[] = [
  {
    title: "Your Squad",
    description: "This is your squad page. Every player you've added appears here with their live CPI, PPI, and MPI scores.",
    iconName: "players"
  },
  {
    title: "Search Players",
    description: "Quickly find a player by name or role. Search is instant and case-insensitive.",
    targetId: "tour-search",
    iconName: "search"
  },
  {
    title: "Filter & Sort",
    description: "Filter by role or sort by CPI, PPI, or MPI. Focus on top performers or players needing attention.",
    targetId: "tour-filter",
    iconName: "filter"
  },
  {
    title: "Add a Player",
    description: "Tap the orange + button to add a new player. They'll get a unique invite code to activate their account.",
    targetId: "tour-add-player-btn",
    iconName: "add"
  },
  {
    title: "Player Cards",
    description: "Tap any player card to open their full profile — assessment history, scores, trends, and coaching notes.",
    targetId: "tour-player-list",
    iconName: "list"
  },
  {
    title: "You're good to go!",
    description: "Start by tapping a player to open their profile and record your first assessment.",
    iconName: "finish"
  }
];

const PLAYER_PLAYERS_STEPS: TourStep[] = [
  {
    title: "Your Profile",
    description: "This is your player profile page showing your complete performance history and scores.",
    iconName: "players"
  },
  {
    title: "Your Scores",
    description: "View your CPI, PPI, and MPI scores. These update every time a new assessment is recorded.",
    targetId: "tour-snapshot",
    iconName: "snapshot"
  },
  {
    title: "Assessment History",
    description: "Scroll down to see your last 5 Practice and Match assessment scores with dates.",
    targetId: "tour-last-ppi",
    iconName: "history"
  },
  {
    title: "You're all set!",
    description: "Keep checking back after each practice and match to track your progress.",
    iconName: "finish"
  }
];

/* ─────────────── COMPONENT ─────────────── */
export default function OnboardingTour({ role, page = "dashboard", onFinish }: OnboardingTourProps) {
  const steps =
    page === "players"
      ? role === "player"
        ? PLAYER_PLAYERS_STEPS
        : COACH_PLAYERS_STEPS
      : role === "player"
      ? PLAYER_DASHBOARD_STEPS
      : COACH_DASHBOARD_STEPS;

  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const step = steps[currentStep];
    if (step && step.targetId) {
      const el = document.getElementById(step.targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const updateRect = () => setHighlightRect(el.getBoundingClientRect());
        updateRect();
        const timer = setTimeout(updateRect, 300);
        window.addEventListener("scroll", updateRect, { passive: true });
        window.addEventListener("resize", updateRect);
        return () => {
          window.removeEventListener("scroll", updateRect);
          window.removeEventListener("resize", updateRect);
          clearTimeout(timer);
        };
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightRect(null);
    }
  }, [currentStep, steps, windowWidth]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else handleComplete();
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleComplete = () => {
    if (page === "players") {
      localStorage.setItem("cpi_players_tour_completed", "true");
    } else {
      localStorage.setItem("cpi_onboarding_completed", "true");
    }
    onFinish();
  };

  const currentStepData = steps[currentStep];
  if (!currentStepData) return null;

  const padding = 12;
  const x = highlightRect ? highlightRect.left - padding : 0;
  const y = highlightRect ? highlightRect.top - padding : 0;
  const width = highlightRect ? highlightRect.width + padding * 2 : 0;
  const height = highlightRect ? highlightRect.height + padding * 2 : 0;

  const getStepIcon = (iconName: string) => {
    const cls = "w-6 h-6";
    switch (iconName) {
      case "welcome": return <Sparkles className={`${cls} text-orange-500 animate-pulse`} />;
      case "snapshot": return <TrendingUp className={`${cls} text-orange-500`} />;
      case "actions": return <Target className={`${cls} text-orange-500`} />;
      case "add": return <UserPlus className={`${cls} text-orange-500`} />;
      case "players": return <Users className={`${cls} text-orange-500`} />;
      case "history": return <HistoryIcon className={`${cls} text-orange-500`} />;
      case "help": return <HelpCircle className={`${cls} text-orange-500`} />;
      case "search": return <Search className={`${cls} text-orange-500`} />;
      case "filter": return <Filter className={`${cls} text-orange-500`} />;
      case "list": return <ListChecks className={`${cls} text-orange-500`} />;
      case "finish": return <Trophy className={`${cls} text-yellow-500 animate-bounce`} />;
      default: return <Target className={`${cls} text-orange-500`} />;
    }
  };

  const spotlightStyle: React.CSSProperties = highlightRect
    ? {
        position: "fixed",
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.82)",
        borderRadius: "24px",
        transition: "all 420ms cubic-bezier(0.16,1,0.3,1)",
        pointerEvents: "none",
        zIndex: 998,
      }
    : {
        position: "fixed",
        left: "50%",
        top: "50%",
        width: "0px",
        height: "0px",
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.82)",
        borderRadius: "0px",
        transition: "all 420ms cubic-bezier(0.16,1,0.3,1)",
        pointerEvents: "none",
        zIndex: 998,
      };

  const getCardStyle = (): React.CSSProperties => {
    if (!highlightRect) {
      return {
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%,-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "400px",
      };
    }
    const spaceBelow = window.innerHeight - (y + height);
    const spaceAbove = y;
    let posStyle: React.CSSProperties = {};
    if (spaceBelow > 240) posStyle = { top: `${y + height + 16}px` };
    else if (spaceAbove > 240) posStyle = { bottom: `${window.innerHeight - y + 16}px` };
    else posStyle = { bottom: "100px" };
    return {
      position: "fixed",
      left: "50%",
      transform: "translateX(-50%)",
      width: "calc(100% - 32px)",
      maxWidth: "400px",
      ...posStyle,
    };
  };

  return (
    <div className="fixed inset-0 z-[999] overflow-hidden select-none font-sans">
      <style>{`
        @keyframes modalEnter {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes cardSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .tour-modal-center { animation: modalEnter 350ms cubic-bezier(0.16,1,0.3,1) forwards; }
        .tour-card-positioned { animation: cardSlideUp 300ms cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      {/* Spotlight Cutout */}
      <div style={spotlightStyle} />

      {/* Block interaction outside card */}
      <div className="fixed inset-0 bg-transparent pointer-events-auto z-[997]" />

      {/* Pulsing Orange Border */}
      {highlightRect && (
        <div
          className="fixed border-2 border-orange-500 rounded-2xl pointer-events-none z-[999]"
          style={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            boxShadow: "0 0 18px rgba(249,115,22,0.4)",
            transition: "all 420ms cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      )}

      {/* Tour Card */}
      <div
        key={`step-${currentStep}`}
        className={`bg-zinc-950/90 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 shadow-[0_0_50px_-12px_rgba(249,115,22,0.3)] pointer-events-auto flex flex-col text-left z-[1000] ${
          highlightRect ? "tour-card-positioned" : "tour-modal-center"
        }`}
        style={getCardStyle()}
      >
        {/* Progress Bar */}
        <div className="w-full bg-zinc-900/60 h-1.5 rounded-full overflow-hidden mb-4">
          <div
            className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step Counter + Skip */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
            {currentStep + 1} / {steps.length}
          </span>
          {currentStep < steps.length - 1 && (
            <button
              onClick={handleComplete}
              className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
            >
              Skip
            </button>
          )}
        </div>

        {/* Icon + Title + Description */}
        <div className="flex gap-4 items-start mb-6">
          <div className="p-3 bg-zinc-900/80 border border-zinc-800/50 rounded-2xl shrink-0">
            {getStepIcon(currentStepData.iconName)}
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight">
              {currentStepData.title}
            </h3>
            <p className="text-[12.5px] font-semibold text-zinc-400 leading-relaxed">
              {currentStepData.description}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-3 border-t border-zinc-900/80">
          <div>
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="text-xs font-black text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>
          <button
            onClick={handleNext}
            className="bg-white hover:bg-orange-500 hover:text-black text-black px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md"
          >
            {currentStep === steps.length - 1 ? "Finish" : "Next"}
            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
