// Splash screen timing configuration

/**
 * Minimum time (ms) the splash is always shown.
 * Must be >= full hero animation duration:
 *   glass slide (900ms) + typewriter (26 chars × 30ms = 780ms) = 1680ms
 *   + 720ms breathing room = 2400ms
 */
export const SPLASH_MIN_MS = 2400;

/** Fade-out animation duration (ms). */
export const SPLASH_FADE_MS = 950;

/**
 * Fallback dismiss time (ms) for pages that have NO Spline scene.
 * Must be > SPLASH_MIN_MS so the animation always completes first.
 */
export const SPLASH_FALLBACK_MS = 2800;

/**
 * Absolute maximum wait (ms) for pages WITH a Spline scene.
 * If Spline hasn't fired onLoad by this point, dismiss anyway.
 */
export const SPLASH_MAX_MS = 8000;

export const SPLASH_IMAGE_SRC = '/IMG_2921.PNG';
export const SPLASH_IMAGE_ALT = 'BullMoney';
export const SPLASH_IMAGE_SIZE = 380; // px
