"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare,
  MessageCircle,
  Instagram,
  Youtube,
  Crown,
  ChevronRight,
  ExternalLink,
  Loader,
  ShoppingBag,
  Lock,
  Star,
  Shield,
  TrendingUp,
  Zap,
  Chrome,
  Globe,
  Monitor,
  Copy,
  Check
} from 'lucide-react';

import { useUIState } from '@/contexts/UIStateContext';
import { createSupabaseClient } from '@/lib/supabase';

// Telegram message interface
interface TelegramPost {
  id: string;
  text: string;
  date: string;
  views?: string;
  hasMedia: boolean;
}

// Channel configuration
const CHANNELS = {
  trades: { name: 'FREE TRADES', handle: 'bullmoneywebsite', icon: TrendingUp, color: 'cyan' as const, requiresVip: false },
  main: { name: 'LIVESTREAMS', handle: 'bullmoneyfx', icon: MessageCircle, color: 'blue' as const, requiresVip: false },
  shop: { name: 'NEWS', handle: 'Bullmoneyshop', icon: ShoppingBag, color: 'emerald' as const, requiresVip: false },
  vip: { name: 'VIP TRADES', handle: 'bullmoneyvip', icon: Crown, color: 'amber' as const, requiresVip: true },
} as const;

type ChannelKey = keyof typeof CHANNELS;

// VIP status hook (supports userId or email lookup)
function useVipCheck(userId?: string, userEmail?: string) {
  const [isVip, setIsVip] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const checkStatus = useCallback(async () => {
    // Try userId first, then email
    if (!userId && !userEmail) {
      console.log('🔒 VIP check: No userId or email available');
      setIsVip(false);
      setLoading(false);
      return;
    }
    
    try {
      const params = userId 
        ? `userId=${userId}` 
        : `email=${encodeURIComponent(userEmail!)}`;
      console.log('🔍 VIP check: Fetching with params:', params);
      const res = await fetch(`/api/vip/status?${params}`, { cache: 'no-store' });
      const data = await res.json();
      console.log('✨ VIP check result:', data);
      setIsVip(data.isVip ?? false);
    } catch (e) {
      console.error('VIP check failed:', e);
    } finally {
      setLoading(false);
    }
  }, [userId, userEmail]);
  
  useEffect(() => {
    checkStatus();
    // Poll every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);
  
  return { isVip, loading };
}

// Live Telegram Channel Feed Component - Fetches from API
function TelegramChannelEmbed({ channel = 'main', isVip = false }: { channel?: ChannelKey; isVip?: boolean }) {
  const [posts, setPosts] = useState<TelegramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const channelConfig = CHANNELS[channel];
  const requiresVip = channelConfig.requiresVip && !isVip;

  useEffect(() => {
    if (requiresVip) {
      setLoading(false);
      return;
    }
    
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/telegram/channel?channel=${channel}`);
        const data = await response.json();
        
        if (data.success && data.posts) {
          setPosts(data.posts);
          setError(false);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch Telegram posts:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
    // Refresh every 2 minutes
    const interval = setInterval(fetchPosts, 120000);
    return () => clearInterval(interval);
  }, [channel, requiresVip]);

  // VIP locked state
  if (requiresVip) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-amber-400" />
        </div>
        <h4 className="text-sm font-bold text-white mb-2">VIP Content</h4>
        <p className="text-[10px] text-zinc-400 mb-4 max-w-[200px]">
          Upgrade to VIP to access exclusive signals, analysis, and premium content.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.dispatchEvent(new CustomEvent('openProductsModal'))}
          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-amber-500/30 flex items-center gap-2"
        >
          <Crown className="w-3.5 h-3.5" />
          Unlock VIP Access
        </motion.button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="w-5 h-5 text-blue-400 animate-spin mb-2" />
        <span className="text-[10px] text-zinc-400">Loading live feed...</span>
      </div>
    );
  }

  if (error || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <MessageCircle className="w-10 h-10 text-blue-400/30 mb-3" />
        <p className="text-[11px] text-zinc-400 mb-2">Live feed loading...</p>
        <a
          href={`https://t.me/${channelConfig.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          Open in Telegram
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {posts.map((post, idx) => (
        <motion.a
          key={post.id}
          href={`https://t.me/${channelConfig.handle}/${post.id}`}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="block bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 hover:border-blue-500/40 transition-all group"
        >
          <div className="flex items-start gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
              channel === 'vip' 
                ? 'bg-gradient-to-br from-amber-500 to-orange-500' 
                : channel === 'shop'
                ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                : channel === 'trades'
                ? 'bg-gradient-to-br from-cyan-500 to-blue-500'
                : 'bg-gradient-to-br from-blue-500 to-cyan-500'
            }`}>
              {channel === 'vip' ? <Star className="w-4 h-4" /> : channel === 'shop' ? <ShoppingBag className="w-4 h-4" /> : channel === 'trades' ? <TrendingUp className="w-4 h-4" /> : 'B'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-semibold text-white">{channelConfig.name}</span>
                <span className="text-[8px] text-zinc-500">{post.date}</span>
              </div>
              <p className="text-[10px] text-zinc-300 line-clamp-3 leading-relaxed">
                {post.text}
              </p>
              {post.hasMedia && (
                <span className="inline-block mt-1.5 text-[8px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                  📷 Media
                </span>
              )}
              {post.views && (
                <span className="text-[8px] text-zinc-500 mt-1 block">
                  👁 {post.views} views
                </span>
              )}
            </div>
            <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
          </div>
        </motion.a>
      ))}
    </div>
  );
}

// Live Trades Ticker - Shows scrolling messages from public trades channel
function LiveTradesTicker() {
  const [messages, setMessages] = useState<TelegramPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch messages from the public trades channel - FAST hydration
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Add cache-busting for fresh data
        const response = await fetch(`/api/telegram/channel?channel=trades&t=${Date.now()}`, {
          cache: 'no-store',
        });
        const data = await response.json();
        
        if (data.success && data.posts && data.posts.length > 0) {
          setMessages(data.posts);
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error('Failed to fetch trades:', err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately on mount
    fetchMessages();
    
    // Refresh messages every 5 seconds for near real-time updates
    const refreshInterval = setInterval(fetchMessages, 5000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Cycle through messages every 3 seconds
  useEffect(() => {
    if (messages.length === 0) return;
    
    const cycleInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    
    return () => clearInterval(cycleInterval);
  }, [messages.length]);

  const currentMessage = messages[currentIndex];

  // Format message for better display - extract key info (preserves all characters including !, @, #, emojis etc)
  const formatMessage = (text: string) => {
    if (!text) return { line1: '', line2: '' };
    
    // Split into lines, preserve all characters
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    
    // Get first line (usually the pair/signal)
    let line1 = lines[0] || '';
    let line2 = '';
    
    // Truncate if needed but preserve all special characters
    if ([...line1].length > 45) {
      // Use spread to properly handle unicode/emojis
      line1 = [...line1].slice(0, 42).join('') + '...';
    }
    
    // Get second meaningful line (usually entry/TP/SL info)
    if (lines.length > 1) {
      // Look for entry, TP, or key info
      const keyLine = lines.slice(1).find(l => 
        l.includes('BUY') || l.includes('SELL') || l.includes('Entry') || 
        l.includes('TP') || l.includes('📈') || l.includes('📉') ||
        l.includes('@') || l.includes('Target') || l.includes('!')
      ) || lines[1];
      
      // Use spread for proper unicode handling
      line2 = [...keyLine].length > 50 ? [...keyLine].slice(0, 47).join('') + '...' : keyLine;
    }
    
    return { line1, line2 };
  };

  if (loading || !currentMessage) {
    return (
      <div className="mt-0 -translate-y-0.5 px-2.5 py-2 bg-zinc-900/80 rounded-b-xl border-x border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Loader className="w-2.5 h-2.5 text-cyan-400 animate-spin" />
          <span className="text-[8px] text-zinc-500">Loading live trades...</span>
        </div>
      </div>
    );
  }

  const { line1, line2 } = formatMessage(currentMessage.text);

  return (
    <motion.a
      href="https://t.me/bullmoneywebsite"
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-0 -translate-y-0.5"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="px-2.5 py-2 bg-gradient-to-br from-zinc-900/95 via-zinc-800/95 to-zinc-900/90 backdrop-blur-xl rounded-b-xl border-x border-b border-cyan-500/30 hover:border-cyan-400/50 hover:bg-zinc-800/95 transition-all overflow-hidden w-[220px] md:w-[280px]">
        {/* Header row */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <motion.div
              className="w-1.5 h-1.5 bg-green-400 rounded-full"
              animate={{ 
                opacity: [1, 0.3, 1],
                boxShadow: ['0 0 0px rgba(74,222,128,0.8)', '0 0 6px rgba(74,222,128,0.8)', '0 0 0px rgba(74,222,128,0.8)']
              }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-[7px] font-bold text-cyan-400/80 uppercase tracking-wider">Live Signal</span>
          </div>
          {/* Views & Stats */}
          <div className="flex items-center gap-2">
            {currentMessage.views && (
              <div className="flex items-center gap-0.5">
                <span className="text-[7px] text-zinc-500">👁</span>
                <span className="text-[7px] text-zinc-400 font-medium">{currentMessage.views}</span>
              </div>
            )}
            <div className="flex items-center gap-0.5">
              <Zap className="w-2 h-2 text-amber-400" />
              <span className="text-[7px] text-zinc-500">{currentIndex + 1}/{messages.length}</span>
            </div>
          </div>
        </div>
        
        {/* Message content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-1"
          >
            {/* Primary line */}
            <p className="text-[10px] text-white font-semibold leading-normal truncate emoji-text">
              {line1}
            </p>
            {/* Secondary line */}
            {line2 && (
              <p className="text-[9px] text-cyan-200/80 leading-normal truncate emoji-text">
                {line2}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Footer with time & progress */}
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[7px] text-zinc-500">{currentMessage.date || 'Just now'}</span>
          {currentMessage.hasMedia && (
            <span className="text-[7px] text-blue-400">📷 Media</span>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="mt-1 h-[2px] bg-zinc-700/40 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 3, ease: 'linear' }}
            key={currentIndex}
          />
        </div>
      </div>
    </motion.a>
  );
}

export function CommunityQuickAccess() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [otherMenuOpen, setOtherMenuOpen] = useState(false);
  const [otherHovered, setOtherHovered] = useState(false);
  const [activeChannel, setActiveChannel] = useState<ChannelKey>('trades');
  const [userId, setUserId] = useState<string | undefined>();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openingBrowser, setOpeningBrowser] = useState<string | null>(null);
  const [browserMenuOpen, setBrowserMenuOpen] = useState(false);
  const [browserButtonRect, setBrowserButtonRect] = useState<DOMRect | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const browserButtonRef = useRef<HTMLButtonElement>(null);

  // Browser configuration
  const browsers = [
    {
      id: 'chrome',
      name: 'Chrome',
      fullName: 'Google Chrome',
      icon: Chrome,
      getUrl: (url: string) => `googlechrome://${url.replace(/^https?:\/\//, '')}`
    },
    {
      id: 'firefox',
      name: 'Firefox',
      fullName: 'Firefox',
      icon: Globe,
      getUrl: (url: string) => `firefox://open-url?url=${encodeURIComponent(url)}`
    },
    {
      id: 'safari',
      name: 'Safari',
      fullName: 'Safari',
      icon: Globe,
      getUrl: (url: string) => url
    },
    {
      id: 'edge',
      name: 'Edge',
      fullName: 'Microsoft Edge',
      icon: Globe,
      getUrl: (url: string) => `microsoft-edge:${url}`
    },
  ];

  const { isAnyModalOpen, isMobileMenuOpen, isUltimatePanelOpen, isV2Unlocked } = useUIState();
  const { isVip } = useVipCheck(userId, userEmail);
  
  // Memoize Supabase client to avoid recreating it
  const supabase = useMemo(() => createSupabaseClient(), []);
  
  // Detect if logged-in user is the admin by checking Supabase session
  useEffect(() => {
    setMounted(true);
    
    // Initial check on mount - check both Supabase and localStorage
    const checkAdmin = async () => {
      try {
        // First try Supabase auth
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email) {
          const userEmail = session.user.email;
          const isAdminUser = userEmail === 'mrbullmoney@gmail.com';
          console.log('📧 Supabase session email:', userEmail, 'isAdmin:', isAdminUser);
          setIsAdmin(isAdminUser);
          // Always set userId and email for VIP checks (not just for admins)
          setUserId(session.user.id);
          setUserEmail(userEmail);
          if (isAdminUser) {
            console.log('✅ Admin user detected via Supabase session');
          }
        } else {
          // Fallback to localStorage bullmoney_session
          const savedSession = localStorage.getItem('bullmoney_session');
          if (savedSession) {
            try {
              const session = JSON.parse(savedSession);
              // Always set userId and email for VIP checks regardless of admin status
              if (session?.id) {
                setUserId(session.id);
              }
              if (session?.email) {
                setUserEmail(session.email);
              }
              if (session?.email === 'mrbullmoney@gmail.com' || session?.isAdmin) {
                console.log('📱 Admin detected via localStorage:', session.email);
                setIsAdmin(true);
              } else {
                setIsAdmin(false);
              }
            } catch (e) {
              console.error('Failed to parse localStorage session');
              setIsAdmin(false);
            }
          } else {
            setIsAdmin(false);
          }
        }
      } catch (e) {
        console.error('❌ Error checking admin status:', e);
        // Try localStorage as fallback
        const savedSession = localStorage.getItem('bullmoney_session');
        if (savedSession) {
          try {
            const session = JSON.parse(savedSession);
            // Always set userId and email for VIP checks regardless of admin status
            if (session?.id) {
              setUserId(session.id);
            }
            if (session?.email) {
              setUserEmail(session.email);
            }
            if (session?.email === 'mrbullmoney@gmail.com' || session?.isAdmin) {
              setIsAdmin(true);
            }
          } catch (err) {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      }
    };
    
    checkAdmin();
    
    // Subscribe to auth state changes for real-time detection
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);
      if (session?.user?.email) {
        const userEmail = session.user.email;
        const isAdminUser = userEmail === 'mrbullmoney@gmail.com';
        console.log('📧 Auth change email:', userEmail, 'isAdmin:', isAdminUser);
        setIsAdmin(isAdminUser);
        // Always set userId and email for VIP checks (not just for admins)
        setUserId(session.user.id);
        setUserEmail(userEmail);
        if (isAdminUser) {
          console.log('✅ Admin user detected via auth change');
        }
      } else {
        // Check localStorage too
        const savedSession = localStorage.getItem('bullmoney_session');
        if (savedSession) {
          try {
            const sess = JSON.parse(savedSession);
            // Always set userId and email for VIP checks regardless of admin status
            if (sess?.id) {
              setUserId(sess.id);
            }
            if (sess?.email) {
              setUserEmail(sess.email);
            }
            if (sess?.email === 'mrbullmoney@gmail.com' || sess?.isAdmin) {
              console.log('📱 Admin from localStorage on auth change');
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          } catch (e) {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      }
    });
    
    // Also watch localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bullmoney_session' && e.newValue) {
        try {
          const session = JSON.parse(e.newValue);
          // Always set userId and email for VIP checks
          if (session?.id) {
            setUserId(session.id);
          }
          if (session?.email) {
            setUserEmail(session.email);
          }
          if (session?.email === 'mrbullmoney@gmail.com' || session?.isAdmin) {
            console.log('💾 Admin detected via localStorage change');
            setIsAdmin(true);
          }
        } catch (err) {
          console.error('Failed to parse localStorage change');
        }
      }
      // Also check for adminToken (set after successful admin login)
      if (e.key === 'adminToken' && e.newValue) {
        console.log('🔑 Admin token detected via localStorage change');
        setIsAdmin(true);
      }
    };
    
    // Check if adminToken already exists (user previously logged into admin panel)
    const existingAdminToken = localStorage.getItem('adminToken');
    if (existingAdminToken) {
      console.log('🔑 Existing admin token found, enabling admin mode');
      setIsAdmin(true);
    }
    
    // Keyboard shortcut: Cmd+Shift+A (Mac) or Ctrl+Shift+A (Windows) to open admin panel directly
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        console.log('⌨️ Admin shortcut triggered (Cmd/Ctrl+Shift+A)');
        window.dispatchEvent(new CustomEvent('openAdminVIPPanel'));
        setIsExpanded(false);
      }
    };
    
    // Listen for manual admin enable event (can be triggered from console: window.dispatchEvent(new CustomEvent('enableAdminMode')))
    const handleEnableAdmin = () => {
      console.log('🔓 Admin mode enabled via custom event');
      setIsAdmin(true);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('enableAdminMode', handleEnableAdmin);
    
    return () => {
      subscription?.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('enableAdminMode', handleEnableAdmin);
    };
  }, [supabase]);

  useEffect(() => {
    if (isAnyModalOpen || isMobileMenuOpen || isUltimatePanelOpen) {
      setIsExpanded(false);
    }
  }, [isAnyModalOpen, isMobileMenuOpen, isUltimatePanelOpen]);
  
  // Debug isAdmin state
  useEffect(() => {
    console.log('🔍 isAdmin state:', isAdmin, 'isExpanded:', isExpanded, 'mounted:', mounted);
  }, [isAdmin, isExpanded, mounted]);
  
  useEffect(() => {
    const handleTradingOpen = () => setIsExpanded(false);
    window.addEventListener('tradingQuickAccessOpened', handleTradingOpen);
    return () => window.removeEventListener('tradingQuickAccessOpened', handleTradingOpen);
  }, []);
  
  useEffect(() => {
    if (isExpanded) {
      window.dispatchEvent(new CustomEvent('communityQuickAccessOpened'));
    } else {
      window.dispatchEvent(new CustomEvent('communityQuickAccessClosed'));
    }
  }, [isExpanded]);

  // Hide when other menus open or are being hovered
  useEffect(() => {
    const handleBrowserOpen = () => { setOtherMenuOpen(true); setIsExpanded(false); };
    const handleBrowserClose = () => setOtherMenuOpen(false);
    const handleTradingOpen = () => { setOtherMenuOpen(true); setIsExpanded(false); };
    const handleTradingClose = () => setOtherMenuOpen(false);
    const handleOtherHoverStart = () => { setOtherHovered(true); setIsExpanded(false); };
    const handleOtherHoverEnd = () => setOtherHovered(false);
    
    window.addEventListener('browserSwitchOpened', handleBrowserOpen);
    window.addEventListener('browserSwitchClosed', handleBrowserClose);
    window.addEventListener('tradingQuickAccessOpened', handleTradingOpen);
    window.addEventListener('tradingQuickAccessClosed', handleTradingClose);
    window.addEventListener('browserSwitchHovered', handleOtherHoverStart);
    window.addEventListener('browserSwitchUnhovered', handleOtherHoverEnd);
    window.addEventListener('tradingQuickAccessHovered', handleOtherHoverStart);
    window.addEventListener('tradingQuickAccessUnhovered', handleOtherHoverEnd);
    
    return () => {
      window.removeEventListener('browserSwitchOpened', handleBrowserOpen);
      window.removeEventListener('browserSwitchClosed', handleBrowserClose);
      window.removeEventListener('tradingQuickAccessOpened', handleTradingOpen);
      window.removeEventListener('tradingQuickAccessClosed', handleTradingClose);
      window.removeEventListener('browserSwitchHovered', handleOtherHoverStart);
      window.removeEventListener('browserSwitchUnhovered', handleOtherHoverEnd);
      window.removeEventListener('tradingQuickAccessHovered', handleOtherHoverStart);
      window.removeEventListener('tradingQuickAccessUnhovered', handleOtherHoverEnd);
    };
  }, []);

  // Reset otherMenuOpen when they close
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isExpanded) {
        setOtherMenuOpen(false);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  const shouldHide = !mounted || !isV2Unlocked || isMobileMenuOpen || isUltimatePanelOpen || isAnyModalOpen;
  
  // Prevent hover-open when another panel is active
  const canOpen = !otherMenuOpen && !otherHovered;
  
  // Dispatch hover events for coordination
  const handleMouseEnter = () => {
    window.dispatchEvent(new CustomEvent('communityQuickAccessHovered'));
    if (canOpen) setIsExpanded(true);
  };
  const handleMouseLeave = () => {
    window.dispatchEvent(new CustomEvent('communityQuickAccessUnhovered'));
  };

  if (shouldHide || otherMenuOpen) {
    return null;
  }

  const handleDiscordClick = () => {
    window.open('https://discord.com/invite/9vVB44ZrNA', '_blank', 'noopener,noreferrer');
  };

  const handleTelegramClick = () => {
    window.open('https://t.me/bullmoneywebsite', '_blank', 'noopener,noreferrer');
  };

  const handleInstagramClick = () => {
    window.open('https://www.instagram.com/bullmoney.online/', '_blank', 'noopener,noreferrer');
  };

  const handleYoutubeClick = () => {
    window.open('https://youtube.com/@bullmoney.online', '_blank', 'noopener,noreferrer');
  };

  const handleVIPClick = () => {
    window.dispatchEvent(new CustomEvent('openProductsModal'));
    setTimeout(() => setIsExpanded(false), 100);
  };

  // Browser opener function
  const handleOpenBrowser = (browserId: string) => {
    const currentUrl = window.location.href;
    const browser = browsers.find(b => b.id === browserId);
    
    if (!browser) return;
    
    setOpeningBrowser(browserId);
    
    const browserUrl = browser.getUrl(currentUrl);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    try {
      iframe.contentWindow?.location.replace(browserUrl);
    } catch (e) {
      // URL scheme failed
    }
    
    setTimeout(() => {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
      document.body.removeChild(iframe);
      setOpeningBrowser(null);
    }, 500);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Community Pill - Positioned below Trading Quick Access */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{ 
          type: 'spring',
          stiffness: 80,
          damping: 20,
          delay: 0.5,
          mass: 0.8
        }}
        className="fixed left-0 z-[250000] pointer-events-none"
        style={{
          top: 'calc(5rem + env(safe-area-inset-top, 0px) + 130px)',
          paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 8px)',
        }}
      >
        <motion.div
          whileHover={{ 
            x: 12, 
            scale: 1.05,
            boxShadow: '0 0 30px rgba(96, 165, 250, 0.6)'
          }}
          className="relative pointer-events-auto cursor-pointer"
          onClick={() => canOpen && setIsExpanded(!isExpanded)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          animate={{
            x: [0, 8, 0, 6, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 3,
            ease: 'easeInOut',
            times: [0, 0.3, 0.5, 0.8, 1]
          }}
        >
          {/* Pill Content */}
          <div className="relative rounded-r-2xl bg-gradient-to-br from-cyan-600/30 via-cyan-500/15 to-zinc-900/40 backdrop-blur-2xl border-y border-r border-cyan-500/50 shadow-2xl hover:border-cyan-400/70 hover:shadow-cyan-600/40">
            {/* Enhanced pulsing glow background */}
            <motion.div
              className="absolute inset-0 rounded-r-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-transparent opacity-0"
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{ filter: 'blur(8px)' }}
            />
            
            {/* Subtle shine effect */}
            <motion.div
              className="absolute inset-0 rounded-r-2xl"
              animate={{
                boxShadow: [
                  '0 0 10px rgba(34, 211, 238, 0)',
                  '0 0 20px rgba(34, 211, 238, 0.4)',
                  '0 0 10px rgba(34, 211, 238, 0)'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            
            <div className="px-3 py-2 md:px-4 md:py-2.5 flex items-center gap-2 relative z-10">
              {/* Live Indicator */}
              <motion.div
                className="w-2 h-2 bg-cyan-400 rounded-full"
                animate={{ 
                  opacity: [1, 0.4, 1],
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    '0 0 0px rgba(34, 211, 238, 1)',
                    '0 0 8px rgba(34, 211, 238, 0.8)',
                    '0 0 0px rgba(34, 211, 238, 1)'
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              />

              {/* Text */}
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-cyan-300 drop-shadow-[0_0_3px_rgba(34,211,238,0.5)]" />
                <span className="text-[9px] md:text-[10px] font-bold text-cyan-200">
                  Live Trades
                </span>
              </div>

              {/* Arrow */}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <ChevronRight className="w-3 h-3 text-cyan-400/70" />
              </motion.div>
            </div>
            
            {/* Live Trades Ticker - Below the pill */}
            <LiveTradesTicker />
          </div>
        </motion.div>
      </motion.div>

      {/* Expanded Dropdown */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 bg-transparent z-[249999]"
              style={{ touchAction: 'manipulation' }}
            />

            {/* Compact Dropdown */}
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.9 }}
              transition={{ 
                type: 'spring', 
                damping: 22, 
                stiffness: 300,
                mass: 0.8
              }}
              className="fixed z-[250000] w-[85vw] xs:w-[90vw] sm:w-[340px] md:w-[420px] lg:w-[480px] max-w-[90vw]"
              style={{
                left: 'max(6px, calc(env(safe-area-inset-left, 0px) + 6px))',
                right: 'auto',
                top: 'clamp(4.5rem, calc(5rem + env(safe-area-inset-top, 0px) + 130px), calc(100vh - 500px))',
                maxHeight: 'clamp(400px, calc(100vh - 120px), 80vh)',
              }}
              onMouseLeave={() => setIsExpanded(false)}
            >
              <div className="bg-gradient-to-br from-zinc-900/98 via-zinc-800/98 to-zinc-900/98 backdrop-blur-2xl rounded-2xl border border-blue-500/30 shadow-2xl shadow-blue-900/20 overflow-hidden flex flex-col h-full max-h-[inherit]">
                {/* Header */}
                <div className="p-2 sm:p-3 md:p-4 border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                      <h3 className="text-[11px] sm:text-xs md:text-sm font-bold text-white truncate">Live Community Feed</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <motion.div
                        className="w-1.5 h-1.5 bg-green-400 rounded-full"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="text-[8px] text-green-400">LIVE</span>
                    </div>
                  </div>
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] text-zinc-400 mt-0.5">
                    Real-time updates from Telegram
                  </p>
                </div>
                
                {/* Channel Tabs */}
                <div className="flex items-center gap-1 p-2 border-b border-white/10 overflow-x-auto flex-shrink-0">
                  {(Object.keys(CHANNELS) as ChannelKey[]).map((key) => {
                    const ch = CHANNELS[key];
                    const Icon = ch.icon;
                    const isActive = activeChannel === key;
                    const isLocked = ch.requiresVip && !isVip;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveChannel(key)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium transition-all whitespace-nowrap ${
                          isActive
                            ? ch.color === 'amber'
                              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                              : ch.color === 'emerald'
                              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                              : ch.color === 'cyan'
                              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                              : 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                            : 'bg-white/5 text-zinc-400 border border-transparent hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {ch.name}
                        {isLocked && <Lock className="w-2.5 h-2.5 ml-0.5 opacity-60" />}
                      </button>
                    );
                  })}
                  
                  {/* Admin Button - Always visible, opens admin panel for login */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      console.log('Opening admin panel...');
                      window.dispatchEvent(new CustomEvent('openAdminVIPPanel'));
                      setIsExpanded(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ml-auto ${
                      isAdmin 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border border-blue-400/60 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50'
                        : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-600/40 hover:border-zinc-500/60'
                    }`}
                    title="Admin Panel - Manage VIP Status & Users (Cmd+Shift+A)"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {isAdmin ? 'Admin Panel' : 'Admin'}
                  </motion.button>
                </div>

                {/* Scrollable Feed Section */}
                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                  <TelegramChannelEmbed channel={activeChannel} isVip={isVip} />
                </div>

                {/* View All Link */}
                <div className="px-2 sm:px-3 py-1.5 border-t border-blue-500/10 flex-shrink-0">
                  <a
                    href={`https://t.me/${CHANNELS[activeChannel].handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 text-[9px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    View all on Telegram
                  </a>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent mx-2" />

                {/* Browser Switcher Section - Compact with detached hover menu */}
                <div className="p-2 sm:p-2.5 md:p-3 flex-shrink-0">
                  <div className="flex gap-2">
                    {/* Open in Browser Button */}
                    <motion.button
                      ref={browserButtonRef}
                      onClick={() => {
                        setBrowserMenuOpen(true);
                        setIsExpanded(false); // Close the dropdown
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 px-2 sm:px-2.5 md:px-3 rounded-lg
                        bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500
                        text-white font-semibold text-[10px] sm:text-xs md:text-xs whitespace-nowrap
                        border border-blue-500/30
                        shadow-lg shadow-blue-500/25
                        transition-all duration-300"
                    >
                      <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">Open in Browser</span>
                      <span className="sm:hidden text-[9px]">Browser</span>
                      <ChevronRight className={`w-2.5 h-2.5 transition-transform ${browserMenuOpen ? 'rotate-90' : ''}`} />
                    </motion.button>

                    {/* Copy Link Button */}
                    <motion.button
                      onClick={handleCopyLink}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg
                        ${copied 
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600' 
                          : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500'
                        }
                        text-white font-semibold text-[10px] sm:text-xs
                        border border-blue-500/30
                        shadow-lg shadow-blue-500/25
                        transition-all duration-300
                      `}
                    >
                      {copied ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                    </motion.button>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent mx-2" />

                {/* Social Buttons Section */}
                <div className="p-2 sm:p-2.5 md:p-3 space-y-1.5 sm:space-y-2 flex-shrink-0">
                  <p className="text-[9px] text-zinc-500 font-semibold mb-1.5">JOIN OUR PLATFORMS</p>
                  {/* Discord */}
                  <motion.button
                    onClick={handleDiscordClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 px-2 sm:px-2.5 md:px-3 rounded-lg
                      bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500
                      text-white font-semibold text-[10px] sm:text-xs md:text-xs whitespace-nowrap
                      border border-blue-500/30
                      shadow-lg shadow-blue-500/25
                      transition-all duration-300"
                  >
                    <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Discord Server</span>
                    <span className="sm:hidden text-[9px]">Discord</span>
                  </motion.button>

                  {/* Telegram */}
                  <motion.button
                    onClick={handleTelegramClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 px-2 sm:px-2.5 md:px-3 rounded-lg
                      bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400
                      text-white font-semibold text-[10px] sm:text-xs md:text-xs whitespace-nowrap
                      border border-blue-500/30
                      shadow-lg shadow-blue-500/25
                      transition-all duration-300"
                  >
                    <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Telegram Group</span>
                    <span className="sm:hidden text-[9px]">Telegram</span>
                  </motion.button>

                  {/* Instagram */}
                  <motion.button
                    onClick={handleInstagramClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 px-2 sm:px-2.5 md:px-3 rounded-lg
                      bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500
                      text-white font-semibold text-[10px] sm:text-xs md:text-xs whitespace-nowrap
                      border border-blue-500/30
                      shadow-lg shadow-blue-500/25
                      transition-all duration-300"
                  >
                    <Instagram className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Instagram</span>
                    <span className="sm:hidden text-[9px]">Instagram</span>
                  </motion.button>

                  {/* YouTube */}
                  <motion.button
                    onClick={handleYoutubeClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 px-2 sm:px-2.5 md:px-3 rounded-lg
                      bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500
                      text-white font-semibold text-[10px] sm:text-xs md:text-xs whitespace-nowrap
                      border border-blue-500/30
                      shadow-lg shadow-blue-500/25
                      transition-all duration-300"
                  >
                    <Youtube className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">YouTube Channel</span>
                    <span className="sm:hidden text-[9px]">YouTube</span>
                  </motion.button>

                  {/* Join VIP */}
                  <motion.button
                    onClick={handleVIPClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-2 sm:py-2.5 px-2 sm:px-2.5 md:px-3 rounded-lg
                      bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500
                      text-white font-bold text-[10px] sm:text-xs md:text-xs whitespace-nowrap
                      border border-amber-500/30
                      shadow-lg shadow-amber-500/30
                      transition-all duration-300
                      relative overflow-hidden"
                  >
                    {/* Shimmer overlay - left to right */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
                      animate={{
                        x: ['-100%', '100%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                    
                    <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0 relative z-10" />
                    <span className="hidden sm:inline relative z-10">Join VIP</span>
                    <span className="sm:hidden text-[9px] relative z-10">VIP</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detached Browser Menu - Centered Modal on top of everything */}
      <AnimatePresence>
        {browserMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBrowserMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999998]"
            />
            
            {/* Browser Menu Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="fixed z-[999999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[320px]"
            >
              <div className="bg-gradient-to-br from-zinc-900/98 via-zinc-800/98 to-zinc-900/98 backdrop-blur-2xl rounded-2xl border border-blue-500/40 shadow-2xl shadow-blue-900/30 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-blue-400" />
                      <h3 className="text-sm font-bold text-white">Open in Browser</h3>
                    </div>
                    <motion.button
                      onClick={() => setBrowserMenuOpen(false)}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      ✕
                    </motion.button>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Select your preferred browser
                  </p>
                </div>
                
                {/* Browser List */}
                <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
                  {browsers.map((browser, index) => {
                    const Icon = browser.icon;
                    const isLoading = openingBrowser === browser.id;
                    
                    return (
                      <motion.button
                        key={browser.id}
                        onClick={() => {
                          handleOpenBrowser(browser.id);
                          setBrowserMenuOpen(false);
                        }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isLoading}
                        className="w-full flex items-center justify-between p-3 rounded-lg
                          bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20
                          text-white font-medium text-xs
                          border border-blue-500/30 hover:border-blue-400/50
                          transition-all duration-200
                          disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-blue-400" />
                          </div>
                          <span>{browser.fullName}</span>
                        </div>
                        
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-t-transparent border-blue-400 rounded-full"
                          />
                        ) : (
                          <ExternalLink className="w-4 h-4 text-blue-400 opacity-50" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default CommunityQuickAccess;
