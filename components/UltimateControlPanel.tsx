"use client";

/**
 * Ultimate Control Panel - Complete Device Information Center
 *
 * Features:
 * - Comprehensive device stats
 * - Real-time network monitoring
 * - Live FPS and performance metrics
 * - User account info
 * - 3D performance calculator
 * - Smooth animations
 * - Beautiful aesthetics
 * - Theme-aware styling via GlobalThemeProvider
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { trackEvent, trackClick } from '@/lib/analytics';
import { useUIState as useUIStateContext } from '@/contexts/UIStateContext';
import {
  Activity,
  Wifi,
  Cpu,
  HardDrive,
  Monitor,
  Battery,
  MapPin,
  User,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Smartphone,
  Zap,
  TrendingUp,
  Globe,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  Send,
  Settings,
  Edit2,
  Fingerprint,
  Clock,
  Database
} from 'lucide-react';
import { deviceMonitor, type DeviceInfo } from '@/lib/deviceMonitor';
import { queueManager } from '@/lib/splineQueueManager';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useGlobalTheme } from '@/contexts/GlobalThemeProvider';
import { ShimmerLine, ShimmerBorder } from '@/components/ui/UnifiedShimmer';
import { useComponentLifecycle, useUnifiedPerformance } from '@/lib/UnifiedPerformanceSystem';
import { useComponentTracking } from '@/lib/CrashTracker';
import { useFpsOptimizer } from '@/lib/FpsOptimizer';
import CompactFpsDisplay from '@/components/CompactFpsDisplay';
import CrashTrackerDisplay from '@/components/CrashTrackerDisplay';
import { useRealTimeMemory } from '@/hooks/useRealTimeMemory';
import { useBrowserInfo } from '@/hooks/useBrowserInfo';
import { useStorageInfo } from '@/hooks/useStorageInfo';
import { useRealTimeCache } from '@/hooks/useRealTimeCache';

// --- IMPORT NAVBAR CSS FOR CONSISTENT THEMING ---
import './navbar.css';

// ============================================================================
// TYPES
// ============================================================================

interface UltimateControlPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
  userName?: string;
  accentColor?: string;
  // Action button props
  onServicesClick?: () => void;
  onContactClick?: () => void;
  onThemeClick?: () => void;
  onAdminClick?: () => void;
  onIdentityClick?: () => void;
  isAdmin?: boolean;
  isAuthenticated?: boolean;
  showServicesButton?: boolean;
  showContactButton?: boolean;
  showThemeButton?: boolean;
  showAdminButton?: boolean;
  showIdentityButton?: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate 3D performance score (0-100)
 */
function calculate3DPerformance(info: DeviceInfo): number {
  let score = 0;

  // GPU tier (40 points)
  const gpuScore = info.performance.gpu.score ?? (info.performance.gpu.tier === 'high' ? 90 : info.performance.gpu.tier === 'medium' ? 65 : 35);
  score += Math.min(40, Math.round((gpuScore / 100) * 40));

  // FPS (30 points)
  const fps = info.live.fps;
  if (fps >= 60) score += 30;
  else if (fps >= 45) score += 20;
  else if (fps >= 30) score += 10;
  else score += 5;

  // Memory (20 points)
  const memUsage = info.performance.memory.percentage;
  if (memUsage < 50) score += 20;
  else if (memUsage < 70) score += 15;
  else if (memUsage < 85) score += 10;
  else score += 5;

  // CPU cores (10 points)
  const cores = info.performance.cpu.cores;
  if (cores >= 8) score += 10;
  else if (cores >= 4) score += 7;
  else score += 3;

  return Math.min(100, score);
}

/**
 * Get performance grade
 */
function getPerformanceGrade(score: number): { grade: string; color: string; label: string } {
  if (score >= 90) return { grade: 'S', color: '#22c55e', label: 'Excellent' };
  if (score >= 80) return { grade: 'A', color: '#3b82f6', label: 'Great' };
  if (score >= 70) return { grade: 'B', color: '#a855f7', label: 'Good' };
  if (score >= 60) return { grade: 'C', color: '#f59e0b', label: 'Fair' };
  if (score >= 50) return { grade: 'D', color: '#ef4444', label: 'Poor' };
  return { grade: 'F', color: '#dc2626', label: 'Critical' };
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Stat Card Component - Glass & Shimmer UI
 */
function StatCard({ icon: Icon, label, value, sublabel, color = '#3b82f6' }: {
  icon: any;
  label: string;
  value: string;
  sublabel?: string;
  color?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative p-3 rounded-xl overflow-hidden group isolate"
    >
      {/* Glass background - solid with subtle transparency, no blur */}
      <div className="absolute inset-0 bg-slate-900/90 border border-blue-400/30 rounded-xl transition-all duration-300 group-hover:border-blue-300/50 shadow-lg shadow-blue-900/20" />
      
      {/* Inner highlight for depth */}
      <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none" />
      
      {/* Unified Shimmer - LEFT TO RIGHT on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden rounded-xl"
      >
        <div className="shimmer-line shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-blue-500/0 via-blue-400/30 to-blue-500/0" />
      </div>
      
      {/* Accent glow */}
      <div 
        className="absolute inset-0 opacity-20 rounded-xl transition-opacity group-hover:opacity-35 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${color}40 0%, transparent 60%)` }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex items-start gap-3">
        <div
          className="p-2 rounded-lg border border-white/10"
          style={{ backgroundColor: `${color}25` }}
        >
          <Icon size={18} style={{ color, filter: `drop-shadow(0 0 3px ${color}60)` }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-blue-200/90 uppercase tracking-wider font-semibold">
            {label}
          </div>
          <div className="text-sm font-bold text-white truncate mt-0.5">
            {value}
          </div>
          {sublabel && (
            <div className="text-[10px] text-blue-200/70 mt-0.5">
              {sublabel}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Performance Ring Component - Glass & Shimmer UI
 */
function PerformanceRing({ score, size = 120 }: { score: number; size?: number }) {
  const { grade, color, label } = getPerformanceGrade(score);
  const padding = 8;
  const strokeWidth = 8;
  const radius = (size - padding * 2 - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative group isolate" style={{ width: size, height: size }}>
      {/* Glass background - solid, no blur */}
      <div className="absolute inset-0 rounded-full bg-slate-900/90 border border-blue-400/30 transition-all duration-300 group-hover:border-blue-300/50 shadow-lg shadow-blue-900/20" />
      <div className="absolute inset-[1px] rounded-full bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none" />
      
      {/* Unified Shimmer - LEFT TO RIGHT using CSS animation */}
      <div 
        className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none overflow-hidden rounded-full panel-shimmer"
      >
        <div className="shimmer-ltr shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-blue-600/0 via-blue-500/30 to-blue-600/0" style={{ animationDuration: '5s' }} />
      </div>
      
      {/* SVG Ring - properly centered */}
      <svg 
        className="absolute inset-0 -rotate-90 z-10" 
        width={size} 
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(59,130,246,0.15)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s ease, stroke 0.3s ease',
            filter: `drop-shadow(0 0 6px ${color}80)`
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <div
          className="text-4xl font-black"
          style={{ color, textShadow: `0 0 15px ${color}50` }}
        >
          {grade}
        </div>
        <div className="text-xs text-blue-200/80 font-semibold">
          {label}
        </div>
        <div className="text-[10px] text-blue-300/60 mt-1">
          {score}/100
        </div>
      </div>
    </div>
  );
}

/**
 * FPS Display wrapper using FpsOptimizer hook
 */
function FpsDisplayWithOptimizer() {
  const {
    currentFps,
    deviceTier,
    shimmerQuality,
    splineQuality,
    enable3D,
  } = useFpsOptimizer();

  return (
    <CompactFpsDisplay
      fps={currentFps}
      deviceTier={deviceTier}
      shimmerQuality={shimmerQuality}
      splineQuality={splineQuality}
      enable3D={enable3D}
    />
  );
}

/**
 * Minimized FPS Number - Trading Ticker Style
 * Fast, smooth digit-by-digit rolling animation like stock tickers
 */
function MinimizedFpsNumber() {
  const { currentFps } = useFpsOptimizer();
  const prevFpsRef = useRef(currentFps);
  const [direction, setDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  
  // Track direction for visual indicator
  useEffect(() => {
    if (currentFps > prevFpsRef.current) {
      setDirection('up');
    } else if (currentFps < prevFpsRef.current) {
      setDirection('down');
    }
    prevFpsRef.current = currentFps;
    
    // Reset direction indicator after flash
    const timer = setTimeout(() => setDirection('neutral'), 300);
    return () => clearTimeout(timer);
  }, [currentFps]);

  // Color based on FPS performance
  const getColors = (fps: number) => {
    if (fps >= 58) return { text: '#34d399', glow: 'rgba(52, 211, 153, 0.9)', bg: 'rgba(52, 211, 153, 0.15)' };
    if (fps >= 50) return { text: '#60a5fa', glow: 'rgba(96, 165, 250, 0.9)', bg: 'rgba(96, 165, 250, 0.15)' };
    if (fps >= 40) return { text: '#fbbf24', glow: 'rgba(251, 191, 36, 0.8)', bg: 'rgba(251, 191, 36, 0.15)' };
    if (fps >= 30) return { text: '#fb923c', glow: 'rgba(251, 146, 60, 0.8)', bg: 'rgba(251, 146, 60, 0.15)' };
    return { text: '#f87171', glow: 'rgba(248, 113, 113, 0.8)', bg: 'rgba(248, 113, 113, 0.15)' };
  };

  const colors = getColors(currentFps);
  const digits = String(currentFps).padStart(2, '0').split('');

  return (
    <div className="flex items-center gap-0.5">
      {/* Direction indicator - trading style */}
      <motion.div
        initial={false}
        animate={{
          opacity: direction !== 'neutral' ? 1 : 0.4,
          scale: direction !== 'neutral' ? [1, 1.3, 1] : 1,
          y: direction === 'up' ? -1 : direction === 'down' ? 1 : 0,
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="text-[8px] font-bold"
        style={{ color: direction === 'up' ? '#34d399' : direction === 'down' ? '#f87171' : colors.text }}
      >
        {direction === 'up' ? '▲' : direction === 'down' ? '▼' : '●'}
      </motion.div>
      
      {/* Digit container with ticker-style animation */}
      <div className="flex overflow-hidden rounded" style={{ background: colors.bg }}>
        {digits.map((digit, idx) => (
          <div key={idx} className="relative w-[10px] h-[16px] overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={`${idx}-${digit}`}
                initial={{ y: direction === 'down' ? -16 : 16, opacity: 0, filter: 'blur(2px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                exit={{ y: direction === 'down' ? 16 : -16, opacity: 0, filter: 'blur(2px)' }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 700, 
                  damping: 30,
                  mass: 0.5,
                }}
                className="absolute inset-0 flex items-center justify-center text-[13px] font-black tabular-nums"
                style={{ 
                  color: colors.text,
                  textShadow: `0 0 8px ${colors.glow}, 0 0 16px ${colors.glow}`,
                }}
              >
                {digit}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>
      
      {/* FPS label with pulse on change */}
      <motion.span 
        animate={{ 
          opacity: direction !== 'neutral' ? [0.6, 1, 0.8] : 0.8,
          scale: direction !== 'neutral' ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: 0.2 }}
        className="text-[7px] text-blue-400/90 font-bold uppercase tracking-wider ml-0.5"
      >
        fps
      </motion.span>
    </div>
  );
}

/**
 * FPS Performance Panel - Detailed metrics from FpsOptimizer
 */
function FpsPerformancePanel({ deviceInfo }: { deviceInfo: DeviceInfo | null }) {
  const {
    currentFps,
    averageFps,
    deviceTier,
    shimmerQuality,
    splineQuality,
    enable3D,
    targetFrameRate,
  } = useFpsOptimizer();

  const getColorClass = (fpsValue: number) => {
    if (fpsValue >= 58) return 'text-green-300';
    if (fpsValue >= 50) return 'text-lime-300';
    if (fpsValue >= 40) return 'text-yellow-300';
    if (fpsValue >= 30) return 'text-orange-300';
    return 'text-red-300';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'ultra':
        return 'bg-purple-500/20 border-purple-400/40 text-purple-300';
      case 'high':
        return 'bg-green-500/20 border-green-400/40 text-green-300';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300';
      case 'low':
        return 'bg-orange-500/20 border-orange-400/40 text-orange-300';
      case 'minimal':
        return 'bg-red-500/20 border-red-400/40 text-red-300';
      default:
        return 'bg-gray-500/20 border-gray-400/40 text-gray-300';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high':
      case 'ultra':
        return 'text-green-300';
      case 'medium':
        return 'text-yellow-300';
      case 'low':
        return 'text-orange-300';
      case 'disabled':
        return 'text-red-300';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Main FPS Card */}
      <div className="relative p-4 rounded-xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/40 via-slate-900/50 to-blue-900/40 border border-green-400/40 rounded-xl transition-all duration-300 group-hover:border-green-300/60 shadow-lg shadow-green-500/10" />
        <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
          <motion.div 
            animate={{ x: ['0%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-green-500/0 via-green-400/40 to-green-500/0 opacity-100"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-200/60">Current FPS</div>
              <div className={`text-4xl font-black drop-shadow-lg ${getColorClass(currentFps)}`}>
                {currentFps}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-200/60">Target</div>
              <div className="text-xl font-bold text-blue-300">{targetFrameRate}fps</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-sm border-t border-green-400/20 pt-3">
            <div>
              <span className="text-blue-200/60">Average:</span>
              <span className={`ml-2 font-semibold drop-shadow-lg ${getColorClass(averageFps)}`}>{averageFps}fps</span>
            </div>
            <div>
              <span className="text-blue-200/60">Frame Time:</span>
              <span className={`ml-2 font-semibold drop-shadow-lg ${(deviceInfo?.live?.frameTime ?? 0) > (1000 / targetFrameRate) * 1.1 ? 'text-orange-300' : 'text-green-300'}`}>
                {(deviceInfo?.live?.frameTime ?? 0).toFixed(2)}ms
              </span>
            </div>
            <div>
              <span className="text-blue-200/60">Target Frame:</span>
              <span className="ml-2 font-semibold text-blue-300 drop-shadow-lg">{(1000 / targetFrameRate).toFixed(2)}ms</span>
            </div>
            <div>
              <span className="text-blue-200/60">Status:</span>
              <span className={`ml-2 font-semibold drop-shadow-lg ${currentFps >= targetFrameRate * 0.95 ? 'text-green-300' : 'text-yellow-300'}`}>
                {currentFps >= targetFrameRate * 0.95 ? '✓ Good' : '⚠ Low'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Device Tier & Quality Settings */}
      <div className="relative p-4 rounded-xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-slate-900/50 to-purple-900/40 border border-blue-400/40 rounded-xl transition-all duration-300 group-hover:border-blue-300/60 shadow-lg shadow-blue-500/10" />
        <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
          <motion.div 
            animate={{ x: ['0%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-blue-500/0 via-blue-400/40 to-blue-500/0 opacity-100"
          />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="text-sm text-blue-200/60 mb-3">Performance Configuration</div>
          
          {/* Device Tier Badge */}
          <div className="flex items-center justify-between">
            <span className="text-blue-200/70">Device Tier</span>
            <span className={`px-3 py-1 rounded-lg border font-semibold text-sm ${getTierColor(deviceTier)} capitalize drop-shadow-lg`}>
              {deviceTier}
            </span>
          </div>

          {/* Quality Settings */}
          <div className="space-y-2 border-t border-blue-400/20 pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="text-blue-200/70">Shimmer Quality</span>
              </span>
              <span className={`font-semibold drop-shadow-lg ${getQualityColor(shimmerQuality)} capitalize`}>
                {shimmerQuality}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="text-blue-200/70">3D/Spline Quality</span>
              </span>
              <span className={`font-semibold drop-shadow-lg ${getQualityColor(splineQuality)} capitalize`}>
                {splineQuality}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="text-blue-200/70">3D Effects</span>
              </span>
              <span className={`font-semibold drop-shadow-lg ${enable3D ? 'text-green-300' : 'text-gray-400'}`}>
                {enable3D ? '✓ Enabled' : '✗ Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UltimateControlPanel({
  isOpen,
  onOpenChange,
  userEmail,
  userName,
  accentColor: propAccentColor,
  onServicesClick,
  onContactClick,
  onThemeClick,
  onAdminClick,
  onIdentityClick,
  isAdmin = false,
  isAuthenticated = false,
  showServicesButton = true,
  showContactButton = true,
  showThemeButton = true,
  showAdminButton = true,
  showIdentityButton = true,
}: UltimateControlPanelProps) {
  // Use global theme context for accent color and theme filter (matches navbar)
  const { accentColor: themeAccentColor, activeTheme } = useGlobalTheme();
  const accentColor = propAccentColor || themeAccentColor || '#3b82f6';
  
  // Get CSS filter for current theme - matches navbar exactly
  const themeFilter = activeTheme?.mobileFilter || 'none';
  
  // Use unified performance system for lifecycle & shimmer optimization
  const perf = useComponentLifecycle('ultimatePanel', 6);
  const { setComponentVisibility } = useUnifiedPerformance();
  const shimmerEnabled = perf.shimmerEnabled;
  const shimmerSettings = perf.shimmerSettings;
  
  // Real-time memory and browser info hooks
  const memoryStats = useRealTimeMemory();
  const browserInfo = useBrowserInfo();
  const storageInfo = useStorageInfo();
  const cacheStats = useRealTimeCache();
  
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'performance' | 'account'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSpeedTesting, setIsSpeedTesting] = useState(false);
  const [speedTestResult, setSpeedTestResult] = useState<{ downMbps: number; upMbps: number; latency: number; jitter: number; timestamp: number } | null>(null);
  const [showSensitive, setShowSensitive] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [dragProgress, setDragProgress] = useState(0);
  const sessionStartRef = useRef<number>(Date.now());
  const [sessionDuration, setSessionDuration] = useState('0m');
  const [mounted, setMounted] = useState(false);
  // Mobile tap expansion state - shows action buttons on tap like desktop hover
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  
  // Smart tapping state - tracks which modal is currently open
  // 1 tap = open modal, 2nd tap = close modal (toggle behavior)
  const [activeModal, setActiveModal] = useState<'services' | 'contact' | 'theme' | 'admin' | 'identity' | null>(null);

  // Scroll detection for FPS button minimization
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);
  
  // Mobile pull tab state - for panel minimize/maximize like MainWidget
  const [isMobilePanelMinimized, setIsMobilePanelMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Get UI state context for detecting when modals/panels are open
  // This hook is always called unconditionally - we handle missing context via default values
  const uiStateContext = useUIStateContext();
  
  // Check if Discord modal is open - if so, hide the ultimate panel
  const isDiscordModalOpen = useMemo(() => {
    if (!uiStateContext) return false;
    return uiStateContext.isDiscordStageModalOpen;
  }, [uiStateContext?.isDiscordStageModalOpen]);
  
  // Determine if FPS button should be minimized based on UI state
  const shouldMinimizeFromUI = useMemo(() => {
    if (!uiStateContext) return false;
    return uiStateContext.isAnyModalOpen || uiStateContext.isMobileMenuOpen;
  }, [uiStateContext?.isAnyModalOpen, uiStateContext?.isMobileMenuOpen]);

  // Combined minimized state - scroll OR UI triggered
  const effectiveMinimized = isMinimized || shouldMinimizeFromUI;

  // Should the entire panel be hidden (Discord modal open)?
  const shouldHidePanel = isDiscordModalOpen;

  // Ensure component only renders on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || !window.matchMedia('(hover: hover)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Note: Component lifecycle is managed by useComponentLifecycle hook above
  
  // Update visibility state when panel opens/closes
  useEffect(() => {
    setComponentVisibility('ultimatePanel', isOpen);
  }, [isOpen, setComponentVisibility]);

  // Update device info periodically
  useEffect(() => {
    // Upgrade to full device info only when this panel is mounted (avoids heavy work during normal page loads).
    void deviceMonitor.start('full', { includeGeoIp: true, geoIpTimeoutMs: 1200 });

    const updateInfo = () => {
      const info = deviceMonitor.getInfo();
      setDeviceInfo(info);
    };

    updateInfo();
    const interval = setInterval(updateInfo, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const formatDuration = (ms: number) => {
      const totalSeconds = Math.max(0, Math.floor(ms / 1000));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      if (hours > 0) return `${hours}h ${minutes}m`;
      if (minutes > 0) return `${minutes}m ${seconds}s`;
      return `${seconds}s`;
    };

    const timer = setInterval(() => {
      setSessionDuration(formatDuration(Date.now() - sessionStartRef.current));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  const handleSpeedTest = async () => {
    setIsSpeedTesting(true);
    try {
      const result = await deviceMonitor.runSpeedTest({ quick: true });
      setSpeedTestResult(result);
    } catch (error) {
      console.warn('[UltimateControlPanel] Speed test failed', error);
    } finally {
      setIsSpeedTesting(false);
    }
  };

  // Handle drag for right-side swipeable FPS button
  const swipeSoundPlayedRef = useRef(false);
  
  const handleSwipeableDrag = (_: any, info: PanInfo) => {
    // Only track leftward drag (negative x)
    const progress = Math.max(0, Math.min(1, Math.abs(Math.min(0, info.offset.x)) / 100));
    setDragProgress(progress);
    
    // Play swoosh sound when user starts swiping with enough progress
    if (progress > 0.2 && !swipeSoundPlayedRef.current) {
      SoundEffects.swoosh();
      swipeSoundPlayedRef.current = true;
    }
  };

  const handleSwipeableDragEnd = (_: any, info: PanInfo) => {
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    // Reset the sound played flag for next swipe
    swipeSoundPlayedRef.current = false;

    // Open on swipe LEFT (negative offset for right-positioned button)
    // Swipe should open panel directly without needing tap first
    if (offset < -50 || (offset < -30 && velocity < -100)) {
      SoundEffects.swipe(); // Play swipe sound on successful open
      onOpenChange(true);
      setIsMobileExpanded(false); // Reset mobile expanded state when panel opens
    }

    setDragProgress(0);
  };

  // Handle drag for panel (slides from right, swipe right to close)
  const panelSwipeSoundPlayedRef = useRef(false);
  
  const handlePanelDrag = (_: any, info: PanInfo) => {
    // Only track rightward drag (positive x)
    const progress = Math.max(0, Math.min(1, Math.max(0, info.offset.x) / 200));
    setDragProgress(progress);
    
    // Play swoosh sound when user starts swiping to close with enough progress
    if (progress > 0.15 && !panelSwipeSoundPlayedRef.current) {
      SoundEffects.swoosh();
      panelSwipeSoundPlayedRef.current = true;
    }
  };

  const handlePanelDragEnd = (_: any, info: PanInfo) => {
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    // Reset the sound played flag for next swipe
    panelSwipeSoundPlayedRef.current = false;

    // Close on swipe RIGHT (positive offset for right-positioned panel)
    // Increased threshold to prevent accidental closes
    if (offset > 120 || (offset > 80 && velocity > 200)) {
      SoundEffects.swipe(); // Play swipe sound when closing completes
      onOpenChange(false);
    }

    setDragProgress(0);
  };

  // Reset active modal when user presses Escape - must be before early return
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, []);

  // Scroll detection for auto-minimizing FPS button
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);
      
      // Only trigger minimization on significant scroll
      if (scrollDelta > 10) {
        setIsScrolling(true);
        setIsMinimized(true);
        lastScrollY.current = currentScrollY;
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Set timeout to expand back after scroll stops
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
          // Only un-minimize if not triggered by UI state
          if (!shouldMinimizeFromUI) {
            setIsMinimized(false);
          }
        }, 1500); // Expand back 1.5s after scroll stops
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [shouldMinimizeFromUI]);

  // Auto-minimize when UI state changes
  useEffect(() => {
    if (shouldMinimizeFromUI) {
      setIsMinimized(true);
    } else if (!isScrolling) {
      // Only expand if not currently scrolling
      setIsMinimized(false);
    }
  }, [shouldMinimizeFromUI, isScrolling]);

  // Sync services modal state from UIStateContext
  useEffect(() => {
    if (!uiStateContext) return;
    if (uiStateContext.isServicesModalOpen) {
      setActiveModal('services');
    } else if (activeModal === 'services') {
      setActiveModal(null);
    }
  }, [uiStateContext?.isServicesModalOpen, activeModal, uiStateContext]);

  const hasDeviceInfo = !!deviceInfo && mounted;
  // Provide a safe non-null device object for rendering while deviceInfo is still loading.
  const device: DeviceInfo = deviceInfo ?? {
    device: { model: 'Unknown', manufacturer: 'Unknown', os: 'Unknown', osVersion: '', browser: '', browserVersion: '' },
    performance: {
      gpu: { tier: 'medium', score: 50, vendor: '', renderer: '', vram: 0 },
      cpu: { name: '', cores: 4, threads: 4, architecture: '' },
      memory: { percentage: 50, total: 8, used: 1024, limit: 2048, type: '' },
      storage: { available: 0, total: 0 }
    } as any,
    screen: { physicalWidth: (typeof window !== 'undefined' ? window.screen.width : 0), physicalHeight: (typeof window !== 'undefined' ? window.screen.height : 0), ppi: 96, diagonal: 0, refreshRate: 60, hdr: false },
    battery: { level: -1, charging: false },
    network: { type: 'unknown', effectiveType: '4g', downlink: 0, measuredDownlink: 0, measuredUpload: 0, saveData: false, rtt: 0, jitter: 0, ip: '', isp: '', location: '', testTimestamp: 0 },
    live: { fps: 60, frameTime: 1000 / 60, networkSpeed: 0, uploadSpeed: 0, latency: 0, jitter: 0 },
    app: { sessionMs: 0, cacheUsageMB: 0, cacheQuotaMB: 0, buildId: '' }
  } as DeviceInfo;

  const performanceScore = hasDeviceInfo ? calculate3DPerformance(device) : 0;
  const queueStats = queueManager.getStats();
  const liveSpeed = hasDeviceInfo ? Math.max(0, device.live.networkSpeed || device.network.measuredDownlink || device.network.downlink || 0) : 0;
  const liveUpload = hasDeviceInfo ? Math.max(0, device.live.uploadSpeed || device.network.measuredUpload || 0) : 0;
  const liveLatency = hasDeviceInfo ? Math.max(0, device.live.latency || device.network.rtt || 0) : 0;
  const liveJitter = hasDeviceInfo ? Math.max(0, device.live.jitter || device.network.jitter || 0) : 0;
  const reportedDownlink = hasDeviceInfo ? (device.network.downlink || 0) : 0;
  const measuredType = hasDeviceInfo ? ((device.network.effectiveType || '4g').toUpperCase()) : '4G';
  const sessionMs = hasDeviceInfo ? (device.app?.sessionMs ?? 0) : 0;
  const cacheUsageMB = hasDeviceInfo ? device.app?.cacheUsageMB : undefined;
  const cacheQuotaMB = hasDeviceInfo ? device.app?.cacheQuotaMB : undefined;

  // Default handlers for buttons - now with smart tapping (toggle behavior)
  const handleServicesClick = () => {
    SoundEffects.click();
    setIsMobileExpanded(false);
    if (activeModal === 'services') {
      // 2nd tap - close
      setActiveModal(null);
      uiStateContext?.setServicesModalOpen?.(false);
    } else {
      // 1st tap - open
      setActiveModal('services');
      trackClick('services_button', { source: 'ultimate_panel' });
      onServicesClick?.();
      uiStateContext?.setServicesModalOpen?.(true);
    }
  };
  const handleContactClick = () => {
    SoundEffects.click();
    setIsMobileExpanded(false);
    if (activeModal === 'contact') {
      setActiveModal(null);
    } else {
      setActiveModal('contact');
      trackClick('contact_button', { source: 'ultimate_panel' });
      onContactClick?.();
    }
  };
  const handleThemeClick = () => {
    SoundEffects.click();
    setIsMobileExpanded(false);
    if (activeModal === 'theme') {
      setActiveModal(null);
    } else {
      setActiveModal('theme');
      trackClick('theme_button', { source: 'ultimate_panel' });
      onThemeClick?.();
    }
  };
  const handleAdminClick = () => {
    SoundEffects.click();
    setIsMobileExpanded(false);
    if (activeModal === 'admin') {
      setActiveModal(null);
    } else {
      setActiveModal('admin');
      trackClick('admin_button', { source: 'ultimate_panel' });
      onAdminClick?.();
    }
  };
  const handleIdentityClick = () => {
    SoundEffects.click();
    setIsMobileExpanded(false);
    if (activeModal === 'identity') {
      setActiveModal(null);
    } else {
      setActiveModal('identity');
      onIdentityClick?.();
    }
  };

  const portalContent = (
    <>
      {/* Expandable FPS Button with Actions (visible when closed) */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.div
            key="fps-action-button"
            initial={{ x: 100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1, 
              scale: effectiveMinimized ? 0.9 : 1,
            }}
            exit={{ x: 80, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 28, 
              stiffness: 450,
              mass: 0.7,
              scale: { type: 'spring', damping: 22, stiffness: 600 },
              top: { type: 'spring', damping: 25, stiffness: 450, mass: 0.6 }
            }}
            className="fixed right-0 z-[250000] pointer-events-none control-panel-themed"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              paddingRight: 'calc(env(safe-area-inset-right, 0px) + 8px)',
              filter: themeFilter,
              transition: 'filter 0.5s ease-in-out'
            }}
          >
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDrag={handleSwipeableDrag}
              onDragEnd={handleSwipeableDragEnd}
              whileHover="hover"
              animate={isMobileExpanded ? "hover" : effectiveMinimized ? "minimized" : "initial"}
              initial="initial"
              className="relative pointer-events-auto group touch-manipulation"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              {/* Unified Shimmer Background - LEFT TO RIGHT only (no component movement) */}
              {shimmerEnabled && !effectiveMinimized && (
                <div className="absolute inset-0 rounded-l-2xl overflow-hidden pointer-events-none panel-shimmer">
                  <div 
                    className="shimmer-line shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%]"
                    style={{
                      background: 'linear-gradient(to right, transparent, rgba(59, 130, 246, 0.4), transparent)',
                      animationDuration: shimmerSettings.speed === 'slow' ? '5s' : '3s',
                    }}
                  />
                </div>
              )}
              
              {/* Main FPS Content - Animated between full and minimized states */}
              <motion.div 
                variants={{
                  initial: { x: 0, scale: 1 },
                  hover: { x: -8, scale: 1.02 },
                  minimized: { x: 2, scale: 0.95 }
                }}
                transition={{ type: 'spring', damping: 28, stiffness: 500, mass: 0.8 }}
                className="relative rounded-l-3xl bg-gradient-to-br from-blue-600/30 via-blue-500/15 to-slate-900/40 backdrop-blur-2xl border-y border-l border-blue-500/50 transition-colors duration-200 hover:border-blue-400/70 shadow-2xl hover:shadow-blue-600/40 hover:shadow-xl"
                whileHover={{ boxShadow: "0 0 40px rgba(59, 130, 246, 0.6), inset 0 0 20px rgba(59, 130, 246, 0.15)" }}
              >
                {/* FPS Display - Animated between full and minimized pill states */}
                <AnimatePresence mode="popLayout" initial={false}>
                  {effectiveMinimized ? (
                    // MINIMIZED PILL STATE - Trading ticker style
                    <motion.div
                      key="minimized-fps"
                      initial={{ opacity: 0, scale: 0.7, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.7, x: 10 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 500, mass: 0.6 }}
                      className="px-2 py-1.5 cursor-pointer flex items-center justify-center touch-manipulation"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        SoundEffects.click();
                        // Clicking minimized button expands it
                        setIsMinimized(false);
                        setIsMobileExpanded(false);
                      }}
                      onMouseEnter={() => {
                        SoundEffects.hover();
                        // Expand on hover (desktop)
                        if (window.matchMedia('(hover: hover)').matches && !shouldMinimizeFromUI) {
                          setIsMinimized(false);
                        }
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        SoundEffects.click();
                        setIsMinimized(false);
                      }}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        userSelect: 'none'
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7],
                          }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity, 
                            ease: 'easeInOut' 
                          }}
                        >
                          <Activity 
                            size={11} 
                            className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.9)]"
                          />
                        </motion.div>
                        <MinimizedFpsNumber />
                      </div>
                    </motion.div>
                  ) : (
                    // FULL STATE - Complete FPS display with candlestick chart
                    <motion.div
                      key="full-fps"
                      initial={{ opacity: 0, scale: 0.85, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.85, x: -10 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 500, mass: 0.6 }}
                      className="px-2 py-2 cursor-pointer min-h-auto flex items-center justify-center touch-manipulation"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        SoundEffects.click();
                        // Desktop: always open panel
                        if (window.matchMedia('(hover: hover)').matches) {
                          onOpenChange(true);
                        } else {
                          // Mobile: first tap expands, second tap opens panel
                          if (isMobileExpanded) {
                            onOpenChange(true);
                            setIsMobileExpanded(false);
                          } else {
                            setIsMobileExpanded(true);
                          }
                        }
                      }}
                      onMouseEnter={() => SoundEffects.hover()}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        SoundEffects.click();
                        // Mobile: first tap expands, second tap opens panel
                        if (isMobileExpanded) {
                          onOpenChange(true);
                          setIsMobileExpanded(false);
                        } else {
                          setIsMobileExpanded(true);
                        }
                      }}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        userSelect: 'none'
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <ChevronRight 
                          size={14} 
                          className={`text-blue-500 group-hover:text-blue-400 transition-colors drop-shadow-[0_0_6px_rgba(59,130,246,0.8)] ${isMobileExpanded ? 'rotate-90' : 'rotate-180'}`}
                        />
                        <FpsDisplayWithOptimizer />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons - Shown on hover or mobile tap */}
                <motion.div
                  variants={{
                    initial: { height: 0, opacity: 0, pointerEvents: 'none' as const },
                    hover: { height: 'auto', opacity: 1, pointerEvents: 'auto' as const }
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-blue-400/25 bg-black/30"
                  style={{ pointerEvents: isMobileExpanded ? 'auto' : undefined }}
                >
                  {/* Services Button */}
                  {showServicesButton && (
                    <button
                      type="button"
                      className={`w-full px-4 py-3 min-h-[48px] cursor-pointer hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors border-b border-blue-400/15 flex items-center touch-manipulation ${activeModal === 'services' ? 'bg-blue-500/25' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleServicesClick();
                      }}
                      onMouseEnter={() => SoundEffects.hover()}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        userSelect: 'none'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className={`${activeModal === 'services' ? 'text-blue-300' : 'text-blue-400'}`} />
                        <span className="text-blue-100 text-xs font-bold drop-shadow-lg">
                          {activeModal === 'services' ? 'Close' : 'Services'}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Contact Button */}
                  {showContactButton && (
                    <button
                      type="button"
                      className={`w-full px-4 py-3 min-h-[48px] cursor-pointer hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors border-b border-blue-400/15 flex items-center touch-manipulation ${activeModal === 'contact' ? 'bg-blue-500/25' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleContactClick();
                      }}
                      onMouseEnter={() => SoundEffects.hover()}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        userSelect: 'none'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Send size={14} className={`${activeModal === 'contact' ? 'text-blue-300' : 'text-blue-400'}`} />
                        <span className="text-blue-100 text-xs font-bold drop-shadow-lg">
                          {activeModal === 'contact' ? 'Close' : 'Contact'}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Theme Button */}
                  {showThemeButton && (
                    <button
                      type="button"
                      className={`w-full px-4 py-3 min-h-[48px] cursor-pointer hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors border-b border-blue-400/15 flex items-center touch-manipulation ${activeModal === 'theme' ? 'bg-blue-500/25' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleThemeClick();
                      }}
                      onMouseEnter={() => SoundEffects.hover()}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        userSelect: 'none'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Settings size={14} className={`${activeModal === 'theme' ? 'text-blue-300' : 'text-blue-400'}`} />
                        <span className="text-blue-100 text-xs font-bold drop-shadow-lg">
                          {activeModal === 'theme' ? 'Close' : 'Theme'}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Admin Button */}
                  {isAdmin && showAdminButton && (
                    <button
                      type="button"
                      className={`w-full px-4 py-3 min-h-[48px] cursor-pointer hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors border-b border-blue-400/15 flex items-center touch-manipulation ${activeModal === 'admin' ? 'bg-blue-500/25' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAdminClick();
                      }}
                      onMouseEnter={() => SoundEffects.hover()}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        userSelect: 'none'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Edit2 size={14} className={`${activeModal === 'admin' ? 'text-blue-300' : 'text-blue-400'}`} />
                        <span className="text-blue-100 text-xs font-bold drop-shadow-lg">
                          {activeModal === 'admin' ? 'Close' : 'Admin'}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* VIP Badge */}
                  {!isAdmin && isAuthenticated && (
                    <div className="px-4 py-3 min-h-[48px] border-b border-blue-400/15 flex items-center bg-blue-500/10">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-blue-400" />
                        <span className="text-blue-100 text-xs font-bold drop-shadow-lg">
                          VIP Member
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Identity Button */}
                  {!isAdmin && !isAuthenticated && showIdentityButton && (
                    <button
                      type="button"
                      className={`w-full px-4 py-3 min-h-[48px] cursor-pointer hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors flex items-center touch-manipulation ${activeModal === 'identity' ? 'bg-blue-500/25' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleIdentityClick();
                      }}
                      onMouseEnter={() => SoundEffects.hover()}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        userSelect: 'none'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Fingerprint size={14} className={`${activeModal === 'identity' ? 'text-blue-300' : 'text-blue-400'}`} />
                        <span className="text-blue-100 text-xs font-bold drop-shadow-lg">
                          {activeModal === 'identity' ? 'Close' : 'Identity'}
                        </span>
                      </div>
                    </button>
                  )}
                </motion.div>

                {/* Drag indicator */}
                {dragProgress > 0 && (
                  <motion.div
                    className="absolute top-0 left-0 bottom-0 w-1 bg-blue-400/50 rounded-r-full"
                    style={{
                      scaleY: dragProgress,
                      transformOrigin: 'center'
                    }}
                  />
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence mode="wait">
        {isOpen && !shouldHidePanel && (
          <React.Fragment key="panel-wrapper">
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onOpenChange(false)}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                onOpenChange(false);
              }}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[249999]"
              style={{ touchAction: 'manipulation' }}
            />

            {/* Panel */}
            <motion.div
              key="panel"
              ref={panelRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDrag={handlePanelDrag}
              onDragEnd={handlePanelDragEnd}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-[250000] w-full max-w-md overflow-hidden bg-black/60 backdrop-blur-3xl border-l border-blue-500/30 shadow-2xl shadow-blue-900/20 control-panel-themed"
              style={{
                paddingRight: 'env(safe-area-inset-right, 0px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
              }}
            >
              {/* Shimmer background effect - using unified CSS shimmer for performance */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div 
                  className="shimmer-spin shimmer-gpu absolute w-full h-full"
                  style={{
                    background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(59,130,246,0.08) 30deg, rgba(59,130,246,0.12) 60deg, rgba(59,130,246,0.08) 90deg, transparent 120deg, transparent 360deg)',
                    animationDuration: '15s'
                  }}
                />
              </div>
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-950/10 via-transparent to-blue-900/5 pointer-events-none" />
              
              {/* Drag handle */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 py-3 px-2 cursor-grab active:cursor-grabbing z-20">
                <div
                  className="h-12 w-1.5 rounded-full bg-blue-400/40"
                  style={{ backgroundColor: `${accentColor}60` }}
                />
                <div className="text-[9px] text-blue-300/40 font-mono tracking-wider [writing-mode:vertical-lr] rotate-180">
                  SWIPE
                </div>
              </div>

              {/* Header */}
              <div className="px-6 pt-6 pb-4 relative z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-100 drop-shadow-lg">
                    Device Center
                  </h2>
                  <div className="flex items-center gap-2">
                    {/* Mobile Minimize Button - Cyberpunk style */}
                    {isMobile && (
                      <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: "rgba(34, 211, 238, 0.15)" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          SoundEffects.swoosh();
                          setIsMobilePanelMinimized(true);
                          onOpenChange(false);
                        }}
                        onMouseEnter={() => SoundEffects.hover()}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          e.currentTarget.style.transform = 'scale(0.9)';
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                          e.currentTarget.style.transform = '';
                          SoundEffects.swoosh();
                          setIsMobilePanelMinimized(true);
                          onOpenChange(false);
                        }}
                        className="relative p-3 rounded-full bg-gradient-to-br from-cyan-900/40 to-slate-900/60 hover:from-cyan-800/50 hover:to-slate-800/70 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation border border-cyan-500/40 shadow-lg shadow-cyan-900/20 overflow-hidden group"
                        style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                        aria-label="Minimize panel"
                      >
                        {/* Animated glow effect */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                        <ChevronDown
                          size={18}
                          className="text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)] relative z-10 group-hover:text-cyan-200"
                        />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 180, backgroundColor: "rgba(59, 130, 246, 0.15)" }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        SoundEffects.click();
                        handleRefresh();
                      }}
                      onMouseEnter={() => SoundEffects.hover()}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.transform = 'scale(0.9)';
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.transform = '';
                        SoundEffects.click();
                      }}
                      className="p-3 rounded-full bg-black/40 hover:bg-blue-500/25 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation border border-blue-500/30 shadow-lg shadow-blue-900/10"
                      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                      disabled={isRefreshing}
                      aria-label="Refresh device info"
                    >
                      <RefreshCw
                        size={18}
                        className={`text-blue-200/70 ${isRefreshing ? 'shimmer-spin' : ''}`}
                        style={isRefreshing ? { animationDuration: '1s' } : undefined}
                      />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(59, 130, 246, 0.15)" }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        SoundEffects.close();
                        onOpenChange(false);
                      }}
                      onMouseEnter={() => SoundEffects.hover()}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.transform = 'scale(0.9)';
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.transform = '';
                        SoundEffects.close();
                      }}
                      className="p-3 rounded-full bg-black/40 hover:bg-blue-500/25 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation border border-blue-500/30 shadow-lg shadow-blue-900/10"
                      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                      aria-label="Close device center"
                    >
                      <ChevronRight size={18} className="text-blue-200/70" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-6 pb-4 relative z-10">
                <div className="relative flex gap-1 p-1.5 rounded-xl bg-gradient-to-r from-blue-950/50 via-slate-900/60 to-blue-950/50 border border-blue-400/40 overflow-hidden isolate shadow-lg">
                  {/* Inner highlight */}
                  <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                  {/* Unified Shimmer for tabs */}
                  {shimmerEnabled && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl panel-shimmer">
                      <div 
                        className="shimmer-line shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%]"
                        style={{
                          background: 'linear-gradient(to right, transparent, rgba(59, 130, 246, 0.2), transparent)',
                          animationDuration: '4s',
                        }}
                      />
                    </div>
                  )}
                  
                  {[
                    { id: 'overview', label: 'Overview', icon: Monitor },
                    { id: 'network', label: 'Network', icon: Wifi },
                    { id: 'performance', label: '3D', icon: Zap },
                    { id: 'account', label: 'Account', icon: User }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        SoundEffects.tab(); // Play tab switch sound
                        setActiveTab(tab.id as any);
                        if (navigator.vibrate) navigator.vibrate(10);
                      }}
                      onMouseEnter={() => SoundEffects.hover()}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.transform = 'scale(0.95)';
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.transform = '';
                        SoundEffects.tab(); // Play tab switch sound
                      }}
                      className={`relative z-10 flex-1 px-3 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation ${
                        activeTab === tab.id
                          ? 'bg-blue-500/25 text-blue-100 border border-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                          : 'text-blue-200/70 hover:text-blue-100 hover:bg-blue-500/15 active:scale-95 border border-transparent'
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                      aria-label={`View ${tab.label}`}
                    >
                      <tab.icon size={14} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div
                className="px-6 overflow-y-auto pb-6"
                style={{
                  height: 'calc(100vh - 180px)',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  touchAction: 'pan-y'
                }}
              >
                <AnimatePresence mode="wait">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      {/* Device Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <StatCard
                          icon={Smartphone}
                            label="Device"
                            value={device.device.model || 'Unknown'}
                            sublabel={device.device.manufacturer || 'Unknown'}
                          color="#3b82f6"
                        />
                        <StatCard
                          icon={Monitor}
                            label="OS"
                            value={device.device.os || 'Unknown'}
                            sublabel={`v${device.device.osVersion || '?'}`}
                          color="#8b5cf6"
                        />
                        <StatCard
                          icon={Cpu}
                            label="CPU"
                            value={device.performance.cpu.name || `${device.performance.cpu.cores || 4} Cores`}
                            sublabel={`${device.performance.cpu.cores || 4}C/${device.performance.cpu.threads || 4}T • ${device.performance.cpu.architecture || 'Unknown'}`}
                          color="#22c55e"
                        />
                        <StatCard
                          icon={HardDrive}
                            label="RAM"
                            value={`${memoryStats.jsHeapUsed}MB / ${memoryStats.jsHeapLimit}MB`}
                            sublabel={`Browser: ${memoryStats.percentage}% • Device: ${device.performance.memory.total || memoryStats.deviceRam}GB (${device.performance.memory.type || 'DDR'})`}
                          color="#f59e0b"
                        />
                      </div>

                      {/* Browser Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <StatCard
                          icon={Globe}
                          label="Browser"
                          value={browserInfo.name}
                          sublabel={`v${browserInfo.version} • ${browserInfo.engine}`}
                          color="#ec4899"
                        />
                        <StatCard
                          icon={Monitor}
                          label="Platform"
                          value={browserInfo.platform}
                          sublabel={`${browserInfo.locale}${browserInfo.onLine ? ' • Online' : ' • Offline'}`}
                          color="#06b6d4"
                        />
                      </div>

                      {/* Storage Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <StatCard
                          icon={Database}
                          label="Storage"
                          value={`${storageInfo?.used || 0}GB / ${storageInfo?.total || 64}GB`}
                          sublabel={`${storageInfo?.percentage || 0}% • ${storageInfo?.type || 'Detecting...'}`}
                          color="#d946ef"
                        />
                        <StatCard
                          icon={HardDrive}
                          label="Cache"
                          value={`${cacheStats?.usage?.toFixed(1) || '0.0'}MB`}
                          sublabel={`${cacheStats?.percentage || 0}% • Quota: ${cacheStats?.quota?.toFixed(1) || '0.0'}MB`}
                          color="#06b6d4"
                        />
                      </div>

                      {/* Session */}
                      <div className="grid grid-cols-1 gap-3">
                        <StatCard
                          icon={Clock}
                          label="Session length"
                          value={`${Math.max(1, Math.floor(sessionMs / 1000 / 60))} min`}
                          sublabel="Current tab"
                          color="#22c55e"
                        />
                      </div>

                      {/* Screen Info */}
                      <div className="relative p-4 rounded-xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-slate-900/50 to-purple-900/40 border border-blue-400/40 rounded-xl transition-all duration-300 group-hover:border-blue-300/60 shadow-lg shadow-blue-500/10" />
                        <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                        {shimmerEnabled && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                            <div 
                              className="shimmer-line shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%]"
                              style={{
                                background: 'linear-gradient(to right, transparent, rgba(59, 130, 246, 0.4), transparent)',
                                animationDuration: '4s',
                              }}
                            />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl" />
                        <div className="relative z-10">
                          <div className="text-xs text-blue-200/80 uppercase tracking-wider font-semibold mb-2">
                            Display
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-blue-200/60">Display:</span>
                              <span className="text-white font-semibold ml-2 drop-shadow-lg">
                                {device.screen.physicalWidth}×{device.screen.physicalHeight}
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-200/60">PPI:</span>
                              <span className="text-white font-semibold ml-2 drop-shadow-lg">
                                {device.screen.ppi || Math.round(device.screen.physicalWidth / 6)} ppi
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-200/60">Screen:</span>
                              <span className="text-white font-semibold ml-2 drop-shadow-lg">
                                {device.screen.diagonal || '?'}&quot; @ {device.screen.refreshRate || 60}Hz
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-200/60">HDR:</span>
                              <span className="text-white font-semibold ml-2 drop-shadow-lg">
                                {device.screen.hdr ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Battery */}
                      {deviceInfo && deviceInfo.battery.level >= 0 && (
                        <div className="relative p-4 rounded-xl overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-950/40 via-slate-900/50 to-blue-900/40 border border-green-400/40 rounded-xl transition-all duration-300 group-hover:border-green-300/60 shadow-lg shadow-green-500/10" />
                          <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                          {shimmerEnabled && (
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                              <div 
                                className="shimmer-line shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%]"
                                style={{
                                  background: 'linear-gradient(to right, transparent, rgba(34, 197, 94, 0.4), transparent)',
                                  animationDuration: '4s',
                                }}
                              />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl" />
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Battery size={18} className="text-green-400 drop-shadow-lg" />
                              <span className="text-white font-semibold drop-shadow-lg">
                                {device.battery.level}%
                              </span>
                            </div>
                            {device.battery.charging && (
                              <div className="text-xs text-green-400 flex items-center gap-1 drop-shadow-lg">
                                <Zap size={12} />
                                Charging
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Network Tab */}
                  {activeTab === 'network' && (
                    <motion.div
                      key="network"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      {/* Live Metrics */}
                      <div className="grid grid-cols-2 gap-3">
                        <StatCard
                          icon={TrendingUp}
                          label="Speed"
                          value={`${liveSpeed.toFixed(2)} Mbps`}
                          sublabel="Measured download"
                          color="#22c55e"
                        />
                        <StatCard
                          icon={Activity}
                          label="Latency"
                          value={`${Math.round(liveLatency)}ms`}
                          sublabel={`Jitter: ${Math.round(liveJitter)}ms`}
                          color="#f59e0b"
                        />
                        <StatCard
                          icon={Zap}
                          label="Upload"
                          value={`${liveUpload.toFixed(2)} Mbps`}
                          sublabel="Measured upload"
                          color="#a855f7"
                        />
                      </div>

                      {/* Connection Type */}
                      <div className="relative p-4 rounded-xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-slate-900/50 to-cyan-900/40 border border-blue-400/40 rounded-xl transition-all duration-300 group-hover:border-blue-300/60 shadow-lg shadow-blue-500/10" />
                        <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                          <motion.div 
                            animate={{ x: ['0%', '200%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-blue-500/0 via-blue-400/40 to-blue-500/0 opacity-100"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl" />
                        <div className="relative z-10 flex items-center gap-3">
                          <Wifi size={24} className="text-blue-400 drop-shadow-lg" />
                          <div className="flex-1">
                            <div className="text-sm text-blue-200/60">Connection</div>
                              <div className="text-lg font-bold text-white drop-shadow-lg">
                              {measuredType}
                            </div>
                            <div className="text-xs text-blue-300/50">
                              {device.network.type}
                            </div>
                          </div>
                          {device.network.saveData && (
                            <div className="px-2 py-1 rounded-md bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-semibold">
                              Data Saver
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="relative p-4 rounded-xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-slate-900/50 to-blue-900/40 border border-blue-400/40 rounded-xl transition-all duration-300 group-hover:border-blue-300/60 shadow-lg shadow-blue-500/10" />
                        <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                          <motion.div 
                            animate={{ x: ['0%', '200%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-blue-500/0 via-blue-400/40 to-blue-500/0 opacity-100"
                          />
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-blue-200/70">Link quality</span>
                            <span className="text-xs text-blue-300/50">
                              Last test: {device.network.testTimestamp ? new Date(device.network.testTimestamp).toLocaleTimeString() : 'Just now'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-blue-200/60">
                              Measured: <span className="text-white font-semibold drop-shadow-lg">{liveSpeed.toFixed(2)} Mbps</span>
                            </div>
                            <div className="text-blue-200/60">
                              Reported: <span className="text-white font-semibold drop-shadow-lg">{reportedDownlink.toFixed(2)} Mbps</span>
                            </div>
                            <div className="text-blue-200/60">
                              Latency: <span className="text-white font-semibold drop-shadow-lg">{Math.round(liveLatency)}ms</span>
                            </div>
                            <div className="text-blue-200/60">
                              Jitter: <span className="text-white font-semibold drop-shadow-lg">{Math.round(liveJitter)}ms</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Manual Speed Test */}
                      <div className="relative p-4 rounded-xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-slate-900/40 to-blue-900/30 border border-emerald-400/30 rounded-xl shadow-lg shadow-emerald-500/10" />
                        <div className="relative z-10 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-emerald-200/70">Speed test</div>
                              <div className="text-xs text-emerald-200/50">Quick download/upload pulse</div>
                            </div>
                            <button
                              onClick={() => { SoundEffects.click(); void handleSpeedTest(); }}
                              onMouseEnter={() => SoundEffects.hover()}
                              disabled={isSpeedTesting}
                              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors disabled:opacity-50"
                            >
                              {isSpeedTesting ? 'Testing…' : 'Run test'}
                            </button>
                          </div>
                          {speedTestResult && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-emerald-100/70">
                                Download: <span className="text-white font-semibold drop-shadow-lg">{speedTestResult.downMbps.toFixed(2)} Mbps</span>
                              </div>
                              <div className="text-emerald-100/70">
                                Upload: <span className="text-white font-semibold drop-shadow-lg">{speedTestResult.upMbps.toFixed(2)} Mbps</span>
                              </div>
                              <div className="text-emerald-100/70">
                                Latency: <span className="text-white font-semibold drop-shadow-lg">{Math.round(speedTestResult.latency)}ms</span>
                              </div>
                              <div className="text-emerald-100/70">
                                Jitter: <span className="text-white font-semibold drop-shadow-lg">{Math.round(speedTestResult.jitter)}ms</span>
                              </div>
                              <div className="text-[11px] text-emerald-100/50 col-span-2">
                                Tested at {new Date(speedTestResult.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      <div className="relative p-4 rounded-xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-slate-900/50 to-pink-900/40 border border-purple-400/40 rounded-xl transition-all duration-300 group-hover:border-purple-300/60 shadow-lg shadow-purple-500/10" />
                        <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                          <motion.div 
                            animate={{ x: ['0%', '200%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-purple-500/0 via-purple-400/40 to-purple-500/0 opacity-100"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl" />
                        <div className="relative z-10 flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin size={18} className="text-purple-400 drop-shadow-lg" />
                              <span className="text-sm text-blue-200/60">Location</span>
                            </div>
                            <div className="text-white font-semibold mb-1 drop-shadow-lg">
                              {showSensitive ? device.network.location : '••••••'}
                            </div>
                            <div className="text-xs text-blue-300/50">
                              IP: {showSensitive ? device.network.ip : '•••.•••.•••.•••'}
                            </div>
                            <div className="text-xs text-blue-300/50">
                              ISP: {device.network.isp}
                            </div>
                            <div className="text-xs text-blue-300/50">
                              Browser: {device.device.browser} {device.device.browserVersion}
                            </div>
                            <div className="text-xs text-blue-300/50">
                              App Build: {device.app?.buildId || 'n/a'}
                            </div>
                          </div>
                          <button
                            onClick={() => { SoundEffects.click(); setShowSensitive(!showSensitive); }}
                            onMouseEnter={() => SoundEffects.hover()}
                            onTouchStart={() => SoundEffects.click()}
                            className="p-2 rounded-lg bg-black/30 border border-blue-500/40 hover:bg-blue-500/15 transition-colors backdrop-blur-sm"
                          >
                            {showSensitive ? (
                              <EyeOff size={16} className="text-blue-200/70" />
                            ) : (
                              <Eye size={16} className="text-blue-200/70" />
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Performance Tab */}
                  {activeTab === 'performance' && (
                    <motion.div
                      key="performance"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      {/* Performance Score */}
                      <div className="flex justify-center py-4">
                        <PerformanceRing score={performanceScore} size={140} />
                      </div>

                      {/* FPS Performance Panel */}
                      <FpsPerformancePanel deviceInfo={device} />

                      {/* GPU */}
                      <StatCard
                        icon={Monitor}
                        label="GPU"
                        value={device.performance.gpu.tier.toUpperCase() + ' Tier'}
                        sublabel={`Score ${Math.round(device.performance.gpu.score ?? 0) || 0}/100 • ${device.performance.gpu.vendor || ''} ${device.performance.gpu.renderer || ''}`}
                        color={
                          device.performance.gpu.tier === 'high' ? '#22c55e' :
                          device.performance.gpu.tier === 'medium' ? '#f59e0b' : '#ef4444'
                        }
                      />

                      <div className="relative p-4 rounded-xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-slate-900/50 to-blue-900/40 border border-blue-400/40 rounded-xl transition-all duration-300 group-hover:border-blue-300/60 shadow-lg shadow-blue-500/10" />
                        <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                          <motion.div 
                            animate={{ x: ['0%', '200%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-blue-500/0 via-blue-400/40 to-blue-500/0 opacity-100"
                          />
                        </div>
                        <div className="relative z-10 text-sm text-blue-200/80 mb-3">Device Snapshot</div>
                        <div className="relative z-10 grid grid-cols-2 gap-2 text-sm">
                          <div className="text-blue-200/60">CPU: <span className="text-white font-semibold drop-shadow-lg">{device.performance.cpu.name || `${device.performance.cpu.cores} cores`}</span></div>
                          <div className="text-blue-200/60">Threads: <span className="text-white font-semibold drop-shadow-lg">{device.performance.cpu.threads}</span></div>
                          <div className="text-blue-200/60">RAM: <span className="text-white font-semibold drop-shadow-lg">{device.performance.memory.total}GB {device.performance.memory.type || ''}</span></div>
                          <div className="text-blue-200/60">VRAM: <span className="text-white font-semibold drop-shadow-lg">{device.performance.gpu.vram ? `${device.performance.gpu.vram}GB` : 'Unknown'}</span></div>
                          <div className="text-blue-200/60">Display: <span className="text-white font-semibold drop-shadow-lg">{device.screen.physicalWidth}×{device.screen.physicalHeight}</span></div>
                          <div className="text-blue-200/60">Refresh: <span className="text-white font-semibold drop-shadow-lg">{device.screen.refreshRate || 60}Hz</span></div>
                          <div className="text-blue-200/60">Storage: <span className="text-white font-semibold drop-shadow-lg">{device.performance.storage ? `${device.performance.storage.available}/${device.performance.storage.total}GB` : 'Unknown'}</span></div>
                          <div className="text-blue-200/60">Battery: <span className="text-white font-semibold drop-shadow-lg">{device.battery.level >= 0 ? `${device.battery.level}%` : 'N/A'}</span></div>
                        </div>
                      </div>

                      {/* Memory */}
                      <div className="relative p-4 rounded-xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-slate-900/50 to-purple-900/40 border border-blue-400/40 rounded-xl transition-all duration-300 group-hover:border-blue-300/60 shadow-lg shadow-blue-500/10" />
                        <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                          <motion.div 
                            animate={{ x: ['0%', '200%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-blue-500/0 via-purple-400/40 to-purple-500/0 opacity-100"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl" />
                        <div className="relative z-10 flex items-center justify-between mb-3">
                          <span className="text-sm text-blue-200/60">Memory Usage</span>
                          <span className="text-sm font-semibold text-white drop-shadow-lg">
                            {device.performance.memory.percentage}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${device.performance.memory.percentage}%` }}
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          />
                        </div>
                        <div className="text-xs text-blue-200/50 mt-2">
                          {device.performance.memory.used}MB / {device.performance.memory.limit}MB
                        </div>
                      </div>

                      {/* Queue Stats */}
                      <div className="relative p-4 rounded-xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/40 via-slate-900/50 to-red-900/40 border border-orange-400/40 rounded-xl transition-all duration-300 group-hover:border-orange-300/60 shadow-lg shadow-orange-500/10" />
                        <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                          <motion.div 
                            animate={{ x: ['0%', '200%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-orange-500/0 via-orange-400/40 to-orange-500/0 opacity-100"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl" />
                        <div className="relative z-10 text-sm text-blue-200/60 mb-2">Scene Loading</div>
                        <div className="relative z-10 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-blue-200/60">Loaded:</span>
                            <span className="text-white font-semibold ml-2 drop-shadow-lg">{queueStats.loaded}</span>
                          </div>
                          <div>
                            <span className="text-blue-200/60">Loading:</span>
                            <span className="text-white font-semibold ml-2 drop-shadow-lg">{queueStats.loading}</span>
                          </div>
                          <div>
                            <span className="text-blue-200/60">Pending:</span>
                            <span className="text-white font-semibold ml-2 drop-shadow-lg">{queueStats.pending}</span>
                          </div>
                          <div>
                            <span className="text-blue-200/60">Failed:</span>
                            <span className="text-white font-semibold ml-2 drop-shadow-lg">{queueStats.failed}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Account Tab */}
                  {activeTab === 'account' && (
                    <motion.div
                      key="account"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      {/* User Info */}
                      <div className="relative p-6 rounded-xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-slate-900/50 to-purple-900/40 border border-blue-400/40 rounded-xl transition-all duration-300 group-hover:border-blue-300/60 shadow-lg shadow-blue-500/10" />
                        <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                          <motion.div 
                            animate={{ x: ['0%', '200%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-blue-500/0 via-purple-400/40 to-purple-500/0 opacity-100"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl" />
                        <div className="relative z-10 flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <User size={32} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-lg font-bold text-white">
                              {userName || 'Guest User'}
                            </div>
                            <div className="text-sm text-white/60">
                              {userEmail || 'Not logged in'}
                            </div>
                          </div>
                        </div>

                        <div className="relative z-10 grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-black/30 backdrop-blur-sm border border-blue-500/20">
                            <div className="text-xs text-blue-200/60">Status</div>
                            <div className="text-sm font-semibold text-green-400 drop-shadow-lg">
                              {userEmail ? 'Active' : 'Guest'}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-black/30 backdrop-blur-sm border border-blue-500/20">
                            <div className="text-xs text-blue-200/60">Session</div>
                            <div className="text-sm font-semibold text-white drop-shadow-lg">
                              {sessionDuration}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-black/30 backdrop-blur-sm border border-blue-500/20">
                            <div className="text-xs text-blue-200/60">IP</div>
                            <div className="text-sm font-semibold text-white truncate drop-shadow-lg">
                              {showSensitive ? device.network.ip : '•••.•••.•••.•••'}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-black/30 backdrop-blur-sm border border-blue-500/20">
                            <div className="text-xs text-blue-200/60">ISP</div>
                            <div className="text-sm font-semibold text-white truncate drop-shadow-lg">
                              {device.network.isp || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <button
                          onClick={() => { SoundEffects.click(); handleRefresh(); }}
                          onMouseEnter={() => SoundEffects.hover()}
                          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/40 text-white font-semibold hover:from-blue-500/30 hover:to-purple-500/30 hover:border-blue-400/70 transition-all flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={18} />
                          Refresh Website
                        </button>

                        <button
                          onClick={() => {
                            SoundEffects.click();
                            const info = deviceMonitor.getFormattedInfo();
                            console.table(info);
                            alert('Device info logged to console (F12)');
                          }}
                          onMouseEnter={() => SoundEffects.hover()}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-blue-500/40 text-blue-200/70 font-semibold hover:bg-blue-500/15 hover:text-white hover:border-blue-400/70 transition-all flex items-center justify-center gap-2"
                        >
                          <Globe size={18} />
                          View Full Details
                        </button>
                        <button
                          onClick={async () => {
                            SoundEffects.click();
                            const info = JSON.stringify(deviceMonitor.getFormattedInfo(), null, 2);
                            if (navigator.clipboard?.writeText) {
                              await navigator.clipboard.writeText(info);
                              SoundEffects.success();
                              alert('Device snapshot copied to clipboard');
                            } else {
                              console.log(info);
                              alert('Clipboard unavailable; details logged to console');
                            }
                          }}
                          onMouseEnter={() => SoundEffects.hover()}
                          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-blue-500/20 border border-blue-500/40 text-white font-semibold hover:from-blue-500/30 hover:to-blue-500/30 hover:border-blue-400/70 transition-all flex items-center justify-center gap-2"
                        >
                          <Globe size={18} />
                          Copy Device Snapshot
                        </button>
                      </div>

                      {/* Crash Tracker Display - Website Info Panel */}
                      <CrashTrackerDisplay 
                        detailed={true}
                        shimmerEnabled={shimmerEnabled}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Shimmer keyframes now in UnifiedShimmer.tsx for centralized performance control */}
    </>
  );

  // Guard against SSR - only render portal on client
  if (typeof window === 'undefined') return null;
  
  return createPortal(portalContent, document.body);
}

export default UltimateControlPanel;
