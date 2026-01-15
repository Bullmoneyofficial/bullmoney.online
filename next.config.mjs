/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // Performance optimizations for Vercel
  swcMinify: true,
  compress: true,

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Turbopack configuration (enabled via --turbopack flag)
  turbopack: {
    // Enable persistent caching for faster restarts
    memoryLimit: 4000,
  },

  // Optimize chunking for better caching
  experimental: {
    // Enable Turbopack's persistent disk cache
    turbo: {
      unstable_allowDynamicGlobals: true,
    },
    optimizePackageImports: [
      '@splinetool/react-spline',
      '@splinetool/runtime',
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
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // This wild card allows ALL https domains
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
        source: '/scene:splat*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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

  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    // Skip type checking during dev for faster compilation
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;