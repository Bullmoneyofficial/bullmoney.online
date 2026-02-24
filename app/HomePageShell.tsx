import Image from "next/image";

export default function HomePageShell() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050915', color: '#ffffff' }}>
      {/* Inline critical CSS to avoid FOUC */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bm-shell-spin { to { transform: rotate(360deg); } }
        @keyframes bm-shell-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        .bm-shell-pulse { animation: bm-shell-pulse 1.5s ease-in-out infinite; }
      `}} />

      {/* Header skeleton - matches StoreHeader height (48px) */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 48, backgroundColor: 'rgba(5,9,21,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="relative w-8 h-8">
              <Image
                src="/bullmoney-logo.png"
                alt="BullMoney"
                fill
                priority
                sizes="32px"
                className="object-contain"
              />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: '#ffffff' }}>BullMoney</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 80, height: 28, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.06)' }} className="bm-shell-pulse" />
            <div style={{ width: 32, height: 32, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.06)' }} className="bm-shell-pulse" />
          </div>
        </div>
      </div>

      {/* Hero section skeleton - matches actual hero dimensions */}
      <div
        style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 48, contain: 'layout style paint', backgroundColor: '#050915' }}
      >
        {/* Background gradient */}
        <div
          style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #050915, #0a1022, #050915)' }}
          aria-hidden="true"
        />

        {/* Logo and loading - positioned for LCP optimization */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-8 px-4">
          {/* Logo - critical for LCP */}
          <div className="relative w-48 h-14 md:w-64 md:h-20">
            <Image
              src="/bullmoney-logo.png"
              alt="BullMoney - Free Trading Community"
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 768px) 192px, 256px"
              className="object-contain"
            />
          </div>

          {/* Tagline - helps with SEO and perceived performance */}
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: '28rem' }}>
            Free Trading Community • Crypto • Gold • Forex
          </p>

          {/* Loading indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            <div
              style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.12)', borderTopColor: 'rgba(255,255,255,0.6)', borderRadius: 9999, animation: 'bm-shell-spin 0.8s linear infinite' }}
            />
            <span>Loading experience...</span>
          </div>
        </div>

        {/* Decorative radial glow */}
        <div
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 60%)' }}
          aria-hidden="true"
        />
      </div>

      {/* Below-fold skeleton content - helps with CLS */}
      <div style={{ backgroundColor: '#050915', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', gap: '2rem', contain: 'layout style paint' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{ maxWidth: '80rem', margin: '0 auto', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: 24, minHeight: 200, contentVisibility: 'auto', containIntrinsicSize: 'auto 200px' }}
          >
            <div style={{ width: 128, height: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 16 }} className="bm-shell-pulse" />
            <div style={{ width: 192, height: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 24 }} className="bm-shell-pulse" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {[1, 2, 3, 4].map((j) => (
                <div key={j} style={{ aspectRatio: '16/9', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)' }} className="bm-shell-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
