import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconChevronLeft, IconChevronRight, IconMusic } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { ButtonTooltip } from "./ui/ButtonTooltip";
import { Z_INDEX } from "./constants/zIndex";
import { sourceLabel, sourceIcons } from "./constants";
import type { MusicSource } from "@/contexts/AudioSettingsProvider";
import { useUnifiedPerformance } from "@/hooks/useDesktopPerformance";

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
  renderHiddenIframe?: boolean;
}

export function MinimizedPlayer({
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
  renderHiddenIframe = true,
}: MinimizedPlayerProps) {
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();
  const SourceIcon = sourceIcons[musicSource];
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Immediately set to scrolling
      setIsScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set timeout to detect when scrolling has stopped
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1500);
    };

    // Listen on window scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also listen on wheel for immediate feedback
    window.addEventListener('wheel', handleScroll, { passive: true });
    
    // Touch scroll support
    window.addEventListener('touchmove', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Minimized iPod Pull Tab - Audio persists like Apple Music! */}
      <AnimatePresence>
        {isMinimized && !open && (
          <motion.button
            layout
            initial={{ opacity: 0, x: playerSide === 'left' ? -100 : 100, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              scale: 1,
              width: isScrolling ? 44 : 'auto',
              height: isScrolling ? 44 : 'auto',
              padding: isScrolling ? 6 : undefined,
              borderRadius: isScrolling ? 22 : (playerSide === 'left' ? '0 1.5rem 1.5rem 0' : '1.5rem 0 0 1.5rem'),
            }}
            exit={{ opacity: 0, x: playerSide === 'left' ? -100 : 100, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 350,
              layout: { type: "spring", damping: 30, stiffness: 400 }
            }}
            onClick={onExpand}
            onMouseEnter={() => setHoveredButton('expand')}
            onMouseLeave={() => setHoveredButton(null)}
            className={cn(
              "fixed flex items-center overflow-hidden",
              shouldSkipHeavyEffects ? "" : "backdrop-blur-2xl",
              "bg-gradient-to-br from-slate-900/98 via-gray-900/98 to-black/98",
              "border-2 border-slate-500/60 shadow-2xl",
              "hover:shadow-white/40 hover:border-white/60 hover:scale-105",
              "active:scale-95",
              isPlaying && "animate-pulse-subtle",
              // Expanded state styles
              !isScrolling && "gap-3 py-3.5",
              !isScrolling && (playerSide === 'left' 
                ? "left-0 pl-3 pr-5 border-l-0" 
                : "pr-3 pl-5 border-r-0"),
              // Minimized pill state styles - much smaller
              isScrolling && "gap-0 justify-center",
              isScrolling && (playerSide === 'left' 
                ? "left-0 border-l-0" 
                : "border-r-0"),
            )}
            style={{ 
              bottom: 70, 
              zIndex: Z_INDEX.PULL_TAB,
              right: playerSide === 'right' ? 'clamp(0px, calc((100vw - 1600px) / 2), 100px)' : undefined,
              boxShadow: shouldSkipHeavyEffects 
                ? 'none' 
                : (isPlaying 
                  ? '0 0 30px rgba(255, 255, 255, 0.3), 0 10px 40px rgba(0,0,0,0.5)' 
                  : '0 10px 40px rgba(0,0,0,0.5)'),
            }}
          >
            {playerSide === 'right' && (
              <motion.div
                animate={{ 
                  x: isScrolling ? 0 : [-3, 0, -3],
                  opacity: isScrolling ? 0 : 1,
                  width: isScrolling ? 0 : 'auto',
                }}
                transition={shouldSkipHeavyEffects ? {} : { duration: isScrolling ? 0.2 : 1.2, repeat: isScrolling ? 0 : Infinity, ease: "easeInOut" }}
                style={{ overflow: 'hidden' }}
              >
                <IconChevronLeft className="w-5 h-5 text-white/70" />
              </motion.div>
            )}
            
            <motion.div 
              className="relative"
              layout
              animate={{
                width: isScrolling ? 32 : 48,
                height: isScrolling ? 32 : 48,
              }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
            >
              <motion.div
                className={cn(
                  "absolute -inset-2 bg-white/25 rounded-2xl",
                  shouldSkipHeavyEffects ? "" : "blur-lg"
                )}
                animate={shouldSkipHeavyEffects ? {} : { 
                  scale: [1, 1.2, 1], 
                  opacity: isScrolling ? [0.2, 0.4, 0.2] : [0.4, 0.7, 0.4] 
                }}
                transition={shouldSkipHeavyEffects ? {} : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                layout
                className={cn(
                  "relative w-full h-full flex items-center justify-center overflow-hidden",
                  "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800",
                  "border border-slate-500/50 shadow-inner"
                )}
                animate={{
                  borderRadius: isScrolling ? 16 : 12,
                }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
              >
                {/* Icon - crossfade between wave and source icon */}
                <AnimatePresence mode="wait">
                  {isScrolling ? (
                    <motion.div
                      key="wave"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: shouldSkipHeavyEffects ? 1 : [1, 1.1, 1] }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ 
                        opacity: { duration: 0.15 },
                        scale: shouldSkipHeavyEffects ? { duration: 0.15 } : { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
                      }}
                    >
                      <IconMusic className="w-4 h-4 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="source"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.15 }}
                    >
                      {SourceIcon && <SourceIcon className="w-6 h-6 text-white/95" />}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Wave bars - animate out when scrolling */}
                <motion.div 
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-[3px]"
                  animate={{ 
                    opacity: isScrolling ? 0 : 1,
                    y: isScrolling ? 10 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {[1, 2, 3, 4].map(i => (
                    <motion.div
                      key={i}
                      className="w-[3px] bg-white rounded-full origin-bottom"
                      animate={{ scaleY: isPlaying && !shouldSkipHeavyEffects ? [0.3, 1, 0.3] : 0.3 }}
                      transition={shouldSkipHeavyEffects ? { duration: 0.15 } : { 
                        duration: 0.5, 
                        repeat: Infinity, 
                        delay: i * 0.08,
                        ease: "easeInOut"
                      }}
                      style={{ height: 10 }}
                    />
                  ))}
                </motion.div>
                
                {/* Shimmer effect */}
                {!shouldSkipHeavyEffects && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </motion.div>
            </motion.div>
            
            {/* Text label - animates out on scroll */}
            <motion.div
              animate={{ 
                opacity: isScrolling ? 0 : 1,
                width: isScrolling ? 0 : 'auto',
                marginLeft: isScrolling ? 0 : undefined,
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
              className="flex flex-col"
            >
              <span className="text-[10px] font-bold text-white/90">{sourceLabel[musicSource]}</span>
              <span className="text-[8px] text-white/80 font-medium">♪ Playing</span>
            </motion.div>
            
            {/* Left side chevron */}
            {playerSide === 'left' && (
              <motion.div
                animate={{ 
                  x: isScrolling ? 0 : [0, 3, 0],
                  opacity: isScrolling ? 0 : 1,
                  width: isScrolling ? 0 : 'auto',
                }}
                transition={shouldSkipHeavyEffects ? {} : { duration: isScrolling ? 0.2 : 1.2, repeat: isScrolling ? 0 : Infinity, ease: "easeInOut" }}
                style={{ overflow: 'hidden' }}
              >
                <IconChevronRight className="w-5 h-5 text-white/70" />
              </motion.div>
            )}
            
            {/* Tooltip */}
            <AnimatePresence>
              {!isScrolling && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ButtonTooltip 
                    show={hoveredButton === 'expand'} 
                    text="🎵 Tap to Expand" 
                    position={playerSide === 'left' ? 'right' : 'left'} 
                    color="green" 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Hidden iframe container - keeps audio playing when minimized */}
      {renderHiddenIframe && isMinimized && streamingEmbedUrl && (
        <motion.div 
          className="fixed pointer-events-none" 
          animate={{
            width: isScrolling ? 160 : 320,
            height: isScrolling ? 76 : 152,
            scale: isScrolling ? 0.5 : 1,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{ 
            position: 'fixed',
            top: -9999,
            left: -9999,
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
        </motion.div>
      )}
    </>
  );
}
