// ─── Grid layout variants ─────────────────────────────────────────────────────

export const GRID_VARIANTS = [
  { value: 'spotlight', label: 'Spotlight', group: 'Featured' },
  { value: 'animated', label: 'Animated grid', group: 'Featured' },
  { value: 'snug', label: 'Snug grid', group: 'Featured' },
  { value: 'compact-2', label: 'Compact tight', group: 'Featured' },
  { value: 'circular', label: 'Circular grid', group: 'Dynamic' },
  { value: 'glass', label: 'Glass grid', group: 'Dynamic' },
  { value: 'carousel', label: 'Carousel', group: 'Dynamic' },
  { value: 'compact', label: 'Compact grid', group: 'Classic' },
  { value: 'masonry', label: 'Masonry columns', group: 'Classic' },
  { value: 'list', label: 'List stack', group: 'Classic' },
  { value: 'stacked', label: 'Stacked hero', group: 'Classic' },
  { value: 'tiles', label: 'Tile wall', group: 'Classic' },
  { value: 'micro', label: 'Micro tiles', group: 'Compact' },
  { value: 'dense', label: 'Dense grid', group: 'Compact' },
  { value: 'wide', label: 'Wide cards', group: 'Layout' },
  { value: 'center', label: 'Centered grid', group: 'Layout' },
  { value: 'split', label: 'Split layout', group: 'Layout' },
  { value: 'gallery', label: 'Gallery flow', group: 'Layout' },
  { value: 'ribbon', label: 'Ribbon row', group: 'Layout' },
  { value: 'shelves', label: 'Shelves', group: 'Layout' },
  { value: 'glow', label: 'Glow grid', group: 'Style' },
  { value: 'stripe', label: 'Striped list', group: 'Style' },
  { value: 'edge', label: 'Edge borders', group: 'Style' },
  { value: 'diagonal', label: 'Diagonal tilt', group: 'Style' },
  { value: 'panel', label: 'Panel grid', group: 'Style' },
  { value: 'frame', label: 'Framed cards', group: 'Style' },
  { value: 'shadow', label: 'Shadow stack', group: 'Style' },
  { value: 'borderless', label: 'Borderless', group: 'Style' },
  { value: 'mosaic', label: 'Mosaic', group: 'Layout' },
] as const;

export const GRID_VARIANT_GROUP_ORDER = [
  'Featured',
  'Dynamic',
  'Classic',
  'Compact',
  'Layout',
  'Style',
] as const;

export const GRID_VARIANT_GROUPS = GRID_VARIANTS.reduce<
  Record<string, (typeof GRID_VARIANTS)[number][]>
>((acc, variant) => {
  if (!acc[variant.group]) acc[variant.group] = [];
  acc[variant.group].push(variant);
  return acc;
}, {});

export type GridVariant = (typeof GRID_VARIANTS)[number]['value'];
