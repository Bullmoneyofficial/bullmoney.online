'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getGameContent } from '@/app/games/[game]/games';
import { GAME_STYLES } from '@/app/games/[game]/games/game-styles';
import { VALID_GAMES } from '@/app/games/[game]/games/valid-games';

const GAME_PATH_RE = /^\/games\/([^/?#]+)\/?$/;

export function GamesModalProvider() {
  const [mounted, setMounted] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const validGames = useMemo(() => new Set(VALID_GAMES), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest?.('a');
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#')) return;

      let pathname = rawHref;
      let targetUrl = rawHref;
      try {
        const resolved = new URL(rawHref, window.location.href);
        if (resolved.origin !== window.location.origin) return;
        pathname = resolved.pathname;
        targetUrl = resolved.href;
      } catch {
        pathname = rawHref.split('?')[0].split('#')[0];
        targetUrl = rawHref;
      }

      const match = pathname.match(GAME_PATH_RE);
      if (!match) return;
      const slug = match[1];
      if (!validGames.has(slug as any)) return;

      event.preventDefault();
      event.stopPropagation();
      if (typeof (event as any).stopImmediatePropagation === 'function') {
        (event as any).stopImmediatePropagation();
      }
      window.location.assign(targetUrl);
      return;
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [mounted, validGames]);

  useEffect(() => {
    if (!mounted) return;
    const body = document.body;
    const html = document.documentElement;
    if (activeGame) {
      const prevOverflow = body.style.overflow;
      const prevTransform = body.style.transform;
      body.style.overflow = 'hidden';
      body.style.transform = 'none';
      html.classList.add('bm-modal-open');
      return () => {
        body.style.overflow = prevOverflow;
        body.style.transform = prevTransform;
        html.classList.remove('bm-modal-open');
      };
    }
  }, [mounted, activeGame]);

  useEffect(() => {
    if (!activeGame) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveGame(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeGame]);

  if (!mounted || !activeGame) return null;

  const content = getGameContent(activeGame);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      data-games-modal="true"
      data-state="open"
      className="open"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        backgroundColor: 'rgba(2, 6, 23, 0.92)',
        display: 'flex',
        flexDirection: 'column',
        color: '#e2e8f0',
        isolation: 'isolate',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: GAME_STYLES }} />
      <div
        onClick={() => setActiveGame(null)}
        style={{
          position: 'absolute',
          inset: 0,
          cursor: 'pointer',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(10px, 2vw, 24px)',
        }}
      >
        <div
          style={{
            width: 'min(1200px, 96vw)',
            height: 'min(92dvh, 900px)',
            background: 'radial-gradient(circle at top, rgba(15, 23, 42, 0.7), rgba(2, 6, 23, 0.95)), #0b1120',
            borderRadius: '18px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 30px 80px rgba(2, 6, 23, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
              background: 'rgba(15, 23, 42, 0.96)',
              color: '#e2e8f0',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Bullcasino Demo
            </div>
            <button
              type="button"
              onClick={() => setActiveGame(null)}
              style={{
                border: '1px solid rgba(148, 163, 184, 0.35)',
                background: 'rgba(15, 23, 42, 0.9)',
                color: '#e2e8f0',
                borderRadius: 999,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
          <div
            style={{
              position: 'relative',
              flex: 1,
              overflow: 'auto',
            }}
          >
            <div style={{ minHeight: '100%', padding: '12px 0' }}>
              {content ?? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                  Game not available: {activeGame}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
