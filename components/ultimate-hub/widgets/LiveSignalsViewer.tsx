import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, MessageCircle, Radio, Send } from 'lucide-react';
import type { TelegramPost } from '@/components/ultimate-hub/types';

export const LiveSignalsViewer = memo(() => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<TelegramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef(0);
  
  // Fetch messages from bullmoneywebsite channel ONLY
  useEffect(() => {
    const fetchMessages = async () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastFetchRef.current < 8000) return;
      lastFetchRef.current = now;
      try {
        const response = await fetch('/api/telegram/channel?channel=trades&t=' + Date.now(), { cache: 'no-store' });
        const data = await response.json();
        if (data.success && data.posts?.length) {
          setMessages(data.posts);
        }
      } catch (err) {
        console.error('Failed to fetch signals from bullmoneywebsite:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    const interval = setInterval(fetchMessages, 12000); // Refresh every 12s
    return () => clearInterval(interval);
  }, []);
  
  // Fallback sample signals if API fails
  const liveSignals = useMemo(() => {
    if (messages.length > 0) {
      return messages.map((msg, idx) => ({
        id: idx + 1,
        pair: '📊 Signal',
        action: msg.text.includes('BUY') || msg.text.includes('buy') ? 'BUY' : 'SELL',
        entry: msg.text.substring(0, 50),
        type: 'signal',
        time: msg.date
      }));
    }
    return [
      { id: 1, pair: '🟢 EUR/USD', action: 'BUY', entry: '@1.0912', type: 'signal', time: '2m ago' },
      { id: 2, pair: '🔴 BTC/USD', action: 'SELL', entry: '@46,120', type: 'signal', time: '5m ago' },
      { id: 3, pair: '🟡 XAU/USD', action: 'BUY', entry: '@2024.50', type: 'signal', time: '8m ago' },
      { id: 4, pair: '🟢 GBP/USD', action: 'BUY', entry: '@1.2720', type: 'signal', time: '12m ago' },
      { id: 5, pair: '🔴 OIL/USD', action: 'SELL', entry: '@82.40', type: 'signal', time: '15m ago' },
    ];
  }, [messages]);
  
  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setIsTyping(true);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % liveSignals.length);
        setIsTyping(false);
      }, 300);
    }, 4500);
    
    return () => clearInterval(interval);
  }, [liveSignals.length]);
  
  const currentSignal = liveSignals[currentMessageIndex];
  
  return (
    <a
      href="https://t.me/bullmoneywebsite"
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <motion.div 
        className="px-3 py-2.5 rounded-md overflow-hidden transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,245,247,1) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid #ffffff',
          boxShadow: '0 0 4px #ffffff, 0 0 8px #ffffff, inset 0 0 4px #ffffff'
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="animate-spin-slow" style={{ willChange: 'transform' }}>
              <Send className="w-4 h-4 text-black" style={{ filter: 'none' }} />
            </div>
            <span 
              className="text-sm font-bold uppercase tracking-wider animate-neon-pulse-optimized"
              style={{ 
                color: '#000000',
                textShadow: 'none',
                willChange: 'text-shadow'
              }}
            >
              FREE SIGNALS
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full animate-pulse-glow-green"
              style={{ background: '#000000', willChange: 'opacity' }}
            />
            <span 
              className="text-[8px] font-semibold uppercase tracking-wider"
              style={{ 
                color: '#000000',
                textShadow: 'none'
              }}
            >
              LIVE
            </span>
          </div>
        </div>
        
        {/* Animated Message Display */}
        <div className="relative h-[68px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessageIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-2"
              style={{ willChange: 'transform, opacity' }}
            >
              {/* Signal Card */}
              <div 
                className="p-2 rounded"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span 
                    className="text-xs font-bold"
                    style={{ 
                      color: '#000000',
                      textShadow: 'none'
                    }}
                  >
                    {currentSignal.pair}
                  </span>
                  <span 
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded animate-pulse-scale ${
                      currentSignal.action === 'BUY' ? 'bg-emerald-500/15' : 'bg-red-500/15'
                    }`}
                    style={{ 
                      color: currentSignal.action === 'BUY' ? '#059669' : '#ef4444',
                      textShadow: 'none',
                      border: `1px solid ${currentSignal.action === 'BUY' ? '#05966940' : '#ef444440'}`,
                      willChange: 'transform'
                    }}
                  >
                    {currentSignal.action}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span 
                    className="text-[11px] font-semibold"
                    style={{ 
                      color: '#000000',
                      textShadow: 'none'
                    }}
                  >
                    Entry {currentSignal.entry}
                  </span>
                  <span 
                    className="text-[9px]"
                    style={{ 
                      color: '#000000',
                      textShadow: 'none'
                    }}
                  >
                    {currentSignal.time}
                  </span>
                </div>
              </div>
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-1.5 px-2 animate-fade-in">
                  <MessageCircle className="w-3 h-3 text-black" />
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full animate-bounce-dot"
                        style={{ 
                          background: '#000000',
                          animationDelay: `${i * 150}ms`,
                          willChange: 'transform'
                        }}
                      />
                    ))}
                  </div>
                  <span 
                    className="text-[9px]"
                    style={{ 
                      color: '#000000',
                      textShadow: 'none'
                    }}
                  >
                    New signal incoming...
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-black/10">
          <span 
            className="text-[9px] font-medium flex items-center gap-1"
            style={{ 
              color: '#000000',
              textShadow: 'none'
            }}
          >
            <Radio className="w-3 h-3" />
            @bullmoneywebsite
          </span>
          <div className="animate-nudge-x">
            <ExternalLink className="w-3 h-3 text-black group-hover:text-black" />
          </div>
        </div>
      </motion.div>
    </a>
  );
});
LiveSignalsViewer.displayName = 'LiveSignalsViewer';
