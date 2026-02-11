// Auto-extracted from UltimateHub for modular structure
export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TelegramPost {
  id: string;
  text: string;
  date: string;
  views?: string;
  hasMedia: boolean;
}

// Real Device Data Types
export interface MemoryStats {
  jsHeapUsed: number;
  jsHeapLimit: number;
  deviceRam: number;
  browserAllocated: number;
  percentage: number;
  external: number;
  updateTime: number;
}

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  locale: string;
  onLine: boolean;
  cores: number;
  deviceMemory: number;
  connection: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
}

export interface StorageStats {
  total: number;
  available: number;
  used: number;
  percentage: number;
  type: string;
  cache: number;
  quota: number;
  loading: boolean;
}

export interface CacheStats {
  usage: number;
  quota: number;
  percentage: number;
  updateTime: number;
}

export interface NetworkStats {
  latency: number;
  downloadSpeed: number;
  uploadSpeed: number;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  isOnline: boolean;
  connectionType: string;
  testing: boolean;
  lastTest: number;
}

export interface PerformanceStats {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  jsExecutionTime: number;
}

// GPU Info from WebGL
export interface GpuInfo {
  vendor: string;
  renderer: string;
  tier: 'ultra' | 'high' | 'medium' | 'low';
  score: number;
  webglVersion: string;
  maxTextureSize: number;
  maxViewportDims: number[];
}

// Battery Info from Battery API
export interface BatteryInfo {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  supported: boolean;
}

// Screen Info
export interface ScreenInfo {
  width: number;
  height: number;
  pixelRatio: number;
  refreshRate: number;
  colorDepth: number;
  orientation: string;
  touchPoints: number;
  hdr: boolean;
}

export interface HubContextType {
  // FPS State
  currentFps: number;
  deviceTier: string;
  shimmerEnabled: boolean;
  setShimmerEnabled: (v: boolean) => void;
  
  // UI State
  activeModal: ModalType | null;
  setActiveModal: (m: ModalType | null) => void;
  isMinimized: boolean;
  setIsMinimized: (v: boolean) => void;
  
  // User State
  isAdmin: boolean;
  isVip: boolean;
  userId?: string;
  userEmail?: string;
}

export type ModalType = 
  | 'trading' 
  | 'community' 
  | 'bullmoneyTV' 
  | 'theme' 
  | 'contact' 
  | 'services' 
  | 'admin'
  | 'browser'
  | 'devicePanel';

export type ChannelKey = 'trades' | 'main' | 'shop' | 'vip' | 'vip2';
export type DevicePanelTab = 'overview' | 'network' | 'performance' | 'account';

// Calendar filter types
export type CalendarImpact = 'all' | 'high' | 'medium' | 'low';
export type CalendarCountry = 'all' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'NZD';

export type UnifiedHubTab =
  | 'community'
  | 'trading'
  | 'indicators'
  | 'news'
  | 'device'
  | 'logs'
  | 'journal'
  | 'course'
  | 'broker'
  | 'livestream'
  | 'analysis'
  | 'posts';
