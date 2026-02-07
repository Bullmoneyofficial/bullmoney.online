'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp, Wallet, BookOpen } from 'lucide-react';

// ── Accordion component ───────────────────────────────────────────────
function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.03] backdrop-blur-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-lg font-semibold text-white">{title}</span>
        {open ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
      </button>
      {open && <div className="px-5 pb-5 pt-0">{children}</div>}
    </div>
  );
}

// ── Step component ────────────────────────────────────────────────────
function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-sm">
        {number}
      </div>
      <div className="flex-1 space-y-3">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <div className="text-white/70 text-[15px] leading-relaxed space-y-3">{children}</div>
      </div>
    </div>
  );
}

// ── Visual analogy card ───────────────────────────────────────────────
function AnalogyCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="text-3xl mb-2">{emoji}</div>
      <h4 className="text-white font-semibold text-sm mb-1">{title}</h4>
      <p className="text-white/60 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// ── Network badge ─────────────────────────────────────────────────────
function NetworkBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-white/20 bg-white/5 text-white">
      <span className="w-2 h-2 rounded-full bg-white" />
      {name}
    </span>
  );
}

// ── Mobile page ───────────────────────────────────────────────────────
export default function CryptoGuideMobile() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 pt-12 pb-8 relative">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">How to Pay with Crypto</h1>
                <p className="text-white/50 text-sm">A complete beginner&apos;s guide</p>
              </div>
            </div>

            <p className="text-white/70 text-lg leading-relaxed mt-6">
              Never used crypto before? No worries. This guide explains <strong className="text-white">everything</strong> you
              need to know to make a payment — in plain English.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pb-20 space-y-6">
        {/* SECTION 1: What is Crypto? */}
        <Accordion title="🪙 What Is Cryptocurrency?" defaultOpen={true}>
          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              Cryptocurrency is <strong className="text-white">digital money</strong> that lives on the internet. Unlike
              regular money (dollars, euros, pounds), no bank controls it. Instead, it runs on technology called
              a <strong className="text-white">blockchain</strong> — think of it like a giant public notebook that
              records every transaction ever made, and nobody can erase or change it.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <AnalogyCard
                emoji="🏦"
                title="Regular Money"
                description="You send money from your bank to another bank. The bank checks it, approves it, and moves it."
              />
              <AnalogyCard
                emoji="⚡"
                title="Crypto"
                description="You send money directly to someone, person-to-person. The blockchain checks it and confirms it."
              />
              <AnalogyCard
                emoji="📒"
                title="Blockchain"
                description="A public record that everyone can see. Once something is written, it never changes."
              />
            </div>

            <p className="text-white/70 leading-relaxed">
              There are thousands of different cryptocurrencies. The most popular ones are:
            </p>

            <div className="flex flex-wrap gap-2">
              <NetworkBadge name="Bitcoin (BTC)" />
              <NetworkBadge name="Ethereum (ETH)" />
              <NetworkBadge name="Solana (SOL)" />
              <NetworkBadge name="USDT (Tether)" />
              <NetworkBadge name="XRP" />
              <NetworkBadge name="Dogecoin (DOGE)" />
              <NetworkBadge name="BNB" />
            </div>
          </div>
        </Accordion>

        {/* SECTION 2: Crypto Addresses */}
        <Accordion title="📬 What Is a Crypto Address?">
          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              A crypto address is like your <strong className="text-white">email address</strong>, but for money.
              When someone wants to send you crypto, they send it to your address.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnalogyCard
                emoji="📧"
                title="Email Analogy"
                description="Your email = your-name@gmail.com. Your crypto address = a long string of random letters and numbers."
              />
              <AnalogyCard
                emoji="🏡"
                title="Home Address Analogy"
                description="Just like a home address tells the mailman where to deliver, a crypto address tells the blockchain where to send coins."
              />
            </div>

            <p className="text-white/70 leading-relaxed">Here&apos;s what real crypto addresses look like:</p>

            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-white/40 mb-1">Ethereum (ETH) Address</p>
                <code className="text-xs text-white font-mono break-all">0xfC851C016d1f4D4031f7d20320252cb283169DF3</code>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-white/40 mb-1">Bitcoin (BTC) Address</p>
                <code className="text-xs text-white font-mono break-all">bc1purm66ng2asctqsl87jrjp6sk0sml6q8fpeymsl90pxdgsa70hm2qtramdl</code>
              </div>
            </div>

            <div className="flex gap-3 p-4 rounded-xl bg-white/10 border border-white/20 text-white">
              <div className="text-sm leading-relaxed">
                <strong>Always double-check the address!</strong> If you send crypto to the wrong address, there is no way to
                get it back. Copy and paste the address, never type it manually.
              </div>
            </div>
          </div>
        </Accordion>

        {/* SECTION 3: Networks */}
        <Accordion title="🌐 Networks — Important to Understand">
          <div className="space-y-5">
            <p className="text-white/70 leading-relaxed">
              This is the <strong className="text-white">#1 thing beginners get wrong</strong>, so read this carefully.
            </p>

            <p className="text-white/70 leading-relaxed">
              Think of crypto networks like <strong className="text-white">different train systems in different countries</strong>.
              A train ticket for the London Underground won&apos;t work on the New York Subway.
            </p>

            <h4 className="text-white font-semibold mt-4">Here are the networks we accept:</h4>

            <div className="space-y-2">
              {[
                { coin: 'ETH', networks: ['Ethereum (ERC-20)', 'Base (L2)'] },
                { coin: 'BTC', networks: ['Bitcoin (Taproot)'] },
                { coin: 'SOL', networks: ['Solana'] },
                { coin: 'USDT', networks: ['Ethereum (ERC-20)', 'Tron (TRC-20)'] },
                { coin: 'XRP', networks: ['XRP Ledger'] },
                { coin: 'DOGE', networks: ['Dogecoin'] },
                { coin: 'BNB', networks: ['BNB Smart Chain (BEP-20)'] },
              ].map((c) => (
                <div key={c.coin} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="font-bold text-sm w-12 text-white">{c.coin}</span>
                  <div className="flex flex-wrap gap-2">
                    {c.networks.map((n) => (
                      <NetworkBadge key={n} name={n} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 p-4 rounded-xl bg-white/10 border border-white/20 text-white">
              <div className="text-sm leading-relaxed">
                <strong>Golden Rule:</strong> The coin AND the network must match what we show. The checkout will show you exactly which network to use — always follow that.
              </div>
            </div>
          </div>
        </Accordion>

        {/* SECTION 4: How to Send Crypto */}
        <Accordion title="📤 How to Send Crypto (Step-by-Step)">
          <div className="space-y-6">
            <p className="text-white/70 leading-relaxed">
              Once you have crypto in your wallet or exchange, here&apos;s how to send it to us:
            </p>

            <Step number={1} title="Pick the coin you want to pay with">
              <p>In our checkout, choose a coin like ETH, BTC, SOL, etc.</p>
            </Step>

            <Step number={2} title="Copy our wallet address">
              <p><strong className="text-white">Never type an address manually</strong> — always copy & paste!</p>
            </Step>

            <Step number={3} title="Open your wallet or exchange app">
              <p>Go to whichever app or website you keep your crypto on.</p>
            </Step>

            <Step number={4} title="Select the correct network">
              <p>Choose the <strong className="text-white">EXACT same network</strong> shown in our checkout.</p>
            </Step>

            <Step number={5} title="Enter the amount and send">
              <p>Type in the amount shown in our checkout. Double-check and hit send.</p>
            </Step>

            <Step number={6} title="Wait for confirmation">
              <p>Different blockchains have different confirmation times. Your order will be completed once confirmed.</p>
            </Step>
          </div>
        </Accordion>

        {/* SECTION 5: Transaction Hash */}
        <Accordion title="🧾 What Is a Transaction Hash">
          <div className="space-y-5">
            <p className="text-white/70 leading-relaxed">
              A <strong className="text-white">transaction hash</strong> (TX hash or TXID)
              is like a <strong className="text-white">receipt number</strong> for your crypto payment.
            </p>

            <AnalogyCard
              emoji="🧾"
              title="Receipt Analogy"
              description="When you buy something at a store, you get a receipt with a transaction number. A TX hash is the same thing."
            />

            <h4 className="text-white font-semibold">Why do we need it?</h4>
            <div className="space-y-2 text-white/70 text-sm">
              <div className="flex items-start gap-2">
                <span>• <strong className="text-white">To verify your payment</strong> — We use the hash to confirm the money arrived.</span>
              </div>
              <div className="flex items-start gap-2">
                <span>• <strong className="text-white">To speed things up</strong> — The hash lets us instantly find your payment.</span>
              </div>
              <div className="flex items-start gap-2">
                <span>• <strong className="text-white">To protect you</strong> — The hash proves you paid.</span>
              </div>
            </div>
          </div>
        </Accordion>

        {/* SECTION 6: Where to Find TX Hash */}
        <Accordion title="🔍 Where to Find Your Transaction Hash">
          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              After you send crypto, every wallet gives you a transaction hash. Look for:
            </p>

            <div className="space-y-3">
              {[
                { name: 'Coinbase', icon: '🟦', hint: 'Activity → Transaction → Transaction Hash' },
                { name: 'Binance', icon: '🟨', hint: 'Wallet → Transaction History → TXID' },
                { name: 'MetaMask', icon: '🦊', hint: 'Activity → View on block explorer' },
                { name: 'Trust Wallet', icon: '🛡️', hint: 'Transaction History → Transaction Hash' },
                { name: 'Phantom', icon: '👻', hint: 'History → View on Explorer → Signature' },
              ].map((platform) => (
                <div key={platform.name} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{platform.icon}</span>
                    <h4 className="text-white font-semibold">{platform.name}</h4>
                  </div>
                  <p className="text-white/60 text-sm">{platform.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </Accordion>

        {/* SECTION 7: Paste Hash */}
        <Accordion title="📋 Pasting Your TX Hash">
          <div className="space-y-5">
            <Step number={1} title="Copy your transaction hash">
              <p>Go back to your wallet/exchange and copy the TX hash.</p>
            </Step>

            <Step number={2} title="Paste it in the Transaction Hash field">
              <p>Click inside the field in our checkout and paste it.</p>
            </Step>

            <Step number={3} title="Click 'Submit Payment'">
              <p>Hit the button. We&apos;ll verify your transaction and process your order!</p>
            </Step>
          </div>
        </Accordion>

        {/* SECTION 8: Don't Have Crypto? */}
        <Accordion title="💳 Don't Have Crypto Yet?">
          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              No problem! You can buy crypto with a debit card or bank transfer using:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/10 border border-white/20">
                <h4 className="text-white font-semibold mb-2">MoonPay</h4>
                <p className="text-white/60 text-sm">Buy directly with card or bank. Quick and easy.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 border border-white/20">
                <h4 className="text-white font-semibold mb-2">Paybis</h4>
                <p className="text-white/60 text-sm">Buy crypto with low fees. Simple process.</p>
              </div>
            </div>
          </div>
        </Accordion>

        {/* SECTION 9: Common Mistakes */}
        <Accordion title="⚠️ Common Mistakes to Avoid">
          <div className="space-y-3">
            {[
              {
                mistake: 'Sending the wrong coin to an address',
                fix: 'Always check that the coin matches the address.',
              },
              {
                mistake: 'Using the wrong network',
                fix: 'Make sure the network matches EXACTLY what our checkout says.',
              },
              {
                mistake: 'Typing the address instead of copying it',
                fix: 'Always use copy & paste. One wrong character = lost money.',
              },
              {
                mistake: 'Forgetting to paste the transaction hash',
                fix: 'We need the TX hash to verify your payment quickly.',
              },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-start gap-2">
                  <div>
                    <p className="text-white font-medium text-sm">{item.mistake}</p>
                    <p className="text-white/70 text-xs mt-1">✅ {item.fix}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Accordion>

        {/* SECTION 10: Quick Summary */}
        <Accordion title="✅ Quick Summary">
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-white/10 border border-white/20">
              <ol className="space-y-3 text-white/80 text-sm list-decimal list-inside">
                <li><strong className="text-white">Pick a coin</strong> from our checkout</li>
                <li><strong className="text-white">Copy our wallet address</strong> — never type it manually</li>
                <li><strong className="text-white">Match the network</strong> exactly</li>
                <li><strong className="text-white">Send the crypto</strong> from your wallet</li>
                <li><strong className="text-white">Find your transaction hash</strong></li>
                <li><strong className="text-white">Paste the TX hash</strong> in checkout</li>
                <li><strong className="text-white">Wait</strong> for confirmations</li>
                <li><strong className="text-white">Done!</strong> Your order is processed</li>
              </ol>
            </div>
          </div>
        </Accordion>

        {/* Bottom CTA */}
        <div className="pt-6 text-center">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-white/90 text-black font-semibold transition-colors"
          >
            <Wallet className="w-5 h-5" />
            Go to Store & Pay with Crypto
          </Link>
          <p className="text-white/30 text-xs mt-3">
            Questions? Contact us and we&apos;ll help you out.
          </p>
        </div>
      </div>
    </div>
  );
}
