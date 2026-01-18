"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Shield
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
  main: { name: 'LIVESTREAMS', handle: 'bullmoneyfx', icon: MessageCircle, color: 'blue', requiresVip: false },
  shop: { name: 'NEWS', handle: 'Bullmoneyshop', icon: ShoppingBag, color: 'blue', requiresVip: false },
  vip: { name: 'VIP TRADES', handle: 'bullmoneyvip', icon: Crown, color: 'blue', requiresVip: true },
} as const;

type ChannelKey = keyof typeof CHANNELS;

// VIP status hook (simplified inline version)
function useVipCheck(userId?: string) {
  const [isVip, setIsVip] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const checkStatus = useCallback(async () => {
    if (!userId) {
      setIsVip(false);
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/vip/status?userId=${userId}`, { cache: 'no-store' });
      const data = await res.json();
      setIsVip(data.isVip ?? false);
    } catch (e) {
      console.error('VIP check failed:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
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
                : 'bg-gradient-to-br from-blue-500 to-cyan-500'
            }`}>
              {channel === 'vip' ? <Star className="w-4 h-4" /> : channel === 'shop' ? <ShoppingBag className="w-4 h-4" /> : 'B'}
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

export function CommunityQuickAccess() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [otherMenuOpen, setOtherMenuOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState<ChannelKey>('main');
  const [userId, setUserId] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { isAnyModalOpen, isMobileMenuOpen, isUltimatePanelOpen, isV2Unlocked } = useUIState();
  const { isVip } = useVipCheck(userId);
  
  // Detect if logged-in user is the admin by checking Supabase session
  useEffect(() => {
    setMounted(true);
    const supabase = createSupabaseClient();
    
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email) {
          const userEmail = session.user.email;
          const isAdminUser = userEmail === 'mrbullmoney@gmail.com' || userEmail?.toLowerCase() === 'mrbullmoney@gmail.com'.toLowerCase();
          setIsAdmin(isAdminUser);
          setUserId(session.user.id);
          if (isAdminUser) {
            console.log('✅ Admin user detected:', userEmail);
          }
        } else {
          setIsAdmin(false);
          setUserId(undefined);
        }
      } catch (e) {
        console.error('Error checking admin status:', e);
        setIsAdmin(false);
      }
    };
    
    checkAdmin();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.email) {
        const userEmail = session.user.email;
        const isAdminUser = userEmail === 'mrbullmoney@gmail.com' || userEmail?.toLowerCase() === 'mrbullmoney@gmail.com'.toLowerCase();
        setIsAdmin(isAdminUser);
        setUserId(session.user.id);
        if (isAdminUser) {
          console.log('✅ Admin user detected:', userEmail);
        }
      } else {
        setIsAdmin(false);
        setUserId(undefined);
      }
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAnyModalOpen || isMobileMenuOpen || isUltimatePanelOpen) {
      setIsExpanded(false);
    }
  }, [isAnyModalOpen, isMobileMenuOpen, isUltimatePanelOpen]);
  
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

  // Hide when other menus open
  useEffect(() => {
    const handleBrowserOpen = () => setOtherMenuOpen(true);
    const handleBrowserClose = () => setOtherMenuOpen(false);
    const handleTradingOpen = () => setOtherMenuOpen(true);
    const handleTradingClose = () => setOtherMenuOpen(false);
    
    window.addEventListener('browserSwitchOpened', handleBrowserOpen);
    window.addEventListener('browserSwitchClosed', handleBrowserClose);
    window.addEventListener('tradingQuickAccessOpened', handleTradingOpen);
    window.addEventListener('tradingQuickAccessClosed', handleTradingClose);
    
    return () => {
      window.removeEventListener('browserSwitchOpened', handleBrowserOpen);
      window.removeEventListener('browserSwitchClosed', handleBrowserClose);
      window.removeEventListener('tradingQuickAccessOpened', handleTradingOpen);
      window.removeEventListener('tradingQuickAccessClosed', handleTradingClose);
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

  if (shouldHide || otherMenuOpen) {
    return null;
  }

  const handleDiscordClick = () => {
    window.open('https://discord.com/invite/9vVB44ZrNA', '_blank', 'noopener,noreferrer');
  };

  const handleTelegramClick = () => {
    window.open('https://t.me/bullmoneyfx', '_blank', 'noopener,noreferrer');
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
          onClick={() => setIsExpanded(!isExpanded)}
          onMouseEnter={() => setIsExpanded(true)}
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
          <div className="relative rounded-r-full bg-gradient-to-br from-blue-600/30 via-blue-500/15 to-zinc-900/40 backdrop-blur-2xl border-y border-r border-blue-500/50 shadow-2xl hover:border-blue-400/70 hover:shadow-blue-600/40">
            {/* Enhanced pulsing glow background */}
            <motion.div
              className="absolute inset-0 rounded-r-full bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-transparent opacity-0"
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
              className="absolute inset-0 rounded-r-full"
              animate={{
                boxShadow: [
                  '0 0 10px rgba(96, 165, 250, 0)',
                  '0 0 20px rgba(96, 165, 250, 0.4)',
                  '0 0 10px rgba(96, 165, 250, 0)'
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
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{ 
                  opacity: [1, 0.4, 1],
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    '0 0 0px rgba(96, 165, 250, 1)',
                    '0 0 8px rgba(96, 165, 250, 0.8)',
                    '0 0 0px rgba(96, 165, 250, 1)'
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              />

              {/* Text */}
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-blue-300 drop-shadow-[0_0_3px_rgba(147,197,253,0.5)]" />
                <span className="text-[9px] md:text-[10px] font-bold text-blue-200">
                  Community
                </span>
              </div>

              {/* Arrow */}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <ChevronRight className="w-3 h-3 text-blue-400/70" />
              </motion.div>
            </div>
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
                  
                  {/* Admin Button - Only visible for mrbullmoney@gmail.com */}
                  {isAdmin && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => {
                        console.log('Opening admin panel...');
                        window.dispatchEvent(new CustomEvent('openAdminVIPPanel'));
                        setIsExpanded(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border border-blue-400/60 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 ml-auto"
                      title="Admin Panel - Manage VIP Status & Users (Cmd+Shift+A)"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Admin Panel
                    </motion.button>
                  )}
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
    </>
  );
}

export default CommunityQuickAccess;
