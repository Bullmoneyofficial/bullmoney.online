import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  IconX, IconGripVertical, IconVolume, IconVolumeOff, IconLock, 
  IconCamera, IconInfoCircle, IconChevronUp, IconPlayerPlay, 
  IconPlayerPause 
} from "@tabler/icons-react";
import { useUnifiedPerformance } from "@/hooks/useDesktopPerformance";
import { cn } from "@/lib/utils";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { ButtonTooltip } from "./ui/ButtonTooltip";
import { Z_INDEX } from "./constants/zIndex";
import { sourceLabel, sourceIcons } from "./constants";
import type { MusicSource } from "@/contexts/AudioSettingsProvider";

interface IPhoneFrameProps {
  musicSource: MusicSource;
  streamingEmbedUrl: string | null;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  iframeKey: number;
  playerSide: 'left' | 'right';
  handlePlayerInteraction: () => void;
  setStreamingActive: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
  onMinimize: () => void;
  onOpenCamera: () => void;
}

export const IPhoneFrame = React.memo(function IPhoneFrame({
  musicSource,
  streamingEmbedUrl,
  iframeRef,
  iframeKey,
  playerSide,
  handlePlayerInteraction,
  setStreamingActive,
  setMusicEnabled,
  onMinimize,
  onOpenCamera,
}: IPhoneFrameProps) {
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showFirstTimeHelp, setShowFirstTimeHelp] = useState(true);

  const playerHeight = musicSource === 'YOUTUBE' ? 480 : 400;
  const SourceIcon = sourceIcons[musicSource];

  const handleVolumeUp = useCallback(() => {
    SoundEffects.click();
    setVolume(v => Math.min(100, v + 10));
    setIsMuted(false);
    setShowVolumeSlider(true);
    setTimeout(() => setShowVolumeSlider(false), 2000);
  }, []);

  const handleVolumeDown = useCallback(() => {
    SoundEffects.click();
    setVolume(v => Math.max(0, v - 10));
    if (volume <= 10) setIsMuted(true);
    setShowVolumeSlider(true);
    setTimeout(() => setShowVolumeSlider(false), 2000);
  }, [volume]);

  const handlePower = useCallback(() => {
    SoundEffects.click();
    setIsLocked(!isLocked);
    setBrightness(isLocked ? 100 : 5);
  }, [isLocked]);

  const handleHome = useCallback(() => {
    SoundEffects.click();
    handlePlayerInteraction();
  }, [handlePlayerInteraction]);

  return (
    <div className="relative">
      {/* Main iPhone Body */}
      <div 
        className={cn(
          "relative rounded-[40px] overflow-hidden transition-all duration-500",
          "bg-gradient-to-b from-[#2d2d32] via-[#1c1c21] to-[#0c0c10]",
          shouldSkipHeavyEffects ? "shadow-lg" : "shadow-[0_0_80px_rgba(0,0,0,0.9),0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)]",
          "border-[4px] border-slate-600/40",
          isLocked && "opacity-60"
        )}
        style={{ width: '270px', height: `${playerHeight}px`, filter: `brightness(${brightness / 100})` }}
      >
        {/* Titanium Frame Edge Effects */}
        <div className="absolute inset-0 rounded-[36px] border border-slate-500/15 pointer-events-none" />
        <div className="absolute inset-[1px] rounded-[35px] border border-white/5 pointer-events-none" />
        
        {/* Reflective shimmer on frame */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/3 pointer-events-none rounded-[36px]"
          animate={shouldSkipHeavyEffects ? {} : { opacity: [0.5, 0.8, 0.5] }}
          transition={shouldSkipHeavyEffects ? {} : { duration: 3, repeat: Infinity }}
        />
        
        {/* Dynamic Island / Notch */}
        <div 
          className="absolute top-3 left-1/2 -translate-x-1/2"
          style={{ zIndex: Z_INDEX.PLAYER_CONTROLS }}
        >
          <motion.div 
            className="relative bg-black rounded-full flex items-center justify-center gap-2 px-4 py-2 overflow-hidden cursor-pointer shadow-lg"
            animate={{ width: isPlaying ? 130 : 90, height: 30 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            whileHover={{ scale: 1.02 }}
          >
            {/* Camera Lens in Dynamic Island */}
            <div 
              className="relative w-3 h-3 rounded-full bg-gradient-to-br from-slate-800 to-black ring-1 ring-slate-600/50 cursor-pointer group"
              onClick={(e) => { e.stopPropagation(); onOpenCamera(); }}
              onMouseEnter={() => setHoveredButton('camera')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-white/60 to-white/60" />
              <motion.div 
                className="absolute inset-0 rounded-full bg-white/30"
                animate={shouldSkipHeavyEffects ? {} : { opacity: [0.2, 0.5, 0.2] }}
                transition={shouldSkipHeavyEffects ? {} : { duration: 2, repeat: Infinity }}
              />
              <ButtonTooltip show={hoveredButton === 'camera'} text="📷 Open Camera" position="bottom" color="purple" />
            </div>
            
            {/* Now Playing Indicator */}
            <AnimatePresence>
              {isPlaying && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-1.5 overflow-hidden"
                >
                  {SourceIcon && <SourceIcon className="w-3 h-3 text-white/80" />}
                  <div className="flex gap-[2px]">
                    {[1, 2, 3, 4].map(i => (
                      <motion.div
                        key={i}
                        className="w-[2px] bg-white rounded-full"
                        animate={shouldSkipHeavyEffects ? { height: 6 } : { height: [3, 10, 3] }}
                        transition={shouldSkipHeavyEffects ? {} : { duration: 0.4, repeat: Infinity, delay: i * 0.08 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Volume Buttons (Left Side) */}
        <div 
          className="absolute -left-[5px] top-20 flex flex-col gap-2"
          style={{ zIndex: Z_INDEX.PLAYER_CONTROLS }}
        >
          {/* Mute/Silent Switch */}
          <div className="relative" onMouseEnter={() => setHoveredButton('mute')} onMouseLeave={() => setHoveredButton(null)}>
            <motion.button
              whileTap={{ x: -2 }}
              onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); SoundEffects.click(); }}
              className={cn(
                "w-[5px] h-7 rounded-l-sm transition-all shadow-lg",
                isMuted 
                  ? "bg-gradient-to-b from-orange-400 to-orange-600 shadow-orange-500/40" 
                  : "bg-gradient-to-b from-slate-500 to-slate-600"
              )}
            />
            <ButtonTooltip show={hoveredButton === 'mute'} text={isMuted ? "🔇 Tap to Unmute" : "🔊 Tap to Mute"} position="right" color="orange" />
          </div>
          
          {/* Volume Up */}
          <div className="relative" onMouseEnter={() => setHoveredButton('volUp')} onMouseLeave={() => setHoveredButton(null)}>
            <motion.button
              whileTap={{ x: -2, scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); handleVolumeUp(); }}
              className="w-[5px] h-10 rounded-l-sm bg-gradient-to-b from-slate-500 to-slate-600 hover:from-slate-400 hover:to-slate-500 transition-all shadow-lg"
            />
            <ButtonTooltip show={hoveredButton === 'volUp'} text="🔊 Volume Up (+10)" position="right" color="blue" />
          </div>
          
          {/* Volume Down */}
          <div className="relative" onMouseEnter={() => setHoveredButton('volDown')} onMouseLeave={() => setHoveredButton(null)}>
            <motion.button
              whileTap={{ x: -2, scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); handleVolumeDown(); }}
              className="w-[5px] h-10 rounded-l-sm bg-gradient-to-b from-slate-500 to-slate-600 hover:from-slate-400 hover:to-slate-500 transition-all shadow-lg"
            />
            <ButtonTooltip show={hoveredButton === 'volDown'} text="🔉 Volume Down (-10)" position="right" color="blue" />
          </div>
        </div>

        {/* Power/Side Button (Right Side) */}
        <div
          className="absolute -right-[5px] top-28"
          style={{ zIndex: Z_INDEX.PLAYER_CONTROLS }}
          onMouseEnter={() => setHoveredButton('power')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <motion.button
            whileTap={{ x: 2, scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); handlePower(); }}
            className={cn(
              "w-[5px] h-14 rounded-r-sm transition-all shadow-lg",
              isLocked 
                ? "bg-gradient-to-b from-red-400 to-red-600 shadow-red-500/40" 
                : "bg-gradient-to-b from-slate-500 to-slate-600 hover:from-slate-400 hover:to-slate-500"
            )}
          />
          <ButtonTooltip show={hoveredButton === 'power'} text={isLocked ? "🔓 Tap to Wake" : "🔒 Sleep/Wake"} position="left" color="red" />
        </div>

        {/* Volume Slider Overlay */}
        <AnimatePresence>
          {showVolumeSlider && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none"
              style={{ zIndex: Z_INDEX.VOLUME_SLIDER }}
            >
              <div className={`bg-black/90 rounded-2xl px-5 py-3 flex items-center gap-3 border border-white/10 ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-xl shadow-2xl'}`}>
                {isMuted ? <IconVolumeOff className="w-5 h-5 text-white" /> : <IconVolume className="w-5 h-5 text-white" />}
                <div className="w-28 h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${isMuted ? 0 : volume}%` }}
                  />
                </div>
                <span className="text-white text-xs font-semibold w-8">{isMuted ? 0 : volume}%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lock Screen Overlay */}
        <AnimatePresence>
          {isLocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 bg-black/95 flex flex-col items-center justify-center rounded-[36px] ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-lg'}`}
              style={{ zIndex: Z_INDEX.LOCK_SCREEN }}
              onClick={(e) => { e.stopPropagation(); handlePower(); }}
            >
              <motion.div animate={shouldSkipHeavyEffects ? {} : { y: [0, -8, 0] }} transition={shouldSkipHeavyEffects ? {} : { duration: 2, repeat: Infinity }}>
                <IconLock className="w-14 h-14 text-white/50 mb-4" />
              </motion.div>
              <p className="text-white/60 text-sm font-medium">Tap to Wake</p>
              <p className="text-white/30 text-xs mt-1">or press Power button</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Screen Content */}
        <div className="relative h-full pt-12 pb-6 px-2">
          {/* Status Bar */}
          <div 
            className="absolute top-0 left-0 right-0 h-11 flex items-end justify-between px-7 pb-1 text-white/80 text-[9px] font-semibold"
            style={{ zIndex: Z_INDEX.PLAYER_CONTROLS - 10 }}
          >
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="flex items-center gap-1.5">
              <div className="flex gap-[2px]">
                {[1,2,3,4].map(i => (
                  <div key={i} className={cn("w-[3px] rounded-[1px]", i <= 3 ? "h-[9px] bg-white" : "h-[6px] bg-white/40")} />
                ))}
              </div>
              <span className="ml-0.5">5G</span>
              <div className="ml-1.5 w-6 h-[10px] border border-white/50 rounded-[3px] relative">
                <div className="absolute inset-[1px] rounded-[2px] bg-white" style={{ width: '75%' }} />
                <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[5px] bg-white/50 rounded-r-sm" />
              </div>
            </div>
          </div>

          {/* Player Header */}
          <div className={`relative flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-slate-900/90 to-slate-800/90 rounded-t-2xl border-b border-white/5 mt-2 ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-sm'}`}>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-gradient-to-br from-white/30 to-white/30 shadow-inner">
                {SourceIcon && <SourceIcon className="w-5 h-5 text-sky-300" />}
              </div>
              <div>
                <span className="text-[10px] text-white/90 font-semibold block">{sourceLabel[musicSource]}</span>
                <span className="text-[8px] text-white/50">Now Playing</span>
              </div>
              <div className="flex gap-[2px] ml-1">
                <motion.div className="w-[2px] h-2 bg-white rounded-full" animate={shouldSkipHeavyEffects ? {} : { scaleY: [1, 2, 1] }} transition={shouldSkipHeavyEffects ? {} : { duration: 0.35, repeat: Infinity }} />
                <motion.div className="w-[2px] h-2.5 bg-white rounded-full" animate={shouldSkipHeavyEffects ? {} : { scaleY: [1, 0.4, 1] }} transition={shouldSkipHeavyEffects ? {} : { duration: 0.35, repeat: Infinity, delay: 0.1 }} />
                <motion.div className="w-[2px] h-2 bg-white rounded-full" animate={shouldSkipHeavyEffects ? {} : { scaleY: [1, 1.6, 1] }} transition={shouldSkipHeavyEffects ? {} : { duration: 0.35, repeat: Infinity, delay: 0.2 }} />
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.stopPropagation(); SoundEffects.click(); handlePlayerInteraction(); setStreamingActive(false); setMusicEnabled(false); }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors"
            >
              <IconX className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* Embedded Player */}
          <div 
            className="relative bg-black rounded-b-2xl overflow-hidden"
            style={{ height: musicSource === 'YOUTUBE' ? '180px' : '110px' }}
          >
            {!shouldSkipHeavyEffects && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-10"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              />
            )}
            
            <iframe
              ref={iframeRef}
              key={`streaming-persistent-${musicSource}-${iframeKey}`}
              title={`${sourceLabel[musicSource]} player`}
              src={streamingEmbedUrl || ''}
              width="100%"
              height="100%"
              loading="eager"
              style={{ border: 0, display: 'block' }}
              onLoad={handlePlayerInteraction}
              allow="autoplay; encrypted-media; fullscreen"
            />
          </div>

          {/* Media Controls */}
          <div className="mt-3 px-1">
            <div className="flex items-center justify-center gap-3">
              <motion.button whileTap={{ scale: 0.85 }} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <IconChevronUp className="w-4 h-4 text-white/70 rotate-[-90deg]" />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); SoundEffects.click(); }}
                className={`w-14 h-14 rounded-full bg-white flex items-center justify-center ${shouldSkipHeavyEffects ? '' : 'shadow-lg shadow-white/20'}`}
              >
                {isPlaying ? <IconPlayerPause className="w-6 h-6 text-black" /> : <IconPlayerPlay className="w-6 h-6 text-black ml-0.5" />}
              </motion.button>
              
              <motion.button whileTap={{ scale: 0.85 }} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <IconChevronUp className="w-4 h-4 text-white/70 rotate-90" />
              </motion.button>
            </div>

            {/* Volume Bar */}
            <div className="mt-2.5 flex items-center gap-2 px-1">
              <IconVolumeOff className="w-3 h-3 text-white/40" />
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-white/80 rounded-full"
                  animate={{ width: `${isMuted ? 0 : volume}%` }}
                />
              </div>
              <IconVolume className="w-3 h-3 text-white/40" />
            </div>
          </div>

          {/* Usage Tips Section */}
          <AnimatePresence>
            {showFirstTimeHelp && (
              <motion.div 
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mt-3 mx-1 p-2.5 rounded-xl bg-gradient-to-br from-white/15 to-white/15 border border-white/10 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <IconInfoCircle className="w-3.5 h-3.5 text-white" />
                    <span className="text-[9px] text-white/80 font-semibold">iPhone Controls</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowFirstTimeHelp(false); }}
                    className="text-white/40 hover:text-white/60"
                  >
                    <IconX className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1 text-[8px] text-white/60">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-orange-400" />
                    <span>Orange switch = Mute toggle</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-white" />
                    <span>Left buttons = Volume Up/Down</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-red-400" />
                    <span>Right button = Sleep/Wake</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-white" />
                    <span>Dynamic Island camera = Selfie!</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Home Indicator */}
        <div 
          className="absolute bottom-2 left-1/2 -translate-x-1/2 cursor-pointer"
          style={{ zIndex: Z_INDEX.PLAYER_CONTROLS }}
          onClick={(e) => { e.stopPropagation(); handleHome(); }}
          onMouseEnter={() => setHoveredButton('home')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <motion.div 
            className="w-28 h-1 bg-white/50 rounded-full"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.7)' }}
            whileTap={{ scale: 0.95 }}
          />
          <ButtonTooltip show={hoveredButton === 'home'} text="🏠 Tap to Interact" position="top" color="green" />
        </div>

        {/* Hide/Minimize Tab */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); SoundEffects.click(); onMinimize(); }}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-4 h-14 flex flex-col items-center justify-center bg-slate-700/90 border-slate-500/40 hover:bg-slate-600/90 transition-colors shadow-lg",
            playerSide === 'left' 
              ? "-right-4 rounded-r-lg border-r border-y" 
              : "-left-4 rounded-l-lg border-l border-y"
          )}
          style={{ zIndex: Z_INDEX.PLAYER_CONTROLS }}
          title="Minimize player (audio continues)"
          whileHover={{ x: playerSide === 'left' ? 2 : -2 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={() => setHoveredButton('minimize')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <IconGripVertical className="w-2.5 h-2.5 text-white/50" />
          <ButtonTooltip 
            show={hoveredButton === 'minimize'} 
            text="📱 Minimize (audio plays)" 
            position={playerSide === 'left' ? 'right' : 'left'} 
            color="purple" 
          />
        </motion.button>
      </div>
    </div>
  );
});
