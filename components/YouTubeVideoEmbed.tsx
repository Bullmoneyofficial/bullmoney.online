"use client";

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useAudioSettings } from '@/contexts/AudioSettingsProvider';

type YouTubeVideoEmbedProps = {
  videoId: string;
  muted?: boolean;
  volume?: number;
  className?: string;
  title?: string;
  [key: string]: any;
};

const YOUTUBE_ORIGIN = "https://www.youtube.com";

const clampVolume = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
};

const buildEmbedUrl = (videoId: string, muted: boolean) => {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: muted ? '1' : '0',
    controls: '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    loop: '1',
    playlist: videoId,
    enablejsapi: '1',
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

const sendPlayerCommand = (iframe: HTMLIFrameElement, func: string, args: (number | string)[] = []) => {
  const targetWindow = iframe.contentWindow;
  if (!targetWindow) return;

  const payload = {
    event: 'command',
    func,
    args,
  };

  targetWindow.postMessage(JSON.stringify(payload), YOUTUBE_ORIGIN);
};

const YouTubeVideoEmbed = ({ 
  videoId, 
  muted,
  volume,
  className = "absolute inset-0 w-full h-full",
  title = "Video player",
  ...props 
}: YouTubeVideoEmbedProps) => {
  const audioSettings = useAudioSettings();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeId = useMemo(() => `yt-embed-${videoId}-${Math.random().toString(36).slice(2, 7)}`, [videoId]);
  const [playerReady, setPlayerReady] = useState(false);
  // Use iframeVolume for separate iframe volume control
  const resolvedVolume = useMemo(() => {
    const raw = typeof volume === 'number' ? volume : Math.round(audioSettings.iframeVolume * 100);
    return clampVolume(raw);
  }, [audioSettings.iframeVolume, volume]);
  const resolvedMuted = useMemo(() => {
    if (typeof muted === 'boolean') return muted;
    return !audioSettings.musicEnabled || resolvedVolume === 0;
  }, [audioSettings.musicEnabled, muted, resolvedVolume]);
  const targetVolume = useMemo(() => clampVolume(resolvedMuted ? 0 : resolvedVolume), [resolvedMuted, resolvedVolume]);
  const embedUrl = useMemo(() => buildEmbedUrl(videoId, resolvedMuted), [videoId, resolvedMuted]);

  useEffect(() => {
    setPlayerReady(false);
  }, [iframeId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== YOUTUBE_ORIGIN || typeof event.data !== 'string') return;
      try {
        const data = JSON.parse(event.data);
        if (data?.event === 'onReady' && data?.id === iframeId) {
          setPlayerReady(true);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [iframeId]);

  useEffect(() => {
    if (!playerReady || !iframeRef.current) return;

    if (targetVolume === 0) {
      sendPlayerCommand(iframeRef.current, 'mute');
    } else {
      sendPlayerCommand(iframeRef.current, 'unMute');
    }
    sendPlayerCommand(iframeRef.current, 'setVolume', [targetVolume]);
  }, [playerReady, targetVolume]);

  // Also try sending volume commands even before "ready" state is confirmed
  // YouTube iframes can sometimes accept commands before sending ready event
  useEffect(() => {
    if (!iframeRef.current) return;
    
    // Delay to give iframe time to load
    const timer = setTimeout(() => {
      if (iframeRef.current) {
        if (targetVolume === 0) {
          sendPlayerCommand(iframeRef.current, 'mute');
        } else {
          sendPlayerCommand(iframeRef.current, 'unMute');
        }
        sendPlayerCommand(iframeRef.current, 'setVolume', [targetVolume]);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [targetVolume]);

  return (
    <iframe
      ref={iframeRef}
      id={iframeId}
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
