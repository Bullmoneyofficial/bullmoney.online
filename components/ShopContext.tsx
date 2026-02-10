"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from "react";

// --- Type Definitions ---

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

// ... (DEFAULT_HERO, ShopState, LoginResult, ShopContextValue types) ...

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
  hero: HeroConfig;
  isAdmin: boolean;
  loading: boolean;
};

type LoginResult = { success: boolean; message?: string };

type ShopContextValue = {
  state: ShopState;

  login: (username: string, password: string) => Promise<LoginResult>;
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

// Admin credentials are validated server-side via /api/admin/login
// ADMIN_EMAIL is still public (used for UI checks like showing admin buttons)
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

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

  // ------------------------------------------------------------------
  // ✅ MODIFIED: The logic here is made robust to handle array or object response
  // ------------------------------------------------------------------
  const safeFetchJson = async (url: string, fallback: any = []) => {
    try {
      const res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) {
        console.warn(`⚠️ ${url} returned ${res.status}`);
        return fallback;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.warn(`⚠️ ${url} returned non-JSON content-type: ${contentType}`);
        return fallback;
      }
      return await res.json();
    } catch (e) {
      console.warn(`⚠️ ${url} fetch failed:`, e);
      return fallback;
    }
  };

  const refreshAll = async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
        const [products, heroDataRaw, categories] = await Promise.all([
            safeFetchJson("/api/products", []),
            safeFetchJson("/api/hero", {}), // heroDataRaw can be [] or {}
            safeFetchJson("/api/categories", []),
        ]);
        
        // --- 🔎 Robustly determine the single hero object ---
        let heroFromDb = null;
        
        if (Array.isArray(heroDataRaw) && heroDataRaw.length > 0) {
            // Case 1: API returns an array, take the first item
            heroFromDb = heroDataRaw[0];
        } else if (heroDataRaw && typeof heroDataRaw === 'object' && !Array.isArray(heroDataRaw)) {
            // Case 2: API returns a single object
            heroFromDb = heroDataRaw;
        }

        if (process.env.NODE_ENV === "development") {
          console.log("🛒 Shop Context - Hero Data Found:", heroFromDb);
        }

        dispatch({ type: "SET_PRODUCTS", payload: products || [] });
        
        dispatch({
            type: "SET_HERO",
            // Use spread to merge the DB data over the defaults
            payload: { ...DEFAULT_HERO, ...(heroFromDb || {}) },
        });
        
        dispatch({ type: "SET_CATEGORIES", payload: categories || [] });
        
    } catch(error) {
        console.error("❌ Failed to fetch shop configuration:", error);
    } finally {
        dispatch({ type: "SET_LOADING", payload: false });
    }
  };
  // ------------------------------------------------------------------

  useEffect(() => {
    refreshAll();
  }, []);

  const login = async (username: string, password: string): Promise<LoginResult> => {
    if (!username || !password) {
      return { success: false, message: "Please fill in all fields." };
    }
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });
      const data = await res.json();
      if (data.success) {
        dispatch({ type: "LOGIN" });
        return { success: true };
      }
      return { success: false, message: data.message || "Invalid credentials." };
    } catch {
      return { success: false, message: "Login request failed." };
    }
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
    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    await refreshAll();
  };

  const deleteProduct = async (id: string) => {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    await refreshAll();
  };

  const toggleVisibility = async (id: string) => {
    const p = state.products.find((x) => (x._id || x.id) === id); 
    if (!p) return;
    await updateProduct(id, { ...p, visible: !p.visible }); 
  };

  const updateHero = async (hero: HeroConfig) => {
    await fetch("/api/hero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hero),
    });
    await refreshAll();
  };
  
  const addCategory = async (name: string) => {
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    await refreshAll();
  };

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

// ==========================================
// ✅ ADDED THIS PART: useShop Hook Export
// ==========================================
export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Wrap children in the Provider */}
        <ShopProvider>
          {children}
        </ShopProvider>
      </body>
    </html>
  );
}
