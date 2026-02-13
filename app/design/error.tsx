'use client';

import { useEffect } from 'react';

export default function DesignError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Design Page Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h2 className="text-white text-xl font-semibold mb-3">
          Design Studio failed to load
        </h2>
        <p className="text-white/60 text-sm mb-6">
          This can happen on slow connections. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
