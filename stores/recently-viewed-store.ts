'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// RECENTLY VIEWED STORE - ZUSTAND WITH LOCAL STORAGE PERSISTENCE
// ============================================================================

export interface RecentlyViewedItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  category?: string;
  viewedAt: string;
}

interface RecentlyViewedStore {
  items: RecentlyViewedItem[];
  addItem: (item: Omit<RecentlyViewedItem, 'viewedAt'>) => void;
  clearAll: () => void;
  getItems: (limit?: number) => RecentlyViewedItem[];
}

const MAX_ITEMS = 20;

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          // Remove if already exists then prepend
          const filtered = state.items.filter((i) => i.productId !== item.productId);
          const newItems = [{ ...item, viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_ITEMS);
          return { items: newItems };
        });
      },

      clearAll: () => set({ items: [] }),

      getItems: (limit = 10) => {
        return get().items.slice(0, limit);
      },
    }),
    {
      name: 'bullmoney-recently-viewed',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
