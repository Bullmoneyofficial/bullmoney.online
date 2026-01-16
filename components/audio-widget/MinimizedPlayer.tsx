import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { ButtonTooltip } from "./ui/ButtonTooltip";
import { Z_INDEX } from "./constants/zIndex";
import { sourceLabel, sourceIcons } from "./constants";
import type { MusicSource } from "@/contexts/AudioSettingsProvider";

interface MinimizedPlayerProps {
  isMinimized: boolean;
  playerSide: 'left' | 'right';
  open: boolean;
  isPlaying: boolean;
  musicSource: MusicSource;
  streamingEmbedUrl: string | null;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  iframeKey: number;
  hoveredButton: string | null;
  setHoveredButton: (button: string | null) => void;
  onExpand: () => void;
}

export const MinimizedPlayer = React.memo(function MinimizedPlayer({
  isMinimized,
  playerSide,
  open,
  isPlaying,
  musicSource,
  streamingEmbedUrl,
  iframeRef,
  iframeKey,
  hoveredButton,
  setHoveredButton,
  onExpand,
}: MinimizedPlayerProps) {
  const SourceIcon = sourceIcons[musicSource];

  return (
    <>
      {/* Minimized iPod Pull Tab - Audio persists like Apple Music! */}
      <AnimatePresence>
        {isMinimized && !open && (
          <motion.button
            initial={{ opacity: 0, x: playerSide === 'left' ? -100 : 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: playerSide === 'left' ? -100 : 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            onClick={onExpand}
            onMouseEnter={() => setHoveredButton('expand')}
            onMouseLeave={() => setHoveredButton(null)}
            className={cn(
              "fixed flex items-center gap-3 py-3.5 backdrop-blur-2xl transition-all duration-300",
              "bg-gradient-to-br from-slate-900/98 via-gray-900/98 to-black/98",
              "border-2 border-slate-500/60 shadow-2xl",
              "hover:shadow-green-500/40 hover:border-green-400/60 hover:scale-105",
              "active:scale-95",
              isPlaying && "animate-pulse-subtle",
              playerSide === 'left' 
                ? "left-0 pl-3 pr-5 rounded-r-3xl border-l-0" 
                : "right-0 pr-3 pl-5 rounded-l-3xl border-r-0"
            )}
            style={{ 
              bottom: 140, 
              zIndex: Z_INDEX.PULL_TAB,
              boxShadow: isPlaying 
                ? '0 0 30px rgba(34, 197, 94, 0.3), 0 10px 40px rgba(0,0,0,0.5)' 
                : '0 10px 40px rgba(0,0,0,0.5)',
            }}
          >
            {playerSide === 'right' && (
              <motion.div
                animate={{ x: [-3, 0, -3] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <IconChevronLeft className="w-5 h-5 text-white/70" />
              </motion.div>
            )}
            
            <div className="relative">
              <motion.div
                className="absolute -inset-2 bg-green-500/25 rounded-2xl blur-lg"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className={cn(
                "relative w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden",
                "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800",
                "border border-slate-500/50 shadow-inner"
              )}>
                <SourceIcon className="w-6 h-6 text-white/95" />
                
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-[3px]">
                  {[1, 2, 3, 4].map(i => (
                    <motion.div
                      key={i}
                      className="w-[3px] bg-green-400 rounded-full origin-bottom"
                      animate={{ scaleY: isPlaying ? [0.3, 1, 0.3] : 0.3 }}
                      transition={{ 
                        duration: 0.5, 
                        repeat: Infinity, 
                        delay: i * 0.08,
                        ease: "easeInOut"
                      }}
                      style={{ height: 10 }}
                    />
                  ))}
                </div>
                
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/90">{sourceLabel[musicSource]}</span>
              <span className="text-[8px] text-green-400/80 font-medium">♪ Playing</span>
            </div>
            
            {playerSide === 'left' && (
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <IconChevronRight className="w-5 h-5 text-white/70" />
              </motion.div>
            )}
            
            <ButtonTooltip 
              show={hoveredButton === 'expand'} 
              text="🎵 Tap to Expand" 
              position={playerSide === 'left' ? 'right' : 'left'} 
              color="green" 
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Hidden iframe container - keeps audio playing when minimized */}
      {isMinimized && streamingEmbedUrl && (
        <div 
          className="fixed pointer-events-none" 
          style={{ 
            position: 'fixed',
            top: -9999,
            left: -9999,
            width: 320,
            height: 152,
            overflow: 'hidden',
            opacity: 0.01,
            zIndex: -1,
          }}
          aria-hidden="true"
        >
          <iframe
            ref={iframeRef}
            key={`streaming-bg-${musicSource}-${iframeKey}`}
            title={`${sourceLabel[musicSource]} background player`}
            src={streamingEmbedUrl}
            width="320"
            height="152"
            loading="eager"
            style={{ border: 'none', display: 'block' }}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      )}
    </>
  );
});
