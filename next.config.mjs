/** @type {import('next').NextConfig} */
const nextConfig = {
  // Smaller self-contained server build, easier to deploy on Hostinger
  output: 'standalone',

  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.aceternity.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Add ftmo.com here
      { protocol: "https", hostname: "ftmo.com" },
            { protocol: "https", hostname: "pexels.com" },
    ],
  },

  // Prevent build failing on ESLint warnings in production
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Add useful security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
