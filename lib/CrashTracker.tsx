"use client";

/**
 * CRASH TRACKER & ANALYTICS SYSTEM
 * 
 * Centralized tracking for:
 * - Button clicks across all components
 * - Modal opens/closes
 * - Component lifecycle events
 * - JavaScript errors and crashes
 * - Performance issues (FPS drops, slow renders)
 * - User session data for debugging
 * 
 * All events are logged to Supabase for later analysis.
 * Uses batching to minimize API calls and prevent lag.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
  ReactNode,
} from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type EventType = 
  | 'click'
  | 'modal_open'
  | 'modal_close'
  | 'component_mount'
  | 'component_unmount'
  | 'error'
  | 'crash'
  | 'performance_warning'
  | 'fps_drop'
  | 'navigation'
  | 'interaction'
  | 'custom';

export type ComponentName = 
  | 'navbar'
  | 'footer'
  | 'audioWidget'
  | 'ultimatePanel'
  | 'hero'
  | 'features'
  | 'chartnews'
  | 'testimonials'
  | 'ticker'
  | 'spline'
  | 'mobileStaticHelper'
  | 'movingTradingTip'
  | 'themeSelectorModal'
  | 'adminModal'
  | 'affiliateModal'
  | 'faqModal'
  | 'servicesModal'
  | 'contactModal'
  | 'identityModal'
  | 'musicEmbedModal'
  | 'liveStreamModal'
  | 'analysisModal'
  | 'pagemode'
  | 'multiStepLoader'
  | 'page'
  | 'layout'
  | 'global';

export interface TrackingEvent {
  id: string;
  timestamp: number;
  type: EventType;
  component: ComponentName;
  action?: string;
  target?: string;
  metadata?: Record<string, any>;
  sessionId: string;
  userAgent: string;
  url: string;
  deviceTier?: string;
  fps?: number;
  errorMessage?: string;
  errorStack?: string;
}

export interface SessionData {
  id: string;
  startedAt: number;
  deviceInfo: {
    tier: string;
    isMobile: boolean;
    browser: string;
    os: string;
    screenWidth: number;
    screenHeight: number;
    memory?: number;
    cores?: number;
  };
  pageViews: string[];
  eventCount: number;
  errorCount: number;
  lastActivity: number;
}

export interface CrashTrackerState {
  isEnabled: boolean;
  sessionId: string;
  eventQueue: TrackingEvent[];
  sessionData: SessionData | null;
  
  // Actions
  trackClick: (component: ComponentName, target: string, metadata?: Record<string, any>) => void;
  trackModalOpen: (modalName: ComponentName, metadata?: Record<string, any>) => void;
  trackModalClose: (modalName: ComponentName, metadata?: Record<string, any>) => void;
  trackComponentMount: (component: ComponentName) => void;
  trackComponentUnmount: (component: ComponentName) => void;
  trackError: (error: Error, component?: ComponentName, metadata?: Record<string, any>) => void;
  trackPerformanceWarning: (component: ComponentName, fps: number, message: string) => void;
  trackCustomEvent: (component: ComponentName, action: string, metadata?: Record<string, any>) => void;
  flushEvents: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 30000; // 30 seconds
const MAX_QUEUE_SIZE = 100;
const SESSION_KEY = 'bullmoney_tracking_session';
const ENABLED_KEY = 'bullmoney_tracking_enabled';

// ============================================================================
// HELPERS
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

function getBrowserInfo(): { browser: string; os: string } {
  if (typeof navigator === 'undefined') return { browser: 'unknown', os: 'unknown' };
  
  const ua = navigator.userAgent.toLowerCase();
  
  let browser = 'unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'safari';
  else if (ua.includes('firefox')) browser = 'firefox';
  else if (ua.includes('edg')) browser = 'edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'opera';
  
  let os = 'unknown';
  if (ua.includes('win')) os = 'windows';
  else if (ua.includes('mac')) os = 'macos';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'ios';
  else if (ua.includes('android')) os = 'android';
  else if (ua.includes('linux')) os = 'linux';
  
  return { browser, os };
}

function getDeviceInfo(): SessionData['deviceInfo'] {
  if (typeof window === 'undefined') {
    return {
      tier: 'unknown',
      isMobile: false,
      browser: 'ssr',
      os: 'ssr',
      screenWidth: 0,
      screenHeight: 0,
    };
  }
  
  const { browser, os } = getBrowserInfo();
  const memory = (navigator as any).deviceMemory || undefined;
  const cores = navigator.hardwareConcurrency || undefined;
  const isMobile = window.innerWidth < 768;
  
  // Get device tier from CSS class or compute
  let tier = 'medium';
  if (document.documentElement.classList.contains('device-ultra')) tier = 'ultra';
  else if (document.documentElement.classList.contains('device-high')) tier = 'high';
  else if (document.documentElement.classList.contains('device-low')) tier = 'low';
  else if (document.documentElement.classList.contains('device-minimal')) tier = 'minimal';
  
  return {
    tier,
    isMobile,
    browser,
    os,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    memory,
    cores,
  };
}

// ============================================================================
// SUPABASE INTEGRATION
// ============================================================================

async function sendToSupabase(events: TrackingEvent[], sessionData?: SessionData): Promise<boolean> {
  try {
    // Dynamic import to avoid SSR issues
    const { supabase } = await import('@/lib/supabaseClient');
    
    // Insert events
    if (events.length > 0) {
      const { error: eventsError } = await supabase
        .from('crash_logs')
        .insert(events.map(e => ({
          id: e.id,
          created_at: new Date(e.timestamp).toISOString(),
          event_type: e.type,
          component: e.component,
          action: e.action || null,
          target: e.target || null,
          metadata: e.metadata || {},
          session_id: e.sessionId,
          user_agent: e.userAgent,
          url: e.url,
          device_tier: e.deviceTier || null,
          fps: e.fps || null,
          error_message: e.errorMessage || null,
          error_stack: e.errorStack || null,
        })));
      
      if (eventsError) {
        console.warn('[CrashTracker] Failed to send events:', eventsError.message);
        // Store locally as fallback
        storeLocally(events);
        return false;
      }
    }
    
    // Update session data
    if (sessionData) {
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .upsert({
          id: sessionData.id,
          started_at: new Date(sessionData.startedAt).toISOString(),
          device_info: sessionData.deviceInfo,
          page_views: sessionData.pageViews,
          event_count: sessionData.eventCount,
          error_count: sessionData.errorCount,
          last_activity: new Date(sessionData.lastActivity).toISOString(),
        }, { onConflict: 'id' });
      
      if (sessionError) {
        console.warn('[CrashTracker] Failed to update session:', sessionError.message);
      }
    }
    
    console.log(`[CrashTracker] Sent ${events.length} events to Supabase`);
    return true;
  } catch (error) {
    console.warn('[CrashTracker] Supabase error:', error);
    storeLocally(events);
    return false;
  }
}

function storeLocally(events: TrackingEvent[]) {
  try {
    const existing = localStorage.getItem('bullmoney_offline_events');
    const offlineEvents: TrackingEvent[] = existing ? JSON.parse(existing) : [];
    const combined = [...offlineEvents, ...events].slice(-200); // Keep last 200
    localStorage.setItem('bullmoney_offline_events', JSON.stringify(combined));
  } catch (e) {
    // Storage full or unavailable
  }
}

async function flushOfflineEvents(): Promise<void> {
  try {
    const existing = localStorage.getItem('bullmoney_offline_events');
    if (!existing) return;
    
    const events: TrackingEvent[] = JSON.parse(existing);
    if (events.length === 0) return;
    
    const success = await sendToSupabase(events);
    if (success) {
      localStorage.removeItem('bullmoney_offline_events');
      console.log('[CrashTracker] Flushed offline events');
    }
  } catch (e) {
    // Ignore
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const defaultState: CrashTrackerState = {
  isEnabled: true,
  sessionId: '',
  eventQueue: [],
  sessionData: null,
  trackClick: () => {},
  trackModalOpen: () => {},
  trackModalClose: () => {},
  trackComponentMount: () => {},
  trackComponentUnmount: () => {},
  trackError: () => {},
  trackPerformanceWarning: () => {},
  trackCustomEvent: () => {},
  flushEvents: async () => {},
  setEnabled: () => {},
};

const CrashTrackerContext = createContext<CrashTrackerState>(defaultState);

export function useCrashTracker() {
  return useContext(CrashTrackerContext);
}

// ============================================================================
// PROVIDER
// ============================================================================

interface CrashTrackerProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export const CrashTrackerProvider = memo(function CrashTrackerProvider({
  children,
  enabled = true,
}: CrashTrackerProviderProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [sessionId] = useState(() => getSessionId());
  const eventQueueRef = useRef<TrackingEvent[]>([]);
  const sessionDataRef = useRef<SessionData | null>(null);
  const flushTimeoutRef = useRef<NodeJS.Timeout>();
  const isFlushingRef = useRef(false);
  
  // Initialize session data
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const deviceInfo = getDeviceInfo();
    sessionDataRef.current = {
      id: sessionId,
      startedAt: Date.now(),
      deviceInfo,
      pageViews: [window.location.pathname],
      eventCount: 0,
      errorCount: 0,
      lastActivity: Date.now(),
    };
    
    // Check if tracking is disabled
    const storedEnabled = localStorage.getItem(ENABLED_KEY);
    if (storedEnabled === 'false') {
      setIsEnabled(false);
    }
    
    // Flush offline events on load
    flushOfflineEvents();
  }, [sessionId]);
  
  // Global error handler
  useEffect(() => {
    if (typeof window === 'undefined' || !isEnabled) return;
    
    const handleError = (event: ErrorEvent) => {
      const trackEvent: TrackingEvent = {
        id: generateId(),
        timestamp: Date.now(),
        type: 'crash',
        component: 'global',
        action: 'uncaught_error',
        sessionId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        deviceTier: sessionDataRef.current?.deviceInfo.tier,
        errorMessage: event.message,
        errorStack: event.error?.stack,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      };
      
      eventQueueRef.current.push(trackEvent);
      if (sessionDataRef.current) {
        sessionDataRef.current.errorCount++;
      }
      
      // Immediately flush on crash
      flushEventsInternal();
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const trackEvent: TrackingEvent = {
        id: generateId(),
        timestamp: Date.now(),
        type: 'crash',
        component: 'global',
        action: 'unhandled_rejection',
        sessionId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        deviceTier: sessionDataRef.current?.deviceInfo.tier,
        errorMessage: event.reason?.message || String(event.reason),
        errorStack: event.reason?.stack,
      };
      
      eventQueueRef.current.push(trackEvent);
      if (sessionDataRef.current) {
        sessionDataRef.current.errorCount++;
      }
      
      flushEventsInternal();
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isEnabled, sessionId]);
  
  // Periodic flush
  useEffect(() => {
    if (!isEnabled) return;
    
    flushTimeoutRef.current = setInterval(() => {
      if (eventQueueRef.current.length > 0) {
        flushEventsInternal();
      }
    }, FLUSH_INTERVAL_MS);
    
    return () => {
      if (flushTimeoutRef.current) {
        clearInterval(flushTimeoutRef.current);
      }
    };
  }, [isEnabled]);
  
  // Flush on page unload
  useEffect(() => {
    if (typeof window === 'undefined' || !isEnabled) return;
    
    const handleBeforeUnload = () => {
      if (eventQueueRef.current.length > 0) {
        // Use sendBeacon for reliable delivery on unload
        const events = eventQueueRef.current;
        eventQueueRef.current = [];
        
        try {
          navigator.sendBeacon('/api/crash-log', JSON.stringify({
            events,
            session: sessionDataRef.current,
          }));
        } catch (e) {
          storeLocally(events);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEnabled]);
  
  // ==================== INTERNAL FLUSH ====================
  
  const flushEventsInternal = useCallback(async () => {
    if (isFlushingRef.current || eventQueueRef.current.length === 0) return;
    
    isFlushingRef.current = true;
    const events = eventQueueRef.current.slice(0, BATCH_SIZE);
    eventQueueRef.current = eventQueueRef.current.slice(BATCH_SIZE);
    
    try {
      await sendToSupabase(events, sessionDataRef.current || undefined);
    } finally {
      isFlushingRef.current = false;
    }
  }, []);
  
  // ==================== TRACKING FUNCTIONS ====================
  
  const addEvent = useCallback((event: Omit<TrackingEvent, 'id' | 'timestamp' | 'sessionId' | 'userAgent' | 'url'>) => {
    if (!isEnabled) return;
    
    const fullEvent: TrackingEvent = {
      ...event,
      id: generateId(),
      timestamp: Date.now(),
      sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'ssr',
      url: typeof window !== 'undefined' ? window.location.href : '',
      deviceTier: sessionDataRef.current?.deviceInfo.tier,
    };
    
    eventQueueRef.current.push(fullEvent);
    
    if (sessionDataRef.current) {
      sessionDataRef.current.eventCount++;
      sessionDataRef.current.lastActivity = Date.now();
    }
    
    // Auto-flush if queue is large
    if (eventQueueRef.current.length >= MAX_QUEUE_SIZE) {
      flushEventsInternal();
    }
  }, [isEnabled, sessionId, flushEventsInternal]);
  
  const trackClick = useCallback((component: ComponentName, target: string, metadata?: Record<string, any>) => {
    addEvent({ type: 'click', component, target, metadata });
  }, [addEvent]);
  
  const trackModalOpen = useCallback((modalName: ComponentName, metadata?: Record<string, any>) => {
    addEvent({ type: 'modal_open', component: modalName, action: 'open', metadata });
  }, [addEvent]);
  
  const trackModalClose = useCallback((modalName: ComponentName, metadata?: Record<string, any>) => {
    addEvent({ type: 'modal_close', component: modalName, action: 'close', metadata });
  }, [addEvent]);
  
  const trackComponentMount = useCallback((component: ComponentName) => {
    addEvent({ type: 'component_mount', component, action: 'mount' });
  }, [addEvent]);
  
  const trackComponentUnmount = useCallback((component: ComponentName) => {
    addEvent({ type: 'component_unmount', component, action: 'unmount' });
  }, [addEvent]);
  
  const trackError = useCallback((error: Error, component?: ComponentName, metadata?: Record<string, any>) => {
    addEvent({
      type: 'error',
      component: component || 'global',
      action: 'error',
      errorMessage: error.message,
      errorStack: error.stack,
      metadata,
    });
    
    if (sessionDataRef.current) {
      sessionDataRef.current.errorCount++;
    }
  }, [addEvent]);
  
  const trackPerformanceWarning = useCallback((component: ComponentName, fps: number, message: string) => {
    addEvent({
      type: 'performance_warning',
      component,
      action: 'fps_warning',
      fps,
      metadata: { message },
    });
  }, [addEvent]);
  
  const trackCustomEvent = useCallback((component: ComponentName, action: string, metadata?: Record<string, any>) => {
    addEvent({ type: 'custom', component, action, metadata });
  }, [addEvent]);
  
  const flushEvents = useCallback(async () => {
    await flushEventsInternal();
  }, [flushEventsInternal]);
  
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ENABLED_KEY, String(enabled));
    }
  }, []);
  
  // ==================== STATE ====================
  
  const state = useMemo<CrashTrackerState>(() => ({
    isEnabled,
    sessionId,
    eventQueue: eventQueueRef.current,
    sessionData: sessionDataRef.current,
    trackClick,
    trackModalOpen,
    trackModalClose,
    trackComponentMount,
    trackComponentUnmount,
    trackError,
    trackPerformanceWarning,
    trackCustomEvent,
    flushEvents,
    setEnabled,
  }), [
    isEnabled, sessionId, trackClick, trackModalOpen, trackModalClose,
    trackComponentMount, trackComponentUnmount, trackError, trackPerformanceWarning,
    trackCustomEvent, flushEvents, setEnabled,
  ]);
  
  return (
    <CrashTrackerContext.Provider value={state}>
      {children}
    </CrashTrackerContext.Provider>
  );
});

// ============================================================================
// HOOKS FOR COMPONENTS
// ============================================================================

/**
 * Hook for tracking button clicks with automatic component context
 */
export function useTrackClick(component: ComponentName) {
  const { trackClick } = useCrashTracker();
  
  return useCallback((target: string, metadata?: Record<string, any>) => {
    trackClick(component, target, metadata);
  }, [component, trackClick]);
}

/**
 * Hook for tracking modal lifecycle
 */
export function useTrackModal(modalName: ComponentName) {
  const { trackModalOpen, trackModalClose } = useCrashTracker();
  
  const onOpen = useCallback((metadata?: Record<string, any>) => {
    trackModalOpen(modalName, metadata);
  }, [modalName, trackModalOpen]);
  
  const onClose = useCallback((metadata?: Record<string, any>) => {
    trackModalClose(modalName, metadata);
  }, [modalName, trackModalClose]);
  
  return { onOpen, onClose };
}

/**
 * Hook for automatic component lifecycle tracking
 */
export function useTrackComponent(component: ComponentName) {
  const { trackComponentMount, trackComponentUnmount } = useCrashTracker();
  
  useEffect(() => {
    trackComponentMount(component);
    return () => trackComponentUnmount(component);
  }, [component, trackComponentMount, trackComponentUnmount]);
}

/**
 * Combined hook for component with all tracking capabilities
 */
export function useComponentTracking(component: ComponentName) {
  const tracker = useCrashTracker();
  
  useEffect(() => {
    tracker.trackComponentMount(component);
    return () => tracker.trackComponentUnmount(component);
  }, [component, tracker]);
  
  return useMemo(() => ({
    trackClick: (target: string, metadata?: Record<string, any>) => 
      tracker.trackClick(component, target, metadata),
    trackError: (error: Error, metadata?: Record<string, any>) => 
      tracker.trackError(error, component, metadata),
    trackCustom: (action: string, metadata?: Record<string, any>) => 
      tracker.trackCustomEvent(component, action, metadata),
  }), [component, tracker]);
}

export default CrashTrackerProvider;
