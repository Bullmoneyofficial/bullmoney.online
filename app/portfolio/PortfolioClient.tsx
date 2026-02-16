"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, stagger, useAnimate, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// ---------- Lazy-loaded heavy components ----------
const Particles = dynamic(() => import("@/components/Particles"), { ssr: false });

// ---------- Aceternity UI ----------
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";
import { Timeline } from "@/components/ui/timeline";
import { LinkPreview } from "@/components/ui/link-preview";

// ============================================================================
// Mobile detection hook - small viewports or touch devices
// ============================================================================

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      const isSmallViewport = window.innerWidth < 768;
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setIsMobile(isSmallViewport || isTouch);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ============================================================================
// Typewriter Hook
// ============================================================================

function useTypewriter(text: string, speed = 40, startDelay = 0, trigger = true) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!trigger) { setDisplayed(""); setDone(false); return; }
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(interval); setDone(true); }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay, trigger]);

  return { displayed, done };
}

// Typewriter component that triggers on scroll into view
function TypewriterText({
  text,
  speed = 35,
  delay = 0,
  className = "",
  style = {},
  as: Tag = "span",
  cursor = true,
}: {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: any;
  cursor?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const { displayed, done } = useTypewriter(text, speed, delay, inView);

  return (
    <Tag ref={ref} className={className} style={style}>
      {displayed}
      {cursor && !done && (
        <span className="inline-block w-[3px] h-[1em] ml-1 align-middle animate-pulse"
          style={{ backgroundColor: "#3b82f6" }} />
      )}
    </Tag>
  );
}

// Animated counter
function AnimatedCounter({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = value / (duration * 60);
    const interval = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(interval); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, [inView, value, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ============================================================================
// Stagger reveal wrapper
// ============================================================================

function StaggerReveal({ children, className = "", staggerDelay = 0.08 }: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, i) => (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: i * staggerDelay, ease: [0.25, 0.4, 0.25, 1] }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

// Floating animation wrapper
function Float({ children, y = 10, duration = 4, delay = 0 }: {
  children: React.ReactNode; y?: number; duration?: number; delay?: number;
}) {
  return (
    <motion.div
      animate={{ y: [-y, y, -y] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Data
// ============================================================================

const NAV_LINKS = [
  { label: "Home", href: "/", desc: "Main landing page", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Store", href: "/store", desc: "Premium merchandise", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
  { label: "Community", href: "/community", desc: "Join the network", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Trading", href: "/trading-showcase", desc: "Live market tools", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
  { label: "Course", href: "/course", desc: "Learn to trade", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { label: "Games", href: "/games", desc: "Entertainment hub", icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" },
  { label: "Socials", href: "/socials", desc: "Connect with me", icon: "M7 20l4-16m2 16l4-16M6 9h14M4 15h14" },
  { label: "About", href: "/about?src=nav", desc: "Full about page", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

const SKILLS = [
  { name: "Full-Stack Development", pct: 95, icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  { name: "React / Next.js", pct: 97, icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { name: "TypeScript", pct: 93, icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { name: "Node.js / Python", pct: 90, icon: "M5 12h14M12 5l7 7-7 7" },
  { name: "Trading & Technical Analysis", pct: 92, icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
  { name: "UI/UX & Product Design", pct: 88, icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
  { name: "Cloud / DevOps", pct: 85, icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" },
  { name: "Business Strategy", pct: 94, icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
];

const PROJECTS = [
  {
    title: "BullMoney Online",
    subtitle: "Trading Platform",
    description: "The flagship - a full-stack trading community with live TradingView charts, VIP signals, trading journal, real-time market ticker, news feeds, and multi-language support.",
    tags: ["Next.js 16", "TypeScript", "WebSockets", "TradingView", "Framer Motion"],
    link: "/",
    gradient: "from-blue-600/20 via-cyan-600/10 to-transparent",
  },
  {
    title: "BullMoney Store",
    subtitle: "E-Commerce",
    description: "Integrated storefront with Stripe + crypto payments, product catalog, affiliate program, rewards system, and promo management. Apple-style checkout flow.",
    tags: ["Stripe", "Crypto Payments", "Affiliate System", "Rewards"],
    link: "/store",
    gradient: "from-purple-600/20 via-blue-600/10 to-transparent",
  },
  {
    title: "Trading Academy",
    subtitle: "Course Platform",
    description: "Comprehensive trading education with structured video lessons, progress tracking, quizzes, certificate generation, and a full admin CMS for content management.",
    tags: ["Video Streaming", "Progress Tracking", "Certificates", "Admin CMS"],
    link: "/designs",
    gradient: "from-emerald-600/20 via-cyan-600/10 to-transparent",
  },
  {
    title: "Community Hub",
    subtitle: "Social Network",
    description: "Real-time community with Telegram integration, live streams, news feed, trading signals, analysis sharing, and notification system. Supports 10+ languages.",
    tags: ["Telegram API", "Live Streams", "i18n", "Real-time Chat"],
    link: "/socials",
    gradient: "from-orange-600/20 via-red-600/10 to-transparent",
  },
  {
    title: "Trading Tools",
    subtitle: "Market Analysis",
    description: "Suite of professional trading tools - interactive charts, MetaTrader quotes, economic calendar, trade statistics, and automated analysis with AI-powered insights.",
    tags: ["TradingView", "MetaTrader", "AI Analysis", "Charts"],
    link: "/",
    gradient: "from-cyan-600/20 via-blue-600/10 to-transparent",
  },
  {
    title: "Games & Entertainment",
    subtitle: "Gaming Hub",
    description: "Integrated casino-style games with Dice, Mines, Plinko, Crash, and Wheel. Full wallet system with deposits, withdrawals, and leaderboards.",
    tags: ["PHP Backend", "Wallet System", "Leaderboards", "Real-time"],
    link: "/games",
    gradient: "from-pink-600/20 via-purple-600/10 to-transparent",
  },
];

const TIMELINE_DATA = [
  {
    title: "2024 - Now",
    content: (
      <div>
        <motion.h4 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-2xl font-bold text-white mb-4">
          CEO & Founder - BullMoney
        </motion.h4>
        <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-neutral-300 text-sm md:text-base leading-relaxed mb-5">
          Leading the development and vision of BullMoney - a complete trading ecosystem serving a global community.
          Built 200+ components, 65+ API endpoints, integrated crypto payments, multi-language support, and a full admin dashboard.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.2 }} className="flex flex-wrap gap-2">
          {["Next.js 16", "TypeScript", "Trading", "Leadership", "Product", "Scaling"].map((t) => (
            <span key={t} className="px-3 py-1.5 text-xs font-semibold rounded-full"
              style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" }}>
              {t}
            </span>
          ))}
        </motion.div>
      </div>
    ),
  },
  {
    title: "2022 - 2024",
    content: (
      <div>
        <motion.h4 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-2xl font-bold text-white mb-4">
          Software Engineer & Trader
        </motion.h4>
        <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-neutral-300 text-sm md:text-base leading-relaxed mb-5">
          Built production-grade applications while developing trading expertise. Mastered React, Node.js, cloud infrastructure,
          and began building algorithmic trading systems. Laid the groundwork for BullMoney.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.2 }} className="flex flex-wrap gap-2">
          {["React", "Node.js", "AWS", "Algorithms", "Markets", "Python"].map((t) => (
            <span key={t} className="px-3 py-1.5 text-xs font-semibold rounded-full"
              style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" }}>
              {t}
            </span>
          ))}
        </motion.div>
      </div>
    ),
  },
  {
    title: "2020 - 2022",
    content: (
      <div>
        <motion.h4 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-2xl font-bold text-white mb-4">
          The Beginning
        </motion.h4>
        <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-neutral-300 text-sm md:text-base leading-relaxed mb-5">
          Self-taught from zero. Spent countless hours coding, studying charts, reading documentation, and building projects from scratch.
          This relentless work ethic became the foundation for everything that followed.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.2 }} className="flex flex-wrap gap-2">
          {["JavaScript", "Python", "HTML/CSS", "Trading Basics", "Self-taught", "Discipline"].map((t) => (
            <span key={t} className="px-3 py-1.5 text-xs font-semibold rounded-full"
              style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" }}>
              {t}
            </span>
          ))}
        </motion.div>
      </div>
    ),
  },
];

// Section 1 - Hero (Full viewport, edge to edge)
// ============================================================================

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 0 : 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, isMobile ? 1 : 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, isMobile ? 1 : 0.95]);

  const roles = ["Software Engineer", "Trader", "Entrepreneur", "CEO of BullMoney"];
  const [roleIdx, setRoleIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setRoleIdx((p) => (p + 1) % roles.length), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={ref} style={{ backgroundColor: "#000000" }}
      className="relative w-full min-h-fit md:min-h-screen flex items-center md:justify-center py-6 sm:py-16 md:py-20">
      {/* Full-bleed particles */}
      <div className="absolute inset-0 z-0">
        <Particles particleCount={180} particleSpread={10} speed={0.05}
          particleColors={["#3b82f6", "#06b6d4", "#60a5fa", "#22d3ee", "#818cf8"]}
          moveParticlesOnHover particleHoverFactor={0.8} alphaParticles
          particleBaseSize={140} sizeRandomness={1.8} cameraDistance={16}
          className="!absolute !inset-0 !w-full !h-full" />
      </div>

      {/* Animated glow orbs */}
      <motion.div animate={{ x: [0, 50, 0], y: [0, -30, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="hidden md:block absolute top-1/4 left-1/5 w-[600px] h-[600px] rounded-full pointer-events-none z-[1]"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)" }} />
      <motion.div animate={{ x: [0, -40, 0], y: [0, 40, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="hidden md:block absolute bottom-1/4 right-1/5 w-[500px] h-[500px] rounded-full pointer-events-none z-[1]"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)" }} />

      {/* Edge-to-edge gradient */}
      <div className="absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 25%, transparent 65%, #000000 100%)" }} />

      {/* Grid lines subtle background */}
      <div className="absolute inset-0 z-[1] opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <motion.div style={{ y, opacity, scale }} className="relative z-10 text-center px-4 w-full max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }}>
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full mb-4 sm:mb-12"
            style={{ border: "1px solid rgba(59,130,246,0.4)", backgroundColor: "rgba(59,130,246,0.08)", backdropFilter: "blur(10px)" }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#3b82f6", boxShadow: "0 0 10px #3b82f6" }} />
            <motion.span key={roleIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}
              style={{ color: "#60a5fa" }} className="text-sm font-semibold tracking-widest uppercase">
              {roles[roleIdx]}
            </motion.span>
          </div>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-5xl sm:text-8xl md:text-[10rem] font-black tracking-tighter leading-[0.85]">
          <span style={{ color: "#ffffff" }}>Justin</span>
        </motion.h1>

        <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-2 sm:mt-4 text-2xl sm:text-5xl md:text-7xl font-black tracking-tight">
          <span style={{
            background: "linear-gradient(135deg, #60a5fa 0%, #22d3ee 35%, #a78bfa 65%, #60a5fa 100%)",
            backgroundSize: "200% 200%",
            animation: "gradientShift 4s ease infinite",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            CEO of BullMoney
          </span>
        </motion.div>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-4 sm:mt-10 text-sm sm:text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-light"
          style={{ color: "#a1a1aa" }}>
          Building the future of trading technology. Full-stack engineer by craft,
          trader by passion, entrepreneur by nature.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-6 sm:mt-14 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          <a href="#projects" className="group relative inline-flex items-center justify-center overflow-hidden rounded-full px-8 py-3 sm:px-12 sm:py-5 font-bold text-white text-base sm:text-lg transition-all duration-300">
            <span className="absolute inset-0" style={{ background: "linear-gradient(135deg, #2563eb, #0891b2)" }} />
            <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4, #3b82f6)", backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite" }} />
            <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ boxShadow: "0 0 40px rgba(59,130,246,0.6), 0 0 80px rgba(6,182,212,0.3)" }} />
            <span className="relative z-10 flex items-center gap-3">
              View My Work
              <motion.svg animate={{ y: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </span>
          </a>

          <HoverBorderGradient as="a" containerClassName="cursor-pointer"
            className="!px-12 !py-5 font-bold !text-lg"
            style={{ backgroundColor: "rgba(0,0,0,0.9)", color: "#ffffff" }}
            {...({ href: "/" } as any)}>
            Visit BullMoney &rarr;
          </HoverBorderGradient>
        </motion.div>
      </motion.div>

      {/* Scroll indicator - hidden on mobile carousel */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 2 }}
        className="hidden sm:block absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-8 h-14 rounded-full flex items-start justify-center p-2"
          style={{ border: "2px solid rgba(59,130,246,0.3)" }}>
          <motion.div animate={{ opacity: [0.2, 1, 0.2], y: [0, 8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3b82f6", boxShadow: "0 0 8px #3b82f6" }} />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================================================
// Instagram Showcase
// ============================================================================

function InstagramShowcase() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  const IG_ICONS = {
    globe: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
    crown: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
    chart: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941",
    bag: "M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
  };

  const ACCOUNT_META = [
    { handle: "bullmoney.online", label: "Online", color: "#3b82f6", icon: IG_ICONS.globe },
    { handle: "bullmoney.official", label: "Official", color: "#8b5cf6", icon: IG_ICONS.crown },
    { handle: "bullmoney.trades", label: "Trades", color: "#22c55e", icon: IG_ICONS.chart },
    { handle: "bullmoney.shop", label: "Shop", color: "#f59e0b", icon: IG_ICONS.bag },
  ];

  useEffect(() => {
    fetch("/api/instagram")
      .then((r) => r.json())
      .then((json) => setAccounts(json.accounts || []))
      .catch(() => setAccounts([]));
  }, []);

  const activeAccount = accounts[activeTab];
  const activePosts = activeAccount?.posts || [];
  const activeMeta = ACCOUNT_META[activeTab];
  const hasRealPosts = activePosts.some((p: any) => !p.isExample);

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }} className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}>
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-black" style={{ color: "#ffffff" }}>Instagram</h3>
          <p className="text-sm" style={{ color: "#71717a" }}>The BullMoney network</p>
        </div>
      </motion.div>

      {/* Account Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-6">
        {ACCOUNT_META.map((meta, i) => (
          <button key={meta.handle} onClick={() => setActiveTab(i)}
            className="relative px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2"
            style={{
              backgroundColor: activeTab === i ? `${meta.color}15` : "rgba(255,255,255,0.02)",
              border: `1px solid ${activeTab === i ? `${meta.color}40` : "rgba(255,255,255,0.06)"}`,
              color: activeTab === i ? meta.color : "#71717a",
            }}>
            <svg className="w-4 h-4" style={{ color: activeTab === i ? meta.color : "#71717a" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={meta.icon} /></svg>
            <span className="hidden sm:inline">@{meta.handle}</span>
            <span className="sm:hidden">{meta.label}</span>
            {activeTab === i && (
              <motion.div layoutId="igTabIndicator" className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ border: `1.5px solid ${meta.color}50`, boxShadow: `0 0 20px ${meta.color}15` }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            )}
          </button>
        ))}
      </motion.div>

      {/* Follow link */}
      <div className="flex items-center justify-end mb-4">
        <a href={`https://instagram.com/${activeMeta?.handle}`} target="_blank" rel="noopener noreferrer"
          className="text-sm font-bold transition-colors hover:brightness-125 flex items-center gap-1"
          style={{ color: activeMeta?.color || "#60a5fa" }}>
          Follow @{activeMeta?.handle} &rarr;
        </a>
      </div>

      {/* Posts - Instagram embeds or placeholders */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {hasRealPosts ? (
          // Real Instagram post embeds via iframes
          activePosts.filter((p: any) => !p.isExample).map((post: any, i: number) => (
            <motion.div key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${activeMeta?.color || "#3b82f6"}20` }}>
              <iframe
                src={post.embedUrl}
                className="w-full border-0"
                style={{ minHeight: "450px", background: "#000" }}
                loading="lazy"
                allowTransparency={true}
                scrolling="no"
                title={`Instagram post from @${activeAccount?.handle}`}
              />
            </motion.div>
          ))
        ) : (
          // Placeholder cards linking to the profile
          Array.from({ length: 3 }).map((_, i) => {
            const gradients = [
              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            ];
            const placeholderIcons: Record<string, string[]> = {
              "bullmoney.online": [IG_ICONS.globe, IG_ICONS.chart, IG_ICONS.crown],
              "bullmoney.official": [IG_ICONS.crown, IG_ICONS.globe, IG_ICONS.chart],
              "bullmoney.trades": [IG_ICONS.chart, IG_ICONS.bag, IG_ICONS.crown],
              "bullmoney.shop": [IG_ICONS.bag, IG_ICONS.chart, IG_ICONS.globe],
            };
            return (
              <motion.a key={i}
                href={`https://instagram.com/${activeMeta?.handle}`}
                target="_blank" rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
                whileHover={{ scale: 1.03, y: -4, transition: { duration: 0.2 } }}
                className="relative aspect-[4/3] md:aspect-square rounded-xl overflow-hidden group cursor-pointer flex items-center justify-center"
                style={{
                  background: gradients[i],
                  border: `1px solid ${activeMeta?.color || "#3b82f6"}20`,
                }}>
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3" style={{ color: activeMeta?.color || "#3b82f6" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={(placeholderIcons[activeMeta?.handle || "bullmoney.online"] || placeholderIcons["bullmoney.online"])[i]} /></svg>
                  <p className="text-white text-sm font-bold opacity-90">@{activeMeta?.handle}</p>
                  <p className="text-white/60 text-xs mt-1">View on Instagram</p>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <div className="text-center">
                    <svg className="w-8 h-8 mx-auto mb-2 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                    <span className="text-white font-bold text-sm">Open Profile</span>
                  </div>
                </div>
              </motion.a>
            );
          })
        )}
      </motion.div>

      {/* All accounts quick links */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 flex flex-wrap items-center justify-center gap-4 pt-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#3f3f46" }}>Follow All</span>
        {ACCOUNT_META.map((meta) => (
          <a key={meta.handle} href={`https://instagram.com/${meta.handle}`}
            target="_blank" rel="noopener noreferrer"
            className="text-xs font-semibold transition-all duration-200 hover:scale-105 px-3 py-1.5 rounded-lg"
            style={{ color: meta.color, backgroundColor: `${meta.color}10`, border: `1px solid ${meta.color}20` }}>
            @{meta.handle}
          </a>
        ))}
      </motion.div>
    </div>
  );
}

// ============================================================================
// Hobbies & Interests
// ============================================================================

const HOBBY_ICONS = {
  car: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.149-.504 1.174-1.125a56.729 56.729 0 00-.467-6.19L19.478 7.9A3.375 3.375 0 0016.29 5.25H7.71A3.375 3.375 0 004.522 7.9l-.955 3.534c-.347 1.283-.547 2.604-.6 3.94-.023.62.502 1.124 1.124 1.124H4.5m0 0v-4.5h15v4.5",
  football: "M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM6.262 6.072a8.25 8.25 0 1010.562-.766 4.5 4.5 0 01-1.318 1.357L14.25 7.5l.165.33a.809.809 0 01-1.086 1.085l-.604-.302a1.125 1.125 0 00-1.298.21l-.132.132a1.125 1.125 0 000 1.591l.296.296",
  trending: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941",
  run: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  people: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  paint: "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42",
  film: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25c0 .621.504 1.125 1.125 1.125M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5",
  code: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
  book: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  trophy: "M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0019.875 10.875 3.375 3.375 0 0016.5 7.5m-9 11.25v-4.5A3.375 3.375 0 014.125 10.875 3.375 3.375 0 017.5 7.5m9 0H7.5m9 0V3.375A1.125 1.125 0 0015.375 2.25h-6.75A1.125 1.125 0 007.5 3.375V7.5",
  crosshair: "M6 18L18 6M6 6l12 12",
};

const HOBBIES = [
  {
    label: "Formula 1",
    desc: "Speed, strategy & engineering at its finest",
    image: "https://images.unsplash.com/photo-1504707748692-419802cf939d?w=600&q=80",
    color: "#e11d48",
    icon: HOBBY_ICONS.car,
  },
  {
    label: "Football",
    desc: "Real Madrid - Hala Madrid y nada mas",
    image: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&q=80",
    color: "#fbbf24",
    icon: HOBBY_ICONS.football,
  },
  {
    label: "Trading",
    desc: "Forex, crypto, stocks - always in the markets",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80",
    color: "#22c55e",
    icon: HOBBY_ICONS.trending,
  },
  {
    label: "Sports & Activities",
    desc: "Staying active, competitive & outdoors",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80",
    color: "#3b82f6",
    icon: HOBBY_ICONS.run,
  },
  {
    label: "Being Social",
    desc: "Networking, meeting people & building connections",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
    color: "#a78bfa",
    icon: HOBBY_ICONS.people,
  },
  {
    label: "Graphic Design",
    desc: "Branding, visuals & creative direction",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&q=80",
    color: "#f472b6",
    icon: HOBBY_ICONS.paint,
  },
  {
    label: "Video Editing",
    desc: "Storytelling through motion & sound",
    image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&q=80",
    color: "#06b6d4",
    icon: HOBBY_ICONS.film,
  },
  {
    label: "Coding",
    desc: "Building the future, one commit at a time",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80",
    color: "#60a5fa",
    icon: HOBBY_ICONS.code,
  },
  {
    label: "Self-Improvement",
    desc: "Always learning - there is more to life",
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80",
    color: "#34d399",
    icon: HOBBY_ICONS.book,
  },
  {
    label: "Real Madrid",
    desc: "The greatest club in football history",
    image: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
    color: "#fbbf24",
    icon: HOBBY_ICONS.trophy,
    isLogo: true,
  },
];

function HobbiesGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div ref={ref}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }} className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
          <svg className="w-5 h-5" style={{ color: "#22d3ee" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={HOBBY_ICONS.crosshair} />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-black" style={{ color: "#ffffff" }}>Beyond the Code</h3>
          <p className="text-sm" style={{ color: "#71717a" }}>What drives me outside of work</p>
        </div>
      </motion.div>

      {/* Personal philosophy quote */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="text-sm italic mb-8 pl-4"
        style={{ color: "#71717a", borderLeft: "2px solid rgba(96,165,250,0.3)" }}
      >
        &ldquo;I believe there&apos;s more to life than just one thing. Stay curious, stay active, keep growing.&rdquo;
      </motion.p>

      {/* Scrolling ticker row - auto-animated */}
      <div className="relative overflow-hidden mb-8 py-2">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="flex gap-4 w-max"
        >
          {[...HOBBIES, ...HOBBIES].map((hobby, i) => (
            <div key={`ticker-${i}`}
              className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap shrink-0"
              style={{
                backgroundColor: `${hobby.color}10`,
                border: `1px solid ${hobby.color}20`,
              }}>
              <svg className="w-4 h-4 shrink-0" style={{ color: hobby.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={hobby.icon} />
              </svg>
              <span className="text-xs font-bold" style={{ color: hobby.color }}>{hobby.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Main grid - image cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {HOBBIES.map((hobby, i) => (
          <motion.div key={hobby.label}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            whileHover={{ y: -10, scale: 1.04, transition: { duration: 0.25 } }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="relative rounded-2xl overflow-hidden cursor-default group"
            style={{
              border: `1px solid ${hoveredIdx === i ? hobby.color + "40" : "rgba(255,255,255,0.06)"}`,
              transition: "border-color 0.3s",
              aspectRatio: i === 0 || i === 2 ? "3/4" : "1/1",
            }}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              {hobby.isLogo ? (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: "#0a0a0a" }}>
                  <img src={hobby.image} alt={hobby.label}
                    className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-500"
                    loading="lazy" />
                </div>
              ) : (
                <img src={hobby.image} alt={hobby.label}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy" />
              )}
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 transition-opacity duration-500"
              style={{
                background: `linear-gradient(180deg, transparent 20%, ${hobby.color}15 60%, rgba(0,0,0,0.85) 100%)`,
              }} />

            {/* Colored top line accent */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-[2px]"
              initial={{ scaleX: 0 }}
              animate={hoveredIdx === i ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 0.3 }}
              style={{ backgroundColor: hobby.color, transformOrigin: "left" }}
            />

            {/* Icon badge */}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md"
              style={{ backgroundColor: `${hobby.color}25`, border: `1px solid ${hobby.color}30` }}>
              <svg className="w-4 h-4" style={{ color: hobby.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={hobby.icon} />
              </svg>
            </div>

            {/* Text content at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <motion.p
                className="text-sm font-black tracking-wide"
                style={{ color: "#ffffff" }}
                animate={hoveredIdx === i ? { y: -2 } : { y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {hobby.label}
              </motion.p>
              <motion.p
                className="text-[11px] mt-1 leading-snug"
                style={{ color: "rgba(255,255,255,0.6)" }}
                initial={{ opacity: 0, y: 6 }}
                animate={hoveredIdx === i ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration: 0.25, delay: 0.05 }}
              >
                {hobby.desc}
              </motion.p>
            </div>

            {/* Glow effect on hover */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              animate={hoveredIdx === i ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ boxShadow: `inset 0 0 40px ${hobby.color}15, 0 0 30px ${hobby.color}10` }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Section 2 - About (Full width with animated text, Instagram, Hobbies)
// ============================================================================

function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} style={{ backgroundColor: "#000000" }} className="relative w-full min-h-fit md:min-h-[135vh] py-6 sm:py-16 md:py-36 lg:py-52 flex flex-col">
      {/* Decorative backgrounds (clipped) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[800px] md:w-[1000px] h-[300px] sm:h-[800px] md:h-[1000px] rounded-full z-[1]"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
        <div className="absolute top-0 left-0 right-0 h-px z-[5]"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.15) 20%, rgba(59,130,246,0.3) 50%, rgba(59,130,246,0.15) 80%, transparent 100%)" }} />
      </div>

      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* ---- Top: Bio + Stats (original layout) ---- */}
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-6 md:gap-24 items-center">
          <div>
            <motion.div initial={{ opacity: 0, x: -50 }} animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}>
              <span style={{ color: "#60a5fa" }} className="text-sm font-bold tracking-[0.3em] uppercase">About Me</span>
              <h2 className="mt-3 sm:mt-6 text-3xl sm:text-5xl md:text-7xl font-black leading-[1.05]" style={{ color: "#ffffff" }}>
                More Than a{" "}
                <span style={{
                  background: "linear-gradient(135deg, #60a5fa, #22d3ee, #a78bfa)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>Developer.</span>
              </h2>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}>
              <div className="mt-4 sm:mt-10 leading-relaxed text-sm sm:text-lg md:text-xl" style={{ color: "#d4d4d8" }}>
                I&apos;m a self-taught software engineer, active trader, and entrepreneur who turned a passion for technology and markets into{" "}
                <LinkPreview url="https://www.bullmoney.shop" className="!font-bold underline underline-offset-4 decoration-2 hover:no-underline transition-all text-blue-400 decoration-blue-500/40">
                  BullMoney
                </LinkPreview>{" "}
                - a complete trading ecosystem. But there&apos;s way more to me than code and charts.
              </div>
              <p className="mt-3 sm:mt-6 leading-relaxed text-sm sm:text-lg" style={{ color: "#a1a1aa" }}>
                I love sports - F1, football (Hala Madrid forever), staying active and competitive. I&apos;m into graphic design, video editing, and being social. I&apos;m always bettering my knowledge because I genuinely believe there&apos;s more to life. Every day is a chance to level up.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 sm:mt-12 flex flex-wrap gap-4">
              <MovingBorderButton borderRadius="1.5rem" containerClassName="!h-auto !w-auto"
                className="!text-base !px-8 !py-4 !font-bold"
                style={{ backgroundColor: "#000000", color: "#ffffff" }}
                as="a" {...({ href: "/socials" } as any)}>
                Socials &rarr;
              </MovingBorderButton>
              <MovingBorderButton borderRadius="1.5rem" containerClassName="!h-auto !w-auto"
                className="!text-base !px-8 !py-4 !font-bold"
                style={{ backgroundColor: "#000000", color: "#ffffff" }}
                as="a" {...({ href: "/community" } as any)}>
                Join Community
              </MovingBorderButton>
            </motion.div>
          </div>

          {/* Stats - now broader personal stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            {[
              { label: "Platform", value: "Bull", valueBold: "Money", sub: "CEO & Founder" },
              { label: "Components", value: 200, suffix: "+", sub: "Hand-crafted" },
              { label: "Markets", value: "24/7", sub: "Trading signals" },
              { label: "Countries", value: 10, suffix: "+", sub: "Explored" },
              { label: "Coffee / Day", value: 4, suffix: "☕", sub: "Fuel for building" },
              { label: "Years Coding", value: 5, suffix: "+", sub: "Self-taught" },
            ].map((stat, i) => (
              <motion.div key={stat.label}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                className="relative rounded-2xl p-4 sm:p-7 overflow-hidden cursor-default group"
                style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(59,130,246,0.12)" }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
                  style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(6,182,212,0.06))", boxShadow: "0 0 40px rgba(59,130,246,0.08) inset" }} />
                <div className="relative z-10">
                  <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "#60a5fa" }}>{stat.label}</p>
                  <p className="text-4xl font-black mt-3" style={{ color: "#ffffff" }}>
                    {typeof stat.value === "number"
                      ? <AnimatedCounter value={stat.value} suffix={stat.suffix || ""} />
                      : stat.value}{stat.valueBold && <span>{stat.valueBold}</span>}
                  </p>
                  <p className="text-sm mt-2" style={{ color: "#52525b" }}>{stat.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

// ============================================================================
// Hobbies Section (standalone)
// ============================================================================

function HobbiesSectionWrapper() {
  return (
    <section style={{ backgroundColor: "#000000" }} className="relative w-full min-h-fit md:min-h-[190vh] py-6 sm:py-16 md:py-24 lg:py-36 flex flex-col md:justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px z-[5]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.2), transparent)" }} />
      </div>
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        <HobbiesGrid />
      </div>
    </section>
  );
}

// ============================================================================
// Instagram Section (standalone)
// ============================================================================

function InstagramSectionWrapper() {
  return (
    <section style={{ backgroundColor: "#000000" }} className="relative w-full min-h-fit md:min-h-[190vh] py-6 sm:py-16 md:py-24 lg:py-36 flex flex-col md:justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px z-[5]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(240,148,51,0.2), transparent)" }} />
      </div>
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        <InstagramShowcase />
      </div>
    </section>
  );
}

// ============================================================================
// Section 2.5 - Trading Identity (Markets, Philosophy, Approach) - 3D + Animated
// ============================================================================

// SVG icon paths for trading section (no emojis)
const TRADING_ICONS = {
  forex: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  crypto: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  stocks: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  commodities: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  chart: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  book: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  trendUp: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
};

const MARKETS_TRADED = [
  { name: "Forex", pairs: "EUR/USD, GBP/USD, USD/JPY", icon: TRADING_ICONS.forex, color: "#22c55e", pct: 40 },
  { name: "Crypto", pairs: "BTC, ETH, SOL, XRP", icon: TRADING_ICONS.crypto, color: "#f59e0b", pct: 30 },
  { name: "Stocks", pairs: "US & EU Equities", icon: TRADING_ICONS.stocks, color: "#3b82f6", pct: 15 },
  { name: "Commodities", pairs: "Gold, Silver, Oil", icon: TRADING_ICONS.commodities, color: "#a78bfa", pct: 15 },
];

const TRADING_PRINCIPLES = [
  { title: "Risk Management First", desc: "Never risk more than 1-2% per trade. Capital preservation is the foundation of longevity in the markets.", icon: TRADING_ICONS.shield },
  { title: "Price Action & Structure", desc: "I trade what I see, not what I think. Clean charts, key levels, and market structure over indicators.", icon: TRADING_ICONS.chart },
  { title: "Patience Over Impulse", desc: "The best trades come to you. I wait for A+ setups and let the market confirm before entering.", icon: TRADING_ICONS.clock },
  { title: "Journal Everything", desc: "Every trade logged, every mistake reviewed. Consistency comes from self-awareness and accountability.", icon: TRADING_ICONS.book },
  { title: "Multiple Timeframe Analysis", desc: "Top-down approach: weekly for bias, daily for structure, 4H/1H for entries. Context is everything.", icon: TRADING_ICONS.search },
  { title: "Adapt or Die", desc: "Markets evolve. I study different conditions: trending, ranging, volatile, and adjust my playbook accordingly.", icon: TRADING_ICONS.refresh },
];

// 3D tilt card wrapper for trading section
function TiltCard3D({ children, className = "", style = {}, glowColor = "#22c55e" }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; glowColor?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(y * -15);
    rotateY.set(x * 15);
  }, [rotateX, rotateY]);

  const handleLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ ...style, perspective: 800, rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
      {/* 3D glow layer */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `0 20px 60px ${glowColor}15, 0 0 40px ${glowColor}08, inset 0 1px 0 rgba(255,255,255,0.05)` }}
      />
    </motion.div>
  );
}

function TradingIdentitySection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], isMobile ? [0, 0] : [80, -80]);
  const parallaxScale = useTransform(scrollYProgress, [0, 0.5, 1], isMobile ? [1, 1, 1] : [0.95, 1, 0.98]);

  return (
    <section ref={ref} style={{ backgroundColor: "#000000" }} className="relative w-full min-h-fit md:min-h-[190vh] py-6 sm:py-16 md:py-36 lg:py-48 flex flex-col md:justify-center">
      {/* Decorative backgrounds (clipped) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] z-[2]"
          style={{ backgroundImage: "linear-gradient(rgba(34,197,94,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.6) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute top-0 left-0 right-0 h-px z-[5]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.4), transparent)" }} />
        <motion.div animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="hidden sm:block absolute top-1/4 right-[10%] w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full z-[1]"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <motion.div animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="hidden sm:block absolute bottom-1/3 left-[5%] w-[250px] sm:w-[300px] h-[250px] sm:h-[300px] rounded-full z-[1]"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)", filter: "blur(30px)" }} />
      </div>

      <motion.div style={{ y: parallaxY, scale: parallaxScale }} className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* Header with 3D text effect */}
        <motion.div initial={{ opacity: 0, y: 50, rotateX: 10 }} animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
          transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }} className="mb-8 sm:mb-20"
          style={{ perspective: 1000 }}>
          <motion.span style={{ color: "#4ade80" }}
            className="text-sm font-bold tracking-[0.3em] uppercase inline-block"
            animate={inView ? { letterSpacing: "0.3em" } : { letterSpacing: "0.1em" }}
            transition={{ duration: 1.2, delay: 0.2 }}>
            The Trader
          </motion.span>
          <h2 className="mt-3 sm:mt-5 text-3xl sm:text-5xl md:text-7xl font-black" style={{ color: "#ffffff" }}>
            Trading{" "}
            <motion.span
              animate={inView ? { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] } : {}}
              transition={{ duration: 5, repeat: Infinity }}
              style={{
                background: "linear-gradient(135deg, #22c55e, #4ade80, #10b981, #22c55e)",
                backgroundSize: "300% 300%",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
              Philosophy
            </motion.span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg" style={{ color: "#a1a1aa" }}>
            Trading isn&apos;t gambling, it&apos;s a skill. I approach the markets with discipline, structure, and a relentless focus on risk management.
          </p>

          {/* Inline quote on mobile, floating detached card on desktop */}
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.8 }}
            whileHover={{ scale: 1.01, transition: { duration: 0.3 } }}
            className="mt-8 md:mt-0 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 md:w-[400px] lg:w-[480px] rounded-3xl p-8 md:p-10 relative overflow-hidden backdrop-blur-xl group z-30"
            style={{ backgroundColor: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
            {/* Animated border glow */}
            <motion.div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{ boxShadow: "inset 0 0 60px rgba(34,197,94,0.08), 0 0 40px rgba(34,197,94,0.05)" }} />
            <p className="text-base md:text-lg lg:text-xl font-light italic leading-relaxed relative z-10" style={{ color: "#d4d4d8" }}>
              &ldquo;I&apos;m a swing trader at heart with a scalper&apos;s edge. I use technical analysis, price action, and smart money concepts to read the market. No holy grail, just discipline, screen time, and constant improvement.&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", boxShadow: "0 0 20px rgba(34,197,94,0.1)" }}>
                <svg className="w-5 h-5" style={{ color: "#4ade80" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={TRADING_ICONS.trendUp} />
                </svg>
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "#ffffff" }}>Justin</p>
                <p className="text-xs" style={{ color: "#71717a" }}>CEO & Head Trader, BullMoney</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Markets breakdown - 3D perspective cards */}
        <div className="mb-8 sm:mb-20 relative">
          <motion.h3 initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 }} className="text-2xl font-black mb-8" style={{ color: "#ffffff" }}>
            Markets I Trade
          </motion.h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ perspective: 1000 }}>
            {MARKETS_TRADED.map((market, i) => (
              <TiltCard3D key={market.name} glowColor={market.color}
                className="relative rounded-2xl p-6 text-center group cursor-default"
                style={{ backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${market.color}20`, backdropFilter: "blur(10px)" }}>
                <motion.div
                  initial={{ opacity: 0, y: 40, rotateY: -20 }}
                  animate={inView ? { opacity: 1, y: 0, rotateY: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}>
                  {/* SVG icon instead of emoji */}
                  <motion.div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.15, transition: { duration: 0.4 } }}
                    style={{ backgroundColor: `${market.color}12`, border: `1px solid ${market.color}25`, boxShadow: `0 4px 20px ${market.color}10` }}>
                    <svg className="w-6 h-6" style={{ color: market.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={market.icon} />
                    </svg>
                  </motion.div>
                  <p className="font-black text-lg group-hover:scale-105 transition-transform duration-300" style={{ color: "#ffffff" }}>{market.name}</p>
                  <p className="text-xs mt-1 mb-4" style={{ color: "#71717a" }}>{market.pairs}</p>
                  {/* Animated progress bar */}
                  <div className="h-2.5 rounded-full overflow-hidden relative" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                    <motion.div initial={{ width: 0 }}
                      animate={inView ? { width: `${market.pct}%` } : {}}
                      transition={{ duration: 1.6, delay: 0.6 + i * 0.15, ease: [0.25, 0.4, 0.25, 1] }}
                      className="h-full rounded-full relative overflow-hidden"
                      style={{ backgroundColor: market.color, boxShadow: `0 0 12px ${market.color}40` }}>
                      <div className="absolute inset-0"
                        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)", backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite" }} />
                    </motion.div>
                  </div>
                  <motion.p className="text-xs font-bold mt-2"
                    animate={inView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 1.2 + i * 0.15 }}
                    style={{ color: market.color }}>{market.pct}% focus</motion.p>
                </motion.div>
              </TiltCard3D>
            ))}
          </div>
        </div>

        {/* Key trading stats - 3D floating cards */}
        <div className="mb-8 sm:mb-20">
          <motion.h3 initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 }} className="text-2xl font-black mb-8" style={{ color: "#ffffff" }}>
            By the Numbers
          </motion.h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5" style={{ perspective: 1200 }}>
            {[
              { label: "Years Trading", value: 4, suffix: "+", color: "#22c55e", icon: TRADING_ICONS.clock },
              { label: "Markets Covered", value: 4, suffix: "", color: "#3b82f6", icon: TRADING_ICONS.stocks },
              { label: "Trades Logged", value: 1000, suffix: "+", color: "#f59e0b", icon: TRADING_ICONS.book },
              { label: "VIP Members", value: 50, suffix: "+", color: "#a78bfa", icon: TRADING_ICONS.shield },
            ].map((stat, i) => (
              <motion.div key={stat.label}
                initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
                animate={inView ? { opacity: 1, scale: 1, rotateX: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
                whileHover={{ y: -10, scale: 1.05, rotateY: 5, transition: { duration: 0.3 } }}
                whileTap={{ scale: 0.97 }}
                className="rounded-2xl p-6 text-center relative overflow-hidden group cursor-default"
                style={{ backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${stat.color}15`, backdropFilter: "blur(10px)", boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}>
                {/* Hover gradient */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${stat.color}12, transparent 70%)` }} />
                {/* Icon */}
                <div className="relative z-10 w-8 h-8 mx-auto mb-3 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}10`, border: `1px solid ${stat.color}20` }}>
                  <svg className="w-4 h-4" style={{ color: stat.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                  </svg>
                </div>
                <p className="text-4xl font-black relative z-10" style={{ color: stat.color }}>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm mt-2 font-medium relative z-10" style={{ color: "#71717a" }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trading principles - staggered 3D cards */}
        <motion.h3 initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.5 }} className="text-2xl font-black mb-8" style={{ color: "#ffffff" }}>
          My Trading Rules
        </motion.h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5" style={{ perspective: 1000 }}>
          {TRADING_PRINCIPLES.map((principle, i) => (
            <motion.div key={principle.title}
              initial={{ opacity: 0, y: 40, rotateX: 10 }}
              animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
              whileHover={{ y: -8, scale: 1.03, rotateY: 3, boxShadow: "0 25px 50px rgba(34,197,94,0.1)", transition: { duration: 0.3 } }}
              whileTap={{ scale: 0.98 }}
              className="rounded-2xl p-6 group cursor-default relative overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(34,197,94,0.1)", backdropFilter: "blur(10px)" }}>
              {/* Animated gradient border on hover */}
              <motion.div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"
                style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08), transparent, rgba(34,197,94,0.04))" }} />
              {/* Top glow line */}
              <motion.div className="absolute top-0 left-0 right-0 h-px"
                initial={{ scaleX: 0 }} whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.4 }}
                style={{ background: "linear-gradient(90deg, transparent, #22c55e, transparent)", transformOrigin: "left" }} />
              <div className="flex items-start gap-4 relative z-10">
                <motion.div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  whileHover={{ rotate: 360, transition: { duration: 0.6 } }}
                  style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", boxShadow: "0 0 15px rgba(34,197,94,0.08)" }}>
                  <svg className="w-5 h-5" style={{ color: "#4ade80" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={principle.icon} />
                  </svg>
                </motion.div>
                <div>
                  <h4 className="font-bold text-base mb-2 group-hover:text-green-400 transition-colors duration-300" style={{ color: "#ffffff" }}>{principle.title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>{principle.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="mt-8 sm:mt-16 flex flex-wrap gap-4">
          <MovingBorderButton borderRadius="1.5rem" containerClassName="!h-auto !w-auto"
            className="!text-base !px-8 !py-4 !font-bold"
            style={{ backgroundColor: "#000000", color: "#ffffff" }}
            as="a" {...({ href: "/VIP" } as any)}>
            Join VIP Signals &rarr;
          </MovingBorderButton>
          <MovingBorderButton borderRadius="1.5rem" containerClassName="!h-auto !w-auto"
            className="!text-base !px-8 !py-4 !font-bold"
            style={{ backgroundColor: "#000000", color: "#ffffff" }}
            as="a" {...({ href: "/journal" } as any)}>
            Trading Journal
          </MovingBorderButton>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================================================
// Section 2.7 - Mentor & Teacher
// ============================================================================

const MENTOR_ICONS = {
  structure: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  target: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  brain: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  compass: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z",
  pencil: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  video: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  signal: "M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
  handshake: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
};

const WHAT_STUDENTS_LEARN = [
  { title: "Market Structure", desc: "How to read price, support, resistance, trend, and range identification", icon: MENTOR_ICONS.structure },
  { title: "Entry & Exit Strategy", desc: "When to enter, where to set stops, and how to manage take-profits", icon: MENTOR_ICONS.target },
  { title: "Risk Management", desc: "Position sizing, R:R ratios, and protecting your capital like a professional", icon: MENTOR_ICONS.shield },
  { title: "Trading Psychology", desc: "Controlling emotions, handling losses, and building the mindset of a disciplined trader", icon: MENTOR_ICONS.brain },
  { title: "Technical Analysis", desc: "Candlestick patterns, indicators, smart money concepts, and multi-timeframe analysis", icon: MENTOR_ICONS.compass },
  { title: "Building a Trading Plan", desc: "Creating and following a personalised strategy that fits your lifestyle and goals", icon: MENTOR_ICONS.pencil },
];

function MentorSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} style={{ backgroundColor: "#000000" }} className="relative w-full min-h-fit md:min-h-[190vh] py-6 sm:py-16 md:py-36 lg:py-48 flex flex-col md:justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px z-[5]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(251,146,60,0.3), transparent)" }} />
        <div className="hidden md:block absolute bottom-1/4 left-0 w-[600px] h-[600px] rounded-full opacity-[0.05] z-[1]"
          style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }} className="mb-6 sm:mb-12 md:mb-20">
          <span style={{ color: "#fb923c" }} className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase">The Mentor</span>
          <h2 className="mt-3 sm:mt-5 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black" style={{ color: "#ffffff" }}>
            Teaching &{" "}
            <span style={{ background: "linear-gradient(135deg, #f97316, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Mentorship
            </span>
          </h2>
          <p className="mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg" style={{ color: "#a1a1aa" }}>
            I don&apos;t just trade, I teach. Everything I&apos;ve learned, I share with the BullMoney community to help others achieve financial independence through the markets.
          </p>
        </motion.div>

        {/* Philosophy quote */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="mb-12 sm:mb-14 md:mb-16 rounded-2xl p-5 sm:p-8 md:p-12"
          style={{ backgroundColor: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.15)" }}>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-light italic leading-relaxed" style={{ color: "#d4d4d8" }}>
            &ldquo;The best way to solidify your own knowledge is to teach it. I built BullMoney&apos;s course platform and community because I believe everyone deserves access to quality trading education, not just those who can afford expensive mentorships.&rdquo;
          </p>
        </motion.div>

        {/* Mentor stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mb-12 md:mb-20">
          {[
            { label: "Students Taught", value: 200, suffix: "+", color: "#f97316" },
            { label: "Course Lessons", value: 30, suffix: "+", color: "#fbbf24" },
            { label: "Community Size", value: 500, suffix: "+", color: "#fb923c" },
            { label: "Countries Reached", value: 10, suffix: "+", color: "#f59e0b" },
          ].map((stat, i) => (
            <motion.div key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6, scale: 1.04, transition: { duration: 0.3 } }}
              whileTap={{ scale: 0.97 }}
              className="rounded-2xl p-6 text-center group cursor-default relative overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${stat.color}15` }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"
                style={{ background: `radial-gradient(circle at 50% 0%, ${stat.color}12, transparent 70%)` }} />
              <p className="text-4xl font-black relative z-10" style={{ color: stat.color }}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm mt-2 font-medium relative z-10" style={{ color: "#71717a" }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* What students learn */}
        <motion.h3 initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }} className="text-2xl font-black mb-8" style={{ color: "#ffffff" }}>
          What You&apos;ll Learn
        </motion.h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {WHAT_STUDENTS_LEARN.map((item, i) => (
            <motion.div key={item.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.6 }}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
              whileTap={{ scale: 0.98 }}
              className="rounded-2xl p-6 group cursor-default relative overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(249,115,22,0.1)" }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"
                style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.06), transparent, rgba(249,115,22,0.03))" }} />
              <div className="flex items-start gap-4 relative z-10">
                <motion.div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  whileHover={{ rotate: 360, transition: { duration: 0.6 } }}
                  style={{ backgroundColor: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
                  <svg className="w-5 h-5" style={{ color: "#fb923c" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                </motion.div>
                <div>
                  <h4 className="font-bold text-base mb-2 group-hover:text-orange-400 transition-colors duration-300" style={{ color: "#ffffff" }}>{item.title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Teaching approach cards */}
        <motion.h3 initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }} className="text-2xl font-black mb-8" style={{ color: "#ffffff" }}>
          How I Teach
        </motion.h3>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { title: "Video Courses", desc: "Structured, recorded lessons you can watch at your own pace. From beginner to advanced, covering everything from basics to complex strategies.", icon: MENTOR_ICONS.video, color: "#f97316" },
            { title: "Live Signals & Analysis", desc: "Real-time trade ideas with full breakdowns sent to VIP members. See exactly how I analyse and enter trades in real market conditions.", icon: MENTOR_ICONS.signal, color: "#fbbf24" },
            { title: "Community Support", desc: "24/7 access to a global community of traders. Ask questions, share ideas, and grow together. No question is too basic.", icon: MENTOR_ICONS.handshake, color: "#fb923c" },
          ].map((approach, i) => (
            <motion.div key={approach.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.03, transition: { duration: 0.25 } }}
              whileTap={{ scale: 0.97 }}
              className="rounded-2xl p-8 text-center group cursor-default relative overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${approach.color}15` }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"
                style={{ background: `radial-gradient(circle at 50% 30%, ${approach.color}10, transparent 70%)` }} />
              <motion.div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center relative z-10"
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.15, transition: { duration: 0.4 } }}
                style={{ backgroundColor: `${approach.color}10`, border: `1px solid ${approach.color}20`, boxShadow: `0 4px 20px ${approach.color}10` }}>
                <svg className="w-6 h-6" style={{ color: approach.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={approach.icon} />
                </svg>
              </motion.div>
              <h4 className="font-black text-lg mb-3 group-hover:text-orange-400 transition-colors duration-300 relative z-10" style={{ color: "#ffffff" }}>{approach.title}</h4>
              <p className="text-sm leading-relaxed relative z-10" style={{ color: "#a1a1aa" }}>{approach.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-8 sm:mt-16 flex flex-wrap gap-4">
          <MovingBorderButton borderRadius="1.5rem" containerClassName="!h-auto !w-auto"
            className="!text-base !px-8 !py-4 !font-bold"
            style={{ backgroundColor: "#000000", color: "#ffffff" }}
            as="a" {...({ href: "/course" } as any)}>
            Start Learning &rarr;
          </MovingBorderButton>
          <MovingBorderButton borderRadius="1.5rem" containerClassName="!h-auto !w-auto"
            className="!text-base !px-8 !py-4 !font-bold"
            style={{ backgroundColor: "#000000", color: "#ffffff" }}
            as="a" {...({ href: "/community" } as any)}>
            Join the Community
          </MovingBorderButton>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// Section 3 - Skills (Full width, more animated)
// ============================================================================

function SkillsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} style={{ backgroundColor: "#000000" }} className="relative w-full min-h-fit md:min-h-screen py-6 sm:py-16 md:py-36 lg:py-48 flex flex-col md:justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px z-[5]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.2), transparent)" }} />
        <div className="hidden sm:block absolute top-1/2 right-0 w-[300px] sm:w-[400px] md:w-[600px] h-[300px] sm:h-[400px] md:h-[600px] rounded-full opacity-[0.06] z-[1]"
          style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }} />
        <div className="hidden sm:block absolute top-1/3 left-0 w-[250px] sm:w-[300px] md:w-[400px] h-[250px] sm:h-[300px] md:h-[400px] rounded-full opacity-[0.04] z-[1]"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }} className="text-center mb-6 sm:mb-12 md:mb-20">
          <span style={{ color: "#60a5fa" }} className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase">Expertise</span>
          <h2 className="mt-3 sm:mt-5 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black" style={{ color: "#ffffff" }}>
            Skills &{" "}
            <span style={{ background: "linear-gradient(135deg, #60a5fa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Technologies
            </span>
          </h2>
          <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-lg" style={{ color: "#a1a1aa" }}>
            Years of building products and trading markets, distilled into a powerful toolkit.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-x-8 sm:gap-x-12 md:gap-x-16 gap-y-6 sm:gap-y-8 md:gap-y-10">
          {SKILLS.map((skill, i) => (
            <motion.div key={skill.name}
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <svg className="w-4 h-4" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={skill.icon} />
                  </svg>
                </div>
                <span className="font-bold text-base flex-1" style={{ color: "#e4e4e7" }}>{skill.name}</span>
                <span className="text-base font-mono font-black" style={{ color: "#60a5fa" }}>{skill.pct}%</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                <motion.div initial={{ width: 0 }}
                  animate={inView ? { width: `${skill.pct}%` } : {}}
                  transition={{ duration: 1.6, delay: 0.3 + i * 0.1, ease: [0.25, 0.4, 0.25, 1] }}
                  className="h-full rounded-full relative overflow-hidden"
                  style={{ background: "linear-gradient(90deg, #1d4ed8 0%, #0891b2 50%, #22d3ee 100%)" }}>
                  <div className="absolute inset-0"
                    style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)", backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite" }} />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Section 4 - Projects (Full width, real names, big cards)
// ============================================================================

function ProjectsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="projects" ref={ref} style={{ backgroundColor: "#000000" }} className="relative w-full min-h-fit md:min-h-[220vh] py-6 sm:py-16 md:py-36 lg:py-48 flex flex-col md:justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px z-[5]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)" }} />
      </div>

      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }} className="text-center mb-6 sm:mb-12 md:mb-20">
          <span style={{ color: "#60a5fa" }} className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase">Portfolio</span>
          <h2 className="mt-3 sm:mt-5 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black" style={{ color: "#ffffff" }}>
            What I&apos;ve{" "}
            <span style={{ background: "linear-gradient(135deg, #60a5fa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Built</span>
          </h2>
          <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-lg" style={{ color: "#a1a1aa" }}>
            Every product under BullMoney - designed, engineered, and shipped by me. From concept to production.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {PROJECTS.map((project, i) => (
            <motion.a key={project.title} href={project.link}
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              whileHover={{ y: -10, transition: { duration: 0.25 } }}
              className="group block relative rounded-2xl overflow-hidden transition-all duration-500"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(59,130,246,0.1)" }}>
              {/* Gradient top bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${project.gradient}`} />

              <div className="p-8">
                {/* Subtitle badge */}
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-5"
                  style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}>
                  {project.subtitle}
                </div>

                <h3 className="text-2xl font-black transition-colors duration-300 group-hover:text-blue-400"
                  style={{ color: "#ffffff" }}>
                  {project.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>
                  {project.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 text-[11px] font-bold rounded-full"
                      style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.15)" }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Arrow */}
                <div className="mt-6 flex items-center gap-2 transition-all duration-300 group-hover:gap-3" style={{ color: "#52525b" }}>
                  <span className="text-sm font-semibold group-hover:text-blue-400 transition-colors">Explore</span>
                  <svg className="w-4 h-4 group-hover:text-blue-400 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ boxShadow: "inset 0 0 0 1px rgba(59,130,246,0.25), 0 0 50px rgba(59,130,246,0.08)" }} />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Section 4.5 - Developer DNA (Tech stack, workflow, philosophy) - 3D + Animated
// ============================================================================

const TECH_STACK = [
  { category: "Frontend", tools: ["React", "Next.js 16", "TypeScript", "Tailwind CSS", "Framer Motion", "Three.js"], color: "#60a5fa" },
  { category: "Backend", tools: ["Node.js", "Python", "PHP/Laravel", "Express", "REST APIs", "WebSockets"], color: "#22c55e" },
  { category: "Database", tools: ["Supabase", "PostgreSQL", "MySQL", "Redis", "Firebase"], color: "#f59e0b" },
  { category: "DevOps & Cloud", tools: ["Vercel", "AWS", "Docker", "CI/CD", "Cloudflare", "Render"], color: "#a78bfa" },
  { category: "Tools", tools: ["Git/GitHub", "VS Code", "Figma", "Postman", "TradingView API", "Stripe SDK"], color: "#06b6d4" },
  { category: "Other", tools: ["SEO/Analytics", "i18n (10+ langs)", "PWA", "Web3/Crypto", "AI Integration", "Accessibility"], color: "#f472b6" },
];

const DEV_ICONS = {
  rocket: "M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z",
  palette: "M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z",
  bolt: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  chat: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z",
  code: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
  git: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  cube: "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9",
  server: "M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z",
};

const DEV_PHILOSOPHY = [
  { title: "Ship Fast, Iterate Faster", desc: "I believe in getting things live and improving based on real feedback. Perfect is the enemy of done.", icon: DEV_ICONS.rocket },
  { title: "Design-Driven Development", desc: "Every component I build starts with how it looks and feels. UI/UX isn't an afterthought, it's the starting point.", icon: DEV_ICONS.palette },
  { title: "Own the Full Stack", desc: "From database schema to pixel-perfect UI. I don't hand off work, I own the entire product lifecycle.", icon: DEV_ICONS.bolt },
  { title: "Code is Communication", desc: "Clean, readable code matters. I write for the next developer (usually future me) to understand instantly.", icon: DEV_ICONS.chat },
];

function DeveloperDNASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], isMobile ? [0, 0] : [60, -60]);
  const parallaxScale = useTransform(scrollYProgress, [0, 0.5, 1], isMobile ? [1, 1, 1] : [0.96, 1, 0.98]);

  return (
    <section ref={ref} style={{ backgroundColor: "#000000" }} className="relative w-full min-h-fit md:min-h-[190vh] py-6 sm:py-16 md:py-36 lg:py-48 flex flex-col md:justify-center">
      {/* Decorative backgrounds (clipped) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "linear-gradient(rgba(96,165,250,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.6) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
        <div className="absolute top-0 left-0 right-0 h-px z-[5]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(96,165,250,0.4), transparent)" }} />
        <motion.div animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="hidden md:block absolute top-1/3 left-[5%] w-[400px] h-[400px] rounded-full z-[1]"
          style={{ background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <motion.div animate={{ x: [0, 40, 0], y: [0, -50, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="hidden md:block absolute bottom-1/4 right-[10%] w-[350px] h-[350px] rounded-full z-[1]"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)", filter: "blur(35px)" }} />
      </div>

      <motion.div style={{ y: parallaxY, scale: parallaxScale }} className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* Header with 3D text */}
        <motion.div initial={{ opacity: 0, y: 50, rotateX: 10 }} animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
          transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }} className="mb-6 sm:mb-12 md:mb-20"
          style={{ perspective: 1000 }}>
          <motion.span style={{ color: "#60a5fa" }}
            className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase inline-block"
            animate={inView ? { letterSpacing: "0.3em" } : { letterSpacing: "0.1em" }}
            transition={{ duration: 1.2, delay: 0.2 }}>
            The Coder
          </motion.span>
          <h2 className="mt-3 sm:mt-5 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black" style={{ color: "#ffffff" }}>
            Developer{" "}
            <motion.span
              animate={inView ? { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] } : {}}
              transition={{ duration: 5, repeat: Infinity }}
              style={{
                background: "linear-gradient(135deg, #60a5fa, #a78bfa, #60a5fa)",
                backgroundSize: "300% 300%",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
              DNA
            </motion.span>
          </h2>
          <p className="mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg" style={{ color: "#a1a1aa" }}>
            Self-taught from day one. 5+ years of building real products, not tutorials. Every line of BullMoney was written by me, from the first commit to the latest deploy.
          </p>
        </motion.div>

        {/* Code stats - 3D perspective cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-12 md:mb-20" style={{ perspective: 1200 }}>
          {[
            { label: "Components Built", value: 200, suffix: "+", color: "#60a5fa", icon: DEV_ICONS.cube },
            { label: "API Endpoints", value: 65, suffix: "+", color: "#22c55e", icon: DEV_ICONS.server },
            { label: "Lines of Code", value: 100, suffix: "K+", color: "#a78bfa", icon: DEV_ICONS.code },
            { label: "Pages & Routes", value: 50, suffix: "+", color: "#f59e0b", icon: DEV_ICONS.git },
            { label: "Commits", value: 2000, suffix: "+", color: "#06b6d4", icon: DEV_ICONS.rocket },
          ].map((stat, i) => (
            <motion.div key={stat.label}
              initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
              animate={inView ? { opacity: 1, scale: 1, rotateX: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
              whileHover={{ y: -10, scale: 1.06, rotateY: 5, transition: { duration: 0.3 } }}
              whileTap={{ scale: 0.97 }}
              className="rounded-2xl p-5 text-center cursor-default group relative overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${stat.color}15`, backdropFilter: "blur(10px)", boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"
                style={{ background: `radial-gradient(circle at 50% 0%, ${stat.color}12, transparent 70%)`, boxShadow: `0 20px 40px ${stat.color}08` }} />
              <div className="w-8 h-8 mx-auto mb-3 rounded-lg flex items-center justify-center relative z-10"
                style={{ backgroundColor: `${stat.color}10`, border: `1px solid ${stat.color}20` }}>
                <svg className="w-4 h-4" style={{ color: stat.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                </svg>
              </div>
              <p className="text-3xl md:text-4xl font-black relative z-10" style={{ color: stat.color }}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-xs mt-2 font-medium relative z-10" style={{ color: "#71717a" }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tech stack grid - 3D tilt cards */}
        <motion.h3 initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.3 }} className="text-lg sm:text-2xl font-black mb-6 sm:mb-8" style={{ color: "#ffffff" }}>
          Tech Stack
        </motion.h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-12 md:mb-20" style={{ perspective: 1000 }}>
          {TECH_STACK.map((category, i) => (
            <motion.div key={category.category}
              initial={{ opacity: 0, y: 40, rotateX: 10 }}
              animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
              whileHover={{ y: -8, scale: 1.03, rotateY: 3, transition: { duration: 0.3 } }}
              whileTap={{ scale: 0.98 }}
              className="rounded-2xl p-6 group cursor-default relative overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${category.color}15`, backdropFilter: "blur(10px)" }}>
              {/* Hover gradient */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"
                style={{ background: `linear-gradient(135deg, ${category.color}08, transparent, ${category.color}04)` }} />
              {/* Top glow line */}
              <motion.div className="absolute top-0 left-0 right-0 h-px"
                initial={{ scaleX: 0 }} whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.4 }}
                style={{ background: `linear-gradient(90deg, transparent, ${category.color}, transparent)`, transformOrigin: "left" }} />
              <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4 relative z-10" style={{ color: category.color }}>{category.category}</p>
              <div className="flex flex-wrap gap-2 relative z-10">
                {category.tools.map((tool) => (
                  <motion.span key={tool}
                    whileHover={{ scale: 1.1, y: -2, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full cursor-default"
                    style={{ backgroundColor: `${category.color}10`, color: category.color, border: `1px solid ${category.color}20`, boxShadow: `0 2px 8px ${category.color}08` }}>
                    {tool}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dev philosophy - 3D animated cards */}
        <motion.h3 initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.5 }} className="text-lg sm:text-2xl font-black mb-6 sm:mb-8" style={{ color: "#ffffff" }}>
          How I Build
        </motion.h3>
        <div className="grid md:grid-cols-2 gap-4 sm:gap-5 mb-12 md:mb-16" style={{ perspective: 1000 }}>
          {DEV_PHILOSOPHY.map((item, i) => (
            <TiltCard3D key={item.title} glowColor="#60a5fa"
              className="rounded-2xl p-6 group cursor-default relative overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(96,165,250,0.1)", backdropFilter: "blur(10px)" }}>
              <motion.div
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}>
                {/* Hover gradient */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"
                  style={{ background: "linear-gradient(135deg, rgba(96,165,250,0.08), transparent, rgba(96,165,250,0.04))" }} />
                <div className="flex items-start gap-4 relative z-10">
                  <motion.div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    whileHover={{ rotate: 360, transition: { duration: 0.6 } }}
                    style={{ backgroundColor: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", boxShadow: "0 0 20px rgba(96,165,250,0.08)" }}>
                    <svg className="w-5 h-5" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                  </motion.div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 group-hover:text-blue-400 transition-colors duration-300" style={{ color: "#ffffff" }}>{item.title}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            </TiltCard3D>
          ))}
        </div>

        {/* Contribution-style visual bar with 3D flip animation */}
        <motion.div initial={{ opacity: 0, y: 30, rotateX: 5 }} animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-12 md:mb-20 relative overflow-hidden group"
          style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(96,165,250,0.1)", backdropFilter: "blur(10px)", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"
            style={{ background: "radial-gradient(circle at 50% 0%, rgba(34,197,94,0.06), transparent 70%)" }} />
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 relative z-10" style={{ color: "#60a5fa" }}>Contribution Activity</p>
          <div className="grid grid-cols-7 gap-1 relative z-10">
            {Array.from({ length: 49 }).map((_, i) => {
              const intensity = Math.random();
              const opacity = intensity < 0.2 ? 0.05 : intensity < 0.4 ? 0.15 : intensity < 0.7 ? 0.3 : intensity < 0.9 ? 0.5 : 0.8;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0, rotateY: 180 }}
                  animate={inView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
                  transition={{ delay: 0.8 + i * 0.025, duration: 0.5, ease: "backOut" }}
                  whileHover={{ scale: 1.6, y: -4, transition: { duration: 0.2 } }}
                  className="aspect-square rounded-sm cursor-default"
                  style={{ backgroundColor: `rgba(34,197,94,${opacity})`, boxShadow: opacity > 0.3 ? `0 0 8px rgba(34,197,94,${opacity * 0.3})` : "none" }}
                />
              );
            })}
          </div>
          <p className="text-xs mt-3 text-right relative z-10" style={{ color: "#52525b" }}>Building every day</p>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-8 sm:mt-16 flex flex-wrap gap-4">
          <MovingBorderButton borderRadius="1.5rem" containerClassName="!h-auto !w-auto"
            className="!text-base !px-8 !py-4 !font-bold"
            style={{ backgroundColor: "#000000", color: "#ffffff" }}
            as="a" {...({ href: "https://github.com/Bullmoneyofficial" } as any)}>
            GitHub &rarr;
          </MovingBorderButton>
          <MovingBorderButton borderRadius="1.5rem" containerClassName="!h-auto !w-auto"
            className="!text-base !px-8 !py-4 !font-bold"
            style={{ backgroundColor: "#000000", color: "#ffffff" }}
            as="a" {...({ href: "/" } as any)}>
            See It Live
          </MovingBorderButton>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================================================
// Section 5 - BullMoney Showcase (Full-bleed)
// ============================================================================

function BullMoneyShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative w-full min-h-fit md:min-h-[190vh] py-6 sm:py-16 md:py-36 lg:py-56 flex flex-col md:justify-center" style={{ backgroundColor: "#000000" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[800px] md:w-[1200px] h-[300px] sm:h-[800px] md:h-[1200px] rounded-full z-[1]"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(8,145,178,0.08) 30%, transparent 65%)" }} />
        <div className="absolute top-0 left-0 right-0 h-px z-[5]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-px z-[5]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)" }} />
        <div className="absolute inset-0 opacity-[0.02] z-[2]"
          style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.6) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      </div>

      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        <motion.div initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }} className="text-center">

          <Float y={6} duration={5}>
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full mb-10"
              style={{ border: "1px solid rgba(34,197,94,0.4)", backgroundColor: "rgba(34,197,94,0.08)" }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#22c55e", boxShadow: "0 0 10px #22c55e" }} />
              <span style={{ color: "#4ade80" }} className="text-sm font-bold tracking-wider uppercase">Live Now</span>
            </div>
          </Float>

          <h2 className="text-6xl md:text-[9rem] font-black leading-[0.85] tracking-tighter">
            <span style={{
              background: "linear-gradient(135deg, #60a5fa 0%, #22d3ee 25%, #a78bfa 50%, #60a5fa 75%, #22d3ee 100%)",
              backgroundSize: "300% 300%", animation: "gradientShift 5s ease infinite",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>BullMoney</span>
          </h2>

          <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-6 text-2xl md:text-4xl font-light" style={{ color: "#e4e4e7" }}>
            The Ultimate Trading Community
          </motion.p>

          <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-8 max-w-3xl mx-auto leading-relaxed text-lg" style={{ color: "#a1a1aa" }}>
            Everything a trader needs under one roof. Live market data, VIP signals, educational courses,
            community hub, integrated store, crypto payments, gaming, and more - all designed and built from scratch.
          </motion.p>

          {/* Feature grid - full width */}
          <div className="mt-10 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {[
              { label: "Live Charts", desc: "TradingView integration", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", href: "/" },
              { label: "Courses", desc: "Video education", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z", href: "/designs" },
              { label: "Store", desc: "E-commerce", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z", href: "/store" },
              { label: "Community", desc: "Global network", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", href: "/socials" },
              { label: "VIP Signals", desc: "Premium access", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", href: "/VIP" },
              { label: "Games", desc: "Entertainment", icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z", href: "/games" },
              { label: "Crypto Pay", desc: "Web3 payments", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", href: "/store" },
              { label: "Analytics", desc: "Full dashboard", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", href: "/" },
            ].map((feat, i) => (
              <motion.a key={feat.label} href={feat.href}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.06, duration: 0.5 }}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
                className="rounded-xl p-6 text-center transition-all duration-300 group cursor-pointer"
                style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(59,130,246,0.1)" }}>
                <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <svg className="w-5 h-5" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feat.icon} />
                  </svg>
                </div>
                <p className="font-bold text-sm group-hover:text-blue-400 transition-colors" style={{ color: "#ffffff" }}>{feat.label}</p>
                <p className="text-xs mt-1" style={{ color: "#52525b" }}>{feat.desc}</p>
              </motion.a>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-8 sm:mt-16 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <a href="/" className="group relative inline-flex items-center justify-center overflow-hidden rounded-full px-8 py-3 sm:px-12 sm:py-5 font-bold text-white text-base sm:text-lg">
              <span className="absolute inset-0" style={{ background: "linear-gradient(135deg, #2563eb, #0891b2)" }} />
              <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4, #3b82f6)", backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite" }} />
              <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ boxShadow: "0 0 40px rgba(59,130,246,0.6)" }} />
              <span className="relative z-10 flex items-center gap-2">Explore BullMoney
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </a>
            <HoverBorderGradient as="a" containerClassName="cursor-pointer"
              className="!px-12 !py-5 font-bold !text-lg"
              style={{ backgroundColor: "rgba(0,0,0,0.9)", color: "#ffffff" }}
              {...({ href: "/store" } as any)}>
              Visit Store &rarr;
            </HoverBorderGradient>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// Section 6 - Journey Timeline
// ============================================================================

function JourneySection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative w-full min-h-fit md:min-h-[190vh] py-6 sm:py-16 md:py-32 lg:py-40 flex flex-col" style={{ backgroundColor: "#000000" }}>
      <style jsx>{`
        section :global(.bg-white),
        section :global(.dark\\:bg-neutral-950) { background-color: #000000 !important; }
        section :global(.text-black),
        section :global(.dark\\:text-white) { color: #ffffff !important; }
        section :global(.text-neutral-500) { color: #71717a !important; }
        section :global(.bg-neutral-200),
        section :global(.dark\\:bg-neutral-800) { background-color: #1e40af !important; }
        section :global(.border-neutral-300),
        section :global(.dark\\:border-neutral-700) { border-color: #3b82f6 !important; }
        section :global(.from-purple-500) { --tw-gradient-from: #3b82f6 !important; }
        section :global(.via-blue-500) { --tw-gradient-via: #06b6d4 !important; }
        section :global(.font-sans) { padding-left: 0 !important; padding-right: 0 !important; }
      `}</style>
      <div className="absolute top-0 left-0 right-0 h-px z-[5]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)" }} />
      <div className="w-full max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative z-20 px-4 sm:px-6 md:px-12 pt-16 sm:pt-20 md:pt-28">
          <span style={{ color: "#60a5fa" }} className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase">My Journey</span>
          <h2 className="mt-3 sm:mt-5 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black" style={{ color: "#ffffff" }}>
            Time<span style={{ background: "linear-gradient(135deg, #60a5fa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>line</span>
          </h2>
          <p className="mt-4 sm:mt-5 max-w-lg text-base sm:text-lg" style={{ color: "#a1a1aa" }}>
            From self-taught developer to building a global trading platform.
          </p>
        </motion.div>
      </div>
      <Timeline data={TIMELINE_DATA} />
    </section>
  );
}

// ============================================================================
// Section 7 - Quick Links (Full width grid)
// ============================================================================

function QuickLinksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} style={{ backgroundColor: "#000000" }} className="relative w-full min-h-fit md:min-h-[150vh] py-6 sm:py-16 md:py-36 lg:py-48 flex flex-col md:justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px z-[5]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)" }} />
      </div>

      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }} className="text-center mb-6 sm:mb-12 md:mb-20">
          <span style={{ color: "#60a5fa" }} className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase">Navigate</span>
          <h2 className="mt-3 sm:mt-5 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black" style={{ color: "#ffffff" }}>
            Explore the{" "}
            <span style={{ background: "linear-gradient(135deg, #60a5fa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Platform</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {NAV_LINKS.map((link, i) => (
            <motion.a key={link.label} href={link.href}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              whileHover={{ y: -8, scale: 1.04, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
              className="relative group rounded-2xl p-8 text-center overflow-hidden transition-all duration-300"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(59,130,246,0.1)" }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"
                style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(6,182,212,0.06))", boxShadow: "0 0 40px rgba(59,130,246,0.06) inset" }} />
              <div className="relative z-10 w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                style={{ backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <svg className="w-6 h-6 transition-colors duration-300 group-hover:text-blue-400" style={{ color: "#71717a" }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
                </svg>
              </div>
              <span className="relative z-10 block font-black text-lg transition-colors duration-300 group-hover:text-blue-400" style={{ color: "#e4e4e7" }}>
                {link.label}
              </span>
              <span className="relative z-10 block text-xs mt-1" style={{ color: "#52525b" }}>{link.desc}</span>
              <motion.div className="relative z-10 mt-3 flex justify-center"
                initial={false} whileHover={{ x: 4 }}>
                <svg className="w-5 h-5 transition-all duration-300 group-hover:text-blue-400" style={{ color: "#3f3f46" }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </motion.div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Section 8 - Footer
// ============================================================================

function FooterSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <footer ref={ref} style={{ backgroundColor: "#000000" }} className="relative w-full min-h-fit md:min-h-[50vh] py-6 sm:py-16 md:py-32 lg:py-40 flex flex-col md:justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px z-[5]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)" }} />
      </div>

      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 md:px-12 text-center">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}>
          <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black" style={{ color: "#ffffff" }}>
            Let&apos;s Build Something{" "}
            <span style={{ background: "linear-gradient(135deg, #60a5fa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Together
            </span>
          </h3>
          <p className="mt-3 sm:mt-8 max-w-xl mx-auto text-sm sm:text-lg" style={{ color: "#a1a1aa" }}>
            Whether you want to join the BullMoney community, collaborate on a project,
            or connect - I&apos;m always open to new opportunities.
          </p>

          <div className="mt-5 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <a href="/socials" className="group relative inline-flex items-center justify-center overflow-hidden rounded-full px-8 py-3 sm:px-12 sm:py-5 font-bold text-white text-base sm:text-lg">
              <span className="absolute inset-0" style={{ background: "linear-gradient(135deg, #2563eb, #0891b2)" }} />
              <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4, #3b82f6)", backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite" }} />
              <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ boxShadow: "0 0 40px rgba(59,130,246,0.5)" }} />
              <span className="relative z-10">Get in Touch</span>
            </a>
            <HoverBorderGradient as="a" containerClassName="cursor-pointer"
              className="!px-12 !py-5 font-bold !text-lg"
              style={{ backgroundColor: "rgba(0,0,0,0.9)", color: "#ffffff" }}
              {...({ href: "/community" } as any)}>
              Join Community
            </HoverBorderGradient>
          </div>

          <div className="mt-10 sm:mt-20 flex items-center justify-center gap-4 sm:gap-8 text-sm flex-wrap">
            {[
              { label: "BullMoney", href: "/" },
              { label: "Store", href: "/store" },
              { label: "Trading", href: "/" },
              { label: "Course", href: "/course" },
              { label: "Games", href: "/games" },
              { label: "Socials", href: "/socials" },
              { label: "Community", href: "/community" },
            ].map((link, i) => (
              <React.Fragment key={link.label}>
                {i > 0 && <span style={{ color: "#1c1c1e" }}>&bull;</span>}
                <a href={link.href} className="transition-colors duration-300 hover:text-blue-400 font-medium"
                  style={{ color: "#52525b" }}>{link.label}</a>
              </React.Fragment>
            ))}
          </div>

          <p className="mt-6 sm:mt-12 text-xs" style={{ color: "#27272a" }}>
            &copy; {new Date().getFullYear()} Justin - BullMoney. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}

// ============================================================================
// Mobile Carousel Section Labels
// ============================================================================

const SECTION_LABELS = [
  "Hero", "About", "Hobbies", "Instagram", "Trading",
  "Mentor", "Skills", "Projects", "Dev DNA",
  "BullMoney", "Journey", "Links", "Footer",
];

// ============================================================================
// Mobile Carousel Wrapper
// ============================================================================

function MobileCarousel({ children }: { children: React.ReactNode }) {
  const sections = React.Children.toArray(children);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const total = sections.length;

  const goTo = useCallback((idx: number) => {
    setActive(Math.max(0, Math.min(total - 1, idx)));
    // Scroll to top when changing sections
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [total]);

  const prev = useCallback(() => goTo(active - 1), [active, goTo]);
  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  // Swipe detection — only horizontal swipes change section
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      // Only horizontal swipe changes section (must be clearly horizontal)
      if (Math.abs(dx) > 100 && Math.abs(dx) > Math.abs(dy) * 3) {
        if (dx < 0) next();
        else prev();
      }
      touchStart.current = null;
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [next, prev]);

  // Keyboard nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next]);

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full" style={{ backgroundColor: "#000000" }}>
      {/* Current section content - scrollable vertically */}
      <AnimatePresence mode="wait">
        <motion.div
          ref={scrollRef}
          key={active}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
          className="w-full h-full overflow-x-hidden"
          style={{
            overflowY: "scroll",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
            overscrollBehavior: "contain",
          }}
        >
          {sections[active]}
          {/* Spacer so content isn't hidden behind bottom nav */}
          <div style={{ height: 80 }} aria-hidden />
        </motion.div>
      </AnimatePresence>

      {/* Left Arrow */}
      {active > 0 && (
        <button
          onClick={prev}
          className="fixed left-2 top-1/2 -translate-y-1/2 z-[100] w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
          style={{ backgroundColor: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}
          aria-label="Previous section"
        >
          <svg className="w-5 h-5" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right Arrow */}
      {active < total - 1 && (
        <button
          onClick={next}
          className="fixed right-2 top-1/2 -translate-y-1/2 z-[100] w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
          style={{ backgroundColor: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}
          aria-label="Next section"
        >
          <svg className="w-5 h-5" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] pb-[env(safe-area-inset-bottom,8px)]" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.95) 30%)" }}>
        {/* Section label */}
        <div className="text-center mb-2">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "#60a5fa" }}>
            {SECTION_LABELS[active] || `Section ${active + 1}`}
          </span>
          <span className="text-[10px] ml-2" style={{ color: "#52525b" }}>
            {active + 1}/{total}
          </span>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 px-4 pb-2">
          {sections.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all duration-300"
              style={{
                width: i === active ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === active ? "#3b82f6" : "rgba(255,255,255,0.15)",
                boxShadow: i === active ? "0 0 8px rgba(59,130,246,0.5)" : "none",
              }}
              aria-label={`Go to ${SECTION_LABELS[i] || `section ${i + 1}`}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Portfolio Component
// ============================================================================

export default function PortfolioClient() {
  const isMobile = useIsMobile();

  const globalStyles = (
    <style jsx global>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      body { background-color: #000000 !important; }
      ::selection { background-color: rgba(59,130,246,0.3); color: #ffffff; }
    `}</style>
  );

  // Mobile: carousel mode
  if (isMobile) {
    return (
      <div className="w-full" style={{ backgroundColor: "#000000", color: "#ffffff" }}>
        {globalStyles}
        <MobileCarousel>
          <HeroSection />
          <AboutSection />
          <HobbiesSectionWrapper />
          <InstagramSectionWrapper />
          <TradingIdentitySection />
          <MentorSection />
          <SkillsSection />
          <ProjectsSection />
          <DeveloperDNASection />
          <BullMoneyShowcase />
          <JourneySection />
          <QuickLinksSection />
          <FooterSection />
        </MobileCarousel>
      </div>
    );
  }

  // Desktop: normal vertical scroll
  return (
    <main className="min-h-screen w-full overflow-x-hidden" style={{ backgroundColor: "#000000", color: "#ffffff", WebkitOverflowScrolling: "touch" }}>
      {globalStyles}
      <HeroSection />
      <AboutSection />
      <HobbiesSectionWrapper />
      <InstagramSectionWrapper />
      <TradingIdentitySection />
      <MentorSection />
      <SkillsSection />
      <ProjectsSection />
      <DeveloperDNASection />
      <BullMoneyShowcase />
      <JourneySection />
      <QuickLinksSection />
      <FooterSection />
    </main>
  );
}
