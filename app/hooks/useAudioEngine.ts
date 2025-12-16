"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// =========================================
// 1. TYPES (Exported)
// =========================================
export type SoundProfile = 'MECHANICAL' | 'SOROS' | 'SCI-FI' | 'SILENT';

// Helper type for SFX definitions
type SFXPlayer = {
    init: () => Promise<AudioContext | null>;
    hover: () => void;
    click: () => void;
    switch: () => void;
    confirm: () => void;
    boot: () => void;
    success: () => void;
};


// =========================================
// 2. FILE-BASED AUDIO HOOKS (Exported)
// =========================================

// Hook 1: Loader Audio (modals.mp3)
export const useLoaderAudio = (url: string, enabled: boolean) => {
    useEffect(() => {
        if (!enabled) return;
        const audio = new Audio(url);
        audio.volume = 1.0; 
        
        const unlock = () => { audio.play().catch(() => {}); removeListeners(); };
        const removeListeners = () => {
          window.removeEventListener('click', unlock);
          window.removeEventListener('touchstart', unlock);
        };
    
        window.addEventListener('click', unlock);
        window.addEventListener('touchstart', unlock);
        
        // Attempt to play immediately (will fail if no interaction)
        audio.play().catch(() => {});
    
        const timer = setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
            removeListeners();
        }, 4800);
    
        return () => {
          audio.pause();
          audio.currentTime = 0;
          clearTimeout(timer);
          removeListeners();
        };
      }, [url, enabled]);
};

// Hook 2: Ambient (ambient.mp3)
export const useOneTimeAmbient = (url: string, trigger: boolean) => {
    useEffect(() => {
        if (!trigger) return;
        // Check local storage only on the client side
        const hasPlayed = typeof window !== 'undefined' ? localStorage.getItem('ambient_played_v1') : 'true';
        if (hasPlayed === 'true') return; 
    
        const audio = new Audio(url);
        audio.volume = 1.0; 
        audio.loop = false;
        
        // Must be triggered by a user action to avoid browser blocking
        const unlock = () => {
            audio.play()
                .then(() => localStorage.setItem('ambient_played_v1', 'true'))
                .catch(() => {});
            removeListeners();
        };

        const removeListeners = () => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
        };
    
        window.addEventListener('click', unlock);
        window.addEventListener('touchstart', unlock);
        
        return () => {
            removeListeners();
            audio.pause();
            audio.src = "";
        };
      }, [url, trigger]);
};

// Hook 3: Background Music (background.mp3)
export const useBackgroundMusic = (url: string) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
  
    useEffect(() => {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0.01; 
      audioRef.current = audio;
  
      return () => {
        audio.pause();
        audio.src = "";
      };
    }, [url]);
  
    const start = useCallback(() => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.volume = 0.01; 
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false)); // Autoplay failed
      }
    }, []);
  
    const toggle = useCallback(() => {
      if (!audioRef.current) return;
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.volume = 0.01; 
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }, [isPlaying]);
  
    return { isPlaying, start, toggle };
};

// =========================================
// 3. COMPLEX OSCILLATOR ENGINE (Exported)
// =========================================

export const useAudioEngine = (enabled: boolean, profile: SoundProfile): SFXPlayer => {
  const AudioContextRef = useRef<AudioContext | null>(null);
  const MasterGainRef = useRef<GainNode | null>(null);

  // Initialize or Resume Audio Context (same logic)
  const ensureContext = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    if (!AudioContextRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        AudioContextRef.current = new Ctx();
        MasterGainRef.current = AudioContextRef.current.createGain();
        MasterGainRef.current.gain.value = 0.5; 
        MasterGainRef.current.connect(AudioContextRef.current.destination);
      }
    }

    if (AudioContextRef.current?.state === 'suspended') {
      try {
        await AudioContextRef.current.resume();
      } catch (e) {
        // Ignored: expected if called without user interaction
      }
    }
    return AudioContextRef.current;
  }, []);

  // Control Master Gain Node based on 'enabled' prop (same logic)
  useEffect(() => {
    ensureContext().then(() => {
      if (MasterGainRef.current) {
        const ctx = AudioContextRef.current;
        if (!ctx) return;
        
        // Target gain smooth transition
        const targetGain = enabled && profile !== 'SILENT' ? 0.5 : 0;
        
        MasterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
        MasterGainRef.current.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.05);
      }
    });
  }, [enabled, profile, ensureContext]); 

  const playTone = useCallback(async (
    freq: number, 
    type: OscillatorType, 
    duration: number, 
    vol: number, 
    attack = 0.005, 
    decay = 0.1
  ) => {
    if (!enabled || profile === 'SILENT') return;
    
    const ctx = await ensureContext();
    if (!ctx || !MasterGainRef.current) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    let source: AudioNode = osc;

    // --- SOUND PROFILING LOGIC ---
    if (profile === 'MECHANICAL') {
        osc.type = 'square';
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + duration);
        source.connect(filter);
        source = filter;
    } 
    else if (profile === 'SOROS') {
        osc.type = 'triangle';
    } 
    else if (profile === 'SCI-FI') {
        osc.type = 'sawtooth';
        // Simple FM modulation for metallic/sci-fi texture
        const fmOsc = ctx.createOscillator();
        fmOsc.type = 'sine';
        fmOsc.frequency.setValueAtTime(50, now); // Modulator Frequency
        const modGain = ctx.createGain();
        modGain.gain.setValueAtTime(500, now); // Modulation Depth
        fmOsc.connect(modGain);
        modGain.connect(osc.frequency);
        fmOsc.start(now);
        fmOsc.stop(now + duration);
    } 
    else {
        osc.type = type;
    }
    // --- END PROFILING LOGIC ---

    osc.frequency.setValueAtTime(freq, now);
    source.connect(gain); // Connect profile-output to main gain

    // Envelope (ADSR)
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    gain.connect(MasterGainRef.current);
    osc.start(now);
    osc.stop(now + duration + 0.1);

  }, [enabled, profile, ensureContext]);

  // Wrapper function to call playTone (keeps definitions cleaner)
  const playWrapper = useCallback((f: number, t: OscillatorType, d: number, v: number, a?: number, dc?: number) => {
    playTone(f, t, d, v, a, dc);
  }, [playTone]);

  return useMemo<SFXPlayer>(() => ({
    init: ensureContext,
    hover: () => {
      if (profile === 'MECHANICAL') playWrapper(200, 'square', 0.03, 0.05);
      else if (profile === 'SOROS') playWrapper(400, 'sine', 0.05, 0.02);
      else if (profile === 'SCI-FI') playWrapper(1200, 'sine', 0.02, 0.01); 
      // Silent is handled internally
    },
    click: () => {
      if (profile === 'MECHANICAL') playWrapper(150, 'square', 0.1, 0.1); 
      else if (profile === 'SOROS') playWrapper(600, 'triangle', 0.1, 0.05); 
      else if (profile === 'SCI-FI') playWrapper(800, 'sawtooth', 0.08, 0.05);
    },
    switch: () => {
       if (profile === 'MECHANICAL') playWrapper(1000, 'square', 0.02, 0.02);
       else if (profile === 'SCI-FI' || profile === 'SOROS') playWrapper(2000, 'sine', 0.02, 0.02);
    },
    confirm: () => {
      // Basic Arpeggiated Chord
      playWrapper(440, 'sine', 0.2, 0.1);
      setTimeout(() => playWrapper(554, 'sine', 0.2, 0.1), 50);
      setTimeout(() => playWrapper(659, 'sine', 0.4, 0.1), 100);
    },
    boot: () => {
      // Descending complex tones
      playWrapper(100, 'sawtooth', 1.5, 0.2);
      setTimeout(() => playWrapper(200, 'square', 1.0, 0.1), 200);
      setTimeout(() => playWrapper(400, 'sine', 0.8, 0.1), 400);
    },
    success: () => {
        // Ascending major scale tones
        [440, 554, 659, 880, 1108, 1318].forEach((freq, i) => {
            setTimeout(() => playWrapper(freq, 'square', 0.1, 0.1), i * 60);
        });
    }
  }), [profile, ensureContext, playWrapper]);
};

// =========================================
// 4. FALLBACK DUMMY SFX (Exported)
// =========================================
export const useDummySFX = (): SFXPlayer => {
    return useMemo(() => ({
        init: async () => null,
        click: () => {},
        hover: () => {},
        confirm: () => {},
        boot: () => {},
        switch: () => {},
        success: () => {},
    }), []);
};