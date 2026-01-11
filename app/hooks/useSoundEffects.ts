"use client";

import { useRef, useCallback } from 'react';

/**
 * Simple, lightweight sound effects hook for UI interactions
 * Uses HTML5 Audio for maximum compatibility
 */

// CDN-hosted sound URLs for consistency
const SOUND_URLS = {
  // Click sounds
  click: 'https://assets.codepen.io/127738/click_mech.mp3',
  clickSoft: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8b829532c.mp3',
  
  // Hover sounds
  hover: 'https://assets.codepen.io/127738/ui_hover.mp3',
  hoverSoft: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2434522961.mp3',
  
  // Confirmation/success sounds
  confirm: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_804e38692c.mp3',
  success: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_03d2572f88.mp3',
  
  // Navigation sounds
  open: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
  close: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_a777659546.mp3',
  
  // Special sounds
  boot: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_cda839211d.mp3',
  error: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_c6ccf3232f.mp3',
};

type SoundType = keyof typeof SOUND_URLS;

// Audio element pool for performance
const audioPool = new Map<string, HTMLAudioElement>();

// Get or create audio element
const getAudio = (url: string): HTMLAudioElement | null => {
  if (typeof window === 'undefined') return null;
  
  if (!audioPool.has(url)) {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audioPool.set(url, audio);
  }
  return audioPool.get(url) || null;
};

// Preload all sounds
export const preloadSounds = () => {
  if (typeof window === 'undefined') return;
  
  Object.values(SOUND_URLS).forEach(url => {
    const audio = getAudio(url);
    if (audio) {
      audio.load();
    }
  });
};

export interface SoundEffectsAPI {
  playClick: () => void;
  playHover: () => void;
  playConfirm: () => void;
  playSuccess: () => void;
  playOpen: () => void;
  playClose: () => void;
  playBoot: () => void;
  playError: () => void;
  play: (type: SoundType) => void;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
}

export const useSoundEffects = (initialEnabled: boolean = true, initialVolume: number = 0.3): SoundEffectsAPI => {
  const enabledRef = useRef(initialEnabled);
  const volumeRef = useRef(initialVolume);
  const hasUserInteracted = useRef(false);

  // Track user interaction for autoplay policy
  if (typeof window !== 'undefined' && !hasUserInteracted.current) {
    const markInteracted = () => {
      hasUserInteracted.current = true;
      window.removeEventListener('click', markInteracted);
      window.removeEventListener('touchstart', markInteracted);
      window.removeEventListener('keydown', markInteracted);
    };
    window.addEventListener('click', markInteracted);
    window.addEventListener('touchstart', markInteracted);
    window.addEventListener('keydown', markInteracted);
  }

  const play = useCallback((type: SoundType) => {
    if (!enabledRef.current || typeof window === 'undefined') return;
    
    const url = SOUND_URLS[type];
    if (!url) return;

    try {
      const audio = getAudio(url);
      if (audio) {
        // Reset and play
        audio.currentTime = 0;
        audio.volume = Math.min(1, Math.max(0, volumeRef.current));
        
        // Use promise-based play with silent catch for autoplay policy
        audio.play().catch(() => {
          // Silently fail if autoplay is blocked
        });
      }
    } catch (e) {
      // Silently fail on any audio errors
    }
  }, []);

  const playClick = useCallback(() => play('click'), [play]);
  const playHover = useCallback(() => play('hoverSoft'), [play]);
  const playConfirm = useCallback(() => play('confirm'), [play]);
  const playSuccess = useCallback(() => play('success'), [play]);
  const playOpen = useCallback(() => play('open'), [play]);
  const playClose = useCallback(() => play('close'), [play]);
  const playBoot = useCallback(() => play('boot'), [play]);
  const playError = useCallback(() => play('error'), [play]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.min(1, Math.max(0, volume));
  }, []);

  return {
    playClick,
    playHover,
    playConfirm,
    playSuccess,
    playOpen,
    playClose,
    playBoot,
    playError,
    play,
    setEnabled,
    setVolume,
  };
};

// Export singleton for direct usage without hook
let globalEnabled = true;
let globalVolume = 0.3;

export const SoundEffects = {
  setEnabled: (enabled: boolean) => { globalEnabled = enabled; },
  setVolume: (volume: number) => { globalVolume = Math.min(1, Math.max(0, volume)); },
  
  play: (type: SoundType) => {
    if (!globalEnabled || typeof window === 'undefined') return;
    
    const url = SOUND_URLS[type];
    if (!url) return;

    try {
      const audio = getAudio(url);
      if (audio) {
        audio.currentTime = 0;
        audio.volume = globalVolume;
        audio.play().catch(() => {});
      }
    } catch (e) {
      // Silent fail
    }
  },
  
  click: () => SoundEffects.play('click'),
  hover: () => SoundEffects.play('hoverSoft'),
  confirm: () => SoundEffects.play('confirm'),
  success: () => SoundEffects.play('success'),
  open: () => SoundEffects.play('open'),
  close: () => SoundEffects.play('close'),
  boot: () => SoundEffects.play('boot'),
  error: () => SoundEffects.play('error'),
};

export default useSoundEffects;
