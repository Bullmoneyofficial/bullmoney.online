"use client";

import { useEffect, useRef } from "react";
import { useAudioSettings } from "@/contexts/AudioSettingsProvider";

const SCROLL_IDLE_MS = 150;
const BASE_GAIN = 0.06;
const MIN_SCROLL_DELTA = 4;
const SPEED_SMOOTHING = 0.2;

const SCROLL_SFX_EVENT = "bullmoney-scroll-sfx";

type ScrollSfxDetail = {
  /** Absolute/relative scroll delta in px since last frame (either X or Y). */
  delta?: number;
  /** Time delta in ms that `delta` occurred over. */
  elapsed?: number;
  /** Precomputed 0..1 speed/intensity. If provided, `delta/elapsed` is ignored. */
  speed?: number;
};

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

  // Keep reactive values in refs so the main effect never re-runs
  const sfxRef = useRef(sfxVolume);
  const mutedRef = useRef(masterMuted);
  sfxRef.current = sfxVolume;
  mutedRef.current = masterMuted;

  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<ScrollNodes | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const lastScrollYRef = useRef(0);
  const lastSpeedRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const unlockedRef = useRef(false);

  // Stable effect — runs once, reads refs for reactive values
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (prefersReduced) return undefined;

    lastScrollYRef.current = window.scrollY;
    lastScrollTimeRef.current = performance.now();

    const ensureCtx = (): AudioContext | null => {
      if (!contextRef.current) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return null;
        contextRef.current = new Ctx();
      }
      const ctx = contextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      return ctx;
    };

    const stopSound = () => {
      const ctx = contextRef.current;
      const nodes = nodesRef.current;
      if (!ctx || !nodes) return;

      const now = ctx.currentTime;
      try {
        nodes.gain.gain.cancelScheduledValues(now);
        nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, now);
        nodes.gain.gain.linearRampToValueAtTime(0, now + 0.08);
      } catch { /* ignore */ }

      setTimeout(() => {
        try { nodes.osc.stop(); } catch { /* */ }
        try { nodes.noise.stop(); } catch { /* */ }
        try { nodes.gain.disconnect(); } catch { /* */ }
      }, 120);

      nodesRef.current = null;
    };

    const startSound = (): ScrollNodes | null => {
      const ctx = ensureCtx();
      if (!ctx) return null;

      if (!nodesRef.current) {
        const nodes = buildNodes(ctx);
        nodes.osc.start();
        nodes.noise.start();
        nodesRef.current = nodes;
      }

      return nodesRef.current;
    };

    const updateSound = (speed: number) => {
      if (mutedRef.current || sfxRef.current <= 0) return;

      const nodes = startSound();
      if (!nodes) return;
      const ctx = contextRef.current;
      if (!ctx) return;

      const now = ctx.currentTime;
      const base = BASE_GAIN * Math.min(1, Math.max(0, sfxRef.current));
      const targetGain = Math.min(0.12, base * (0.25 + speed * 0.85));

      try {
        nodes.gain.gain.cancelScheduledValues(now);
        nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, now);
        nodes.gain.gain.linearRampToValueAtTime(targetGain, now + 0.05);
        nodes.osc.frequency.setTargetAtTime(140 + speed * 220, now, 0.03);
        nodes.filter.frequency.setTargetAtTime(620 + speed * 1200, now, 0.04);
        nodes.noiseGain.gain.setTargetAtTime(0.08 + speed * 0.14, now, 0.06);
      } catch { /* node disconnected */ }
    };

    const tick = () => {
      rafIdRef.current = null;
      const now = performance.now();
      const nextY = window.scrollY;
      const delta = Math.abs(nextY - lastScrollYRef.current);
      const elapsed = Math.max(16, now - lastScrollTimeRef.current);
      lastScrollYRef.current = nextY;
      lastScrollTimeRef.current = now;

      if (delta < MIN_SCROLL_DELTA) return;
      if (mutedRef.current || sfxRef.current <= 0) return;

      const rawSpeed = Math.min(1, (delta / elapsed) * 18);
      const speed = lastSpeedRef.current + (rawSpeed - lastSpeedRef.current) * SPEED_SMOOTHING;
      lastSpeedRef.current = speed;
      updateSound(speed);

      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = window.setTimeout(stopSound, SCROLL_IDLE_MS);
    };

    const handleScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    const handleExternalSfx = (event: Event) => {
      const custom = event as CustomEvent<ScrollSfxDetail>;
      const detail = custom.detail ?? {};
      if (mutedRef.current || sfxRef.current <= 0) return;

      let rawSpeed = 0;
      if (typeof detail.speed === "number" && Number.isFinite(detail.speed)) {
        rawSpeed = detail.speed;
      } else {
        const delta = Math.abs(detail.delta ?? 0);
        const elapsed = Math.max(16, detail.elapsed ?? 16);
        if (delta < MIN_SCROLL_DELTA) return;
        rawSpeed = Math.min(1, (delta / elapsed) * 18);
      }

      const speed = lastSpeedRef.current + (rawSpeed - lastSpeedRef.current) * SPEED_SMOOTHING;
      lastSpeedRef.current = speed;
      updateSound(speed);

      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = window.setTimeout(stopSound, SCROLL_IDLE_MS);
    };

    const handleVisibility = () => {
      if (document.hidden) stopSound();
    };

    const unlockAudio = () => {
      if (unlockedRef.current) return;
      const ctx = ensureCtx();
      if (ctx) unlockedRef.current = true;
    };

    const unlockEvents: Array<keyof WindowEventMap> = ["pointerdown", "touchstart", "keydown"];
    unlockEvents.forEach((e) => window.addEventListener(e, unlockAudio, { passive: true }));
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener(SCROLL_SFX_EVENT, handleExternalSfx as EventListener);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      unlockEvents.forEach((e) => window.removeEventListener(e, unlockAudio));
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener(SCROLL_SFX_EVENT, handleExternalSfx as EventListener);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
      if (rafIdRef.current !== null) window.cancelAnimationFrame(rafIdRef.current);
      stopSound();
      if (contextRef.current && contextRef.current.state !== "closed") {
        contextRef.current.close().catch(() => {});
      }
      contextRef.current = null;
    };
  }, []);  

  // When muted/volume changes to 0, kill active sound immediately
  useEffect(() => {
    if (masterMuted || sfxVolume <= 0) {
      const ctx = contextRef.current;
      const nodes = nodesRef.current;
      if (ctx && nodes) {
        const now = ctx.currentTime;
        try {
          nodes.gain.gain.cancelScheduledValues(now);
          nodes.gain.gain.setValueAtTime(0, now);
        } catch { /* */ }
        try { nodes.osc.stop(); } catch { /* */ }
        try { nodes.noise.stop(); } catch { /* */ }
        try { nodes.gain.disconnect(); } catch { /* */ }
        nodesRef.current = null;
      }
    }
  }, [masterMuted, sfxVolume]);

  return null;
}
