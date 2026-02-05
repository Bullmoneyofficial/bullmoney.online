'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, ProductWithDetails, Variant, CartSummary } from '@/types/store';

// ============================================================================
// CART STORE - ZUSTAND WITH LOCAL STORAGE PERSISTENCE
// ============================================================================

interface CartStore {
  // State
  items: CartItem[];
  isOpen: boolean;
  discountCode: string | null;
  discountAmount: number;
  
  // Actions
  addItem: (product: ProductWithDetails, variant: Variant, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setDiscountCode: (code: string | null, amount?: number) => void;
  
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
      
      // Add item to cart
      addItem: (product, variant, quantity = 1) => {
        const itemId = `${product.id}-${variant.id}`;
        
        set((state) => {
          const existingItemIndex = state.items.findIndex(item => item.id === itemId);
          
          if (existingItemIndex > -1) {
            // Update quantity if item exists
            const newItems = [...state.items];
            const newQuantity = newItems[existingItemIndex].quantity + quantity;
            
            // Check stock
            if (newQuantity > variant.inventory_count) {
              return state; // Don't exceed stock
            }
            
            newItems[existingItemIndex] = {
              ...newItems[existingItemIndex],
              quantity: newQuantity,
            };
            return { items: newItems, isOpen: true };
          }
          
          // Add new item
          if (quantity > variant.inventory_count) {
            return state; // Don't exceed stock
          }
          
          return {
            items: [
              ...state.items,
              {
                id: itemId,
                product,
                variant,
                quantity,
              },
            ],
            isOpen: true,
          };
        });
      },
      
      // Remove item from cart
      removeItem: (itemId) => {
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
          
          // Check stock
          if (quantity > item.variant.inventory_count) {
            return state;
          }
          
          const newItems = [...state.items];
          newItems[itemIndex] = { ...item, quantity };
          return { items: newItems };
        });
      },
      
      // Clear cart
      clearCart: () => {
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
          const price = item.product.base_price + item.variant.price_adjustment;
          return sum + price * item.quantity;
        }, 0);
      },
      
      // Get full cart summary
      getSummary: () => {
        const state = get();
        const subtotal = state.getSubtotal();
        const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
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
    }),
    {
      name: 'bullmoney-cart',
      storage: createJSONStorage(() => localStorage),
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
