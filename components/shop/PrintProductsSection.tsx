'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion';
import { X, Edit3, Maximize2, Ruler, Image as ImageIcon, ShoppingBag, ShoppingCart, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useCartStore } from '@/stores/cart-store';
import type { ProductWithDetails, Variant } from '@/types/store';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';

const FooterComponent = dynamic(() => import('@/components/Mainpage/footer').then((mod) => ({ default: mod.Footer })), { ssr: false });

export type PrintProductType = 'poster' | 'banner' | 'wallpaper' | 'canvas' | 'tshirt' | 'cap' | 'hoodie' | 'pants' | 'sticker' | 'business-card' | 'window-design';

export interface PrintProduct {
  id: string;
  name: string;
  type: PrintProductType;
  basePrice: number;
  image: string;
  description?: string;
  sizes: {
    label: string;
    width?: number;
    height?: number;
    price: number;
  }[];
  customizable: boolean;
  printerCompatible: string[]; // e.g., ['Roland', 'Mimaki']
}

interface PrintProductCardProps {
  product: PrintProduct;
  onQuickView: (product: PrintProduct) => void;
  onCustomize: (product: PrintProduct) => void;
}

function PrintProductCard({ product, onQuickView, onCustomize }: PrintProductCardProps) {
  const getTypeIcon = () => {
    switch (product.type) {
      case 'poster':
      case 'banner':
      case 'wallpaper':
      case 'canvas':
        return <ImageIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTypeBadgeColor = () => {
    switch (product.type) {
      case 'poster':
        return 'bg-blue-500';
      case 'banner':
        return 'bg-purple-500';
      case 'wallpaper':
        return 'bg-green-500';
      case 'canvas':
        return 'bg-orange-500';
      case 'tshirt':
        return 'bg-pink-500';
      case 'cap':
        return 'bg-indigo-500';
      case 'hoodie':
        return 'bg-rose-500';
      case 'pants':
        return 'bg-amber-500';
      case 'sticker':
        return 'bg-lime-600';
      case 'business-card':
        return 'bg-cyan-500';
      case 'window-design':
        return 'bg-teal-600';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white transition-all hover:shadow-lg cursor-pointer"
      onClick={() => onQuickView(product)}
    >
      <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <span className={`${getTypeBadgeColor()} px-3 py-1 rounded-full text-[10px] font-semibold text-white uppercase tracking-wider`}>
            {product.type}
          </span>
        </div>
        
        {/* Quick action buttons - shown on hover */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-black transition-transform hover:scale-105"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Quick View
          </button>
          {product.customizable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCustomize(product);
              }}
              className="flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-semibold text-white transition-transform hover:scale-105"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Customize
            </button>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute inset-0 z-[5] md:hidden"
          aria-label={`Quick view ${product.name}`}
        />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate text-black">{product.name}</h3>
            {product.description && (
              <p className="mt-1 text-xs text-black/70 line-clamp-2">{product.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {getTypeIcon()}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-black">
            From ${product.basePrice.toFixed(2)}
          </span>
          <span className="text-[10px] text-black/60">
            {product.sizes.length} sizes
          </span>
        </div>

        {product.printerCompatible.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.printerCompatible.map((printer) => (
              <span
                key={printer}
                className="text-[9px] px-2 py-0.5 rounded-full bg-black/5 text-black/70"
              >
                {printer}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface PrintProductsViewerProps {
  product: PrintProduct;
  onClose: () => void;
  onCustomize: () => void;
}

function PrintProductsViewer({ product, onClose, onCustomize }: PrintProductsViewerProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();
  const { isMobile, animations, shouldDisableBackdropBlur, shouldSkipHeavyEffects } = useMobilePerformance();

  const totalPrice = selectedSize.price * quantity;

  // Convert print product to cart-compatible format
  const handleAddToCart = () => {
    const cartProduct: ProductWithDetails = {
      id: `print-${product.id}`,
      name: product.name,
      slug: product.id,
      description: product.description || null,
      short_description: `${product.type} - ${selectedSize.label}`,
      base_price: selectedSize.price,
      compare_at_price: null,
      category_id: null,
      status: 'ACTIVE',
      featured: false,
      tags: [product.type, 'print'],
      details: { material: 'Premium Print', dimensions: { width: selectedSize.width, height: selectedSize.height } },
      seo_title: null,
      seo_description: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [{ id: '1', product_id: `print-${product.id}`, url: product.image, alt_text: product.name, sort_order: 0, is_primary: true, created_at: new Date().toISOString() }],
      variants: [],
      primary_image: product.image,
    };

    const variant: Variant = {
      id: `${product.id}-${selectedSize.label}`,
      product_id: `print-${product.id}`,
      sku: `PRINT-${product.id}-${selectedSize.label}`.toUpperCase(),
      name: selectedSize.label,
      options: { size: selectedSize.label, type: product.type },
      price_adjustment: 0,
      inventory_count: 999,
      low_stock_threshold: 5,
      weight_grams: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addItem(cartProduct, variant, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // ESC key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className={`fixed inset-0 z-[2147483647] flex items-stretch justify-end bg-white/80 ${shouldDisableBackdropBlur ? '' : 'sm:backdrop-blur-md'}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        style={{ pointerEvents: 'all', overscrollBehavior: 'none', touchAction: 'none' }}
      >
        {!shouldSkipHeavyEffects && ['top', 'bottom', 'left', 'right'].map((pos) => (
          <motion.div
            key={pos}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute text-blue-300/50 text-xs pointer-events-none ${
              pos === 'top' ? 'top-4 left-1/2 -translate-x-1/2' :
              pos === 'bottom' ? 'bottom-4 left-1/2 -translate-x-1/2' :
              pos === 'left' ? 'left-2 top-1/2 -translate-y-1/2' :
              'right-2 top-1/2 -translate-y-1/2'
            }`}
          >
            {pos === 'top' || pos === 'bottom' ? (
              <span>↑ Tap anywhere to close ↑</span>
            ) : (
              <span style={{ writingMode: 'vertical-rl' }}>Tap to close</span>
            )}
          </motion.div>
        ))}

        <motion.div
          data-no-theme
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
          className={`relative w-full h-[100dvh] max-w-[320px] sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white text-black border-l border-black/10 flex flex-col safe-area-inset-bottom overflow-hidden ${shouldDisableBackdropBlur ? '' : 'sm:backdrop-blur-2xl'} ${isMobile ? '' : 'shadow-2xl'}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          style={{ pointerEvents: 'all', backgroundColor: '#ffffff' }}
        >
          <div className="flex items-center justify-between p-1 sm:p-4 md:p-5 border-b border-black/10 bg-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-white border border-black/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-black/50">Quick View</p>
                <p className="text-sm font-medium text-black truncate">{product.name}</p>
              </div>
            </div>
            <motion.button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="h-10 w-10 rounded-xl bg-white border border-black/10 flex items-center justify-center hover:border-black/20 active:scale-95 transition-all"
              style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="w-full flex-1 overflow-y-auto overscroll-contain overflow-x-hidden px-1 sm:px-6 md:px-8 py-1.5 sm:py-6 md:py-8" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-1.5 sm:gap-6 lg:gap-10">
              {/* Image Preview */}
              <div className="space-y-4 lg:sticky lg:top-24 self-start">
                <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={onCustomize}
                    className="flex items-center gap-2 rounded-full bg-white border border-black/20 px-4 py-2.5 text-xs font-semibold text-black shadow-sm transition-transform hover:scale-105"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Customize Design
                  </button>
                </div>
              </div>

              {/* Product Details */}
              <div className="flex flex-col space-y-6 pr-1">
                {product.description && (
                  <p className="text-sm text-black/70">{product.description}</p>
                )}

              {/* Size Selection */}
              <div>
                <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-black">
                  <Ruler className="h-4 w-4" />
                  Select Size
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size.label}
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        selectedSize.label === size.label
                          ? 'border-black bg-white text-black'
                          : 'border-black/10 bg-white text-black hover:border-black/30'
                      }`}
                    >
                      <div className="font-semibold text-sm">{size.label}</div>
                      {size.width && size.height && (
                        <div className="text-[10px] mt-0.5 opacity-70">
                          {size.width}" × {size.height}"
                        </div>
                      )}
                      <div className="text-xs mt-1 font-medium">${size.price.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block mb-3 text-sm font-semibold text-black">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black transition-colors hover:bg-black/5"
                  >
                    -
                  </button>
                  <span className="text-lg font-semibold text-black w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black transition-colors hover:bg-black/5"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Printer Info */}
              {product.printerCompatible.length > 0 && (
                <div className="rounded-xl bg-white border border-black/5 p-4">
                  <p className="text-xs font-semibold text-black mb-2">Printed Using:</p>
                  <div className="flex flex-wrap gap-2">
                    {product.printerCompatible.map((printer) => (
                      <span
                        key={printer}
                        className="px-3 py-1.5 rounded-full bg-white text-xs font-medium text-black border border-black/10"
                      >
                        {printer}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price & Add to Cart */}
              <div className="mt-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-black/60">Total Price:</span>
                  <span className="text-2xl font-bold text-black">${totalPrice.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleAddToCart}
                  className="w-full rounded-full px-6 py-4 text-sm font-semibold text-black transition-all hover:scale-[1.02] flex items-center justify-center gap-2 border border-black/20 bg-white"
                >
                  {added ? <><Check className="h-4 w-4" />Added to Cart!</> : <><ShoppingCart className="h-4 w-4" />Add to Cart</>}
                </button>
              </div>
            </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

interface PrintProductsSectionProps {
  products: PrintProduct[];
  title?: string;
  subtitle?: string;
  onOpenStudio?: (opts?: { tab?: 'browse' | 'product' | 'upload' | 'create' | 'orders' | 'designs'; productId?: string; productType?: string }) => void;
}

export function PrintProductsSection({ 
  products, 
  title = "Custom Print Products",
  subtitle = "Professional printing with Roland & Mimaki",
  onOpenStudio,
}: PrintProductsSectionProps) {
  const [viewerProduct, setViewerProduct] = useState<PrintProduct | null>(null);
  const [customizeProduct, setCustomizeProduct] = useState<PrintProduct | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCustomize = (product: PrintProduct) => {
    if (onOpenStudio) {
      onOpenStudio({ tab: 'product', productId: product.id, productType: product.type });
      return;
    }
    setCustomizeProduct(product);
    setViewerProduct(null);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-black/45">Print & Design</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-black">{title}</h2>
        <p className="mt-2 text-sm text-black/60">{subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <PrintProductCard
            key={product.id}
            product={product}
            onQuickView={setViewerProduct}
            onCustomize={handleCustomize}
          />
        ))}
      </div>

      {products.length === 0 && (
        <div className="rounded-2xl border border-black/10 bg-white p-12 text-center">
          <p className="text-sm text-black/60">No print products available at the moment.</p>
        </div>
      )}

      {/* Quick View Modal */}
      {mounted && viewerProduct && (
        <PrintProductsViewer
          product={viewerProduct}
          onClose={() => setViewerProduct(null)}
          onCustomize={() => handleCustomize(viewerProduct)}
        />
      )}

      {/* Customization Modal - Placeholder for now */}
      {mounted && customizeProduct && createPortal(
        <div
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/70 overflow-y-auto p-3 sm:p-6 md:p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCustomizeProduct(null);
          }}
          style={{ pointerEvents: 'all' }}
        >
          <div
            className="relative w-full max-w-[96vw] sm:max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-y-auto my-auto bg-[#f5f5f7] text-black rounded-2xl md:rounded-3xl border border-black/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'all' }}
          >
            <div className="sticky top-0 z-30 border-b border-black/10 bg-[#f5f5f7]/90 backdrop-blur-md">
              <div className="relative flex items-center justify-between px-6 py-4 pr-14">
                <h2 className="text-2xl font-bold text-black">Customize {customizeProduct.name}</h2>
                <button
                  onClick={() => setCustomizeProduct(null)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-white border border-black/10 text-black/70 transition-all hover:bg-black/5 shadow-lg z-40"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <div className="p-8">
            
            <div className="rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 p-12 text-center">
              <Edit3 className="h-16 w-16 mx-auto text-black/30 mb-4" />
              <p className="text-lg font-semibold text-black mb-2">Design Editor Coming Soon</p>
              <p className="text-sm text-black/60 max-w-md mx-auto">
                Upload your design, add text, apply filters, and customize your {customizeProduct.type} with our advanced editor.
              </p>
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Sample print products data (all 11 product types with category-accurate images)
export const SAMPLE_PRINT_PRODUCTS: PrintProduct[] = [
  {
    id: 'poster-1',
    name: 'Premium Poster Print',
    type: 'poster',
    basePrice: 19.99,
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
    description: 'High-quality poster prints on premium 200gsm matte paper with vivid color reproduction.',
    sizes: [
      { label: 'Small', width: 12, height: 18, price: 19.99 },
      { label: 'Medium', width: 18, height: 24, price: 29.99 },
      { label: 'Large', width: 24, height: 36, price: 49.99 },
      { label: 'X-Large', width: 36, height: 48, price: 79.99 },
    ],
    customizable: true,
    printerCompatible: ['Roland', 'Mimaki'],
  },
  {
    id: 'banner-1',
    name: 'Vinyl Banner',
    type: 'banner',
    basePrice: 49.99,
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
    description: 'Durable heavy-duty vinyl banners for indoor and outdoor display. UV & weather resistant.',
    sizes: [
      { label: 'Small', width: 24, height: 36, price: 49.99 },
      { label: 'Medium', width: 36, height: 60, price: 89.99 },
      { label: 'Large', width: 48, height: 96, price: 149.99 },
    ],
    customizable: true,
    printerCompatible: ['Roland', 'Mimaki'],
  },
  {
    id: 'canvas-1',
    name: 'Stretched Canvas',
    type: 'canvas',
    basePrice: 59.99,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
    description: 'Museum-quality canvas prints hand-stretched on 1.5" solid pine frames with gallery wrap.',
    sizes: [
      { label: 'Small', width: 12, height: 16, price: 59.99 },
      { label: 'Medium', width: 18, height: 24, price: 89.99 },
      { label: 'Large', width: 24, height: 36, price: 149.99 },
    ],
    customizable: true,
    printerCompatible: ['Roland'],
  },
  {
    id: 'wallpaper-1',
    name: 'Custom Wallpaper',
    type: 'wallpaper',
    basePrice: 99.99,
    image: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800&q=80',
    description: 'Peel-and-stick removable wallpaper panels. Repositionable and residue-free.',
    sizes: [
      { label: 'Single Panel', width: 24, height: 96, price: 99.99 },
      { label: 'Double Panel', width: 48, height: 96, price: 179.99 },
      { label: 'Full Wall', width: 96, height: 96, price: 299.99 },
    ],
    customizable: true,
    printerCompatible: ['Roland'],
  },
  {
    id: 'tshirt-1',
    name: 'Custom T-Shirt',
    type: 'tshirt',
    basePrice: 24.99,
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80',
    description: 'Premium ring-spun cotton tees with DTG full-color printing. Pre-shrunk and soft-washed.',
    sizes: [
      { label: 'S', price: 24.99 },
      { label: 'M', price: 24.99 },
      { label: 'L', price: 24.99 },
      { label: 'XL', price: 27.99 },
      { label: '2XL', price: 29.99 },
    ],
    customizable: true,
    printerCompatible: ['Heat Press'],
  },
  {
    id: 'cap-1',
    name: 'Embroidered Cap',
    type: 'cap',
    basePrice: 19.99,
    image: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800&q=80',
    description: 'Structured cotton twill caps with precision multi-thread embroidery. Adjustable strap.',
    sizes: [
      { label: 'One Size', price: 19.99 },
      { label: 'Adjustable', price: 22.99 },
    ],
    customizable: true,
    printerCompatible: ['Embroidery Machine'],
  },
  {
    id: 'hoodie-1',
    name: 'Custom Hoodie',
    type: 'hoodie',
    basePrice: 44.99,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
    description: 'Heavyweight fleece hoodie with premium prints and soft interior lining.',
    sizes: [
      { label: 'S', price: 44.99 },
      { label: 'M', price: 44.99 },
      { label: 'L', price: 44.99 },
      { label: 'XL', price: 49.99 },
      { label: '2XL', price: 54.99 },
    ],
    customizable: true,
    printerCompatible: ['Heat Press'],
  },
  {
    id: 'joggers-1',
    name: 'Custom Joggers',
    type: 'pants',
    basePrice: 39.99,
    image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&q=80',
    description: 'Soft joggers with precise print placement and tapered fit.',
    sizes: [
      { label: 'S', price: 39.99 },
      { label: 'M', price: 39.99 },
      { label: 'L', price: 39.99 },
      { label: 'XL', price: 44.99 },
    ],
    customizable: true,
    printerCompatible: ['Heat Press'],
  },
  {
    id: 'sticker-1',
    name: 'Sticker Pack',
    type: 'sticker',
    basePrice: 9.99,
    image: 'https://images.unsplash.com/photo-1521540216272-a50305cd4421?w=800&q=80',
    description: 'Matte vinyl stickers with weatherproof laminate finish.',
    sizes: [
      { label: 'Small', width: 3, height: 3, price: 9.99 },
      { label: 'Medium', width: 5, height: 5, price: 14.99 },
      { label: 'Large', width: 7, height: 7, price: 19.99 },
    ],
    customizable: true,
    printerCompatible: ['Roland'],
  },
  {
    id: 'business-card-1',
    name: 'Business Cards',
    type: 'business-card',
    basePrice: 24.99,
    image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&q=80',
    description: 'Premium 16pt matte business cards with smooth edges.',
    sizes: [
      { label: 'Standard', width: 3.5, height: 2, price: 24.99 },
      { label: 'Square', width: 2.5, height: 2.5, price: 29.99 },
    ],
    customizable: true,
    printerCompatible: ['Roland'],
  },
  {
    id: 'window-1',
    name: 'Window Graphics',
    type: 'window-design',
    basePrice: 79.99,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    description: 'Perforated window graphics for storefronts and studios.',
    sizes: [
      { label: 'Small', width: 24, height: 36, price: 79.99 },
      { label: 'Medium', width: 36, height: 60, price: 129.99 },
      { label: 'Large', width: 48, height: 96, price: 199.99 },
    ],
    customizable: true,
    printerCompatible: ['Mimaki'],
  },
];
