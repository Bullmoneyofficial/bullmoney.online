'use client';

import { use, useState } from 'react';
import { Loader2 } from 'lucide-react';

const CASINO_URL = process.env.NEXT_PUBLIC_CASINO_URL || 'https://www.bullmoney.online/demogames';

export default function CasinoGamePage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = use(params);
  const [loading, setLoading] = useState(true);

  return (
    <div
      data-game-iframe
      className="relative w-full"
      style={{
        height: 'calc(100dvh - 48px)',
        minHeight: '400px',
        touchAction: 'auto',
        WebkitOverflowScrolling: 'touch',
        position: 'relative',
        zIndex: 5,
      }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}
      <iframe
        data-game-frame
        src={`${CASINO_URL}/${game}`}
        title={`BullMoney Casino - ${game}`}
        onLoad={() => setLoading(false)}
        allow="fullscreen; autoplay; clipboard-write; encrypted-media; payment; camera; microphone; display-capture; web-share"
        referrerPolicy="origin"
        loading="lazy"
        className="w-full h-full border-0"
        style={{
          display: loading ? 'none' : 'block',
          pointerEvents: 'auto',
          touchAction: 'auto',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          zIndex: 5,
          transform: 'translateZ(0)',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
