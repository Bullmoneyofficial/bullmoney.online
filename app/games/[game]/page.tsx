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

/** Static export: only build known slugs to avoid 404 on first load */
export const dynamicParams = false;
export const dynamic = 'force-static';

export default function GamePage({
  params,
}: {
  params: { game: string };
}) {
  return <CasinoGamePage game={params.game} />;
}
