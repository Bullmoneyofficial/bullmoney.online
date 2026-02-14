// ============================================================================
// UNTYPED THIRD-PARTY MODULES
// ============================================================================

declare module "@pqina/flip";
declare module "matter-js";

// ============================================================================
// GLOBAL TYPE AUGMENTATIONS
// ============================================================================

// Spline Viewer Web Component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'spline-viewer': any;
    }
  }
}

// --- Window interface extensions ---
interface Window {
  /** V8 garbage collection (available when Chrome is launched with --expose-gc) */
  gc?: () => void;

  /** iOS Safari memory warning callback */
  onmemorywarning?: (() => void) | null;

  /** Legacy touch detection (deprecated, older browsers) */
  DocumentTouch?: typeof DocumentTouch;
}

// Legacy touch detection class (deprecated)
declare class DocumentTouch {}

// --- Navigator interface extensions ---
interface NetworkInformation extends EventTarget {
  readonly downlink: number;
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  readonly rtt: number;
  readonly saveData: boolean;
  readonly type?: string;
  onchange: EventListener | null;
}

interface Navigator {
  /** Network Information API (Chromium) */
  readonly connection?: NetworkInformation;
  /** @deprecated Firefox variant */
  readonly mozConnection?: NetworkInformation;
  /** @deprecated WebKit variant */
  readonly webkitConnection?: NetworkInformation;

  /** Device Memory API — approximate RAM in GB (Chromium) */
  readonly deviceMemory?: number;

  /** Battery Status API */
  getBattery?: () => Promise<BatteryManager>;

  /** iOS Safari — true when running as a PWA added to home screen */
  readonly standalone?: boolean;
}

interface BatteryManager extends EventTarget {
  readonly charging: boolean;
  readonly chargingTime: number;
  readonly dischargingTime: number;
  readonly level: number;
  onchargingchange: EventListener | null;
  onchargingtimechange: EventListener | null;
  ondischargingtimechange: EventListener | null;
  onlevelchange: EventListener | null;
}

// --- Performance interface extensions (Chrome-specific) ---
interface PerformanceMemory {
  readonly jsHeapSizeLimit: number;
  readonly totalJSHeapSize: number;
  readonly usedJSHeapSize: number;
}

interface Performance {
  /** Chrome-only: JS heap memory statistics */
  readonly memory?: PerformanceMemory;
}

// --- Screen interface extensions ---
interface Screen {
  /** Non-standard: display refresh rate (some Chromium builds) */
  readonly refreshRate?: number;
}
