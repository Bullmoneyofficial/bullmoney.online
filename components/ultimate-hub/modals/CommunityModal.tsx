// @ts-nocheck
import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, ExternalLink, MessageSquare } from 'lucide-react';
import type { ChannelKey } from '@/components/ultimate-hub/types';
import { TELEGRAM_CHANNELS } from '@/components/ultimate-hub/constants';
import { NotificationBadge } from '@/components/NotificationSettingsPanel';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { ModalWrapper } from '@/components/ultimate-hub/modals/ModalWrapper';
import { ChannelCarousel } from '@/components/ultimate-hub/components/ChannelCarousel';
import { TelegramChannelEmbed } from '@/components/ultimate-hub/components/TelegramChannelEmbed';

export const CommunityModal = memo(({ isOpen, onClose, isVip, isAdmin }: { 
  isOpen: boolean; onClose: () => void; isVip: boolean; isAdmin: boolean;
}) => {
  const [activeChannel, setActiveChannel] = useState<ChannelKey>('trades');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = window.location.href;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const socialLinks = [
    { name: 'Discord', icon: MessageSquare, url: 'https://discord.com/invite/9vVB44ZrNA', color: 'from-sky-400 to-sky-300' },
    { name: 'Telegram', icon: MessageCircle, url: 'https://t.me/bullmoneywebsite', color: 'from-sky-400 to-sky-300' },
    { name: 'Instagram', icon: Instagram, url: 'https://www.instagram.com/bullmoney.online/', color: 'from-sky-400 to-sky-300' },
    { name: 'YouTube', icon: Youtube, url: 'https://youtube.com/@bullmoney.online', color: 'from-sky-400 to-sky-300' },
  ];

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} color="cyan">
      {/* Header */}
      <div className="p-3 border-b border-black/10 bg-white">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-black" />
            <h3 className="text-sm font-bold text-black">Live Community</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {/* 🔔 Notification Bell - Compact Icon */}
            <div onClick={(e) => e.stopPropagation()} className="flex items-center">
              <NotificationBadge />
            </div>
            <motion.div className="w-1.5 h-1.5 bg-white rounded-full"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }} />
            <span className="text-[8px] text-black font-medium">LIVE</span>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="ml-1 w-6 h-6 rounded-full bg-white hover:bg-black/5 border border-black/10 shadow-sm flex items-center justify-center"
            >
              <span className="text-black text-sm font-bold">×</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Channel Carousel - Swipeable single button with left/right nav and favorites */}
      <ChannelCarousel
        activeChannel={activeChannel}
        setActiveChannel={setActiveChannel}
        isVip={isVip}
        isAdmin={isAdmin}
        onClose={onClose}
      />

      {/* Feed */}
      <div className="flex-1 overflow-y-auto min-h-0 [-webkit-overflow-scrolling:touch]" style={{ touchAction: 'pan-y pan-x', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }} data-scrollable>
        <TelegramChannelEmbed channel={activeChannel} isVip={isVip} />
      </div>

      {/* View All Link */}
      {activeChannel !== 'vip' && (
        <div className="flex-shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 border-t border-black/10 relative z-50">
          <motion.a 
            href={`https://t.me/${TELEGRAM_CHANNELS[activeChannel].handle}`}
            target="_blank" 
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-1 text-[8px] sm:text-[9px] text-black hover:text-black px-2 py-1 sm:px-3 sm:py-1.5 rounded-md bg-white hover:bg-white border border-black/10 relative z-50"
          >
            <ExternalLink className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> Open in Browser
          </motion.a>
        </div>
      )}

      {/* Social Links */}
      <div className="flex-shrink-0 p-2 sm:p-3 space-y-1 sm:space-y-1.5 border-t border-black/10">
        <div className="flex gap-1.5 sm:gap-2">
          <motion.button
            onClick={handleCopyLink}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-md sm:rounded-lg bg-linear-to-r from-white to-white text-black font-semibold text-[10px] sm:text-xs"
          >
            {copied ? <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </motion.button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-1 sm:gap-1.5">
          {socialLinks.map(link => {
            const Icon = link.icon;
            return (
              <motion.a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center justify-center gap-0.5 sm:gap-1 py-1 sm:py-1 px-1.5 sm:px-2 rounded-md bg-linear-to-r ${link.color} text-black font-semibold text-[10px] sm:text-xs`}
              >
                <Icon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                {link.name}
              </motion.a>
            );
          })}
        </div>
        
      </div>
    </ModalWrapper>
  );
});
CommunityModal.displayName = 'CommunityModal';
