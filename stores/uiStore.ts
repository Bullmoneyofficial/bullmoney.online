"use client";

import { create } from 'zustand';

// ============================================================================
// UI STORE - Isolated State for Zero Full-Tree Re-renders
// ============================================================================

export interface UIStore {
  // Modal states
  isAffiliateModalOpen: boolean;
  isVipModalOpen: boolean;
  isAdminModalOpen: boolean;
  isRecruitModalOpen: boolean;
  
  // Navigation state
  isNavOpen: boolean;
  activeNavItem: string | null;
  
  // Theme state
  currentTheme: string;
  accentColor: string;
  
  // Loading states
  isPageLoading: boolean;
  loadingProgress: number;
  
  // Toast notifications
  toast: {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null;
  
  // Actions
  openAffiliateModal: () => void;
  closeAffiliateModal: () => void;
  openVipModal: () => void;
  closeVipModal: () => void;
  openAdminModal: () => void;
  closeAdminModal: () => void;
  openRecruitModal: () => void;
  closeRecruitModal: () => void;
  
  setNavOpen: (open: boolean) => void;
  setActiveNavItem: (item: string | null) => void;
  
  setTheme: (theme: string) => void;
  setAccentColor: (color: string) => void;
  
  setPageLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  hideToast: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Initial modal states
  isAffiliateModalOpen: false,
  isVipModalOpen: false,
  isAdminModalOpen: false,
  isRecruitModalOpen: false,
  
  // Initial navigation state
  isNavOpen: false,
  activeNavItem: null,
  
  // Initial theme state
  currentTheme: 'dark',
  accentColor: '#3b82f6',
  
  // Initial loading states
  isPageLoading: false,
  loadingProgress: 0,
  
  // Initial toast
  toast: null,
  
  // Modal actions
  openAffiliateModal: () => set({ isAffiliateModalOpen: true }),
  closeAffiliateModal: () => set({ isAffiliateModalOpen: false }),
  openVipModal: () => set({ isVipModalOpen: true }),
  closeVipModal: () => set({ isVipModalOpen: false }),
  openAdminModal: () => set({ isAdminModalOpen: true }),
  closeAdminModal: () => set({ isAdminModalOpen: false }),
  openRecruitModal: () => set({ isRecruitModalOpen: true }),
  closeRecruitModal: () => set({ isRecruitModalOpen: false }),
  
  // Navigation actions
  setNavOpen: (open) => set({ isNavOpen: open }),
  setActiveNavItem: (item) => set({ activeNavItem: item }),
  
  // Theme actions
  setTheme: (theme) => set({ currentTheme: theme }),
  setAccentColor: (color) => set({ accentColor: color }),
  
  // Loading actions
  setPageLoading: (loading) => set({ isPageLoading: loading }),
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  
  // Toast actions
  showToast: (message, type) => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null }),
}));

// ============================================================================
// SELECTIVE HOOKS - Only re-render what's needed
// ============================================================================

export const useAffiliateModal = () => useUIStore((s) => ({
  isOpen: s.isAffiliateModalOpen,
  open: s.openAffiliateModal,
  close: s.closeAffiliateModal,
}));

export const useVipModal = () => useUIStore((s) => ({
  isOpen: s.isVipModalOpen,
  open: s.openVipModal,
  close: s.closeVipModal,
}));

export const useNavigation = () => useUIStore((s) => ({
  isOpen: s.isNavOpen,
  setOpen: s.setNavOpen,
  activeItem: s.activeNavItem,
  setActiveItem: s.setActiveNavItem,
}));

export const useToast = () => useUIStore((s) => ({
  toast: s.toast,
  show: s.showToast,
  hide: s.hideToast,
}));
