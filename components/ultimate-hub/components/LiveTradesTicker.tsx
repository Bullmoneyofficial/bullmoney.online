import { memo, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Loader } from 'lucide-react';
import type { TelegramPost } from '@/components/ultimate-hub/types';

export const LiveTradesTicker = memo(() => {
  const [messages, setMessages] = useState<TelegramPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/telegram/channel?channel=trades&t=${Date.now()}`, { cache: 'no-store' });
        const data = await response.json();
        if (data.success && data.posts?.length) setMessages(data.posts);
      } catch {}
      finally { setLoading(false); }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    const interval = setInterval(() => setCurrentIndex(p => (p + 1) % messages.length), 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const currentMessage = messages[currentIndex];
  
  if (loading || !currentMessage) {
    return (
      <div className="mt-0 -translate-y-0.5 px-1 py-0.5 bg-white/80 rounded-b-lg border-x border-b border-black/10">
        <div className="flex items-center gap-1">
          <Loader className="w-2 h-2 text-black animate-spin" />
          <span className="text-[5px] text-black/40">Loading...</span>
        </div>
      </div>
    );
  }

  const text = currentMessage.text || '';
  const line1 = [...text].length > 45 ? [...text].slice(0, 42).join('') + '...' : text.split('\n')[0] || '';

  return (
    <motion.a
      href="https://t.me/bullmoneywebsite"
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-0 -translate-y-0.5"
    >
      <div className="px-1 py-0.5 bg-white/95 backdrop-blur-xl rounded-b-lg border-x border-b border-black/10 hover:border-black/20 transition-all overflow-hidden">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-0.5">
            <motion.div className="w-1 h-1 bg-emerald-500 rounded-full"
              animate={{ opacity: [1, 0.3, 1], boxShadow: ['0 0 0px rgba(255,255,255,0.8)', '0 0 6px rgba(255,255,255,0.8)', '0 0 0px rgba(255,255,255,0.8)'] }}
              transition={{ duration: 1, repeat: Infinity }} />
            <span className="text-[4px] font-bold text-black/60 uppercase tracking-wider">Live</span>
          </div>
          <span className="text-[5px] text-black/40">{currentIndex + 1}/{messages.length}</span>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-[6px] text-black font-semibold leading-tight truncate"
          >
            {line1}
          </motion.p>
        </AnimatePresence>
        
        <div className="mt-0.5 h-[1px] bg-black/10 rounded-full overflow-hidden">
          <motion.div className="h-full bg-linear-to-r from-white via-white to-white"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 4, ease: 'linear' }}
            key={currentIndex} />
        </div>
      </div>
    </motion.a>
  );
});
LiveTradesTicker.displayName = 'LiveTradesTicker';
