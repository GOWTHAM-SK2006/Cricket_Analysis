"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  glowColor?: string;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  glowColor = "orange",
}: KpiCardProps) {
  const glowStyle =
    glowColor === "orange"
      ? "hover:border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]"
      : "hover:border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5 flex flex-col justify-between h-36 relative overflow-hidden transition-all duration-300 ${glowStyle} select-none`}
    >
      {/* Decorative background glow node */}
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-orange-500/5 blur-2xl rounded-full pointer-events-none" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase block">
            {title}
          </span>
          <span className="text-3xl font-black text-white tracking-tight uppercase">
            {value}
          </span>
        </div>

        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-orange-500">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-2">
        {subtitle}
      </div>
    </motion.div>
  );
}
