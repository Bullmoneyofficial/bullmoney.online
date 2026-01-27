"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

export interface DeviceVolumeState {
  deviceVolume: number; // 0-1
  isVolumeChanging: boolean;
  lastVolumeChangeTime: number;
  volumeChangeDirection: 'up' | 'down' | null;
}

export interface UseDeviceVolumeDetectorOptions {
  onVolumeChange?: (volume: number, direction: 'up' | 'down') => void;
  onVolumeButtonPress?: (direction: 'up' | 'down') => void;
  debounceMs?: number;
  enabled?: boolean;
}

/**
 * Hook to detect device volume button presses and volume changes
 * Works on iOS, Android, and Desktop
 * 
 * Strategy:
 * 1. Listen for keyboard volume keys on desktop (VolumeUp, VolumeDown)
 * 2. Create a hidden video element for iOS volume detection
 * 3. Use Media Session API where available
 */
export function useDeviceVolumeDetector({
  onVolumeChange,
  onVolumeButtonPress,
  debounceMs = 300,
  enabled = true,
}: UseDeviceVolumeDetectorOptions = {}) {
  const [state, setState] = useState<DeviceVolumeState>({
    deviceVolume: 1,
    isVolumeChanging: false,
    lastVolumeChangeTime: 0,
    volumeChangeDirection: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastVolumeRef = useRef<number>(1);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActivatedRef = useRef(false);

  // Handle volume change detection
  const handleVolumeChange = useCallback((newVolume: number, forceDirection?: 'up' | 'down') => {
    const lastVolume = lastVolumeRef.current;
    const direction = forceDirection || (newVolume > lastVolume ? 'up' : 'down');
    
    // Only trigger if volume actually changed (or force direction provided)
    if (forceDirection || Math.abs(newVolume - lastVolume) > 0.001) {
      lastVolumeRef.current = newVolume;
      
      // Clear existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Set changing state immediately
      setState(prev => ({
        ...prev,
        deviceVolume: newVolume,
        isVolumeChanging: true,
        lastVolumeChangeTime: Date.now(),
        volumeChangeDirection: direction,
      }));

      // Trigger callbacks
      onVolumeChange?.(newVolume, direction);
      onVolumeButtonPress?.(direction);
      
      // Clear the "changing" state after debounce
      debounceTimeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isVolumeChanging: false,
        }));
      }, debounceMs);
    }
  }, [onVolumeChange, onVolumeButtonPress, debounceMs]);

  // Create hidden video element for iOS volume detection
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;

    // Create a tiny video element (iOS tracks volume changes on video)
    const video = document.createElement('video');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.muted = false;
    video.volume = 1;
    video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    
    // Use a silent video src (base64 encoded minimal video)
    video.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAu1tZGF0AAACrQYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBlOWE1OTAzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTMgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAPZYiEBDzz/kD/ILuMOuN3d+2wAAAABm1vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAA+gAAAACAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAmB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAACHG1kaWEAAAAgbWRoZAAAAAAAAAAAAAAAAAAAQAAAAEAAVcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAddtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAGXc3RibAAAAJNzdHNkAAAAAAAAAAEAAACDYXZjMQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAQABAASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAAC10dHRzAAAAAAAAAAEAAAABAAAAQAAAAAEAAAAUc3RzcwAAAAAAAAABAAAAAQAAABhjdHRzAAAAAAAAAAEAAAABAAAAGAAAAChzdHNjAAAAAAAAAAEAAAABAAAAAgAAAAEAAAAUc3RzegAAAAAAAAACRwAAAAIAAAAUc3RjbwAAAAAAAAABAAAAMAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTguMjkuMTAw';
    
    document.body.appendChild(video);
    videoRef.current = video;

    // Track volume changes
    const handleVideoVolumeChange = () => {
      if (video && isActivatedRef.current) {
        handleVolumeChange(video.volume);
      }
    };
    
    video.addEventListener('volumechange', handleVideoVolumeChange);

    return () => {
      video.removeEventListener('volumechange', handleVideoVolumeChange);
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
      videoRef.current = null;
    };
  }, [enabled, handleVolumeChange]);

  // Listen for keyboard volume keys (Desktop)
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Volume Up: AudioVolumeUp, VolumeUp
      // Volume Down: AudioVolumeDown, VolumeDown
      const isVolumeUp = e.key === 'AudioVolumeUp' || e.code === 'AudioVolumeUp' || 
                         e.key === 'VolumeUp' || e.code === 'VolumeUp';
      const isVolumeDown = e.key === 'AudioVolumeDown' || e.code === 'AudioVolumeDown' || 
                           e.key === 'VolumeDown' || e.code === 'VolumeDown';
      
      if (isVolumeUp || isVolumeDown) {
        const direction = isVolumeUp ? 'up' : 'down';
        const currentVol = lastVolumeRef.current;
        const volumeDelta = direction === 'up' ? 0.0625 : -0.0625; // 1/16 step like system
        const newVol = Math.max(0, Math.min(1, currentVol + volumeDelta));
        
        handleVolumeChange(newVol, direction);
      }
    };

    // Use capture to get events before they're consumed
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [enabled, handleVolumeChange]);

  // Activate audio/video context on user interaction (needed for iOS)
  const activateAudioContext = useCallback(() => {
    if (isActivatedRef.current) return;
    isActivatedRef.current = true;
    
    // Try to play the hidden video (activates volume tracking on iOS)
    const video = videoRef.current;
    if (video) {
      video.play().then(() => {
        video.pause();
      }).catch(() => {
        // Autoplay still blocked, will try again on next interaction
        isActivatedRef.current = false;
      });
    }
    
    // Also try AudioContext
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass && !audioContextRef.current) {
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
      }
    } catch (e) {
      // AudioContext not available
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    activateAudioContext,
    isActivated: isActivatedRef.current,
  };
}

export default useDeviceVolumeDetector;
