"use client";

import { useCallback, useEffect, useRef } from "react";
import { SCROLL_RESUME_DELAY } from "../constants";

interface UseAutoScrollOptions {
  /** Number of items (used to detect when content is ready) */
  itemCount: number;
  /** Whether the component is visible in the viewport */
  isVisible: boolean;
  /** Pixels per animation frame */
  scrollSpeed: number;
  /** How many times the item list is duplicated in the DOM */
  duplicateCount: number;
}

/**
 * Drives continuous rAF-based horizontal scrolling with infinite-loop snapping.
 * Pauses on user interaction and auto-resumes after idle timeout.
 *
 * Returns:
 *  - scrollRef: attach to the scrollable container
 *  - onUserScroll: scroll event handler (maintains infinite loop during manual scroll)
 *  - pauseAuto: call on mousedown / touchstart / wheel to pause auto-scroll
 */
export function useAutoScroll({
  itemCount,
  isVisible,
  scrollSpeed,
  duplicateCount,
}: UseAutoScrollOptions) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const userScrollingRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll + infinite loop logic (pauses when not visible)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || itemCount === 0 || !isVisible) return;

    const tick = () => {
      if (!userScrollingRef.current && el && isVisible) {
        el.scrollLeft += scrollSpeed;
        // Infinite loop: when scrolled past the first set, jump back
        const half = el.scrollWidth / duplicateCount;
        if (el.scrollLeft >= half * (duplicateCount - 1)) {
          el.scrollLeft -= half;
        }
        if (el.scrollLeft <= 0) {
          el.scrollLeft += half;
        }
      }
      autoScrollRef.current = requestAnimationFrame(tick);
    };

    autoScrollRef.current = requestAnimationFrame(tick);
    return () => {
      if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
    };
  }, [itemCount, isVisible, scrollSpeed, duplicateCount]);

  // Handle user scroll — maintain infinite loop snap during manual scroll
  const onUserScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const section = el.scrollWidth / duplicateCount;
    if (el.scrollLeft >= section * (duplicateCount - 1)) el.scrollLeft -= section;
    if (el.scrollLeft <= 0) el.scrollLeft += section;
  }, [duplicateCount]);

  // Pause auto-scroll on user interaction, resume after idle timeout
  const pauseAuto = useCallback(() => {
    userScrollingRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      userScrollingRef.current = false;
    }, SCROLL_RESUME_DELAY);
  }, []);

  return { scrollRef, onUserScroll, pauseAuto } as const;
}
