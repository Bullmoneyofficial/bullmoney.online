import { createJSONStorage, type StateStorage } from 'zustand/middleware';

const memoryStore = new Map<string, string>();

const memoryStorage: StateStorage = {
  getItem: (name) => memoryStore.get(name) ?? null,
  setItem: (name, value) => {
    memoryStore.set(name, value);
  },
  removeItem: (name) => {
    memoryStore.delete(name);
  },
};

const getBrowserStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;

  try {
    const testKey = '__bm_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    try {
      const testKey = '__bm_storage_test__';
      window.sessionStorage.setItem(testKey, '1');
      window.sessionStorage.removeItem(testKey);
      return window.sessionStorage;
    } catch {
      return null;
    }
  }
};

export const createSafeJSONStorage = () =>
  createJSONStorage(() => getBrowserStorage() ?? memoryStorage);
