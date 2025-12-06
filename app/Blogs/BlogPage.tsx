"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback, ReactNode, RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger"; 
import { useBlog, BlogPost } from "./BlogContext"; 
import AdminLoginModal from "./AdminLoginModal";
import AdminPanel from "./AdminPanel";
import { cn } from "@/lib/utils";

// --- PARTICLE IMPORTS ---
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, Engine } from "@tsparticles/engine";

// Register ScrollTrigger once
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ==========================================
// 1. SCROLL REVEAL (Integrated)
// ==========================================

interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom'
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return <span key={index} className="inline-block">&nbsp;</span>;
      return (
        <span className="word inline-block mr-[0.1em] opacity-0 will-change-transform" key={index}>
          {word}
        </span>
      );
    });
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

    // 1. Rotate the whole container
    gsap.fromTo(
      el,
      { transformOrigin: '0% 50%', rotate: baseRotation },
      {
        ease: 'none',
        rotate: 0,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: 'top bottom',
          end: rotationEnd,
          scrub: true
        }
      }
    );

    const wordElements = el.querySelectorAll<HTMLElement>('.word');

    // 2. Animate opacity
    gsap.fromTo(
      wordElements,
      { opacity: baseOpacity, willChange: 'opacity' },
      {
        ease: 'none',
        opacity: 1,
        stagger: 0.05,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: 'top bottom-=20%',
          end: wordAnimationEnd,
          scrub: true
        }
      }
    );

    // 3. Animate Blur
    if (enableBlur) {
      gsap.fromTo(
        wordElements,
        { filter: `blur(${blurStrength}px)` },
        {
          ease: 'none',
          filter: 'blur(0px)',
          stagger: 0.05,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top bottom-=20%',
            end: wordAnimationEnd,
            scrub: true
          }
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [scrollContainerRef, enableBlur, baseRotation, baseOpacity, rotationEnd, wordAnimationEnd, blurStrength]);

  return (
    <h2 ref={containerRef} className={cn("text-white leading-tight", containerClassName)}>
      <p className={cn("flex flex-wrap", textClassName)}>{splitText}</p>
    </h2>
  );
};

// ==========================================
// 2. CURSOR LOGIC & STYLES
// ==========================================

const CursorStyles = () => (
  <style jsx global>{`
    .target-cursor-wrapper {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999;
      pointer-events: none;
      mix-blend-mode: difference;
    }
    .target-cursor-dot {
      width: 8px;
      height: 8px;
      background-color: white;
      border-radius: 50%;
      position: absolute;
      top: 0;
      left: 0;
      transform: translate(-50%, -50%);
    }
    .target-cursor-corner {
      position: absolute;
      width: 12px;
      height: 12px;
      border: 2px solid white;
    }
    .corner-tl { top: -6px; left: -6px; border-right: none; border-bottom: none; }
    .corner-tr { top: -6px; right: -6px; border-left: none; border-bottom: none; }
    .corner-br { bottom: -6px; right: -6px; border-left: none; border-top: none; }
    .corner-bl { bottom: -6px; left: -6px; border-right: none; border-top: none; }
    
    body.custom-cursor-active {
      cursor: none !important;
    }
  `}</style>
);

interface TargetCursorProps {
  targetSelector?: string;
  spinDuration?: number;
  hideDefaultCursor?: boolean;
  hoverDuration?: number;
  parallaxOn?: boolean;
}

const TargetCursor: React.FC<TargetCursorProps> = ({
  targetSelector = 'button, a, input, .cursor-target', 
  spinDuration = 2,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cornersRef = useRef<NodeListOf<HTMLDivElement> | null>(null);
  const spinTl = useRef<gsap.core.Timeline | null>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const isActiveRef = useRef(false);
  const targetCornerPositionsRef = useRef<{ x: number; y: number }[] | null>(null);
  const tickerFnRef = useRef<(() => void) | null>(null);
  const activeStrengthRef = useRef({ current: 0 });

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    return hasTouchScreen && isSmallScreen;
  }, []);

  const constants = useMemo(() => ({ borderWidth: 3, cornerSize: 12 }), []);

  const moveCursor = useCallback((x: number, y: number) => {
    if (!cursorRef.current) return;
    gsap.to(cursorRef.current, { x, y, duration: 0.1, ease: 'power3.out' });
  }, []);

  useEffect(() => {
    if (isMobile || !cursorRef.current) return;

    if (hideDefaultCursor) {
      document.body.classList.add('custom-cursor-active');
    }

    const cursor = cursorRef.current;
    cornersRef.current = cursor.querySelectorAll<HTMLDivElement>('.target-cursor-corner');

    let activeTarget: Element | null = null;
    let currentLeaveHandler: (() => void) | null = null;
    let resumeTimeout: ReturnType<typeof setTimeout> | null = null;

    const cleanupTarget = (target: Element) => {
      if (currentLeaveHandler) {
        target.removeEventListener('mouseleave', currentLeaveHandler);
      }
      currentLeaveHandler = null;
    };

    gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });

    const createSpinTimeline = () => {
      if (spinTl.current) spinTl.current.kill();
      spinTl.current = gsap.timeline({ repeat: -1 })
        .to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' });
    };
    createSpinTimeline();

    const tickerFn = () => {
      if (!targetCornerPositionsRef.current || !cursorRef.current || !cornersRef.current) return;
      const strength = activeStrengthRef.current.current;
      if (strength === 0) return;
      
      const cursorX = gsap.getProperty(cursorRef.current, 'x') as number;
      const cursorY = gsap.getProperty(cursorRef.current, 'y') as number;
      
      const corners = Array.from(cornersRef.current);
      corners.forEach((corner, i) => {
        const currentX = gsap.getProperty(corner, 'x') as number;
        const currentY = gsap.getProperty(corner, 'y') as number;
        const targetX = targetCornerPositionsRef.current![i].x - cursorX;
        const targetY = targetCornerPositionsRef.current![i].y - cursorY;
        const finalX = currentX + (targetX - currentX) * strength;
        const finalY = currentY + (targetY - currentY) * strength;
        
        const duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;
        gsap.to(corner, {
          x: finalX,
          y: finalY,
          duration: duration,
          ease: duration === 0 ? 'none' : 'power1.out',
          overwrite: 'auto'
        });
      });
    };
    tickerFnRef.current = tickerFn;

    const moveHandler = (e: MouseEvent) => moveCursor(e.clientX, e.clientY);
    window.addEventListener('mousemove', moveHandler);

    const scrollHandler = () => {
      if (!activeTarget || !cursorRef.current) return;
      const mouseX = gsap.getProperty(cursorRef.current, 'x') as number;
      const mouseY = gsap.getProperty(cursorRef.current, 'y') as number;
      const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
      
      const isStillOverTarget = elementUnderMouse && (elementUnderMouse === activeTarget || elementUnderMouse.closest(targetSelector) === activeTarget);
      
      if (!isStillOverTarget) {
        currentLeaveHandler?.();
      }
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    const mouseDownHandler = () => {
      if (!dotRef.current) return;
      gsap.to(dotRef.current, { scale: 0.7, duration: 0.3 });
      gsap.to(cursorRef.current, { scale: 0.9, duration: 0.2 });
    };

    const mouseUpHandler = () => {
      if (!dotRef.current) return;
      gsap.to(dotRef.current, { scale: 1, duration: 0.3 });
      gsap.to(cursorRef.current, { scale: 1, duration: 0.2 });
    };

    window.addEventListener('mousedown', mouseDownHandler);
    window.addEventListener('mouseup', mouseUpHandler);

    const enterHandler = (e: MouseEvent) => {
      const directTarget = e.target as Element;
      const allTargets: Element[] = [];
      let current: Element | null = directTarget;
      
      while (current && current !== document.body) {
        if (current.matches(targetSelector)) allTargets.push(current);
        current = current.parentElement;
      }
      
      const target = allTargets[0] || null;
      if (!target || !cursorRef.current || !cornersRef.current) return;
      if (activeTarget === target) return;
      if (activeTarget) cleanupTarget(activeTarget);
      
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }

      activeTarget = target;
      const corners = Array.from(cornersRef.current);
      corners.forEach(corner => gsap.killTweensOf(corner));
      gsap.killTweensOf(cursorRef.current, 'rotation');
      spinTl.current?.pause();
      gsap.set(cursorRef.current, { rotation: 0 });

      const rect = target.getBoundingClientRect();
      const { borderWidth, cornerSize } = constants;
      const cursorX = gsap.getProperty(cursorRef.current, 'x') as number;
      const cursorY = gsap.getProperty(cursorRef.current, 'y') as number;

      targetCornerPositionsRef.current = [
        { x: rect.left - borderWidth, y: rect.top - borderWidth },
        { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
        { x: rect.right + borderWidth - cornerSize, y: rect.bottom + borderWidth - cornerSize },
        { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize }
      ];

      isActiveRef.current = true;
      gsap.ticker.add(tickerFnRef.current!);
      gsap.to(activeStrengthRef.current, { current: 1, duration: hoverDuration, ease: 'power2.out' });

      corners.forEach((corner, i) => {
        gsap.to(corner, {
          x: targetCornerPositionsRef.current![i].x - cursorX,
          y: targetCornerPositionsRef.current![i].y - cursorY,
          duration: 0.2,
          ease: 'power2.out'
        });
      });

      const leaveHandler = () => {
        gsap.ticker.remove(tickerFnRef.current!);
        isActiveRef.current = false;
        targetCornerPositionsRef.current = null;
        gsap.set(activeStrengthRef.current, { current: 0, overwrite: true });
        activeTarget = null;
        
        if (cornersRef.current) {
          const corners = Array.from(cornersRef.current);
          gsap.killTweensOf(corners);
          const { cornerSize } = constants;
          const positions = [
            { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: cornerSize * 0.5 },
            { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
          ];
          const tl = gsap.timeline();
          corners.forEach((corner, index) => {
            tl.to(corner, { x: positions[index].x, y: positions[index].y, duration: 0.3, ease: 'power3.out' }, 0);
          });
        }
        
        resumeTimeout = setTimeout(() => {
          if (!activeTarget && cursorRef.current && spinTl.current) {
            const currentRotation = gsap.getProperty(cursorRef.current, 'rotation') as number;
            const normalizedRotation = currentRotation % 360;
            spinTl.current.kill();
            spinTl.current = gsap.timeline({ repeat: -1 })
              .to(cursorRef.current, { rotation: '+=360', duration: spinDuration, ease: 'none' });
              
            gsap.to(cursorRef.current, {
              rotation: normalizedRotation + 360,
              duration: spinDuration * (1 - normalizedRotation / 360),
              ease: 'none',
              onComplete: () => { spinTl.current?.restart(); } // <--- FIXED: Added curly braces
            });
          }
          resumeTimeout = null;
        }, 50);
        cleanupTarget(target);
      };
      currentLeaveHandler = leaveHandler;
      target.addEventListener('mouseleave', leaveHandler);
    };

    window.addEventListener('mouseover', enterHandler as EventListener);

    return () => {
      if (tickerFnRef.current) gsap.ticker.remove(tickerFnRef.current);
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseover', enterHandler as EventListener);
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('mousedown', mouseDownHandler);
      window.removeEventListener('mouseup', mouseUpHandler);
      if (activeTarget) cleanupTarget(activeTarget);
      spinTl.current?.kill();
      document.body.classList.remove('custom-cursor-active');
      isActiveRef.current = false;
      targetCornerPositionsRef.current = null;
      activeStrengthRef.current.current = 0;
    };
  }, [targetSelector, spinDuration, moveCursor, constants, hideDefaultCursor, isMobile, hoverDuration, parallaxOn]);

  if (isMobile) return null;

  return (
    <div ref={cursorRef} className="target-cursor-wrapper">
      <div ref={dotRef} className="target-cursor-dot" />
      <div className="target-cursor-corner corner-tl" />
      <div className="target-cursor-corner corner-tr" />
      <div className="target-cursor-corner corner-br" />
      <div className="target-cursor-corner corner-bl" />
    </div>
  );
};

// ==========================================
// 3. SPARKLES COMPONENT
// ==========================================

const SparklesCore = (props: {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
}) => {
  const {
    id = "tsparticles",
    className,
    background = "transparent",
    minSize = 1.6,
    maxSize = 4.4,
    speed = 1,
    particleColor = "#ffffff",
    particleDensity = 100,
  } = props;
  const [init, setInit] = useState(false);
  
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  return (
    <div className={cn("opacity-0 transition-opacity duration-1000", init && "opacity-100", className)}>
      {init && (
        <Particles
          id={id}
          className={cn("h-full w-full")}
          options={{
            background: { color: { value: background } },
            fullScreen: { enable: false, zIndex: 1 },
            fpsLimit: 120,
            interactivity: {
              events: {
                onClick: { enable: true, mode: "push" },
                onHover: { enable: false, mode: "repulse" },
                resize: { enable: true },
              },
              modes: {
                push: { quantity: 4 },
                repulse: { distance: 200, duration: 0.4 },
              },
            },
            particles: {
              bounce: { horizontal: { value: 1 }, vertical: { value: 1 } },
              color: { value: particleColor },
              move: {
                enable: true,
                speed: speed,
                direction: "none",
                random: false,
                straight: false,
                outModes: { default: "out" },
              },
              number: {
                density: { enable: true, width: 1920, height: 1080 },
                value: particleDensity,
              },
              opacity: {
                value: { min: 0.1, max: 0.5 },
                animation: { enable: true, speed: speed, sync: false },
              },
              shape: { type: "circle" },
              size: {
                value: { min: minSize, max: maxSize },
              },
            },
            detectRetina: true,
          } as any}
        />
      )}
    </div>
  );
};

// ==========================================
// 4. MAIN BLOG SECTION
// ==========================================

type Filters = {
  search: string;
  category: string;
};

export default function BlogSection() {
  const {
    state: { posts, isAdmin, categories },
    toggleVisibility,
    deletePost,
  } = useBlog();

  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: "all",
  });

  const [loginOpen, setLoginOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  
  // STATE FOR EXPANSION
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (!p.visible && !isAdmin) return false;

      const searchMatch = p.title
        .toLowerCase()
        .includes(filters.search.toLowerCase());

      const categoryMatch =
        filters.category === "all" || p.category === filters.category;

      return searchMatch && categoryMatch;
    });
  }, [posts, filters, isAdmin]);

  // Handle closing on Escape key
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpandedId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isAdmin) setEditing(null);
  }, [isAdmin]);

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 py-12 bg-black min-h-screen overflow-hidden">
      
      {/* --- INJECT CURSOR --- */}
      <CursorStyles />
      <TargetCursor 
        hideDefaultCursor={true}
        spinDuration={2}
        parallaxOn={true}
        targetSelector="button, a, input, .cursor-target"
      />

      {/* SPARKLES BACKGROUND */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <SparklesCore
          id="tsparticlesblogsection"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={50}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* Subtle Gradient for depth */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,#1e293b_0%,transparent_55%,transparent_100%)] opacity-30 z-0" />

      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* --- HEADER & CONTROLS --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="h-px w-8 bg-sky-500/50"></span>
              <span className="text-xs font-bold tracking-widest text-sky-500 uppercase">
                Market Intelligence
              </span>
            </div>
            
            {/* REPLACED HEADER WITH SCROLL REVEAL */}
            <ScrollReveal 
              containerClassName="text-3xl md:text-5xl font-black text-white tracking-tight"
              textClassName="flex flex-wrap"
            >
               BULLMONEY BLOGS
            </ScrollReveal>
          </div>

          <div className="flex items-center gap-4">
            {/* Admin Toggle */}
            <button
              onClick={() => setLoginOpen(true)}
              className={`cursor-target text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full border transition-all backdrop-blur-md ${
                isAdmin
                  ? "bg-sky-500/10 border-sky-500/50 text-sky-400 hover:bg-sky-500/20"
                  : "bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {isAdmin ? "Admin Console Active" : "Admin Login"}
            </button>
          </div>
        </div>

        {/* --- TERMINAL FILTER BAR --- */}
        <div className="sticky top-4 z-40 mb-12 p-1.5 rounded-full bg-neutral-900/80 backdrop-blur-md border border-neutral-800 flex flex-col sm:flex-row items-center gap-1 shadow-2xl max-w-3xl mx-auto">
          {/* Category Tabs */}
          <div className="flex-1 w-full sm:w-auto overflow-x-auto no-scrollbar flex items-center gap-1 px-1">
            <button
              onClick={() => setFilters(f => ({ ...f, category: "all" }))}
              className={`cursor-target px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filters.category === "all"
                  ? "bg-sky-600 text-white shadow-[0_0_15px_rgba(2,132,199,0.4)]"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              All Posts
            </button>
            {categories.map((c) => (
              <button
                key={c._id || c.name}
                onClick={() => setFilters(f => ({ ...f, category: c.name }))}
                className={`cursor-target px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  filters.category === c.name
                    ? "bg-neutral-800 text-sky-200 border border-neutral-700"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 bg-black/40 rounded-full border border-white/5 px-4 py-2 flex items-center gap-2 focus-within:border-sky-500/50 transition-colors">
             <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
             <input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search analysis..."
              className="bg-transparent outline-none text-xs text-white placeholder:text-neutral-600 w-full"
            />
          </div>
        </div>

        {/* --- BLOG GRID --- */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((p) => (
            <BlogCard
              key={p._id}
              post={p}
              isAdmin={isAdmin}
              isExpanded={expandedId === p._id}
              onClick={() => setExpandedId(p._id!)}
              onEdit={() => setEditing(p)}
              onDelete={() => deletePost(p._id!)}
              onToggleVisibility={() => toggleVisibility(p._id!)}
            />
          ))}
          {filteredPosts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-neutral-500">
                <p className="text-sm">No analysis found matching your criteria.</p>
              </div>
          )}
        </div>

        {/* --- EXPANDED CARD OVERLAY --- */}
        <AnimatePresence>
          {expandedId && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setExpandedId(null)}
                className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
              />
              
              {/* Expanded Card */}
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                {posts.filter(p => p._id === expandedId).map(p => (
                  <motion.div
                    layoutId={`card-container-${p._id}`}
                    key={p._id}
                    className="pointer-events-auto w-full max-w-3xl max-h-[90vh] flex flex-col bg-neutral-900 border border-neutral-700 rounded-3xl overflow-hidden shadow-2xl relative"
                  >
                    {/* Close Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(null);
                      }}
                      className="cursor-target absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors border border-white/10"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Image Area */}
                    <motion.div 
                        layoutId={`card-image-container-${p._id}`}
                        className="relative h-64 sm:h-80 w-full shrink-0"
                    >
                         <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent z-10 opacity-80" />
                        <motion.img
                            layoutId={`card-image-${p._id}`}
                            src={p.imageUrl}
                            alt={p.title}
                            className="w-full h-full object-cover"
                        />
                         {/* Category Badge */}
                        <motion.div 
                            layoutId={`card-category-${p._id}`}
                            className="absolute top-4 left-4 z-20"
                        >
                            <span className="px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-md border border-sky-500/30 text-xs font-bold uppercase tracking-wider text-sky-400 shadow-xl">
                                {p.category}
                            </span>
                        </motion.div>
                    </motion.div>

                    {/* Content Area */}
                    <motion.div 
                        layoutId={`card-content-${p._id}`}
                        className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar"
                    >
                        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-neutral-400 uppercase tracking-widest">
                            <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                            <span className="w-1 h-1 rounded-full bg-sky-500" />
                            <span>BullMoney FX</span>
                        </div>
                        
                        <motion.h2 
                            layoutId={`card-title-${p._id}`}
                            className="text-2xl sm:text-4xl font-black text-white mb-6 leading-tight"
                        >
                            {p.title}
                        </motion.h2>

                        <motion.div 
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             transition={{ delay: 0.2 }}
                             className="prose prose-invert prose-sky max-w-none text-neutral-300 leading-relaxed text-sm sm:text-base"
                        >
                            {/* Rendering text with line breaks */}
                            {p.content.split('\n').map((paragraph, idx) => (
                                <p key={idx} className="mb-4 last:mb-0">{paragraph}</p>
                            ))}
                        </motion.div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </AnimatePresence>

        {/* --- ADMIN PANEL (Only visible if Admin) --- */}
        {isAdmin && (
          <div className="mt-20 pt-10 border-t border-neutral-800 relative z-20">
             <div className="bg-neutral-900/30 rounded-3xl p-6 border border-dashed border-neutral-800">
                <AdminPanel editing={editing} clearEditing={() => setEditing(null)} />
             </div>
          </div>
        )}

        <AdminLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    </section>
  );
}

// ==========================================
// 5. BLOG CARD COMPONENT
// ==========================================

type BlogCardProps = {
  post: BlogPost;
  isAdmin: boolean;
  isExpanded: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
};

function BlogCard({ post, isAdmin, isExpanded, onClick, onEdit, onDelete, onToggleVisibility }: BlogCardProps) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <motion.div
      layoutId={`card-container-${post._id}`}
      onClick={onClick}
      whileHover={{ y: -5 }}
      // 'cursor-target' makes the magnetic cursor snap to the card
      className="group cursor-target cursor-pointer relative flex flex-col h-full rounded-2xl bg-neutral-900/40 border border-neutral-800 backdrop-blur-md overflow-hidden hover:border-sky-500/40 transition-colors duration-500 shadow-2xl hover:shadow-sky-500/10"
    >
      {/* Image Container with Overlay */}
      <motion.div 
        layoutId={`card-image-container-${post._id}`}
        className="relative aspect-[16/9] overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-80 z-10" />
        <motion.img
          layoutId={`card-image-${post._id}`}
          src={post.imageUrl}
          alt={post.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Floating Category Badge */}
        <motion.div 
            layoutId={`card-category-${post._id}`}
            className="absolute top-3 left-3 z-20"
        >
          <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-sky-500/30 text-[10px] font-bold uppercase tracking-wider text-sky-400 shadow-xl">
            {post.category}
          </span>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div 
        layoutId={`card-content-${post._id}`}
        className="p-5 flex flex-col flex-1 relative z-20"
      >
        <div className="flex items-center gap-2 mb-3 text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
           <span>{formattedDate}</span>
           <span className="w-1 h-1 rounded-full bg-sky-500" />
           <span>BullMoney FX</span>
        </div>

        <motion.h3 
            layoutId={`card-title-${post._id}`}
            className="text-lg font-bold text-white mb-3 leading-snug group-hover:text-sky-300 transition-colors line-clamp-2"
        >
          {post.title}
        </motion.h3>
        
        <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3 mb-6 flex-1">
          {post.content}
        </p>

        {/* Footer / Action */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
            <button className="text-xs font-semibold text-white flex items-center gap-2 group-hover:gap-3 transition-all">
                Read Analysis <span className="text-sky-500">→</span>
            </button>
        </div>

        {/* Admin Overlay Controls - Stop propagation to prevent card expansion when clicking tools */}
        {isAdmin && (
          <div className="absolute top-3 right-3 z-30 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={onEdit} className="cursor-target p-1.5 rounded-full bg-neutral-900/90 hover:bg-sky-500 text-white transition-colors border border-neutral-700">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button onClick={onToggleVisibility} className={`cursor-target p-1.5 rounded-full transition-colors border border-neutral-700 ${post.visible ? 'bg-neutral-900/90 hover:bg-yellow-500 text-white' : 'bg-yellow-500 text-black'}`}>
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
            <button onClick={onDelete} className="cursor-target p-1.5 rounded-full bg-neutral-900/90 hover:bg-red-500 text-white transition-colors border border-neutral-700">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}