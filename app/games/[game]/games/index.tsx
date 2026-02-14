'use client';

import dynamic from 'next/dynamic';
import { DiceGame } from './DiceGame';
import { CrashGame } from './CrashGame';
import { JackpotGame } from './JackpotGame';
import { MinesGame } from './MinesGame';
import { SlotsGame } from './SlotsGame';
import { PlinkoGame } from './PlinkoGame';
import { FlappyBirdGame } from './FlappyBirdGame';

const WheelGame = dynamic(() => import('./WheelGame').then(mod => mod.WheelGame), {
  ssr: false,
  loading: () => (
    <div className="bc-game-area">
      <div className="bc-sidebar" />
      <div className="bc-game-field" />
    </div>
  ),
});

export function getGameContent(game: string) {
  switch (game) {
    case 'dice': return <DiceGame />;
    case 'mines': return <MinesGame />;
    case 'plinko': return <PlinkoGame />;
    case 'wheel': return <WheelGame />;
    case 'jackpot': return <JackpotGame />;
    case 'crash': return <CrashGame />;
    case 'slots': return <SlotsGame />;
    case 'flappybird': return <FlappyBirdGame />;
    default: return null;
  }
}
