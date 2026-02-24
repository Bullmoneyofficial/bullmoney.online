'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BackgroundEffect, EFFECT_NAMES } from '../constants';

const BG_ICONS: Record<BackgroundEffect, string> = {
  gridScan: '▦',
  spline: '◇',
  liquidEther: '◎',
  galaxy: '✦',
  terminal: '▤',
  darkVeil: '◐',
  lightPillar: '▮',
  letterGlitch: 'A̷',
  ballpit: '●',
  gridDistortion: '◫',
};

interface Props {
  effects: BackgroundEffect[];
  currentIndex: number;
  enabledEffects: BackgroundEffect[];
  colorMode: 'color' | 'grayscale' | 'custom';
  showBgMenu: boolean;
  toggleMenu: () => void;
  switchToBackground: (index: number) => void;
  onColorModeToggle: () => void;
  is3DActive: boolean;
  on3DToggle: () => void;
  onMoreOptions: () => void;
}

const COLOR_LABEL: Record<'color' | 'grayscale' | 'custom', { icon: string; label: string }> = {
  color: { icon: '○', label: 'Color' },
  grayscale: { icon: '◐', label: 'B&W' },
  custom: { icon: '◉', label: 'Tint' },
};

const BackgroundQuickMenu = ({
  effects,
  currentIndex,
  enabledEffects,
  colorMode,
  showBgMenu,
  toggleMenu,
  switchToBackground,
  onColorModeToggle,
  is3DActive,
  on3DToggle,
  onMoreOptions,
}: Props) => {
  const { icon: colorIcon, label: colorLabel } = COLOR_LABEL[colorMode];

  return (
    <div
      style={{
        position: 'fixed',
        top: 'max(180px, calc(180px + env(safe-area-inset-top, 0px)))',
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        zIndex: 2147483647,
        pointerEvents: 'none',
      }}
    >
      <button
        className="bg-selector-toggle"
        style={{
          pointerEvents: 'auto',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #ffffff 100%)',
          color: '#000',
          border: '1px solid rgba(255, 255, 255, 0.8)',
        }}
        onClick={toggleMenu}
        title="Background Settings"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span>BG Picker</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: 14,
            height: 14,
            marginLeft: 4,
            transform: showBgMenu ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
        {showBgMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 12,
              background: 'rgba(0, 0, 0, 0.9)',
              borderRadius: 16,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)',
              minWidth: 200,
              maxWidth: 280,
            }}
          >
            <div style={{ marginBottom: 4 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 8,
                  paddingLeft: 4,
                }}
              >
                Quick Switch
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {effects.slice(0, 10).map((effect, index) => {
                  const isActive = currentIndex === index;
                  const isEnabled = enabledEffects.includes(effect);
                  return (
                    <button
                      key={effect}
                      onClick={() => isEnabled && switchToBackground(index)}
                      disabled={!isEnabled}
                      title={EFFECT_NAMES[effect]}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        border: isActive ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)',
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)'
                          : 'rgba(255,255,255,0.05)',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                        fontSize: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isEnabled ? 'pointer' : 'not-allowed',
                        opacity: isEnabled ? 1 : 0.3,
                        transition: 'all 0.15s ease',
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      {BG_ICONS[effect]}
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.6)',
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                {EFFECT_NAMES[effects[currentIndex]]}
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={onColorModeToggle}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 12px',
                  background: colorMode !== 'color' ? 'rgba(41, 151, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: colorMode !== 'color' ? '1px solid rgba(41, 151, 255, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 14 }}>{colorIcon}</span>
                {colorLabel}
              </button>
              <button
                onClick={on3DToggle}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 12px',
                  background: is3DActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: is3DActive ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: is3DActive ? '#86efac' : '#fff',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 14 }}>◇</span>
                3D {is3DActive ? 'ON' : 'OFF'}
              </button>
            </div>

            <button
              onClick={onMoreOptions}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              More Options →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BackgroundQuickMenu;
