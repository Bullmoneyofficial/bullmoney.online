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

export interface CyclingBackgroundProps {
  reloadsPerCycle?: number; // Number of reloads before switching to next effect
  effects?: BackgroundEffect[];
  videoId?: string;
  videoLoading?: boolean;
  videoError?: boolean;
  onVideoError?: () => void;
  onOpenHub?: () => void;
  onOpenShop?: () => void;
  onOpenNewShop?: () => void;
}

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

// All available effects list for mapping favorites to indices
export const ALL_EFFECTS: BackgroundEffect[] = [
  'gridScan',
  'liquidEther',
  'galaxy',
  'terminal',
  'darkVeil',
  'lightPillar',
  'letterGlitch',
  'spline',
  'ballpit',
  'gridDistortion',
];
