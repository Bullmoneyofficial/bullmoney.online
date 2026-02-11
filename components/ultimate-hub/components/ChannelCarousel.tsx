import { memo, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink, Lock, Star, TrendingUp } from 'lucide-react';
import type { ChannelKey } from '@/components/ultimate-hub/types';
import { EXTENDED_CHANNEL_KEYS, EXTENDED_CHANNELS, type ExtendedChannelKey } from '@/components/ultimate-hub/constants';

interface ChannelCarouselProps {
  activeChannel: ChannelKey;
  setActiveChannel: (channel: ChannelKey) => void;
  isVip: boolean;
  isAdmin: boolean;
  onClose?: () => void;
  onAdminClick?: () => void;
}

export const ChannelCarousel = memo(({ 
  activeChannel, 
  setActiveChannel, 
  isVip, 
  isAdmin, 
  onClose,
  onAdminClick 
}: ChannelCarouselProps) => {
  // Extended active channel to include admin
  const [extendedActiveChannel, setExtendedActiveChannel] = useState<ExtendedChannelKey>(activeChannel);
  const [favoriteChannel, setFavoriteChannel] = useState<ExtendedChannelKey | null>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('favorite_channel') as ExtendedChannelKey) || null;
    }
    return null;
  });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Sync external activeChannel with extendedActiveChannel
  useEffect(() => {
    if (extendedActiveChannel !== 'admin' && extendedActiveChannel !== activeChannel) {
      setExtendedActiveChannel(activeChannel);
    }
  }, [activeChannel, extendedActiveChannel]);
  
  const currentIndex = EXTENDED_CHANNEL_KEYS.indexOf(extendedActiveChannel);
  const ch = EXTENDED_CHANNELS[extendedActiveChannel] || { name: 'Unknown', icon: TrendingUp, color: 'blue' };
  const Icon = ch.icon;
  const isLocked = ch.requiresVip && !isVip;
  const isAdminTab = extendedActiveChannel === 'admin';
  
  // Navigate to previous channel
  const goToPrev = useCallback(() => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : EXTENDED_CHANNEL_KEYS.length - 1;
    const newChannel = EXTENDED_CHANNEL_KEYS[prevIndex];
    setExtendedActiveChannel(newChannel);
    if (newChannel !== 'admin') {
      setActiveChannel(newChannel as ChannelKey);
    }
  }, [currentIndex, setActiveChannel]);
  
  // Navigate to next channel
  const goToNext = useCallback(() => {
    const nextIndex = currentIndex < EXTENDED_CHANNEL_KEYS.length - 1 ? currentIndex + 1 : 0;
    const newChannel = EXTENDED_CHANNEL_KEYS[nextIndex];
    setExtendedActiveChannel(newChannel);
    if (newChannel !== 'admin') {
      setActiveChannel(newChannel as ChannelKey);
    }
  }, [currentIndex, setActiveChannel]);
  
  // Toggle favorite channel
  const toggleFavorite = useCallback(() => {
    const newFav = favoriteChannel === extendedActiveChannel ? null : extendedActiveChannel;
    setFavoriteChannel(newFav);
    if (typeof window !== 'undefined') {
      if (newFav) {
        localStorage.setItem('favorite_channel', newFav);
      } else {
        localStorage.removeItem('favorite_channel');
      }
    }
  }, [extendedActiveChannel, favoriteChannel]);
  
  // Go to favorite channel
  const goToFavorite = useCallback(() => {
    if (favoriteChannel) {
      setExtendedActiveChannel(favoriteChannel);
      if (favoriteChannel !== 'admin') {
        setActiveChannel(favoriteChannel as ChannelKey);
      }
    }
  }, [favoriteChannel, setActiveChannel]);
  
  // Load favorite on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('favorite_channel') as ExtendedChannelKey | null;
      if (saved && EXTENDED_CHANNEL_KEYS.includes(saved)) {
        setFavoriteChannel(saved);
      }
    }
  }, []);
  
  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsDragging(true);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX) return;
    e.stopPropagation();
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX || !isDragging) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    const threshold = 50;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    
    setTouchStartX(null);
    setIsDragging(false);
  };
  
  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStartX(e.clientX);
    setIsDragging(true);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!touchStartX || !isDragging) return;
    
    const diff = touchStartX - e.clientX;
    const threshold = 50;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    
    setTouchStartX(null);
    setIsDragging(false);
  };
  
  const handleMouseLeave = () => {
    if (isDragging) {
      setTouchStartX(null);
      setIsDragging(false);
    }
  };
  
  // Handle click on admin tab
  const handleAdminClick = () => {
    if (isAdminTab) {
      if (onAdminClick) {
        onAdminClick();
      } else {
        window.dispatchEvent(new CustomEvent('openAdminVIPPanel'));
        if (onClose) onClose();
      }
    }
  };

  const isFavorite = favoriteChannel === extendedActiveChannel;
  const hasFavorite = favoriteChannel !== null;

  return (
    <div className="w-full max-w-[1100px] mx-auto flex flex-col gap-1 p-1 sm:p-2 border-b border-blue-500/30 flex-shrink-0 bg-black/95 backdrop-blur-2xl relative"
      style={{ boxShadow: '0 0 12px rgba(59, 130, 246, 0.3), inset 0 0 8px rgba(59, 130, 246, 0.1)' }}>
      {/* Main Carousel Row */}
      <div className="flex items-center gap-1 sm:gap-1.5 justify-center">
        {/* Favorite Button - Blue, goes to saved favorite */}
        <motion.button
          onClick={hasFavorite ? goToFavorite : undefined}
          whileHover={{ scale: hasFavorite ? 1.1 : 1 }}
          whileTap={{ scale: hasFavorite ? 0.95 : 1 }}
          className={`flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl border transition-all flex-shrink-0 ${
            hasFavorite
              ? 'bg-blue-500/30 border-blue-400/70 text-blue-400 cursor-pointer'
              : 'bg-blue-500/10 border-blue-400/30 text-blue-400/40 cursor-default'
          }`}
          style={hasFavorite ? { boxShadow: '0 0 14px rgba(59, 130, 246, 0.6)' } : {}}
          title={hasFavorite ? `Go to favorite: ${EXTENDED_CHANNELS[favoriteChannel!]?.name || 'Unknown'}` : 'No favorite set'}
        >
          <Star className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${hasFavorite ? 'fill-blue-400' : ''}`} />
        </motion.button>
        
        {/* Left Arrow */}
        <motion.button
          onClick={goToPrev}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-500/20 border border-blue-400/50 text-blue-400 hover:bg-blue-500/30 transition-all flex-shrink-0"
          style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)' }}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </motion.button>
        
        {/* Channel Display - Swipeable */}
        <motion.div
          key={extendedActiveChannel}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1 min-w-0 flex items-center justify-center cursor-grab active:cursor-grabbing select-none relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleAdminClick}
          style={{ touchAction: 'pan-y' }}
        >
          <div 
            className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl border backdrop-blur-xl transition-all ${
              isAdminTab 
                ? 'bg-blue-500/30 border-blue-400/70' 
                : 'bg-blue-500/20 border-blue-400/50'
            }`}
            style={{ boxShadow: '0 0 16px rgba(59, 130, 246, 0.5)' }}
          >
            <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-400" style={{ filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.8))' }} />
            <span className="text-[11px] sm:text-base font-bold text-blue-400 whitespace-nowrap" style={{ textShadow: '0 0 8px rgba(59, 130, 246, 0.8)' }}>{ch.name}</span>
            {isLocked && <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400/60" />}
            {isAdminTab && <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400/80" />}
            
            {/* Set as Favorite Button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite();
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className={`ml-0.5 sm:ml-1 p-1 sm:p-1.5 rounded-full transition-all ${
                isFavorite 
                  ? 'text-blue-400 bg-blue-500/30' 
                  : 'text-blue-400/40 hover:text-blue-400 hover:bg-blue-500/20'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Set as favorite'}
            >
              <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-blue-400' : ''}`} />
            </motion.button>
          </div>
        </motion.div>
        
        {/* Right Arrow */}
        <motion.button
          onClick={goToNext}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-500/20 border border-blue-400/50 text-blue-400 hover:bg-blue-500/30 transition-all flex-shrink-0"
          style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)' }}
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </motion.button>
      </div>
      
      {/* Channel indicator dots */}
      <div className="flex justify-center gap-1 sm:gap-1.5">
        {EXTENDED_CHANNEL_KEYS.map((key, idx) => (
          <motion.button
            key={key}
            onClick={() => {
              setExtendedActiveChannel(key);
              if (key !== 'admin') {
                setActiveChannel(key as ChannelKey);
              }
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className={`rounded-full transition-all ${
              idx === currentIndex 
                ? 'w-3.5 sm:w-5 h-1.5 sm:h-2 bg-blue-400' 
                : key === favoriteChannel 
                  ? 'w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-400/60' 
                  : 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400/30 hover:bg-blue-400/50'
            }`}
            style={idx === currentIndex ? { boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)' } : {}}
          />
        ))}
      </div>
    </div>
  );
});
ChannelCarousel.displayName = 'ChannelCarousel';
