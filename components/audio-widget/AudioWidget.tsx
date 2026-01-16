"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { useAudioSettings } from "@/contexts/AudioSettingsProvider";
import { useComponentLifecycle } from "@/lib/UnifiedPerformanceSystem";
import { MusicEmbedModal } from "@/components/MusicEmbedModal";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import {
  useAudioWidgetState, useAudioWidgetEffects, useAudioWidgetHandlers, useWanderingGame,
  MainWidget, FloatingPlayer, TipsOverlay, TouchIndicator, GameOverScreen, QuickGameTutorial, QuickGameTutorialDemo,
} from "@/components/audio-widget";

const AudioWidget = React.memo(function AudioWidget() {
  const perf = useComponentLifecycle('audioWidget', 7);
  const audioSettings = useAudioSettings();
  const state = useAudioWidgetState();
  const game = useWanderingGame({ isMobile: state.isMobile });
  useAudioWidgetEffects(state, audioSettings, game);
  const h = useAudioWidgetHandlers({ state, audioSettings, gameHook: game });

  useEffect(() => { h.broadcastVolumeToIframe(state.iframeRef); }, [audioSettings.musicVolume, audioSettings.musicSource, state.iframeKey, h, state.iframeRef]);

  const startGame = () => { h.dismissCatchGameTutorial(); h.handleStartCatchGame(); };

  return (
    <>
      <AnimatePresence>
        {state.isMobile && game.isWandering && !state.open && <TouchIndicator position={game.touchPosition} isActive={game.isTouching} />}
      </AnimatePresence>

      <QuickGameTutorial show={state.showCatchGameTutorial && !state.open && !state.playerHidden} onDone={h.dismissCatchGameTutorial}
        durationMs={game.gameStats.gamesPlayed === 0 && !state.hasStartedCatchGame ? 0 : 7500} onStart={startGame} onWatchDemo={h.handleWatchCatchGameDemo} onHoverChange={state.setIsTutorialHovered} />
      <QuickGameTutorialDemo show={state.showCatchGameDemo} onDone={h.dismissCatchGameDemo} onStart={() => { h.dismissCatchGameDemo(); h.handleStartCatchGame(); }} />

      <AnimatePresence>
        {state.showGameOver && (
          <GameOverScreen score={game.gameStats.currentScore} highScore={game.gameStats.highScore}
            isNewHighScore={game.gameStats.currentScore >= game.gameStats.highScore && game.gameStats.currentScore > 0}
            wasCaught={game.gameState === "caught"} onPlayAgain={() => { state.setShowGameOver(false); h.handleStartCatchGame(); }} onClose={() => state.setShowGameOver(false)} />
        )}
      </AnimatePresence>

      <TipsOverlay show={state.showTipsOverlay} open={state.open} streamingActive={state.streamingActive} onClose={() => state.setShowTipsOverlay(false)} />

      <MainWidget {...state} {...audioSettings} {...h} shimmerEnabled={perf.shimmerEnabled} shimmerSettings={perf.shimmerSettings}
        isWandering={game.isWandering} gameStats={game.gameStats} gameState={game.gameState} />

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          <FloatingPlayer miniPlayerRef={game.miniPlayerRef} {...state} {...audioSettings}
            isWandering={game.isWandering} wanderPosition={game.wanderPosition} morphPhase={game.morphPhase}
            isHovering={game.isHovering} setIsHovering={game.setIsHovering} isNearPlayer={game.isNearPlayer}
            isFleeing={game.isFleeing} isReturning={game.isReturning} movementStyle={game.movementStyle}
            speedMultiplier={game.speedMultiplier} fleeDirection={game.fleeDirection} handlePlayerInteraction={game.handlePlayerInteraction}
            energy={game.energy} combo={game.combo} getTirednessLevel={game.getTirednessLevel} gameStats={game.gameStats}
            gameState={game.gameState} hasStartedCatchGame={state.hasStartedCatchGame}
            maybeShowCatchGameTutorial={h.maybeShowCatchGameTutorial} dismissCatchGameTutorial={h.dismissCatchGameTutorial} />
        </AnimatePresence>, document.body)}

      {typeof document !== "undefined" && createPortal(
        <MusicEmbedModal open={state.musicEmbedOpen} onClose={() => { SoundEffects.click(); state.setMusicEmbedOpen(false); }} />, document.body)}
    </>
  );
});

export default AudioWidget;
