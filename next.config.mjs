/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false, // Disable StrictMode in prod - reduces double renders
  compress: true,
  productionBrowserSourceMaps: false,
  
  // Reduce JavaScript bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
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

  // Headers for better caching and mobile optimization
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
        ],
      },
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
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
