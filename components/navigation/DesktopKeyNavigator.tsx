"use client";

import { useEffect, useMemo, useState } from "react";
import { useLenis } from "@/lib/smoothScroll";

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

function isEditableActiveElement() {
  const active = document.activeElement as HTMLElement | null;
  if (!active) return false;

  const tag = active.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (active.isContentEditable) return true;

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

  const candidate = document.querySelector<HTMLElement>("[data-scrollable]");
  const scrollRoot = (() => {
    if (candidate) {
      const style = window.getComputedStyle(candidate);
      const overflowY = style.overflowY;
      const canScrollY =
        (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
        candidate.scrollHeight - candidate.clientHeight > 4;
      if (canScrollY) return candidate;
    }
    return (
      (document.scrollingElement as HTMLElement | null) ||
      (document.documentElement as HTMLElement)
    );
  })();
  const scrollTop = scrollRoot === document.documentElement ? window.scrollY : scrollRoot.scrollTop;
  const viewportH = scrollRoot === document.documentElement ? window.innerHeight : scrollRoot.clientHeight;
  const rootRectTop = scrollRoot === document.documentElement ? 0 : scrollRoot.getBoundingClientRect().top;

  const viewportMid = scrollTop + viewportH * 0.33;
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < sectionIds.length; i++) {
    const element = document.getElementById(sectionIds[i]!);
    if (!element) continue;
    const top = element.getBoundingClientRect().top - rootRectTop + scrollTop;
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

  const candidate = document.querySelector<HTMLElement>("[data-scrollable]");
  const scrollRoot = (() => {
    if (candidate) {
      const style = window.getComputedStyle(candidate);
      const overflowY = style.overflowY;
      const canScrollY =
        (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
        candidate.scrollHeight - candidate.clientHeight > 4;
      if (canScrollY) return candidate;
    }
    return (
      (document.scrollingElement as HTMLElement | null) ||
      (document.documentElement as HTMLElement)
    );
  })();
  const scrollTop = scrollRoot === document.documentElement ? window.scrollY : scrollRoot.scrollTop;
  const rootRectTop = scrollRoot === document.documentElement ? 0 : scrollRoot.getBoundingClientRect().top;

  const rect = element.getBoundingClientRect();
  const targetTop = rect.top - rootRectTop + scrollTop - 96;

  if (scrollRoot === document.documentElement) {
    window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
  } else {
    scrollRoot.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
  }
}

export default function DesktopKeyNavigator() {
  const { scrollTo: lenisScrollTo } = useLenis();
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastKey, setLastKey] = useState<string | null>(null);

  useEffect(() => {
    const anyPointerCoarse = window.matchMedia?.("(any-pointer: coarse)")?.matches ?? false;
    const pointerCoarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
    const touchCapable = (navigator.maxTouchPoints || 0) > 0;
    const wide = window.innerWidth >= 768;

    // Enable on true desktops/laptops. (Trackpads still count as fine pointer.)
    setEnabled(Boolean(wide && !touchCapable && !(anyPointerCoarse || pointerCoarse)));

    const t = window.setTimeout(() => setVisible(false), 6500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableActiveElement()) return;
      if (e.altKey || e.metaKey || e.ctrlKey) return;

      const ids = getAvailableSections();
      const currentIndex = getCurrentSectionIndex(ids);

      const scrollToSectionAnimated = (id: SectionId) => {
        const element = document.getElementById(id);
        if (!element) return;

        // Prefer Lenis if available, but always keep a native fallback.
        lenisScrollTo(element, { offset: -96, duration: 1.0 });
        scrollToSection(id);
      };

      const goPrev = () => {
        const target = ids[Math.max(0, currentIndex - 1)] || "top";
        scrollToSectionAnimated(target);
      };

      const goNext = () => {
        const target = ids[Math.min(ids.length - 1, currentIndex + 1)] || "footer";
        scrollToSectionAnimated(target);
      };

      const show = (label: string) => {
        setVisible(true);
        setLastKey(label);
        window.setTimeout(() => setLastKey(null), 900);
      };

      // Expanded keymap (desktop-friendly):
      // Prev: ↑/←, PgUp, W/K, H
      // Next: ↓/→, PgDn, S/J, L, Space/Enter
      // Top: Home, G
      // Footer: End, Shift+G
      // Toggle hint: ?
      // Hide hint: Esc
      const key = e.key;

      // Section jumps (1-9) map to visible sections.
      if (/^[1-9]$/.test(key)) {
        const index = Math.min(ids.length - 1, Math.max(0, Number(key) - 1));
        const target = ids[index];
        if (target) {
          e.preventDefault();
          scrollToSectionAnimated(target);
          show(`#${key}`);
        }
        return;
      }

      const isPrev =
        key === "ArrowUp" ||
        key === "ArrowLeft" ||
        key === "PageUp" ||
        key === "w" ||
        key === "W" ||
        key === "k" ||
        key === "K" ||
        key === "h" ||
        key === "H";

      const isNext =
        key === "ArrowDown" ||
        key === "ArrowRight" ||
        key === "PageDown" ||
        key === "s" ||
        key === "S" ||
        key === "j" ||
        key === "J" ||
        key === "l" ||
        key === "L" ||
        key === " " ||
        key === "Enter";

      if (isPrev) {
        e.preventDefault();
        goPrev();
        show(key);
        return;
      }

      if (isNext) {
        e.preventDefault();
        goNext();
        show(key === " " ? "Space" : key);
        return;
      }

      if (key === "Home" || key === "g") {
        e.preventDefault();
        scrollToSectionAnimated("top");
        show(key === "g" ? "g" : "Home");
        return;
      }

      if (key === "End" || key === "G") {
        e.preventDefault();
        scrollToSectionAnimated("footer");
        show(key === "G" ? "G" : "End");
        return;
      }

      if (key === "?") {
        setVisible((v) => !v);
        return;
      }

      if (key === "Escape") {
        setVisible(false);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, [enabled, lenisScrollTo]);

  if (!enabled || !visible) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes key-nav-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes key-nav-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .key-nav-spin { animation: key-nav-spin 5s linear infinite; }
      `}</style>

      <div className="fixed bottom-6 right-6 z-[99998] pointer-events-none">
        <div className="relative w-[320px] max-w-[80vw] overflow-hidden rounded-2xl">
          <span className="absolute inset-[-2px] key-nav-spin bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_25%,#60a5fa_50%,#3b82f6_75%,#00000000_100%)] opacity-25 rounded-2xl" />

          <div className="relative m-[1px] rounded-2xl bg-black/70 backdrop-blur-xl border border-blue-500/20 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden">
              <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/55 to-transparent opacity-75" style={{ animation: "key-nav-shimmer 2.6s linear infinite" }} />
            </div>

            <div className="px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.3em] font-black text-blue-200/70">
                Keyboard Navigation
              </div>
              <div className="mt-1 text-[12px] text-white/90">
                <span className="font-mono text-blue-300">↑/↓/←/→</span> sections •{" "}
                <span className="font-mono text-blue-300">W/S</span> or <span className="font-mono text-blue-300">H/J/K/L</span> •{" "}
                <span className="font-mono text-blue-300">Space/Enter</span> next •{" "}
                <span className="font-mono text-blue-300">Home/End</span> •{" "}
                <span className="font-mono text-blue-300">1-9</span> jump
              </div>
              <div className="mt-1 text-[10px] text-blue-200/60">
                Press <span className="font-mono">K</span> to toggle this hint
              </div>
              {lastKey && (
                <div className="mt-1 text-[11px] font-mono text-blue-300/80">{lastKey}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
