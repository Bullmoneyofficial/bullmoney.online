// localStorage utility functions for client-side storage

export const setItem = (key: string, value: any): void => {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

export const getItem = <T = any>(key: string, defaultValue?: T): T | null => {
  if (typeof window === "undefined") return defaultValue ?? null;
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue ?? null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return defaultValue ?? null;
  }
};

export const removeItem = (key: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error removing from localStorage:", error);
  }
};

export const clear = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.clear();
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};

export const hasItem = (key: string): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(key) !== null;
};

// Alias exports for backward compatibility
export const safeGetItem = getItem;
export const safeSetItem = setItem;

export default {
  setItem,
  getItem,
  removeItem,
  clear,
  hasItem,
  safeGetItem,
  safeSetItem,
};
