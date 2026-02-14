"use client";

import { useState, useCallback, memo, useEffect, useRef, createContext, useContext, Suspense } from "react";
import { createPortal } from "react-dom";
import { useDashboardPreferences } from "@/hooks/useDashboardPreferences";
import { useUnifiedPerformance } from "@/hooks/useDesktopPerformance";
import { 
  TradingViewDashboard,
  MetaTraderQuotes,
  BreakingNewsTicker,
  BullMoneyCommunity 
} from "@/components/home/dynamicImports";
import { 
  TrendingUp, Users, BarChart3, Radio, 
  Maximize2, Minimize2, Settings, RefreshCw, 
  ChevronDown, X, Bell, BellOff, 
  Eye, EyeOff, Filter, LayoutGrid, List,
  Zap, Moon, Sun, Volume2, VolumeX,
  ExternalLink, Copy, Share2, Bookmark, BookmarkCheck,
  Check, Star, Plus, Trash2, MoreVertical, Timer, Clock,
  type LucideIcon 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { haptic } from "@/lib/cinematicTransitions";

// ─── TOAST NOTIFICATION SYSTEM ─────────────────────────────────
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  icon?: LucideIcon;
}

const ToastContext = createContext<{
  showToast: (message: string, type?: Toast['type'], icon?: LucideIcon) => void;
}>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();
  
  const showToast = useCallback((message: string, type: Toast['type'] = 'success', icon?: LucideIcon) => {
    const id = Math.random().toString(36).slice(2);
    haptic.notification(type);
    setToasts(prev => [...prev, { id, message, type, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);
  
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className={`
                px-4 py-2.5 rounded-xl ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-xl shadow-2xl'}
                flex items-center gap-2.5 pointer-events-auto
                ${toast.type === 'success' ? 'bg-green-500/90 text-white' : ''}
                ${toast.type === 'error' ? 'bg-red-500/90 text-white' : ''}
                ${toast.type === 'info' ? 'bg-white/90 text-black' : ''}
              `}
            >
              {toast.icon ? <toast.icon size={16} strokeWidth={2} /> : 
                toast.type === 'success' ? <Check size={16} strokeWidth={2} /> :
                toast.type === 'error' ? <X size={16} strokeWidth={2} /> :
                <Bell size={16} strokeWidth={2} />
              }
              <span className="text-[12px] font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const useToast = () => useContext(ToastContext);

// ─── WATCHLIST STORAGE ─────────────────────────────────────────
const WATCHLIST_KEY = 'bullmoney_watchlist';

function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const { showToast } = useToast();
  
  useEffect(() => {
    const saved = localStorage.getItem(WATCHLIST_KEY);
    if (saved) setWatchlist(JSON.parse(saved));
  }, []);
  
  const addToWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => {
      if (prev.includes(symbol)) return prev;
      const updated = [...prev, symbol];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      return updated;
    });
    showToast(`Added ${symbol} to watchlist`, 'success', BookmarkCheck);
  }, [showToast]);
  
  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => {
      const updated = prev.filter(s => s !== symbol);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      return updated;
    });
    showToast(`Removed ${symbol} from watchlist`, 'info', Trash2);
  }, [showToast]);
  
  const isInWatchlist = useCallback((symbol: string) => watchlist.includes(symbol), [watchlist]);
  
  return { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist };
}

// ─── COPY TO CLIPBOARD ─────────────────────────────────────────
function useCopyToClipboard() {
  const { showToast } = useToast();
  
  const copy = useCallback(async (text: string, successMessage = 'Copied to clipboard') => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage, 'success', Check);
      return true;
    } catch {
      showToast('Failed to copy', 'error');
      return false;
    }
  }, [showToast]);
  
  return copy;
}

// ─── SHARE FUNCTIONALITY ───────────────────────────────────────
function useShare() {
  const { showToast } = useToast();
  const copy = useCopyToClipboard();
  
  const share = useCallback(async (title: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        showToast('Shared successfully', 'success', Share2);
      } catch (err) {
        // User cancelled - ignore
      }
    } else {
      await copy(url, 'Link copied to clipboard');
    }
  }, [showToast, copy]);
  
  return share;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BULLMONEY PRO TRADING DASHBOARD SECTIONS
// Apple-style glassmorphic design with interactive controls
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── DASHBOARD CONTEXT ───────────────────────────────────────
interface DashboardContextType {
  globalMuted: boolean;
  setGlobalMuted: (v: boolean) => void;
  compactMode: boolean;
  setCompactMode: (v: boolean) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType>({
  globalMuted: false,
  setGlobalMuted: () => {},
  compactMode: false,
  setCompactMode: () => {},
  darkMode: true,
  setDarkMode: () => {},
});

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [globalMuted, setGlobalMuted] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  
  return (
    <DashboardContext.Provider value={{ 
      globalMuted, setGlobalMuted, 
      compactMode, setCompactMode,
      darkMode, setDarkMode 
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

const useDashboard = () => useContext(DashboardContext);

// ─── APPLE-STYLE TOGGLE SWITCH ─────────────────────────────────
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (v: boolean) => void;
  size?: 'sm' | 'md';
  activeColor?: string;
}

const ToggleSwitch = memo(function ToggleSwitch({ 
  enabled, 
  onChange, 
  size = 'sm',
  activeColor = 'bg-green-500'
}: ToggleSwitchProps) {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: enabled ? 'translate-x-4' : 'translate-x-0.5' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: enabled ? 'translate-x-5' : 'translate-x-0.5' },
  };
  
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex items-center rounded-full transition-colors duration-200
        ${sizes[size].track}
        ${enabled ? activeColor : 'bg-white/10'}
      `}
    >
      <motion.span
        className={`
          ${sizes[size].thumb} bg-white rounded-full shadow-lg
        `}
        animate={{ x: enabled ? (size === 'sm' ? 16 : 20) : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
});

// ─── ICON BUTTON WITH TOOLTIP ──────────────────────────────────
interface IconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  tooltip?: string;
  active?: boolean;
  variant?: 'ghost' | 'subtle' | 'solid';
  size?: 'xs' | 'sm' | 'md';
  disabled?: boolean;
}

const IconButton = memo(function IconButton({ 
  icon: Icon, 
  onClick, 
  tooltip,
  active = false,
  variant = 'ghost',
  size = 'sm',
  disabled = false
}: IconButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
  };
  
  const iconSizes = { xs: 12, sm: 14, md: 16 };
  
  const variants = {
    ghost: `hover:bg-white/10 ${active ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`,
    subtle: `bg-white/5 hover:bg-white/10 ${active ? 'text-white' : 'text-white/60'}`,
    solid: `bg-white/10 hover:bg-white/20 ${active ? 'text-white bg-white/20' : 'text-white/70'}`,
  };
  
  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          ${sizes[size]} rounded-lg flex items-center justify-center
          transition-all duration-150 ${variants[variant]}
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Icon size={iconSizes[size]} strokeWidth={1.5} />
      </button>
      
      <AnimatePresence>
        {showTooltip && tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 
                       bg-white/95 text-black text-[10px] font-medium rounded-md 
                       whitespace-nowrap shadow-lg z-50 pointer-events-none"
          >
            {tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 
                            border-4 border-transparent border-t-white/95" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── MOBILE MENU DROPDOWN ──────────────────────────────────────
interface MobileMenuDropdownProps {
  onSettings?: () => void;
  onFullscreen?: () => void;
  filterOptions?: DropdownOption[];
  filterValue?: string;
  onFilterChange?: (v: string) => void;
  filterLabel?: string;
}

const MobileMenuDropdown = memo(function MobileMenuDropdown({
  onSettings,
  onFullscreen,
  filterOptions,
  filterValue,
  onFilterChange,
  filterLabel
}: MobileMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);
  
  if (!mounted) return null;
  
  return (
    <div className="relative sm:hidden">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-lg flex items-center justify-center
                   bg-white/5 hover:bg-white/10 border border-white/10
                   transition-all duration-150"
      >
        <MoreVertical size={16} className="text-white/70" strokeWidth={1.5} />
      </button>
      
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9997]"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{ 
                  position: 'fixed',
                  top: position.top,
                  right: position.right
                }}
                className={`w-48 z-[9998]
                           bg-[#0d0d0d]/98 ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-xl'} rounded-xl
                           border border-white/10 ${shouldSkipHeavyEffects ? '' : 'shadow-2xl'} overflow-hidden`}
              >
              {/* Filter Options */}
              {filterOptions && filterOptions.length > 0 && (
                <>
                  <div className="px-3 py-2 border-b border-white/5">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">
                      {filterLabel || 'Filter'}
                    </span>
                  </div>
                  {filterOptions.map((option) => {
                    const OptionIcon = option.icon;
                    const isSelected = option.value === filterValue;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          onFilterChange?.(option.value);
                          setIsOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5
                          transition-colors
                          ${isSelected 
                            ? 'bg-white/10 text-white' 
                            : 'text-white/70 hover:bg-white/5 hover:text-white'}
                        `}
                      >
                        {OptionIcon && <OptionIcon size={14} strokeWidth={1.5} />}
                        <span className="text-[12px] font-medium">{option.label}</span>
                        {isSelected && <Check size={12} className="text-green-400 ml-auto" />}
                      </button>
                    );
                  })}
                  <div className="h-px bg-white/5" />
                </>
              )}
              
              {/* Action Buttons */}
              {onSettings && (
                <button
                  onClick={() => {
                    onSettings();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5
                             text-white/70 hover:bg-white/5 hover:text-white
                             transition-colors"
                >
                  <Settings size={14} strokeWidth={1.5} />
                  <span className="text-[12px] font-medium">Settings</span>
                </button>
              )}
              
              {onFullscreen && (
                <button
                  onClick={() => {
                    onFullscreen();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5
                             text-white/70 hover:bg-white/5 hover:text-white
                             transition-colors"
                >
                  <Maximize2 size={14} strokeWidth={1.5} />
                  <span className="text-[12px] font-medium">Fullscreen</span>
                </button>
              )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
});

// ─── DROPDOWN MENU ─────────────────────────────────────────────
interface DropdownOption {
  label: string;
  value: string;
  icon?: LucideIcon;
  description?: string;
}

interface DropdownMenuProps {
  options: DropdownOption[];
  value: string;
  onChange: (v: string) => void;
  label?: string;
  icon?: LucideIcon;
}

const DropdownMenu = memo(function DropdownMenu({
  options,
  value,
  onChange,
  label,
  icon: Icon
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const selected = options.find(o => o.value === value);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  }, [isOpen]);
  
  if (!mounted) return null;
  
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg
                   bg-white/5 hover:bg-white/10 border border-white/10
                   transition-all duration-150"
      >
        {Icon && <Icon size={12} className="text-white/50" strokeWidth={1.5} />}
        <span className="text-[11px] font-medium text-white/70">
          {label && <span className="text-white/40 mr-1">{label}:</span>}
          {selected?.label || 'Select'}
        </span>
        <ChevronDown 
          size={12} 
          className={`text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9997]"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{ 
                  position: 'fixed',
                  top: position.top,
                  left: position.left,
                  minWidth: 160
                }}
                className={`z-[9998]
                           bg-[#1a1a1a]/95 ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-xl'} rounded-xl
                           border border-white/10 ${shouldSkipHeavyEffects ? '' : 'shadow-2xl'} overflow-hidden`}
              >
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { onChange(option.value); setIsOpen(false); }}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2
                    text-left transition-colors duration-100
                    ${option.value === value 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  {option.icon && <option.icon size={14} strokeWidth={1.5} />}
                  <div>
                    <div className="text-[11px] font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-[9px] text-white/40">{option.description}</div>
                    )}
                  </div>
                </button>
              ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
});

// ─── FULLSCREEN MODAL ──────────────────────────────────────────
interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  externalUrl?: string;
  shareUrl?: string;
}

const FullscreenModal = memo(function FullscreenModal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  externalUrl,
  shareUrl
}: FullscreenModalProps) {
  const [mounted, setMounted] = useState(false);
  const share = useShare();
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
  
  const handleExternalLink = useCallback(() => {
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    }
  }, [externalUrl]);
  
  const handleShare = useCallback(() => {
    const url = shareUrl || window.location.href;
    share(`BullMoney - ${title}`, url);
  }, [share, shareUrl, title]);
  
  if (!mounted) return null;
  
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[9999] bg-black/95 ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-sm'}`}
        >
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ delay: 0.05 }}
            className={`absolute top-0 left-0 right-0 h-14 
                       flex items-center justify-between px-4 sm:px-6
                       bg-black/80 ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-xl'} border-b border-white/5`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/10">
                <Icon size={16} className="text-white" strokeWidth={1.5} />
              </div>
              <span className="text-[15px] font-semibold text-white tracking-tight">{title}</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  {!shouldSkipHeavyEffects && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
                <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider">Live</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <IconButton 
                icon={ExternalLink} 
                tooltip="Open in new tab" 
                variant="subtle" 
                onClick={handleExternalLink}
              />
              <IconButton 
                icon={Share2} 
                tooltip="Share" 
                variant="subtle" 
                onClick={handleShare}
              />
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                           bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Minimize2 size={14} strokeWidth={1.5} />
                <span className="text-[11px] font-medium">Exit</span>
              </button>
            </div>
          </motion.div>
          
          {/* Content */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ delay: 0.1 }}
            className="absolute top-14 bottom-0 left-0 right-0 overflow-auto"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
});

// ─── UNIFIED SETTINGS MODAL ────────────────────────────────────
interface UnifiedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UnifiedSettingsModal = memo(function UnifiedSettingsModal({
  isOpen,
  onClose
}: UnifiedSettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const { preferences, isSaving, updateQuotesPrefs, updateNewsPrefs, updateTelegramPrefs } = useDashboardPreferences();
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();
  
  // Telegram group options
  const telegramGroups = [
    { id: 'vip', label: 'VIP Signals', icon: Zap },
    { id: 'free', label: 'Free Signals', icon: Users },
    { id: 'signals', label: 'General Signals', icon: Bell },
    { id: 'analysis', label: 'Market Analysis', icon: BarChart3 },
  ];
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
  
  if (!mounted) return null;
  
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                     w-[90vw] max-w-2xl max-h-[85vh] z-[9999]
                     bg-[#0d0d0d] border border-white/10 rounded-2xl
                     ${shouldSkipHeavyEffects ? '' : 'shadow-2xl'} overflow-hidden flex flex-col`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Settings size={16} className="text-white/80" />
              </div>
              <div>
                <span className="text-[15px] font-semibold text-white">Dashboard Settings</span>
                {isSaving && <span className="text-[10px] text-green-400 ml-2">Saving...</span>}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X size={18} className="text-white/60" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-auto p-5 space-y-6">
            {/* Market Quotes Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={14} className="text-blue-400" />
                <h3 className="text-[13px] font-semibold text-white">Market Quotes</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <RefreshCw size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Auto Refresh</div>
                      <div className="text-[10px] text-white/40">Automatically update quotes</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.quotes.autoRefresh} 
                    onChange={(v) => updateQuotesPrefs({ autoRefresh: v })} 
                  />
                </div>
                
                {/* Refresh Interval Slider */}
                <div className="p-3 rounded-lg bg-white/2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Timer size={14} className="text-white/50" />
                      <span className="text-[12px] text-white">Refresh Interval</span>
                    </div>
                    <span className="text-[11px] text-white/60">{preferences.quotes.refreshInterval / 1000}s</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="120000"
                    step="5000"
                    value={preferences.quotes.refreshInterval}
                    onChange={(e) => updateQuotesPrefs({ refreshInterval: parseInt(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
                  />
                  <div className="flex justify-between text-[9px] text-white/30 mt-1">
                    <span>10s</span>
                    <span>2min</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Bell size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Price Alerts</div>
                      <div className="text-[10px] text-white/40">Get notified of price changes</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.quotes.notifications} 
                    onChange={(v) => updateQuotesPrefs({ notifications: v })} 
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Volume2 size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Sound Alerts</div>
                      <div className="text-[10px] text-white/40">Play sound for alerts</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.quotes.soundEnabled} 
                    onChange={(v) => updateQuotesPrefs({ soundEnabled: v })} 
                  />
                </div>
              </div>
            </div>
            
            {/* Breaking News Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Radio size={14} className="text-red-400" />
                <h3 className="text-[13px] font-semibold text-white">Breaking News</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <RefreshCw size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Auto Refresh</div>
                      <div className="text-[10px] text-white/40">Live news updates</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.news.autoRefresh} 
                    onChange={(v) => updateNewsPrefs({ autoRefresh: v })} 
                  />
                </div>
                
                {/* Display Refresh Interval */}
                <div className="p-3 rounded-lg bg-white/2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Timer size={14} className="text-white/50" />
                      <span className="text-[12px] text-white">Display Refresh</span>
                    </div>
                    <span className="text-[11px] text-white/60">{preferences.news.refreshInterval / 1000}s</span>
                  </div>
                  <input
                    type="range"
                    min="15000"
                    max="180000"
                    step="15000"
                    value={preferences.news.refreshInterval}
                    onChange={(e) => updateNewsPrefs({ refreshInterval: parseInt(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-400"
                  />
                  <div className="flex justify-between text-[9px] text-white/30 mt-1">
                    <span>15s</span>
                    <span>3min</span>
                  </div>
                </div>
                
                {/* News Pull Interval */}
                <div className="p-3 rounded-lg bg-white/2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-white/50" />
                      <span className="text-[12px] text-white">Fetch New Articles</span>
                    </div>
                    <span className="text-[11px] text-white/60">{preferences.news.pullInterval / 60000}min</span>
                  </div>
                  <input
                    type="range"
                    min="60000"
                    max="1800000"
                    step="60000"
                    value={preferences.news.pullInterval}
                    onChange={(e) => updateNewsPrefs({ pullInterval: parseInt(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-400"
                  />
                  <div className="flex justify-between text-[9px] text-white/30 mt-1">
                    <span>1min</span>
                    <span>30min</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Bell size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">News Alerts</div>
                      <div className="text-[10px] text-white/40">Breaking news notifications</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.news.notifications} 
                    onChange={(v) => updateNewsPrefs({ notifications: v })} 
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Volume2 size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Sound Alerts</div>
                      <div className="text-[10px] text-white/40">Breaking news sound</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.news.soundEnabled} 
                    onChange={(v) => updateNewsPrefs({ soundEnabled: v })} 
                  />
                </div>
              </div>
            </div>
            
            {/* Community Signals Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-amber-400" />
                <h3 className="text-[13px] font-semibold text-white">Community Signals</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <RefreshCw size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Auto Refresh</div>
                      <div className="text-[10px] text-white/40">Live signal updates</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.telegram.autoRefresh} 
                    onChange={(v) => updateTelegramPrefs({ autoRefresh: v })} 
                  />
                </div>
                
                {/* Refresh Interval */}
                <div className="p-3 rounded-lg bg-white/2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Timer size={14} className="text-white/50" />
                      <span className="text-[12px] text-white">Refresh Interval</span>
                    </div>
                    <span className="text-[11px] text-white/60">{preferences.telegram.refreshInterval / 1000}s</span>
                  </div>
                  <input
                    type="range"
                    min="15000"
                    max="150000"
                    step="15000"
                    value={preferences.telegram.refreshInterval}
                    onChange={(e) => updateTelegramPrefs({ refreshInterval: parseInt(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="flex justify-between text-[9px] text-white/30 mt-1">
                    <span>15s</span>
                    <span>2.5min</span>
                  </div>
                </div>
                
                {/* Telegram Groups */}
                <div className="p-3 rounded-lg bg-white/2">
                  <div className="text-[12px] text-white mb-2">Enabled Groups</div>
                  <div className="space-y-2">
                    {telegramGroups.map((group) => (
                      <label 
                        key={group.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <group.icon size={12} className="text-white/50" />
                          <span className="text-[11px] text-white/80">{group.label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.telegram.enabledGroups.includes(group.id)}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            const newGroups = enabled
                              ? [...preferences.telegram.enabledGroups, group.id]
                              : preferences.telegram.enabledGroups.filter(g => g !== group.id);
                            updateTelegramPrefs({ enabledGroups: newGroups });
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-400 focus:ring-amber-400"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Notification Groups */}
                <div className="p-3 rounded-lg bg-white/2">
                  <div className="text-[12px] text-white mb-2">Notify From Groups</div>
                  <div className="space-y-2">
                    {telegramGroups.map((group) => (
                      <label 
                        key={group.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Bell size={12} className="text-white/50" />
                          <span className="text-[11px] text-white/80">{group.label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.telegram.notifyGroups.includes(group.id)}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            const newGroups = enabled
                              ? [...preferences.telegram.notifyGroups, group.id]
                              : preferences.telegram.notifyGroups.filter(g => g !== group.id);
                            updateTelegramPrefs({ notifyGroups: newGroups });
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-400 focus:ring-amber-400"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Bell size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Signal Alerts</div>
                      <div className="text-[10px] text-white/40">New signal notifications</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.telegram.notifications} 
                    onChange={(v) => updateTelegramPrefs({ notifications: v })} 
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Volume2 size={14} className="text-white/50" />
                    <div>
                      <div className="text-[12px] text-white">Sound Alerts</div>
                      <div className="text-[10px] text-white/40">Signal sound notifications</div>
                    </div>
                  </div>
                  <ToggleSwitch 
                    enabled={preferences.telegram.soundEnabled} 
                    onChange={(v) => updateTelegramPrefs({ soundEnabled: v })} 
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/5 bg-white/1">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-white/40">
                {isSaving ? 'Saving to database...' : 'Settings saved automatically'}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 
                           text-[12px] font-medium text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
});

// ─── SETTINGS PANEL (DEPRECATED - Use UnifiedSettingsModal) ────
interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    autoRefresh: boolean;
    setAutoRefresh: (v: boolean) => void;
    notifications: boolean;
    setNotifications: (v: boolean) => void;
    soundEnabled: boolean;
    setSoundEnabled: (v: boolean) => void;
  };
}

const SettingsPanel = memo(function SettingsPanel({
  isOpen,
  onClose,
  settings
}: SettingsPanelProps) {
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full right-0 mt-2 w-64 z-50
                       bg-[#0d0d0d]/98 ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-xl'} rounded-2xl
                       border border-white/10 ${shouldSkipHeavyEffects ? '' : 'shadow-2xl'} overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
                Section Settings
              </span>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
                <X size={12} className="text-white/50" />
              </button>
            </div>
            
            {/* Settings */}
            <div className="p-3 space-y-3">
              {/* Auto Refresh */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                <div className="flex items-center gap-2.5">
                  <RefreshCw size={14} className="text-white/50" />
                  <div>
                    <div className="text-[11px] font-medium text-white/80">Auto Refresh</div>
                    <div className="text-[9px] text-white/40">Update data automatically</div>
                  </div>
                </div>
                <ToggleSwitch 
                  enabled={settings.autoRefresh} 
                  onChange={settings.setAutoRefresh}
                />
              </div>
              
              {/* Notifications */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                <div className="flex items-center gap-2.5">
                  <Bell size={14} className="text-white/50" />
                  <div>
                    <div className="text-[11px] font-medium text-white/80">Notifications</div>
                    <div className="text-[9px] text-white/40">Price alerts & news</div>
                  </div>
                </div>
                <ToggleSwitch 
                  enabled={settings.notifications} 
                  onChange={settings.setNotifications}
                />
              </div>
              
              {/* Sound */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                <div className="flex items-center gap-2.5">
                  <Volume2 size={14} className="text-white/50" />
                  <div>
                    <div className="text-[11px] font-medium text-white/80">Sound Effects</div>
                    <div className="text-[9px] text-white/40">Audio feedback</div>
                  </div>
                </div>
                <ToggleSwitch 
                  enabled={settings.soundEnabled} 
                  onChange={settings.setSoundEnabled}
                />
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02]">
              <div className="text-[9px] text-white/30 text-center">
                Settings are saved automatically
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

// ─── QUICK ACTIONS BAR ─────────────────────────────────────────
interface QuickActionsBarProps {
  actions: Array<{
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    active?: boolean;
  }>;
}

const QuickActionsBar = memo(function QuickActionsBar({ actions }: QuickActionsBarProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/[0.03]">
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={action.onClick}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium
            transition-all duration-150
            ${action.active 
              ? 'bg-white/15 text-white' 
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'}
          `}
        >
          <action.icon size={11} strokeWidth={1.5} />
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
});

// ─── WATCHLIST MODAL ───────────────────────────────────────────
interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_SYMBOLS = [
  { symbol: 'BTCUSD', name: 'Bitcoin', category: 'Crypto' },
  { symbol: 'ETHUSD', name: 'Ethereum', category: 'Crypto' },
  { symbol: 'XAUUSD', name: 'Gold', category: 'Metals' },
  { symbol: 'EURUSD', name: 'EUR/USD', category: 'Forex' },
  { symbol: 'AAPL', name: 'Apple Inc', category: 'Stocks' },
  { symbol: 'TSLA', name: 'Tesla Inc', category: 'Stocks' },
  { symbol: 'SPX500', name: 'S&P 500', category: 'Indices' },
  { symbol: 'SOLUSD', name: 'Solana', category: 'Crypto' },
];

const WatchlistModal = memo(function WatchlistModal({ isOpen, onClose }: WatchlistModalProps) {
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
  
  const filteredSymbols = SAMPLE_SYMBOLS.filter(s => 
    s.symbol.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  
  if (!mounted) return null;
  
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                     w-[90vw] max-w-md max-h-[80vh] z-[9999]
                     bg-[#0d0d0d] border border-white/10 rounded-2xl
                     shadow-2xl overflow-hidden flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Star size={16} className="text-amber-400" />
                <span className="text-[14px] font-semibold text-white">Watchlist</span>
                <span className="text-[10px] text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
                  {watchlist.length} items
                </span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
                <X size={16} className="text-white/60" />
              </button>
            </div>
            
            {/* Search */}
            <div className="px-4 py-2 border-b border-white/5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search symbols..."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10
                           text-[12px] text-white placeholder:text-white/30
                           focus:outline-none focus:border-white/20"
              />
            </div>
            
            {/* Current Watchlist */}
            {watchlist.length > 0 && (
              <div className="px-4 py-2 border-b border-white/5">
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                  Your Watchlist
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {watchlist.map(symbol => (
                    <button
                      key={symbol}
                      onClick={() => removeFromWatchlist(symbol)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md
                                 bg-amber-500/20 text-amber-400 text-[10px] font-medium
                                 hover:bg-red-500/20 hover:text-red-400 transition-colors group"
                    >
                      <span>{symbol}</span>
                      <X size={10} className="opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Available Symbols */}
            <div className="flex-1 overflow-auto px-4 py-2">
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                Add Symbols
              </div>
              <div className="space-y-1">
                {filteredSymbols.map(item => (
                  <button
                    key={item.symbol}
                    onClick={() => isInWatchlist(item.symbol) 
                      ? removeFromWatchlist(item.symbol) 
                      : addToWatchlist(item.symbol)
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg
                               hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white/60">
                          {item.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="text-[12px] font-medium text-white">{item.symbol}</div>
                        <div className="text-[10px] text-white/40">{item.name}</div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center
                                    ${isInWatchlist(item.symbol) 
                                      ? 'bg-amber-500 text-black' 
                                      : 'bg-white/10 text-white/40'}`}>
                      {isInWatchlist(item.symbol) 
                        ? <Check size={12} strokeWidth={2.5} /> 
                        : <Plus size={12} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
});

// ─── ENHANCED SECTION HEADER ───────────────────────────────────
interface EnhancedSectionHeaderProps {
  title: string;
  icon: LucideIcon;
  live?: boolean;
  onFullscreen?: () => void;
  onSettings?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showSettingsPanel?: boolean;
  onCloseSettings?: () => void;
  settingsContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  actions?: Array<{
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    active?: boolean;
  }>;
  // For mobile menu
  filterOptions?: DropdownOption[];
  filterValue?: string;
  onFilterChange?: (v: string) => void;
  filterLabel?: string;
}

const EnhancedSectionHeader = memo(function EnhancedSectionHeader({
  title,
  icon: Icon,
  live = false,
  onFullscreen,
  onSettings,
  onRefresh,
  isRefreshing = false,
  rightContent,
  isCollapsed = false,
  onToggleCollapse,
  actions,
  filterOptions,
  filterValue,
  onFilterChange,
  filterLabel
}: EnhancedSectionHeaderProps) {
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();
  return (
    <div 
      className={`flex items-center justify-between px-4 sm:px-5 py-3 
                    border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent
                    ${onToggleCollapse ? 'cursor-pointer hover:bg-white/[0.02] transition-colors' : ''}`}
      onClick={onToggleCollapse}
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Collapse toggle */}
        {onToggleCollapse && (
          <motion.div
            animate={{ rotate: isCollapsed ? -90 : 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex items-center justify-center w-6 h-6 rounded-lg 
                       bg-white/5 hover:bg-white/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
          >
            <ChevronDown size={14} className="text-white/60" strokeWidth={2} />
          </motion.div>
        )}
        <div className="flex items-center justify-center w-8 h-8 rounded-xl 
                        bg-gradient-to-br from-white/10 to-white/5 
                        shadow-inner border border-white/5">
          <Icon size={15} className="text-white/80" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-white/90 tracking-tight">{title}</span>
          <span className="text-[9px] text-white/30 uppercase tracking-wider hidden sm:block">Dashboard Widget</span>
        </div>
        {live && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                           bg-gradient-to-r from-green-500/20 to-green-600/10 
                           border border-green-500/20">
            <span className="relative flex h-1.5 w-1.5">
              {!shouldSkipHeavyEffects && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider">Live</span>
          </span>
        )}
      </div>
      
      {/* Right side */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {/* Desktop: Show actions and filters */}
        {!isCollapsed && actions && <div className="hidden lg:block"><QuickActionsBar actions={actions} /></div>}
        {!isCollapsed && <div className="hidden sm:block">{rightContent}</div>}
        
        {/* Mobile: Show combined menu */}
        {!isCollapsed && (onSettings || onFullscreen || filterOptions) && (
          <MobileMenuDropdown
            onSettings={onSettings}
            onFullscreen={onFullscreen}
            filterOptions={filterOptions}
            filterValue={filterValue}
            onFilterChange={onFilterChange}
            filterLabel={filterLabel}
          />
        )}
        
        <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/5">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`
                w-7 h-7 rounded-lg flex items-center justify-center
                transition-all duration-150 hover:bg-white/10
                ${isRefreshing ? 'text-green-400' : 'text-white/50 hover:text-white/80'}
              `}
            >
              <motion.div
                animate={{ rotate: isRefreshing ? 360 : 0 }}
                transition={{ 
                  duration: 1, 
                  repeat: isRefreshing ? Infinity : 0, 
                  ease: 'linear' 
                }}
              >
                <RefreshCw size={14} strokeWidth={1.5} />
              </motion.div>
            </button>
          )}
          {onSettings && (
            <div className="hidden sm:block">
              <IconButton 
                icon={Settings} 
                tooltip="Settings"
                onClick={onSettings}
                variant="ghost"
              />
            </div>
          )}
          {onFullscreen && (
            <div className="hidden sm:block">
              <IconButton 
                icon={Maximize2} 
                tooltip="Fullscreen"
                onClick={onFullscreen}
                variant="subtle"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── STATUS BAR ────────────────────────────────────────────────
interface StatusBarProps {
  items: Array<{
    label: string;
    value: string;
    color?: 'green' | 'red' | 'yellow' | 'default';
  }>;
}

const StatusBar = memo(function StatusBar({ items }: StatusBarProps) {
  const colors = {
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    default: 'text-white/60',
  };
  
  return (
    <div className="flex items-center gap-4 px-4 py-2 border-t border-white/5 bg-white/[0.01]">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[9px] text-white/40 uppercase tracking-wider">{item.label}</span>
          <span className={`text-[11px] font-medium ${colors[item.color || 'default']}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN SECTION COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * MetaTrader Quotes Section
 * Live quotes with category filters
 */
export function QuotesSection() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [category, setCategory] = useState<'all' | 'forex' | 'crypto' | 'stocks'>('all');
  const { showToast } = useToast();
  const { isMobile, isTablet, shouldSkipHeavyEffects } = useUnifiedPerformance();
  const isMobileDevice = isMobile || isTablet;
  
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Increment key to force component remount and data refresh
    setRefreshKey(prev => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Quotes refreshed', 'success', RefreshCw);
    }, 1000);
  }, [showToast]);
  
  const toggleAlerts = useCallback(() => {
    setNotifications(prev => {
      const next = !prev;
      showToast(next ? 'Price alerts enabled' : 'Price alerts disabled', 'info', next ? Bell : BellOff);
      return next;
    });
  }, [showToast]);
  
  const categoryOptions: DropdownOption[] = [
    { label: 'All Markets', value: 'all', icon: LayoutGrid },
    { label: 'Forex', value: 'forex', icon: TrendingUp },
    { label: 'Crypto', value: 'crypto', icon: Zap },
    { label: 'Stocks', value: 'stocks', icon: BarChart3 },
  ];
  
  return (
    <>
      <section
        id="metatrader-quotes"
        className="w-full full-bleed bg-black"
        style={{ backgroundColor: '#000000', colorScheme: 'dark' as const }}
        data-allow-scroll
        data-content
        data-theme-aware
      >
        <motion.div 
          initial={{ opacity: 0, y: isMobileDevice ? 10 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ 
            duration: isMobileDevice ? 0.3 : 0.5, 
            ease: isMobileDevice ? 'easeOut' : [0.25, 0.46, 0.45, 0.94] 
          }}
          className="mx-2 sm:mx-4 lg:mx-6 my-4 rounded-2xl 
                     border border-white/[0.08] bg-[#0a0a0a]/95 
                     overflow-hidden shadow-2xl shadow-black/50"
        >
          <EnhancedSectionHeader 
            title="Market Quotes" 
            icon={BarChart3} 
            live
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            onFullscreen={() => setIsFullscreen(true)}
            onSettings={() => setShowSettings(true)}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            rightContent={
              <DropdownMenu
                options={categoryOptions}
                value={category}
                onChange={(v) => setCategory(v as typeof category)}
                label="Filter"
                icon={Filter}
              />
            }
            filterOptions={categoryOptions}
            filterValue={category}
            onFilterChange={(v) => setCategory(v as typeof category)}
            filterLabel="Market Category"
            actions={[
              { icon: notifications ? BookmarkCheck : Bookmark, label: 'Watchlist', onClick: () => setShowWatchlist(true), active: false },
              { icon: notifications ? Bell : BellOff, label: notifications ? 'Alerts On' : 'Alerts', onClick: toggleAlerts, active: notifications },
            ]}
          />
          
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ 
                  duration: isMobileDevice ? 0.2 : 0.3, 
                  ease: isMobileDevice ? 'easeOut' : [0.4, 0, 0.2, 1] 
                }}
                className="overflow-hidden"
              >
                <div className={`transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
                  <MetaTraderQuotes key={`quotes-${refreshKey}`} embedded />
                </div>
          
                <StatusBar items={[
                  { label: 'Symbols', value: '45 Active', color: 'default' },
                  { label: 'Updates/sec', value: '~60', color: 'green' },
                  { label: 'Alerts', value: notifications ? 'On' : 'Off', color: notifications ? 'green' : 'default' },
                ]} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
      
      <WatchlistModal isOpen={showWatchlist} onClose={() => setShowWatchlist(false)} />
      <UnifiedSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      
      <FullscreenModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        title="Market Quotes"
        icon={BarChart3}
        externalUrl="https://www.metatrader5.com"
        shareUrl={typeof window !== 'undefined' ? `${window.location.origin}#metatrader-quotes` : ''}
      >
        <div className="w-full h-full p-4">
          <MetaTraderQuotes key={`quotes-fs-${refreshKey}`} embedded />
        </div>
      </FullscreenModal>
    </>
  );
}

/**
 * Breaking News Ticker Section
 * Live headlines with priority filters
 */
export function BreakingNewsSection() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [priority, setPriority] = useState<'all' | 'high' | 'breaking'>('all');
  const { showToast } = useToast();
  const { isMobile, isTablet, shouldSkipHeavyEffects } = useUnifiedPerformance();
  const isMobileDevice = isMobile || isTablet;
  
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Increment key to force component remount and data refresh
    setRefreshKey(prev => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('News feed refreshed', 'success', RefreshCw);
    }, 1000);
  }, [showToast]);
  
  const toggleNotifications = useCallback(() => {
    setNotifications(prev => {
      const next = !prev;
      showToast(next ? 'News alerts enabled' : 'News alerts disabled', 'info', next ? Bell : BellOff);
      return next;
    });
  }, [showToast]);
  
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      showToast(next ? 'Sound enabled' : 'Sound muted', 'info', next ? Volume2 : VolumeX);
      return next;
    });
  }, [showToast]);
  
  const priorityOptions: DropdownOption[] = [
    { label: 'All News', value: 'all', icon: Radio },
    { label: 'High Impact', value: 'high', icon: Zap },
    { label: 'Breaking Only', value: 'breaking', icon: Bell },
  ];
  
  return (
    <>
      <section
        id="breaking-news"
        className="w-full full-bleed bg-black"
        style={{ backgroundColor: '#000000', colorScheme: 'dark' as const }}
        data-allow-scroll
        data-content
        data-theme-aware
      >
        <div
          className="mx-2 sm:mx-4 lg:mx-6 my-4 rounded-2xl 
                     border border-white/[0.08] bg-[#0a0a0a]/95 
                     overflow-hidden shadow-2xl shadow-black/50
                     relative"
          style={{ backgroundColor: 'rgba(10, 10, 10, 0.95)' }}
        >
          {/* Breaking news accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] 
                          bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
          
          <EnhancedSectionHeader 
              title="Breaking News" 
              icon={Radio} 
              live
              isCollapsed={isCollapsed}
              onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
              onFullscreen={() => setIsFullscreen(true)}
              onSettings={() => setShowSettings(true)}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              rightContent={
                <DropdownMenu
                  options={priorityOptions}
                  value={priority}
                  onChange={(v) => setPriority(v as typeof priority)}
                  label="Priority"
                  icon={Filter}
                />
              }
              filterOptions={priorityOptions}
              filterValue={priority}
              onFilterChange={(v) => setPriority(v as typeof priority)}
              filterLabel="News Priority"
              actions={[
                { 
                  icon: notifications ? Bell : BellOff, 
                  label: notifications ? 'Alerts On' : 'Alerts Off', 
                  onClick: toggleNotifications, 
                  active: notifications 
                },
                { 
                  icon: soundEnabled ? Volume2 : VolumeX, 
                  label: soundEnabled ? 'Sound On' : 'Sound Off', 
                  onClick: toggleSound, 
                  active: soundEnabled 
                },
              ]}
            />
          
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ 
                  duration: isMobileDevice ? 0.2 : 0.3, 
                  ease: isMobileDevice ? 'easeOut' : [0.4, 0, 0.2, 1] 
                }}
                className="overflow-hidden"
              >
                <div className={`transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
                  <BreakingNewsTicker key={`news-${refreshKey}`} />
                </div>
          
                <StatusBar items={[
                  { label: 'Feed', value: 'Live', color: 'green' },
                  { label: 'Sources', value: '12 Active', color: 'default' },
                  { label: 'Priority', value: priority === 'breaking' ? 'Breaking' : priority === 'high' ? 'High' : 'All', color: priority === 'breaking' ? 'red' : 'default' },
                  { label: 'Sound', value: soundEnabled ? 'On' : 'Off', color: soundEnabled ? 'green' : 'default' },
                ]} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      
      <UnifiedSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      
      <FullscreenModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        title="Breaking News"
        icon={Radio}
        externalUrl="https://www.reuters.com/markets/"
        shareUrl={typeof window !== 'undefined' ? `${window.location.origin}#breaking-news` : ''}
      >
        <div className="w-full h-full p-4">
          <BreakingNewsTicker key={`news-fs-${refreshKey}`} />
        </div>
      </FullscreenModal>
    </>
  );
}

/**
 * BullMoney Community Section
 * Live signals with member filters
 */
export function TelegramSection() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [visibility, setVisibility] = useState<'all' | 'vip' | 'free'>('all');
  const { showToast } = useToast();
  const copy = useCopyToClipboard();
  const { isMobile, isTablet, shouldSkipHeavyEffects } = useUnifiedPerformance();
  const isMobileDevice = isMobile || isTablet;
  
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Increment key to force component remount and data refresh
    setRefreshKey(prev => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Signals refreshed', 'success', RefreshCw);
    }, 1000);
  }, [showToast]);
  
  const handleCopyTrade = useCallback(() => {
    // Example trade signal to copy
    const tradeSignal = `🟢 BUY XAUUSD @ 2045.50
Take Profit 1: 2050.00
Take Profit 2: 2055.00
Stop Loss: 2040.00
Risk: 1%
— BullMoney Signals`;
    copy(tradeSignal, 'Trade signal copied to clipboard');
  }, [copy]);
  
  const handleOpenTelegram = useCallback(() => {
    window.open('https://t.me/bullmoney', '_blank', 'noopener,noreferrer');
    showToast('Opening Telegram...', 'info', ExternalLink);
  }, [showToast]);
  
  const visibilityOptions: DropdownOption[] = [
    { label: 'All Signals', value: 'all', icon: Users },
    { label: 'VIP Only', value: 'vip', icon: Zap },
    { label: 'Free Signals', value: 'free', icon: Eye },
  ];
  
  return (
    <>
      <section
        id="bullmoney-community"
        className="w-full full-bleed bg-black"
        style={{ backgroundColor: '#000000', colorScheme: 'dark' as const }}
        data-allow-scroll
        data-content
        data-theme-aware
      >
        <motion.div 
          initial={{ opacity: 0, y: isMobileDevice ? 10 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ 
            duration: isMobileDevice ? 0.3 : 0.5, 
            ease: isMobileDevice ? 'easeOut' : [0.25, 0.46, 0.45, 0.94] 
          }}
          className="mx-2 sm:mx-4 lg:mx-6 my-4 rounded-2xl 
                     border border-white/[0.08] bg-[#0a0a0a]/95 
                     overflow-hidden shadow-2xl shadow-black/50
                     relative"
        >
          {/* VIP accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] 
                          bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          
          <EnhancedSectionHeader 
              title="Community Signals" 
              icon={Users} 
              live
              isCollapsed={isCollapsed}
              onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
              onFullscreen={() => setIsFullscreen(true)}
              onSettings={() => setShowSettings(true)}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              rightContent={
                <DropdownMenu
                  options={visibilityOptions}
                  value={visibility}
                  onChange={(v) => setVisibility(v as typeof visibility)}
                  label="View"
                  icon={Eye}
                />
              }
              filterOptions={visibilityOptions}
              filterValue={visibility}
              onFilterChange={(v) => setVisibility(v as typeof visibility)}
              filterLabel="Signal Type"
              actions={[
                { icon: Copy, label: 'Copy Trade', onClick: handleCopyTrade, active: false },
                { icon: ExternalLink, label: 'Telegram', onClick: handleOpenTelegram, active: false },
              ]}
            />
          
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ 
                  duration: isMobileDevice ? 0.2 : 0.3, 
                  ease: isMobileDevice ? 'easeOut' : [0.4, 0, 0.2, 1] 
                }}
                className="overflow-hidden"
              >
                <div className={`transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
                  <BullMoneyCommunity key={`community-${refreshKey}`} />
                </div>
          
                <StatusBar items={[
                  { label: 'Members', value: '5,234 Online', color: 'green' },
                  { label: 'Signals Today', value: '12', color: 'default' },
                  { label: 'Win Rate', value: '78%', color: 'green' },
                  { label: 'Filter', value: visibility === 'vip' ? 'VIP' : visibility === 'free' ? 'Free' : 'All', color: visibility === 'vip' ? 'yellow' : 'default' },
                ]} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
      
      <UnifiedSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      
      <FullscreenModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        title="Community Signals"
        icon={Users}
        externalUrl="https://t.me/bullmoney"
        shareUrl={typeof window !== 'undefined' ? `${window.location.origin}#bullmoney-community` : ''}
      >
        <div className="w-full h-full p-4">
          <BullMoneyCommunity key={`community-fs-${refreshKey}`} />
        </div>
      </FullscreenModal>
    </>
  );
}
