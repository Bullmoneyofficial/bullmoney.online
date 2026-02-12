import { memo, useRef, useState } from 'react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import {
  Battery,
  Clock,
  Cpu,
  Crown,
  Database,
  HardDrive,
  MemoryStick,
  Monitor,
  Server,
  Shield,
  Smartphone,
  Sparkles,
  TrendingUp,
  User,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { NotificationBadge } from '@/components/NotificationSettingsPanel';
import { DEVICE_PANEL_TABS } from '@/components/ultimate-hub/constants';
import type { DevicePanelTab, NetworkStats } from '@/components/ultimate-hub/types';
import {
  useBatteryInfo,
  useBrowserInfo,
  useGpuInfo,
  useNetworkStats,
  usePerformanceStats,
  useRealTimeCache,
  useRealTimeMemory,
  useScreenInfo,
  useStorageInfo,
} from '@/components/ultimate-hub/hooks/useDeviceData';
import { calculate3DPerformanceScore, getPerformanceGrade } from '@/components/ultimate-hub/utils/performance';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { ConnectionStatusBadge, PerformanceRing, StatCard } from '@/components/ultimate-hub/components/DeviceWidgets';
import { FpsCandlestickChart, FpsDisplay } from '@/components/ultimate-hub/components/FpsWidgets';

export const DeviceCenterPanel = memo(({ 
  isOpen, 
  onClose,
  fps,
  deviceTier,
  jankScore,
  isAdmin,
  isVip,
  userId,
  userEmail
}: {
  isOpen: boolean;
  onClose: () => void;
  fps: number;
  deviceTier: string;
  jankScore?: number;
  isAdmin: boolean;
  isVip: boolean;
  userId?: string;
  userEmail?: string;
}) => {
  const [activeTab, setActiveTab] = useState<DevicePanelTab>('overview');
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Get REAL device data from hooks
  const memoryStats = useRealTimeMemory();
  const browserInfo = useBrowserInfo();
  const storageInfo = useStorageInfo();
  const cacheStats = useRealTimeCache();
  const networkStats = useNetworkStats() as NetworkStats & { runSpeedTest: () => Promise<void> };
  const perfStats = usePerformanceStats();
  const gpuInfo = useGpuInfo();
  const batteryInfo = useBatteryInfo();
  const screenInfo = useScreenInfo();
  
  // Calculate 3D Performance Score
  const performanceScore = calculate3DPerformanceScore(fps, memoryStats.percentage, gpuInfo.score, browserInfo.cores);
  const performanceGrade = getPerformanceGrade(performanceScore);

  // Handle swipe to close
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      SoundEffects.swipe();
      onClose();
    }
    setIsDragging(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          className="fixed right-0 top-0 bottom-0 z-[2147483647] w-[320px] max-w-[90vw] bg-white backdrop-blur-xl border-l border-black/10 shadow-2xl flex flex-col"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-black/20" />
          </div>

          {/* Header */}
          <div className="px-4 pb-3 border-b border-black/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-white to-white flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-black neon-white-icon" />
                </div>
                <div>
                  <h3 className="text-sm font-bold neon-white-text">Device Center</h3>
                  <p className="text-[9px] text-black/50">Real-time system info</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* 🔔 Notification Bell - Compact Icon */}
                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                  <NotificationBadge />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { SoundEffects.close(); onClose(); }}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-black/5 border border-black/10 flex items-center justify-center neon-blue-border"
                >
                  <X className="w-4 h-4 neon-blue-icon" />
                </motion.button>
              </div>
            </div>

            {/* FPS Display */}
            <div className="mt-3 flex items-center justify-between">
              <FpsDisplay fps={fps} deviceTier={deviceTier} jankScore={jankScore} />
              <ConnectionStatusBadge 
                isOnline={browserInfo.onLine} 
                effectiveType={browserInfo.connection.effectiveType} 
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-black/10 overflow-x-auto overflow-y-hidden scrollbar-none [-webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain]" style={{ touchAction: 'pan-x pinch-zoom' }}>
            {DEVICE_PANEL_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { SoundEffects.tab(); setActiveTab(tab.id); }}
                  className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-5 sm:py-3 px-2 sm:px-3 text-[10px] sm:text-[11px] font-semibold transition-all whitespace-nowrap min-h-[48px] sm:min-h-0 ${
                    activeTab === tab.id
                      ? 'text-black border-b-2 border-white bg-white'
                      : 'text-black/40 hover:text-black hover:bg-black/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }}>
            <AnimatePresence mode="wait">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {/* Device Info */}
                  <div className="p-3 rounded-xl bg-linear-to-br from-white/10 to-white/5 border border-black/10">
                    <h4 className="text-[10px] font-bold text-black uppercase tracking-wider mb-2">Device</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Platform</span>
                        <span className="text-black font-semibold">{browserInfo.platform}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Browser</span>
                        <span className="text-black font-semibold">{browserInfo.name} {browserInfo.version.split('.')[0]}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Engine</span>
                        <span className="text-black font-semibold">{browserInfo.engine}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">CPU Cores</span>
                        <span className="text-black font-semibold">{browserInfo.cores}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Device RAM</span>
                        <span className="text-black font-semibold">{browserInfo.deviceMemory} GB</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Locale</span>
                        <span className="text-black font-semibold">{browserInfo.locale}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3D Performance Grade */}
                  <div className="p-3 rounded-xl bg-white border border-black/10 shadow-sm">
                    <h4 className="text-[10px] font-bold text-black/50 uppercase tracking-wider mb-3">3D Performance Score</h4>
                    <div className="flex items-center justify-center">
                      <div className="relative w-[100px] h-[100px]">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                          <motion.circle
                            cx="50" cy="50" r="42" fill="none"
                            stroke={performanceGrade.color}
                            strokeWidth="6" strokeLinecap="round"
                            strokeDasharray={264}
                            initial={{ strokeDashoffset: 264 }}
                            animate={{ strokeDashoffset: 264 - (performanceScore / 100) * 264 }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{ filter: `drop-shadow(0 0 8px ${performanceGrade.color}80)` }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black" style={{ color: performanceGrade.color, textShadow: `0 0 15px ${performanceGrade.color}50` }}>
                            {performanceGrade.grade}
                          </span>
                          <span className="text-[9px] text-black/50">{performanceGrade.label}</span>
                          <span className="text-[8px] text-black/40">{performanceScore}/100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GPU Info */}
                  <div className="p-3 rounded-xl bg-linear-to-br from-white/10 to-fuchsia-500/5 border border-black/10">
                    <h4 className="text-[10px] font-bold text-black uppercase tracking-wider mb-2">Graphics</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">GPU</span>
                        <span className="text-black font-semibold truncate max-w-[160px]" title={gpuInfo.renderer}>
                          {gpuInfo.renderer.length > 25 ? gpuInfo.renderer.slice(0, 25) + '...' : gpuInfo.renderer}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Vendor</span>
                        <span className="text-black font-semibold">{gpuInfo.vendor}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">WebGL</span>
                        <span className="text-black font-semibold">{gpuInfo.webglVersion}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">GPU Tier</span>
                        <span className={`font-semibold uppercase ${
                          gpuInfo.tier === 'ultra' ? 'text-black' :
                          gpuInfo.tier === 'high' ? 'text-black' :
                          gpuInfo.tier === 'medium' ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {gpuInfo.tier}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Max Texture</span>
                        <span className="text-black font-semibold">{gpuInfo.maxTextureSize}px</span>
                      </div>
                    </div>
                  </div>

                  {/* Screen Info */}
                  <div className="p-3 rounded-xl bg-linear-to-br from-white/10 to-white/5 border border-black/10">
                    <h4 className="text-[10px] font-bold text-black uppercase tracking-wider mb-2">Display</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Resolution</span>
                        <span className="text-black font-semibold">{screenInfo.width} × {screenInfo.height}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Pixel Ratio</span>
                        <span className="text-black font-semibold">{screenInfo.pixelRatio}x</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Refresh Rate</span>
                        <span className="text-black font-semibold">{screenInfo.refreshRate} Hz</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Color Depth</span>
                        <span className="text-black font-semibold">{screenInfo.colorDepth}-bit</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">HDR</span>
                        <span className={`font-semibold ${screenInfo.hdr ? 'text-black' : 'text-black/40'}`}>
                          {screenInfo.hdr ? 'Supported' : 'Not supported'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Touch Points</span>
                        <span className="text-black font-semibold">{screenInfo.touchPoints}</span>
                      </div>
                    </div>
                  </div>

                  {/* Battery Info (if supported) */}
                  {batteryInfo.supported && (
                    <div className="p-3 rounded-xl bg-linear-to-br from-white/10 to-white/5 border border-black/10">
                      <h4 className="text-[10px] font-bold text-black uppercase tracking-wider mb-2">Battery</h4>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-black/50">Level</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 h-2 bg-black/10 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${
                                  batteryInfo.level > 50 ? 'bg-white' :
                                  batteryInfo.level > 20 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${batteryInfo.level}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <span className="text-black font-semibold">{batteryInfo.level}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-black/50">Status</span>
                          <span className={`font-semibold flex items-center gap-1 ${batteryInfo.charging ? 'text-black' : 'text-black/50'}`}>
                            {batteryInfo.charging ? (
                              <>
                                <Zap className="w-3 h-3" />
                                Charging
                              </>
                            ) : (
                              <>
                                <Battery className="w-3 h-3" />
                                Discharging
                              </>
                            )}
                          </span>
                        </div>
                        {batteryInfo.charging && batteryInfo.chargingTime !== Infinity && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-black/50">Full in</span>
                            <span className="text-black font-semibold">
                              {Math.round(batteryInfo.chargingTime / 60)} min
                            </span>
                          </div>
                        )}
                        {!batteryInfo.charging && batteryInfo.dischargingTime !== Infinity && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-black/50">Time Left</span>
                            <span className="text-black font-semibold">
                              {Math.round(batteryInfo.dischargingTime / 60)} min
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Memory Usage */}
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      label="JS Heap"
                      value={memoryStats.jsHeapUsed}
                      unit="MB"
                      icon={MemoryStick}
                      color="cyan"
                      subValue={`${memoryStats.percentage}% of ${memoryStats.jsHeapLimit}MB`}
                    />
                    <StatCard
                      label="Device RAM"
                      value={browserInfo.deviceMemory}
                      unit="GB"
                      icon={Database}
                      color="blue"
                    />
                  </div>

                  {/* Storage */}
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      label="Storage Type"
                      value={storageInfo.type}
                      icon={HardDrive}
                      color="purple"
                    />
                    <StatCard
                      label="Cache Used"
                      value={cacheStats.usage.toFixed(1)}
                      unit="MB"
                      icon={Database}
                      color="amber"
                      subValue={`${cacheStats.percentage}% of quota`}
                    />
                  </div>

                  {/* Performance Rings */}
                  <div className="p-3 rounded-xl bg-white border border-black/10 shadow-sm">
                    <h4 className="text-[10px] font-bold text-black/50 uppercase tracking-wider mb-3">Real-Time Metrics</h4>
                    <div className="flex justify-around">
                      <PerformanceRing
                        value={fps}
                        maxValue={120}
                        label="FPS"
                        color={fps >= 50 ? 'green' : fps >= 30 ? 'amber' : 'red'}
                      />
                      <PerformanceRing
                        value={memoryStats.percentage}
                        maxValue={100}
                        label="Memory"
                        color={memoryStats.percentage < 50 ? 'green' : memoryStats.percentage < 80 ? 'amber' : 'red'}
                      />
                      <PerformanceRing
                        value={cacheStats.percentage}
                        maxValue={100}
                        label="Cache"
                        color={cacheStats.percentage < 50 ? 'cyan' : cacheStats.percentage < 80 ? 'amber' : 'red'}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* NETWORK TAB */}
              {activeTab === 'network' && (
                <motion.div
                  key="network"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {/* Connection Status */}
                  <div className="p-3 rounded-xl bg-linear-to-br from-white/10 to-white/5 border border-black/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-bold text-black uppercase tracking-wider">Connection</h4>
                      <ConnectionStatusBadge 
                        isOnline={networkStats.isOnline} 
                        effectiveType={networkStats.effectiveType} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Type</span>
                        <span className="text-black font-semibold">{networkStats.connectionType || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Downlink</span>
                        <span className="text-black font-semibold">{networkStats.downlink} Mbps</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">RTT (Latency)</span>
                        <span className="text-black font-semibold">{networkStats.rtt} ms</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Data Saver</span>
                        <span className={`font-semibold ${networkStats.saveData ? 'text-amber-400' : 'text-black'}`}>
                          {networkStats.saveData ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Speed Test */}
                  <div className="p-3 rounded-xl bg-white border border-black/10 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-bold text-black/50 uppercase tracking-wider">Speed Test</h4>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={networkStats.runSpeedTest}
                        disabled={networkStats.testing}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-black border border-black/10 text-[9px] font-semibold text-black disabled:opacity-50"
                      >
                        {networkStats.testing ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        {networkStats.testing ? 'Testing...' : 'Run Test'}
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <StatCard
                        label="Latency"
                        value={networkStats.latency || networkStats.rtt}
                        unit="ms"
                        icon={Clock}
                        color={networkStats.latency < 50 ? 'green' : networkStats.latency < 100 ? 'amber' : 'red'}
                        animate={false}
                      />
                      <StatCard
                        label="Download"
                        value={networkStats.downloadSpeed > 0 ? (networkStats.downloadSpeed / 1000).toFixed(1) : networkStats.downlink}
                        unit="Mbps"
                        icon={TrendingUp}
                        color="cyan"
                        animate={false}
                      />
                    </div>

                    {networkStats.lastTest > 0 && (
                      <div className="mt-2 text-[8px] text-black/40 text-center">
                        Last test: {new Date(networkStats.lastTest).toLocaleTimeString()}
                      </div>
                    )}
                  </div>

                  {/* Network Quality */}
                  <div className="p-3 rounded-xl bg-white border border-black/10 shadow-sm">
                    <h4 className="text-[10px] font-bold text-black/50 uppercase tracking-wider mb-3">Quality Assessment</h4>
                    <div className="flex justify-around">
                      <PerformanceRing
                        value={networkStats.isOnline ? (networkStats.effectiveType === '4g' ? 90 : networkStats.effectiveType === '3g' ? 60 : 30) : 0}
                        maxValue={100}
                        label="Quality"
                        color={networkStats.effectiveType === '4g' ? 'green' : networkStats.effectiveType === '3g' ? 'amber' : 'red'}
                      />
                      <PerformanceRing
                        value={Math.min(100, Math.max(0, 100 - (networkStats.rtt / 5)))}
                        maxValue={100}
                        label="Latency"
                        color={networkStats.rtt < 50 ? 'green' : networkStats.rtt < 100 ? 'amber' : 'red'}
                      />
                      <PerformanceRing
                        value={Math.min(100, (networkStats.downlink / 50) * 100)}
                        maxValue={100}
                        label="Speed"
                        color={networkStats.downlink > 10 ? 'green' : networkStats.downlink > 5 ? 'amber' : 'red'}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PERFORMANCE TAB */}
              {activeTab === 'performance' && (
                <motion.div
                  key="performance"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {/* Core Web Vitals */}
                  <div className="p-3 rounded-xl bg-linear-to-br from-white/10 to-white/5 border border-black/10">
                    <h4 className="text-[10px] font-bold text-black uppercase tracking-wider mb-2">Core Web Vitals</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">First Contentful Paint</span>
                        <span className={`font-semibold ${perfStats.firstContentfulPaint < 1800 ? 'text-black' : perfStats.firstContentfulPaint < 3000 ? 'text-amber-400' : 'text-red-400'}`}>
                          {perfStats.firstContentfulPaint}ms
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Largest Contentful Paint</span>
                        <span className={`font-semibold ${perfStats.largestContentfulPaint < 2500 ? 'text-black' : perfStats.largestContentfulPaint < 4000 ? 'text-amber-400' : 'text-red-400'}`}>
                          {perfStats.largestContentfulPaint || 'Measuring...'}ms
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Cumulative Layout Shift</span>
                        <span className={`font-semibold ${perfStats.cumulativeLayoutShift < 0.1 ? 'text-black' : perfStats.cumulativeLayoutShift < 0.25 ? 'text-amber-400' : 'text-red-400'}`}>
                          {perfStats.cumulativeLayoutShift.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Load Metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      label="Page Load"
                      value={perfStats.loadTime}
                      unit="ms"
                      icon={Clock}
                      color={perfStats.loadTime < 2000 ? 'green' : perfStats.loadTime < 4000 ? 'amber' : 'red'}
                    />
                    <StatCard
                      label="DOM Ready"
                      value={perfStats.domContentLoaded}
                      unit="ms"
                      icon={Server}
                      color={perfStats.domContentLoaded < 1500 ? 'green' : perfStats.domContentLoaded < 3000 ? 'amber' : 'red'}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      label="First Paint"
                      value={perfStats.firstPaint}
                      unit="ms"
                      icon={Zap}
                      color={perfStats.firstPaint < 1000 ? 'green' : perfStats.firstPaint < 2000 ? 'amber' : 'red'}
                    />
                    <StatCard
                      label="JS Execution"
                      value={perfStats.jsExecutionTime}
                      unit="ms"
                      icon={Cpu}
                      color="purple"
                    />
                  </div>

                  {/* Real-Time Performance */}
                  <div className="p-3 rounded-xl bg-white border border-black/10 shadow-sm">
                    <h4 className="text-[10px] font-bold text-black/50 uppercase tracking-wider mb-3">Runtime Performance</h4>
                    <div className="flex justify-around">
                      <PerformanceRing
                        value={fps}
                        maxValue={60}
                        label="FPS"
                        color={fps >= 50 ? 'green' : fps >= 30 ? 'amber' : 'red'}
                      />
                      <PerformanceRing
                        value={100 - memoryStats.percentage}
                        maxValue={100}
                        label="Memory Free"
                        color={memoryStats.percentage < 50 ? 'green' : memoryStats.percentage < 80 ? 'amber' : 'red'}
                      />
                      <PerformanceRing
                        value={Math.min(100, Math.max(0, 100 - (perfStats.loadTime / 50)))}
                        maxValue={100}
                        label="Speed Score"
                        color={perfStats.loadTime < 2000 ? 'green' : perfStats.loadTime < 4000 ? 'amber' : 'red'}
                      />
                    </div>
                  </div>

                  {/* FPS Candlestick Chart */}
                  <div className="p-3 rounded-xl bg-white border border-black/10 shadow-sm">
                    <h4 className="text-[10px] font-bold text-black/50 uppercase tracking-wider mb-2">FPS History</h4>
                    <div className="flex justify-center">
                      <FpsCandlestickChart fps={fps} width={260} height={80} candleCount={15} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ACCOUNT TAB */}
              {activeTab === 'account' && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {/* User Info */}
                  <div className="p-3 rounded-xl bg-linear-to-br from-white/10 to-white/5 border border-black/10">
                    <h4 className="text-[10px] font-bold text-black uppercase tracking-wider mb-2">Account Status</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Status</span>
                        <span className={`font-semibold ${userId ? 'text-black' : 'text-black/40'}`}>
                          {userId ? 'Signed In' : 'Guest'}
                        </span>
                      </div>
                      {userEmail && (
                        <div className="flex justify-between text-[10px]">
                          <span className="text-black/50">Email</span>
                          <span className="text-black font-semibold truncate max-w-[150px]">{userEmail}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">VIP Status</span>
                        <span className={`font-semibold flex items-center gap-1 ${isVip ? 'text-amber-400' : 'text-black/40'}`}>
                          {isVip ? <Crown className="w-3 h-3" /> : null}
                          {isVip ? 'VIP Member' : 'Standard'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Role</span>
                        <span className={`font-semibold flex items-center gap-1 ${isAdmin ? 'text-black' : 'text-black/50'}`}>
                          {isAdmin ? <Shield className="w-3 h-3" /> : null}
                          {isAdmin ? 'Admin' : 'User'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    {!userId && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.location.href = '/login'}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-linear-to-r from-white to-white text-black font-bold text-xs"
                      >
                        <User className="w-4 h-4" />
                        Sign In / Register
                      </motion.button>
                    )}


                    {isAdmin && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.dispatchEvent(new CustomEvent('openAdminVIPPanel'))}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-linear-to-r from-white to-white text-black font-bold text-xs"
                      >
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </motion.button>
                    )}
                  </div>

                  {/* Session Info */}
                  <div className="p-3 rounded-xl bg-white border border-black/10 shadow-sm">
                    <h4 className="text-[10px] font-bold text-black/50 uppercase tracking-wider mb-2">Session Info</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Device Tier</span>
                        <span className={`font-semibold uppercase ${
                          deviceTier === 'ultra' ? 'text-black' :
                          deviceTier === 'high' ? 'text-black' :
                          deviceTier === 'medium' ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {deviceTier}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Session Start</span>
                        <span className="text-black font-semibold">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-black/50">Page Loads</span>
                        <span className="text-black font-semibold">
                          {typeof window !== 'undefined' ? (performance.getEntriesByType('navigation').length || 1) : 1}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-black/10 bg-linear-to-r from-white/5 to-white/5">
            <div className="text-[8px] text-black/40 text-center">
              All data from real device APIs • Auto-refreshing
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
DeviceCenterPanel.displayName = 'DeviceCenterPanel';
