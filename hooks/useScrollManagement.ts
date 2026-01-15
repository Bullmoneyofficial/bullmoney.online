import { useEffect, useRef } from 'react';

interface UseScrollManagementProps {
  scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  setParallaxOffset: (value: number) => void;
  setShowOrientationWarning: (value: boolean) => void;
  orientationDismissedRef: React.MutableRefObject<boolean>;
  prefersReducedMotionRef: React.MutableRefObject<boolean>;
  isTouchRef: React.MutableRefObject<boolean>;
  isTouch: boolean;
  contentMounted: boolean;
}

/**
 * Manages scroll behavior, pull-to-refresh prevention, and orientation warnings
 */
export function useScrollManagement({
  scrollContainerRef,
  setParallaxOffset,
  setShowOrientationWarning,
  orientationDismissedRef,
  prefersReducedMotionRef,
  isTouchRef,
  isTouch,
  contentMounted,
}: UseScrollManagementProps) {
  const touchStartRef = useRef(0);

  useEffect(() => {
    if (!contentMounted) return;

    // Prevent page reloads on mobile browsers
    const handleTouchStart = (e: TouchEvent) => {
      const scrollable = (e.target as HTMLElement)?.closest('.mobile-scroll');
      if (scrollable && e.touches.length > 0 && e.touches[0]) {
        touchStartRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const scrollable = (e.target as HTMLElement)?.closest('.mobile-scroll');
      if (!scrollable || e.touches.length === 0) return;

      const touch = e.touches[0];
      if (!touch) return;

      const currentY = touch.clientY;
      const isPullingDown = currentY - touchStartRef.current > 0;
      if (scrollable.scrollTop <= 0 && isPullingDown) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    // FIXED: Only set overscroll behavior on mobile to prevent scroll issues on desktop
    const isMobileDevice = window.innerWidth < 768;
    const originalOverscrollBehavior = document.body.style.overscrollBehavior;
    if (isMobileDevice) {
      document.body.style.overscrollBehavior = 'contain';
    }

    // Optimized 60fps scroll handler
    let rafId: number | null = null;
    let lastScrollTime = 0;
    let ticking = false;

    const handleScroll = () => {
      if (prefersReducedMotionRef.current) return;
      // Disable parallax on touch devices to prevent crashes
      if (isTouchRef.current || isTouch) return;

      const now = performance.now();
      if (now - lastScrollTime < 16.67) return;
      lastScrollTime = now;

      if (!ticking) {
        if (rafId !== null) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
          const scrollTop = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : window.scrollY;
          setParallaxOffset(scrollTop);
          ticking = false;
          rafId = null;
        });

        ticking = true;
      }
    };

    const scrollElement = scrollContainerRef.current || window;
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });

    // Layout check for orientation warnings
    const checkLayout = () => {
      const isNarrow = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      if (isNarrow && isPortrait) {
        if (!orientationDismissedRef.current) {
          setShowOrientationWarning(true);
        }
      } else {
        setShowOrientationWarning(false);
      }
    };

    checkLayout();
    handleScroll();
    window.addEventListener('resize', checkLayout);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkLayout);
      scrollElement.removeEventListener('scroll', handleScroll);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      // Only restore overscroll behavior if we changed it (mobile only)
      if (isMobileDevice) {
        document.body.style.overscrollBehavior = originalOverscrollBehavior;
      }

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  }, [contentMounted, isTouch]);
}
