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
  EyeOff
} from 'lucide-react';
import { deviceMonitor, type DeviceInfo } from '@/lib/deviceMonitor';
import { queueManager } from '@/lib/splineQueueManager';

// ============================================================================
// TYPES
// ============================================================================

interface UltimateControlPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
  userName?: string;
  accentColor?: string;
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
 * Stat Card Component
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
      className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
            {label}
          </div>
          <div className="text-sm font-bold text-white truncate mt-0.5">
            {value}
          </div>
          {sublabel && (
            <div className="text-[10px] text-white/40 mt-0.5">
              {sublabel}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Performance Ring Component
 */
function PerformanceRing({ score, size = 120 }: { score: number; size?: number }) {
  const { grade, color, label } = getPerformanceGrade(score);
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
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
            transition: 'stroke-dashoffset 1s ease, stroke 0.3s ease'
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="text-4xl font-black"
          style={{ color }}
        >
          {grade}
        </div>
        <div className="text-xs text-white/60 font-semibold">
          {label}
        </div>
        <div className="text-[10px] text-white/40 mt-1">
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
  accentColor = '#3b82f6'
}: UltimateControlPanelProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'performance' | 'account'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [dragProgress, setDragProgress] = useState(0);
  const sessionStartRef = useRef<number>(Date.now());
  const [sessionDuration, setSessionDuration] = useState('0m');

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

  // Handle drag
  const handleDrag = (_: any, info: PanInfo) => {
    const progress = Math.max(0, Math.min(1, -info.offset.y / 200));
    setDragProgress(progress);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    // Close on swipe down - more lenient thresholds for better UX
    if (offset > 80 || (offset > 50 && velocity > 100)) {
      onOpenChange(false);
    }
    // Open on swipe up (when closed)
    else if (offset < -80 || (offset < -50 && velocity < -100)) {
      onOpenChange(true);
    }

    setDragProgress(0);
  };

  if (!deviceInfo) {
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

  return (
    <>
      {/* Handle (visible when closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 left-0 right-0 z-[250000] flex justify-center pointer-events-none"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)'
            }}
          >
            <motion.button
              onClick={() => onOpenChange(true)}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500/90 to-purple-500/90 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center gap-2 pointer-events-auto group"
              style={{
                boxShadow: `0 8px 32px ${accentColor}40, 0 0 0 1px rgba(255,255,255,0.1)`
              }}
            >
              <Activity size={16} className="text-white animate-pulse" />
              <span className="text-white text-sm font-semibold">
                {deviceInfo.live.fps} FPS
              </span>
              <ChevronUp size={16} className="text-white/70 group-hover:text-white transition-colors" />

              {/* Drag indicator */}
              {dragProgress > 0 && (
                <motion.div
                  className="absolute -top-1 left-0 right-0 h-1 bg-white/50 rounded-full"
                  style={{
                    scaleX: dragProgress,
                    transformOrigin: 'left'
                  }}
                />
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
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
              ref={panelRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[250000] max-h-[85vh] overflow-hidden rounded-t-3xl bg-gradient-to-b from-gray-900/98 to-black/98 backdrop-blur-2xl border-t border-white/10 shadow-2xl"
              style={{
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)'
              }}
            >
              {/* Drag handle */}
              <div className="flex flex-col items-center gap-1 py-3 cursor-grab active:cursor-grabbing">
                <div
                  className="w-12 h-1.5 rounded-full bg-white/30"
                  style={{ backgroundColor: `${accentColor}60` }}
                />
                <div className="text-[9px] text-white/30 font-mono tracking-wider">SWIPE DOWN</div>
              </div>

              {/* Header */}
              <div className="px-6 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                    Device Center
                  </h2>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 180 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefresh();
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.transform = 'scale(0.9)';
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.transform = '';
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
                        onOpenChange(false);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.transform = 'scale(0.9)';
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.transform = '';
                      }}
                      className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                      aria-label="Close device center"
                    >
                      <ChevronDown size={18} className="text-white/70" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-6 pb-4">
                <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
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
                        setActiveTab(tab.id as any);
                        if (navigator.vibrate) navigator.vibrate(10);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.transform = 'scale(0.95)';
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.transform = '';
                      }}
                      className={`flex-1 px-3 py-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation ${
                        activeTab === tab.id
                          ? 'bg-white/10 text-white'
                          : 'text-white/50 hover:text-white/70 active:scale-95'
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
                className="px-6 overflow-y-auto max-h-[60vh] pb-6"
                style={{
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
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10">
                        <div className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-2">
                          Display
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-white/60">Resolution:</span>
                            <span className="text-white font-semibold ml-2">
                              {deviceInfo.screen.width}×{deviceInfo.screen.height}
                            </span>
                          </div>
                          <div>
                            <span className="text-white/60">Pixel Ratio:</span>
                            <span className="text-white font-semibold ml-2">
                              {deviceInfo.screen.pixelRatio}x
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Battery */}
                      {deviceInfo.battery.level >= 0 && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Battery size={18} className="text-green-400" />
                              <span className="text-white font-semibold">
                                {deviceInfo.battery.level}%
                              </span>
                            </div>
                            {deviceInfo.battery.charging && (
                              <div className="text-xs text-green-400 flex items-center gap-1">
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
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-white/10">
                        <div className="flex items-center gap-3">
                          <Wifi size={24} className="text-blue-400" />
                          <div className="flex-1">
                            <div className="text-sm text-white/50">Connection</div>
                            <div className="text-lg font-bold text-white">
                              {measuredType}
                            </div>
                            <div className="text-xs text-white/40">
                              {deviceInfo.network.type}
                            </div>
                          </div>
                          {deviceInfo.network.saveData && (
                            <div className="px-2 py-1 rounded-md bg-orange-500/20 text-orange-300 text-xs font-semibold">
                              Data Saver
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-white/60">Link quality</span>
                          <span className="text-xs text-white/40">
                            Last test: {deviceInfo.network.testTimestamp ? new Date(deviceInfo.network.testTimestamp).toLocaleTimeString() : 'Just now'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-white/70">
                            Measured: <span className="text-white font-semibold">{liveSpeed.toFixed(2)} Mbps</span>
                          </div>
                          <div className="text-white/70">
                            Reported: <span className="text-white font-semibold">{reportedDownlink.toFixed(2)} Mbps</span>
                          </div>
                          <div className="text-white/70">
                            Latency: <span className="text-white font-semibold">{Math.round(liveLatency)}ms</span>
                          </div>
                          <div className="text-white/70">
                            Jitter: <span className="text-white font-semibold">{Math.round(liveJitter)}ms</span>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin size={18} className="text-purple-400" />
                              <span className="text-sm text-white/50">Location</span>
                            </div>
                            <div className="text-white font-semibold mb-1">
                              {showSensitive ? deviceInfo.network.location : '••••••'}
                            </div>
                            <div className="text-xs text-white/40">
                              IP: {showSensitive ? deviceInfo.network.ip : '•••.•••.•••.•••'}
                            </div>
                            <div className="text-xs text-white/40">
                              ISP: {deviceInfo.network.isp}
                            </div>
                          </div>
                          <button
                            onClick={() => setShowSensitive(!showSensitive)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            {showSensitive ? (
                              <EyeOff size={16} className="text-white/70" />
                            ) : (
                              <Eye size={16} className="text-white/70" />
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
                          onClick={handleRefresh}
                          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 text-white font-semibold hover:from-blue-500/30 hover:to-purple-500/30 transition-all flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={18} />
                          Refresh Website
                        </button>

                        <button
                          onClick={() => {
                            const info = deviceMonitor.getFormattedInfo();
                            console.table(info);
                            alert('Device info logged to console (F12)');
                          }}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-semibold hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <Globe size={18} />
                          View Full Details
                        </button>
                        <button
                          onClick={async () => {
                            const info = JSON.stringify(deviceMonitor.getFormattedInfo(), null, 2);
                            if (navigator.clipboard?.writeText) {
                              await navigator.clipboard.writeText(info);
                              alert('Device snapshot copied to clipboard');
                            } else {
                              console.log(info);
                              alert('Clipboard unavailable; details logged to console');
                            }
                          }}
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
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default UltimateControlPanel;
