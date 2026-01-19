"use client";

import dynamic from 'next/dynamic';

// ✅ LAZY LOAD TELEGRAM FEED - Mobile optimized (Client Component)
const TelegramFeed = dynamic(
  () => import('@/components/TelegramFeed').then((mod) => ({ default: mod.TelegramFeed })),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-white/5 backdrop-blur border border-white/10 rounded-lg p-8 h-96">
        <div className="h-6 w-48 bg-white/10 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded w-full"></div>
          <div className="h-4 bg-white/10 rounded w-5/6"></div>
          <div className="h-4 bg-white/10 rounded w-4/6"></div>
        </div>
      </div>
    )
  }
);

export default function CommunityContent() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 pt-32 pb-20">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            Join Our Community
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Connect with 10,000+ traders, get real-time market updates, and share trading strategies
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-3 gap-4 mb-16">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">10K+</div>
            <div className="text-sm text-gray-400">Active Members</div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-2">24/7</div>
            <div className="text-sm text-gray-400">Live Updates</div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">4+</div>
            <div className="text-sm text-gray-400">Platforms</div>
          </div>
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <a
            href="https://discord.com/invite/9vVB44ZrNA"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg p-6 text-center transition-all hover:scale-105"
          >
            <div className="text-3xl mb-2">💬</div>
            <h3 className="text-white font-bold mb-1">Discord Server</h3>
            <p className="text-blue-200 text-sm mb-4">Join 8K+ traders</p>
            <button className="w-full bg-white/20 hover:bg-white/30 text-white rounded py-2 transition-colors">
              Join Now
            </button>
          </a>

          <a
            href="https://t.me/bullmoneyfx"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg p-6 text-center transition-all hover:scale-105"
          >
            <div className="text-3xl mb-2">✈️</div>
            <h3 className="text-white font-bold mb-1">Telegram Channel</h3>
            <p className="text-blue-200 text-sm mb-4">Real-time alerts</p>
            <button className="w-full bg-white/20 hover:bg-white/30 text-white rounded py-2 transition-colors">
              Join Now
            </button>
          </a>

          <a
            href="https://www.instagram.com/bullmoney.online/"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg p-6 text-center transition-all hover:scale-105"
          >
            <div className="text-3xl mb-2">📸</div>
            <h3 className="text-white font-bold mb-1">Instagram</h3>
            <p className="text-pink-200 text-sm mb-4">Daily content</p>
            <button className="w-full bg-white/20 hover:bg-white/30 text-white rounded py-2 transition-colors">
              Follow
            </button>
          </a>

          <a
            href="https://youtube.com/@bullmoney.online"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-gradient-to-br from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-lg p-6 text-center transition-all hover:scale-105"
          >
            <div className="text-3xl mb-2">🎬</div>
            <h3 className="text-white font-bold mb-1">YouTube Channel</h3>
            <p className="text-orange-200 text-sm mb-4">Tutorials & guides</p>
            <button className="w-full bg-white/20 hover:bg-white/30 text-white rounded py-2 transition-colors">
              Subscribe
            </button>
          </a>
        </div>

        {/* Telegram Feed Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-600/5 to-transparent rounded-2xl blur-3xl -z-10" />
          
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
            <TelegramFeed limit={15} refreshInterval={300000} />
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to join the community?
          </h2>
          <p className="text-gray-400 mb-8">
            Choose your preferred platform and start connecting with traders worldwide
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://discord.com/invite/9vVB44ZrNA"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
            >
              Join Discord
            </a>
            <a
              href="https://t.me/bullmoneyfx"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors"
            >
              Join Telegram
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
