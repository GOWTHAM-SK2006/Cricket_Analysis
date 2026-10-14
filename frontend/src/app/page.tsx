"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Zap, Shield, Trophy, Target, Activity, TrendingUp, Users, ChevronDown } from "lucide-react";

/* === Particle Background === */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const COLORS = ["#D4AF37", "#E5A93C", "#FCE8B2", "#B8860B", "#ffffff"];
    const COUNT = 70;
    type Particle = { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string };
    const particles: Particle[] = [];

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.3, alpha: Math.random() * 0.5 + 0.15,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha; ctx.fill(); ctx.globalAlpha = 1;
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = "#D4AF37"; ctx.globalAlpha = (1 - dist / 120) * 0.08; ctx.lineWidth = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

/* === Animated Counter === */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(target / (1800 / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); } else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* === Feature Card === */
function FeatureCard({ icon: Icon, title, desc, delay, gradient }: {
  icon: React.ElementType; title: string; desc: string; delay: number; gradient: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl border border-white/8 bg-[#12141D]/80 backdrop-blur-sm p-6 hover:border-[#D4AF37]/40 transition-all duration-500 hover:shadow-xl hover:shadow-[#D4AF37]/10 overflow-hidden cursor-default"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 70%)" }} />
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${gradient}`}>
        <Icon className="w-6 h-6 text-[#090A0E]" />
      </div>
      <h3 className="text-base font-black text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-[#9CA3AF] leading-relaxed">{desc}</p>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}

/* === Stat Card === */
function StatCard({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, scale: 0.85 }} animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: "backOut" }}
      className="flex flex-col items-center gap-1 p-6 rounded-2xl border border-white/8 bg-[#12141D]/60 hover:border-[#D4AF37]/30 transition-colors duration-300"
    >
      <span className="text-4xl sm:text-5xl font-black text-[#D4AF37] tracking-tight">
        <AnimatedCounter target={value} suffix={suffix} />
      </span>
      <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest text-center">{label}</span>
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const springY = useSpring(heroY, { stiffness: 60, damping: 20 });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");
      if (token) {
        if (role === "admin") router.replace("/admin/dashboard");
        else router.replace("/dashboard");
      }
    }
  }, [router]);

  const features = [
    { icon: BarChart3, title: "Deep Performance Analytics", desc: "Drill into every stat — runs, wickets, economy, strike rates — visualised in real-time dashboards.", gradient: "bg-gradient-to-br from-[#E5A93C] to-[#B8860B]", delay: 0 },
    { icon: Target, title: "Training Optimisation", desc: "Identify exactly what each player needs to improve with data-driven training recommendations.", gradient: "bg-gradient-to-br from-[#D4AF37] to-[#A17E1A]", delay: 0.08 },
    { icon: Zap, title: "Instant AI Insights", desc: "Get actionable coaching insights powered by machine learning — no more guesswork.", gradient: "bg-gradient-to-br from-[#FCE8B2] to-[#D4AF37]", delay: 0.16 },
    { icon: TrendingUp, title: "Progress Tracking", desc: "Monitor player growth across seasons with rich trend graphs and milestone tracking.", gradient: "bg-gradient-to-br from-[#E5A93C] to-[#D4AF37]", delay: 0.24 },
    { icon: Users, title: "Team Management", desc: "Manage entire squads, compare player profiles, and build smarter selection strategies.", gradient: "bg-gradient-to-br from-[#D4AF37] to-[#B8860B]", delay: 0.32 },
    { icon: Shield, title: "Secure & Private", desc: "Enterprise-grade security ensures your coaching data stays private and protected at all times.", gradient: "bg-gradient-to-br from-[#B8860B] to-[#A17E1A]", delay: 0.40 },
  ];

  return (
    <div className="min-h-screen bg-[#090A0E] text-[#F3F4F6] selection:bg-[#D4AF37]/25 font-sans flex flex-col overflow-x-hidden">

      {/* NAV */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed w-full z-50 top-0 border-b border-white/8 bg-[#090A0E]/85 backdrop-blur-xl"
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-9 flex-shrink-0">
              <Image src="/cpi-logo.png" alt="CPI" fill className="object-contain" priority />
            </div>
            <span className="text-lg font-black tracking-tight text-white">CPI <span className="text-[#D4AF37]">Analytics</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs font-bold text-[#9CA3AF] hover:text-white transition-colors uppercase tracking-wider">Log in</Link>
            <Link href="/signup"
              className="h-9 px-5 rounded-xl text-xs font-black text-[#090A0E] inline-flex items-center justify-center gap-1.5 transition-all hover:shadow-lg hover:shadow-[#D4AF37]/30 hover:scale-[1.04] cursor-pointer"
              style={{ background: "linear-gradient(135deg, #FCE8B2 0%, #E5A93C 30%, #D4AF37 60%, #B8860B 100%)" }}
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
        <ParticleField />
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full bg-[#D4AF37]/6 blur-[120px]" />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#E5A93C]/5 blur-[90px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-[#B8860B]/5 blur-[90px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-[#D4AF37]/6" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#D4AF37]/5" />
        </div>
        {/* Floating info badges */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute hidden lg:flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4AF37]/25 bg-[#12141D]/90 backdrop-blur-md text-xs font-black text-[#D4AF37] shadow-lg top-32 left-12 animate-[floatBadge_4s_ease-in-out_infinite]">
          <Activity className="w-3.5 h-3.5" /> Live Analytics
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.35, duration: 0.6 }}
          className="absolute hidden lg:flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4AF37]/25 bg-[#12141D]/90 backdrop-blur-md text-xs font-black text-[#D4AF37] shadow-lg top-40 right-12 animate-[floatBadge_4s_ease-in-out_1.5s_infinite]">
          <Zap className="w-3.5 h-3.5" /> AI-Powered
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5, duration: 0.6 }}
          className="absolute hidden lg:flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4AF37]/25 bg-[#12141D]/90 backdrop-blur-md text-xs font-black text-[#D4AF37] shadow-lg bottom-40 left-16 animate-[floatBadge_4s_ease-in-out_3s_infinite]">
          <Trophy className="w-3.5 h-3.5" /> Tournament Ready
        </motion.div>

        <motion.div style={{ y: springY, opacity: heroOpacity }} className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Live badge */}
          <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2, ease: "backOut" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#FCE8B2] text-xs font-black mb-7 shadow-lg shadow-[#D4AF37]/10"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]" />
            </span>
            Platform v1.0 Live
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-6 text-white leading-[1.05]"
          >
            Cricket&nbsp;Performance
            <br />
            <span style={{ background: "linear-gradient(135deg, #FCE8B2 0%, #E5A93C 35%, #D4AF37 60%, #B8860B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Intelligence&nbsp;(CPI)
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl text-[#9CA3AF] max-w-2xl mx-auto mb-10 font-semibold leading-relaxed"
          >
            Are we training properly? If not, what must we do better?{" "}
            <br className="hidden sm:inline" />
            <span className="text-[#FCE8B2]/80">The premier analytics platform designed for cricket coaches.</span>
          </motion.p>

          {/* CTA buttons */}
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/signup" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
              className="group relative h-14 px-9 rounded-2xl text-base font-black text-[#090A0E] inline-flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl hover:shadow-[#D4AF37]/40 cursor-pointer overflow-hidden"
              style={{ background: "linear-gradient(135deg, #FCE8B2 0%, #E5A93C 30%, #D4AF37 60%, #B8860B 100%)" }}
            >
              <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
              <span className="relative z-10">Start Coaching Now</span>
              <motion.span animate={{ x: hovered ? 4 : 0 }} transition={{ type: "spring", stiffness: 300 }} className="relative z-10">
                <ArrowRight className="w-5 h-5" />
              </motion.span>
            </Link>
            <Link href="/login"
              className="h-14 px-9 rounded-2xl text-base font-black text-[#D4AF37] border border-[#D4AF37]/35 inline-flex items-center justify-center gap-2 bg-[#D4AF37]/8 backdrop-blur-sm hover:bg-[#D4AF37]/15 hover:border-[#D4AF37]/60 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-[#D4AF37]/15 cursor-pointer"
            >Log In</Link>
          </motion.div>

          {/* Scroll hint */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.8 }} className="mt-16 flex flex-col items-center gap-2 text-[#6B7280]">
            <span className="text-xs font-bold uppercase tracking-widest">Discover More</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
              <ChevronDown className="w-5 h-5 text-[#D4AF37]/60" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="relative py-20 px-6 border-y border-white/6">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, #090A0E 0%, #0E1018 50%, #090A0E 100%)" }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard value={500} suffix="+" label="Coaches Onboard" delay={0} />
            <StatCard value={10000} suffix="+" label="Sessions Analysed" delay={0.1} />
            <StatCard value={98} suffix="%" label="Satisfaction Rate" delay={0.2} />
            <StatCard value={50} suffix="+" label="Teams Using CPI" delay={0.3} />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-14">
            <span className="inline-block px-4 py-1 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/8 text-[#D4AF37] text-xs font-black uppercase tracking-widest mb-4">Platform Features</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Everything a coach needs,{" "}
              <span style={{ background: "linear-gradient(135deg, #FCE8B2, #D4AF37, #B8860B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>all in one place.</span>
            </h2>
            <p className="text-[#9CA3AF] text-base sm:text-lg max-w-2xl mx-auto font-semibold leading-relaxed">Stop guessing. Start coaching with clarity and confidence backed by real data.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(9,10,14,0) 60%)" }} />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
        </div>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/8">
            <Trophy className="w-4 h-4 text-[#D4AF37]" /><span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest">Join the best coaches</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-5 leading-tight">
            Ready to transform{" "}
            <span style={{ background: "linear-gradient(135deg, #FCE8B2, #D4AF37, #B8860B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>your coaching?</span>
          </h2>
          <p className="text-[#9CA3AF] text-base sm:text-lg font-semibold mb-10 leading-relaxed">Join hundreds of cricket coaches already using CPI to gain a competitive edge.</p>
          <Link href="/signup"
            className="group relative h-14 px-10 rounded-2xl text-base font-black text-[#090A0E] inline-flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-[1.06] hover:shadow-2xl hover:shadow-[#D4AF37]/40 cursor-pointer overflow-hidden"
            style={{ background: "linear-gradient(135deg, #FCE8B2 0%, #E5A93C 30%, #D4AF37 60%, #B8860B 100%)" }}
          >
            <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
            <span className="relative z-10">Get Started Free</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/8 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-7 flex-shrink-0"><Image src="/cpi-logo.png" alt="CPI" fill className="object-contain" /></div>
            <span className="text-sm font-black text-[#6B7280]">CPI Analytics</span>
          </div>
          <p className="text-xs text-[#4B5563] font-semibold">© {new Date().getFullYear()} Cricket Performance Intelligence. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-xs text-[#6B7280] hover:text-[#D4AF37] transition-colors font-bold">Log In</Link>
            <Link href="/signup" className="text-xs text-[#6B7280] hover:text-[#D4AF37] transition-colors font-bold">Sign Up</Link>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
