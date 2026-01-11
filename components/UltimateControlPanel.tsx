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
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
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
  Fingerprint
} from 'lucide-react';
import { deviceMonitor, type DeviceInfo } from '@/lib/deviceMonitor';
import { queueManager } from '@/lib/splineQueueManager';
import { SoundEffects } from '@/app/hooks/useSoundEffects';

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
      className="relative p-3 rounded-xl overflow-hidden group"
    >
      {/* Glass background with shimmer */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl border border-blue-500/20 rounded-xl" />
      
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
        <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_25%,#00000000_50%)] opacity-30" />
      </div>
      
      {/* Accent glow */}
      <div 
        className="absolute inset-0 opacity-20 rounded-xl transition-opacity group-hover:opacity-40"
        style={{ background: `radial-gradient(ellipse at top left, ${color}40 0%, transparent 60%)` }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex items-start gap-3">
        <div
          className="p-2 rounded-lg backdrop-blur-sm border border-white/10"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-blue-300/70 uppercase tracking-wider font-semibold">
            {label}
          </div>
          <div className="text-sm font-bold text-white truncate mt-0.5 drop-shadow-lg">
            {value}
          </div>
          {sublabel && (
            <div className="text-[10px] text-blue-200/50 mt-0.5">
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
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative group" style={{ width: size, height: size }}>
      {/* Glass background */}
      <div className="absolute inset-2 rounded-full bg-black/40 backdrop-blur-xl border border-blue-500/20" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-2 rounded-full overflow-hidden opacity-30 group-hover:opacity-50 transition-opacity">
        <div className="absolute inset-[-100%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_25%,#00000000_50%)]" />
      </div>
      
      {/* SVG Ring */}
      <svg className="absolute inset-0 -rotate-90 z-10">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(59,130,246,0.15)"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s ease, stroke 0.3s ease',
            filter: `drop-shadow(0 0 8px ${color}80)`
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <div
          className="text-4xl font-black drop-shadow-lg"
          style={{ color, textShadow: `0 0 20px ${color}60` }}
        >
          {grade}
        </div>
        <div className="text-xs text-blue-200/70 font-semibold">
          {label}
        </div>
        <div className="text-[10px] text-blue-300/50 mt-1">
          {score}/100
        </div>
      </div>
    </div>
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
  accentColor = '#3b82f6',
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
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'performance' | 'account'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  // Ensure component only renders on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update device info periodically
  useEffect(() => {
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

  if (!deviceInfo || !mounted) {
    return null;
  }

  const performanceScore = calculate3DPerformance(deviceInfo);
  const queueStats = queueManager.getStats();
  const liveSpeed = Math.max(0, deviceInfo.live.networkSpeed || deviceInfo.network.measuredDownlink || deviceInfo.network.downlink || 0);
  const liveUpload = Math.max(0, deviceInfo.live.uploadSpeed || deviceInfo.network.measuredUpload || 0);
  const liveLatency = Math.max(0, deviceInfo.live.latency || deviceInfo.network.rtt || 0);
  const liveJitter = Math.max(0, deviceInfo.live.jitter || deviceInfo.network.jitter || 0);
  const reportedDownlink = deviceInfo.network.downlink || 0;
  const measuredType = (deviceInfo.network.effectiveType || '4g').toUpperCase();

  // Default handlers for buttons - now with smart tapping (toggle behavior)
  const handleServicesClick = () => {
    SoundEffects.click();
    setIsMobileExpanded(false);
    if (activeModal === 'services') {
      // 2nd tap - close
      setActiveModal(null);
    } else {
      // 1st tap - open
      setActiveModal('services');
      onServicesClick?.();
    }
  };
  const handleContactClick = () => {
    SoundEffects.click();
    setIsMobileExpanded(false);
    if (activeModal === 'contact') {
      setActiveModal(null);
    } else {
      setActiveModal('contact');
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
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 z-[250000] pointer-events-none"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              paddingRight: 'calc(env(safe-area-inset-right, 0px) + 8px)'
            }}
          >
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDrag={handleSwipeableDrag}
              onDragEnd={handleSwipeableDragEnd}
              whileHover="hover"
              animate={isMobileExpanded ? "hover" : "initial"}
              initial="initial"
              className="relative pointer-events-auto group touch-manipulation"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              {/* Blue shimmer background */}
              <div className="absolute inset-0 rounded-l-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-l from-blue-500/60 via-blue-400/60 to-blue-500/60 animate-shimmer" 
                     style={{
                       backgroundSize: '200% 100%',
                       animation: 'shimmer 3s linear infinite'
                     }}
                />
              </div>
              
              {/* Main FPS Content - Always visible */}
              <motion.div 
                variants={{
                  initial: { x: 0 },
                  hover: { x: -8 }
                }}
                className="relative rounded-l-2xl backdrop-blur-lg border-y border-l border-blue-400/20 bg-transparent"
              >
                {/* FPS Display - Mobile Tap Optimized: First tap expands, second tap opens panel */}
                <div 
                  className="px-4 py-3 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    SoundEffects.click(); // Play click sound
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
                    SoundEffects.click(); // Play click sound
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
                  <div className="flex items-center gap-2">
                    <ChevronRight 
                      size={16} 
                      className={`text-blue-300/70 group-hover:text-blue-200 transition-colors mr-1 ${isMobileExpanded ? 'rotate-90' : 'rotate-180'}`}
                    />
                    <div className="flex flex-col">
                      <span className="text-blue-100 text-lg font-black leading-none drop-shadow-lg">
                        {deviceInfo.live.fps}
                      </span>
                      <span className="text-blue-200/80 text-[9px] font-semibold uppercase tracking-wider drop-shadow">
                        FPS
                      </span>
                    </div>
                    <Activity size={18} className="text-blue-400 animate-pulse" />
                  </div>
                </div>

                {/* Action Buttons - Shown on hover or mobile tap */}
                <motion.div
                  variants={{
                    initial: { height: 0, opacity: 0, pointerEvents: 'none' as const },
                    hover: { height: 'auto', opacity: 1, pointerEvents: 'auto' as const }
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-blue-400/20"
                  style={{ pointerEvents: isMobileExpanded ? 'auto' : undefined }}
                >
                  {/* Services Button */}
                  {showServicesButton && (
                    <button
                      type="button"
                      className={`w-full px-4 py-3 min-h-[48px] cursor-pointer hover:bg-blue-500/10 active:bg-blue-500/20 transition-colors border-b border-blue-400/10 flex items-center touch-manipulation ${activeModal === 'services' ? 'bg-blue-500/20' : ''}`}
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
                      className={`w-full px-4 py-3 min-h-[48px] cursor-pointer hover:bg-blue-500/10 active:bg-blue-500/20 transition-colors border-b border-blue-400/10 flex items-center touch-manipulation ${activeModal === 'contact' ? 'bg-blue-500/20' : ''}`}
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
                      className={`w-full px-4 py-3 min-h-[48px] cursor-pointer hover:bg-blue-500/10 active:bg-blue-500/20 transition-colors border-b border-blue-400/10 flex items-center touch-manipulation ${activeModal === 'theme' ? 'bg-blue-500/20' : ''}`}
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
                      className={`w-full px-4 py-3 min-h-[48px] cursor-pointer hover:bg-blue-500/10 active:bg-blue-500/20 transition-colors border-b border-blue-400/10 flex items-center touch-manipulation ${activeModal === 'admin' ? 'bg-blue-500/20' : ''}`}
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
                    <div className="px-4 py-3 min-h-[48px] border-b border-blue-400/10 flex items-center">
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
                      className={`w-full px-4 py-3 min-h-[48px] cursor-pointer hover:bg-blue-500/10 active:bg-blue-500/20 transition-colors flex items-center touch-manipulation ${activeModal === 'identity' ? 'bg-blue-500/20' : ''}`}
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
        {isOpen && (
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[249999]"
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
              className="fixed right-0 top-0 bottom-0 z-[250000] w-full max-w-md overflow-hidden bg-black/80 backdrop-blur-2xl border-l border-blue-500/30 shadow-2xl"
              style={{
                paddingRight: 'env(safe-area-inset-right, 0px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
              }}
            >
              {/* Shimmer background effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-[-100%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_15%,#00000000_30%)] opacity-10" />
              </div>
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-blue-900/10 pointer-events-none" />
              
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
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-blue-300/70 drop-shadow-lg">
                    Device Center
                  </h2>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 180 }}
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
                      className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                      disabled={isRefreshing}
                      aria-label="Refresh device info"
                    >
                      <RefreshCw
                        size={18}
                        className={`text-white/70 ${isRefreshing ? 'animate-spin' : ''}`}
                      />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
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
                      className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                      aria-label="Close device center"
                    >
                      <ChevronRight size={18} className="text-white/70" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-6 pb-4 relative z-10">
                <div className="relative flex gap-2 p-1 rounded-xl bg-black/40 backdrop-blur-lg border border-blue-500/20 overflow-hidden">
                  {/* Shimmer effect for tabs */}
                  <div className="absolute inset-0 overflow-hidden opacity-20">
                    <div className="absolute inset-[-100%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_25%,#00000000_50%)]" />
                  </div>
                  
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
                      className={`relative z-10 flex-1 px-3 py-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation ${
                        activeTab === tab.id
                          ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                          : 'text-blue-200/60 hover:text-blue-200/90 hover:bg-blue-500/10 active:scale-95'
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
                          value={deviceInfo.device.model}
                          sublabel={deviceInfo.device.manufacturer}
                          color="#3b82f6"
                        />
                        <StatCard
                          icon={Monitor}
                          label="OS"
                          value={deviceInfo.device.os}
                          sublabel={`v${deviceInfo.device.osVersion}`}
                          color="#8b5cf6"
                        />
                        <StatCard
                          icon={Cpu}
                          label="CPU"
                          value={`${deviceInfo.performance.cpu.cores} Cores`}
                          sublabel={deviceInfo.performance.cpu.architecture}
                          color="#22c55e"
                        />
                        <StatCard
                          icon={HardDrive}
                          label="RAM"
                          value={`${deviceInfo.performance.memory.total}GB`}
                          sublabel={`${deviceInfo.performance.memory.percentage}% used`}
                          color="#f59e0b"
                        />
                      </div>

                      {/* Screen Info */}
                      <div className="relative p-4 rounded-xl overflow-hidden group">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-xl border border-blue-500/20 rounded-xl" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                          <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_25%,#00000000_50%)] opacity-30" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl" />
                        <div className="relative z-10">
                          <div className="text-xs text-blue-300/70 uppercase tracking-wider font-semibold mb-2">
                            Display
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-blue-200/60">Resolution:</span>
                              <span className="text-white font-semibold ml-2 drop-shadow-lg">
                                {deviceInfo.screen.width}×{deviceInfo.screen.height}
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-200/60">Pixel Ratio:</span>
                              <span className="text-white font-semibold ml-2 drop-shadow-lg">
                                {deviceInfo.screen.pixelRatio}x
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Battery */}
                      {deviceInfo.battery.level >= 0 && (
                        <div className="relative p-4 rounded-xl overflow-hidden group">
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl border border-blue-500/20 rounded-xl" />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                            <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#22c55e_25%,#00000000_50%)] opacity-30" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl" />
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Battery size={18} className="text-green-400 drop-shadow-lg" />
                              <span className="text-white font-semibold drop-shadow-lg">
                                {deviceInfo.battery.level}%
                              </span>
                            </div>
                            {deviceInfo.battery.charging && (
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
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-xl border border-blue-500/20 rounded-xl" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                          <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_25%,#00000000_50%)] opacity-30" />
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
                              {deviceInfo.network.type}
                            </div>
                          </div>
                          {deviceInfo.network.saveData && (
                            <div className="px-2 py-1 rounded-md bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-semibold">
                              Data Saver
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="relative p-4 rounded-xl overflow-hidden group">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-xl border border-blue-500/20 rounded-xl" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                          <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_25%,#00000000_50%)] opacity-30" />
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-blue-200/70">Link quality</span>
                            <span className="text-xs text-blue-300/50">
                              Last test: {deviceInfo.network.testTimestamp ? new Date(deviceInfo.network.testTimestamp).toLocaleTimeString() : 'Just now'}
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

                      {/* Location */}
                      <div className="relative p-4 rounded-xl overflow-hidden group">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-xl border border-blue-500/20 rounded-xl" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                          <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#a855f7_25%,#00000000_50%)] opacity-30" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl" />
                        <div className="relative z-10 flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin size={18} className="text-purple-400 drop-shadow-lg" />
                              <span className="text-sm text-blue-200/60">Location</span>
                            </div>
                            <div className="text-white font-semibold mb-1 drop-shadow-lg">
                              {showSensitive ? deviceInfo.network.location : '••••••'}
                            </div>
                            <div className="text-xs text-blue-300/50">
                              IP: {showSensitive ? deviceInfo.network.ip : '•••.•••.•••.•••'}
                            </div>
                            <div className="text-xs text-blue-300/50">
                              ISP: {deviceInfo.network.isp}
                            </div>
                          </div>
                          <button
                            onClick={() => { SoundEffects.click(); setShowSensitive(!showSensitive); }}
                            onMouseEnter={() => SoundEffects.hover()}
                            onTouchStart={() => SoundEffects.click()}
                            className="p-2 rounded-lg bg-black/30 border border-blue-500/20 hover:bg-blue-500/10 transition-colors backdrop-blur-sm"
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

                      {/* FPS */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-white/50">Current FPS</div>
                            <div className="text-3xl font-black text-white">
                              {deviceInfo.live.fps}
                            </div>
                            <div className="text-xs text-white/40">
                              Frame time: {deviceInfo.live.frameTime.toFixed(2)}ms
                            </div>
                          </div>
                          <Activity size={40} className="text-green-400 opacity-20" />
                        </div>
                      </div>

                      {/* GPU */}
                      <StatCard
                        icon={Monitor}
                        label="GPU"
                        value={deviceInfo.performance.gpu.tier.toUpperCase() + ' Tier'}
                        sublabel={`Score ${Math.round(deviceInfo.performance.gpu.score ?? 0) || 0}/100 • ${deviceInfo.performance.gpu.vendor || ''} ${deviceInfo.performance.gpu.renderer || ''}`}
                        color={
                          deviceInfo.performance.gpu.tier === 'high' ? '#22c55e' :
                          deviceInfo.performance.gpu.tier === 'medium' ? '#f59e0b' : '#ef4444'
                        }
                      />

                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-sm text-white/60 mb-3">Device Snapshot</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-white/70">CPU: <span className="text-white font-semibold">{deviceInfo.performance.cpu.cores} cores</span></div>
                          <div className="text-white/70">Arch: <span className="text-white font-semibold">{deviceInfo.performance.cpu.architecture}</span></div>
                          <div className="text-white/70">Pixel Ratio: <span className="text-white font-semibold">{deviceInfo.screen.pixelRatio}x</span></div>
                          <div className="text-white/70">Resolution: <span className="text-white font-semibold">{deviceInfo.screen.width}×{deviceInfo.screen.height}</span></div>
                          <div className="text-white/70">Touch: <span className="text-white font-semibold">{deviceInfo.screen.touchSupport ? 'Yes' : 'No'}</span></div>
                          <div className="text-white/70">Battery: <span className="text-white font-semibold">{deviceInfo.battery.level >= 0 ? `${deviceInfo.battery.level}%` : 'Unknown'}</span></div>
                        </div>
                      </div>

                      {/* Memory */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-white/50">Memory Usage</span>
                          <span className="text-sm font-semibold text-white">
                            {deviceInfo.performance.memory.percentage}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${deviceInfo.performance.memory.percentage}%` }}
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          />
                        </div>
                        <div className="text-xs text-white/40 mt-2">
                          {deviceInfo.performance.memory.used}MB / {deviceInfo.performance.memory.limit}MB
                        </div>
                      </div>

                      {/* Queue Stats */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-white/10">
                        <div className="text-sm text-white/50 mb-2">Scene Loading</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-white/60">Loaded:</span>
                            <span className="text-white font-semibold ml-2">{queueStats.loaded}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Loading:</span>
                            <span className="text-white font-semibold ml-2">{queueStats.loading}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Pending:</span>
                            <span className="text-white font-semibold ml-2">{queueStats.pending}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Failed:</span>
                            <span className="text-white font-semibold ml-2">{queueStats.failed}</span>
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
                      <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10">
                        <div className="flex items-center gap-4 mb-4">
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

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-white/5">
                            <div className="text-xs text-white/50">Status</div>
                            <div className="text-sm font-semibold text-green-400">
                              {userEmail ? 'Active' : 'Guest'}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-white/5">
                            <div className="text-xs text-white/50">Session</div>
                            <div className="text-sm font-semibold text-white">
                              {sessionDuration}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-white/5">
                            <div className="text-xs text-white/50">IP</div>
                            <div className="text-sm font-semibold text-white truncate">
                              {showSensitive ? deviceInfo.network.ip : '•••.•••.•••.•••'}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-white/5">
                            <div className="text-xs text-white/50">ISP</div>
                            <div className="text-sm font-semibold text-white truncate">
                              {deviceInfo.network.isp || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <button
                          onClick={() => { SoundEffects.click(); handleRefresh(); }}
                          onMouseEnter={() => SoundEffects.hover()}
                          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 text-white font-semibold hover:from-blue-500/30 hover:to-purple-500/30 transition-all flex items-center justify-center gap-2"
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
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-semibold hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
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
                          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-blue-500/20 border border-white/10 text-white font-semibold hover:from-blue-500/30 hover:to-blue-500/30 transition-all flex items-center justify-center gap-2"
                        >
                          <Globe size={18} />
                          Copy Device Snapshot
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Shimmer animation keyframes - add to global CSS */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `}</style>
    </>
  );

  // Guard against SSR - only render portal on client
  if (typeof window === 'undefined') return null;
  
  return createPortal(portalContent, document.body);
}

export default UltimateControlPanel;