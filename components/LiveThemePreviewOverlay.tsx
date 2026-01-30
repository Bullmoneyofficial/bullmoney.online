"use client";

import React, { useEffect, useState, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import YouTube, { YouTubeEvent } from 'react-youtube';
import { ALL_THEMES } from '@/constants/theme-data';

interface LiveThemePreviewOverlayProps {
  /** Theme ID to preview (null = no preview) */
  previewThemeId: string | null;
  /** Whether music should play during preview */
  enableMusic?: boolean;
  /** Music volume (0-100) */
  musicVolume?: number;
  /** Whether on mobile device */
  isMobile?: boolean;
  /** Whether user has muted audio */
  isMuted?: boolean;
}

/**
 * LiveThemePreviewOverlay
 * 
 * A high z-index overlay that previews theme colors and plays music
 * while maintaining full app interactivity (scroll, touch, clicks).
 * 
 * FEATURES:
 * - Supreme z-index (999999999999998) - sits above everything except theme modals
 * - Pointer-events: none - allows all interactions to pass through
 * - Applies color filter overlay to entire app
 * - Plays YouTube music for each theme on hover
 * - Smooth transitions between themes
 * - GPU accelerated for performance
 * 
 * USAGE:
 * Place this component at the root level (in layout or providers)
 * Control visibility via previewThemeId prop
 */
export const LiveThemePreviewOverlay = memo(function LiveThemePreviewOverlay({
  previewThemeId,
  enableMusic = true,
  musicVolume = 30,
  isMobile = false,
  isMuted = false,
}: LiveThemePreviewOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentYouTubeId, setCurrentYouTubeId] = useState<string | null>(null);
  const youtubePlayerRef = useRef<any>(null);
  const [playerReady, setPlayerReady] = useState(false);

  // Get the preview theme
  const previewTheme = previewThemeId 
    ? ALL_THEMES.find(t => t.id === previewThemeId) 
    : null;

  // Show overlay when preview theme is active
  useEffect(() => {
    if (previewTheme) {
      // Small delay for smooth transition
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [previewTheme]);

  // Handle YouTube video changes
  useEffect(() => {
    if (!enableMusic || isMuted) {
      // Stop current video if muted
      if (playerReady && youtubePlayerRef.current?.pauseVideo) {
        try {
          youtubePlayerRef.current.pauseVideo();
        } catch (e) {
          console.warn('Could not pause YouTube player:', e);
        }
      }
      return;
    }

    if (previewTheme?.youtubeId) {
      setCurrentYouTubeId(previewTheme.youtubeId);
    } else {
      setCurrentYouTubeId(null);
      // Pause if no video
      if (playerReady && youtubePlayerRef.current?.pauseVideo) {
        try {
          youtubePlayerRef.current.pauseVideo();
        } catch (e) {
          console.warn('Could not pause YouTube player:', e);
        }
      }
    }
  }, [previewTheme?.youtubeId, enableMusic, isMuted, playerReady]);

  // Control playback
  useEffect(() => {
    if (!playerReady || !youtubePlayerRef.current) return;

    const player = youtubePlayerRef.current;

    try {
      if (isMuted || !enableMusic || !currentYouTubeId) {
        player.setVolume(0);
        if (player.pauseVideo) player.pauseVideo();
      } else {
        player.setVolume(musicVolume);
        if (player.playVideo) player.playVideo();
      }
    } catch (e) {
      console.warn('YouTube player control error:', e);
    }
  }, [isMuted, enableMusic, currentYouTubeId, musicVolume, playerReady]);

  const handlePlayerReady = (event: YouTubeEvent) => {
    youtubePlayerRef.current = event.target;
    setPlayerReady(true);
    
    // Set initial volume
    try {
      if (event.target?.setVolume) {
        event.target.setVolume(isMuted ? 0 : musicVolume);
      }
    } catch (e) {
      console.warn('Could not set initial volume:', e);
    }
  };

  const handleStateChange = (event: YouTubeEvent) => {
    // Loop the video when it ends
    if (event.data === 0 && event.target?.playVideo) {
      try {
        event.target.playVideo();
      } catch (e) {
        console.warn('Could not loop video:', e);
      }
    }
  };

  const filter = previewTheme 
    ? (isMobile ? previewTheme.mobileFilter : previewTheme.filter)
    : 'none';

  const accentColor = previewTheme?.accentColor || '#ffffff';

  return (
    <>
      {/* Hidden YouTube Player */}
      {enableMusic && currentYouTubeId && (
        <div className="theme-music-player-supreme">
          <YouTube
            videoId={currentYouTubeId}
            opts={{
              height: '0',
              width: '0',
              playerVars: {
                autoplay: 1,
                controls: 0,
                loop: 1,
                playlist: currentYouTubeId,
                modestbranding: 1,
                playsinline: 1,
              },
            }}
            onReady={handlePlayerReady}
            onStateChange={handleStateChange}
          />
        </div>
      )}

      {/* Color Overlay */}
      <AnimatePresence mode="wait">
        {previewTheme && (
          <motion.div
            key={previewThemeId}
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.5,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="theme-preview-overlay-supreme theme-preview-transition"
            style={{
              filter: filter,
              WebkitFilter: filter,
              background: `linear-gradient(135deg, 
                ${accentColor}08 0%, 
                transparent 50%, 
                ${accentColor}05 100%)`,
              mixBlendMode: 'normal',
            }}
            aria-hidden="true"
          >
            {/* Subtle accent color wash */}
            <div
              className="absolute inset-0 theme-preview-transition"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${accentColor}15, transparent 70%)`,
                mixBlendMode: 'overlay',
              }}
            />

            {/* Optional: Theme name indicator */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="absolute top-8 right-8 px-4 py-2 rounded-lg backdrop-blur-md bg-black/60 border-2"
              style={{
                pointerEvents: 'none',
                borderColor: `rgba(var(--accent-rgb, 255, 255, 255), 0.6)`,
                boxShadow: `0 0 25px rgba(var(--accent-rgb, 255, 255, 255), 0.4), 0 0 50px ${accentColor}20`,
              }}
            >
              <p
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: "rgba(var(--accent-rgb, 255, 255, 255), 0.8)", textShadow: "0 0 8px rgba(var(--accent-rgb, 255, 255, 255), 0.5)" }}
              >
                Previewing:
              </p>
              <p 
                className="text-sm font-black tracking-widest uppercase"
                style={{ color: accentColor, textShadow: `0 0 10px ${accentColor}80` }}
              >
                {previewTheme.name}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

LiveThemePreviewOverlay.displayName = 'LiveThemePreviewOverlay';
