"use client";

import { useRef, useCallback } from 'react';

/**
 * Simple, lightweight sound effects using Web Audio API
 * No external dependencies - generates sounds programmatically
 */

type SoundType = 'click' | 'clickSoft' | 'hover' | 'hoverSoft' | 'confirm' | 'success' | 'open' | 'close' | 'boot' | 'error' | 'swipe' | 'swoosh' | 'tab' | 'mt5Entry' | 'tipChange';

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

// Play cinematic swipe/swoosh sound - longer and more intense
const playSwipe = (volume: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    const duration = 0.5; // Longer duration for cinematic feel
    
    // Create noise buffer for swoosh texture
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate shaped noise with exponential decay
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      // Envelope: quick attack, sustained body, smooth decay
      const envelope = Math.sin(t * Math.PI) * Math.exp(-t * 2);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Bandpass filter with frequency sweep for whoosh effect
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + duration);
    filter.Q.value = 2;
    
    // High shelf for air/brightness
    const highShelf = ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 4000;
    highShelf.gain.value = 6;
    
    // Low rumble oscillator for depth
    const rumble = ctx.createOscillator();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(80, now);
    rumble.frequency.exponentialRampToValueAtTime(40, now + duration);
    
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(volume * 0.15, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);
    
    // Whistling high tone for sci-fi edge
    const whistle = ctx.createOscillator();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(2000, now);
    whistle.frequency.exponentialRampToValueAtTime(400, now + duration);
    
    const whistleGain = ctx.createGain();
    whistleGain.gain.setValueAtTime(volume * 0.05, now);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6);
    
    // Main gain with cinematic envelope
    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.03);
    mainGain.gain.setValueAtTime(volume * 0.35, now + 0.1);
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    // Connect noise chain
    noise.connect(filter);
    filter.connect(highShelf);
    highShelf.connect(mainGain);
    
    // Connect rumble
    rumble.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    
    // Connect whistle
    whistle.connect(whistleGain);
    whistleGain.connect(ctx.destination);
    
    // Connect main output
    mainGain.connect(ctx.destination);
    
    // Start all sources
    noise.start(now);
    rumble.start(now);
    whistle.start(now);
    
    // Stop all sources
    noise.stop(now + duration + 0.1);
    rumble.stop(now + duration + 0.1);
    whistle.stop(now + duration + 0.1);
  } catch (e) {
    // Silent fail
  }
};

// Play MetaTrader 5-style trade entry sound
// Classic MT5 order confirmation: quick ascending tones with a ping
const playMT5Entry = (volume: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    
    // First tone: low ping (order placed)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(volume * 0.4, now + 0.005);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);
    
    // Second tone: higher ping (confirmation) 
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(volume * 0.5, now + 0.085);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.25);
    
    // Third tone: resolution ping (trade opened)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(783.99, now + 0.16); // G5
    gain3.gain.setValueAtTime(0, now + 0.16);
    gain3.gain.linearRampToValueAtTime(volume * 0.45, now + 0.165);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.16);
    osc3.stop(now + 0.4);
    
    // Add subtle harmonic shimmer
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(1046.5, now + 0.2); // C6
    shimmerGain.gain.setValueAtTime(0, now + 0.2);
    shimmerGain.gain.linearRampToValueAtTime(volume * 0.15, now + 0.22);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmer.start(now + 0.2);
    shimmer.stop(now + 0.5);
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
      case 'mt5Entry':
      case 'tipChange':
        playMT5Entry(vol);
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
      case 'mt5Entry':
      case 'tipChange':
        playMT5Entry(vol);
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
  mt5Entry: () => SoundEffects.play('mt5Entry'),
  tipChange: () => SoundEffects.play('tipChange'),
};

export default useSoundEffects;
