/**
 * PHP Backend API Client
 * Handles all communication between Next.js frontend and PHP Laravel backend
 * Works for localhost, IP addresses, and production
 */

// Get PHP backend URL from environment or fallback to Render production
const getPhpBackendUrl = (): string => {
  // Check for environment variable first
  if (typeof window !== 'undefined') {
    // Client-side: use NEXT_PUBLIC variable
    return process.env.NEXT_PUBLIC_PHP_BACKEND_URL || 'https://bullmoney-casino.onrender.com';
  }
  // Server-side: use CASINO_BACKEND_URL or fallback to Render
  return process.env.CASINO_BACKEND_URL || 'https://bullmoney-casino.onrender.com';
};

export const PHP_BACKEND_URL = getPhpBackendUrl();

/**
 * Makes a request to PHP backend API
 * Automatically handles CSRF tokens and authentication
 */
export async function phpApiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${PHP_BACKEND_URL}${endpoint}`;
  
  // Get CSRF token from meta tag or cookie if available
  const csrfToken = typeof document !== 'undefined' 
    ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  // Add CSRF token if available
  if (csrfToken) {
    headers['X-CSRF-TOKEN'] = csrfToken;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important: send cookies for Laravel session
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * POST to PHP backend API
 */
export async function phpPost<T = any>(endpoint: string, data: any = {}): Promise<T> {
  return phpApiCall<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * GET from PHP backend API
 */
export async function phpGet<T = any>(endpoint: string): Promise<T> {
  return phpApiCall<T>(endpoint, {
    method: 'GET',
  });
}

/**
 * Game-specific API calls
 */
export const phpGameApi = {
  // Dice game
  dice: {
    bet: (bet: number, percent: number, type: 'min' | 'max') =>
      phpPost('/dice/bet', { bet, percent, type }),
  },

  // Mines game
  mines: {
    create: (bomb: number, bet: number) =>
      phpPost('/mines/create', { bomb, bet }),
    open: (open: number) =>
      phpPost('/mines/open', { open }),
    take: () =>
      phpPost('/mines/take'),
    get: () =>
      phpPost('/mines/get'),
  },

  // Plinko game
  plinko: {
    play: (bet: number, lines: number, risk: string) =>
      phpPost('/plinko/play', { bet, lines, risk }),
  },

  // Wheel game
  wheel: {
    status: () =>
      phpPost('/user/wheel/status'),
  },

  // Crash game
  crash: {
    addBet: (bet: number) =>
      phpPost('/crash/addBet', { bet }),
    cashout: () =>
      phpPost('/crash/cashout'),
    get: () =>
      phpPost('/crash/get'),
    last: () =>
      phpPost('/crash/last'),
  },

  // Jackpot game
  jackpot: {
    getStatus: () =>
      phpPost('/api/jackpot/getStatus'),
    getSlider: () =>
      phpPost('/api/jackpot/getSlider'),
  },

  // Slots game
  slots: {
    getGames: () =>
      phpPost('/slots/getGames'),
    getUrl: (name: string, demo: boolean) =>
      phpPost('/slots/getUrl', { name, demo }),
  },

  // Flappy Bird game
  flappybird: {
    start: (bet: number) =>
      phpPost('/flappybird/start', { bet }),
    result: (score: number, gameId: number) =>
      phpPost('/flappybird/result', { score, game_id: gameId }),
    leaderboard: () =>
      phpGet('/flappybird/leaderboard'),
    stats: () =>
      phpGet('/flappybird/stats'),
  },

  // User actions
  user: {
    daily: () => phpPost('/user/daily'),
    promo: (code: string) => phpPost('/user/promo', { code }),
    profile: () => phpGet('/profile'),
  },
};

/**
 * Configure CORS for development
 * Add to PHP Laravel backend: config/cors.php
 */
export const CORS_CONFIG = {
  allowed_origins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.163:3000',
    // Add your production domain here
  ],
  allowed_methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowed_headers: ['Content-Type', 'Accept', 'Authorization', 'X-CSRF-TOKEN'],
  supports_credentials: true,
};

console.log(`🎮 PHP Backend API configured: ${PHP_BACKEND_URL}`);
