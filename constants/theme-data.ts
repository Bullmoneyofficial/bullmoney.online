// src/constants/theme-data.ts
import { 
  Zap, DollarSign, Activity, Shield, Lock, Monitor, Hash, 
  MapPin, Sun, Brain, Smile, Layers 
} from 'lucide-react';

// --- TYPES ---
export type SoundProfile = 'MECHANICAL' | 'SOROS' | 'SCI-FI' | 'SILENT'; 

export type ThemeCategory = 
  | 'SPECIAL' | 'SENTIMENT' | 'ASSETS' | 'CRYPTO' 
  | 'HISTORICAL' | 'OPTICS' | 'GLITCH' | 'EXOTIC' 
  | 'LOCATION' | 'ELEMENTAL' | 'CONCEPTS' | 'MEME'; 

export type Theme = { 
  id: string; 
  name: string; 
  description: string; 
  filter: string; 
  mobileFilter: string; 
  category: ThemeCategory; 
  isLight?: boolean; 
  illusion?: 'SCANLINES' | 'VIGNETTE' | 'NOISE' | 'NONE' | 'GLITCH'; 
  accentColor?: string; 
  status: 'AVAILABLE' | 'UNAVAILABLE';
};

export type TickerData = { symbol: string; price: string; percentChange: string; prevPrice: string; };

// --- DATA ---
export const BASE_THEMES: Theme[] = [
  { 
    id: 'bull-money-special', 
    name: 'Bull Money Chrome', 
    description: 'REFRESH TO REVEAL', 
    category: 'SPECIAL', 
    filter: ' sepia(1) hue-rotate(190deg) saturate(4) contrast(1.1) brightness(1.1) drop-shadow(0 0 5px rgba(0,255,255,0.5))', 
    mobileFilter: 'sepia(1) hue-rotate(190deg) saturate(3) contrast(1.2)', 
    illusion: 'NONE', 
    accentColor: '#00FFFF', 
    status: 'AVAILABLE' 
  },
  { id: 'c01', name: 'Bitcoin Orange', description: 'BTC Core', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(350deg) saturate(3) contrast(1.1)', mobileFilter: 'sepia(1) hue-rotate(350deg)', illusion: 'NONE', accentColor: '#F7931A', status: 'AVAILABLE' },
  { id: 'c02', name: 'Ethereum Glow', description: 'ETH Gas', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(180deg) saturate(2) brightness(1.1) drop-shadow(0 0 5px #627EEA)', mobileFilter: 'hue-rotate(180deg)', illusion: 'VIGNETTE', accentColor: '#627EEA', status: 'AVAILABLE' },
  { id: 't01', name: 'ORIGINAL', description: 'Default', category: 'SENTIMENT', filter: 'none', mobileFilter: 'none', illusion: 'NONE', accentColor: '#ffffff', status: 'AVAILABLE' },
  { id: 't02', name: 'God Candle', description: 'Up Only', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(60deg) saturate(3) brightness(1.1)', mobileFilter: 'sepia(1) hue-rotate(60deg) saturate(2)', illusion: 'VIGNETTE', accentColor: '#10B981', status: 'AVAILABLE' },
  { id: 't03', name: 'Blood Bath', description: 'Capitulation', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(320deg) saturate(4) contrast(1.2)', mobileFilter: 'sepia(1) hue-rotate(320deg)', illusion: 'NOISE', accentColor: '#EF4444', status: 'UNAVAILABLE' },
  { id: 'o04', name: 'Cyberdeck', description: 'Hacker', category: 'OPTICS', filter: 'hue-rotate(220deg) saturate(2) contrast(1.3) brightness(0.7)', mobileFilter: 'hue-rotate(220deg)', illusion: 'SCANLINES', accentColor: '#0EA5E9', status: 'AVAILABLE' },
  { id: 'e05', name: 'Matrix', description: 'Source', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(50deg) saturate(5) contrast(1.5) brightness(0.8)', mobileFilter: 'sepia(1) hue-rotate(50deg) saturate(3)', illusion: 'SCANLINES', accentColor: '#22C55E', status: 'AVAILABLE' },
];

export const NEW_THEMES_DATA: Theme[] = [
  { id: 'c06', name: 'XRP Ripple', description: 'The Standard', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(190deg) saturate(2) brightness(0.9)', mobileFilter: 'hue-rotate(190deg)', illusion: 'NONE', accentColor: '#00AAE4', status: 'AVAILABLE' },
  { id: 'c30', name: 'Arbitrum', description: 'Optimistic', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(200deg) saturate(2) contrast(1.2)', mobileFilter: 'hue-rotate(200deg)', illusion: 'SCANLINES', accentColor: '#2D374B', status: 'UNAVAILABLE' },
  { id: 'l01', name: 'Wall Street', description: 'New York', category: 'LOCATION', filter: 'sepia(1) hue-rotate(200deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#1D4ED8', status: 'AVAILABLE' },
];

export const ALL_THEMES: Theme[] = [...BASE_THEMES, ...NEW_THEMES_DATA];