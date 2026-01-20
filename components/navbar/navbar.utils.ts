import { useEffect, useState } from 'react';

// --- THEME CSS FILTER MAP ---
export const NAVBAR_THEME_FILTER_MAP: Record<string, string> = {
  // CRYPTO THEMES
  'BITCOIN': 'hue-rotate(0deg) saturate(1) brightness(1)',
  'ETHEREUM': 'hue-rotate(-30deg) saturate(1.2) brightness(1.05)',
  'RIPPLE': 'hue-rotate(200deg) saturate(1.1) brightness(0.95)',
  'DOGE': 'hue-rotate(45deg) saturate(1.15) brightness(1.1)',
  'CARDANO': 'hue-rotate(270deg) saturate(1.1) brightness(0.98)',
  'SOLANA': 'hue-rotate(-20deg) saturate(1.3) brightness(1.08)',
  'POLKADOT': 'hue-rotate(280deg) saturate(1.2) brightness(1.02)',
  'STELLAR': 'hue-rotate(190deg) saturate(1.15) brightness(0.97)',
  
  // MARKET THEMES
  'BULLISH': 'hue-rotate(100deg) saturate(1.3) brightness(1.15)',
  'BEARISH': 'hue-rotate(0deg) saturate(1.2) brightness(0.9)',
  'NEUTRAL': 'hue-rotate(0deg) saturate(0.8) brightness(1)',
  'VOLATILE': 'hue-rotate(-40deg) saturate(1.4) brightness(1.2)',
  
  // SPECIAL THEMES
  'MIDNIGHT': 'hue-rotate(0deg) saturate(0.7) brightness(0.85)',
  'NEON': 'hue-rotate(0deg) saturate(1.5) brightness(1.3)',
  'RETRO': 'hue-rotate(30deg) saturate(1.1) brightness(1.05)',
  'CYBERPUNK': 'hue-rotate(-50deg) saturate(1.8) brightness(1.25)',
  'MATRIX': 'hue-rotate(120deg) saturate(1.2) brightness(0.95)',
  'OCEAN': 'hue-rotate(200deg) saturate(1.1) brightness(1)',
  'DESERT': 'hue-rotate(40deg) saturate(1.15) brightness(1.1)',
  
  // DEFAULT
  'DEFAULT': 'hue-rotate(0deg) saturate(1) brightness(1)',
};

// --- TRADING TIPS ---
export const NAVBAR_TRADING_TIPS = [
  { target: 'Home', text: 'Market overview & latest updates', buttonIndex: 0 },
  { target: 'Live', text: 'Watch live trading sessions', buttonIndex: 1 },
  { target: 'Affiliates', text: 'Join our affiliate program', buttonIndex: 2 },
  { target: 'FAQ', text: 'Trading guides & support', buttonIndex: 3 },
  { target: 'Analysis', text: 'Expert market analysis', buttonIndex: 4 },
  { target: 'Products', text: 'Pro tools & indicators', buttonIndex: 5 },
  { target: 'Theme', text: 'Customize your interface', buttonIndex: 6 },
];

// --- MOBILE HELPER TIPS ---
export const MOBILE_HELPER_TIPS = [
  // Button info
  "Home: Market overview & updates",
  "Setups: Daily trading setups",
  "Socials: Join 10k+ traders",
  "FAQ: Trading guides & help",
  "Rewards: Earn points on trades",
  "Products: Pro tools & indicators",
  "Theme: Customize your view",
  // Trading facts
  "90% of traders fail - be the 10%",
  "Risk only 1-2% per trade",
  "The trend is your friend",
  "Cut losses, let winners run",
  "Always use stop losses",
  "Paper trade before going live",
  "Patience beats impulse trading",
  "Volume confirms price action",
  // BullMoney facts
  "BullMoney: Elite trading community",
  "10k+ active traders worldwide",
  "Daily setups for Crypto & Forex",
  "Join our Discord community",
  "Premium setups available 24/7",
  "Learn from pro traders daily",
];

// --- HOOK: ROTATING INDEX ---
export function useRotatingIndex(length: number, interval: number = 5000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!length || length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % length);
    }, interval);
    return () => clearInterval(timer);
  }, [length, interval]);
  return index;
}
