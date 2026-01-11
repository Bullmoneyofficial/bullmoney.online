"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MessageCircle, Palette, Volume1, Volume2, VolumeX,
  Zap, Settings2, X, GripHorizontal, Command, Activity
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Utility: Safe audio feedback
const playClick = () => {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78OScTgwMUKnk8LJnHAU7k9nxy3omBSh+zPLaizsKGGS57OihUBELTKXh8bllHAU7k9nxy3omBSh+zPLaizsKGGS57OihUBELTKXh8bllHAU7k9nxy3omBSh+zPLaizsKGGS57OihUBELTKXh8bllHAU7k9nxy3omBSh+zPLaizsKGGS57OihUBELTKXh8bllHAU7k9nxy3omBSh+zPLaizsKGGS57OihUBELTKXh8Q==');
    audio.volume = 0.2;
    audio.play().catch(() => {});
  } catch {}
};

// Utility: Safe haptic feedback
const triggerHaptic = (intensity: number = 8) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(intensity);
    } catch {}
  }
};

interface MobileQuickActionsProps {
  isVisible: boolean;
  disableSpline?: boolean;
  isPlaying?: boolean;
  volume?: number;
  onPerformanceToggle?: () => void;
  onMusicToggle?: () => void;
  onThemeClick?: () => void;
  onHelpClick?: () => void;
  onControlCenterToggle?: () => void;
  safeAreaInlinePadding?: React.CSSProperties;
  safeAreaBottom?: React.CSSProperties['bottom'];
  accentColor?: string;
}

export function MobileQuickActions({
  isVisible,
  disableSpline = false,
  isPlaying = false,
  volume = 0,
  onPerformanceToggle,
  onMusicToggle,
  onThemeClick,
  onHelpClick,
  onControlCenterToggle,
  safeAreaInlinePadding,
  safeAreaBottom,
  accentColor = '#3b82f6',
}: MobileQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isButtonHovering, setIsButtonHovering] = useState(false);
  const [position, setPosition] = useState({ x: 12, y: 0 });
  
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragTimeoutRef = useRef<NodeJS.Timeout>();
  const prefersReducedMotion = useReducedMotion();

  // Memoized visibility flags
  const actionFlags = useMemo(() => ({
    showPerformance: typeof onPerformanceToggle === 'function',
    showMusic: typeof onMusicToggle === 'function',
    showTheme: typeof onThemeClick === 'function',
    showHelp: typeof onHelpClick === 'function',
    showControlCenter: typeof onControlCenterToggle === 'function',
  }), [onPerformanceToggle, onMusicToggle, onThemeClick, onHelpClick, onControlCenterToggle]);

  const hasAnyActions = Object.values(actionFlags).some(Boolean);

  // Responsive positioning
  const stackLeft = 'max(env(safe-area-inset-left, 0px) + 16px, 16px)';
  const stackTop = 'clamp(80px, calc(50vh - 200px + env(safe-area-inset-top, 0px)), calc(100vh - 400px))';

  // Keyboard shortcut handler
  useEffect(() => {
    if (!isVisible || !hasAnyActions) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        playClick();
        setIsOpen((prev) => !prev);
        setHasInteracted(true);
        triggerHaptic(10);
      }
      // ESC to close
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        playClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, hasAnyActions, isOpen]);

  // Auto-dismiss tooltip after 5 seconds
  useEffect(() => {
    if (!hasInteracted && isVisible) {
      const timer = setTimeout(() => setHasInteracted(true), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [hasInteracted, isVisible]);

  // Cleanup drag timeout
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    };
  }, []);

  // Handle action with feedback
  const handleAction = useCallback((action?: () => void, vibration = 8) => {
    if (!action) {
      return;
    }
    playClick();
    triggerHaptic(vibration);
    action();
  }, []);

  // Toggle handler
  const handleToggle = useCallback(() => {
    if (isDragging) return;
    playClick();
    triggerHaptic(isOpen ? 8 : 12);
    setIsOpen((prev) => !prev);
    setHasInteracted(true);
  }, [isDragging, isOpen]);

  // Drag handlers
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
  }, []);

  const handleDragEnd = useCallback((_: any, info: any) => {
    dragTimeoutRef.current = setTimeout(() => setIsDragging(false), 150);
    setPosition({ x: info.point.x, y: info.point.y });
  }, []);

  // Close menu handler
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    playClick();
  }, []);

  // Don't render if not visible or no actions
  if (!isVisible || !hasAnyActions) return null;

  // Animation variants
  const pulseVariants = {
    animate: prefersReducedMotion ? {} : {
      boxShadow: [
        `0 0 0 rgba(59, 130, 246, 0)`,
        `0 0 25px ${accentColor}60`,
        `0 0 0 rgba(59, 130, 246, 0)`
      ]
    }
  };

  return (
    <>
      {/* Drag constraints area */}
      <div
        ref={constraintsRef}
        className="fixed inset-4 pointer-events-none z-[-1]"
        style={safeAreaBottom ? { bottom: safeAreaBottom } : undefined}
        aria-hidden="true"
      />

      {/* Backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[252000] bg-black/20 backdrop-blur-[2px]"
            onClick={closeMenu}
            onTouchStart={(e) => {
              e.stopPropagation();
              closeMenu();
            }}
            aria-hidden="true"
            style={{ touchAction: 'manipulation' }}
          />
        )}
      </AnimatePresence>

      {/* Main draggable container */}
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.05}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        initial={position}
        className="fixed z-[253000] touch-auto pointer-events-auto"
        style={{
          ...(safeAreaInlinePadding || {}),
          left: stackLeft,
          top: stackTop,
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        role="region"
        aria-label="Quick settings menu"
      >
        <div className="relative flex flex-col items-start gap-2">
          
          {/* Main toggle button */}
          <motion.div
            animate={!isOpen && !prefersReducedMotion ? pulseVariants.animate : {}}
            transition={{ duration: 2, repeat: !isOpen ? Infinity : 0, ease: "easeInOut" }}
            className="relative flex flex-col items-center justify-center p-1 rounded-full border transition-all duration-300 overflow-hidden bg-black/90 backdrop-blur-xl border-white/20 w-11 h-11 sm:w-12 sm:h-12 shadow-2xl will-change-transform"
          >
            {/* Drag handle */}
            <div 
              className="absolute top-0 inset-x-0 h-4 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-40 hover:opacity-60 transition-opacity z-10"
              aria-label="Drag to reposition"
            >
              <GripHorizontal size={12} className="text-white/50" />
            </div>

            {/* Button with icon */}
            <motion.button
              onTap={handleToggle}
              onMouseEnter={() => {
                setIsButtonHovering(true);
                setHasInteracted(true);
              }}
              onMouseLeave={() => setIsButtonHovering(false)}
              onTouchStart={(e) => {
                e.stopPropagation();
                setIsButtonHovering(true);
                setHasInteracted(true);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                setIsButtonHovering(false);
              }}
              onFocus={() => setHasInteracted(true)}
              className="relative w-full h-full flex items-center justify-center outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black z-10 rounded-full overflow-hidden will-change-auto"
              type="button"
              aria-label={isOpen ? "Close quick settings" : "Open quick settings"}
              aria-expanded={isOpen}
              aria-haspopup="menu"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', WebkitUserSelect: 'none' }}
            >
              {/* Animated gradient ring */}
              {!prefersReducedMotion && (
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: isOpen ? 0 : 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  style={{
                    background: `conic-gradient(from 0deg, ${accentColor}, transparent, ${accentColor})`
                  }}
                />
              )}
              
              {/* Inner circle */}
              <div className="absolute inset-[3px] rounded-full bg-black/95 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  {isOpen ? (
                    <X size={20} className="text-red-400" />
                  ) : (
                    <Settings2 size={22} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                  )}
                </motion.div>
              </div>
              
              {/* Glow effect */}
              {!prefersReducedMotion && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: isOpen
                      ? `0 0 15px ${accentColor}60, 0 0 35px ${accentColor}40`
                      : `0 0 20px ${accentColor}60`
                  }}
                  transition={{ duration: 1.5, repeat: isOpen ? Infinity : 0, ease: "easeInOut" }}
                />
              )}
            </motion.button>

            {/* Desktop keyboard shortcut hint */}
            <AnimatePresence>
              {!isOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute -bottom-7 whitespace-nowrap hidden sm:block pointer-events-none"
                >
                  <div className="flex items-center gap-1 text-[9px] font-mono text-white/40 bg-black/60 backdrop-blur-sm px-2 py-1 rounded border border-white/10">
                    <Command size={8} strokeWidth={2.5} /> <span className="font-semibold">K</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Tooltip hint */}
          <AnimatePresence>
            {!isOpen && (isButtonHovering || !hasInteracted) && (
              <motion.div
                initial={{ opacity: 0, x: -10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="absolute pointer-events-none z-[10001]"
                style={{
                  left: 'calc(100% + 12px)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
                role="tooltip"
              >
                <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white text-[11px] font-bold px-3 py-2 rounded-lg shadow-2xl backdrop-blur-md border border-blue-400/50 whitespace-nowrap">
                  Quick Settings
                  <div className="absolute w-2 h-2 bg-blue-600 -left-1 top-1/2 -translate-y-1/2 rotate-45 border-l border-b border-blue-400/50" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded actions menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, height: 'auto', scale: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, scale: 0.9, y: -10 }}
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
                className="flex flex-col gap-1 overflow-hidden bg-black/95 backdrop-blur-xl rounded-lg border border-white/10 p-1.5 shadow-2xl origin-top min-w-[160px] will-change-auto"
                role="menu"
                aria-orientation="vertical"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                style={{ touchAction: 'manipulation', WebkitUserSelect: 'none' }}
              >
                {actionFlags.showPerformance && (
                  <ActionButton 
                    icon={<Zap size={18} strokeWidth={2.5} />}
                    label="GRAPHICS"
                    value={disableSpline ? "LITE" : "PRO"}
                    active={!disableSpline}
                    onClick={() => handleAction(onPerformanceToggle, 12)}
                    colorClass="text-orange-400"
                    ariaLabel={`Toggle graphics mode. Currently ${disableSpline ? 'lite' : 'pro'} mode`}
                  />
                )}

                {actionFlags.showMusic && (
                  <ActionButton 
                    icon={isPlaying ? (volume > 50 ? <Volume2 size={18} strokeWidth={2.5} /> : <Volume1 size={18} strokeWidth={2.5} />) : <VolumeX size={18} strokeWidth={2.5} />}
                    label="AUDIO"
                    value={isPlaying ? `${Math.round(volume)}%` : "OFF"}
                    active={isPlaying}
                    onClick={() => handleAction(onMusicToggle, 10)}
                    colorClass="text-emerald-400"
                    ariaLabel={`Toggle audio. Currently ${isPlaying ? 'on' : 'off'}`}
                  />
                )}

                {actionFlags.showTheme && (
                  <ActionButton 
                    icon={<Palette size={18} strokeWidth={2.5} />}
                    label="INTERFACE"
                    value="THEME"
                    active={true}
                    onClick={() => handleAction(onThemeClick, 10)}
                    colorClass="text-purple-400"
                    ariaLabel="Open theme selector"
                  />
                )}

                {actionFlags.showControlCenter && (
                  <ActionButton
                    icon={<Activity size={18} strokeWidth={2.5} />}
                    label="DEVICE"
                    value="INFO"
                    active={true}
                    onClick={() => handleAction(onControlCenterToggle, 12)}
                    colorClass="text-cyan-400"
                    ariaLabel="Open device control panel"
                  />
                )}

                {actionFlags.showHelp && (
                  <ActionButton
                    icon={<MessageCircle size={18} strokeWidth={2.5} />}
                    label="SYSTEM"
                    value="HELP"
                    active={true}
                    onClick={() => handleAction(onHelpClick, 10)}
                    colorClass="text-blue-400"
                    ariaLabel="Open help dialog"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick: () => void;
  colorClass: string;
  active: boolean;
  ariaLabel?: string;
}

const ActionButton = React.memo(({
  icon,
  label,
  value,
  onClick,
  colorClass,
  active,
  ariaLabel
}: ActionButtonProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      whileHover={prefersReducedMotion ? {} : { x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
      onTap={onClick}
      onTouchStart={(e) => {
        e.stopPropagation();
        e.currentTarget.style.transform = 'scale(0.97)';
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        e.currentTarget.style.transform = '';
      }}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-200 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black min-h-[44px] touch-manipulation will-change-auto"
      type="button"
      role="menuitem"
      aria-label={ariaLabel}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', WebkitUserSelect: 'none' }}
    >
      {/* Icon container */}
      <div className={`p-2 rounded-lg bg-white/5 border border-white/10 shadow-inner transition-all duration-200 ${active ? colorClass : 'text-gray-600'} group-hover:bg-white/10`}>
        {icon}
      </div>
      
      {/* Text content */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[9px] text-white/40 font-mono leading-none mb-1.5 uppercase tracking-wider font-semibold">
          {label}
        </span>
        <span className={`text-xs font-bold font-mono truncate ${active ? 'text-white' : 'text-gray-600'}`}>
          {value}
        </span>
      </div>
      
      {/* Status indicator */}
      <div 
        className={`flex-shrink-0 w-2 h-2 rounded-full transition-all duration-300 ${
          active 
            ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)] ring-2 ring-emerald-500/30' 
            : 'bg-gray-700 border border-gray-600'
        }`}
        aria-hidden="true"
      />
    </motion.button>
  );
});

ActionButton.displayName = 'ActionButton';