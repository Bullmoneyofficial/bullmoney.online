'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Store-specific error boundary.
 * Uses zero heavy imports (no framer-motion) so this boundary itself
 * cannot crash due to a failed chunk load.
 */
export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Store] Error boundary caught:', error);
  }, [error]);

  const isChunkError =
    error?.message?.includes('ChunkLoadError') ||
    error?.message?.includes('Loading chunk') ||
    error?.message?.includes('Failed to fetch');

  const handleReload = () => {
    // Clear caches before reload so we get fresh chunks
    if (typeof window !== 'undefined') {
      try {
        if ('caches' in window) {
          caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
        }
      } catch {}
    }
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative w-16 h-16 mx-auto">
          <Image
            src="/bullmoney-logo.png"
            alt="BullMoney"
            fill
            className="object-contain"
          />
        </div>

        <h2 className="text-xl font-bold text-black">
          {isChunkError ? 'New Update Available' : 'Something went wrong'}
        </h2>

        <p className="text-sm text-black/60">
          {isChunkError
            ? 'A new version of the store was deployed. Please reload to get the latest version.'
            : error?.message || 'An unexpected error occurred in the store.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isChunkError ? (
            <button
              onClick={handleReload}
              className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-black/80 transition-colors"
            >
              Reload Store
            </button>
          ) : (
            <>
              <button
                onClick={reset}
                className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-black/80 transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/store"
                className="px-6 py-2.5 border border-black/10 text-black rounded-full text-sm font-medium hover:bg-black/5 transition-colors"
              >
                Back to Store
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
