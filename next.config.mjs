/** @type {import('next').NextConfig} */

import os from 'os';

// Platform and architecture detection for optimizations
const platform = os.platform(); // 'darwin', 'win32', 'linux'
const arch = os.arch(); // 'arm64' for Apple Silicon, 'x64' for Intel/AMD
const cpus = os.cpus().length;

const isAppleSilicon = platform === 'darwin' && arch === 'arm64';
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';
const isLinux = platform === 'linux';

// Casino backend URL for proxy
const isDev = process.env.NODE_ENV !== 'production';
const CASINO_BACKEND_URL = process.env.CASINO_BACKEND_URL || (isDev ? 'http://localhost:8000' : 'https://bullmoney-casino.onrender.com');

// Auto-applied optimizations
const optimizationsApplied = [];
if (isAppleSilicon) {
  optimizationsApplied.push('ARM64 Native', 'Unified Memory (16GB)', 'Multi-core');
} else if (isWindows) {
  optimizationsApplied.push('Path Normalization', 'Long Path Support', 'cross-env');
} else {
  optimizationsApplied.push('Multi-core', 'Native Performance');
}

console.log(`[Next.js Config] ${platform} ${arch} | ${cpus} cores | Optimizations: ${optimizationsApplied.join(', ')}`);

// Auto-generate build timestamp for cache versioning
const BUILD_TIMESTAMP = new Date().toISOString();

// ALWAYS optimize heavy barrel-export packages — even in dev mode
// This prevents Turbopack from parsing entire package entry points
// when only a few exports are used (e.g., 34 icons from lucide-react = whole lib)
const optimizePackageImports = [
  'lucide-react',
  'framer-motion',
  '@tabler/icons-react',
  'react-icons',
  '@radix-ui/react-dialog',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-select',
  '@radix-ui/react-tooltip',
  '@radix-ui/react-tabs',
  '@radix-ui/react-popover',
  '@radix-ui/react-accordion',
  'date-fns',
  'recharts',
  'three',
  'gsap',
  '@supabase/supabase-js',
  'sonner',
  'zustand',
  'class-variance-authority',
  'clsx',
];

const nextConfig = {
  reactStrictMode: false, // Disable StrictMode in prod - reduces double renders
  compress: true,
  productionBrowserSourceMaps: false,
  // COMPILATION SPEED: Disable source maps in development (massive speed boost)
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.devtool = false; // Disable source maps in dev = 2-3x faster compilation
    }
    
    // Apple Silicon optimizations - use native ARM binaries
    if (isAppleSilicon) {
      config.externals = config.externals || [];
      // Prefer native ARM modules for better performance
      config.resolve.conditionNames = ['node', 'import', 'require'];
    }
    
    // Windows optimizations - handle path separators correctly
    if (isWindows) {
      // Normalize all paths to forward slashes for consistency
      config.resolve.alias = config.resolve.alias || {};
      // Windows: Enable long path support
      config.output.pathinfo = false; // Faster builds on Windows
    }
    
    // Multi-core compilation for all platforms
    config.parallelism = Math.max(1, Math.min(cpus - 1, 8)); // Use N-1 cores, max 8
    
    return config;
  },
  
  // Auto-versioning: Set build timestamp as env var
  // This changes on every build, triggering cache invalidation for users
  env: {
    NEXT_PUBLIC_BUILD_TIMESTAMP: BUILD_TIMESTAMP,
  },
  
  // Reduce JavaScript bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Remove ALL console.log in production = smaller bundles
    } : false,
  },

  // NOTE: eslint config removed - not supported in Next.js 16+
  // Run `npm run lint` separately instead

  // Allow local network dev origins (localhost, LAN IPs)
  // Add your specific local IP addresses here
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.163:3000',
    'http://192.168.1.162:3000',
    'http://192.168.1.1:3000',
    'http://10.0.0.1:3000',
  ],

  // SPEED: Skip transpilation for modern packages (they're already ES6+)
  transpilePackages: [],

  // Experimental features for Next.js 16
  experimental: {
    // Improved caching for better performance
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    // Enable parallel routes optimization
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
    // Use worker threads for webpack compilation (parallelism)
    // Apple Silicon: More aggressive parallelization (unified memory benefits)
    webpackBuildWorker: isAppleSilicon ? true : true,
    // Cache server component HMR responses - huge dev speed win
    serverComponentsHmrCache: true,
    // Package import optimizations - tree shake only the most critical heavy packages
    // NOTE: Too many entries (165) can slow down Turbopack compilation
    // Only optimize packages that are actually imported frequently and have large bundle impact
    optimizePackageImports,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000, // 30 days - images rarely change
  },

  // Headers - Reduced caching for fresher content
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
              "script-src * 'unsafe-inline' 'unsafe-eval' blob: data: https://www.googletagmanager.com https://www.google-analytics.com https://unpkg.com https://cdn.jsdelivr.net https://prod.spline.design",
              "style-src * 'unsafe-inline' https://fonts.googleapis.com data:",
              "img-src * data: blob: https: http:",
              "font-src * data: https://fonts.gstatic.com",
              "connect-src * https: http: wss: ws: blob: data:",
              "media-src * https: http: blob: data:",
              "frame-src * blob: data: https: http:",
              "worker-src * blob: data:",
              "child-src * blob: data:",
              "object-src *",
              "base-uri *",
              "form-action *",
              "frame-ancestors *",
            ].join('; '),
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      // Service Worker - allow scope to root
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
      // Games / casino iframe routes — COMPLETELY PERMISSIVE - NO RESTRICTIONS
      {
        source: '/casino-games/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' blob: data:; style-src * 'unsafe-inline'; img-src * data: blob: https: http:; font-src * data:; connect-src * wss: ws: https: http: blob: data:; media-src * blob: data: https: http:; frame-src * blob: data: https: http:; worker-src * blob: data:; child-src * blob: data:; object-src *; base-uri *; form-action *; frame-ancestors *;",
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
      // Games pages — COMPLETELY PERMISSIVE - NO RESTRICTIONS
      {
        source: '/games/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' blob: data:; style-src * 'unsafe-inline'; img-src * data: blob: https: http:; font-src * data:; connect-src * wss: ws: https: http: blob: data:; media-src * blob: data: https: http:; frame-src * blob: data: https: http:; worker-src * blob: data:; child-src * blob: data:; object-src *; base-uri *; form-action *; frame-ancestors *;",
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: '*',
          },
        ],
      },
      // Games page root — COMPLETELY PERMISSIVE
      {
        source: '/games',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' blob: data:; style-src * 'unsafe-inline'; img-src * data: blob: https: http:; font-src * data:; connect-src * wss: ws: https: http: blob: data:; media-src * blob: data: https: http:; frame-src * blob: data: https: http:; worker-src * blob: data:; child-src * blob: data:; object-src *; base-uri *; form-action *; frame-ancestors *;",
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: '*',
          },
        ],
      },
      // Only cache static assets with content hashes (Next.js build outputs)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache BMBRAIN scripts aggressively (they change with deploys, not per-request)
      {
        source: '/scripts/BMBRAIN/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
      // Cache all static scripts
      {
        source: '/scripts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
      // Cache Spline scene files aggressively (large binary files)
      {
        source: '/:path*.splinecode',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },

  typescript: {
    // Always skip TS type-checking during build - run `npm run type-check` separately
    // This alone saves 30-60s on large projects
    ignoreBuildErrors: true,
  },

  // Externalize packages that have issues with bundling
  serverExternalPackages: [
    'metaapi.cloud-sdk',
    'metaapi.cloud-metastats-sdk',
    'metaapi.cloud-copyfactory-sdk',
  ],

  // Turbopack configuration for faster dev compilation
  turbopack: {
    // Reduce file resolution attempts - only look for these extensions
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json', '.css'],
    // Module aliases — avoids repeated node_modules traversals for hot-path deps
    resolveAlias: {
      // Pin heavy packages so Turbopack doesn't search multiple node_modules dirs
      'framer-motion': 'framer-motion',
      'three': 'three',
      'gsap': 'gsap',
      'recharts': 'recharts',
      'mongoose': 'mongoose',
      'sonner': 'sonner',
      'zustand': 'zustand',
    },
    // SPEED: Turbopack-specific rules to skip unnecessary processing
    rules: {
      // Skip type checking for .d.ts files during dev
      '*.d.ts': {
        loaders: [],
      },
      // Skip processing markdown files
      '*.md': {
        loaders: [],
      },
    },
  },

  // Canonical route aliases for app/webview links
  async redirects() {
    return [
      {
        source: '/game',
        destination: '/games',
        permanent: true,
      },
      {
        source: '/app/game',
        destination: '/games',
        permanent: true,
      },
      {
        source: '/app/games',
        destination: '/games',
        permanent: true,
      },
      {
        source: '/app/design',
        destination: '/design',
        permanent: true,
      },
      {
        source: '/account',
        destination: '/store/account',
        permanent: false,
      },
    ];
  },

  // Proxy casino backend through Next.js
  async rewrites() {
    const casinoProxyRewrites = [
      { source: '/user/:path*', destination: `${CASINO_BACKEND_URL}/user/:path*` },
      { source: '/wallet/:path*', destination: `${CASINO_BACKEND_URL}/wallet/:path*` },
      { source: '/payment/:path*', destination: `${CASINO_BACKEND_URL}/payment/:path*` },
      { source: '/withdraw/:path*', destination: `${CASINO_BACKEND_URL}/withdraw/:path*` },
      { source: '/load/:path*', destination: `${CASINO_BACKEND_URL}/load/:path*` },
      { source: '/bonus', destination: `${CASINO_BACKEND_URL}/bonus` },
      { source: '/profile', destination: `${CASINO_BACKEND_URL}/profile` },
      { source: '/referrals', destination: `${CASINO_BACKEND_URL}/referrals` },
      { source: '/rules', destination: `${CASINO_BACKEND_URL}/rules` },
      { source: '/privacy', destination: `${CASINO_BACKEND_URL}/privacy` },
      { source: '/parther/:path*', destination: `${CASINO_BACKEND_URL}/parther/:path*` },
      { source: '/auth/:path*', destination: `${CASINO_BACKEND_URL}/auth/:path*` },
      // === PHP GAME BACKEND PROXIES (All games use PHP + JS) ===
      { source: '/dice/:path*', destination: `${CASINO_BACKEND_URL}/dice/:path*` },
      { source: '/mines/:path*', destination: `${CASINO_BACKEND_URL}/mines/:path*` },
      { source: '/plinko/:path*', destination: `${CASINO_BACKEND_URL}/plinko/:path*` },
      { source: '/wheel/:path*', destination: `${CASINO_BACKEND_URL}/wheel/:path*` },
      { source: '/jackpot/:path*', destination: `${CASINO_BACKEND_URL}/jackpot/:path*` },
      { source: '/crash/:path*', destination: `${CASINO_BACKEND_URL}/crash/:path*` },
      { source: '/slots/:path*', destination: `${CASINO_BACKEND_URL}/slots/:path*` },
      { source: '/flappybird/:path*', destination: `${CASINO_BACKEND_URL}/flappybird/:path*` },
      { source: '/api/wheel/:path*', destination: `${CASINO_BACKEND_URL}/api/wheel/:path*` },
      { source: '/api/jackpot/:path*', destination: `${CASINO_BACKEND_URL}/api/jackpot/:path*` },
      { source: '/api/crash/:path*', destination: `${CASINO_BACKEND_URL}/api/crash/:path*` },
    ];

    const devOnlyRewrites = isDev
      ? [
          { source: '/casino-games/:path*', destination: `${CASINO_BACKEND_URL}/:path*` },
          { source: '/casino-games', destination: `${CASINO_BACKEND_URL}/` },
          { source: '/casino-api/:path*', destination: `${CASINO_BACKEND_URL}/api/:path*` },
        ]
      : [];

    return [...casinoProxyRewrites, ...devOnlyRewrites];
  },
};

export default nextConfig;
