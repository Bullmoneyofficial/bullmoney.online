'use client';

import { useState, useEffect } from 'react';
import { X, Edit3, Maximize2, Ruler, Image as ImageIcon } from 'lucide-react';
import { createPortal } from 'react-dom';

export type PrintProductType = 'poster' | 'banner' | 'wallpaper' | 'canvas' | 'tshirt' | 'cap';

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
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white transition-all hover:shadow-lg">
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
            onClick={() => onQuickView(product)}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-black transition-transform hover:scale-105"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Quick View
          </button>
          {product.customizable && (
            <button
              onClick={() => onCustomize(product)}
              className="flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-semibold text-white transition-transform hover:scale-105"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Customize
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate text-black">{product.name}</h3>
            {product.description && (
              <p className="mt-1 text-xs text-black/60 line-clamp-2">{product.description}</p>
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
          <span className="text-[10px] text-black/50">
            {product.sizes.length} sizes
          </span>
        </div>

        {product.printerCompatible.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.printerCompatible.map((printer) => (
              <span
                key={printer}
                className="text-[9px] px-2 py-0.5 rounded-full bg-black/5 text-black/60"
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

  const totalPrice = selectedSize.price * quantity;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 overflow-y-auto p-3 sm:p-6 md:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ pointerEvents: 'all' }}
    >
      <div
        className="relative w-full max-w-[96vw] sm:max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-y-auto my-auto bg-[#f5f5f7] text-black rounded-2xl md:rounded-3xl border border-black/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'all' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-30 border-b border-black/10 bg-[#f5f5f7]/90 backdrop-blur-md">
          <div className="relative flex items-center justify-between px-6 py-4 pr-14">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-black/50">{product.type}</p>
              <h2 className="mt-1 text-xl font-semibold text-black">{product.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="absolute top-1/2 right-4 -translate-y-1/2 flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-white border border-black/10 text-black/70 transition-all hover:bg-black/5 shadow-lg z-40"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 md:px-10 py-6 md:py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {/* Image Preview */}
          <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden md:sticky md:top-24 self-start">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-4 right-4">
              <button
                onClick={onCustomize}
                className="flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-transform hover:scale-105"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Customize Design
              </button>
            </div>
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            {product.description && (
              <p className="text-sm text-black/70 mb-6">{product.description}</p>
            )}

            {/* Size Selection */}
            <div className="mb-6">
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
                        ? 'border-black bg-black text-white'
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
            <div className="mb-6">
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
              <div className="mb-6 rounded-xl bg-black/5 p-4">
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
              <button className="w-full rounded-full bg-black px-6 py-4 text-sm font-semibold text-white transition-transform hover:scale-[1.02]">
                Add to Cart
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface PrintProductsSectionProps {
  products: PrintProduct[];
  title?: string;
  subtitle?: string;
}

export function PrintProductsSection({ 
  products, 
  title = "Custom Print Products",
  subtitle = "Professional printing with Roland & Mimaki"
}: PrintProductsSectionProps) {
  const [viewerProduct, setViewerProduct] = useState<PrintProduct | null>(null);
  const [customizeProduct, setCustomizeProduct] = useState<PrintProduct | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCustomize = (product: PrintProduct) => {
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
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 overflow-y-auto p-3 sm:p-6 md:p-8"
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

// Sample print products data
export const SAMPLE_PRINT_PRODUCTS: PrintProduct[] = [
  {
    id: 'poster-1',
    name: 'Premium Poster Print',
    type: 'poster',
    basePrice: 19.99,
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800',
    description: 'High-quality poster prints on premium paper',
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
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    description: 'Durable vinyl banners for indoor and outdoor use',
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
    image: 'https://images.unsplash.com/photo-1579762593131-8c4e8d5b7e7d?w=800',
    description: 'Museum-quality canvas prints stretched on wooden frames',
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
    image: 'https://images.unsplash.com/photo-1615529162924-f8605388461d?w=800',
    description: 'Removable wallpaper panels for easy installation',
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
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    description: 'Premium cotton t-shirts with custom prints',
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
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
    description: 'High-quality caps with custom embroidery',
    sizes: [
      { label: 'One Size', price: 19.99 },
      { label: 'Adjustable', price: 22.99 },
    ],
    customizable: true,
    printerCompatible: ['Embroidery Machine'],
  },
];
