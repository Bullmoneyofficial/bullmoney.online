"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useLenis } from "@/lib/smoothScroll";

// ============================================================================
// MOBILE SWIPE NAVIGATOR - 2026 Best Practices
// Touch gestures: Swipe left/right for sections, up for top, down for bottom
// ============================================================================

type SectionId = "hero" | "cta" | "features" | "experience" | "testimonials" | "ticker" | "footer";

// Sections matching app/page.tsx structure (excluding 'top' which is same position as 'hero')
const SECTIONS: SectionId[] = ["hero", "cta", "features", "experience", "testimonials", "ticker", "footer"];

// Section labels for display
const SECTION_LABELS: Record<SectionId, string> = {
  hero: "Hero",
  cta: "Charts",
  features: "Features",
  experience: "3D Experience",
  testimonials: "Testimonials",
  ticker: "Market Ticker",
  footer: "Footer",
};

// Swipe configuration - optimized for 2026 touch screens
const MIN_SWIPE_DISTANCE = 25; // Minimum px to register swipe
const MIN_SWIPE_VELOCITY = 0.2; // Minimum px/ms for quick flicks

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
}

export default function MobileSwipeNavigator() {
  const { scrollTo: lenisScrollTo, lenis } = useLenis();
  const [enabled, setEnabled] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<SectionId | null>(null);
  const [actionIcon, setActionIcon] = useState<string | null>(null);
  
  const swipeRef = useRef<SwipeState>({ startX: 0, startY: 0, startTime: 0, currentX: 0, currentY: 0 });
  const actionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTrackingRef = useRef(false);
  const debugRef = useRef(false); // Set to true to see console logs

  // Check if we're on a touch device
  useEffect(() => {
    const check = () => {
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isMobile = window.innerWidth < 1024;
      const enabled = isTouchDevice && isMobile;
      setEnabled(enabled);
      if (debugRef.current) console.log('[SWIPE] Device check:', { isTouchDevice, isMobile, enabled });
    };
    
    check();
    window.addEventListener("resize", check);
    
    // Hide hint after 5 seconds
    const hintTimer = setTimeout(() => setShowHint(false), 5000);
    
    return () => {
      window.removeEventListener("resize", check);
      clearTimeout(hintTimer);
    };
  }, []);

  // Scroll to section - CRITICAL: Must work reliably
  const scrollToSection = useCallback((id: SectionId) => {
    if (debugRef.current) console.log('[SWIPE] Scrolling to:', id);
    
    const el = document.getElementById(id);
    if (!el) {
      if (debugRef.current) console.log('[SWIPE] Element not found:', id);
      return;
    }

    // Try lenis first
    if (lenis && lenisScrollTo) {
      try {
        lenisScrollTo(el, { offset: -96, duration: 0.9 });
        if (debugRef.current) console.log('[SWIPE] Used lenis scroll');
        return;
      } catch (err) {
        if (debugRef.current) console.log('[SWIPE] Lenis failed, using fallback:', err);
      }
    }

    // Fallback: native smooth scroll
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ 
      top: Math.max(0, top), 
      behavior: "smooth" 
    });
    if (debugRef.current) console.log('[SWIPE] Used native scroll');
  }, [lenis, lenisScrollTo]);

  // Show action feedback
  const showAction = useCallback((icon: string, section: SectionId) => {
    if (debugRef.current) console.log('[SWIPE] Action:', icon, section);
    
    setActionIcon(icon);
    setCurrentSection(section);
    setLastAction(SECTION_LABELS[section]);
    setShowHint(false);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([10, 30, 10]);
    }
    
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    actionTimerRef.current = setTimeout(() => {
      setLastAction(null);
      setActionIcon(null);
      setCurrentSection(null);
    }, 2000);
  }, []);

  // Get visible sections
  const getVisibleSections = useCallback((): SectionId[] => {
    return SECTIONS.filter((id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });
  }, []);

  // Get current section index
  const getCurrentIndex = useCallback((sections: SectionId[]): number => {
    if (sections.length === 0) return 0;
    
    const scrollY = window.scrollY + 96; // Account for navbar
    const viewportMid = scrollY + window.innerHeight * 0.35;
    
    let bestIdx = 0;
    let bestDist = Infinity;
    
    for (let i = 0; i < sections.length; i++) {
      const el = document.getElementById(sections[i]);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const dist = Math.abs(top - viewportMid);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    
    return Math.max(0, Math.min(bestIdx, sections.length - 1));
  }, []);

  // Touch handlers - simplified and more robust
  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e: TouchEvent) => {
      // Only track single finger
      if (e.touches.length !== 1) {
        isTrackingRef.current = false;
        return;
      }

      // Don't start if it's on an interactive element
      const target = e.target as HTMLElement;
      if (target && (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("[role='button']") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("select")
      )) {
        if (debugRef.current) console.log('[SWIPE] Skipping interactive element');
        isTrackingRef.current = false;
        return;
      }

      const touch = e.touches[0];
      swipeRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: performance.now(),
        currentX: touch.clientX,
        currentY: touch.clientY,
      };
      isTrackingRef.current = true;
      if (debugRef.current) console.log('[SWIPE] Touch start:', { x: touch.clientX, y: touch.clientY });
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTrackingRef.current || e.touches.length !== 1) {
        isTrackingRef.current = false;
        return;
      }

      const touch = e.touches[0];
      swipeRef.current.currentX = touch.clientX;
      swipeRef.current.currentY = touch.clientY;

      const deltaX = swipeRef.current.currentX - swipeRef.current.startX;
      const deltaY = swipeRef.current.currentY - swipeRef.current.startY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // ONLY prevent default for strong horizontal swipes (navigation gesture)
      // Allow normal vertical scrolling to work
      if (absDeltaX > 40 && absDeltaX > absDeltaY * 1.8) {
        e.preventDefault();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isTrackingRef.current) return;
      isTrackingRef.current = false;

      const deltaX = swipeRef.current.currentX - swipeRef.current.startX;
      const deltaY = swipeRef.current.currentY - swipeRef.current.startY;
      const deltaTime = performance.now() - swipeRef.current.startTime;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const velocityX = absDeltaX / Math.max(deltaTime, 1);
      const velocityY = absDeltaY / Math.max(deltaTime, 1);

      if (debugRef.current) {
        console.log('[SWIPE] Touch end:', {
          deltaX,
          deltaY,
          absDeltaX,
          absDeltaY,
          velocityX,
          velocityY,
          time: deltaTime,
        });
      }

      // Determine swipe type - prioritize dominant direction
      const isHorizontal = absDeltaX > absDeltaY;
      const isVertical = absDeltaY > absDeltaX * 1.5;

      let swiped = false;

      if (isHorizontal && (absDeltaX >= MIN_SWIPE_DISTANCE || velocityX >= MIN_SWIPE_VELOCITY)) {
        const sections = getVisibleSections();
        if (sections.length === 0) return;

        const currentIdx = getCurrentIndex(sections);

        if (deltaX < 0) {
          // LEFT swipe - next section
          const newIdx = Math.min(sections.length - 1, currentIdx + 1);
          const target = sections[newIdx];
          if (target) {
            scrollToSection(target);
            showAction("→", target);
            swiped = true;
          }
        } else {
          // RIGHT swipe - previous section
          const newIdx = Math.max(0, currentIdx - 1);
          const target = sections[newIdx];
          if (target) {
            scrollToSection(target);
            showAction("←", target);
            swiped = true;
          }
        }
      }
      // DISABLED: Vertical swipe navigation was interfering with normal scrolling
      // Users can use the horizontal swipe left/right for section navigation instead
      // or tap the navbar menu to jump to sections

      if (debugRef.current) console.log('[SWIPE] Swiped:', swiped);
    };

    // Add listeners
    window.addEventListener("touchstart", onTouchStart, false);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, false);

    return () => {
      window.removeEventListener("touchstart", onTouchStart, false);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd, false);
      
      if (actionTimerRef.current) {
        clearTimeout(actionTimerRef.current);
      }
    };
  }, [enabled, getVisibleSections, getCurrentIndex, scrollToSection, showAction]);

  // Don't render on desktop
  if (!enabled) return null;

  // Only show UI if there's something to display
  if (!showHint && !lastAction) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes swipe-fade-in {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes swipe-fade-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(16px) scale(0.95); }
        }
        @keyframes swipe-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes swipe-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes swipe-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.3), 0 4px 30px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 35px rgba(59,130,246,0.5), 0 4px 30px rgba(0,0,0,0.5); }
        }
        .swipe-animate {
          animation: swipe-fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .swipe-glow {
          animation: swipe-glow 2s ease-in-out infinite;
        }
        .swipe-pulse {
          animation: swipe-pulse 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="fixed inset-x-0 bottom-6 z-[99998] flex justify-center px-6 pointer-events-none swipe-animate">
        <div className="relative overflow-hidden rounded-3xl shadow-2xl max-w-xs w-full swipe-glow">
          <div className="relative bg-black/95 backdrop-blur-2xl border border-blue-500/40 rounded-3xl overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden">
              <div 
                className="absolute inset-y-0 left-[-100%] w-full bg-gradient-to-r from-transparent via-blue-400/80 to-transparent"
                style={{ animation: "swipe-shimmer 2s linear infinite" }} 
              />
            </div>

            {/* Hint Mode */}
            {showHint && !lastAction && (
              <div className="px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-blue-300/70 mb-3 text-center flex items-center justify-center gap-2">
                  <span className="text-base">👆</span> Quick Navigation
                </div>
                
                <div className="flex justify-center">
                  <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20 text-center">
                    <div className="text-xl mb-1">← →</div>
                    <div className="text-[10px] text-white/60 uppercase tracking-wider">Swipe to Jump Sections</div>
                  </div>
                </div>
                
                <div className="mt-3 text-center text-[9px] text-white/40">
                  Scroll normally • Swipe left/right for sections
                </div>
                
                <div className="mt-2 flex justify-center">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400/80 swipe-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 swipe-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400/40 swipe-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Action Feedback Mode */}
            {lastAction && currentSection && (
              <div className="px-5 py-4">
                <div className="flex items-center justify-center gap-4">
                  <span className="text-3xl">{actionIcon}</span>
                  <div className="text-left">
                    <div className="text-base font-bold text-white">
                      {lastAction}
                    </div>
                    <div className="text-[10px] text-blue-300/60 uppercase tracking-wider">
                      Section {SECTIONS.indexOf(currentSection) + 1} of {SECTIONS.length}
                    </div>
                  </div>
                </div>
                
                {/* Progress dots */}
                <div className="mt-3 flex justify-center gap-1.5">
                  {SECTIONS.map((s, i) => (
                    <span 
                      key={s}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        s === currentSection 
                          ? 'bg-blue-400 scale-125' 
                          : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
