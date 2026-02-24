'use client';

/**
 * StoreProductViewer.tsx
 *
 * Full-screen media viewer portal. Displays the primary image/video for a
 * product in an accessible dialog rendered directly into document.body.
 */

import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { ProductWithDetails } from '@/types/store';

interface ViewerMedia {
  url: string;
  type: 'image' | 'video';
}

interface StoreProductViewerProps {
  product: ProductWithDetails | null;
  mounted: boolean;
  onClose: () => void;
  normalizeAssetUrl: (src: string) => string;
}

function resolveViewerMedia(
  product: ProductWithDetails,
  normalizeAssetUrl: (src: string) => string
): ViewerMedia | null {
  const media = (
    product as ProductWithDetails & {
      media?: Array<{ url: string; media_type?: string; is_primary?: boolean }>;
    }
  ).media;

  const primaryImage =
    product.primary_image ||
    product.images?.find((img) => img.is_primary)?.url ||
    product.images?.[0]?.url;

  if (primaryImage) {
    return { url: normalizeAssetUrl(primaryImage), type: 'image' };
  }

  const primaryMedia = media?.find((item) => item.is_primary) || media?.[0];
  if (primaryMedia?.url) {
    return {
      url: normalizeAssetUrl(primaryMedia.url),
      type: primaryMedia.media_type === 'video' ? 'video' : 'image',
    };
  }

  return null;
}

export function StoreProductViewer({
  product,
  mounted,
  onClose,
  normalizeAssetUrl,
}: StoreProductViewerProps) {
  if (!product || !mounted || typeof document === 'undefined') return null;

  const viewerMedia = resolveViewerMedia(product, normalizeAssetUrl);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex h-full w-full items-center justify-center bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="Product media viewer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative h-full w-full bg-white">
        {/* Top bar */}
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-black/10 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.28em] text-black/60">Preview</p>
            <h3 className="mt-1 truncate text-lg font-semibold text-black">
              {product.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 text-black/70"
            aria-label="Close viewer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Media */}
        <div className="relative flex h-full w-full items-center justify-center bg-white pt-16">
          {viewerMedia?.type === 'video' ? (
            <video
              className="relative z-[10000] h-full w-full object-contain"
              controls
              playsInline
            >
              <source src={viewerMedia.url} type="video/mp4" />
            </video>
          ) : viewerMedia?.url ? (
            <img
              src={viewerMedia.url}
              alt={product.name}
              className="relative z-[10000] h-full w-full object-contain"
            />
          ) : (
            <div className="py-16 text-sm text-black/60">No media available.</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
