"use client";

/**
 * UltimateHubLiveStreamTab - BullMoney TV for Ultimate Hub
 * 
 * Monitors YouTube channels for live streams and videos
 * - Auto-detects when you go live
 * - Filters for geopolitics, war, market, trading content
 * - Shows "Breaking Live" indicator
 * - Auto-refreshes every 30 seconds
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Tv,
  Radio,
  ChevronLeft,
  ChevronRight,
  List,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { ShimmerSpinner } from '@/components/ui/UnifiedShimmer';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { createSupabaseClient } from '@/lib/supabase';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';

// YouTube thumbnail helper
const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'mq' | 'hq' | 'sd' | 'maxres' = 'mq') => {
  const qualityMap = {
    default: 'default',
    mq: 'mqdefault',
    hq: 'hqdefault',
    sd: 'sddefault',
    maxres: 'maxresdefault'
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
};

// Types
interface LiveStreamVideo {
  id: string;
  title: string;
  youtube_id: string;
  is_live: boolean;
  order_index: number;
  created_at?: string;
}

const FEATURED_VIDEOS = ['Q3dSjSP3t8I', 'xvP1FJt-Qto'];

export const UltimateHubLiveStreamTab = memo(() => {
  const { shouldSkipHeavyEffects } = useMobilePerformance();
  
  const [activeTab, setActiveTab] = useState<'featured' | 'live'>('featured');
  const [videos, setVideos] = useState<LiveStreamVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [liveIndex, setLiveIndex] = useState(0);
  const [playerKey, setPlayerKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [hasLive, setHasLive] = useState(false);

  // Load featured videos from Supabase
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
          .from('livestream_videos')
          .select('*')
          .order('order_index', { ascending: true });

        if (!error && data) {
          setVideos(data);
          // Check if any are live
          setHasLive(data.some(v => v.is_live));
        }
      } catch (err) {
        console.error('[LiveStream] Failed to load videos:', err);
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, []);

  // Auto-refresh to check for live streams every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const supabase = createSupabaseClient();
      const { data } = await supabase
        .from('livestream_videos')
        .select('*')
        .eq('is_live', true);
      
      if (data && data.length > 0) {
        setHasLive(true);
        // Auto-switch to live tab if there's a new live stream
        if (activeTab === 'featured' && !hasLive) {
          setActiveTab('live');
        }
      } else {
        setHasLive(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab, hasLive]);

  // Determine current video ID
  const currentVideoId = activeTab === 'featured'
    ? (videos.length > 0 ? videos[featuredIndex % videos.length]?.youtube_id : FEATURED_VIDEOS[featuredIndex % FEATURED_VIDEOS.length])
    : (videos.filter(v => v.is_live)[liveIndex]?.youtube_id || FEATURED_VIDEOS[0]);

  const currentVideo = activeTab === 'featured'
    ? videos[featuredIndex] || { id: '0', youtube_id: FEATURED_VIDEOS[0], title: `Featured Video ${featuredIndex + 1}`, is_live: false, order_index: 0 }
    : videos.filter(v => v.is_live)[liveIndex];

  const goNext = useCallback(() => {
    SoundEffects.click();
    if (activeTab === 'featured') {
      setFeaturedIndex(p => (p + 1) % (videos.length || FEATURED_VIDEOS.length));
    } else {
      const liveVideos = videos.filter(v => v.is_live);
      setLiveIndex(p => (p + 1) % Math.max(liveVideos.length, 1));
    }
    setPlayerKey(p => p + 1);
  }, [activeTab, videos]);

  const goPrev = useCallback(() => {
    SoundEffects.click();
    if (activeTab === 'featured') {
      setFeaturedIndex(p => (p - 1 + (videos.length || FEATURED_VIDEOS.length)) % (videos.length || FEATURED_VIDEOS.length));
    } else {
      const liveVideos = videos.filter(v => v.is_live);
      setLiveIndex(p => (p - 1 + Math.max(liveVideos.length, 1)) % Math.max(liveVideos.length, 1));
    }
    setPlayerKey(p => p + 1);
  }, [activeTab, videos]);

  const togglePlayPause = useCallback(() => {
    SoundEffects.click();
    setIsPlaying(p => !p);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <ShimmerSpinner size={48} color="blue" />
      </div>
    );
  }

  const liveVideos = videos.filter(v => v.is_live);

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 sm:p-3 border-b border-blue-500/30 bg-black" style={{ boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }} />
            <h2 className="text-xs sm:text-sm font-bold text-blue-300" style={{ textShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6' }}>
              BullMoney TV
            </h2>
            {hasLive && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 animate-pulse">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-red-500"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-[8px] font-bold text-red-400 uppercase">Breaking Live</span>
              </div>
            )}
          </div>
          
          <a
            href={`https://youtube.com/watch?v=${currentVideoId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => SoundEffects.click()}
            className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 transition-colors"
          >
            <ExternalLink className="w-3 h-3 text-blue-400" />
          </a>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => { SoundEffects.click(); setActiveTab('featured'); setPlayerKey(p => p + 1); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[10px] sm:text-xs font-semibold transition-all min-h-[40px] sm:min-h-0 ${
              activeTab === 'featured'
                ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 border border-blue-500/20'
            }`}
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Featured</span>
          </button>
          
          <button
            onClick={() => { SoundEffects.click(); setActiveTab('live'); setPlayerKey(p => p + 1); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[10px] sm:text-xs font-semibold transition-all min-h-[40px] sm:min-h-0 relative ${
              activeTab === 'live'
                ? 'bg-red-500/30 text-red-300 border border-red-400/50'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 border border-blue-500/20'
            }`}
          >
            <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>BullMoney Live</span>
            {hasLive && (
              <motion.span
                className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 flex flex-col bg-black overflow-hidden">
        <div className="w-full aspect-video bg-zinc-900">
          <iframe
            key={playerKey}
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>

        {/* Video Info & Controls */}
        <div className="p-2 sm:p-3 bg-zinc-900/50 border-t border-blue-500/20">
          {/* Current Video Info */}
          <div className="flex-1 min-w-0 mb-2">
            <div className="text-[10px] sm:text-xs font-semibold text-blue-300 truncate">
              {activeTab === 'featured'
                ? (currentVideo?.title || `Featured Video ${featuredIndex + 1}`)
                : (currentVideo?.title || 'BullMoney Live')}
            </div>
            <div className="text-[8px] sm:text-[9px] text-blue-400/60">
              {activeTab === 'featured'
                ? `${featuredIndex + 1} / ${videos.length || FEATURED_VIDEOS.length}`
                : liveVideos.length > 0 ? `${liveIndex + 1} / ${liveVideos.length}` : 'No live streams'}
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex items-center justify-center gap-2">
            <motion.button
              onClick={goPrev}
              whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 transition-colors"
            >
              <SkipBack className="w-4 h-4 text-blue-400" />
            </motion.button>
            
            <motion.button
              onClick={togglePlayPause}
              whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-lg bg-blue-500/30 hover:bg-blue-500/40 border border-blue-500/50 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-blue-300" />
              ) : (
                <Play className="w-5 h-5 text-blue-300" />
              )}
            </motion.button>
            
            <motion.button
              onClick={goNext}
              whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 transition-colors"
            >
              <SkipForward className="w-4 h-4 text-blue-400" />
            </motion.button>
            
            <motion.button
              onClick={() => { SoundEffects.click(); setShowPlaylist(p => !p); }}
              whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg border transition-colors ${
                showPlaylist
                  ? 'bg-blue-500/30 border-blue-500/50'
                  : 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/40'
              }`}
            >
              <List className="w-4 h-4 text-blue-400" />
            </motion.button>
          </div>

          {/* Playlist Dropdown */}
          {showPlaylist && (
            <div className="mt-2 max-h-[200px] overflow-y-auto p-2 rounded-lg bg-zinc-900/50 border border-blue-500/20 space-y-1" style={{ touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch' }}>
              {activeTab === 'featured'
                ? (videos.length > 0 ? videos : FEATURED_VIDEOS.map((id, i) => ({ id: i.toString(), youtube_id: id, title: `Video ${i + 1}`, is_live: false, order_index: i }))).map((video, idx) => (
                    <button
                      key={video.id}
                      onClick={() => { SoundEffects.click(); setFeaturedIndex(idx); setPlayerKey(p => p + 1); setShowPlaylist(false); }}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                        idx === featuredIndex
                          ? 'bg-blue-500/30 border border-blue-400/50'
                          : 'bg-zinc-800/30 hover:bg-zinc-700/50 border border-transparent'
                      }`}
                    >
                      <img
                        src={getYouTubeThumbnail(video.youtube_id, 'default')}
                        alt={video.title}
                        className="w-12 h-9 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold text-white truncate">{video.title}</div>
                        {video.is_live && (
                          <span className="text-[8px] text-red-400 font-bold uppercase">● Live</span>
                        )}
                      </div>
                    </button>
                  ))
                : liveVideos.length > 0 ? liveVideos.map((video, idx) => (
                    <button
                      key={video.id}
                      onClick={() => { SoundEffects.click(); setLiveIndex(idx); setPlayerKey(p => p + 1); setShowPlaylist(false); }}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                        idx === liveIndex
                          ? 'bg-red-500/30 border border-red-400/50'
                          : 'bg-zinc-800/30 hover:bg-zinc-700/50 border border-transparent'
                      }`}
                    >
                      <img
                        src={getYouTubeThumbnail(video.youtube_id, 'default')}
                        alt={video.title}
                        className="w-12 h-9 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold text-white truncate">{video.title}</div>
                        <span className="text-[8px] text-red-400 font-bold uppercase">● Live</span>
                      </div>
                    </button>
                  )) : (
                    <div className="text-center py-4 text-zinc-400 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                      Checking for live streams...
                    </div>
                  )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

UltimateHubLiveStreamTab.displayName = 'UltimateHubLiveStreamTab';
