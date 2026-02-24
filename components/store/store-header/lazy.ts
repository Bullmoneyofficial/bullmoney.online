'use client';

import dynamic from 'next/dynamic';

// Lazy-load framer-motion — only needed when mobile menu is opened
export const LazyMotionDiv = dynamic(() => import('framer-motion').then(m => ({ default: m.motion.div })), { ssr: false });
export const LazyAnimatePresence = dynamic(() => import('framer-motion').then(m => ({ default: m.AnimatePresence })), { ssr: false });
export const LazyMotionUl = dynamic(() => import('framer-motion').then(m => ({ default: m.motion.ul })), { ssr: false });
export const LazyMotionLi = dynamic(() => import('framer-motion').then(m => ({ default: m.motion.li })), { ssr: false });
export const LazyMotionButton = dynamic(() => import('framer-motion').then(m => ({ default: m.motion.button })), { ssr: false });
export const LazyMotionA = dynamic(() => import('framer-motion').then(m => ({ default: m.motion.a })), { ssr: false });

// Lazy load modals/drawers - same as main navbar
export const AdminHubDrawer = dynamic(() => import('@/components/admin/AdminHubDrawer').then(m => ({ default: m.AdminHubDrawer })), { ssr: false });
export const SiteSearchOverlay = dynamic(() => import('@/components/SiteSearchOverlay'), { ssr: false });
export const GamesManualModal = dynamic(() => import('@/components/GamesManualModal').then(m => ({ default: m.GamesManualModal })), { ssr: false });

// Heavy UI chunks — dynamic to keep StoreHeader light
export const StorePillNav = dynamic(() => import('../StorePillNav').then(m => ({ default: m.StorePillNav })), { ssr: false, loading: () => null });
export const LanguageToggle = dynamic(() => import('@/components/LanguageToggle').then(m => ({ default: m.LanguageToggle })), { ssr: false, loading: () => null });
export const RewardsCardBanner = dynamic(() => import('@/components/RewardsCardBanner'), { ssr: false, loading: () => null });
export const ProductsModal = dynamic(() => import('@/components/ProductsModal').then(m => ({ default: m.ProductsModal })), { ssr: false, loading: () => null });
export const CartDrawer = dynamic(() => import('@/components/shop/CartDrawer').then(m => ({ default: m.CartDrawer })), { ssr: false, loading: () => null });
export const CourseDrawer = dynamic(() => import('@/components/course/CourseDrawer').then(m => ({ default: m.CourseDrawer })), { ssr: false, loading: () => null });
export const SocialsDrawer = dynamic(() => import('@/components/socials/SocialsDrawer').then(m => ({ default: m.SocialsDrawer })), { ssr: false, loading: () => null });
export const StoreAccountDrawer = dynamic(() => import('@/components/store/StoreAccountDrawer').then(m => ({ default: m.StoreAccountDrawer })), { ssr: false, loading: () => null });
export const LiveStreamModal = dynamic(() => import('@/components/LiveStreamModal'), { ssr: false, loading: () => null });
export const RewardsCard = dynamic(() => import('@/components/RewardsCard'), { ssr: false, loading: () => null });
