import { memo, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ExternalLink, ShoppingBag } from 'lucide-react';
import type { TelegramPost } from '@/components/ultimate-hub/types';

export const BreakingNewsViewer = memo(() => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [messages, setMessages] = useState<TelegramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef(0);
  
  // Fetch messages from Bullmoneyshop channel ONLY
  useEffect(() => {
    const fetchMessages = async () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastFetchRef.current < 12000) return;
      lastFetchRef.current = now;
      try {
        const response = await fetch('/api/telegram/channel?channel=shop&t=' + Date.now(), { cache: 'no-store' });
        const data = await response.json();
        if (data.success && data.posts?.length) {
          setMessages(data.posts);
        }
      } catch (err) {
        console.error('Failed to fetch news from Bullmoneyshop:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    const interval = setInterval(fetchMessages, 20000); // Refresh every 20s
    return () => clearInterval(interval);
  }, []);
  
  // Cycle through messages
  useEffect(() => {
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [messages.length]);
  
  if (loading || messages.length === 0) {
    return (
      <div 
        className="px-2 py-1.5 rounded-md text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(239,68,68,0.05) 100%)',
          border: '1px solid #ef4444',
          boxShadow: '0 0 3px #ef4444, 0 0 6px #ef4444, inset 0 0 3px #ef4444'
        }}
      >
        <span 
          className="text-[9px] font-semibold"
          style={{ color: '#dc2626', textShadow: '0 0 4px #ef4444' }}
        >
          Loading Breaking News...
        </span>
      </div>
    );
  }
  
  const currentMessage = messages[currentMessageIndex];
  
  return (
    <a
      href="https://t.me/Bullmoneyshop"
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <motion.div 
        className="px-2.5 py-2 rounded-md overflow-hidden transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(239,68,68,0.05) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid #ef4444',
          boxShadow: '0 0 3px #ef4444, 0 0 6px #ef4444, inset 0 0 3px #ef4444'
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="animate-alert-pulse" style={{ willChange: 'transform' }}>
              <AlertTriangle className="w-3.5 h-3.5 text-black" style={{ filter: 'none' }} />
            </div>
            <span 
              className="text-xs font-bold uppercase tracking-wider animate-neon-pulse-red"
              style={{ 
                color: '#dc2626',
                textShadow: '0 0 3px #ef4444',
                willChange: 'text-shadow'
              }}
            >
              BREAKING NEWS
            </span>
          </div>
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse-glow-red"
            style={{ background: '#ef4444', willChange: 'opacity' }}
          />
        </div>
        
        {/* Animated Message */}
        <div className="relative h-[40px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessageIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-1"
              style={{ willChange: 'transform, opacity' }}
            >
              <p 
                className="text-[10px] font-semibold leading-tight line-clamp-2"
                style={{ 
                  color: '#fca5a5',
                  textShadow: '0 0 2px #ef4444'
                }}
              >
                {currentMessage.text.substring(0, 100)}{currentMessage.text.length > 100 ? '...' : ''}
              </p>
              <span 
                className="text-[8px]"
                style={{ 
                  color: '#dc2626',
                  textShadow: '0 0 2px #ef4444'
                }}
              >
                {currentMessage.date}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-red-500/20">
          <span 
            className="text-[8px] font-medium flex items-center gap-1"
            style={{ 
              color: '#dc2626',
              textShadow: '0 0 2px #ef4444'
            }}
          >
            <ShoppingBag className="w-2.5 h-2.5" />
            @Bullmoneyshop
          </span>
          <div className="animate-nudge-x-sm">
            <ExternalLink className="w-2.5 h-2.5 text-black group-hover:text-red-400" />
          </div>
        </div>
      </motion.div>
    </a>
  );
});
BreakingNewsViewer.displayName = 'BreakingNewsViewer';
