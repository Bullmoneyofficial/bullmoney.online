import CasinoGamePage from './GamePageClient';
import { VALID_GAMES } from './games/valid-games';

export function generateStaticParams() {
  return VALID_GAMES.map((game) => ({ game }));
}

/** Allow runtime handling so routes never 404 due to missing static output */
export const dynamicParams = true;

export default async function GamePage({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;
  return <CasinoGamePage game={game} />;
}
