"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from "react";

// --- Type Definitions (Kept the same, they look correct) ---

export type Product = {
  _id?: string;
  id?: string; // UI compatibility
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  visible: boolean;
  buyUrl?: string;
};

export type HeroConfig = {
  badge: string;
  title: string;
  subtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  featuredTitle: string;
  featuredSubtitle: string;
  featuredPriceLabel: string;
  featuredTagLabel: string;
  featuredNote: string;
  featuredImageUrl: string;
};

export type Category = {
  _id?: string;
  id?: string;
  name: string;
};

// ... (DEFAULT_HERO, ShopState, LoginResult, ShopContextValue types are omitted for brevity, as they were correct) ...

const DEFAULT_HERO: HeroConfig = {
  badge: "BullMoney FX Shop",
  title: "Gear up for your next market session.",
  subtitle:
    "Apparel, desk gear, and accessories built for traders who live on the charts.",
  primaryCtaLabel: "Shop now",
  secondaryCtaLabel: "View drops",
  featuredTitle: "Featured Product",
  featuredSubtitle: "Your limited highlight sits here.",
  featuredPriceLabel: "$",
  featuredTagLabel: "New",
  featuredNote: "Ships worldwide",
  featuredImageUrl:
    "https://images.pexels.com/photos/7671169/pexels-photo-7671169.jpeg",
};

type ShopState = {
  products: Product[];
  categories: Category[];
  hero: HeroConfig; // ✅ NOT NULL anymore
  isAdmin: boolean;
  loading: boolean;
};

type LoginResult = { success: boolean; message?: string };

type ShopContextValue = {
  state: ShopState;

  login: (username: string, password: string) => LoginResult;
  logout: () => void;

  refreshAll: () => Promise<void>;

  addProduct: (product: Omit<Product, "_id" | "id">) => Promise<void>;
  updateProduct: (
    id: string,
    product: Omit<Product, "_id" | "id">
  ) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleVisibility: (id: string) => Promise<void>;

  updateHero: (hero: HeroConfig) => Promise<void>;

  addCategory: (name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
};


const ADMIN_USERNAME = "MR.BULLMONEY";
const ADMIN_PASSWORD = "9D6W5D6SD6S7DA6D5D5ADS5A6XVXASXR6723RE627EDGED";

type Action =
  | { type: "LOGIN" }
  | { type: "LOGOUT" }
  | { type: "SET_PRODUCTS"; payload: Product[] }
  | { type: "SET_CATEGORIES"; payload: Category[] }
  | { type: "SET_HERO"; payload: HeroConfig }
  | { type: "SET_LOADING"; payload: boolean };

function reducer(state: ShopState, action: Action): ShopState {
  switch (action.type) {
    case "LOGIN":
      return { ...state, isAdmin: true };
    case "LOGOUT":
      return { ...state, isAdmin: false };
    case "SET_PRODUCTS":
      return { ...state, products: action.payload };
    case "SET_CATEGORIES":
      return { ...state, categories: action.payload };
    case "SET_HERO":
      return { ...state, hero: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

const ShopContext = createContext<ShopContextValue | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    products: [],
    categories: [],
    hero: DEFAULT_HERO,
    isAdmin: false,
    loading: true,
  });

  const refreshAll = async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    // FIX 1: Fetch and destructure the results correctly.
    // The hero query returns an array of one item, [heroConfig].
    const [products, heroConfigArray, categories] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/hero").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    
    // Extract the first (and only) item from the hero array, or null if empty.
    const heroFromDb = heroConfigArray && heroConfigArray.length > 0 ? heroConfigArray[0] : null;

    dispatch({ type: "SET_PRODUCTS", payload: products });
    
    dispatch({
      type: "SET_HERO",
      // FIX 2: Use a null check on heroFromDb, and spread the existing default config first
      // to ensure all fields are present even if the DB only returns a subset.
      payload: { ...DEFAULT_HERO, ...(heroFromDb || {}) },
    });
    
    dispatch({ type: "SET_CATEGORIES", payload: categories });
    dispatch({ type: "SET_LOADING", payload: false });
  };

  useEffect(() => {
    // FIX 3: Add an immediate function call to the effect
    refreshAll();
  }, []); // Empty dependency array means it runs once on mount

  const login = (username: string, password: string): LoginResult => {
    if (!username || !password) {
      return { success: false, message: "Please fill in all fields." };
    }
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      dispatch({ type: "LOGIN" });
      return { success: true };
    }
    return { success: false, message: "Invalid credentials." };
  };

  const logout = () => dispatch({ type: "LOGOUT" });

  const addProduct = async (product: Omit<Product, "_id" | "id">) => {
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    await refreshAll();
  };

  const updateProduct = async (
    id: string,
    product: Omit<Product, "_id" | "id">
  ) => {
    // FIX 4: The endpoint for update should typically be /api/products/:id, not just /api/products
    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    await refreshAll();
  };

  const deleteProduct = async (id: string) => {
    // FIX 5: The endpoint for delete should be /api/products/:id
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    await refreshAll();
  };

  const toggleVisibility = async (id: string) => {
    // Correctly find product by checking both _id (Supabase/Postgres) and id (UI compatibility)
    const p = state.products.find((x) => (x._id || x.id) === id); 
    if (!p) return;
    // Pass the correct product data to updateProduct
    await updateProduct(id, { ...p, visible: !p.visible }); 
  };

  const updateHero = async (hero: HeroConfig) => {
    // FIX 6: The Shop Hero table is a singleton, meaning updates should typically target the single row. 
    // If your API is set up to update by the primary key, 'true' (which is the only ID), 
    // or simply handles a general PUT for the singleton, this endpoint is fine. 
    // Assuming the API handles the singleton update.
    await fetch("/api/hero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hero),
    });
    await refreshAll();
  };
  
  // FIX 7: Fixed addCategory to use correct endpoint and payload structure
  const addCategory = async (name: string) => {
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    await refreshAll();
  };

  // FIX 8: Fixed deleteCategory to use correct endpoint
  const deleteCategory = async (id: string) => {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    await refreshAll();
  };


  return (
    <ShopContext.Provider
      value={{
        state,
        login,
        logout,
        refreshAll,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleVisibility,
        updateHero,
        addCategory,
        deleteCategory,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}