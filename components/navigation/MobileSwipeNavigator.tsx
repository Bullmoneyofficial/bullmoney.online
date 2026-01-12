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
const SWIPE_THRESHOLD = 40; // Reduced for better responsiveness
const VELOCITY_THRESHOLD = 0.25; // Lower threshold for quick flicks

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  tracking: boolean;
}

export default function MobileSwipeNavigator() {
  const { scrollTo: lenisScrollTo, lenis } = useLenis();
  const [enabled, setEnabled] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<SectionId | null>(null);
  const [actionIcon, setActionIcon] = useState<string | null>(null);
  const swipeRef = useRef<SwipeState>({ startX: 0, startY: 0, startTime: 0, tracking: false });
  const actionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we're on a touch device
  useEffect(() => {
    const check = () => {
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isMobile = window.innerWidth < 1024 || window.matchMedia("(pointer: coarse)").matches;
      setEnabled(isTouchDevice && isMobile);
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
    
    const scrollY = window.scrollY + 96; // Account for navbar height
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

  // Scroll to section
  const scrollToSection = useCallback((id: SectionId) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (lenis && lenisScrollTo) {
      lenisScrollTo(el, { offset: -96, duration: 0.9 });
    } else {
      // Fallback to native scroll
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ 
        top: Math.max(0, top), 
        behavior: "smooth" 
      });
    }
  }, [lenis, lenisScrollTo]);

  // Show action feedback with section info
  const showAction = useCallback((icon: string, section: SectionId) => {
    setActionIcon(icon);
    setCurrentSection(section);
    setLastAction(SECTION_LABELS[section]);
    setShowHint(false); // Hide hint after first interaction
    
    // Enhanced haptic feedback pattern
    if (navigator.vibrate) {
      navigator.vibrate([10, 30, 10]); // Short-pause-short pattern
    }
    
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    actionTimerRef.current = setTimeout(() => {
      setLastAction(null);
      setActionIcon(null);
      setCurrentSection(null);
    }, 2000);
  }, []);

  // Check if touch started on an interactive element
  const isInteractiveElement = useCallback((target: EventTarget | null): boolean => {
    const el = target as HTMLElement | null;
    if (!el) return false;

    // Check if it's an input/textarea/select
    const tag = el.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (el.isContentEditable) return true;

    // Check if it's inside a button/link or has data-swipe-ignore
    if (el.closest("button, a, [role='button'], [data-swipe-ignore]")) return true;

    // Check if inside a scrollable container (let it scroll naturally)
    // This is crucial for not blocking legitimate scrolling
    let parent: HTMLElement | null = el;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      const isScrollable = (overflowY === "auto" || overflowY === "scroll");
      
      if (isScrollable && parent.scrollHeight > parent.clientHeight + 10) {
        return true;
      }
      
      parent = parent.parentElement;
    }

    return false;
  }, []);

  // Touch event handlers
  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (isInteractiveElement(e.target)) return;

      const touch = e.touches[0];
      swipeRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: performance.now(),
        tracking: true,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!swipeRef.current.tracking) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - swipeRef.current.startX;
      const deltaY = touch.clientY - swipeRef.current.startY;

      // Only prevent vertical scroll if horizontal swipe is clearly dominant
      // This prevents blocking legitimate vertical scrolling
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > 20) {
        e.preventDefault();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!swipeRef.current.tracking) return;
      swipeRef.current.tracking = false;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - swipeRef.current.startX;
      const deltaY = touch.clientY - swipeRef.current.startY;
      const deltaTime = performance.now() - swipeRef.current.startTime;
      
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const velocityX = absX / deltaTime;
      const velocityY = absY / deltaTime;

      // Determine if it's a valid swipe
      const isHorizontalSwipe = absX > absY && (absX >= SWIPE_THRESHOLD || velocityX >= VELOCITY_THRESHOLD);
      const isVerticalSwipe = absY > absX && (absY >= SWIPE_THRESHOLD || velocityY >= VELOCITY_THRESHOLD);

      if (!isHorizontalSwipe && !isVerticalSwipe) return;

      const sections = getVisibleSections();
      const currentIdx = getCurrentIndex(sections);

      if (isHorizontalSwipe) {
        if (deltaX < 0) {
          // Swipe LEFT → Next section
          const newIdx = Math.min(sections.length - 1, currentIdx + 1);
          const target = sections[newIdx] || "footer";
          scrollToSection(target);
          showAction("→", target);
        } else {
          // Swipe RIGHT → Previous section
          const newIdx = Math.max(0, currentIdx - 1);
          const target = sections[newIdx] || "hero";
          scrollToSection(target);
          showAction("←", target);
        }
      } else if (isVerticalSwipe) {
        if (deltaY < 0) {
          // Swipe UP → Go to hero/top
          scrollToSection("hero");
          showAction("↑", "hero");
        } else {
          // Swipe DOWN → Go to footer
          scrollToSection("footer");
          showAction("↓", "footer");
        }
      }
    };

    const onTouchCancel = () => {
      swipeRef.current.tracking = false;
    };

    // Add event listeners with consistent passive flags
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true, capture: false });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true, capture: false });

    return () => {
      // Clean up all event listeners
      window.removeEventListener("touchstart", onTouchStart, { capture: false } as EventListenerOptions);
      window.removeEventListener("touchmove", onTouchMove, { capture: false } as EventListenerOptions);
      window.removeEventListener("touchend", onTouchEnd, { capture: false } as EventListenerOptions);
      window.removeEventListener("touchcancel", onTouchCancel, { capture: false } as EventListenerOptions);
      
      // Clean up action timer if component unmounts
      if (actionTimerRef.current) {
        clearTimeout(actionTimerRef.current);
      }
    };
  }, [enabled, isInteractiveElement, getVisibleSections, getCurrentIndex, scrollToSection, showAction]);

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
                  <span className="text-base">👆</span> Swipe to Navigate
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-blue-500/10 rounded-xl p-2.5 border border-blue-500/20">
                    <div className="text-xl mb-1">← →</div>
                    <div className="text-[10px] text-white/60 uppercase tracking-wider">Sections</div>
                  </div>
                  <div className="bg-blue-500/10 rounded-xl p-2.5 border border-blue-500/20">
                    <div className="text-xl mb-1">↑ ↓</div>
                    <div className="text-[10px] text-white/60 uppercase tracking-wider">Top / End</div>
                  </div>
                </div>
                
                <div className="mt-3 flex justify-center">
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
