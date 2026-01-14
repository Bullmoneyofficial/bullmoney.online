"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Play, 
  Pause, 
  SkipForward, 
  List, 
  Radio, 
  Youtube, 
  ChevronUp, 
  ChevronDown,
  ExternalLink,
  Settings,
  Plus,
  Trash2,
  Save,
  Loader2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { ShimmerLine, ShimmerBorder, ShimmerSpinner } from '@/components/ui/UnifiedShimmer';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useShop } from '@/components/ShopContext';
import { createSupabaseClient } from '@/lib/supabase';

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

// Main Modal Component
export const LiveStreamModal = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
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
  
  return (
    <button
      onClick={handleClick}
      onTouchEnd={(e) => {
        e.preventDefault();
        SoundEffects.click();
        setIsOpen(true);
      }}
      className="w-full h-full absolute inset-0 cursor-pointer bg-transparent border-0 outline-none z-50"
      style={{ 
        background: 'transparent',
        touchAction: 'manipulation'
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
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  // Admin form state
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoId, setNewVideoId] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [channelUrl, setChannelUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      // Fetch videos
      const { data: videosData, error: videosError } = await supabase
        .from('livestream_videos')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (videosError) {
        console.error('Error fetching videos:', videosError);
      } else {
        setVideos(videosData || []);
      }
      
      // Fetch config
      const { data: configData, error: configError } = await supabase
        .from('livestream_config')
        .select('*')
        .limit(1)
        .single();
      
      if (configError && configError.code !== 'PGRST116') {
        console.error('Error fetching config:', configError);
      } else if (configData) {
        setConfig(configData);
        setChannelUrl(configData.channel_url || '');
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

  const playVideo = useCallback((index: number) => {
    SoundEffects.click();
    setCurrentVideoIndex(index);
    setShowPlaylist(false);
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
      
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-2xl"
      >
        {/* Shimmer Border - Positioned outside inner container */}
        <div className="absolute inset-[-2px] overflow-hidden rounded-2xl pointer-events-none z-0">
          <ShimmerBorder color="blue" intensity="low" />
        </div>
        
        {/* Inner Container */}
        <div className="relative z-10 bg-gradient-to-b from-neutral-900 to-black rounded-2xl border border-blue-500/30 overflow-hidden">
          <ShimmerLine color="blue" />
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Radio className="w-6 h-6 text-blue-400" />
                {currentVideo?.is_live && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">BullMoney Live</h2>
                <p className="text-xs text-blue-400/70">
                  {currentVideo?.is_live ? '🔴 LIVE NOW' : 'On Demand'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { SoundEffects.click(); setShowAdmin(!showAdmin); }}
                  className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
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
                className="border-b border-blue-500/20 overflow-hidden"
              >
                <div className="p-4 space-y-4 bg-blue-500/5">
                  <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Admin Panel</h3>
                  
                  {/* Channel URL */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="YouTube Channel URL"
                      value={channelUrl}
                      onChange={(e) => setChannelUrl(e.target.value)}
                      className="flex-1 px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={saveConfig}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </motion.button>
                  </div>
                  
                  {/* Add Video */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Video Title"
                        value={newVideoTitle}
                        onChange={(e) => setNewVideoTitle(e.target.value)}
                        className="flex-1 px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="YouTube Video ID"
                        value={newVideoId}
                        onChange={(e) => setNewVideoId(e.target.value)}
                        className="flex-1 px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isLive}
                          onChange={(e) => setIsLive(e.target.checked)}
                          className="w-4 h-4 rounded border-blue-500/30 bg-black/50 text-blue-500 focus:ring-blue-500"
                        />
                        Mark as Live
                      </label>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addVideo}
                        disabled={saving || !newVideoTitle.trim() || !newVideoId.trim()}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                        Add Video
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Video List */}
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {videos.map((video) => (
                      <div key={video.id} className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          {video.is_live && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                          <span className="text-sm text-white truncate max-w-[200px]">{video.title}</span>
                          <span className="text-xs text-neutral-500">{video.youtube_id}</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => deleteVideo(video.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Video Player */}
          <div className="relative aspect-video bg-black">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <ShimmerSpinner size={48} color="blue" />
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
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
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
          
          {/* Controls */}
          <div className="p-4 border-t border-blue-500/20">
            <div className="flex items-center justify-between">
              {/* Now Playing */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-400/70 uppercase tracking-wider mb-1">Now Playing</p>
                <p className="text-white font-medium truncate">{currentVideo?.title || 'No video selected'}</p>
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { SoundEffects.click(); setIsMuted(!isMuted); }}
                  className="p-2.5 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { SoundEffects.click(); setIsPlaying(!isPlaying); }}
                  className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </motion.button>
                
                {videos.length > 1 && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={playNext}
                    className="p-2.5 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                  >
                    <SkipForward className="w-5 h-5" />
                  </motion.button>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { SoundEffects.click(); setShowPlaylist(!showPlaylist); }}
                  className={`p-2.5 rounded-full transition-colors ${showPlaylist ? 'bg-blue-500 text-white' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}
                >
                  <List className="w-5 h-5" />
                </motion.button>
                
                {channelUrl && (
                  <motion.a
                    href={channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => SoundEffects.click()}
                    className="p-2.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <Youtube className="w-5 h-5" />
                  </motion.a>
                )}
              </div>
            </div>
          </div>
          
          {/* Playlist Drawer */}
          <AnimatePresence>
            {showPlaylist && videos.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-blue-500/20 overflow-hidden"
              >
                <div className="p-4 space-y-2 max-h-60 overflow-y-auto bg-black/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Playlist</h3>
                    <span className="text-xs text-neutral-500">{videos.length} videos</span>
                  </div>
                  
                  {videos.map((video, index) => (
                    <motion.button
                      key={video.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => playVideo(index)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        index === currentVideoIndex 
                          ? 'bg-blue-500/20 border border-blue-500/40' 
                          : 'bg-neutral-800/50 hover:bg-neutral-700/50 border border-transparent'
                      }`}
                    >
                      <div className="relative w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                        {index === currentVideoIndex ? (
                          <Play className="w-4 h-4 text-blue-400" />
                        ) : (
                          <span className="text-sm text-neutral-400">{index + 1}</span>
                        )}
                        {video.is_live && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className={`text-sm font-medium truncate ${index === currentVideoIndex ? 'text-blue-400' : 'text-white'}`}>
                          {video.title}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {video.is_live ? '🔴 Live' : 'Video'}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
});
LiveStreamContent.displayName = 'LiveStreamContent';

export default LiveStreamModal;
