/**
 * EXAMPLE: Casino Page with Telegram Bonus Integration
 * 
 * This example shows how to integrate the TelegramBonusCard component
 * into your casino page. You can customize this to fit your design needs.
 * 
 * To use: Replace the contents of app/casino/page.tsx with this code,
 * or integrate the TelegramBonusCard component as needed.
 */

'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { TelegramBonusCard } from '@/components/casino/TelegramBonusCard';

const CASINO_URL = process.env.NEXT_PUBLIC_CASINO_URL || '/casino-games';

export default function CasinoPageExample() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* OPTION 1: Bonus card above the casino iframe */}
      <div className="container mx-auto p-4">
        <TelegramBonusCard className="mb-4" />
      </div>

      {/* Casino iframe */}
      <div className="relative w-full" style={{ height: 'calc(100vh - 200px)' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        )}
        <iframe
          src={CASINO_URL}
          title="BullMoney Casino"
          onLoad={() => setLoading(false)}
          allow="fullscreen; autoplay; clipboard-write"
          className="w-full h-full border-0"
          style={{ display: loading ? 'none' : 'block' }}
        />
      </div>
    </div>
  );
}

/**
 * ALTERNATIVE OPTION 2: Side-by-side layout (for wider screens)
 */
export function CasinoPageSideBySide() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sidebar with bonus card */}
          <div className="lg:col-span-1">
            <TelegramBonusCard />
            {/* You can add more cards here like leaderboard, stats, etc. */}
          </div>

          {/* Main casino area */}
          <div className="lg:col-span-2">
            <div className="relative w-full bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 100px)' }}>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              )}
              <iframe
                src={CASINO_URL}
                title="BullMoney Casino"
                onLoad={() => setLoading(false)}
                allow="fullscreen; autoplay; clipboard-write"
                className="w-full h-full border-0"
                style={{ display: loading ? 'none' : 'block' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ALTERNATIVE OPTION 3: Collapsible bonus banner at top
 */
export function CasinoPageWithBanner() {
  const [loading, setLoading] = useState(true);
  const [bannerCollapsed, setBannerCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Collapsible banner */}
      {!bannerCollapsed && (
        <div className="relative">
          <TelegramBonusCard className="m-4" />
          <button
            onClick={() => setBannerCollapsed(true)}
            className="absolute top-2 right-2 text-white hover:text-gray-200 text-2xl"
            aria-label="Close banner"
          >
            ×
          </button>
        </div>
      )}

      {/* Show collapsed button */}
      {bannerCollapsed && (
        <div className="p-4">
          <button
            onClick={() => setBannerCollapsed(false)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow"
          >
            🎁 Show Telegram Bonus
          </button>
        </div>
      )}

      {/* Casino iframe */}
      <div className="relative w-full" style={{ height: bannerCollapsed ? 'calc(100vh - 80px)' : 'calc(100vh - 300px)' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        )}
        <iframe
          src={CASINO_URL}
          title="BullMoney Casino"
          onLoad={() => setLoading(false)}
          allow="fullscreen; autoplay; clipboard-write"
          className="w-full h-full border-0"
          style={{ display: loading ? 'none' : 'block' }}
        />
      </div>
    </div>
  );
}

/**
 * ALTERNATIVE OPTION 4: Modal/popup for bonus
 */
export function CasinoPageWithModal() {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 48px)' }}>
      {/* Floating button to open modal */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-50 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
      >
        <span className="text-2xl">🎁</span>
        <span className="font-semibold">Free Bonus</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full">
            <button
              onClick={() => setShowModal(false)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 text-2xl"
            >
              ×
            </button>
            <TelegramBonusCard />
          </div>
        </div>
      )}

      {/* Casino iframe */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}
      <iframe
        src={CASINO_URL}
        title="BullMoney Casino"
        onLoad={() => setLoading(false)}
        allow="fullscreen; autoplay; clipboard-write"
        className="w-full h-full border-0"
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  );
}
