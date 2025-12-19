"use client";

import React, { Suspense, useState, useEffect, useRef, useTransition, useCallback, memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Spline from '@splinetool/react-spline';
import YouTube from 'react-youtube'; 
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { 
  Volume2, Volume1, VolumeX, X, Palette, 
  ChevronRight, GripVertical, Minimize2, Radio,
  Globe, TrendingUp, Layers, Cast, Users, Cpu,
  Zap, Lock, Unlock, Activity, MousePointer2,
  Star, Award, Trophy, Target, Flame, Sparkles,
  ChevronDown, ChevronUp, Eye, EyeOff, Heart,
  Command, Search, Music, Gauge, Play, Pause,
  BarChart3, Download, Upload, Settings
} from 'lucide-react'; 

import { Navbar } from "@/components/Mainpage/navbar"; 
import RegisterPage from "./register/pagemode"; 
import BullMoneyGate from "@/components/Mainpage/TradingHoldUnlock"; 
import MultiStepLoaderV2 from "@/components/Mainpage/MultiStepLoaderv2"; 
import { ALL_THEMES, Theme, THEME_SOUNDTRACKS, SoundProfile } from '@/components/Mainpage/ThemeComponents';

// --- Dynamic Imports with Priority ---
const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { 
  ssr: false, 
  loading: () => <div className="hidden"></div> 
});
const FixedThemeConfigurator = dynamic(
  () => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.default), 
  { ssr: false }
);

// --- Enhanced Utils & Hooks ---

// Performance Governor - Auto-detect device capability
type PerformanceLevel = 'low' | 'medium' | 'high';

const detectPerformanceLevel = (): PerformanceLevel => {
  if (typeof window === 'undefined') return 'high';
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return 'low';
  
  // Check device memory (Chrome/Edge only)
  const memory = (navigator as any).deviceMemory;
  if (memory && memory < 4) return 'low';
  if (memory && memory < 8) return 'medium';
  
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency;
  if (cores && cores < 4) return 'low';
  if (cores && cores < 8) return 'medium';
  
  // Check connection type
  const connection = (navigator as any).connection;
  if (connection) {
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') return 'low';
    if (connection.effectiveType === '3g') return 'medium';
  }
  
  return 'high';
};

const usePerformanceGovernor = () => {
  const [level, setLevel] = useState<PerformanceLevel>('high');
  const [userOverride, setUserOverride] = useState<PerformanceLevel | null>(null);
  
  useEffect(() => {
    const detected = detectPerformanceLevel();
    const stored = smartStorage.get('performance_level');
    if (stored) {
      setUserOverride(stored as PerformanceLevel);
      setLevel(stored as PerformanceLevel);
    } else {
      setLevel(detected);
    }
  }, []);
  
  const setPerformance = useCallback((newLevel: PerformanceLevel) => {
    setUserOverride(newLevel);
    setLevel(newLevel);
    smartStorage.set('performance_level', newLevel);
    triggerHaptic(20);
  }, []);
  
  return {
    level: userOverride || level,
    isLow: (userOverride || level) === 'low',
    isMedium: (userOverride || level) === 'medium',
    isHigh: (userOverride || level) === 'high',
    setPerformance,
    autoDetected: level,
    isOverridden: !!userOverride
  };
};

// Session Replay Lite - Local analytics only
interface SessionEvent {
  type: 'scroll' | 'click' | 'page_view' | 'interaction';
  timestamp: number;
  data: any;
}

class SessionRecorder {
  private events: SessionEvent[] = [];
  private maxEvents = 1000;
  private startTime = Date.now();
  
  record(type: SessionEvent['type'], data: any) {
    this.events.push({
      type,
      timestamp: Date.now() - this.startTime,
      data
    });
    
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }
  
  getStats() {
    const scrollEvents = this.events.filter(e => e.type === 'scroll');
    const pageViews = this.events.filter(e => e.type === 'page_view');
    const interactions = this.events.filter(e => e.type === 'interaction');
    
    // Calculate average scroll velocity
    const velocities = scrollEvents.map(e => e.data.velocity || 0);
    const avgVelocity = velocities.length > 0 
      ? velocities.reduce((a, b) => a + b, 0) / velocities.length 
      : 0;
    
    // Page dwell times
    const pageDwells: Record<number, number> = {};
    pageViews.forEach((view, index) => {
      const nextView = pageViews[index + 1];
      const dwellTime = nextView ? nextView.timestamp - view.timestamp : Date.now() - this.startTime - view.timestamp;
      pageDwells[view.data.page] = (pageDwells[view.data.page] || 0) + dwellTime;
    });
    
    // Interaction heatmap
    const heatmap: Record<string, number> = {};
    interactions.forEach(int => {
      const key = `${int.data.type}_${int.data.target}`;
      heatmap[key] = (heatmap[key] || 0) + 1;
    });
    
    return {
      totalEvents: this.events.length,
      scrollEvents: scrollEvents.length,
      pageViews: pageViews.length,
      interactions: interactions.length,
      avgScrollVelocity: Math.round(avgVelocity),
      pageDwellTimes: pageDwells,
      interactionHeatmap: heatmap,
      sessionDuration: Date.now() - this.startTime,
      eventsPerMinute: (this.events.length / ((Date.now() - this.startTime) / 60000)).toFixed(2)
    };
  }
  
  export() {
    return {
      version: '1.0',
      startTime: this.startTime,
      events: this.events,
      stats: this.getStats()
    };
  }
  
  clear() {
    this.events = [];
    this.startTime = Date.now();
  }
}

const triggerHaptic = (pattern: number | number[] = 10) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

const playTick = (type: 'soft' | 'medium' | 'sharp' = 'soft') => {
  if (typeof Audio !== 'undefined') {
    const freq = type === 'soft' ? 200 : type === 'medium' ? 400 : 800;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }
};

// Smart Local Storage with Expiry
const smartStorage = {
  set: (key: string, value: any, ttl?: number) => {
    try {
      const item = { value, expires: ttl ? Date.now() + ttl : null };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.warn('Failed to set storage:', key, e);
    }
  },
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      // Try to parse as JSON object
      const parsed = JSON.parse(item);
      
      // Check if it's in the new format with { value, expires }
      if (parsed && typeof parsed === 'object' && 'value' in parsed) {
        if (parsed.expires && Date.now() > parsed.expires) {
          localStorage.removeItem(key);
          return null;
        }
        return parsed.value;
      }
      
      // Legacy format - return as is
      return parsed;
    } catch (e) {
      // If JSON parse fails, it's a plain string (legacy format)
      const item = localStorage.getItem(key);
      return item || null;
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Failed to remove storage:', key, e);
    }
  },
  // Helper to migrate legacy values
  migrate: (key: string) => {
    try {
      const oldValue = localStorage.getItem(key);
      if (!oldValue) return;
      
      // Try parsing to see if it's already in new format
      try {
        const parsed = JSON.parse(oldValue);
        if (parsed && typeof parsed === 'object' && 'value' in parsed) {
          return; // Already migrated
        }
      } catch {}
      
      // Migrate to new format
      const item = { value: oldValue, expires: null };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.warn('Failed to migrate storage:', key, e);
    }
  },
  // Clear all app storage (useful for debugging)
  clearAll: () => {
    try {
      const keys = ['user_theme_id', 'vip_user_registered', 'achievements', 'theme_change_count', 'visited_pages'];
      keys.forEach(key => localStorage.removeItem(key));
      console.log('Storage cleared successfully');
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
  }
};

// Achievement System
const ACHIEVEMENTS = [
  { id: 'explorer', icon: Globe, trigger: 'visit_all_pages', reward: 'Explorer Badge' },
  { id: 'speedster', icon: Zap, trigger: 'fast_scroll', reward: 'Speed Demon' },
  { id: 'theme_master', icon: Palette, trigger: 'change_theme_5x', reward: 'Style Guru' },
  { id: 'easter_hunter', icon: Sparkles, trigger: 'find_easter_eggs', reward: 'Secret Finder' },
  { id: 'night_owl', icon: Eye, trigger: 'dark_mode_lover', reward: 'Night Vision' }
];

const TRADING_MSGS = [
    "MARKET VOLATILITY DETECTED",
    "LIQUIDITY POOL ACTIVE",
    "WAITING FOR ENTRY SIGNAL...",
    "WHALE MOVEMENT TRACKED",
    "ANALYZE THE CHART",
    "DON'T FOMO, EXPLORE.",
    "BULLS ARE WATCHING",
    "SECURE THE BAG",
    "MOMENTUM BUILDING...",
    "SUPPORT LEVEL TESTED"
];

const MOTIVATIONAL_MSGS = [
    "YOU'RE CRUSHING IT 🔥",
    "SMOOTH OPERATOR",
    "VIBES DETECTED",
    "ELITE BROWSING",
    "NEXT LEVEL UNLOCKED"
];

// --- Data Configuration ---

const PAGE_CONTENT_MAP = [
  { id: 1, icon: Cpu, label: "CONTROL CENTER", title: "The Nerve Center", desc: "Real-time analytics and command inputs. Monitor the pulse of the market.", action: "Initialize", color: "#3b82f6" },
  { id: 2, icon: Globe, label: "WHO WE ARE", title: "Global Architects", desc: "Fintech innovators pushing the boundaries of digital finance.", action: "Our Vision", color: "#a855f7" },
  { id: 3, icon: TrendingUp, label: "MARKETS", title: "Multi-Asset Trading", desc: "Crypto, Gold, Stocks, and Forex. High leverage, low latency.", action: "View Assets", color: "#22c55e" },
  { id: 4, icon: Layers, label: "R&D LAB", title: "Wireframe vs Reality", desc: "Transforming raw data into immersive experiences.", action: "Explore Tech", color: "#f59e0b" },
  { id: 5, icon: Cast, label: "LIVESTREAM", title: "Live Feed & Blog", desc: "Direct access to our trading floor live streams.", action: "Watch Now", color: "#ef4444" },
  { id: 6, icon: Users, label: "ABOUT US", title: "Join The Cartel", desc: "Connect with thousands of traders worldwide.", action: "Contact Us", color: "#ec4899" },
];

const PAGE_CONFIG = [
  { id: 1, type: 'full', scene: "/scene1.splinecode", label: "HERO" },
  { id: 2, type: 'full', scene: "/scene.splinecode", label: "SHOWCASE" },
  { id: 3, type: 'full', scene: "/scene3.splinecode", label: "CONCEPT", disableInteraction: true },
  { id: 4, type: 'split', sceneA: "/scene4.splinecode", sceneB: "/scene5.splinecode", labelA: "WIREFRAME", labelB: "PROTOTYPE" },
  { id: 5, type: 'full', scene: "/scene2.splinecode", label: "FINAL" },
  { id: 6, type: 'full', scene: "/scene6.splinecode", label: "INTERACTIVE" },
];

const THEME_ACCENTS: Record<string, string> = {
  't01': '#3b82f6', 't02': '#a855f7', 't03': '#22c55e', 't04': '#ef4444',
  't05': '#f59e0b', 't06': '#ec4899', 't07': '#06b6d4', 'default': '#3b82f6'
};

const getThemeColor = (id: string) => THEME_ACCENTS[id] || THEME_ACCENTS['default'];

// --- Enhanced Micro-Interaction Components ---

/**
 * Command Palette (⌘K / Ctrl+K / Long-press)
 */
const CommandPalette = memo(({ 
  isOpen, 
  onClose, 
  onNavigate, 
  onThemeChange, 
  onMusicToggle,
  onShowAchievements,
  onShowDebug,
  currentPage,
  currentTheme,
  isMuted,
  accentColor,
  allThemes
}: any) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo(() => [
    // Navigation
    ...PAGE_CONTENT_MAP.map((page, i) => ({
      id: `nav-${page.id}`,
      label: `Go to ${page.title}`,
      category: 'Navigation',
      icon: page.icon,
      action: () => onNavigate(i),
      keywords: [page.label, page.title, 'page', 'navigate', 'jump']
    })),
    // Themes
    ...Object.keys(allThemes || {}).map((themeId) => ({
      id: `theme-${themeId}`,
      label: `Switch to ${allThemes[themeId]?.name || themeId}`,
      category: 'Themes',
      icon: Palette,
      action: () => onThemeChange(themeId),
      keywords: ['theme', 'color', 'style', allThemes[themeId]?.name]
    })),
    // Actions
    {
      id: 'music-toggle',
      label: isMuted ? 'Play Music' : 'Pause Music',
      category: 'Actions',
      icon: isMuted ? Play : Pause,
      action: onMusicToggle,
      keywords: ['music', 'audio', 'sound', isMuted ? 'play' : 'pause']
    },
    {
      id: 'achievements',
      label: 'View Achievements',
      category: 'Actions',
      icon: Trophy,
      action: onShowAchievements,
      keywords: ['achievement', 'badge', 'trophy', 'unlock']
    },
    {
      id: 'debug',
      label: 'Debug Dashboard',
      category: 'Actions',
      icon: Settings,
      action: onShowDebug,
      keywords: ['debug', 'dev', 'stats', 'analytics']
    }
  ], [allThemes, isMuted, onNavigate, onThemeChange, onMusicToggle, onShowAchievements, onShowDebug]);

  const filtered = useMemo(() => {
    if (!search) return commands;
    const lower = search.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(lower) ||
      cmd.keywords.some(k => k?.toLowerCase().includes(lower))
    );
  }, [search, commands]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSelected(0);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(prev => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selected]) {
          filtered[selected].action();
          onClose();
          playTick('sharp');
          triggerHaptic(20);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selected, onClose]);

  if (!isOpen) return null;

  const categories = [...new Set(filtered.map(c => c.category))];

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: `0 0 40px ${accentColor}20` }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <Search size={20} className="text-white/50" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-white/30"
          />
          <kbd className="hidden md:inline-flex px-2 py-1 text-xs font-mono text-white/50 bg-white/5 rounded border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-white/50 text-sm">
              No commands found
            </div>
          ) : (
            categories.map(category => (
              <div key={category} className="mb-4">
                <div className="px-3 py-2 text-xs font-mono text-white/40 uppercase tracking-wider">
                  {category}
                </div>
                {filtered
                  .filter(cmd => cmd.category === category)
                  .map((cmd, index) => {
                    const globalIndex = filtered.indexOf(cmd);
                    const isSelected = globalIndex === selected;
                    const Icon = cmd.icon;
                    
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          onClose();
                          playTick('sharp');
                          triggerHaptic(20);
                        }}
                        onMouseEnter={() => setSelected(globalIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                          isSelected 
                            ? 'bg-white/10 text-white' 
                            : 'text-white/70 hover:bg-white/5'
                        }`}
                        style={{
                          borderLeft: isSelected ? `3px solid ${accentColor}` : '3px solid transparent'
                        }}
                      >
                        <Icon size={18} style={{ color: isSelected ? accentColor : undefined }} />
                        <span className="flex-1 font-medium">{cmd.label}</span>
                        {isSelected && (
                          <kbd className="px-2 py-0.5 text-xs font-mono bg-white/10 rounded border border-white/20">
                            ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/5">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↵</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">ESC</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Debug Dashboard - Session Replay Stats
 */
const DebugDashboard = memo(({ isOpen, onClose, recorder, performance, accentColor }: any) => {
  const [stats, setStats] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!isOpen || !recorder) return;
    
    const update = () => setStats(recorder.getStats());
    update();
    
    if (!autoRefresh) return;
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isOpen, recorder, autoRefresh]);

  const downloadSession = () => {
    const data = recorder.export();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerHaptic(20);
    playTick('sharp');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">Debug Dashboard</h2>
            <p className="text-sm text-white/50 font-mono">Session Replay & Performance</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              {autoRefresh ? 'LIVE' : 'PAUSED'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Performance Level */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Gauge size={16} style={{ color: accentColor }} />
                <span className="text-xs font-mono text-white/50 uppercase">Performance</span>
              </div>
              <div className="text-2xl font-black text-white">{performance.level.toUpperCase()}</div>
              <div className="text-xs text-white/40 mt-1">
                {performance.isOverridden ? 'Manual Override' : 'Auto-Detected'}
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} style={{ color: accentColor }} />
                <span className="text-xs font-mono text-white/50 uppercase">Events/Min</span>
              </div>
              <div className="text-2xl font-black text-white">{stats?.eventsPerMinute || 0}</div>
              <div className="text-xs text-white/40 mt-1">
                {stats?.totalEvents || 0} total events
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} style={{ color: accentColor }} />
                <span className="text-xs font-mono text-white/50 uppercase">Avg Velocity</span>
              </div>
              <div className="text-2xl font-black text-white">{stats?.avgScrollVelocity || 0}</div>
              <div className="text-xs text-white/40 mt-1">px/sec</div>
            </div>
          </div>

          {/* Page Dwell Times */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 size={16} style={{ color: accentColor }} />
              Page Dwell Times
            </h3>
            <div className="space-y-2">
              {stats?.pageDwellTimes && Object.entries(stats.pageDwellTimes).map(([page, time]: any) => {
                const totalTime = Object.values(stats.pageDwellTimes).reduce((a: any, b: any) => a + b, 0);
              
                return (
                  <div key={page} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70">Page {page}</span>
                      <span className="text-white/50 font-mono">{(time / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                         
                          backgroundColor: accentColor
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interaction Heatmap */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Target size={16} style={{ color: accentColor }} />
              Interaction Heatmap
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {stats?.interactionHeatmap && Object.entries(stats.interactionHeatmap)
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 10)
                .map(([key, count]: any) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <span className="text-xs text-white/70 font-mono truncate">{key}</span>
                    <span 
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ 
                        backgroundColor: `${accentColor}20`,
                        color: accentColor
                      }}
                    >
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={downloadSession}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              <Download size={16} />
              Export Session
            </button>
            <button
              onClick={() => {
                recorder.clear();
                triggerHaptic(15);
                playTick('medium');
              }}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              Clear Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Magnetic Button - pulls toward cursor on proximity (respects performance)
 */
const MagneticButton = memo(({ children, onClick, className = "", accentColor, disabled = false, performanceLevel = 'high' }: any) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [isNear, setIsNear] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!btnRef.current || performanceLevel === 'low' || disabled) return;
    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));
    
    if (distance < 150) {
      setIsNear(true);
      if (performanceLevel === 'high') {
        const pullX = (e.clientX - centerX) * 0.3;
        const pullY = (e.clientY - centerY) * 0.3;
        btnRef.current.style.transform = `translate(${pullX}px, ${pullY}px) scale(1.05)`;
      } else {
        btnRef.current.style.transform = 'scale(1.02)';
      }
    } else {
      setIsNear(false);
      btnRef.current.style.transform = '';
    }
  }, [performanceLevel, disabled]);

  useEffect(() => {
    if (performanceLevel === 'low' || disabled) return;
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove, performanceLevel, disabled]);

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      disabled={disabled}
      className={`transition-all duration-200 ease-out ${className}`}
      style={{ 
        boxShadow: (isNear && performanceLevel !== 'low') ? `0 0 20px ${accentColor}40` : 'none',
        borderColor: isNear ? accentColor : undefined
      }}
    >
      {children}
    </button>
  );
});

/**
 * Scroll Velocity Indicator - shows speed with color/glow
 */
const ScrollVelocityIndicator = memo(({ accentColor }: { accentColor: string }) => {
  const [velocity, setVelocity] = useState(0);
  const lastScrollRef = useRef(0);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    let animFrame: number;
    const handleScroll = () => {
      const now = Date.now();
      const deltaTime = now - lastTimeRef.current;
      const deltaScroll = Math.abs(window.scrollY - lastScrollRef.current);
      const speed = Math.min((deltaScroll / deltaTime) * 10, 100);
      
      setVelocity(speed);
      lastScrollRef.current = window.scrollY;
      lastTimeRef.current = now;
      
      animFrame = requestAnimationFrame(() => {
        setVelocity(v => v * 0.9);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  if (velocity < 5) return null;

  return (
    <div className="fixed top-1/2 left-2 z-50 pointer-events-none">
      <div 
        className="w-1 h-20 rounded-full transition-all duration-100"
        style={{
          background: `linear-gradient(to bottom, ${accentColor}, transparent)`,
          opacity: velocity / 100,
          boxShadow: `0 0 ${velocity}px ${accentColor}`
        }}
      />
    </div>
  );
});

/**
 * Progress Ghost - shows scroll position with parallax trail
 */
const ProgressGhost = memo(({ activePage, totalPages, accentColor }: any) => {
  const progress = ((activePage - 1) / (totalPages - 1)) * 100;
  
  return (
    <div className="fixed right-2 top-0 bottom-0 w-0.5 bg-white/5 z-40 pointer-events-none hidden md:block">
      <div 
        className="absolute left-0 w-full transition-all duration-500 ease-out"
        style={{
          height: `${progress}%`,
          background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}80)`,
          boxShadow: `0 0 10px ${accentColor}`
        }}
      />
      {/* Ghost trail */}
      <div 
        className="absolute left-0 w-full blur-sm opacity-50 transition-all duration-700"
        style={{
          height: `${Math.max(0, progress - 10)}%`,
          background: `linear-gradient(to bottom, transparent, ${accentColor}40)`,
        }}
      />
    </div>
  );
});

/**
 * Contextual Helper - appears on hesitation
 */
const ContextualHelper = memo(({ message, accentColor }: { message: string, accentColor: string }) => {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setShow(false);
      timeoutRef.current = setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('scroll', resetTimer);
    
    resetTimer();
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-black/80 backdrop-blur-xl border px-4 py-2 rounded-full text-xs font-mono text-white/70"
        style={{ borderColor: `${accentColor}40` }}
      >
        💡 {message}
      </div>
    </div>
  );
});

/**
 * Achievement Toast
 */
const AchievementToast = memo(({ achievement, onDismiss }: any) => {
  const Icon = achievement.icon;
  
  useEffect(() => {
    triggerHaptic([50, 100, 50]);
    playTick('sharp');
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed top-24 right-4 z-[60] animate-in slide-in-from-right-4 fade-in duration-500">
      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-4 shadow-2xl max-w-xs">
        <div className="flex items-start gap-3">
          <div className="flex-none w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Icon size={20} className="text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono text-yellow-400 mb-1">ACHIEVEMENT UNLOCKED</div>
            <div className="text-sm font-bold text-white">{achievement.reward}</div>
          </div>
          <Trophy size={16} className="text-yellow-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
});

/**
 * Inactivity Nudge - Enhanced with more personality
 */
const InactivityNudge = ({ accentColor }: { accentColor: string }) => {
    const [idle, setIdle] = useState(false);
    const [msg, setMsg] = useState(TRADING_MSGS[0]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = useCallback(() => {
        if(idle) {
            setIdle(false);
            setMsg(TRADING_MSGS[Math.floor(Math.random() * TRADING_MSGS.length)]);
        }
        if(timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setIdle(true), 8000);
    }, [idle]);

    useEffect(() => {
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('touchstart', resetTimer);
        window.addEventListener('scroll', resetTimer);
        window.addEventListener('click', resetTimer);
        resetTimer();
        return () => {
            if(timerRef.current) clearTimeout(timerRef.current);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('touchstart', resetTimer);
            window.removeEventListener('scroll', resetTimer);
            window.removeEventListener('click', resetTimer);
        };
    }, [resetTimer]);

    if (!idle) return null;

    return (
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-all duration-1000" />
            <div className="relative z-10 text-center px-4">
                <Activity size={48} style={{ color: accentColor }} className="mx-auto mb-4 animate-bounce" />
                <h2 className="text-2xl md:text-5xl font-black text-white tracking-tighter uppercase animate-pulse">
                    {msg}
                </h2>
                <p className="text-white/60 text-xs md:text-sm mt-2 font-mono animate-pulse">
                    [ SYSTEM IDLE // TAP ANYWHERE TO CONTINUE ]
                </p>
                {/* Breathing pulse effect */}
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse"
                  style={{ backgroundColor: accentColor }}
                />
            </div>
        </div>
    );
};

/**
 * Scene Wrapper - Enhanced with better interaction lock + pressure sensitivity
 */
const SceneWrapper = memo(({ isVisible, sceneUrl, allowInput = true, forceNoPointer = false, accentColor }: any) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [pressIntensity, setPressIntensity] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVisible) timer = setTimeout(() => setShouldLoad(true), 150);
    else {
        setShouldLoad(false);
        setIsFocused(false);
    }
    return () => clearTimeout(timer);
  }, [isVisible]);

  const handlePressStart = (e: any) => {
    if (!allowInput) return;
    e.stopPropagation();
    
    const startTime = Date.now();
    const pressTimer = setInterval(() => {
      const duration = Date.now() - startTime;
      setPressIntensity(Math.min(duration / 1000, 1));
    }, 50);

    const cleanup = () => {
      clearInterval(pressTimer);
      const finalDuration = Date.now() - startTime;
      
      if (finalDuration > 500) {
        // Long press - unlock with fanfare
        setIsFocused(true);
        triggerHaptic([50, 50, 100]);
        playTick('sharp');
      } else {
        // Quick tap - just unlock
        setIsFocused(!isFocused);
        triggerHaptic(isFocused ? 10 : 20);
        playTick(isFocused ? 'soft' : 'medium');
      }
      setPressIntensity(0);
    };

    if ('ontouchstart' in window) {
      const touchEnd = () => {
        cleanup();
        window.removeEventListener('touchend', touchEnd);
      };
      window.addEventListener('touchend', touchEnd);
    } else {
      const mouseUp = () => {
        cleanup();
        window.removeEventListener('mouseup', mouseUp);
      };
      window.addEventListener('mouseup', mouseUp);
    }
  };

  return (
    <div className={`w-full h-full relative transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      <div className={`w-full h-full ${isFocused ? 'pointer-events-auto touch-none' : 'pointer-events-none'}`}>
        {shouldLoad && <Suspense fallback={null}><Spline scene={sceneUrl} className="w-full h-full block object-cover" /></Suspense>}
      </div>

      {allowInput && !forceNoPointer && (
          <div 
            className={`fixed md:absolute bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${isFocused ? 'opacity-40 hover:opacity-100' : 'opacity-100'}`}
          >
              <MagneticButton 
                onClick={handlePressStart}
                onTouchStart={handlePressStart}
                className="flex items-center gap-2 px-5 py-3 md:px-4 md:py-2 rounded-full bg-black/70 backdrop-blur-xl border border-white/20 text-white text-sm md:text-xs font-bold tracking-wider active:scale-95 transition-all shadow-lg"
                accentColor={accentColor}
                style={{ 
                  borderColor: isFocused ? accentColor : pressIntensity > 0 ? `${accentColor}${Math.floor(pressIntensity * 255).toString(16)}` : 'rgba(255,255,255,0.2)',
                  boxShadow: pressIntensity > 0 ? `0 0 ${pressIntensity * 30}px ${accentColor}` : undefined
                }}
              >
                  {isFocused ? (
                      <><Unlock size={16} className="animate-pulse" /> SCROLL MODE</>
                  ) : (
                      <><Lock size={16} /> HOLD TO ENABLE 3D</>
                  )}
                  {/* Press indicator */}
                  {pressIntensity > 0 && (
                    <div 
                      className="absolute inset-0 rounded-full border-2 transition-all"
                      style={{ 
                        borderColor: accentColor,
                        transform: `scale(${1 + pressIntensity * 0.2})`,
                        opacity: 1 - pressIntensity
                      }}
                    />
                  )}
              </MagneticButton>
          </div>
      )}
      
      {!isFocused && allowInput && isVisible && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300">
             <div className="bg-black/80 backdrop-blur-xl px-4 py-2 rounded-full text-white/70 text-xs font-mono border border-white/10">
                 👆 HOLD TO INTERACT WITH 3D
             </div>
         </div>
      )}
    </div>
  );
});

const ScrambleText = ({ text, isActive, className = "" }: { text: string, isActive: boolean, className?: string }) => {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    if (!isActive) { setDisplay(text); return; }
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplay(text.split("").map((l, i) => i < iterations ? text[i] : chars[Math.floor(Math.random() * chars.length)]).join(""));
      if (iterations >= text.length) clearInterval(interval);
      iterations += 1 / 2;
    }, 30);
    return () => clearInterval(interval);
  }, [text, isActive]);
  return <span className={className}>{display}</span>;
};

/**
 * Enhanced Left Panel - Mobile-first, collapsible
 */
const LeftInfoPanel = memo(({ activePage, accentColor, onAction }: any) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const content = PAGE_CONTENT_MAP[activePage - 1] || PAGE_CONTENT_MAP[0];
  const Icon = content.icon;

  return (
    <>
      {/* Desktop Version */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col max-w-[320px] pointer-events-none">
        <div className="relative pointer-events-auto">
          <div className="absolute -left-6 top-0 bottom-0 w-[2px] bg-white/10">
            <div 
              className="absolute w-[2px] bg-white transition-all duration-700 ease-out" 
              style={{ 
                height: '60px', 
                top: `${(activePage - 1) * 60}px`, 
                boxShadow: `0 0 15px ${accentColor}`,
                backgroundColor: accentColor
              }} 
            />
          </div>
          <div key={content.id} className="pl-4 animate-in slide-in-from-left-4 fade-in duration-500">
            <div className="flex items-center gap-3 mb-2 text-white/50">
               <div className="p-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md transition-all hover:scale-110 hover:bg-white/10">
                  <Icon size={16} style={{ color: accentColor }} />
               </div>
               <span className="text-xs font-mono tracking-[0.2em]">{content.label}</span>
            </div>
            <h2 className="text-4xl font-black text-white mb-4 leading-none tracking-tight hover:tracking-wide transition-all duration-300">
              <ScrambleText text={content.title} isActive={true} />
            </h2>
            <p className="text-sm text-white/70 leading-relaxed mb-6 border-l-2 border-white/10 pl-4 hover:border-white/30 transition-colors">
              {content.desc}
            </p>
            <MagneticButton 
              onClick={() => {
                onAction(content.id);
                playTick('medium');
              }}
              className="group flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider hover:gap-4 transition-all"
              accentColor={accentColor}
            >
              <span className="w-8 h-[2px] transition-all group-hover:w-12" style={{ backgroundColor: accentColor }} />
              {content.action}
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accentColor }} />
            </MagneticButton>
          </div>
        </div>
      </div>

      {/* Tablet Version - Collapsible */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex lg:hidden flex-col pointer-events-auto">
        <button
          onClick={() => {
            setIsExpanded(!isExpanded);
            triggerHaptic(10);
          }}
          className="mb-2 p-2 bg-black/70 backdrop-blur-xl border border-white/10 rounded-lg hover:bg-white/10 transition-all"
          style={{ borderColor: isExpanded ? accentColor : undefined }}
        >
          {isExpanded ? <ChevronUp size={16} style={{ color: accentColor }} /> : <ChevronDown size={16} className="text-white/50" />}
        </button>
        
        {isExpanded && (
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 max-w-[280px] animate-in slide-in-from-left-4 fade-in duration-300">
            <div className="flex items-center gap-2 mb-3">
              <Icon size={14} style={{ color: accentColor }} />
              <span className="text-[10px] font-mono tracking-widest text-white/50">{content.label}</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{content.title}</h3>
            <p className="text-xs text-white/60 leading-tight mb-4">{content.desc}</p>
            <button 
              onClick={() => onAction(content.id)}
              className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all"
              style={{ color: accentColor }}
            >
              {content.action} <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </>
  );
});

/**
 * Enhanced Mobile Card - Swipeable, glassmorphic
 */
const MobileInfoCard = memo(({ activePage, accentColor, onAction }: any) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startXRef = useRef(0);
  
  const content = PAGE_CONTENT_MAP[activePage - 1] || PAGE_CONTENT_MAP[0];
  const Icon = content.icon;

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startXRef.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragOffset) > 100) {
      // Swipe action detected
      triggerHaptic([10, 20, 10]);
      playTick('sharp');
    }
    setDragOffset(0);
  };

  return (
    <div 
      className="fixed bottom-20 left-4 right-4 z-40 lg:hidden pointer-events-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${dragOffset}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      <div className="bg-gradient-to-br from-black/90 to-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden group active:scale-[0.98] transition-transform">
        {/* Animated gradient overlay */}
        <div 
          className="absolute inset-0 opacity-10 transition-opacity group-active:opacity-20"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${accentColor}, transparent 70%)`
          }}
        />
        
        {/* Top accent line with shimmer */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent overflow-hidden">
          <div 
            className="h-full w-1/3 absolute animate-shimmer"
            style={{ 
              background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              animation: 'shimmer 3s infinite'
            }}
          />
        </div>
        
        <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-active:scale-110"
                      style={{ backgroundColor: `${accentColor}20`, border: `1px solid ${accentColor}40` }}
                    >
                      <Icon size={16} style={{ color: accentColor }} />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase">{content.label}</span>
                </div>
                <h3 className="text-2xl font-black text-white leading-none mb-3 tracking-tight">{content.title}</h3>
                <p className="text-sm text-white/70 leading-snug mb-4">{content.desc}</p>
                
                <button 
                  onClick={() => {
                    onAction(content.id);
                    triggerHaptic(15);
                    playTick('medium');
                  }}
                  className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-all active:scale-95"
                  style={{ color: accentColor }}
                >
                  <span className="w-8 h-[2px]" style={{ backgroundColor: accentColor }} />
                  {content.action}
                  <ChevronRight size={14} />
                </button>
            </div>
            
            {/* Side action button */}
            <button 
                className="flex-none mt-2 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all shadow-lg hover:bg-white/10"
                onClick={() => {
                  onAction(content.id);
                  triggerHaptic(20);
                }}
                style={{ 
                  borderColor: `${accentColor}40`,
                  boxShadow: `0 0 20px ${accentColor}20`
                }}
            >
                <ChevronRight size={24} style={{ color: accentColor }} />
            </button>
        </div>

        {/* Drag indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full" />
      </div>
    </div>
  );
});

/**
 * Enhanced Navigation Rail - Velocity-based snap, hover previews
 */
const NavigationRail = memo(({ activePage, onNavigate, accentColor, totalPages }: any) => {
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);
  const [scrollVelocity, setScrollVelocity] = useState(0);

  return (
    <div className="fixed right-3 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 md:gap-6 items-center pointer-events-auto">
      {PAGE_CONTENT_MAP.map((page, index) => {
        const isActive = activePage === page.id;
        const isHovered = hoveredPage === page.id;
        
        return (
          <div 
            key={page.id} 
            className="group relative flex items-center justify-end"
            onMouseEnter={() => setHoveredPage(page.id)}
            onMouseLeave={() => setHoveredPage(null)}
          >
             {/* Desktop Tooltip - Enhanced */}
            <div 
              className={`hidden md:block absolute right-16 bg-black/95 backdrop-blur-xl border rounded-xl px-4 py-3 transition-all duration-300 origin-right ${
                isActive || isHovered ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-90 translate-x-4'
              }`}
              style={{ 
                borderColor: isActive ? accentColor : 'rgba(255,255,255,0.1)',
                boxShadow: isActive ? `0 0 20px ${accentColor}40` : 'none'
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <page.icon size={12} style={{ color: accentColor }} />
                <div className="text-[10px] font-mono tracking-wider text-white/50">{page.label}</div>
              </div>
              <div className="text-sm font-bold text-white whitespace-nowrap">{page.title}</div>
              
              {/* Arrow */}
              <div 
                className="absolute top-1/2 -right-2 -mt-2 w-4 h-4 rotate-45 transform"
                style={{ 
                  backgroundColor: isActive ? accentColor : '#000',
                  borderRight: `1px solid ${isActive ? accentColor : 'rgba(255,255,255,0.1)'}`,
                  borderBottom: `1px solid ${isActive ? accentColor : 'rgba(255,255,255,0.1)'}`
                }}
              />
            </div>

            {/* Mobile Label */}
            {(isActive || isHovered) && (
              <div className="md:hidden absolute right-12 bg-black/90 backdrop-blur-xl border border-white/10 px-3 py-1 rounded-lg animate-in fade-in slide-in-from-right-2 duration-200">
                <span className="text-[10px] font-mono text-white/70 tracking-wider">{page.label}</span>
              </div>
            )}
            
            <button 
              onClick={() => {
                onNavigate(index);
                triggerHaptic(15);
                playTick('medium');
              }}
              className="relative w-10 h-10 md:w-4 md:h-14 flex items-center justify-center focus:outline-none active:scale-90 transition-transform touch-manipulation"
            >
              {/* Glow effect */}
              <div 
                className={`absolute inset-0 rounded-full transition-all duration-500 blur-xl ${
                  isActive ? 'opacity-70' : 'opacity-0 group-hover:opacity-40 group-active:opacity-60'
                }`} 
                style={{ backgroundColor: accentColor }} 
              />
              
              {/* Main dot */}
              <div 
                className={`relative z-10 rounded-full transition-all duration-500 ease-out ${
                  isActive 
                    ? 'w-2.5 md:w-2 h-5 md:h-12 bg-white' 
                    : 'w-2 md:w-1.5 h-2 md:h-3 bg-white/40 group-hover:bg-white group-hover:h-7 group-active:scale-110'
                }`}
                style={{
                  boxShadow: isActive ? `0 0 15px ${accentColor}` : 'none'
                }}
              />
              
              {/* Ripple on tap */}
              {isActive && (
                <div 
                  className="absolute inset-0 rounded-full animate-ping opacity-75"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
});

/**
 * Enhanced Draggable Split Section
 */
const DraggableSplitSection = memo(({ config, activePage, onVisible, accentColor }: any) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [splitPos, setSplitPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [dragVelocity, setDragVelocity] = useState(0);
  const lastPosRef = useRef(50);
  const lastTimeRef = useRef(Date.now());
  
  const isActive = config.id === activePage;
  const shouldRender = Math.abs(config.id - activePage) <= 1;

  const handleDrag = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPos = Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 10), 90);
    
    // Calculate velocity for snap effect
    const now = Date.now();
    const deltaTime = now - lastTimeRef.current;
    const deltaPos = Math.abs(newPos - lastPosRef.current);
    const velocity = deltaPos / deltaTime;
    
    setDragVelocity(velocity);
    setSplitPos(newPos);
    lastPosRef.current = newPos;
    lastTimeRef.current = now;
  }, []);

  const onMouseDown = () => {
    setIsDragging(true);
    triggerHaptic(10);
  };
  
  useEffect(() => {
    if (!isDragging) return;
    const move = (e: MouseEvent) => handleDrag(e.clientX);
    const up = () => {
      setIsDragging(false);
      triggerHaptic(5);
      playTick('soft');
      
      // Snap to center if close
      if (Math.abs(splitPos - 50) < 5) {
        setSplitPos(50);
        triggerHaptic([10, 20]);
      }
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { 
      window.removeEventListener('mousemove', move); 
      window.removeEventListener('mouseup', up); 
    };
  }, [isDragging, handleDrag, splitPos]);

  const onTouchStart = () => {
    setIsDragging(true);
    triggerHaptic(10);
  };
  const onTouchMove = (e: React.TouchEvent) => { 
    if (isDragging) handleDrag(e.touches[0].clientX); 
  };
  const onTouchEnd = () => {
    setIsDragging(false);
    triggerHaptic(5);
    
    if (Math.abs(splitPos - 50) < 5) {
      setSplitPos(50);
      triggerHaptic([10, 20]);
    }
  };

  useEffect(() => { 
    if (containerRef.current) onVisible(containerRef.current, config.id - 1); 
  }, [onVisible, config.id]);

  return (
    <section ref={containerRef} className="relative w-full h-[100dvh] flex-none snap-start snap-always overflow-hidden bg-black flex flex-row touch-pan-y">
      <div style={{ width: `${splitPos}%` }} className="relative h-full overflow-hidden border-r border-white/10 transition-[width] duration-75 ease-linear">
        <div className="absolute inset-0 w-screen h-full">
          <SceneWrapper isVisible={shouldRender} sceneUrl={config.sceneA} forceNoPointer={isDragging} accentColor={accentColor} />
        </div>
        <div className={`absolute top-24 md:top-32 left-4 md:left-20 z-20 transition-all duration-700 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
          <div className="text-2xl md:text-5xl font-black text-white mb-2">{config.labelA}</div>
          <div className="text-xs font-mono text-white/50 border border-white/20 rounded-lg px-3 py-1.5 inline-block backdrop-blur-sm">
            LOW FIDELITY
          </div>
        </div>
      </div>

      {/* Enhanced Divider */}
      <div 
        onMouseDown={onMouseDown} 
        onTouchStart={onTouchStart} 
        onTouchMove={onTouchMove} 
        onTouchEnd={onTouchEnd}
        className="absolute top-0 bottom-0 z-50 w-20 -ml-10 cursor-col-resize flex items-center justify-center group touch-none" 
        style={{ left: `${splitPos}%` }}
      >
        {/* Glow line */}
        <div 
          className="w-[2px] h-full transition-all duration-200" 
          style={{
            backgroundColor: isDragging ? accentColor : 'rgba(255,255,255,0.3)',
            boxShadow: isDragging ? `0 0 20px ${accentColor}, 0 0 40px ${accentColor}80` : '0 0 10px rgba(255,255,255,0.2)'
          }}
        />
        
        {/* Control handle */}
        <div 
          className="absolute w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all group-active:scale-110"
          style={{ 
            backgroundColor: isDragging ? `${accentColor}40` : 'rgba(0,0,0,0.7)',
            borderWidth: '2px',
            borderColor: isDragging ? accentColor : 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <GripVertical 
            size={24} 
            className={`transition-colors ${isDragging ? 'text-white' : 'text-white/70'}`}
          />
          
          {/* Velocity indicator rings */}
          {isDragging && dragVelocity > 0.5 && (
            <>
              <div 
                className="absolute inset-0 rounded-full animate-ping opacity-50"
                style={{ borderWidth: '2px', borderColor: accentColor }}
              />
              <div 
                className="absolute inset-0 rounded-full animate-pulse opacity-30"
                style={{ backgroundColor: accentColor }}
              />
            </>
          )}
        </div>

        {/* Snap indicator */}
        {Math.abs(splitPos - 50) < 8 && !isDragging && (
          <div className="absolute top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-xl border border-white/20 rounded-full px-3 py-1 -mt-20 animate-bounce">
            <div className="text-[10px] font-mono text-white/70 flex items-center gap-1">
              <Target size={10} style={{ color: accentColor }} />
              CENTERED
            </div>
          </div>
        )}
      </div>

      <div style={{ width: `${100 - splitPos}%` }} className="relative h-full overflow-hidden transition-[width] duration-75 ease-linear">
        <div className="absolute inset-0 w-screen h-full -left-[100vw] translate-x-full">
            <div className="w-full h-full absolute right-0">
              <SceneWrapper isVisible={shouldRender} sceneUrl={config.sceneB} forceNoPointer={isDragging} accentColor={accentColor} />
            </div>
        </div>
        <div className={`absolute bottom-24 md:bottom-32 right-4 md:right-24 z-20 text-right transition-all duration-700 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
          <div className="text-2xl md:text-5xl font-black text-white mb-2" style={{ color: accentColor }}>
            {config.labelB}
          </div>
          <div className="text-xs font-mono text-white/50 border border-white/20 rounded-lg px-3 py-1.5 inline-block backdrop-blur-sm">
            HIGH FIDELITY
          </div>
        </div>
      </div>
    </section>
  );
});

/**
 * Floating Action Bubble - Quick actions
 */
const FloatingActionBubble = memo(({ accentColor, onThemeToggle, onMusicToggle, isMuted }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3 md:hidden pointer-events-auto">
      {/* Action buttons - only show when expanded */}
      {isExpanded && (
        <>
          <MagneticButton
            onClick={() => {
              onThemeToggle();
              triggerHaptic(15);
            }}
            className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-lg active:scale-90 transition-all animate-in zoom-in fade-in duration-200"
            accentColor={accentColor}
            style={{ animationDelay: '0ms' }}
          >
            <Palette size={18} style={{ color: accentColor }} />
          </MagneticButton>
          
          <MagneticButton
            onClick={() => {
              onMusicToggle();
              triggerHaptic(15);
            }}
            className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-lg active:scale-90 transition-all animate-in zoom-in fade-in duration-200"
            accentColor={accentColor}
            style={{ animationDelay: '50ms' }}
          >
            {isMuted ? <VolumeX size={18} className="text-white/70" /> : <Volume2 size={18} style={{ color: accentColor }} />}
          </MagneticButton>
        </>
      )}

      {/* Main toggle button */}
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          triggerHaptic(isExpanded ? 10 : 20);
          playTick(isExpanded ? 'soft' : 'medium');
        }}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90"
        style={{
          background: isExpanded 
            ? `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` 
            : 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,0,0,0.8))',
          border: `2px solid ${isExpanded ? accentColor : 'rgba(255,255,255,0.1)'}`,
          backdropFilter: 'blur(20px)',
          transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)'
        }}
      >
        <ChevronRight 
          size={24} 
          className="text-white transition-transform"
          style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(90deg)' }}
        />
      </button>
    </div>
  );
});

/**
 * MAIN COMPONENT
 */
export default function Home() {
  const [currentStage, setCurrentStage] = useState<"register" | "hold" | "v2" | "content">("v2");
  const [isClient, setIsClient] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string>('t01'); 
  const [showConfigurator, setShowConfigurator] = useState(false); 
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showDebugDashboard, setShowDebugDashboard] = useState(false);
  const [isMuted, setIsMuted] = useState(true); 
  const [volume, setVolume] = useState(25);
  const [activePage, setActivePage] = useState<number>(1);
  const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]));
  const [themeChangeCount, setThemeChangeCount] = useState(0);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showAchievement, setShowAchievement] = useState<any>(null);
  const [easterEggCount, setEasterEggCount] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [lastScrollTime, setLastScrollTime] = useState(Date.now());
  
  const playerRef = useRef<any>(null);
  const [_, startTransition] = useTransition();
  const pageRefs = useRef<(HTMLElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sessionRecorder = useRef<SessionRecorder>(new SessionRecorder());
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Performance governor
  const performance = usePerformanceGovernor();

  const accentColor = useMemo(() => getThemeColor(activeThemeId), [activeThemeId]);

  // Initialize & Load State
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      // Migrate legacy storage values
      ['user_theme_id', 'vip_user_registered', 'achievements', 'theme_change_count', 'visited_pages'].forEach(key => {
        smartStorage.migrate(key);
      });
      
      const storedTheme = smartStorage.get('user_theme_id');
      const hasRegistered = smartStorage.get('vip_user_registered');
      const storedAchievements = smartStorage.get('achievements') || [];
      const storedThemeCount = smartStorage.get('theme_change_count') || 0;
      const storedVisited = smartStorage.get('visited_pages') || [1];
      
      if (storedTheme) setActiveThemeId(storedTheme);
      if (hasRegistered) setCurrentStage("content");
      setAchievements(Array.isArray(storedAchievements) ? storedAchievements : []);
      setThemeChangeCount(typeof storedThemeCount === 'number' ? storedThemeCount : 0);
      setVisitedPages(new Set(Array.isArray(storedVisited) ? storedVisited : [1]));
    }
  }, []);

  // Command Palette Keyboard Shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
        triggerHaptic(15);
        playTick('sharp');
        sessionRecorder.current.record('interaction', { type: 'command_palette_open', method: 'keyboard' });
      }
      // Debug dashboard shortcut (⌘D / Ctrl+D)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        setShowDebugDashboard(true);
        triggerHaptic(15);
        playTick('sharp');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Long-press detection for command palette (mobile)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger on empty space (not on buttons/interactive elements)
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button, a, input')) return;
      
      longPressTimer.current = setTimeout(() => {
        setShowCommandPalette(true);
        triggerHaptic([50, 100]);
        playTick('sharp');
        sessionRecorder.current.record('interaction', { type: 'command_palette_open', method: 'long_press' });
      }, 800); // 800ms long press
    };

    const handleTouchEnd = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  // Track scroll velocity
  useEffect(() => {
    if (currentStage !== 'content') return;
    
    const handleScroll = () => {
      const now = Date.now();
      const currentScrollY = window.scrollY;
      const deltaTime = now - lastScrollTime;
      const deltaScroll = Math.abs(currentScrollY - lastScrollY);
      const speed = (deltaScroll / deltaTime) * 1000; // px/sec
      
      setScrollSpeed(speed);
      setLastScrollY(currentScrollY);
      setLastScrollTime(now);

      // Record scroll event
      sessionRecorder.current.record('scroll', { 
        velocity: Math.round(speed), 
        position: currentScrollY,
        page: activePage
      });

      // Achievement: Fast scroll
      if (speed > 3000 && !achievements.find(a => a.id === 'speedster')) {
        unlockAchievement('speedster');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentStage, lastScrollY, lastScrollTime, achievements, activePage]);

  // Track page visits
  useEffect(() => {
    const newVisited = new Set(visitedPages).add(activePage);
    if (newVisited.size !== visitedPages.size) {
      setVisitedPages(newVisited);
      smartStorage.set('visited_pages', Array.from(newVisited));

      // Record page view
      sessionRecorder.current.record('page_view', { page: activePage });

      // Achievement: Visit all pages
      if (newVisited.size >= PAGE_CONFIG.length && !achievements.find(a => a.id === 'explorer')) {
        unlockAchievement('explorer');
      }
    }
  }, [activePage, visitedPages, achievements]);

  // Achievement system
  const unlockAchievement = (id: string) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement || achievements.find(a => a.id === id)) return;
    
    const newAchievements = [...achievements, achievement];
    setAchievements(newAchievements);
    smartStorage.set('achievements', newAchievements);
    setShowAchievement(achievement);
    
    // Confetti effect
    triggerHaptic([50, 100, 50, 100, 50]);
  };

  // Easter Egg Logic
  useEffect(() => {
      if(easterEggCount > 4) {
          setGlitch(true);
          triggerHaptic([50, 50, 50, 50, 200]);
          
          if (!achievements.find(a => a.id === 'easter_hunter')) {
            unlockAchievement('easter_hunter');
          }
          
          setTimeout(() => {
              setGlitch(false);
              setEasterEggCount(0);
          }, 1000);
      }
  }, [easterEggCount, achievements]);

  // Theme change tracking
  const handleThemeChange = (newThemeId: string) => {
    setActiveThemeId(newThemeId);
    smartStorage.set('user_theme_id', newThemeId);
    
    const newCount = themeChangeCount + 1;
    setThemeChangeCount(newCount);
    smartStorage.set('theme_change_count', newCount);
    
    if (newCount >= 5 && !achievements.find(a => a.id === 'theme_master')) {
      unlockAchievement('theme_master');
    }
  };

  // Intersection Observer
  useEffect(() => {
    if(currentStage !== 'content') return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = pageRefs.current.indexOf(entry.target as HTMLElement);
            if (index !== -1) {
                startTransition(() => setActivePage(index + 1));
                triggerHaptic(5);
                playTick('soft');
            }
          }
        });
      }, { threshold: 0.55 }
    );
    
    pageRefs.current.forEach((ref) => { if (ref) observerRef.current?.observe(ref); });
    return () => observerRef.current?.disconnect();
  }, [currentStage]);

  const handleRef = useCallback((el: HTMLElement | null, index: number) => { 
    pageRefs.current[index] = el; 
  }, []);
  
  const scrollToPage = (index: number) => {
    if(index < 0 || index >= PAGE_CONFIG.length) return;
    triggerHaptic(15);
    playTick('medium');
    pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleMusic = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    triggerHaptic(20);
    playTick('medium');
    if (playerRef.current) newState ? playerRef.current.mute() : playerRef.current.unMute();
  };

  const handlePageAction = (pageId: number) => {
    // Custom action per page
    console.log(`Action triggered for page ${pageId}`);
    triggerHaptic(15);
    playTick('sharp');
    
    // Record interaction
    sessionRecorder.current.record('interaction', { 
      type: 'page_action', 
      target: `page_${pageId}`,
      page: activePage
    });
    
    // Could navigate or open modal, etc.
    scrollToPage(pageId - 1);
  };

  if (!isClient) return null;

  return (
    <div className={glitch ? 'invert contrast-150 transition-all duration-100' : ''}>
      <Analytics />
      <SpeedInsights />
      
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-[999999] mix-blend-overlay" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />

      {/* Hidden YouTube player */}
      <div className="fixed opacity-0 pointer-events-none w-px h-px overflow-hidden">
        <YouTube 
          videoId={THEME_SOUNDTRACKS?.[activeThemeId] || 'jfKfPfyJRdk'} 
          opts={{ 
            playerVars: { 
              autoplay: 1, 
              controls: 0, 
              loop: 1, 
              playlist: THEME_SOUNDTRACKS?.[activeThemeId] 
            } 
          }} 
          onReady={(e: any) => { 
            playerRef.current = e.target; 
            if(!isMuted) e.target.setVolume(volume); 
          }} 
        />
      </div>

      {/* Stages */}
      {currentStage === "register" && (
        <div className="fixed inset-0 z-[100] bg-black">
          <RegisterPage onUnlock={() => {
            setCurrentStage("hold");
            smartStorage.set('vip_user_registered', true);
          }} />
        </div>
      )}
      
      {currentStage === "hold" && (
        <div className="fixed inset-0 z-[100]">
          <BullMoneyGate onUnlock={() => setCurrentStage("content")}>
            <></>
          </BullMoneyGate>
        </div>
      )}
      
      {currentStage === "v2" && (
        <div className="fixed inset-0 z-[100]">
          <MultiStepLoaderV2 onFinished={() => setCurrentStage("content")} />
        </div>
      )}

      {/* Main Content */}
      {currentStage === 'content' && (
        <>
          {/* Command Palette */}
          <CommandPalette
            isOpen={showCommandPalette}
            onClose={() => setShowCommandPalette(false)}
            onNavigate={scrollToPage}
            onThemeChange={handleThemeChange}
            onMusicToggle={toggleMusic}
            onShowAchievements={() => {
              setShowCommandPalette(false);
              // TODO: Add achievements modal
              alert('Achievements: ' + achievements.map(a => a.reward).join(', '));
            }}
            onShowDebug={() => {
              setShowCommandPalette(false);
              setShowDebugDashboard(true);
            }}
            currentPage={activePage}
            currentTheme={activeThemeId}
            isMuted={isMuted}
            accentColor={accentColor}
            allThemes={ALL_THEMES}
          />

          {/* Debug Dashboard */}
          <DebugDashboard
            isOpen={showDebugDashboard}
            onClose={() => setShowDebugDashboard(false)}
            recorder={sessionRecorder.current}
            performance={performance}
            accentColor={accentColor}
          />

          {/* Achievement Toast */}
          {showAchievement && (
            <AchievementToast 
              achievement={showAchievement} 
              onDismiss={() => setShowAchievement(null)} 
            />
          )}

          {/* Performance Indicator (Dev Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed top-20 right-4 z-[60] px-3 py-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full text-xs font-mono text-white/70">
              PERF: {performance.level.toUpperCase()}
              {performance.isOverridden && ' (MANUAL)'}
            </div>
          )}

          {/* Inactivity Nudge */}
          <InactivityNudge accentColor={accentColor} />
          
          {/* Scroll Velocity Indicator */}
          {!performance.isLow && <ScrollVelocityIndicator accentColor={accentColor} />}
          
          {/* Progress Ghost */}
          <ProgressGhost 
            activePage={activePage} 
            totalPages={PAGE_CONFIG.length} 
            accentColor={accentColor} 
          />

          {/* Contextual Helper */}
          <ContextualHelper 
            message={visitedPages.size < 3 ? "Scroll to explore all sections" : "Try changing themes in the palette menu"}
            accentColor={accentColor}
          />
          
          {/* Header */}
          <header className="fixed top-0 inset-x-0 z-50">
            <Navbar 
              setShowConfigurator={setShowConfigurator} 
              activeThemeId={activeThemeId} 
              accentColor={accentColor} 
              onThemeChange={handleThemeChange} 
            />
          </header>

          {/* Main scrollable content */}
          <main className="w-full h-[100dvh] overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black no-scrollbar relative touch-pan-y overscroll-none">
            {/* Custom Cursor - Global */}
            {!performance.isLow && (
              <TargetCursor 
                spinDuration={2} 
                hideDefaultCursor={true} 
                targetSelector="button, a, .cursor-target" 
              />
            )}
            
            {/* Keyboard Hint (Desktop) */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 hidden md:flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-xs font-mono text-white/50 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
              <Command size={12} />
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20">⌘K</kbd>
              <span>for commands</span>
            </div>
            
            {/* Info Panels */}
            <LeftInfoPanel 
              activePage={activePage} 
              accentColor={accentColor} 
              onAction={handlePageAction}
            />
            
            <MobileInfoCard 
              activePage={activePage} 
              accentColor={accentColor} 
              onAction={handlePageAction}
            />
            
            {/* Navigation Rail */}
            <NavigationRail 
              activePage={activePage} 
              onNavigate={(i: number) => scrollToPage(i)} 
              accentColor={accentColor}
              totalPages={PAGE_CONFIG.length}
            />

            {/* Desktop Bottom Controls */}
            <div className="fixed bottom-6 left-6 z-40 hidden md:flex items-end gap-3 pointer-events-auto">
              <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl transition-all hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <MagneticButton 
                  onClick={() => { 
                    setShowConfigurator(true); 
                    triggerHaptic(15); 
                    playTick('medium');
                    sessionRecorder.current.record('interaction', { type: 'theme_configurator_open', target: 'button' });
                  }} 
                  className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                  accentColor={accentColor}
                  performanceLevel={performance.level}
                >
                  <Palette size={18} style={{ color: showConfigurator ? accentColor : undefined }} />
                </MagneticButton>
                
                {/* Easter Egg Trigger */}
                <div 
                  onClick={() => {
                    setEasterEggCount(p => p+1);
                    triggerHaptic(5);
                  }} 
                  className="w-px h-4 bg-white/10 cursor-crosshair hover:bg-white/30 active:bg-white transition-colors" 
                />
                
                <MagneticButton 
                  onClick={toggleMusic} 
                  className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                  accentColor={accentColor}
                  performanceLevel={performance.level}
                >
                  {isMuted ? <VolumeX size={18}/> : <Volume2 size={18} style={{ color: accentColor }}/>}
                </MagneticButton>
                
                {!isMuted && (
                   <div className="group relative flex items-center pr-2">
                       <input 
                         type="range" 
                         min="0" 
                         max="100" 
                         value={volume} 
                         onChange={(e) => {
                           const newVol = parseInt(e.target.value);
                           setVolume(newVol);
                           if (playerRef.current) playerRef.current.setVolume(newVol);
                           triggerHaptic(2);
                         }} 
                         className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:h-1.5 transition-all" 
                         style={{ 
                           accentColor: accentColor,
                           background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${volume}%, rgba(255,255,255,0.1) ${volume}%, rgba(255,255,255,0.1) 100%)`
                         }} 
                       />
                   </div>
                )}
              </div>

              {/* Achievement Badge */}
              {achievements.length > 0 && (
                <button
                  onClick={() => {
                    // Show achievements modal
                    triggerHaptic(15);
                    playTick('medium');
                    alert('Achievements:\n' + achievements.map(a => `🏆 ${a.reward}`).join('\n'));
                  }}
                  className="relative px-3 py-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2 hover:bg-white/10 transition-all shadow-xl group"
                >
                  <Trophy size={16} className="text-yellow-400" />
                  <span className="text-xs font-bold text-white">{achievements.length}</span>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                </button>
              )}

              {/* Command Palette Button */}
              <MagneticButton
                onClick={() => {
                  setShowCommandPalette(true);
                  triggerHaptic(15);
                  playTick('sharp');
                  sessionRecorder.current.record('interaction', { type: 'command_palette_open', method: 'button' });
                }}
                className="px-3 py-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2 hover:bg-white/10 transition-all shadow-xl"
                accentColor={accentColor}
                performanceLevel={performance.level}
              >
                <Command size={16} style={{ color: accentColor }} />
                <span className="text-xs font-bold text-white">⌘K</span>
              </MagneticButton>
            </div>

            {/* Mobile Floating Action Bubble */}
            <FloatingActionBubble
              accentColor={accentColor}
              onThemeToggle={() => setShowConfigurator(true)}
              onMusicToggle={toggleMusic}
              isMuted={isMuted}
            />

            {/* Theme Configurator Modal */}
            {showConfigurator && (
              <div 
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowConfigurator(false);
                    triggerHaptic(10);
                  }
                }}
              >
                <div className="w-full max-w-6xl h-[85vh] bg-[#050505] rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
                  <MagneticButton 
                    onClick={() => {
                      setShowConfigurator(false);
                      triggerHaptic(15);
                      playTick('soft');
                    }} 
                    className="absolute top-6 right-6 z-50 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors shadow-lg"
                    accentColor={accentColor}
                    performanceLevel={performance.level}
                  >
                    <X size={24} />
                  </MagneticButton>
                  
                  <FixedThemeConfigurator 
                    initialThemeId={activeThemeId} 
                    onThemeChange={handleThemeChange} 
                  />
                </div>
              </div>
            )}

            {/* Page Sections */}
            {PAGE_CONFIG.map((page) => (
              <React.Fragment key={page.id}>
                {page.type === 'split' ? 
                  <DraggableSplitSection 
                    config={page} 
                    activePage={activePage} 
                    onVisible={handleRef} 
                    accentColor={accentColor} 
                  /> : 
                  <section 
                    ref={(el) => handleRef(el, page.id - 1)} 
                    className="relative w-full h-[100dvh] flex-none snap-start snap-always overflow-hidden bg-black flex flex-col items-center justify-center"
                  >
                    <SceneWrapper 
                      isVisible={Math.abs(page.id - activePage) <= 1} 
                      sceneUrl={page.scene} 
                      allowInput={!page.disableInteraction} 
                      accentColor={accentColor} 
                    />
                  </section>
                }
              </React.Fragment>
            ))}
          </main>
        </>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }

        /* Touch optimizations */
        button, a {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        /* Prevent overscroll bounce on mobile */
        body {
          overscroll-behavior-y: none;
        }

        /* Enhanced focus rings */
        *:focus-visible {
          outline: 2px solid ${accentColor};
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}