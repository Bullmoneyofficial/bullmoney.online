/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // Performance optimizations for Vercel
  swcMinify: true,
  compress: true,

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Aggressive code splitting & tree-shaking
  experimental: {
    optimizePackageImports: [
      '@splinetool/react-spline',
      '@splinetool/runtime',
      'lucide-react',
      'react-youtube',
      'framer-motion',
      '@tabler/icons-react',
      'react-icons',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'gsap',
      'cobe',
    ],
    // Optimize CSS loading
    optimizeCss: true,
  },

  // Modular imports for smaller bundles
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
    '@tabler/icons-react': {
      transform: '@tabler/icons-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year cache
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Let Next.js handle chunking for dynamic imports
      // Remove custom spline chunking that conflicts with React.lazy()
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Group other heavy libraries together but don't force spline into a static chunk
            lib: {
              test: /[\\/]node_modules[\\/](?!@splinetool)/,
              name(module) {
                const packageName = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                )?.[1];
                return `npm.${packageName?.replace('@', '')}`;
              },
              priority: 30,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;