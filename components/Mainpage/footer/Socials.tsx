"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Instagram, Youtube, MessageCircle, Send, XSquareIcon } from "lucide-react";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.373 6.373 0 0 0-5.394 10.637 6.354 6.354 0 0 0 5.212-1.936V23h3.445v-4.03a7.276 7.276 0 0 0 7.397-7.397v-4.887z" /></svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>
);

const SocialIcon = ({ href, icon, alt: _alt }: { href: string; icon: React.ReactNode; alt: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="group block shrink-0">
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="relative flex h-12 w-16 sm:h-14 sm:w-20 md:h-16 md:w-24 shrink-0 items-center justify-center rounded-xl overflow-hidden"
      style={{
        background: 'white',
        border: '1px solid rgba(0, 0, 0, 0.12)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'rgba(0, 0, 0, 0.04)'
        }}
      />
      <div
        className="relative z-10 transition-colors duration-300"
        style={{
          color: '#111111'
        }}
      >
        {icon}
      </div>
    </motion.div>
  </a>
);

export const SocialsRow = () => {
  const socials = useMemo(
    () => [
      { href: "https://www.tiktok.com/@bullmoney.shop?_r=1&_t=ZP-91yqeZbNosA", icon: <TikTokIcon className="w-6 h-6 sm:w-7 sm:h-7" />, alt: "TikTok" },
      { href: "https://www.instagram.com/bullmoney.shop", icon: <Instagram className="w-6 h-6 sm:w-7 sm:h-7" />, alt: "Instagram" },
      { href: "https://x.com/BULLMONEYFX", icon: <XIcon className="w-6 h-6 sm:w-7 sm:h-7" />, alt: "Twitter" },
      { href: "https://affs.click/t5wni", icon: <XSquareIcon className="w-6 h-6 sm:w-7 sm:h-7" />, alt: "XM" },
      { href: "https://www.youtube.com/@bullmoney.online", icon: <Youtube className="w-6 h-6 sm:w-7 sm:h-7" />, alt: "YouTube" },
      { href: "https://discord.com/invite/9vVB44ZrNA", icon: <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />, alt: "Discord" },
      { href: "https://t.me/Bullmoneyshop", icon: <Send className="w-6 h-6 sm:w-7 sm:h-7" />, alt: "Telegram" },
    ],
    []
  );

  const marqueeSocials = useMemo(() => [...socials, ...socials, ...socials], [socials]);

  return (
    <div className="relative flex w-full flex-col items-center justify-center py-4 sm:py-6">
      <div className="flex w-full overflow-hidden mask-image-fade">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: "-33.33%" }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          className="flex min-w-full items-center gap-3 sm:gap-6 px-2 sm:px-4"
        >
          {marqueeSocials.map((s, i) => (
            <SocialIcon key={`${s.alt}-${i}`} {...s} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default SocialsRow;
