"use client";

import React, { useEffect, useCallback } from "react";
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
        <MainWidget {...state} {...audioSettings} {...h} setOpen={handleSetOpen} shimmerEnabled={perf.shimmerEnabled} shimmerSettings={perf.shimmerSettings}
          isWandering={game.isWandering} gameStats={game.gameStats} gameState={game.gameState} setPlayerMinimized={state.setPlayerMinimized} />
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
