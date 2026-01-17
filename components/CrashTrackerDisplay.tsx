"use client";

/**
 * Crash Tracker Display - Beautiful Error & Event Visualization
 * 
 * Features:
 * - Live error feed with severity indicators
 * - Session health score
 * - Error categorization (crash, warning, performance)
 * - Animated notifications for new errors
 * - Detailed error expansion
 * - Export/copy functionality
 */

import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { 
  AlertTriangle, 
  XCircle, 
  Activity, 
  Clock, 
  Trash2, 
  Copy, 
  ChevronDown,
  ChevronUp,
  Shield,
  ShieldAlert,
  ShieldX,
  ShieldCheck,
  Bug,
  Zap,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useCrashTracker, TrackingEvent, EventType } from '@/lib/CrashTracker';

// ============================================================================
// TYPES
// ============================================================================

type HealthLevel = 'healthy' | 'caution' | 'degraded' | 'critical';

interface EventDisplay {
  event: TrackingEvent;
  isNew: boolean;
}

interface HealthConfig {
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  glow: string;
  label: string;
  description: string;
}

const HEALTH_CONFIGS: Record<HealthLevel, HealthConfig> = {
  healthy: {
    icon: <ShieldCheck className="w-5 h-5" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    label: 'Healthy',
    description: 'No issues detected',
  },
  caution: {
    icon: <Shield className="w-5 h-5" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    label: 'Caution',
    description: 'Minor issues detected',
  },
  degraded: {
    icon: <ShieldAlert className="w-5 h-5" />,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]',
    label: 'Degraded',
    description: 'Multiple issues detected',
  },
  critical: {
    icon: <ShieldX className="w-5 h-5" />,
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    border: 'border-red-500/40',
    glow: 'shadow-[0_0_25px_rgba(239,68,68,0.25)]',
    label: 'Critical',
    description: 'Severe issues detected',
  },
};

const EVENT_ICONS: Record<EventType, React.ReactNode> = {
  click: <Activity className="w-3 h-3" />,
  modal_open: <Eye className="w-3 h-3" />,
  modal_close: <EyeOff className="w-3 h-3" />,
  component_mount: <RefreshCw className="w-3 h-3" />,
  component_unmount: <RefreshCw className="w-3 h-3" />,
  error: <Bug className="w-3 h-3" />,
  crash: <XCircle className="w-3 h-3" />,
  performance_warning: <Zap className="w-3 h-3" />,
  fps_drop: <Activity className="w-3 h-3" />,
  navigation: <RefreshCw className="w-3 h-3" />,
  interaction: <Activity className="w-3 h-3" />,
  custom: <Activity className="w-3 h-3" />,
};

const EVENT_COLORS: Record<EventType, string> = {
  click: 'text-blue-400',
  modal_open: 'text-purple-400',
  modal_close: 'text-purple-300',
  component_mount: 'text-emerald-400',
  component_unmount: 'text-gray-400',
  error: 'text-red-400',
  crash: 'text-red-500',
  performance_warning: 'text-amber-400',
  fps_drop: 'text-orange-400',
  navigation: 'text-blue-300',
  interaction: 'text-blue-400',
  custom: 'text-gray-400',
};

// ============================================================================
// HEALTH SCORE COMPONENT
// ============================================================================

const HealthScore = memo(({ errorCount, sessionUptime }: { errorCount: number; sessionUptime: number }) => {
  const getHealthLevel = (): HealthLevel => {
    const errorsPerMinute = errorCount / Math.max(sessionUptime / 60000, 1);
    if (errorCount === 0) return 'healthy';
    if (errorsPerMinute < 0.5 && errorCount < 3) return 'caution';
    if (errorsPerMinute < 2 && errorCount < 10) return 'degraded';
    return 'critical';
  };
  
  const healthLevel = getHealthLevel();
  const config = HEALTH_CONFIGS[healthLevel];
  
  // Calculate score (0-100)
  const score = Math.max(0, 100 - (errorCount * 10));
  
  return (
    <div className={`
      flex items-center gap-3 px-4 py-3 rounded-xl
      ${config.bg} ${config.border} border
      ${config.glow}
    `}>
      <div className={config.color}>
        {config.icon}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className={`font-bold ${config.color}`}>{config.label}</span>
          <span className={`text-2xl font-black ${config.color}`}>{score}</span>
        </div>
        <div className="text-[10px] text-gray-400">{config.description}</div>
        
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full ${config.bg.replace('/10', '/50')} transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
});

HealthScore.displayName = 'HealthScore';

// ============================================================================
// EVENT ITEM COMPONENT
// ============================================================================

const EventItem = memo(({ event, isNew }: EventDisplay) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const icon = EVENT_ICONS[event.type];
  const color = EVENT_COLORS[event.type];
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };
  
  const isError = event.type === 'error' || event.type === 'crash';
  
  return (
    <div className={`
      rounded-lg border transition-all duration-300
      ${isError 
        ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' 
        : 'bg-white/5 border-white/10 hover:border-white/20'
      }
      ${isNew ? 'animate-[slideIn_0.3s_ease-out]' : ''}
    `}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-3 py-2 text-left"
      >
        <span className={color}>{icon}</span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${color} uppercase`}>
              {event.type.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-gray-500">
              {event.component}
            </span>
          </div>
          
          {event.errorMessage && (
            <div className="text-[11px] text-gray-300 truncate">
              {event.errorMessage}
            </div>
          )}
          
          {event.action && !event.errorMessage && (
            <div className="text-[11px] text-gray-400 truncate">
              {event.action}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">
            {formatTime(event.timestamp)}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-gray-500" />
          ) : (
            <ChevronDown className="w-3 h-3 text-gray-500" />
          )}
        </div>
      </button>
      
      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5">
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-gray-500">URL:</span>
              <span className="text-gray-300 truncate max-w-[200px]">{event.url}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Device:</span>
              <span className="text-gray-300">{event.deviceTier || 'unknown'}</span>
            </div>
            
            {event.fps && (
              <div className="flex justify-between">
                <span className="text-gray-500">FPS:</span>
                <span className={event.fps < 30 ? 'text-red-400' : 'text-gray-300'}>{event.fps}</span>
              </div>
            )}
            
            {event.target && (
              <div className="flex justify-between">
                <span className="text-gray-500">Target:</span>
                <span className="text-gray-300">{event.target}</span>
              </div>
            )}
            
            {event.errorStack && (
              <div className="mt-2">
                <span className="text-gray-500 block mb-1">Stack trace:</span>
                <pre className="text-[9px] text-red-300 bg-red-500/10 p-2 rounded overflow-x-auto max-h-24">
                  {event.errorStack}
                </pre>
              </div>
            )}
            
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="mt-2">
                <span className="text-gray-500 block mb-1">Metadata:</span>
                <pre className="text-[9px] text-gray-300 bg-white/5 p-2 rounded overflow-x-auto">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

EventItem.displayName = 'EventItem';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CrashTrackerDisplayProps {
  show?: boolean;
  maxEvents?: number;
  position?: 'left' | 'right';
}

const CrashTrackerDisplay: React.FC<CrashTrackerDisplayProps> = ({
  show = true,
  maxEvents = 20,
  position = 'left',
}) => {
  const { isEnabled, sessionData, eventQueue, setEnabled } = useCrashTracker();
  
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [filter, setFilter] = useState<'all' | 'errors' | 'performance'>('all');
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Track new events
  useEffect(() => {
    const newEvents = eventQueue
      .slice(-maxEvents)
      .reverse()
      .map((event, i) => ({
        event,
        isNew: i === 0 && events.length > 0,
      }));
    setEvents(newEvents);
  }, [eventQueue, maxEvents]);
  
  // Filter events
  const filteredEvents = useMemo(() => {
    switch (filter) {
      case 'errors':
        return events.filter(e => e.event.type === 'error' || e.event.type === 'crash');
      case 'performance':
        return events.filter(e => e.event.type === 'performance_warning' || e.event.type === 'fps_drop');
      default:
        return events;
    }
  }, [events, filter]);
  
  const copyEvents = useCallback(() => {
    const text = JSON.stringify(events.map(e => e.event), null, 2);
    navigator.clipboard.writeText(text);
  }, [events]);
  
  if (!show) return null;
  
  const sessionUptime = sessionData ? Date.now() - sessionData.startedAt : 0;
  const errorCount = sessionData?.errorCount || 0;
  
  const positionClass = position === 'left' ? 'left-4' : 'right-4';
  
  return (
    <div
      className={`fixed top-4 ${positionClass} z-[10000]`}
      style={{ fontFamily: 'ui-monospace, monospace' }}
    >
      <div className={`
        w-80 rounded-xl overflow-hidden
        bg-black/80 backdrop-blur-md
        border border-white/10
        shadow-2xl
        transition-all duration-300
        ${isMinimized ? 'h-auto' : 'max-h-[80vh]'}
      `}>
        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 py-3 border-b border-white/10 cursor-pointer bg-black/30"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white">Crash Tracker</span>
            {errorCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px]">
                <XCircle className="w-3 h-3" />
                {errorCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setEnabled(!isEnabled); }}
              className={`p-1 rounded ${isEnabled ? 'text-emerald-400' : 'text-gray-500'}`}
              title={isEnabled ? 'Tracking enabled' : 'Tracking disabled'}
            >
              {isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <span className="text-gray-500">
              {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </span>
          </div>
        </div>
        
        {!isMinimized && (
          <>
            {/* Health Score */}
            <div className="p-3 border-b border-white/10">
              <HealthScore errorCount={errorCount} sessionUptime={sessionUptime} />
            </div>
            
            {/* Filter tabs */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5">
              {(['all', 'errors', 'performance'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`
                    px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors
                    ${filter === f 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {f}
                </button>
              ))}
              
              <div className="flex-1" />
              
              <button
                onClick={copyEvents}
                className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10"
                title="Copy events"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Event list */}
            <div className="p-3 space-y-2 overflow-y-auto max-h-[50vh]">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No events recorded</p>
                </div>
              ) : (
                filteredEvents.map((e) => (
                  <EventItem key={e.event.id} event={e.event} isNew={e.isNew} />
                ))
              )}
            </div>
            
            {/* Session info footer */}
            <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {Math.floor(sessionUptime / 60000)}m {Math.floor((sessionUptime % 60000) / 1000)}s
                </span>
              </div>
              <span>{sessionData?.eventCount || 0} total events</span>
            </div>
          </>
        )}
      </div>
      
      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default memo(CrashTrackerDisplay);
