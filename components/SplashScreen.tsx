import {
  SPLASH_FADE_MS,
  SPLASH_IMAGE_SRC,
  SPLASH_IMAGE_ALT,
  SPLASH_IMAGE_SIZE,
} from './splashConfig';

// Server-rendered splash — pure HTML/CSS, zero React hooks.
// Dismissal is driven by the splash-failsafe controller in layout.tsx which:
//   • always shows the splash for at least SPLASH_MIN_MS
//   • waits for `window.dispatchEvent(new CustomEvent('bm-spline-ready'))` from Spline pages
//   • falls back to SPLASH_FALLBACK_MS on pages without Spline
//   • hard-caps at SPLASH_MAX_MS so it never hangs forever
// The controller adds the `.bm-ready` class to #bm-splash which triggers the CSS fade below.
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
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
/* ── core animations ────────────────────────────────────── */
@keyframes bm-splash-pulse{
  0%,100%{transform:scale(1) translateY(0);}
  50%{transform:scale(1.06) translateY(-18px);}
}
@keyframes bm-splash-out{
  0%{opacity:1;}
  100%{opacity:0;visibility:hidden;pointer-events:none;}
}
@keyframes bm-splash-img-out{
  0%{opacity:1;transform:scale(1) translateY(0);}
  100%{opacity:0;transform:scale(0.82) translateY(10px);}
}
@keyframes bm-bar-run{
  0%{transform:translateX(-100%);}
  100%{transform:translateX(420%);}
}

/* ── sonar rings ────────────────────────────────────────── */
@keyframes bm-ring-expand{
  0%  {transform:translate(-50%,-50%) scale(0.85);opacity:0.55;}
  100%{transform:translate(-50%,-50%) scale(2.1); opacity:0;}
}
.bm-ring{
  position:absolute;
  top:50%;left:50%;
  width:min(${SPLASH_IMAGE_SIZE}px,85vw);
  height:min(${SPLASH_IMAGE_SIZE}px,85vw);
  border-radius:50%;
  border:1.5px solid rgba(0,0,0,0.09);
  pointer-events:none;
  animation:bm-ring-expand 2.6s cubic-bezier(0.2,0.6,0.4,1) infinite;
}
.bm-ring:nth-child(2){animation-delay:0.85s;}
.bm-ring:nth-child(3){animation-delay:1.7s;}

/* ── tagline ────────────────────────────────────────────── */
@keyframes bm-tag-in{
  0%  {opacity:0;transform:translateY(7px);}
  100%{opacity:1;transform:translateY(0);}
}
#bm-splash-tag{
  margin:0;
  margin-top:14px;
  font-size:10px;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  letter-spacing:0.22em;
  text-transform:uppercase;
  color:rgba(0,0,0,0.32);
  font-weight:500;
  user-select:none;
  pointer-events:none;
  animation:bm-tag-in 0.6s cubic-bezier(0.2,0.6,0.4,1) 0.35s both;
}

/* ── dismiss ─────────────────────────────────────────────── */
/* Controller adds .bm-ready → fades entire container (all children together) */
#bm-splash.bm-ready{
  animation:bm-splash-out ${SPLASH_FADE_MS}ms cubic-bezier(0.4,0,0.2,1) forwards;
}
/* Override inline-style pulse so the image fades instead of pulsing on dismiss */
#bm-splash.bm-ready img{
  animation:bm-splash-img-out ${SPLASH_FADE_MS}ms cubic-bezier(0.4,0,0.2,1) forwards!important;
}

/* ── desktop: hide sonar rings ───────────────────────────── */
@media(min-width:768px){
  .bm-ring{display:none!important;}
}

/* ── reduced-motion ──────────────────────────────────────── */
@media(prefers-reduced-motion:reduce){
  #bm-splash.bm-ready,#bm-splash.bm-ready img{animation-duration:200ms!important;}
  #bm-splash img{animation:none!important;}
  #bm-splash-bar-fill{animation-duration:2s!important;}
  .bm-ring{animation:none!important;opacity:0!important;}
  #bm-splash-tag{animation:none!important;opacity:1;}
}
          `,
        }}
      />

      {/* Logo wrapper — relative so the sonar rings are positioned from its centre */}
      <div
        id="bm-logo-wrap"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {/* Sonar rings — expand outward from behind the logo */}
        <div className="bm-ring" />
        <div className="bm-ring" />
        <div className="bm-ring" />

        <img
          src={SPLASH_IMAGE_SRC}
          alt={SPLASH_IMAGE_ALT}
          width={SPLASH_IMAGE_SIZE}
          height={SPLASH_IMAGE_SIZE}
          style={{
            position: 'relative', // sits above the rings
            width: `min(${SPLASH_IMAGE_SIZE}px, 85vw)`,
            height: 'auto',
            objectFit: 'contain',
            clipPath: 'inset(0 12px 0 0)',
            userSelect: 'none',
            pointerEvents: 'none',
            willChange: 'transform, opacity',
            animation: `bm-splash-pulse 1.3s ease-in-out infinite`,
          }}
          draggable={false}
        />
      </div>

      {/* Loading bar */}
      <div
        id="bm-splash-bar"
        style={{
          width: `min(220px, 55vw)`,
          height: '5px',
          marginTop: '28px',
          borderRadius: '99px',
          backgroundColor: 'rgba(0,0,0,0.10)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          id="bm-splash-bar-fill"
          style={{
            width: '30%',
            height: '100%',
            borderRadius: '99px',
            backgroundColor: '#18181b',
            animation: 'bm-bar-run 1.2s cubic-bezier(0.4,0,0.2,1) infinite',
            willChange: 'transform',
          }}
        />
      </div>

      {/* Tagline — fades in 350 ms after mount */}
      <p id="bm-splash-tag">Free Trading Community</p>
    </div>
  );
}
