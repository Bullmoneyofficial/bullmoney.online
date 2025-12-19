const hasLocalStorage = () => {
  if (typeof window === 'undefined') return false;
  try {
    return !!window.localStorage;
  } catch (error) {
    console.warn('LocalStorage access blocked (read/write).', error);
    return false;
  }
};

export const safeGetItem = (key: string): string | null => {
  if (!hasLocalStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn(`safeGetItem blocked for ${key}`, error);
    return null;
  }
};

export const safeSetItem = (key: string, value: string) => {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`safeSetItem blocked for ${key}`, error);
  }
};

export const safeRemoveItem = (key: string) => {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`safeRemoveItem blocked for ${key}`, error);
  }
};
