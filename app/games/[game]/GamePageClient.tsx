'use client';

/* eslint-disable @next/next/no-css-tags */

import { type ReactNode } from 'react';
import Link from 'next/link';
import { getGameContent } from './games';
import { GAME_STYLES } from './games/game-styles';
import { useCasinoGlobals } from './games/useCasinoGlobals';

export default function CasinoGamePage({ game }: { game: string }) {
  const content = getGameContent(game);

  if (!content) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#7a8a9a' }}>
        Game not found.{' '}
        <Link href="/games" prefetch={true} style={{ color: '#00e701', textDecoration: 'underline' }}>
          Return to Games
        </Link>
      </div>
    );
  }

  return (
    <CasinoGameInner game={game} content={content} />
  );
}

function CasinoGameInner({
  game,
  content,
}: {
  game: string;
  content: ReactNode;
}) {
  useCasinoGlobals(game);

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100dvh' }}>
      <link rel="stylesheet" href="/assets/css/style.css" />
      <link rel="stylesheet" href="/assets/css/notifyme.css" />
      {game === 'flappybird' && (
        <link rel="stylesheet" href="/games/bullcasino/css/flappybird.css" />
      )}
      <style dangerouslySetInnerHTML={{ __html: GAME_STYLES }} />
      {content}
    </div>
  );
}
