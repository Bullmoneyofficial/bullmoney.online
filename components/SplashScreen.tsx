import {
  SPLASH_VISIBLE_MS,
  SPLASH_FADE_MS,
  SPLASH_TOTAL_MS,
  SPLASH_IMAGE_SRC,
  SPLASH_IMAGE_ALT,
  SPLASH_IMAGE_SIZE,
} from './splashConfig';

// Server-rendered splash: zero React hooks and no WebAudio on the critical path.
// The layout-level failsafe script removes #bm-splash after a short timeout and
// dispatches the bm-splash-finished event for downstream systems.
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
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        willChange: 'opacity, transform',
        // Fade + dissolve after SPLASH_VISIBLE_MS
        animation:
          `bm-splash-fade-out ${SPLASH_FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1) ${SPLASH_VISIBLE_MS}ms forwards, ` +
          // At the very end, make the overlay inert even if JS removal fails.
          `bm-splash-hide 1ms linear ${SPLASH_TOTAL_MS}ms forwards`,
      }}
    >
      <style
        // Keyframes are inlined to avoid a separate CSS import on the critical path.
        dangerouslySetInnerHTML={{
          __html: `
@keyframes bm-splash-pulse {
  0%, 100% { transform: translate3d(0, 0px, 0) scale(1); }
  50% { transform: translate3d(0, -22px, 0) scale(1.06); }
}

@keyframes bm-splash-fade-out {
  0% { opacity: 1; transform: scale(1); }
  60% { opacity: 0.55; transform: scale(1.04); }
  100% { opacity: 0; transform: scale(1.09); }
}

@keyframes bm-splash-img-out {
  0% { opacity: 1; transform: translate3d(0, var(--pulse-y, 0px), 0) scale(1); }
  100% { opacity: 0; transform: translate3d(0, 12px, 0) scale(0.82); }
}

@keyframes bm-splash-hide {
  to { visibility: hidden; pointer-events: none; }
}

/* In-app browsers / constrained devices can set html.reduce-effects which forces animation-duration to 0.01s.
   Override ONLY for the splash so it still visibly animates. */
html.reduce-effects #bm-splash{
  animation-duration: ${SPLASH_FADE_MS}ms, 1ms !important;
}
html.reduce-effects #bm-splash > img{
  animation-duration: 1300ms, ${SPLASH_FADE_MS}ms !important;
}
          `,
        }}
      />

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
          willChange: 'transform, opacity',
          transform: 'translateZ(0)',
          userSelect: 'none',
          pointerEvents: 'none',
          // Pulse immediately, then shrink+fade during the wrapper's fade-out window.
          animation:
            `bm-splash-pulse 1.3s ease-in-out infinite, ` +
            `bm-splash-img-out ${SPLASH_FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1) ${SPLASH_VISIBLE_MS}ms forwards`,
        }}
        draggable={false}
      />
    </div>
  );
}
