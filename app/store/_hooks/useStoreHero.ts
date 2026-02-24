'use client';

/**
 * useStoreHero.ts
 *
 * Manages all hero carousel state:
 *  - allowHeavyHero gate (idle callback / reduced-motion check)
 *  - heroSlideIndex (auto-advance, video-finish gate)
 *  - heroImageIndex (lightweight fallback cycle before heavy assets load)
 *  - heroVideoFinished flag
 *  - resolvedHeroSlide (what actually renders inside the hero)
 *  - heroImageReady (first image preload sentinel)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { userStorage } from '@/lib/smartStorage';
import {
  HERO_CAROUSEL_SLIDES,
  HERO_IMAGE_INDICES,
  HERO_VIDEO_INDICES,
  FIRST_HERO_IMAGE_INDEX,
  FIRST_HERO_VIDEO_INDEX,
  HERO_SLIDE_DURATION,
  HERO_CACHE_KEY,
  HERO_CACHE_TTL,
} from '../_constants/hero.constants';

export function useStoreHero(hasMounted: boolean) {
  const [allowHeavyHero, setAllowHeavyHero] = useState(false);
  const [heroSlideIndex, setHeroSlideIndex] = useState(() => FIRST_HERO_VIDEO_INDEX);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [heroImageReady, setHeroImageReady] = useState(false);
  const [heroVideoFinished, setHeroVideoFinished] = useState(false);
  const [showHeroMapOverlay] = useState(() => Math.random() < 0.05);

  const heroCacheLoadedRef = useRef(false);

  // ── Derived compound flag ──────────────────────────────────────────────────
  const allowHeavyHeroReady = allowHeavyHero && hasMounted && heroImageReady;

  // ── Resolved slide (the actual thing shown in the hero) ───────────────────
  const resolvedHeroSlide = useMemo(() => {
    const fallbackImage =
      HERO_CAROUSEL_SLIDES[FIRST_HERO_IMAGE_INDEX] || HERO_CAROUSEL_SLIDES[0];

    if (!hasMounted || !allowHeavyHeroReady) {
      const imageIndex = HERO_IMAGE_INDICES[heroImageIndex] ?? FIRST_HERO_IMAGE_INDEX;
      return HERO_CAROUSEL_SLIDES[imageIndex] || fallbackImage;
    }

    return HERO_CAROUSEL_SLIDES[heroSlideIndex];
  }, [allowHeavyHero, hasMounted, heroImageReady, heroImageIndex, heroSlideIndex]);

  // ── Initialize slide index from cache ────────────────────────────────────
  useEffect(() => {
    if (heroCacheLoadedRef.current) return;
    heroCacheLoadedRef.current = true;
    setHeroSlideIndex(FIRST_HERO_VIDEO_INDEX);
    setHeroVideoFinished(false);
  }, []);

  // ── Persist slide index to cache ─────────────────────────────────────────
  useEffect(() => {
    if (!heroCacheLoadedRef.current) return;
    userStorage.set(HERO_CACHE_KEY, heroSlideIndex, HERO_CACHE_TTL);
  }, [heroSlideIndex]);

  // ── Reset video-finished flag when slide changes ──────────────────────────
  useEffect(() => {
    const currentSlide = HERO_CAROUSEL_SLIDES[heroSlideIndex];
    if (currentSlide?.type === 'video') {
      setHeroVideoFinished(false);
      return;
    }
    setHeroVideoFinished(true);
  }, [heroSlideIndex]);

  // ── Preload first image, then set heroImageReady ───────────────────────────
  useEffect(() => {
    if (!hasMounted) return;

    const firstImage = HERO_CAROUSEL_SLIDES[FIRST_HERO_IMAGE_INDEX];
    if (!firstImage || firstImage.type !== 'image') {
      setHeroImageReady(true);
      return;
    }

    const img = new Image();
    img.src = firstImage.src as string;
    if (img.complete) {
      setHeroImageReady(true);
      return;
    }

    const handleLoad = () => setHeroImageReady(true);
    const handleError = () => setHeroImageReady(true);
    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [hasMounted]);

  // ── Heavy-asset gate: wait for idle / skip if reduced-motion ─────────────
  useEffect(() => {
    if (!hasMounted || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAllowHeavyHero(false);
      return;
    }

    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const activate = () => setAllowHeavyHero(true);

    if ('requestIdleCallback' in window) {
      idleId = (window as any).requestIdleCallback(activate, { timeout: 900 });
    } else {
      timeoutId = setTimeout(activate, 250);
    }

    return () => {
      if (idleId !== null && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [hasMounted]);

  // ── Auto-cycle slides every HERO_SLIDE_DURATION seconds ──────────────────
  useEffect(() => {
    if (!hasMounted) return;

    const interval = setInterval(() => {
      if (!allowHeavyHeroReady) {
        if (HERO_IMAGE_INDICES.length > 1) {
          setHeroImageIndex((prev) => (prev + 1) % HERO_IMAGE_INDICES.length);
        }
        return;
      }

      const currentSlide = HERO_CAROUSEL_SLIDES[heroSlideIndex];
      if (currentSlide?.type === 'video' && !heroVideoFinished) return;

      setHeroSlideIndex((prev) => (prev + 1) % HERO_CAROUSEL_SLIDES.length);
    }, HERO_SLIDE_DURATION * 1000);

    return () => clearInterval(interval);
  }, [allowHeavyHeroReady, hasMounted, heroSlideIndex, heroVideoFinished]);

  const onVideoEnded = useCallback(() => setHeroVideoFinished(true), []);

  return {
    allowHeavyHeroReady,
    resolvedHeroSlide,
    heroSlideIndex,
    showHeroMapOverlay,
    onVideoEnded,
  };
}
