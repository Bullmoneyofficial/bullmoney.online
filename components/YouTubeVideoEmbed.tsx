"use client";

import React, { useMemo, useRef, useEffect } from 'react';

type YouTubeVideoEmbedProps = {
  videoId: string;
  muted?: boolean;
  className?: string;
  title?: string;
  [key: string]: any;
};

/**
 * YouTube Video Embed component that plays audio only on first load.
 * After the first play-through, the video continues looping but muted.
 */
const YouTubeVideoEmbed = ({ 
  videoId, 
  muted = false, 
  className = "absolute inset-0 w-full h-full",
  title = "Video player",
  ...props 
}: YouTubeVideoEmbedProps) => {
  const hasPlayedRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Track if this is the first load using sessionStorage
  // This way audio plays once per session (until page is refreshed/revisited)
  useEffect(() => {
    const storageKey = `yt-played-${videoId}`;
    const hasPlayedInSession = sessionStorage.getItem(storageKey);
    
    if (hasPlayedInSession === 'true') {
      hasPlayedRef.current = true;
    }
  }, [videoId]);

  // Generate embed URL - muted if already played or user explicitly muted
  const embedUrl = useMemo(() => {
    const shouldMute = muted || hasPlayedRef.current;
    
    const params = new URLSearchParams({
      autoplay: '1',
      mute: shouldMute ? '1' : '0',
      controls: '0',
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      loop: '1',
      playlist: videoId,
      enablejsapi: '1', // Enable JS API for event tracking
    });
    
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }, [videoId, muted]);

  // Listen for video end events to mark as played
  useEffect(() => {
    if (!iframeRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      // YouTube iframe API sends messages
      if (event.origin !== 'https://www.youtube.com') return;
      
      try {
        const data = JSON.parse(event.data);
        // YT.PlayerState.ENDED = 0
        if (data.event === 'onStateChange' && data.info === 0) {
          // Video ended - mark as played
          const storageKey = `yt-played-${videoId}`;
          sessionStorage.setItem(storageKey, 'true');
          hasPlayedRef.current = true;
          
          // Reload iframe with muted version for subsequent loops
          if (iframeRef.current) {
            const params = new URLSearchParams({
              autoplay: '1',
              mute: '1', // Now muted for loops
              controls: '0',
              rel: '0',
              modestbranding: '1',
              playsinline: '1',
              loop: '1',
              playlist: videoId,
              enablejsapi: '1',
            });
            iframeRef.current.src = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [videoId]);

  return (
    <iframe
      ref={iframeRef}
      key={embedUrl}
      src={embedUrl}
      title={title}
      className={className}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      frameBorder="0"
      loading="lazy"
      {...props}
    />
  );
};

export default YouTubeVideoEmbed;
