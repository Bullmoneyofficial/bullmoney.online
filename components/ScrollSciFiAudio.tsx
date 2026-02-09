"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAudioSettings } from "@/contexts/AudioSettingsProvider";

const SCROLL_IDLE_MS = 140;
const BASE_GAIN = 0.06;
const MIN_SCROLL_DELTA = 4;
const SPEED_SMOOTHING = 0.2;

type ScrollNodes = {
  osc: OscillatorNode;
  gain: GainNode;
  filter: BiquadFilterNode;
  noise: AudioBufferSourceNode;
  noiseGain: GainNode;
  noiseFilter: BiquadFilterNode;
};

const createNoiseBuffer = (ctx: AudioContext) => {
  const duration = 1.2;
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.35;
  }

  return buffer;
};

const buildNodes = (ctx: AudioContext): ScrollNodes => {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 720;
  filter.Q.value = 0.55;
  filter.connect(gain);

  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = 150;
  osc.connect(filter);

  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx);
  noise.loop = true;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.12;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "highpass";
  noiseFilter.frequency.value = 1500;

  noise.connect(noiseGain);
  noiseGain.connect(noiseFilter);
  noiseFilter.connect(gain);

  return { osc, gain, filter, noise, noiseGain, noiseFilter };
};

export function ScrollSciFiAudio() {
  const { sfxVolume, masterMuted } = useAudioSettings();
  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<ScrollNodes | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const lastScrollYRef = useRef(0);
  const lastSpeedRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const unlockedRef = useRef(false);
  const isActiveRef = useRef(false);

  const stopSound = useCallback(() => {
    const ctx = contextRef.current;
    const nodes = nodesRef.current;
    if (!ctx || !nodes) return;

    const now = ctx.currentTime;
    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.linearRampToValueAtTime(0, now + 0.08);

    const stopAt = now + 0.12;
    try {
      nodes.osc.stop(stopAt);
      nodes.noise.stop(stopAt);
    } catch {
      // ignore
    }

    nodesRef.current = null;
    isActiveRef.current = false;
  }, []);

  const ensureAudio = useCallback(async () => {
    if (typeof window === "undefined") return null;

    if (!contextRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      contextRef.current = new Ctx();
    }

    const ctx = contextRef.current;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return null;
      }
    }

    return ctx;
  }, []);

  const unlockAudio = useCallback(() => {
    if (unlockedRef.current) return;
    ensureAudio().then((ctx) => {
      if (ctx) unlockedRef.current = true;
    });
  }, [ensureAudio]);

  const startSound = useCallback(async () => {
    const ctx = await ensureAudio();
    if (!ctx) return null;

    if (!nodesRef.current) {
      nodesRef.current = buildNodes(ctx);
      nodesRef.current.osc.start();
      nodesRef.current.noise.start();
    }

    isActiveRef.current = true;
    return nodesRef.current;
  }, [ensureAudio]);

  const updateSound = useCallback(async (speed: number) => {
    if (masterMuted || sfxVolume <= 0) return;

    const ctx = await ensureAudio();
    if (!ctx) return;

    const nodes = (await startSound()) ?? nodesRef.current;
    if (!nodes) return;

    const now = ctx.currentTime;
    const base = BASE_GAIN * Math.min(1, Math.max(0, sfxVolume));
    const targetGain = Math.min(0.12, base * (0.25 + speed * 0.85));

    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.linearRampToValueAtTime(targetGain, now + 0.05);

    nodes.osc.frequency.setTargetAtTime(140 + speed * 220, now, 0.03);
    nodes.filter.frequency.setTargetAtTime(620 + speed * 1200, now, 0.04);
    nodes.noiseGain.gain.setTargetAtTime(0.08 + speed * 0.14, now, 0.06);
  }, [masterMuted, sfxVolume, ensureAudio, startSound]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (prefersReduced) return undefined;

    lastScrollYRef.current = window.scrollY;
    lastScrollTimeRef.current = performance.now();

    const tick = () => {
      rafIdRef.current = null;
      const now = performance.now();
      const nextY = window.scrollY;
      const delta = Math.abs(nextY - lastScrollYRef.current);
      const elapsed = Math.max(16, now - lastScrollTimeRef.current);
      lastScrollYRef.current = nextY;
      lastScrollTimeRef.current = now;

      if (delta < MIN_SCROLL_DELTA) return;
      if (masterMuted || sfxVolume <= 0) return;

      const rawSpeed = Math.min(1, (delta / elapsed) * 18);
      const speed = lastSpeedRef.current + (rawSpeed - lastSpeedRef.current) * SPEED_SMOOTHING;
      lastSpeedRef.current = speed;
      updateSound(speed);

      if (stopTimerRef.current) {
        window.clearTimeout(stopTimerRef.current);
      }
      stopTimerRef.current = window.setTimeout(stopSound, SCROLL_IDLE_MS);
    };

    const handleScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      if (document.hidden) stopSound();
    };

    const unlockEvents: Array<keyof WindowEventMap> = ["pointerdown", "touchstart", "keydown"];
    unlockEvents.forEach((event) => window.addEventListener(event, unlockAudio, { passive: true }));

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      unlockEvents.forEach((event) => window.removeEventListener(event, unlockAudio));
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (stopTimerRef.current) {
        window.clearTimeout(stopTimerRef.current);
      }
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
      stopSound();
      if (contextRef.current && contextRef.current.state !== "closed") {
        contextRef.current.close().catch(() => {});
      }
      contextRef.current = null;
    };
  }, [masterMuted, sfxVolume, stopSound, updateSound, unlockAudio]);

  useEffect(() => {
    if (masterMuted || sfxVolume <= 0) {
      stopSound();
      return;
    }

    if (isActiveRef.current) {
      updateSound(lastSpeedRef.current);
    }
  }, [masterMuted, sfxVolume, stopSound, updateSound]);

  return null;
}
