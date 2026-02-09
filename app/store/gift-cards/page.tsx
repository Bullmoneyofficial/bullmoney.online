'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Send from 'lucide-react/dist/esm/icons/send';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Check from 'lucide-react/dist/esm/icons/check';
import Copy from 'lucide-react/dist/esm/icons/copy';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

// ============================================================================
// GIFT CARDS PAGE
// Purchase digital gift cards for Bullmoney Store
// ============================================================================

const GIFT_CARD_AMOUNTS = [25, 50, 75, 100, 150, 200, 250, 500];

export default function GiftCardsPage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');

  const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
  const { formatPrice } = useCurrencyLocaleStore();

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !amount || amount < 10) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/store/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          recipientEmail,
          recipientName,
          senderName,
          message,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseComplete(true);
        setGiftCardCode(data.code || 'BULL-XXXX-XXXX');
        toast.success('Gift card purchased!');
      } else {
        toast.error('Failed to purchase gift card');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (purchaseComplete) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-light">Gift Card Sent!</h1>
          <p className="text-white/50 text-sm">
            A {formatPrice(amount)} gift card has been sent to {recipientEmail}
          </p>
          
          {/* Gift Card Code */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Gift Card Code</p>
            <div className="flex items-center justify-center gap-3">
              <code className="text-2xl font-mono tracking-wider">{giftCardCode}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(giftCardCode); toast.success('Code copied!'); }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4 text-white/40" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              href="/store/gift-cards"
              onClick={() => { setPurchaseComplete(false); setRecipientEmail(''); setMessage(''); }}
              className="px-6 py-3 bg-white/10 border border-white/10 rounded-xl text-sm hover:bg-white/20 transition-all"
            >
              Send Another
            </Link>
            <Link
              href="/store"
              className="px-6 py-3 bg-white text-black rounded-xl text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Back to Store
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-16">
        {/* Back */}
        <Link
          href="/store"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Store</span>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/10 flex items-center justify-center">
            <Gift className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-light">Gift Cards</h1>
            <p className="text-white/40 text-sm mt-1">Give the gift of premium trading gear</p>
          </div>
        </div>

        {/* Gift Card Preview */}
        <motion.div
          className="relative mb-10 p-8 md:p-10 rounded-2xl overflow-hidden border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, rgba(234,179,8,0.05) 100%)',
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <span className="text-black font-bold text-sm">B</span>
              </div>
              <span className="text-sm font-light tracking-tight">Bullmoney Store</span>
            </div>
            <p className="text-4xl md:text-5xl font-light tabular-nums">{formatPrice(amount)}</p>
            <p className="text-white/30 text-sm mt-2">Digital Gift Card</p>
            {recipientName && (
              <p className="text-white/50 text-sm mt-4">For: {recipientName}</p>
            )}
            {message && (
              <p className="text-white/40 text-xs mt-2 italic max-w-xs">&ldquo;{message}&rdquo;</p>
            )}
          </div>
        </motion.div>

        {/* Purchase Form */}
        <form onSubmit={handlePurchase} className="space-y-8">
          {/* Amount Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-white/60 uppercase tracking-wider">Choose Amount</label>
            <div className="grid grid-cols-4 gap-2">
              {GIFT_CARD_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                  className={`py-3 rounded-xl text-sm font-medium transition-all border
                    ${selectedAmount === amt && !customAmount
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20'
                    }`}
                >
                  {formatPrice(amt)}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="Custom amount (min 10)"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); }}
                min={10}
                max={1000}
                className="w-full h-12 px-4 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>

          {/* Recipient Info */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-white/60 uppercase tracking-wider">Recipient</label>
            <input
              type="email"
              required
              placeholder="Recipient email *"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
            />
            <input
              type="text"
              placeholder="Recipient name (optional)"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Sender & Message */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-white/60 uppercase tracking-wider">From</label>
            <input
              type="text"
              placeholder="Your name (optional)"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
            />
            <textarea
              placeholder="Add a personal message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors resize-none"
            />
          </div>

          {/* Delivery Info */}
          <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
            <Send className="w-5 h-5 text-white/40 shrink-0" />
            <p className="text-sm text-white/50">
              Gift card will be delivered instantly via email with a unique redemption code.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || amount < 10}
            className="w-full h-14 bg-white text-black rounded-xl text-sm font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Purchase Gift Card — {formatPrice(amount)}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
