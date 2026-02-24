// ─── Hero carousel configuration ─────────────────────────────────────────────

export const HERO_SLIDE_DURATION = 6; // seconds between auto-advance
export const HERO_CACHE_KEY = 'hero_store_slide_v1';
export const HERO_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

export const HERO_CAROUSEL_SLIDES = [
  { type: 'image' as const, src: '/bullmoney-logo.png', alt: 'BullMoney logo' },
  { type: 'image' as const, src: '/bullmoneyvantage.png', alt: 'BullMoney Vantage' },
  { type: 'image' as const, src: '/Fvfront.png', alt: 'BullMoney product front' },
  { type: 'image' as const, src: '/IMG_2921.PNG', alt: 'BullMoney mark' },
  { type: 'image' as const, src: '/Img1.jpg', alt: 'BullMoney product preview' },
  { type: 'video' as const, src: '/newhero.mp4', poster: '/Img1.jpg' },
  { type: 'world-map' as const },
  { type: 'spline' as const, scene: '/scene1.splinecode' },
  { type: 'spline' as const, scene: '/scene3.splinecode' },
] as const;

export const HERO_IMAGE_INDICES = HERO_CAROUSEL_SLIDES
  .map((slide, index) => (slide.type === 'image' ? index : -1))
  .filter((index) => index >= 0);

export const FIRST_HERO_IMAGE_INDEX = HERO_IMAGE_INDICES[0] ?? 0;

export const HERO_VIDEO_INDICES = HERO_CAROUSEL_SLIDES
  .map((slide, index) => (slide.type === 'video' ? index : -1))
  .filter((index) => index >= 0);

export const FIRST_HERO_VIDEO_INDEX = HERO_VIDEO_INDICES[0] ?? 0;

// ─── World map route dots ─────────────────────────────────────────────────────

export const HERO_WORLD_MAP_DOTS = [
  {
    start: { lat: 40.7128, lng: -74.006, label: 'New York' },
    end: { lat: 51.5074, lng: -0.1278, label: 'London' },
    color: '#00D4FF',
  },
  {
    start: { lat: 1.3521, lng: 103.8198, label: 'Singapore' },
    end: { lat: 25.2048, lng: 55.2708, label: 'Dubai' },
    color: '#00FFA3',
  },
  {
    start: { lat: 35.6762, lng: 139.6503, label: 'Tokyo' },
    end: { lat: 37.7749, lng: -122.4194, label: 'San Francisco' },
    color: '#FF6B35',
  },
] as const;

// ─── Hero type probability weights (currently not used in runtime — kept for reference) ──
export const HERO_TYPE_WEIGHTS = {
  'world-map': 0.6,
  spline: 0.3,
  image: 0.03,
  video: 0.07,
} as const;
