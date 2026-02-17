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
    accent: 'rgba(41, 151, 255, 0.15)',
    accentBorder: 'rgba(41, 151, 255, 0.35)',
    accentText: '#2997FF',
    logo: '/svgs/VANTAGESIGNUPBTN.svg',
  },
  XM: {
    link: 'https://affs.click/t5wni',
    code: 'X3R7P',
    name: 'XM',
    description: 'Award-winning broker with 10M+ clients worldwide',
    features: ['Ultra-low spreads', 'MT4 & MT5', '1:1000 leverage', 'Unlimited on select accounts'],
    accent: 'rgba(220, 38, 38, 0.12)',
    accentBorder: 'rgba(220, 38, 38, 0.3)',
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

/** Dark-themed broker signup section for the Home page.
 *  Same links, codes, and logic as components/REGISTER USERS/pagemode.tsx */
export const BrokerSignupSectionDark = memo(function BrokerSignupSectionDark() {
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
      localStorage.setItem('bullmoney_pagemode_redirect_path', '/');
      localStorage.removeItem('bullmoney_pagemode_login_view');
    } catch {}
    window.location.href = '/';
  }, []);

  return (
    <div
      data-home-broker-signup
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#000000',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        contentVisibility: 'visible',
        contain: 'none',
      }}
    >
      {/* Inline shimmer keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bm-broker-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}} />

      <div
        style={{
          position: 'relative',
          margin: '0 auto',
          width: '100%',
          maxWidth: 1152,
          padding: '48px 16px',
          backgroundColor: '#0a0a0a',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 56, textAlign: 'center' }}>
          <p
            style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.28em', fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}
          >
            Create a broker / trading account
          </p>
          <h2
            style={{ marginTop: 12, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 600, letterSpacing: '-0.025em', color: '#FFFFFF' }}
          >
            BullMoney Brokers (Required)
          </h2>
          <p
            style={{ margin: '12px auto 0', maxWidth: 512, fontSize: 'clamp(0.875rem, 2vw, 1rem)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}
          >
            These are our official brokers. You must use the partner code when trading to join
            the BullMoney community or keep access. Pick a broker, copy the code, and finish signup.
          </p>
        </div>

        {/* Steps pills */}
        <div style={{ margin: '0 auto 48px', display: 'flex', maxWidth: 576, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          {STEPS.map((s, i) => (
            <div key={s.number} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 28,
                    width: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: '#fff',
                    color: '#000',
                    boxShadow: '0 2px 8px rgba(255,255,255,0.2)',
                  }}
                >
                  {s.number}
                </span>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#FFFFFF' }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    {s.sublabel}
                  </p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight
                  style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.2)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Broker cards */}
        <div style={{ margin: '0 auto', display: 'grid', maxWidth: 768, gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
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
                style={{
                  position: 'relative',
                  borderRadius: 16,
                  textAlign: 'left' as const,
                  transition: 'all 0.3s ease',
                  padding: '20px 22px',
                  border: isActive
                    ? `1.5px solid ${b.accentBorder}`
                    : '1.5px solid rgba(255,255,255,0.1)',
                  backgroundColor: isActive ? b.accent : isHover ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                  boxShadow: isActive
                    ? `0 4px 24px -6px ${b.accentBorder}`
                    : '0 1px 3px rgba(0,0,0,0.3)',
                  transform: isActive ? 'translateY(-2px)' : isHover ? 'translateY(-1px)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 16,
                      top: 16,
                      height: 10,
                      width: 10,
                      borderRadius: '50%',
                      backgroundColor: b.accentText,
                      boxShadow: `0 0 8px ${b.accentText}80`,
                    }}
                  />
                )}
                
                {/* Logo with shimmer background */}
                <div
                  style={{
                    marginBottom: 16,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                    overflow: 'hidden',
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
                      animation: 'bm-broker-shimmer 2.5s infinite',
                    }}
                  />
                  <Image
                    src={b.logo}
                    alt={`${b.name} logo`}
                    width={100}
                    height={50}
                    style={{ objectFit: 'contain', position: 'relative', zIndex: 10 }}
                  />
                </div>
                
                <h3
                  style={{ fontSize: 18, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}
                >
                  {b.name}
                </h3>
                <p
                  style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}
                >
                  {b.description}
                </p>
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {b.features.map((f) => (
                    <span
                      key={f}
                      style={{
                        borderRadius: 9999,
                        padding: '2px 10px',
                        fontSize: 10,
                        fontWeight: 500,
                        backgroundColor: isActive ? `${b.accentText}15` : 'rgba(255,255,255,0.05)',
                        color: isActive ? b.accentText : 'rgba(255,255,255,0.5)',
                        border: `1px solid ${isActive ? `${b.accentText}30` : 'rgba(255,255,255,0.1)'}`,
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
          style={{
            margin: '32px auto 0',
            maxWidth: 768,
            borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {/* Code display */}
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div>
              <p
                style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}
              >
                {activeBroker} Partner Code
              </p>
              <p
                style={{ marginTop: 2, fontSize: 20, fontWeight: 700, letterSpacing: '0.04em', color: '#FFFFFF' }}
              >
                {broker.code}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyCode(broker.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 9999,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                backgroundColor: copied ? 'rgba(46, 125, 50, 0.2)' : 'rgba(255,255,255,0.08)',
                color: copied ? '#4ade80' : '#FFFFFF',
                border: copied ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(255,255,255,0.15)',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '20px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              <p>
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>1.</span> Copy the code
                above
              </p>
              <p>
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>2.</span> Open the
                broker link &amp; paste it when signing up
              </p>
              <p>
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>3.</span> Come back and{' '}
                <a
                  href="/register"
                  style={{ fontWeight: 500, color: 'rgba(255,255,255,0.8)', textDecoration: 'underline', textUnderlineOffset: 2 }}
                >
                  finish sign-up
                </a>
              </p>
            </div>
            <button
              type="button"
              onClick={handleBrokerClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 9999,
                padding: '12px 28px',
                fontSize: 14,
                fontWeight: 600,
                color: '#000',
                background: '#fff',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px -4px rgba(255,255,255,0.4)',
                flexShrink: 0,
              }}
            >
              Open {activeBroker} Account <ExternalLink style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>

        <div style={{ margin: '24px auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={handleSignupRedirect}
            style={{
              borderRadius: 9999,
              padding: '10px 24px',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#ffffff',
              boxShadow: '0 8px 24px -10px rgba(255,255,255,0.15)',
            }}
          >
            Create BullMoney Account
          </button>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            Use the same broker code to stay active in the community.
          </p>
        </div>

        {/* Trust badges */}
        <div style={{ margin: '40px auto 0', display: 'flex', maxWidth: 672, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
          {[
            { icon: Shield, label: 'Regulated Brokers' },
            { icon: Zap, label: 'Instant Access' },
            { icon: TrendingUp, label: 'No Payment Needed' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.3)' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
});
