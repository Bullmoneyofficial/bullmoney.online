"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useLenis } from "@/lib/smoothScroll";

// ============================================================================
// DESKTOP KEYBOARD NAVIGATOR - 2026 Best Practices
// Supports: Arrow keys, WASD, Vim keys (HJKL), number keys, Home/End
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

// Key mappings - all lowercase for easy comparison
const PREV_KEYS = new Set(["arrowup", "arrowleft", "pageup", "w", "k", "h"]);
const NEXT_KEYS = new Set(["arrowdown", "arrowright", "pagedown", "s", "j", "l", " ", "enter"]);
const TOP_KEYS = new Set(["home"]);
const BOTTOM_KEYS = new Set(["end"]);

export default function DesktopKeyNavigator() {
  const { scrollTo: lenisScrollTo, lenis } = useLenis();
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownInitialRef = useRef(false);

  // Check if we're on desktop (has fine pointer - mouse/trackpad)
  useEffect(() => {
    const check = () => {
      // Enable if device has a fine pointer (mouse/trackpad) regardless of touch capability
      // This allows laptops with touchscreens to still use keyboard nav
      const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
      const wide = window.innerWidth >= 768;
      setEnabled(hasFinePointer && wide);
    };
    
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Show initial hint on first load for desktop users
  useEffect(() => {
    if (enabled && !hasShownInitialRef.current) {
      hasShownInitialRef.current = true;
      // Show hint briefly on load
      const showTimer = setTimeout(() => {
        setVisible(true);
        // Auto-hide after 4 seconds
        hideTimerRef.current = setTimeout(() => {
          setVisible(false);
        }, 4000);
      }, 1500);
      return () => clearTimeout(showTimer);
    }
  }, [enabled]);

  // Get visible sections
  const getVisibleSections = useCallback((): SectionId[] => {
    return SECTIONS.filter((id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });
  }, []);

  // Get current section index based on scroll position
  const getCurrentIndex = useCallback((sections: SectionId[]): number => {
    if (sections.length === 0) return 0;
    
    const scrollY = window.scrollY + 96; // Account for navbar
    const viewportMid = scrollY + window.innerHeight * 0.3;
    
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

  // Scroll to section - keyboard triggered only, doesn't affect mouse scroll
  const scrollToSection = useCallback((id: SectionId) => {
    const el = document.getElementById(id);
    if (!el) return;

    // Calculate target position with navbar offset (96px for navbar height)
    const targetTop = el.getBoundingClientRect().top + window.scrollY - 96;
    const finalTop = Math.max(0, targetTop);
    
    // Use Lenis for smooth scroll if available, otherwise native
    if (lenis) {
      // Use Lenis scrollTo with proper configuration
      lenis.scrollTo(el, {
        offset: -96, // navbar height offset
        duration: 0.6,
        easing: (t: number) => 1 - Math.pow(1 - t, 3) // easeOutCubic
      });
    } else {
      // Native smooth scroll fallback
      window.scrollTo({
        top: finalTop,
        behavior: "smooth"
      });
    }
  }, [lenis]);

  // Current section tracking
  const [currentSection, setCurrentSection] = useState<SectionId | null>(null);

  // Show key indicator
  const showKey = useCallback((key: string, section?: SectionId) => {
    setVisible(true);
    setLastKey(key);
    if (section) setCurrentSection(section);
    
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setLastKey(null);
      setVisible(false);
    }, 3000);
  }, []);

  // Check if user is typing in an input
  const isTyping = useCallback((): boolean => {
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName.toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || 
           (active as HTMLElement).isContentEditable;
  }, []);

  // Keyboard event handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with typing or modified keys
      if (isTyping()) return;
      if (e.altKey || e.metaKey || e.ctrlKey) return;

      const key = e.key.toLowerCase();
      const sections = getVisibleSections();
      const currentIdx = getCurrentIndex(sections);

      // Number keys 1-9 jump to sections
      if (/^[1-9]$/.test(e.key)) {
        const idx = Math.min(sections.length - 1, parseInt(e.key) - 1);
        const target = sections[idx];
        if (target) {
          e.preventDefault();
          scrollToSection(target);
          showKey(`${e.key}`, target);
        }
        return;
      }

      // Shift+G = go to bottom (vim style) - CHECK FIRST before lowercase g
      if ((key === "g" && e.shiftKey) || e.key === "G") {
        e.preventDefault();
        scrollToSection("footer");
        showKey("⏬", "footer");
        return;
      }

      // G key alone = go to top/hero (vim style)
      if (key === "g" && !e.shiftKey) {
        e.preventDefault();
        scrollToSection("hero");
        showKey("⏫", "hero");
        return;
      }

      // Previous section
      if (PREV_KEYS.has(key)) {
        e.preventDefault();
        const newIdx = Math.max(0, currentIdx - 1);
        const target = sections[newIdx] || "hero";
        scrollToSection(target);
        showKey("↑", target);
        return;
      }

      // Next section
      if (NEXT_KEYS.has(key)) {
        e.preventDefault();
        const newIdx = Math.min(sections.length - 1, currentIdx + 1);
        const target = sections[newIdx] || "footer";
        scrollToSection(target);
        showKey("↓", target);
        return;
      }

      // Jump to top (Home key)
      if (TOP_KEYS.has(key)) {
        e.preventDefault();
        scrollToSection("hero");
        showKey("⏫", "hero");
        return;
      }

      // Jump to bottom
      if (BOTTOM_KEYS.has(key)) {
        e.preventDefault();
        scrollToSection("footer");
        showKey("⏬", "footer");
        return;
      }

      // Toggle hint visibility with ? or /
      if (e.key === "?" || (key === "/" && !e.shiftKey)) {
        e.preventDefault();
        setVisible((v) => !v);
        return;
      }

      // Hide hint
      if (key === "escape") {
        setVisible(false);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [enabled, isTyping, getVisibleSections, getCurrentIndex, scrollToSection, showKey]);

  // Don't render on mobile/touch devices
  if (!enabled) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes keynav-fade-in {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes keynav-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes keynav-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.2); }
          50% { box-shadow: 0 0 30px rgba(59,130,246,0.4); }
        }
        .keynav-animate {
          animation: keynav-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .keynav-glow {
          animation: keynav-glow 2s ease-in-out infinite;
        }
      `}</style>

      {visible && (
        <div className="fixed bottom-6 right-6 z-[99998] pointer-events-none keynav-animate">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-blue-500/20 keynav-glow">
            <div className="relative bg-black/90 backdrop-blur-2xl border border-blue-500/40 rounded-2xl overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-[-100%] w-full bg-gradient-to-r from-transparent via-blue-400/80 to-transparent"
                  style={{ animation: "keynav-shimmer 2s linear infinite" }} 
                />
              </div>

              <div className="px-5 py-4 min-w-[300px]">
                {/* Current Section Display */}
                {currentSection && lastKey && (
                  <div className="mb-3 pb-3 border-b border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lastKey}</span>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {SECTION_LABELS[currentSection]}
                        </div>
                        <div className="text-[10px] text-blue-300/60 uppercase tracking-wider">
                          Section {SECTIONS.indexOf(currentSection) + 1} of {SECTIONS.length}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Help Content */}
                {!lastKey && (
                  <>
                    <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-blue-300/80 mb-3 flex items-center gap-2">
                      <span className="text-base">⌨️</span> Keyboard Navigation
                    </div>
                    
                    <div className="space-y-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <kbd className="px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 font-mono">↑</kbd>
                          <kbd className="px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 font-mono">↓</kbd>
                        </div>
                        <span className="text-white/40">or</span>
                        <kbd className="px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 font-mono">W/S</kbd>
                        <span className="text-white/50">navigate sections</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 font-mono">1-8</kbd>
                        <span className="text-white/50">jump to section</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 font-mono">G</kbd>
                        <span className="text-white/40">/</span>
                        <kbd className="px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 font-mono">⇧G</kbd>
                        <span className="text-white/50">top / bottom</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-blue-500/10 text-[10px] text-blue-200/40">
                      <kbd className="px-1 bg-blue-500/10 rounded">?</kbd> toggle • <kbd className="px-1 bg-blue-500/10 rounded">Esc</kbd> hide
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
