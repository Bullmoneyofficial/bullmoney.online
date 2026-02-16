'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSafeJSONStorage } from '@/lib/zustandStorage';
import { supabase } from '@/lib/supabaseClient';
import { loadSession } from '@/lib/sessionPersistence';
import type { CartItem, ProductWithDetails, Variant, CartSummary } from '@/types/store';

// ============================================================================
// CART STORE - ZUSTAND WITH SQL + LOCAL STORAGE PERSISTENCE
// ============================================================================

// Get current user email from localStorage session
function getCartSessionEmail(): string | null {
  const session = loadSession();
  return session?.email || null;
}

function isVipCartProduct(product: ProductWithDetails): boolean {
  return Boolean((product as any).buy_url || (product as any)._source === 'vip' || (product.details as any)?.buy_url);
}

// SQL helpers (fire-and-forget)
async function sqlUpsertCartItem(email: string, item: CartItem) {
  try {
    await supabase.from('store_cart').upsert({
      email,
      item_id: item.id,
      product_data: item.product,
      variant_data: item.variant,
      quantity: item.quantity,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email,item_id' });
  } catch {}
}

async function sqlRemoveCartItem(email: string, itemId: string) {
  try {
    await supabase.from('store_cart').delete().eq('email', email).eq('item_id', itemId);
  } catch {}
}

async function sqlClearCart(email: string) {
  try {
    await supabase.from('store_cart').delete().eq('email', email);
  } catch {}
}

interface CartStore {
  // State
  items: CartItem[];
  isOpen: boolean;
  discountCode: string | null;
  discountAmount: number;
  _synced: boolean;
  vipShippingCharged: boolean;
  _vipShippingLoaded: boolean;
  
  // Actions
  addItem: (product: ProductWithDetails, variant: Variant, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setDiscountCode: (code: string | null, amount?: number) => void;
  setVipShippingCharged: (charged: boolean) => void;
  loadVipShippingSetting: () => Promise<void>;
  
  // Cart drawer
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getSummary: () => CartSummary;
  getItemById: (itemId: string) => CartItem | undefined;
  hasItem: (productId: string, variantId: string) => boolean;

  // SQL sync
  syncFromSQL: (email: string) => Promise<void>;
}

const TAX_RATE = 0.0875; // 8.75% tax
const FREE_SHIPPING_THRESHOLD = 150;
const STANDARD_SHIPPING = 9.99;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isOpen: false,
      discountCode: null,
      discountAmount: 0,
      _synced: false,
      vipShippingCharged: true,
      _vipShippingLoaded: false,

      setVipShippingCharged: (charged) => set({ vipShippingCharged: charged, _vipShippingLoaded: true }),

      loadVipShippingSetting: async () => {
        const state = get();
        if (state._vipShippingLoaded) return;
        try {
          const res = await fetch('/api/store/settings/vip-shipping', { cache: 'no-store' as RequestCache });
          const data = await res.json();
          if (res.ok && typeof data?.charged === 'boolean') {
            set({ vipShippingCharged: data.charged, _vipShippingLoaded: true });
          } else {
            set({ _vipShippingLoaded: true });
          }
        } catch {
          set({ _vipShippingLoaded: true });
        }
      },
      
      // Add item to cart
      addItem: (product, variant, quantity = 1) => {
        const itemId = `${product.id}-${variant.id}`;
        const vip = isVipCartProduct(product);
        
        set((state) => {
          const existingItemIndex = state.items.findIndex(item => item.id === itemId);
          
          if (existingItemIndex > -1) {
            // Update quantity if item exists
            const newItems = [...state.items];
            const newQuantity = newItems[existingItemIndex].quantity + quantity;
            
            // Check stock
            if (!vip && newQuantity > variant.inventory_count) {
              return { ...state, isOpen: true }; // Don't exceed stock, but open cart
            }
            
            newItems[existingItemIndex] = {
              ...newItems[existingItemIndex],
              quantity: newQuantity,
            };
            const email = getCartSessionEmail();
            if (email) sqlUpsertCartItem(email, newItems[existingItemIndex]);
            return { items: newItems, isOpen: true };
          }
          
          // Add new item
          if (!vip && quantity > variant.inventory_count) {
            return { ...state, isOpen: true }; // Don't exceed stock, but open cart
          }
          
          const newItem: CartItem = {
            id: itemId,
            product,
            variant,
            quantity,
          };
          const email = getCartSessionEmail();
          if (email) sqlUpsertCartItem(email, newItem);

          return {
            items: [...state.items, newItem],
            isOpen: true,
          };
        });
      },
      
      // Remove item from cart
      removeItem: (itemId) => {
        const email = getCartSessionEmail();
        if (email) sqlRemoveCartItem(email, itemId);
        set((state) => ({
          items: state.items.filter(item => item.id !== itemId),
        }));
      },
      
      // Update item quantity
      updateQuantity: (itemId, quantity) => {
        if (quantity < 1) {
          get().removeItem(itemId);
          return;
        }
        
        set((state) => {
          const itemIndex = state.items.findIndex(item => item.id === itemId);
          if (itemIndex === -1) return state;
          
          const item = state.items[itemIndex];
          const vip = isVipCartProduct(item.product);
          
          // Check stock
          if (!vip && quantity > item.variant.inventory_count) {
            return state;
          }
          
          const newItems = [...state.items];
          newItems[itemIndex] = { ...item, quantity };
          const email = getCartSessionEmail();
          if (email) sqlUpsertCartItem(email, newItems[itemIndex]);
          return { items: newItems };
        });
      },
      
      // Clear cart
      clearCart: () => {
        const email = getCartSessionEmail();
        if (email) sqlClearCart(email);
        set({ items: [], discountCode: null, discountAmount: 0 });
      },
      
      // Set discount code
      setDiscountCode: (code, amount = 0) => {
        set({ discountCode: code, discountAmount: amount });
      },
      
      // Cart drawer controls
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      
      // Get total item count
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      // Get subtotal
      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const price = item.product.base_price + (item.variant?.price_adjustment ?? 0);
          return sum + price * item.quantity;
        }, 0);
      },
      
      // Get full cart summary
      getSummary: () => {
        const state = get();
        const subtotal = state.getSubtotal();
        const shippingSubtotal = state.vipShippingCharged
          ? subtotal
          : state.items.reduce((sum, item) => {
              if (isVipCartProduct(item.product)) return sum;
              const price = item.product.base_price + (item.variant?.price_adjustment ?? 0);
              return sum + price * item.quantity;
            }, 0);

        const shipping = shippingSubtotal <= 0
          ? 0
          : shippingSubtotal >= FREE_SHIPPING_THRESHOLD
            ? 0
            : STANDARD_SHIPPING;
        const discount = state.discountAmount;
        const taxableAmount = Math.max(0, subtotal - discount);
        const tax = taxableAmount * TAX_RATE;
        const total = taxableAmount + tax + shipping;
        
        return {
          subtotal,
          shipping,
          tax: Math.round(tax * 100) / 100,
          discount,
          total: Math.round(total * 100) / 100,
          itemCount: state.getItemCount(),
        };
      },
      
      // Get item by ID
      getItemById: (itemId) => {
        return get().items.find(item => item.id === itemId);
      },
      
      // Check if item exists
      hasItem: (productId, variantId) => {
        const itemId = `${productId}-${variantId}`;
        return get().items.some(item => item.id === itemId);
      },

      // Pull cart from SQL and merge with local
      syncFromSQL: async (email: string) => {
        try {
          const { data, error } = await supabase
            .from('store_cart')
            .select('*')
            .eq('email', email)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            const sqlItems: CartItem[] = data.map((row: any) => ({
              id: row.item_id,
              product: row.product_data as ProductWithDetails,
              variant: row.variant_data as Variant,
              quantity: row.quantity || 1,
            }));

            // Merge: SQL is source of truth, keep local items not in SQL
            const currentItems = get().items;
            const sqlIds = new Set(sqlItems.map(i => i.id));
            const localOnly = currentItems.filter(i => !sqlIds.has(i.id));

            // Push local-only items to SQL
            for (const item of localOnly) {
              sqlUpsertCartItem(email, item);
            }

            set({ items: [...sqlItems, ...localOnly], _synced: true });
          } else if (!error) {
            // No SQL items - push local items to SQL
            const currentItems = get().items;
            for (const item of currentItems) {
              sqlUpsertCartItem(email, item);
            }
            set({ _synced: true });
          }
        } catch {
          // SQL unavailable, keep using local
        }
      },
    }),
    {
      name: 'bullmoney-cart',
      storage: createSafeJSONStorage(),
      partialize: (state) => ({
        items: state.items,
        discountCode: state.discountCode,
        discountAmount: state.discountAmount,
      }),
    }
  )
);

// ============================================================================
// CHECKOUT STORE
// ============================================================================

interface CheckoutStore {
  // State
  email: string;
  shippingAddress: {
    first_name: string;
    last_name: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string;
  } | null;
  billingAddress: {
    first_name: string;
    last_name: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string;
  } | null;
  sameAsShipping: boolean;
  shippingMethodId: string | null;
  paymentIntentId: string | null;
  clientSecret: string | null;
  
  // Actions
  setEmail: (email: string) => void;
  setShippingAddress: (address: CheckoutStore['shippingAddress']) => void;
  setBillingAddress: (address: CheckoutStore['billingAddress']) => void;
  setSameAsShipping: (value: boolean) => void;
  setShippingMethod: (id: string) => void;
  setPaymentIntent: (id: string, secret: string) => void;
  resetCheckout: () => void;
}

const initialCheckoutState = {
  email: '',
  shippingAddress: null,
  billingAddress: null,
  sameAsShipping: true,
  shippingMethodId: null,
  paymentIntentId: null,
  clientSecret: null,
};

export const useCheckoutStore = create<CheckoutStore>()((set) => ({
  ...initialCheckoutState,
  
  setEmail: (email) => set({ email }),
  
  setShippingAddress: (address) => set({ shippingAddress: address }),
  
  setBillingAddress: (address) => set({ billingAddress: address }),
  
  setSameAsShipping: (value) => set({ sameAsShipping: value }),
  
  setShippingMethod: (id) => set({ shippingMethodId: id }),
  
  setPaymentIntent: (id, secret) => set({ paymentIntentId: id, clientSecret: secret }),
  
  resetCheckout: () => set(initialCheckoutState),
}));
