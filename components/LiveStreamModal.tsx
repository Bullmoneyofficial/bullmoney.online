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
  Tv,
  User,
  LogIn,
  LogOut,
  Heart,
  Link2,
  Check,
  AlertCircle
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

interface PersonalVideo {
  id: string;
  title: string;
  youtube_id: string;
  added_at: string;
  thumbnail?: string;
  channelTitle?: string;
}

interface UserYouTubeProfile {
  channelUrl: string;
  videos: PersonalVideo[];
  lastUpdated: string;
}

interface YouTubeAuthProfile {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  user: {
    name: string;
    email: string;
    picture: string;
    channelId?: string;
  };
}

interface YouTubePlaylistItem {
  id: string;
  title: string;
  youtube_id: string;
  thumbnail: string;
  channelTitle: string;
}

// YouTube OAuth Config - Uses environment variables
const YOUTUBE_CLIENT_ID = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID || '';
const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

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

  // Personal YouTube state
  const [activeTab, setActiveTab] = useState<'bullmoney' | 'personal'>('bullmoney');
  const [showPersonalLogin, setShowPersonalLogin] = useState(false);
  const [personalProfile, setPersonalProfile] = useState<UserYouTubeProfile | null>(null);
  const [personalVideoUrl, setPersonalVideoUrl] = useState('');
  const [personalVideoTitle, setPersonalVideoTitle] = useState('');
  const [personalChannelUrl, setPersonalChannelUrl] = useState('');
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalError, setPersonalError] = useState('');
  
  // YouTube OAuth state
  const [youtubeAuth, setYoutubeAuth] = useState<YouTubeAuthProfile | null>(null);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubePlaylists, setYoutubePlaylists] = useState<{id: string; title: string; itemCount: number}[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('liked');
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubePlaylistItem[]>([]);
  const [loadingYoutubeVideos, setLoadingYoutubeVideos] = useState(false);

  // Load YouTube auth from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bullmoney_youtube_auth');
      if (saved) {
        const auth = JSON.parse(saved) as YouTubeAuthProfile;
        // Check if token is still valid
        if (auth.expiresAt > Date.now()) {
          setYoutubeAuth(auth);
        } else {
          localStorage.removeItem('bullmoney_youtube_auth');
        }
      }
      
      // Also load manual profile
      const savedProfile = localStorage.getItem('bullmoney_personal_youtube');
      if (savedProfile) {
        setPersonalProfile(JSON.parse(savedProfile));
      }
    } catch (e) {
      console.error('Error loading YouTube auth:', e);
    }
  }, []);

  // Fetch user's YouTube playlists when authenticated
  useEffect(() => {
    if (youtubeAuth?.accessToken) {
      fetchYoutubePlaylists();
    }
  }, [youtubeAuth?.accessToken]);

  // Fetch videos when playlist changes
  useEffect(() => {
    if (youtubeAuth?.accessToken && selectedPlaylist) {
      fetchPlaylistVideos(selectedPlaylist);
    }
  }, [youtubeAuth?.accessToken, selectedPlaylist]);

  // YouTube OAuth Login
  const handleYoutubeLogin = useCallback(() => {
    if (!YOUTUBE_CLIENT_ID) {
      setPersonalError('YouTube login is not configured. Please add NEXT_PUBLIC_YOUTUBE_CLIENT_ID to your environment.');
      return;
    }

    setYoutubeLoading(true);
    setPersonalError('');

    // Create OAuth URL
    const redirectUri = `${window.location.origin}/auth/youtube/callback`;
    const state = Math.random().toString(36).substring(7);
    
    // Store state for verification
    sessionStorage.setItem('youtube_oauth_state', state);
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', YOUTUBE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', YOUTUBE_SCOPES);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('prompt', 'consent');

    // Open popup for OAuth
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      authUrl.toString(),
      'YouTube Login',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    // Listen for OAuth callback
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'YOUTUBE_AUTH_SUCCESS') {
        const { accessToken, expiresIn, user } = event.data;
        
        const authProfile: YouTubeAuthProfile = {
          accessToken,
          expiresAt: Date.now() + (expiresIn * 1000),
          user
        };
        
        localStorage.setItem('bullmoney_youtube_auth', JSON.stringify(authProfile));
        setYoutubeAuth(authProfile);
        setYoutubeLoading(false);
        setShowPersonalLogin(false);
        SoundEffects.click();
        
        popup?.close();
      } else if (event.data?.type === 'YOUTUBE_AUTH_ERROR') {
        setPersonalError(event.data.error || 'Failed to login with YouTube');
        setYoutubeLoading(false);
        popup?.close();
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if popup was closed without completing auth
    const checkPopup = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopup);
        window.removeEventListener('message', handleMessage);
        setYoutubeLoading(false);
      }
    }, 500);
  }, []);

  // Fetch user's playlists from YouTube API
  const fetchYoutubePlaylists = useCallback(async () => {
    if (!youtubeAuth?.accessToken) return;

    try {
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=25',
        {
          headers: {
            Authorization: `Bearer ${youtubeAuth.accessToken}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch playlists');

      const data = await response.json();
      const playlists = data.items?.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        itemCount: item.contentDetails.itemCount
      })) || [];

      setYoutubePlaylists(playlists);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  }, [youtubeAuth?.accessToken]);

  // Fetch videos from a playlist
  const fetchPlaylistVideos = useCallback(async (playlistId: string) => {
    if (!youtubeAuth?.accessToken) return;

    setLoadingYoutubeVideos(true);
    try {
      let url = '';
      
      if (playlistId === 'liked') {
        // Fetch liked videos
        url = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=50';
      } else if (playlistId === 'history') {
        // Watch history requires special permissions, fallback to recent activity
        url = 'https://www.googleapis.com/youtube/v3/activities?part=snippet,contentDetails&mine=true&maxResults=50';
      } else {
        // Fetch specific playlist
        url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${youtubeAuth.accessToken}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch videos');
      }

      const data = await response.json();
      
      let videos: YouTubePlaylistItem[] = [];
      
      if (playlistId === 'liked') {
        videos = data.items?.map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          youtube_id: item.id,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          channelTitle: item.snippet.channelTitle
        })) || [];
      } else if (playlistId === 'history') {
        videos = data.items?.filter((item: any) => item.snippet.type === 'upload' || item.contentDetails?.upload)
          .map((item: any) => ({
            id: item.contentDetails?.upload?.videoId || item.id,
            title: item.snippet.title,
            youtube_id: item.contentDetails?.upload?.videoId || '',
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            channelTitle: item.snippet.channelTitle
          })).filter((v: YouTubePlaylistItem) => v.youtube_id) || [];
      } else {
        videos = data.items?.map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          youtube_id: item.snippet.resourceId?.videoId || '',
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          channelTitle: item.snippet.channelTitle
        })).filter((v: YouTubePlaylistItem) => v.youtube_id) || [];
      }

      setYoutubeVideos(videos);
    } catch (error) {
      console.error('Error fetching playlist videos:', error);
      setYoutubeVideos([]);
    } finally {
      setLoadingYoutubeVideos(false);
    }
  }, [youtubeAuth?.accessToken]);

  // Logout from YouTube
  const handleYoutubeLogout = useCallback(() => {
    localStorage.removeItem('bullmoney_youtube_auth');
    setYoutubeAuth(null);
    setYoutubePlaylists([]);
    setYoutubeVideos([]);
    setSelectedPlaylist('liked');
    SoundEffects.click();
  }, []);

  // Load personal profile from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bullmoney_personal_youtube');
      if (saved) {
        setPersonalProfile(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading personal profile:', e);
    }
  }, []);

  // Save personal profile to localStorage
  const savePersonalProfile = useCallback((profile: UserYouTubeProfile) => {
    try {
      localStorage.setItem('bullmoney_personal_youtube', JSON.stringify(profile));
      setPersonalProfile(profile);
    } catch (e) {
      console.error('Error saving personal profile:', e);
    }
  }, []);

  // Extract YouTube video ID from URL
  const extractYouTubeId = useCallback((input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) return match[1];
    }
    
    return trimmed;
  }, []);

  // Add personal video
  const addPersonalVideo = useCallback(() => {
    const videoId = extractYouTubeId(personalVideoUrl);
    if (!videoId || !personalVideoTitle.trim()) {
      setPersonalError('Please enter both a title and valid YouTube URL/ID');
      return;
    }
    
    setPersonalSaving(true);
    setPersonalError('');
    
    const newVideo: PersonalVideo = {
      id: `personal_${Date.now()}`,
      title: personalVideoTitle.trim(),
      youtube_id: videoId,
      added_at: new Date().toISOString()
    };
    
    const updatedProfile: UserYouTubeProfile = {
      channelUrl: personalProfile?.channelUrl || personalChannelUrl,
      videos: [...(personalProfile?.videos || []), newVideo],
      lastUpdated: new Date().toISOString()
    };
    
    savePersonalProfile(updatedProfile);
    setPersonalVideoUrl('');
    setPersonalVideoTitle('');
    setPersonalSaving(false);
    SoundEffects.click();
  }, [personalVideoUrl, personalVideoTitle, personalProfile, personalChannelUrl, extractYouTubeId, savePersonalProfile]);

  // Remove personal video
  const removePersonalVideo = useCallback((videoId: string) => {
    if (!personalProfile) return;
    
    const updatedProfile: UserYouTubeProfile = {
      ...personalProfile,
      videos: personalProfile.videos.filter(v => v.id !== videoId),
      lastUpdated: new Date().toISOString()
    };
    
    savePersonalProfile(updatedProfile);
    SoundEffects.click();
  }, [personalProfile, savePersonalProfile]);

  // Save personal channel URL
  const savePersonalChannelUrl = useCallback(() => {
    if (!personalChannelUrl.trim()) return;
    
    const updatedProfile: UserYouTubeProfile = {
      channelUrl: personalChannelUrl.trim(),
      videos: personalProfile?.videos || [],
      lastUpdated: new Date().toISOString()
    };
    
    savePersonalProfile(updatedProfile);
    setShowPersonalLogin(false);
    SoundEffects.click();
  }, [personalChannelUrl, personalProfile, savePersonalProfile]);

  // Logout from personal YouTube (both OAuth and manual)
  const logoutPersonal = useCallback(() => {
    // Clear OAuth
    localStorage.removeItem('bullmoney_youtube_auth');
    setYoutubeAuth(null);
    setYoutubePlaylists([]);
    setYoutubeVideos([]);
    setSelectedPlaylist('liked');
    
    // Clear manual profile
    localStorage.removeItem('bullmoney_personal_youtube');
    setPersonalProfile(null);
    setPersonalChannelUrl('');
    setActiveTab('bullmoney');
    SoundEffects.click();
  }, []);

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

  // Personal video index state
  const [personalVideoIndex, setPersonalVideoIndex] = useState(0);
  const [youtubeVideoIndex, setYoutubeVideoIndex] = useState(0);

  // Current video - handles both tabs and OAuth
  const currentVideo = activeTab === 'bullmoney' 
    ? (videos[currentVideoIndex] || null)
    : null;
  
  // For personal tab: OAuth videos take priority, then manual videos
  const currentYoutubeVideo = activeTab === 'personal' && youtubeAuth && youtubeVideos.length > 0
    ? (youtubeVideos[youtubeVideoIndex] || null)
    : null;
    
  const currentPersonalVideo = activeTab === 'personal' && !youtubeAuth && personalProfile?.videos
    ? (personalProfile.videos[personalVideoIndex] || null)
    : null;

  // Active video selection
  const activeVideo = activeTab === 'bullmoney' 
    ? currentVideo 
    : (currentYoutubeVideo || currentPersonalVideo);
    
  // Active video list
  const activeVideoList = activeTab === 'bullmoney' 
    ? videos 
    : (youtubeAuth && youtubeVideos.length > 0 
        ? youtubeVideos 
        : (personalProfile?.videos || []));
        
  const activeVideoIndex = activeTab === 'bullmoney' 
    ? currentVideoIndex 
    : (youtubeAuth ? youtubeVideoIndex : personalVideoIndex);

  const youtubeEmbedUrl = activeVideo 
    ? `https://www.youtube.com/embed/${activeVideo.youtube_id}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1`
    : '';

  // Navigation
  const playNext = useCallback(() => {
    SoundEffects.click();
    if (activeTab === 'bullmoney') {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
    } else if (youtubeAuth && youtubeVideos.length) {
      setYoutubeVideoIndex((prev) => (prev + 1) % youtubeVideos.length);
    } else if (personalProfile?.videos.length) {
      setPersonalVideoIndex((prev) => (prev + 1) % personalProfile.videos.length);
    }
  }, [activeTab, videos.length, youtubeAuth, youtubeVideos.length, personalProfile?.videos.length]);

  const playPrevious = useCallback(() => {
    SoundEffects.click();
    if (activeTab === 'bullmoney') {
      setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
    } else if (youtubeAuth && youtubeVideos.length) {
      setYoutubeVideoIndex((prev) => (prev - 1 + youtubeVideos.length) % youtubeVideos.length);
    } else if (personalProfile?.videos.length) {
      setPersonalVideoIndex((prev) => (prev - 1 + personalProfile.videos.length) % personalProfile.videos.length);
    }
  }, [activeTab, videos.length, youtubeAuth, youtubeVideos.length, personalProfile?.videos.length]);

  const playVideo = useCallback((index: number) => {
    SoundEffects.click();
    if (activeTab === 'bullmoney') {
      setCurrentVideoIndex(index);
    } else if (youtubeAuth) {
      setYoutubeVideoIndex(index);
    } else {
      setPersonalVideoIndex(index);
    }
  }, [activeTab, youtubeAuth]);

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
              <span className="text-white font-semibold hidden sm:inline">BullMoney TV</span>
            </div>
            
            {/* Tab Switcher */}
            <div className="flex items-center bg-black/40 rounded-lg p-0.5 ml-2">
              <button
                onClick={() => { SoundEffects.click(); setActiveTab('bullmoney'); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'bullmoney' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Tv className="w-3 h-3" />
                  <span className="hidden sm:inline">Channel</span>
                </span>
              </button>
              <button
                onClick={() => { SoundEffects.click(); setActiveTab('personal'); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'personal' 
                    ? 'bg-purple-500 text-white' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  <span className="hidden sm:inline">My YouTube</span>
                </span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Personal YouTube Login/Logout */}
            {activeTab === 'personal' && (
              youtubeAuth ? (
                <div className="flex items-center gap-2">
                  <img 
                    src={youtubeAuth.user.picture} 
                    alt={youtubeAuth.user.name}
                    className="w-7 h-7 rounded-full border border-purple-500/50"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={logoutPersonal}
                    className="p-2 rounded-lg bg-white/10 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Logout from YouTube"
                  >
                    <LogOut className="w-5 h-5" />
                  </motion.button>
                </div>
              ) : personalProfile ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logoutPersonal}
                  className="p-2 rounded-lg bg-white/10 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { SoundEffects.click(); setShowPersonalLogin(!showPersonalLogin); }}
                  className={`p-2 rounded-lg transition-all ${showPersonalLogin ? 'bg-purple-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  title="Setup My YouTube"
                >
                  <LogIn className="w-5 h-5" />
                </motion.button>
              )
            )}
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

        {/* Personal YouTube Setup Panel */}
        <AnimatePresence>
          {showPersonalLogin && activeTab === 'personal' && !youtubeAuth && !personalProfile && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-purple-900/20 border-b border-purple-500/20 flex-shrink-0"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Connect Your YouTube</h3>
                </div>
                
                {personalError && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-3 h-3" />
                    {personalError}
                  </div>
                )}
                
                {/* Google/YouTube OAuth Login */}
                <div className="space-y-3">
                  <p className="text-xs text-neutral-400">
                    Sign in with your Google account to access your YouTube playlists, liked videos, and more.
                  </p>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleYoutubeLogin}
                    disabled={youtubeLoading}
                    className="w-full px-4 py-3 bg-white hover:bg-neutral-100 text-neutral-800 rounded-lg font-medium text-sm flex items-center justify-center gap-3 disabled:opacity-50 transition-colors"
                  >
                    {youtubeLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google
                      </>
                    )}
                  </motion.button>
                  
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-neutral-500">or add videos manually</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                </div>
                
                {/* Manual Channel URL - Fallback */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Your YouTube Channel URL (optional)"
                    value={personalChannelUrl}
                    onChange={(e) => setPersonalChannelUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder-neutral-500"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={savePersonalChannelUrl}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Continue
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* YouTube OAuth Playlists Panel */}
        <AnimatePresence>
          {activeTab === 'personal' && youtubeAuth && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-purple-900/20 border-b border-purple-500/20 flex-shrink-0"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <img 
                      src={youtubeAuth.user.picture} 
                      alt={youtubeAuth.user.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-white font-medium">{youtubeAuth.user.name}</span>
                  </div>
                  
                  {/* Playlist Selector */}
                  <select
                    value={selectedPlaylist}
                    onChange={(e) => setSelectedPlaylist(e.target.value)}
                    className="px-3 py-1.5 bg-black/50 border border-purple-500/30 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="liked">❤️ Liked Videos</option>
                    {youtubePlaylists.map(playlist => (
                      <option key={playlist.id} value={playlist.id}>
                        📁 {playlist.title} ({playlist.itemCount})
                      </option>
                    ))}
                  </select>
                </div>
                
                {loadingYoutubeVideos && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span className="text-xs text-neutral-400 ml-2">Loading videos...</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Personal YouTube Add Video Panel */}
        <AnimatePresence>
          {activeTab === 'personal' && personalProfile && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-purple-900/20 border-b border-purple-500/20 flex-shrink-0"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Add to My Videos</h3>
                  </div>
                  {personalProfile.channelUrl && (
                    <a
                      href={personalProfile.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <Link2 className="w-3 h-3" />
                      My Channel
                    </a>
                  )}
                </div>
                
                {personalError && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-3 h-3" />
                    {personalError}
                  </div>
                )}
                
                {/* Add Video Form */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Video Title"
                    value={personalVideoTitle}
                    onChange={(e) => { setPersonalVideoTitle(e.target.value); setPersonalError(''); }}
                    className="flex-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder-neutral-500"
                  />
                  <input
                    type="text"
                    placeholder="YouTube URL or Video ID"
                    value={personalVideoUrl}
                    onChange={(e) => { setPersonalVideoUrl(e.target.value); setPersonalError(''); }}
                    className="flex-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder-neutral-500"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addPersonalVideo}
                    disabled={personalSaving || !personalVideoTitle.trim() || !personalVideoUrl.trim()}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-purple-600 transition-colors"
                  >
                    {personalSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Video Player */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="relative aspect-video bg-black">
              {loading && activeTab === 'bullmoney' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-neutral-900 to-black">
                  <div className="flex flex-col items-center gap-4">
                    <ShimmerSpinner size={48} color="blue" />
                    <p className="text-neutral-400 text-sm">Loading stream...</p>
                  </div>
                </div>
              ) : activeVideo ? (
                <iframe
                  key={activeVideo.youtube_id}
                  src={youtubeEmbedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={activeVideo.title}
                />
              ) : activeTab === 'personal' && !youtubeAuth && !personalProfile ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-purple-900/20 to-black">
                  <Youtube className="w-16 h-16 text-red-500/50" />
                  <p className="text-neutral-400 text-center max-w-xs">Connect your YouTube account to watch your playlists and liked videos</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPersonalLogin(true)}
                    className="px-4 py-3 bg-white hover:bg-neutral-100 text-neutral-800 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </motion.button>
                </div>
              ) : activeTab === 'personal' && youtubeAuth && youtubeVideos.length === 0 && loadingYoutubeVideos ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-purple-900/20 to-black">
                  <ShimmerSpinner size={48} color="blue" />
                  <p className="text-neutral-400 text-sm">Loading your videos...</p>
                </div>
              ) : activeTab === 'personal' && youtubeAuth && youtubeVideos.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-purple-900/20 to-black">
                  <Heart className="w-16 h-16 text-purple-400/50" />
                  <p className="text-neutral-400 text-center max-w-xs">No videos found in this playlist</p>
                  <p className="text-neutral-500 text-xs">Try selecting a different playlist above</p>
                </div>
              ) : activeTab === 'personal' && !youtubeAuth && personalProfile && personalProfile.videos.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-purple-900/20 to-black">
                  <Heart className="w-16 h-16 text-purple-400/50" />
                  <p className="text-neutral-400 text-center max-w-xs">Add your first video above to start watching</p>
                </div>
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
                    {activeVideo?.title || 'No video selected'}
                  </h2>
                  <p className="text-sm text-neutral-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {activeTab === 'bullmoney' && currentVideo?.is_live ? 'Streaming now' : 'On demand'}
                    {activeVideoList.length > 1 && (
                      <>
                        <span className="text-neutral-600">•</span>
                        <span>{activeVideoIndex + 1} of {activeVideoList.length}</span>
                      </>
                    )}
                    {activeTab === 'personal' && (
                      <>
                        <span className="text-neutral-600">•</span>
                        <span className="text-purple-400">My Video</span>
                      </>
                    )}
                  </p>
                </div>
                
                {/* YouTube Link / Watch on YouTube */}
                {activeTab === 'bullmoney' && channelUrl ? (
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
                ) : activeVideo && (
                  <motion.a
                    href={`https://www.youtube.com/watch?v=${activeVideo.youtube_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => SoundEffects.click()}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-xs transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="hidden sm:inline">YouTube</span>
                  </motion.a>
                )}
              </div>
              
              {/* Playback Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {activeVideoList.length > 1 && (
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
                    className={`p-3 rounded-full text-white transition-all ${activeTab === 'personal' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </motion.button>
                  
                  {activeVideoList.length > 1 && (
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
                      <List className={`w-4 h-4 ${activeTab === 'personal' ? 'text-purple-400' : 'text-blue-400'}`} />
                      {activeTab === 'personal' ? 'My Videos' : 'Up Next'}
                    </h3>
                    <span className={`text-xs text-neutral-500 px-2 py-0.5 rounded-full ${activeTab === 'personal' ? 'bg-purple-500/20' : 'bg-neutral-800'}`}>
                      {activeVideoList.length}
                    </span>
                  </div>
                </div>
                
                {/* Playlist Items */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {activeTab === 'bullmoney' ? (
                    // BullMoney TV Videos
                    videos.map((video, index) => (
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
                    ))
                  ) : youtubeAuth && youtubeVideos.length > 0 ? (
                    // YouTube OAuth Videos
                    youtubeVideos.map((video, index) => (
                      <motion.button
                        key={video.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => playVideo(index)}
                        className={`
                          w-full flex gap-3 p-2 rounded-lg transition-all text-left group
                          ${index === youtubeVideoIndex 
                            ? 'bg-purple-500/20 ring-1 ring-purple-500/50' 
                            : 'hover:bg-white/5'
                          }
                        `}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-24 aspect-video rounded-md overflow-hidden bg-neutral-800 flex-shrink-0">
                          <img 
                            src={video.thumbnail || getYouTubeThumbnail(video.youtube_id, 'mq')} 
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          {/* Play overlay */}
                          <div className={`
                            absolute inset-0 flex items-center justify-center bg-black/40 
                            transition-opacity
                            ${index === youtubeVideoIndex ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                          `}>
                            <div className={`p-1.5 rounded-full ${index === youtubeVideoIndex ? 'bg-purple-500' : 'bg-white/20'}`}>
                              {index === youtubeVideoIndex ? (
                                <Radio className="w-3 h-3 text-white" />
                              ) : (
                                <Play className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0 py-0.5">
                          <p className={`
                            text-xs font-medium line-clamp-2 mb-1 transition-colors
                            ${index === youtubeVideoIndex ? 'text-purple-400' : 'text-white group-hover:text-purple-400'}
                          `}>
                            {video.title}
                          </p>
                          <p className="text-[10px] text-neutral-500 flex items-center gap-1 truncate">
                            <Youtube className="w-3 h-3 flex-shrink-0" />
                            {video.channelTitle || 'YouTube'}
                          </p>
                          {index === youtubeVideoIndex && (
                            <p className="text-[10px] text-purple-400 mt-0.5 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                              Playing
                            </p>
                          )}
                        </div>
                      </motion.button>
                    ))
                  ) : (
                    // Manual Personal Videos (fallback)
                    personalProfile?.videos.map((video, index) => (
                      <motion.div
                        key={video.id}
                        whileHover={{ scale: 1.01 }}
                        className={`
                          w-full flex gap-3 p-2 rounded-lg transition-all text-left group
                          ${index === personalVideoIndex 
                            ? 'bg-purple-500/20 ring-1 ring-purple-500/50' 
                            : 'hover:bg-white/5'
                          }
                        `}
                      >
                        <button
                          onClick={() => playVideo(index)}
                          className="flex gap-3 flex-1 min-w-0"
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
                              ${index === personalVideoIndex ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                            `}>
                              <div className={`p-1.5 rounded-full ${index === personalVideoIndex ? 'bg-purple-500' : 'bg-white/20'}`}>
                                {index === personalVideoIndex ? (
                                  <Radio className="w-3 h-3 text-white" />
                                ) : (
                                  <Play className="w-3 h-3 text-white" />
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0 py-0.5">
                            <p className={`
                              text-xs font-medium line-clamp-2 mb-1 transition-colors
                              ${index === personalVideoIndex ? 'text-purple-400' : 'text-white group-hover:text-purple-400'}
                            `}>
                              {video.title}
                            </p>
                            <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              My Video
                            </p>
                            {index === personalVideoIndex && (
                              <p className="text-[10px] text-purple-400 mt-0.5 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                                Playing
                              </p>
                            )}
                          </div>
                        </button>
                        
                        {/* Delete Button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removePersonalVideo(video.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all self-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    ))
                  )}
                  
                  {activeVideoList.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      {activeTab === 'personal' ? (
                        <>
                          <Heart className="w-10 h-10 text-purple-400/30 mb-2" />
                          <p className="text-neutral-500 text-xs">No videos added yet</p>
                          <p className="text-neutral-600 text-[10px] mt-1">Add videos above to watch them here</p>
                        </>
                      ) : (
                        <>
                          <Youtube className="w-10 h-10 text-neutral-700 mb-2" />
                          <p className="text-neutral-500 text-xs">No videos in playlist</p>
                        </>
                      )}
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
