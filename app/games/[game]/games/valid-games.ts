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

export const GAME_SEO: Record<ValidGame, {
  name: string;
  title: string;
  description: string;
  image: string;
  keywords: string[];
}> = {
  dice: {
    name: 'Dice',
    title: 'Dice — Free Online Demo Game',
    description:
      'Play Dice free online with demo currency. Quick rounds, instant outcomes, and zero deposits — just a free casino-style demo game you can play in your browser.',
    image: '/assets/images/games/dice.png',
    keywords: ['free dice game', 'dice game online', 'free demo casino game', 'play dice free'],
  },
  mines: {
    name: 'Mines',
    title: 'Mines — Free Online Demo Game',
    description:
      'Play Mines free online with demo currency. Tap tiles, avoid mines, and cash out anytime — a free casino-style demo game in your browser.',
    image: '/assets/images/games/mines.png',
    keywords: ['free mines game', 'mines game online', 'free demo casino game', 'play mines free'],
  },
  plinko: {
    name: 'Plinko',
    title: 'Plinko — Free Online Demo Game',
    description:
      'Play Plinko free online with demo currency. Drop the ball, chase multipliers, and enjoy a free casino-style demo game with no deposits.',
    image: '/assets/images/games/plinko.svg',
    keywords: ['free plinko game', 'plinko online', 'free demo casino game', 'play plinko free'],
  },
  wheel: {
    name: 'Wheel',
    title: 'Wheel — Free Online Demo Game',
    description:
      'Play Wheel free online with demo currency. Pick your color and spin for multipliers — a free casino-style demo game you can play instantly.',
    image: '/assets/images/games/wheel.png',
    keywords: ['free wheel game', 'wheel spin game online', 'free demo casino game', 'play wheel free'],
  },
  jackpot: {
    name: 'Jackpot',
    title: 'Jackpot — Free Online Demo Game',
    description:
      'Play Jackpot free online with demo currency. Join the round, watch the pot climb, and enjoy a free casino-style demo game in your browser.',
    image: '/assets/images/games/jackpot.png',
    keywords: ['free jackpot game', 'jackpot online', 'free demo casino game', 'play jackpot free'],
  },
  crash: {
    name: 'Crash',
    title: 'Crash — Free Online Demo Game',
    description:
      'Play Crash free online with demo currency. Cash out before the crash — a fast, free casino-style demo game you can play in your browser.',
    image: '/assets/images/games/crash.png',
    keywords: ['free crash game', 'crash game online', 'free demo casino game', 'play crash free'],
  },
  slots: {
    name: 'Slots',
    title: 'Slots — Free Online Demo Game',
    description:
      'Play Slots free online with demo currency. Spin for fun with no deposits — a free casino-style demo experience you can play instantly.',
    image: '/assets/images/games/other.png',
    keywords: ['free slots', 'slots online free', 'free demo casino game', 'play slots free'],
  },
  flappybird: {
    name: 'Flappy Bird',
    title: 'Flappy Bird — Free Online Demo Game',
    description:
      'Play Flappy Bird free online with demo currency. Tap to fly, dodge pipes, and chase multipliers — a free browser demo game.',
    image: '/assets/images/games/flappybird.svg',
    keywords: ['free flappy bird game', 'flappy bird online', 'free browser game', 'play flappy bird free'],
  },
};
