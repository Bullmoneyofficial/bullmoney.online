import { memo, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Youtube } from 'lucide-react';
import { FEATURED_VIDEOS, TRADING_LIVE_CHANNELS } from '@/components/ultimate-hub/constants';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { ModalWrapper } from '@/components/ultimate-hub/modals/ModalWrapper';

export const BullMoneyTVModal = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'featured' | 'live'>('featured');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [tradingChannelIndex, setTradingChannelIndex] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setFeaturedIndex(0);
      setPlayerKey(p => p + 1);
      setTradingChannelIndex(Math.floor(Math.random() * TRADING_LIVE_CHANNELS.length));
    }
  }, [isOpen]);

  const youtubeEmbedUrl = useMemo(() => {
    if (activeTab === 'live') {
      if (isLive) {
        return `https://www.youtube.com/embed/live_stream?channel=UCTd2Y1DjefTH6bOAvFcJ34Q&autoplay=1&mute=0`;
      }
      const channel = TRADING_LIVE_CHANNELS[tradingChannelIndex];
      return `https://www.youtube.com/embed/live_stream?channel=${channel.id}&autoplay=1&mute=0`;
    }
    return `https://www.youtube.com/embed/${FEATURED_VIDEOS[featuredIndex]}?autoplay=1&mute=0`;
  }, [activeTab, featuredIndex, tradingChannelIndex, isLive]);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="500px" color="purple">
      {/* Header */}
      <div className="p-3 border-b border-black/10 bg-white border border-black/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <h3 className="text-sm font-bold text-black">BullMoney TV</h3>
            {isLive && (
              <motion.div
                className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 rounded-full"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                <span className="text-[8px] font-bold text-red-500 font-bold">LIVE NOW</span>
              </motion.div>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-black/5 border border-black/10 shadow-sm flex items-center justify-center"
          >
            <span className="text-black font-bold">×</span>
          </motion.button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          <motion.button
            onClick={() => { setActiveTab('featured'); setPlayerKey(p => p + 1); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold ${
              activeTab === 'featured'
                ? 'bg-yellow-400 text-black'
                : 'bg-white text-black/50 hover:bg-white'
            }`}
          >
            Featured ({featuredIndex + 1}/{FEATURED_VIDEOS.length})
          </motion.button>
          
          <motion.button
            onClick={() => {
              setActiveTab('live');
              if (!isLive) setTradingChannelIndex(Math.floor(Math.random() * TRADING_LIVE_CHANNELS.length));
              setPlayerKey(p => p + 1);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold ${
              activeTab === 'live'
                ? isLive ? 'bg-red-500 text-white' : 'bg-white text-black'
                : 'bg-white text-black/50 hover:bg-white'
            }`}
          >
            <motion.div
              className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-400' : 'bg-white/50'}`}
              animate={isLive ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
            {isLive ? 'Live Stream' : 'Trading'}
          </motion.button>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative w-full bg-white" style={{ minHeight: '280px' }}>
        {isOpen && (
          <iframe
            key={`player-${playerKey}-${activeTab}-${featuredIndex}`}
            src={`${youtubeEmbedUrl}&t=${playerKey}`}
            width="100%"
            height="280"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 'none' }}
          />
        )}
        
        {/* Navigation for Featured */}
        {activeTab === 'featured' && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <motion.button
              onClick={() => { setFeaturedIndex(p => (p - 1 + FEATURED_VIDEOS.length) % FEATURED_VIDEOS.length); setPlayerKey(p => p + 1); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 bg-white hover:bg-black/5 rounded-full flex items-center justify-center text-black"
            >
              ◀
            </motion.button>
            <span className="text-black/50 text-xs font-semibold bg-white/50 px-2 py-1 rounded">
              {featuredIndex + 1} / {FEATURED_VIDEOS.length}
            </span>
            <motion.button
              onClick={() => { setFeaturedIndex(p => (p + 1) % FEATURED_VIDEOS.length); setPlayerKey(p => p + 1); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 bg-white hover:bg-black/5 rounded-full flex items-center justify-center text-black"
            >
              ▶
            </motion.button>
          </div>
        )}
        
        {/* Next channel for live when not streaming */}
        {activeTab === 'live' && !isLive && (
          <div className="absolute bottom-2 right-2">
            <motion.button
              onClick={() => { setTradingChannelIndex(p => (p + 1) % TRADING_LIVE_CHANNELS.length); setPlayerKey(p => p + 1); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 hover:bg-white rounded text-[10px] font-bold text-black"
            >
              Next Channel ▶
            </motion.button>
          </div>
        )}
      </div>

      {/* Platform Links */}
      <div className="flex bg-white border-t border-black/10">
        <a href="https://youtube.com/@bullmoney.streams" target="_blank" rel="noopener noreferrer"
          className="flex-1 py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold text-black/60 hover:text-black hover:bg-red-600/20">
          <Youtube className="w-4 h-4 text-red-500" /> YouTube
        </a>
        <a href="https://discord.gg/vfxHPpCeQ" target="_blank" rel="noopener noreferrer"
          className="flex-1 py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold text-black/60 hover:text-black hover:bg-[#5865F2]/20">
          <MessageSquare className="w-4 h-4 text-[#5865F2]" /> Discord
        </a>
      </div>
    </ModalWrapper>
  );
});
BullMoneyTVModal.displayName = 'BullMoneyTVModal';
