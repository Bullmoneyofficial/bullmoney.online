export const SPLINE_CACHE_VERSION = 'v2';

const buildName = (prefix: string) => `bullmoney-${prefix}-${SPLINE_CACHE_VERSION}`;

export const HERO_CACHE = buildName('hero-instant');
export const STANDARD_CACHE = buildName('spline');
export const WEBVIEW_CACHE = buildName('webview');
export const PREFETCH_CACHE = buildName('spline-prefetch');
export const WEBVIEW_PREFETCH_CACHE = buildName('webview-prefetch');

export const getCacheName = (options: { scope?: 'hero' | 'standard'; webview?: boolean; prefetch?: boolean }) => {
  if (options.prefetch && options.webview) return WEBVIEW_PREFETCH_CACHE;
  if (options.prefetch) return PREFETCH_CACHE;
  if (options.webview) return WEBVIEW_CACHE;
  if (options.scope === 'hero') return HERO_CACHE;
  return STANDARD_CACHE;
};

export const MIN_SCENE_BLOB_SIZE = 512;
export const isValidSplineBlob = (blob: Blob) => Boolean(blob && blob.size >= MIN_SCENE_BLOB_SIZE);
