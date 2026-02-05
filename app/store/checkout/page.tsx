'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ============================================================================
// CHECKOUT PAGE - COMING SOON
// ============================================================================

export default function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to store with coming soon message
    alert('Checkout coming soon!');
    router.replace('/store');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">🚀 Coming Soon</h1>
        <p className="text-white/60">Checkout is not available yet. Redirecting to store...</p>
      </div>
    </div>
  );
}
