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

/** Allow unknown slugs to be handled at runtime (shows "game not found") */
export const dynamicParams = true;

export default async function GamePage({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;
  return <CasinoGamePage game={game} />;
}
