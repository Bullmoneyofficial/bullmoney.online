'use client';

/**
 * SplashScreen — wraps HeroGlass in the #bm-splash container.
 *
 * Dismissal is driven by the JS controller in layout.tsx:
 *   • adds `.bm-ready` → CSS fade-out kicks in
 *   • removes element from DOM after SPLASH_FADE_MS
 *
 * This component owns the `id="bm-splash"` root div + dismiss CSS,
 * and renders the Apple-style HeroGlass visual inside it.
 */

import { SPLASH_FADE_MS } from './splashConfig';
import { HeroGlass } from './HeroGlass';

export function SplashScreen() {
  return (
    <div
      id="bm-splash"
      role="status"
      aria-label="Loading BullMoney"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        overflow: 'hidden',
        /* GPU-composite so the CSS fade-out is cheap */
        willChange: 'opacity',
      }}
    >
      {/* ── Dismiss animation ─────────────────────────────────────────────
          JS controller adds .bm-ready to #bm-splash → CSS fade fires.
          Pure CSS ensures it works even before React hydration on fast loads.
      ─────────────────────────────────────────────────────────────────────── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes bm-splash-out{
  0%  { opacity: 1; }
  100%{ opacity: 0; visibility: hidden; pointer-events: none; }
}
#bm-splash.bm-ready{
  animation: bm-splash-out ${SPLASH_FADE_MS}ms cubic-bezier(0.4,0,0.2,1) forwards;
  pointer-events: none;
}
@media(prefers-reduced-motion:reduce){
  #bm-splash.bm-ready{ animation-duration: 200ms !important; }
}
          `,
        }}
      />

      {/* Apple-style glass hero — Framer Motion animations + loading bar */}
      <HeroGlass />
    </div>
  );
}
