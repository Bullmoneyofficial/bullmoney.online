'use client';

import Link from 'next/link';
import { ArrowLeft, Wallet, BookOpen, Network, Hash, Search, CreditCard, AlertTriangle, CheckCircle, Send } from 'lucide-react';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';

// ── Desktop page ──────────────────────────────────────────────────────
export default function CryptoGuideDesktop() {
  const gridItems = [
    {
      title: "🪙 What Is Crypto?",
      description: "Digital money that runs on blockchain technology — no banks needed.",
      content: (
        <div className="space-y-3 text-sm text-white/70">
          <p>Cryptocurrency is <strong className="text-white">digital money</strong> on the internet. Popular coins:</p>
          <div className="flex flex-wrap gap-2">
            {['BTC', 'ETH', 'SOL', 'USDT', 'XRP', 'DOGE'].map(coin => (
              <span key={coin} className="px-2 py-1 bg-white/10 rounded text-xs">{coin}</span>
            ))}
          </div>
        </div>
      ),
      icon: <BookOpen className="h-4 w-4 text-white/50" />,
    },
    {
      title: "📬 Crypto Address",
      description: "Like your email, but for money — a unique string to receive crypto.",
      content: (
        <div className="space-y-2 text-xs text-white/60">
          <p className="text-white/70">Always <strong className="text-white">copy & paste</strong> addresses:</p>
          <code className="block p-2 bg-white/5 rounded text-[10px] break-all">0xfC851C016d1f4D...</code>
          <p className="text-yellow-400">⚠️ Wrong address = lost funds forever</p>
        </div>
      ),
      icon: <Wallet className="h-4 w-4 text-white/50" />,
    },
    {
      title: "🌐 Networks Matter!",
      description: "The #1 mistake — must match EXACTLY: coin + network.",
      content: (
        <div className="space-y-2 text-xs text-white/70">
          <p><strong className="text-white">ETH:</strong> Ethereum, Base</p>
          <p><strong className="text-white">BTC:</strong> Bitcoin (Taproot)</p>
          <p><strong className="text-white">SOL:</strong> Solana</p>
          <p className="text-red-400 mt-2">❌ Wrong network = Lost crypto</p>
        </div>
      ),
      icon: <Network className="h-4 w-4 text-white/50" />,
      className: "md:col-span-2",
    },
    {
      title: "📤 How to Send",
      description: "6 simple steps to complete your payment.",
      content: (
        <div className="space-y-1.5 text-xs text-white/70">
          <p>1. Pick coin in checkout</p>
          <p>2. Copy our address</p>
          <p>3. Open your wallet</p>
          <p>4. Select correct network</p>
          <p>5. Enter amount & send</p>
          <p>6. Wait for confirmation</p>
        </div>
      ),
      icon: <Send className="h-4 w-4 text-white/50" />,
    },
    {
      title: "🧾 Transaction Hash",
      description: "Your receipt proof — we need this to verify payment.",
      content: (
        <div className="space-y-2 text-xs text-white/70">
          <p>A long string like:</p>
          <code className="block p-2 bg-white/5 rounded text-[10px] break-all">0x5c504ed432...</code>
          <p className="text-white/80">Paste in checkout after sending</p>
        </div>
      ),
      icon: <Hash className="h-4 w-4 text-white/50" />,
    },
    {
      title: "🔍 Find Your Hash",
      description: "Where to locate TX hash in popular wallets.",
      content: (
        <div className="space-y-1.5 text-xs text-white/70">
          <p><strong>Coinbase:</strong> Activity → TX Hash</p>
          <p><strong>Binance:</strong> Wallet → History → TXID</p>
          <p><strong>MetaMask:</strong> Activity → View Explorer</p>
          <p><strong>Trust:</strong> History → Copy Hash</p>
        </div>
      ),
      icon: <Search className="h-4 w-4 text-white/50" />,
    },
    {
      title: "💳 Buy Crypto",
      description: "Don't have crypto? Use MoonPay or Paybis with your card.",
      content: (
        <div className="text-xs text-white/70">
          <p>Built into checkout — buy with card/bank, then send to our address.</p>
        </div>
      ),
      icon: <CreditCard className="h-4 w-4 text-white/50" />,
    },
    {
      title: "⚠️ Common Mistakes",
      description: "Avoid these errors that cause lost funds.",
      content: (
        <div className="space-y-1 text-xs text-white/70">
          <p>❌ Wrong network</p>
          <p>❌ Typing address manually</p>
          <p>❌ Wrong coin to address</p>
          <p>❌ Forgetting TX hash</p>
          <p>❌ Insufficient fees</p>
        </div>
      ),
      icon: <AlertTriangle className="h-4 w-4 text-white/50" />,
      className: "md:col-span-2",
    },
    {
      title: "✅ Quick Checklist",
      description: "Double-check these before sending.",
      content: (
        <div className="space-y-1.5 text-xs text-white/70">
          <p>✓ Correct coin selected</p>
          <p>✓ Address copied (not typed)</p>
          <p>✓ Network matches exactly</p>
          <p>✓ Amount is correct</p>
          <p>✓ Paste TX hash in checkout</p>
        </div>
      ),
      icon: <CheckCircle className="h-4 w-4 text-white/50" />,
    },
  ];

  return (
    <div className="min-h-screen bg-black w-full overflow-x-hidden">
      {/* Compact Hero */}
      <div className="relative border-b border-white/10 w-full">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-8 pb-6 relative w-full">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white">Crypto Payment Guide</h1>
              <p className="text-white/50 text-sm">Everything you need to know in one page</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="w-full max-w-6xl mx-auto px-4 lg:px-8 py-8">
        <BentoGrid className="max-w-6xl mx-auto">
          {gridItems.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.content}
              icon={item.icon}
              className={item.className}
            />
          ))}
        </BentoGrid>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 text-black"
            style={{
              background: 'linear-gradient(90deg, #ff0080, #7928ca, #0070f3, #00c6ff)',
              backgroundSize: '300% 100%',
              animation: 'rgbShift 4s ease infinite',
            }}
          >
            <Wallet className="w-5 h-5" />
            Go to Store & Pay with Crypto
          </Link>
          <p className="text-white/30 text-xs mt-3">
            Questions? Contact us and we&apos;ll help you out.
          </p>
        </div>
      </div>

      {/* RGB animation keyframes */}
      <style jsx global>{`
        @keyframes rgbShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
