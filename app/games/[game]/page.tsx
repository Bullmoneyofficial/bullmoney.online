import CasinoGamePage from './GamePageClient';

/** All known game slugs — pre-rendered at build time for instant navigation */
const VALID_GAMES = [
  'dice',
  'mines',
  'plinko',
  'wheel',
  'jackpot',
  'crash',
  'slots',
  'flappybird',
] as const;

export function generateStaticParams() {
  return VALID_GAMES.map((game) => ({ game }));
}

/** Allow runtime handling so routes never 404 due to missing static output */
export const dynamicParams = true;

export default function GamePage({
  params,
}: {
  params: { game: string };
}) {
  return <CasinoGamePage game={params.game} />;
}
