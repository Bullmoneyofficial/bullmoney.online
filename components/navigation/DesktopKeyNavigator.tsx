"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useLenis } from "@/lib/smoothScroll";

// ============================================================================
// DESKTOP KEYBOARD NAVIGATOR - 2026 Best Practices
// Supports: Arrow keys, WASD, Vim keys (HJKL), number keys, Home/End
// ============================================================================

type SectionId = "top" | "hero" | "cta" | "features" | "experience" | "testimonials" | "ticker" | "footer";

// Sections matching app/page.tsx structure
const SECTIONS: SectionId[] = ["top", "hero", "cta", "features", "experience", "testimonials", "ticker", "footer"];

// Section labels for display
const SECTION_LABELS: Record<SectionId, string> = {
  top: "Top",
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

  // Check if we're on desktop (no touch, wide screen)
  useEffect(() => {
    const check = () => {
      const hasKeyboard = window.matchMedia("(pointer: fine)").matches;
      const wide = window.innerWidth >= 768;
      const noTouch = !("ontouchstart" in window) || navigator.maxTouchPoints === 0;
      setEnabled(hasKeyboard && wide && noTouch);
    };
    
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
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

  // Get current section index based on scroll position
  const getCurrentIndex = useCallback((sections: SectionId[]): number => {
    if (sections.length === 0) return 0;
    
    const scrollY = window.scrollY;
    const viewportMid = scrollY + window.innerHeight * 0.35;
    
    let bestIdx = 0;
    let bestDist = Infinity;
    
    for (let i = 0; i < sections.length; i++) {
      const el = document.getElementById(sections[i]);
      if (!el) continue;
      const top = el.getBoundingClientRect().top + scrollY;
      const dist = Math.abs(top - viewportMid);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    
    return bestIdx;
  }, []);

  // Scroll to a section with smooth animation
  const scrollToSection = useCallback((id: SectionId) => {
    const el = document.getElementById(id);
    if (!el) return;

    // Use Lenis if available, otherwise native smooth scroll
    if (lenis) {
      lenisScrollTo(el, { offset: -96, duration: 0.9 });
    } else {
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }, [lenis, lenisScrollTo]);

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

      // G key alone = go to top (vim style)
      if (key === "g" && !e.shiftKey) {
        e.preventDefault();
        scrollToSection("top");
        showKey("⏫", "top");
        return;
      }

      // Shift+G = go to bottom (vim style)
      if (key === "g" && e.shiftKey) {
        e.preventDefault();
        scrollToSection("footer");
        showKey("⏬", "footer");
        return;
      }

      // Previous section
      if (PREV_KEYS.has(key)) {
        e.preventDefault();
        const newIdx = Math.max(0, currentIdx - 1);
        const target = sections[newIdx] || "top";
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

      // Jump to top
      if (TOP_KEYS.has(key)) {
        e.preventDefault();
        scrollToSection("top");
        showKey("⏫", "top");
        return;
      }

      // Jump to bottom
      if (BOTTOM_KEYS.has(key)) {
        e.preventDefault();
        scrollToSection("footer");
        showKey("⏬", "footer");
        return;
      }

      // Toggle hint visibility
      if (key === "?" || key === "/") {
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
