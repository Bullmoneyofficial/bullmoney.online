'use client';

import React from 'react';
import { BackgroundEffect, EFFECT_NAMES } from '../constants';

interface Props {
  effects: BackgroundEffect[];
  enabledEffects: BackgroundEffect[];
  favorites: BackgroundEffect[];
  currentIndex: number;
  onClose: () => void;
  toggleEnabled: (effect: BackgroundEffect) => void;
  toggleFavorite: (effect: BackgroundEffect) => void;
  switchToBackground: (index: number) => void;
}

const getShortcutKey = (index: number): string => {
  if (index < 9) return `Ctrl+${index + 1}`;
  if (index === 9) return 'Ctrl+0';
  if (index === 10) return 'Ctrl+-';
  if (index === 11) return 'Ctrl+=';
  return '';
};

const BackgroundSelectorPanel = ({
  effects,
  enabledEffects,
  favorites,
  currentIndex,
  onClose,
  toggleEnabled,
  toggleFavorite,
  switchToBackground,
}: Props) => (
  <div className="bg-selector-panel" style={{ zIndex: 2147483647 }}>
    <div className="bg-selector-header">
      <div>
        <h3 className="bg-selector-title">Background Effects</h3>
        <p className="bg-selector-subtitle">Use Ctrl+1-0,-,= to quick switch</p>
      </div>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
      >
        ×
      </button>
    </div>

    <div className="bg-selector-list">
      {effects.map((effect, index) => {
        const isActive = currentIndex === index;
        const isEnabled = enabledEffects.includes(effect);
        const isFavorite = favorites.includes(effect);

        return (
          <div
            key={effect}
            className={`bg-selector-item ${isActive ? 'active' : ''} ${!isEnabled ? 'disabled' : ''}`}
          >
            <div
              className={`bg-item-toggle ${isEnabled ? 'enabled' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleEnabled(effect); }}
              title={isEnabled ? 'Click to disable' : 'Click to enable'}
            >
              {isEnabled ? '✓' : ''}
            </div>

            <div className="bg-item-info" onClick={() => isEnabled && switchToBackground(index)}>
              <div className="bg-item-name">{EFFECT_NAMES[effect]}</div>
              {index < 12 && (
                <div className="bg-item-shortcut">{getShortcutKey(index)}</div>
              )}
            </div>

            <button
              className={`bg-item-fav ${isFavorite ? 'favorited' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleFavorite(effect); }}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? '★' : '☆'}
            </button>

            <button
              className="bg-item-select"
              onClick={() => isEnabled && switchToBackground(index)}
              disabled={!isEnabled}
            >
              {isActive ? 'Active' : 'Select'}
            </button>
          </div>
        );
      })}
    </div>
  </div>
);

export default BackgroundSelectorPanel;
