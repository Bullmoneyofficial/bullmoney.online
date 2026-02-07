'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Howl, Howler } from 'howler';

// Working audio URLs from reliable CDN sources (freesound.org/soundbible.com hosted on CDN)
const SOUND_URLS = {
  // Button & UI Interactions - Using reliable CDN
  buttonClick: 'https://cdn.freesound.org/previews/242/242501_4284968-lq.mp3', // Soft click
  buttonHover: 'https://cdn.freesound.org/previews/256/256116_3263906-lq.mp3', // Subtle hover
  
  // Trading actions (MT5 style) - Using trading terminal sounds
  orderOpen: 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3', // Trade open
  orderClose: 'https://cdn.freesound.org/previews/320/320654_5260872-lq.mp3', // Trade close
  
  // Alerts & Notifications
  success: 'https://cdn.freesound.org/previews/320/320775_5260872-lq.mp3', // Success chime
  error: 'https://cdn.freesound.org/previews/142/142608_1840739-lq.mp3', // Error beep
  warning: 'https://cdn.freesound.org/previews/220/220206_4100837-lq.mp3', // Warning tone
  notification: 'https://cdn.freesound.org/previews/352/352661_4019029-lq.mp3', // Notification ping
  
  // Telegram/Message notification
  telegram: 'https://cdn.freesound.org/previews/536/536108_11943129-lq.mp3', // Message received
  
  // Admin & Special actions
  adminAction: 'https://cdn.freesound.org/previews/244/244981_4284968-lq.mp3', // System action
  delete: 'https://cdn.freesound.org/previews/158/158538_2703324-lq.mp3', // Delete/trash
  
  // Modal & Navigation
  modalOpen: 'https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3', // Swoosh in
  modalClose: 'https://cdn.freesound.org/previews/256/256114_3263906-lq.mp3', // Swoosh out
  
  // Product actions
  addToCart: 'https://cdn.freesound.org/previews/131/131660_2398403-lq.mp3', // Pop/ding
  purchase: 'https://cdn.freesound.org/previews/320/320775_5260872-lq.mp3', // Ka-ching
  
  // Filter & Sort
  filterApply: 'https://cdn.freesound.org/previews/221/221359_2069640-lq.mp3', // Light tick
  sortChange: 'https://cdn.freesound.org/previews/256/256116_3263906-lq.mp3', // Toggle sound
  
  // Navigation
  navClick: 'https://cdn.freesound.org/previews/242/242501_4284968-lq.mp3', // Nav click
  menuOpen: 'https://cdn.freesound.org/previews/264/264763_4918526-lq.mp3', // Menu whoosh
  menuClose: 'https://cdn.freesound.org/previews/264/264762_4918526-lq.mp3', // Menu close
  
  // Cookie consent / Promo
  cookieAccept: 'https://cdn.freesound.org/previews/131/131660_2398403-lq.mp3', // Accept ding
  promoPopup: 'https://cdn.freesound.org/previews/352/352661_4019029-lq.mp3', // Promo attention
  
  // 3D/Hero interactions
  heroInteract: 'https://cdn.freesound.org/previews/264/264763_4918526-lq.mp3', // Ambient whoosh
};

type SoundType = keyof typeof SOUND_URLS;

interface UseTradingSoundsOptions {
  enabled?: boolean;
  volume?: number;
  preload?: boolean;
}

// Global sound cache to prevent duplicate loading
const globalSoundCache = new Map<string, Howl>();
let isInitialized = false;

// Initialize Howler for mobile
const initializeHowler = () => {
  if (isInitialized) return;
  Howler.autoUnlock = true;
  Howler.html5PoolSize = 10;
  isInitialized = true;
};

export function useTradingSounds(options: UseTradingSoundsOptions = {}) {
  const {
    enabled = true,
    volume = 0.5,
    preload = false, // Default to false to avoid loading all sounds at once
  } = options;

  const [isReady, setIsReady] = useState(false);
  const enabledRef = useRef(enabled);
  const volumeRef = useRef(volume);
  const hasUserInteracted = useRef(false);

  // Update refs
  useEffect(() => {
    enabledRef.current = enabled;
    volumeRef.current = volume;
  }, [enabled, volume]);

  // Initialize on first mount
  useEffect(() => {
    initializeHowler();
    
    // Listen for user interaction to unlock audio
    const unlockAudio = () => {
      hasUserInteracted.current = true;
      setIsReady(true);
      // Create silent buffer to unlock
      Howler.volume(volume);
    };

    // Add listeners for user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, unlockAudio, { once: true, passive: true });
    });

    // Preload only if requested
    if (preload) {
      Object.entries(SOUND_URLS).forEach(([key, url]) => {
        if (!globalSoundCache.has(url)) {
          const sound = new Howl({
            src: [url],
            volume: volume,
            preload: true,
            html5: true,
            onloaderror: (id, error) => {
              console.warn(`Failed to load sound ${key}:`, error);
            }
          });
          globalSoundCache.set(url, sound);
        }
      });
    }

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, unlockAudio);
      });
    };
  }, [volume, preload]);

  // Get or create a sound
  const getSound = useCallback((soundType: SoundType): Howl | null => {
    const url = SOUND_URLS[soundType];
    if (!url) return null;

    if (globalSoundCache.has(url)) {
      return globalSoundCache.get(url)!;
    }

    // Create sound on demand
    const sound = new Howl({
      src: [url],
      volume: volumeRef.current,
      html5: true,
      preload: true,
      onloaderror: (id, error) => {
        console.warn(`Failed to load sound ${soundType}:`, error);
      }
    });
    globalSoundCache.set(url, sound);
    return sound;
  }, []);

  // Play a specific sound
  const playSound = useCallback((soundType: SoundType, customVolume?: number) => {
    if (!enabledRef.current) return;
    
    try {
      const sound = getSound(soundType);
      if (!sound) return;

      // Set volume
      sound.volume(customVolume ?? volumeRef.current);
      
      // Play
      sound.play();
    } catch (error) {
      console.warn(`Error playing sound ${soundType}:`, error);
    }
  }, [getSound]);

  // Stop a specific sound
  const stopSound = useCallback((soundType: SoundType) => {
    const url = SOUND_URLS[soundType];
    const sound = globalSoundCache.get(url);
    if (sound) {
      sound.stop();
    }
  }, []);

  // Stop all sounds
  const stopAll = useCallback(() => {
    globalSoundCache.forEach((sound) => {
      sound.stop();
    });
  }, []);

  // Set global volume
  const setVolume = useCallback((newVolume: number) => {
    volumeRef.current = newVolume;
    Howler.volume(newVolume);
  }, []);

  // Create sound functions object
  const sounds = {
    // Button & UI
    buttonClick: () => playSound('buttonClick', 0.3),
    buttonHover: () => playSound('buttonHover', 0.15),
    
    // Trading
    orderOpen: () => playSound('orderOpen', 0.4),
    orderClose: () => playSound('orderClose', 0.4),
    
    // Alerts
    success: () => playSound('success', 0.4),
    error: () => playSound('error', 0.5),
    warning: () => playSound('warning', 0.4),
    notification: () => playSound('notification', 0.4),
    telegram: () => playSound('telegram', 0.5),
    
    // Admin
    adminAction: () => playSound('adminAction', 0.3),
    delete: () => playSound('delete', 0.4),
    
    // Modal
    modalOpen: () => playSound('modalOpen', 0.25),
    modalClose: () => playSound('modalClose', 0.25),
    
    // Product
    addToCart: () => playSound('addToCart', 0.4),
    purchase: () => playSound('purchase', 0.5),
    
    // Filter & Sort
    filterApply: () => playSound('filterApply', 0.2),
    sortChange: () => playSound('sortChange', 0.2),
    
    // Navigation
    navClick: () => playSound('navClick', 0.25),
    menuOpen: () => playSound('menuOpen', 0.3),
    menuClose: () => playSound('menuClose', 0.3),
    
    // Cookie/Promo
    cookieAccept: () => playSound('cookieAccept', 0.3),
    promoPopup: () => playSound('promoPopup', 0.35),
    
    // 3D/Hero
    heroInteract: () => playSound('heroInteract', 0.2),
  };

  return {
    playSound,
    stopSound,
    stopAll,
    setVolume,
    isReady,
    sounds,
  };
}

// Sound event wrapper for onClick handlers
export function withSound<T extends (...args: any[]) => any>(
  handler: T,
  soundCallback: () => void
): T {
  return ((...args: Parameters<T>) => {
    soundCallback();
    return handler(...args);
  }) as T;
}
