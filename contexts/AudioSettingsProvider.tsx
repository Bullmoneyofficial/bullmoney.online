"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { userStorage } from "@/lib/smartStorage";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import { SoundEffects } from "@/app/hooks/useSoundEffects";

export type MusicSource = "THEME" | "SPOTIFY" | "APPLE_MUSIC" | "YOUTUBE";

// Streaming sources that use iframe embeds instead of audio elements
export const STREAMING_SOURCES: MusicSource[] = ["SPOTIFY", "APPLE_MUSIC", "YOUTUBE"];

type AudioSettingsContextValue = {
  musicEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;

  musicVolume: number; // 0..1
  setMusicVolume: (volume: number) => void;

  sfxVolume: number; // 0..1
  setSfxVolume: (volume: number) => void;

  musicSource: MusicSource;
  setMusicSource: (source: MusicSource) => void;

  isMusicPlaying: boolean;
  toggleMusic: () => void;

  tipsMuted: boolean;
  setTipsMuted: (muted: boolean) => void;

  getResolvedMusicUrl: () => string | null;
  
  // Streaming embed URLs
  streamingEmbedUrl: string | null;
  isStreamingSource: boolean;
};

const AudioSettingsContext = createContext<AudioSettingsContextValue | undefined>(undefined);

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const STORAGE_KEYS = {
  musicEnabled: "audio_music_enabled_v1",
  musicVolume: "audio_music_volume_v1",
  sfxVolume: "audio_sfx_volume_v1",
  musicSource: "audio_music_source_v1",
  tipsMuted: "audio_tips_muted_v1",
} as const;

const MUSIC_URLS: Record<Exclude<MusicSource, "THEME" | "SPOTIFY" | "APPLE_MUSIC" | "YOUTUBE">, string> = {
  // MP3 files disabled - only streaming sources allowed
};

export function AudioSettingsProvider({ children }: { children: React.ReactNode }) {
  const { activeTheme } = useGlobalTheme();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  const [musicEnabled, setMusicEnabledState] = useState(true);
  const [musicVolume, setMusicVolumeState] = useState(0.15);
  const [sfxVolume, setSfxVolumeState] = useState(0.3);
  const [musicSource, setMusicSourceState] = useState<MusicSource>("THEME");
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [tipsMuted, setTipsMutedState] = useState(false);

  // Cleanup audio resource on unmount.
  useEffect(() => {
    return () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.src = "";
        }
      } catch {
        // ignore
      }
      audioRef.current = null;
    };
  }, []);

  const resolvedMusicUrl = useMemo(() => {
    // Streaming sources don't use the audio element
    if (STREAMING_SOURCES.includes(musicSource)) {
      return null;
    }
    
    if (musicSource === "THEME") {
      // Default to null for THEME since no MP3s available
      return activeTheme?.bgMusicUrl || null;
    }
    return MUSIC_URLS[musicSource as keyof typeof MUSIC_URLS];
  }, [activeTheme?.bgMusicUrl, activeTheme?.category, musicSource]);

  // Get streaming embed URL based on source - with autoplay enabled
  // These work because the iframe is loaded immediately after a user click (selecting from dropdown)
  const streamingEmbedUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    
    if (musicSource === "SPOTIFY") {
      const baseUrl = process.env.NEXT_PUBLIC_SPOTIFY_EMBED_URL;
      if (!baseUrl) return null;
      try {
        const url = new URL(baseUrl);
        url.searchParams.set("theme", "0");
        url.searchParams.set("utm_source", "generator");
        // Spotify parameters to help with autoplay/engagement
        url.searchParams.set("view", "list");
        return url.toString();
      } catch {
        return baseUrl;
      }
    }
    
    if (musicSource === "APPLE_MUSIC") {
      const baseUrl = process.env.NEXT_PUBLIC_APPLE_MUSIC_EMBED_URL;
      if (!baseUrl) return null;
      try {
        const url = new URL(baseUrl);
        url.searchParams.set("app", "music");
        url.searchParams.set("theme", "auto");
        url.searchParams.set("l", "en");
        // Force embedded player mode
        url.searchParams.set("sdk", "true");
        return url.toString();
      } catch {
        return baseUrl;
      }
    }
    
    if (musicSource === "YOUTUBE") {
      const baseUrl = process.env.NEXT_PUBLIC_YOUTUBE_MUSIC_EMBED_URL || process.env.NEXT_PUBLIC_YOUTUBE_EMBED_URL;
      if (!baseUrl) return null;
      try {
        const url = new URL(baseUrl);
        // YouTube autoplay works when triggered by user interaction!
        url.searchParams.set("autoplay", "1");
        url.searchParams.set("loop", "1");
        url.searchParams.set("rel", "0");
        url.searchParams.set("modestbranding", "1");
        url.searchParams.set("playsinline", "1");
        url.searchParams.set("enablejsapi", "1");
        url.searchParams.set("origin", typeof window !== "undefined" ? window.location.origin : "");
        // For seamless looping - playlist param is needed for loop to work
        const listId = url.searchParams.get("list");
        if (listId) {
          url.searchParams.set("playlist", listId);
        }
        return url.toString();
      } catch {
        return baseUrl;
      }
    }
    
    return null;
  }, [musicSource]);

  const isStreamingSource = STREAMING_SOURCES.includes(musicSource);

  const getResolvedMusicUrl = useCallback(() => resolvedMusicUrl, [resolvedMusicUrl]);

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") return null;

    const url = resolvedMusicUrl;
    if (!url) return null;

    if (audioRef.current?.src && audioRef.current.src.endsWith(url)) {
      return audioRef.current;
    }

    // Replace audio element when URL changes.
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch {
      // ignore
    }

    const audio = new Audio(url);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = clamp01(musicEnabled ? musicVolume : 0);

    audio.onplay = () => setIsMusicPlaying(true);
    audio.onpause = () => setIsMusicPlaying(false);

    audioRef.current = audio;

    return audio;
  }, [musicEnabled, musicVolume, resolvedMusicUrl]);

  // Load persisted settings once.
  useEffect(() => {
    const storedEnabled = userStorage.get(STORAGE_KEYS.musicEnabled);
    const storedMusicVol = userStorage.get(STORAGE_KEYS.musicVolume);
    const storedSfxVol = userStorage.get(STORAGE_KEYS.sfxVolume);
    const storedSource = userStorage.get(STORAGE_KEYS.musicSource);
    const storedTipsMuted = userStorage.get(STORAGE_KEYS.tipsMuted);

    if (storedEnabled !== null) setMusicEnabledState(storedEnabled === true || storedEnabled === "true");

    if (typeof storedMusicVol === "number") setMusicVolumeState(clamp01(storedMusicVol));
    else if (typeof storedMusicVol === "string") {
      const parsed = Number(storedMusicVol);
      if (!Number.isNaN(parsed)) setMusicVolumeState(clamp01(parsed));
    }

    if (typeof storedSfxVol === "number") setSfxVolumeState(clamp01(storedSfxVol));
    else if (typeof storedSfxVol === "string") {
      const parsed = Number(storedSfxVol);
      if (!Number.isNaN(parsed)) setSfxVolumeState(clamp01(parsed));
    }

    if (typeof storedSource === "string") {
      const asSource = storedSource.toUpperCase() as MusicSource;
      if (["THEME", "SPOTIFY", "APPLE_MUSIC", "YOUTUBE"].includes(asSource)) {
        setMusicSourceState(asSource);
      }
    }

    if (storedTipsMuted !== null) {
      setTipsMutedState(storedTipsMuted === true || storedTipsMuted === "true");
    }
  }, []);

  // Keep synthesized interaction sounds in sync.
  useEffect(() => {
    SoundEffects.setVolume(clamp01(sfxVolume));
  }, [sfxVolume]);

  // Keep audio element volume and pause state in sync.
  useEffect(() => {
    const audio = ensureAudio();
    if (!audio) return;

    audio.volume = clamp01(musicEnabled ? musicVolume : 0);

    if (!musicEnabled) {
      audio.pause();
      return;
    }

    // If we’re unlocked and music is enabled, try to play.
    if (unlockedRef.current) {
      audio.play().catch(() => {
        // autoplay blocked; user can hit play.
      });
    }
  }, [ensureAudio, musicEnabled, musicVolume]);

  // Attempt to unlock autoplay on first user interaction.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const unlock = () => {
      unlockedRef.current = true;
      const audio = ensureAudio();
      if (audio && musicEnabled) {
        audio.play().catch(() => {});
      }
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };

    window.addEventListener("click", unlock);
    window.addEventListener("touchstart", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [ensureAudio, musicEnabled]);

  // Persist settings.
  useEffect(() => {
    userStorage.set(STORAGE_KEYS.musicEnabled, String(musicEnabled));
  }, [musicEnabled]);

  useEffect(() => {
    userStorage.set(STORAGE_KEYS.musicVolume, String(musicVolume));
  }, [musicVolume]);

  useEffect(() => {
    userStorage.set(STORAGE_KEYS.sfxVolume, String(sfxVolume));
  }, [sfxVolume]);

  useEffect(() => {
    userStorage.set(STORAGE_KEYS.musicSource, musicSource);
  }, [musicSource]);

  useEffect(() => {
    userStorage.set(STORAGE_KEYS.tipsMuted, String(tipsMuted));
  }, [tipsMuted]);

  const setMusicEnabled = useCallback((enabled: boolean) => {
    setMusicEnabledState(enabled);
    if (!enabled) {
      try {
        audioRef.current?.pause();
      } catch {
        // ignore
      }
    }
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    const next = clamp01(volume);
    setMusicVolumeState(next);
    if (next > 0 && !musicEnabled) {
      setMusicEnabledState(true);
    }
  }, [musicEnabled]);

  const setSfxVolume = useCallback((volume: number) => {
    setSfxVolumeState(clamp01(volume));
  }, []);

  const setMusicSource = useCallback((source: MusicSource) => {
    setMusicSourceState(source);
  }, []);

  const toggleMusic = useCallback(() => {
    // For streaming sources, just toggle the enabled state
    if (isStreamingSource) {
      setMusicEnabledState((prev) => !prev);
      setIsMusicPlaying((prev) => !prev);
      return;
    }
    
    const audio = ensureAudio();
    if (!audio) return;

    if (audio.paused) {
      setMusicEnabledState(true);
      audio.volume = clamp01(musicVolume);
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [ensureAudio, isStreamingSource, musicVolume]);

  const setTipsMuted = useCallback((muted: boolean) => {
    setTipsMutedState(muted);
  }, []);

  // keep Media Session API in sync 
  useEffect(() => {
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      if (musicSource === "THEME" && isMusicPlaying) {
        navigator.mediaSession.playbackState = "playing";
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Ambient Theme",
          artist: "BullMoney",
          album: "Website Theme",
          artwork: [
            { src: "/logo.png", sizes: "96x96", type: "image/png" },
            { src: "/logo.png", sizes: "128x128", type: "image/png" },
          ],
        });
      } else {
        // If paused or streaming source (handled by iframe usually)
        if (musicSource === "THEME") {
            navigator.mediaSession.playbackState = "paused";
        }
      }

      // Set action handlers
      const handlePlay = () => {
        setMusicEnabled(true);
        setIsMusicPlaying(true);
        if (audioRef.current) audioRef.current.play();
      };

      const handlePause = () => {
        setIsMusicPlaying(false);
        if (audioRef.current) audioRef.current.pause();
      };
      
      const handleStop = () => {
        setMusicEnabled(false);
        setIsMusicPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
      };

      navigator.mediaSession.setActionHandler("play", handlePlay);
      navigator.mediaSession.setActionHandler("pause", handlePause);
      navigator.mediaSession.setActionHandler("stop", handleStop);
      
      return () => {
        try {
            navigator.mediaSession.setActionHandler("play", null);
            navigator.mediaSession.setActionHandler("pause", null);
            navigator.mediaSession.setActionHandler("stop", null);
        } catch (e) {
            // ignore
        }
      };
    }
  }, [musicSource, isMusicPlaying, setMusicEnabled]);

  const value = useMemo<AudioSettingsContextValue>(
    () => ({
      musicEnabled,
      setMusicEnabled,
      musicVolume,
      setMusicVolume,
      sfxVolume,
      setSfxVolume,
      musicSource,
      setMusicSource,
      isMusicPlaying,
      toggleMusic,
      getResolvedMusicUrl,

      tipsMuted,
      setTipsMuted,
      
      streamingEmbedUrl,
      isStreamingSource,
    }),
    [
      getResolvedMusicUrl,
      isMusicPlaying,
      musicEnabled,
      musicSource,
      musicVolume,
      setMusicEnabled,
      setMusicSource,
      setMusicVolume,
      setSfxVolume,
      sfxVolume,
      toggleMusic,

      tipsMuted,
      setTipsMuted,
      
      streamingEmbedUrl,
      isStreamingSource,
    ]
  );

  return <AudioSettingsContext.Provider value={value}>{children}</AudioSettingsContext.Provider>;
}

export function useAudioSettings() {
  const ctx = useContext(AudioSettingsContext);
  if (!ctx) throw new Error("useAudioSettings must be used within AudioSettingsProvider");
  return ctx;
}
