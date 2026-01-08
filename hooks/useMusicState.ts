import { useState, useRef, useCallback } from 'react';
import { userStorage } from '@/lib/smartStorage';

/**
 * Manages background music playback state
 */
export function useMusicState() {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(25);
  const playerRef = useRef<any>(null);

  const safePlay = useCallback(() => {
    if (isMuted || !playerRef.current) return;
    try {
      if (typeof playerRef.current.unMute === 'function') playerRef.current.unMute();
      if (typeof playerRef.current.setVolume === 'function') playerRef.current.setVolume(volume);
      if (typeof playerRef.current.playVideo === 'function') playerRef.current.playVideo();
    } catch (e) { }
  }, [isMuted, volume]);

  const safePause = useCallback(() => {
    try {
      playerRef.current?.pauseVideo?.();
    } catch (e) { }
  }, []);

  const handlePlayerReady = useCallback((player: any) => {
    playerRef.current = player;
    if (isMuted) player.mute?.();
    else { player.unMute?.(); player.setVolume?.(volume); }
    if (!isMuted) player.playVideo?.();
  }, [isMuted, volume]);

  const toggleMusic = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    userStorage.set('user_is_muted', String(newMutedState));
    if (newMutedState) safePause(); else safePlay();
  }, [isMuted, safePlay, safePause]);

  const handleVolumeChange = useCallback((newVol: number) => {
    setVolume(newVol);
    userStorage.set('user_volume', newVol.toString());
    if (playerRef.current) playerRef.current.setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      safePlay();
    }
  }, [isMuted, safePlay]);

  return {
    isMuted,
    setIsMuted,
    volume,
    setVolume,
    playerRef,
    safePlay,
    safePause,
    handlePlayerReady,
    toggleMusic,
    handleVolumeChange,
  };
}
