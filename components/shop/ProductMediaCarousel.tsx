'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize
} from 'lucide-react';
import type { ProductMedia } from '@/types/store';

// ============================================================================
// WORLD-CLASS PRODUCT MEDIA CAROUSEL
// Supports: Images, Videos (YouTube, Vimeo, Direct URLs)
// Features: Zoom, Fullscreen, Thumbnails, Keyboard Nav, Touch Gestures
// ============================================================================

interface ProductMediaCarouselProps {
  media: ProductMedia[];
  productName: string;
  className?: string;
  autoPlay?: boolean;
  showThumbnails?: boolean;
  enableZoom?: boolean;
  enableFullscreen?: boolean;
}

export function ProductMediaCarousel({
  media = [],
  productName,
  className = '',
  autoPlay = false,
  showThumbnails = true,
  enableZoom = true,
  enableFullscreen = true,
}: ProductMediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isContainerFocused, setIsContainerFocused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentMedia = media[currentIndex];
  const isVideo = currentMedia?.media_type === 'video';

  // Keyboard navigation - ONLY when container is focused/visible
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if container is focused or visible in modal
      if (!isContainerFocused && !containerRef.current) return;
      
      // Check if the carousel container is in the DOM and visible
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        if (!isVisible) return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        goToPrevious();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        goToNext();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsFullscreen(false);
        setIsZoomed(false);
      }
      if (e.key === ' ' && isVideo) {
        e.preventDefault();
        e.stopPropagation();
        togglePlayPause();
      }
    };

    // Only add listener if focused
    if (isContainerFocused) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [currentIndex, media.length, isVideo, isContainerFocused]);

  // Auto-play next slide for videos
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;

    const video = videoRef.current;
    const handleEnded = () => {
      if (currentIndex < media.length - 1) {
        goToNext();
      }
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [currentIndex, media.length, isVideo]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
    setIsZoomed(false);
    setZoomLevel(1);
  }, [media.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    setIsZoomed(false);
    setZoomLevel(1);
  }, [media.length]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsZoomed(false);
    setZoomLevel(1);
  }, []);

  const toggleZoom = useCallback(() => {
    if (isVideo) return;
    setIsZoomed(!isZoomed);
    setZoomLevel(isZoomed ? 1 : 2);
  }, [isZoomed, isVideo]);

  const toggleFullscreen = useCallback(() => {
    if (!enableFullscreen) return;
    
    // Custom fullscreen within modal/container only (not browser fullscreen)
    setIsFullscreen(!isFullscreen);
  }, [enableFullscreen, isFullscreen]);

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Handle drag to navigate
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 50;
      if (info.offset.x > threshold) {
        goToPrevious();
      } else if (info.offset.x < -threshold) {
        goToNext();
      }
      setIsDragging(false);
    },
    [goToNext, goToPrevious]
  );

  // Parse YouTube/Vimeo URLs
  const getVideoEmbed = (url: string): { type: 'youtube' | 'vimeo' | 'direct'; embedUrl: string } | null => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (youtubeMatch) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}`,
      };
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=${isPlaying ? 1 : 0}&muted=${isMuted ? 1 : 0}`,
      };
    }

    // Direct video file
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return {
        type: 'direct',
        embedUrl: url,
      };
    }

    return null;
  };

  const renderMedia = () => {
    if (!currentMedia) return null;

    if (currentMedia.media_type === 'image') {
      return (
        <motion.div
          key={currentMedia.id}
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative w-full h-full"
            animate={{ scale: zoomLevel }}
            transition={{ duration: 0.3 }}
            drag={isZoomed}
            dragConstraints={{
              top: isZoomed ? -200 : 0,
              bottom: isZoomed ? 200 : 0,
              left: isZoomed ? -200 : 0,
              right: isZoomed ? 200 : 0
            }}
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            style={{ 
              cursor: isZoomed ? 'grab' : enableZoom ? 'zoom-in' : 'default',
              touchAction: isZoomed ? 'none' : 'auto'
            }}
            onClick={(e) => {
              if (!isDragging && enableZoom) {
                e.stopPropagation();
                toggleZoom();
              }
            }}
          >
            <Image
              src={(() => {
                let src = currentMedia.url;
                if (src.startsWith('/http://') || src.startsWith('/https://')) {
                  src = src.substring(1);
                }
                if (src.startsWith('http://') || src.startsWith('https://')) {
                  return src;
                }
                return src.startsWith('/') ? src : `/${src.replace(/^public\//, '')}`;
              })()}
              alt={currentMedia.alt_text || currentMedia.title || productName}
              fill
              className="object-contain md:object-contain pointer-events-none select-none"
              sizes="(max-width: 768px) 95vw, 70vw"
              priority={currentIndex === 0}
              draggable={false}
            />
          </motion.div>
        </motion.div>
      );
    }

    if (currentMedia.media_type === 'video') {
      const videoEmbed = getVideoEmbed(currentMedia.url);

      if (!videoEmbed) {
        return (
          <div className="flex items-center justify-center w-full h-full text-white/60">
            <p>Unsupported video format</p>
          </div>
        );
      }

      // YouTube/Vimeo embed
      if (videoEmbed.type === 'youtube' || videoEmbed.type === 'vimeo') {
        return (
          <motion.div
            key={currentMedia.id}
            className="relative w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <iframe
              src={videoEmbed.embedUrl}
              title={currentMedia.title || productName}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>
        );
      }

      // Direct video file
      return (
        <motion.div
          key={currentMedia.id}
          className="relative w-full h-full flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <video
            ref={videoRef}
            src={videoEmbed.embedUrl}
            className="max-w-full max-h-full"
            controls
            autoPlay={isPlaying}
            muted={isMuted}
            loop={false}
            playsInline
            poster={currentMedia.thumbnail_url || undefined}
          >
            Your browser does not support the video tag.
          </video>
        </motion.div>
      );
    }

    return null;
  };

  if (!media || media.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-xl">
        <span className="text-white/20 text-6xl font-light">B</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onFocus={() => setIsContainerFocused(true)}
      onBlur={() => setIsContainerFocused(false)}
      onMouseEnter={() => setIsContainerFocused(true)}
      onMouseLeave={() => setIsContainerFocused(false)}
      className={`relative w-full h-full flex flex-col ${className} ${
        isFullscreen ? 'fixed inset-0 z-[100] bg-black p-2 md:p-6' : ''
      }`}
      style={isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
      } : undefined}
    >
      {/* Main Media Display */}
      <div className={`relative flex-1 bg-black rounded-lg md:rounded-xl overflow-hidden ${
        isFullscreen ? 'h-full' : ''
      }`}>
        {/* Main Media Container */}
        <AnimatePresence mode="wait">
          {renderMedia()}
        </AnimatePresence>
      </div>

      {/* MOBILE Arrows - middle of image, white bg, visible icons */}
      {media.length > 1 && (
        <>
          <motion.button
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center z-[50]"
            whileTap={{ scale: 0.85 }}
            aria-label="Previous"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </motion.button>

          <motion.button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center z-[50]"
            whileTap={{ scale: 0.85 }}
            aria-label="Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </motion.button>
        </>
      )}

      {/* DESKTOP Arrows - detached, floating outside like close button */}
      {media.length > 1 && (
        <>
          <motion.button
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            className="hidden md:flex fixed left-[max(1rem,calc(50vw-38rem))] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/30 items-center justify-center shadow-2xl z-[10001] cursor-pointer"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            aria-label="Previous"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </motion.button>

          <motion.button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="hidden md:flex fixed right-[max(1rem,calc(50vw-38rem))] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/30 items-center justify-center shadow-2xl z-[10001] cursor-pointer"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            aria-label="Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </motion.button>
        </>
      )}

      {/* Media Counter - top right on desktop, top center on mobile */}
      {media.length > 1 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:top-4 md:right-4 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-white text-xs font-medium z-[50] shadow-lg">
          {currentIndex + 1} / {media.length}
        </div>
      )}

      {/* Video Controls - bottom left */}
      {isVideo && videoRef.current && (
        <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 flex gap-1.5 z-[50]">
          <motion.button
            onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
            className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/80 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </motion.button>
          <motion.button
            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/80 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </motion.button>
        </div>
      )}

      {/* Single Smart Toggle: Zoom → Expand → Exit */}
      {!isVideo && (enableZoom || enableFullscreen) && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            if (isFullscreen) {
              setIsFullscreen(false);
              setIsZoomed(false);
              setZoomLevel(1);
            } else if (isZoomed) {
              setIsZoomed(false);
              setZoomLevel(1);
              toggleFullscreen();
            } else {
              toggleZoom();
            }
          }}
          className="absolute bottom-3 right-3 md:bottom-4 md:right-4 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/80 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all z-[50] shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label={isFullscreen ? 'Exit' : isZoomed ? 'Expand' : 'Zoom'}
        >
          {isFullscreen ? (
            <X className="w-4 h-4" />
          ) : isZoomed ? (
            <Maximize2 className="w-3.5 h-3.5" />
          ) : (
            <ZoomIn className="w-3.5 h-3.5" />
          )}
        </motion.button>
      )}

      {/* Fullscreen close (top-right) */}
      {isFullscreen && (
        <motion.button
          onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); setIsZoomed(false); setZoomLevel(1); }}
          className="absolute top-3 right-3 md:top-4 md:right-4 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/80 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all z-[50] shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Exit Fullscreen"
        >
          <X className="w-4 h-4 md:w-5 md:h-5" />
        </motion.button>
      )}

      {/* Thumbnail Navigation - Hidden in fullscreen */}
      {showThumbnails && media.length > 1 && !isFullscreen && (
        <div className="flex gap-1.5 md:gap-2 mt-2 md:mt-3 overflow-x-auto scrollbar-hide pb-1 md:pb-2">
          {media.map((item, index) => (
            <motion.button
              key={item.id}
              onClick={() => goToIndex(index)}
              className={`relative shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-md md:rounded-lg overflow-hidden border transition-all ${
                index === currentIndex
                  ? 'border-blue-500 ring-1 md:ring-2 ring-blue-500/30'
                  : 'border-white/20 hover:border-white/40'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`View ${item.media_type} ${index + 1}`}
            >
              {item.media_type === 'image' ? (
                <Image
                  src={(() => {
                    let src = item.url;
                    if (src.startsWith('/http://') || src.startsWith('/https://')) {
                      src = src.substring(1);
                    }
                    if (src.startsWith('http://') || src.startsWith('https://')) {
                      return src;
                    }
                    return src.startsWith('/') ? src : `/${src.replace(/^public\//, '')}`;
                  })()}
                  alt={item.alt_text || `Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="w-full h-full bg-black/40 flex items-center justify-center">
                  {item.thumbnail_url ? (
                    <Image
                      src={item.thumbnail_url}
                      alt={item.title || `Video ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
