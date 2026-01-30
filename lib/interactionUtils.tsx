// ============================================================================
// INTERACTION UTILITIES - Sound Effects & Gesture Handlers
// ============================================================================

import React from 'react';

// Sound Effect Types
export type SoundType = 'click' | 'swipe' | 'success' | 'error' | 'hover';

// Sound Effect Player with Web Audio API
class SoundEffectPlayer {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  private ensureAudioContext() {
    if (this.audioContext || typeof window === 'undefined') return;
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      this.audioContext = null;
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  play(type: SoundType, volume: number = 0.1) {
    if (!this.enabled) return;
    this.ensureAudioContext();
    if (!this.audioContext) return;

    try {
      if (this.audioContext.state === 'suspended' && typeof this.audioContext.resume === 'function') {
        this.audioContext.resume();
      }
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configure sound based on type
      switch (type) {
        case 'click':
          oscillator.frequency.value = 800;
          gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.1);
          break;

        case 'hover':
          oscillator.frequency.value = 600;
          gainNode.gain.setValueAtTime(volume * 0.5, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.05);
          break;

        case 'swipe':
          oscillator.frequency.value = 400;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(volume * 0.7, this.audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.2);
          break;

        case 'success':
          // Play a pleasant chord
          oscillator.frequency.value = 523.25; // C5
          gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.3);
          break;

        case 'error':
          oscillator.frequency.value = 200;
          oscillator.type = 'sawtooth';
          gainNode.gain.setValueAtTime(volume * 0.8, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.15);
          break;
      }
    } catch (e) {
      console.warn('Sound effect failed:', e);
    }
  }

  // Play haptic feedback
  vibrate(pattern: number | number[] = 10) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }
}

export const soundPlayer = new SoundEffectPlayer();

// Shorthand functions
export const playClick = () => {
  soundPlayer.play('click');
  soundPlayer.vibrate(10);
};

export const playHover = () => soundPlayer.play('hover');
export const playSwipe = () => {
  soundPlayer.play('swipe');
  soundPlayer.vibrate(15);
};
export const playSuccess = () => {
  soundPlayer.play('success');
  soundPlayer.vibrate([50, 30, 50]);
};
export const playError = () => {
  soundPlayer.play('error');
  soundPlayer.vibrate([100, 50, 100]);
};

// ============================================================================
// SWIPE GESTURE DETECTION
// ============================================================================

export interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance in pixels
  velocityThreshold?: number; // Minimum velocity
  preventScroll?: boolean;
}

export interface SwipeHandlers {
  onTouchStart: (e: TouchEvent | React.TouchEvent) => void;
  onTouchMove: (e: TouchEvent | React.TouchEvent) => void;
  onTouchEnd: (e: TouchEvent | React.TouchEvent) => void;
  onMouseDown: (e: MouseEvent | React.MouseEvent) => void;
  onMouseMove: (e: MouseEvent | React.MouseEvent) => void;
  onMouseUp: (e: MouseEvent | React.MouseEvent) => void;
}

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  isDragging: boolean;
  currentX: number;
  currentY: number;
}

export function createSwipeHandlers(config: SwipeConfig): SwipeHandlers {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 60,  // Increased from 50 for better reliability
    velocityThreshold = 0.25,  // Lowered from 0.3 for easier triggering
    preventScroll = false,
  } = config;

  let state: SwipeState = {
    startX: 0,
    startY: 0,
    startTime: 0,
    isDragging: false,
    currentX: 0,
    currentY: 0,
  };

  const handleStart = (x: number, y: number) => {
    state = {
      startX: x,
      startY: y,
      startTime: Date.now(),
      isDragging: true,
      currentX: x,
      currentY: y,
    };
  };

  const handleMove = (x: number, y: number, preventDefault?: () => void) => {
    if (!state.isDragging) return;

    state.currentX = x;
    state.currentY = y;

    if (preventScroll && preventDefault) {
      const deltaX = Math.abs(x - state.startX);
      const deltaY = Math.abs(y - state.startY);

      // Prevent scroll if horizontal swipe is more prominent
      // Increased threshold from 10 to 15 for better detection
      if (deltaX > deltaY && deltaX > 15) {
        preventDefault();
      }
    }
  };

  const handleEnd = () => {
    if (!state.isDragging) return;

    const deltaX = state.currentX - state.startX;
    const deltaY = state.currentY - state.startY;
    const deltaTime = Math.max(Date.now() - state.startTime, 1); // Prevent division by zero
    const velocityX = Math.abs(deltaX / deltaTime);
    const velocityY = Math.abs(deltaY / deltaTime);

    // Determine swipe direction with improved logic
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontalSwipe) {
      // Horizontal swipe - check both threshold AND velocity (OR condition for better UX)
      if (Math.abs(deltaX) > threshold || (Math.abs(deltaX) > threshold * 0.6 && velocityX > velocityThreshold)) {
        if (deltaX > 0 && onSwipeRight) {
          playSwipe();
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          playSwipe();
          onSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold || (Math.abs(deltaY) > threshold * 0.6 && velocityY > velocityThreshold)) {
        if (deltaY > 0 && onSwipeDown) {
          playSwipe();
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          playSwipe();
          onSwipeUp();
        }
      }
    }

    state.isDragging = false;
  };

  return {
    onTouchStart: (e) => {
      const touch = 'touches' in e ? e.touches[0] : e as any;
      handleStart(touch.clientX, touch.clientY);
    },
    onTouchMove: (e) => {
      const touch = 'touches' in e ? e.touches[0] : e as any;
      handleMove(touch.clientX, touch.clientY, () => {
        if ('preventDefault' in e) e.preventDefault();
      });
    },
    onTouchEnd: () => {
      handleEnd();
    },
    onMouseDown: (e) => {
      const mouse = e as MouseEvent | React.MouseEvent;
      handleStart(mouse.clientX, mouse.clientY);
    },
    onMouseMove: (e) => {
      const mouse = e as MouseEvent | React.MouseEvent;
      handleMove(mouse.clientX, mouse.clientY);
    },
    onMouseUp: () => {
      handleEnd();
    },
  };
}

// ============================================================================
// SCROLL HELPERS
// ============================================================================

export function smoothScrollToPage(pageIndex: number, containerRef: React.RefObject<HTMLElement>) {
  if (!containerRef.current) return;

  const pageHeight = window.innerHeight;
  const targetScroll = pageIndex * pageHeight;

  containerRef.current.scrollTo({
    top: targetScroll,
    behavior: 'smooth',
  });
}

// ============================================================================
// VISUAL SWIPE HELPERS
// ============================================================================

export interface SwipeIndicatorProps {
  direction: 'left' | 'right' | 'up' | 'down';
  show: boolean;
  color?: string;
}

export function SwipeIndicator({ direction, show, color = '#ffffff' }: SwipeIndicatorProps) {
  if (!show) return null;

  const positions = {
    left: 'left-0 top-1/2 -translate-y-1/2',
    right: 'right-0 top-1/2 -translate-y-1/2',
    up: 'top-0 left-1/2 -translate-x-1/2',
    down: 'bottom-0 left-1/2 -translate-x-1/2',
  };

  const arrows = {
    left: '←',
    right: '→',
    up: '↑',
    down: '↓',
  };

  return (
    <div
      className={`fixed ${positions[direction]} z-50 pointer-events-none animate-pulse`}
      style={{ color }}
    >
      <div className="text-4xl font-bold opacity-50">
        {arrows[direction]}
      </div>
    </div>
  );
}
