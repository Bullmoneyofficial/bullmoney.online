"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SectionId =
  | "top"
  | "hero"
  | "cta"
  | "features"
  | "experience"
  | "testimonials"
  | "ticker"
  | "footer";

const SECTION_PRIORITY: SectionId[] = [
  "top",
  "hero",
  "cta",
  "features",
  "experience",
  "testimonials",
  "ticker",
  "footer",
];

function isEditableTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;

  const tag = element.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (element.isContentEditable) return true;

  return Boolean(element.closest("[contenteditable='true']"));
}

function isInteractiveTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;

  if (element.closest("a,button,[role='button'],[data-swipe-ignore]")) return true;

  // If the user is inside an overflow scroll container, don't hijack gestures.
  const scrollParent = element.closest("[data-swipe-scrollable],[data-lenis-prevent],.custom-scrollbar");
  if (scrollParent) return true;

  return false;
}

function getAvailableSections(): SectionId[] {
  const isVisible = (el: HTMLElement) => {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (el.getClientRects().length === 0) return false;
    return true;
  };

  return SECTION_PRIORITY.filter((id) => {
    const el = document.getElementById(id);
    if (!el) return false;
    return isVisible(el);
  }).filter((id, index, arr) => arr.indexOf(id) === index);
}

function getCurrentSectionIndex(sectionIds: SectionId[]) {
  if (sectionIds.length === 0) return 0;

  const viewportMid = window.scrollY + window.innerHeight * 0.33;
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < sectionIds.length; i++) {
    const element = document.getElementById(sectionIds[i]!);
    if (!element) continue;
    const top = element.getBoundingClientRect().top + window.scrollY;
    const distance = Math.abs(top - viewportMid);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function scrollToSection(id: SectionId) {
  const element = document.getElementById(id);
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const targetTop = rect.top + window.scrollY - 96;

  window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
}

function highlightNavbar() {
  const navbar = document.querySelector<HTMLElement>("[data-navbar-container]");
  if (!navbar) return;

  navbar.classList.add("navbar-attention");
  window.setTimeout(() => navbar.classList.remove("navbar-attention"), 900);
}

export default function MobileSwipeNavigator() {
  const [enabled, setEnabled] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const swipeStateRef = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    isDown: false,
    activeTarget: null as EventTarget | null,
  });

  useEffect(() => {
    const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;
    const touchCapable = (navigator.maxTouchPoints || 0) > 0;
    setEnabled(coarsePointer || touchCapable);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const thresholdPx = 60;
    const dominancePx = 12;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (isEditableTarget(e.target) || isInteractiveTarget(e.target)) return;

      const t = e.touches[0]!;
      swipeStateRef.current = {
        startX: t.clientX,
        startY: t.clientY,
        lastX: t.clientX,
        lastY: t.clientY,
        isDown: true,
        activeTarget: e.target,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!swipeStateRef.current.isDown) return;
      if (e.touches.length !== 1) return;

      const t = e.touches[0]!;
      swipeStateRef.current.lastX = t.clientX;
      swipeStateRef.current.lastY = t.clientY;

      const deltaX = t.clientX - swipeStateRef.current.startX;
      const deltaY = t.clientY - swipeStateRef.current.startY;

      // Only suppress scroll when it's clearly a horizontal swipe.
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > dominancePx) {
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (!swipeStateRef.current.isDown) return;

      const deltaX = swipeStateRef.current.lastX - swipeStateRef.current.startX;
      const deltaY = swipeStateRef.current.lastY - swipeStateRef.current.startY;
      swipeStateRef.current.isDown = false;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX < thresholdPx && absY < thresholdPx) return;

      const ids = getAvailableSections();
      const currentIndex = getCurrentSectionIndex(ids);

      const goPrev = () => {
        const target = ids[Math.max(0, currentIndex - 1)] || "top";
        scrollToSection(target);
        setLastAction("Swiped ← (UP)");
      };

      const goNext = () => {
        const target = ids[Math.min(ids.length - 1, currentIndex + 1)] || "footer";
        scrollToSection(target);
        setLastAction("Swiped → (DOWN)");
      };

      const goFooter = () => {
        scrollToSection("footer");
        setLastAction("Swiped ↓ (FOOTER)");
      };

      const navBarMove = () => {
        highlightNavbar();
        if (window.scrollY > 120) {
          scrollToSection("top");
        }
        setLastAction("Swiped ↑ (NAVBAR)");
      };

      // Requested mapping:
      // left => go up, right => go down
      // up => move navbar, down => footer
      if (absX > absY) {
        if (deltaX < 0) goPrev();
        else goNext();
      } else {
        if (deltaY < 0) navBarMove();
        else goFooter();
      }

      if (navigator.vibrate) navigator.vibrate(10);

      // Auto-hide the hint after first interaction.
      setShowHint(false);

      window.setTimeout(() => setLastAction(null), 1200);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes swipe-nav-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes swipe-nav-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .swipe-nav-spin { animation: swipe-nav-spin 6s linear infinite; }
        [data-navbar-container].navbar-attention {
          filter: var(--theme-filter, none) drop-shadow(0 0 18px rgba(59,130,246,0.55));
        }
      `}</style>

      {(showHint || lastAction) && (
        <div className="fixed inset-x-0 bottom-4 z-[99998] flex justify-center px-4 pointer-events-none">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl">
            {/* Spinning conic shimmer border */}
            <span className="absolute inset-[-2px] swipe-nav-spin bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_25%,#60a5fa_50%,#3b82f6_75%,#00000000_100%)] opacity-40 rounded-2xl" />

            <div className="relative m-[1px] rounded-2xl bg-black/70 backdrop-blur-xl border border-blue-500/25 overflow-hidden">
              {/* shimmer line */}
              <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden">
                <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent opacity-80" style={{ animation: "swipe-nav-shimmer 2.8s linear infinite" }} />
              </div>

              <div className="px-4 py-3 text-center">
                <div className="text-[10px] uppercase tracking-[0.3em] font-black text-blue-200/70">
                  Mobile Navigation
                </div>
                <div className="mt-1 text-xs font-semibold text-white/90">
                  Swipe left = up • right = down • up = navbar • down = footer
                </div>
                {lastAction && (
                  <div className="mt-1 text-[11px] font-mono text-blue-300/80">{lastAction}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
