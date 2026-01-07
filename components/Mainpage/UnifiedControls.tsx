"use client";

import React from 'react';
import { HelpCircle, Lock, Palette, SunMoon, Unlock, Volume2, VolumeX, Zap } from 'lucide-react';
import { UI_LAYERS, GAME_UI_CONFIG } from '@/lib/uiLayers';
import { playClick, playHover } from '@/lib/interactionUtils';
import { Hint } from '@/components/ui/Hint';

interface UnifiedControlsProps {
  isMuted: boolean;
  onMuteToggle: () => void;
  disableSpline: boolean;
  onPerformanceToggle: () => void;
  infoPanelOpen: boolean;
  onInfoToggle: () => void;
  onFaqClick: () => void;
  onThemePanelOpen: () => void;
  onControlCenterToggle?: () => void;
  onSettingsClick?: () => void; // Light/Night
  isMobile?: boolean;
  controlCenterOpen?: boolean;
  accentColor?: string;
  disabled?: boolean;
}

export const UnifiedControls: React.FC<UnifiedControlsProps> = ({
  isMuted,
  onMuteToggle,
  disableSpline,
  onPerformanceToggle,
  infoPanelOpen,
  onInfoToggle,
  onFaqClick,
  onThemePanelOpen,
  onControlCenterToggle,
  onSettingsClick,
  isMobile = false,
  controlCenterOpen = false,
  accentColor = '#3b82f6',
  disabled = false
}) => {
  const [showHint, setShowHint] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 12000);
    return () => clearTimeout(timer);
  }, []);

  const handleMuteToggle = () => {
    playClick();
    if (navigator.vibrate) navigator.vibrate(GAME_UI_CONFIG.HAPTICS.LIGHT);
    onMuteToggle();
  };

  const handleThemeClick = () => {
    playClick();
    if (navigator.vibrate) navigator.vibrate(GAME_UI_CONFIG.HAPTICS.MEDIUM);
    onThemePanelOpen();
  };

  const handleInfoClick = () => {
    playClick();
    if (navigator.vibrate) navigator.vibrate(GAME_UI_CONFIG.HAPTICS.MEDIUM);
    onInfoToggle();
  };

  const handlePerformanceClick = () => {
    playClick();
    if (navigator.vibrate) navigator.vibrate(GAME_UI_CONFIG.HAPTICS.MEDIUM);
    onPerformanceToggle();
  };

  const handleFaqClick = () => {
    playClick();
    if (navigator.vibrate) navigator.vibrate(GAME_UI_CONFIG.HAPTICS.MEDIUM);
    onFaqClick();
  };

  const handleSettingsClick = () => {
    if (!onSettingsClick) return;
    playClick();
    if (navigator.vibrate) navigator.vibrate(GAME_UI_CONFIG.HAPTICS.MEDIUM);
    onSettingsClick();
  };

  const handleControlCenterToggle = () => {
    playClick();
    if (navigator.vibrate) navigator.vibrate(GAME_UI_CONFIG.HAPTICS.LIGHT);
    setShowHint(false);
    if (onControlCenterToggle) {
      onControlCenterToggle();
    } else {
      onThemePanelOpen();
    }
  };

  const controlCenterButton = {
    icon: Zap,
    onClick: handleControlCenterToggle,
    label: controlCenterOpen ? 'Close Control Center' : 'Open Control Center',
    color: accentColor,
    active: controlCenterOpen,
  };

  const controlButtons = [
    controlCenterButton,
    {
      icon: infoPanelOpen ? Unlock : Lock,
      onClick: handleInfoClick,
      label: infoPanelOpen ? 'Close page info' : 'Open page info',
      color: accentColor,
    },
    {
      icon: isMuted ? VolumeX : Volume2,
      onClick: handleMuteToggle,
      label: isMuted ? 'Unmute' : 'Mute',
      color: isMuted ? 'rgba(239, 68, 68, 1)' : accentColor,
    },
    {
      icon: Palette,
      onClick: handleThemeClick,
      label: controlCenterOpen ? 'Control Center' : 'Themes',
      color: accentColor,
    },
    {
      icon: Zap,
      onClick: handlePerformanceClick,
      label: disableSpline ? 'Full 3D' : 'Performance',
      color: disableSpline ? accentColor : 'rgba(255,255,255,0.9)',
    },
    {
      icon: HelpCircle,
      onClick: handleFaqClick,
      label: 'Help',
      color: accentColor,
    },
  ];

  if (onSettingsClick) {
    controlButtons.push({
      icon: SunMoon,
      onClick: handleSettingsClick,
      label: 'Light/Night',
      color: accentColor,
    });
  }

  return (
    <div
      className="fixed inset-x-3 pointer-events-none"
      style={{
        zIndex: UI_LAYERS.CONTROL_CENTER_BTN,
        bottom: 'calc(1rem + env(safe-area-inset-bottom))',
      }}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-3xl">
        <div
          className={`
            flex items-center
            rounded-2xl border border-white/10
            bg-black/80 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.45)]
            ${isMobile ? 'justify-between gap-2 px-2 py-2 overflow-x-auto no-scrollbar' : 'justify-center gap-3 px-3 py-3'}
          `}
          style={{
            boxShadow: `0 20px 60px ${accentColor}25`,
          }}
        >
          {controlButtons.map((button, index) => (
            <Hint key={index} label={button.label}>
              <button
                onClick={button.onClick}
                onMouseEnter={() => playHover()}
                disabled={disabled}
                className={`
                  flex items-center justify-center rounded-full border-2
                  transition-all duration-300 active:scale-95
                  ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                  ${button.active ? 'bg-white/10' : 'bg-black/70'}
                `}
                style={{
                  borderColor: button.color,
                  boxShadow: `0 0 18px ${button.color}40, 0 4px 12px rgba(0,0,0,0.5)`,
                }}
                aria-label={button.label}
              >
                <button.icon size={isMobile ? 18 : 20} style={{ color: button.color }} />
              </button>
            </Hint>
          ))}
        </div>
      </div>

      {/* Mobile hint & quick toggle */}
      {isMobile && showHint && (
        <button
          onClick={handleControlCenterToggle}
          className="pointer-events-auto fixed right-3 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] shadow-[0_10px_50px_rgba(59,130,246,0.35)] animate-pulse"
          style={{
            zIndex: UI_LAYERS.CONTROL_CENTER_BTN + 1,
            bottom: 'calc(4.5rem + env(safe-area-inset-bottom))',
            backgroundColor: 'rgba(59,130,246,0.85)',
            color: '#0b1224',
            boxShadow: `0 0 30px ${accentColor}70`,
            border: `1px solid ${accentColor}`,
          }}
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          Tap me for 3D controls + more
        </button>
      )}
    </div>
  );
};

export default UnifiedControls;
