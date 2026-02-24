/** Category → emoji icon mapping */
export const ICONS: Record<string, string> = {
  markets: "📊",
  stocks: "📈",
  forex: "💱",
  crypto: "₿",
  commodities: "🛢️",
  geopolitics: "🌍",
  economics: "🏛️",
  tech: "💻",
} as const;

/** Default icon for unknown categories */
export const DEFAULT_ICON = "📰";

/** Scroll resume delay after user interaction (ms) */
export const SCROLL_RESUME_DELAY = 3000;

/** Remote search debounce timeout (ms) */
export const SEARCH_DEBOUNCE_MS = 800;

/** Minimum query length for remote search */
export const MIN_SEARCH_LENGTH = 2;

/** Fetch guard margin (ms) - prevents fetch if within this of last fetch */
export const FETCH_GUARD_MS = 2000;

/** Mobile config */
export const MOBILE_CONFIG = {
  scrollSpeed: 0.5,
  fetchInterval: 60000,
  duplicateCount: 2,
} as const;

/** Desktop config */
export const DESKTOP_CONFIG = {
  scrollSpeed: 1,
  fetchInterval: 45000,
  duplicateCount: 3,
} as const;
