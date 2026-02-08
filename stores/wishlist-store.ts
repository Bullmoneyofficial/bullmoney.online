'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabaseClient';
import { loadSession } from '@/lib/sessionPersistence';

// ============================================================================
// WISHLIST STORE - ZUSTAND WITH SQL + LOCAL STORAGE PERSISTENCE
// ============================================================================

export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  addedAt: string;
}

interface WishlistStore {
  items: WishlistItem[];
  _synced: boolean;
  addItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: Omit<WishlistItem, 'addedAt'>) => boolean; // returns new state (true = added)
  hasItem: (productId: string) => boolean;
  clearAll: () => void;
  getCount: () => number;
  syncFromSQL: (email: string) => Promise<void>;
  syncToSQL: (email: string)  => void;
}

// Helper: push a single add to SQL (fire-and-forget)
async function sqlAddWishlistItem(email: string, item: WishlistItem) {
  try {
    await supabase.from('store_wishlist').upsert({
      email,
      product_id: item.productId,
      product_name: item.name,
      product_slug: item.slug,
      product_price: item.price,
      product_image: item.image,
      created_at: item.addedAt,
    }, { onConflict: 'email,product_id' });
  } catch {}
}

async function sqlRemoveWishlistItem(email: string, productId: string) {
  try {
    await supabase.from('store_wishlist').delete().eq('email', email).eq('product_id', productId);
  } catch {}
}

// Get current user email from localStorage session
function getSessionEmail(): string | null {
  const session = loadSession();
  return session?.email || null;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      _synced: false,

      addItem: (item) => {
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) return state;
          const newItem = { ...item, addedAt: new Date().toISOString() };
          const email = getSessionEmail();
          if (email) sqlAddWishlistItem(email, newItem);
          return {
            items: [newItem, ...state.items],
          };
        });
      },

      removeItem: (productId) => {
        const email = getSessionEmail();
        if (email) sqlRemoveWishlistItem(email, productId);
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      toggleItem: (item) => {
        const exists = get().items.some((i) => i.productId === item.productId);
        if (exists) {
          get().removeItem(item.productId);
          return false;
        } else {
          get().addItem(item);
          return true;
        }
      },

      hasItem: (productId) => {
        return get().items.some((i) => i.productId === productId);
      },

      clearAll: () => {
        const email = getSessionEmail();
        if (email) {
          supabase.from('store_wishlist').delete().eq('email', email).then(() => {});
        }
        set({ items: [] });
      },

      getCount: () => get().items.length,

      // Pull wishlist from SQL and merge with local
      syncFromSQL: async (email: string) => {
        try {
          const { data, error } = await supabase
            .from('store_wishlist')
            .select('*')
            .eq('email', email)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            const sqlItems: WishlistItem[] = data.map((row: any) => ({
              productId: row.product_id,
              name: row.product_name,
              slug: row.product_slug,
              price: parseFloat(row.product_price) || 0,
              image: row.product_image,
              addedAt: row.created_at,
            }));

            // Merge: SQL is source of truth, but keep local items not in SQL
            const currentItems = get().items;
            const sqlIds = new Set(sqlItems.map(i => i.productId));
            const localOnly = currentItems.filter(i => !sqlIds.has(i.productId));

            // Push local-only items to SQL
            for (const item of localOnly) {
              sqlAddWishlistItem(email, item);
            }

            set({ items: [...sqlItems, ...localOnly], _synced: true });
          } else if (!error) {
            // No SQL items - push local items to SQL
            const currentItems = get().items;
            for (const item of currentItems) {
              sqlAddWishlistItem(email, item);
            }
            set({ _synced: true });
          }
        } catch {
          // SQL unavailable, keep using local
        }
      },

      syncToSQL: (email: string) => {
        // Batch push all local items to SQL
        const items = get().items;
        for (const item of items) {
          sqlAddWishlistItem(email, item);
        }
      },
    }),
    {
      name: 'bullmoney-wishlist',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
