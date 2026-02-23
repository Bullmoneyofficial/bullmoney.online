// Splash screen timing configuration

/** Minimum time (ms) the splash is always shown — prevents flicker on fast loads. */
export const SPLASH_MIN_MS = 600;

/** Fade-out animation duration (ms). */
export const SPLASH_FADE_MS = 950;

/**
 * Fallback dismiss time (ms) for pages that have NO Spline scene.
 * Matches the old fixed delay so non-Spline routes still feel snappy.
 */
export const SPLASH_FALLBACK_MS = 1800;

/**
 * Absolute maximum wait (ms) for pages WITH a Spline scene.
 * If Spline hasn't fired onLoad by this point, dismiss anyway.
 */
export const SPLASH_MAX_MS = 8000;

export const SPLASH_IMAGE_SRC = '/IMG_2921.PNG';
export const SPLASH_IMAGE_ALT = 'BullMoney';
export const SPLASH_IMAGE_SIZE = 380; // px
