import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Battery,
  Bell,
  Bitcoin,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Cpu,
  Crown,
  Database,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Globe,
  GraduationCap,
  HardDrive,
  Info,
  Instagram,
  LineChart,
  Loader,
  Lock,
  MemoryStick,
  MessageCircle,
  MessageSquare,
  Monitor,
  Newspaper,
  Palette,
  Play,
  RefreshCw,
  Radio,
  Send,
  Server,
  Shield,
  Signal,
  Smartphone,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Tv,
  User,
  Users,
  Wifi,
  WifiOff,
  X,
  Youtube,
  Zap,
} from 'lucide-react';
const TradingJournal = dynamic(() => import('@/components/TradingJournal'), { ssr: false, loading: () => null });
const TradingCourse = dynamic(() => import('@/components/TradingCourse'), { ssr: false, loading: () => null });
const UltimateHubNewsTab = dynamic(
  () => import('@/components/UltimateHubNewsTab').then(m => ({ default: m.UltimateHubNewsTab })),
  { ssr: false, loading: () => null }
);
const UltimateHubLiveStreamTab = dynamic(
  () => import('@/components/UltimateHubLiveStreamTab').then(m => ({ default: m.UltimateHubLiveStreamTab })),
  { ssr: false, loading: () => null }
);
const UltimateHubAnalysisTab = dynamic(
  () => import('@/components/UltimateHubAnalysisTab').then(m => ({ default: m.UltimateHubAnalysisTab })),
  { ssr: false, loading: () => null }
);
const UltimateHubCommunityPostsTab = dynamic(
  () => import('@/components/UltimateHubCommunityPostsTab').then(m => ({ default: m.UltimateHubCommunityPostsTab })),
  { ssr: false, loading: () => null }
);
const NotificationToggle = dynamic(
  () => import('@/components/NotificationSettingsPanel').then(m => ({ default: m.NotificationToggle })),
  { ssr: false, loading: () => null }
);
const NotificationBadge = dynamic(
  () => import('@/components/NotificationSettingsPanel').then(m => ({ default: m.NotificationBadge })),
  { ssr: false, loading: () => null }
);
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import type { CalendarCountry, CalendarImpact, ChannelKey, NetworkStats, TelegramPost, UnifiedHubTab } from '@/components/ultimate-hub/types';
import { CALENDAR_COUNTRIES, TELEGRAM_CHANNELS, TRADING_SYMBOLS, UNIFIED_HUB_TABS } from '@/components/ultimate-hub/constants';
import { useResponsiveIsMobile } from '@/components/ultimate-hub/hooks/useResponsiveIsMobile';
import { useDesktopPerformance } from '@/hooks/useDesktopPerformance';
import {
  useBatteryInfo,
  useBrowserInfo,
  useGpuInfo,
  useNetworkStats,
  usePerformanceStats,
  useRealTimeMemory,
  useScreenInfo,
  useStorageInfo,
} from '@/components/ultimate-hub/hooks/useDeviceData';
import { useBrowserCapabilities } from '@/components/ultimate-hub/hooks/useBrowserCapabilities';
import { useConsoleLogs } from '@/components/ultimate-hub/hooks/useConsoleLogs';
import { calculate3DPerformanceScore, getPerformanceGrade } from '@/components/ultimate-hub/utils/performance';
import { getFpsColor } from '@/components/ultimate-hub/styles';
const ChannelCarousel = dynamic(
  () => import('@/components/ultimate-hub/components/ChannelCarousel').then(m => ({ default: m.ChannelCarousel })),
  { ssr: false, loading: () => null }
);
const HubTabCarousel = dynamic(
  () => import('@/components/ultimate-hub/components/HubTabCarousel').then(m => ({ default: m.HubTabCarousel })),
  { ssr: false, loading: () => null }
);
const TelegramChannelEmbed = dynamic(
  () => import('@/components/ultimate-hub/components/TelegramChannelEmbed').then(m => ({ default: m.TelegramChannelEmbed })),
  { ssr: false, loading: () => null }
);
const TradingTipPill = dynamic(
  () => import('@/components/ultimate-hub/components/TradingTipPill').then(m => ({ default: m.TradingTipPill })),
  { ssr: false, loading: () => null }
);
const DeviceCenterPanel = dynamic(
  () => import('@/components/ultimate-hub/components/DeviceCenterPanel').then(m => ({ default: m.DeviceCenterPanel })),
  { ssr: false, loading: () => null }
);
const ConnectionStatusBadge = dynamic(
  () => import('@/components/ultimate-hub/components/DeviceWidgets').then(m => ({ default: m.ConnectionStatusBadge })),
  { ssr: false, loading: () => null }
);
const PerformanceRing = dynamic(
  () => import('@/components/ultimate-hub/components/DeviceWidgets').then(m => ({ default: m.PerformanceRing })),
  { ssr: false, loading: () => null }
);
const StatCard = dynamic(
  () => import('@/components/ultimate-hub/components/DeviceWidgets').then(m => ({ default: m.StatCard })),
  { ssr: false, loading: () => null }
);
const FpsCandlestickChart = dynamic(
  () => import('@/components/ultimate-hub/components/FpsWidgets').then(m => ({ default: m.FpsCandlestickChart })),
  { ssr: false, loading: () => null }
);
const ModalWrapper = dynamic(
  () => import('@/components/ultimate-hub/modals/ModalWrapper').then(m => ({ default: m.ModalWrapper })),
  { ssr: false, loading: () => null }
);
const TradingModal = dynamic(
  () => import('@/components/ultimate-hub/modals/TradingModal').then(m => ({ default: m.TradingModal })),
  { ssr: false, loading: () => null }
);
const CommunityModal = dynamic(
  () => import('@/components/ultimate-hub/modals/CommunityModal').then(m => ({ default: m.CommunityModal })),
  { ssr: false, loading: () => null }
);
const BullMoneyTVModal = dynamic(
  () => import('@/components/ultimate-hub/modals/BullMoneyTVModal').then(m => ({ default: m.BullMoneyTVModal })),
  { ssr: false, loading: () => null }
);
const BrowserModal = dynamic(
  () => import('@/components/ultimate-hub/modals/BrowserModal').then(m => ({ default: m.BrowserModal })),
  { ssr: false, loading: () => null }
);

export const UnifiedHubPanel = memo(({
  isOpen,
  onClose,
  fps,
  deviceTier,
  isAdmin,
  isVip,
  userId,
  userEmail,
  prices,
  onNewMessage,
}: {
  isOpen: boolean;
  onClose: () => void;
  fps: number;
  deviceTier: string;
  isAdmin: boolean;
  isVip: boolean;
  userId?: string;
  userEmail?: string;
  prices: { xauusd: string; btcusd: string };
  onNewMessage?: (channel: string, postId: string, post?: TelegramPost) => void;
}) => {
  // Mobile detection for smoother, more subtle animations
  const isMobile = useResponsiveIsMobile();
  
  // Currency formatting - subscribe to store for reactivity
  const { formatPrice } = useCurrencyLocaleStore();
  
  const [activeTab, setActiveTab] = useState<UnifiedHubTab>('community');
  const [isDragging, setIsDragging] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevBodyOverflowRef = useRef<string>('');
  const prevBodyPaddingRef = useRef<string>('');
  const prevHtmlOverflowXRef = useRef<string>('');
  const prevHtmlOverflowYRef = useRef<string>('');
  const prevHtmlOverscrollRef = useRef<string>('');
  
  // Trading tab state
  const [selectedSymbol, setSelectedSymbol] = useState<typeof TRADING_SYMBOLS[number]>(TRADING_SYMBOLS[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarImpact, setCalendarImpact] = useState<CalendarImpact>('all');
  const [calendarCountry, setCalendarCountry] = useState<CalendarCountry>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Community tab state
  const [activeChannel, setActiveChannel] = useState<ChannelKey>('trades');
  const [copied, setCopied] = useState(false);
  
  // Indicators tab state
  const [indicatorCategory, setIndicatorCategory] = useState<'crypto' | 'stocks' | 'sentiment'>('crypto');
  
  // Broker Integration State
  const [brokerConnected, setBrokerConnected] = useState(false);
  const [brokerType, setBrokerType] = useState<'mt4' | 'mt5' | null>(null);
  const [brokerAccount, setBrokerAccount] = useState<any>(null);
  const [brokerPositions, setBrokerPositions] = useState<any[]>([]);
  const [brokerOrders, setBrokerOrders] = useState<any[]>([]);
  const [connectingBroker, setConnectingBroker] = useState(false);
  const [tradeAmount, setTradeAmount] = useState('0.01');
  const [showBrokerSetup, setShowBrokerSetup] = useState(false);
  
  // Device tab state - Get REAL device data from hooks
  const memoryStats = useRealTimeMemory();
  const browserInfo = useBrowserInfo();
  
  // Desktop performance / Lite mode
  const { liteMode, toggleLiteMode, gpuTier: desktopGpuTier, isHydrated: desktopHydrated } = useDesktopPerformance();
  const storageInfo = useStorageInfo();
  const networkStats = useNetworkStats() as NetworkStats & { runSpeedTest: () => Promise<void> };
  const perfStats = usePerformanceStats();
  const gpuInfo = useGpuInfo();
  const batteryInfo = useBatteryInfo();
  const screenInfo = useScreenInfo();
  const browserCapabilities = useBrowserCapabilities();
  const { logs: consoleLogs, clearLogs } = useConsoleLogs(100);
  
  // Calculate 3D Performance Score
  const performanceScore = calculate3DPerformanceScore(fps, memoryStats.percentage, gpuInfo.score, browserInfo.cores);
  const performanceGrade = getPerformanceGrade(performanceScore);
  
  // Broker Connection Functions
  const connectBroker = useCallback(async (type: 'mt4' | 'mt5', credentials: any) => {
    setConnectingBroker(true);
    try {
      // Call API to establish broker connection
      const response = await fetch('/api/broker/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, demo: true, ...credentials })
      });
      const data = await response.json();
      
      if (data.success) {
        setBrokerConnected(true);
        setBrokerType(type);
        setBrokerAccount(data.account);
        setBrokerPositions(data.positions || []);
        setBrokerOrders(data.orders || []);
        setShowBrokerSetup(false);
        SoundEffects.success();
        
        // Store accountId for subsequent API calls
        if (typeof window !== 'undefined' && data.account?.accountId) {
          localStorage.setItem('broker_account_id', data.account.accountId);
        }
      } else {
        alert('Failed to connect: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Broker connection error:', error);
      alert('Connection failed. Check console for details.');
    } finally {
      setConnectingBroker(false);
    }
  }, []);
  
  const disconnectBroker = useCallback(() => {
    setBrokerConnected(false);
    setBrokerType(null);
    setBrokerAccount(null);
    setBrokerPositions([]);
    setBrokerOrders([]);
    SoundEffects.click();
  }, []);
  
  const executeTrade = useCallback(async (symbol: string, side: 'buy' | 'sell', volume: string) => {
    if (!brokerConnected) {
      alert('Please connect to a broker first');
      return;
    }
    
    try {
      const accountId = typeof window !== 'undefined' 
        ? localStorage.getItem('broker_account_id') 
        : brokerAccount?.accountId;
        
      const response = await fetch('/api/broker/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accountId: accountId || 'demo-account',
          symbol, 
          side, 
          volume: parseFloat(volume)
        })
      });
      const data = await response.json();
      
      if (data.success) {
        SoundEffects.success();
        // Refresh positions
        setBrokerPositions(data.positions || brokerPositions);
        alert(`${side.toUpperCase()} order executed: ${volume} lots of ${symbol}`);
      } else {
        alert('Trade failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Trade execution error:', error);
      alert('Trade failed. Check console for details.');
    }
  }, [brokerConnected, brokerAccount, brokerPositions]);
  
  const closePosition = useCallback(async (positionId: string) => {
    if (!brokerConnected) {
      alert('Please connect to a broker first');
      return;
    }
    
    try {
      const accountId = typeof window !== 'undefined' 
        ? localStorage.getItem('broker_account_id') 
        : brokerAccount?.accountId;
        
      const response = await fetch('/api/broker/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accountId: accountId || 'demo-account',
          positionId 
        })
      });
      const data = await response.json();
      
      if (data.success) {
        SoundEffects.success();
        setBrokerPositions(data.positions || []);
        alert('Position closed successfully');
      } else {
        alert('Failed to close position: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Close position error:', error);
      alert('Failed to close position.');
    }
  }, [brokerConnected, brokerAccount]);

  // Copy device snapshot to clipboard
  const handleCopyDeviceSnapshot = useCallback(async () => {
    const snapshot = `
=== BULLMONEY DEVICE SNAPSHOT ===
Generated: ${new Date().toLocaleString()}

--- PERFORMANCE ---
FPS: ${fps}
Performance Grade: ${performanceGrade.grade} (${performanceGrade.label})
Performance Score: ${performanceScore}/100

--- DEVICE INFO ---
CPU Cores: ${browserInfo.cores}
Device RAM: ${browserInfo.deviceMemory}GB
JS Heap Used: ${memoryStats.jsHeapUsed}MB / ${memoryStats.jsHeapLimit}MB (${memoryStats.percentage}%)

--- GPU ---
Vendor: ${gpuInfo.vendor}
Renderer: ${gpuInfo.renderer}
WebGL: ${gpuInfo.webglVersion}
Tier: ${gpuInfo.tier.toUpperCase()}
Score: ${gpuInfo.score}/100

--- DISPLAY ---
Resolution: ${screenInfo.width}x${screenInfo.height}
Pixel Ratio: ${screenInfo.pixelRatio}x
Refresh Rate: ${screenInfo.refreshRate}Hz
Color Depth: ${screenInfo.colorDepth}-bit
Orientation: ${screenInfo.orientation}
HDR: ${screenInfo.hdr ? 'Yes' : 'No'}

--- NETWORK ---
Connection Type: ${networkStats.connectionType === 'wifi' ? 'WiFi' : networkStats.connectionType.toUpperCase()}
Effective Type: ${networkStats.effectiveType.toUpperCase()}
Downlink: ${networkStats.downlink}Mbps
RTT: ${networkStats.rtt}ms
Online: ${networkStats.isOnline ? 'Yes' : 'No'}

--- BATTERY ---
Supported: ${batteryInfo.supported ? 'Yes' : 'No'}
${batteryInfo.supported ? `Level: ${batteryInfo.level}%\nCharging: ${batteryInfo.charging ? 'Yes' : 'No'}` : 'Not available'}

--- BROWSER ---
Name: ${browserInfo.name}
Version: ${browserInfo.version}
Engine: ${browserInfo.engine}
Platform: ${browserInfo.platform}
Language: ${browserInfo.locale}

--- BROWSER CAPABILITIES ---
Graphics:
  WebGL 2: ${browserCapabilities.webgl2 ? '✓' : '✗'}
  WebGPU: ${browserCapabilities.webgpu ? '✓' : '✗'}

Storage:
  IndexedDB: ${browserCapabilities.indexedDb ? '✓' : '✗'}
  LocalStorage: ${browserCapabilities.localStorage ? '✓' : '✗'}
  SessionStorage: ${browserCapabilities.sessionStorage ? '✓' : '✗'}

Processing:
  Web Workers: ${browserCapabilities.webWorker ? '✓' : '✗'}
  SharedArrayBuffer: ${browserCapabilities.sharedArrayBuffer ? '✓' : '✗'}
  WebAssembly: ${browserCapabilities.webAssembly ? '✓' : '✗'}

Media:
  AudioContext: ${browserCapabilities.audioContext ? '✓' : '✗'}
  MediaRecorder: ${browserCapabilities.mediaRecorder ? '✓' : '✗'}
  MediaDevices: ${browserCapabilities.mediaDevices ? '✓' : '✗'}

Sensors:
  Accelerometer: ${browserCapabilities.accelerometer ? '✓' : '✗'}
  Gyroscope: ${browserCapabilities.gyroscope ? '✓' : '✗'}
  Magnetometer: ${browserCapabilities.magnetometer ? '✓' : '✗'}

Hardware:
  Bluetooth: ${browserCapabilities.bluetooth ? '✓' : '✗'}
  USB: ${browserCapabilities.usb ? '✓' : '✗'}
  Serial Port: ${browserCapabilities.serialPort ? '✓' : '✗'}

XR:
  VR: ${browserCapabilities.vr ? '✓' : '✗'}
  AR: ${browserCapabilities.ar ? '✓' : '✗'}

${browserCapabilities.videoCodecs.length > 0 ? `Video Codecs: ${browserCapabilities.videoCodecs.join(', ')}` : ''}
${browserCapabilities.audioCodecs.length > 0 ? `Audio Codecs: ${browserCapabilities.audioCodecs.join(', ')}` : ''}
===================================
    `.trim();

    try {
      await navigator.clipboard.writeText(snapshot);
      alert('Device snapshot copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy device snapshot:', error);
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = snapshot;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Device snapshot copied to clipboard!');
    }
  }, [fps, performanceGrade, performanceScore, browserInfo, memoryStats, gpuInfo, screenInfo, networkStats, batteryInfo, browserCapabilities]);

  // Handle drag to close (any direction)
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const distance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    if (distance > 80) {
      SoundEffects.swoosh();
      onClose();
    }
    setIsDragging(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      SoundEffects.success();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = window.location.href;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const socialLinks = useMemo(() => ([
    { name: 'Discord', icon: MessageSquare, url: 'https://discord.com/invite/9vVB44ZrNA', color: 'from-indigo-600 to-indigo-400' },
    { name: 'Telegram', icon: MessageCircle, url: 'https://t.me/bullmoneywebsite', color: 'from-sky-400 to-sky-300' },
    { name: 'Instagram', icon: Instagram, url: 'https://www.instagram.com/bullmoney.online/', color: 'from-pink-500 to-pink-300' },
    { name: 'YouTube', icon: Youtube, url: 'https://youtube.com/@bullmoney.online', color: 'from-red-600 to-red-500' },
  ]), []);

  // Calendar URL builder
  const calendarUrl = useMemo(() => {
    let url = 'https://www.tradingview.com/embed-widget/events/?locale=en#%7B%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Atrue%2C%22importanceFilter%22%3A%22';
    
    if (calendarImpact === 'high') url += '2';
    else if (calendarImpact === 'medium') url += '1%2C2';
    else if (calendarImpact === 'low') url += '0%2C1%2C2';
    else url += '-1%2C0%2C1%2C2';
    
    url += '%22';
    
    if (calendarCountry !== 'all') {
      url += `%2C%22countryFilter%22%3A%22${calendarCountry}%22`;
    }
    
    url += '%7D';
    return url;
  }, [calendarImpact, calendarCountry]);

  const colors = getFpsColor(fps);
  const enableDrag = !isMobile;
  const tabIds = useMemo(() => UNIFIED_HUB_TABS.map(tab => tab.id), []);

  const goToNextTab = useCallback(() => {
    const currentIndex = tabIds.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % tabIds.length;
    SoundEffects.click();
    setActiveTab(tabIds[nextIndex]);
  }, [activeTab, tabIds]);

  const goToPrevTab = useCallback(() => {
    const currentIndex = tabIds.indexOf(activeTab);
    const prevIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
    SoundEffects.click();
    setActiveTab(tabIds[prevIndex]);
  }, [activeTab, tabIds]);

  const tabSwitchStartXRef = useRef<number | null>(null);

  const handleTabSwitchPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    tabSwitchStartXRef.current = e.clientX;
  }, []);

  const handleTabSwitchPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (tabSwitchStartXRef.current === null) return;
    const deltaX = e.clientX - tabSwitchStartXRef.current;
    tabSwitchStartXRef.current = null;

    if (Math.abs(deltaX) > 30) {
      if (deltaX > 0) {
        goToPrevTab();
      } else {
        goToNextTab();
      }
    }
  }, [goToNextTab, goToPrevTab]);

  // Track if touch started inside a scrollable element (to prevent tab swipe)
  const touchStartedInScrollableRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    
    // Check if touch started inside a scrollable element (e.g., Telegram feed)
    // Look for elements with data-scrollable or overflow-y-auto that can scroll
    const target = e.target as HTMLElement;
    let el: HTMLElement | null = target;
    touchStartedInScrollableRef.current = false;
    
    while (el && el !== e.currentTarget) {
      // Check for scrollable containers (Telegram feed, charts, etc.)
      if (
        el.hasAttribute('data-scrollable') ||
        el.scrollHeight > el.clientHeight ||
        el.classList.contains('overflow-y-auto')
      ) {
        touchStartedInScrollableRef.current = true;
        break;
      }
      el = el.parentElement;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    
    // Don't change tabs if touch started inside a scrollable area
    if (touchStartedInScrollableRef.current) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      touchStartedInScrollableRef.current = false;
      return;
    }
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Horizontal swipe to change tabs (avoid vertical scroll gestures)
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) goToNextTab();
      else goToPrevTab();
    }
  }, [goToNextTab, goToPrevTab]);

  // Mobile swipe hint animation (continuous)
  useEffect(() => {
    if (!isOpen || !isMobile) return;
    setShowSwipeHint(true);
    return () => setShowSwipeHint(false);
  }, [isOpen, isMobile]);

  // Prevent background scroll while the hub is open (especially on mobile)
  useEffect(() => {
    if (!isOpen) return;

    const body = document.body;
    const html = document.documentElement;
    prevBodyOverflowRef.current = body.style.overflow;
    prevBodyPaddingRef.current = body.style.paddingRight;
    prevHtmlOverflowXRef.current = html.style.overflowX;
    prevHtmlOverflowYRef.current = html.style.overflowY;
    prevHtmlOverscrollRef.current = html.style.overscrollBehavior;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    body.style.overflow = 'hidden';
    html.style.overflowX = 'hidden';
    html.style.overflowY = 'hidden';
    html.style.overscrollBehavior = 'contain';

    return () => {
      body.style.overflow = prevBodyOverflowRef.current;
      body.style.paddingRight = prevBodyPaddingRef.current;
      html.style.overflowX = prevHtmlOverflowXRef.current;
      html.style.overflowY = prevHtmlOverflowYRef.current;
      html.style.overscrollBehavior = prevHtmlOverscrollRef.current;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isMobile) return;
    const root = document.documentElement;
    root.classList.add('ultimate-hub-mobile-open');
    return () => root.classList.remove('ultimate-hub-mobile-open');
  }, [isOpen, isMobile]);

  const portalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`fixed inset-0 z-[10000] flex items-stretch justify-end bg-white/80 ${isMobile ? '' : 'backdrop-blur-md'} ultimate-hub-backdrop`}
            onClick={onClose}
            style={{ pointerEvents: 'all' }}
          />

          {/* Floating Tab Control (Outside Modal) */}
          <div className="fixed inset-0 z-[10001] pointer-events-none">
            {/* Mobile: Floating tab switch button */}
            <motion.button
              onClick={goToNextTab}
              onPointerDown={handleTabSwitchPointerDown}
              onPointerUp={handleTabSwitchPointerUp}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              aria-label="Switch tab"
              className="lg:hidden pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 w-[88px] h-10 rounded-full bg-white border border-black/10 shadow-lg text-black flex items-center justify-between px-3"
            >
              <ChevronLeft className="w-4 h-4 opacity-80" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Tabs</span>
              <ChevronRight className="w-4 h-4 opacity-80" />
            </motion.button>
            
            {/* Desktop: Floating tab carousel aligned to drawer width */}
            <div className="hidden lg:block pointer-events-auto absolute right-0 w-full max-w-[88vw] sm:max-w-4xl lg:max-w-5xl z-[10002]" style={{ top: '80px' }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.1 }}
              >
                <HubTabCarousel activeTab={activeTab} setActiveTab={setActiveTab} isDesktopFloating />
              </motion.div>
            </div>
          </div>
          
          {/* Panel - Right Drawer */}
            <motion.div
            ref={panelRef}
            data-ultimate-hub
            data-panel
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="fixed right-0 top-0 z-[10003] w-full max-w-[88vw] sm:max-w-3xl lg:max-w-4xl h-[100dvh] max-h-[100dvh] overflow-y-auto bg-white text-black border-l border-black/10 shadow-2xl [&_button]:bg-black [&_button]:text-white [&_button]:border-black/90 [&_button]:hover:bg-black/90 [&_button_svg]:text-white"
            style={{ pointerEvents: 'all' }}
          >
            {/* Header with FPS Display */}
            <div className="sticky top-0 z-30 p-2.5 sm:p-3 pr-12 border-b border-black/10 bg-white/90">
              <div className="relative">
              <div className="flex items-center justify-between gap-3">
                {/* FPS Badge */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <FpsCandlestickChart fps={fps} width={60} height={36} candleCount={6} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <Activity size={12} className="text-black/70" />
                      <span className="text-lg font-black tabular-nums text-black">{fps}</span>
                      <span className="text-[8px] text-black/50 font-bold">FPS</span>
                    </div>
                    <div className="text-[9px] font-mono font-bold uppercase text-black/50 tracking-wide">{deviceTier}</div>
                  </div>
                </div>
                
                {/* Live Prices */}
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white border border-black/10 shadow-sm">
                  <div className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-black/60" />
                    <span className="text-[10px] font-bold text-black">{formatPrice(parseFloat(prices.xauusd) || 0)}</span>
                  </div>
                  <div className="w-px h-3 bg-black/10" />
                  <div className="flex items-center gap-1">
                    <Bitcoin className="w-3 h-3 text-black/60" />
                    <span className="text-[10px] font-bold text-black">{formatPrice(parseFloat(prices.btcusd) || 0)}</span>
                  </div>
                </div>
                
                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={onClose}
                  aria-label="Close ultimate hub"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black border border-black/90 flex items-center justify-center transition-all shadow-lg cursor-pointer"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1, transition: { delay: 0.1 } }}
                  exit={{ opacity: 0, scale: 0 }}
                >
                  <X className="w-4 h-4 text-white" strokeWidth={2.5} />
                </motion.button>
                
                {/* Notification Toggle Bell - Below Close Button */}
                <div className="hidden">
                  <NotificationToggle compact />
                </div>
                
                {/* Hidden Admin Button - Triple tap on header to open (Mobile friendly) */}
                {isAdmin && (
                  <motion.button
                    onTap={() => {
                      window.dispatchEvent(new CustomEvent('openAdminVIPPanel'));
                      onClose();
                    }}
                    className="absolute top-0 right-12 w-10 h-10 opacity-0"
                    aria-label="Admin Panel"
                  />
                )}
              </div>
              </div>
              
              {/* Mobile Swipe Hint - Above Tab Buttons */}
              {isMobile && showSwipeHint && (
                <motion.div
                  className="px-2.5 py-1 border-b border-black/10 bg-white/90 flex items-center justify-center gap-1.5"
                  animate={{ x: [-14, 0, 14, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ChevronLeft className="w-3 h-3 text-black/40" />
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-black/40">Swipe to change tabs</span>
                  <ChevronRight className="w-3 h-3 text-black/40" />
                </motion.div>
              )}
            </div>
            
            {/* Body: Content flows inside scrollable panel */}
            <div className="w-full">
              {/* Tab Carousel - Mobile/Tablet only (desktop has floating version above modal) */}
              <div className="lg:hidden">
                <HubTabCarousel activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>

              {/* Tab Content */}
              <div
                className="min-h-[60vh]"
                data-ultimate-hub-content
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
              <AnimatePresence mode="wait">
                {/* TRADING TAB */}
                {activeTab === 'trading' && (
                  <motion.div
                    key="trading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="min-h-[60vh] flex flex-col"
                  >
                    {/* Symbol Selector */}
                    <div className="flex-shrink-0 flex gap-1.5 sm:gap-2 p-1.5 sm:p-2.5 overflow-x-auto overflow-y-hidden border-b border-black/10 glass-surface scrollbar-none [-webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain]" style={{ touchAction: 'pan-x pinch-zoom' }}>
                      {TRADING_SYMBOLS.map(symbol => {
                        const Icon = symbol.icon;
                        const isActive = selectedSymbol.id === symbol.id;
                        return (
                          <motion.button
                            key={symbol.id}
                            onClick={() => setSelectedSymbol(symbol)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-1.5 min-w-[70px] px-3 py-2 rounded-xl text-[10px] sm:text-[11px] font-semibold whitespace-nowrap transition-all border backdrop-blur-xl ${
                              isActive
                                ? 'bg-white text-black border-black/15 neon-blue-text'
                                : 'bg-white text-black/50 border-black/10 hover:bg-black/5 hover:text-black'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>{symbol.abbr}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                    
                    {/* Chart/Calendar */}
                    <div className="flex-1 min-h-0">
                      {showCalendar ? (
                        <iframe
                          key={calendarUrl}
                          src={calendarUrl}
                          className="w-full h-full border-0"
                          title="Economic Calendar"
                        />
                      ) : (
                        <iframe
                          key={selectedSymbol.symbol}
                          src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${selectedSymbol.symbol}&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=exchange&withdateranges=1&showpopupbutton=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart`}
                          className="w-full h-full border-0"
                          title={`${selectedSymbol.name} Chart`}
                          allow="clipboard-write"
                        />
                      )}
                    </div>
                    
                    {/* Toggle & Filters */}
                    <div className="flex-shrink-0 p-2.5 space-y-2 border-t border-black/10 glass-surface">
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => setShowCalendar(!showCalendar)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border backdrop-blur-xl ${
                            showCalendar ? 'bg-white border-black/15 text-black neon-blue-text' : 'bg-white hover:bg-black/5 border-black/10 text-black/60 hover:text-black'
                          }`}
                        >
                          <Calendar className="w-4 h-4" />
                          <span>{showCalendar ? 'Show Charts' : 'Calendar'}</span>
                        </motion.button>
                        
                        {showCalendar && (
                          <motion.button
                            onClick={() => setShowFilters(!showFilters)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border backdrop-blur-xl ${
                              showFilters ? 'bg-white border-black/15 text-black neon-blue-text' : 'bg-white hover:bg-black/5 border-black/10 text-black/60 hover:text-black'
                            }`}
                          >
                            <Filter className="w-3.5 h-3.5" />
                            <span>Filters</span>
                          </motion.button>
                        )}
                      </div>
                      
                      {/* Filter Options */}
                      <AnimatePresence>
                        {showCalendar && showFilters && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 overflow-hidden"
                          >
                            {/* Impact Filter */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-black/50 w-14 flex-shrink-0">Impact:</span>
                              <div className="flex gap-1.5 flex-1">
                                {(['all', 'high', 'medium', 'low'] as CalendarImpact[]).map(impact => (
                                  <button
                                    key={impact}
                                    onClick={() => setCalendarImpact(impact)}
                                    className={`flex-1 min-w-[56px] py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap border backdrop-blur-xl ${
                                      calendarImpact === impact
                                        ? 'bg-white text-black border-black/15 neon-blue-text'
                                        : 'bg-white text-black/50 border-black/10 hover:bg-black/5 hover:text-black'
                                    }`}
                                  >
                                    {impact === 'all' ? 'All' : impact.charAt(0).toUpperCase() + impact.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Country Filter */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-black/50 w-14 flex-shrink-0">Currency:</span>
                              <div className="flex gap-1.5 flex-1 overflow-x-auto overflow-y-hidden pb-1 scrollbar-none [-webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain]" style={{ touchAction: 'pan-x pinch-zoom' }}>
                                {CALENDAR_COUNTRIES.map(country => (
                                  <button
                                    key={country.id}
                                    onClick={() => setCalendarCountry(country.id)}
                                    className={`flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap flex-shrink-0 border backdrop-blur-xl ${
                                      calendarCountry === country.id
                                        ? 'bg-white text-black border-black/15 neon-blue-text'
                                        : 'bg-white text-black/50 border-black/10 hover:bg-black/5 hover:text-black'
                                    }`}
                                  >
                                    <span>{country.flag}</span>
                                    <span>{country.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Trading Tip */}
                      <TradingTipPill />
                    </div>
                  </motion.div>
                )}
                
                {/* COMMUNITY TAB */}
                {activeTab === 'community' && (
                  <motion.div
                    key="community"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="min-h-[60vh] flex flex-col"
                  >
                    {/* Channel Carousel - Swipeable single button with left/right nav and favorites */}
                    <ChannelCarousel
                      activeChannel={activeChannel}
                      setActiveChannel={setActiveChannel}
                      isVip={isVip}
                      isAdmin={isAdmin}
                      onClose={onClose}
                    />
                    
                    {/* Feed */}
                    <div className="flex-1 min-h-0 bg-white" 
                      style={{ touchAction: 'pan-y pan-x', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
                      data-scrollable
                    >
                      <TelegramChannelEmbed channel={activeChannel} isVip={isVip} onNewMessage={onNewMessage} />
                    </div>
                    
                    {/* View All Link (mobile footer only) */}
                    {activeChannel !== 'vip' && (
                      <div className="flex-shrink-0 px-3 py-2 border-t border-black/10 glass-surface sm:hidden relative z-50">
                        <a href={`https://t.me/${TELEGRAM_CHANNELS[activeChannel].handle}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 text-[10px] text-black/80 hover:text-black transition-all relative z-50">
                          <ExternalLink className="w-2.5 h-2.5" /> View all on Telegram
                        </a>
                      </div>
                    )}
                  </motion.div>
                )}
                
                {/* INDICATORS TAB - Market Indicators & Sentiment */}
                {activeTab === 'indicators' && (
                  <motion.div
                    key="indicators"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="min-h-[60vh] flex flex-col bg-white"
                  >
                    {/* Category Tabs */}
                    <div className="flex-shrink-0 flex gap-2 p-2 sm:p-3 border-b border-black/10 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                      {(['crypto', 'stocks', 'sentiment'] as const).map(category => (
                        <motion.button
                          key={category}
                          onClick={() => setIndicatorCategory(category)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex-1 min-w-[90px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap border backdrop-blur-xl ${
                            indicatorCategory === category
                              ? 'bg-white text-black border-black/15 shadow-sm'
                              : 'bg-white/60 text-black/50 border-black/8 hover:bg-white hover:text-black'
                          }`}
                          style={indicatorCategory === category ? { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)', textShadow: 'none' } : {}}
                        >
                          {category === 'crypto' && <Bitcoin className="w-4 h-4" style={{ filter: 'none' }} />}
                          {category === 'stocks' && <TrendingUp className="w-4 h-4" style={{ filter: 'none' }} />}
                          {category === 'sentiment' && <Target className="w-4 h-4" style={{ filter: 'none' }} />}
                          <span className="neon-blue-text">{category === 'crypto' ? 'Crypto' : category === 'stocks' ? 'Stocks & Gold' : 'Sentiment'}</span>
                        </motion.button>
                      ))}
                    </div>
                    
                    {/* Crypto Indicators */}
                    {indicatorCategory === 'crypto' && (
                      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3" style={{ touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }} data-scrollable>
                        {/* Bitcoin Live Chart */}
                        <div className="border border-black/10 rounded-lg p-2 sm:p-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <h3 className="text-xs sm:text-sm font-bold neon-blue-text mb-2 flex items-center gap-2" style={{ textShadow: 'none' }}>
                            <Globe className="w-3 h-3 sm:w-4 sm:h-4" style={{ filter: 'none' }} />
                            Bitcoin Live Chart
                          </h3>
                          <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] bg-white rounded" style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch' }}>
                            <iframe
                              src="https://s.tradingview.com/embed-widget/mini-symbol-overview/?locale=en#%7B%22symbol%22%3A%22BINANCE%3ABTCUSDT%22%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22locale%22%3A%22en%22%2C%22dateRange%22%3A%221D%22%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%2C%22autosize%22%3Afalse%2C%22largeChartUrl%22%3A%22%22%7D"
                              className="w-full h-full border-0 rounded"
                              style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom' }}
                              title="Bitcoin Chart"
                            />
                          </div>
                        </div>

                        {/* Top Crypto & Markets */}
                        <div className="border border-black/10 rounded-lg p-2 sm:p-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <h3 className="text-xs sm:text-sm font-bold neon-blue-text mb-2 flex items-center gap-2" style={{ textShadow: 'none' }}>
                            <Activity className="w-3 h-3 sm:w-4 sm:h-4" style={{ filter: 'none' }} />
                            Top Markets Overview
                          </h3>
                          <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] bg-white rounded" style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch' }}>
                            <iframe
                              src="https://s.tradingview.com/embed-widget/market-quotes/?locale=en#%7B%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22symbolsGroups%22%3A%5B%7B%22name%22%3A%22Crypto%22%2C%22symbols%22%3A%5B%7B%22name%22%3A%22BINANCE%3ABTCUSDT%22%2C%22displayName%22%3A%22Bitcoin%22%7D%2C%7B%22name%22%3A%22BINANCE%3AETHUSDT%22%2C%22displayName%22%3A%22Ethereum%22%7D%2C%7B%22name%22%3A%22BINANCE%3ABNBUSDT%22%2C%22displayName%22%3A%22BNB%22%7D%2C%7B%22name%22%3A%22BINANCE%3ASOLUSDT%22%2C%22displayName%22%3A%22Solana%22%7D%5D%7D%2C%7B%22name%22%3A%22Indices%22%2C%22symbols%22%3A%5B%7B%22name%22%3A%22FOREXCOM%3ASPX500%22%2C%22displayName%22%3A%22S%26P%20500%22%7D%2C%7B%22name%22%3A%22FOREXCOM%3ANSXUSD%22%2C%22displayName%22%3A%22Nasdaq%22%7D%5D%7D%2C%7B%22name%22%3A%22Commodities%22%2C%22symbols%22%3A%5B%7B%22name%22%3A%22OANDA%3AXAUUSD%22%2C%22displayName%22%3A%22Gold%22%7D%2C%7B%22name%22%3A%22OANDA%3AXAGUSD%22%2C%22displayName%22%3A%22Silver%22%7D%5D%7D%5D%2C%22showSymbolLogo%22%3Atrue%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%2C%22locale%22%3A%22en%22%7D"
                              className="w-full h-full border-0 rounded"
                              style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom' }}
                              title="Top Markets"
                            />
                          </div>
                        </div>

                        {/* Crypto Ticker */}
                        <div className="border border-black/10 rounded-lg p-2 sm:p-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <h3 className="text-xs sm:text-sm font-bold neon-blue-text mb-2 flex items-center gap-2" style={{ textShadow: 'none' }}>
                            <Bitcoin className="w-3 h-3 sm:w-4 sm:h-4" style={{ filter: 'none' }} />
                            Live Crypto Prices
                          </h3>
                          <div className="w-full h-[50px] sm:h-[60px] bg-white rounded" style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch' }}>
                            <iframe
                              src="https://s.tradingview.com/embed-widget/ticker-tape/?locale=en#%7B%22symbols%22%3A%5B%7B%22proName%22%3A%22BITSTAMP%3ABTCUSD%22%2C%22title%22%3A%22Bitcoin%22%7D%2C%7B%22proName%22%3A%22BITSTAMP%3AETHUSD%22%2C%22title%22%3A%22Ethereum%22%7D%2C%7B%22description%22%3A%22BNB%22%2C%22proName%22%3A%22BINANCE%3ABNBUSDT%22%7D%2C%7B%22description%22%3A%22Solana%22%2C%22proName%22%3A%22BINANCE%3ASOLUSDT%22%7D%2C%7B%22description%22%3A%22XRP%22%2C%22proName%22%3A%22BINANCE%3AXRPUSDT%22%7D%2C%7B%22description%22%3A%22Cardano%22%2C%22proName%22%3A%22BINANCE%3AADAUSDT%22%7D%2C%7B%22description%22%3A%22Dogecoin%22%2C%22proName%22%3A%22BINANCE%3ADOGEUSDT%22%7D%5D%2C%22showSymbolLogo%22%3Atrue%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%2C%22displayMode%22%3A%22adaptive%22%2C%22locale%22%3A%22en%22%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%7D"
                              className="w-full h-full border-0 rounded"
                              style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom' }}
                              title="Crypto Ticker"
                            />
                          </div>
                        </div>

                        {/* Crypto Heat Map */}
                        <div className="border border-black/10 rounded-lg p-2 sm:p-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <h3 className="text-xs sm:text-sm font-bold neon-blue-text mb-2 flex items-center gap-2" style={{ textShadow: 'none' }}>
                            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" style={{ filter: 'none' }} />
                            Crypto Heat Map
                          </h3>
                          <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] bg-white rounded" style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch' }}>
                            <iframe
                              src="https://s.tradingview.com/embed-widget/crypto-coins-heatmap/?locale=en#%7B%22dataSource%22%3A%22Crypto%22%2C%22blockSize%22%3A%22market_cap_calc%22%2C%22blockColor%22%3A%22change%22%2C%22locale%22%3A%22en%22%2C%22symbolUrl%22%3A%22%22%2C%22colorTheme%22%3A%22dark%22%2C%22hasTopBar%22%3Afalse%2C%22isDataSetEnabled%22%3Afalse%2C%22isZoomEnabled%22%3Atrue%2C%22hasSymbolTooltip%22%3Atrue%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22isTransparent%22%3Afalse%7D"
                              className="w-full h-full border-0 rounded"
                              style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom' }}
                              title="Crypto Heat Map"
                            />
                          </div>
                        </div>

                        {/* Crypto Hot Lists */}
                        <div className="border border-black/10 rounded-lg p-2 sm:p-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <h3 className="text-xs sm:text-sm font-bold neon-blue-text mb-2 flex items-center gap-2" style={{ textShadow: 'none' }}>
                            <Flame className="w-3 h-3 sm:w-4 sm:h-4" style={{ filter: 'none' }} />
                            Top Gainers & Losers
                          </h3>
                          <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] bg-white rounded" style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch' }}>
                            <iframe
                              src="https://s.tradingview.com/embed-widget/hotlists/?locale=en#%7B%22colorTheme%22%3A%22dark%22%2C%22dateRange%22%3A%221D%22%2C%22exchange%22%3A%22BINANCE%22%2C%22showChart%22%3Atrue%2C%22locale%22%3A%22en%22%2C%22largeChartUrl%22%3A%22%22%2C%22isTransparent%22%3Afalse%2C%22showSymbolLogo%22%3Afalse%2C%22showFloatingTooltip%22%3Afalse%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%7D"
                              className="w-full h-full border-0 rounded"
                              style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom' }}
                              title="Hot Lists"
                            />
                          </div>
                        </div>

                        {/* Market Data */}
                        <div className="border border-black/10 rounded-lg p-2 sm:p-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <h3 className="text-xs sm:text-sm font-bold neon-blue-text mb-2 flex items-center gap-2" style={{ textShadow: 'none' }}>
                            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" style={{ filter: 'none' }} />
                            Market Data
                          </h3>
                          <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] bg-white rounded" style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch' }}>
                            <iframe
                              src="https://s.tradingview.com/embed-widget/market-quotes/?locale=en#%7B%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22symbolsGroups%22%3A%5B%7B%22name%22%3A%22Crypto%22%2C%22symbols%22%3A%5B%7B%22name%22%3A%22BINANCE%3ABTCUSDT%22%7D%2C%7B%22name%22%3A%22BINANCE%3AETHUSDT%22%7D%2C%7B%22name%22%3A%22BINANCE%3ABNBUSDT%22%7D%2C%7B%22name%22%3A%22BINANCE%3ASOLUSDT%22%7D%2C%7B%22name%22%3A%22BINANCE%3AXRPUSDT%22%7D%2C%7B%22name%22%3A%22BINANCE%3AADAUSDT%22%7D%5D%7D%5D%2C%22showSymbolLogo%22%3Atrue%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%2C%22locale%22%3A%22en%22%7D"
                              className="w-full h-full border-0 rounded"
                              style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom' }}
                              title="Market Data"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Stocks & Gold Indicators */}
                    {indicatorCategory === 'stocks' && (
                      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3" style={{ touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }} data-scrollable>
                        {/* Gold & Commodities */}
                        <div className="border border-black/10 rounded-lg p-2 sm:p-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <h3 className="text-xs sm:text-sm font-bold neon-blue-text mb-2 flex items-center gap-2" style={{ textShadow: 'none' }}>
                            <Coins className="w-3 h-3 sm:w-4 sm:h-4" style={{ filter: 'none' }} />
                            Gold & Commodities
                          </h3>
                          <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] bg-white rounded" style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch' }}>
                            <iframe
                              src="https://s.tradingview.com/embed-widget/symbol-overview/?locale=en#%7B%22symbols%22%3A%5B%5B%22OANDA%3AXAUUSD%7C1D%22%5D%2C%5B%22OANDA%3AXAGUSD%7C1D%22%5D%2C%5B%22TVC%3AUSOIL%7C1D%22%5D%5D%2C%22chartOnly%22%3Afalse%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22locale%22%3A%22en%22%2C%22colorTheme%22%3A%22dark%22%2C%22autosize%22%3Afalse%2C%22showVolume%22%3Afalse%2C%22showMA%22%3Afalse%2C%22hideDateRanges%22%3Afalse%2C%22hideMarketStatus%22%3Afalse%2C%22hideSymbolLogo%22%3Afalse%2C%22scalePosition%22%3A%22right%22%2C%22scaleMode%22%3A%22Normal%22%2C%22fontFamily%22%3A%22-apple-system%2C%20BlinkMacSystemFont%2C%20Trebuchet%20MS%2C%20Roboto%2C%20Ubuntu%2C%20sans-serif%22%2C%22fontSize%22%3A%2210%22%2C%22noTimeScale%22%3Afalse%2C%22valuesTracking%22%3A%221%22%2C%22changeMode%22%3A%22price-and-percent%22%2C%22chartType%22%3A%22area%22%2C%22lineWidth%22%3A2%2C%22lineType%22%3A0%2C%22dateRanges%22%3A%5B%221d%7C1%22%2C%221m%7C30%22%2C%223m%7C60%22%2C%2212m%7C1D%22%2C%2260m%7C1W%22%2C%22all%7C1M%22%5D%2C%22isTransparent%22%3Afalse%7D"
                              className="w-full h-full border-0 rounded"
                              style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom' }}
                              title="Gold & Commodities"
                            />
                          </div>
                        </div>

                        {/* Market Overview */}
                        <div className="border border-black/10 rounded-lg p-2 sm:p-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <h3 className="text-xs sm:text-sm font-bold neon-blue-text mb-2 flex items-center gap-2" style={{ textShadow: 'none' }}>
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" style={{ filter: 'none' }} />
                            Market Overview
                          </h3>
                          <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] bg-white rounded" style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch' }}>
                            <iframe
                              src="https://s.tradingview.com/embed-widget/market-overview/?locale=en#%7B%22colorTheme%22%3A%22dark%22%2C%22dateRange%22%3A%2212M%22%2C%22showChart%22%3Atrue%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22largeChartUrl%22%3A%22%22%2C%22isTransparent%22%3Afalse%2C%22showSymbolLogo%22%3Atrue%2C%22plotLineColorGrowing%22%3A%22rgba(59%2C130%2C246%2C1)%22%2C%22plotLineColorFalling%22%3A%22rgba(59%2C130%2C246%2C1)%22%2C%22gridLineColor%22%3A%22rgba(59%2C130%2C246%2C0.1)%22%2C%22scaleFontColor%22%3A%22rgba(59%2C130%2C246%2C1)%22%2C%22belowLineFillColorGrowing%22%3A%22rgba(59%2C130%2C246%2C0.12)%22%2C%22belowLineFillColorFalling%22%3A%22rgba(59%2C130%2C246%2C0.12)%22%2C%22symbolActiveColor%22%3A%22rgba(59%2C130%2C246%2C0.12)%22%2C%22tabs%22%3A%5B%7B%22title%22%3A%22Indices%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22FOREXCOM%3ASPX500%22%2C%22d%22%3A%22S%26P%20500%22%7D%2C%7B%22s%22%3A%22FOREXCOM%3ANSXUSD%22%2C%22d%22%3A%22Nasdaq%20100%22%7D%2C%7B%22s%22%3A%22FOREXCOM%3ADJI%22%2C%22d%22%3A%22Dow%2030%22%7D%5D%2C%22originalTitle%22%3A%22Indices%22%7D%2C%7B%22title%22%3A%22Commodities%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22OANDA%3AXAUUSD%22%2C%22d%22%3A%22Gold%22%7D%2C%7B%22s%22%3A%22OANDA%3AXAGUSD%22%2C%22d%22%3A%22Silver%22%7D%2C%7B%22s%22%3A%22TVC%3AUSOIL%22%2C%22d%22%3A%22WTI%20Crude%20Oil%22%7D%5D%2C%22originalTitle%22%3A%22Commodities%22%7D%5D%7D"
                              className="w-full h-full border-0 rounded"
                              style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom' }}
                              title="Market Overview"
                            />
                          </div>
                        </div>

                        {/* Screener */}
                        <div className="border border-black/10 rounded-lg p-2 sm:p-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <h3 className="text-xs sm:text-sm font-bold neon-blue-text mb-2 flex items-center gap-2" style={{ textShadow: 'none' }}>
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" style={{ filter: 'none' }} />
                            Stock Screener
                          </h3>
                          <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] bg-white rounded" style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch' }}>
                            <iframe
                              src="https://s.tradingview.com/embed-widget/screener/?locale=en#%7B%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22defaultColumn%22%3A%22overview%22%2C%22defaultScreen%22%3A%22general%22%2C%22market%22%3A%22america%22%2C%22showToolbar%22%3Atrue%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%7D"
                              className="w-full h-full border-0 rounded"
                              style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom' }}
                              title="Stock Screener"
                            />
                          </div>
                        </div>

                        {/* Heat Map */}
                        <div className="border border-black/10 rounded-lg p-2 sm:p-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <h3 className="text-xs sm:text-sm font-bold neon-blue-text mb-2 flex items-center gap-2" style={{ textShadow: 'none' }}>
                            <LineChart className="w-3 h-3 sm:w-4 sm:h-4" style={{ filter: 'none' }} />
                            Market Heat Map
                          </h3>
                          <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] bg-white rounded" style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch' }}>
                            <iframe
                              src="https://s.tradingview.com/embed-widget/stock-heatmap/?locale=en#%7B%22exchanges%22%3A%5B%5D%2C%22dataSource%22%3A%22SPX500%22%2C%22grouping%22%3A%22sector%22%2C%22blockSize%22%3A%22market_cap_basic%22%2C%22blockColor%22%3A%22change%22%2C%22hasTopBar%22%3Atrue%2C%22isDataSetEnabled%22%3Atrue%2C%22isZoomEnabled%22%3Atrue%2C%22hasSymbolTooltip%22%3Atrue%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%7D"
                              className="w-full h-full border-0 rounded"
                              style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom' }}
                              title="Heat Map"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Sentiment Indicators */}
                    {indicatorCategory === 'sentiment' && (
                      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3" style={{ touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }} data-scrollable>
                        {/* Economic Calendar */}
                        <div className="border border-black/10 rounded-lg p-2 sm:p-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <h3 className="text-xs sm:text-sm font-bold neon-blue-text mb-2 flex items-center gap-2" style={{ textShadow: 'none' }}>
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" style={{ filter: 'none' }} />
                            Economic Calendar
                          </h3>
                          <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] bg-white rounded" style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch' }}>
                            <iframe
                              src="https://www.tradingview.com/embed-widget/events/?locale=en#%7B%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%2C%22importanceFilter%22%3A%22-1%2C0%2C1%2C2%22%7D"
                              className="w-full h-full border-0 rounded"
                              style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom' }}
                              title="Economic Calendar"
                            />
                          </div>
                        </div>

                        {/* Crypto Timeline */}
                        <div className="border border-black/10 rounded-lg p-2 sm:p-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <h3 className="text-xs sm:text-sm font-bold neon-blue-text mb-2 flex items-center gap-2" style={{ textShadow: 'none' }}>
                            <Target className="w-3 h-3 sm:w-4 sm:h-4" style={{ filter: 'none' }} />
                            Latest Crypto News
                          </h3>
                          <div className="w-full h-[300px] sm:h-[400px] md:h-[450px] bg-white rounded" style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch', overflowY: 'auto' }}>
                            <iframe
                              src="https://s.tradingview.com/embed-widget/timeline/?locale=en#%7B%22feedMode%22%3A%22all_symbols%22%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%2C%22displayMode%22%3A%22regular%22%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22locale%22%3A%22en%22%7D"
                              className="w-full h-full border-0 rounded"
                              style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom' }}
                              title="Crypto News Timeline"
                            />
                          </div>
                        </div>

                        {/* Technical Analysis Summary */}
                        <div className="border border-black/10 rounded-lg p-2 sm:p-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <h3 className="text-xs sm:text-sm font-bold neon-blue-text mb-2 flex items-center gap-2" style={{ textShadow: 'none' }}>
                            <Activity className="w-3 h-3 sm:w-4 sm:h-4" style={{ filter: 'none' }} />
                            Technical Analysis
                          </h3>
                          <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] bg-white rounded" style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch', overflowY: 'auto' }}>
                            <iframe
                              src="https://s.tradingview.com/embed-widget/technical-analysis/?locale=en#%7B%22interval%22%3A%221m%22%2C%22width%22%3A%22100%25%22%2C%22isTransparent%22%3Afalse%2C%22height%22%3A%22100%25%22%2C%22symbol%22%3A%22BINANCE%3ABTCUSDT%22%2C%22showIntervalTabs%22%3Atrue%2C%22colorTheme%22%3A%22dark%22%7D"
                              className="w-full h-full border-0 rounded"
                              style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom' }}
                              title="Technical Analysis"
                            />
                          </div>
                        </div>

                        {/* Forex Cross Rates */}
                        <div className="border border-black/10 rounded-lg p-2 sm:p-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <h3 className="text-xs sm:text-sm font-bold neon-blue-text mb-2 flex items-center gap-2" style={{ textShadow: 'none' }}>
                            <Globe className="w-3 h-3 sm:w-4 sm:h-4" style={{ filter: 'none' }} />
                            Forex Cross Rates
                          </h3>
                          <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] bg-white rounded" style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch', overflowY: 'auto' }}>
                            <iframe
                              src="https://s.tradingview.com/embed-widget/forex-cross-rates/?locale=en#%7B%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22currencies%22%3A%5B%22EUR%22%2C%22USD%22%2C%22JPY%22%2C%22GBP%22%2C%22CHF%22%2C%22AUD%22%2C%22CAD%22%2C%22NZD%22%5D%2C%22isTransparent%22%3Afalse%2C%22colorTheme%22%3A%22dark%22%2C%22locale%22%3A%22en%22%7D"
                              className="w-full h-full border-0 rounded"
                              style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom' }}
                              title="Forex Cross Rates"
                            />
                          </div>
                        </div>

                        {/* Market Movers */}
                        <div className="border border-black/10 rounded-lg p-2 sm:p-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <h3 className="text-xs sm:text-sm font-bold neon-blue-text mb-2 flex items-center gap-2" style={{ textShadow: 'none' }}>
                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" style={{ filter: 'none' }} />
                            Market Movers
                          </h3>
                          <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] bg-white rounded" style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch', overflowY: 'auto' }}>
                            <iframe
                              src="https://s.tradingview.com/embed-widget/market-quotes/?locale=en#%7B%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22symbolsGroups%22%3A%5B%7B%22name%22%3A%22Indices%22%2C%22symbols%22%3A%5B%7B%22name%22%3A%22FOREXCOM%3ASPX500%22%7D%2C%7B%22name%22%3A%22FOREXCOM%3ANSXUSD%22%7D%2C%7B%22name%22%3A%22FOREXCOM%3ADJI%22%7D%5D%7D%2C%7B%22name%22%3A%22Commodities%22%2C%22symbols%22%3A%5B%7B%22name%22%3A%22OANDA%3AXAUUSD%22%7D%2C%7B%22name%22%3A%22TVC%3AUSOIL%22%7D%5D%7D%5D%2C%22showSymbolLogo%22%3Atrue%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%2C%22locale%22%3A%22en%22%7D"
                              className="w-full h-full border-0 rounded"
                              style={{ backgroundColor: '#f5f5f7', touchAction: 'pan-y pinch-zoom' }}
                              title="Market Movers"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                
                {/* NEWS TAB - Global News Feed for Traders */}
                {activeTab === 'news' && (
                  <motion.div
                    key="news"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="h-full overflow-hidden bg-white"
                    style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                  >
                    <UltimateHubNewsTab />
                  </motion.div>
                )}
                
                {/* LIVESTREAM TAB - BullMoney TV */}
                {activeTab === 'livestream' && (
                  <motion.div
                    key="livestream"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="h-full overflow-hidden bg-white"
                    style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                  >
                    <UltimateHubLiveStreamTab />
                  </motion.div>
                )}
                
                {/* ANALYSIS TAB - Trading Analysis & Charts */}
                {activeTab === 'analysis' && (
                  <motion.div
                    key="analysis"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="h-full overflow-hidden bg-white"
                    style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                  >
                    <UltimateHubAnalysisTab />
                  </motion.div>
                )}
                
                {/* COMMUNITY POSTS TAB - User-Generated Trade Posts */}
                {activeTab === 'posts' && (
                  <motion.div
                    key="posts"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="h-full overflow-hidden bg-white"
                    style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                  >
                    <UltimateHubCommunityPostsTab />
                  </motion.div>
                )}
                
                {/* JOURNAL TAB */}
                {activeTab === 'journal' && (
                  <motion.div
                    key="journal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="h-full overflow-hidden bg-white"
                    style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                  >
                    <TradingJournal isEmbedded onClose={onClose} />
                  </motion.div>
                )}
                
                {/* COURSE TAB */}
                {activeTab === 'course' && (
                  <motion.div
                    key="course"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="h-full bg-white overflow-hidden"
                    style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                  >
                    <TradingCourse />
                  </motion.div>
                )}
                
                {/* BROKER TAB - MT4/MT5 Integration */}
                {activeTab === 'broker' && (
                  <motion.div
                    key="broker"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="p-3 space-y-3 bg-white flex flex-col h-full min-h-0 overflow-y-auto [-webkit-overflow-scrolling:touch]"
                    style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)', touchAction: 'pan-y pan-x', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
                  >
                    {/* Connection Status */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-black/10 neon-blue-border" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full animate-pulse`} style={{ 
                          backgroundColor: brokerConnected ? '#ffffff' : '#ef4444',
                          boxShadow: brokerConnected ? '0 0 12px #ffffff' : '0 0 12px #ef4444'
                        }} />
                        <div>
                          <div className="text-sm font-bold text-black">
                            {brokerConnected ? `Connected to ${brokerType?.toUpperCase()}` : 'Not Connected'}
                          </div>
                          <div className="text-[10px] text-black/50">
                            {brokerConnected ? `Account: ${brokerAccount?.accountNumber || 'N/A'}` : 'Connect your broker to trade'}
                          </div>
                        </div>
                      </div>
                      {brokerConnected ? (
                        <motion.button
                          onClick={disconnectBroker}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1.5 rounded-lg bg-red-500/30 text-red-300 text-xs font-semibold border border-red-400/60"
                          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                        >
                          Disconnect
                        </motion.button>
                      ) : (
                        <motion.button
                          onClick={() => setShowBrokerSetup(true)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-semibold border border-black/20"
                          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                        >
                          <Zap className="w-3 h-3 inline mr-1" />Connect
                        </motion.button>
                      )}
                    </div>

                    {/* Broker Setup Modal */}
                    <AnimatePresence>
                      {showBrokerSetup && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                          onClick={() => setShowBrokerSetup(false)}
                        >
                          <motion.div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white border border-black/10 rounded-2xl p-6 max-w-md w-full mx-4 space-y-4"
                            style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-bold text-black neon-blue-text" style={{ textShadow: 'none' }}>Connect Broker</h3>
                              <button onClick={() => setShowBrokerSetup(false)} className="text-black/50 hover:text-black">
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="space-y-3">
                              {/* Broker Type Selection */}
                              <div>
                                <label className="text-xs text-black/50 mb-1 block">Broker Platform</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <motion.button
                                    onClick={() => {
                                      connectBroker('mt4', {
                                        server: 'demo.server.com',
                                        login: '12345678',
                                        password: 'demo123'
                                      });
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={connectingBroker}
                                    className="p-3 rounded-lg bg-white border border-black/15 text-black font-semibold text-sm hover:bg-black/5 disabled:opacity-50"
                                  >
                                    {connectingBroker ? 'Connecting...' : 'MetaTrader 4'}
                                  </motion.button>
                                  <motion.button
                                    onClick={() => {
                                      connectBroker('mt5', {
                                        server: 'demo.server.com',
                                        login: '87654321',
                                        password: 'demo456'
                                      });
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={connectingBroker}
                                    className="p-3 rounded-lg bg-white border border-black/15 text-black font-semibold text-sm hover:bg-black/5 disabled:opacity-50"
                                  >
                                    {connectingBroker ? 'Connecting...' : 'MetaTrader 5'}
                                  </motion.button>
                                </div>
                              </div>

                              {/* Info */}
                              <div className="p-3 rounded-lg bg-white border border-black/10">
                                <div className="flex gap-2 text-xs text-black">
                                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-semibold mb-1">Demo Mode Active</p>
                                    <p className="text-black/50">Click a platform to connect with demo credentials. For live trading, configure your MT4/MT5 API credentials in settings.</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {brokerConnected && brokerAccount && (
                      <>
                        {/* Account Overview */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 rounded-xl bg-white border border-black/10" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                            <div className="text-[10px] text-black/50 mb-1">Balance</div>
                            <div className="text-lg font-bold text-black neon-blue-text" style={{ textShadow: 'none' }}>
                              ${brokerAccount?.balance?.toLocaleString() || '10,000.00'}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-black/10" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                            <div className="text-[10px] text-black/50 mb-1">Equity</div>
                            <div className="text-lg font-bold text-black neon-blue-text" style={{ textShadow: 'none' }}>
                              ${brokerAccount?.equity?.toLocaleString() || '10,245.50'}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-black/10" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                            <div className="text-[10px] text-black/50 mb-1">Margin</div>
                            <div className="text-sm font-bold text-black">
                              ${brokerAccount?.margin?.toLocaleString() || '245.50'}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-black/10" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                            <div className="text-[10px] text-black/50 mb-1">Free Margin</div>
                            <div className="text-sm font-bold text-black">
                              ${brokerAccount?.freeMargin?.toLocaleString() || '9,754.50'}
                            </div>
                          </div>
                        </div>

                        {/* One-Click Trading */}
                        <div className="p-3 rounded-xl bg-linear-to-br from-white/20 to-white/20 border border-black/15" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-black neon-blue-text flex items-center gap-2" style={{ textShadow: 'none' }}>
                              <Zap className="w-4 h-4" style={{ filter: 'none' }} />
                              One-Click Trading
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-black/50">Lots:</span>
                              <input
                                type="number"
                                value={tradeAmount}
                                onChange={(e) => setTradeAmount(e.target.value)}
                                step="0.01"
                                min="0.01"
                                className="w-16 px-2 py-1 text-xs bg-white border border-black/10 rounded text-black font-mono"
                              />
                            </div>
                          </div>

                          {/* Quick Trade Buttons */}
                          <div className="grid grid-cols-2 gap-2">
                            <motion.button
                              onClick={() => executeTrade(selectedSymbol.id.toUpperCase(), 'buy', tradeAmount)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="p-3 rounded-lg bg-emerald-500 border border-emerald-600/30 text-white font-bold text-sm flex items-center justify-center gap-2"
                              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                            >
                              <TrendingUp className="w-4 h-4" />
                              BUY {selectedSymbol.abbr}
                            </motion.button>
                            <motion.button
                              onClick={() => executeTrade(selectedSymbol.id.toUpperCase(), 'sell', tradeAmount)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="p-3 rounded-lg bg-red-500 border border-red-600/30 text-white font-bold text-sm flex items-center justify-center gap-2"
                              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                            >
                              <TrendingDown className="w-4 h-4" />
                              SELL {selectedSymbol.abbr}
                            </motion.button>
                          </div>

                          {/* Symbol Selector */}
                          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                            {TRADING_SYMBOLS.map(sym => (
                              <button
                                key={sym.id}
                                onClick={() => setSelectedSymbol(sym)}
                                className={`flex-shrink-0 px-2 py-1 rounded text-xs font-semibold transition-all ${
                                  selectedSymbol.id === sym.id
                                    ? 'bg-black text-white border border-black/20'
                                    : 'bg-white text-black/40 border border-black/10 hover:bg-black/5'
                                }`}
                              >
                                {sym.abbr}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Open Positions */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-black flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Open Positions ({brokerPositions.length})
                          </h4>
                          {brokerPositions.length === 0 ? (
                            <div className="p-4 text-center text-black/40 text-xs border border-black/10 rounded-lg bg-white border border-black/10">
                              No open positions
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {brokerPositions.map((pos, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="p-3 rounded-lg bg-white border border-black/10" 
                                  style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                        pos.type === 'buy' ? 'bg-white text-black' : 'bg-red-500/20 text-red-400'
                                      }`}>
                                        {pos.type?.toUpperCase() || 'BUY'}
                                      </span>
                                      <span className="font-bold text-black">{pos.symbol || 'XAUUSD'}</span>
                                    </div>
                                    <motion.button
                                      onClick={() => closePosition(pos.id || idx.toString())}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="px-2 py-1 rounded bg-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/50"
                                    >
                                      Close
                                    </motion.button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                      <div className="text-black/40">Volume</div>
                                      <div className="text-black font-semibold">{pos.volume || '0.01'}</div>
                                    </div>
                                    <div>
                                      <div className="text-black/40">Entry</div>
                                      <div className="text-black font-semibold">{pos.entryPrice || '2650.50'}</div>
                                    </div>
                                    <div>
                                      <div className="text-black/40">P/L</div>
                                      <div className={`font-bold ${
                                        (pos.profit || 24.50) >= 0 ? 'text-black' : 'text-red-400'
                                      }`}>
                                        ${(pos.profit || 24.50).toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Pending Orders */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-black flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Pending Orders ({brokerOrders.length})
                          </h4>
                          {brokerOrders.length === 0 ? (
                            <div className="p-4 text-center text-black/40 text-xs border border-black/10 rounded-lg bg-white border border-black/10">
                              No pending orders
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {brokerOrders.map((order, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-lg bg-white border border-black/10" 
                                  style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-bold text-black">{order.symbol}</span>
                                      <span className="ml-2 text-xs text-black/50">{order.type}</span>
                                    </div>
                                    <button className="text-xs text-red-400 hover:text-red-300">Cancel</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Trading Tips */}
                        <div className="p-3 rounded-lg bg-white border border-black/10">
                          <div className="flex gap-2 text-xs text-black">
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold mb-1">Risk Management</p>
                              <p className="text-black/50">Always use stop-loss orders. Never risk more than 1-2% of your account on a single trade.</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Not Connected State */}
                    {!brokerConnected && (
                      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="w-20 h-20 rounded-full bg-white border-2 border-black/15 flex items-center justify-center mb-4"
                          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                          <Zap className="w-10 h-10 text-black" style={{ filter: 'none' }} />
                        </div>
                        <h3 className="text-lg font-bold text-black mb-2 neon-blue-text" style={{ textShadow: 'none' }}>
                          Connect Your Broker
                        </h3>
                        <p className="text-sm text-black/50 mb-6 max-w-sm">
                          Link your MetaTrader 4 or MetaTrader 5 account for seamless one-click trading directly from the hub.
                        </p>
                        <motion.button
                          onClick={() => setShowBrokerSetup(true)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-3 rounded-lg bg-black text-white font-bold border border-black/20 flex items-center gap-2"
                          style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
                        >
                          <Zap className="w-5 h-5" />
                          Get Started
                        </motion.button>

                        {/* Features List */}
                        <div className="mt-8 space-y-3 text-left max-w-md w-full">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-semibold text-black">Instant Execution</div>
                              <div className="text-xs text-black/40">Execute trades in milliseconds with one click</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-semibold text-black">Live Account Sync</div>
                              <div className="text-xs text-black/40">Real-time balance, positions, and orders</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-semibold text-black">Multi-Platform Support</div>
                              <div className="text-xs text-black/40">Works with MT4 and MT5 brokers</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* DEVICE TAB */}
                {activeTab === 'device' && (
                  <motion.div
                    key="device"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="p-3 space-y-3 bg-white flex flex-col h-full min-h-0"
                    style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                  >
                    {/* Copy Button */}
                    <motion.button
                      onClick={handleCopyDeviceSnapshot}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-black text-white font-semibold text-xs border border-black/20 w-full"
                      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                    >
                      <Copy className="w-3.5 h-3.5" style={{ filter: 'none' }} />
                      Copy Snapshot
                    </motion.button>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1 [-webkit-overflow-scrolling:touch]" style={{ touchAction: 'pan-y pan-x', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
                    {/* Performance Grade */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-black/10 neon-blue-border" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black"
                          style={{ backgroundColor: `${performanceGrade.color}20`, color: performanceGrade.color, border: `2px solid ${performanceGrade.color}40` }}>
                          {performanceGrade.grade}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-black">Performance Grade</div>
                          <div className="text-[10px] text-black/50">{performanceGrade.label} • Score: {performanceScore}/100</div>
                        </div>
                      </div>
                      <PerformanceRing value={performanceScore} label="" color={performanceScore >= 70 ? 'green' : performanceScore >= 50 ? 'amber' : 'red'} size={50} />
                    </div>
                    
                    {/* Quick Stats Grid - 2x3 */}
                    <div className="grid grid-cols-2 gap-2">
                      <StatCard label="FPS" value={fps} icon={Activity} color={fps >= 50 ? 'green' : fps >= 30 ? 'amber' : 'red'} dataSource="browser" />
                      <StatCard label="Memory" value={memoryStats.jsHeapUsed} unit="MB" icon={MemoryStick} color={memoryStats.percentage < 70 ? 'blue' : 'amber'} subValue={`${memoryStats.percentage}% used`} dataSource={(performance as any).memory ? 'device' : 'estimated'} />
                      <StatCard label="CPU Cores" value={browserInfo.cores} icon={Cpu} color="cyan" dataSource="device" />
                      <StatCard label="Device RAM" value={browserInfo.deviceMemory} unit="GB" icon={HardDrive} color="purple" dataSource={(navigator as any).deviceMemory ? 'device' : 'estimated'} />
                      <StatCard label="GPU" value={gpuInfo.tier.toUpperCase()} icon={Monitor} color="blue" subValue={gpuInfo.renderer} dataSource="browser" />
                      <StatCard label="WebGL" value={gpuInfo.webglVersion} icon={Sparkles} color="blue" subValue={gpuInfo.vendor} dataSource="browser" />
                    </div>
                    

                    
                    {/* Network & Battery Row */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Network */}
                      <div className="p-2.5 rounded-xl bg-white border border-black/10 neon-blue-border" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium text-black/50">Network</span>
                            <span className="text-[7px] font-medium text-black" style={{ textShadow: 'none' }}>Browser API</span>
                          </div>
                          {networkStats.connectionType === 'wifi' ? (
                            <Wifi className="w-3 h-3 text-black" style={{ filter: 'none' }} />
                          ) : !networkStats.isOnline ? (
                            <WifiOff className="w-3 h-3 text-red-400" />
                          ) : (
                            <Signal className="w-3 h-3 text-black" style={{ filter: 'none' }} />
                          )}
                        </div>
                        <div className="text-sm font-bold text-black">
                          {networkStats.connectionType === 'wifi' ? 'WiFi' : networkStats.connectionType === 'cellular' || networkStats.connectionType === '4g' || networkStats.connectionType === '3g' ? 'Cellular' : networkStats.effectiveType.toUpperCase()}
                        </div>
                        <div className="text-[9px] text-black/50">{networkStats.downlink} Mbps • {networkStats.rtt}ms</div>
                      </div>
                      
                      {/* Battery */}
                      <div className="p-2.5 rounded-xl bg-white border border-black/10 neon-blue-border" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium text-black/50">Battery</span>
                            {batteryInfo.supported && <span className="text-[7px] font-medium text-black" style={{ textShadow: 'none' }}>Device API</span>}
                          </div>
                          {batteryInfo.charging ? <Zap className="w-3 h-3 text-black" style={{ filter: 'none' }} /> : <Battery className="w-3 h-3 text-black" />}
                        </div>
                        {batteryInfo.supported && batteryInfo.level >= 0 ? (
                          <>
                            <div className="text-sm font-bold text-black">{Math.round(batteryInfo.level)}%</div>
                            <div className="text-[9px] text-black/50">{batteryInfo.charging ? 'Charging' : 'On Battery'}</div>
                          </>
                        ) : (
                          <div className="text-xs text-black/50">Not available</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Screen Info */}
                    <div className="p-2.5 rounded-xl bg-white border border-black/10 neon-blue-border" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-black/50 uppercase tracking-wide">Display</span>
                        <Monitor className="w-3.5 h-3.5 text-black" style={{ filter: 'none' }} />
                      </div>
                      <div className="text-xs font-semibold text-black">{screenInfo.width} × {screenInfo.height}</div>
                      <div className="text-[9px] text-black/50">
                        {screenInfo.pixelRatio}x DPR • {screenInfo.refreshRate}Hz • {screenInfo.colorDepth}-bit
                        {screenInfo.hdr && <span className="ml-1 text-black">HDR</span>}
                      </div>
                    </div>
                    
                    {/* Browser Info */}
                    <div className="p-2.5 rounded-xl bg-white border border-black/10 neon-blue-border" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-black/50 uppercase tracking-wide">Browser</span>
                        <Globe className="w-3.5 h-3.5 text-black" style={{ filter: 'none' }} />
                      </div>
                      <div className="text-xs font-semibold text-black">{browserInfo.name} {browserInfo.version.split('.')[0]}</div>
                      <div className="text-[9px] text-black/50">{browserInfo.engine} • {browserInfo.platform}</div>
                    </div>
                    
                    {/* Lite Mode Toggle - Performance Settings */}
                    <div className="p-2.5 rounded-xl bg-white border border-black/10 neon-blue-border" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium text-black/50 uppercase tracking-wide">Performance Mode</span>
                        <Zap className="w-3.5 h-3.5 text-black" style={{ filter: 'none' }} />
                      </div>
                      <button
                        onClick={toggleLiteMode}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all"
                        style={{
                          background: 'rgba(0, 0, 0, 0.04)',
                          border: liteMode ? '1px solid rgba(0, 0, 0, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{liteMode ? '🌙' : '✨'}</span>
                          <div className="text-left">
                            <div className="text-xs font-semibold text-black">Lite Mode</div>
                            <div className="text-[9px] text-black/40">
                              {liteMode ? 'Heavy effects disabled' : 'Full effects enabled'}
                            </div>
                          </div>
                        </div>
                        {/* Toggle Switch */}
                        <div 
                          className={`w-9 h-5 rounded-full relative transition-colors ${
                            liteMode ? 'bg-black' : 'bg-black/20'
                          }`}
                        >
                          <motion.div
                            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
                            animate={{ x: liteMode ? 18 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        </div>
                      </button>
                      <div className="text-[8px] text-black/40 mt-2">
                        Disables blur, shadows & glow while keeping animations smooth.
                        {desktopGpuTier && (
                          <span className="block mt-0.5">GPU: {desktopGpuTier === 'discrete' ? '🎮 Discrete' : desktopGpuTier === 'integrated' ? '💻 Integrated' : '❓ Unknown'}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Account Info */}
                    {userId && (
                      <div className="p-2.5 rounded-xl bg-white border border-black/10 neon-blue-border" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium text-black/50 uppercase tracking-wide">Account</span>
                          <User className="w-3.5 h-3.5 text-black" style={{ filter: 'none' }} />
                        </div>
                        <div className="text-xs font-semibold text-black truncate">{userEmail || 'Signed In'}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {isVip && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-black border border-black/10">
                              <Crown className="w-2.5 h-2.5 inline mr-0.5" />VIP
                            </span>
                          )}
                          {isAdmin && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-black border border-black/10">
                              <Shield className="w-2.5 h-2.5 inline mr-0.5" />Admin
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Browser Capabilities */}
                    <div className="p-2.5 rounded-xl bg-white border border-black/10 neon-blue-border" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium text-black/50 uppercase tracking-wide">Browser Features</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {/* Graphics */}
                        <div className="text-[9px]">
                          <div className="font-bold text-black mb-1">Graphics</div>
                          <div className="space-y-0.5 text-black/50">
                            <div>✓ WebGL 2: {browserCapabilities.webgl2 ? '✓' : '✗'}</div>
                            <div>✓ WebGPU: {browserCapabilities.webgpu ? '✓' : '✗'}</div>
                          </div>
                        </div>
                        {/* Storage */}
                        <div className="text-[9px]">
                          <div className="font-bold text-black mb-1">Storage</div>
                          <div className="space-y-0.5 text-black/50">
                            <div>✓ IndexedDB: {browserCapabilities.indexedDb ? '✓' : '✗'}</div>
                            <div>✓ LocalStorage: {browserCapabilities.localStorage ? '✓' : '✗'}</div>
                          </div>
                        </div>
                        {/* Workers & APIs */}
                        <div className="text-[9px]">
                          <div className="font-bold text-black mb-1">Workers</div>
                          <div className="space-y-0.5 text-black/50">
                            <div>✓ WebWorker: {browserCapabilities.webWorker ? '✓' : '✗'}</div>
                            <div>✓ SharedArrayBuffer: {browserCapabilities.sharedArrayBuffer ? '✓' : '✗'}</div>
                          </div>
                        </div>
                        {/* Media */}
                        <div className="text-[9px]">
                          <div className="font-bold text-black mb-1">Media</div>
                          <div className="space-y-0.5 text-black/50">
                            <div>✓ AudioContext: {browserCapabilities.audioContext ? '✓' : '✗'}</div>
                            <div>✓ MediaRecorder: {browserCapabilities.mediaRecorder ? '✓' : '✗'}</div>
                          </div>
                        </div>
                        {/* Sensors */}
                        <div className="text-[9px]">
                          <div className="font-bold text-black mb-1">Sensors</div>
                          <div className="space-y-0.5 text-black/50">
                            <div>✓ Accel: {browserCapabilities.accelerometer ? '✓' : '✗'}</div>
                            <div>✓ Gyro: {browserCapabilities.gyroscope ? '✓' : '✗'}</div>
                          </div>
                        </div>
                        {/* Hardware */}
                        <div className="text-[9px]">
                          <div className="font-bold text-black mb-1">Hardware</div>
                          <div className="space-y-0.5 text-black/50">
                            <div>✓ Bluetooth: {browserCapabilities.bluetooth ? '✓' : '✗'}</div>
                            <div>✓ USB: {browserCapabilities.usb ? '✓' : '✗'}</div>
                          </div>
                        </div>
                        {/* XR */}
                        <div className="text-[9px]">
                          <div className="font-bold text-black mb-1">XR</div>
                          <div className="space-y-0.5 text-black/50">
                            <div>✓ VR: {browserCapabilities.vr ? '✓' : '✗'}</div>
                            <div>✓ AR: {browserCapabilities.ar ? '✓' : '✗'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Codecs */}
                      {(browserCapabilities.videoCodecs.length > 0 || browserCapabilities.audioCodecs.length > 0) && (
                        <div className="mt-2 pt-2 border-t border-black/10">
                          <div className="text-[9px]">
                            {browserCapabilities.videoCodecs.length > 0 && (
                              <div className="mb-1">
                                <span className="font-bold text-black">Video: </span>
                                <span className="text-black/50">{browserCapabilities.videoCodecs.join(', ')}</span>
                              </div>
                            )}
                            {browserCapabilities.audioCodecs.length > 0 && (
                              <div>
                                <span className="font-bold text-black">Audio: </span>
                                <span className="text-black/50">{browserCapabilities.audioCodecs.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    </div>
                  </motion.div>
                )}

                {/* LOGS TAB */}
                {activeTab === 'logs' && (
                  <motion.div
                    key="logs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="p-3 space-y-3 bg-white flex flex-col h-full min-h-0"
                    style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                  >
                    {/* Controls */}
                    <div className="flex gap-2">
                      <motion.button
                        onClick={clearLogs}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-500/30 text-red-300 font-semibold text-xs border border-red-400/60"
                        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                      >
                        <RefreshCw className="w-3.5 h-3.5" style={{ filter: 'none' }} />
                        Clear Logs
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          const logsText = consoleLogs.map(log => `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.level.toUpperCase()}: ${log.message}`).join('\n');
                          navigator.clipboard.writeText(logsText).catch(() => {
                            const textarea = document.createElement('textarea');
                            textarea.value = logsText;
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textarea);
                          });
                          alert('Console logs copied!');
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-black text-white font-semibold text-xs border border-black/20"
                        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                      >
                        <Copy className="w-3.5 h-3.5" style={{ filter: 'none' }} />
                        Copy Logs
                      </motion.button>
                    </div>

                    {/* Log Count */}
                    <div className="text-[9px] text-black/50 px-1">
                      Total Logs: {consoleLogs.length}
                    </div>

                    {/* Logs Container */}
                    <div className="flex-1 overflow-y-auto min-h-0 bg-white/50 rounded-lg border border-black/10 p-2 font-mono text-[8px] space-y-1 [-webkit-overflow-scrolling:touch]" style={{ touchAction: 'pan-y pan-x', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
                      {consoleLogs.length === 0 ? (
                        <div className="text-black/40 text-center py-4">No logs captured yet</div>
                      ) : (
                        consoleLogs.map(log => (
                          <div key={log.id} className={`flex gap-2 pb-1 border-b border-black/10 ${
                            log.level === 'error' ? 'text-red-400' :
                            log.level === 'warn' ? 'text-yellow-400' :
                            log.level === 'info' ? 'text-black' :
                            log.level === 'debug' ? 'text-black' :
                            'text-black'
                          }`}>
                            <span className="text-black/50 flex-shrink-0 w-16">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="font-bold flex-shrink-0 w-12 uppercase">
                              [{log.level}]
                            </span>
                            <span className="flex-1 break-words whitespace-pre-wrap">
                              {log.message}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(portalContent, document.body);
});
UnifiedHubPanel.displayName = 'UnifiedHubPanel';
