/**
 * Game Configuration - Next.js Frontend + PHP Backend API
 * All games use Next.js for UI rendering and PHP Laravel for game logic/API
 */

export interface GameConfig {
  name: string;
  slug: string;
  backend: 'php'; // Always PHP for game logic
  phpApiRoute: string; // PHP API endpoint for game actions
  description: string;
  enabled: boolean;
}

// PHP Laravel backend URL (configure based on environment)
// Works for localhost, IP addresses, and production
export const PHP_BACKEND_URL = process.env.NEXT_PUBLIC_PHP_BACKEND_URL || 
                               process.env.CASINO_BACKEND_URL || 
                               'http://localhost:8000';

/**
 * All games configuration - Next.js Frontend + PHP Backend API
 */
export const GAMES_CONFIG: Record<string, GameConfig> = {
  dice: {
    name: 'Dice',
    slug: 'dice',
    backend: 'php',
    phpApiRoute: '/dice/bet',
    description: 'Roll the dice and win',
    enabled: true,
  },
  mines: {
    name: 'Mines',
    slug: 'mines',
    backend: 'php',
    phpApiRoute: '/mines/create',
    description: 'Avoid the mines and cash out',
    enabled: true,
  },
  plinko: {
    name: 'Plinko',
    slug: 'plinko',
    backend: 'php',
    phpApiRoute: '/plinko/play',
    description: 'Drop the ball and win',
    enabled: true,
  },
  wheel: {
    name: 'Wheel',
    slug: 'wheel',
    backend: 'php',
    phpApiRoute: '/user/wheel/status',
    description: 'Spin the wheel of fortune',
    enabled: true,
  },
  jackpot: {
    name: 'Jackpot',
    slug: 'jackpot',
    backend: 'php',
    phpApiRoute: '/api/jackpot/getStatus',
    description: 'Join the jackpot and win big',
    enabled: true,
  },
  crash: {
    name: 'Crash',
    slug: 'crash',
    backend: 'php',
    phpApiRoute: '/crash/addBet',
    description: 'Cash out before the crash',
    enabled: true,
  },
  slots: {
    name: 'Slots',
    slug: 'slots',
    backend: 'php',
    phpApiRoute: '/slots/getGames',
    description: 'Spin the slots and win',
    enabled: true,
  },
  flappybird: {
    name: 'Flappy Bird',
    slug: 'flappybird',
    backend: 'php',
    phpApiRoute: '/flappybird/start',
    description: 'Play flappy bird and win',
    enabled: true,
  },
};

/**
 * Get all enabled games
 */
export function getEnabledGames(): GameConfig[] {
  return Object.values(GAMES_CONFIG).filter(game => game.enabled);
}

/**
 * Get PHP API endpoint URL for a game action
 */
export function getPhpApiUrl(endpoint: string): string {
  return `${PHP_BACKEND_URL}${endpoint}`;
}

/**
 * Validate that all games use PHP backend
 */
export function validateGamesUsePHP(): boolean {
  const allGames = Object.values(GAMES_CONFIG);
  const allUsePhp = allGames.every(game => game.backend === 'php');
  
  if (!allUsePhp) {
    console.error('ERROR: Not all games are configured to use PHP backend!');
    const nonPhpGames = allGames.filter(g => g.backend !== 'php');
    console.error('Games not using PHP:', nonPhpGames.map(g => g.slug));
  }
  
  return allUsePhp;
}

console.log(`🎮 Games configured: ${Object.keys(GAMES_CONFIG).length} games using PHP backend at ${PHP_BACKEND_URL}`);
