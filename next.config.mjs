/** @type {import('next').NextConfig} */

// Auto-generate build timestamp for cache versioning
const BUILD_TIMESTAMP = new Date().toISOString();

const nextConfig = {
  reactStrictMode: false, // Disable StrictMode in prod - reduces double renders
  compress: true,
  productionBrowserSourceMaps: false,
  
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

  // Allow local network dev origins (suppress warning)
  allowedDevOrigins: ['192.168.1.162'],

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
    webpackBuildWorker: true,
    // Cache server component HMR responses - huge dev speed win
    serverComponentsHmrCache: true,
    // Package import optimizations - tree shake these heavy packages
    optimizePackageImports: [
      // NOTE: @splinetool packages removed — they use dynamic WASM/worker
      // loading internally that breaks with tree-shaking optimization
      'lucide-react',
      'react-youtube',
      'framer-motion',
      '@tabler/icons-react',
      'react-icons',
      '@react-three/drei',
      '@react-three/fiber',
      'three',
      'gsap',
      'cobe',
      '@supabase/supabase-js',
      '@tsparticles/react',
      '@tsparticles/slim',
      'zod',
      'zustand',
      'swr',
      'date-fns',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@tiptap/react',
      '@tiptap/starter-kit',
      'react-icons',
      'react-hook-form',
      '@hookform/resolvers',
      'mongoose',
      'i18next',
      'react-i18next',
      'dayjs',
      'sonner',
      'class-variance-authority',
      'tailwind-merge',
      'clsx',
      'postprocessing',
      // Additional optimizations for faster page loads
      '@radix-ui/react-accordion',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-switch',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      'react-resizable-panels',
      'embla-carousel-react',
      'input-otp',
      'cmdk',
      'vaul',
    ],
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
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://www.google-analytics.com https://unpkg.com https://cdn.jsdelivr.net https://prod.spline.design",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https: wss: https://www.bullmoney.shop https://www.bullmoney.online",
              "media-src 'self' https: blob:",
              "frame-src 'self' blob: https: http:",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self' https: http:",
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
          // PERFORMANCE: stale-while-revalidate serves cached version instantly
          // while revalidating in background. Much better UX than no-cache.
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
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
      // Games / casino iframe routes — maximally permissive for embedding
      {
        source: '/demogames/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *",
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
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      // Games pages — same permissive policy
      {
        source: '/games/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *",
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
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
    },
  },
};

export default nextConfig;
