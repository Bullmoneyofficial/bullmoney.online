import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Palette } from 'lucide-react';

import { SoundEffects } from '@/app/hooks/useSoundEffects';

// SEO Text Component for BullMoney
export interface BullMoneyHeroTextProps {
  onOpenHub?: () => void;
  onOpenShop?: () => void;
  onOpenNewShop?: () => void;
}

export const BullMoneyHeroText: React.FC<BullMoneyHeroTextProps> = ({ onOpenHub, onOpenShop, onOpenNewShop }) => (
  <div className="hero-seo-text">
    <h1 className="hero-title">
      <span className="gradient-text">BULL</span>MONEY
    </h1>
    <p className="hero-tagline">Elite Trading Community & VIP Shop</p>
    <p className="hero-description">
      Join thousands of successful traders. Access exclusive signals, premium courses, and our VIP community. Start your
      trading journey today.
    </p>
    <div className="hero-cta-buttons">
      <button
        onClick={() => {
          SoundEffects.click();
          onOpenHub?.();
        }}
        className="btn-vip"
      >
        Access Trades & Tools
      </button>
      <button
        onClick={() => {
          SoundEffects.click();
          onOpenShop?.();
        }}
        className="btn-shop"
      >
        GET VIP
      </button>
      <button
        onClick={() => {
          SoundEffects.click();
          onOpenNewShop?.();
        }}
        className="btn-shop btn-new-shop"
      >
        Visit Shop
      </button>
    </div>
  </div>
);

// YouTube Video Player Component
export const YouTubePlayer: React.FC<{
  videoId: string;
  loading?: boolean;
  error?: boolean;
  onError?: () => void;
}> = ({ videoId, loading, error, onError }) => (
  <div className="hero-video-container">
    {loading ? (
      <div className="video-loading">Loading...</div>
    ) : error ? (
      <div className="video-error">Video unavailable</div>
    ) : (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&modestbranding=1&rel=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="BullMoney Live"
        onError={onError}
      />
    )}
  </div>
);

// ============================================================================
// 3D TOGGLE BUTTON - Activates Spline Background (styled like StoreHero3D)
// ============================================================================
export const Toggle3DButton = ({
  isActive,
  onClick,
  onLongPress,
}: {
  isActive: boolean;
  onClick: () => void;
  onLongPress?: () => void;
}) => {
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [wasLongPress, setWasLongPress] = React.useState(false);

  const startLongPress = () => {
    if (onLongPress) {
      setWasLongPress(false);
      timerRef.current = setTimeout(() => {
        setWasLongPress(true);
        onLongPress();
        SoundEffects.click();
      }, 500); // Long press after 500ms
    }
  };

  const cancelLongPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only for left click
    if (e.button === 0) {
      startLongPress();
    }
  };

  const handleMouseUp = () => {
    cancelLongPress();
  };

  const handleMouseLeave = () => {
    cancelLongPress();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    startLongPress();
  };

  const handleTouchEnd = () => {
    cancelLongPress();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Small delay to check if it was a long press
    setTimeout(() => {
      if (!wasLongPress) {
        SoundEffects.click();
        onClick();
      }
      setWasLongPress(false);
    }, 10);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onLongPress) {
      onLongPress();
      SoundEffects.click();
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <motion.button
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="group relative z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl overflow-hidden\n                 border transition-all duration-300"
      style={{
        background: isActive
          ? 'linear-gradient(135deg, rgba(25, 86, 180, 0.3) 0%, rgba(25, 86, 180, 0.1) 100%)'
          : 'rgba(255, 255, 255, 0.05)',
        borderColor: isActive ? 'rgba(25, 86, 180, 0.5)' : 'rgba(255, 255, 255, 0.2)',
        boxShadow: isActive
          ? '0 0 30px rgba(25, 86, 180, 0.3), inset 0 0 20px rgba(25, 86, 180, 0.1)'
          : 'none',
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: '0 0 40px rgba(25, 86, 180, 0.4), inset 0 0 25px rgba(25, 86, 180, 0.15)',
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20, rotateX: 45 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
        delay: 0.5,
      }}
    >
      {/* 3D depth effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12"
        animate={{ x: isActive ? ['-200%', '200%'] : '-200%' }}
        transition={{
          duration: 2,
          repeat: isActive ? Infinity : 0,
          ease: 'easeInOut',
          repeatDelay: 1,
        }}
      />

      {/* Icon with 3D rotation */}
      <motion.div
        animate={{
          rotateY: isActive ? [0, 360] : 0,
        }}
        transition={{
          duration: 2,
          repeat: isActive ? Infinity : 0,
          ease: 'linear',
        }}
      >
        <Box
          className={`w-4 h-4 relative z-10 transition-colors duration-300 ${isActive ? 'text-[#1956B4]' : 'text-white/60'}`}
          strokeWidth={2}
        />
      </motion.div>

      <span className={`text-sm font-medium relative z-10 transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/60'}`}>
        3D
      </span>

      {/* Hold indicator - shows menu is available */}
      <motion.div className="relative z-10 flex gap-0.5" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 1 }}>
        <div className="w-1 h-1 rounded-full bg-current" />
        <div className="w-1 h-1 rounded-full bg-current" />
        <div className="w-1 h-1 rounded-full bg-current" />
      </motion.div>

      {/* Active indicator dot */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="w-1.5 h-1.5 rounded-full bg-[#1956B4] animate-pulse relative z-10"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ============================================================================
// GRAYSCALE TOGGLE BUTTON - Toggles Color/B&W (styled like StoreHero3D)
// ============================================================================
export const ToggleGrayscaleButton = ({
  isActive,
  onClick,
  label = 'Color',
}: {
  isActive: boolean;
  onClick: () => void;
  label?: string;
}) => (
  <motion.button
    onClick={() => {
      SoundEffects.click();
      onClick();
    }}
    className="group relative z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl overflow-hidden\n               border transition-all duration-300"
    style={{
      background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, rgba(25, 86, 180, 0.3) 0%, rgba(25, 86, 180, 0.1) 100%)',
      borderColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(25, 86, 180, 0.5)',
      boxShadow: !isActive ? '0 0 30px rgba(25, 86, 180, 0.3), inset 0 0 20px rgba(25, 86, 180, 0.1)' : 'none',
    }}
    whileHover={{
      scale: 1.05,
      boxShadow: '0 0 40px rgba(25, 86, 180, 0.4)',
    }}
    whileTap={{ scale: 0.95 }}
    initial={{ opacity: 0, y: 20, rotateX: 45 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{
      type: 'spring',
      damping: 20,
      stiffness: 300,
      delay: 0.6,
    }}
  >
    {/* 3D depth effect */}
    <motion.div
      className="absolute inset-0 rounded-2xl"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
        pointerEvents: 'none',
      }}
    />

    {/* Shimmer effect when color is on */}
    <motion.div
      className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12"
      animate={{ x: !isActive ? ['-200%', '200%'] : '-200%' }}
      transition={{
        duration: 2,
        repeat: !isActive ? Infinity : 0,
        ease: 'easeInOut',
        repeatDelay: 1,
      }}
    />

    {/* Icon */}
    <Palette className={`w-4 h-4 relative z-10 transition-colors duration-300 ${!isActive ? 'text-[#1956B4]' : 'text-white/60'}`} strokeWidth={2} />

    <span className={`text-sm font-medium relative z-10 transition-colors duration-300 ${!isActive ? 'text-white' : 'text-white/60'}`}>
      {label}
    </span>

    {/* Active indicator dot when color is ON */}
    <AnimatePresence>
      {!isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="w-1.5 h-1.5 rounded-full bg-[#1956B4] animate-pulse relative z-10"
        />
      )}
    </AnimatePresence>
  </motion.button>
);
