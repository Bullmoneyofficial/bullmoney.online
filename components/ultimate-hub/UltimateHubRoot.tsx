"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useUIState } from '@/contexts/UIStateContext';
import { useUnifiedPerformance } from '@/hooks/useDesktopPerformance';
import { useFpsMonitor } from '@/components/ultimate-hub/hooks/useFpsMonitor';
import { useAdminCheck, useLivePrices, useVipCheck } from '@/components/ultimate-hub/hooks/useAccess';
import type { ChannelKey, TelegramPost } from '@/components/ultimate-hub/types';
import { GLOBAL_NEON_STYLES } from '@/components/ultimate-hub/styles';
const UnifiedHubPanel = dynamic(
  () => import('@/components/ultimate-hub/panel/UnifiedHubPanel').then(m => ({ default: m.UnifiedHubPanel })),
  { ssr: false, loading: () => null }
);

const UnifiedFpsPill = dynamic(
  () => import('@/components/ultimate-hub/pills/UnifiedFpsPill').then(m => ({ default: m.UnifiedFpsPill })),
  { ssr: false, loading: () => null }
);

// ============================================================================
// MAIN COMPONENT - UNIFIED SINGLE PILL APPROACH
// ============================================================================

// LocalStorage key for persisting last seen message
const LAST_SEEN_MESSAGE_KEY = 'bullmoney_last_seen_message_id';
const LAST_SEEN_VIP_MESSAGE_KEY = 'bullmoney_last_seen_vip_message_id';
const NEW_MESSAGE_COUNT_KEY = 'bullmoney_new_message_count';

export function UltimateHub() {
  const [mounted, setMounted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Check if we're on a store page
  const pathname = usePathname();
  const isStorePage = pathname.startsWith('/store');

  // Check if Ultimate Hub should be shown on store pages - default to TRUE (show unless explicitly disabled)
  const [showOnStore, setShowOnStore] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load stored preference
    const stored = localStorage.getItem('store_show_ultimate_hub');
    setShowOnStore(stored !== 'false'); // Default to true for backward compatibility

    // Listen for toggle changes from StoreHeader
    const handleToggleEvent = (event: Event) => {
      // Prefer event detail when available to avoid extra storage reads
      const detailValue = (event as CustomEvent<boolean>).detail;
      if (typeof detailValue === 'boolean') {
        setShowOnStore(detailValue);
        return;
      }
      const stored = localStorage.getItem('store_show_ultimate_hub');
      setShowOnStore(stored !== 'false');
    };

    window.addEventListener('store_ultimate_hub_toggle', handleToggleEvent);
    return () => window.removeEventListener('store_ultimate_hub_toggle', handleToggleEvent);
  }, []);

  // New message notification state - persisted to localStorage
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [vipPreview, setVipPreview] = useState<Pick<TelegramPost, 'id' | 'text' | 'date'> | null>(null);
  const lastSeenMessageIdRef = useRef<Record<ChannelKey, string | null>>({
    trades: null,
    main: null,
    shop: null,
    vip: null,
    vip2: null,
  });
  const isCheckingRef = useRef(false);
  const lastPollAtRef = useRef(0);

  // Load persisted notification state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load last seen message ID from localStorage
    const savedLastSeen = localStorage.getItem(LAST_SEEN_MESSAGE_KEY);
    if (savedLastSeen) {
      lastSeenMessageIdRef.current.trades = savedLastSeen;
    }

    const savedVipLastSeen = localStorage.getItem(LAST_SEEN_VIP_MESSAGE_KEY);
    if (savedVipLastSeen) {
      lastSeenMessageIdRef.current.vip = savedVipLastSeen;
    }

    // Load any pending notification count (from when app was closed)
    const savedCount = localStorage.getItem(NEW_MESSAGE_COUNT_KEY);
    if (savedCount) {
      const count = parseInt(savedCount, 10);
      if (count > 0) {
        setHasNewMessages(true);
        setNewMessageCount(count);
      }
    }
  }, []);

  const { fps, deviceTier, jankScore } = useFpsMonitor();
  const prices = useLivePrices();
  const { isAdmin, userId, userEmail } = useAdminCheck();
  const { isVip: isVipFromCheck } = useVipCheck(userId, userEmail);

  // Admin always gets VIP access
  const isVip = isVipFromCheck || isAdmin;

  // Debug log VIP status
  useEffect(() => {
    console.log('[UltimateHub] VIP Status:', { isVip, isVipFromCheck, isAdmin, userId, userEmail });
  }, [isVip, isVipFromCheck, isAdmin, userId, userEmail]);

  const {
    isAnyModalOpen,
    isMobileMenuOpen,
    isUltimatePanelOpen,
    isUltimateHubOpen,
    isAudioWidgetOpen,
    isPagemodeOpen,
    isLoaderv2Open,
    isV2Unlocked,
    isMobileNavbarHidden,
    setUltimateHubOpen
  } = useUIState();
  const { isMobile, animations, shouldDisableBackdropBlur, shouldSkipHeavyEffects, isDesktopLiteMode } = useUnifiedPerformance();

  // Handle new message detection from Telegram embeds
  const handleNewMessage = useCallback((channel: ChannelKey | string, postId: string, post?: TelegramPost) => {
    const channelKey = (channel as ChannelKey) || 'trades';
    console.log('[UltimateHub] NEW MESSAGE DETECTED', { channel: channelKey, postId });

    const storageKey = channelKey === 'vip' ? LAST_SEEN_VIP_MESSAGE_KEY : LAST_SEEN_MESSAGE_KEY;
    const lastSeenForChannel = lastSeenMessageIdRef.current[channelKey];

    // Only increment if this is a truly new message for this channel
    if (postId !== lastSeenForChannel) {
      lastSeenMessageIdRef.current[channelKey] = postId;

      // Persist to localStorage so we remember across browser sessions
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, postId);
      }

      setHasNewMessages(true);
      setNewMessageCount(prev => {
        const newCount = prev + 1;
        // Persist count for when user returns
        if (typeof window !== 'undefined') {
          localStorage.setItem(NEW_MESSAGE_COUNT_KEY, newCount.toString());
        }
        return newCount;
      });
    }

    // Cache VIP preview content so we can tease non-VIP users
    if (channelKey === 'vip' && post) {
      setVipPreview({ id: post.id, text: post.text, date: post.date });
    }

    // Play notification sound (if tab is visible)
    try {
      if (typeof window !== 'undefined' && 'Audio' in window && document.visibilityState === 'visible') {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore autoplay errors
      }
    } catch {}
  }, []);

  // BACKGROUND POLLING: Check for new messages even when panel is closed
  // This runs every 3 seconds to ensure fast notification delivery
  // Also checks immediately when user returns to the tab (visibility change)
  useEffect(() => {
    if (!mounted) return;

    const pollChannel = async (channel: ChannelKey) => {
      try {
        const response = await fetch(`/api/telegram/channel?channel=${channel}&t=${Date.now()}`, {
          cache: 'no-store'
        });
        const data = await response.json();

        if (data.success && data.posts && data.posts.length > 0) {
          const latestPost = data.posts[0];
          const latestPostId = latestPost?.id;
          const storageKey = channel === 'vip' ? LAST_SEEN_VIP_MESSAGE_KEY : LAST_SEEN_MESSAGE_KEY;
          const storedLastSeen = localStorage.getItem(storageKey);
          const currentLastSeen = lastSeenMessageIdRef.current[channel] || storedLastSeen;

          // Always cache VIP preview so free users can see the teaser
          if (channel === 'vip' && latestPost) {
            setVipPreview({ id: latestPost.id, text: latestPost.text, date: latestPost.date });
          }

          if (currentLastSeen && latestPostId && latestPostId !== currentLastSeen) {
            console.log('[UltimateHub] BACKGROUND: New message detected!', { channel, latestPostId, currentLastSeen });
            handleNewMessage(channel, latestPostId, latestPost);
          }

          // Update ref if this is first load (no stored value)
          if (!currentLastSeen && latestPostId) {
            lastSeenMessageIdRef.current[channel] = latestPostId;
            localStorage.setItem(storageKey, latestPostId);
          }
        }
      } catch (err) {
        // Silent fail for background polling
      }
    };

    const checkForNewMessages = async (isVisibilityCheck = false) => {
      // Prevent overlapping checks
      if (isCheckingRef.current) return;

      // Skip background polling when tab is hidden (visibility change handles resume)
      if (!isVisibilityCheck && document.visibilityState !== 'visible') return;

      // Only poll when panel is NOT open (when open, TelegramChannelEmbed handles it)
      // Exception: always check on visibility change (user returning to tab)
      if (isUltimateHubOpen && !isVisibilityCheck) return;

      // Debounce rapid calls (e.g., multiple events firing close together)
      const now = Date.now();
      if (!isVisibilityCheck && now - lastPollAtRef.current < 5000) return;
      lastPollAtRef.current = now;

      isCheckingRef.current = true;

      try {
        await Promise.all((['trades', 'vip'] as ChannelKey[]).map((channel) => pollChannel(channel)));
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Handle visibility change - check immediately when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[UltimateHub] User returned to tab - checking for new messages');
        checkForNewMessages(true);
      }
    };

    // Listen for visibility changes (user returns to browser/tab)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial check
    checkForNewMessages();

    // Poll every 3 seconds for fast notifications
    const interval = setInterval(() => checkForNewMessages(false), 10000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mounted, isUltimateHubOpen, handleNewMessage]);

  // Clear notifications when panel is opened
  useEffect(() => {
    if (isUltimateHubOpen && hasNewMessages) {
      // Small delay before clearing to let user see the notification
      const timeout = setTimeout(() => {
        setHasNewMessages(false);
        setNewMessageCount(0);

        // Clear from localStorage too
        if (typeof window !== 'undefined') {
          localStorage.setItem(NEW_MESSAGE_COUNT_KEY, '0');
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isUltimateHubOpen, hasNewMessages]);

  // Inject neon styles
  useEffect(() => {
    if (!document.getElementById('ultimate-hub-neon-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'ultimate-hub-neon-styles';
      styleEl.textContent = GLOBAL_NEON_STYLES;
      document.head.appendChild(styleEl);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle notification click from service worker (when user taps push notification)
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        console.log('[UltimateHub] Notification clicked - opening panel');
        // Open the Ultimate Hub panel when notification is clicked
        setUltimateHubOpen(true);

        // Mark messages as seen since user is responding to notification
        setHasNewMessages(false);
        setNewMessageCount(0);
        if (typeof window !== 'undefined') {
          localStorage.setItem(NEW_MESSAGE_COUNT_KEY, '0');
        }
      }
    };

    // Also check URL params on load (user may have opened from notification)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('from') === 'notification') {
        console.log('[UltimateHub] Opened from notification - opening panel');
        setUltimateHubOpen(true);
        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [setUltimateHubOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isUltimateHubOpen) {
        setUltimateHubOpen(false);
      }
      // Quick open with Cmd/Ctrl + Shift + H
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setUltimateHubOpen(!isUltimateHubOpen);
      }
      // Admin panel shortcut
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('openAdminVIPPanel'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUltimateHubOpen, setUltimateHubOpen]);

  // Treat store pages as always unlocked so the toggle can control visibility there
  const isUnlockedForPage = isV2Unlocked || isStorePage;

  // Don't render until mounted and unlocked for this page
  if (!mounted || !isUnlockedForPage) return null;

  // Don't render during pagemode or loader (full-screen overlays)
  if (isPagemodeOpen || isLoaderv2Open) return null;

  // Don't render on store pages unless toggle is ON
  if (isStorePage && !showOnStore) return null;

  // Hide pill when mobile menu, panel open, or other modals (NOT audio widget - they can coexist)
  // Audio widget is on left side, UltimateHub pill is on right side - no overlap
  const shouldHidePill = isMobileMenuOpen || isUltimatePanelOpen || isAnyModalOpen || isUltimateHubOpen;

  return (
    <>
      {/* Single Unified FPS Pill - All features in one button */}
      {!shouldHidePill && (
        <UnifiedFpsPill
          fps={fps}
          deviceTier={deviceTier}
          prices={prices}
          isMinimized={isMinimized}
          onToggleMinimized={() => setIsMinimized(!isMinimized)}
          onOpenPanel={() => setUltimateHubOpen(true)}
          liteMode={isDesktopLiteMode}
          hasNewMessages={hasNewMessages}
          newMessageCount={newMessageCount}
          vipPreview={vipPreview}
          isVipUser={isVip}
          isMobileNavbarHidden={isMobileNavbarHidden}
          mobileAlignment="left"
        />
      )}

      {/* Unified Hub Panel - Trading, Community, TV, Device all in one */}
      <UnifiedHubPanel
        isOpen={isUltimateHubOpen}
        onClose={() => setUltimateHubOpen(false)}
        fps={fps}
        deviceTier={deviceTier}
        isAdmin={isAdmin}
        isVip={isVip}
        userId={userId}
        userEmail={userEmail}
        prices={prices}
        onNewMessage={handleNewMessage}
      />
    </>
  );
}

export default UltimateHub;
