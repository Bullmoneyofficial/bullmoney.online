// @ts-nocheck
'use client';

/**
 * Print & Design Studio — Full-screen UltimateHub-style modal
 * 
 * Features:
 * - Full viewport overlay with body scroll lock (like UltimateHub)
 * - Two columns desktop, one column mobile
 * - Apple-style design with black buttons
 * - Supabase integration for orders, uploads, designs
 * - Complete product pages: View, Download, Upload, Create, Order
 * - Scrollable top-to-bottom inside modal
 */

import { useState, useEffect, useCallback, useRef, type ReactNode, type CSSProperties, Component } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import {
  X, Download, Upload, Eye, Sparkles, ShoppingCart, Printer, Image,
  Package, Check, ChevronRight, ChevronLeft, Plus, Trash2, Edit3,
  Palette, Heart, Share2, ZoomIn, ZoomOut, RotateCw, Layers, FileText,
  Monitor, Smartphone, Tablet, Tv, Frame, Star, Clock, Truck, Grid3X3,
  CreditCard, Shield, ArrowLeft, Search, Filter, Grid, List, Ruler,
  Copy, ExternalLink, Info, AlertCircle, CheckCircle, Loader2, Coffee, Layout, Image as ImageIcon
} from 'lucide-react';


// ============================================
// TYPES
// ============================================

export interface PrintProduct {
  id: string;
  slug?: string;
  name: string;
  type: 'poster' | 'banner' | 'wallpaper' | 'canvas' | 'sticker' | 'window-design';
  basePrice: number;
  image: string;
  description?: string;
  sizes: { label: string; width?: number; height?: number; price: number; image?: string }[];
  customizable: boolean;
  printerCompatible: string[];
}

export interface DigitalArt {
  id: string;
  slug?: string;
  name: string;
  artist?: string;
  price: number;
  image: string;
  thumbnail?: string;
  description?: string;
  category: string;
  fileFormats: string[];
  resolution: string;
  dimensions?: { width: number; height: number };
  tags?: string[];
  downloads?: number;
  featured?: boolean;
}

interface UserUpload {
  id: string;
  filename: string;
  file_url: string;
  thumbnail_url?: string;
  file_size: number;
  mime_type?: string;
  width?: number;
  height?: number;
  dpi?: number;
  created_at: string;
}

interface UserDesign {
  id: string;
  name: string;
  product_type: string;
  preview_url?: string;
  created_at: string;
  updated_at: string;
}

type StudioTab = 'browse' | 'product' | 'upload' | 'create' | 'orders' | 'designs';

// ============================================
// CONSTANTS
// ============================================

const PRODUCT_TYPES = [
  { key: 'poster', label: 'Posters', icon: Image },
  { key: 'banner', label: 'Banners', icon: Layers },
  { key: 'canvas', label: 'Canvas', icon: Frame },
  { key: 'wallpaper', label: 'Wallpaper', icon: Grid },
  { key: 'sticker', label: 'Stickers', icon: Star },
  { key: 'window-design', label: 'Window Designs', icon: Grid3X3 },
] as const;

const TYPE_COLORS: Record<string, string> = {
  poster: 'bg-blue-600', banner: 'bg-emerald-600', canvas: 'bg-purple-600',
  wallpaper: 'bg-amber-600', sticker: 'bg-lime-600', 'window-design': 'bg-teal-600',
};

const ART_CATEGORIES: Record<string, string> = {
  illustration: 'bg-purple-500', abstract: 'bg-pink-500', photography: 'bg-blue-500',
  'graphic-design': 'bg-green-500', '3d-art': 'bg-orange-500', animation: 'bg-red-500',
};

const PRODUCT_FEATURE_SECTIONS: { title: string; items: string[] }[] = [
  {
    title: 'Pro Print Quality',
    items: [
      'Color-calibrated profiles',
      'Ultra-fine dot precision',
      'Soft-proofing previews',
      'Deep black density',
      'Wide-gamut inks',
      'Archival pigments',
      'Edge-to-edge trims',
      'Anti-fade coatings',
      'Batch color matching',
      'Print-ready checks',
    ],
  },
  {
    title: 'Design & Layout',
    items: [
      'Auto-safe margins',
      'Live crop guides',
      'Aspect ratio lock',
      'Instant mockups',
      'Pixel density hints',
      'Smart alignment',
      'Layered exports',
      'Variant sizing',
      'Template presets',
      'Brand kit colors',
    ],
  },
  {
    title: 'File & Licensing',
    items: [
      'Multiple formats',
      'Commercial usage',
      'Extended print rights',
      'Versioned exports',
      'License receipts',
      'Metadata retention',
      'Vector support',
      'Lossless options',
      'High-res downloads',
      'Usage tracking',
    ],
  },
  {
    title: 'Production & Fulfillment',
    items: [
      'Roland + Mimaki',
      'Quality inspections',
      'Protective packaging',
      'Print queue alerts',
      'Priority upgrades',
      'Rush handling',
      'International shipping',
      'Tracking links',
      'Damage coverage',
      'Reprint guarantee',
    ],
  },
  {
    title: 'Studio Workflow',
    items: [
      'Saved designs',
      'Quick duplicates',
      'Team approvals',
      'Project folders',
      'Upload history',
      'Auto-tagging',
      'Smart search',
      'Favorites library',
      'Order history',
      'One-click reorders',
    ],
  },
];

const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// ============================================
// HELPER: Toast notification
// ============================================

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-black';
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[2147483647] ${bg} text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-bottom-4`}>
      <Icon className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

// ============================================
// PRODUCT DETAIL PAGE (inside studio)
// ============================================

type MockupStyle = 'minimal' | 'studio' | 'lifestyle';

function ProductMockup({
  product,
  image,
  ratio,
  style,
}: {
  product: PrintProduct;
  image: string;
  ratio: number;
  style: MockupStyle;
}) {
  const stageStyle: CSSProperties = { maxWidth: 1200, width: '100%', maxHeight: '80vh' };
  const artStyle: CSSProperties = { aspectRatio: `${ratio}` };
  const isMinimal = style === 'minimal';
  const isLifestyle = style === 'lifestyle';
  const softShadow = isMinimal ? '0 12px 28px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)' : '0 18px 44px rgba(0,0,0,0.16), 0 6px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)';
  const strongShadow = isMinimal ? '0 18px 40px rgba(0,0,0,0.16), 0 6px 12px rgba(0,0,0,0.10)' : '0 22px 48px rgba(0,0,0,0.22), 0 12px 24px rgba(0,0,0,0.14), 0 4px 8px rgba(0,0,0,0.08)';

  if (product.type === 'wallpaper' || product.type === 'window-design') {
    return (
      <div
        className={`relative w-full rounded-2xl border border-black/5 p-6 overflow-hidden ${isLifestyle ? 'bg-[#f7f1e8]' : 'bg-[#f1f1f1]'}`}
        style={{
          ...stageStyle,
          backgroundImage: isLifestyle 
            ? "radial-gradient(ellipse at top, rgba(247,241,232,1), rgba(235,228,218,0.95) 70%), url(\"data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='8' height='8' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 8 0 L 0 0 0 8' fill='none' stroke='rgba(0,0,0,0.02)' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='80' height='80' fill='url(%23grid)'/%3E%3C/svg%3E\")"
            : "radial-gradient(ellipse at top, rgba(255,255,255,1), rgba(242,242,242,0.95) 70%), url(\"data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='wall' width='4' height='4' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 0 0 L 4 0 M 0 0 L 0 4' fill='none' stroke='rgba(0,0,0,0.015)' stroke-width='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='80' height='80' fill='url(%23wall)'/%3E%3C/svg%3E\")",
          backgroundSize: '100% 100%, 80px 80px',
        }}
      >
        {/* Room ambient occlusion with vignette */}
        {!isMinimal && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.02)_100%)] pointer-events-none" />
            {/* Wall imperfections (subtle cracks, paint texture) */}
            <div className="absolute top-[15%] right-[8%] w-24 h-[1px] bg-black/[0.015]" style={{ transform: 'rotate(-3deg)' }} />
            <div className="absolute top-[60%] left-[12%] w-16 h-[0.5px] bg-black/[0.012]" style={{ transform: 'rotate(5deg)' }} />
          </>
        )}
        {/* Baseboard shadow (contact shadow) */}
        <div className={`absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-b from-transparent ${isMinimal ? 'to-black/6' : 'to-black/12'}`} style={{ filter: 'blur(3px)' }} />
        {/* Baseboard trim with depth */}
        <div className={`absolute bottom-9 left-0 right-0 h-2 ${isMinimal ? 'bg-gradient-to-b from-[#ececec] to-[#e0e0e0]' : 'bg-gradient-to-b from-[#e4e4e4] to-[#d4d4d4]'}`} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.1), 0 -1px 0 rgba(255,255,255,0.5)' }} />
        <div className={`absolute bottom-10 left-0 right-0 h-[3px] ${isMinimal ? 'bg-black/8' : 'bg-black/12'}`} style={{ filter: 'blur(1px)' }} />
        {/* Panel seams with depth and tape reveal */}
        <div className="absolute inset-x-10 top-8 bottom-16 border-l-2 border-r-2 border-black/8" style={{ boxShadow: 'inset 3px 0 6px rgba(0,0,0,0.06), inset -3px 0 6px rgba(0,0,0,0.06), inset 1px 0 0 rgba(255,255,255,0.2), inset -1px 0 0 rgba(255,255,255,0.2)' }} />
        <div className="relative mx-auto w-full max-w-[840px]" style={{ ...artStyle, transform: 'perspective(2000px) rotateY(0deg)', transformStyle: 'preserve-3d' }}>
          {/* Main panel backing with 3D depth */}
          <div className="absolute inset-0 rounded-xl bg-white border border-black/10" style={{ boxShadow: softShadow, transform: 'translateZ(4px)' }} />
          {/* Mounting foam/adhesive edge */}
          {!isMinimal && (
            <div className="absolute inset-1 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50" style={{ boxShadow: 'inset 0 0 8px rgba(0,0,0,0.08)', transform: 'translateZ(2px)' }} />
          )}
          {/* Print area with texture */}
          <div className="absolute inset-2 rounded-lg overflow-hidden border border-black/10" style={{ transform: 'translateZ(4px)' }}>
            <img src={image} alt={product.name} className="h-full w-full object-cover" />
            {/* Vinyl/Material texture with realistic grain */}
            {!isMinimal && (
              <>
                <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.012)_0px,transparent_1px,transparent_2px),repeating-linear-gradient(0deg,rgba(0,0,0,0.012)_0px,transparent_1px,transparent_2px)] pointer-events-none" style={{ backgroundSize: '2px 2px' }} />
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="200" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /%3E%3C/filter%3E%3Crect width="200" height="200" filter="url(%23noise)" opacity="0.05"/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }} />
              </>
            )}
          </div>
          {/* Edge highlight with 3D effect */}
          <div className="absolute inset-0 rounded-xl ring-1 ring-black/5" style={{ boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.5), inset -1px -1px 2px rgba(0,0,0,0.05)', transform: 'translateZ(5px)' }} />
          {/* Inner frame depth + sill for window realism */}
          {product.type === 'window-design' && (
            <>
              <div className="absolute inset-[6px] rounded-[18px] bg-gradient-to-br from-white via-white to-gray-200/60" style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.1), inset 0 -2px 4px rgba(255,255,255,0.6)', transform: 'translateZ(5px)' }} />
              <div className="absolute -bottom-3 left-[6%] right-[6%] h-3 rounded-[10px] bg-gradient-to-b from-gray-200 to-gray-300" style={{ boxShadow: '0 6px 14px rgba(0,0,0,0.18), inset 0 1px 2px rgba(255,255,255,0.7)', transform: 'translateZ(4px)' }} />
              <div className="absolute -bottom-4 left-[8%] right-[8%] h-1 rounded-full bg-black/12" style={{ filter: 'blur(2px)', transform: 'translateZ(3px)' }} />
            </>
          )}
          {/* Glass glare for window designs - enhanced realism */}
          {product.type === 'window-design' && !isMinimal && (
            <>
              <div className="absolute inset-0 rounded-xl bg-[linear-gradient(135deg,rgba(255,255,255,0.6)_0%,transparent_12%,transparent_88%,rgba(255,255,255,0.4)_100%)] pointer-events-none" style={{ transform: 'translateZ(6px)' }} />
              <div className="absolute top-[15%] left-[10%] w-32 h-24 rounded-full bg-white/20" style={{ filter: 'blur(20px)', transform: 'translateZ(6px)' }} />
            </>
          )}
          {/* Condensation / micro speckle for lifestyle realism */}
          {product.type === 'window-design' && isLifestyle && !isMinimal && (
            <>
              <div className="absolute inset-[18px] rounded-xl" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.06) 0.5px, transparent 1.2px), radial-gradient(circle at 65% 55%, rgba(255,255,255,0.04) 0.5px, transparent 1.2px), radial-gradient(circle at 40% 75%, rgba(255,255,255,0.05) 0.6px, transparent 1.4px)', opacity: 0.9, transform: 'translateZ(6px)' }} />
              <div className="absolute inset-[18px] rounded-xl" style={{ backgroundImage: 'radial-gradient(circle at 55% 25%, rgba(0,0,0,0.05) 0.5px, transparent 1.3px), radial-gradient(circle at 30% 60%, rgba(0,0,0,0.04) 0.5px, transparent 1.3px)', opacity: 0.7, mixBlendMode: 'soft-light', transform: 'translateZ(6px)' }} />
            </>
          )}
          {/* Ambient lighting with environmental reflection */}
          {!isMinimal && (
            <>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/35 via-transparent to-black/10 pointer-events-none" style={{ transform: 'translateZ(5px)' }} />
              <div className="absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_20%_20%,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" style={{ transform: 'translateZ(5px)' }} />
            </>
          )}
          {/* Directional light - wall-mounted effect */}
          <div className={`absolute inset-0 rounded-xl ${isLifestyle ? 'bg-[linear-gradient(135deg,rgba(255,255,255,0.2),transparent_40%,rgba(0,0,0,0.06))]' : 'bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_45%,rgba(0,0,0,0.04))]'} pointer-events-none`} style={{ transform: 'translateZ(5px)' }} />
          {/* Micro-details: Installation tape corners */}
          {product.type === 'wallpaper' && !isMinimal && (
            <>
              <div className="absolute top-2 left-2 w-6 h-8 rounded-sm bg-gradient-to-br from-white/60 to-gray-100/40 border border-black/5" style={{ transform: 'translateZ(6px) rotate(2deg)', boxShadow: '1px 2px 4px rgba(0,0,0,0.08)' }} />
              <div className="absolute top-2 right-2 w-6 h-8 rounded-sm bg-gradient-to-br from-white/60 to-gray-100/40 border border-black/5" style={{ transform: 'translateZ(6px) rotate(-2deg)', boxShadow: '-1px 2px 4px rgba(0,0,0,0.08)' }} />
            </>
          )}
        </div>
      </div>
    );
  }

  if (product.type === 'banner') {
    return (
      <div className="relative w-full rounded-2xl border border-black/5 bg-gradient-to-b from-[#fafafa] to-[#f7f7f8] p-6 overflow-hidden" style={stageStyle}>
        <div className="relative mx-auto w-full max-w-[960px]" style={{ ...artStyle, transform: 'perspective(1200px) rotateX(2deg)', transformStyle: 'preserve-3d' }}>
          {/* Ceiling mounting point */}
          {!isMinimal && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-gradient-to-b from-gray-200 to-gray-300" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transform: 'translateZ(-20px)' }} />
          )}
          {/* Top hanging shadow with rod (metal/PVC pipe) */}
          <div className={`absolute -top-7 left-1/2 -translate-x-1/2 h-1 w-full max-w-[85%] rounded-full ${isMinimal ? 'bg-black/15' : 'bg-black/25'}`} style={{ filter: 'blur(2px)', transform: 'translateZ(10px)' }} />
          <div className={`absolute -top-6 left-1/2 -translate-x-1/2 h-3 w-32 rounded-full bg-gradient-to-b ${isMinimal ? 'from-gray-400 to-gray-500' : 'from-gray-500 to-gray-600'}`} style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)', transform: 'translateZ(15px)' }} />
          {/* Main banner with realistic fabric depth */}
          <div className="absolute inset-0 rounded-md overflow-hidden border border-black/15" style={{ boxShadow: strongShadow, transform: 'translateZ(0px)' }}>
            <img src={image} alt={product.name} className="h-full w-full object-cover" />
            {/* Advanced fabric weave texture with depth */}
            {!isMinimal && (
              <>
                <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.02)_0px,transparent_0.5px,transparent_2px),repeating-linear-gradient(0deg,rgba(0,0,0,0.02)_0px,transparent_0.5px,transparent_2px)] pointer-events-none" style={{ backgroundSize: '2px 2px' }} />
                <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="fabricNoise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" /%3E%3C/filter%3E%3Crect width="100" height="100" filter="url(%23fabricNoise)" opacity="0.03"/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }} />
              </>
            )}
          </div>
          {/* Hem reinforcement with stitching detail */}
          <div className="absolute inset-0 rounded-md border-t-[3px] border-b-[3px]" style={{ borderColor: 'rgba(0,0,0,0.12)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08), inset 0 -2px 4px rgba(0,0,0,0.08)' }} />
          <div className={`absolute inset-x-0 top-0 h-4 ${isMinimal ? 'bg-gradient-to-b from-black/6 to-transparent' : 'bg-gradient-to-b from-black/10 to-transparent'} pointer-events-none`} />
          <div className={`absolute inset-x-0 bottom-0 h-4 ${isMinimal ? 'bg-gradient-to-t from-black/6 to-transparent' : 'bg-gradient-to-t from-black/10 to-transparent'} pointer-events-none`} />
          {/* Double-stitch lines */}
          {!isMinimal && (
            <>
              <div className="absolute inset-x-2 top-[6px] h-[1px] bg-black/15" />
              <div className="absolute inset-x-2 top-[10px] h-[1px] bg-black/15" />
              <div className="absolute inset-x-2 bottom-[6px] h-[1px] bg-black/15" />
              <div className="absolute inset-x-2 bottom-[10px] h-[1px] bg-black/15" />
            </>
          )}
          {/* Metal grommets with realistic depth */}
          <div className="absolute inset-0 flex items-start justify-between px-2.5 pt-2" style={{ transform: 'translateZ(2px)' }}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="relative h-3 w-3">
                {/* Grommet shadow on fabric */}
                <div className="absolute inset-[-2px] rounded-full bg-black/20" style={{ filter: 'blur(2px)' }} />
                {/* Outer ring - metal */}
                <div className="absolute inset-0 rounded-full border-2 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500" style={{ borderColor: 'rgba(0,0,0,0.5)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.4)' }} />
                {/* Inner hole */}
                <div className="absolute inset-[4px] rounded-full bg-gradient-to-br from-black/90 to-black/70" style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)' }} />
                {/* Metal highlight */}
                <div className="absolute top-[1px] left-[1px] w-1.5 h-1.5 rounded-full bg-white/40" style={{ filter: 'blur(0.5px)' }} />
              </div>
            ))}
          </div>
          {/* Ambient lighting */}
          {!isMinimal && (
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/14 pointer-events-none" />
          )}
          {/* Bottom weight shadow */}
          <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 h-2.5 w-32 rounded-full ${isMinimal ? 'bg-black/12' : 'bg-black/20'}`} />
          {/* Micro-details: Size/care label on back */}
          {!isMinimal && (
            <div className="absolute top-2 right-3 w-8 h-5 rounded-sm bg-white/90 border border-black/10" style={{ transform: 'translateZ(1px) rotateY(-8deg)', boxShadow: '1px 1px 3px rgba(0,0,0,0.12)' }}>
              <div className="absolute inset-x-1 top-1 h-[1px] bg-black/15" />
              <div className="absolute inset-x-1 top-2 h-[1px] bg-black/12" />
              <div className="absolute inset-x-1 top-3 h-[1px] bg-black/10" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (product.type === 'cap') {
    return (
      <div className="relative w-full rounded-2xl border border-black/5 bg-gradient-to-b from-[#fafafa] to-[#f2f2f2] p-6 overflow-hidden" style={stageStyle}>
        {/* Ambient environment reflection */}
        {!isMinimal && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.015)_100%)] pointer-events-none" />
        )}
        <div className="relative mx-auto h-72 w-80" style={{ transform: 'perspective(1000px) rotateX(-5deg)', transformStyle: 'preserve-3d' }}>
          {/* Crown (top dome) with realistic fabric shading */}
          <div className="absolute inset-x-0 top-3 mx-auto h-40 w-72" style={{ borderRadius: '200px 200px 120px 120px', background: 'radial-gradient(circle at 50% 25%, #32323a, #2a2a2f 45%, #1a1a1e 75%, #121214)', boxShadow: '0 8px 24px rgba(0,0,0,0.3), inset 0 -4px 12px rgba(0,0,0,0.3), inset 0 4px 8px rgba(255,255,255,0.08)', transform: 'translateZ(20px)' }} />
          {/* Panel seam lines (6 panels typical) with stitching detail */}
          {!isMinimal && (
            <>
              <div className="absolute left-[calc(50%-70px)] top-8 h-32 w-[2px] bg-gradient-to-b from-white/10 via-white/6 to-transparent" style={{ transform: 'rotate(-15deg) translateZ(21px)', boxShadow: '1px 0 2px rgba(0,0,0,0.3)' }} />
              <div className="absolute left-[calc(50%+70px)] top-8 h-32 w-[2px] bg-gradient-to-b from-white/10 via-white/6 to-transparent" style={{ transform: 'rotate(15deg) translateZ(21px)', boxShadow: '-1px 0 2px rgba(0,0,0,0.3)' }} />
              <div className="absolute left-[calc(50%-40px)] top-6 h-34 w-[2px] bg-gradient-to-b from-white/12 via-white/8 to-transparent" style={{ transform: 'rotate(-5deg) translateZ(21px)', boxShadow: '1px 0 2px rgba(0,0,0,0.3)' }} />
              <div className="absolute left-[calc(50%+40px)] top-6 h-34 w-[2px] bg-gradient-to-b from-white/12 via-white/8 to-transparent" style={{ transform: 'rotate(5deg) translateZ(21px)', boxShadow: '-1px 0 2px rgba(0,0,0,0.3)' }} />
              {/* Center seam */}
              <div className="absolute left-1/2 -translate-x-1/2 top-4 h-36 w-[2px] bg-gradient-to-b from-white/14 via-white/10 to-transparent" style={{ transform: 'translateZ(21px)', boxShadow: '0 0 3px rgba(0,0,0,0.4)' }} />
            </>
          )}
          {/* Visor with realistic curve and shadow */}
          <div className="absolute inset-x-0 top-28 mx-auto h-16 w-64" style={{ borderRadius: '0 0 140px 140px', background: 'radial-gradient(ellipse at 50% 0%, #32323a 0%, #2f2f34 30%, #1c1c20 70%, #0f0f12)', boxShadow: '0 6px 16px rgba(0,0,0,0.4), inset 0 -2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.08)', transform: 'translateZ(18px)' }} />
          {/* Visor stitching lines - double row */}
          <div className="absolute left-1/2 top-[112px] h-[1px] w-60 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ transform: 'translateZ(19px)' }} />
          <div className="absolute left-1/2 top-[116px] h-[1px] w-58 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" style={{ transform: 'translateZ(19px)' }} />
          {/* Button on top with fabric covered detail */}
          <div className="absolute left-1/2 top-10 h-7 w-7 -translate-x-1/2 rounded-full bg-gradient-to-br from-gray-800 via-gray-900 to-black" style={{ boxShadow: '0 3px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.4)', transform: 'translateZ(22px)' }} />
          {/* Button highlight */}
          <div className="absolute left-1/2 top-[42px] h-2 w-2 -translate-x-1/2 rounded-full bg-white/15" style={{ filter: 'blur(1px)', transform: 'translateZ(23px)' }} />
          {/* Front panel / print area with realistic embroidery effect */}
          <div className={`absolute left-1/2 top-16 h-24 w-36 -translate-x-1/2 rounded-xl overflow-hidden border-2 border-white/12 ${isMinimal ? 'bg-black/18' : 'bg-black/30'}`} style={{ boxShadow: '0 3px 8px rgba(0,0,0,0.3), inset 0 0 8px rgba(0,0,0,0.2)', transform: 'translateZ(21px)' }}>
            <img src={image} alt={product.name} className="h-full w-full object-cover" />
            {/* Embroidered border with thread texture */}
            {!isMinimal && (
              <>
                <div className="absolute inset-0 border-[3px] border-white/10 rounded-xl pointer-events-none" style={{ boxShadow: 'inset 0 0 6px rgba(255,255,255,0.08)' }} />
                <div className="absolute inset-1 rounded-lg" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }} />
              </>
            )}
          </div>
          {/* Brim underside shadow layers - contact shadow */}
          <div className={`absolute left-1/2 top-[156px] h-4 w-48 -translate-x-1/2 rounded-full ${isMinimal ? 'bg-black/12' : 'bg-black/25'}`} style={{ filter: 'blur(4px)' }} />
          <div className={`absolute left-1/2 top-[158px] h-3 w-44 -translate-x-1/2 rounded-full ${isMinimal ? 'bg-black/8' : 'bg-black/15'}`} style={{ filter: 'blur(2px)' }} />
          <div className={`absolute left-1/2 top-[160px] h-2 w-40 -translate-x-1/2 rounded-full ${isMinimal ? 'bg-black/6' : 'bg-black/10'}`} style={{ filter: 'blur(1px)' }} />
          {/* Crown highlight - environmental reflection */}
          {!isMinimal && (
            <>
              <div className="absolute inset-x-0 top-6 mx-auto h-36 w-64 rounded-[180px] bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.15),transparent_60%)]" style={{ transform: 'translateZ(21px)' }} />
              <div className="absolute left-[calc(50%-45px)] top-16 h-16 w-8 rounded-full bg-white/8" style={{ filter: 'blur(6px)', transform: 'translateZ(21px) rotate(-25deg)' }} />
            </>
          )}
          {/* Center front stitch line - visor attachment */}
          <div className="absolute left-1/2 top-[148px] h-[1.5px] w-48 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent" style={{ transform: 'translateZ(19px)', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
          {/* Micro-details: Size sticker under brim */}
          {!isMinimal && (
            <div className="absolute left-1/2 -translate-x-1/2 top-[165px] w-10 h-4 rounded-sm bg-gradient-to-b from-yellow-50 to-yellow-100/90 border border-yellow-600/20" style={{ transform: 'translateZ(1px)', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
              <div className="absolute inset-x-1 top-1 text-[5px] font-bold text-yellow-900/60 text-center">ONE SIZE</div>
            </div>
          )}
          {/* Adjustment strap shadow (back of cap) */}
          {!isMinimal && (
            <div className="absolute left-1/2 -translate-x-1/2 top-[142px] w-20 h-4 rounded-sm bg-black/8" style={{ filter: 'blur(2px)', transform: 'translateZ(0px)' }} />
          )}
        </div>
      </div>
    );
  }

  if (product.type === 'tshirt' || product.type === 'hoodie') {
    return (
      <div className="relative w-full rounded-2xl border border-black/5 bg-gradient-to-b from-[#fafafa] to-[#f2f2f2] p-6 overflow-hidden" style={stageStyle}>
        {/* Studio ambient lighting */}
        {!isMinimal && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_30%,rgba(0,0,0,0.02)_100%)] pointer-events-none" />
        )}
        <div className="relative mx-auto h-[420px] w-[340px]" style={{ transform: 'perspective(1200px) rotateY(0deg)', transformStyle: 'preserve-3d' }}>
          {/* Torso with realistic fabric shading */}
          <div className="absolute inset-0" style={{ borderRadius: '52px', background: 'radial-gradient(ellipse at 50% 8%, #f8f8fa 0%, #f1f1f3 40%, #e8e8ec 70%, #dcdce0)', boxShadow: '0 12px 32px rgba(0,0,0,0.12), inset 0 2px 8px rgba(255,255,255,0.6), inset 0 -4px 12px rgba(0,0,0,0.08)', transform: 'translateZ(10px)' }} />
          {/* Sleeves with realistic shoulder seam and depth */}
          <div className="absolute -left-10 top-10 h-24 w-24" style={{ borderRadius: '40px', background: 'radial-gradient(circle at 70% 40%, #e0e0e4, #d8d8dc 50%, #cecece)', boxShadow: 'inset 3px 0 8px rgba(0,0,0,0.12), inset 0 2px 4px rgba(255,255,255,0.3), 2px 4px 12px rgba(0,0,0,0.08)', transform: 'translateZ(8px) rotateY(-8deg)' }} />
          <div className="absolute -right-10 top-10 h-24 w-24" style={{ borderRadius: '40px', background: 'radial-gradient(circle at 30% 40%, #e0e0e4, #d8d8dc 50%, #cecece)', boxShadow: 'inset -3px 0 8px rgba(0,0,0,0.12), inset 0 2px 4px rgba(255,255,255,0.3), -2px 4px 12px rgba(0,0,0,0.08)', transform: 'translateZ(8px) rotateY(8deg)' }} />
          {/* Shoulder seams with realistic stitching */}
          {!isMinimal && (
            <>
              <div className="absolute left-8 top-12 h-20 w-[3px] bg-gradient-to-b from-black/12 to-black/6" style={{ transform: 'rotate(-12deg) translateZ(11px)', boxShadow: '1px 0 2px rgba(0,0,0,0.15), -1 px 0 1px rgba(255,255,255,0.3)' }} />
              <div className="absolute right-8 top-12 h-20 w-[3px] bg-gradient-to-b from-black/12 to-black/6" style={{ transform: 'rotate(12deg) translateZ(11px)', boxShadow: '-1px 0 2px rgba(0,0,0,0.15), 1px 0 1px rgba(255,255,255,0.3)' }} />
              {/* Side seams */}
              <div className="absolute left-2 top-20 h-[280px] w-[2px] bg-gradient-to-b from-black/8 to-black/4" style={{ transform: 'translateZ(11px)', boxShadow: '1px 0 1px rgba(0,0,0,0.1)' }} />
              <div className="absolute right-2 top-20 h-[280px] w-[2px] bg-gradient-to-b from-black/8 to-black/4" style={{ transform: 'translateZ(11px)', boxShadow: '-1px 0 1px rgba(0,0,0,0.1)' }} />
            </>
          )}
          {/* Hood for hoodies with realistic depth */}
          {product.type === 'hoodie' && (
            <>
              <div className="absolute left-1/2 top-2 h-20 w-40 -translate-x-1/2" style={{ borderRadius: '80px 80px 40px 40px', background: 'radial-gradient(ellipse at 50% 30%, #dedee2, #d6d6db 50%, #cacaca)', boxShadow: 'inset 0 4px 12px rgba(255,255,255,0.4), inset 0 -2px 8px rgba(0,0,0,0.15), 0 6px 16px rgba(0,0,0,0.1)', transform: 'translateZ(12px)' }} />
              {/* Drawstring holes with metal eyelets */}
              <div className="absolute left-[calc(50%-18px)] top-14 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-gray-400 to-gray-600" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.5)', transform: 'translateZ(13px)' }} />
              <div className="absolute left-[calc(50%-18px)] top-14 h-1 w-1 rounded-full bg-black/60" style={{ transform: 'translateZ(13px) translate(3px, 3px)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)' }} />
              <div className="absolute left-[calc(50%+18px)] top-14 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-gray-400 to-gray-600" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.5)', transform: 'translateZ(13px)' }} />
              <div className="absolute left-[calc(50%+18px)] top-14 h-1 w-1 rounded-full bg-black/60" style={{ transform: 'translateZ(13px) translate(3px, 3px)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)' }} />
              {/* Drawstrings */}
              {!isMinimal && (
                <>
                  <div className="absolute left-[calc(50%-16px)] top-[60px] h-20 w-1 bg-gradient-to-b from-gray-100 to-gray-300 rounded-full" style={{ transform: 'translateZ(11px) rotate(3deg)', boxShadow: '1px 0 2px rgba(0,0,0,0.2)' }} />
                  <div className="absolute left-[calc(50%+16px)] top-[60px] h-20 w-1 bg-gradient-to-b from-gray-100 to-gray-300 rounded-full" style={{ transform: 'translateZ(11px) rotate(-3deg)', boxShadow: '-1px 0 2px rgba(0,0,0,0.2)' }} />
                </>
              )}
              {/* Drawstring aglets for hoodie realism */}
              {!isMinimal && (
                <>
                  <div className="absolute left-[calc(50%-16px)] top-[78px] h-3 w-2 rounded-sm bg-gradient-to-b from-gray-300 to-gray-500 border border-black/20" style={{ transform: 'translateZ(12px) rotate(2deg)', boxShadow: '0 1px 2px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.5)' }} />
                  <div className="absolute left-[calc(50%+15px)] top-[78px] h-3 w-2 rounded-sm bg-gradient-to-b from-gray-300 to-gray-500 border border-black/20" style={{ transform: 'translateZ(12px) rotate(-2deg)', boxShadow: '0 1px 2px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.5)' }} />
                </>
              )}
            </>
          )}
          {/* Collar/neckline with realistic ribbing */}
          <div className="absolute left-1/2 top-8 h-8 w-16 -translate-x-1/2 rounded-full bg-gradient-to-b from-white/80 to-gray-100/70 border border-black/10" style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.12), inset 0 -1px 3px rgba(255,255,255,0.6), 0 2px 6px rgba(0,0,0,0.08)', transform: 'translateZ(12px)' }} />
          {/* Ribbing texture on collar */}
          {!isMinimal && (
            <div className="absolute left-1/2 top-8 h-8 w-16 -translate-x-1/2 rounded-full overflow-hidden" style={{ transform: 'translateZ(13px)' }}>
              <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.03)_0px,transparent_1px,transparent_2px)]" />
            </div>
          )}
          {/* Print area with DTG texture */}
          <div className="absolute left-1/2 top-24 h-44 w-40 -translate-x-1/2 overflow-hidden rounded-2xl border border-black/10 bg-white" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1), inset 0 1px 3px rgba(0,0,0,0.05)', transform: 'translateZ(11px)' }}>
            <img src={image} alt={product.name} className="h-full w-full object-cover" />
            {/* Subtle DTG print texture */}
            {!isMinimal && (
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.008),transparent_1px,transparent_2px)] pointer-events-none" />
            )}
          </div>
          {/* Kangaroo pocket for hoodie shape accuracy */}
          {product.type === 'hoodie' && (
            <div className="absolute left-1/2 top-[210px] h-24 w-48 -translate-x-1/2 rounded-[22px] bg-gradient-to-b from-[#f1f1f4] via-[#e8e8ed] to-[#dcdce2]" style={{ boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.35), inset 0 -3px 8px rgba(0,0,0,0.1), 0 6px 16px rgba(0,0,0,0.08)', transform: 'translateZ(10px)' }}>
              <div className="absolute inset-x-4 top-0 h-3 rounded-full bg-gradient-to-b from-black/8 to-black/2" style={{ boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.35)' }} />
              {!isMinimal && (
                <>
                  <div className="absolute inset-y-4 left-[18%] w-[1.5px] bg-black/10" style={{ boxShadow: '1px 0 1px rgba(255,255,255,0.2)' }} />
                  <div className="absolute inset-y-4 right-[18%] w-[1.5px] bg-black/10" style={{ boxShadow: '-1px 0 1px rgba(255,255,255,0.2)' }} />
                  <div className="absolute inset-0 rounded-[22px] ring-1 ring-inset ring-black/6 pointer-events-none" />
                </>
              )}
            </div>
          )}
          {/* Bottom hem with realistic ribbing texture */}
          <div className="absolute bottom-6 left-1/2 h-4 w-44 -translate-x-1/2 rounded-full bg-gradient-to-b from-black/14 via-black/10 to-black/6" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15), 0 -1px 2px rgba(255,255,255,0.2)', transform: 'translateZ(10px)' }} />
          {!isMinimal && (
            <>
              <div className="absolute bottom-6 left-1/2 h-4 w-44 -translate-x-1/2 rounded-full bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.03)_0px,transparent_1.5px,transparent_3px)]" style={{ transform: 'translateZ(11px)' }} />
              {/* Hem stitching */}
              <div className="absolute bottom-[30px] left-1/2 -translate-x-1/2 w-40 h-[1.5px] bg-black/10" style={{ transform: 'translateZ(11px)', boxShadow: '0 1px 1px rgba(255,255,255,0.3)' }} />
            </>
          )}
          {/* Edge outline with fabric fold */}
          <div className="absolute inset-0 rounded-[52px] ring-1 ring-black/5 pointer-events-none" style={{ boxShadow: 'inset 1px 1px 3px rgba(255,255,255,0.3), inset -1px -1px 2px rgba(0,0,0,0.05)', transform: 'translateZ(11px)' }} />
          {/* Top highlight - studio lighting */}
          {!isMinimal && (
            <div className="absolute inset-0 rounded-[52px] bg-[radial-gradient(ellipse_at_50%_10%,rgba(255,255,255,0.4),transparent_50%)] pointer-events-none" style={{ transform: 'translateZ(11px)' }} />
          )}
          {/* Advanced fabric weave texture */}
          {!isMinimal && (
            <>
              <div className="absolute inset-0 rounded-[52px] bg-[repeating-linear-gradient(120deg,rgba(0,0,0,0.025),rgba(0,0,0,0.025)_1.5px,rgba(255,255,255,0.015)_3px)] pointer-events-none" style={{ transform: 'translateZ(11px)' }} />
              <div className="absolute inset-0 rounded-[52px] opacity-40 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="150" height="150" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="cottonTexture"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="2.5" numOctaves="2" /%3E%3C/filter%3E%3Crect width="150" height="150" filter="url(%23cottonTexture)" opacity="0.025"/%3E%3C/svg%3E")', mixBlendMode: 'overlay', transform: 'translateZ(11px)' }} />
            </>
          )}
          {/* Directional studio light from top-left */}
          {!isMinimal && (
            <div className="absolute inset-0 rounded-[52px] bg-[linear-gradient(145deg,rgba(255,255,255,0.22)_0%,transparent_30%,rgba(0,0,0,0.08)_70%,rgba(0,0,0,0.15))] pointer-events-none" style={{ transform: 'translateZ(11px)' }} />
          )}
          {/* Micro-details: Tag on inside collar */}
          {!isMinimal && (
            <div className="absolute left-1/2 -translate-x-1/2 top-[18px] w-3 h-6 bg-white/95 border-l border-r border-black/10" style={{ transform: 'translateZ(12px) rotateX(-15deg)', boxShadow: '0 2px 4px rgba(0,0,0,0.12)' }} />
          )}
          {/* Surface texture variation (worn areas) */}
          {isLifestyle && !isMinimal && (
            <>
              <div className="absolute left-8 top-32 w-12 h-12 rounded-full bg-white/[0.015]" style={{ filter: 'blur(8px)', transform: 'translateZ(11px)' }} />
              <div className="absolute right-12 bottom-20 w-16 h-16 rounded-full bg-black/[0.008]" style={{ filter: 'blur(10px)', transform: 'translateZ(11px)' }} />
            </>
          )}
        </div>
      </div>
    );
  }

  if (product.type === 'pants') {
    return (
      <div className="relative w-full rounded-2xl border border-black/5 bg-gradient-to-b from-[#fafafa] to-[#f2f2f2] p-6 overflow-hidden" style={stageStyle}>
        {!isMinimal && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_35%,rgba(0,0,0,0.015)_100%)] pointer-events-none" />
        )}
        <div className="relative mx-auto h-[440px] w-[320px]" style={{ transform: 'perspective(1200px) rotateY(0deg)', transformStyle: 'preserve-3d' }}>
          {/* Overall silhouette with realistic denim/fabric shading */}
          <div className="absolute inset-0" style={{ borderRadius: '42px', background: 'radial-gradient(ellipse at 50% 8%, #f6f6f8 0%, #f0f0f2 35%, #e6e6ea 65%, #dcdce0)', boxShadow: '0 10px 28px rgba(0,0,0,0.12), inset 0 2px 8px rgba(255,255,255,0.5), inset 0 -4px 12px rgba(0,0,0,0.08)', transform: 'translateZ(10px)' }} />
          {/* Waistband with realistic depth and button */}
          <div className="absolute left-1/2 top-10 h-11 w-24 -translate-x-1/2 rounded-full bg-gradient-to-b from-white/85 to-gray-100/75 border border-black/10" style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.12), inset 0 -1px 3px rgba(255,255,255,0.5), 0 3px 8px rgba(0,0,0,0.1)', transform: 'translateZ(12px)' }} />
          {/* Button */}
          {!isMinimal && (
            <div className="absolute left-1/2 top-12 h-3 w-3 -translate-x-1/2 rounded-full bg-gradient-to-br from-gray-400 to-gray-600" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.3)', transform: 'translateZ(13px)' }} />
          )}
          {/* Belt loops with depth */}
          {!isMinimal && (
            <>
              <div className="absolute left-[calc(50%-35px)] top-11 h-7 w-2.5 rounded-sm bg-gradient-to-r from-black/12 to-black/8" style={{ boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.15), 1px 1px 2px rgba(0,0,0,0.1)', transform: 'translateZ(12px)' }} />
              <div className="absolute left-[calc(50%-15px)] top-11 h-7 w-2.5 rounded-sm bg-gradient-to-r from-black/12 to-black/8" style={{ boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.15), 1px 1px 2px rgba(0,0,0,0.1)', transform: 'translateZ(12px)' }} />
              <div className="absolute left-[calc(50%+15px)] top-11 h-7 w-2.5 rounded-sm bg-gradient-to-r from-black/10 to-black/8" style={{ boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.15), -1px 1px 2px rgba(0,0,0,0.1)', transform: 'translateZ(12px)' }} />
              <div className="absolute left-[calc(50%+35px)] top-11 h-7 w-2.5 rounded-sm bg-gradient-to-r from-black/10 to-black/8" style={{ boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.15), -1px 1px 2px rgba(0,0,0,0.1)', transform: 'translateZ(12px)' }} />
            </>
          )}
          {/* Left leg with realistic inseam and shading */}
          <div className="absolute left-10 top-20 h-72 w-24 rounded-3xl bg-gradient-to-r from-[#e8e8ec] via-[#e3e3e6] to-[#dcdce0]" style={{ boxShadow: 'inset -2px 0 6px rgba(0,0,0,0.12), inset 0 2px 4px rgba(255,255,255,0.3), 2px 4px 12px rgba(0,0,0,0.08)', transform: 'translateZ(9px)' }} />
          {!isMinimal && (
            <>
              <div className="absolute left-[130px] top-20 h-72 w-[3px] bg-gradient-to-b from-black/10 to-black/6" style={{ transform: 'translateZ(10px)', boxShadow: '1px 0 2px rgba(0,0,0,0.12), -1px 0 1px rgba(255,255,255,0.2)' }} />
              {/* Leg crease */}
              <div className="absolute left-[116px] top-22 h-68 w-[1px] bg-gradient-to-b from-transparent via-black/8 to-transparent" style={{ transform: 'translateZ(10px)' }} />
            </>
          )}
          {/* Right leg with outseam depth */}
          <div className="absolute right-10 top-20 h-72 w-24 rounded-3xl bg-gradient-to-l from-[#e8e8ec] via-[#e3e3e6] to-[#dcdce0]" style={{ boxShadow: 'inset 2px 0 6px rgba(0,0,0,0.12), inset 0 2px 4px rgba(255,255,255,0.3), -2px 4px 12px rgba(0,0,0,0.08)', transform: 'translateZ(9px)' }} />
          {!isMinimal && (
            <>
              <div className="absolute right-[130px] top-20 h-72 w-[3px] bg-gradient-to-b from-black/10 to-black/6" style={{ transform: 'translateZ(10px)', boxShadow: '-1px 0 2px rgba(0,0,0,0.12), 1px 0 1px rgba(255,255,255,0.2)' }} />
              {/* Leg crease */}
              <div className="absolute right-[116px] top-22 h-68 w-[1px] bg-gradient-to-b from-transparent via-black/8 to-transparent" style={{ transform: 'translateZ(10px)' }} />
            </>
          )}
          {/* Realistic pocket details */}
          {!isMinimal && (
            <>
              <div className="absolute left-14 top-24 h-18 w-16 rounded-2xl border-[2.5px] border-black/10" style={{ borderRightWidth: 0, boxShadow: 'inset -1px 1px 3px rgba(0,0,0,0.08)', transform: 'translateZ(10px)' }} />
              <div className="absolute right-14 top-24 h-18 w-16 rounded-2xl border-[2.5px] border-black/10" style={{ borderLeftWidth: 0, boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.08)', transform: 'translateZ(10px)' }} />
              {/* Coin pocket */}
              <div className="absolute right-16 top-20 h-8 w-8 rounded-lg border-2 border-black/8" style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)', transform: 'translateZ(10px)' }} />
            </>
          )}
          {/* Print area on thigh with depth */}
          <div className="absolute left-1/2 top-24 h-40 w-32 -translate-x-1/2 overflow-hidden rounded-2xl border border-black/10 bg-white" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1), inset 0 1px 3px rgba(0,0,0,0.05)', transform: 'translateZ(11px)' }}>
            <img src={image} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {/* Edge outline with fabric fold */}
          <div className="absolute inset-0 rounded-[42px] ring-1 ring-black/5 pointer-events-none" style={{ boxShadow: 'inset 1px 1px 3px rgba(255,255,255,0.3), inset -1px -1px 2px rgba(0,0,0,0.05)', transform: 'translateZ(11px)' }} />
          {/* Top highlight - studio lighting */}
          {!isMinimal && (
            <div className="absolute inset-0 rounded-[42px] bg-[radial-gradient(ellipse_at_50%_8%,rgba(255,255,255,0.4),transparent_55%)] pointer-events-none" style={{ transform: 'translateZ(11px)' }} />
          )}
          {/* Denim twill texture */}
          {!isMinimal && (
            <>
              <div className="absolute inset-0 rounded-[42px] bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_1.5px,rgba(255,255,255,0.012)_3px)] pointer-events-none" style={{ transform: 'translateZ(11px)' }} />
              <div className="absolute inset-0 rounded-[42px] opacity-35 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="120" height="120" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="denimTexture"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="3" numOctaves="2" /%3E%3C/filter%3E%3Crect width="120" height="120" filter="url(%23denimTexture)" opacity="0.02"/%3E%3C/svg%3E")', mixBlendMode: 'overlay', transform: 'translateZ(11px)' }} />
            </>
          )}
          {/* Directional studio light */}
          {!isMinimal && (
            <div className="absolute inset-0 rounded-[42px] bg-[linear-gradient(145deg,rgba(255,255,255,0.2)_0%,transparent_30%,rgba(0,0,0,0.08)_72%,rgba(0,0,0,0.14))] pointer-events-none" style={{ transform: 'translateZ(11px)' }} />
          )}
          {/* Micro-details: Zipper on waistband */}
          {!isMinimal && (
            <>
              <div className="absolute left-1/2 -translate-x-1/2 top-[46px] w-1 h-8 bg-gradient-to-b from-gray-300 to-gray-500 border-l border-r border-black/20" style={{ transform: 'translateZ(13px)', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.3)' }} />
              <div className="absolute left-1/2 -translate-x-1/2 top-[44px] w-2 h-2 rounded-sm bg-gradient-to-br from-gray-400 to-gray-600" style={{ transform: 'translateZ(14px)', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />
            </>
          )}
          {/* Wear patterns (realistic distressing) */}
          {isLifestyle && !isMinimal && (
            <>
              <div className="absolute left-14 top-42 w-10 h-14 rounded-lg bg-white/[0.012]" style={{ filter: 'blur(6px)', transform: 'translateZ(11px)' }} />
              <div className="absolute right-16 top-48 w-8 h-12 rounded-lg bg-white/[0.01]" style={{ filter: 'blur(5px)', transform: 'translateZ(11px)' }} />
            </>
          )}
        </div>
      </div>
    );
  }

  if (product.type === 'sticker' || product.type === 'business-card') {
    return (
      <div className="relative w-full rounded-2xl border border-black/5 bg-gradient-to-br from-[#fafafa] to-[#f5f5f5] p-6 overflow-hidden" style={stageStyle}>
        {/* Surface ambient lighting */}
        {!isMinimal && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.018)_100%)] pointer-events-none" />
        )}
        <div className="relative mx-auto w-full max-w-[560px]" style={{ ...artStyle, transform: 'perspective(1200px) rotateX(1deg)', transformStyle: 'preserve-3d' }}>
          {/* Stack effect - multiple cards with realistic depth */}
          <div className="absolute inset-3 rounded-xl border border-black/10 shadow-xl bg-white" style={{ transform: 'translateZ(-2px)' }} />
          {product.type === 'business-card' && (
            <div className="absolute inset-2 rounded-xl border border-black/8 shadow-lg bg-white opacity-70" style={{ transform: 'translateZ(-1px)' }} />
          )}
          {/* Top card with realistic die-cut edge and depth */}
          <div className="absolute inset-0 rounded-xl border border-black/15 bg-white" style={{ boxShadow: '0 22px 46px rgba(0,0,0,0.20), 0 12px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)', transform: 'translateZ(0px)' }} />
          {/* Die-cut precision edge with micro-bevel */}
          {product.type === 'business-card' && !isMinimal && (
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/5" style={{ boxShadow: 'inset 0.5px 0.5px 1px rgba(255,255,255,0.3), inset -0.5px -0.5px 1px rgba(0,0,0,0.05)', transform: 'translateZ(1px)' }} />
          )}
          {/* Print area with substrate texture */}
          <div className="absolute inset-4 rounded-lg overflow-hidden" style={{ boxShadow: 'inset 0 0 4px rgba(0,0,0,0.04)', transform: 'translateZ(1px)' }}>
            <img src={image} alt={product.name} className="h-full w-full object-cover" />
            {/* Advanced paper texture for business cards (silk/matte finish) */}
            {product.type === 'business-card' && !isMinimal && (
              <>
                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.012)_0px,transparent_0.8px,transparent_1.5px)] pointer-events-none" />
                <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="200" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="paperGrain"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="5" /%3E%3C/filter%3E%3Crect width="200" height="200" filter="url(%23paperGrain)" opacity="0.03"/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }} />
              </>
            )}
            {/* Vinyl texture for stickers (glossy/matte) */}
            {product.type === 'sticker' && !isMinimal && (
              <>
                <div className="absolute inset-0 bg-[repeating-radial-gradient(circle_at_center,rgba(255,255,255,0.015),transparent_1.5px,transparent_3px)] pointer-events-none" />
                <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="180" height="180" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="vinylTexture"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" /%3E%3C/filter%3E%3Crect width="180" height="180" filter="url(%23vinylTexture)" opacity="0.025"/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }} />
              </>
            )}
          </div>
          {/* Directional gloss/lamination effect */}
          {!isMinimal && (
            <div className="absolute inset-0 rounded-xl bg-[linear-gradient(125deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.08)_25%,rgba(0,0,0,0.05)_75%,rgba(0,0,0,0.1)_100%)] pointer-events-none" style={{ transform: 'translateZ(2px)' }} />
          )}
          {/* Stack depth enhancement for business cards */}
          {product.type === 'business-card' && (
            <>
              <div className="absolute -bottom-7 right-6 h-11 w-44 rounded-xl bg-white border border-black/10" style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.14)', transform: 'translateZ(-3px) rotate(-0.5deg)' }} />
              <div className="absolute -bottom-5 right-7 h-11 w-44 rounded-xl bg-white border border-black/8 opacity-70" style={{ boxShadow: '0 6px 16px rgba(0,0,0,0.10)', transform: 'translateZ(-2px) rotate(-0.3deg)' }} />
              <div className="absolute -bottom-3 right-6.5 h-11 w-44 rounded-xl bg-white/95 border border-black/6 opacity-50" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transform: 'translateZ(-1px) rotate(-0.2deg)' }} />
            </>
          )}
          {/* Peel cue for stickers - realistic backing paper */}
          {product.type === 'sticker' && (
            <>
              {/* Backing paper shadow */}
              <div className="absolute -top-5 left-6 h-6 w-32 rounded-full bg-black/12" style={{ filter: 'blur(3px)', transform: 'translateZ(-1px)' }} />
              {/* Peeled corner with curl */}
              <div className="absolute -top-4 left-7 h-8 w-8 rounded-lg bg-gradient-to-br from-white to-gray-100 border border-black/10" style={{ boxShadow: '2px 3px 8px rgba(0,0,0,0.18), inset -1px -1px 2px rgba(0,0,0,0.08)', transform: 'translateZ(1px) rotateZ(-12deg) rotateX(25deg)', transformOrigin: 'bottom right' }} />
              {/* Die-cut registration marks (corner guides) */}
              {!isMinimal && (
                <>
                  <div className="absolute -top-3 left-8 h-10 w-10 rounded-full border-2 border-dashed border-black/8" />
                  <div className="absolute -top-2 left-10 w-6 h-[1px] bg-black/6" style={{ transform: 'rotate(45deg)' }} />
                </>
              )}
            </>
          )}
          {/* Advanced lamination shine with realistic reflection */}
          {!isMinimal && (
            <>
              <div className="absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_18%_18%,rgba(255,255,255,0.45),rgba(255,255,255,0.12)_35%,transparent_60%)] pointer-events-none" style={{ transform: 'translateZ(3px)' }} />
              {/* Secondary specular highlight */}
              <div className="absolute top-[12%] left-[15%] w-20 h-16 rounded-full bg-white/25" style={{ filter: 'blur(12px)', transform: 'translateZ(3px) rotate(-25deg)' }} />
              {/* Edge highlight (catch light) */}
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" style={{ transform: 'translateZ(3px)' }} />
            </>
          )}
          {/* Micro-details: Fingerprint smudge for business cards */}
          {product.type === 'business-card' && isLifestyle && !isMinimal && (
            <div className="absolute bottom-8 right-12 w-8 h-10 rounded-full bg-black/[0.015]" style={{ filter: 'blur(4px)', transform: 'translateZ(3px) rotate(20deg)' }} />
          )}
          {/* Surface imperfection (tiny scratch) */}
          {product.type === 'sticker' && !isMinimal && (
            <div className="absolute top-[35%] left-[60%] w-16 h-[0.5px] bg-white/20" style={{ transform: 'translateZ(3px) rotate(-18deg)', filter: 'blur(0.3px)' }} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl border border-black/5 bg-gradient-to-br from-[#fafafa] to-[#f2f2f2] p-6 overflow-hidden" style={stageStyle}>
      {/* Gallery wall texture */}
      {!isMinimal && (
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="galleryWall"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" /%3E%3C/filter%3E%3Crect width="100" height="100" filter="url(%23galleryWall)" opacity="0.02"/%3E%3C/svg%3E")', mixBlendMode: 'multiply' }} />
      )}
      <div className="relative mx-auto w-full max-w-[760px]" style={{ ...artStyle, transform: 'perspective(2400px) rotateY(0deg) rotateX(-1deg)', transformStyle: 'preserve-3d' }}>
        {/* Outer frame with realistic wood grain and depth */}
        <div className="absolute inset-0 rounded-lg border-[16px]" style={{ 
          borderImage: 'linear-gradient(135deg, #3a2d22 0%, #2c2017 35%, #241a12 65%, #1f1510 100%) 1',
          borderStyle: 'solid',
          background: 'linear-gradient(135deg, #3e3024 0%, #2c2017 40%, #241a12 70%, #1a120e 100%)',
          boxShadow: '0 26px 56px rgba(0,0,0,0.28), 0 16px 32px rgba(0,0,0,0.18), 0 8px 16px rgba(0,0,0,0.12), inset 0 2px 4px rgba(255,255,255,0.08), inset 0 -2px 6px rgba(0,0,0,0.4)',
          transform: 'translateZ(5px)'
        }} />
        {/* Advanced wood grain with knots and variation */}
        {!isMinimal && (
          <>
            <div className="absolute inset-0 rounded-lg bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.18)_0px,transparent_1px,rgba(50,35,20,0.08)_2px,transparent_4px,rgba(255,255,255,0.04)_5px)] pointer-events-none" style={{ transform: 'translateZ(6px)' }} />
            <div className="absolute inset-0 rounded-lg opacity-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="300" height="300" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="woodGrain"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.08 0.02" numOctaves="5" /%3E%3C/filter%3E%3Crect width="300" height="300" filter="url(%23woodGrain)" opacity="0.25"/%3E%3C/svg%3E")', mixBlendMode: 'multiply', transform: 'translateZ(6px)' }} />
          </>
        )}
        {/* Mat board with realistic bevel and texture */}
        <div className="absolute inset-[20px] rounded-md border-[14px]" style={{ 
          borderImage: 'linear-gradient(135deg, #faf7f0 0%, #f5f0e8 40%, #ebe6de 70%, #e0dbd3 100%) 1',
          borderStyle: 'solid',
          background: 'linear-gradient(135deg, #fdfbf6 0%, #f8f4ec 35%, #f0ebe3 70%, #e8e3db 100%)',
          boxShadow: 'inset 0 0 12px rgba(0,0,0,0.06), inset 3px 3px 8px rgba(0,0,0,0.05), inset -1px -1px 4px rgba(255,255,255,0.5), 0 -2px 8px rgba(0,0,0,0.08)',
          transform: 'translateZ(8px)'
        }} />
        {/* Mat board bevel edges (depth illusion) */}
        {!isMinimal && (
          <>
            {/* Inner bevel highlight */}
            <div className="absolute inset-[20px] rounded-md ring-1 ring-inset ring-black/6 pointer-events-none" style={{ boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.6), inset -1px -1px 3px rgba(0,0,0,0.08)', transform: 'translateZ(9px)' }} />
            {/* Mat texture (cotton fiber) */}
            <div className="absolute inset-[20px] rounded-md opacity-40 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="250" height="250" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="matBoard"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="4" /%3E%3C/filter%3E%3Crect width="250" height="250" filter="url(%23matBoard)" opacity="0.025"/%3E%3C/svg%3E")', mixBlendMode: 'overlay', transform: 'translateZ(9px)' }} />
          </>
        )}
        {/* Print area with protective glass and material texture */}
        <div className="absolute inset-[36px] rounded-sm overflow-hidden bg-white" style={{ boxShadow: 'inset 0 0 6px rgba(0,0,0,0.04)', transform: 'translateZ(10px)' }}>
          <img src={image} alt={product.name} className="h-full w-full object-cover" />
          {/* Advanced canvas weave for canvas type */}
          {product.type === 'canvas' && !isMinimal && (
            <>
              <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.025)_0px,transparent_1px,transparent_2.5px),repeating-linear-gradient(0deg,rgba(0,0,0,0.025)_0px,transparent_1px,transparent_2.5px)] pointer-events-none" style={{ backgroundSize: '2.5px 2.5px' }} />
              <div className="absolute inset-0 opacity-45" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="180" height="180" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="canvasWeave"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="4" numOctaves="2" /%3E%3C/filter%3E%3Crect width="180" height="180" filter="url(%23canvasWeave)" opacity="0.04"/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }} />
              {/* Canvas stretcher bar shadow (depth behind canvas) */}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.03)_0%,transparent_8%,transparent_92%,rgba(0,0,0,0.03)_100%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.03)_0%,transparent_8%,transparent_92%,rgba(0,0,0,0.03)_100%)] pointer-events-none" />
            </>
          )}
          {/* Museum-grade paper grain for poster type */}
          {product.type === 'poster' && !isMinimal && (
            <>
              <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.012)_0px,transparent_0.6px,transparent_1.8px)] pointer-events-none" />
              <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="220" height="220" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="paperFiber"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="4" /%3E%3C/filter%3E%3Crect width="220" height="220" filter="url(%23paperFiber)" opacity="0.022"/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }} />
            </>
          )}
        </div>
        {/* Museum glass with realistic reflections */}
        {!isMinimal && (
          <>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/25 via-transparent to-black/15 pointer-events-none" style={{ transform: 'translateZ(12px)' }} />
            {/* Primary window reflection */}
            <div className="absolute top-[8%] left-[12%] w-48 h-64 rounded-lg bg-white/12" style={{ filter: 'blur(24px)', transform: 'translateZ(12px) rotate(-8deg)' }} />
            {/* Secondary light source reflection */}
            <div className="absolute bottom-[15%] right-[18%] w-32 h-32 rounded-full bg-white/8" style={{ filter: 'blur(20px)', transform: 'translateZ(12px)' }} />
          </>
        )}
        {/* Advanced texture pattern matching print type */}
        {!isMinimal && (
          <div className="absolute inset-[36px] rounded-sm bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.07)_0px,rgba(255,255,255,0.07)_2px,rgba(0,0,0,0.045)_4px)] pointer-events-none" style={{ transform: 'translateZ(11px)' }} />
        )}
        {/* Gallery spotlight (focused museum lighting) */}
        {!isMinimal && (
          <>
            <div className="absolute inset-[36px] rounded-sm bg-[radial-gradient(ellipse_at_22%_18%,rgba(255,255,255,0.25),transparent_65%)] pointer-events-none" style={{ transform: 'translateZ(11px)' }} />
            {/* Secondary ambient reflection from opposite wall */}
            <div className="absolute inset-[36px] rounded-sm bg-[radial-gradient(ellipse_at_78%_85%,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none" style={{ transform: 'translateZ(11px)' }} />
          </>
        )}
        {/* Glass anti-reflective coating edge */}
        {!isMinimal && (
          <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/15 pointer-events-none" style={{ transform: 'translateZ(12px)' }} />
        )}
        {/* Micro-details: Hanging wire on back */}
        {!isMinimal && (
          <>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-8 bg-gradient-to-b from-transparent via-gray-400/60 to-transparent" style={{ transform: 'translateZ(-5px)' }} />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-gray-400/40" style={{ transform: 'translateZ(-5px)' }} />
          </>
        )}
        {/* Surface imperfections on glass */}
        {isLifestyle && !isMinimal && (
          <>
            <div className="absolute top-[22%] right-[28%] w-3 h-3 rounded-full bg-white/[0.03]" style={{ filter: 'blur(2px)', transform: 'translateZ(12px)' }} />
            <div className="absolute bottom-[35%] left-[40%] w-2 h-2 rounded-full bg-black/[0.008]" style={{ filter: 'blur(1.5px)', transform: 'translateZ(12px)' }} />
          </>
        )}
        {/* Dust particles on edge */}
        {!isMinimal && (
          <>
            <div className="absolute bottom-4 left-[15%] w-[1px] h-[1px] rounded-full bg-black/10" />
            <div className="absolute top-[30%] right-[20%] w-[0.5px] h-[0.5px] rounded-full bg-black/08" />
          </>
        )}
      </div>
    </div>
  );
}

function ProductDetailPage({
  product,
  artworks,
  onBack,
  onOrder,
  onCustomize,
  userEmail,
}: {
  product: PrintProduct;
  artworks: DigitalArt[];
  onBack: () => void;8
  onOrder: (product: PrintProduct, size: any, artId?: string, customUrl?: string) => void;
  onCustomize: (product: PrintProduct) => void;
  userEmail: string;
}) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedArt, setSelectedArt] = useState<DigitalArt | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [artSearch, setArtSearch] = useState('');
  const [mockupStyle, setMockupStyle] = useState<MockupStyle>('studio');

  const filteredArt = artworks.filter(a =>
    a.name.toLowerCase().includes(artSearch.toLowerCase()) ||
    (a.artist || '').toLowerCase().includes(artSearch.toLowerCase()) ||
    (a.tags || []).some(t => t.includes(artSearch.toLowerCase()))
  );

  const totalPrice = (selectedSize.price * quantity);
  const previewImage = selectedArt?.image || product.image;
  const previewRatio = selectedSize.width && selectedSize.height
    ? selectedSize.width / selectedSize.height
    : 4 / 5;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Back button */}
      <div className="sticky top-0 z-20 bg-[#f5f5f7]/95 backdrop-blur-lg border-b border-black/5 px-4 sm:px-8 py-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm rounded-full bg-black/80 text-white px-4 py-2 hover:bg-black transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to Products
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Preview */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {(['minimal', 'studio', 'lifestyle'] as MockupStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => setMockupStyle(style)}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-semibold transition-all ${mockupStyle === style ? 'bg-black text-white' : 'bg-white border border-black/10 text-black/60 hover:border-black/25'}`}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
            <ProductMockup product={product} image={previewImage} ratio={previewRatio} style={mockupStyle} />
            {selectedArt && (
              <div className="inline-flex items-center gap-2 rounded-full bg-black/80 text-white text-[10px] px-3 py-1.5 backdrop-blur-sm">
                {selectedArt.name} by {selectedArt.artist}
              </div>
            )}

            {/* Size visual indicator */}
            <div className="bg-white rounded-xl border border-black/5 p-4">
              <p className="text-[10px] uppercase tracking-widest text-black/50 font-semibold mb-3">Size Preview</p>
              <div className="flex items-end justify-center gap-3 h-28">
                {product.sizes.map((s) => {
                  const scale = s.width && s.height
                    ? Math.min(s.width, s.height) / Math.max(...product.sizes.map(sz => Math.max(sz.width || 1, sz.height || 1)))
                    : 0.5;
                  const sizeRatio = s.width && s.height ? s.width / s.height : 4 / 5;
                  const isActive = s.label === selectedSize.label;
                  return (
                    <button key={s.label} onClick={() => setSelectedSize(s)} className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'scale-110' : 'opacity-50 hover:opacity-70'}`}>
                      <div className={`relative overflow-hidden border-2 ${isActive ? 'border-black' : 'border-black/20'} rounded-sm bg-gray-50`} style={{ width: 34 + scale * 44, height: (34 + scale * 44) / sizeRatio }}>
                        <img src={s.image || product.image} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-white/15" />
                      </div>
                      <span className={`text-[9px] font-medium ${isActive ? 'text-black' : 'text-black/40'}`}>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Details & Actions */}
          <div className="flex flex-col">
            <div className="mb-2">
              <span className={`${TYPE_COLORS[product.type] || 'bg-gray-500'} px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider`}>{product.type}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">{product.name}</h1>
            {product.description && <p className="text-sm text-black/60 leading-relaxed mb-6">{product.description}</p>}

            {/* Printer compatible */}
            <div className="flex items-center gap-2 mb-6">
              <Printer className="h-3.5 w-3.5 text-black/40" />
              <span className="text-xs text-black/50">Printed on:</span>
              {product.printerCompatible.map(p => (
                <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-black/60 font-medium">{p}</span>
              ))}
            </div>

            {/* Size selection */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-black mb-3">Select Size</p>
              <div className="grid grid-cols-2 gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setSelectedSize(s)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
                      selectedSize.label === s.label
                        ? 'bg-black text-white shadow-lg'
                        : 'bg-white border border-black/10 text-black hover:border-black/25'
                    }`}
                  >
                    <span className="font-medium">{s.label}</span>
                    <span className="font-bold">${s.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-black mb-3">Quantity</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-xl bg-white border border-black/10 flex items-center justify-center text-black hover:bg-black/5 transition-colors text-lg font-medium">−</button>
                <span className="w-12 text-center text-lg font-bold text-black">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(99, quantity + 1))} className="w-10 h-10 rounded-xl bg-white border border-black/10 flex items-center justify-center text-black hover:bg-black/5 transition-colors text-lg font-medium">+</button>
              </div>
            </div>

            {/* Choose artwork to print */}
            {product.customizable && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-black mb-3">Choose Artwork (Optional)</p>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
                  <input
                    type="text"
                    value={artSearch}
                    onChange={(e) => setArtSearch(e.target.value)}
                    placeholder="Search artwork..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-black/10 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto rounded-xl">
                  <button onClick={() => setSelectedArt(null)} className={`aspect-square rounded-lg border-2 ${!selectedArt ? 'border-black' : 'border-black/10'} overflow-hidden bg-gray-50 flex items-center justify-center`}>
                    <span className="text-[10px] text-black/50 font-medium">Default</span>
                  </button>
                  {filteredArt.slice(0, 8).map(art => (
                    <button key={art.id} onClick={() => setSelectedArt(art)} className={`aspect-square rounded-lg border-2 ${selectedArt?.id === art.id ? 'border-black' : 'border-black/10'} overflow-hidden`}>
                      <img src={art.thumbnail || art.image} alt={art.name} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="mb-6 bg-white rounded-xl border border-black/5 p-4 space-y-2.5">
              <div className="flex items-center gap-3 text-xs text-black/60">
                <Check className="h-4 w-4 text-green-600 shrink-0" />Professional-grade printing
              </div>
              <div className="flex items-center gap-3 text-xs text-black/60">
                <Check className="h-4 w-4 text-green-600 shrink-0" />Color-matched proofing
              </div>
              <div className="flex items-center gap-3 text-xs text-black/60">
                <Truck className="h-4 w-4 text-black/50 shrink-0" />Ships in 3-5 business days
              </div>
              <div className="flex items-center gap-3 text-xs text-black/60">
                <Shield className="h-4 w-4 text-black/50 shrink-0" />Satisfaction guaranteed
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PRODUCT_FEATURE_SECTIONS.map((section) => (
                <div key={section.title} className="rounded-xl border border-black/5 bg-white p-4">
                  <p className="text-[10px] uppercase tracking-widest text-black/40 font-semibold mb-3">{section.title}</p>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-[11px] text-black/60">
                        <div className="h-1.5 w-1.5 rounded-full bg-black/25" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Price & CTA */}
            <div className="mt-auto pt-6 border-t border-black/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-black/50">Total</span>
                <span className="text-3xl font-bold text-black">${totalPrice.toFixed(2)}</span>
              </div>
              <button
                onClick={() => onOrder(product, selectedSize, selectedArt?.id, undefined)}
                className="w-full rounded-2xl bg-black px-6 py-4 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl"
              >
                <ShoppingCart className="h-4 w-4" />Add to Cart — ${totalPrice.toFixed(2)}
              </button>
              <button
                onClick={() => onCustomize(product)}
                className="w-full mt-3 rounded-2xl bg-white border-2 border-black px-6 py-3.5 text-sm font-semibold text-black transition-all hover:bg-black/5 flex items-center justify-center gap-2"
              >
                <Palette className="h-4 w-4" />Customize Design
              </button>
              <p className="text-center text-[10px] text-black/45 mt-3">
                <CreditCard className="inline h-3 w-3 mr-1" />Secure checkout · Free shipping over $99
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DIGITAL ART DETAIL PAGE
// ============================================

function ArtDetailPage({
  art,
  printProducts,
  onBack,
  onDownload,
  onPrintOrder,
  userEmail,
}: {
  art: DigitalArt;
  printProducts: PrintProduct[];
  onBack: () => void;
  onDownload: (art: DigitalArt, format: string) => void;
  onPrintOrder: (art: DigitalArt, product: PrintProduct) => void;
  userEmail: string;
}) {
  const [selectedFormat, setSelectedFormat] = useState(art.fileFormats[0]);
  const [liked, setLiked] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-20 bg-[#f5f5f7]/95 backdrop-blur-lg border-b border-black/5 px-4 sm:px-8 py-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm rounded-full bg-black/80 text-white px-4 py-2 hover:bg-black transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to Gallery
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Preview */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border border-black/5">
              <img src={art.image} alt={art.name} className="w-full h-auto" />
              {art.featured && (
                <div className="absolute top-3 left-3 bg-yellow-500 text-white text-[10px] px-3 py-1 rounded-full font-bold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />Featured
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={() => setLiked(!liked)} className={`w-9 h-9 rounded-full ${liked ? 'bg-red-500 text-white' : 'bg-white/90 text-black/60'} flex items-center justify-center backdrop-blur-sm transition-all hover:scale-110`}>
                  <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                </button>
                <button className="w-9 h-9 rounded-full bg-white/90 text-black/60 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-all">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Technical specs */}
            <div className="bg-white rounded-xl border border-black/5 p-4">
              <p className="text-[10px] uppercase tracking-widest text-black/40 font-semibold mb-3">Technical Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-black/40">Resolution</p>
                  <p className="text-sm font-semibold text-black">{art.resolution}</p>
                </div>
                {art.dimensions && (
                  <div>
                    <p className="text-[10px] text-black/40">Dimensions</p>
                    <p className="text-sm font-semibold text-black">{art.dimensions.width} × {art.dimensions.height}px</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-black/40">Category</p>
                  <p className="text-sm font-semibold text-black capitalize">{art.category.replace('-', ' ')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-black/40">Downloads</p>
                  <p className="text-sm font-semibold text-black">{art.downloads || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Info & Actions */}
          <div className="flex flex-col">
            <span className={`${ART_CATEGORIES[art.category] || 'bg-gray-500'} px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider w-fit mb-3`}>
              {art.category.replace('-', ' ')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-1">{art.name}</h1>
            {art.artist && <p className="text-sm text-black/50 mb-4">by {art.artist}</p>}
            {art.description && <p className="text-sm text-black/60 leading-relaxed mb-6">{art.description}</p>}

            {/* File format selection */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-black mb-3">File Format</p>
              <div className="flex flex-wrap gap-2">
                {art.fileFormats.map(fmt => (
                  <button key={fmt} onClick={() => setSelectedFormat(fmt)} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedFormat === fmt ? 'bg-black text-white shadow-lg' : 'bg-white border border-black/10 text-black hover:border-black/25'}`}>
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {art.tags && art.tags.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-black mb-3">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {art.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-black/5 text-[11px] font-medium text-black/60">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Print this artwork */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-black mb-3">Print This Artwork</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {printProducts.slice(0, 4).map(pp => (
                  <button key={pp.id} onClick={() => onPrintOrder(art, pp)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-black/8 hover:border-black/15 hover:shadow-sm transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-black/5 overflow-hidden shrink-0">
                        <img src={pp.image} alt={pp.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-black">{pp.name}</p>
                        <p className="text-[10px] text-black/40">{pp.sizes.length} sizes available</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-black">From ${pp.basePrice.toFixed(2)}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-black/30 group-hover:text-black/60 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* What's included */}
            <div className="mb-6 bg-white rounded-xl border border-black/5 p-4 space-y-2.5">
              <p className="text-[10px] uppercase tracking-widest text-black/40 font-semibold mb-1">What's Included</p>
              <div className="flex items-center gap-3 text-xs text-black/60">
                <Check className="h-4 w-4 text-green-600 shrink-0" />All file formats ({art.fileFormats.join(', ')})
              </div>
              <div className="flex items-center gap-3 text-xs text-black/60">
                <Check className="h-4 w-4 text-green-600 shrink-0" />{art.resolution} resolution
              </div>
              <div className="flex items-center gap-3 text-xs text-black/60">
                <Check className="h-4 w-4 text-green-600 shrink-0" />Commercial license included
              </div>
              <div className="flex items-center gap-3 text-xs text-black/60">
                <Check className="h-4 w-4 text-green-600 shrink-0" />Instant download after purchase
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PRODUCT_FEATURE_SECTIONS.map((section) => (
                <div key={section.title} className="rounded-xl border border-black/5 bg-white p-4">
                  <p className="text-[10px] uppercase tracking-widest text-black/40 font-semibold mb-3">{section.title}</p>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-[11px] text-black/60">
                        <div className="h-1.5 w-1.5 rounded-full bg-black/25" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Price & CTA */}
            <div className="mt-auto pt-6 border-t border-black/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-black/50">Price</span>
                <span className="text-3xl font-bold text-black">${art.price.toFixed(2)}</span>
              </div>
              <button
                onClick={() => onDownload(art, selectedFormat)}
                className="w-full rounded-2xl bg-black px-6 py-4 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl"
              >
                <Download className="h-4 w-4" />Purchase &amp; Download — ${art.price.toFixed(2)}
              </button>
              <button className="w-full mt-3 rounded-2xl bg-white border-2 border-black px-6 py-3.5 text-sm font-semibold text-black transition-all hover:bg-black/5 flex items-center justify-center gap-2">
                <ShoppingCart className="h-4 w-4" />Add to Cart
              </button>
              <p className="text-center text-[10px] text-black/35 mt-3">Instant download · All formats included</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// UPLOAD PAGE
// ============================================

function UploadPage({
  userEmail,
  printProducts,
  uploads,
  onRefresh,
  onLocalUpload,
  onUseUpload,
  onBack,
}: {
  userEmail: string;
  printProducts: PrintProduct[];
  uploads: UserUpload[];
  onRefresh: () => void;
  onLocalUpload: (upload: UserUpload) => void;
  onUseUpload: (upload: UserUpload, productType?: string) => void;
  onBack: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestUpload = uploads[0];

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      const fallbackUrl = URL.createObjectURL(file);
      let publicUrl = fallbackUrl;

      const localUpload: UserUpload = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        filename: file.name,
        file_url: fallbackUrl,
        thumbnail_url: fallbackUrl,
        file_size: file.size,
        mime_type: file.type,
        created_at: new Date().toISOString(),
      };
      onLocalUpload(localUpload);

      // Get image dimensions
      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 0, h: 0 });
        img.src = fallbackUrl;
      });

      try {
        const bucket = 'print-uploads';
        const filePath = `uploads/${userEmail}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabaseBrowser
          .storage
          .from(bucket)
          .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type });

        if (!uploadError) {
          const { data } = supabaseBrowser.storage.from(bucket).getPublicUrl(filePath);
          if (data?.publicUrl) publicUrl = data.publicUrl;
        }
      } catch (err) {
        console.warn('Supabase upload failed, using local preview URL');
      }

      try {
        await fetch('/api/store/print-uploads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            filename: file.name,
            fileUrl: publicUrl,
            thumbnailUrl: publicUrl,
            fileSize: file.size,
            mimeType: file.type,
            width: dims.w,
            height: dims.h,
            dpi: 72,
          }),
        });
      } catch (err) {
        console.error('Upload save error:', err);
      }
    }

    setUploading(false);
    onRefresh();
  }, [userEmail, onRefresh, onLocalUpload]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-20 bg-[#f5f5f7]/95 backdrop-blur-lg border-b border-black/5 px-4 sm:px-8 py-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm rounded-full bg-black/80 text-white px-4 py-2 hover:bg-black transition-colors">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        <h2 className="text-2xl font-bold text-black mb-2">Upload Your Artwork</h2>
        <p className="text-sm text-black/50 mb-8">Upload images to print on any product. We accept JPG, PNG, TIFF, and PDF files.</p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            dragging ? 'border-black bg-black/5' : 'border-black/15 hover:border-black/30 hover:bg-black/[0.02]'
          }`}
        >
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 text-black/40 animate-spin" />
              <p className="text-sm font-medium text-black/60">Processing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center">
                <Upload className="h-7 w-7 text-black/40" />
              </div>
              <div>
                <p className="text-sm font-semibold text-black">Drop files here or click to browse</p>
                <p className="text-xs text-black/40 mt-1">JPG, PNG, TIFF, PDF · Max 50MB per file</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent uploads */}
        {uploads.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-bold text-black mb-4">Your Uploads</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploads.map((upload) => (
                <div key={upload.id} className="group relative rounded-xl overflow-hidden border border-black/10 bg-white">
                  <div className="aspect-square bg-gray-50">
                    <img src={upload.thumbnail_url || upload.file_url} alt={upload.filename} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-black truncate">{upload.filename}</p>
                    <p className="text-[10px] text-black/40 mt-0.5">
                      {upload.width && upload.height ? `${upload.width}×${upload.height}` : 'Unknown size'}
                      {upload.file_size ? ` · ${(upload.file_size / 1024 / 1024).toFixed(1)}MB` : ''}
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => onUseUpload(upload)} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black hover:scale-105 active:scale-95 transition-transform">
                      <Printer className="h-3.5 w-3.5" />Print This
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mockups */}
        <div className="mt-10">
          <h3 className="text-lg font-bold text-black mb-4">Mockups</h3>
          <p className="text-xs text-black/45 mb-4">Preview your upload across all product types.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {printProducts.map((product) => (
              <button key={product.id} onClick={() => latestUpload && onUseUpload(latestUpload, product.type)} className="group rounded-xl border border-black/10 bg-white overflow-hidden text-left hover:shadow-md transition-shadow">
                <div className="relative aspect-[4/5] bg-gray-50">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  {latestUpload && (
                    <div className="absolute bottom-2 right-2 h-12 w-12 rounded-lg border border-white/80 bg-white/80 overflow-hidden shadow">
                      <img src={latestUpload.thumbnail_url || latestUpload.file_url} alt="Upload preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-black">{product.name}</p>
                  <p className="text-[10px] text-black/40 mt-1 capitalize">{product.type.replace('-', ' ')}</p>
                </div>
              </button>
            ))}
          </div>
          {!latestUpload && (
            <p className="text-[11px] text-black/40 mt-4">Upload a file to enable mockup previews.</p>
          )}
        </div>

        {/* Upload tips */}
        <div className="mt-10 bg-white rounded-2xl border border-black/5 p-6">
          <h3 className="text-sm font-bold text-black mb-4">Upload Tips for Best Results</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                <ZoomIn className="h-4 w-4 text-black/50" />
              </div>
              <div>
                <p className="text-xs font-semibold text-black">High Resolution</p>
                <p className="text-[11px] text-black/50">300 DPI minimum for print. Higher is better.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                <Palette className="h-4 w-4 text-black/50" />
              </div>
              <div>
                <p className="text-xs font-semibold text-black">CMYK Colors</p>
                <p className="text-[11px] text-black/50">CMYK files produce most accurate print colors.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-black/50" />
              </div>
              <div>
                <p className="text-xs font-semibold text-black">Bleed Area</p>
                <p className="text-[11px] text-black/50">Add 0.125&quot; bleed on all sides for clean edges.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                <Image className="h-4 w-4 text-black/50" />
              </div>
              <div>
                <p className="text-xs font-semibold text-black">File Formats</p>
                <p className="text-[11px] text-black/50">PNG for transparency, JPG for photos, PDF for vectors.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TEXT STYLES - 40 Word-like 3D Text Styles
// ============================================
interface TextStyle {
  id: string;
  name: string;
  preview: string; // Short preview text
  css: React.CSSProperties;
}

const TEXT_STYLES: TextStyle[] = [
  // Basic
  { id: 'plain', name: 'Plain', preview: 'Aa', css: {} },
  { id: 'bold', name: 'Bold', preview: 'Aa', css: { fontWeight: 900 } },
  { id: 'italic', name: 'Italic', preview: 'Aa', css: { fontStyle: 'italic' } },
  { id: 'light', name: 'Light', preview: 'Aa', css: { fontWeight: 300 } },
  
  // Shadows
  { id: 'soft-shadow', name: 'Soft Shadow', preview: 'Aa', css: { textShadow: '2px 2px 8px rgba(0,0,0,0.3)' } },
  { id: 'hard-shadow', name: 'Hard Shadow', preview: 'Aa', css: { textShadow: '3px 3px 0 rgba(0,0,0,0.5)' } },
  { id: 'long-shadow', name: 'Long Shadow', preview: 'Aa', css: { textShadow: '1px 1px 0 #333, 2px 2px 0 #333, 3px 3px 0 #333, 4px 4px 0 #333, 5px 5px 0 #333' } },
  { id: 'glow', name: 'Glow', preview: 'Aa', css: { textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor' } },
  
  // 3D Effects
  { id: '3d-raised', name: '3D Raised', preview: 'Aa', css: { textShadow: '0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa, 0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25)' } },
  { id: '3d-emboss', name: '3D Emboss', preview: 'Aa', css: { textShadow: '-1px -1px 1px rgba(255,255,255,.5), 1px 1px 1px rgba(0,0,0,.5)' } },
  { id: '3d-inset', name: '3D Inset', preview: 'Aa', css: { textShadow: '1px 1px 2px rgba(255,255,255,.5), -1px -1px 2px rgba(0,0,0,.3)', color: '#888' } },
  { id: '3d-extrude', name: '3D Extrude', preview: 'Aa', css: { textShadow: '1px 1px 0 #444, 2px 2px 0 #444, 3px 3px 0 #444, 4px 4px 0 #444, 5px 5px 0 #444, 6px 6px 0 #444' } },
  
  // Neon Effects
  { id: 'neon-blue', name: 'Neon Blue', preview: 'Aa', css: { color: '#0ff', textShadow: '0 0 5px #0ff, 0 0 10px #0ff, 0 0 20px #0ff, 0 0 40px #00d' } },
  { id: 'neon-pink', name: 'Neon Pink', preview: 'Aa', css: { color: '#f0f', textShadow: '0 0 5px #f0f, 0 0 10px #f0f, 0 0 20px #f0f, 0 0 40px #d0d' } },
  { id: 'neon-green', name: 'Neon Green', preview: 'Aa', css: { color: '#0f0', textShadow: '0 0 5px #0f0, 0 0 10px #0f0, 0 0 20px #0f0, 0 0 40px #0d0' } },
  { id: 'neon-orange', name: 'Neon Orange', preview: 'Aa', css: { color: '#f80', textShadow: '0 0 5px #f80, 0 0 10px #f80, 0 0 20px #f80, 0 0 40px #f60' } },
  { id: 'neon-red', name: 'Neon Red', preview: 'Aa', css: { color: '#f00', textShadow: '0 0 5px #f00, 0 0 10px #f00, 0 0 20px #f00, 0 0 40px #d00' } },
  
  // Outline Styles
  { id: 'outline-thin', name: 'Outline Thin', preview: 'Aa', css: { WebkitTextStroke: '1px currentColor', WebkitTextFillColor: 'transparent' } as React.CSSProperties },
  { id: 'outline-thick', name: 'Outline Thick', preview: 'Aa', css: { WebkitTextStroke: '2px currentColor', WebkitTextFillColor: 'transparent' } as React.CSSProperties },
  { id: 'outline-shadow', name: 'Outline Shadow', preview: 'Aa', css: { WebkitTextStroke: '1px #000', WebkitTextFillColor: 'transparent', textShadow: '2px 2px 0 rgba(0,0,0,0.3)' } as React.CSSProperties },
  
  // Retro / Vintage
  { id: 'retro-chrome', name: 'Retro Chrome', preview: 'Aa', css: { textShadow: '0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa, 0 6px 4px rgba(0,0,0,.5)' } },
  { id: 'retro-3d', name: 'Retro 3D', preview: 'Aa', css: { color: '#f4d03f', textShadow: '3px 3px 0 #f39c12, 6px 6px 0 #d35400' } },
  { id: 'vintage-stamp', name: 'Vintage Stamp', preview: 'Aa', css: { textShadow: '2px 2px 0 #555, -1px -1px 0 #555, 1px -1px 0 #555, -1px 1px 0 #555' } },
  { id: 'comic-book', name: 'Comic Book', preview: 'Aa', css: { color: '#ff0', textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 4px 4px 0 #000' } },
  
  // Metallic
  { id: 'gold', name: 'Gold', preview: 'Aa', css: { background: 'linear-gradient(180deg, #f9d976 0%, #f39f86 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 2px 4px rgba(0,0,0,0.3)' } as React.CSSProperties },
  { id: 'silver', name: 'Silver', preview: 'Aa', css: { background: 'linear-gradient(180deg, #e8e8e8 0%, #a8a8a8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 2px 4px rgba(0,0,0,0.3)' } as React.CSSProperties },
  { id: 'bronze', name: 'Bronze', preview: 'Aa', css: { background: 'linear-gradient(180deg, #cd7f32 0%, #8b4513 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 2px 4px rgba(0,0,0,0.3)' } as React.CSSProperties },
  { id: 'steel', name: 'Steel', preview: 'Aa', css: { background: 'linear-gradient(180deg, #7b8a8b 0%, #363636 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 2px 4px rgba(0,0,0,0.3)' } as React.CSSProperties },
  
  // Gradients
  { id: 'gradient-fire', name: 'Fire Gradient', preview: 'Aa', css: { background: 'linear-gradient(180deg, #ff0000, #ff7f00, #ffff00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as React.CSSProperties },
  { id: 'gradient-ocean', name: 'Ocean Gradient', preview: 'Aa', css: { background: 'linear-gradient(180deg, #00d2ff, #3a7bd5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as React.CSSProperties },
  { id: 'gradient-sunset', name: 'Sunset Gradient', preview: 'Aa', css: { background: 'linear-gradient(180deg, #fc4a1a, #f7b733)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as React.CSSProperties },
  { id: 'gradient-forest', name: 'Forest Gradient', preview: 'Aa', css: { background: 'linear-gradient(180deg, #134e5e, #71b280)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as React.CSSProperties },
  { id: 'gradient-purple', name: 'Purple Gradient', preview: 'Aa', css: { background: 'linear-gradient(180deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as React.CSSProperties },
  { id: 'gradient-rainbow', name: 'Rainbow', preview: 'Aa', css: { background: 'linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as React.CSSProperties },
  
  // Special Effects
  { id: 'glitch', name: 'Glitch', preview: 'Aa', css: { textShadow: '2px 0 #ff00de, -2px 0 #00ffff' } },
  { id: 'blur', name: 'Blur', preview: 'Aa', css: { textShadow: '0 0 8px currentColor', filter: 'blur(1px)' } },
  { id: 'fire-text', name: 'Fire Text', preview: 'Aa', css: { color: '#ff6600', textShadow: '0 -2px 4px #ff6600, 0 -4px 10px #ff2200, 0 -8px 15px #ff0000' } },
  { id: 'ice-text', name: 'Ice Text', preview: 'Aa', css: { color: '#8be9fd', textShadow: '0 0 10px #8be9fd, 0 0 20px #50b8e0, 0 0 30px #20a0e0' } },
  { id: 'electric', name: 'Electric', preview: 'Aa', css: { color: '#fff', textShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #0073e6, 0 0 20px #0073e6, 0 0 25px #0073e6' } },
  
  // Decorative
  { id: 'chalk', name: 'Chalk', preview: 'Aa', css: { textShadow: '0 0 3px rgba(255,255,255,0.8)', opacity: 0.9 } },
  { id: 'sketch', name: 'Sketch', preview: 'Aa', css: { textShadow: '1px 1px 0 rgba(0,0,0,0.1), 2px 2px 0 rgba(0,0,0,0.08)', fontWeight: 300 } },
  { id: 'stamp-red', name: 'Red Stamp', preview: 'Aa', css: { color: '#c0392b', textShadow: '1px 1px 0 rgba(192,57,43,0.3)', fontWeight: 900 } },
  { id: 'spray-paint', name: 'Spray Paint', preview: 'Aa', css: { textShadow: '0 0 10px currentColor, 0 0 20px currentColor', filter: 'blur(0.5px)' } },
];

// ============================================
// CREATE DESIGN PAGE
// ============================================

function CreateDesignPage({
  userEmail,
  printProducts,
  artworks,
  uploads,
  initialUpload,
  initialProductType,
  onBack,
  onSave,
}: {
  userEmail: string;
  printProducts: PrintProduct[];
  artworks: DigitalArt[];
  uploads: UserUpload[];
  initialUpload?: UserUpload | null;
  initialProductType?: string;
  onBack: () => void;
  onSave: (name: string, productType: string, previewUrl?: string) => void;
}) {
  const [designName, setDesignName] = useState('');
  const [selectedType, setSelectedType] = useState<string>(initialProductType || 'poster');
  const [selectedArt, setSelectedArt] = useState<DigitalArt | null>(null);
  const [selectedUpload, setSelectedUpload] = useState<UserUpload | null>(initialUpload || null);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [textOverlay, setTextOverlay] = useState('');
  const [fontSize, setFontSize] = useState(48);
  const [textColor, setTextColor] = useState('#000000');
  const [textStyle, setTextStyle] = useState<TextStyle>(TEXT_STYLES[0]);
  const [saving, setSaving] = useState(false);
  const [mockupStyle, setMockupStyle] = useState<MockupStyle>('studio');

  useEffect(() => {
    if (initialProductType) setSelectedType(initialProductType);
  }, [initialProductType]);

  useEffect(() => {
    if (initialUpload) setSelectedUpload(initialUpload);
  }, [initialUpload]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(
        designName || 'Untitled Design',
        selectedType,
        selectedArt?.image
      );
    } finally {
      setSaving(false);
    }
  };

  const previewImage = selectedUpload?.file_url || selectedArt?.image;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-20 bg-[#f5f5f7]/95 backdrop-blur-lg border-b border-black/5 px-4 sm:px-8 py-3 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm rounded-full bg-black/80 text-white px-4 py-2 hover:bg-black transition-colors">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-black px-5 py-2 text-xs font-semibold text-white hover:scale-[1.03] active:scale-[0.97] transition-transform disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save Design
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Canvas preview */}
          <div className="space-y-4">
            <div className="relative">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {(['minimal', 'studio', 'lifestyle'] as MockupStyle[]).map((style) => (
                  <button
                    key={style}
                    onClick={() => setMockupStyle(style)}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-semibold transition-all ${mockupStyle === style ? 'bg-black text-white' : 'bg-white border border-black/10 text-black/60 hover:border-black/25'}`}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
              <ProductMockup
                product={{
                  id: 'preview',
                  name: 'Design Preview',
                  type: selectedType as PrintProduct['type'],
                  basePrice: 0,
                  image: previewImage || 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1200&q=80',
                  sizes: [],
                  customizable: true,
                  printerCompatible: [],
                }}
                image={previewImage || 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1200&q=80'}
                ratio={selectedType === 'banner' ? 3 : selectedType === 'window-design' ? 3 / 2 : selectedType === 'wallpaper' ? 9 / 16 : selectedType === 'business-card' ? 3.5 / 2 : selectedType === 'sticker' ? 1 : 4 / 5}
                style={mockupStyle}
              />
              {textOverlay && (
                <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                  <p style={{ fontSize: `${fontSize}px`, color: textColor, lineHeight: 1.2, ...textStyle.css }} className="font-bold text-center break-words max-w-full">
                    {textOverlay}
                  </p>
                </div>
              )}
              {!previewImage && !textOverlay && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Palette className="h-12 w-12 text-black/10 mx-auto mb-3" />
                    <p className="text-sm text-black/30">Choose an artwork or add text</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Design controls */}
          <div className="flex flex-col space-y-5">
            {/* Design name - Enhanced */}
            <div className="bg-gradient-to-br from-black to-black/90 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="h-4 w-4 text-white/70" />
                <label className="text-sm font-semibold">Design Name</label>
              </div>
              <input
                type="text"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                placeholder="Enter a name for your design..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15"
              />
              <p className="text-[10px] text-white/40 mt-2">This helps you identify your design later</p>
            </div>

            {/* Product type - Enhanced */}
            <div className="bg-white rounded-xl border border-black/5 p-4">
              <label className="block text-sm font-semibold text-black mb-1">Select Product</label>
              <p className="text-[11px] text-black/40 mb-3">Choose the type of print product for your design</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRODUCT_TYPES.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedType(key)}
                    className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-xs font-medium transition-all ${
                      selectedType === key 
                        ? 'bg-black text-white shadow-lg ring-2 ring-black ring-offset-2' 
                        : 'bg-gray-50 border border-black/5 text-black/60 hover:border-black/20 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Choose artwork - Enhanced */}
            <div className="bg-white rounded-xl border border-black/5 p-4">
              <label className="block text-sm font-semibold text-black mb-1">Select Artwork</label>
              <p className="text-[11px] text-black/40 mb-3">Choose from our digital art collection or your uploads</p>
              
              {/* Tabs for artwork source */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-3">
                <button className="flex-1 px-3 py-1.5 rounded-md text-[10px] font-semibold bg-white text-black shadow-sm">
                  Gallery
                </button>
                <button className="flex-1 px-3 py-1.5 rounded-md text-[10px] font-medium text-black/50 hover:text-black/70">
                  My Uploads
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                <button onClick={() => { setSelectedArt(null); setSelectedUpload(null); }} className={`aspect-square rounded-lg border-2 ${!selectedArt && !selectedUpload ? 'border-black bg-black/5' : 'border-black/10 bg-gray-50'} overflow-hidden flex flex-col items-center justify-center gap-1 hover:border-black/25 transition-colors`}>
                  <X className="h-4 w-4 text-black/30" />
                  <span className="text-[8px] text-black/40">None</span>
                </button>
                {artworks.map(a => (
                  <button key={a.id} onClick={() => { setSelectedArt(a); setSelectedUpload(null); }} className={`aspect-square rounded-lg border-2 ${selectedArt?.id === a.id ? 'border-black ring-2 ring-black/20' : 'border-black/10 hover:border-black/25'} overflow-hidden transition-all`}>
                    <img src={a.thumbnail || a.image} alt={a.name} className="h-full w-full object-cover" />
                  </button>
                ))}
                {uploads.map(u => (
                  <button key={u.id} onClick={() => { setSelectedUpload(u); setSelectedArt(null); }} className={`aspect-square rounded-lg border-2 ${selectedUpload?.id === u.id ? 'border-black ring-2 ring-black/20' : 'border-black/10 hover:border-black/25'} overflow-hidden transition-all`}>
                    <img src={u.thumbnail_url || u.file_url} alt={u.filename} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              {artworks.length === 0 && uploads.length === 0 && (
                <div className="text-center py-6 text-black/30">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No artwork available yet</p>
                </div>
              )}
            </div>

            {/* Background color - Enhanced */}
            <div className="bg-white rounded-xl border border-black/5 p-4">
              <label className="block text-sm font-semibold text-black mb-1">Background</label>
              <p className="text-[11px] text-black/40 mb-3">Set the canvas background color</p>
              <div className="flex items-center gap-3">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg border border-black/10 cursor-pointer" />
                <div className="flex gap-1.5">
                  {['#FFFFFF', '#000000', '#F3F4F6', '#FEF3C7', '#DBEAFE', '#D1FAE5'].map(color => (
                    <button
                      key={color}
                      onClick={() => setBgColor(color)}
                      className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${bgColor === color ? 'border-black scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-black/40 font-mono ml-auto">{bgColor}</span>
              </div>
            </div>

            {/* Text overlay - Enhanced */}
            <div className="bg-white rounded-xl border border-black/5 p-4">
              <label className="block text-sm font-semibold text-black mb-3">Text Overlay</label>
              <textarea
                value={textOverlay}
                onChange={(e) => setTextOverlay(e.target.value)}
                placeholder="Add your headline, tagline, or message..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-black/10 text-sm text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
              />
              
              {/* Font Size Control */}
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-black/60 font-medium">Font Size</label>
                    <span className="text-xs font-mono text-black/50">{fontSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min={16} 
                    max={160} 
                    value={fontSize} 
                    onChange={(e) => setFontSize(+e.target.value)} 
                    className="w-full h-2 accent-black rounded-full cursor-pointer" 
                  />
                  <div className="flex justify-between text-[9px] text-black/30 mt-0.5">
                    <span>Small</span>
                    <span>Large</span>
                  </div>
                </div>
                
                {/* Color Picker with Presets */}
                <div>
                  <label className="text-xs text-black/60 font-medium block mb-1.5">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={textColor} 
                      onChange={(e) => setTextColor(e.target.value)} 
                      className="w-8 h-8 rounded-lg border border-black/10 cursor-pointer" 
                    />
                    {['#000000', '#FFFFFF', '#EF4444', '#3B82F6', '#10B981', '#F59E0B'].map(color => (
                      <button
                        key={color}
                        onClick={() => setTextColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${textColor === color ? 'border-black scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color, boxShadow: color === '#FFFFFF' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Text Style Picker - 40 Word-like 3D Styles */}
                <div>
                  <label className="text-xs text-black/60 font-medium block mb-2">Text Style</label>
                  <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto p-1 bg-gray-50 rounded-lg">
                    {TEXT_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setTextStyle(style)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                          textStyle.id === style.id 
                            ? 'border-black bg-white shadow-md' 
                            : 'border-transparent bg-white/80 hover:bg-white hover:border-black/20'
                        }`}
                        title={style.name}
                      >
                        <span 
                          className="text-base font-bold leading-none" 
                          style={{ ...style.css, fontSize: '16px' }}
                        >
                          {style.preview}
                        </span>
                        <span className="text-[7px] text-black/40 mt-1 truncate max-w-full">{style.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-black/30 mt-1.5 text-center">
                    {TEXT_STYLES.length} styles available &bull; Selected: <span className="font-semibold text-black/50">{textStyle.name}</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Product Specifications */}
            <div className="bg-gradient-to-br from-black/[0.02] to-transparent rounded-xl border border-black/5 p-4">
              <h4 className="text-xs font-semibold text-black mb-3 flex items-center gap-2">
                <Ruler className="h-3.5 w-3.5" />
                Product Specifications
              </h4>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="bg-white rounded-lg p-2.5 border border-black/5">
                  <p className="text-black/40 uppercase tracking-wider text-[9px] mb-0.5">Format</p>
                  <p className="font-semibold text-black capitalize">{selectedType.replace('-', ' ')}</p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-black/5">
                  <p className="text-black/40 uppercase tracking-wider text-[9px] mb-0.5">Resolution</p>
                  <p className="font-semibold text-black">300 DPI</p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-black/5">
                  <p className="text-black/40 uppercase tracking-wider text-[9px] mb-0.5">Color Profile</p>
                  <p className="font-semibold text-black">CMYK Ready</p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-black/5">
                  <p className="text-black/40 uppercase tracking-wider text-[9px] mb-0.5">File Format</p>
                  <p className="font-semibold text-black">PDF / PNG</p>
                </div>
              </div>
            </div>

            {/* Save CTA - Enhanced */}
            <div className="pt-4 border-t border-black/5 mt-auto space-y-3">
              <div className="flex items-center justify-between text-xs text-black/50">
                <span>Ready to print?</span>
                <span className="font-medium text-black">Starting from $9.99</span>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-2xl bg-gradient-to-r from-black via-black to-black/90 px-6 py-4 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 group"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 group-hover:scale-110 transition-transform" />
                )}
                Save &amp; Continue to Print
              </button>
              <p className="text-[10px] text-center text-black/40">You can edit your design anytime before ordering</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MY ORDERS PAGE
// ============================================

function OrdersPage({ orders, onBack }: { orders: any[]; onBack: () => void }) {
  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
    printing: 'bg-purple-100 text-purple-700', shipped: 'bg-emerald-100 text-emerald-700',
    delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-20 bg-[#f5f5f7]/95 backdrop-blur-lg border-b border-black/5 px-4 sm:px-8 py-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm rounded-full bg-black/80 text-white px-4 py-2 hover:bg-black transition-colors">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        <h2 className="text-2xl font-bold text-black mb-2">My Orders</h2>
        <p className="text-sm text-black/50 mb-8">Track your print orders and download history.</p>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-black/5">
            <Package className="h-12 w-12 text-black/15 mx-auto mb-4" />
            <p className="text-sm text-black/50 mb-4">No orders yet</p>
            <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-semibold text-white hover:scale-[1.03] active:scale-[0.97] transition-transform">
              <ShoppingCart className="h-3.5 w-3.5" />Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-black/5 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-black/40 font-mono">#{order.id.slice(0, 8)}</p>
                    <p className="text-sm font-semibold text-black mt-0.5">{order.size_label}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-black/50">
                  <span>Qty: {order.quantity}</span>
                  <span className="font-bold text-black">${Number(order.total_price).toFixed(2)}</span>
                </div>
                {order.tracking_number && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-blue-600">
                    <Truck className="h-3.5 w-3.5" />Tracking: {order.tracking_number}
                  </div>
                )}
                <p className="text-[10px] text-black/30 mt-2">{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MY DESIGNS PAGE
// ============================================

function DesignsPage({ designs, onBack, onCreate }: { designs: UserDesign[]; onBack: () => void; onCreate: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-20 bg-[#f5f5f7]/95 backdrop-blur-lg border-b border-black/5 px-4 sm:px-8 py-3 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm rounded-full bg-black/80 text-white px-4 py-2 hover:bg-black transition-colors">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <button onClick={onCreate} className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:scale-[1.03] active:scale-[0.97] transition-transform">
          <Plus className="h-3.5 w-3.5" />New Design
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        <h2 className="text-2xl font-bold text-black mb-2">My Designs</h2>
        <p className="text-sm text-black/50 mb-8">Your saved custom designs.</p>

        {designs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-black/5">
            <Palette className="h-12 w-12 text-black/15 mx-auto mb-4" />
            <p className="text-sm text-black/50 mb-4">No designs yet</p>
            <button onClick={onCreate} className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-semibold text-white hover:scale-[1.03] active:scale-[0.97] transition-transform">
              <Plus className="h-3.5 w-3.5" />Create Your First Design
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {designs.map((design) => (
              <div key={design.id} className="bg-white rounded-xl border border-black/5 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="aspect-[4/5] bg-gray-50 relative">
                  {design.preview_url ? (
                    <img src={design.preview_url} alt={design.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Palette className="h-10 w-10 text-black/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black hover:scale-105 active:scale-95 transition-transform">
                      <Edit3 className="h-3.5 w-3.5" />Edit
                    </button>
                    <button className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:scale-105 active:scale-95 transition-transform">
                      <Printer className="h-3.5 w-3.5" />Print
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-black">{design.name}</h3>
                  <p className="text-[10px] text-black/40 mt-1 capitalize">{design.product_type.replace('-', ' ')}</p>
                  <p className="text-[10px] text-black/30 mt-1">{new Date(design.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// BROWSE PAGE (main gallery — 2 col desktop, 1 mobile)
// ============================================

function BrowsePage({
  printProducts,
  artworks,
  onSelectProduct,
  onSelectArt,
  onUpload,
  onCreate,
  onOrders,
  onDesigns,
}: {
  printProducts: PrintProduct[];
  artworks: DigitalArt[];
  onSelectProduct: (p: PrintProduct) => void;
  onSelectArt: (a: DigitalArt) => void;
  onUpload: () => void;
  onCreate: () => void;
  onOrders: () => void;
  onDesigns: () => void;
}) {
  const [tab, setTab] = useState<'print' | 'digital'>('print');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredProducts = printProducts.filter(p =>
    (typeFilter === 'all' || p.type === typeFilter) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredArt = artworks.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.artist || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.tags || []).some(t => t.includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <button onClick={onUpload} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-black/5 hover:shadow-md hover:border-black/10 transition-all">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-black">Upload</span>
          </button>
          <button onClick={onCreate} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-black/5 hover:shadow-md hover:border-black/10 transition-all">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-black">Create</span>
          </button>
          <button onClick={onOrders} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-black/5 hover:shadow-md hover:border-black/10 transition-all">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-black">Orders</span>
          </button>
          <button onClick={onDesigns} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-black/5 hover:shadow-md hover:border-black/10 transition-all">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-black">Designs</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, artwork, artists..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-black/10 text-sm text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20 shadow-sm"
          />
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 bg-black/5 rounded-2xl mb-6 w-fit">
          <button onClick={() => setTab('print')} className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${tab === 'print' ? 'bg-black text-white shadow-lg' : 'text-black/60 hover:text-black/90'}`}>
            <Printer className="inline h-3.5 w-3.5 mr-1.5" />Print Products
          </button>
          <button onClick={() => setTab('digital')} className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${tab === 'digital' ? 'bg-black text-white shadow-lg' : 'bg-black/80 text-white hover:bg-black/90'}`}>
            <Image className="inline h-3.5 w-3.5 mr-1.5" />Digital Art
          </button>
        </div>

        {tab === 'print' ? (
          <>
            {/* Type filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button onClick={() => setTypeFilter('all')} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all ${typeFilter === 'all' ? 'bg-black text-white shadow-md' : 'bg-white border border-black/10 text-black/70 hover:border-black/30 hover:text-black'}`}>All</button>
              {PRODUCT_TYPES.map(({ key, label }) => (
                <button key={key} onClick={() => setTypeFilter(key)} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all ${typeFilter === key ? 'bg-black text-white shadow-md' : 'bg-white border border-black/10 text-black/70 hover:border-black/30 hover:text-black'}`}>{label}</button>
              ))}
            </div>

            {/* Print products grid — 2 col desktop, 1 mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="group relative rounded-2xl overflow-hidden bg-white border border-black/5 hover:shadow-xl transition-all cursor-pointer" onClick={() => onSelectProduct(product)}>
                  <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className={`absolute top-3 left-3 ${TYPE_COLORS[product.type] || 'bg-gray-500'} px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider`}>{product.type}</span>

                    {/* Hover action buttons */}
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <button onClick={(e) => { e.stopPropagation(); onSelectProduct(product); }} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white hover:bg-black/80 transition-colors">
                        <Eye className="h-3.5 w-3.5" />Quick View
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onSelectProduct(product); }} className="flex items-center justify-center w-10 h-10 rounded-xl bg-white text-black hover:bg-gray-100 transition-colors">
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-bold text-black">{product.name}</h3>
                    {product.description && <p className="text-xs text-black/50 mt-1 line-clamp-2">{product.description}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-black">From ${product.basePrice.toFixed(2)}</span>
                      <span className="text-[10px] text-black/40">{product.sizes.length} sizes</span>
                    </div>
                    <div className="mt-2 flex gap-1">
                      {product.printerCompatible.map(p => (
                        <span key={p} className="text-[9px] px-2 py-0.5 rounded-full bg-black/5 text-black/50 font-medium">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Digital art grid — 2 col desktop, 1 mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredArt.map((art) => (
                <div key={art.id} className="group relative rounded-2xl overflow-hidden bg-white border border-black/5 hover:shadow-xl transition-all cursor-pointer" onClick={() => onSelectArt(art)}>
                  <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <img src={art.thumbnail || art.image} alt={art.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`${ART_CATEGORIES[art.category] || 'bg-gray-500'} px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider`}>{art.category.replace('-', ' ')}</span>
                      {art.featured && <span className="bg-yellow-500 px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1"><Sparkles className="h-3 w-3" />Featured</span>}
                    </div>

                    {/* Hover action buttons */}
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <button onClick={(e) => { e.stopPropagation(); onSelectArt(art); }} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white hover:bg-black/80 transition-colors">
                        <Eye className="h-3.5 w-3.5" />View
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onSelectArt(art); }} className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black hover:bg-gray-100 transition-colors">
                        <Download className="h-3.5 w-3.5" />Buy
                      </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex items-center gap-2 text-white text-[10px]">
                        <Monitor className="h-3 w-3" />
                        <span>{art.resolution}</span>
                        <span>·</span>
                        <span>{art.fileFormats.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-black">{art.name}</h3>
                        {art.artist && <p className="text-xs text-black/50 mt-0.5">by {art.artist}</p>}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-black">${art.price.toFixed(2)}</span>
                      {art.downloads !== undefined && (
                        <span className="text-[10px] text-black/40 flex items-center gap-1"><Download className="h-3 w-3" />{art.downloads} sales</span>
                      )}
                    </div>
                    {art.tags && art.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {art.tags.slice(0, 4).map(tag => (
                          <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-black/5 text-black/50">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN STUDIO MODAL (UltimateHub-style portal)
// ============================================

export function PrintDesignStudio({
  onClose,
  userEmail,
  initialTab,
  initialProductId,
  initialArtId,
  initialProductType,
}: {
  onClose: () => void;
  userEmail: string;
  initialTab?: StudioTab;
  initialProductId?: string;
  initialArtId?: string;
  initialProductType?: string;
}) {
  // State
  const [tab, setTab] = useState<StudioTab>('browse');
  const [selectedProduct, setSelectedProduct] = useState<PrintProduct | null>(null);
  const [selectedArt, setSelectedArt] = useState<DigitalArt | null>(null);
  const [printProducts, setPrintProducts] = useState<PrintProduct[]>([]);
  const [artworks, setArtworks] = useState<DigitalArt[]>([]);
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [designs, setDesigns] = useState<UserDesign[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<UserUpload | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [initialType, setInitialType] = useState<string | undefined>(initialProductType);
  const appliedInitial = useRef(false);

  const resolvedEmail = userEmail || 'bullmoneytraders@gmail.com';

  // Body scroll lock
  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.classList.add('quick-view-open');
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = prevHtml;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      document.body.classList.remove('quick-view-open');
    };
  }, []);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (tab !== 'browse') {
          setTab('browse');
          setSelectedProduct(null);
          setSelectedArt(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tab, onClose]);

  // Fetch data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [printRes, artRes] = await Promise.all([
          fetch('/api/store/print-products').then(r => r.ok ? r.json() : { products: [] }),
          fetch('/api/store/digital-art').then(r => r.ok ? r.json() : { arts: [] }),
        ]);
        setPrintProducts(printRes.products || []);
        setArtworks(artRes.arts || []);
      } catch (err) {
        console.error('Failed to load studio data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      const [uploadsRes, ordersRes, designsRes] = await Promise.all([
        fetch(`/api/store/print-uploads?email=${encodeURIComponent(resolvedEmail)}`).then(r => r.ok ? r.json() : { uploads: [] }),
        fetch(`/api/store/print-orders?email=${encodeURIComponent(resolvedEmail)}`).then(r => r.ok ? r.json() : { orders: [] }),
        fetch(`/api/store/print-designs?email=${encodeURIComponent(resolvedEmail)}`).then(r => r.ok ? r.json() : { designs: [] }),
      ]);
      setUploads(uploadsRes.uploads || []);
      setOrders(ordersRes.orders || []);
      setDesigns(designsRes.designs || []);
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  }, [resolvedEmail]);

  useEffect(() => { fetchUserData(); }, [fetchUserData]);

  // Handlers
  const handleOrder = useCallback(async (product: PrintProduct, size: any, artId?: string, customUrl?: string) => {
    try {
      const res = await fetch('/api/store/print-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: resolvedEmail,
          productId: product.id,
          digitalArtId: artId || null,
          sizeLabel: size.label,
          width: size.width,
          height: size.height,
          quantity: 1,
          unitPrice: size.price,
          totalPrice: size.price,
          customImageUrl: customUrl,
        }),
      });
      if (res.ok) {
        setToast({ message: 'Added to cart!', type: 'success' });
        fetchUserData();
      } else {
        throw new Error('Failed to create order');
      }
    } catch (err) {
      setToast({ message: 'Failed to add to cart. Please try again.', type: 'error' });
    }
  }, [resolvedEmail, fetchUserData]);

  const handleDownload = useCallback(async (art: DigitalArt, format: string) => {
    try {
      setToast({ message: `Preparing ${art.name} (${format}) for download...`, type: 'info' });
      const res = await fetch('/api/store/digital-art-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: resolvedEmail,
          digitalArtId: art.id,
          pricePaid: art.price,
          fileFormat: format,
        }),
      });
      if (!res.ok) throw new Error('Failed purchase');
      setToast({ message: 'Purchase complete! Download starting...', type: 'success' });
    } catch (err) {
      setToast({ message: 'Purchase failed. Please try again.', type: 'error' });
    }
  }, [resolvedEmail]);

  useEffect(() => {
    if (appliedInitial.current) return;
    if (!printProducts.length && !artworks.length) return;

    if (initialTab) {
      setTab(initialTab);
    }

    if (initialProductType) {
      setInitialType(initialProductType);
    }

    if (initialProductId) {
      const product = printProducts.find((p) => p.id === initialProductId);
      if (product) {
        setSelectedProduct(product);
        setSelectedArt(null);
        setTab('product');
      }
    } else if (initialArtId) {
      const art = artworks.find((a) => a.id === initialArtId);
      if (art) {
        setSelectedArt(art);
        setSelectedProduct(null);
        setTab('product');
      }
    }

    appliedInitial.current = true;
  }, [initialTab, initialProductId, initialArtId, printProducts, artworks]);

  const handleSaveDesign = useCallback(async (name: string, productType: string, previewUrl?: string) => {
    try {
      const res = await fetch('/api/store/print-designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: resolvedEmail,
          name,
          productType,
          previewUrl: previewUrl || null,
          canvasData: {},
        }),
      });
      if (res.ok) {
        setToast({ message: 'Design saved!', type: 'success' });
        fetchUserData();
        setTab('designs');
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      setToast({ message: 'Failed to save design.', type: 'error' });
    }
  }, [resolvedEmail, fetchUserData]);

  if (!mounted) return null;

  // Render current page
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-black/20 animate-spin mx-auto mb-4" />
            <p className="text-sm text-black/40">Loading studio...</p>
          </div>
        </div>
      );
    }

    if (tab === 'product' && selectedProduct) {
      return (
        <ProductDetailPage
          product={selectedProduct}
          artworks={artworks}
          onBack={() => { setTab('browse'); setSelectedProduct(null); }}
          onOrder={handleOrder}
          onCustomize={(p) => { setTab('create'); }}
          userEmail={userEmail}
        />
      );
    }

    if (tab === 'product' && selectedArt) {
      return (
        <ArtDetailPage
          art={selectedArt}
          printProducts={printProducts}
          onBack={() => { setTab('browse'); setSelectedArt(null); }}
          onDownload={handleDownload}
          onPrintOrder={(art, prod) => { setSelectedProduct(prod); setSelectedArt(null); }}
          userEmail={userEmail}
        />
      );
    }

    if (tab === 'upload') {
      return (
        <UploadPage
          userEmail={resolvedEmail}
          printProducts={printProducts}
          uploads={uploads}
          onRefresh={fetchUserData}
          onLocalUpload={(upload) => setUploads((prev) => [upload, ...prev])}
          onUseUpload={(u, productType) => {
            setInitialType(productType);
            setSelectedProduct(null);
            setSelectedArt(null);
            setSelectedUpload(u);
            setTab('create');
          }}
          onBack={() => setTab('browse')}
        />
      );
    }

    if (tab === 'create') {
      return (
        <CreateDesignPage
          userEmail={resolvedEmail}
          printProducts={printProducts}
          artworks={artworks}
          uploads={uploads}
          initialUpload={selectedUpload}
          initialProductType={initialType}
          onBack={() => setTab('browse')}
          onSave={handleSaveDesign}
        />
      );
    }

    if (tab === 'orders') {
      return <OrdersPage orders={orders} onBack={() => setTab('browse')} />;
    }

    if (tab === 'designs') {
      return <DesignsPage designs={designs} onBack={() => setTab('browse')} onCreate={() => setTab('create')} />;
    }

    return (
      <BrowsePage
        printProducts={printProducts}
        artworks={artworks}
        onSelectProduct={(p) => { setSelectedProduct(p); setSelectedArt(null); setTab('product'); }}
        onSelectArt={(a) => { setSelectedArt(a); setSelectedProduct(null); setTab('product'); }}
        onUpload={() => setTab('upload')}
        onCreate={() => setTab('create')}
        onOrders={() => setTab('orders')}
        onDesigns={() => setTab('designs')}
      />
    );
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="fixed inset-0 z-[2147483640] bg-white/80"
        onClick={onClose}
        style={{ pointerEvents: 'all', overscrollBehavior: 'none', touchAction: 'none' }}
      >
        <motion.div
          data-no-theme
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
          className="fixed top-0 right-0 bottom-0 w-full max-w-[320px] sm:max-w-xl md:max-w-2xl lg:max-w-3xl flex flex-col bg-white text-black border-l border-black/10 safe-area-inset-bottom overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'all', backgroundColor: '#ffffff' }}
        >
          {/* Sticky header */}
          <div className="sticky top-0 z-50 flex items-center justify-between border-b border-black/10 bg-white px-1.5 sm:px-8 py-1.5 sm:py-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-black/10 flex items-center justify-center shrink-0">
                <img src="/bullmoney-logo.png" alt="BullMoney" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-black/50 font-medium">Print &amp; Design</p>
                <h1 className="text-sm sm:text-base font-bold text-black truncate">Studio</h1>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-white border border-black/10 hover:border-black/20 text-black shadow-sm transition-all ml-3"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
            {renderContent()}
          </div>

          {/* Toast */}
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export default PrintDesignStudio;
