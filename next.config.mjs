/** @type {import('next').NextConfig} */

// Auto-generate build timestamp for cache versioning
const BUILD_TIMESTAMP = new Date().toISOString();

const nextConfig = {
  output: 'standalone',
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
      exclude: ['error', 'warn', 'log'], // Keep log for debugging notifications
    } : false,
  },

  // Experimental features for Next.js 16
  experimental: {
    // Improved caching for better performance
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    // Package import optimizations - tree shake these heavy packages
    optimizePackageImports: [
      '@splinetool/react-spline',
      '@splinetool/runtime',
      'lucide-react',
      'react-youtube',
      'framer-motion',
      'motion',
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
    minimumCacheTTL: 60,
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
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Disable aggressive caching - always revalidate
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
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
    ];
  },

  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;
