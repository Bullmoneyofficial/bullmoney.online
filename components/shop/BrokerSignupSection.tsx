'use client';

import { useState, useCallback, memo } from 'react';
import Image from 'next/image';
import { ExternalLink, Copy, Check, ChevronRight, Shield, Zap, TrendingUp } from 'lucide-react';

// --- SAME BROKER LINKS & CODES AS components/REGISTER USERS/pagemode.tsx ---
const BROKER_CONFIG = {
  Vantage: {
    link: 'https://vigco.co/iQbe2u',
    code: 'BULLMONEY',
    name: 'Vantage',
    description: 'Global broker with tight spreads & fast execution',
    features: ['Raw spreads from 0.0', 'MT4 & MT5', '1:1000 leverage', 'Unlimited on select accounts'],
    accent: 'rgba(41, 151, 255, 0.12)',
    accentBorder: 'rgba(41, 151, 255, 0.25)',
    accentText: '#2997FF',
    logo: '/svgs/VANTAGESIGNUPBTN.svg',
  },
  XM: {
    link: 'https://affs.click/t5wni',
    code: 'X3R7P',
    name: 'XM',
    description: 'Award-winning broker with 10M+ clients worldwide',
    features: ['Ultra-low spreads', 'MT4 & MT5', '1:1000 leverage', 'Unlimited on select accounts'],
    accent: 'rgba(220, 38, 38, 0.08)',
    accentBorder: 'rgba(220, 38, 38, 0.2)',
    accentText: '#DC2626',
    logo: '/svgs/XMSIGNUPBTN.svg',
  },
} as const;

type BrokerName = keyof typeof BROKER_CONFIG;

const STEPS = [
  { number: '1', label: 'Choose a broker', sublabel: 'Pick XM or Vantage below' },
  { number: '2', label: 'Copy the partner code', sublabel: 'Use it when signing up' },
  { number: '3', label: 'Open your account', sublabel: 'Takes less than 2 minutes' },
];

/** Apple-style broker signup section for the Store page.
 *  Same links, codes, and logic as components/REGISTER USERS/pagemode.tsx */
export const BrokerSignupSection = memo(function BrokerSignupSection() {
  const [activeBroker, setActiveBroker] = useState<BrokerName>('Vantage');
  const [copied, setCopied] = useState(false);
  const [hoverBroker, setHoverBroker] = useState<BrokerName | null>(null);
  const broker = BROKER_CONFIG[activeBroker];

  // Robust clipboard copy with fallback — same as pagemode.tsx
  const copyCode = useCallback(async (code: string) => {
    if (!code) return;
    try {
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
          return;
        } catch {
          /* fallback below */
        }
      }
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.setAttribute('readonly', '');
      textarea.style.cssText =
        'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;z-index:-1;';
      document.body.appendChild(textarea);
      const range = document.createRange();
      range.selectNodeContents(textarea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textarea.setSelectionRange(0, textarea.value.length);
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* silent */
    }
  }, []);

  const handleBrokerClick = useCallback(() => {
    window.open(broker.link, '_blank');
  }, [broker.link]);

  const handleBrokerSwitch = useCallback((b: BrokerName) => {
    if (activeBroker === b) return;
    setActiveBroker(b);
    setCopied(false);
  }, [activeBroker]);

  const handleSignupRedirect = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('bullmoney_pagemode_force_login', 'true');
      localStorage.setItem('bullmoney_pagemode_redirect_path', '/store');
      localStorage.removeItem('bullmoney_pagemode_login_view');
    } catch {}
    window.location.href = '/';
  }, []);

  return (
    <section
      data-store-broker-signup
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: '#f5f5f7',
        borderTop: '1px solid rgba(0,0,0,0.04)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      }}
    >

      <div
        className="relative mx-auto w-full max-w-6xl px-6 py-20 sm:px-10 sm:py-28"
        style={{
          backgroundColor: '#fff',
          borderRadius: 24,
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
        }}
      >
        {/* Header */}
        <div className="mb-14 text-center">
          <p
            className="text-[11px] uppercase tracking-[0.28em] font-medium"
            style={{ color: 'rgba(0,0,0,0.4)' }}
          >
            Create a broker / trading account
          </p>
          <h2
            className="mt-3 text-2xl sm:text-4xl font-semibold tracking-tight"
            style={{ color: '#1D1D1F', letterSpacing: '-0.025em' }}
          >
            BullMoney Brokers (Required)
          </h2>
          <p
            className="mx-auto mt-3 max-w-lg text-sm sm:text-base"
            style={{ color: 'rgba(0,0,0,0.5)', lineHeight: 1.6 }}
          >
            These are our official brokers. You must use the partner code when trading to join
            the BullMoney community or keep access. Pick a broker, copy the code, and finish signup.
          </p>
        </div>

        {/* Steps pills */}
        <div className="mx-auto mb-12 flex max-w-xl flex-wrap items-center justify-center gap-3 sm:gap-4">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold"
                  style={{
                    backgroundColor: '#000',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  }}
                >
                  {s.number}
                </span>
                <div className="text-left">
                  <p className="text-[13px] font-medium" style={{ color: '#1D1D1F' }}>
                    {s.label}
                  </p>
                  <p className="text-[11px]" style={{ color: 'rgba(0,0,0,0.35)' }}>
                    {s.sublabel}
                  </p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight
                  className="hidden sm:block"
                  style={{ width: 14, height: 14, color: 'rgba(0,0,0,0.15)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Broker cards */}
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {(Object.keys(BROKER_CONFIG) as BrokerName[]).map((key) => {
            const b = BROKER_CONFIG[key];
            const isActive = activeBroker === key;
            const isHover = hoverBroker === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleBrokerSwitch(key)}
                onMouseEnter={() => setHoverBroker(key)}
                onMouseLeave={() => setHoverBroker(null)}
                className="group relative rounded-2xl text-left transition-all duration-300"
                style={{
                  padding: '20px 22px',
                  border: isActive
                    ? `1.5px solid ${b.accentBorder}`
                    : '1.5px solid rgba(0,0,0,0.06)',
                  backgroundColor: isActive ? b.accent : isHover ? 'rgba(0,0,0,0.015)' : '#fff',
                  boxShadow: isActive
                    ? `0 4px 24px -6px ${b.accentBorder}`
                    : '0 1px 3px rgba(0,0,0,0.04)',
                  transform: isActive ? 'translateY(-2px)' : isHover ? 'translateY(-1px)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <div
                    className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: b.accentText,
                      boxShadow: `0 0 8px ${b.accentText}40`,
                    }}
                  />
                )}
                
                {/* Logo with shimmer background (blue for Vantage, red for XM) */}
                <div
                  className="mb-4 inline-flex items-center justify-center rounded-xl overflow-hidden"
                  style={{
                    width: 120,
                    height: 60,
                    background: key === 'XM' 
                      ? 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #f87171 100%)'
                      : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
                    boxShadow: key === 'XM'
                      ? '0 4px 20px rgba(220, 38, 38, 0.3), inset 0 1px 2px rgba(255,255,255,0.2)'
                      : '0 4px 20px rgba(59, 130, 246, 0.3), inset 0 1px 2px rgba(255,255,255,0.2)',
                    position: 'relative',
                  }}
                >
                  {/* Shimmer effect overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                      animation: 'shimmer 2.5s infinite',
                    }}
                  />
                  <Image
                    src={b.logo}
                    alt={`${b.name} logo`}
                    width={100}
                    height={50}
                    className="relative z-10"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                
                <h3
                  className="text-lg font-semibold"
                  style={{ color: '#1D1D1F', letterSpacing: '-0.01em' }}
                >
                  {b.name}
                </h3>
                <p
                  className="mt-1 text-[13px]"
                  style={{ color: 'rgba(0,0,0,0.5)', lineHeight: 1.5 }}
                >
                  {b.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {b.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: isActive ? `${b.accentText}10` : 'rgba(0,0,0,0.03)',
                        color: isActive ? b.accentText : 'rgba(0,0,0,0.45)',
                        border: `1px solid ${isActive ? `${b.accentText}20` : 'rgba(0,0,0,0.05)'}`,
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action card — copy code + open broker */}
        <div
          className="mx-auto mt-8 max-w-3xl rounded-2xl"
          style={{
            backgroundColor: '#fff',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          {/* Code display */}
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
          >
            <div>
              <p
                className="text-[10px] uppercase font-medium"
                style={{ color: 'rgba(0,0,0,0.35)', letterSpacing: '0.08em' }}
              >
                {activeBroker} Partner Code
              </p>
              <p
                className="mt-0.5 text-xl font-bold tracking-wide"
                style={{ color: '#1D1D1F', letterSpacing: '0.04em' }}
              >
                {broker.code}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyCode(broker.code)}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: copied ? '#E8F5E9' : 'rgba(0,0,0,0.04)',
                color: copied ? '#2E7D32' : '#1D1D1F',
                border: copied ? '1px solid #A5D6A7' : '1px solid rgba(0,0,0,0.08)',
              }}
            >
              {copied ? (
                <>
                  <Check style={{ width: 14, height: 14 }} /> Copied!
                </>
              ) : (
                <>
                  <Copy style={{ width: 14, height: 14 }} /> Copy Code
                </>
              )}
            </button>
          </div>

          {/* Instructions + CTA */}
          <div className="flex flex-col gap-5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1.5 text-[12px]" style={{ color: 'rgba(0,0,0,0.45)' }}>
              <p>
                <span style={{ fontWeight: 600, color: 'rgba(0,0,0,0.6)' }}>1.</span> Copy the code
                above
              </p>
              <p>
                <span style={{ fontWeight: 600, color: 'rgba(0,0,0,0.6)' }}>2.</span> Open the
                broker link &amp; paste it when signing up
              </p>
              <p>
                <span style={{ fontWeight: 600, color: 'rgba(0,0,0,0.6)' }}>3.</span> Come back and{' '}
                <a
                  href="/register"
                  className="font-medium underline decoration-black/20 underline-offset-2 hover:decoration-black/40"
                  style={{ color: 'rgba(0,0,0,0.7)' }}
                >
                  finish sign-up
                </a>
              </p>
            </div>
            <button
              type="button"
              onClick={handleBrokerClick}
              className="flex items-center justify-center gap-2 rounded-full px-7 py-3 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 sm:shrink-0"
              style={{
                background: '#000',
                boxShadow: '0 4px 20px -4px rgba(0,0,0,0.3)',
              }}
            >
              Open {activeBroker} Account <ExternalLink style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>

        <div className="mx-auto mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleSignupRedirect}
            className="rounded-full border border-black/10 bg-white px-6 py-2.5 text-[13px] font-semibold text-black transition-all duration-200 hover:-translate-y-0.5"
            style={{ boxShadow: '0 8px 24px -10px rgba(0,0,0,0.18)' }}
          >
            Create BullMoney Account
          </button>
          <p className="text-[11px]" style={{ color: 'rgba(0,0,0,0.4)' }}>
            Use the same broker code to stay active in the community.
          </p>
        </div>

        {/* Trust badges */}
        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-6 sm:gap-10">
          {[
            { icon: Shield, label: 'Regulated Brokers' },
            { icon: Zap, label: 'Instant Access' },
            { icon: TrendingUp, label: 'No Payment Needed' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon style={{ width: 16, height: 16, color: 'rgba(0,0,0,0.3)' }} />
              <span className="text-[12px] font-medium" style={{ color: 'rgba(0,0,0,0.4)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
});

// Add shimmer animation keyframes
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;
  if (!document.querySelector('style[data-shimmer-animation]')) {
    style.setAttribute('data-shimmer-animation', 'true');
    document.head.appendChild(style);
  }
}
