'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// BACK IN STOCK NOTIFICATION - Subscribe for restock alerts
// ============================================================================

interface BackInStockButtonProps {
  productId: string;
  productName: string;
  variantName?: string;
}

export function BackInStockButton({ productId, productName, variantName }: BackInStockButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/store/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          type: 'back_in_stock',
          productId,
          productName,
          variantName,
        }),
      });

      if (res.ok) {
        setSubscribed(true);
        toast.success("We'll notify you when this item is back in stock!");
      } else {
        toast.error('Failed to subscribe. Please try again.');
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
      >
        <Check className="w-5 h-5 text-green-400" />
        <span className="text-sm text-green-400">You&apos;ll be notified when back in stock</span>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full h-14 px-8 bg-white/10 text-white rounded-xl font-medium
                   flex items-center justify-center gap-3 border border-white/10
                   hover:bg-white/15 transition-colors"
        >
          <Bell className="w-5 h-5" />
          Notify Me When Back in Stock
        </button>
      ) : (
        <motion.form
          onSubmit={handleSubscribe}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          <p className="text-sm text-white/60">
            Enter your email to be notified when <strong className="text-white">{productName}</strong>{variantName ? ` (${variantName})` : ''} is restocked.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white
                       placeholder:text-white/40 focus:outline-none focus:border-white/20"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="h-12 px-6 bg-white text-black rounded-xl font-medium text-sm
                       disabled:opacity-50 hover:bg-white/90 transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              Notify
            </button>
          </div>
        </motion.form>
      )}
    </div>
  );
}
