"use client";

import React from "react";
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
  // Scale multiplier: Default md is now compact and neat
  const scale = size === "sm" ? 0.75 : size === "lg" ? 1.2 : 0.85;

  const content = (
    <div className="flex flex-col items-center justify-center p-2 text-center select-none">
      {/* Compact Animated Bat & Ball Container */}
      <div className="relative w-32 h-24 flex items-center justify-center">
        {/* Glow backdrop behind bat and ball */}
        <div className="absolute w-20 h-20 bg-orange-500/10 rounded-full blur-xl animate-pulse pointer-events-none" />

        {/* Pitch Ground Line & Dynamic Shadow */}
        <div className="absolute bottom-1 w-24 h-2 flex items-center justify-center">
          <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent rounded-full" />
          <motion.div
            className="absolute w-8 h-1.5 bg-slate-900/20 dark:bg-black/40 rounded-full blur-[1px]"
            animate={{
              scaleX: [0.6, 1.4, 0.4, 0.6],
              opacity: [0.3, 0.7, 0.2, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.45, 0.7, 1],
            }}
          />
        </div>

        {/* Impact Shockwave Burst */}
        <motion.div
          className="absolute z-20 pointer-events-none"
          style={{ left: "42%", top: "46%" }}
          animate={{
            scale: [0, 0, 1.8, 0],
            opacity: [0, 1, 0, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
            times: [0, 0.42, 0.6, 1],
          }}
        >
          <div className="w-6 h-6 rounded-full border border-orange-500/80 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
        </motion.div>

        {/* Impact Spark Particles */}
        <motion.div
          className="absolute z-20 pointer-events-none"
          style={{ left: "45%", top: "48%" }}
          animate={{
            opacity: [0, 1, 0, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            times: [0, 0.44, 0.65, 1],
          }}
        >
          {[0, 72, 144, 216, 288].map((deg, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_4px_#f59e0b]"
              animate={{
                x: [0, Math.cos((deg * Math.PI) / 180) * 14],
                y: [0, Math.sin((deg * Math.PI) / 180) * 14],
                scale: [1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                times: [0.42, 0.65],
              }}
            />
          ))}
        </motion.div>

        {/* Incoming/Hit Cricket Ball */}
        <motion.div
          className="absolute z-10 w-5 h-5"
          animate={{
            x: [48, 3, -45, 48],
            y: [-30, 6, -35, -30],
            scale: [0.7, 1, 1.1, 0.7],
            rotate: [0, 360, 720, 1080],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.45, 0.85, 1],
          }}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-sm">
            <defs>
              <radialGradient id="ballGradientSmall" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="60%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </radialGradient>
            </defs>
            {/* Red Leather Ball Body */}
            <circle cx="20" cy="20" r="18" fill="url(#ballGradientSmall)" />
            {/* White Seam Stitching */}
            <path
              d="M 5 20 C 12 10, 28 10, 35 20"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeDasharray="2 1.5"
              opacity="0.9"
            />
            <path
              d="M 5 20 C 12 30, 28 30, 35 20"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeDasharray="2 1.5"
              opacity="0.9"
            />
            {/* Specular Highlight */}
            <circle cx="13" cy="13" r="4" fill="#ffffff" opacity="0.5" />
          </svg>
        </motion.div>

        {/* Animated Cricket Bat */}
        <motion.div
          className="absolute w-18 h-18 origin-bottom-right"
          animate={{
            rotate: [-28, 12, 38, -28],
            x: [-4, 2, 6, -4],
            y: [2, -1, -3, 2],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.45, 0.75, 1],
          }}
          style={{ right: "32%", bottom: "16%" }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              {/* Willow Wood Texture Gradient */}
              <linearGradient id="willowWoodSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="30%" stopColor="#fde047" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>

              {/* Rubber Grip Gradient */}
              <linearGradient id="handleGripSmall" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#c2410c" />
              </linearGradient>
            </defs>

            <g transform="rotate(-38 50 50)">
              {/* Bat Blade Body */}
              <path
                d="M 42 22 L 58 22 L 56 82 C 56 86, 44 86, 44 82 Z"
                fill="url(#willowWoodSmall)"
                stroke="#78350f"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Wood Grain Lines */}
              <path d="M 46 25 L 47 80" stroke="#b45309" strokeWidth="0.75" opacity="0.4" />
              <path d="M 50 24 L 50 81" stroke="#b45309" strokeWidth="0.75" opacity="0.4" />
              <path d="M 54 25 L 53 80" stroke="#b45309" strokeWidth="0.75" opacity="0.4" />

              {/* Sweet Spot Highlight */}
              <ellipse cx="50" cy="55" rx="5" ry="14" fill="#ffffff" opacity="0.2" />

              {/* Colored Brand Accent Stripe on Bat Shoulder */}
              <path d="M 43 28 L 57 28 L 56.5 35 L 43.5 35 Z" fill="#ea580c" opacity="0.95" />
              <path d="M 43.5 35 L 56.5 35 L 56 38 L 44 38 Z" fill="#0f172a" opacity="0.9" />

              {/* Bat Handle Cone Junction */}
              <path d="M 46 22 L 54 22 L 53 14 L 47 14 Z" fill="#78350f" />

              {/* Rubber Handle Grip */}
              <rect x="47.5" y="0" width="5" height="15" rx="2.5" fill="url(#handleGripSmall)" stroke="#9a3412" strokeWidth="0.75" />
              {/* Grip Wrap Textures */}
              <line x1="47.5" y1="3" x2="52.5" y2="3" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" />
              <line x1="47.5" y1="6" x2="52.5" y2="6" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" />
              <line x1="47.5" y1="9" x2="52.5" y2="9" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" />
              <line x1="47.5" y1="12" x2="52.5" y2="12" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" />

              {/* Colored Grip Top Knob */}
              <circle cx="50" cy="0" r="3.2" fill="#0f172a" />
            </g>
          </svg>
        </motion.div>
      </div>

      {/* Loading Text & Bouncing Dots */}
      <div className="mt-1 flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <span className="text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-xs">
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
          <div className="mt-0.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-[9px] tracking-wider uppercase">
            <span className="w-1 h-1 rounded-full bg-orange-500 animate-ping" />
            {subtext}
          </div>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 ${className}`}>
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl rounded-2xl p-6 max-w-xs w-full flex flex-col items-center">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full flex items-center justify-center py-6 ${className}`} style={{ transform: `scale(${scale})` }}>
      {content}
    </div>
  );
}
