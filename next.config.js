/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.aceternity.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      },
      {
        protocol: 'https',
        // This allows any project ID (e.g., "abcdefg.supabase.co")
        hostname: '*.supabase.co',
      },
    ],
  },
  transpilePackages: ['@splinetool/react-spline', '@splinetool/runtime'],
};

module.exports = nextConfig;