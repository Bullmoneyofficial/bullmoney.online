"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// =========================================
// SPLINE AUDIO ENGINE - 20 UNIQUE INTERACTION SOUNDS
// Comprehensive audio feedback for 3D Spline interactions
// =========================================

export type SplineInteractionType = 
  | 'click'
  | 'doubleClick'
  | 'longPress'
  | 'hover'
  | 'hoverExit'
  | 'drag'
  | 'dragStart'
  | 'dragEnd'
  | 'scroll'
  | 'zoom'
  | 'rotate'
  | 'touch'
  | 'touchEnd'
  | 'swipeLeft'
  | 'swipeRight'
  | 'swipeUp'
  | 'swipeDown'
  | 'pinch'
  | 'spread'
  | 'objectSelect';

export type SplineAudioProfile = 'CYBER' | 'ORGANIC' | 'MECHANICAL' | 'SILENT';

interface SplineAudioOptions {
  enabled?: boolean;
  profile?: SplineAudioProfile;
  volume?: number;
}

interface SplineAudioPlayer {
  init: () => Promise<AudioContext | null>;
  play: (type: SplineInteractionType) => void;
  setVolume: (volume: number) => void;
  setProfile: (profile: SplineAudioProfile) => void;
  isInitialized: boolean;
}

// Sound definition type
interface SoundDefinition {
  frequency: number;
  type: OscillatorType;
  duration: number;
  volume: number;
  attack?: number;
  decay?: number;
  modFreq?: number;
  modDepth?: number;
  filterFreq?: number;
  filterType?: BiquadFilterType;
  detune?: number;
  harmonics?: number[];
}

// =========================================
// SOUND PROFILES - 20 Unique Sounds per Profile
// =========================================

const CYBER_SOUNDS: Record<SplineInteractionType, SoundDefinition> = {
  // Mouse/Click interactions
  click: { frequency: 800, type: 'square', duration: 0.08, volume: 0.15, attack: 0.005, filterFreq: 2000, filterType: 'lowpass' },
  doubleClick: { frequency: 1200, type: 'square', duration: 0.12, volume: 0.18, attack: 0.003, modFreq: 100, modDepth: 200 },
  longPress: { frequency: 200, type: 'sawtooth', duration: 0.4, volume: 0.12, attack: 0.1, filterFreq: 800, filterType: 'lowpass' },
  
  // Hover interactions
  hover: { frequency: 1500, type: 'sine', duration: 0.05, volume: 0.06, attack: 0.01, detune: 10 },
  hoverExit: { frequency: 1200, type: 'sine', duration: 0.04, volume: 0.04, attack: 0.005, detune: -20 },
  
  // Drag interactions
  drag: { frequency: 300, type: 'triangle', duration: 0.03, volume: 0.08, modFreq: 20, modDepth: 50 },
  dragStart: { frequency: 400, type: 'sawtooth', duration: 0.15, volume: 0.12, attack: 0.02, filterFreq: 1500, filterType: 'bandpass' },
  dragEnd: { frequency: 600, type: 'sine', duration: 0.2, volume: 0.1, attack: 0.01, decay: 0.15 },
  
  // Scroll/Zoom interactions
  scroll: { frequency: 2000, type: 'sine', duration: 0.02, volume: 0.04, detune: 50 },
  zoom: { frequency: 500, type: 'triangle', duration: 0.1, volume: 0.08, modFreq: 10, modDepth: 100 },
  rotate: { frequency: 350, type: 'sine', duration: 0.06, volume: 0.07, modFreq: 8, modDepth: 30 },
  
  // Touch interactions
  touch: { frequency: 1000, type: 'sine', duration: 0.06, volume: 0.1, attack: 0.005 },
  touchEnd: { frequency: 800, type: 'sine', duration: 0.08, volume: 0.08, decay: 0.06 },
  
  // Swipe interactions
  swipeLeft: { frequency: 600, type: 'sawtooth', duration: 0.15, volume: 0.1, filterFreq: 1200, filterType: 'highpass', detune: -100 },
  swipeRight: { frequency: 700, type: 'sawtooth', duration: 0.15, volume: 0.1, filterFreq: 1200, filterType: 'highpass', detune: 100 },
  swipeUp: { frequency: 800, type: 'triangle', duration: 0.12, volume: 0.1, modFreq: 15, modDepth: 200 },
  swipeDown: { frequency: 500, type: 'triangle', duration: 0.12, volume: 0.1, modFreq: 15, modDepth: -200 },
  
  // Pinch/Spread (multi-touch)
  pinch: { frequency: 1800, type: 'sine', duration: 0.1, volume: 0.08, modFreq: 30, modDepth: 300, detune: -50 },
  spread: { frequency: 400, type: 'sine', duration: 0.12, volume: 0.08, modFreq: 25, modDepth: 200, detune: 50 },
  
  // Object selection
  objectSelect: { frequency: 660, type: 'square', duration: 0.15, volume: 0.14, attack: 0.01, harmonics: [1, 0.5, 0.25] },
};

const ORGANIC_SOUNDS: Record<SplineInteractionType, SoundDefinition> = {
  click: { frequency: 220, type: 'sine', duration: 0.12, volume: 0.12, attack: 0.02, decay: 0.08 },
  doubleClick: { frequency: 330, type: 'sine', duration: 0.18, volume: 0.14, attack: 0.015, harmonics: [1, 0.6] },
  longPress: { frequency: 110, type: 'sine', duration: 0.5, volume: 0.1, attack: 0.15, filterFreq: 400, filterType: 'lowpass' },
  
  hover: { frequency: 880, type: 'sine', duration: 0.06, volume: 0.04, attack: 0.02 },
  hoverExit: { frequency: 660, type: 'sine', duration: 0.05, volume: 0.03, decay: 0.04 },
  
  drag: { frequency: 180, type: 'sine', duration: 0.04, volume: 0.06, modFreq: 5, modDepth: 20 },
  dragStart: { frequency: 200, type: 'triangle', duration: 0.2, volume: 0.1, attack: 0.05 },
  dragEnd: { frequency: 300, type: 'sine', duration: 0.25, volume: 0.08, decay: 0.2 },
  
  scroll: { frequency: 1200, type: 'sine', duration: 0.025, volume: 0.03, detune: 30 },
  zoom: { frequency: 280, type: 'sine', duration: 0.12, volume: 0.07, modFreq: 4, modDepth: 40 },
  rotate: { frequency: 200, type: 'sine', duration: 0.08, volume: 0.06, modFreq: 3, modDepth: 15 },
  
  touch: { frequency: 550, type: 'sine', duration: 0.08, volume: 0.08, attack: 0.01 },
  touchEnd: { frequency: 440, type: 'sine', duration: 0.1, volume: 0.06, decay: 0.08 },
  
  swipeLeft: { frequency: 350, type: 'sine', duration: 0.18, volume: 0.08, modFreq: 8, modDepth: 50 },
  swipeRight: { frequency: 400, type: 'sine', duration: 0.18, volume: 0.08, modFreq: 8, modDepth: 50 },
  swipeUp: { frequency: 500, type: 'sine', duration: 0.15, volume: 0.08, modFreq: 6, modDepth: 80 },
  swipeDown: { frequency: 300, type: 'sine', duration: 0.15, volume: 0.08, modFreq: 6, modDepth: 80 },
  
  pinch: { frequency: 900, type: 'sine', duration: 0.12, volume: 0.06, modFreq: 12, modDepth: 100 },
  spread: { frequency: 250, type: 'sine', duration: 0.14, volume: 0.06, modFreq: 10, modDepth: 80 },
  
  objectSelect: { frequency: 440, type: 'sine', duration: 0.2, volume: 0.12, attack: 0.02, harmonics: [1, 0.7, 0.4] },
};

const MECHANICAL_SOUNDS: Record<SplineInteractionType, SoundDefinition> = {
  click: { frequency: 120, type: 'square', duration: 0.06, volume: 0.18, filterFreq: 600, filterType: 'lowpass' },
  doubleClick: { frequency: 150, type: 'square', duration: 0.1, volume: 0.2, filterFreq: 800, filterType: 'lowpass' },
  longPress: { frequency: 80, type: 'sawtooth', duration: 0.35, volume: 0.15, attack: 0.08, filterFreq: 300, filterType: 'lowpass' },
  
  hover: { frequency: 2500, type: 'square', duration: 0.02, volume: 0.05, filterFreq: 1500, filterType: 'bandpass' },
  hoverExit: { frequency: 2000, type: 'square', duration: 0.015, volume: 0.04, filterFreq: 1200, filterType: 'bandpass' },
  
  drag: { frequency: 100, type: 'sawtooth', duration: 0.025, volume: 0.1, modFreq: 40, modDepth: 30 },
  dragStart: { frequency: 180, type: 'square', duration: 0.12, volume: 0.15, filterFreq: 500, filterType: 'lowpass' },
  dragEnd: { frequency: 250, type: 'square', duration: 0.15, volume: 0.12, filterFreq: 700, filterType: 'lowpass' },
  
  scroll: { frequency: 3000, type: 'square', duration: 0.015, volume: 0.04, filterFreq: 2000, filterType: 'highpass' },
  zoom: { frequency: 200, type: 'sawtooth', duration: 0.08, volume: 0.1, modFreq: 25, modDepth: 60 },
  rotate: { frequency: 150, type: 'sawtooth', duration: 0.05, volume: 0.08, modFreq: 20, modDepth: 40 },
  
  touch: { frequency: 400, type: 'square', duration: 0.05, volume: 0.12, filterFreq: 1000, filterType: 'lowpass' },
  touchEnd: { frequency: 300, type: 'square', duration: 0.06, volume: 0.1, filterFreq: 800, filterType: 'lowpass' },
  
  swipeLeft: { frequency: 250, type: 'sawtooth', duration: 0.12, volume: 0.12, filterFreq: 600, filterType: 'bandpass' },
  swipeRight: { frequency: 280, type: 'sawtooth', duration: 0.12, volume: 0.12, filterFreq: 600, filterType: 'bandpass' },
  swipeUp: { frequency: 320, type: 'sawtooth', duration: 0.1, volume: 0.12, filterFreq: 700, filterType: 'bandpass' },
  swipeDown: { frequency: 200, type: 'sawtooth', duration: 0.1, volume: 0.12, filterFreq: 500, filterType: 'bandpass' },
  
  pinch: { frequency: 500, type: 'square', duration: 0.08, volume: 0.1, modFreq: 50, modDepth: 150 },
  spread: { frequency: 180, type: 'square', duration: 0.1, volume: 0.1, modFreq: 40, modDepth: 100 },
  
  objectSelect: { frequency: 200, type: 'square', duration: 0.12, volume: 0.16, filterFreq: 800, filterType: 'lowpass', harmonics: [1, 0.8, 0.6] },
};

const SOUND_PROFILES: Record<SplineAudioProfile, Record<SplineInteractionType, SoundDefinition> | null> = {
  CYBER: CYBER_SOUNDS,
  ORGANIC: ORGANIC_SOUNDS,
  MECHANICAL: MECHANICAL_SOUNDS,
  SILENT: null,
};

// =========================================
// SPLINE AUDIO HOOK
// =========================================

export const useSplineAudio = (options: SplineAudioOptions = {}): SplineAudioPlayer => {
  const { 
    enabled = true, 
    profile: initialProfile = 'CYBER',
    volume: initialVolume = 0.5 
  } = options;

  const AudioContextRef = useRef<AudioContext | null>(null);
  const MasterGainRef = useRef<GainNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<SplineAudioProfile>(initialProfile);
  const [currentVolume, setCurrentVolume] = useState(initialVolume);
  
  // Throttle refs to prevent audio spam
  const lastPlayTime = useRef<Record<string, number>>({});
  const throttleMs = 30; // Minimum ms between same sound type

  // Initialize or Resume Audio Context
  const ensureContext = useCallback(async (): Promise<AudioContext | null> => {
    if (typeof window === 'undefined') return null;

    try {
      if (!AudioContextRef.current) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) {
          console.warn('[SplineAudio] Web Audio API not supported');
          return null;
        }

        AudioContextRef.current = new Ctx();
        MasterGainRef.current = AudioContextRef.current.createGain();
        MasterGainRef.current.gain.value = currentVolume;
        MasterGainRef.current.connect(AudioContextRef.current.destination);
        setIsInitialized(true);
        console.log('[SplineAudio] Engine initialized');
      }

      if (AudioContextRef.current?.state === 'suspended') {
        await AudioContextRef.current.resume();
      }

      return AudioContextRef.current;
    } catch (error) {
      console.error('[SplineAudio] Init error:', error);
      return null;
    }
  }, [currentVolume]);

  // Update master gain when volume changes
  useEffect(() => {
    if (MasterGainRef.current && AudioContextRef.current) {
      const ctx = AudioContextRef.current;
      const targetGain = enabled && currentProfile !== 'SILENT' ? currentVolume : 0;
      MasterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
      MasterGainRef.current.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.05);
    }
  }, [enabled, currentProfile, currentVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (AudioContextRef.current) {
        try {
          if (MasterGainRef.current) {
            MasterGainRef.current.disconnect();
            MasterGainRef.current = null;
          }
          if (AudioContextRef.current.state !== 'closed') {
            AudioContextRef.current.close();
          }
          AudioContextRef.current = null;
        } catch (e) {
          console.warn('[SplineAudio] Cleanup error:', e);
        }
      }
    };
  }, []);

  // Play a sound based on interaction type
  const playSound = useCallback(async (type: SplineInteractionType) => {
    if (!enabled || currentProfile === 'SILENT') return;

    // Throttle to prevent audio spam
    const now = Date.now();
    if (lastPlayTime.current[type] && now - lastPlayTime.current[type] < throttleMs) {
      return;
    }
    lastPlayTime.current[type] = now;

    const ctx = await ensureContext();
    if (!ctx || !MasterGainRef.current) return;

    const sounds = SOUND_PROFILES[currentProfile];
    if (!sounds) return;

    const soundDef = sounds[type];
    if (!soundDef) return;

    const {
      frequency,
      type: oscType,
      duration,
      volume,
      attack = 0.005,
      decay = duration * 0.7,
      modFreq,
      modDepth,
      filterFreq,
      filterType,
      detune = 0,
      harmonics,
    } = soundDef;

    const currentTime = ctx.currentTime;

    // Create main oscillator
    const osc = ctx.createOscillator();
    osc.type = oscType;
    osc.frequency.setValueAtTime(frequency, currentTime);
    if (detune) {
      osc.detune.setValueAtTime(detune, currentTime);
    }

    // Create gain envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, currentTime + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

    let outputNode: AudioNode = osc;

    // Add FM modulation if specified
    if (modFreq && modDepth) {
      const modOsc = ctx.createOscillator();
      modOsc.type = 'sine';
      modOsc.frequency.setValueAtTime(modFreq, currentTime);
      
      const modGain = ctx.createGain();
      modGain.gain.setValueAtTime(modDepth, currentTime);
      
      modOsc.connect(modGain);
      modGain.connect(osc.frequency);
      modOsc.start(currentTime);
      modOsc.stop(currentTime + duration + 0.1);
    }

    // Add filter if specified
    if (filterFreq && filterType) {
      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(filterFreq, currentTime);
      filter.Q.setValueAtTime(1, currentTime);
      
      outputNode.connect(filter);
      outputNode = filter;
    }

    // Add harmonics if specified
    if (harmonics && harmonics.length > 0) {
      const merger = ctx.createGain();
      merger.gain.setValueAtTime(1 / harmonics.length, currentTime);
      
      outputNode.connect(gainNode);
      
      harmonics.forEach((harmGain, i) => {
        if (i === 0) return; // Skip fundamental (already connected)
        
        const harmOsc = ctx.createOscillator();
        harmOsc.type = oscType;
        harmOsc.frequency.setValueAtTime(frequency * (i + 1), currentTime);
        
        const harmGainNode = ctx.createGain();
        harmGainNode.gain.setValueAtTime(harmGain * volume, currentTime);
        harmGainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
        
        harmOsc.connect(harmGainNode);
        harmGainNode.connect(MasterGainRef.current!);
        
        harmOsc.start(currentTime);
        harmOsc.stop(currentTime + duration + 0.1);
      });
    }

    // Connect final output
    outputNode.connect(gainNode);
    gainNode.connect(MasterGainRef.current);

    // Start and stop
    osc.start(currentTime);
    osc.stop(currentTime + duration + 0.1);

  }, [enabled, currentProfile, ensureContext]);

  // Volume setter
  const setVolume = useCallback((vol: number) => {
    setCurrentVolume(Math.max(0, Math.min(1, vol)));
  }, []);

  // Profile setter
  const setProfile = useCallback((profile: SplineAudioProfile) => {
    setCurrentProfile(profile);
  }, []);

  return useMemo<SplineAudioPlayer>(() => ({
    init: ensureContext,
    play: playSound,
    setVolume,
    setProfile,
    isInitialized,
  }), [ensureContext, playSound, setVolume, setProfile, isInitialized]);
};

// =========================================
// SPLINE EVENT HANDLER HOOK
// Automatically maps Spline/DOM events to audio
// =========================================

interface SplineAudioHandlers {
  onMouseDown: (e: React.MouseEvent | MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent | MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent | MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent | MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent | MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent | TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent | TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent | TouchEvent) => void;
  onWheel: (e: React.WheelEvent | WheelEvent) => void;
  onDoubleClick: (e: React.MouseEvent | MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent | MouseEvent) => void;
}

export const useSplineAudioHandlers = (
  audioPlayer: SplineAudioPlayer,
  containerRef: React.RefObject<HTMLElement | null>
): SplineAudioHandlers => {
  
  // Tracking refs for gesture detection
  const isDragging = useRef(false);
  const mouseDownTime = useRef(0);
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const touchStartPos = useRef<{ x: number; y: number }[]>([]);
  const lastTouchDistance = useRef(0);
  const lastMoveTime = useRef(0);
  const isHovering = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTime = useRef(0);

  // Mouse handlers
  const onMouseDown = useCallback((e: React.MouseEvent | MouseEvent) => {
    mouseDownTime.current = Date.now();
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    isDragging.current = false;
    
    // Start long press detection
    longPressTimer.current = setTimeout(() => {
      if (!isDragging.current) {
        audioPlayer.play('longPress');
      }
    }, 500);
    
    audioPlayer.play('click');
  }, [audioPlayer]);

  const onMouseUp = useCallback((e: React.MouseEvent | MouseEvent) => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (isDragging.current) {
      audioPlayer.play('dragEnd');
      isDragging.current = false;
    }
  }, [audioPlayer]);

  const onMouseEnter = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!isHovering.current) {
      isHovering.current = true;
      audioPlayer.play('hover');
    }
  }, [audioPlayer]);

  const onMouseLeave = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (isHovering.current) {
      isHovering.current = false;
      audioPlayer.play('hoverExit');
    }
    
    if (isDragging.current) {
      audioPlayer.play('dragEnd');
      isDragging.current = false;
    }
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, [audioPlayer]);

  const onMouseMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    // Check for drag start
    if (mouseDownTime.current > 0 && !isDragging.current) {
      const dx = e.clientX - mouseDownPos.current.x;
      const dy = e.clientY - mouseDownPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        isDragging.current = true;
        audioPlayer.play('dragStart');
        
        // Clear long press timer when dragging starts
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
    }
    
    // Continuous drag sound (throttled by audio engine)
    if (isDragging.current) {
      const now = Date.now();
      if (now - lastMoveTime.current > 50) {
        audioPlayer.play('drag');
        lastMoveTime.current = now;
      }
    }
  }, [audioPlayer]);

  const onDoubleClick = useCallback((e: React.MouseEvent | MouseEvent) => {
    audioPlayer.play('doubleClick');
  }, [audioPlayer]);

  const onContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
    audioPlayer.play('objectSelect');
  }, [audioPlayer]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent | TouchEvent) => {
    const touches = 'touches' in e ? Array.from(e.touches) : [];
    touchStartPos.current = touches.map(t => ({ x: t.clientX, y: t.clientY }));
    
    if (touches.length === 1) {
      audioPlayer.play('touch');
      mouseDownTime.current = Date.now();
      
      // Long press detection for touch
      longPressTimer.current = setTimeout(() => {
        audioPlayer.play('longPress');
      }, 500);
    } else if (touches.length === 2) {
      // Calculate initial distance for pinch detection
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, [audioPlayer]);

  const onTouchEnd = useCallback((e: React.TouchEvent | TouchEvent) => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    audioPlayer.play('touchEnd');
    
    // Detect swipe
    if (touchStartPos.current.length === 1 && Date.now() - mouseDownTime.current < 300) {
      const endTouch = 'changedTouches' in e ? e.changedTouches[0] : null;
      if (endTouch) {
        const dx = endTouch.clientX - touchStartPos.current[0].x;
        const dy = endTouch.clientY - touchStartPos.current[0].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 50) {
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          
          if (angle >= -45 && angle < 45) {
            audioPlayer.play('swipeRight');
          } else if (angle >= 45 && angle < 135) {
            audioPlayer.play('swipeDown');
          } else if (angle >= -135 && angle < -45) {
            audioPlayer.play('swipeUp');
          } else {
            audioPlayer.play('swipeLeft');
          }
        }
      }
    }
    
    touchStartPos.current = [];
    mouseDownTime.current = 0;
  }, [audioPlayer]);

  const onTouchMove = useCallback((e: React.TouchEvent | TouchEvent) => {
    const touches = 'touches' in e ? Array.from(e.touches) : [];
    
    // Clear long press timer on movement
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (touches.length === 1) {
      // Single finger drag
      const now = Date.now();
      if (now - lastMoveTime.current > 80) {
        audioPlayer.play('drag');
        lastMoveTime.current = now;
      }
    } else if (touches.length === 2) {
      // Pinch/spread detection
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      
      const distanceDiff = currentDistance - lastTouchDistance.current;
      
      if (Math.abs(distanceDiff) > 10) {
        if (distanceDiff > 0) {
          audioPlayer.play('spread');
        } else {
          audioPlayer.play('pinch');
        }
        lastTouchDistance.current = currentDistance;
      }
      
      // Also detect rotation
      const now = Date.now();
      if (now - lastMoveTime.current > 100) {
        audioPlayer.play('rotate');
        lastMoveTime.current = now;
      }
    }
  }, [audioPlayer]);

  // Wheel handler
  const onWheel = useCallback((e: React.WheelEvent | WheelEvent) => {
    const now = Date.now();
    
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      // Vertical scroll
      if (e.ctrlKey || e.metaKey) {
        // Zoom (pinch on trackpad)
        if (now - lastScrollTime.current > 100) {
          audioPlayer.play('zoom');
          lastScrollTime.current = now;
        }
      } else {
        // Regular scroll
        if (now - lastScrollTime.current > 60) {
          audioPlayer.play('scroll');
          lastScrollTime.current = now;
        }
      }
    } else if (Math.abs(e.deltaX) > 10) {
      // Horizontal scroll (trackpad)
      if (now - lastScrollTime.current > 80) {
        audioPlayer.play('rotate');
        lastScrollTime.current = now;
      }
    }
  }, [audioPlayer]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return useMemo(() => ({
    onMouseDown,
    onMouseUp,
    onMouseEnter,
    onMouseLeave,
    onMouseMove,
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onWheel,
    onDoubleClick,
    onContextMenu,
  }), [
    onMouseDown, onMouseUp, onMouseEnter, onMouseLeave, onMouseMove,
    onTouchStart, onTouchEnd, onTouchMove, onWheel, onDoubleClick, onContextMenu
  ]);
};

// =========================================
// CONVENIENCE HOOK - Combines audio + handlers
// =========================================

export const useSplineInteractionAudio = (
  containerRef: React.RefObject<HTMLElement | null>,
  options: SplineAudioOptions = {}
) => {
  const audioPlayer = useSplineAudio(options);
  const handlers = useSplineAudioHandlers(audioPlayer, containerRef);
  
  // Initialize audio on first user interaction
  useEffect(() => {
    const initOnInteraction = () => {
      audioPlayer.init();
      window.removeEventListener('click', initOnInteraction);
      window.removeEventListener('touchstart', initOnInteraction);
    };
    
    window.addEventListener('click', initOnInteraction);
    window.addEventListener('touchstart', initOnInteraction);
    
    return () => {
      window.removeEventListener('click', initOnInteraction);
      window.removeEventListener('touchstart', initOnInteraction);
    };
  }, [audioPlayer]);
  
  return {
    audioPlayer,
    handlers,
  };
};

export default useSplineAudio;
