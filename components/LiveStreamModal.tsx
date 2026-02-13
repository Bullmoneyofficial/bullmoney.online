// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Radio, Loader2, LogIn, LogOut, User, Tv, ExternalLink, RefreshCw } from 'lucide-react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useShop } from '@/components/ShopContext';
import { createSupabaseClient } from '@/lib/supabase';
import { useLiveStreamModalUI } from '@/contexts/UIStateContext';

const YouTube = dynamic(() => import('react-youtube'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black/20" />,
});

const YOUTUBE_CLIENT_ID = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID || '';
const YOUTUBE_SCOPES = 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
const YT_STORAGE_KEY = 'bullmoney_youtube_auth';
const DISCOVER_CACHE_KEY = 'bullmoney_discover_videos';
const DISCOVER_TTL = 2 * 60 * 1000; // 2 minutes
const MARKET_NEWS_REFRESH_MS = 60 * 1000;

// Types
interface DiscoverVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  category: string;
}

interface DiscoverCache {
  videos: DiscoverVideo[];
  categories: string[];
  generatedAt: number;
}

interface YouTubeAuthData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  user: {
    name: string;
    email: string;
    picture: string;
    channelId: string | null;
  };
}

// Modal Context
interface ModalState {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ModalContext = React.createContext<ModalState | undefined>(undefined);

const useModalState = () => {
  const context = React.useContext(ModalContext);
  if (!context) throw new Error('useModalState must be used within LiveStreamModal');
  return context;
};

// Main Modal Component
export const LiveStreamModal = memo(() => {
  const { isOpen, setIsOpen, shouldSkipHeavyEffects } = useLiveStreamModalUI();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <ModalContext.Provider value={{ isOpen, setIsOpen }}>
      {createPortal(
        <AnimatePresence>
          {isOpen && <LiveStreamContent shouldSkipHeavyEffects={shouldSkipHeavyEffects} />}
        </AnimatePresence>,
        document.body
      )}
    </ModalContext.Provider>
  );
});
LiveStreamModal.displayName = 'LiveStreamModal';

// YouTube Player Options
const YT_PLAYER_OPTS = {
  width: '100%',
  height: '100%',
  playerVars: {
    autoplay: 1,
    modestbranding: 1,
    rel: 0,
    playsinline: 1,
  },
};

// Main Content
const LiveStreamContent = memo(({ shouldSkipHeavyEffects }: { shouldSkipHeavyEffects: boolean }) => {
  const { setIsOpen } = useModalState();
  const { state } = useShop();

  const [discoverVideos, setDiscoverVideos] = useState<DiscoverVideo[]>([]);
  const [discoverCategories, setDiscoverCategories] = useState<string[]>([]);
  const [discoverVideoId, setDiscoverVideoId] = useState<string | null>(null);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverTimeLeft, setDiscoverTimeLeft] = useState('');
  const [activeTab, setActiveTab] = useState<'bullmoney' | 'personal'>('personal');
  const [ytAuth, setYtAuth] = useState<YouTubeAuthData | null>(null);
  const [ytAuthLoading, setYtAuthLoading] = useState(false);
  const [personalVideos, setPersonalVideos] = useState<any[]>([]);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalVideoId, setPersonalVideoId] = useState<string | null>(null);
  const [marketNewsVideo, setMarketNewsVideo] = useState<DiscoverVideo | null>(null);
  const [marketNewsLoading, setMarketNewsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateMatch = () => setIsDesktop(mediaQuery.matches);
    updateMatch();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatch);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateMatch);
      }
    };
  }, []);

  const shouldSkipEffects = shouldSkipHeavyEffects || !isDesktop;

  // Load YouTube auth from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(YT_STORAGE_KEY);
      if (saved) {
        const parsed: YouTubeAuthData = JSON.parse(saved);
        // Check if token is still valid (with 5 min buffer)
        if (parsed.expiresAt > Date.now() + 300000) {
          setYtAuth(parsed);
        } else if (parsed.refreshToken) {
          // Try to refresh
          refreshYouTubeToken(parsed.refreshToken);
        } else {
          localStorage.removeItem(YT_STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(YT_STORAGE_KEY);
    }
  }, []);

  // Refresh token helper
  const refreshYouTubeToken = useCallback(async (refreshToken: string) => {
    try {
      const res = await fetch('/api/auth/youtube/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) {
        localStorage.removeItem(YT_STORAGE_KEY);
        setYtAuth(null);
        return;
      }
      const data = await res.json();
      setYtAuth(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          accessToken: data.access_token,
          expiresAt: Date.now() + (data.expires_in * 1000),
        };
        localStorage.setItem(YT_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      localStorage.removeItem(YT_STORAGE_KEY);
      setYtAuth(null);
    }
  }, []);

  // Listen for OAuth callback message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'YOUTUBE_AUTH_SUCCESS') {
        const authData: YouTubeAuthData = {
          accessToken: event.data.accessToken,
          refreshToken: event.data.refreshToken,
          expiresAt: Date.now() + (event.data.expiresIn * 1000),
          user: event.data.user,
        };
        localStorage.setItem(YT_STORAGE_KEY, JSON.stringify(authData));
        setYtAuth(authData);
        setYtAuthLoading(false);
      }
      if (event.data?.type === 'YOUTUBE_AUTH_ERROR') {
        console.error('YouTube auth error:', event.data.error);
        setYtAuthLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Load cached discover videos or fetch fresh ones
  const fetchDiscoverVideos = useCallback(async (force = false) => {
    const rotationBucket = Math.floor(Date.now() / DISCOVER_TTL);

    // Check cache first
    if (!force) {
      try {
        const cached = localStorage.getItem(DISCOVER_CACHE_KEY);
        if (cached) {
          const parsed: DiscoverCache = JSON.parse(cached);
          if (Date.now() - parsed.generatedAt < DISCOVER_TTL) {
            setDiscoverVideos(parsed.videos);
            setDiscoverCategories(parsed.categories);
            setDiscoverVideoId((prev) => prev || parsed.videos[0]?.videoId || null);
            return;
          }
        }
      } catch {
        localStorage.removeItem(DISCOVER_CACHE_KEY);
      }
    }

    setDiscoverLoading(true);
    try {
      const res = await fetch(`/api/youtube/discover?bucket=${rotationBucket}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.videos?.length > 0) {
          const cache: DiscoverCache = {
            videos: data.videos,
            categories: data.categories,
            generatedAt: data.generatedAt,
          };
          localStorage.setItem(DISCOVER_CACHE_KEY, JSON.stringify(cache));
          setDiscoverVideos(data.videos);
          setDiscoverCategories(data.categories);
          setDiscoverVideoId((prev) => prev || data.videos[0].videoId);
        }
      }
    } catch (err) {
      console.error('Error fetching discover videos:', err);
    } finally {
      setDiscoverLoading(false);
    }
  }, []);

  // Load discover videos on mount
  useEffect(() => {
    fetchDiscoverVideos();
  }, []);

  // Countdown timer for next refresh
  useEffect(() => {
    const tick = () => {
      try {
        const cached = localStorage.getItem(DISCOVER_CACHE_KEY);
        if (cached) {
          const parsed: DiscoverCache = JSON.parse(cached);
          const remaining = (parsed.generatedAt + DISCOVER_TTL) - Date.now();
          if (remaining <= 0) {
            setDiscoverTimeLeft('Refreshing...');
            fetchDiscoverVideos(true);
            return;
          }
          const mins = Math.floor(remaining / 60000);
          const secs = Math.floor((remaining % 60000) / 1000);
          setDiscoverTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
        }
      } catch {}
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [fetchDiscoverVideos]);

  // Fetch personal YouTube videos when authed and on personal tab
  useEffect(() => {
    if (activeTab !== 'personal' || !ytAuth?.accessToken || !ytAuth.user?.channelId) return;

    const fetchPersonalVideos = async () => {
      setPersonalLoading(true);
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${ytAuth.user.channelId}&order=date&maxResults=15&type=video`,
          { headers: { Authorization: `Bearer ${ytAuth.accessToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setPersonalVideos(data.items || []);
        }
      } catch (err) {
        console.error('Error fetching personal videos:', err);
      } finally {
        setPersonalLoading(false);
      }
    };
    fetchPersonalVideos();
  }, [activeTab, ytAuth]);

  const fetchLatestMarketNewsVideo = useCallback(async () => {
    if (activeTab !== 'personal' || ytAuth) return;
    setMarketNewsLoading(true);
    try {
      const res = await fetch(`/api/youtube/discover?mode=market-news&fresh=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      const latestVideo = data?.videos?.[0] || null;
      setMarketNewsVideo(latestVideo);
    } catch (err) {
      console.error('Error fetching latest market news video:', err);
    } finally {
      setMarketNewsLoading(false);
    }
  }, [activeTab, ytAuth]);

  useEffect(() => {
    if (activeTab !== 'personal' || ytAuth) return;

    fetchLatestMarketNewsVideo();
    const interval = setInterval(fetchLatestMarketNewsVideo, MARKET_NEWS_REFRESH_MS);
    return () => clearInterval(interval);
  }, [activeTab, ytAuth, fetchLatestMarketNewsVideo]);

  const handleClose = useCallback(() => {
    SoundEffects.click();
    setIsOpen(false);
  }, [setIsOpen]);

  const handleBackdropTouch = useCallback((e: React.TouchEvent) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      handleClose();
    }
  }, [handleClose]);

  // Google OAuth popup flow
  const handleConnectYouTube = useCallback(() => {
    SoundEffects.click();
    if (!YOUTUBE_CLIENT_ID) {
      console.error('YouTube Client ID not configured');
      return;
    }
    setYtAuthLoading(true);

    // Generate CSRF state
    const state = crypto.randomUUID();
    sessionStorage.setItem('youtube_oauth_state', state);

    const redirectUri = `${window.location.origin}/auth/youtube/callback`;
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', YOUTUBE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', YOUTUBE_SCOPES);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    const w = 500;
    const h = 600;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    window.open(authUrl.toString(), 'youtube_auth', `width=${w},height=${h},left=${left},top=${top}`);
  }, []);

  const handleDisconnect = useCallback(() => {
    SoundEffects.click();
    localStorage.removeItem(YT_STORAGE_KEY);
    setYtAuth(null);
    setPersonalVideos([]);
    setPersonalVideoId(null);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={shouldSkipEffects ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={shouldSkipEffects ? undefined : { opacity: 0 }}
        transition={shouldSkipEffects ? { duration: 0 } : { duration: 0.12 }}
        onClick={handleClose}
        onTouchEnd={handleBackdropTouch}
        className="fixed inset-0"
        style={{ zIndex: 2147483648, background: 'rgba(0,0,0,0.2)', pointerEvents: 'auto' }}
      />

      {/* Modal */}
      <motion.div
        initial={shouldSkipEffects ? false : (isDesktop ? { y: '-100%' } : { y: '100%' })}
        animate={isDesktop ? { y: 0 } : { y: 0 }}
        exit={shouldSkipEffects ? undefined : (isDesktop ? { y: '-100%' } : { y: '100%' })}
        transition={shouldSkipEffects ? { duration: 0 } : { type: 'tween', duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className={
          isDesktop
            ? 'fixed top-0 left-0 right-0 w-full bg-white border-b border-black/10 flex flex-col safe-area-inset-bottom max-h-[90vh] overflow-hidden'
            : 'fixed inset-0 w-full bg-white flex flex-col safe-area-inset-bottom overflow-hidden'
        }
        style={{ zIndex: 2147483649, color: '#1d1d1f', pointerEvents: 'auto', isolation: 'isolate' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-black/10">
          <motion.button
            onClick={handleClose}
            whileHover={shouldSkipEffects ? undefined : { scale: 1.05 }}
            whileTap={shouldSkipEffects ? undefined : { scale: 0.95 }}
            className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-9 w-9 rounded-xl bg-black/5 flex items-center justify-center">
              <Radio className="w-4 h-4 md:w-5 md:h-5 text-black" />
            </div>
            <div className="leading-tight text-center">
              <h2 className="text-lg md:text-xl font-light">Live Stream</h2>
              <p className="text-[10px] font-medium" style={{ color: 'rgba(0,0,0,0.4)' }}>Watch & Manage</p>
            </div>
          </div>

          <motion.button
            onClick={handleClose}
            whileHover={shouldSkipEffects ? undefined : { scale: 1.05 }}
            whileTap={shouldSkipEffects ? undefined : { scale: 0.95 }}
            className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </motion.button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 px-4 md:px-6 py-3 md:py-4 overflow-x-auto border-b border-black/10 bg-white" style={{ WebkitOverflowScrolling: 'touch' }}>
          {[
            { key: 'personal' as const, label: 'My YouTube', icon: User },
            { key: 'bullmoney' as const, label: 'Channel', icon: Tv },
          ].map(({ key, label, icon: TabIcon }) => (
            <motion.button
              key={key}
              onClick={() => {
                SoundEffects.click();
                setActiveTab(key);
              }}
              whileHover={shouldSkipEffects ? undefined : { scale: 1.02 }}
              whileTap={shouldSkipEffects ? undefined : { scale: 0.98 }}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 rounded-lg whitespace-nowrap text-xs md:text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-black text-white'
                  : 'bg-black/5 text-black hover:bg-black/10'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {label}
              {key === 'personal' && ytAuth && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              )}
            </motion.button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4 md:p-6 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}>
          <div className="space-y-4 md:space-y-6">

            {/* ===== DISCOVER CHANNEL TAB ===== */}
            {activeTab === 'bullmoney' && (
              <>
                {/* Header with refresh timer */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-black">Discover</h3>
                    <p className="text-[11px] text-black/40">
                      {discoverCategories.length > 0
                        ? discoverCategories.join(' / ')
                        : 'Random picks from Trading, Crypto, Finance & more'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {discoverTimeLeft && (
                      <span className="text-[10px] font-mono text-black/30">{discoverTimeLeft}</span>
                    )}
                    <motion.button
                      onClick={() => {
                        SoundEffects.click();
                        fetchDiscoverVideos(true);
                      }}
                      disabled={discoverLoading}
                      whileHover={shouldSkipEffects ? undefined : { scale: 1.1 }}
                      whileTap={shouldSkipEffects ? undefined : { scale: 0.9 }}
                      className="h-7 w-7 rounded-lg bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors disabled:opacity-40"
                      title="Get new videos"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${discoverLoading ? 'animate-spin' : ''}`} />
                    </motion.button>
                  </div>
                </div>

                {/* Embedded YouTube Player */}
                {discoverLoading && discoverVideos.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-black/60">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : discoverVideoId ? (
                  <motion.div
                    key={discoverVideoId}
                    initial={shouldSkipEffects ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={shouldSkipEffects ? { duration: 0 } : { delay: 0.1 }}
                    className="space-y-3"
                  >
                    <div className="aspect-video relative rounded-xl overflow-hidden bg-black border border-black/10">
                      <YouTube
                        videoId={discoverVideoId}
                        opts={{
                          ...YT_PLAYER_OPTS,
                          playerVars: {
                            ...YT_PLAYER_OPTS.playerVars,
                            autoplay: shouldSkipEffects ? 0 : 1,
                          },
                        }}
                        onReady={(e) => { playerRef.current = e.target; }}
                        className="w-full h-full"
                        iframeClassName="w-full h-full absolute inset-0"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base md:text-lg font-semibold text-black mb-1 wrap-break-word">
                          {discoverVideos.find(v => v.videoId === discoverVideoId)?.title || ''}
                        </h3>
                        <p className="text-xs text-black/40">
                          {discoverVideos.find(v => v.videoId === discoverVideoId)?.channelTitle || ''}
                        </p>
                      </div>
                      <button
                        onClick={() => window.open(`https://youtube.com/watch?v=${discoverVideoId}`, '_blank')}
                        className="shrink-0 h-8 w-8 rounded-lg bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                        title="Open on YouTube"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-black/60">
                    <Radio className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No videos available</p>
                  </div>
                )}

                {/* Video List by Category */}
                {discoverVideos.length > 0 && (
                  <div className="space-y-4">
                    {discoverCategories.map(cat => {
                      const catVideos = discoverVideos.filter(v => v.category === cat);
                      if (catVideos.length === 0) return null;
                      return (
                        <div key={cat} className="space-y-2">
                          <h4 className="text-xs font-semibold text-black/50 uppercase tracking-wider px-1">{cat}</h4>
                          <div className="space-y-1.5">
                            {catVideos.map((video) => (
                              <motion.button
                                key={video.videoId}
                                onClick={() => {
                                  SoundEffects.click();
                                  setDiscoverVideoId(video.videoId);
                                }}
                                whileHover={shouldSkipEffects ? undefined : { scale: 1.01 }}
                                className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center gap-3 ${
                                  discoverVideoId === video.videoId
                                    ? 'bg-black border-black/30'
                                    : 'bg-black/5 border-black/10 hover:bg-black/8'
                                }`}
                              >
                                <img
                                  src={video.thumbnail}
                                  alt=""
                                  className="w-16 h-12 rounded object-cover shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm font-medium wrap-break-word ${discoverVideoId === video.videoId ? 'text-white' : 'text-black'}`}>
                                    {video.title}
                                  </p>
                                  <p className={`text-[11px] mt-0.5 ${discoverVideoId === video.videoId ? 'text-white/60' : 'text-black/40'}`}>
                                    {video.channelTitle}
                                  </p>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ===== PERSONAL YOUTUBE TAB ===== */}
            {activeTab === 'personal' && (
              <motion.div
                initial={shouldSkipEffects ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {ytAuth ? (
                  <>
                    {/* Connected user info */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-black/5 border border-black/10">
                      {ytAuth.user.picture ? (
                        <img
                          src={ytAuth.user.picture}
                          alt=""
                          className="w-10 h-10 rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-black/40" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-black truncate">{ytAuth.user.name}</p>
                        <p className="text-xs text-black/50 truncate">{ytAuth.user.email}</p>
                      </div>
                      <motion.button
                        onClick={handleDisconnect}
                        whileHover={shouldSkipEffects ? undefined : { scale: 1.05 }}
                        whileTap={shouldSkipEffects ? undefined : { scale: 0.95 }}
                        className="shrink-0 h-8 px-3 rounded-lg bg-black/5 text-black/60 text-xs font-medium hover:bg-black/10 transition-colors flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Disconnect
                      </motion.button>
                    </div>

                    {/* Personal video player */}
                    {personalVideoId && (
                      <motion.div
                        key={personalVideoId}
                        initial={shouldSkipEffects ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="aspect-video relative rounded-xl overflow-hidden bg-black border border-black/10"
                      >
                        <YouTube
                          videoId={personalVideoId}
                          opts={YT_PLAYER_OPTS}
                          className="w-full h-full"
                          iframeClassName="w-full h-full absolute inset-0"
                        />
                      </motion.div>
                    )}

                    {/* Personal channel videos */}
                    {personalLoading ? (
                      <div className="flex items-center justify-center py-8 text-black/60">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : personalVideos.length > 0 ? (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-black px-1">Your Videos ({personalVideos.length})</h3>
                        <div className="space-y-2">
                          {personalVideos.map((item) => {
                            const videoId = item.id?.videoId;
                            if (!videoId) return null;
                            const snippet = item.snippet;
                            return (
                              <motion.button
                                key={videoId}
                                onClick={() => {
                                  SoundEffects.click();
                                  setPersonalVideoId(videoId);
                                }}
                                whileHover={shouldSkipEffects ? undefined : { scale: 1.01 }}
                                className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${
                                  personalVideoId === videoId
                                    ? 'bg-black border-black/30'
                                    : 'bg-black/5 border-black/10 hover:bg-black/8'
                                }`}
                              >
                                <img
                                  src={snippet?.thumbnails?.default?.url || ''}
                                  alt=""
                                  className="w-16 h-12 rounded object-cover shrink-0"
                                />
                                <p className={`text-sm font-medium wrap-break-word ${personalVideoId === videoId ? 'text-white' : 'text-black'}`}>
                                  {snippet?.title || 'Untitled'}
                                </p>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    ) : ytAuth.user.channelId ? (
                      <div className="flex flex-col items-center justify-center py-8 text-black/60">
                        <Radio className="w-6 h-6 mb-2 opacity-50" />
                        <p className="text-sm">No videos found on your channel</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-black/60">
                        <Radio className="w-6 h-6 mb-2 opacity-50" />
                        <p className="text-sm">No YouTube channel linked to this account</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-black/10 bg-linear-to-br from-black/5 via-white to-black/5 p-4 md:p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-black text-white flex items-center justify-center shrink-0">
                          <Tv className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm md:text-base font-semibold text-black">Bullmoney YouTube Watchroom</h3>
                          <p className="text-xs md:text-sm text-black/60 mt-1">
                            Track crypto, forex and market momentum live while staying in your Bullmoney flow.
                            New category videos rotate every 2 minutes in the Channel tab.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold text-black/70 uppercase tracking-wide">Latest Market News</p>
                          <motion.button
                            onClick={() => {
                              SoundEffects.click();
                              fetchLatestMarketNewsVideo();
                            }}
                            disabled={marketNewsLoading}
                            whileHover={shouldSkipEffects ? undefined : { scale: 1.06 }}
                            whileTap={shouldSkipEffects ? undefined : { scale: 0.94 }}
                            className="h-7 w-7 rounded-lg bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors disabled:opacity-40"
                            title="Refresh latest market news"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${marketNewsLoading ? 'animate-spin' : ''}`} />
                          </motion.button>
                        </div>

                        {marketNewsVideo?.videoId ? (
                          <>
                            <div className="aspect-video relative rounded-lg overflow-hidden bg-black border border-black/10">
                              <YouTube
                                videoId={marketNewsVideo.videoId}
                                opts={{
                                  ...YT_PLAYER_OPTS,
                                  playerVars: {
                                    ...YT_PLAYER_OPTS.playerVars,
                                    autoplay: shouldSkipEffects ? 0 : 1,
                                  },
                                }}
                                className="w-full h-full"
                                iframeClassName="w-full h-full absolute inset-0"
                              />
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-black wrap-break-word">{marketNewsVideo.title || 'Live Market News Update'}</p>
                                <p className="text-[11px] text-black/50 mt-0.5 line-clamp-1">{marketNewsVideo.channelTitle || 'YouTube Markets'}</p>
                              </div>
                              <button
                                onClick={() => window.open(`https://youtube.com/watch?v=${marketNewsVideo.videoId}`, '_blank')}
                                className="shrink-0 h-8 w-8 rounded-lg bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                                title="Open on YouTube"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center py-6 text-black/50 rounded-lg border border-black/10 bg-white">
                            {marketNewsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <p className="text-xs">Loading latest market news from YouTube...</p>}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="rounded-lg border border-black/10 bg-white p-2.5">
                          <p className="text-[11px] font-semibold text-black/70 uppercase tracking-wide">Trading Focus</p>
                          <p className="text-xs text-black/55 mt-1">Market opens, setups, execution, and strategy breakdowns.</p>
                        </div>
                        <div className="rounded-lg border border-black/10 bg-white p-2.5">
                          <p className="text-[11px] font-semibold text-black/70 uppercase tracking-wide">Live Momentum</p>
                          <p className="text-xs text-black/55 mt-1">Fresh crypto and finance clips to keep your edge sharp.</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <motion.button
                          onClick={handleConnectYouTube}
                          disabled={ytAuthLoading}
                          whileHover={shouldSkipEffects ? undefined : { scale: ytAuthLoading ? 1 : 1.02 }}
                          whileTap={shouldSkipEffects ? undefined : { scale: ytAuthLoading ? 1 : 0.98 }}
                          className="flex-1 px-4 py-3 rounded-lg bg-white text-black font-medium border border-black/20 hover:bg-black/5 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60"
                        >
                          {ytAuthLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                              Connect Your YouTube
                            </>
                          )}
                        </motion.button>

                        <motion.button
                          onClick={() => {
                            SoundEffects.click();
                            setActiveTab('bullmoney');
                          }}
                          whileHover={shouldSkipEffects ? undefined : { scale: 1.02 }}
                          whileTap={shouldSkipEffects ? undefined : { scale: 0.98 }}
                          className="sm:w-auto px-4 py-3 rounded-lg bg-black text-white font-medium hover:bg-black/90 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Radio className="w-4 h-4" />
                          Watch Bullmoney Stream
                        </motion.button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
LiveStreamContent.displayName = 'LiveStreamContent';

export default LiveStreamModal;
