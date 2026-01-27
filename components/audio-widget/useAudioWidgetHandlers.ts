"use client";

import { useCallback } from "react";
import type { MusicSource } from "@/contexts/AudioSettingsProvider";
import type { UseAudioWidgetStateReturn } from "./useAudioWidgetState";

export interface UseAudioWidgetHandlersOptions {
  state: UseAudioWidgetStateReturn;
  audioSettings: {
    musicSource: MusicSource;
    setMusicSource: (source: MusicSource) => void;
    setMusicEnabled: (enabled: boolean) => void;
    musicVolume: number;
    iframeVolume: number;
  };
  gameHook: {
    isWandering: boolean;
    setHasInteracted: (v: boolean) => void;
    startGame: () => void;
    gameStats: { gamesPlayed: number; currentScore: number; highScore: number };
    handlePlayerInteraction: () => void;
  };
}

export function useAudioWidgetHandlers({ state, audioSettings, gameHook }: UseAudioWidgetHandlersOptions) {
  const {
    setHasStartedCatchGame, setShowCatchGameTutorial, catchGameTutorialTimerRef,
    setShowCatchGameDemo, tutorialStep, setTutorialStep, setHasCompletedTutorial,
    setIframeKey, setStreamingActive, setPlayerHidden, setShowFirstTimeHelp,
    isTutorialHovered, setPlayerMinimized,
  } = state;
  
  const { musicSource, setMusicSource, setMusicEnabled, musicVolume, iframeVolume } = audioSettings;
  const { setHasInteracted, startGame, gameStats, isWandering, handlePlayerInteraction } = gameHook;

  const handleStartCatchGame = useCallback(() => {
    setHasStartedCatchGame(true);
    setHasInteracted(false);
    startGame();
  }, [startGame, setHasInteracted, setHasStartedCatchGame]);

  const dismissCatchGameTutorial = useCallback(() => {
    setShowCatchGameTutorial(false);
    if (catchGameTutorialTimerRef.current != null) {
      window.clearTimeout(catchGameTutorialTimerRef.current);
      catchGameTutorialTimerRef.current = null;
    }
  }, [setShowCatchGameTutorial, catchGameTutorialTimerRef]);

  const dismissCatchGameDemo = useCallback(() => {
    setShowCatchGameDemo(false);
  }, [setShowCatchGameDemo]);

  const handleWatchCatchGameDemo = useCallback(() => {
    dismissCatchGameTutorial();
    setShowCatchGameDemo(true);
  }, [dismissCatchGameTutorial, setShowCatchGameDemo]);

  const maybeShowCatchGameTutorial = useCallback((hasStartedCatchGame: boolean) => {
    if (typeof window === "undefined") return;

    if (gameStats.gamesPlayed === 0 && !hasStartedCatchGame) {
      setShowCatchGameTutorial(true);
      return;
    }

    if (localStorage.getItem("audioWidgetCatchGameTutorialSeen") === "true") return;
    localStorage.setItem("audioWidgetCatchGameTutorialSeen", "true");
    setShowCatchGameTutorial(true);
    if (catchGameTutorialTimerRef.current != null) {
      window.clearTimeout(catchGameTutorialTimerRef.current);
    }
    catchGameTutorialTimerRef.current = window.setTimeout(() => {
      setShowCatchGameTutorial(false);
      catchGameTutorialTimerRef.current = null;
    }, 7500);
  }, [gameStats.gamesPlayed, setShowCatchGameTutorial, catchGameTutorialTimerRef]);

  const handleTutorialNext = useCallback(() => {
    if (tutorialStep >= 4) {
      setTutorialStep(0);
      setHasCompletedTutorial(true);
      localStorage.setItem('audioWidgetTutorialComplete', 'true');
    } else {
      setTutorialStep(prev => prev + 1);
    }
  }, [tutorialStep, setTutorialStep, setHasCompletedTutorial]);

  const handleTutorialSkip = useCallback(() => {
    setTutorialStep(0);
    setHasCompletedTutorial(true);
    localStorage.setItem('audioWidgetTutorialComplete', 'true');
  }, [setTutorialStep, setHasCompletedTutorial]);

  const handleStreamingSelect = useCallback((newSource: MusicSource) => {
    if (newSource !== musicSource) {
      setIframeKey((k) => k + 1);
      setMusicSource(newSource);
    }
    // First: Expand the iPhone shell
    setPlayerMinimized(false);
    setMusicEnabled(true);
    setPlayerHidden(false);
    setShowFirstTimeHelp(false);
    localStorage.setItem('audioWidgetSavedSource', newSource);
    
    // Then: Activate streaming after a small delay so the shell opens first
    setTimeout(() => {
      setStreamingActive(true);
    }, 300);
  }, [musicSource, setMusicSource, setMusicEnabled, setIframeKey, setStreamingActive, setPlayerHidden, setShowFirstTimeHelp, setPlayerMinimized]);

  const handleStopGame = useCallback(() => {
    if (isWandering) {
      handlePlayerInteraction();
    }
  }, [isWandering, handlePlayerInteraction]);

  // Broadcast volume commands to iframe (uses separate iframeVolume)
  const broadcastVolumeToIframe = useCallback((iframeRef: React.RefObject<HTMLIFrameElement | null>) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    
    const win = iframeRef.current.contentWindow;
    const vol0to100 = Math.floor(iframeVolume * 100);
    const vol0to1 = iframeVolume;

    if (musicSource === 'YOUTUBE') {
      win.postMessage(JSON.stringify({
        event: 'command',
        func: 'setVolume',
        args: [vol0to100]
      }), '*');
    }

    const messages = [
      { method: 'setVolume', value: vol0to1 },
      { method: 'setVolume', value: vol0to100 },
      { command: 'set_volume', args: [vol0to100] },
      { command: 'setVolume', value: vol0to100 },
      { event: 'setVolume', volume: vol0to1 },
      { type: 'setVolume', volume: vol0to1 },
    ];

    messages.forEach(msg => {
      win.postMessage(msg, '*');
      win.postMessage(JSON.stringify(msg), '*');
    });
  }, [iframeVolume, musicSource]);

  return {
    handleStartCatchGame,
    dismissCatchGameTutorial,
    dismissCatchGameDemo,
    handleWatchCatchGameDemo,
    maybeShowCatchGameTutorial,
    handleTutorialNext,
    handleTutorialSkip,
    handleStreamingSelect,
    handleStopGame,
    broadcastVolumeToIframe,
  };
}
