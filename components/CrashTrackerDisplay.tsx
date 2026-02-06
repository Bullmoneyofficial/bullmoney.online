"use client";

/**
 * CRASH TRACKER DISPLAY COMPONENT
 * 
 * A beautiful UI panel showing real-time crash tracking status,
 * event queue statistics, and Supabase sync state.
 * 
 * Features:
 * - Real-time event count display
 * - Sync status indicators (sending, success, error)
 * - Manual flush button
 * - Error/crash count display
 * - Session information
 * - Offline event indicator
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Send,
  CheckCircle2,
  XCircle,
  RefreshCw,
  CloudOff,
  Activity,
  Bug,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  Database,
  Loader2,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { useCrashTracker, type TrackingEvent, type SyncStatus } from '@/lib/CrashTracker';
import { SoundEffects } from '@/app/hooks/useSoundEffects';

// ============================================================================
// TYPES
// ============================================================================

interface CrashTrackerDisplayProps {
  /** Whether to show detailed stats */
  detailed?: boolean;
  /** Custom accent color */
  accentColor?: string;
  /** Show shimmer effects */
  shimmerEnabled?: boolean;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Status Badge with animated indicator
 */
const StatusBadge = memo(function StatusBadge({ 
  status 
}: { 
  status: SyncStatus 
}) {
  const configs = {
    idle: { 
      color: 'text-white', 
      bg: 'bg-white/20', 
      border: 'border-white/40',
      icon: Database,
      label: 'Ready'
    },
    sending: { 
      color: 'text-yellow-400', 
      bg: 'bg-yellow-500/20', 
      border: 'border-yellow-500/40',
      icon: Loader2,
      label: 'Syncing...'
    },
    success: { 
      color: 'text-white', 
      bg: 'bg-white/20', 
      border: 'border-white/40',
      icon: CheckCircle2,
      label: 'Synced'
    },
    error: { 
      color: 'text-red-400', 
      bg: 'bg-red-500/20', 
      border: 'border-red-500/40',
      icon: XCircle,
      label: 'Failed'
    },
    offline: { 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/20', 
      border: 'border-orange-500/40',
      icon: CloudOff,
      label: 'Offline'
    }
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${config.bg} ${config.border} border`}
    >
      <Icon 
        size={14} 
        className={`${config.color} ${status === 'sending' ? 'animate-spin' : ''}`} 
      />
      <span className={`text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    </motion.div>
  );
});

/**
 * Stat Mini Card
 */
const StatMini = memo(function StatMini({
  icon: Icon,
  label,
  value,
  color = '#ffffff',
  pulse = false
}: {
  icon: any;
  label: string;
  value: string | number;
  color?: string;
  pulse?: boolean;
}) {
  return (
    <div className="p-2.5 rounded-lg bg-black/30 border border-white/20 flex items-center gap-2">
      <div 
        className={`p-1.5 rounded-md ${pulse ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={14} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-white/60 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-bold text-white truncate">{value}</div>
      </div>
    </div>
  );
});

/**
 * Recent Event Item
 */
const RecentEvent = memo(function RecentEvent({
  event,
  index
}: {
  event: TrackingEvent;
  index: number;
}) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'click': return Activity;
      case 'error': case 'crash': return Bug;
      case 'performance_warning': return AlertTriangle;
      case 'modal_open': case 'modal_close': return Zap;
      default: return Activity;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'error': case 'crash': return '#ef4444';
      case 'performance_warning': return '#f59e0b';
      case 'click': return '#ffffff';
      default: return '#ffffff';
    }
  };

  const Icon = getEventIcon(event.type);
  const color = getEventColor(event.type);
  const timeAgo = Math.round((Date.now() - event.timestamp) / 1000);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-white/10"
    >
      <div 
        className="p-1 rounded"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={12} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white/80 truncate">
          {event.component}: {event.action || event.type}
        </div>
        <div className="text-[10px] text-white/50">
          {event.target ? `→ ${event.target}` : ''} • {timeAgo}s ago
        </div>
      </div>
    </motion.div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CrashTrackerDisplay = memo(function CrashTrackerDisplay({
  detailed = true,
  accentColor = '#ef4444',
  shimmerEnabled = true
}: CrashTrackerDisplayProps) {
  const tracker = useCrashTracker();
  
  // UI State - derive from tracker's syncState
  const syncStatus = tracker.syncState?.status || 'idle';
  const [isExpanded, setIsExpanded] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [recentEvents, setRecentEvents] = useState<TrackingEvent[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    errorCount: 0,
    queueSize: 0,
    successfulSyncs: tracker.syncState?.successfulSyncs || 0,
    failedSyncs: tracker.syncState?.failedSyncs || 0
  });
  
  // Derive last sync time from tracker
  const lastSyncTime = tracker.syncState?.lastSyncTime 
    ? new Date(tracker.syncState.lastSyncTime) 
    : null;

  // Check offline events
  useEffect(() => {
    const checkOffline = () => {
      try {
        const stored = localStorage.getItem('bullmoney_offline_events');
        if (stored) {
          const events = JSON.parse(stored);
          setOfflineCount(events.length);
        } else {
          setOfflineCount(0);
        }
      } catch {
        setOfflineCount(0);
      }
    };

    checkOffline();
    const interval = setInterval(checkOffline, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Update stats from tracker
  useEffect(() => {
    const updateStats = () => {
      setStats({
        totalEvents: tracker.sessionData?.eventCount || 0,
        errorCount: tracker.sessionData?.errorCount || 0,
        queueSize: tracker.eventQueue.length,
        successfulSyncs: tracker.syncState?.successfulSyncs || 0,
        failedSyncs: tracker.syncState?.failedSyncs || 0
      });
      
      // Get recent events (last 5)
      setRecentEvents(tracker.eventQueue.slice(-5).reverse());
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [tracker.eventQueue, tracker.sessionData, tracker.syncState]);

  // Handle manual flush
  const handleFlush = useCallback(async () => {
    if (syncStatus === 'sending') return;
    
    SoundEffects.click();
    
    try {
      await tracker.flushEvents();
      SoundEffects.success();
    } catch (error) {
      SoundEffects.error?.();
    }
  }, [tracker, syncStatus]);

  // Clear offline events
  const handleClearOffline = useCallback(() => {
    SoundEffects.click();
    try {
      localStorage.removeItem('bullmoney_offline_events');
      setOfflineCount(0);
      SoundEffects.success();
    } catch {
      // Ignore
    }
  }, []);

  // Toggle tracking
  const handleToggleTracking = useCallback(() => {
    SoundEffects.click();
    tracker.setEnabled(!tracker.isEnabled);
  }, [tracker]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl overflow-hidden group"
    >
      {/* Glass Background */}
      <div className="absolute inset-0 bg-linear-to-br from-red-950/40 via-slate-900/50 to-orange-900/40 border border-red-400/40 rounded-xl transition-all duration-300 group-hover:border-red-300/60 shadow-lg shadow-red-500/10" />
      <div className="absolute inset-[1px] rounded-xl bg-linear-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Shimmer Effect */}
      {shimmerEnabled && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
          <motion.div 
            animate={{ x: ['0%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 left-[-100%] w-[100%] bg-linear-to-r from-red-500/0 via-red-400/40 to-red-500/0 opacity-100"
          />
        </div>
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-red-500/10 to-orange-500/10 rounded-xl" />

      {/* Content */}
      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${accentColor}25` }}
            >
              <Bug 
                size={18} 
                style={{ color: accentColor }}
                className="drop-shadow-lg"
              />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                Crash Tracker
                {tracker.isEnabled ? (
                  <ShieldCheck size={14} className="text-white" />
                ) : (
                  <ShieldAlert size={14} className="text-red-400" />
                )}
              </div>
              <div className="text-[10px] text-white/60">
                Real-time error monitoring
              </div>
            </div>
          </div>
          
          <StatusBadge status={syncStatus} />
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatMini
            icon={Activity}
            label="Events"
            value={stats.totalEvents}
            color="#ffffff"
          />
          <StatMini
            icon={Bug}
            label="Errors"
            value={stats.errorCount}
            color="#ef4444"
            pulse={stats.errorCount > 0}
          />
          <StatMini
            icon={Database}
            label="Queue"
            value={stats.queueSize}
            color="#ffffff"
          />
        </div>

        {/* Sync Info Bar */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/20 mb-3">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <Clock size={12} />
            <span>
              {lastSyncTime 
                ? `Last sync: ${lastSyncTime.toLocaleTimeString()}`
                : 'Not synced yet'
              }
            </span>
          </div>
          
          {offlineCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/30">
              <CloudOff size={10} className="text-orange-400" />
              <span className="text-[10px] text-orange-300 font-semibold">
                {offlineCount} offline
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFlush}
            disabled={syncStatus === 'sending' || stats.queueSize === 0}
            onMouseEnter={() => SoundEffects.hover()}
            className={`flex-1 px-3 py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
              syncStatus === 'sending' || stats.queueSize === 0
                ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/20'
                : 'bg-white/20 text-white hover:bg-white/30 border border-white/40 hover:border-white/60'
            }`}
          >
            {syncStatus === 'sending' ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Send size={14} />
                Sync Now ({stats.queueSize})
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleToggleTracking}
            onMouseEnter={() => SoundEffects.hover()}
            className={`px-3 py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all border ${
              tracker.isEnabled
                ? 'bg-white/20 text-white border-white/40 hover:bg-white/30'
                : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
            }`}
          >
            {tracker.isEnabled ? (
              <ShieldCheck size={14} />
            ) : (
              <ShieldAlert size={14} />
            )}
          </motion.button>
        </div>

        {/* Expandable Section */}
        {detailed && (
          <>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                SoundEffects.click();
                setIsExpanded(!isExpanded);
              }}
              onMouseEnter={() => SoundEffects.hover()}
              className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/20 flex items-center justify-center gap-2 text-xs text-white/70 hover:text-white hover:border-white/40 transition-all"
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={14} />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  Show Recent Events
                </>
              )}
            </motion.button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-2">
                    {/* Session Info */}
                    <div className="text-[10px] text-white/50 px-1">
                      Session: {tracker.sessionId?.slice(0, 20)}...
                    </div>

                    {/* Recent Events */}
                    {recentEvents.length > 0 ? (
                      <div className="space-y-1.5">
                        {recentEvents.map((event, idx) => (
                          <RecentEvent key={event.id} event={event} index={idx} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-white/50 text-xs">
                        No events in queue
                      </div>
                    )}

                    {/* Clear Offline Button */}
                    {offlineCount > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleClearOffline}
                        onMouseEnter={() => SoundEffects.hover()}
                        className="w-full px-3 py-2 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-orange-500/30 transition-all"
                      >
                        <Trash2 size={12} />
                        Clear Offline Events ({offlineCount})
                      </motion.button>
                    )}

                    {/* Sync Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                      <div className="text-center p-2 rounded bg-white/10 border border-white/20">
                        <div className="text-lg font-bold text-white">{stats.successfulSyncs}</div>
                        <div className="text-[10px] text-white/70">Successful Syncs</div>
                      </div>
                      <div className="text-center p-2 rounded bg-red-500/10 border border-red-500/20">
                        <div className="text-lg font-bold text-red-400">{stats.failedSyncs}</div>
                        <div className="text-[10px] text-red-300/70">Failed Syncs</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );
});

export default CrashTrackerDisplay;
