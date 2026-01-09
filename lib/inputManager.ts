/**
 * Universal Input Manager
 *
 * Comprehensive input handling system that properly splits:
 * - Desktop: Mouse, pointer, keyboard, trackpad
 * - Mobile: Touch, tap, drag, gestures
 *
 * Fixes issues with:
 * - Mouse disappearing
 * - Buttons not clickable/tappable
 * - Touch conflicts between components
 * - Pointer event conflicts
 */

export type InputMode = 'mouse' | 'touch' | 'hybrid';
export type DeviceType = 'desktop' | 'mobile' | 'tablet';

interface InputState {
  mode: InputMode;
  deviceType: DeviceType;
  isTouch: boolean;
  hasPointer: boolean;
  hasMouse: boolean;
  hasTouch: boolean;
  supportsHover: boolean;
  isMacBook: boolean;
  isIPhone: boolean;
  isSafari: boolean;
}

class InputManager {
  private state: InputState;
  private listeners: Set<(state: InputState) => void> = new Set();
  private touchTimeout: NodeJS.Timeout | null = null;
  private lastTouchTime = 0;
  private initialized = false;

  constructor() {
    this.state = this.detectInputCapabilities();
  }

  /**
   * Detect all input capabilities
   */
  private detectInputCapabilities(): InputState {
    if (typeof window === 'undefined') {
      return {
        mode: 'mouse',
        deviceType: 'desktop',
        isTouch: false,
        hasPointer: true,
        hasMouse: true,
        hasTouch: false,
        supportsHover: true,
        isMacBook: false,
        isIPhone: false,
        isSafari: false,
      };
    }

    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';

    // Device detection
    const isMacBook = /macintosh|mac os x/i.test(ua) && !('ontouchstart' in window);
    const isIPhone = /iphone|ipod/i.test(ua);
    const isIPad = /ipad/i.test(ua) || (platform === 'macintel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

    // Input capabilities
    const hasTouch = 'ontouchstart' in window ||
                     navigator.maxTouchPoints > 0 ||
                     // @ts-ignore
                     (window.DocumentTouch && document instanceof DocumentTouch);

    const hasPointer = 'PointerEvent' in window;
    const hasMouse = window.matchMedia('(pointer: fine)').matches;
    const supportsHover = window.matchMedia('(hover: hover)').matches;

    // Device type
    let deviceType: DeviceType = 'desktop';
    if (isIPhone || isAndroid) {
      deviceType = 'mobile';
    } else if (isIPad) {
      deviceType = 'tablet';
    }

    // Input mode
    let mode: InputMode = 'mouse';
    if (hasTouch && !hasMouse) {
      mode = 'touch';
    } else if (hasTouch && hasMouse) {
      mode = 'hybrid';
    }

    return {
      mode,
      deviceType,
      isTouch: hasTouch && !supportsHover,
      hasPointer,
      hasMouse,
      hasTouch,
      supportsHover,
      isMacBook,
      isIPhone,
      isSafari,
    };
  }

  /**
   * Initialize input tracking
   */
  public initialize(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Track first touch to switch to touch mode
    const handleFirstTouch = () => {
      this.lastTouchTime = Date.now();
      if (this.state.mode !== 'touch') {
        this.updateState({
          mode: this.state.hasTouch && !this.state.hasMouse ? 'touch' : 'hybrid',
          isTouch: true
        });
      }
    };

    // Track mouse movement after touch (hybrid devices)
    const handleMouseAfterTouch = () => {
      const timeSinceTouch = Date.now() - this.lastTouchTime;
      // If mouse moved >500ms after touch, switch to hybrid mode
      if (timeSinceTouch > 500 && this.state.mode === 'touch' && this.state.hasMouse) {
        this.updateState({ mode: 'hybrid' });
      }
    };

    // Detect device orientation changes (mobile)
    const handleOrientationChange = () => {
      // Re-detect on orientation change
      this.state = this.detectInputCapabilities();
      this.notifyListeners();
    };

    // Bind events
    window.addEventListener('touchstart', handleFirstTouch, { passive: true, once: true });
    window.addEventListener('mousemove', handleMouseAfterTouch, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Apply initial cursor visibility
    this.updateCursorVisibility();
  }

  /**
   * Update state and notify listeners
   */
  private updateState(partial: Partial<InputState>): void {
    this.state = { ...this.state, ...partial };
    this.updateCursorVisibility();
    this.notifyListeners();
  }

  /**
   * Update cursor visibility based on input mode
   */
  private updateCursorVisibility(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;

    if (this.state.isTouch || this.state.mode === 'touch') {
      // Touch mode: show default cursor, remove custom cursor classes
      root.style.cursor = '';
      body.style.cursor = '';
      root.classList.remove('use-custom-cursor');
      body.classList.remove('use-custom-cursor');
    } else {
      // Mouse mode: allow custom cursor
      // Note: Custom cursor component will add 'use-custom-cursor' class if enabled
    }
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(callback: (state: InputState) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.state);

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.state));
  }

  /**
   * Get current state
   */
  public getState(): InputState {
    return { ...this.state };
  }

  /**
   * Check if device should use mouse interactions
   */
  public shouldUseMouse(): boolean {
    return this.state.mode === 'mouse' ||
           (this.state.mode === 'hybrid' && this.state.supportsHover);
  }

  /**
   * Check if device should use touch interactions
   */
  public shouldUseTouch(): boolean {
    return this.state.mode === 'touch' ||
           (this.state.isTouch && !this.state.supportsHover);
  }

  /**
   * Get pointer events to disable for touch devices
   */
  public getPointerEventsStyle(): 'auto' | 'none' {
    // On pure touch devices, let touch events handle everything
    return this.state.mode === 'touch' ? 'auto' : 'auto';
  }

  /**
   * Get recommended cursor style for element
   */
  public getCursorStyle(interactive = false): string {
    if (this.state.isTouch) return 'default';
    if (interactive && this.state.mode === 'mouse') return 'pointer';
    return 'default';
  }

  /**
   * Should element be tappable (larger touch targets)
   */
  public shouldUseTouchTargets(): boolean {
    return this.state.deviceType === 'mobile' || this.state.isTouch;
  }

  /**
   * Get minimum touch target size
   */
  public getMinTouchTargetSize(): number {
    // iOS HIG: 44x44pt minimum
    // Material Design: 48x48dp minimum
    return this.state.isIPhone ? 44 : 48;
  }

  /**
   * Should prevent default touch behavior
   */
  public shouldPreventDefault(element: Element): boolean {
    // Allow scrolling on main containers
    if (element.hasAttribute('data-scroll-container')) return false;

    // Prevent default on interactive elements to avoid double-tap zoom
    return this.state.isTouch && (
      element.tagName === 'BUTTON' ||
      element.tagName === 'A' ||
      element.getAttribute('role') === 'button'
    );
  }

  /**
   * Create event handlers that work for both mouse and touch
   */
  public createUniversalHandlers(handlers: {
    onStart?: (e: MouseEvent | TouchEvent) => void;
    onMove?: (e: MouseEvent | TouchEvent) => void;
    onEnd?: (e: MouseEvent | TouchEvent) => void;
    onClick?: (e: MouseEvent | TouchEvent) => void;
  }) {
    const getPoint = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      if ('clientX' in e) {
        return { x: e.clientX, y: e.clientY };
      }
      return { x: 0, y: 0 };
    };

    return {
      // Start handlers
      onMouseDown: (e: MouseEvent) => {
        if (this.shouldUseMouse() && handlers.onStart) {
          handlers.onStart(e);
        }
      },
      onTouchStart: (e: TouchEvent) => {
        if (this.shouldUseTouch() && handlers.onStart) {
          handlers.onStart(e);
        }
      },

      // Move handlers
      onMouseMove: (e: MouseEvent) => {
        if (this.shouldUseMouse() && handlers.onMove) {
          handlers.onMove(e);
        }
      },
      onTouchMove: (e: TouchEvent) => {
        if (this.shouldUseTouch() && handlers.onMove) {
          handlers.onMove(e);
        }
      },

      // End handlers
      onMouseUp: (e: MouseEvent) => {
        if (this.shouldUseMouse() && handlers.onEnd) {
          handlers.onEnd(e);
        }
      },
      onTouchEnd: (e: TouchEvent) => {
        if (this.shouldUseTouch() && handlers.onEnd) {
          handlers.onEnd(e);
        }
      },

      // Click handler
      onClick: (e: MouseEvent | TouchEvent) => {
        if (handlers.onClick) {
          handlers.onClick(e);
        }
      },

      // Utility
      getPoint,
    };
  }

  /**
   * Create passive event options
   */
  public getPassiveOptions(passive = true): AddEventListenerOptions {
    return {
      passive,
      capture: false,
    };
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.touchTimeout) {
      clearTimeout(this.touchTimeout);
    }
    this.listeners.clear();
    this.initialized = false;
  }
}

// Singleton instance
export const inputManager = new InputManager();

// Auto-initialize on import (client-side only)
if (typeof window !== 'undefined') {
  // Delay initialization to ensure DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => inputManager.initialize());
  } else {
    inputManager.initialize();
  }
}
