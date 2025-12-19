/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // Performance optimizations for Vercel
  swcMinify: true,
  compress: true,

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Optimize chunking for better caching
  experimental: {
    optimizePackageImports: ['@splinetool/react-spline', 'lucide-react', 'react-youtube'],
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

  // Headers for better caching
  async headers() {
    return [
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
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            spline: {
              name: 'spline',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](@splinetool)[\\/]/,
              priority: 40,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
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