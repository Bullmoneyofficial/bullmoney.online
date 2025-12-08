/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // This wild card allows ALL https domains
      },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // ... rest of your headers config
};

export default nextConfig;