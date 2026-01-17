// localStorage utility functions for client-side storage

const getBrowserStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const setItem = (key: string, value: any): void => {
  const storage = getBrowserStorage();
  if (!storage) return;
  try {
    const serialized = JSON.stringify(value);
    storage.setItem(key, serialized);
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

export const getItem = <T = any>(key: string, defaultValue?: T): T | null => {
  const storage = getBrowserStorage();
  if (!storage) return defaultValue ?? null;
  try {
    const item = storage.getItem(key);
    if (item === null) return defaultValue ?? null;
    
    // Try to parse as JSON, but fall back to returning the string if it fails
    // This handles both JSON objects/arrays and plain string values
    try {
      return JSON.parse(item) as T;
    } catch (parseError) {
      // If JSON parsing fails, return the raw string value
      // This handles cases where plain strings were stored directly
      return item as T;
    }
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return defaultValue ?? null;
  }
};

export const removeItem = (key: string): void => {
  const storage = getBrowserStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch (error) {
    console.error("Error removing from localStorage:", error);
  }
};

export const clear = (): void => {
  const storage = getBrowserStorage();
  if (!storage) return;
  try {
    storage.clear();
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};

export const hasItem = (key: string): boolean => {
  const storage = getBrowserStorage();
  if (!storage) return false;
  return storage.getItem(key) !== null;
};

// Alias exports for backward compatibility
export const safeGetItem = getItem;
export const safeSetItem = setItem;

const storageUtils = {
  setItem,
  getItem,
  removeItem,
  clear,
  hasItem,
  safeGetItem,
  safeSetItem,
};

export default storageUtils;
