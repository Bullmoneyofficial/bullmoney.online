export type ThemeCategory = 'SPECIAL' | 'SENTIMENT' | 'ASSETS' | 'CRYPTO' | 'HISTORICAL' | 'OPTICS' | 'GLITCH' | 'EXOTIC';

export type Theme = { 
  id: string; 
  name: string; 
  description: string; 
  filter: string; 
  mobileFilter: string; 
  category: ThemeCategory; 
  isLight?: boolean; 
  illusion?: 'SCANLINES' | 'VIGNETTE' | 'NOISE' | 'NONE'; 
  accentColor?: string; 
};

export const THEMES: Theme[] = [
  // (THEMES array content - copied from your input)
  { id: 'bull-money-special', name: 'Bull Money Chrome', description: 'REFRESH TO REVEAL', category: 'SPECIAL', filter: 'url(#chrome-liquid) sepia(1) hue-rotate(190deg) saturate(4) contrast(1.1) brightness(1.1) drop-shadow(0 0 5px rgba(0,255,255,0.5))', mobileFilter: 'sepia(1) hue-rotate(190deg) saturate(3) contrast(1.2)', illusion: 'SCANLINES', accentColor: '#00FFFF' },
  { id: 'c01', name: 'Bitcoin Orange', description: 'BTC Core', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(350deg) saturate(3) contrast(1.1)', mobileFilter: 'sepia(1) hue-rotate(350deg)', illusion: 'NONE', accentColor: '#F7931A' },
  { id: 'c02', name: 'Ethereum Glow', description: 'ETH Gas', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(180deg) saturate(2) brightness(1.1) drop-shadow(0 0 5px #627EEA)', mobileFilter: 'hue-rotate(180deg)', illusion: 'VIGNETTE', accentColor: '#627EEA' },
  { id: 'c03', name: 'Solana Speed', description: 'SOL Summer', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(220deg) saturate(4) contrast(1.2)', mobileFilter: 'hue-rotate(220deg)', illusion: 'SCANLINES', accentColor: '#14F195' },
  { id: 'c04', name: 'Doge Meme', description: 'To The Moon', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(40deg) saturate(2) brightness(1.2)', mobileFilter: 'sepia(0.8) hue-rotate(40deg)', illusion: 'NONE', accentColor: '#CBA6F7' },
  { id: 'c05', name: 'Monero Dark', description: 'Privacy', category: 'CRYPTO', filter: 'grayscale(1) contrast(2) brightness(0.4)', mobileFilter: 'grayscale(1) contrast(1.5)', illusion: 'NOISE', accentColor: '#FF6600' },
  { id: 't01', name: 'Terminal', description: 'Default', category: 'SENTIMENT', filter: 'none', mobileFilter: 'none', illusion: 'NONE', accentColor: '#ffffff' },
  { id: 't02', name: 'God Candle', description: 'Up Only', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(60deg) saturate(3) brightness(1.1)', mobileFilter: 'sepia(1) hue-rotate(60deg) saturate(2)', illusion: 'VIGNETTE', accentColor: '#10B981' },
  { id: 't03', name: 'Blood Bath', description: 'Capitulation', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(320deg) saturate(4) contrast(1.2)', mobileFilter: 'sepia(1) hue-rotate(320deg)', illusion: 'NOISE', accentColor: '#EF4444' },
  { id: 't04', name: 'Moon Mission', description: 'ATH Break', category: 'SENTIMENT', filter: 'brightness(1.2) contrast(1.1) saturate(0) sepia(0.2) drop-shadow(0 0 5px white)', mobileFilter: 'brightness(1.2) grayscale(1)', illusion: 'VIGNETTE', accentColor: '#FFFFFF' },
  { id: 't05', name: 'Whale Watch', description: 'Ocean', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(170deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(170deg)', illusion: 'SCANLINES', accentColor: '#1E3A8A' },
  { id: 't06', name: 'FUD Storm', description: 'Panic', category: 'SENTIMENT', filter: 'grayscale(1) contrast(2) brightness(0.6)', mobileFilter: 'contrast(1.5)', illusion: 'NOISE', accentColor: '#525252' },
  { id: 'a01', name: 'Gold Bullion', description: 'XAU/USD', category: 'ASSETS', filter: 'url(#gold-shine) sepia(1) hue-rotate(10deg) saturate(3) brightness(0.9)', mobileFilter: 'sepia(1) hue-rotate(10deg) saturate(2)', illusion: 'NONE', accentColor: '#FBBF24' },
  { id: 'a02', name: 'Silver Spot', description: 'XAG/USD', category: 'ASSETS', filter: 'grayscale(1) brightness(1.2) contrast(1.2) drop-shadow(0 0 2px rgba(255,255,255,0.5))', mobileFilter: 'grayscale(1) brightness(1.2)', illusion: 'NONE', accentColor: '#E5E5E5' },
  { id: 'a03', name: 'Crude Oil', description: 'WTI Barrel', category: 'ASSETS', filter: 'sepia(1) hue-rotate(350deg) saturate(0.5) brightness(0.4) contrast(1.5)', mobileFilter: 'sepia(1) brightness(0.5)', illusion: 'NOISE', accentColor: '#1C1917' },
  { id: 'a04', name: 'US Dollar', description: 'Fiat', category: 'ASSETS', filter: 'sepia(1) hue-rotate(70deg) saturate(1.5) contrast(0.9)', mobileFilter: 'sepia(1) hue-rotate(70deg)', illusion: 'VIGNETTE', accentColor: '#22C55E' },
  { id: 'a05', name: 'Lithium', description: 'Battery', category: 'ASSETS', filter: 'sepia(1) hue-rotate(290deg) saturate(0.5) contrast(2)', mobileFilter: 'contrast(1.5)', illusion: 'NONE', accentColor: '#A855F7' },
  { id: 'o01', name: 'Night Vis', description: 'NVG-11', category: 'OPTICS', filter: 'grayscale(1) sepia(1) hue-rotate(70deg) saturate(3) brightness(0.8) contrast(1.2)', mobileFilter: 'grayscale(1) sepia(1) hue-rotate(70deg)', illusion: 'SCANLINES', accentColor: '#22C55E' },
  { id: 'o02', name: 'Thermal', description: 'Predator', category: 'OPTICS', filter: 'invert(1) hue-rotate(180deg) saturate(2) contrast(1.5)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#F43F5E' },
  { id: 'o03', name: 'CRT 1999', description: 'Legacy', category: 'OPTICS', filter: 'sepia(0.5) contrast(1.2) brightness(0.9) grayscale(0.2)', mobileFilter: 'sepia(0.5)', illusion: 'SCANLINES', accentColor: '#A3A3A3' },
  { id: 'o04', name: 'Cyberdeck', description: 'Hacker', category: 'OPTICS', filter: 'hue-rotate(220deg) saturate(2) contrast(1.3) brightness(0.7)', mobileFilter: 'hue-rotate(220deg)', illusion: 'SCANLINES', accentColor: '#0EA5E9' },
  { id: 'e01', name: 'Miami Vice', description: 'OTC Desk', category: 'EXOTIC', filter: 'sepia(0.5) hue-rotate(300deg) saturate(2) contrast(1.1)', mobileFilter: 'sepia(0.5) hue-rotate(300deg)', illusion: 'NONE', accentColor: '#EC4899' },
  { id: 'e02', name: 'Vaporwave', description: 'Aesthetic', category: 'EXOTIC', filter: 'sepia(0.4) hue-rotate(290deg) saturate(1.5) contrast(1.1)', mobileFilter: 'sepia(0.4) hue-rotate(290deg)', illusion: 'SCANLINES', accentColor: '#D946EF' },
  { id: 'e03', name: 'Bank Note', description: 'Cash', category: 'EXOTIC', filter: 'url(#banknote) contrast(0.8)', mobileFilter: 'contrast(1.5)', illusion: 'NONE', accentColor: '#84CC16' },
  { id: 'e04', name: 'Blueprint', description: 'Architect', category: 'EXOTIC', filter: 'invert(1) sepia(1) hue-rotate(180deg) saturate(3) contrast(1.2)', mobileFilter: 'invert(1) sepia(1) hue-rotate(180deg)', isLight: true, illusion: 'NONE', accentColor: '#3B82F6' },
  { id: 'e05', name: 'Matrix', description: 'Source', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(50deg) saturate(5) contrast(1.5) brightness(0.8)', mobileFilter: 'sepia(1) hue-rotate(50deg) saturate(3)', illusion: 'SCANLINES', accentColor: '#22C55E' },
];