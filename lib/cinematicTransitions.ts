/**
 * Cinematic Transitions & Micro-interactions
 * Makes the app feel smooth and polished like a native app
 */

// Haptic feedback (works on mobile)
let lastHapticAt = 0;
const HAPTIC_COOLDOWN_MS = 80;

const canUseHaptics = () => {
  if (typeof window === 'undefined') return false;
  if (!('navigator' in window)) return false;
  if (typeof navigator.vibrate !== 'function') return false;
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  return true;
};

const runHaptic = (pattern: number | number[]) => {
  if (!canUseHaptics()) return false;

  const now = Date.now();
  if (now - lastHapticAt < HAPTIC_COOLDOWN_MS) return false;
  lastHapticAt = now;

  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
};

export const haptic = {
  isSupported: () => canUseHaptics(),
  light: () => {
    return runHaptic(8);
  },
  medium: () => {
    return runHaptic(14);
  },
  heavy: () => {
    return runHaptic([18, 12, 18]);
  },
  success: () => {
    return runHaptic([10, 30, 10]);
  },
  error: () => {
    return runHaptic([22, 40, 22]);
  },
  selection: () => {
    return runHaptic(6);
  },
  notification: (type: 'success' | 'error' | 'info' = 'info') => {
    if (type === 'success') return runHaptic([10, 28, 10]);
    if (type === 'error') return runHaptic([25, 45, 25]);
    return runHaptic(10);
  },
};

// Smooth scroll to element with easing
export const smoothScrollTo = (element: HTMLElement | null, options?: { offset?: number; duration?: number }) => {
  if (!element) return;

  const offset = options?.offset || 0;
  const duration = options?.duration || 600;
  const start = window.scrollY;
  const targetPosition = element.getBoundingClientRect().top + start - offset;
  const distance = targetPosition - start;
  let startTime: number | null = null;

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = easeInOutCubic(progress);

    window.scrollTo(0, start + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

// Page transition animations
export const pageTransitions = {
  crossfade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
  slideUp: {
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -50, opacity: 0 },
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }, // Ease out cubic
  },
  slideLeft: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  scale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.05, opacity: 0 },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  blur: {
    initial: { filter: 'blur(10px)', opacity: 0 },
    animate: { filter: 'blur(0px)', opacity: 1 },
    exit: { filter: 'blur(10px)', opacity: 0 },
    transition: { duration: 0.4 },
  },
};

// Stagger animations for lists
export const staggerAnimation = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  },
};

// Button press animation
export const buttonPress = {
  tap: { scale: 0.95 },
  hover: { scale: 1.02 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};

// Card hover effect
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  tap: { scale: 0.98 },
};

// Modal animations
export const modalAnimation = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  content: {
    initial: { scale: 0.9, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.95, opacity: 0, y: 10 },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

// Skeleton to content morph animation
export const morphAnimation = {
  initial: { scale: 1.02, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

// Spring presets
export const springs = {
  gentle: { type: 'spring' as const, stiffness: 100, damping: 15 },
  responsive: { type: 'spring' as const, stiffness: 300, damping: 20 },
  snappy: { type: 'spring' as const, stiffness: 400, damping: 17 },
  bouncy: { type: 'spring' as const, stiffness: 200, damping: 10 },
};

// Easing functions
export const easings = {
  // Material Design easings
  standard: [0.4, 0.0, 0.2, 1],
  decelerate: [0.0, 0.0, 0.2, 1],
  accelerate: [0.4, 0.0, 1, 1],
  sharp: [0.4, 0.0, 0.6, 1],

  // Custom smooth easings
  smoothOut: [0.22, 1, 0.36, 1], // Ease out cubic
  smoothIn: [0.55, 0.055, 0.675, 0.19], // Ease in cubic
  smoothInOut: [0.645, 0.045, 0.355, 1], // Ease in-out cubic

  // Bounce
  bounceOut: [0.34, 1.56, 0.64, 1],
};

// Optimistic UI helper
export const optimisticUpdate = <T,>(
  currentData: T,
  update: Partial<T>,
  asyncFn: () => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: Error, previousData: T) => void
) => {
  const previousData = currentData;
  const optimisticData = { ...currentData, ...update };

  // Return optimistic data immediately
  setTimeout(() => {
    asyncFn()
      .then((result) => {
        if (onSuccess) onSuccess(result);
      })
      .catch((error) => {
        if (onError) onError(error, previousData);
      });
  }, 0);

  return optimisticData;
};

// Instant feedback on user interaction
export const instantFeedback = (element: HTMLElement, type: 'success' | 'error' | 'press' = 'press') => {
  const animations = {
    success: [
      { transform: 'scale(1)', background: 'rgba(34, 197, 94, 0.1)' },
      { transform: 'scale(0.95)', background: 'rgba(34, 197, 94, 0.2)' },
      { transform: 'scale(1)', background: 'rgba(34, 197, 94, 0)' },
    ],
    error: [
      { transform: 'translateX(0px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(0px)' },
    ],
    press: [
      { transform: 'scale(1)' },
      { transform: 'scale(0.95)' },
      { transform: 'scale(1)' },
    ],
  };

  element.animate(animations[type], {
    duration: type === 'error' ? 400 : 200,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  });

  if (type === 'success') haptic.success();
  if (type === 'error') haptic.error();
  if (type === 'press') haptic.light();
};

// Preload next page on hover/touch
const preloadedPages = new Set<string>();

export const preloadOnHover = (href: string) => {
  if (preloadedPages.has(href)) return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);

  preloadedPages.add(href);
};

// Performance-aware animations (reduce on low-end devices)
export const shouldAnimate = () => {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return false;

  // Check device performance
  const memory = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;

  if (memory && memory < 4) return false;
  if (cores && cores < 4) return false;

  return true;
};

// Get animation config based on device capability
export const getAnimationConfig = () => {
  const canAnimate = shouldAnimate();

  return {
    enabled: canAnimate,
    duration: canAnimate ? 1 : 0,
    ease: canAnimate ? easings.smoothOut : 'linear',
  };
};
