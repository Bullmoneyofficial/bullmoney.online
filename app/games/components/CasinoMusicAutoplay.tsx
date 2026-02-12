'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type PlaylistTrack = {
  id: string;
  src: string;
  startAt: number;
  duration: number;
};

const BASE_TRACKS: PlaylistTrack[] = [
  { id: 'helix-1', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', startAt: 0, duration: 80 },
  { id: 'helix-2', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', startAt: 12, duration: 80 },
  { id: 'helix-3', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', startAt: 8, duration: 80 },
  { id: 'helix-4', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', startAt: 20, duration: 80 },
  { id: 'helix-5', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', startAt: 0, duration: 80 },
  { id: 'helix-6', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', startAt: 15, duration: 80 },
  { id: 'helix-7', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', startAt: 10, duration: 80 },
  { id: 'helix-8', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', startAt: 22, duration: 80 },
  { id: 'helix-9', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', startAt: 6, duration: 80 },
  { id: 'helix-10', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', startAt: 18, duration: 80 },
];

const shuffleTracks = (tracks: PlaylistTrack[]) => {
  const next = [...tracks];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

type CasinoMusicAutoplayProps = {
  enabled?: boolean;
};

const DEFAULT_VOLUME = 0.12;
const VOLUME_STORAGE_KEY = 'casino_music_volume_v1';
const MUTE_STORAGE_KEY = 'casino_music_muted_v1';

export function CasinoMusicAutoplay({ enabled = true }: CasinoMusicAutoplayProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const instanceIdRef = useRef(`casino-music-${Math.random().toString(36).slice(2)}-${Date.now()}`);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [isPrimaryInstance, setIsPrimaryInstance] = useState(true);
  const playlist = useMemo(() => shuffleTracks(BASE_TRACKS), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const claimIfAvailable = () => {
      const currentId = instanceIdRef.current;
      const activeInstance = (window as any).__casinoMusicActiveInstance;

      if (!activeInstance || activeInstance === currentId) {
        (window as any).__casinoMusicActiveInstance = currentId;
        setIsPrimaryInstance(true);
      } else {
        setIsPrimaryInstance(false);
      }
    };

    const onOwnerReleased = () => {
      claimIfAvailable();
    };

    claimIfAvailable();
    window.addEventListener('casino-music-owner-released', onOwnerReleased);

    const intervalId = window.setInterval(() => {
      claimIfAvailable();
    }, 1200);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('casino-music-owner-released', onOwnerReleased);

      if ((window as any).__casinoMusicActiveInstance === instanceIdRef.current) {
        delete (window as any).__casinoMusicActiveInstance;
        window.dispatchEvent(new Event('casino-music-owner-released'));
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled || !isPrimaryInstance || typeof window === 'undefined') return;

    const storedVolume = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    const parsedVolume = storedVolume ? Number(storedVolume) : NaN;
    if (Number.isFinite(parsedVolume)) {
      setVolume(Math.max(0, Math.min(1, parsedVolume)));
    }

    const storedMuted = window.localStorage.getItem(MUTE_STORAGE_KEY);
    if (storedMuted === 'true') {
      setIsMuted(true);
    }
  }, [enabled, isPrimaryInstance]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
  }, [volume]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(MUTE_STORAGE_KEY, String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    if (!enabled || !isPrimaryInstance) return;

    const unlockAudio = () => {
      setAutoplayBlocked(false);

      const audio = audioRef.current;
      if (!audio) return;

      audio.muted = false;
      void audio.play().catch(() => {
        // Browser may still block in rare cases; effect retry handles it.
      });
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, [enabled, isPrimaryInstance]);

  useEffect(() => {
    if (!enabled || !isPrimaryInstance) return;
    const audio = audioRef.current;
    if (!audio) return;

    let isDisposed = false;

    const currentTrack = playlist[playlistIndex];
    if (!currentTrack) return;
    let loadTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const moveToNextTrack = () => {
      if (isDisposed) return;
      setPlaylistIndex((prev) => (prev + 1) % playlist.length);
    };

    const applyTrackStart = () => {
      if (audio.currentTime < currentTrack.startAt - 0.25 || audio.currentTime > currentTrack.startAt + 0.25) {
        audio.currentTime = currentTrack.startAt;
      }
    };

    const handleTimeUpdate = () => {
      if (audio.currentTime >= currentTrack.startAt + currentTrack.duration) {
        moveToNextTrack();
      }
    };

    const attemptAutoplay = async () => {
      try {
        audio.muted = isMuted;
        audio.volume = Math.max(0, Math.min(1, volume));
        await audio.play();
        setAutoplayBlocked(false);
      } catch {
        setAutoplayBlocked(true);
      }
    };

    audio.volume = Math.max(0, Math.min(1, volume));
    audio.muted = isMuted;
    audio.preload = 'auto';
    audio.src = currentTrack.src;
    audio.loop = false;

    const clearLoadTimeout = () => {
      if (loadTimeoutId) {
        clearTimeout(loadTimeoutId);
        loadTimeoutId = null;
      }
    };

    const startLoadTimeout = () => {
      clearLoadTimeout();
      loadTimeoutId = setTimeout(() => {
        moveToNextTrack();
      }, 12000);
    };

    const handleLoadedMetadata = () => {
      applyTrackStart();
      void attemptAutoplay();
    };

    const handleCanPlay = () => {
      clearLoadTimeout();
      void attemptAutoplay();
    };

    const handleError = () => {
      moveToNextTrack();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', moveToNextTrack);
    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleError);
    audio.addEventListener('abort', handleError);

    startLoadTimeout();

    if (audio.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      audio.load();
    }

    return () => {
      isDisposed = true;
      clearLoadTimeout();
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', moveToNextTrack);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('stalled', handleError);
      audio.removeEventListener('abort', handleError);
    };
  }, [enabled, playlist, playlistIndex, volume, isMuted, isPrimaryInstance]);

  useEffect(() => {
    if (!enabled || !autoplayBlocked || !isPrimaryInstance) return;

    const retryOnVisibility = () => {
      if (document.hidden) return;
      const audio = audioRef.current;
      if (!audio) return;
      audio.muted = isMuted;
      audio.volume = Math.max(0, Math.min(1, volume));
      void audio.play().then(() => setAutoplayBlocked(false)).catch(() => {
        // Keep blocked state until browser allows autoplay or user interacts.
      });
    };

    document.addEventListener('visibilitychange', retryOnVisibility);
    window.addEventListener('focus', retryOnVisibility);

    return () => {
      document.removeEventListener('visibilitychange', retryOnVisibility);
      window.removeEventListener('focus', retryOnVisibility);
    };
  }, [enabled, autoplayBlocked, isMuted, volume, isPrimaryInstance]);

  if (!enabled || !isPrimaryInstance) return null;

  const sliderValue = Math.round(volume * 100);
  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const updateVolume = (nextValue: number) => {
    const normalized = Math.max(0, Math.min(1, nextValue));
    setVolume(normalized);
    if (normalized > 0 && isMuted) {
      setIsMuted(false);
    }
    if (normalized === 0 && !isMuted) {
      setIsMuted(true);
    }
  };

  return (
    <>
      <audio ref={audioRef} aria-hidden className="hidden" playsInline />

      <div
        className="fixed right-3 bottom-3 z-2147483645 rounded-xl border border-white/20 bg-black/70 px-3 py-2 backdrop-blur-md"
        style={{ color: '#e5e7eb' }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-lg border border-white/20 px-2 py-1 text-xs font-semibold hover:bg-white/10"
            aria-label={isMuted ? 'Unmute casino music' : 'Mute casino music'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={sliderValue}
            onChange={(event) => updateVolume(Number(event.target.value) / 100)}
            className="h-1 w-24 accent-green-500"
            aria-label="Casino music volume"
          />
          <span className="w-8 text-right text-[11px] font-medium">{sliderValue}%</span>
        </div>
      </div>
    </>
  );
}

export default CasinoMusicAutoplay;