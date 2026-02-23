'use client';

import { useEffect, useState } from 'react';
import './splash.css';
import {
  SPLASH_VISIBLE_MS,
  SPLASH_FADE_MS,
  SPLASH_TOTAL_MS,
  SPLASH_IMAGE_SRC,
  SPLASH_IMAGE_ALT,
  SPLASH_IMAGE_SIZE,
} from './splashConfig';

/** Cinematic car-pass swoosh – layered noise with Doppler-style pitch arc. */
function buildSwoosh(ctx: AudioContext) {
  const now = ctx.currentTime;

  // ── Helper: one noise layer ──────────────────────────────────────────────
  const makeLayer = (
    gainPeak: number,
    attackT: number,
    decayT: number,
    freqStart: number,
    freqPeak: number,
    freqEnd: number,
    arcPeak: number,   // time of frequency peak (Doppler midpoint)
    q: number,
  ) => {
    const totalDur = attackT + decayT;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * totalDur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.Q.value = q;
    // Doppler arc: rise to arcPeak then fall
    bpf.frequency.setValueAtTime(freqStart, now);
    bpf.frequency.exponentialRampToValueAtTime(freqPeak, now + arcPeak);
    bpf.frequency.exponentialRampToValueAtTime(freqEnd, now + totalDur);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(gainPeak, now + attackT);
    env.gain.exponentialRampToValueAtTime(0.001, now + totalDur);

    src.connect(bpf);
    bpf.connect(env);
    env.connect(ctx.destination);
    src.start(now);
    src.stop(now + totalDur);
    return totalDur;
  };

  // ── Layer 1: deep body rumble (tyre/engine low-end) ─────────────────────
  const t1 = makeLayer(0.55, 0.06, 0.80, 60,  220,  55,  0.22, 1.4);

  // ── Layer 2: mid whoosh body ─────────────────────────────────────────────
  const t2 = makeLayer(0.40, 0.05, 0.75, 180, 900,  140, 0.20, 1.1);

  // ── Layer 3: high-frequency air slash (cinematic top-end) ────────────────
  const t3 = makeLayer(0.22, 0.03, 0.55, 900, 4200, 600, 0.14, 0.8);

  // ── Sub-bass thump at the moment the car "hits" ──────────────────────────
  const sub = ctx.createOscillator();
  const subEnv = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(85, now);
  sub.frequency.exponentialRampToValueAtTime(28, now + 0.18);
  subEnv.gain.setValueAtTime(0, now);
  subEnv.gain.linearRampToValueAtTime(0.70, now + 0.015);
  subEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  sub.connect(subEnv);
  subEnv.connect(ctx.destination);
  sub.start(now);
  sub.stop(now + 0.25);

  const longest = Math.max(t1, t2, t3, 0.25);
  setTimeout(() => ctx.close().catch(() => {}), (longest + 0.3) * 1000);
}

function playSwoosh() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    if (ctx.state === 'running') {
      // Already unlocked (reload, or browser allows autoplay)
      buildSwoosh(ctx);
    } else {
      // Suspended (first cold load on strict browsers) –
      // resume on the very first user gesture (touchstart fires before click)
      let played = false;
      const unlock = () => {
        if (played) return;
        played = true;
        ['touchstart', 'mousedown', 'pointerdown', 'keydown'].forEach(e =>
          document.removeEventListener(e, unlock, true)
        );
        ctx.resume().then(() => buildSwoosh(ctx)).catch(() => {});
      };
      ['touchstart', 'mousedown', 'pointerdown', 'keydown'].forEach(e =>
        document.addEventListener(e, unlock, { once: true, capture: true })
      );
      // Also try a direct resume in case the policy is lenient enough
      ctx.resume().then(() => {
        if (!played && ctx.state === 'running') {
          played = true;
          buildSwoosh(ctx);
        }
      }).catch(() => {});
    }
  } catch {
    // Web Audio not available – silent fallback
  }
}

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Swoosh – plays immediately on reloads; falls back to first gesture on cold load
    playSwoosh();

    const fadeTimer = setTimeout(() => setFading(true), SPLASH_VISIBLE_MS);
    const hideTimer = setTimeout(() => setHidden(true), SPLASH_TOTAL_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!mounted || hidden) return null;

  return (
    <div
      role="status"
      aria-label="Loading BullMoney"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Smooth scale+blur dissolve on exit
        animation: fading
          ? `bm-splash-fade-out ${SPLASH_FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`
          : 'none',
        pointerEvents: fading ? 'none' : 'all',
        willChange: fading ? 'opacity, transform, filter' : 'auto',
      }}
    >
      <img
        src={SPLASH_IMAGE_SRC}
        alt={SPLASH_IMAGE_ALT}
        width={SPLASH_IMAGE_SIZE}
        height={SPLASH_IMAGE_SIZE}
        style={{
          width: `${SPLASH_IMAGE_SIZE}px`,
          height: 'auto',
          objectFit: 'contain',
          // Crop ~12px from the right to remove the black edge artifact in the PNG
          clipPath: 'inset(0 12px 0 0)',
          // mix-blend-mode: multiply makes white areas transparent on white bg
          mixBlendMode: 'multiply' as const,
          // Pulse while loading; shrink-fade-out on exit
          animation: fading
            ? `bm-splash-img-out ${SPLASH_FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`
            : `bm-splash-pulse 1.3s ease-in-out infinite`,
          willChange: 'transform, opacity, filter',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
        draggable={false}
      />
    </div>
  );
}
