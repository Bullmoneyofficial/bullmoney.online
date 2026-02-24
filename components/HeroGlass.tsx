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

import { motion, AnimatePresence } from 'framer-motion';
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

// ─── Motion variants ──────────────────────────────────────────────────────────

const glassVariants = {
  hidden: { x: '-130%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.9,
      ease: [0.0, 0.0, 0.2, 1] as [number, number, number, number],
    },
  },
};

const headlineVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: 'easeOut' as const },
  },
};

const subtitleVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

// ─── Grain overlay (inline SVG — zero network request) ────────────────────────

const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E";

// ─── Component ────────────────────────────────────────────────────────────────

const SUBTITLE_TEXT = 'BULLMONEY  |  DAILY TRADING';

export function HeroGlass() {
  const [glassSlid, setGlassSlid] = useState(false);
  const [headlineDone, setHeadlineDone] = useState(false);

  // Typewriter activates once glass has settled
  const subtitle = useTypewriter(SUBTITLE_TEXT, 30, glassSlid);
  const subtitleDone = subtitle.length === SUBTITLE_TEXT.length;

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
          /* Fluid sizing: starts small on mobile, grows on desktop */
          width: 'min(320px, 88vw)',
          height: 'min(400px, 58vh)',
          marginBottom: '36px',
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        {/* BM + Bull logo — sits behind the glass via natural stacking */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '0px',
            zIndex: 1,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/IMG_2921 4.PNG"
            alt="BullMoney BM logo"
            draggable={false}
            style={{
              width: '78%',
              height: 'auto',
              objectFit: 'contain',
              /* Crop the black bar on the right edge of the PNG canvas */
              clipPath: 'inset(0 9% 0 0)',
              filter: 'drop-shadow(0 10px 28px rgba(0,0,0,0.14))',
              userSelect: 'none',
              pointerEvents: 'none',
              /* GPU layer */
              willChange: 'transform',
            }}
          />
        </div>

        {/* Glass panel — slides over logo; backdrop-filter blurs whatever is behind */}
        <motion.div
          variants={glassVariants}
          initial="hidden"
          animate="visible"
          onAnimationComplete={() => setGlassSlid(true)}
          style={{
            position: 'absolute',
            left: 0,
            top: '6%',
            bottom: '6%',
            width: '56%',
            borderRadius: '22px',
            /* Glassmorphism */
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
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

      {/* Cursor blink keyframe — scoped inside shadow DOM via style tag */}
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
    </div>
  );
}
