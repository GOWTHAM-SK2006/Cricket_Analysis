"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  targetId?: string;
}

interface OnboardingTourProps {
  role: string;
  onFinish: () => void;
}

const COACH_STEPS: TourStep[] = [
  {
    title: "Welcome to CPI",
    description: "Welcome to Cricket Performance Index. This dashboard helps you monitor your squad and improve every player's practice and match performance."
  },
  {
    title: "Today's Snapshot",
    description: "View your squad summary including Total Players, Average PPI, Average MPI, and Average CPI.",
    targetId: "tour-snapshot"
  },
  {
    title: "Quick Actions",
    description: "Start a Practice Assessment or Match Assessment quickly from here.",
    targetId: "tour-quick-actions"
  },
  {
    title: "Add Player",
    description: "Add new players to your squad. Every player automatically receives a unique invitation code.",
    targetId: "tour-add-player"
  },
  {
    title: "Players",
    description: "View all players, search, filter, compare performances, and open detailed player profiles.",
    targetId: "nav-players"
  },
  {
    title: "History",
    description: "Review previous assessments and track improvement over time.",
    targetId: "nav-history"
  },
  {
    title: "Help",
    description: "Open the Help page anytime to understand every score, index, and feature.",
    targetId: "nav-help"
  },
  {
    title: "You're all set!",
    description: "Start assessing players and help them improve every practice."
  }
];

const PLAYER_STEPS: TourStep[] = [
  {
    title: "Welcome to CPI",
    description: "CPI helps you understand where you are, where you came from, and what you need to improve."
  },
  {
    title: "Self Assessment",
    description: "Complete your self-assessment after practice to reflect on your own performance.",
    targetId: "tour-self-assessment"
  },
  {
    title: "Current Status",
    description: "View your latest CPI, PPI, and MPI scores.",
    targetId: "tour-snapshot"
  },
  {
    title: "Coach Feedback",
    description: "Read your coach's latest comments and recommendations.",
    targetId: "tour-coach-feedback"
  },
  {
    title: "Last 5 Practice Sessions",
    description: "Review your recent PPI scores to see how your practice is progressing.",
    targetId: "tour-last-ppi"
  },
  {
    title: "Last 5 Match Sessions",
    description: "Review your recent MPI scores and compare them with your practice.",
    targetId: "tour-last-mpi"
  },
  {
    title: "History",
    description: "View all your previous assessments and performance records.",
    targetId: "nav-history"
  },
  {
    title: "Help & Information",
    description: "Learn what every index and score means using the built-in guide.",
    targetId: "nav-help"
  },
  {
    title: "You're ready!",
    description: "Focus on improving your practice every day and let your CPI reflect your progress."
  }
];

export default function OnboardingTour({ role, onFinish }: OnboardingTourProps) {
  const steps = role === "player" ? PLAYER_STEPS : COACH_STEPS;
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0);

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
        const updateRect = () => {
          setHighlightRect(el.getBoundingClientRect());
        };
        
        updateRect();
        window.addEventListener("scroll", updateRect, { passive: true });
        window.addEventListener("resize", updateRect);
        
        const timer = setTimeout(updateRect, 300);
        
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
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("cpi_onboarding_completed", "true");
    onFinish();
  };

  const currentStepData = steps[currentStep];
  if (!currentStepData) return null;

  const padding = 8;
  const x = highlightRect ? highlightRect.left - padding : 0;
  const y = highlightRect ? highlightRect.top - padding : 0;
  const width = highlightRect ? highlightRect.width + padding * 2 : 0;
  const height = highlightRect ? highlightRect.height + padding * 2 : 0;

  const getCardStyle = (): React.CSSProperties => {
    if (!highlightRect) {
      return {
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "calc(100% - 32px)",
        maxWidth: "400px",
      };
    }

    const spaceBelow = window.innerHeight - (y + height);
    const spaceAbove = y;

    let topStyle: React.CSSProperties = {};
    if (spaceBelow > 220) {
      topStyle = { top: `${y + height + 16}px` };
    } else if (spaceAbove > 220) {
      topStyle = { bottom: `${window.innerHeight - y + 16}px` };
    } else {
      topStyle = { bottom: "100px" };
    }

    return {
      position: "fixed",
      left: "50%",
      transform: "translateX(-50%)",
      width: "calc(100% - 32px)",
      maxWidth: "400px",
      ...topStyle,
    };
  };

  return (
    <div className="fixed inset-0 z-[999] overflow-hidden select-none font-sans">
      {/* Spotlight Overlay */}
      {highlightRect ? (
        <svg className="absolute inset-0 w-full h-full pointer-events-auto">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx="16"
                ry="16"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      ) : (
        <div className="absolute inset-0 bg-black/75 pointer-events-auto" />
      )}

      {/* Pulsing Border */}
      {highlightRect && (
        <div
          className="absolute border-2 border-orange-500 rounded-2xl pointer-events-none transition-all duration-300 animate-pulse"
          style={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
          }}
        />
      )}

      {/* Card Wrapper */}
      <div
        className="bg-zinc-950 border-2 border-orange-500 rounded-3xl p-6 shadow-2xl pointer-events-auto flex flex-col justify-between text-left transition-all duration-300 z-[1000] relative"
        style={getCardStyle()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-zinc-900 mb-3">
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
            Step {currentStep + 1} of {steps.length}
          </span>
          {currentStep < steps.length - 1 && (
            <button
              onClick={handleComplete}
              className="text-[10px] font-black text-zinc-550 hover:text-white uppercase tracking-wider cursor-pointer"
            >
              Skip Tour
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2 mb-5">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">
            {currentStepData.title}
          </h3>
          <p className="text-[13px] font-semibold text-zinc-400 leading-relaxed">
            {currentStepData.description}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center">
          <div>
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="text-xs font-black text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>
          
          <button
            onClick={handleNext}
            className="bg-white hover:bg-zinc-200 text-black px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            {currentStep === steps.length - 1 ? "Finish" : "Next"}
            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
