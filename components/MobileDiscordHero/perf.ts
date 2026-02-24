export const IS_MOBILE =
  typeof window !== 'undefined' &&
  (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768);

export const MOBILE_DPR = IS_MOBILE
  ? Math.min(window.devicePixelRatio, 1)
  : typeof window !== 'undefined'
    ? Math.min(window.devicePixelRatio, 2)
    : 1;

export const MOBILE_TARGET_FPS = IS_MOBILE ? 30 : 60;
export const MOBILE_FRAME_INTERVAL = 1000 / MOBILE_TARGET_FPS;
