import { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, ExternalLink, Loader, Lock, MessageCircle, ShoppingBag, Star, TrendingUp } from 'lucide-react';
import type { ChannelKey, TelegramPost } from '@/components/ultimate-hub/types';
import { TELEGRAM_CHANNELS } from '@/components/ultimate-hub/constants';

export const TelegramChannelEmbed = memo(({ channel = 'main', isVip = false, onNewMessage }: { channel?: ChannelKey; isVip?: boolean; onNewMessage?: (channel: string, postId: string, post?: TelegramPost) => void }) => {
  const [posts, setPosts] = useState<TelegramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const lastPostIdRef = useRef<string | null>(null);
  
  // Also check localStorage directly for VIP status in case prop is stale
  const [localStorageVip, setLocalStorageVip] = useState(false);
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('bullmoney_session');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        if (session.is_vip === true) {
          setLocalStorageVip(true);
        }
      }
    } catch (e) {}
  }, []);
  
  // Use VIP status from either prop or localStorage
  const effectiveIsVip = isVip || localStorageVip;
  
  const channelConfig = TELEGRAM_CHANNELS[channel];
  const requiresVip = channelConfig.requiresVip && !effectiveIsVip;
  
  // Debug log
  console.log('[TelegramChannelEmbed] channel:', channel, 'isVip prop:', isVip, 'localStorageVip:', localStorageVip, 'effectiveIsVip:', effectiveIsVip, 'requiresVip:', requiresVip, 'channelRequiresVip:', channelConfig.requiresVip);

  useEffect(() => {
    if (requiresVip) { 
      console.log('[TelegramChannelEmbed] VIP required but user is not VIP - showing lock');
      setLoading(false); 
      return; 
    }
    
    let isFirstFetch = true;
    
    const fetchPosts = async () => {
      try {
        // Only show loading on first fetch to avoid UI flicker
        if (isFirstFetch) {
          setLoading(true);
          isFirstFetch = false;
        }
        
        // Silent fetch for updates (no logging spam)
        const response = await fetch(`/api/telegram/channel?channel=${channel}&t=${Date.now()}`, { cache: 'no-store' });
        const data = await response.json();
        
        if (data.success && data.posts && data.posts.length > 0) { 
          // Check for new messages
          const latestPostId = data.posts[0]?.id;
          if (lastPostIdRef.current && latestPostId && latestPostId !== lastPostIdRef.current) {
            // New message detected!
            console.log('[TelegramChannelEmbed] 🔔 NEW MESSAGE DETECTED in channel:', channel);
            onNewMessage?.(channel, latestPostId, data.posts[0]);
          }
          lastPostIdRef.current = latestPostId;
          
          setPosts(data.posts); 
          setError(false);
          setStatusMessage(null);
        } else {
          setPosts([]);
          setError(false);
          setStatusMessage(data.message || 'No messages yet');
        }
      } catch (err) { 
        console.error('[TelegramChannelEmbed] Fetch error:', err);
        setError(true); 
      }
      finally { setLoading(false); }
    };

    fetchPosts();
    
    // FAST POLLING: Check every 3 seconds for new messages!
    // This ensures users get near-instant notifications
    const interval = setInterval(fetchPosts, 3000);
    
    return () => clearInterval(interval);
  }, [channel, requiresVip, effectiveIsVip, onNewMessage]);

  if (requiresVip) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-black/40" />
        </div>
        <h4 className="text-sm font-bold text-black mb-2">VIP Content</h4>
        <p className="text-[10px] text-black/50 mb-4 max-w-[200px]">
          Upgrade to VIP to access exclusive signals and premium content.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="w-5 h-5 text-black animate-spin mb-2" />
        <span className="text-[10px] text-black/50">Loading live feed...</span>
      </div>
    );
  }

  if (error || posts.length === 0) {
    // For private channels with invite links, format the URL correctly
    const telegramUrl = channelConfig.handle.startsWith('+') 
      ? `https://t.me/${channelConfig.handle}` 
      : `https://t.me/${channelConfig.handle}`;
    
    const isVipChannel = channel === 'vip';
    
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
          isVipChannel ? 'bg-linear-to-r from-blue-500 to-cyan-500' : 'bg-white'
        }`}>
          {isVipChannel ? (
            <Crown className="w-6 h-6 text-black" />
          ) : (
            <MessageCircle className="w-6 h-6 text-black" />
          )}
        </div>
        {isVipChannel && effectiveIsVip && (
          <div className="flex items-center gap-1 mb-2 px-2 py-1 bg-white rounded-full">
            <CheckCircle className="w-3 h-3 text-black" />
            <span className="text-[9px] text-black font-bold">VIP ACCESS UNLOCKED</span>
          </div>
        )}
        <p className="text-[11px] text-black/50 mb-1 text-center">
          {isVipChannel && effectiveIsVip 
            ? 'VIP signals syncing from Telegram...' 
            : isVipChannel 
              ? 'VIP signals available in Telegram' 
              : 'No messages yet'}
        </p>
        <p className="text-[9px] text-black/40 mb-3 text-center max-w-[200px]">
          {isVipChannel && effectiveIsVip
            ? statusMessage || 'Post a message in the VIP channel to see it here. Make sure @MrBullmoneybot is admin.'
            : isVipChannel 
              ? 'Join the VIP Telegram channel for live trading signals and premium analysis.'
              : 'Messages will appear here once available.'}
        </p>
        {!isVipChannel && (
          <motion.a 
            href={telegramUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 bg-white text-black border border-black/15"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Telegram
          </motion.a>
        )}
      </div>
    );
  }

  // For private channels with invite links, posts don't have direct links
  // Just open the channel itself
  const getPostUrl = (postId: string) => {
    if (channelConfig.handle.startsWith('+')) {
      // Private channel - can't link to individual posts, just link to channel
      return `https://t.me/${channelConfig.handle}`;
    }
    return `https://t.me/${channelConfig.handle}/${postId}`;
  };

  return (
    <div className="space-y-2 p-2">
      {posts.map((post, idx) => (
        <motion.a
          key={post.id}
          href={getPostUrl(post.id)}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="block bg-white hover:bg-white/80 rounded-lg p-3 border border-black/8 hover:border-black/15 transition-all group"
        >
          <div className="flex items-start gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-black text-xs font-bold flex-shrink-0 bg-linear-to-br ${
              channel === 'vip' ? 'from-blue-500 to-cyan-500' :
              channel === 'shop' ? 'from-white to-teal-500' :
              channel === 'trades' ? 'from-sky-400 to-sky-300' :
              'from-sky-400 to-sky-300'
            }`}>
              {channel === 'vip' ? <Star className="w-4 h-4 text-black/70" /> : 
               channel === 'shop' ? <ShoppingBag className="w-4 h-4" /> : 
               channel === 'trades' ? <TrendingUp className="w-4 h-4" /> : 'B'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-semibold text-black">{channelConfig.name}</span>
                <span className="text-[8px] text-black/40">{post.date}</span>
              </div>
              <p className="text-[10px] text-black/60 line-clamp-3 leading-relaxed">{post.text}</p>
              {post.hasMedia && (
                <span className="inline-block mt-1.5 text-[8px] bg-white text-black px-1.5 py-0.5 rounded">📷 Media</span>
              )}
            </div>
            <ExternalLink className="w-3 h-3 text-black/40 group-hover:text-black transition-colors flex-shrink-0" />
          </div>
        </motion.a>
      ))}
    </div>
  );
});
TelegramChannelEmbed.displayName = 'TelegramChannelEmbed';
