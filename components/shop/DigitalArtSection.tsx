'use client';

import { useState, useEffect } from 'react';
import { X, Download, Eye, Sparkles, Monitor, Smartphone, Palette, Tablet, Tv, Frame, ShoppingCart, Printer, Image, Package, Upload, Plus, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useCartStore } from '@/stores/cart-store';
import type { ProductWithDetails, Variant } from '@/types/store';

const FooterComponent = dynamic(() => import('@/components/Mainpage/footer').then((mod) => ({ default: mod.Footer })), { ssr: false });

export interface DigitalArt {
  id: string;
  slug?: string;
  name: string;
  artist?: string;
  price: number;
  image: string;
  thumbnail?: string;
  description?: string;
  category: 'illustration' | 'abstract' | 'photography' | 'graphic-design' | '3d-art' | 'animation';
  fileFormats: string[];
  resolution: string;
  dimensions?: { width: number; height: number };
  tags?: string[];
  downloads?: number;
  featured?: boolean;
}

/* ─── Hook: fetch from Supabase, fallback to props ─── */
function useDigitalArt(fallback: DigitalArt[]) {
  const [arts, setArts] = useState<DigitalArt[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/store/digital-art')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ arts: rows }) => {
        if (!cancelled && rows?.length) setArts(rows);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { arts, loading };
}

/* ─── Category colors ─── */
const CAT_COLOR: Record<string, string> = {
  illustration: 'bg-purple-500', abstract: 'bg-pink-500', photography: 'bg-blue-500',
  'graphic-design': 'bg-green-500', '3d-art': 'bg-orange-500', animation: 'bg-red-500',
};

const DEFAULT_STUDIO_EMAIL = 'bullmoneytraders@gmail.com';

/* ─── Card ─── */
function DigitalArtCard({ art, onQuickView }: { art: DigitalArt; onQuickView: (a: DigitalArt) => void }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white transition-all hover:shadow-xl">
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-black/5 to-black/10">
        <img src={art.thumbnail || art.image} alt={art.name} loading="lazy" className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`${CAT_COLOR[art.category] ?? 'bg-gray-500'} px-3 py-1 rounded-full text-[10px] font-semibold text-white uppercase tracking-wider`}>{art.category.replace('-', ' ')}</span>
          {art.featured && (
            <span className="bg-yellow-500 px-3 py-1 rounded-full text-[10px] font-semibold text-white uppercase tracking-wider flex items-center gap-1"><Sparkles className="h-3 w-3" />Featured</span>
          )}
        </div>

        {/* desktop hover — hidden on mobile to prevent touch-hover conflicts */}
        <div className="absolute inset-0 hidden md:flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
          <button onClick={(e) => { e.stopPropagation(); onQuickView(art); }} className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-xl transition-transform hover:scale-105 active:scale-95">
            <Eye className="h-4 w-4" />View Artwork
          </button>
        </div>

        {/* mobile tap — high z-index to sit above all card layers */}
        <button onClick={() => onQuickView(art)} className="absolute inset-0 z-[50] md:hidden" aria-label={`View ${art.name}`} />

        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
          <div className="flex items-center gap-2 text-white text-xs">
            <Monitor className="h-3.5 w-3.5" />
            <span>{art.resolution}</span>
            <span className="mx-1">&#183;</span>
            {art.dimensions && <><span>{art.dimensions.width} x {art.dimensions.height}px</span><span className="mx-1">&#183;</span></>}
            <span>{art.fileFormats.join(', ')}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-black truncate">{art.name}</h3>
            {art.artist && <p className="mt-0.5 text-xs text-black/50">by {art.artist}</p>}
          </div>
          <Palette className="h-4 w-4 text-black/40 shrink-0" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-bold text-black">${art.price.toFixed(2)}</span>
          {art.downloads !== undefined && (
            <span className="text-[10px] text-black/40 flex items-center gap-1"><Download className="h-3 w-3" />{art.downloads} sales</span>
          )}
        </div>
        {art.tags && art.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {art.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-black/5 text-black/50">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Device / Print presets with real ratios ─── */
type PresetKey = 'macbook' | 'imac' | 'ipad' | 'iphone' | 'print-8x10' | 'print-11x14' | 'print-16x20' | 'print-24x36';

interface Preset {
  key: PresetKey;
  label: string;
  icon: typeof Monitor;
  ratio: number;
  maxW: number;
  type: 'screen' | 'print';
  desc: string;
  serviceTitle: string;
  serviceDesc: string;
  servicePrice: string;
  serviceFeatures: string[];
}

const PRESETS: Preset[] = [
  { key: 'macbook', label: 'MacBook', icon: Monitor, ratio: 16/10, maxW: 640, type: 'screen', desc: '2560 × 1600 — 16:10', serviceTitle: 'MacBook Wallpaper', serviceDesc: 'Retina-optimized wallpaper download for MacBook Pro/Air.', servicePrice: 'Included', serviceFeatures: ['Retina 2x resolution', 'Auto-scaled to fit', 'PNG + JPG formats', 'Instant download'] },
  { key: 'imac', label: 'iMac / Desktop', icon: Tv, ratio: 16/9, maxW: 720, type: 'screen', desc: '3840 × 2160 — 16:9 4K', serviceTitle: 'Desktop 4K Wallpaper', serviceDesc: 'Ultra-HD desktop wallpaper for iMac, external monitors & TV.', servicePrice: 'Included', serviceFeatures: ['4K Ultra HD', 'Multi-monitor support', 'Color-accurate sRGB', 'All formats included'] },
  { key: 'ipad', label: 'iPad', icon: Tablet, ratio: 4/3, maxW: 480, type: 'screen', desc: '2048 × 1536 — 4:3', serviceTitle: 'iPad Wallpaper', serviceDesc: 'Perfect fit for iPad Pro, Air, and Mini displays.', servicePrice: 'Included', serviceFeatures: ['Liquid Retina optimized', 'Lock & home screen', 'Portrait + landscape', 'Instant download'] },
  { key: 'iphone', label: 'iPhone', icon: Smartphone, ratio: 9/19.5, maxW: 260, type: 'screen', desc: '1179 × 2556 — 9:19.5', serviceTitle: 'iPhone Wallpaper', serviceDesc: 'Sized for iPhone 15/16 Pro Max Super Retina XDR.', servicePrice: 'Included', serviceFeatures: ['Super Retina XDR', 'Dynamic Island aware', 'Lock screen ready', 'Always-on display'] },
  { key: 'print-8x10', label: '8×10"', icon: Frame, ratio: 8/10, maxW: 360, type: 'print', desc: '8 × 10 in — 300 DPI', serviceTitle: 'Fine Art Print 8×10"', serviceDesc: 'Museum-quality giclée print on archival matte paper.', servicePrice: '+$24.99', serviceFeatures: ['Archival matte paper', '300 DPI print-ready', 'Color-matched proofing', 'Ships in 3-5 days'] },
  { key: 'print-11x14', label: '11×14"', icon: Frame, ratio: 11/14, maxW: 400, type: 'print', desc: '11 × 14 in — 300 DPI', serviceTitle: 'Fine Art Print 11×14"', serviceDesc: 'Gallery-standard print with premium luster finish.', servicePrice: '+$34.99', serviceFeatures: ['Premium luster finish', 'Acid-free paper', 'Fade-resistant 100yr', 'Rigid packaging'] },
  { key: 'print-16x20', label: '16×20"', icon: Frame, ratio: 16/20, maxW: 420, type: 'print', desc: '16 × 20 in — 300 DPI', serviceTitle: 'Canvas Print 16×20"', serviceDesc: 'Gallery-wrapped canvas with solid wood frame.', servicePrice: '+$59.99', serviceFeatures: ['Gallery-wrapped canvas', 'Solid wood stretcher', 'UV protective coating', 'Ready to hang'] },
  { key: 'print-24x36', label: '24×36"', icon: Frame, ratio: 24/36, maxW: 460, type: 'print', desc: '24 × 36 in — 300 DPI', serviceTitle: 'Large Format Print 24×36"', serviceDesc: 'Statement poster or framed large-format display piece.', servicePrice: '+$89.99', serviceFeatures: ['Premium poster stock', 'Optional framing', 'Vivid color reproduction', 'Free shipping'] },
];

/* ─── Lightweight Service Modal ─── */
function ServiceModal({ preset, art, onClose }: { preset: Preset; art: DigitalArt; onClose: () => void }) {
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCartStore();
  
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handleAddToCart = () => {
    const price = preset.servicePrice === 'Included' ? 0 : parseFloat(preset.servicePrice.replace(/[^0-9.]/g, '')) || 0;
    
    const cartProduct: ProductWithDetails = {
      id: `print-service-${art.id}-${preset.key}`,
      name: `${preset.serviceTitle} - ${art.name}`,
      slug: `${art.id}-${preset.key}`,
      description: preset.serviceDesc,
      short_description: `${preset.type === 'print' ? 'Print' : 'Download'} - ${preset.desc}`,
      base_price: price,
      compare_at_price: null,
      category_id: null,
      status: 'ACTIVE',
      featured: false,
      tags: [preset.type, art.category],
      details: { preset: preset.key, artId: art.id, type: preset.type },
      seo_title: null,
      seo_description: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [{ id: '1', product_id: `print-service-${art.id}`, url: art.image, alt_text: art.name, sort_order: 0, is_primary: true, created_at: new Date().toISOString() }],
      variants: [],
      primary_image: art.thumbnail || art.image,
    };

    const variant: Variant = {
      id: `${art.id}-${preset.key}-service`,
      product_id: `print-service-${art.id}`,
      sku: `PRINT-${preset.key}-${art.id}`.toUpperCase(),
      name: preset.label,
      options: { size: preset.label, type: preset.type },
      price_adjustment: 0,
      inventory_count: 999,
      low_stock_threshold: 5,
      weight_grams: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addItem(cartProduct, variant, 1);
    setAdded(true);
    setTimeout(() => {
      openCart();
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5">
              {preset.type === 'print' ? <Printer className="h-4 w-4 text-black/70" /> : <preset.icon className="h-4 w-4 text-black/70" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-black">{preset.serviceTitle}</h3>
              <p className="text-[10px] text-black/45">{preset.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white hover:bg-black/80">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* mini preview */}
        <div className="px-5 pt-4">
          <div className="relative mx-auto overflow-hidden rounded-lg bg-gray-100" style={{ maxWidth: 200, aspectRatio: `${preset.ratio}` }}>
            <img src={art.thumbnail || art.image} alt={art.name} className="h-full w-full object-cover" loading="lazy" />
            {preset.type === 'print' && (
              <div className="absolute inset-0 border-[6px] border-white/90 rounded-lg shadow-inner pointer-events-none" />
            )}
          </div>
        </div>

        {/* details */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-black/60 leading-relaxed">{preset.serviceDesc}</p>
          <div className="space-y-1.5">
            {preset.serviceFeatures.map((f) => (
              <div key={f} className="flex items-center gap-2 text-[11px] text-black/55">
                <div className="h-1 w-1 rounded-full bg-black/25 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between px-5 py-4 bg-black/[0.02] border-t border-black/5">
          <div>
            <span className="text-xs text-black/40">Price</span>
            <div className="text-lg font-bold text-black">
              {preset.servicePrice === 'Included' ? (
                <span className="text-green-600 text-sm font-semibold">Included with purchase</span>
              ) : (
                preset.servicePrice
              )}
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white hover:scale-[1.03] active:scale-[0.97] transition-transform ${added ? 'bg-green-600' : 'bg-black'}`}
          >
            {added ? <><Check className="h-3.5 w-3.5" />Added!</> : <><ShoppingCart className="h-3.5 w-3.5" />Add to Cart</>}
          </button>
        </div>
        <p className="text-center text-[10px] text-white/60 py-2 bg-black">Payment via cart &amp; crypto accepted</p>
      </div>
    </div>
  );
}

/* ─── Device Frame wrapper — pure CSS, lightweight ─── */
function DeviceFrame({ preset, children }: { preset: Preset; children: React.ReactNode }) {
  const k = preset.key;

  if (k === 'macbook') {
    return (
      <div className="flex flex-col items-center w-full">
        <div className="relative rounded-t-xl border-[6px] border-[#2a2a2c] bg-[#1a1a1c] shadow-xl w-full" style={{ maxWidth: preset.maxW }}>
          <div className="relative overflow-hidden rounded-[4px]" style={{ aspectRatio: `${preset.ratio}` }}>
            {children}
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#1a1a1c] border border-[#333] flex items-center justify-center -translate-y-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#222]" />
          </div>
        </div>
        <div className="h-1.5 bg-gradient-to-b from-[#c0c0c0] to-[#a0a0a0] rounded-b-sm" style={{ width: '60%' }} />
        <div className="h-1 bg-gradient-to-b from-[#d0d0d0] to-[#b0b0b0] rounded-b-lg" style={{ width: '70%' }} />
      </div>
    );
  }

  if (k === 'imac') {
    return (
      <div className="flex flex-col items-center w-full">
        <div className="relative rounded-xl border-[5px] border-[#2a2a2c] bg-[#1a1a1c] shadow-xl w-full" style={{ maxWidth: preset.maxW }}>
          <div className="relative overflow-hidden rounded-[6px]" style={{ aspectRatio: `${preset.ratio}` }}>
            {children}
          </div>
          <div className="h-6 bg-[#e0e0e2] rounded-b-lg flex items-center justify-center">
            <div className="w-8 h-1 rounded-full bg-[#ccc]" />
          </div>
        </div>
        <div className="w-1 h-8 bg-gradient-to-b from-[#c0c0c0] to-[#a0a0a0]" />
        <div className="w-16 h-1 bg-gradient-to-b from-[#d0d0d0] to-[#b0b0b0] rounded-full" />
      </div>
    );
  }

  if (k === 'ipad') {
    return (
      <div className="flex flex-col items-center w-full">
        <div className="relative rounded-2xl border-[5px] border-[#2a2a2c] bg-[#1a1a1c] shadow-xl w-full" style={{ maxWidth: preset.maxW }}>
          <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: `${preset.ratio}` }}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  if (k === 'iphone') {
    return (
      <div className="flex flex-col items-center">
        <div className="relative rounded-[2rem] border-[4px] border-[#2a2a2c] bg-[#1a1a1c] shadow-xl overflow-hidden" style={{ width: '100%', maxWidth: preset.maxW }}>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-20 h-5 rounded-full bg-black" />
          <div className="relative overflow-hidden rounded-[1.7rem]" style={{ aspectRatio: `${preset.ratio}` }}>
            {children}
          </div>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-white/30" />
        </div>
      </div>
    );
  }

  // Print frames
  return (
    <div className="flex flex-col items-center">
      <div className="relative bg-white shadow-xl" style={{ width: '100%', maxWidth: preset.maxW }}>
        <div className="border-[8px] border-[#2c2017] rounded-sm shadow-inner">
          <div className="border-[12px] border-[#f5f0e8]">
            <div className="relative overflow-hidden" style={{ aspectRatio: `${preset.ratio}` }}>
              {children}
            </div>
          </div>
        </div>
        <div className="absolute -bottom-2 left-2 right-2 h-3 bg-black/10 blur-md rounded-full" />
      </div>
      <p className="mt-3 text-[10px] text-black/35 font-medium">{preset.label} — {preset.desc.split('—')[0].trim()}</p>
    </div>
  );
}

/* ─── Quick View — fullscreen hub-panel with device mockups ─── */
function DigitalArtViewer({ art, onClose }: { art: DigitalArt; onClose: () => void }) {
  const [selectedFormat, setSelectedFormat] = useState(art.fileFormats[0]);
  const [activePreset, setActivePreset] = useState<PresetKey>('imac');
  const [serviceModal, setServiceModal] = useState<Preset | null>(null);
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCartStore();

  const preset = PRESETS.find((p) => p.key === activePreset)!;

  // Convert digital art to cart-compatible format
  const handleAddToCart = () => {
    const cartProduct: ProductWithDetails = {
      id: `digital-${art.id}`,
      name: art.name,
      slug: art.id,
      description: art.description || null,
      short_description: `Digital Art by ${art.artist || 'Unknown'} - ${selectedFormat}`,
      base_price: art.price,
      compare_at_price: null,
      category_id: null,
      status: 'ACTIVE',
      featured: art.featured || false,
      tags: art.tags || ['digital-art'],
      details: { resolution: art.resolution, dimensions: art.dimensions },
      seo_title: null,
      seo_description: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [{ id: '1', product_id: `digital-${art.id}`, url: art.image, alt_text: art.name, sort_order: 0, is_primary: true, created_at: new Date().toISOString() }],
      variants: [],
      primary_image: art.image,
    };

    const variant: Variant = {
      id: `${art.id}-${selectedFormat}`,
      product_id: `digital-${art.id}`,
      sku: `DIGITAL-${art.id}-${selectedFormat}`.toUpperCase(),
      name: selectedFormat,
      options: { format: selectedFormat, category: art.category },
      price_adjustment: 0,
      inventory_count: 999,
      low_stock_threshold: 5,
      weight_grams: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addItem(cartProduct, variant, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  useEffect(() => { const p = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = p; }; }, []);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (serviceModal) { setServiceModal(null); } else { onClose(); } }; const kh = (e: KeyboardEvent) => { if (e.key === 'Escape') h(e); }; window.addEventListener('keydown', kh); return () => window.removeEventListener('keydown', kh); }, [onClose, serviceModal]);

  const screenPresets = PRESETS.filter((p) => p.type === 'screen');
  const printPresets = PRESETS.filter((p) => p.type === 'print');

  return createPortal(
    <div data-no-theme className="fixed inset-0 z-[2147483647] flex flex-col w-[100vw] max-w-[100vw] h-[100dvh] max-h-[100dvh] overflow-y-auto bg-[#f5f5f7] text-black" style={{ pointerEvents: 'all' }}>
      {/* header - Store style with logo */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-black/95 backdrop-blur-lg px-4 sm:px-8 py-3 sm:py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-white to-white/60 flex items-center justify-center shrink-0">
            <img src="/bullmoney-logo.png" alt="BullMoney" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-medium">Digital Art</p>
            <h2 className="text-base sm:text-xl font-bold text-white truncate max-w-[50vw] sm:max-w-none">{art.name}</h2>
            {art.artist && <p className="text-xs text-white/50">by {art.artist}</p>}
          </div>
        </div>
        <button onClick={onClose} className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 shadow-lg ml-3">
          <X className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          {/* preview area — 2 cols */}
          <div className="lg:col-span-2 space-y-5">
            {/* screen toggles */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-black/35 font-semibold mb-2">Screen Sizes</p>
              <div className="flex flex-wrap gap-1.5">
                {screenPresets.map((p) => (
                  <button key={p.key} onClick={() => setActivePreset(p.key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${activePreset === p.key ? 'bg-black text-white shadow-md' : 'bg-white text-black/55 border border-black/10 hover:border-black/25 hover:text-black/80'}`}>
                    <p.icon className="h-3 w-3" />{p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* print size toggles */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-black/35 font-semibold mb-2">Print Sizes</p>
              <div className="flex flex-wrap gap-1.5">
                {printPresets.map((p) => (
                  <button key={p.key} onClick={() => setActivePreset(p.key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${activePreset === p.key ? 'bg-black text-white shadow-md' : 'bg-white text-black/55 border border-black/10 hover:border-black/25 hover:text-black/80'}`}>
                    <p.icon className="h-3 w-3" />{p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* device mockup preview */}
            <div className="flex items-center justify-center min-h-[300px] py-8 bg-gradient-to-br from-gray-100 to-gray-200/50 rounded-2xl">
              <div className="w-full flex items-center justify-center px-6 transition-all duration-300" style={{ maxWidth: preset.maxW + 40 }}>
                <DeviceFrame preset={preset}>
                  <img src={art.image} alt={art.name} className="h-full w-full object-cover" />
                </DeviceFrame>
              </div>
            </div>

            {/* service CTA for current preset */}
            <button onClick={() => setServiceModal(preset)} className="w-full flex items-center justify-between rounded-xl border border-black/8 bg-white px-4 py-3 text-left hover:border-black/15 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 group-hover:bg-black/8 transition-colors">
                  {preset.type === 'print' ? <Printer className="h-3.5 w-3.5 text-black/60" /> : <Image className="h-3.5 w-3.5 text-black/60" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-black">{preset.serviceTitle}</p>
                  <p className="text-[10px] text-black/40">{preset.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${preset.servicePrice === 'Included' ? 'text-green-600' : 'text-black'}`}>{preset.servicePrice}</span>
                <ShoppingCart className="h-3.5 w-3.5 text-black/30 group-hover:text-black/60 transition-colors" />
              </div>
            </button>
          </div>

          {/* details pane */}
          <div className="flex flex-col">
            {art.description && <p className="text-sm text-black/65 leading-relaxed mb-6">{art.description}</p>}

            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-black/50">Resolution</span>
                <span className="font-semibold text-black">{art.resolution}</span>
              </div>
              {art.dimensions && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-black/50">Dimensions</span>
                  <span className="font-semibold text-black">{art.dimensions.width} x {art.dimensions.height}px</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-black/50">Category</span>
                <span className={`${CAT_COLOR[art.category] ?? 'bg-gray-500'} px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white uppercase`}>{art.category.replace('-', ' ')}</span>
              </div>
              {art.downloads !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-black/50">Downloads</span>
                  <span className="font-semibold text-black">{art.downloads}</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-sm font-semibold text-black">File Format</label>
              <div className="flex flex-wrap gap-2">
                {art.fileFormats.map((fmt) => (
                  <button key={fmt} onClick={() => setSelectedFormat(fmt)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${selectedFormat === fmt ? 'bg-black text-white' : 'bg-white border border-black/10 text-black hover:border-black/25'}`}>
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* All available products/services */}
            <div className="mb-6">
              <label className="block mb-2 text-sm font-semibold text-black">Available Products</label>
              <div className="space-y-1.5">
                {PRESETS.map((p) => (
                  <button key={p.key} onClick={() => setServiceModal(p)} className="w-full flex items-center justify-between rounded-lg border border-black/5 bg-black/[0.02] px-3 py-2 text-left hover:bg-black/[0.04] hover:border-black/10 transition-all">
                    <div className="flex items-center gap-2">
                      <p.icon className="h-3 w-3 text-black/40" />
                      <span className="text-[11px] font-medium text-black/70">{p.serviceTitle}</span>
                    </div>
                    <span className={`text-[10px] font-bold ${p.servicePrice === 'Included' ? 'text-green-600' : 'text-black/60'}`}>{p.servicePrice}</span>
                  </button>
                ))}
              </div>
            </div>

            {art.tags && art.tags.length > 0 && (
              <div className="mb-6">
                <label className="block mb-2 text-sm font-semibold text-black">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {art.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-full bg-black/5 text-[10px] font-medium text-black/60">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-black/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-black/50">Price:</span>
                <span className="text-3xl font-bold text-black">${art.price.toFixed(2)}</span>
              </div>
              <button
                onClick={handleAddToCart}
                className={`w-full rounded-full px-6 py-4 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${added ? 'bg-green-600' : 'bg-black'}`}
              >
                {added ? <><Check className="h-4 w-4" />Added to Cart!</> : <><ShoppingCart className="h-4 w-4" />Add to Cart</>}
              </button>
              <div className="rounded-xl bg-black p-3 text-center">
                <p className="text-[10px] text-white/80">Instant download &bull; Payment via cart &amp; crypto accepted</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* lightweight service modal */}
      {serviceModal && <ServiceModal preset={serviceModal} art={art} onClose={() => setServiceModal(null)} />}

      {/* Store Footer */}
      <div className="bg-white" style={{ backgroundColor: 'rgb(255,255,255)', filter: 'invert(1) hue-rotate(180deg)' }}>
        <FooterComponent />
      </div>
    </div>,
    document.body
  );
}

/* ─── Section ─── */
interface DigitalArtSectionProps {
  arts: DigitalArt[];
  title?: string;
  subtitle?: string;
  filterByCategory?: DigitalArt['category'];
  onOpenStudio?: (opts?: { tab?: 'browse' | 'product' | 'upload' | 'create' | 'orders' | 'designs'; artId?: string }) => void;
}

export function DigitalArtSection({
  arts: fallbackArts,
  title = 'Digital Art Collection',
  subtitle = 'Premium digital artwork for your projects',
  filterByCategory,
  onOpenStudio,
}: DigitalArtSectionProps) {
  const { arts, loading } = useDigitalArt(fallbackArts);
  const [viewerArt, setViewerArt] = useState<DigitalArt | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DigitalArt['category'] | 'all'>(filterByCategory || 'all');

  useEffect(() => { setMounted(true); }, []);

  const categories: { value: DigitalArt['category'] | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'illustration', label: 'Illustration' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'photography', label: 'Photography' },
    { value: 'graphic-design', label: 'Graphic Design' },
    { value: '3d-art', label: '3D Art' },
    { value: 'animation', label: 'Animation' },
  ];

  const filteredArts = selectedCategory === 'all' ? arts : arts.filter((a) => a.category === selectedCategory);

  const handleQuickView = (art: DigitalArt) => {
    if (onOpenStudio) {
      onOpenStudio({ tab: 'product', artId: art.id });
      return;
    }
    setViewerArt(art);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-black/45">Digital Art</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-black">{title}</h2>
        <p className="mt-2 text-sm text-black/60">{subtitle}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button key={cat.value} onClick={() => setSelectedCategory(cat.value)} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all ${selectedCategory === cat.value ? 'bg-black text-white shadow-lg' : 'bg-white text-black/70 border border-black/10 hover:border-black/30'}`}>
            {cat.label}
          </button>
        ))}
      </div>

      {onOpenStudio && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => onOpenStudio({ tab: 'browse' })} className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl">
            <Eye className="h-4 w-4" />Open Studio
          </button>
          <button onClick={() => onOpenStudio({ tab: 'upload' })} className="flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-black px-5 py-3 text-xs font-semibold text-black transition-all hover:bg-black/5">
            <Upload className="h-4 w-4" />Upload Artwork
          </button>
          <button onClick={() => onOpenStudio({ tab: 'create' })} className="flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-black px-5 py-3 text-xs font-semibold text-black transition-all hover:bg-black/5">
            <Plus className="h-4 w-4" />Create Design
          </button>
        </div>
      )}

      {loading && arts.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-square rounded-2xl bg-black/5 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredArts.map((art) => (
            <DigitalArtCard key={art.id} art={art} onQuickView={handleQuickView} />
          ))}
        </div>
      )}

      {filteredArts.length === 0 && !loading && (
        <div className="rounded-2xl border border-black/10 bg-white p-12 text-center">
          <p className="text-sm text-black/60">No digital art available in this category.</p>
        </div>
      )}

      {onOpenStudio && (
        <button onClick={onOpenStudio} className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl">
          <Eye className="h-4 w-4" />Open Print &amp; Design Studio
        </button>
      )}

      {/* Hub-panel Quick View — fullscreen, no blur/dim */}
      {mounted && viewerArt && <DigitalArtViewer art={viewerArt} onClose={() => setViewerArt(null)} />}
    </div>
  );
}

/* ─── Fallback sample data (working Unsplash images) ─── */
export const SAMPLE_DIGITAL_ART: DigitalArt[] = [
  { id: 'art-1', name: 'Neon Dreams', artist: 'Alex Chen', price: 49.99, image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80', description: 'A vibrant cyberpunk-inspired digital illustration featuring neon lights and futuristic cityscapes.', category: 'illustration', fileFormats: ['PNG', 'JPG', 'PSD'], resolution: '4K', dimensions: { width: 3840, height: 2160 }, tags: ['cyberpunk', 'neon', 'futuristic', 'city'], downloads: 234, featured: true },
  { id: 'art-2', name: 'Abstract Waves', artist: 'Sarah Johnson', price: 39.99, image: 'https://images.unsplash.com/photo-1567095761054-7a02e69e5571?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1567095761054-7a02e69e5571?w=600&q=80', description: 'Flowing abstract patterns with rich gradient colors perfect for modern digital designs.', category: 'abstract', fileFormats: ['PNG', 'SVG', 'AI'], resolution: '8K', dimensions: { width: 7680, height: 4320 }, tags: ['abstract', 'waves', 'gradient', 'modern'], downloads: 456, featured: true },
  { id: 'art-3', name: 'Golden Hour Landscape', artist: 'Mike Torres', price: 29.99, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', description: 'Breathtaking mountain landscape captured during golden hour with stunning natural light.', category: 'photography', fileFormats: ['JPG', 'PNG'], resolution: '4K', dimensions: { width: 4096, height: 2730 }, tags: ['landscape', 'mountains', 'golden-hour', 'nature'], downloads: 189 },
  { id: 'art-4', name: 'Geometric Brand Kit', artist: 'Emma Wilson', price: 34.99, image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&q=80', description: 'Professional geometric pattern pack for branding, social media, and background design.', category: 'graphic-design', fileFormats: ['PNG', 'SVG', 'AI', 'PDF'], resolution: '8K', dimensions: { width: 8000, height: 8000 }, tags: ['geometric', 'pattern', 'branding', 'design'], downloads: 567 },
  { id: 'art-5', name: 'Crystal Prism Render', artist: 'David Kim', price: 59.99, image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&q=80', description: 'Photo-realistic 3D crystal render with volumetric lighting and caustic reflections.', category: '3d-art', fileFormats: ['PNG', 'JPG'], resolution: '4K', dimensions: { width: 4000, height: 4000 }, tags: ['3d', 'crystal', 'render', 'lighting'], downloads: 123, featured: true },
  { id: 'art-6', name: 'Motion Elements Pack', artist: 'Lisa Martinez', price: 79.99, image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80', description: 'Curated collection of animated motion graphics elements and transitions for video projects.', category: 'animation', fileFormats: ['PNG', 'GIF'], resolution: '1080p', dimensions: { width: 1920, height: 1080 }, tags: ['animation', 'motion', 'video', 'transitions'], downloads: 345 },
];
