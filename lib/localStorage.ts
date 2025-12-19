const IN_APP_BROWSER_REGEX = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|Line|TikTok|Twitter|Snapchat|LinkedInApp/i;
const STORAGE_KEY_PREFIX = 'bullmoney.';

let cachedStorage: Storage | null | undefined;

const resolveStorageDriver = (): Storage | null => {
  if (cachedStorage !== undefined) return cachedStorage;
  if (typeof window === 'undefined') {
    cachedStorage = null;
    return null;
  }

  try {
    const ua = navigator.userAgent || '';
    const prefersSession = IN_APP_BROWSER_REGEX.test(ua);

    if (prefersSession && 'sessionStorage' in window) {
      cachedStorage = window.sessionStorage;
      return cachedStorage;
    }

    if ('localStorage' in window) {
      cachedStorage = window.localStorage;
      return cachedStorage;
    }
  } catch (error) {
    console.warn('Storage driver unavailable', error);
  }

  cachedStorage = null;
  return null;
};

export const getStorageDriver = () => resolveStorageDriver();

export const getStorageType = () => {
  const storage = resolveStorageDriver();
  if (!storage) return 'none';
  if (typeof window !== 'undefined' && storage === window.sessionStorage) return 'session';
  return 'local';
};

const getNamespacedKey = (key: string) => `${STORAGE_KEY_PREFIX}${key}`;

export const safeGetItem = (key: string): string | null => {
  const storage = resolveStorageDriver();
  if (!storage) return null;
  try {
    return storage.getItem(getNamespacedKey(key));
  } catch (error) {
    console.warn(`safeGetItem blocked for ${key}`, error);
    return null;
  }
};

export const safeSetItem = (key: string, value: string) => {
  const storage = resolveStorageDriver();
  if (!storage) return;
  try {
    storage.setItem(getNamespacedKey(key), value);
  } catch (error) {
    console.warn(`safeSetItem blocked for ${key}`, error);
  }
};

export const safeRemoveItem = (key: string) => {
  const storage = resolveStorageDriver();
  if (!storage) return;
  try {
    storage.removeItem(getNamespacedKey(key));
  } catch (error) {
    console.warn(`safeRemoveItem blocked for ${key}`, error);
  }
};
