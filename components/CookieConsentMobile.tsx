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
        padding: '14px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
        <div style={{ marginTop: 2, opacity: 0.5, flexShrink: 0 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
            {label}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2, lineHeight: 1.4 }}>
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
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
          background: checked ? '#fff' : 'rgba(255,255,255,0.15)',
          transition: 'background 0.2s ease',
          flexShrink: 0,
          marginLeft: 12,
        }}
        aria-label={`Toggle ${label}`}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            background: checked ? '#000' : 'rgba(255,255,255,0.4)',
            position: 'absolute',
            top: 3,
            left: checked ? 21 : 3,
            transition: 'left 0.2s ease, background 0.2s ease',
          }}
        />
      </button>
    </div>
  );
}

export default function CookieConsentMobile() {
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
      // Small delay so it feels natural
      const t = setTimeout(() => setVisible(true), 1200);
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
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2147483647,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            padding: '0 12px 12px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#0a0a0a',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.08)',
              pointerEvents: 'auto',
              overflow: 'hidden',
              boxShadow: '0 -4px 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Compact Banner */}
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Cookie size={18} color="#fff" strokeWidth={1.5} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
                  We use cookies
                </span>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.45)',
                  marginTop: 6,
                  lineHeight: 1.5,
                  margin: '6px 0 0',
                }}
              >
                We use cookies to improve your experience. You can customize your preferences below.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button
                  onClick={handleDecline}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'transparent',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Decline
                </button>
                <button
                  onClick={handleAcceptAll}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 10,
                    border: 'none',
                    background: '#fff',
                    color: '#000',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Accept All
                </button>
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
                  padding: '6px 0',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Manage Preferences
                {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>

            {/* Expanded Preferences */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      padding: '0 18px 16px',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <CookieToggle
                      label="Essential"
                      description="Required for core site functionality"
                      icon={<Shield size={16} color="#fff" />}
                      checked={true}
                      disabled
                      onChange={() => {}}
                    />
                    <CookieToggle
                      label="Functional"
                      description="Language, preferences, and enhanced features"
                      icon={<Wrench size={16} color="#fff" />}
                      checked={prefs.functional}
                      onChange={(v) => setPrefs((p) => ({ ...p, functional: v }))}
                    />
                    <CookieToggle
                      label="Analytics"
                      description="Usage data to improve our platform"
                      icon={<BarChart3 size={16} color="#fff" />}
                      checked={prefs.analytics}
                      onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
                    />
                    <CookieToggle
                      label="Marketing"
                      description="Personalized content and advertisements"
                      icon={<Megaphone size={16} color="#fff" />}
                      checked={prefs.marketing}
                      onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
                    />

                    <button
                      onClick={handleSavePreferences}
                      style={{
                        width: '100%',
                        marginTop: 14,
                        padding: '11px 0',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'transparent',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        letterSpacing: '-0.01em',
                      }}
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
