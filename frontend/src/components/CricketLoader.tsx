"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface CricketLoaderProps {
  message?: string;
  subtext?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  showSubtext?: boolean;
  className?: string;
}

export default function CricketLoader({
  message = "Loading Squad...",
  subtext = "Cricket Performance Index",
  fullScreen = false,
  size = "md",
  showSubtext = false,
  className = "",
}: CricketLoaderProps) {
  const iconSize = size === "sm" ? "w-6 h-6" : size === "lg" ? "w-10 h-10" : "w-8 h-8";

  const content = (
    <div className="flex flex-col items-center justify-center text-center select-none space-y-3">
      {/* Normal Spinning Circle Spinner */}
      <div className="relative flex items-center justify-center">
        <Loader2 className={`${iconSize} text-orange-500 animate-spin stroke-[2.5]`} />
      </div>

      {/* Loading Text & Bouncing Dots */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
          <span className={`font-extrabold uppercase tracking-widest text-[11px] ${fullScreen ? "text-slate-800 dark:text-slate-100" : "text-slate-700 dark:text-slate-200"}`}>
            {message}
          </span>
          <span className="flex gap-0.5 ml-0.5">
            {[0, 1, 2].map((dot) => (
              <motion.span
                key={dot}
                className="w-1 h-1 bg-orange-500 rounded-full inline-block"
                animate={{
                  y: ["0%", "-50%", "0%"],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: dot * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </span>
        </div>

        {/* Optional Subtext Badge */}
        {showSubtext && subtext && (
          <div className="mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-[8.5px] tracking-wider uppercase">
            <span className="w-1 h-1 rounded-full bg-orange-500 animate-ping" />
            {subtext}
          </div>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 ${className}`}>
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl flex flex-col items-center">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full flex items-center justify-center py-6 ${className}`}>
      {content}
    </div>
  );
}
