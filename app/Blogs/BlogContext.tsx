"use client";

import React, { createContext, useContext, useEffect, useReducer } from "react";

// --- TYPES ---
export type BlogPost = {
  _id?: string;
  title: string;
  content: string;
  category: string;
  imageUrl: string;
  visible: boolean;
  createdAt: string;
};

export type Category = {
  _id?: string;
  name: string;
};

// Same structure as Shop Hero, but for Blog
export type BlogHeroConfig = {
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

type BlogState = {
  posts: BlogPost[];
  categories: Category[];
  hero: BlogHeroConfig; // ✅ Added Hero
  isAdmin: boolean;
  loading: boolean;
};

type BlogContextValue = {
  state: BlogState;
  addPost: (post: Omit<BlogPost, "_id">) => void;
  updatePost: (id: string, post: Omit<BlogPost, "_id">) => void;
  deletePost: (id: string) => void;
  toggleVisibility: (id: string) => void;
  addCategory: (category: string) => void;
  deleteCategory: (id: string) => void;
  updateHero: (hero: BlogHeroConfig) => void; // ✅ Added updateHero
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

// --- DEFAULTS ---
const DEFAULT_HERO: BlogHeroConfig = {
  badge: "BullMoney Blogs",
  title: "Latest Market Insights",
  subtitle: "Deep dives into crypto, forex, and trading psychology.",
  primaryCtaLabel: "Read Articles",
  secondaryCtaLabel: "Subscribe",
  featuredTitle: "Featured Post",
  featuredSubtitle: "Don't miss our latest analysis.",
  featuredPriceLabel: "New",
  featuredTagLabel: "Hot",
  featuredNote: "5 min read",
  featuredImageUrl: "https://images.pexels.com/photos/8370752/pexels-photo-8370752.jpeg",
};

const DEFAULT_STATE: BlogState = {
  posts: [],
  categories: [],
  hero: DEFAULT_HERO,
  isAdmin: false,
  loading: false,
};

const BlogContext = createContext<BlogContextValue | undefined>(undefined);

// --- REDUCER ---
type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_POSTS"; payload: BlogPost[] }
  | { type: "SET_CATEGORIES"; payload: Category[] }
  | { type: "SET_HERO"; payload: BlogHeroConfig } // ✅ Added Action
  | { type: "LOGIN" }
  | { type: "LOGOUT" }
  | { type: "ADD_POST"; payload: BlogPost }
  | { type: "UPDATE_POST"; payload: BlogPost }
  | { type: "DELETE_POST"; payload: string }
  | { type: "ADD_CATEGORY"; payload: Category }
  | { type: "DELETE_CATEGORY"; payload: string };

function reducer(state: BlogState, action: Action): BlogState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_POSTS":
      return { ...state, posts: action.payload };
    case "SET_CATEGORIES":
      return { ...state, categories: action.payload };
    case "SET_HERO":
      return { ...state, hero: action.payload }; // ✅ Handle Hero
    case "LOGIN":
      return { ...state, isAdmin: true };
    case "LOGOUT":
      return { ...state, isAdmin: false };
    case "ADD_POST":
      return { ...state, posts: [action.payload, ...state.posts] }; // Add to top
    case "UPDATE_POST":
      return {
        ...state,
        posts: state.posts.map((post) =>
          post._id === action.payload._id ? action.payload : post
        ),
      };
    case "DELETE_POST":
      return {
        ...state,
        posts: state.posts.filter((post) => post._id !== action.payload),
      };
    case "ADD_CATEGORY":
      return { ...state, categories: [...state.categories, action.payload] };
    case "DELETE_CATEGORY":
      return {
        ...state,
        categories: state.categories.filter(
          (category) => category._id !== action.payload
        ),
      };
    default:
      return state;
  }
}

// --- PROVIDER ---
export function BlogProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

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

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const [postsData, categoriesData, heroData] = await Promise.all([
          safeFetchJson("/api/blogs", []),
          safeFetchJson("/api/categories", []),
          safeFetchJson("/api/blogs/hero", {}), // ✅ Fetch Hero
        ]);

        dispatch({ type: "SET_POSTS", payload: postsData });
        dispatch({ type: "SET_CATEGORIES", payload: categoriesData });
        // Merge DB data with defaults to ensure all fields exist
        dispatch({ type: "SET_HERO", payload: { ...DEFAULT_HERO, ...heroData } });
      } catch (error) {
        console.error("Error fetching blog data:", error);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    fetchData();
  }, []);

  // ... existing Post/Category functions ... 
  const addPost = (post: Omit<BlogPost, "_id">) => {
    fetch("/api/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    })
      .then((res) => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then((data) => dispatch({ type: "ADD_POST", payload: data }))
      .catch((e) => console.error("Failed to add post:", e));
  };

  const updatePost = (id: string, post: Omit<BlogPost, "_id">) => {
    fetch(`/api/blogs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    })
      .then((res) => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then((data) => dispatch({ type: "UPDATE_POST", payload: data }))
      .catch((e) => console.error("Failed to update post:", e));
  };

  const deletePost = (id: string) => {
    fetch(`/api/blogs/${id}`, { method: "DELETE" })
      .then(() => dispatch({ type: "DELETE_POST", payload: id }));
  };

  const toggleVisibility = (id: string) => {
    const post = state.posts.find((p) => p._id === id);
    if (post) {
      updatePost(id, { ...post, visible: !post.visible });
    }
  };

  const addCategory = (category: string) => {
    fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: category }),
    })
      .then((res) => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then((data) => dispatch({ type: "ADD_CATEGORY", payload: data }))
      .catch((e) => console.error("Failed to add category:", e));
  };

  const deleteCategory = (id: string) => {
    fetch(`/api/categories/${id}`, { method: "DELETE" })
      .then(() => dispatch({ type: "DELETE_CATEGORY", payload: id }));
  };

  // ✅ Update Hero Function
  const updateHero = (hero: BlogHeroConfig) => {
    // Optimistic update
    dispatch({ type: "SET_HERO", payload: hero });
    
    fetch("/api/blogs/hero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hero),
    })
      .then((res) => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then((data) => dispatch({ type: "SET_HERO", payload: data }))
      .catch((e) => console.error("Failed to update hero:", e));
  };

  const login = (u: string, p: string) => {
    if (u === "MR.BULLMONEY" && p === "9D6W5D6SD6S7DA6D5D5ADS5A6XVXASXR6723RE627EDGED") {
      dispatch({ type: "LOGIN" });
      return true;
    }
    return false;
  };

  const logout = () => dispatch({ type: "LOGOUT" });

  return (
    <BlogContext.Provider
      value={{
        state,
        addPost,
        updatePost,
        deletePost,
        toggleVisibility,
        addCategory,
        deleteCategory,
        updateHero, // ✅ Exposed
        login,
        logout,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
}

export function useBlog() {
  const context = useContext(BlogContext);
  if (!context) throw new Error("useBlog must be used within BlogProvider");
  return context;
}