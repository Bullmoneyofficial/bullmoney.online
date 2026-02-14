'use client';

import { useEffect, useState } from 'react';

export function SlotsGame() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<Array<{
    id: string;
    name: string;
    provider: string;
    rtp: number;
    volatility: 'Low' | 'Medium' | 'High';
    minBet: number;
    maxBet: number;
    thumbnail: string;
    demoUrl: string;
    tags: string[];
  }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/casino/slots', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setGames(Array.isArray(data?.games) ? data.games : []);
      } catch {
        if (!cancelled) setError('Slots service unavailable right now');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bc-game-area" style={{ flexDirection: 'column' }}>
      <div className="bc-game-field" style={{ width: '100%' }}>
        <div className="slots-header">
          <div>
            <div className="slots-title">Slots Vault</div>
            <div className="slots-subtitle">Free demo backend enabled</div>
          </div>
          <div className="slots-subtitle">{loading ? 'Loading...' : `${games.length} games`}</div>
        </div>
        {error ? (
          <div className="slots-placeholder">{error}</div>
        ) : loading ? (
          <div className="slots-placeholder">Loading free slots catalog...</div>
        ) : (
          <div className="slots-grid">
            {games.map((game) => (
              <div key={game.id} className="slots-card">
                <div className="slots-card-top">
                  <img
                    src={game.thumbnail}
                    alt={game.name}
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.fallbackStep) {
                        img.dataset.fallbackStep = '1';
                        img.src = '/v2/slots/kingofslots.jpg';
                        return;
                      }
                      if (img.dataset.fallbackStep === '1') img.src = '/v2/slots/kingofslots.jpg';
                    }}
                  />
                </div>
                <div className="slots-card-body">
                  <div className="slots-name">{game.name}</div>
                  <div className="slots-meta">{game.provider} \u2022 RTP {game.rtp}% \u2022 {game.volatility}</div>
                  <div className="slots-meta">${game.minBet.toFixed(2)} - ${game.maxBet.toFixed(2)}</div>
                  <div className="slots-tags">
                    {game.tags.slice(0, 3).map(tag => <span key={tag} className="slots-tag">{tag}</span>)}
                  </div>
                  <button type="button" className="slots-play-btn disabled">
                    Coming Soon
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
