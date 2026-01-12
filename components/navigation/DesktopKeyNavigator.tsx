"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function DesktopKeyNavigator() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastKey, setLastKey] = useState<string | null>(null);

  const sectionIds = useMemo(() => SECTION_PRIORITY, []);

  useEffect(() => {
    const finePointer = window.matchMedia?.("(pointer: fine)").matches;
    const hover = window.matchMedia?.("(hover: hover)").matches;
    setEnabled(Boolean(finePointer && hover));

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

      const goPrev = () => {
        const target = ids[Math.max(0, currentIndex - 1)] || "top";
        scrollToSection(target);
      };

      const goNext = () => {
        const target = ids[Math.min(ids.length - 1, currentIndex + 1)] || "footer";
        scrollToSection(target);
      };

      const show = (label: string) => {
        setVisible(true);
        setLastKey(label);
        window.setTimeout(() => setLastKey(null), 900);
      };

      switch (e.key) {
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          goPrev();
          show(e.key);
          break;
        case "ArrowDown":
        case "PageDown":
        case " ":
          e.preventDefault();
          goNext();
          show(e.key === " " ? "Space" : e.key);
          break;
        case "Home":
          e.preventDefault();
          scrollToSection("top");
          show("Home");
          break;
        case "End":
          e.preventDefault();
          scrollToSection("footer");
          show("End");
          break;
        case "?":
        case "k":
        case "K":
          setVisible((v) => !v);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, sectionIds]);

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
                <span className="font-mono text-blue-300">↑/↓</span> sections •{" "}
                <span className="font-mono text-blue-300">PgUp/PgDn</span> jump •{" "}
                <span className="font-mono text-blue-300">Home</span> top •{" "}
                <span className="font-mono text-blue-300">End</span> footer
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
