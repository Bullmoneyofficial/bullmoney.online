export const VALID_GAMES = [
  'dice',
  'mines',
  'plinko',
  'wheel',
  'jackpot',
  'crash',
  'slots',
  'flappybird',
] as const;

export type ValidGame = (typeof VALID_GAMES)[number];
