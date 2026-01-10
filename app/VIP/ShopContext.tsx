"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type Product = {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  visible: boolean;
  buyUrl?: string;
};

interface ShopState {
  products: Product[];
  isAdmin?: boolean;
  categories?: Array<{ _id?: string; id?: string; name: string }>;
}

interface ShopContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  total: number;
  state: ShopState;
  toggleVisibility: (id: string) => void;
  deleteProduct: (id: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within ShopProvider");
  }
  return context;
};

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products] = useState<Product[]>([]);
  const [categories] = useState<Array<{ _id?: string; id?: string; name: string }>>([]);
  const [isAdmin] = useState<boolean>(false);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleVisibility = (_id: string) => {
    // Stub implementation
  };

  const deleteProduct = (_id: string) => {
    // Stub implementation
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <ShopContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        total,
        state: { products, isAdmin, categories },
        toggleVisibility,
        deleteProduct
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export default ShopContext;
