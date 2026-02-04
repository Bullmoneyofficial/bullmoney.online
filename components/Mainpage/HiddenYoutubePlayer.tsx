"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAudioSettings } from '@/contexts/AudioSettingsProvider';

// --- 👇 CRITICAL FIX: TYPE DECLARATION BLOCK 👇 ---
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: {
      Player: new (elementId: string, options: any) => {
        playVideo: () => void;
        pauseVideo: () => void;
        setVolume: (vol: number) => void;
        destroy: () => void;
        getPlayerState: () => number;
        mute: () => void;
      };
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        // Include other states for robustness if needed, but these are key:
        BUFFERING: number;
        UNSTARTED: number;
      };
    };
  }
}
// -------------------------------------------------------------

type HiddenYouTubePlayerProps = {
  videoId: string;
  isPlaying: boolean;
  volume?: number; // 0-100
};

const HiddenYouTubePlayer = ({ 
  videoId, 
  isPlaying, 
  volume
}: HiddenYouTubePlayerProps) => {
  const audioSettings = useAudioSettings();
  const playerRef = useRef<any>(null);
  const containerId = `yt-player-${videoId}`;
  const hasPlayedOnceRef = useRef(false);
  const [shouldMuteAfterFirstPlay, setShouldMuteAfterFirstPlay] = useState(false);
  // Use iframeVolume for separate iframe volume control
  const resolvedVolume = typeof volume === 'number' ? volume : Math.round(audioSettings.iframeVolume * 100);
  const allowMusic = audioSettings.allowedChannel === "all" || audioSettings.allowedChannel === "music";
  const effectiveVolume = audioSettings.musicEnabled && !audioSettings.masterMuted && allowMusic ? resolvedVolume : 0;

  // If this player is asked to play, make it the active audio channel
  useEffect(() => {
    if (isPlaying) {
      audioSettings.setAllowedChannel("music");
    }
  }, [isPlaying, audioSettings]);

  // 1. INITIALIZE PLAYER (Only runs when videoId changes, forcing a rebuild)
  useEffect(() => {
    // If player exists, destroy it cleanly before rebuilding
    if (playerRef.current) {
        try { playerRef.current.destroy(); } catch(e) {}
        playerRef.current = null;
    }
    
    // Reset the played-once flag when video changes
    hasPlayedOnceRef.current = false;
    setShouldMuteAfterFirstPlay(false);

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player(containerId, {
        height: '1', 
        width: '1',
        videoId: videoId,
        playerVars: {
          autoplay: 0, // We control play manually to avoid browser blocks
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          loop: 1,
          playlist: videoId, 
          origin: typeof window !== 'undefined' ? window.location.origin : undefined, // Security fix
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(effectiveVolume);
            // Attempt playback immediately if the state demands it and the player is ready
            if (isPlaying) {
               event.target.playVideo();
            }
          },
          onStateChange: (event: any) => {
             // When video ends, mark that it has played once and mute for future loops
             if (window.YT.PlayerState && event.data === window.YT.PlayerState.ENDED) {
                if (!hasPlayedOnceRef.current) {
                  hasPlayedOnceRef.current = true;
                  setShouldMuteAfterFirstPlay(true);
                  // Mute the player before looping
                  event.target.mute();
                }
                // Continue looping the video (now muted after first play)
                event.target.playVideo(); 
             }
          }
        },
      });
    };

    // Load API script if needed
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag?.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
      
      // Setup global callback
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      // API already loaded, init immediately
      initPlayer();
    }

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch(e) {}
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // 2. CONTROL PLAYBACK (Runs when isPlaying or volume changes)
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      try {
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      } catch (e) {
        // console.warn("Player control error, likely not fully ready yet.", e);
      }
    }
  }, [isPlaying]);

  // 3. CONTROL VOLUME (Runs when volume changes - separate from playback)
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        // If we've already played once, keep it muted (for looping behavior)
        if (shouldMuteAfterFirstPlay || effectiveVolume === 0) {
          playerRef.current.mute();
        } else {
          playerRef.current.setVolume(effectiveVolume);
        }
      } catch (e) {
        // Player not ready yet
      }
    }
  }, [effectiveVolume, shouldMuteAfterFirstPlay]);

  return (
    <div 
      id={containerId}
      // CRITICAL CSS: Push off-screen without hiding the DOM element entirely
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: 0, 
        zIndex: -1,
        pointerEvents: 'none',
        height: '1px',
        width: '1px',
        overflow: 'hidden'
      }} 
    />
  );
};

export default HiddenYouTubePlayer;
