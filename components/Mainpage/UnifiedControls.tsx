"use client";

import React, { useState } from 'react';
import { Volume2, VolumeX, Palette, HelpCircle, Settings, Zap } from 'lucide-react';
import { UI_LAYERS, GAME_UI_CONFIG } from '@/lib/uiLayers';
import { playClick, playHover } from '@/lib/interactionUtils';

interface UnifiedControlsProps {
  isMuted: boolean;
  onMuteToggle: () => void;
  onThemeClick: () => void;
  onFaqClick: () => void;
  onSettingsClick?: () => void;
  accentColor?: string;
  disabled?: boolean;
}

/**
 * UnifiedControls - Game-like control panel
 * Same on mobile and desktop, always visible in bottom-left
 */
export const UnifiedControls: React.FC<UnifiedControlsProps> = ({
  isMuted,
  onMuteToggle,
  onThemeClick,
  onFaqClick,
  onSettingsClick,
  accentColor = '#3b82f6',
  disabled = false
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleMuteToggle = () => {
    playClick();
    if (navigator.vibrate) navigator.vibrate(GAME_UI_CONFIG.HAPTICS.LIGHT);
    onMuteToggle();
  };

  const handleThemeClick = () => {
    playClick();
    if (navigator.vibrate) navigator.vibrate(GAME_UI_CONFIG.HAPTICS.MEDIUM);
    onThemeClick();
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

  const toggleExpanded = () => {
    playClick();
    if (navigator.vibrate) navigator.vibrate(GAME_UI_CONFIG.HAPTICS.LIGHT);
    setExpanded(!expanded);
  };

  const controlButtons = [
    {
      icon: isMuted ? VolumeX : Volume2,
      onClick: handleMuteToggle,
      label: isMuted ? 'Unmute' : 'Mute',
      color: isMuted ? 'rgba(239, 68, 68, 1)' : accentColor,
    },
    {
      icon: Palette,
      onClick: handleThemeClick,
      label: 'Theme',
      color: accentColor,
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
      icon: Settings,
      onClick: handleSettingsClick,
      label: 'Settings',
      color: accentColor,
    });
  }

  return (
    <div
      className="fixed bottom-5 left-4 flex flex-col-reverse gap-3"
      style={{ zIndex: UI_LAYERS.CONTROL_CENTER_BTN }}
    >
      {/* Control Buttons - Show when expanded */}
      <div
        className={`
          flex flex-col-reverse gap-3 transition-all duration-300
          ${expanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        {controlButtons.map((button, index) => (
          <button
            key={index}
            onClick={button.onClick}
            onMouseEnter={() => playHover()}
            disabled={disabled}
            className={`
              w-14 h-14 rounded-full
              bg-black/80 backdrop-blur-xl border-2
              flex items-center justify-center
              transition-all duration-300
              hover:scale-110 active:scale-95
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            style={{
              borderColor: button.color,
              boxShadow: `0 0 20px ${button.color}40, 0 4px 15px rgba(0,0,0,0.5)`,
            }}
            aria-label={button.label}
          >
            <button.icon size={24} style={{ color: button.color }} />
          </button>
        ))}
      </div>

      {/* Main Control Button */}
      <button
        onClick={toggleExpanded}
        onMouseEnter={() => playHover()}
        disabled={disabled}
        className={`
          w-16 h-16 rounded-full
          bg-black/90 backdrop-blur-2xl border-2
          flex items-center justify-center
          transition-all duration-300
          hover:scale-110 active:scale-95
          ${expanded ? 'rotate-90' : 'rotate-0'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{
          borderColor: accentColor,
          boxShadow: `0 0 30px ${accentColor}60, 0 4px 20px rgba(0,0,0,0.5)`,
        }}
        aria-label={expanded ? 'Close controls' : 'Open controls'}
      >
        <Zap
          size={28}
          style={{ color: accentColor }}
          className={`transition-transform duration-300 ${expanded ? 'scale-125' : 'scale-100'}`}
        />
      </button>
    </div>
  );
};

export default UnifiedControls;
