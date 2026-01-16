"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  List, 
  Radio, 
  Youtube, 
  ChevronUp, 
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Settings,
  Plus,
  Trash2,
  Save,
  Loader2,
  Volume2,
  VolumeX,
  Maximize2,
  Clock,
  TrendingUp,
  Tv
} from 'lucide-react';
import { ShimmerLine, ShimmerBorder, ShimmerSpinner } from '@/components/ui/UnifiedShimmer';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useShop } from '@/components/ShopContext';
import { createSupabaseClient } from '@/lib/supabase';
import { useLiveStreamModalUI } from '@/contexts/UIStateContext';

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

interface LiveStreamConfig {
  id?: string;
  channel_url: string;
  current_video_id: string;
  is_live_now: boolean;
  updated_at?: string;
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

// Main Modal Component - Now uses centralized UIStateContext for mutual exclusion
export const LiveStreamModal = memo(() => {
  // Use centralized UI state for mutual exclusion with other modals
  const { isOpen, setIsOpen } = useLiveStreamModalUI();
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
      <LiveStreamTrigger />
      {createPortal(
        <AnimatePresence>
          {isOpen && <LiveStreamContent />}
        </AnimatePresence>,
        document.body
      )}
    </ModalContext.Provider>
  );
});
LiveStreamModal.displayName = 'LiveStreamModal';

// Trigger Button - Better click handling for Dock integration
const LiveStreamTrigger = memo(() => {
  const { setIsOpen } = useModalState();
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    SoundEffects.click();
    setIsOpen(true);
  }, [setIsOpen]);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    SoundEffects.click();
    setIsOpen(true);
  }, [setIsOpen]);
  
  return (
    <button
      onClick={handleClick}
      onTouchEnd={handleTouch}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="w-full h-full absolute inset-0 cursor-pointer bg-transparent border-0 outline-none z-[100]"
      style={{ 
        background: 'transparent',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      aria-label="Open Live Stream"
    />
  );
});
LiveStreamTrigger.displayName = 'LiveStreamTrigger';

// Main Content
const LiveStreamContent = memo(() => {
  const { setIsOpen } = useModalState();
  const { state } = useShop();
  const { isAdmin } = state;
  
  const [videos, setVideos] = useState<LiveStreamVideo[]>([]);
  const [config, setConfig] = useState<LiveStreamConfig | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Admin form state
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoId, setNewVideoId] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [channelUrl, setChannelUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying && showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      // Fetch videos from livestream_videos table
      const { data: videosData, error: videosError } = await supabase
        .from('livestream_videos')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (videosError) {
        console.error('Error fetching videos:', videosError);
      } else {
        // Normalize is_live to boolean (handles string 'true'/'false' from DB)
        const normalizedVideos = (videosData || []).map(video => ({
          ...video,
          is_live: video.is_live === true || video.is_live === 'true'
        }));
        setVideos(normalizedVideos);
      }
      
      // Fetch config from livestream_config table
      const { data: configData, error: configError } = await supabase
        .from('livestream_config')
        .select('*')
        .limit(1)
        .single();
      
      if (configError && configError.code !== 'PGRST116') {
        console.error('Error fetching config:', configError);
      } else if (configData) {
        // Normalize is_live_now to boolean
        const normalizedConfig = {
          ...configData,
          is_live_now: configData.is_live_now === true || configData.is_live_now === 'true'
        };
        setConfig(normalizedConfig);
        setChannelUrl(configData.channel_url || '');
        
        // If current_video_id is set in config, find and select that video
        if (configData.current_video_id && videosData) {
          const currentIndex = videosData.findIndex(
            (v: LiveStreamVideo) => v.youtube_id === configData.current_video_id
          );
          if (currentIndex !== -1) {
            setCurrentVideoIndex(currentIndex);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching livestream data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Current video
  const currentVideo = videos[currentVideoIndex] || null;
  const youtubeEmbedUrl = currentVideo 
    ? `https://www.youtube.com/embed/${currentVideo.youtube_id}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1`
    : '';

  // Navigation
  const playNext = useCallback(() => {
    SoundEffects.click();
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
  }, [videos.length]);

  const playPrevious = useCallback(() => {
    SoundEffects.click();
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
  }, [videos.length]);

  const playVideo = useCallback((index: number) => {
    SoundEffects.click();
    setCurrentVideoIndex(index);
  }, []);

  // Admin functions
  const addVideo = useCallback(async () => {
    if (!newVideoTitle.trim() || !newVideoId.trim()) return;
    
    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from('livestream_videos')
        .insert({
          title: newVideoTitle.trim(),
          youtube_id: newVideoId.trim(),
          is_live: isLive,
          order_index: videos.length,
        });
      
      if (error) throw error;
      
      setNewVideoTitle('');
      setNewVideoId('');
      setIsLive(false);
      fetchData();
    } catch (error) {
      console.error('Error adding video:', error);
    } finally {
      setSaving(false);
    }
  }, [newVideoTitle, newVideoId, isLive, videos.length, fetchData]);

  const deleteVideo = useCallback(async (id: string) => {
    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from('livestream_videos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting video:', error);
    } finally {
      setSaving(false);
    }
  }, [fetchData]);

  const saveConfig = useCallback(async () => {
    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      
      if (config?.id) {
        const { error } = await supabase
          .from('livestream_config')
          .update({ channel_url: channelUrl })
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('livestream_config')
          .insert({
            channel_url: channelUrl,
            current_video_id: '',
            is_live_now: false,
          });
        if (error) throw error;
      }
      
      fetchData();
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  }, [config, channelUrl, fetchData]);

  const handleClose = useCallback(() => {
    SoundEffects.click();
    setIsOpen(false);
  }, [setIsOpen]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-6"
      style={{ 
        zIndex: 2147483647, // Maximum possible z-index
        isolation: 'isolate',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Cinematic dark backdrop - covers everything */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-lg"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
        onClick={handleClose}
      />
      
      {/* Modal Container - Contained modal with Netflix styling */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl shadow-black/50"
        style={{ zIndex: 1 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 bg-black/40">
          <div className="flex items-center gap-3">
            {(config?.is_live_now || currentVideo?.is_live) && (
              <span className="flex items-center gap-2 px-2.5 py-1 bg-red-600 rounded-md text-white text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Live
              </span>
            )}
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-blue-400" />
              <span className="text-white font-semibold">BullMoney TV</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { SoundEffects.click(); setShowAdmin(!showAdmin); }}
                className={`p-2 rounded-lg transition-all ${showAdmin ? 'bg-blue-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Admin Panel */}
        <AnimatePresence>
          {showAdmin && isAdmin && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-neutral-800/50 border-b border-white/10 flex-shrink-0"
            >
              <div className="p-4 space-y-4">
                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Admin Panel</h3>
                
                {/* Channel URL */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="YouTube Channel URL"
                    value={channelUrl}
                    onChange={(e) => setChannelUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-neutral-500"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={saveConfig}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-600 transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </motion.button>
                </div>
                
                {/* Add Video */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Video Title"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-neutral-500"
                  />
                  <input
                    type="text"
                    placeholder="YouTube Video ID"
                    value={newVideoId}
                    onChange={(e) => setNewVideoId(e.target.value)}
                    className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-neutral-500"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLive}
                      onChange={(e) => setIsLive(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-black/50 text-red-500 focus:ring-red-500"
                    />
                    Mark as Live
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addVideo}
                    disabled={saving || !newVideoTitle.trim() || !newVideoId.trim()}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 hover:bg-green-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Video
                  </motion.button>
                </div>
                
                {/* Video Management List */}
                {videos.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {videos.map((video) => (
                      <div key={video.id} className="flex items-center gap-3 p-2 bg-black/30 rounded-lg group hover:bg-black/50 transition-colors">
                        <div className="w-14 h-8 rounded overflow-hidden bg-neutral-800 flex-shrink-0">
                          <img 
                            src={getYouTubeThumbnail(video.youtube_id)} 
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {video.is_live && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />}
                            <span className="text-sm text-white truncate">{video.title}</span>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteVideo(video.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Video Player */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="relative aspect-video bg-black">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-neutral-900 to-black">
                  <div className="flex flex-col items-center gap-4">
                    <ShimmerSpinner size={48} color="blue" />
                    <p className="text-neutral-400 text-sm">Loading stream...</p>
                  </div>
                </div>
              ) : currentVideo ? (
                <iframe
                  src={youtubeEmbedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={currentVideo.title}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-neutral-900 to-black">
                  <Youtube className="w-16 h-16 text-blue-400/50" />
                  <p className="text-neutral-500 text-center">No videos available</p>
                  {isAdmin && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAdmin(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium text-sm"
                    >
                      Add Videos
                    </motion.button>
                  )}
                </div>
              )}
            </div>
            
            {/* Video Info & Controls */}
            <div className="p-4 bg-black/40 border-t border-white/5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white line-clamp-1 mb-1">
                    {currentVideo?.title || 'No video selected'}
                  </h2>
                  <p className="text-sm text-neutral-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {currentVideo?.is_live ? 'Streaming now' : 'On demand'}
                    {videos.length > 1 && (
                      <>
                        <span className="text-neutral-600">•</span>
                        <span>{currentVideoIndex + 1} of {videos.length}</span>
                      </>
                    )}
                  </p>
                </div>
                
                {/* YouTube Link */}
                {channelUrl && (
                  <motion.a
                    href={channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => SoundEffects.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium text-sm transition-colors flex-shrink-0"
                  >
                    <Youtube className="w-4 h-4" />
                    <span className="hidden sm:inline">Subscribe</span>
                  </motion.a>
                )}
              </div>
              
              {/* Playback Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {videos.length > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={playPrevious}
                      className="p-2.5 rounded-full text-white hover:bg-white/10 transition-all"
                    >
                      <SkipBack className="w-5 h-5" />
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { SoundEffects.click(); setIsPlaying(!isPlaying); }}
                    className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-all"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </motion.button>
                  
                  {videos.length > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={playNext}
                      className="p-2.5 rounded-full text-white hover:bg-white/10 transition-all"
                    >
                      <SkipForward className="w-5 h-5" />
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { SoundEffects.click(); setIsMuted(!isMuted); }}
                    className="p-2.5 rounded-full text-white hover:bg-white/10 transition-all"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </motion.button>
                </div>
                
                {/* Playlist Toggle (Mobile) */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { SoundEffects.click(); setShowPlaylist(!showPlaylist); }}
                  className={`lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${showPlaylist ? 'bg-blue-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  <List className="w-4 h-4" />
                  <span className="text-sm">Playlist</span>
                </motion.button>
              </div>
            </div>
          </div>
          
          {/* Sidebar Playlist */}
          <AnimatePresence>
            {(showPlaylist || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className={`
                  ${showPlaylist ? 'flex' : 'hidden lg:flex'}
                  flex-col w-full lg:w-[320px] bg-black/40 border-l border-white/5 overflow-hidden
                `}
              >
                {/* Playlist Header */}
                <div className="p-3 border-b border-white/5 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <List className="w-4 h-4 text-blue-400" />
                      Up Next
                    </h3>
                    <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
                      {videos.length}
                    </span>
                  </div>
                </div>
                
                {/* Playlist Items */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {videos.map((video, index) => (
                    <motion.button
                      key={video.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => playVideo(index)}
                      className={`
                        w-full flex gap-3 p-2 rounded-lg transition-all text-left group
                        ${index === currentVideoIndex 
                          ? 'bg-blue-500/20 ring-1 ring-blue-500/50' 
                          : 'hover:bg-white/5'
                        }
                      `}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-24 aspect-video rounded-md overflow-hidden bg-neutral-800 flex-shrink-0">
                        <img 
                          src={getYouTubeThumbnail(video.youtube_id, 'mq')} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Play overlay */}
                        <div className={`
                          absolute inset-0 flex items-center justify-center bg-black/40 
                          transition-opacity
                          ${index === currentVideoIndex ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                        `}>
                          <div className={`p-1.5 rounded-full ${index === currentVideoIndex ? 'bg-blue-500' : 'bg-white/20'}`}>
                            {index === currentVideoIndex ? (
                              <Radio className="w-3 h-3 text-white" />
                            ) : (
                              <Play className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                        {/* Live badge */}
                        {video.is_live && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded uppercase">
                            Live
                          </span>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0 py-0.5">
                        <p className={`
                          text-xs font-medium line-clamp-2 mb-1 transition-colors
                          ${index === currentVideoIndex ? 'text-blue-400' : 'text-white group-hover:text-blue-400'}
                        `}>
                          {video.title}
                        </p>
                        <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                          <Tv className="w-3 h-3" />
                          BullMoney TV
                        </p>
                        {index === currentVideoIndex && (
                          <p className="text-[10px] text-blue-400 mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                            Playing
                          </p>
                        )}
                      </div>
                    </motion.button>
                  ))}
                  
                  {videos.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Youtube className="w-10 h-10 text-neutral-700 mb-2" />
                      <p className="text-neutral-500 text-xs">No videos in playlist</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </motion.div>
  );
});
LiveStreamContent.displayName = 'LiveStreamContent';

export default LiveStreamModal;
