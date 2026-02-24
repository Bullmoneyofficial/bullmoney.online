export type BackgroundEffect =
  | 'spline'
  | 'liquidEther'
  | 'darkVeil'
  | 'lightPillar'
  | 'gridScan'
  | 'galaxy'
  | 'letterGlitch'
  | 'ballpit'
  | 'gridDistortion'
  | 'terminal';

export const SPLINE_SCENES = [
  '/scene.splinecode',
  '/scene1.splinecode',
  '/scene2.splinecode',
  '/scene3.splinecode',
  '/scene4.splinecode',
  '/scene5.splinecode',
  '/scene6.splinecode',
];

export const SPLINE_SCENE_NAMES: Record<string, string> = {
  '/scene.splinecode': 'Default Scene',
  '/scene1.splinecode': 'Scene 1',
  '/scene2.splinecode': 'Scene 2',
  '/scene3.splinecode': 'Scene 3',
  '/scene4.splinecode': 'Scene 4',
  '/scene5.splinecode': 'Scene 5',
  '/scene6.splinecode': 'Scene 6',
};

export const SECTION_NAV_ITEMS = [
  { id: 'hero', label: 'Home', icon: '✦', bg: 'rgba(255,255,255,0.06)' },
  { id: 'bullmoney-community', label: 'Community', icon: '💬', bg: 'rgba(59,130,246,0.12)' },
  { id: 'metatrader-quotes', label: 'Live Quotes', icon: '📊', bg: 'rgba(34,197,94,0.12)' },
  { id: 'bullmoney-promo', label: 'Promo', icon: '🔥', bg: 'rgba(249,115,22,0.12)' },
  { id: 'features', label: 'Features', icon: '⚡', bg: 'rgba(168,85,247,0.12)' },
  { id: 'testimonials', label: 'Testimonials', icon: '⭐', bg: 'rgba(234,179,8,0.12)' },
  { id: 'ticker', label: 'Market Ticker', icon: '📈', bg: 'rgba(6,182,212,0.12)' },
] as const;

export const ALL_EFFECTS: BackgroundEffect[] = [
  'gridScan',
  'spline',
  'liquidEther',
  'galaxy',
  'terminal',
  'darkVeil',
  'lightPillar',
  'letterGlitch',
  'ballpit',
  'gridDistortion',
];

export const EFFECT_NAMES: Record<BackgroundEffect, string> = {
  spline: '3D Spline Scene',
  liquidEther: 'Liquid Ether',
  galaxy: 'Galaxy Stars',
  terminal: 'Matrix Terminal',
  darkVeil: 'Dark Veil',
  lightPillar: 'Light Pillar',
  letterGlitch: 'Letter Glitch',
  gridScan: 'Grid Scan',
  ballpit: 'Ball Pit',
  gridDistortion: 'Grid Distortion',
};
