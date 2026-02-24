'use client';

/**
 * HeroGlass — Apple-style animated splash hero for BullMoney.
 *
 * Animation sequence (GPU-only, no layout shifts):
 *  1. Glass card slides from left → center   (0.9 s, cubic-bezier easeOut)
 *  2. "Make money." headline pops in          (0.45 s opacity + scale)
 *  3. Typewriter: "BULLMONEY | DAILY TRADING" (30 ms / char, React state loop)
 *
 * Dismissal is handled externally by the JS controller in layout.tsx
 * which adds the class `.bm-ready` to `#bm-splash`.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// ─── Typewriter hook ──────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 30, active = false): string {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;
    idxRef.current = 0;
    setDisplayed('');

    const tick = () => {
      const next = idxRef.current + 1;
      setDisplayed(text.slice(0, next));
      idxRef.current = next;
      if (next < text.length) {
        timerRef.current = setTimeout(tick, speed);
      }
    };
    timerRef.current = setTimeout(tick, speed);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, text, speed]);

  return displayed;
}

// ─── Grain overlay (inline SVG — zero network request) ────────────────────────

const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E";

// ─── Component ────────────────────────────────────────────────────────────────

const SUBTITLE_TEXT = 'BULLMONEY  |  DAILY TRADING';

export function HeroGlass() {
  const [disclaimerDone, setDisclaimerDone] = useState(false);
  const [glassSlid, setGlassSlid] = useState(false);
  const [headlineDone, setHeadlineDone] = useState(false);
  // Detect device capability for performance tuning
  const [isLiteMode, setIsLiteMode] = useState(false);
  // Loading bar — ticks via setInterval, pure inline width
  const [barWidth, setBarWidth] = useState(0);

  // Dismiss disclaimer after 0.6s
  useEffect(() => {
    const t = setTimeout(() => setDisclaimerDone(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const isSafari = html.classList.contains('is-safari') || html.classList.contains('is-ios-safari');
    const isInApp = html.classList.contains('is-in-app-browser');
    const isMobile = window.innerWidth < 769;
    const mem = (navigator as { deviceMemory?: number }).deviceMemory ?? 0;
    const lowMem = mem > 0 && mem <= 4;
    if (isSafari || isInApp || (isMobile && lowMem)) {
      setIsLiteMode(true);
    }
  }, []);

  // Tick the loading bar from 0→92 over ~2.4s via setInterval
  useEffect(() => {
    let w = 0;
    const interval = setInterval(() => {
      w += 2;
      if (w >= 92) {
        w = 92;
        clearInterval(interval);
      }
      setBarWidth(w);
    }, 50); // 50ms × 46 ticks ≈ 2.3s to reach 92%
    return () => clearInterval(interval);
  }, []);

  // Typewriter activates once glass has settled
  const subtitle = useTypewriter(SUBTITLE_TEXT, 30, glassSlid);
  const subtitleDone = subtitle.length === SUBTITLE_TEXT.length;

  // Blur radius: heavy on desktop Chrome/Firefox, lightweight on Safari/mobile/in-app
  const blurRadius = isLiteMode ? '8px' : '18px';

  // Animation duration: faster on lite mode devices
  const slideDuration = isLiteMode ? 0.55 : 0.9;

  const glassVariants = {
    hidden: { x: '-130%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: slideDuration,
        ease: [0.0, 0.0, 0.2, 1] as [number, number, number, number],
      },
    },
  };

  const headlineVariants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: isLiteMode ? 0.25 : 0.45, ease: 'easeOut' as const },
    },
  };

  const subtitleVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        overflow: 'hidden',
      }}
    >
      {/* ── Grain texture overlay ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${GRAIN_SVG}")`,
          backgroundSize: '256px 256px',
          backgroundRepeat: 'repeat',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Logo + Glass panel layer ── */}
      <div
        style={{
          position: 'relative',
          /* Square container — keeps icon at its natural square aspect ratio */
          width: 'min(300px, 84vw)',
          height: 'min(300px, 84vw)',
          marginBottom: '36px',
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        {/* BM logo — square icon, centered, sits behind the sliding glass panel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingRight: '0px',
            zIndex: 1,
            overflow: 'hidden',
            borderRadius: '8px',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bm-logo-hd.webp"
            alt="BullMoney logo"
            draggable={false}
            // 1024×1024 WebP — HD on 3× retina mobile, 50KB vs 273KB PNG
            fetchPriority="high"
            decoding="async"
            style={{
              /* Width-only sizing — height:auto preserves the 1:1 square aspect ratio */
              width: '86%',
              height: 'auto',
              display: 'block',
              objectFit: 'contain',
              /*
               * Single-layer gradient mask — universally supported in all browsers
               * including iOS WKWebView (in-app browsers) and Android WebView.
               * Dual-layer maskComposite:'intersect' breaks in those environments.
               * overflow:hidden on the parent clips top/bottom; this gradient
               * handles the left/right edge fade and kills the right black bar.
               */
              maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 78%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 78%, transparent 100%)',
              userSelect: 'none',
              pointerEvents: 'none',
              willChange: 'transform',
            }}
          />
        </div>

        {/* Glass panel — slides over logo; backdrop-filter blurs whatever is behind */}
        <motion.div
          variants={glassVariants}
          initial="hidden"
          animate={disclaimerDone ? 'visible' : 'hidden'}
          onAnimationComplete={() => { if (disclaimerDone) setGlassSlid(true); }}
          style={{
            position: 'absolute',
            left: 0,
            top: '6%',
            bottom: '6%',
            width: '56%',
            borderRadius: '22px',
            /* Glassmorphism — reduced blur on Safari/mobile for smoother performance */
            backdropFilter: `blur(${blurRadius})`,
            WebkitBackdropFilter: `blur(${blurRadius})`,
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.78) 0%, rgba(240,240,242,0.52) 100%)',
            border: '1px solid rgba(255,255,255,0.68)',
            boxShadow:
              '0 2px 24px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.9) inset',
            zIndex: 2,
            /* GPU-only transform */
            willChange: 'transform, opacity',
          }}
        />
      </div>

      {/* ── Text section ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          position: 'relative',
          zIndex: 2,
          /* prevent CLS */
          minHeight: '72px',
        }}
      >
        {/* "Make money." — pops in after glass settles */}
        <motion.h1
          variants={headlineVariants}
          initial="hidden"
          animate={glassSlid ? 'visible' : 'hidden'}
          onAnimationComplete={() => setHeadlineDone(true)}
          style={{
            margin: 0,
            fontSize: 'clamp(30px, 7.5vw, 50px)',
            fontWeight: 700,
            color: '#090909',
            letterSpacing: '-0.03em',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
            lineHeight: 1.05,
            textAlign: 'center',
            userSelect: 'none',
            willChange: 'transform, opacity',
          }}
        >
          Make money.
        </motion.h1>

        {/* Subtitle divider + typewriter */}
        <motion.div
          variants={subtitleVariants}
          initial="hidden"
          animate={glassSlid ? 'visible' : 'hidden'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '10px',
              letterSpacing: '0.24em',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
              color: 'rgba(0,0,0,0.34)',
              fontWeight: 500,
              textTransform: 'uppercase',
              userSelect: 'none',
              /* Reserve space so layout doesn't shift during typewriter */
              minWidth: `${SUBTITLE_TEXT.length * 6.2}px`,
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
            {/* Blinking cursor — disappears once typewriter is done */}
            {!subtitleDone && (
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: '1.5px',
                  height: '10px',
                  backgroundColor: 'rgba(0,0,0,0.34)',
                  marginLeft: '2px',
                  verticalAlign: 'middle',
                  animation: 'bm-hero-cursor 0.75s step-end infinite',
                }}
              />
            )}
          </p>
        </motion.div>
      </div>

      {/* ── Loading bar — single div, gradient fill ── */}
      <div
        aria-hidden="true"
        style={{
          width: 160,
          height: 4,
          borderRadius: 3,
          marginTop: 24,
          position: 'relative',
          zIndex: 2,
          backgroundImage: `linear-gradient(to right, #333 0%, #333 ${barWidth}%, rgba(0,0,0,0.12) ${barWidth}%, rgba(0,0,0,0.12) 100%)`,
        }}
      />

      {/* ── Progress % + trading status text ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          marginTop: 14,
          position: 'relative',
          zIndex: 2,
          minHeight: 32,
        }}
      >
        <span
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: '#222',
            letterSpacing: '-0.01em',
            fontVariantNumeric: 'tabular-nums',
            userSelect: 'none',
          }}
        >
          {barWidth}%
        </span>
        <span
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
            fontSize: 9,
            fontWeight: 500,
            color: 'rgba(0,0,0,0.32)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {barWidth < 15
            ? 'Connecting to markets…'
            : barWidth < 35
            ? 'Loading live data…'
            : barWidth < 55
            ? 'Syncing positions…'
            : barWidth < 75
            ? 'Preparing charts…'
            : barWidth < 90
            ? 'Finalizing portfolio…'
            : 'Markets ready'}
        </span>
      </div>

      {/* Cursor blink keyframe */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes bm-hero-cursor {
              0%, 100% { opacity: 1; }
              50%       { opacity: 0; }
            }
          `,
        }}
      />

      {/* ── Disclaimer overlay — shows for ~0.6s before main splash animates ── */}
      <AnimatePresence>
        {!disclaimerDone && (
          <motion.div
            key="bm-disclaimer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } }}
            exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeIn' } }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              padding: '24px',
            }}
          >
            <div
              style={{
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.88) 0%, rgba(240,240,242,0.72) 100%)',
                border: '1px solid rgba(255,255,255,0.72)',
                boxShadow: '0 4px 32px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9) inset',
                borderRadius: '16px',
                maxWidth: '260px',
                width: '100%',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(0,0,0,0.36)',
                  userSelect: 'none',
                }}
              >
                Disclaimer
              </span>
              <p
                style={{
                  margin: 0,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'rgba(0,0,0,0.65)',
                  lineHeight: 1.5,
                  letterSpacing: '-0.01em',
                  userSelect: 'none',
                }}
              >
                Not a registered financial adviser or signal provider.<br />
                No investment advice offered.<br />
                Educational content only.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
