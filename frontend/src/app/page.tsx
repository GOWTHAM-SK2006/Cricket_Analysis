"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-500/20 font-sans">
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-9 flex-shrink-0">
              <Image
                src="/cpi-logo.png"
                alt="CPI"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">CPI Analytics</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase">
              Log in
            </Link>
            <Link
              href="/signup"
              className="h-9 px-4 rounded-xl text-xs font-black bg-orange-500 hover:bg-orange-600 text-white inline-flex items-center justify-center transition-all cursor-pointer shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-28 pb-20 px-6 relative overflow-hidden">
        {/* Abstract Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-orange-600 text-xs font-black mb-6 shadow-xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            Platform v1.0 Live
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-7xl font-black tracking-tight mb-6 text-slate-900"
          >
            Cricket Performance
            <br />
            <span className="text-orange-500 font-black px-1 inline-block">
              Intelligence (CPI)
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 font-medium leading-relaxed"
          >
            Are we training properly? If not, what must we do better?
            <br className="hidden sm:inline" />
            The premier analytics platform designed for all cricket coaches.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/signup"
              className="h-12 px-6 rounded-xl text-sm font-black bg-orange-500 hover:bg-orange-600 text-white inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              Start Coaching Now
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
