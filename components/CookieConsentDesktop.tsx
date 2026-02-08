'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, ChevronUp, ChevronDown, Shield, BarChart3, Megaphone, Wrench } from 'lucide-react';
import {
  type CookiePreferences,
  getConsentPreferences,
  saveConsentPreferences,
  acceptAllCookies,
  declineOptionalCookies,
  shouldShowBanner,
  resetPageLoadCounter,
} from '@/lib/cookieConsent';
import { SoundEffects } from '@/app/hooks/useSoundEffects';

interface CookieToggleProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (val: boolean) => void;
}

function CookieToggle({ label, description, icon, checked, disabled, onChange }: CookieToggleProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
        <div style={{ marginTop: 2, opacity: 0.4, flexShrink: 0 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.01em' }}>
            {label}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          if (!disabled) {
            SoundEffects.click();
            onChange(!checked);
          }
        }}
        disabled={disabled}
        onMouseEnter={() => !disabled && SoundEffects.hover()}
        style={{
          width: 40,
          height: 24,
          borderRadius: 12,
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
          background: checked ? '#1d1d1f' : 'rgba(0,0,0,0.1)',
          transition: 'background 0.2s ease',
          flexShrink: 0,
          marginLeft: 16,
        }}
        aria-label={`Toggle ${label}`}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: '#fff',
            position: 'absolute',
            top: 3,
            left: checked ? 19 : 3,
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        />
      </button>
    </div>
  );
}

export default function CookieConsentDesktop() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    timestamp: 0,
  });

  useEffect(() => {
    setMounted(true);
    const existing = getConsentPreferences();
    if (existing) {
      setPrefs(existing);
    }
    if (shouldShowBanner()) {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAcceptAll = () => {
    SoundEffects.confirm();
    acceptAllCookies();
    resetPageLoadCounter();
    setVisible(false);
  };

  const handleDecline = () => {
    SoundEffects.click();
    declineOptionalCookies();
    resetPageLoadCounter();
    setVisible(false);
  };

  const handleSavePreferences = () => {
    SoundEffects.success();
    saveConsentPreferences(prefs);
    resetPageLoadCounter();
    setVisible(false);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          style={{
            position: 'fixed',
            top: 16,
            right: 24,
            zIndex: 2147483647,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 380,
              background: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderRadius: 16,
              border: '1px solid rgba(0,0,0,0.08)',
              pointerEvents: 'auto',
              overflow: 'hidden',
              boxShadow: '0 4px 32px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            {/* Compact Banner */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Cookie size={16} color="#1d1d1f" strokeWidth={1.5} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.01em' }}>
                    Cookie Preferences
                  </span>
                </div>
                <button
                  onClick={() => { setVisible(false); resetPageLoadCounter(); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    fontSize: 18,
                    lineHeight: 1,
                    padding: '0 2px',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(0,0,0,0.6)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(0,0,0,0.3)')}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <p
                style={{
                  fontSize: 12,
                  color: 'rgba(0,0,0,0.45)',
                  marginTop: 8,
                  lineHeight: 1.55,
                  margin: '8px 0 0',
                }}
              >
                We use cookies to enhance your browsing experience, serve personalized content, and analyze traffic.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <button
                    onClick={handleDecline}
                    style={{
                      width: '100%',
                      padding: '9px 0',
                      borderRadius: 8,
                      border: '1px solid rgba(0,0,0,0.12)',
                      background: 'transparent',
                      color: '#1d1d1f',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      letterSpacing: '-0.01em',
                      transition: 'border-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.25)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
                  >
                    Decline
                  </button>
                  <p style={{ fontSize: 10, color: 'rgba(0,0,0,0.3)', marginTop: 4, lineHeight: 1.3 }}>Essential only</p>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <button
                    onClick={handleAcceptAll}
                    style={{
                      width: '100%',
                      padding: '9px 0',
                      borderRadius: 8,
                      border: 'none',
                      background: '#1d1d1f',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      letterSpacing: '-0.01em',
                      transition: 'opacity 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    Accept All
                  </button>
                  <p style={{ fontSize: 10, color: 'rgba(0,0,0,0.3)', marginTop: 4, lineHeight: 1.3 }}>Recommended</p>
                </div>
              </div>

              {/* Manage Toggle */}
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  width: '100%',
                  marginTop: 10,
                  padding: '4px 0',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(0,0,0,0.35)',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(0,0,0,0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(0,0,0,0.35)')}
              >
                Manage Preferences
                {expanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>
            </div>

            {/* Expanded Preferences */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      padding: '2px 20px 16px',
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <CookieToggle
                      label="Essential"
                      description="Required for core functionality"
                      icon={<Shield size={14} color="#1d1d1f" />}
                      checked={true}
                      disabled
                      onChange={() => {}}
                    />
                    <CookieToggle
                      label="Functional"
                      description="Language, preferences, enhanced features"
                      icon={<Wrench size={14} color="#1d1d1f" />}
                      checked={prefs.functional}
                      onChange={(v) => setPrefs((p) => ({ ...p, functional: v }))}
                    />
                    <CookieToggle
                      label="Analytics"
                      description="Usage data to improve our platform"
                      icon={<BarChart3 size={14} color="#1d1d1f" />}
                      checked={prefs.analytics}
                      onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
                    />
                    <CookieToggle
                      label="Marketing"
                      description="Personalized content and ads"
                      icon={<Megaphone size={14} color="#1d1d1f" />}
                      checked={prefs.marketing}
                      onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
                    />

                    <button
                      onClick={handleSavePreferences}
                      style={{
                        width: '100%',
                        marginTop: 12,
                        padding: '9px 0',
                        borderRadius: 8,
                        border: '1px solid rgba(0,0,0,0.12)',
                        background: 'transparent',
                        color: '#1d1d1f',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        letterSpacing: '-0.01em',
                        transition: 'border-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.25)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
                    >
                      Save Preferences
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
