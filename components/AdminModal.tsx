"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Trash2, Plus, Loader2, Save, Eye, EyeOff,
  Video, Radio, Youtube, Tv, Settings, LogOut,
  ExternalLink, GripVertical, Check, AlertCircle,
  RefreshCw, Link2, Play, Clock, ListVideo, Edit3,
  ChevronDown, ChevronUp, FolderPlus, Folder
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import { useShop } from "@/components/ShopContext";

// Types
interface LiveStreamVideo {
  id: string;
  title: string;
  youtube_id: string;
  is_live: boolean;
  order_index: number;
  playlist_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

interface LiveStreamConfig {
  id?: string;
  channel_url: string | null;
  current_video_id: string | null;
  is_live_now: boolean;
  updated_at?: string;
}

// YouTube thumbnail helper
const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'mq' | 'hq' = 'mq') => {
  const qualityMap = { default: 'default', mq: 'mqdefault', hq: 'hqdefault' };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
};

// Extract YouTube ID from URL or ID
const extractYouTubeId = (input: string): string => {
  const trimmed = input.trim();
  // Already an ID (11 characters, no special chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  
  // Try to extract from URL
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  
  return trimmed;
};

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 20, scale: 0.9 }}
    className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}
    style={{ zIndex: 2147483647 }}
  >
    {type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
    <span className="font-medium text-sm">{message}</span>
    <button onClick={onClose} className="ml-2 hover:opacity-70">
      <X className="w-4 h-4" />
    </button>
  </motion.div>
);

// Main Admin Panel Content
function AdminDashboard({ onClose }: { onClose: () => void }) {
  const { logout } = useShop();
  
  // State
  const [videos, setVideos] = useState<LiveStreamVideo[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [config, setConfig] = useState<LiveStreamConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Form state
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoIsLive, setNewVideoIsLive] = useState(false);
  const [newVideoPlaylist, setNewVideoPlaylist] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [isLiveNow, setIsLiveNow] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState('');
  
  // Playlist form state
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const [selectedPlaylistFilter, setSelectedPlaylistFilter] = useState<string>('all');
  
  // Edit state - now supports multiple videos
  const [editingVideos, setEditingVideos] = useState<Map<string, LiveStreamVideo>>(new Map());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());

  // Show toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      // Fetch videos
      const { data: videosData, error: videosError } = await supabase
        .from('livestream_videos')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (videosError) throw videosError;
      
      const normalizedVideos = (videosData || []).map(video => ({
        ...video,
        is_live: video.is_live === true || video.is_live === 'true'
      }));
      setVideos(normalizedVideos);
      
      // Fetch playlists
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('livestream_playlists')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (!playlistsError && playlistsData) {
        setPlaylists(playlistsData);
      }
      
      // Fetch config
      const { data: configData, error: configError } = await supabase
        .from('livestream_config')
        .select('*')
        .limit(1)
        .single();
      
      if (configError && configError.code !== 'PGRST116') throw configError;
      
      if (configData) {
        const normalizedConfig = {
          ...configData,
          is_live_now: configData.is_live_now === true || configData.is_live_now === 'true'
        };
        setConfig(normalizedConfig);
        setChannelUrl(configData.channel_url || '');
        setIsLiveNow(normalizedConfig.is_live_now);
        setCurrentVideoId(configData.current_video_id || '');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add video
  const handleAddVideo = async () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      showToast('Please fill in title and video URL/ID', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      const youtubeId = extractYouTubeId(newVideoUrl);
      
      const { error } = await supabase
        .from('livestream_videos')
        .insert({
          title: newVideoTitle.trim(),
          youtube_id: youtubeId,
          is_live: newVideoIsLive,
          order_index: videos.length,
          playlist_id: newVideoPlaylist || null,
        });
      
      if (error) throw error;
      
      setNewVideoTitle('');
      setNewVideoUrl('');
      setNewVideoIsLive(false);
      setNewVideoPlaylist('');
      showToast('Video added successfully!', 'success');
      fetchData();
    } catch (error) {
      console.error('Error adding video:', error);
      showToast('Failed to add video', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Add playlist
  const handleAddPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      showToast('Please enter a playlist name', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase
        .from('livestream_playlists')
        .insert({
          name: newPlaylistName.trim(),
        });
      
      if (error) throw error;
      
      setNewPlaylistName('');
      setShowPlaylistForm(false);
      showToast('Playlist created!', 'success');
      fetchData();
    } catch (error) {
      console.error('Error creating playlist:', error);
      showToast('Failed to create playlist', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete playlist
  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('Delete this playlist? Videos will be unassigned but not deleted.')) return;
    
    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      
      // Unassign videos from playlist
      await supabase
        .from('livestream_videos')
        .update({ playlist_id: null })
        .eq('playlist_id', id);
      
      // Delete playlist
      const { error } = await supabase
        .from('livestream_playlists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      showToast('Playlist deleted!', 'success');
      fetchData();
    } catch (error) {
      console.error('Error deleting playlist:', error);
      showToast('Failed to delete playlist', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Start editing a video
  const startEditingVideo = (video: LiveStreamVideo) => {
    const newMap = new Map(editingVideos);
    newMap.set(video.id, { ...video });
    setEditingVideos(newMap);
  };

  // Cancel editing a video
  const cancelEditingVideo = (id: string) => {
    const newMap = new Map(editingVideos);
    newMap.delete(id);
    setEditingVideos(newMap);
  };

  // Update editing video field
  const updateEditingVideo = (id: string, updates: Partial<LiveStreamVideo>) => {
    const newMap = new Map(editingVideos);
    const video = newMap.get(id);
    if (video) {
      newMap.set(id, { ...video, ...updates });
      setEditingVideos(newMap);
    }
  };

  // Save single video
  const handleSaveVideo = async (id: string) => {
    const video = editingVideos.get(id);
    if (!video) return;
    
    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase
        .from('livestream_videos')
        .update({
          title: video.title,
          youtube_id: video.youtube_id,
          is_live: video.is_live,
          playlist_id: video.playlist_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', video.id);
      
      if (error) throw error;
      
      cancelEditingVideo(id);
      showToast('Video updated!', 'success');
      fetchData();
    } catch (error) {
      console.error('Error updating video:', error);
      showToast('Failed to update video', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save all editing videos at once
  const handleSaveAllVideos = async () => {
    if (editingVideos.size === 0) return;
    
    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      
      const updates = Array.from(editingVideos.values()).map(video => ({
        id: video.id,
        title: video.title,
        youtube_id: video.youtube_id,
        is_live: video.is_live,
        playlist_id: video.playlist_id || null,
        updated_at: new Date().toISOString()
      }));
      
      for (const update of updates) {
        const { error } = await supabase
          .from('livestream_videos')
          .update(update)
          .eq('id', update.id);
        if (error) throw error;
      }
      
      setEditingVideos(new Map());
      showToast(`${updates.length} videos updated!`, 'success');
      fetchData();
    } catch (error) {
      console.error('Error updating videos:', error);
      showToast('Failed to update videos', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle video selection for bulk actions
  const toggleVideoSelection = (id: string) => {
    const newSet = new Set(selectedVideos);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedVideos(newSet);
  };

  // Select all videos
  const selectAllVideos = () => {
    const filtered = getFilteredVideos();
    setSelectedVideos(new Set(filtered.map(v => v.id)));
  };

  // Deselect all
  const deselectAllVideos = () => {
    setSelectedVideos(new Set());
  };

  // Bulk assign to playlist
  const bulkAssignPlaylist = async (playlistId: string | null) => {
    if (selectedVideos.size === 0) return;
    
    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase
        .from('livestream_videos')
        .update({ playlist_id: playlistId, updated_at: new Date().toISOString() })
        .in('id', Array.from(selectedVideos));
      
      if (error) throw error;
      
      setSelectedVideos(new Set());
      showToast(`${selectedVideos.size} videos updated!`, 'success');
      fetchData();
    } catch (error) {
      console.error('Error bulk updating:', error);
      showToast('Failed to update videos', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Bulk delete
  const bulkDeleteVideos = async () => {
    if (selectedVideos.size === 0) return;
    if (!confirm(`Delete ${selectedVideos.size} selected videos?`)) return;
    
    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase
        .from('livestream_videos')
        .delete()
        .in('id', Array.from(selectedVideos));
      
      if (error) throw error;
      
      setSelectedVideos(new Set());
      showToast(`${selectedVideos.size} videos deleted!`, 'success');
      fetchData();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      showToast('Failed to delete videos', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Get filtered videos by playlist
  const getFilteredVideos = () => {
    if (selectedPlaylistFilter === 'all') return videos;
    if (selectedPlaylistFilter === 'none') return videos.filter(v => !v.playlist_id);
    return videos.filter(v => v.playlist_id === selectedPlaylistFilter);
  };

  // Update video - keeping for compatibility
  const handleUpdateVideo = async () => {
    // Now handled by handleSaveVideo
  };

  // Delete video
  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase
        .from('livestream_videos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      showToast('Video deleted successfully!', 'success');
      fetchData();
    } catch (error) {
      console.error('Error deleting video:', error);
      showToast('Failed to delete video', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save config
  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      
      const configPayload = {
        channel_url: channelUrl || null,
        is_live_now: isLiveNow,
        current_video_id: currentVideoId || null,
        updated_at: new Date().toISOString()
      };
      
      if (config?.id) {
        const { error } = await supabase
          .from('livestream_config')
          .update(configPayload)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('livestream_config')
          .insert(configPayload);
        if (error) throw error;
      }
      
      showToast('Settings saved successfully!', 'success');
      fetchData();
    } catch (error) {
      console.error('Error saving config:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Logout
  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="w-full max-w-4xl max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col"
      onClick={(e) => e.stopPropagation()}
      onPointerDownCapture={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">LiveStream Admin</h2>
            <p className="text-neutral-500 text-xs">Manage videos & settings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-red-400 hover:bg-red-900/20 transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto p-6 space-y-6 overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stream Settings */}
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Stream Settings</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Channel URL */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                    <Youtube className="w-3 h-3" /> YouTube Channel URL
                  </label>
                  <input
                    type="text"
                    value={channelUrl}
                    onChange={(e) => setChannelUrl(e.target.value)}
                    placeholder="https://youtube.com/@YourChannel"
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-neutral-500"
                  />
                </div>
                
                {/* Current Video ID */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                    <Play className="w-3 h-3" /> Default Video ID
                  </label>
                  <select
                    value={currentVideoId}
                    onChange={(e) => setCurrentVideoId(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Select default video --</option>
                    {videos.map((video) => (
                      <option key={video.id} value={video.youtube_id}>
                        {video.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Live Now Toggle */}
              <div className="mt-4 flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isLiveNow ? 'bg-red-500/20' : 'bg-neutral-700'}`}>
                    <Radio className={`w-4 h-4 ${isLiveNow ? 'text-red-500' : 'text-neutral-400'}`} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Live Now Status</p>
                    <p className="text-neutral-500 text-xs">Show live indicator across the site</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLiveNow(!isLiveNow)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${isLiveNow ? 'bg-red-500' : 'bg-neutral-700'}`}
                >
                  <motion.div
                    animate={{ x: isLiveNow ? 28 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                  />
                </button>
              </div>
              
              {/* Save Button */}
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="mt-4 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Settings
              </button>
            </div>

            {/* Add New Video */}
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-semibold">Add New Video</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Video Title
                  </label>
                  <input
                    type="text"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    placeholder="e.g., Day Trading Strategies"
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500 placeholder-neutral-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    YouTube URL or Video ID
                  </label>
                  <input
                    type="text"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://youtu.be/xxxxx or video ID"
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500 placeholder-neutral-500"
                  />
                </div>
              </div>
              
              {/* Preview */}
              {newVideoUrl && (
                <div className="mt-4 p-3 bg-neutral-800 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-500 mb-2">Preview:</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={getYouTubeThumbnail(extractYouTubeId(newVideoUrl), 'mq')}
                      alt="Preview"
                      className="w-24 h-14 object-cover rounded-lg bg-neutral-700"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{newVideoTitle || 'Untitled'}</p>
                      <p className="text-neutral-500 text-xs">ID: {extractYouTubeId(newVideoUrl)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newVideoIsLive}
                      onChange={(e) => setNewVideoIsLive(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-red-500 focus:ring-red-500"
                    />
                    <span className="text-sm text-neutral-400">Mark as Live Stream</span>
                    {newVideoIsLive && <Radio className="w-3 h-3 text-red-500 animate-pulse" />}
                  </label>
                  
                  {playlists.length > 0 && (
                    <select
                      value={newVideoPlaylist}
                      onChange={(e) => setNewVideoPlaylist(e.target.value)}
                      className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-300 text-sm focus:outline-none focus:border-green-500"
                    >
                      <option value="">No playlist</option>
                      {playlists.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                
                <button
                  onClick={handleAddVideo}
                  disabled={saving || !newVideoTitle.trim() || !newVideoUrl.trim()}
                  className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Video
                </button>
              </div>
            </div>

            {/* Playlists Section */}
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ListVideo className="w-5 h-5 text-amber-400" />
                  <h3 className="text-white font-semibold">Playlists</h3>
                </div>
                <button
                  onClick={() => setShowPlaylistForm(!showPlaylistForm)}
                  className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all"
                >
                  {showPlaylistForm ? <ChevronUp className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Create Playlist Form */}
              <AnimatePresence>
                {showPlaylistForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder="New playlist name..."
                        className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 placeholder-neutral-500"
                      />
                      <button
                        onClick={handleAddPlaylist}
                        disabled={saving || !newPlaylistName.trim()}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Create
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Playlist List */}
              {playlists.length === 0 ? (
                <p className="text-neutral-500 text-sm text-center py-4">No playlists yet. Create one to organize your videos.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {playlists.map(playlist => (
                    <div
                      key={playlist.id}
                      className="flex items-center gap-2 px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 group"
                    >
                      <Folder className="w-4 h-4 text-amber-400" />
                      <span className="text-white text-sm">{playlist.name}</span>
                      <span className="text-neutral-500 text-xs">
                        ({videos.filter(v => v.playlist_id === playlist.id).length})
                      </span>
                      <button
                        onClick={() => handleDeletePlaylist(playlist.id)}
                        className="p-1 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video List */}
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
              {/* Header with filters and bulk actions */}
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-purple-400" />
                    <h3 className="text-white font-semibold">Video Library</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded-full">
                      {getFilteredVideos().length} videos
                    </span>
                    {editingVideos.size > 0 && (
                      <button
                        onClick={handleSaveAllVideos}
                        disabled={saving}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save All ({editingVideos.size})
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Filters and bulk actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Playlist filter */}
                  <select
                    value={selectedPlaylistFilter}
                    onChange={(e) => setSelectedPlaylistFilter(e.target.value)}
                    className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-300 text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Videos</option>
                    <option value="none">No Playlist</option>
                    {playlists.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  
                  {/* Bulk mode toggle */}
                  <button
                    onClick={() => {
                      setBulkEditMode(!bulkEditMode);
                      if (bulkEditMode) setSelectedVideos(new Set());
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      bulkEditMode ? 'bg-purple-500 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3 h-3 inline mr-1" />
                    Bulk Edit
                  </button>
                  
                  {/* Bulk actions */}
                  {bulkEditMode && selectedVideos.size > 0 && (
                    <>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            bulkAssignPlaylist(e.target.value === 'none' ? null : e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-300 text-xs focus:outline-none"
                        defaultValue=""
                      >
                        <option value="" disabled>Move to playlist...</option>
                        <option value="none">Remove from playlist</option>
                        {playlists.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={bulkDeleteVideos}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Trash2 className="w-3 h-3 inline mr-1" />
                        Delete ({selectedVideos.size})
                      </button>
                    </>
                  )}
                  
                  {bulkEditMode && (
                    <div className="flex items-center gap-1 ml-auto">
                      <button onClick={selectAllVideos} className="text-xs text-blue-400 hover:underline">Select All</button>
                      <span className="text-neutral-600">|</span>
                      <button onClick={deselectAllVideos} className="text-xs text-neutral-400 hover:underline">Deselect</button>
                    </div>
                  )}
                </div>
              </div>
              
              {getFilteredVideos().length === 0 ? (
                <div className="text-center py-12">
                  <Youtube className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">No videos found</p>
                  <p className="text-neutral-600 text-xs mt-1">Add videos or change the filter</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {getFilteredVideos().map((video, index) => {
                    const isEditing = editingVideos.has(video.id);
                    const editingData = editingVideos.get(video.id);
                    const isSelected = selectedVideos.has(video.id);
                    
                    return (
                      <motion.div
                        key={video.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all group ${
                          isEditing 
                            ? 'bg-blue-900/20 border-blue-500/50' 
                            : isSelected
                            ? 'bg-purple-900/20 border-purple-500/50'
                            : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'
                        }`}
                      >
                        {/* Checkbox for bulk select */}
                        {bulkEditMode && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleVideoSelection(video.id)}
                            className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-purple-500 focus:ring-purple-500"
                          />
                        )}
                        
                        {/* Thumbnail */}
                        <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-neutral-700 flex-shrink-0">
                          <img
                            src={getYouTubeThumbnail(isEditing ? editingData!.youtube_id : video.youtube_id, 'mq')}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          {(isEditing ? editingData!.is_live : video.is_live) && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-red-600 text-white text-[8px] font-bold rounded uppercase flex items-center gap-1">
                              <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                              Live
                            </span>
                          )}
                          <a
                            href={`https://youtube.com/watch?v=${video.youtube_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <ExternalLink className="w-4 h-4 text-white" />
                          </a>
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingData!.title}
                                onChange={(e) => updateEditingVideo(video.id, { title: e.target.value })}
                                placeholder="Video Title"
                                className="w-full px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={editingData!.youtube_id}
                                  onChange={(e) => updateEditingVideo(video.id, { youtube_id: extractYouTubeId(e.target.value) })}
                                  placeholder="YouTube URL or ID"
                                  className="flex-1 px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                                />
                                <select
                                  value={editingData!.playlist_id || ''}
                                  onChange={(e) => updateEditingVideo(video.id, { playlist_id: e.target.value || null })}
                                  className="px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
                                >
                                  <option value="">No playlist</option>
                                  {playlists.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-white font-medium text-sm truncate">{video.title}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-neutral-500 text-xs font-mono">{video.youtube_id}</span>
                                {video.playlist_id && (
                                  <span className="text-amber-400 text-xs flex items-center gap-1">
                                    <Folder className="w-3 h-3" />
                                    {playlists.find(p => p.id === video.playlist_id)?.name}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => updateEditingVideo(video.id, { is_live: !editingData!.is_live })}
                                className={`p-2 rounded-lg transition-colors ${editingData!.is_live ? 'bg-red-500/20 text-red-400' : 'bg-neutral-700 text-neutral-400'}`}
                                title="Toggle Live"
                              >
                                <Radio className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleSaveVideo(video.id)}
                                disabled={saving}
                                className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                title="Save"
                              >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => cancelEditingVideo(video.id)}
                                className="p-2 rounded-lg bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditingVideo(video)}
                                className="p-2 rounded-lg bg-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-600 transition-colors opacity-0 group-hover:opacity-100"
                                title="Edit"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteVideo(video.id)}
                                disabled={saving}
                                className="p-2 rounded-lg bg-neutral-700 text-neutral-400 hover:text-red-400 hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

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
}

// Login Screen
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const { login } = useShop();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Check credentials from environment variables
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    
    if (email.toLowerCase().trim() === adminEmail?.toLowerCase() && password === adminPassword) {
      // Use the login function from ShopContext (pass any values, we already validated)
      login(email, password);
      onLogin();
    } else {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-white font-bold text-xl">Admin Access</h2>
          <p className="text-neutral-500 text-sm mt-1">Enter credentials to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@email.com"
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-blue-500 placeholder-neutral-500"
              autoFocus
            />
          </div>
          
          <div>
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-blue-500 placeholder-neutral-500"
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

// Main Export
export default function AdminModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { state } = useShop();
  const [authenticated, setAuthenticated] = useState(false);

  // Check if already admin from shop state
  useEffect(() => {
    if (state.isAdmin) {
      setAuthenticated(true);
    }
  }, [state.isAdmin]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          className="fixed inset-0 z-[2147483647] flex items-center justify-center p-3 sm:p-6 bg-black/95"
          onClick={onClose}
        >
          {/* Animated tap to close hints */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium pointer-events-none flex items-center gap-1"
          >
            <span>↑</span> Tap anywhere to close <span>↑</span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium pointer-events-none flex items-center gap-1"
          >
            <span>↓</span> Tap anywhere to close <span>↓</span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.25 }}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white/60 text-xs font-medium pointer-events-none writing-mode-vertical hidden sm:flex items-center gap-1"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            ← Tap to close
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.75 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 text-xs font-medium pointer-events-none writing-mode-vertical hidden sm:flex items-center gap-1"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            Tap to close →
          </motion.div>
          
          <div onClick={(e) => e.stopPropagation()}>
            {!authenticated ? (
              <AdminLogin onLogin={() => setAuthenticated(true)} />
            ) : (
              <AdminDashboard onClose={onClose} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
