/**
 * MobileOptimizedModal
 * 
 * A performance-optimized modal wrapper that automatically:
 * - Uses faster animations on mobile
 * - Disables expensive effects (blur, shadows) on low-end devices
 * - Provides proper body scroll locking
 * - Handles iOS safe areas
 * - Uses portal rendering for z-index isolation
 */

'use client';

import React, { useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence, TargetAndTransition } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface MobileOptimizedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  
  // Styling
  className?: string;
  contentClassName?: string;
  backdropClassName?: string;
  
  // Behavior
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  lockScroll?: boolean;
  
  // Size presets
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  // Position
  position?: 'center' | 'bottom' | 'top';
  
  // Animation override
  disableAnimation?: boolean;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

// ============================================================================
// SIZE CLASSES
// ============================================================================

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg', 
  xl: 'max-w-xl',
  full: 'max-w-full w-full h-full',
};

const POSITION_CLASSES = {
  center: 'items-center justify-center',
  bottom: 'items-end justify-center',
  top: 'items-start justify-center pt-20',
};

// ============================================================================
// BODY SCROLL LOCK
// ============================================================================

let scrollLockCount = 0;
let originalOverflow = '';
let originalPaddingRight = '';

function lockBodyScroll() {
  if (typeof window === 'undefined') return;
  
  if (scrollLockCount === 0) {
    originalOverflow = document.body.style.overflow;
    originalPaddingRight = document.body.style.paddingRight;
    
    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    
    // iOS fix
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
  }
  scrollLockCount++;
}

function unlockBodyScroll() {
  if (typeof window === 'undefined') return;
  
  scrollLockCount--;
  if (scrollLockCount === 0) {
    document.body.style.overflow = originalOverflow;
    document.body.style.paddingRight = originalPaddingRight;
    
    // iOS fix cleanup
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      document.body.style.position = '';
      document.body.style.width = '';
    }
  }
}

// ============================================================================
// MODAL COMPONENT
// ============================================================================

export const MobileOptimizedModal = memo(function MobileOptimizedModal({
  isOpen,
  onClose,
  children,
  className,
  contentClassName,
  backdropClassName,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  lockScroll = true,
  size = 'md',
  position = 'center',
  disableAnimation = false,
  ariaLabel,
  ariaDescribedBy,
}: MobileOptimizedModalProps) {
  const {
    isMobile,
    isLowEnd,
    animations,
    shouldDisableBackdropBlur,
    performanceTier,
  } = useMobilePerformance();
  
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  
  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);
  
  // Handle body scroll lock
  useEffect(() => {
    if (!lockScroll) return;
    
    if (isOpen) {
      lockBodyScroll();
    }
    
    return () => {
      if (isOpen) {
        unlockBodyScroll();
      }
    };
  }, [isOpen, lockScroll]);
  
  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    
    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    // Focus first element
    firstElement?.focus();
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    modal.addEventListener('keydown', handleTab);
    return () => modal.removeEventListener('keydown', handleTab);
  }, [isOpen]);
  
  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);
  
  // Determine if should animate
  const shouldAnimate = !disableAnimation && performanceTier !== 'minimal';
  
  // Get animation variants - cast to proper framer-motion types
  const backdropVariants = shouldAnimate ? animations.modalBackdrop : {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 },
    transition: { duration: 0 },
  };
  
  const contentVariants = shouldAnimate ? animations.modalContent : {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 },
    transition: { duration: 0 },
  };
  
  // Determine backdrop style based on device capabilities
  const backdropStyle = shouldDisableBackdropBlur 
    ? 'bg-black/80' 
    : 'bg-black/60 backdrop-blur-md';
  
  // Modal content
  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          className={cn(
            'fixed inset-0 z-[9999] flex',
            POSITION_CLASSES[position],
            backdropStyle,
            'mobile-no-blur', // CSS utility class for mobile
            backdropClassName
          )}
          initial={backdropVariants.initial as TargetAndTransition}
          animate={backdropVariants.animate as TargetAndTransition}
          exit={backdropVariants.exit as TargetAndTransition}
          transition={backdropVariants.transition}
          onClick={handleBackdropClick}
          data-modal-backdrop
          data-performance-tier={performanceTier}
        >
          <motion.div
            ref={modalRef}
            key="modal-content"
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            className={cn(
              'relative w-full mx-4 my-4',
              SIZE_CLASSES[size],
              size !== 'full' && 'rounded-2xl',
              'bg-neutral-900/95 border border-white/10',
              isLowEnd ? '' : 'shadow-2xl',
              'overflow-hidden',
              'gpu-accelerated', // CSS utility class
              isMobile && 'mobile-simple-bg',
              contentClassName,
              className
            )}
            initial={contentVariants.initial as TargetAndTransition}
            animate={contentVariants.animate as TargetAndTransition}
            exit={contentVariants.exit as TargetAndTransition}
            transition={contentVariants.transition}
            onClick={(e) => e.stopPropagation()}
            data-modal-content
            data-state="open"
          >
            {/* Safe area padding for iOS */}
            <div className={cn(
              'max-h-[85vh] overflow-y-auto',
              isMobile && 'pb-safe'
            )}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  
  // Render in portal
  if (!mounted) return null;
  
  return createPortal(modalContent, document.body);
});

// ============================================================================
// PRESET MODAL VARIANTS
// ============================================================================

/**
 * Bottom sheet style modal - great for mobile
 */
export const BottomSheetModal = memo(function BottomSheetModal(
  props: Omit<MobileOptimizedModalProps, 'position'>
) {
  return <MobileOptimizedModal {...props} position="bottom" />;
});

/**
 * Full screen modal
 */
export const FullScreenModal = memo(function FullScreenModal(
  props: Omit<MobileOptimizedModalProps, 'size'>
) {
  return <MobileOptimizedModal {...props} size="full" />;
});

// ============================================================================
// SIMPLE MODAL HOOK
// ============================================================================

export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = React.useState(initialState);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return { isOpen, open, close, toggle };
}

export default MobileOptimizedModal;
