"use client";

import React, { createContext, useContext, useEffect, useReducer, ReactNode, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// --- SUPABASE SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase Environment Variables! Check your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONFIG ---
const ADMIN_EMAIL = "samaraalexaa18@gmail.com";

// --- 1. TYPES ---

export type HeroContent = {
  id: boolean; 
  headline: string;
  subheadline: string;
  button_text: string;
  hero_images: string[];
  beam_text_1: string | null; 
  beam_text_2: string | null;
  beam_text_3: string | null;
};

export type AboutContent = {
  id: boolean;
  title: string;
  subtitle: string;
  description_1: string;
  description_2: string;
  image_url: string | null;
};

export type Project = {
  id: number;
  title: string;
  thumbnail: string;
  description: string | null;
  technique: string | null;
  duration: string | null;
  price: string | null;
  link: string | null;
};

export type ProjectFormData = Omit<Project, "id">;

export type ServiceCategory = {
  id: number;
  name: string;
  notes: string[] | null;
  display_order: number;
};

export type ServiceItem = {
  id: number;
  category_id: number;
  name: string;
  price: string;
  image_url: string | null; 
  detail_type: string | null;
  detail_time: string | null;
  detail_includes: string | null;
  display_order: number;
};

export type GalleryItem = {
  id: number;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  display_order: number;
};

export type SocialLink = {
  id: number;
  platform: string;
  url: string;
  icon_key: string | null;
  active: boolean;
};

export type UserProfile = {
  id: string;
  email: string;
  stamps: number;
  reward_active: boolean;
};

// --- 2. DEFAULTS ---

const DEFAULT_HERO: HeroContent = {
  id: true,
  headline: "BullMoney",
  subheadline: "Elite Trading Community & Premium Trading Setups",
  button_text: "View Trading Setups",
  hero_images: [],
  beam_text_1: "Community",
  beam_text_2: "Trading",
  beam_text_3: "Setups"
};

const DEFAULT_ABOUT: AboutContent = {
  id: true,
  title: "BULLMONEY",
  subtitle: "REAL TRADERS. REAL PROFITS.",
  description_1: "BullMoney is a premier trading community...",
  description_2: "Here, you get everything you need in one place...",
  image_url: null
};

// --- 3. STATE DEFINITION ---

type StudioState = {
  hero: HeroContent;
  about: AboutContent;
  projects: Project[];
  serviceCategories: ServiceCategory[];
  serviceItems: ServiceItem[];
  gallery: GalleryItem[];
  socials: SocialLink[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  userProfile: UserProfile | null;
  loading: boolean;
};

// --- 4. REDUCER (UPDATED) ---

type Action =
  | { type: "SET_AUTH"; payload: { isAuth: boolean; isAdmin: boolean } }
  | { type: "SET_USER_PROFILE"; payload: UserProfile | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_DATA"; payload: Partial<StudioState> } // Changed to allow partial updates
  | { type: "PATCH_LOCAL"; payload: Partial<StudioState> }; // NEW: For instant updates

const reducer = (state: StudioState, action: Action): StudioState => {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, isAuthenticated: action.payload.isAuth, isAdmin: action.payload.isAdmin };
    case "SET_USER_PROFILE":
      return { ...state, userProfile: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_DATA":
      // Merges the new data with existing state
      return { ...state, ...action.payload };
    case "PATCH_LOCAL":
      // Exact same logic as SET_DATA, but semantically for local updates
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

// --- 5. CONTEXT & PROVIDER ---

type StudioContextType = {
  state: StudioState;
  login: (email: string, pass: string) => Promise<{ success: boolean; msg?: string }>;
  signup: (email: string, pass: string) => Promise<{ success: boolean; msg?: string }>;
  logout: () => Promise<void>;
  uploadFile: (file: File) => Promise<{ url: string | null; error: string | null }>;
  
  updateHero: (data: HeroContent) => Promise<void>;
  updateAbout: (data: AboutContent) => Promise<void>;
  
  addProject: (data: ProjectFormData) => Promise<void>;
  updateProject: (id: number, data: ProjectFormData) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;

  addServiceCategory: (name: string, notes?: string[]) => Promise<void>;
  updateServiceCategory: (id: number, name: string, notes?: string[]) => Promise<void>;
  deleteServiceCategory: (id: number) => Promise<void>;
  
  addServiceItem: (data: Omit<ServiceItem, "id">) => Promise<void>;
  updateServiceItem: (id: number, data: Partial<ServiceItem>) => Promise<void>;
  deleteServiceItem: (id: number) => Promise<void>;

  addGalleryItem: (data: Omit<GalleryItem, "id">) => Promise<void>;
  updateGalleryItem: (id: number, data: Partial<GalleryItem>) => Promise<void>;
  deleteGalleryItem: (id: number) => Promise<void>;

  updateSocialLink: (id: number, url: string, active: boolean) => Promise<void>;
  searchUserByEmail: (email: string) => Promise<UserProfile | null>; 
  updateUserLoyalty: (userId: string, newStamps: number) => Promise<void>;
  fetchAllLoyaltyUsers: () => Promise<UserProfile[]>;
};

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    hero: DEFAULT_HERO,
    about: DEFAULT_ABOUT,
    projects: [],
    serviceCategories: [],
    serviceItems: [],
    gallery: [],
    socials: [],
    isAuthenticated: false,
    isAdmin: false,
    userProfile: null,
    loading: true,
  });

  // --- DATA FETCHING ---
  const refreshData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [heroRes, aboutRes, projRes, catRes, itemRes, galleryRes, socialsRes] = await Promise.all([
        supabase.from("alexa_hero").select("*").eq("id", true).single(),
        supabase.from("alexa_about").select("*").eq("id", true).single(),
        
        // Projects: Sorted by creation date (Newest first)
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        
        // --- FIX BELOW ---
        // Changed .order("display_order") to .order("id") 
        // This stops "auto sorting" and keeps them in the order they were added (by ID)
        
        supabase.from("service_categories").select("*").order("id", { ascending: true }),
        supabase.from("service_items").select("*").order("id", { ascending: true }),
        supabase.from("gallery_items").select("*").order("id", { ascending: true }),
        
        // ----------------
        
        supabase.from("social_links").select("*").order("id", { ascending: true }),
      ]);

      dispatch({
        type: "SET_DATA",
        payload: {
          hero: heroRes.data ? (heroRes.data as HeroContent) : DEFAULT_HERO,
          about: aboutRes.data ? (aboutRes.data as AboutContent) : DEFAULT_ABOUT,
          projects: projRes.data ? (projRes.data as Project[]) : [],
          serviceCategories: catRes.data ? (catRes.data as ServiceCategory[]) : [],
          serviceItems: itemRes.data ? (itemRes.data as ServiceItem[]) : [],
          gallery: galleryRes.data ? (galleryRes.data as GalleryItem[]) : [],
          socials: socialsRes.data ? (socialsRes.data as SocialLink[]) : [],
        },
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);
  // --- AUTH LISTENER ---
  useEffect(() => {
    refreshData();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isAuth = !!session;
      const isAdmin = !!session?.user?.email && (session.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
      dispatch({ type: "SET_AUTH", payload: { isAuth, isAdmin } });
      if (session?.user) await fetchUserProfile(session.user.id);
      else dispatch({ type: "SET_USER_PROFILE", payload: null });
    });
    return () => subscription.unsubscribe();
  }, [refreshData]);

  // --- HELPERS ---
  const fetchUserProfile = async (userId: string) => {
      const { data } = await supabase.from("user_profiles").select("*").eq("id", userId).single();
      if (data) dispatch({ type: "SET_USER_PROFILE", payload: data as UserProfile });
  };

  const uploadFile = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      return { url: data.publicUrl, error: null };
    } catch (e: any) {
      return { url: null, error: e.message || "Upload failed" };
    }
  };

  // --- ACTIONS (FIXED WITH OPTIMISTIC UPDATES) ---

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return error ? { success: false, msg: error.message } : { success: true };
  };
  const signup = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signUp({ email, password: pass });
    return error ? { success: false, msg: error.message } : { success: true };
  };
  const logout = async () => { await supabase.auth.signOut(); };

  // --- CRUD (Optimized: Updates Local State Immediately) ---

  const updateHero = async (data: HeroContent) => {
    // Optimistic Update
    dispatch({ type: "PATCH_LOCAL", payload: { hero: data } });
    await supabase.from("alexa_hero").upsert({ ...data, id: true });
  };

  const updateAbout = async (data: AboutContent) => {
    dispatch({ type: "PATCH_LOCAL", payload: { about: data } });
    await supabase.from("alexa_about").upsert({ ...data, id: true });
  };

  // --- PROJECTS ---
  const addProject = async (data: ProjectFormData) => {
    // For adds, we still need to fetch to get the generated ID
    const { error } = await supabase.from("projects").insert([data]);
    if (!error) refreshData(); 
  };
  const updateProject = async (id: number, data: ProjectFormData) => {
    // 1. Instant UI Update
    const updatedList = state.projects.map(p => p.id === id ? { ...p, ...data } : p);
    dispatch({ type: "PATCH_LOCAL", payload: { projects: updatedList } });
    // 2. Database Update
    await supabase.from("projects").update(data).eq("id", id);
  };
  const deleteProject = async (id: number) => {
    // 1. Instant UI Update
    const updatedList = state.projects.filter(p => p.id !== id);
    dispatch({ type: "PATCH_LOCAL", payload: { projects: updatedList } });
    // 2. Database Update
    await supabase.from("projects").delete().eq("id", id);
  };

  // --- SERVICE CATEGORIES ---
  const addServiceCategory = async (name: string, notes: string[] = []) => {
    const { error } = await supabase.from("service_categories").insert([{ name, notes, display_order: 100 }]);
    if (!error) refreshData();
  };
  const deleteServiceCategory = async (id: number) => {
    const updatedList = state.serviceCategories.filter(c => c.id !== id);
    // Also remove items inside this category locally
    const updatedItems = state.serviceItems.filter(i => i.category_id !== id);
    dispatch({ type: "PATCH_LOCAL", payload: { serviceCategories: updatedList, serviceItems: updatedItems } });
    await supabase.from("service_categories").delete().eq("id", id);
  };
  // (Assuming updateServiceCategory isn't heavily used, but following same pattern)
  const updateServiceCategory = async (id: number, name: string, notes: string[] = []) => {
     await supabase.from("service_categories").update({ name, notes }).eq("id", id);
     refreshData();
  };

  // --- SERVICE ITEMS (The main fix area) ---
  const addServiceItem = async (data: Omit<ServiceItem, "id">) => {
     const { error } = await supabase.from("service_items").insert([data]);
     if (!error) refreshData();
  };
  const updateServiceItem = async (id: number, data: Partial<ServiceItem>) => {
      // 1. Instant Update
      const updatedList = state.serviceItems.map(i => i.id === id ? { ...i, ...data } : i);
      dispatch({ type: "PATCH_LOCAL", payload: { serviceItems: updatedList } });
      // 2. DB Update
      await supabase.from("service_items").update(data).eq("id", id);
  };
  const deleteServiceItem = async (id: number) => {
      // 1. Instant Update
      const updatedList = state.serviceItems.filter(i => i.id !== id);
      dispatch({ type: "PATCH_LOCAL", payload: { serviceItems: updatedList } });
      // 2. DB Update
      await supabase.from("service_items").delete().eq("id", id);
  };

  // --- GALLERY ---
  const addGalleryItem = async (data: Omit<GalleryItem, "id">) => {
    const { error } = await supabase.from("gallery_items").insert([data]);
    if (!error) refreshData();
  };
  const deleteGalleryItem = async (id: number) => {
    const updatedList = state.gallery.filter(g => g.id !== id);
    dispatch({ type: "PATCH_LOCAL", payload: { gallery: updatedList } });
    await supabase.from("gallery_items").delete().eq("id", id);
  };
  const updateGalleryItem = async (id: number, data: Partial<GalleryItem>) => {
    const updatedList = state.gallery.map(g => g.id === id ? { ...g, ...data } : g);
    dispatch({ type: "PATCH_LOCAL", payload: { gallery: updatedList } });
    await supabase.from("gallery_items").update(data).eq("id", id);
  };

  // --- SOCIALS ---
  const updateSocialLink = async (id: number, url: string, active: boolean) => {
      const updatedList = state.socials.map(s => s.id === id ? { ...s, url, active } : s);
      dispatch({ type: "PATCH_LOCAL", payload: { socials: updatedList } });
      await supabase.from("social_links").update({ url, active }).eq("id", id);
  };

  // --- LOYALTY ---
  const searchUserByEmail = async (email: string) => {
    if (!state.isAdmin) return null;
    const { data } = await supabase.from("user_profiles").select("*").eq("email", email).single();
    return data as UserProfile;
  };
  const fetchAllLoyaltyUsers = async (): Promise<UserProfile[]> => {
    if (!state.isAdmin) return [];
    const { data } = await supabase.from("user_profiles").select("*").order("stamps", { ascending: false });
    return (data || []) as UserProfile[];
  };
  const updateUserLoyalty = async (userId: string, newStamps: number) => {
      const stamps = Math.min(Math.max(newStamps, 0), 5);
      const reward_active = stamps === 5;
      await supabase.from("user_profiles").update({ stamps, reward_active }).eq("id", userId);
      // If admin is updating themselves, update local state
      if (state.userProfile?.id === userId) {
          dispatch({ type: "SET_USER_PROFILE", payload: { ...state.userProfile, stamps, reward_active } });
      }
  };

  return (
    <StudioContext.Provider 
      value={{ 
        state, 
        login, signup, logout, uploadFile, 
        updateHero, updateAbout,
        addProject, updateProject, deleteProject,
        addServiceCategory, updateServiceCategory, deleteServiceCategory,
        addServiceItem, updateServiceItem, deleteServiceItem,
        addGalleryItem, updateGalleryItem, deleteGalleryItem,
        updateSocialLink, updateUserLoyalty, searchUserByEmail, fetchAllLoyaltyUsers 
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export const useStudio = () => {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within StudioProvider");
  return ctx;
};