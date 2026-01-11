"use client";

import { useRef, useCallback } from 'react';

/**
 * Simple, lightweight sound effects using Web Audio API
 * No external dependencies - generates sounds programmatically
 */

type SoundType = 'click' | 'clickSoft' | 'hover' | 'hoverSoft' | 'confirm' | 'success' | 'open' | 'close' | 'boot' | 'error' | 'swipe' | 'swoosh' | 'tab';

// Web Audio API context singleton
let audioContext: AudioContext | null = null;
let hasUserInteracted = false;

// Track user interaction for autoplay policy
if (typeof window !== 'undefined') {
  const markInteracted = () => {
    hasUserInteracted = true;
    window.removeEventListener('click', markInteracted);
    window.removeEventListener('touchstart', markInteracted);
    window.removeEventListener('keydown', markInteracted);
  };
  window.addEventListener('click', markInteracted);
  window.addEventListener('touchstart', markInteracted);
  window.addEventListener('keydown', markInteracted);
}

// Initialize or get audio context
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    if (!audioContext) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        audioContext = new Ctx();
      }
    }
    
    // Resume if suspended
    if (audioContext?.state === 'suspended' && hasUserInteracted) {
      audioContext.resume().catch(() => {});
    }
    
    return audioContext;
  } catch (e) {
    return null;
  }
};

// Play a synthesized tone
const playTone = (
  frequency: number,
  type: OscillatorType,
  duration: number,
  volume: number,
  attack: number = 0.005,
  decay: number = 0.1
) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    
    // ADSR envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + duration + 0.1);
  } catch (e) {
    // Silent fail
  }
};

// Play mechanical click with filter
const playMechanicalClick = (volume: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {
    // Silent fail
  }
};

// Play soft hover sound
const playSoftHover = (volume: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) {
    // Silent fail
  }
};

// Play swipe/swoosh sound
const playSwipe = (volume: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    
    // Create noise for swoosh effect
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
    filter.Q.value = 1;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + 0.2);
  } catch (e) {
    // Silent fail
  }
};

// Preload sounds (initializes audio context on user interaction)
export const preloadSounds = () => {
  if (typeof window === 'undefined') return;
  getAudioContext();
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

  const play = useCallback((type: SoundType) => {
    if (!enabledRef.current || typeof window === 'undefined') return;
    
    const vol = volumeRef.current;
    
    switch (type) {
      case 'click':
      case 'clickSoft':
        playMechanicalClick(vol);
        break;
      case 'hover':
      case 'hoverSoft':
        playSoftHover(vol);
        break;
      case 'confirm':
        playTone(440, 'sine', 0.15, vol * 0.5);
        setTimeout(() => playTone(554, 'sine', 0.15, vol * 0.5), 50);
        setTimeout(() => playTone(659, 'sine', 0.2, vol * 0.5), 100);
        break;
      case 'success':
        [440, 554, 659, 880].forEach((freq, i) => {
          setTimeout(() => playTone(freq, 'sine', 0.1, vol * 0.4), i * 60);
        });
        break;
      case 'open':
        playTone(300, 'sine', 0.08, vol * 0.4);
        setTimeout(() => playTone(500, 'sine', 0.1, vol * 0.4), 40);
        break;
      case 'close':
        playTone(500, 'sine', 0.08, vol * 0.4);
        setTimeout(() => playTone(300, 'sine', 0.1, vol * 0.4), 40);
        break;
      case 'boot':
        playTone(100, 'sawtooth', 0.8, vol * 0.3);
        setTimeout(() => playTone(200, 'square', 0.5, vol * 0.2), 200);
        break;
      case 'error':
        playTone(200, 'square', 0.15, vol * 0.4);
        setTimeout(() => playTone(150, 'square', 0.2, vol * 0.4), 100);
        break;
      case 'swipe':
      case 'swoosh':
        playSwipe(vol);
        break;
      case 'tab':
        playTone(600, 'sine', 0.05, vol * 0.3);
        break;
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
    
    const vol = globalVolume;
    
    switch (type) {
      case 'click':
      case 'clickSoft':
        playMechanicalClick(vol);
        break;
      case 'hover':
      case 'hoverSoft':
        playSoftHover(vol);
        break;
      case 'confirm':
        playTone(440, 'sine', 0.15, vol * 0.5);
        setTimeout(() => playTone(554, 'sine', 0.15, vol * 0.5), 50);
        setTimeout(() => playTone(659, 'sine', 0.2, vol * 0.5), 100);
        break;
      case 'success':
        [440, 554, 659, 880].forEach((freq, i) => {
          setTimeout(() => playTone(freq, 'sine', 0.1, vol * 0.4), i * 60);
        });
        break;
      case 'open':
        playTone(300, 'sine', 0.08, vol * 0.4);
        setTimeout(() => playTone(500, 'sine', 0.1, vol * 0.4), 40);
        break;
      case 'close':
        playTone(500, 'sine', 0.08, vol * 0.4);
        setTimeout(() => playTone(300, 'sine', 0.1, vol * 0.4), 40);
        break;
      case 'boot':
        playTone(100, 'sawtooth', 0.8, vol * 0.3);
        setTimeout(() => playTone(200, 'square', 0.5, vol * 0.2), 200);
        break;
      case 'error':
        playTone(200, 'square', 0.15, vol * 0.4);
        setTimeout(() => playTone(150, 'square', 0.2, vol * 0.4), 100);
        break;
      case 'swipe':
      case 'swoosh':
        playSwipe(vol);
        break;
      case 'tab':
        playTone(600, 'sine', 0.05, vol * 0.3);
        break;
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
  swipe: () => SoundEffects.play('swipe'),
  swoosh: () => SoundEffects.play('swoosh'),
  tab: () => SoundEffects.play('tab'),
};

export default useSoundEffects;
