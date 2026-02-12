"use client";

import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { useAudioSettings } from "@/contexts/AudioSettingsProvider";
import { useComponentLifecycle } from "@/lib/UnifiedPerformanceSystem";
import { MusicEmbedModal } from "@/components/MusicEmbedModal";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { useAudioWidgetUI } from "@/contexts/UIStateContext";
import {
  useAudioWidgetState, useAudioWidgetEffects, useAudioWidgetHandlers, useWanderingGame,
  MainWidget, FloatingPlayer, TipsOverlay, TouchIndicator, GameOverScreen, QuickGameTutorial, QuickGameTutorialDemo,
} from "@/components/audio-widget";

type PlaylistTrack = {
  id: string;
  src: string;
  startAt: number;
  duration: number;
};

const CASINO_TRACKS: PlaylistTrack[] = [
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

const CASINO_DEFAULT_VOLUME = 0.12;
const CASINO_VOLUME_STORAGE_KEY = 'casino_music_volume_v1';
const CASINO_MUTE_STORAGE_KEY = 'casino_music_muted_v1';

const shuffleTracks = (tracks: PlaylistTrack[]) => {
  const next = [...tracks];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

const AudioWidget = function AudioWidget() {
  const perf = useComponentLifecycle('audioWidget', 7);
  const audioSettings = useAudioSettings();
  // Use the new UIState context for mutual exclusion with other components
  // shouldMinimizeAudioWidget tells FloatingPlayer to minimize (hide iframe behind pull tab)
  // but NOT unmount - this preserves audio playback
  // shouldHideAudioWidgetCompletely hides the entire widget (only during loader or when not unlocked)
  // shouldHideMainWidget hides just the MainWidget but keeps FloatingPlayer for audio persistence
  const { shouldMinimizeAudioWidget, setAudioWidgetOpen, shouldHideAudioWidgetCompletely, shouldHideMainWidget, isWelcomeScreenActive } = useAudioWidgetUI();
  const state = useAudioWidgetState();
  const game = useWanderingGame({ isMobile: state.isMobile });
  useAudioWidgetEffects(state, audioSettings, game);
  const h = useAudioWidgetHandlers({ state, audioSettings, gameHook: game });

  const casinoAudioRef = useRef<HTMLAudioElement | null>(null);
  const casinoPlaylist = useMemo(() => shuffleTracks(CASINO_TRACKS), []);
  const [casinoTrackIndex, setCasinoTrackIndex] = useState(0);
  const [casinoAutoplayBlocked, setCasinoAutoplayBlocked] = useState(false);
  const [casinoMusicVolume, setCasinoMusicVolumeState] = useState(CASINO_DEFAULT_VOLUME);
  const [casinoMusicMuted, setCasinoMusicMuted] = useState(false);

  const setCasinoMusicVolume = useCallback((next: number) => {
    const normalized = Math.max(0, Math.min(1, next));
    setCasinoMusicVolumeState(normalized);
    if (normalized > 0 && casinoMusicMuted) setCasinoMusicMuted(false);
    if (normalized === 0 && !casinoMusicMuted) setCasinoMusicMuted(true);
  }, [casinoMusicMuted]);

  const toggleCasinoMusicMuted = useCallback(() => {
    setCasinoMusicMuted((prev) => !prev);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedVolume = Number(window.localStorage.getItem(CASINO_VOLUME_STORAGE_KEY));
    if (Number.isFinite(savedVolume)) {
      setCasinoMusicVolumeState(Math.max(0, Math.min(1, savedVolume)));
    }
    setCasinoMusicMuted(window.localStorage.getItem(CASINO_MUTE_STORAGE_KEY) === 'true');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CASINO_VOLUME_STORAGE_KEY, String(casinoMusicVolume));
  }, [casinoMusicVolume]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CASINO_MUTE_STORAGE_KEY, String(casinoMusicMuted));
  }, [casinoMusicMuted]);

  useEffect(() => {
    const unlockAudio = () => {
      const audio = casinoAudioRef.current;
      if (!audio) return;
      audio.muted = audioSettings.masterMuted || casinoMusicMuted;
      audio.volume = Math.max(0, Math.min(1, casinoMusicVolume));
      void audio.play().then(() => setCasinoAutoplayBlocked(false)).catch(() => {
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
  }, [audioSettings.masterMuted, casinoMusicMuted, casinoMusicVolume]);

  useEffect(() => {
    const audio = casinoAudioRef.current;
    if (!audio) return;

    const currentTrack = casinoPlaylist[casinoTrackIndex];
    if (!currentTrack) return;

    let disposed = false;
    let loadTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const moveToNextTrack = () => {
      if (disposed) return;
      setCasinoTrackIndex((prev) => (prev + 1) % casinoPlaylist.length);
    };

    const clearLoadTimeout = () => {
      if (loadTimeoutId) {
        clearTimeout(loadTimeoutId);
        loadTimeoutId = null;
      }
    };

    const attemptPlay = async () => {
      try {
        audio.muted = audioSettings.masterMuted || casinoMusicMuted;
        audio.volume = Math.max(0, Math.min(1, casinoMusicVolume));
        await audio.play();
        setCasinoAutoplayBlocked(false);
      } catch {
        setCasinoAutoplayBlocked(true);
      }
    };

    const handleLoadedMetadata = () => {
      const expectedStart = currentTrack.startAt;
      if (audio.currentTime < expectedStart - 0.25 || audio.currentTime > expectedStart + 0.25) {
        audio.currentTime = expectedStart;
      }
      void attemptPlay();
    };

    const handleCanPlay = () => {
      clearLoadTimeout();
      void attemptPlay();
    };

    const handleTimeUpdate = () => {
      if (audio.currentTime >= currentTrack.startAt + currentTrack.duration) {
        moveToNextTrack();
      }
    };

    const handleError = () => {
      moveToNextTrack();
    };

    audio.volume = Math.max(0, Math.min(1, casinoMusicVolume));
    audio.muted = audioSettings.masterMuted || casinoMusicMuted;
    audio.preload = 'auto';
    audio.src = currentTrack.src;
    audio.loop = false;

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', moveToNextTrack);
    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleError);
    audio.addEventListener('abort', handleError);

    loadTimeoutId = setTimeout(() => {
      moveToNextTrack();
    }, 12000);

    if (audio.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      audio.load();
    }

    return () => {
      disposed = true;
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
  }, [casinoPlaylist, casinoTrackIndex, casinoMusicVolume, casinoMusicMuted, audioSettings.masterMuted]);

  useEffect(() => {
    if (!casinoAutoplayBlocked) return;

    const retryOnVisibility = () => {
      if (document.hidden) return;
      const audio = casinoAudioRef.current;
      if (!audio) return;
      audio.muted = audioSettings.masterMuted || casinoMusicMuted;
      audio.volume = Math.max(0, Math.min(1, casinoMusicVolume));
      void audio.play().then(() => setCasinoAutoplayBlocked(false)).catch(() => {
      });
    };

    document.addEventListener('visibilitychange', retryOnVisibility);
    window.addEventListener('focus', retryOnVisibility);

    return () => {
      document.removeEventListener('visibilitychange', retryOnVisibility);
      window.removeEventListener('focus', retryOnVisibility);
    };
  }, [casinoAutoplayBlocked, casinoMusicMuted, casinoMusicVolume, audioSettings.masterMuted]);

  // Wrapped setOpen that notifies context for mutual exclusion
  const handleSetOpen = useCallback((open: boolean) => {
    state.setOpen(open);
    // Notify context when audio widget opens (closes other components)
    if (open) {
      setAudioWidgetOpen(true);
    }
  }, [state.setOpen, setAudioWidgetOpen]);

  // Auto-close audio widget MENU (MainWidget) when other UI components open (mobile menu, modals, etc.)
  // The FloatingPlayer stays mounted but minimizes to preserve audio playback
  useEffect(() => {
    if (shouldMinimizeAudioWidget && state.open) {
      state.setOpen(false);
    }
  }, [shouldMinimizeAudioWidget, state.open, state.setOpen]);

  useEffect(() => { h.broadcastVolumeToIframe(state.iframeRef); }, [audioSettings.iframeVolume, audioSettings.musicSource, state.iframeKey, h, state.iframeRef]);

  const startGame = () => { h.dismissCatchGameTutorial(); h.handleStartCatchGame(); };

  // Create tutorial content element to pass to FloatingPlayer
  const tutorialContent = (
    <QuickGameTutorial 
      show={true}  // Visibility controlled by parent
      onDone={h.dismissCatchGameTutorial}
      durationMs={game.gameStats.gamesPlayed === 0 && !state.hasStartedCatchGame ? 0 : 7500} 
      onStart={startGame} 
      onWatchDemo={h.handleWatchCatchGameDemo} 
      onHoverChange={state.setIsTutorialHovered}
      embedded={true}  // New prop to indicate embedded rendering
    />
  );

  // Determine if MainWidget should be shown
  // Show MainWidget on welcome screen and main content, hide during registration
  const showMainWidget = !shouldHideAudioWidgetCompletely && !shouldHideMainWidget;

  return (
    <>
      <audio ref={casinoAudioRef} aria-hidden className="hidden" playsInline />

      <AnimatePresence>
        {state.isMobile && game.isWandering && !state.open && <TouchIndicator position={game.touchPosition} isActive={game.isTouching} />}
      </AnimatePresence>

      {/* Fallback standalone tutorial for when not embedded (e.g., different positioning needed) */}
      {/* <QuickGameTutorial show={state.showCatchGameTutorial && !state.open && !state.playerHidden} onDone={h.dismissCatchGameTutorial}
        durationMs={game.gameStats.gamesPlayed === 0 && !state.hasStartedCatchGame ? 0 : 7500} onStart={startGame} onWatchDemo={h.handleWatchCatchGameDemo} onHoverChange={state.setIsTutorialHovered} /> */}
      <QuickGameTutorialDemo show={state.showCatchGameDemo} onDone={h.dismissCatchGameDemo} onStart={() => { h.dismissCatchGameDemo(); h.handleStartCatchGame(); }} />

      <AnimatePresence>
        {state.showGameOver && (
          <GameOverScreen score={game.gameStats.currentScore} highScore={game.gameStats.highScore}
            isNewHighScore={game.gameStats.currentScore >= game.gameStats.highScore && game.gameStats.currentScore > 0}
            wasCaught={game.gameState === "caught"} onPlayAgain={() => { state.setShowGameOver(false); h.handleStartCatchGame(); }} onClose={() => state.setShowGameOver(false)} />
        )}
      </AnimatePresence>

      <TipsOverlay show={state.showTipsOverlay} open={state.open} streamingActive={state.streamingActive} onClose={() => state.setShowTipsOverlay(false)} />

      {/* MainWidget (settings panel) - shown on welcome screen and main content, hidden during registration */}
      {showMainWidget && (
        typeof document !== "undefined" && createPortal(
          <MainWidget
            {...state}
            {...audioSettings}
            {...h}
            setOpen={handleSetOpen}
            shimmerEnabled={perf.shimmerEnabled}
            shimmerSettings={perf.shimmerSettings}
            isWandering={game.isWandering}
            gameStats={game.gameStats}
            gameState={game.gameState}
            setPlayerMinimized={state.setPlayerMinimized}
            casinoMusicMuted={casinoMusicMuted}
            toggleCasinoMusicMuted={toggleCasinoMusicMuted}
            casinoMusicVolume={casinoMusicVolume}
            setCasinoMusicVolume={setCasinoMusicVolume}
            casinoMusicAutoplayBlocked={casinoAutoplayBlocked}
          />,
          document.body
        )
      )}

      {/*
        AUDIO PERSISTENCE STRATEGY:
        FloatingPlayer with iframe is rendered whenever audio needs to persist.
        - Welcome screen: Full widget shown (FloatingPlayer normal)
        - Registration/Login: FloatingPlayer shown (minimized) for audio persistence
        - Loader: Hidden completely (brief, acceptable)
        - Main content: Full widget shown (FloatingPlayer normal)
        
        forceMinimize is true during registration (shouldHideMainWidget) or when other UI is open
      */}
      {!shouldHideAudioWidgetCompletely && (
        typeof document !== "undefined" && createPortal(
          <FloatingPlayer miniPlayerRef={game.miniPlayerRef} {...state} {...audioSettings}
            isWandering={game.isWandering} wanderPosition={game.wanderPosition} morphPhase={game.morphPhase}
            isHovering={game.isHovering} setIsHovering={game.setIsHovering} isNearPlayer={game.isNearPlayer}
            isFleeing={game.isFleeing} isReturning={game.isReturning} movementStyle={game.movementStyle}
            speedMultiplier={game.speedMultiplier} fleeDirection={game.fleeDirection} handlePlayerInteraction={game.handlePlayerInteraction}
            energy={game.energy} combo={game.combo} getTirednessLevel={game.getTirednessLevel} gameStats={game.gameStats}
            gameState={game.gameState} hasStartedCatchGame={state.hasStartedCatchGame}
            maybeShowCatchGameTutorial={h.maybeShowCatchGameTutorial} dismissCatchGameTutorial={h.dismissCatchGameTutorial}
            showCatchGameTutorial={state.showCatchGameTutorial && !state.open && !state.playerHidden}
            tutorialContent={tutorialContent}
            forceMinimize={shouldMinimizeAudioWidget || shouldHideMainWidget} />, document.body)
      )}

      {typeof document !== "undefined" && createPortal(
        <MusicEmbedModal open={state.musicEmbedOpen} onClose={() => { SoundEffects.click(); state.setMusicEmbedOpen(false); }} />, document.body)}
    </>
  );
};

export default AudioWidget;
