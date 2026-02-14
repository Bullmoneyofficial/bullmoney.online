'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GameError]', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, rgba(15,23,42,0.7), rgba(2,6,23,0.95)), #0b1120',
        padding: 24,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎮</div>
        <h2 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          Game failed to load
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Something went wrong while loading the game. This can happen due to a slow connection or a temporary glitch.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              padding: '12px 28px',
              background: '#00e701',
              color: '#000',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Try Again
          </button>
          <Link
            href="/games"
            prefetch={true}
            style={{
              padding: '12px 28px',
              background: 'rgba(255,255,255,0.08)',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            All Games
          </Link>
        </div>
      </div>
    </div>
  );
}
