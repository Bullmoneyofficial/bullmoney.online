"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  TrendingUp, DollarSign, Shield, Zap, Lock, Activity, 
  Menu, X, Volume2, VolumeX, Settings, Monitor, RefreshCw, Wifi, WifiOff, Layers, Hash, Command, MessageCircle, ArrowRight, SkipForward, Check, MapPin, Sun, Brain, Smile
} from 'lucide-react'; // Added MapPin, Sun, Brain, Smile for new categories
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// 1. TYPES & THEMES (Refactored to include all 250+ themes)
// ============================================================================

export type SoundProfile = 'MECHANICAL' | 'SOROS' | 'SCI-FI' | 'SILENT'; 
// EXPANDED ThemeCategory to include all new categories
export type ThemeCategory = 
  | 'SPECIAL' 
  | 'SENTIMENT' 
  | 'ASSETS' 
  | 'CRYPTO' 
  | 'HISTORICAL' 
  | 'OPTICS' 
  | 'GLITCH' 
  | 'EXOTIC' 
  | 'LOCATION' // New
  | 'ELEMENTAL' // New
  | 'CONCEPTS' // New
  | 'MEME'; // New

export type Theme = { 
  id: string; name: string; description: string; 
  filter: string; mobileFilter: string; category: ThemeCategory; 
  isLight?: boolean; illusion?: 'SCANLINES' | 'VIGNETTE' | 'NOISE' | 'NONE' | 'GLITCH'; 
  accentColor?: string; status: 'AVAILABLE' | 'UNAVAILABLE';
};

export type TickerData = { symbol: string; price: string; percentChange: string; prevPrice: string; };

// --- BASE THEMES (Original 20 + Fixed Bull Money) ---
export const BASE_THEMES: Theme[] = [
  // --- SPECIAL ---
  { 
    id: 'bull-money-special', 
    name: 'Bull Money Chrome', 
    description: 'REFRESH TO REVEAL', 
    category: 'SPECIAL', 
    // Reverted to original filter but fixed it in the separate system code (assuming this array is read-only here)
    filter: 'url(#chrome-liquid) sepia(1) hue-rotate(190deg) saturate(4) contrast(1.1) brightness(1.1) drop-shadow(0 0 5px rgba(0,255,255,0.5))', 
    mobileFilter: 'sepia(1) hue-rotate(190deg) saturate(3) contrast(1.2)', 
    illusion: 'SCANLINES', 
    accentColor: '#00FFFF', 
    status: 'AVAILABLE' 
  },
  // --- CRYPTO ---
  { id: 'c01', name: 'Bitcoin Orange', description: 'BTC Core', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(350deg) saturate(3) contrast(1.1)', mobileFilter: 'sepia(1) hue-rotate(350deg)', illusion: 'NONE', accentColor: '#F7931A', status: 'AVAILABLE' },
  { id: 'c02', name: 'Ethereum Glow', description: 'ETH Gas', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(180deg) saturate(2) brightness(1.1) drop-shadow(0 0 5px #627EEA)', mobileFilter: 'hue-rotate(180deg)', illusion: 'VIGNETTE', accentColor: '#627EEA', status: 'AVAILABLE' },
  { id: 'c03', name: 'Solana Speed', description: 'SOL Summer', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(220deg) saturate(4) contrast(1.2)', mobileFilter: 'hue-rotate(220deg)', illusion: 'SCANLINES', accentColor: '#14F195', status: 'UNAVAILABLE' },
  { id: 'c04', name: 'Doge Meme', description: 'To The Moon', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(40deg) saturate(2) brightness(1.2)', mobileFilter: 'sepia(0.8) hue-rotate(40deg)', illusion: 'NONE', accentColor: '#CBA6F7', status: 'UNAVAILABLE' },
  { id: 'c05', name: 'Monero Dark', description: 'Privacy', category: 'CRYPTO', filter: 'grayscale(1) contrast(2) brightness(0.4)', mobileFilter: 'grayscale(1) contrast(1.5)', illusion: 'NOISE', accentColor: '#FF6600', status: 'UNAVAILABLE' },

  // --- SENTIMENT ---
  { id: 't01', name: 'Terminal', description: 'Default', category: 'SENTIMENT', filter: 'none', mobileFilter: 'none', illusion: 'NONE', accentColor: '#ffffff', status: 'AVAILABLE' },
  { id: 't02', name: 'God Candle', description: 'Up Only', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(60deg) saturate(3) brightness(1.1)', mobileFilter: 'sepia(1) hue-rotate(60deg) saturate(2)', illusion: 'VIGNETTE', accentColor: '#10B981', status: 'AVAILABLE' },
  { id: 't03', name: 'Blood Bath', description: 'Capitulation', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(320deg) saturate(4) contrast(1.2)', mobileFilter: 'sepia(1) hue-rotate(320deg)', illusion: 'NOISE', accentColor: '#EF4444', status: 'UNAVAILABLE' },
  { id: 't04', name: 'Moon Mission', description: 'ATH Break', category: 'SENTIMENT', filter: 'brightness(1.2) contrast(1.1) saturate(0) sepia(0.2) drop-shadow(0 0 5px white)', mobileFilter: 'brightness(1.2) grayscale(1)', illusion: 'VIGNETTE', accentColor: '#FFFFFF', status: 'UNAVAILABLE' },
  { id: 't05', name: 'Whale Watch', description: 'Ocean', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(170deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(170deg)', illusion: 'SCANLINES', accentColor: '#1E3A8A', status: 'AVAILABLE' },
  { id: 't06', name: 'FUD Storm', description: 'Panic', category: 'SENTIMENT', filter: 'grayscale(1) contrast(2) brightness(0.6)', mobileFilter: 'contrast(1.5)', illusion: 'NOISE', accentColor: '#525252', status: 'UNAVAILABLE' },

  // --- ASSETS ---
  { id: 'a01', name: 'Gold Bullion', description: 'XAU/USD', category: 'ASSETS', filter: 'url(#gold-shine) sepia(1) hue-rotate(10deg) saturate(3) brightness(0.9)', mobileFilter: 'sepia(1) hue-rotate(10deg) saturate(2)', illusion: 'NONE', accentColor: '#FBBF24', status: 'AVAILABLE' },
  { id: 'a02', name: 'Silver Spot', description: 'XAG/USD', category: 'ASSETS', filter: 'grayscale(1) brightness(1.2) contrast(1.2) drop-shadow(0 0 2px rgba(255,255,255,0.5))', mobileFilter: 'grayscale(1) brightness(1.2)', illusion: 'NONE', accentColor: '#E5E5E5', status: 'AVAILABLE' },
  { id: 'a03', name: 'Crude Oil', description: 'WTI Barrel', category: 'ASSETS', filter: 'sepia(1) hue-rotate(350deg) saturate(0.5) brightness(0.4) contrast(1.5)', mobileFilter: 'sepia(1) brightness(0.5)', illusion: 'NOISE', accentColor: '#1C1917', status: 'UNAVAILABLE' },
  { id: 'a04', name: 'US Dollar', description: 'Fiat', category: 'ASSETS', filter: 'sepia(1) hue-rotate(70deg) saturate(1.5) contrast(0.9)', mobileFilter: 'sepia(1) hue-rotate(70deg)', illusion: 'VIGNETTE', accentColor: '#22C55E', status: 'UNAVAILABLE' },
  { id: 'a05', name: 'Lithium', description: 'Battery', category: 'ASSETS', filter: 'sepia(1) hue-rotate(290deg) saturate(0.5) contrast(2)', mobileFilter: 'contrast(1.5)', illusion: 'NONE', accentColor: '#A855F7', status: 'UNAVAILABLE' },

  // --- HISTORICAL ---
  { id: 'h01', name: 'Dot Com Bubble', description: '2000 Peak', category: 'HISTORICAL', filter: 'sepia(0.5) contrast(1.5) hue-rotate(290deg)', mobileFilter: 'sepia(0.5) contrast(1.2)', illusion: 'NOISE', accentColor: '#5B21B6', status: 'UNAVAILABLE' },
  { id: 'h02', name: '80s Oil Shock', description: 'WTI High', category: 'HISTORICAL', filter: 'grayscale(0.5) sepia(0.8) contrast(1.2)', mobileFilter: 'grayscale(0.5) sepia(0.8)', illusion: 'VIGNETTE', accentColor: '#9A3412', status: 'UNAVAILABLE' },

  // --- OPTICS ---
  { id: 'o01', name: 'Night Vis', description: 'NVG-11', category: 'OPTICS', filter: 'grayscale(1) sepia(1) hue-rotate(70deg) saturate(3) brightness(0.8) contrast(1.2)', mobileFilter: 'grayscale(1) sepia(1) hue-rotate(70deg)', illusion: 'SCANLINES', accentColor: '#22C55E', status: 'UNAVAILABLE' },
  { id: 'o02', name: 'Thermal', description: 'Predator', category: 'OPTICS', filter: 'invert(1) hue-rotate(180deg) saturate(2) contrast(1.5)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#F43F5E', status: 'UNAVAILABLE' },
  { id: 'o03', name: 'CRT 1999', description: 'Legacy', category: 'OPTICS', filter: 'sepia(0.5) contrast(1.2) brightness(0.9) grayscale(0.2)', mobileFilter: 'sepia(0.5)', illusion: 'SCANLINES', accentColor: '#A3A3A3', status: 'UNAVAILABLE' },
  { id: 'o04', name: 'Cyberdeck', description: 'Hacker', category: 'OPTICS', filter: 'hue-rotate(220deg) saturate(2) contrast(1.3) brightness(0.7)', mobileFilter: 'hue-rotate(220deg)', illusion: 'SCANLINES', accentColor: '#0EA5E9', status: 'AVAILABLE' },

  // --- EXOTIC ---
  { id: 'e01', name: 'Miami Vice', description: 'OTC Desk', category: 'EXOTIC', filter: 'sepia(0.5) hue-rotate(300deg) saturate(2) contrast(1.1)', mobileFilter: 'sepia(0.5) hue-rotate(300deg)', illusion: 'NONE', accentColor: '#EC4899', status: 'AVAILABLE' },
  { id: 'e02', name: 'Vaporwave', description: 'Aesthetic', category: 'EXOTIC', filter: 'sepia(0.4) hue-rotate(290deg) saturate(1.5) contrast(1.1)', mobileFilter: 'sepia(0.4) hue-rotate(290deg)', illusion: 'SCANLINES', accentColor: '#D946EF', status: 'UNAVAILABLE' },
  { id: 'e03', name: 'Bank Note', description: 'Cash', category: 'EXOTIC', filter: 'url(#banknote) contrast(0.8)', mobileFilter: 'contrast(1.5)', illusion: 'NONE', accentColor: '#84CC16', status: 'UNAVAILABLE' },
  { id: 'e04', name: 'Blueprint', description: 'Architect', category: 'EXOTIC', filter: 'invert(1) sepia(1) hue-rotate(180deg) saturate(3) contrast(1.2)', mobileFilter: 'invert(1) sepia(1) hue-rotate(180deg)', isLight: true, illusion: 'NONE', accentColor: '#3B82F6', status: 'UNAVAILABLE' },
  { id: 'e05', name: 'Matrix', description: 'Source', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(50deg) saturate(5) contrast(1.5) brightness(0.8)', mobileFilter: 'sepia(1) hue-rotate(50deg) saturate(3)', illusion: 'SCANLINES', accentColor: '#22C55E', status: 'AVAILABLE' },
];

// --- NEW THEMES DATA (Over 200 themes from previous response) ---
export const NEW_THEMES_DATA: Theme[] = [
  // --- CRYPTO EXPANSION (Altcoins & L1s) ---
  { id: 'c06', name: 'XRP Ripple', description: 'The Standard', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(190deg) saturate(2) brightness(0.9)', mobileFilter: 'hue-rotate(190deg)', illusion: 'NONE', accentColor: '#00AAE4', status: 'AVAILABLE' },
  { id: 'c07', name: 'Cardano Ada', description: 'Scientific', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(200deg) saturate(1.5) contrast(1.1)', mobileFilter: 'hue-rotate(200deg)', illusion: 'VIGNETTE', accentColor: '#0033AD', status: 'UNAVAILABLE' },
  { id: 'c08', name: 'Polkadot', description: 'Interoperable', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(290deg) saturate(3) brightness(0.8)', mobileFilter: 'hue-rotate(290deg)', illusion: 'NONE', accentColor: '#E6007A', status: 'AVAILABLE' },
  { id: 'c09', name: 'Chainlink', description: 'Oracle', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(210deg) saturate(2) brightness(0.6)', mobileFilter: 'hue-rotate(210deg)', illusion: 'SCANLINES', accentColor: '#2A5ADA', status: 'AVAILABLE' },
  { id: 'c10', name: 'Avalanche', description: 'Red Subnet', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(330deg) saturate(4) contrast(1.2)', mobileFilter: 'hue-rotate(330deg)', illusion: 'NONE', accentColor: '#E84142', status: 'UNAVAILABLE' },
  { id: 'c11', name: 'Binance', description: 'SAFU', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(45deg) saturate(4) contrast(1.1)', mobileFilter: 'sepia(1) hue-rotate(45deg)', illusion: 'NONE', accentColor: '#F0B90B', status: 'UNAVAILABLE' },
  { id: 'c12', name: 'Polygon', description: 'L2 Scaling', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(260deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(260deg)', illusion: 'NONE', accentColor: '#8247E5', status: 'AVAILABLE' },
  { id: 'c13', name: 'Shiba Inu', description: 'Army', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(10deg) saturate(3) contrast(1.3)', mobileFilter: 'hue-rotate(10deg)', illusion: 'NOISE', accentColor: '#FFA409', status: 'UNAVAILABLE' },
  { id: 'c14', name: 'Uniswap', description: 'Swap', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(310deg) saturate(2) brightness(1.1)', mobileFilter: 'hue-rotate(310deg)', illusion: 'NONE', accentColor: '#FF007A', status: 'AVAILABLE' },
  { id: 'c15', name: 'Litecoin', description: 'Silver', category: 'CRYPTO', filter: 'grayscale(1) brightness(1.3) contrast(0.9)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#A6A9AA', status: 'UNAVAILABLE' },
  { id: 'c16', name: 'Cosmos', description: 'Atom', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(240deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(240deg)', illusion: 'VIGNETTE', accentColor: '#2E3148', status: 'AVAILABLE' },
  { id: 'c17', name: 'Near', description: 'Protocol', category: 'CRYPTO', filter: 'invert(1) hue-rotate(180deg) brightness(0.9)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#000000', status: 'UNAVAILABLE' },
  { id: 'c18', name: 'Kaspa', description: 'Ghost DAG', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(160deg) saturate(3) drop-shadow(0 0 3px #49EACB)', mobileFilter: 'hue-rotate(160deg)', illusion: 'SCANLINES', accentColor: '#49EACB', status: 'AVAILABLE' },
  { id: 'c19', name: 'Pepe', description: 'Rare', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(90deg) saturate(3) brightness(1.1)', mobileFilter: 'hue-rotate(90deg)', illusion: 'NONE', accentColor: '#4C9540', status: 'UNAVAILABLE' },
  { id: 'c20', name: 'USDT', description: 'Tether', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(130deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(130deg)', illusion: 'NONE', accentColor: '#26A17B', status: 'AVAILABLE' },
  { id: 'c21', name: 'Tron Legacy', description: 'Justin Sun', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(180deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(180deg)', illusion: 'SCANLINES', accentColor: '#FF0013', status: 'UNAVAILABLE' },
  { id: 'c22', name: 'Stellar Lumens', description: 'XLM', category: 'CRYPTO', filter: 'grayscale(1) brightness(1.2) sepia(0.2)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#CFD8DC', status: 'AVAILABLE' },
  { id: 'c23', name: 'VeChain Thor', description: 'Supply Chain', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(190deg) saturate(2) brightness(1.1)', mobileFilter: 'hue-rotate(190deg)', illusion: 'NONE', accentColor: '#00C2FF', status: 'UNAVAILABLE' },
  { id: 'c24', name: 'Algorand', description: 'Pure PoS', category: 'CRYPTO', filter: 'invert(1) hue-rotate(180deg) brightness(0.8)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#000000', status: 'UNAVAILABLE' },
  { id: 'c25', name: 'Tezos', description: 'Baking', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(200deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#2C7DF7', status: 'AVAILABLE' },
  { id: 'c26', name: 'EOS', description: 'Dan Larimer', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(340deg) saturate(1.5)', mobileFilter: 'hue-rotate(340deg)', illusion: 'VIGNETTE', accentColor: '#D1D5DB', status: 'UNAVAILABLE' },
  { id: 'c27', name: 'Monero Clean', description: 'XMR White', category: 'CRYPTO', filter: 'grayscale(1) brightness(1.5) contrast(1.1)', mobileFilter: 'grayscale(1)', isLight: true, illusion: 'NONE', accentColor: '#FF6600', status: 'UNAVAILABLE' },
  { id: 'c28', name: 'Aptos', description: 'Move', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(320deg) saturate(1) brightness(0.9)', mobileFilter: 'hue-rotate(320deg)', illusion: 'NONE', accentColor: '#1F2937', status: 'AVAILABLE' },
  { id: 'c29', name: 'Sui Water', description: 'Fluid', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(170deg) saturate(3) brightness(1.1)', mobileFilter: 'hue-rotate(170deg)', illusion: 'NONE', accentColor: '#6BA1FF', status: 'AVAILABLE' },
  { id: 'c30', name: 'Arbitrum', description: 'Optimistic', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(200deg) saturate(2) contrast(1.2)', mobileFilter: 'hue-rotate(200deg)', illusion: 'SCANLINES', accentColor: '#2D374B', status: 'UNAVAILABLE' },
  { id: 'c31', name: 'Optimism', description: 'OP Stack', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(320deg) saturate(4) brightness(1.1)', mobileFilter: 'hue-rotate(320deg)', illusion: 'NONE', accentColor: '#FF0420', status: 'AVAILABLE' },
  { id: 'c32', name: 'Base', description: 'Coinbase', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(210deg) saturate(3) contrast(1.1)', mobileFilter: 'hue-rotate(210deg)', illusion: 'NONE', accentColor: '#0052FF', status: 'UNAVAILABLE' },
  { id: 'c33', name: 'Celestia', description: 'Modular', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(260deg) saturate(3) brightness(1.2)', mobileFilter: 'hue-rotate(260deg)', illusion: 'NOISE', accentColor: '#7B2BF9', status: 'AVAILABLE' },
  { id: 'c34', name: 'Injective', description: 'Finance', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(160deg) saturate(2) contrast(1.3)', mobileFilter: 'hue-rotate(160deg)', illusion: 'SCANLINES', accentColor: '#00F2FF', status: 'AVAILABLE' },
  { id: 'c35', name: 'Sei', description: 'Fastest', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(340deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NONE', accentColor: '#9D1F32', status: 'UNAVAILABLE' },
  { id: 'c36', name: 'Render', description: 'GPU', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(320deg) saturate(3) contrast(1.5)', mobileFilter: 'hue-rotate(320deg)', illusion: 'SCANLINES', accentColor: '#FF4D4D', status: 'AVAILABLE' },
  { id: 'c37', name: 'Filecoin', description: 'Storage', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(180deg) saturate(1.5) brightness(0.8)', mobileFilter: 'hue-rotate(180deg)', illusion: 'NONE', accentColor: '#0090FF', status: 'UNAVAILABLE' },
  { id: 'c38', name: 'Arweave', description: 'Permaweb', category: 'CRYPTO', filter: 'invert(1) grayscale(1) brightness(0.8)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NOISE', accentColor: '#000000', status: 'UNAVAILABLE' },
  { id: 'c39', name: 'Hedera', description: 'Hashgraph', category: 'CRYPTO', filter: 'grayscale(1) contrast(1.5) brightness(0.6)', mobileFilter: 'grayscale(1)', illusion: 'SCANLINES', accentColor: '#4A4A4A', status: 'AVAILABLE' },
  { id: 'c40', name: 'Thorchain', description: 'Rune', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(140deg) saturate(3) brightness(1.1)', mobileFilter: 'hue-rotate(140deg)', illusion: 'NONE', accentColor: '#33FF99', status: 'AVAILABLE' },
  { id: 'c41', name: 'MakerDAO', description: 'DAI', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(150deg) saturate(2) brightness(0.9)', mobileFilter: 'hue-rotate(150deg)', illusion: 'NONE', accentColor: '#1AAB9B', status: 'UNAVAILABLE' },
  { id: 'c42', name: 'Aave Ghost', description: 'Lending', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(270deg) saturate(1.5) contrast(1.1)', mobileFilter: 'hue-rotate(270deg)', illusion: 'VIGNETTE', accentColor: '#B6509E', status: 'AVAILABLE' },
  { id: 'c43', name: 'Compound', description: 'Interest', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(120deg) saturate(2) brightness(1.2)', mobileFilter: 'hue-rotate(120deg)', illusion: 'NONE', accentColor: '#00D395', status: 'UNAVAILABLE' },
  { id: 'c44', name: 'Curve', description: 'Stable', category: 'CRYPTO', filter: 'hue-rotate(45deg) contrast(1.5) brightness(0.6)', mobileFilter: 'hue-rotate(45deg)', illusion: 'GLITCH', accentColor: '#FF0000', status: 'AVAILABLE' },
  { id: 'c45', name: 'Lido', description: 'Staked', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(190deg) saturate(2) brightness(1.3)', mobileFilter: 'hue-rotate(190deg)', illusion: 'NONE', accentColor: '#00A3FF', status: 'UNAVAILABLE' },
  { id: 'c46', name: 'Bonk', description: 'Dog Coin', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(20deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(20deg)', illusion: 'NOISE', accentColor: '#FF8800', status: 'AVAILABLE' },
  { id: 'c47', name: 'WIF', description: 'Hat', category: 'CRYPTO', filter: 'sepia(0.8) hue-rotate(350deg) brightness(1.1)', mobileFilter: 'sepia(0.8)', illusion: 'NONE', accentColor: '#BCA38A', status: 'AVAILABLE' },
  { id: 'c48', name: 'Floki', description: 'Viking', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(40deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(40deg)', illusion: 'NONE', accentColor: '#FACC15', status: 'UNAVAILABLE' },
  { id: 'c49', name: 'Ordinals', description: 'Inscription', category: 'CRYPTO', filter: 'grayscale(1) contrast(2) brightness(0.5) drop-shadow(0 0 2px orange)', mobileFilter: 'grayscale(1)', illusion: 'NOISE', accentColor: '#F7931A', status: 'AVAILABLE' },
  { id: 'c50', name: 'Stacks', description: 'L2 BTC', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(260deg) saturate(3) contrast(1.3)', mobileFilter: 'hue-rotate(260deg)', illusion: 'NONE', accentColor: '#5546FF', status: 'UNAVAILABLE' },

  // --- SENTIMENT (Cont.) ---
  { id: 't07', name: 'Sideways', description: 'Chop', category: 'SENTIMENT', filter: 'grayscale(0.8) contrast(0.8) brightness(1.1)', mobileFilter: 'grayscale(0.8)', illusion: 'NONE', accentColor: '#9CA3AF', status: 'AVAILABLE' },
  { id: 't08', name: 'Liquidation', description: 'Margin Call', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(340deg) saturate(5) contrast(1.5) drop-shadow(0 0 5px red)', mobileFilter: 'hue-rotate(340deg)', illusion: 'VIGNETTE', accentColor: '#DC2626', status: 'UNAVAILABLE' },
  { id: 't09', name: 'Hopium', description: 'Delusion', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(280deg) saturate(2) brightness(1.2) blur(0.5px)', mobileFilter: 'hue-rotate(280deg)', illusion: 'NONE', accentColor: '#D8B4FE', status: 'AVAILABLE' },
  { id: 't10', name: 'Diamond Hands', description: 'HODL', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(180deg) saturate(3) brightness(1.3) contrast(1.2)', mobileFilter: 'hue-rotate(180deg)', illusion: 'NONE', accentColor: '#60A5FA', status: 'AVAILABLE' },
  { id: 't11', name: 'Bear Trap', description: 'Fakeout', category: 'SENTIMENT', filter: 'invert(1) hue-rotate(300deg) saturate(2)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NOISE', accentColor: '#166534', status: 'UNAVAILABLE' },
  { id: 't12', name: 'Bull Trap', description: 'Rug', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(80deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(80deg)', illusion: 'SCANLINES', accentColor: '#4ADE80', status: 'UNAVAILABLE' },
  { id: 't13', name: 'Volatility', description: 'VIX Spike', category: 'SENTIMENT', filter: 'contrast(1.6) saturate(1.5)', mobileFilter: 'contrast(1.4)', illusion: 'NOISE', accentColor: '#F59E0B', status: 'AVAILABLE' },
  { id: 't14', name: 'Accumulation', description: 'Slow Buy', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(150deg) saturate(1.5) brightness(0.7)', mobileFilter: 'hue-rotate(150deg)', illusion: 'NONE', accentColor: '#064E3B', status: 'UNAVAILABLE' },
  { id: 't15', name: 'Euphoria', description: 'Top Signal', category: 'SENTIMENT', filter: 'saturate(3) brightness(1.3) contrast(1.2)', mobileFilter: 'saturate(2)', illusion: 'VIGNETTE', accentColor: '#FCD34D', status: 'AVAILABLE' },

  // --- ASSETS & FOREX EXPANSION (Cont.) ---
  { id: 'a06', name: 'Copper', description: 'Dr. Copper', category: 'ASSETS', filter: 'sepia(1) hue-rotate(330deg) saturate(1.5) contrast(1.1) brightness(0.8)', mobileFilter: 'hue-rotate(330deg)', illusion: 'NONE', accentColor: '#B45309', status: 'UNAVAILABLE' },
  { id: 'a07', name: 'Uranium', description: 'Nuclear', category: 'ASSETS', filter: 'sepia(1) hue-rotate(60deg) saturate(4) brightness(1.2) drop-shadow(0 0 5px #ADFF2F)', mobileFilter: 'hue-rotate(60deg)', illusion: 'VIGNETTE', accentColor: '#CCFF00', status: 'AVAILABLE' },
  { id: 'a08', name: 'Natural Gas', description: 'Blue Flame', category: 'ASSETS', filter: 'sepia(1) hue-rotate(190deg) saturate(3) brightness(1.2)', mobileFilter: 'hue-rotate(190deg)', illusion: 'NONE', accentColor: '#3B82F6', status: 'UNAVAILABLE' },
  { id: 'a09', name: 'Euro FX', description: 'Brussels', category: 'ASSETS', filter: 'sepia(1) hue-rotate(200deg) saturate(2) contrast(1)', mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#003399', status: 'AVAILABLE' },
  { id: 'a10', name: 'Yen', description: 'Tokyo', category: 'ASSETS', filter: 'invert(1) hue-rotate(320deg) saturate(2) brightness(1.1)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#BC002D', status: 'UNAVAILABLE' },
  { id: 'a11', name: 'Sterling', description: 'London', category: 'ASSETS', filter: 'sepia(1) hue-rotate(230deg) saturate(1.5) brightness(0.7)', mobileFilter: 'hue-rotate(230deg)', illusion: 'SCANLINES', accentColor: '#1E1B4B', status: 'AVAILABLE' },
  { id: 'a12', name: 'Steel', description: 'Industrial', category: 'ASSETS', filter: 'grayscale(1) contrast(1.5) brightness(0.9)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#64748B', status: 'UNAVAILABLE' },
  { id: 'a13', name: 'Corn', description: 'Agri', category: 'ASSETS', filter: 'sepia(1) hue-rotate(40deg) saturate(2.5) contrast(1.1)', mobileFilter: 'hue-rotate(40deg)', illusion: 'NONE', accentColor: '#FACC15', status: 'AVAILABLE' },
  { id: 'a14', name: 'Coffee', description: 'Arabica', category: 'ASSETS', filter: 'sepia(1) hue-rotate(340deg) saturate(1) brightness(0.5)', mobileFilter: 'sepia(1)', illusion: 'NOISE', accentColor: '#3F2C22', status: 'UNAVAILABLE' },
  { id: 'a15', name: 'Swiss Franc', description: 'Safe Haven', category: 'ASSETS', filter: 'grayscale(1) brightness(1.5) drop-shadow(0 0 2px red)', mobileFilter: 'grayscale(1)', isLight: true, illusion: 'NONE', accentColor: '#DC2626', status: 'AVAILABLE' },
  { id: 'a16', name: 'Palladium', description: 'Catalyst', category: 'ASSETS', filter: 'grayscale(1) brightness(1.1) sepia(0.3) hue-rotate(180deg)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#9CA3AF', status: 'UNAVAILABLE' },
  { id: 'a17', name: 'Platinum', description: 'Precious', category: 'ASSETS', filter: 'grayscale(1) brightness(1.4) drop-shadow(0 0 3px white)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#FFFFFF', status: 'AVAILABLE' },
  { id: 'a18', name: 'Wheat', description: 'Bushel', category: 'ASSETS', filter: 'sepia(1) hue-rotate(40deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(40deg)', illusion: 'NONE', accentColor: '#EAB308', status: 'UNAVAILABLE' },
  { id: 'a19', name: 'Soybean', description: 'Meal', category: 'ASSETS', filter: 'sepia(1) hue-rotate(60deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(60deg)', illusion: 'NOISE', accentColor: '#65A30D', status: 'AVAILABLE' },
  { id: 'a20', name: 'Sugar', description: 'Softs', category: 'ASSETS', filter: 'invert(1) sepia(0.2) contrast(0.8)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#F9A8D4', status: 'UNAVAILABLE' },
  { id: 'a21', name: 'Lumber', description: 'Timber', category: 'ASSETS', filter: 'sepia(1) hue-rotate(340deg) saturate(1) brightness(0.6)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NONE', accentColor: '#78350F', status: 'AVAILABLE' },
  { id: 'a22', name: 'Cotton', description: 'Fiber', category: 'ASSETS', filter: 'grayscale(1) brightness(1.6) contrast(0.8)', mobileFilter: 'grayscale(1)', isLight: true, illusion: 'NONE', accentColor: '#E5E5E5', status: 'UNAVAILABLE' },
  { id: 'a23', name: 'Orange Juice', description: 'Frozen', category: 'ASSETS', filter: 'sepia(1) hue-rotate(10deg) saturate(4) brightness(1.1)', mobileFilter: 'hue-rotate(10deg)', illusion: 'NONE', accentColor: '#F97316', status: 'AVAILABLE' },
  { id: 'a24', name: 'Cocoa', description: 'Bean', category: 'ASSETS', filter: 'sepia(1) saturate(1.5) brightness(0.4)', mobileFilter: 'sepia(1)', illusion: 'NOISE', accentColor: '#451A03', status: 'UNAVAILABLE' },
  { id: 'a25', name: 'Live Cattle', description: 'Feeder', category: 'ASSETS', filter: 'sepia(0.6) hue-rotate(350deg) contrast(1.2)', mobileFilter: 'sepia(0.6)', illusion: 'NONE', accentColor: '#9F1239', status: 'AVAILABLE' },
  { id: 'a26', name: 'AUD Dollar', description: 'Aussie', category: 'ASSETS', filter: 'sepia(1) hue-rotate(130deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(130deg)', illusion: 'NONE', accentColor: '#059669', status: 'UNAVAILABLE' },
  { id: 'a27', name: 'CAD Dollar', description: 'Loonie', category: 'ASSETS', filter: 'sepia(1) hue-rotate(330deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(330deg)', illusion: 'NONE', accentColor: '#DC2626', status: 'AVAILABLE' },
  { id: 'a28', name: 'NZD Dollar', description: 'Kiwi', category: 'ASSETS', filter: 'sepia(1) hue-rotate(300deg) saturate(1) brightness(0.8)', mobileFilter: 'hue-rotate(300deg)', illusion: 'NONE', accentColor: '#111827', status: 'UNAVAILABLE' },
  { id: 'a29', name: 'CHF Franc', description: 'Swiss', category: 'ASSETS', filter: 'grayscale(1) brightness(1.3) contrast(1.1) drop-shadow(0 0 2px red)', mobileFilter: 'grayscale(1)', isLight: true, illusion: 'NONE', accentColor: '#B91C1C', status: 'AVAILABLE' },
  { id: 'a30', name: 'ZAR Rand', description: 'South Africa', category: 'ASSETS', filter: 'sepia(1) hue-rotate(70deg) saturate(3) brightness(0.9)', mobileFilter: 'hue-rotate(70deg)', illusion: 'NONE', accentColor: '#16A34A', status: 'UNAVAILABLE' },
  { id: 'a31', name: 'CNY Yuan', description: 'Renminbi', category: 'ASSETS', filter: 'sepia(1) hue-rotate(340deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NONE', accentColor: '#B91C1C', status: 'AVAILABLE' },
  { id: 'a32', name: 'INR Rupee', description: 'India', category: 'ASSETS', filter: 'sepia(1) hue-rotate(20deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(20deg)', illusion: 'NONE', accentColor: '#EA580C', status: 'UNAVAILABLE' },
  { id: 'a33', name: 'BRL Real', description: 'Brazil', category: 'ASSETS', filter: 'sepia(1) hue-rotate(90deg) saturate(4) brightness(0.8)', mobileFilter: 'hue-rotate(90deg)', illusion: 'NONE', accentColor: '#15803D', status: 'AVAILABLE' },
  { id: 'a34', name: 'MXN Peso', description: 'Mexico', category: 'ASSETS', filter: 'sepia(1) hue-rotate(140deg) saturate(2) contrast(1.2)', mobileFilter: 'hue-rotate(140deg)', illusion: 'NONE', accentColor: '#047857', status: 'UNAVAILABLE' },
  { id: 'a35', name: 'KRW Won', description: 'Korea', category: 'ASSETS', filter: 'sepia(1) hue-rotate(200deg) saturate(1.5) brightness(1.1)', mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#2563EB', status: 'AVAILABLE' },
  { id: 'a36', name: 'Nasdaq', description: 'Tech 100', category: 'ASSETS', filter: 'sepia(1) hue-rotate(210deg) saturate(3) contrast(1.1)', mobileFilter: 'hue-rotate(210deg)', illusion: 'SCANLINES', accentColor: '#3B82F6', status: 'UNAVAILABLE' },
  { id: 'a37', name: 'S&P 500', description: 'Large Cap', category: 'ASSETS', filter: 'grayscale(1) brightness(1.1) contrast(1.1)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#6B7280', status: 'AVAILABLE' },
  { id: 'a38', name: 'Dow Jones', description: 'Industrial', category: 'ASSETS', filter: 'sepia(1) hue-rotate(220deg) saturate(1) brightness(0.7)', mobileFilter: 'hue-rotate(220deg)', illusion: 'NONE', accentColor: '#1E3A8A', status: 'UNAVAILABLE' },
  { id: 'a39', name: 'Dax 40', description: 'Germany', category: 'ASSETS', filter: 'sepia(1) hue-rotate(50deg) saturate(2) brightness(0.5)', mobileFilter: 'hue-rotate(50deg)', illusion: 'NONE', accentColor: '#FCD34D', status: 'AVAILABLE' },
  { id: 'a40', name: 'FTSE 100', description: 'UK', category: 'ASSETS', filter: 'grayscale(1) sepia(0.3) brightness(0.8)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#4B5563', status: 'UNAVAILABLE' },
  { id: 'a41', name: 'Nikkei 225', description: 'Japan', category: 'ASSETS', filter: 'invert(1) hue-rotate(320deg) contrast(1.2)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#BE123C', status: 'AVAILABLE' },
  { id: 'a42', name: 'Hang Seng', description: 'HK', category: 'ASSETS', filter: 'sepia(1) hue-rotate(340deg) saturate(2) brightness(0.6)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NONE', accentColor: '#991B1B', status: 'UNAVAILABLE' },
  { id: 'a43', name: 'VIX', description: 'Fear Index', category: 'ASSETS', filter: 'contrast(2) brightness(0.5) grayscale(1)', mobileFilter: 'contrast(1.5)', illusion: 'NOISE', accentColor: '#FFFFFF', status: 'AVAILABLE' },
  { id: 'a44', name: 'Bonds 10Y', description: 'Yield', category: 'ASSETS', filter: 'sepia(1) hue-rotate(200deg) saturate(0.5) brightness(1.2)', mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#93C5FD', status: 'UNAVAILABLE' },
  { id: 'a45', name: 'DXY', description: 'Dollar Index', category: 'ASSETS', filter: 'sepia(1) hue-rotate(120deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(120deg)', illusion: 'NONE', accentColor: '#10B981', status: 'AVAILABLE' },

  // --- LOCATION (Trading Hubs) ---
  { id: 'l01', name: 'Wall Street', description: 'New York', category: 'LOCATION', filter: 'sepia(1) hue-rotate(200deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#1D4ED8', status: 'AVAILABLE' },
  { id: 'l02', name: 'The City', description: 'London', category: 'LOCATION', filter: 'grayscale(1) brightness(0.6) sepia(0.2)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#475569', status: 'UNAVAILABLE' },
  { id: 'l03', name: 'Ginza', description: 'Tokyo', category: 'LOCATION', filter: 'sepia(1) hue-rotate(300deg) saturate(3) brightness(0.5) drop-shadow(0 0 5px pink)', mobileFilter: 'hue-rotate(300deg)', illusion: 'VIGNETTE', accentColor: '#EC4899', status: 'AVAILABLE' },
  { id: 'l04', name: 'Marina Bay', description: 'Singapore', category: 'LOCATION', filter: 'sepia(1) hue-rotate(180deg) saturate(2) contrast(1.2)', mobileFilter: 'hue-rotate(180deg)', illusion: 'NONE', accentColor: '#3B82F6', status: 'UNAVAILABLE' },
  { id: 'l05', name: 'DIFC', description: 'Dubai', category: 'LOCATION', filter: 'sepia(1) hue-rotate(40deg) saturate(2) brightness(1.2) drop-shadow(0 0 5px gold)', mobileFilter: 'hue-rotate(40deg)', illusion: 'NONE', accentColor: '#FACC15', status: 'AVAILABLE' },
  { id: 'l06', name: 'Silicon Valley', description: 'Palo Alto', category: 'LOCATION', filter: 'invert(1) hue-rotate(200deg) saturate(2)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#2563EB', status: 'UNAVAILABLE' },
  { id: 'l07', name: 'Shenzhen', description: 'Hardware', category: 'LOCATION', filter: 'sepia(1) hue-rotate(320deg) saturate(4) brightness(0.6)', mobileFilter: 'hue-rotate(320deg)', illusion: 'SCANLINES', accentColor: '#DC2626', status: 'AVAILABLE' },
  { id: 'l08', name: 'Zug', description: 'Crypto Valley', category: 'LOCATION', filter: 'grayscale(1) brightness(1.4) contrast(1.1)', mobileFilter: 'grayscale(1)', isLight: true, illusion: 'NONE', accentColor: '#EF4444', status: 'UNAVAILABLE' },
  { id: 'l09', name: 'El Salvador', description: 'Bitcoin City', category: 'LOCATION', filter: 'sepia(1) hue-rotate(220deg) saturate(3) brightness(0.7)', mobileFilter: 'hue-rotate(220deg)', illusion: 'VIGNETTE', accentColor: '#0EA5E9', status: 'AVAILABLE' },
  { id: 'l10', name: 'Seoul', description: 'Kimchi', category: 'LOCATION', filter: 'sepia(1) hue-rotate(350deg) saturate(1.5) contrast(1.1)', mobileFilter: 'hue-rotate(350deg)', illusion: 'NONE', accentColor: '#E11D48', status: 'UNAVAILABLE' },
  { id: 'l11', name: 'Mumbai', description: 'Dalal St', category: 'LOCATION', filter: 'sepia(1) hue-rotate(20deg) saturate(3) brightness(0.9)', mobileFilter: 'hue-rotate(20deg)', illusion: 'NOISE', accentColor: '#EA580C', status: 'AVAILABLE' },
  { id: 'l12', name: 'Sydney', description: 'ASX', category: 'LOCATION', filter: 'sepia(1) hue-rotate(200deg) saturate(3) brightness(1.1)', mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#2563EB', status: 'UNAVAILABLE' },
  { id: 'l13', name: 'Frankfurt', description: 'ECB', category: 'LOCATION', filter: 'sepia(1) hue-rotate(210deg) saturate(1) brightness(0.6)', mobileFilter: 'hue-rotate(210deg)', illusion: 'NONE', accentColor: '#1E3A8A', status: 'AVAILABLE' },
  { id: 'l14', name: 'Chicago', description: 'Merc', category: 'LOCATION', filter: 'grayscale(1) contrast(1.3) brightness(0.8)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#6B7280', status: 'UNAVAILABLE' },
  { id: 'l15', name: 'Shanghai', description: 'Bund', category: 'LOCATION', filter: 'sepia(1) hue-rotate(330deg) saturate(3) brightness(0.8)', mobileFilter: 'hue-rotate(330deg)', illusion: 'NONE', accentColor: '#B91C1C', status: 'AVAILABLE' },

  // --- RETRO TECH & OPTICS (Cont.) ---
  { id: 'o05', name: 'X-Ray', description: 'Inverted', category: 'OPTICS', filter: 'invert(1) grayscale(1) brightness(1.2) contrast(1.2)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#FFFFFF', status: 'UNAVAILABLE' },
  { id: 'o06', name: 'Radar', description: 'Sonar', category: 'OPTICS', filter: 'sepia(1) hue-rotate(90deg) saturate(4) contrast(1.5) brightness(0.6)', mobileFilter: 'hue-rotate(90deg)', illusion: 'SCANLINES', accentColor: '#00FF00', status: 'AVAILABLE' },
  { id: 'o07', name: 'Blueprint 2', description: 'Draft', category: 'OPTICS', filter: 'invert(1) sepia(1) hue-rotate(180deg) saturate(3) contrast(1.2)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#3B82F6', status: 'UNAVAILABLE' },
  { id: 'o08', name: 'E-Ink', description: 'Reader', category: 'OPTICS', filter: 'grayscale(1) contrast(3) brightness(1.5)', mobileFilter: 'grayscale(1) contrast(2)', isLight: true, illusion: 'NONE', accentColor: '#000000', status: 'AVAILABLE' },
  { id: 'o09', name: 'Infrared', description: 'Heat', category: 'OPTICS', filter: 'sepia(1) hue-rotate(320deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(320deg)', illusion: 'NONE', accentColor: '#EA580C', status: 'UNAVAILABLE' },
  { id: 'o10', name: 'Ultraviolet', description: 'UV Light', category: 'OPTICS', filter: 'sepia(1) hue-rotate(250deg) saturate(4) brightness(0.8)', mobileFilter: 'hue-rotate(250deg)', illusion: 'VIGNETTE', accentColor: '#7C3AED', status: 'AVAILABLE' },
  { id: 'o11', name: 'HUD', description: 'Pilot', category: 'OPTICS', filter: 'sepia(1) hue-rotate(100deg) saturate(3) brightness(1.1)', mobileFilter: 'hue-rotate(100deg)', illusion: 'SCANLINES', accentColor: '#10B981', status: 'AVAILABLE' },
  { id: 'o12', name: 'Gameboy', description: 'Dot Matrix', category: 'OPTICS', filter: 'sepia(1) hue-rotate(50deg) saturate(2) contrast(1.2)', mobileFilter: 'hue-rotate(50deg)', illusion: 'NOISE', accentColor: '#84CC16', status: 'UNAVAILABLE' },
  { id: 'o13', name: 'Sin City', description: 'Noir Red', category: 'OPTICS', filter: 'grayscale(1) contrast(2) drop-shadow(0 0 2px red)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#EF4444', status: 'AVAILABLE' },
  { id: 'o14', name: 'VGA', description: '256 Colors', category: 'OPTICS', filter: 'contrast(1.5) saturate(2)', mobileFilter: 'contrast(1.2)', illusion: 'NOISE', accentColor: '#FFFFFF', status: 'UNAVAILABLE' },
  { id: 'o15', name: 'Solarized', description: 'Dev', category: 'OPTICS', filter: 'sepia(1) hue-rotate(10deg) saturate(1) brightness(0.9)', mobileFilter: 'sepia(0.8)', illusion: 'NONE', accentColor: '#B58900', status: 'AVAILABLE' },
  { id: 'o16', name: 'Commodore', description: '64', category: 'OPTICS', filter: 'sepia(1) hue-rotate(240deg) saturate(2) brightness(0.7) contrast(1.2)', mobileFilter: 'hue-rotate(240deg)', illusion: 'SCANLINES', accentColor: '#4F46E5', status: 'UNAVAILABLE' },
  { id: 'o17', name: 'Amiga', description: 'Workbench', category: 'OPTICS', filter: 'sepia(1) hue-rotate(180deg) saturate(1) brightness(1.2)', mobileFilter: 'hue-rotate(180deg)', isLight: true, illusion: 'NONE', accentColor: '#60A5FA', status: 'AVAILABLE' },
  { id: 'o18', name: 'MS-DOS', description: 'C:\\>', category: 'OPTICS', filter: 'grayscale(1) brightness(1.5) contrast(2) drop-shadow(0 0 2px white)', mobileFilter: 'grayscale(1)', illusion: 'SCANLINES', accentColor: '#FFFFFF', status: 'UNAVAILABLE' },
  { id: 'o19', name: 'Phosphor P3', description: 'Amber', category: 'OPTICS', filter: 'sepia(1) hue-rotate(20deg) saturate(4) brightness(1.1) contrast(1.2)', mobileFilter: 'hue-rotate(20deg)', illusion: 'SCANLINES', accentColor: '#F59E0B', status: 'AVAILABLE' },
  { id: 'o20', name: 'Phosphor P1', description: 'Green', category: 'OPTICS', filter: 'sepia(1) hue-rotate(80deg) saturate(4) brightness(1.1) contrast(1.2)', mobileFilter: 'hue-rotate(80deg)', illusion: 'SCANLINES', accentColor: '#22C55E', status: 'UNAVAILABLE' },
  { id: 'o21', name: 'Win 95', description: 'Teal', category: 'OPTICS', filter: 'sepia(1) hue-rotate(140deg) saturate(1) brightness(1.2)', mobileFilter: 'hue-rotate(140deg)', illusion: 'NONE', accentColor: '#008080', status: 'AVAILABLE' },
  { id: 'o22', name: 'Mac OS 9', description: 'Platinum', category: 'OPTICS', filter: 'grayscale(1) brightness(1.3) contrast(1)', mobileFilter: 'grayscale(1)', isLight: true, illusion: 'NONE', accentColor: '#E5E5E5', status: 'UNAVAILABLE' },
  { id: 'o23', name: 'Teletext', description: 'Ceefax', category: 'OPTICS', filter: 'contrast(2) saturate(3)', mobileFilter: 'contrast(1.5)', illusion: 'NOISE', accentColor: '#FFFF00', status: 'AVAILABLE' },
  { id: 'o24', name: 'BIOS', description: 'Setup', category: 'OPTICS', filter: 'sepia(1) hue-rotate(200deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(200deg)', illusion: 'SCANLINES', accentColor: '#0000FF', status: 'UNAVAILABLE' },
  { id: 'o25', name: 'Mainframe', description: 'Server', category: 'OPTICS', filter: 'sepia(1) hue-rotate(20deg) saturate(0.5) brightness(0.4)', mobileFilter: 'hue-rotate(20deg)', illusion: 'NONE', accentColor: '#78350F', status: 'AVAILABLE' },
  { id: 'o26', name: 'LCARS', description: 'Starfleet', category: 'OPTICS', filter: 'sepia(1) hue-rotate(25deg) saturate(3) contrast(1.1)', mobileFilter: 'hue-rotate(25deg)', illusion: 'NONE', accentColor: '#F59E0B', status: 'UNAVAILABLE' },
  { id: 'o27', name: 'Pip-Boy', description: 'Wasteland', category: 'OPTICS', filter: 'sepia(1) hue-rotate(60deg) saturate(3) brightness(1.2) drop-shadow(0 0 5px #4ADE80)', mobileFilter: 'hue-rotate(60deg)', illusion: 'SCANLINES', accentColor: '#4ADE80', status: 'AVAILABLE' },
  { id: 'o28', name: 'Hal 9000', description: 'AI', category: 'OPTICS', filter: 'sepia(1) hue-rotate(340deg) saturate(3) brightness(0.6)', mobileFilter: 'hue-rotate(340deg)', illusion: 'VIGNETTE', accentColor: '#DC2626', status: 'UNAVAILABLE' },
  { id: 'o29', name: 'Synth', description: 'Modular', category: 'OPTICS', filter: 'sepia(1) hue-rotate(260deg) saturate(3) contrast(1.1)', mobileFilter: 'hue-rotate(260deg)', illusion: 'NONE', accentColor: '#7C3AED', status: 'AVAILABLE' },
  { id: 'o30', name: 'VHS Pause', description: 'Tracking', category: 'OPTICS', filter: 'sepia(0.5) hue-rotate(220deg) blur(0.5px) contrast(1.5)', mobileFilter: 'sepia(0.5)', illusion: 'GLITCH', accentColor: '#22D3EE', status: 'UNAVAILABLE' },
  { id: 'o31', name: 'Polaroid', description: 'Instant', category: 'OPTICS', filter: 'sepia(0.4) contrast(1.1) brightness(1.1) saturate(1.2)', mobileFilter: 'sepia(0.4)', illusion: 'VIGNETTE', accentColor: '#FDE047', status: 'AVAILABLE' },
  { id: 'o32', name: 'Daguerreotype', description: '1850s', category: 'OPTICS', filter: 'sepia(1) contrast(1.5) brightness(0.8) grayscale(0.5)', mobileFilter: 'sepia(1)', illusion: 'NOISE', accentColor: '#A16207', status: 'UNAVAILABLE' },
  { id: 'o33', name: 'Anaglyph', description: '3D Red/Blue', category: 'OPTICS', filter: 'sepia(1) hue-rotate(280deg) saturate(2) drop-shadow(2px 0 0 red) drop-shadow(-2px 0 0 cyan)', mobileFilter: 'hue-rotate(280deg)', illusion: 'NONE', accentColor: '#DB2777', status: 'AVAILABLE' },
  { id: 'o34', name: 'Technicolor', description: 'Cinema', category: 'OPTICS', filter: 'saturate(2.5) contrast(1.2) sepia(0.2)', mobileFilter: 'saturate(2)', illusion: 'NONE', accentColor: '#EF4444', status: 'UNAVAILABLE' },
  { id: 'o35', name: 'EGA', description: '16 Colors', category: 'OPTICS', filter: 'contrast(1.8) saturate(2)', mobileFilter: 'contrast(1.5)', illusion: 'NOISE', accentColor: '#10B981', status: 'AVAILABLE' },

  // --- ELEMENTAL & NATURE ---
  { id: 'n01', name: 'Deep Ocean', description: 'Mariana', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(190deg) saturate(3) brightness(0.5)', mobileFilter: 'hue-rotate(190deg)', illusion: 'NONE', accentColor: '#0E7490', status: 'AVAILABLE' },
  { id: 'n02', name: 'Volcano', description: 'Magma', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(350deg) saturate(3) brightness(0.7) contrast(1.3)', mobileFilter: 'hue-rotate(350deg)', illusion: 'NOISE', accentColor: '#9F1239', status: 'UNAVAILABLE' },
  { id: 'n03', name: 'Rainforest', description: 'Canopy', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(90deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(90deg)', illusion: 'NONE', accentColor: '#15803D', status: 'AVAILABLE' },
  { id: 'n04', name: 'Arctic', description: 'Tundra', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(180deg) saturate(0.5) brightness(1.2)', mobileFilter: 'hue-rotate(180deg)', isLight: true, illusion: 'NONE', accentColor: '#BAE6FD', status: 'UNAVAILABLE' },
  { id: 'n05', name: 'Desert', description: 'Dune', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(25deg) saturate(2) brightness(1.1)', mobileFilter: 'hue-rotate(25deg)', illusion: 'NOISE', accentColor: '#D97706', status: 'AVAILABLE' },
  { id: 'n06', name: 'Storm', description: 'Thunder', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(220deg) saturate(0.5) brightness(0.6) contrast(1.5)', mobileFilter: 'hue-rotate(220deg)', illusion: 'VIGNETTE', accentColor: '#475569', status: 'UNAVAILABLE' },
  { id: 'n07', name: 'Sunset', description: 'Horizon', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(320deg) saturate(2) brightness(0.9)', mobileFilter: 'hue-rotate(320deg)', illusion: 'NONE', accentColor: '#BE123C', status: 'AVAILABLE' },
  { id: 'n08', name: 'Aurora', description: 'Borealis', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(130deg) saturate(3) brightness(0.8) drop-shadow(0 0 5px #4ADE80)', mobileFilter: 'hue-rotate(130deg)', illusion: 'NONE', accentColor: '#4ADE80', status: 'UNAVAILABLE' },
  { id: 'n09', name: 'Midnight', description: 'Stars', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(230deg) saturate(3) brightness(0.3)', mobileFilter: 'hue-rotate(230deg)', illusion: 'NOISE', accentColor: '#1E1B4B', status: 'AVAILABLE' },
  { id: 'n10', name: 'Swamp', description: 'Murky', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(70deg) saturate(1.5) brightness(0.5)', mobileFilter: 'hue-rotate(70deg)', illusion: 'NONE', accentColor: '#3F6212', status: 'UNAVAILABLE' },
  { id: 'n11', name: 'Glacier', description: 'Ice', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(170deg) saturate(1) brightness(1.1) contrast(1.1)', mobileFilter: 'hue-rotate(170deg)', illusion: 'NONE', accentColor: '#7DD3FC', status: 'AVAILABLE' },
  { id: 'n12', name: 'Space', description: 'Void', category: 'ELEMENTAL', filter: 'grayscale(1) brightness(0.2) contrast(1.2)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#000000', status: 'UNAVAILABLE' },
  { id: 'n13', name: 'Mars', description: 'Red Planet', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(340deg) saturate(1.5) brightness(0.8)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NOISE', accentColor: '#9F1239', status: 'AVAILABLE' },
  { id: 'n14', name: 'Moon', description: 'Crater', category: 'ELEMENTAL', filter: 'grayscale(1) brightness(0.8) contrast(1.2)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#D1D5DB', status: 'UNAVAILABLE' },
  { id: 'n15', name: 'Sun', description: 'Solar', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(30deg) saturate(4) brightness(1.2) contrast(1.1)', mobileFilter: 'hue-rotate(30deg)', illusion: 'NONE', accentColor: '#FDBA74', status: 'AVAILABLE' },

  // --- TRADING CONCEPTS & LINGO ---
  { id: 'cp01', name: 'Black Swan', description: 'Unexpected', category: 'CONCEPTS', filter: 'grayscale(1) brightness(0.3) contrast(1.5)', mobileFilter: 'grayscale(1) brightness(0.5)', illusion: 'VIGNETTE', accentColor: '#171717', status: 'UNAVAILABLE' },
  { id: 'cp02', name: 'Golden Cross', description: 'Bullish', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(45deg) saturate(5) brightness(1.2) drop-shadow(0 0 5px gold)', mobileFilter: 'hue-rotate(45deg)', illusion: 'NONE', accentColor: '#FFD700', status: 'AVAILABLE' },
  { id: 'cp03', name: 'Death Cross', description: 'Bearish', category: 'CONCEPTS', filter: 'grayscale(1) drop-shadow(0 0 5px red) brightness(0.5)', mobileFilter: 'grayscale(1)', illusion: 'VIGNETTE', accentColor: '#991B1B', status: 'UNAVAILABLE' },
  { id: 'cp04', name: 'Dead Cat', description: 'Bounce', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(100deg) saturate(1) contrast(1.5) brightness(0.7)', mobileFilter: 'hue-rotate(100deg)', illusion: 'NOISE', accentColor: '#4ADE80', status: 'AVAILABLE' },
  { id: 'cp05', name: 'Bollinger', description: 'Bands', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(180deg) saturate(2) opacity(0.8)', mobileFilter: 'hue-rotate(180deg)', illusion: 'SCANLINES', accentColor: '#60A5FA', status: 'UNAVAILABLE' },
  { id: 'cp06', name: 'Fibonacci', description: 'Golden Ratio', category: 'CONCEPTS', filter: 'sepia(0.8) hue-rotate(30deg) contrast(1.1)', mobileFilter: 'sepia(0.8)', illusion: 'NONE', accentColor: '#D97706', status: 'AVAILABLE' },
  { id: 'cp07', name: 'Ichimoku', description: 'Cloud', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(150deg) saturate(1.5) brightness(1.1)', mobileFilter: 'hue-rotate(150deg)', illusion: 'VIGNETTE', accentColor: '#34D399', status: 'UNAVAILABLE' },
  { id: 'cp08', name: 'RSI Divergence', description: 'Reversal', category: 'CONCEPTS', filter: 'invert(1) hue-rotate(250deg) saturate(2)', mobileFilter: 'invert(1)', isLight: true, illusion: 'SCANLINES', accentColor: '#818CF8', status: 'AVAILABLE' },
  { id: 'cp09', name: 'MACD', description: 'Momentum', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(300deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(300deg)', illusion: 'NONE', accentColor: '#F472B6', status: 'UNAVAILABLE' },
  { id: 'cp10', name: 'Order Book', description: 'Depth', category: 'CONCEPTS', filter: 'contrast(1.4) brightness(0.6) saturate(0)', mobileFilter: 'contrast(1.2)', illusion: 'SCANLINES', accentColor: '#FFFFFF', status: 'AVAILABLE' },
  { id: 'cp11', name: 'Leverage', description: '100x', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(340deg) saturate(5) contrast(1.3)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NOISE', accentColor: '#EF4444', status: 'UNAVAILABLE' },
  { id: 'cp12', name: 'Spot Market', description: '1:1', category: 'CONCEPTS', filter: 'grayscale(1) brightness(1.2) contrast(1)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#E5E5E5', status: 'AVAILABLE' },
  { id: 'cp13', name: 'Whale Alert', description: 'Movement', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(200deg) saturate(3) drop-shadow(0 0 4px cyan)', mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#06B6D4', status: 'UNAVAILABLE' },
  { id: 'cp14', name: 'Bag Holder', description: 'Heavy', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(20deg) saturate(0.5) brightness(0.6)', mobileFilter: 'hue-rotate(20deg)', illusion: 'VIGNETTE', accentColor: '#78350F', status: 'AVAILABLE' },
  { id: 'cp15', name: 'Paper Hands', description: 'Weak', category: 'CONCEPTS', filter: 'opacity(0.6) grayscale(1)', mobileFilter: 'opacity(0.8)', illusion: 'NOISE', accentColor: '#D1D5DB', status: 'UNAVAILABLE' },
  { id: 'cp16', name: 'FOMO', description: 'Ape In', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(110deg) saturate(4) brightness(1.2)', mobileFilter: 'hue-rotate(110deg)', illusion: 'GLITCH', accentColor: '#84CC16', status: 'AVAILABLE' },
  { id: 'cp17', name: 'REKT', description: 'Liquidated', category: 'CONCEPTS', filter: 'saturate(5) contrast(2) hue-rotate(320deg) drop-shadow(0 0 5px red)', mobileFilter: 'saturate(3)', illusion: 'GLITCH', accentColor: '#DC2626', status: 'UNAVAILABLE' },
  { id: 'cp18', name: 'WAGMI', description: 'Community', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(240deg) saturate(2) brightness(1.2)', mobileFilter: 'hue-rotate(240deg)', illusion: 'NONE', accentColor: '#60A5FA', status: 'AVAILABLE' },
  { id: 'cp19', name: 'NGMI', description: 'Despair', category: 'CONCEPTS', filter: 'grayscale(1) brightness(0.4) contrast(1.5)', mobileFilter: 'grayscale(1)', illusion: 'VIGNETTE', accentColor: '#374151', status: 'UNAVAILABLE' },
  { id: 'cp20', name: 'Alpha', description: 'Insider', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(290deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(290deg)', illusion: 'NONE', accentColor: '#D946EF', status: 'AVAILABLE' },

  // --- HISTORICAL ERAS EXTENDED ---
  { id: 'h03', name: 'Tulip Mania', description: '1637', category: 'HISTORICAL', filter: 'sepia(0.5) hue-rotate(300deg) saturate(1.5) contrast(0.9)', mobileFilter: 'hue-rotate(300deg)', illusion: 'VIGNETTE', accentColor: '#F472B6', status: 'UNAVAILABLE' },
  { id: 'h04', name: 'GFC 2008', description: 'Lehman', category: 'HISTORICAL', filter: 'grayscale(1) brightness(0.7) contrast(1.2)', mobileFilter: 'grayscale(1)', illusion: 'VIGNETTE', accentColor: '#475569', status: 'AVAILABLE' },
  { id: 'h05', name: 'Silk Road', description: 'Dark Web', category: 'HISTORICAL', filter: 'sepia(1) hue-rotate(100deg) saturate(0.5) brightness(0.3)', mobileFilter: 'hue-rotate(100deg)', illusion: 'NOISE', accentColor: '#14532D', status: 'UNAVAILABLE' },
  { id: 'h06', name: 'Gold Std', description: 'Pre-1971', category: 'HISTORICAL', filter: 'sepia(0.8) hue-rotate(20deg) contrast(1.1)', mobileFilter: 'sepia(0.8)', illusion: 'NONE', accentColor: '#D97706', status: 'AVAILABLE' },
  { id: 'h07', name: 'Mt Gox', description: 'Magic TCG', category: 'HISTORICAL', filter: 'sepia(1) hue-rotate(30deg) saturate(2) blur(0.5px)', mobileFilter: 'hue-rotate(30deg)', illusion: 'GLITCH', accentColor: '#F59E0B', status: 'UNAVAILABLE' },
  { id: 'h08', name: 'DeFi Summer', description: 'Yield', category: 'HISTORICAL', filter: 'sepia(1) hue-rotate(240deg) saturate(2) brightness(1.2)', mobileFilter: 'hue-rotate(240deg)', illusion: 'NONE', accentColor: '#8B5CF6', status: 'AVAILABLE' },
  { id: 'h09', name: 'NFT Craze', description: 'JPEGs', category: 'HISTORICAL', filter: 'saturate(3) contrast(1.2) hue-rotate(10deg)', mobileFilter: 'saturate(2)', illusion: 'NONE', accentColor: '#3B82F6', status: 'UNAVAILABLE' },
  { id: 'h10', name: 'FTX Collapse', description: 'Alameda', category: 'HISTORICAL', filter: 'grayscale(1) sepia(0.5) hue-rotate(320deg) brightness(0.6)', mobileFilter: 'grayscale(1)', illusion: 'NOISE', accentColor: '#7F1D1D', status: 'AVAILABLE' },
  { id: 'h11', name: 'Y2K', description: 'Bug', category: 'HISTORICAL', filter: 'sepia(1) hue-rotate(220deg) saturate(3) brightness(0.8)', mobileFilter: 'hue-rotate(220deg)', illusion: 'GLITCH', accentColor: '#06B6D4', status: 'UNAVAILABLE' },
  { id: 'h12', name: 'Cold War', description: 'Spy', category: 'HISTORICAL', filter: 'grayscale(1) brightness(0.6) sepia(0.2)', mobileFilter: 'grayscale(1)', illusion: 'NOISE', accentColor: '#475569', status: 'AVAILABLE' },
  { id: 'h13', name: 'Roaring 20s', description: 'Gatsby', category: 'HISTORICAL', filter: 'sepia(1) hue-rotate(40deg) saturate(1.5) contrast(1.1)', mobileFilter: 'hue-rotate(40deg)', illusion: 'NONE', accentColor: '#F59E0B', status: 'UNAVAILABLE' },
  { id: 'h14', name: 'Victorian', description: 'Steam', category: 'HISTORICAL', filter: 'sepia(1) hue-rotate(350deg) saturate(0.5) contrast(1.2)', mobileFilter: 'hue-rotate(350deg)', illusion: 'VIGNETTE', accentColor: '#78350F', status: 'AVAILABLE' },
  { id: 'h15', name: 'Renaissance', description: 'Art', category: 'HISTORICAL', filter: 'sepia(0.8) hue-rotate(20deg) brightness(1.1)', mobileFilter: 'sepia(0.8)', illusion: 'NONE', accentColor: '#B45309', status: 'UNAVAILABLE' },
  { id: 'h16', name: 'Medieval', description: 'Dark Ages', category: 'HISTORICAL', filter: 'sepia(1) hue-rotate(340deg) saturate(0.5) brightness(0.4)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NOISE', accentColor: '#451A03', status: 'AVAILABLE' },
  { id: 'h17', name: 'Ancient', description: 'Rome', category: 'HISTORICAL', filter: 'sepia(1) hue-rotate(350deg) saturate(1) contrast(1.1)', mobileFilter: 'hue-rotate(350deg)', illusion: 'NONE', accentColor: '#B91C1C', status: 'UNAVAILABLE' },
  { id: 'h18', name: 'Future', description: '3000', category: 'HISTORICAL', filter: 'invert(1) hue-rotate(180deg) brightness(1.2)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#E5E5E5', status: 'AVAILABLE' },
  { id: 'h19', name: 'Industrial', description: 'Revolution', category: 'HISTORICAL', filter: 'grayscale(1) brightness(0.5) contrast(1.5)', mobileFilter: 'grayscale(1)', illusion: 'NOISE', accentColor: '#171717', status: 'UNAVAILABLE' },
  { id: 'h20', name: 'Space Race', description: '1969', category: 'HISTORICAL', filter: 'grayscale(1) brightness(1.2) contrast(1.2) drop-shadow(0 0 2px white)', mobileFilter: 'grayscale(1)', illusion: 'NOISE', accentColor: '#FFFFFF', status: 'AVAILABLE' },
  
  // --- GLITCH (New Themes) ---
  { id: 'g01', name: 'Deep Fry', description: 'Meme', category: 'GLITCH', filter: 'saturate(5) contrast(2) brightness(1.1) hue-rotate(20deg)', mobileFilter: 'saturate(3)', illusion: 'NOISE', accentColor: '#F59E0B', status: 'AVAILABLE' },
  { id: 'g02', name: 'VHS Tape', description: 'Tracking', category: 'GLITCH', filter: 'sepia(0.5) hue-rotate(220deg) blur(0.8px) contrast(1.2)', mobileFilter: 'sepia(0.5)', illusion: 'SCANLINES', accentColor: '#22D3EE', status: 'UNAVAILABLE' },
  { id: 'g03', name: 'Corrupted', description: 'SegFault', category: 'GLITCH', filter: 'invert(1) opacity(0.8)', mobileFilter: 'invert(1)', illusion: 'NOISE', accentColor: '#000000', status: 'AVAILABLE' },
  { id: 'g04', name: 'Blue Screen', description: 'BSOD', category: 'GLITCH', filter: 'sepia(1) hue-rotate(190deg) saturate(5) brightness(0.8)', mobileFilter: 'hue-rotate(190deg)', illusion: 'NONE', accentColor: '#0000FF', status: 'UNAVAILABLE' },
  { id: 'g05', name: 'Radioactive', description: 'Fallout', category: 'GLITCH', filter: 'sepia(1) hue-rotate(60deg) saturate(5) contrast(1.2) drop-shadow(0 0 5px #00FF00)', mobileFilter: 'hue-rotate(60deg)', illusion: 'NOISE', accentColor: '#00FF00', status: 'AVAILABLE' },
  { id: 'g06', name: 'Overclock', description: 'Hot', category: 'GLITCH', filter: 'saturate(2) hue-rotate(340deg) contrast(1.3)', mobileFilter: 'saturate(1.5)', illusion: 'VIGNETTE', accentColor: '#EF4444', status: 'UNAVAILABLE' },
  { id: 'g07', name: 'Packet Loss', description: 'Lag', category: 'GLITCH', filter: 'blur(1px) contrast(1.5)', mobileFilter: 'none', illusion: 'SCANLINES', accentColor: '#9CA3AF', status: 'AVAILABLE' },
  { id: 'g08', name: 'Signal Lost', description: 'No Input', category: 'GLITCH', filter: 'grayscale(1) brightness(0.2) contrast(1.2)', mobileFilter: 'grayscale(1)', illusion: 'NOISE', accentColor: '#404040', status: 'UNAVAILABLE' },
  { id: 'g09', name: 'Burn In', description: 'Plasma', category: 'GLITCH', filter: 'sepia(1) hue-rotate(300deg) saturate(3) brightness(0.9) contrast(1.5)', mobileFilter: 'hue-rotate(300deg)', illusion: 'NONE', accentColor: '#D946EF', status: 'AVAILABLE' },

  // --- AESTHETICS & EXOTIC EXTENDED ---
  { id: 'e06', name: 'Cyberpunk', description: '2077', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(180deg) saturate(3) contrast(1.3) drop-shadow(0 0 3px #F472B6)', mobileFilter: 'hue-rotate(180deg)', illusion: 'VIGNETTE', accentColor: '#F472B6', status: 'UNAVAILABLE' },
  { id: 'e07', name: 'Steampunk', description: 'Brass', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(350deg) saturate(0.8) contrast(1.2) brightness(0.9)', mobileFilter: 'sepia(1)', illusion: 'NONE', accentColor: '#78350F', status: 'AVAILABLE' },
  { id: 'e08', name: 'Nebula', description: 'Space', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(240deg) saturate(2) brightness(0.7) contrast(1.2)', mobileFilter: 'hue-rotate(240deg)', illusion: 'NONE', accentColor: '#6366F1', status: 'UNAVAILABLE' },
  { id: 'e09', name: 'Deep Sea', description: 'Abyss', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(190deg) saturate(1.5) brightness(0.5)', mobileFilter: 'hue-rotate(190deg)', illusion: 'NONE', accentColor: '#0E7490', status: 'AVAILABLE' },
  { id: 'e10', name: 'Acid Trip', description: 'LSD', category: 'EXOTIC', filter: 'hue-rotate(90deg) saturate(3) contrast(1.5)', mobileFilter: 'hue-rotate(90deg)', illusion: 'NONE', accentColor: '#A3E635', status: 'UNAVAILABLE' },
  { id: 'e11', name: 'Zen Garden', description: 'Peace', category: 'EXOTIC', filter: 'sepia(0.5) hue-rotate(80deg) saturate(0.8) brightness(1.1)', mobileFilter: 'sepia(0.5)', illusion: 'NONE', accentColor: '#84CC16', status: 'AVAILABLE' },
  { id: 'e12', name: 'Noir', description: 'Cinema', category: 'EXOTIC', filter: 'grayscale(1) contrast(1.5) brightness(0.8)', mobileFilter: 'grayscale(1)', illusion: 'VIGNETTE', accentColor: '#FFFFFF', status: 'UNAVAILABLE' },
  { id: 'e13', name: 'Candy', description: 'Sugar', category: 'EXOTIC', filter: 'sepia(0.2) hue-rotate(310deg) saturate(2) brightness(1.2)', mobileFilter: 'hue-rotate(310deg)', illusion: 'NONE', accentColor: '#F9A8D4', status: 'AVAILABLE' },
  { id: 'e14', name: 'Frozen', description: 'Ice', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(180deg) saturate(1) brightness(1.3) contrast(0.9)', mobileFilter: 'hue-rotate(180deg)', illusion: 'NONE', accentColor: '#BAE6FD', status: 'UNAVAILABLE' },
  { id: 'e15', name: 'Dracula', description: 'Vampire', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(320deg) saturate(2) brightness(0.6) contrast(1.3)', mobileFilter: 'hue-rotate(320deg)', illusion: 'VIGNETTE', accentColor: '#991B1B', status: 'AVAILABLE' },
  { id: 'e16', name: 'Forest', description: 'Nature', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(110deg) saturate(1.5) brightness(0.8)', mobileFilter: 'hue-rotate(110deg)', illusion: 'NONE', accentColor: '#166534', status: 'UNAVAILABLE' },
  { id: 'e17', name: 'Pastel Goth', description: 'Soft Dark', category: 'EXOTIC', filter: 'sepia(0.5) hue-rotate(260deg) saturate(1) brightness(1.1)', mobileFilter: 'sepia(0.5)', illusion: 'NONE', accentColor: '#C4B5FD', status: 'AVAILABLE' },
  { id: 'e18', name: 'Outrun', description: 'Synthwave', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(300deg) saturate(4) contrast(1.2)', mobileFilter: 'hue-rotate(300deg)', illusion: 'SCANLINES', accentColor: '#F0ABFC', status: 'UNAVAILABLE' },
  { id: 'e19', name: 'Solarpunk', description: 'Eco', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(70deg) saturate(2) brightness(1.2)', mobileFilter: 'hue-rotate(70deg)', illusion: 'NONE', accentColor: '#84CC16', status: 'AVAILABLE' },
  { id: 'e20', name: 'Dieselpunk', description: 'Grease', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(10deg) saturate(0.5) brightness(0.5) contrast(1.3)', mobileFilter: 'hue-rotate(10deg)', illusion: 'NOISE', accentColor: '#57534E', status: 'UNAVAILABLE' },
  { id: 'e21', name: 'Biopunk', description: 'Genetic', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(110deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(110deg)', illusion: 'VIGNETTE', accentColor: '#4ADE80', status: 'AVAILABLE' },
  { id: 'e22', name: 'Gothic', description: 'Cathedral', category: 'EXOTIC', filter: 'grayscale(1) brightness(0.4) contrast(1.3)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#111827', status: 'UNAVAILABLE' },
  { id: 'e23', name: 'Baroque', description: 'Ornate', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(30deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(30deg)', illusion: 'NONE', accentColor: '#D97706', status: 'AVAILABLE' },
  { id: 'e24', name: 'Minimalist', description: 'Clean', category: 'EXOTIC', filter: 'grayscale(1) brightness(1.2) contrast(0.9)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#E5E5E5', status: 'UNAVAILABLE' },
  { id: 'e25', name: 'Maximalist', description: 'Chaos', category: 'EXOTIC', filter: 'saturate(4) contrast(1.5)', mobileFilter: 'saturate(3)', illusion: 'NOISE', accentColor: '#F59E0B', status: 'AVAILABLE' },
  { id: 'e26', name: 'Brutalist', description: 'Concrete', category: 'EXOTIC', filter: 'grayscale(1) brightness(0.8) contrast(1.5)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#525252', status: 'UNAVAILABLE' },
  { id: 'e27', name: 'Pop Art', description: 'Warhol', category: 'EXOTIC', filter: 'saturate(3) contrast(1.5) hue-rotate(180deg)', mobileFilter: 'saturate(2)', illusion: 'NONE', accentColor: '#3B82F6', status: 'AVAILABLE' },
  { id: 'e28', name: 'Lo-Fi', description: 'Study', category: 'EXOTIC', filter: 'sepia(0.6) hue-rotate(330deg) saturate(0.8) brightness(0.9)', mobileFilter: 'sepia(0.6)', illusion: 'NOISE', accentColor: '#FDA4AF', status: 'UNAVAILABLE' },
  { id: 'e29', name: 'High Contrast', description: 'Accessibility', category: 'EXOTIC', filter: 'contrast(2) grayscale(1) brightness(1.2)', mobileFilter: 'contrast(1.5)', illusion: 'NONE', accentColor: '#FFFFFF', status: 'AVAILABLE' },
  { id: 'e30', name: 'Sepia Tone', description: 'Old Photo', category: 'EXOTIC', filter: 'sepia(1) contrast(1.1)', mobileFilter: 'sepia(1)', illusion: 'NONE', accentColor: '#D97706', status: 'UNAVAILABLE' },
  { id: 'e31', name: 'Inverted', description: 'Negative', category: 'EXOTIC', filter: 'invert(1) hue-rotate(180deg)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#FFFFFF', status: 'AVAILABLE' },
  { id: 'e32', name: 'Dream', description: 'Soft', category: 'EXOTIC', filter: 'sepia(0.3) hue-rotate(240deg) brightness(1.2) blur(0.5px)', mobileFilter: 'sepia(0.3)', illusion: 'NONE', accentColor: '#C4B5FD', status: 'UNAVAILABLE' },
  { id: 'e33', name: 'Nightmare', description: 'Dark', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(340deg) saturate(2) brightness(0.3) contrast(1.5)', mobileFilter: 'hue-rotate(340deg)', illusion: 'VIGNETTE', accentColor: '#7F1D1D', status: 'AVAILABLE' },
  { id: 'e34', name: 'Neon City', description: 'Lights', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(280deg) saturate(4) contrast(1.1)', mobileFilter: 'hue-rotate(280deg)', illusion: 'NONE', accentColor: '#E879F9', status: 'UNAVAILABLE' },
  { id: 'e35', name: 'Toxic', description: 'Waste', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(80deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(80deg)', illusion: 'NOISE', accentColor: '#A3E635', status: 'AVAILABLE' },
  { id: 'e36', name: 'Rust', description: 'Oxide', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(350deg) saturate(2) brightness(0.6)', mobileFilter: 'hue-rotate(350deg)', illusion: 'NOISE', accentColor: '#9A3412', status: 'UNAVAILABLE' },
  { id: 'e37', name: 'Mint', description: 'Fresh', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(130deg) saturate(1.5) brightness(1.1)', mobileFilter: 'hue-rotate(130deg)', illusion: 'NONE', accentColor: '#6EE7B7', status: 'AVAILABLE' },
  { id: 'e38', name: 'Berry', description: 'Fruit', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(300deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(300deg)', illusion: 'NONE', accentColor: '#C026D3', status: 'UNAVAILABLE' },
  { id: 'e39', name: 'Lemon', description: 'Zest', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(45deg) saturate(3) brightness(1.2)', mobileFilter: 'hue-rotate(45deg)', illusion: 'NONE', accentColor: '#FDE047', status: 'AVAILABLE' },
  { id: 'e40', name: 'Bubblegum', description: 'Pop', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(310deg) saturate(1.5) brightness(1.1)', mobileFilter: 'hue-rotate(310deg)', illusion: 'NONE', accentColor: '#F472B6', status: 'UNAVAILABLE' },

  // --- MEME & FUN ---
  { id: 'm01', name: 'Nyan Cat', description: 'Rainbow', category: 'MEME', filter: 'hue-rotate(90deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(90deg)', illusion: 'NONE', accentColor: '#FF0000', status: 'AVAILABLE' },
  { id: 'm02', name: 'Matrix 2', description: 'Reloaded', category: 'MEME', filter: 'sepia(1) hue-rotate(90deg) saturate(4) contrast(1.5) brightness(0.6)', mobileFilter: 'hue-rotate(90deg)', illusion: 'SCANLINES', accentColor: '#22C55E', status: 'UNAVAILABLE' },
  { id: 'm03', name: 'HackerMan', description: '1337', category: 'MEME', filter: 'invert(1) contrast(2) grayscale(1)', mobileFilter: 'invert(1)', isLight: true, illusion: 'SCANLINES', accentColor: '#000000', status: 'AVAILABLE' },
  { id: 'm04', name: 'UwU', description: 'Soft', category: 'MEME', filter: 'sepia(0.5) hue-rotate(310deg) brightness(1.1)', mobileFilter: 'sepia(0.5)', illusion: 'NONE', accentColor: '#F9A8D4', status: 'UNAVAILABLE' },
  { id: 'm05', name: 'Laser Eyes', description: 'Bitcoin', category: 'MEME', filter: 'sepia(1) hue-rotate(10deg) saturate(4) drop-shadow(0 0 5px red)', mobileFilter: 'hue-rotate(10deg)', illusion: 'VIGNETTE', accentColor: '#EF4444', status: 'AVAILABLE' },
  { id: 'm06', name: 'Stonks', description: 'Up', category: 'MEME', filter: 'invert(1) hue-rotate(200deg)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#3B82F6', status: 'UNAVAILABLE' },
  { id: 'm07', name: 'Not Stonks', description: 'Down', category: 'MEME', filter: 'sepia(1) hue-rotate(340deg) saturate(3)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NONE', accentColor: '#EF4444', status: 'AVAILABLE' },
  { id: 'm08', name: 'This is Fine', description: 'Fire', category: 'MEME', filter: 'sepia(1) hue-rotate(20deg) saturate(3) brightness(1.2)', mobileFilter: 'hue-rotate(20deg)', illusion: 'NONE', accentColor: '#F97316', status: 'UNAVAILABLE' },
  { id: 'm09', name: 'NPC', description: 'Grey', category: 'MEME', filter: 'grayscale(1) contrast(0.8) brightness(1.1)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#9CA3AF', status: 'AVAILABLE' },
  { id: 'm10', name: 'Chad', description: 'Giga', category: 'MEME', filter: 'grayscale(1) contrast(1.5) brightness(1.1)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#FFFFFF', status: 'UNAVAILABLE' },
];


// --- THEME MERGING LOGIC ---
// Merge the base themes and the new themes into one comprehensive array
export const ALL_THEMES: Theme[] = [...BASE_THEMES, ...NEW_THEMES_DATA];
// The rest of the component logic will now reference ALL_THEMES instead of the hardcoded THEMES/BASE_THEMES.

// ============================================================================
// 2. CORE PRIMITIVES (No Change)
// ============================================================================
// ... (The rest of the unchanged core primitives like SHIMMER_GRADIENT_BLUE, ShimmerBorder, etc.)
const SHIMMER_GRADIENT_BLUE = "conic-gradient(from 90deg at 50% 50%, #00000000 0%, #2563eb 50%, #00000000 100%)";
const GLOBAL_STYLES = `
  .mac-gpu-accelerate { transform: translateZ(0); will-change: transform, opacity; backface-visibility: hidden; }
  @keyframes textShine { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
  .text-shimmer-effect {
    background: linear-gradient(to right, #3b82f6 20%, #ffffff 50%, #3b82f6 80%);
    background-size: 200% auto;
    color: #3b82f6;
    background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: textShine 3s linear infinite;
  }
  .text-glow { text-shadow: 0 0 10px rgba(37, 99, 235, 0.5), 0 0 20px rgba(37, 99, 235, 0.3); }
  
  /* SCROLLBAR & TOUCH UTILITIES */
  .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(59, 130, 246, 0.5); border-radius: 2px; }
  .custom-scrollbar::-webkit-scrollbar-track { background-color: rgba(0, 0, 0, 0.1); }
  
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  
  .snap-x-mandatory { scroll-snap-type: x mandatory; }
  .snap-center { scroll-snap-align: center; }
  
  /* Ensure smooth scrolling on iOS */
  .touch-scroll { -webkit-overflow-scrolling: touch; }
`;

export const ShimmerBorder = ({ active = true }: { active?: boolean }) => (
    <motion.div
        className="absolute inset-[-100%] pointer-events-none"
        animate={{ opacity: active ? 1 : 0, rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ background: SHIMMER_GRADIENT_BLUE }}
    />
);

export const ShimmerCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
    <div onClick={onClick} className={`relative group w-full rounded-2xl p-[1px] shadow-[0_0_30px_-10px_rgba(37,99,235,0.2)] overflow-hidden ${className}`}>
        <div className="absolute inset-0 rounded-2xl overflow-hidden"><ShimmerBorder active={true} /></div>
        <div className="relative bg-[#050505] rounded-[15px] h-full z-10 overflow-hidden backdrop-blur-xl">{children}</div>
    </div>
);

export const ShimmerButton = ({ onClick, children, className = "", icon: Icon, disabled = false }: { onClick?: () => void, children: React.ReactNode, className?: string, icon?: any, disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled} className={`group/btn relative w-full h-12 overflow-hidden rounded-xl transition-all ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-95' } ${className}`}>
        <ShimmerBorder active={!disabled} />
        <div className="absolute inset-[1px] bg-[#0a0a0a] group-hover/btn:bg-[#151515] transition-colors rounded-[11px] flex items-center justify-center gap-2">
            <span className="font-bold text-blue-500 text-[10px] md:text-xs tracking-[0.2em] uppercase text-glow">{children}</span>
            {Icon && <Icon className="w-4 h-4 text-blue-500 group-hover/btn:translate-x-1 transition-transform drop-shadow-[0_0_5px_rgba(59,130,246,1)]" />}
        </div>
    </button>
);

export const GlowText = ({ text, className = "" }: { text: string | number, className?: string }) => (
    <span className={`text-blue-200/90 text-glow font-mono ${className}`}>{text}</span>
);

export const GlobalSvgFilters = () => (
    <>
        <style jsx global>{GLOBAL_STYLES}</style>
        <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
            <defs>
                <filter id="chrome-liquid"><feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="warp" /><feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="30" in="SourceGraphic" in2="warp" /></filter>
                <filter id="gold-shine"><feSpecularLighting result="spec" specularConstant="1" specularExponent="20" lightingColor="#FFD700"><fePointLight x="-5000" y="-10000" z="20000" /></feSpecularLighting><feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" /></filter>
                <filter id="banknote"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" /><feDiffuseLighting in="noise" lightingColor="#85bb65" surfaceScale="2"><feDistantLight azimuth="45" elevation="60" /></feDiffuseLighting><feComposite operator="in" in2="SourceGraphic" /><feBlend mode="multiply" in="SourceGraphic" /></filter>
            </defs>
        </svg>
    </>
);


// ============================================================================
// 3. UI COMPONENTS (Updated to use ALL_THEMES and new categories)
// ============================================================================

// FIXED: Pointer events set to none to ensure clicking/scrolling through this layer works
export const IllusionLayer = ({ type = 'SCANLINES' }: { type?: string }) => (
    <div className="fixed inset-0 pointer-events-none z-[40] mix-blend-overlay opacity-30 select-none">
        <div className="w-full h-full" style={{
            background: type === 'SCANLINES' ? 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))' : 'none',
            backgroundSize: type === 'SCANLINES' ? '100% 2px, 3px 100%' : 'auto'
        }} />
    </div>
);

const MiniDashboardPreview = ({ color, isUnavailable }: { color: string, isUnavailable: boolean }) => (
    <div className={`w-full h-full p-2 flex flex-col gap-1 bg-black/50 ${isUnavailable ? 'opacity-50' : ''}`}>
      <div className="w-1/3 h-1 bg-white/20 rounded-full mb-1" />
      <div className="flex gap-1 h-full">
        <div className="w-1/2 h-full rounded border border-white/10 flex flex-col justify-center items-center">
          <div className="w-4 h-4 rounded-full mb-1" style={{ backgroundColor: color, opacity: 0.8 }} />
          <div className="w-8 h-1 bg-white/20 rounded-full" />
        </div>
        <div className="w-1/2 h-full flex flex-col gap-1">
           <div className="h-1/2 rounded border border-white/10 bg-white/5" />
           <div className="h-1/2 rounded border border-white/10" />
        </div>
      </div>
    </div>
);

// ----------------------------------------------------------------------------
// SoundSelector 
// ----------------------------------------------------------------------------
const SoundSelector = ({ active, onSelect }: { active: SoundProfile, onSelect: (id: SoundProfile) => void }) => {
    const packs: {id: SoundProfile, label: string, icon: any}[] = [
        { id: 'MECHANICAL', label: 'MECH', icon: Command },
        { id: 'SOROS', label: 'SOROS', icon: DollarSign },
        { id: 'SCI-FI', label: 'SCI-FI', icon: Zap },
        { id: 'SILENT', label: 'MUTE', icon: VolumeX },
    ];
    return (
        <div className="grid grid-cols-4 gap-2 md:gap-3 w-full shrink-0"> 
            {packs.map((pack) => (
                <button 
                    key={pack.id} 
                    onClick={() => onSelect(pack.id)} 
                    className={`h-10 text-[10px] md:text-[10px] font-bold tracking-wider uppercase rounded-lg border transition-all flex items-center justify-center
                        ${pack.id === active ? 'border-blue-500 bg-blue-900/30 text-blue-400' : 'border-white/10 text-gray-400 hover:border-blue-500/50'}
                    `}
                >
                    <span className="truncate px-1">{pack.label}</span>
                </button>
            ))}
        </div>
    );
};

// ----------------------------------------------------------------------------
// SetupThemeInterface (FIXED HEIGHT/OVERFLOW)
// ----------------------------------------------------------------------------
const SetupThemeInterface = ({ 
    activeThemeId, setActiveThemeId, activeCategory, setActiveCategory, 
    isMobile, currentSound, setCurrentSound, isMuted, setIsMuted,
    onSave, onExit
}: { 
    activeThemeId: string, setActiveThemeId: (id: string) => void,
    activeCategory: ThemeCategory, setActiveCategory: (cat: ThemeCategory) => void,
    isMobile: boolean,
    currentSound: SoundProfile, setCurrentSound: (s: SoundProfile) => void,
    isMuted: boolean, setIsMuted: (m: boolean) => void,
    onSave: (themeId: string) => void,
    onExit: () => void
}) => {
    // UPDATED: Use ALL_THEMES
    const filteredThemes = useMemo(() => ALL_THEMES.filter((t) => t.category === activeCategory), [activeCategory]);
    const allCategories = useMemo(() => Array.from(new Set(ALL_THEMES.map(t => t.category))), []);
    // UPDATED: Include new categories in the preferred display order
    const preferredOrder: ThemeCategory[] = ['SPECIAL', 'CRYPTO', 'SENTIMENT', 'ASSETS', 'CONCEPTS', 'LOCATION', 'ELEMENTAL', 'OPTICS', 'GLITCH', 'EXOTIC', 'MEME', 'HISTORICAL'];
    const sortedCategories = preferredOrder.filter(cat => allCategories.includes(cat));
    // UPDATED: Use ALL_THEMES
    const currentTheme = ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];

    // UPDATED: Added icons for new categories
    const getCategoryIcon = (cat: ThemeCategory) => {
        if (cat === 'SPECIAL') return <Zap className="w-3 h-3 text-yellow-500" />;
        if (cat === 'CRYPTO') return <DollarSign className="w-3 h-3" />;
        if (cat === 'SENTIMENT') return <Activity className="w-3 h-3" />;
        if (cat === 'ASSETS') return <Shield className="w-3 h-3" />;
        if (cat === 'HISTORICAL') return <Lock className="w-3 h-3" />;
        if (cat === 'OPTICS') return <Monitor className="w-3 h-3" />;
        if (cat === 'EXOTIC') return <Hash className="w-3 h-3" />;
        if (cat === 'LOCATION') return <MapPin className="w-3 h-3" />;
        if (cat === 'ELEMENTAL') return <Sun className="w-3 h-3" />;
        if (cat === 'CONCEPTS') return <Brain className="w-3 h-3" />;
        if (cat === 'MEME') return <Smile className="w-3 h-3" />;
        return <Layers className="w-3 h-3" />;
    };

    return (
        // REMOVED fixed h-full/lg:h-full here to allow content to dictate size, letting the parent Modal scroll
        <div className="flex flex-col lg:flex-row w-full border border-white/10 rounded-lg bg-black/40"> 
            
            {/* LEFT RAIL (Desktop) / TOP SCROLL (Mobile) - CATEGORY SELECTION */}
            <div className="
                w-full lg:w-48 bg-[#000000]/80 
                border-b lg:border-b-0 lg:border-r border-white/10 flex-shrink-0 
                flex flex-row lg:flex-col 
                overflow-x-auto lg:overflow-y-auto 
                touch-scroll custom-scrollbar no-scrollbar
            ">
                <div className="flex flex-row lg:flex-col p-2 gap-2 lg:gap-1 min-w-max lg:min-w-0">
                    <div className="hidden lg:flex items-center gap-2 px-4 py-3 text-blue-500 font-bold text-xs tracking-widest border-b border-white/10 mb-2">
                        <Layers className="w-3 h-3" /> CATEGORIES
                    </div>
                    {sortedCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`
                                flex items-center gap-2 flex-shrink-0 
                                lg:w-full px-4 py-3 rounded-md
                                text-[10px] md:text-xs font-bold tracking-wider uppercase transition-all
                                whitespace-nowrap
                                ${cat === activeCategory 
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                                    : 'text-gray-500 hover:bg-white/5 border border-transparent bg-white/5 lg:bg-transparent'
                                }
                            `}
                        >
                            {getCategoryIcon(cat)} {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT PANEL: CONTENT */}
            {/* REMOVED h-full and overflow-y-hidden, content will now push the parent modal scrollbar */}
            <div className="flex-1 flex flex-col"> 
                <div className="flex-1 p-4 md:p-6 flex flex-col gap-6">
                     
                     {/* 1. AUDIO PROFILE SECTION */}
                    <div className="shrink-0">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                            <Volume2 className="w-3 h-3 text-blue-500"/> AUDIO_PROFILE
                        </h3>
                        <SoundSelector 
                            active={currentSound} 
                            onSelect={(s) => { 
                                setCurrentSound(s); 
                                if (s === 'SILENT') setIsMuted(true); 
                                else if (isMuted) setIsMuted(false); 
                            }} 
                        />
                    </div>

                    {/* 2. VISUAL INTERFACE SECTION (Themes) */}
                    <div className="flex-1 pb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                            <Monitor className="w-3 h-3 text-blue-500"/> VISUAL_INTERFACE: <GlowText text={currentTheme.name.toUpperCase()} className="text-blue-300 ml-1"/>
                        </h3>
                        
                        {/* Grid adapts to screen size */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {filteredThemes.map((theme) => {
                                const isUnavailable = theme.status === 'UNAVAILABLE';
                                
                                return (
                                    <button
                                        key={theme.id}
                                        onClick={() => !isUnavailable && setActiveThemeId(theme.id)}
                                        disabled={isUnavailable}
                                        className={`
                                            relative group text-left rounded-xl overflow-hidden border transition-all duration-300 w-full aspect-video shrink-0
                                            ${isUnavailable ? 'opacity-40 cursor-not-allowed border-white/5 grayscale'
                                            : activeThemeId === theme.id ? 'border-blue-500 ring-1 ring-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.15)]' : 'border-white/10 hover:border-white/30 bg-black'}
                                        `}
                                    >
                                        {isUnavailable && (
                                            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-[2px]">
                                                <Lock className="w-5 h-5 text-gray-500" />
                                            </div>
                                        )}
                                        {/* Preview */}
                                        <div className="w-full h-full relative overflow-hidden bg-gray-950">
                                            <div 
                                                className={`w-full h-full absolute inset-0 transition-all duration-500 ${activeThemeId === theme.id ? 'scale-105' : 'group-hover:scale-105'}`}
                                                style={{ filter: isMobile ? theme.mobileFilter : theme.filter }}
                                            >
                                                <MiniDashboardPreview color={theme.accentColor || '#3b82f6'} isUnavailable={isUnavailable} />
                                            </div>
                                        </div>
                                        
                                        {/* Label */}
                                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/90 to-transparent flex items-end justify-between">
                                            <div>
                                                <span className={`block text-[10px] font-bold uppercase tracking-wider ${activeThemeId === theme.id ? 'text-white text-glow' : 'text-gray-400'}`}>{theme.name}</span>
                                                <span className="text-[8px] text-gray-600 font-mono">{theme.description}</span>
                                            </div>
                                            {activeThemeId === theme.id && <div className="bg-blue-500 rounded-full p-0.5"><Check className="w-2 h-2 text-black" /></div>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
                {/* Modal Footer/Save Bar */}
                <div className="shrink-0 p-4 md:p-6 border-t border-white/10 bg-black/50">
                    <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                        <ShimmerButton icon={Check} onClick={() => onSave(activeThemeId)} className="h-10 text-xs text-green-500">
                            APPLY & CLOSE
                        </ShimmerButton>
                        <ShimmerButton icon={X} onClick={onExit} className="h-10 text-xs text-red-500/80">
                            CANCEL
                        </ShimmerButton>
                    </div>
                </div>
            </div>
        </div>
    );
};


// ----------------------------------------------------------------------------
// NEW COMPONENT: ThemeConfigModal (Minor adjustment to rely on outer scroll)
// ----------------------------------------------------------------------------
const ThemeConfigModal = ({ 
    isOpen, onClose, onSave, initialThemeId, 
    initialCategory, initialSound, initialMuted,
    isMobile,
}: {
    isOpen: boolean,
    onClose: () => void,
    onSave: (themeId: string, sound: SoundProfile, muted: boolean) => void,
    initialThemeId: string,
    initialCategory: ThemeCategory,
    initialSound: SoundProfile,
    initialMuted: boolean,
    isMobile: boolean
}) => {
    // State is managed locally while the modal is open
    const [tempThemeId, setTempThemeId] = useState(initialThemeId);
    const [tempCategory, setTempCategory] = useState(initialCategory);
    const [tempSound, setTempSound] = useState(initialSound);
    const [tempMuted, setTempMuted] = useState(initialMuted);
    
    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setTempThemeId(initialThemeId);
            setTempCategory(initialCategory);
            setTempSound(initialSound);
            setTempMuted(initialMuted);
        }
    }, [isOpen, initialThemeId, initialCategory, initialSound, initialMuted]);

    const handleApply = () => {
        onSave(tempThemeId, tempSound, tempMuted);
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    // UPDATED: Use ALL_THEMES
    const currentTheme = useMemo(() => ALL_THEMES.find(t => t.id === tempThemeId) || ALL_THEMES[0], [tempThemeId]);

    return (
        <AnimatePresence>
            {isOpen && (
                // Modal Backdrop - High Z-index. Use overflow-y-auto here for the full viewport scroll.
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md font-sans overflow-y-auto custom-scrollbar touch-scroll flex justify-center items-center"
                    onClick={handleCancel} // Close on backdrop click
                >
                    {/* Modal Content - Higher Z-index and prevents click-through. Use a defined max-width/height. */}
                    <motion.div 
                        initial={{ scale: isMobile ? 1 : 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: isMobile ? 1 : 0.95, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        // Max height and width on desktop
                        className="w-full h-full lg:max-w-7xl lg:max-h-[90vh] bg-[#050505] rounded-xl overflow-hidden border border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.5)] flex flex-col my-4 mx-4 lg:m-0"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                        style={{ 
                            // Apply theme filter to the whole modal content for live preview
                            filter: isMobile ? currentTheme.mobileFilter : currentTheme.filter, 
                            transition: 'filter 0.5s ease-in-out'
                        }}
                    >
                        {/* Modal Header */}
                        <div className="shrink-0 p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-black/70">
                            <h2 className="text-lg md:text-xl font-bold tracking-widest text-shimmer-effect uppercase flex items-center gap-3">
                                <Settings className="w-5 h-5 text-blue-500" /> 
                                SYNTHESIS_OS CONFIGURATION
                            </h2>
                            <button onClick={handleCancel} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body - Main scrolling container */}
                        {/* The body container now takes all remaining space (flex-1) and forces internal scrolling */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar touch-scroll p-0"> 
                            {/* SetupThemeInterface content dictates the scroll height */}
                            <SetupThemeInterface 
                                activeThemeId={tempThemeId} setActiveThemeId={setTempThemeId}
                                activeCategory={tempCategory} setActiveCategory={setTempCategory}
                                isMobile={isMobile} currentSound={tempSound} setCurrentSound={setTempSound}
                                isMuted={tempMuted} setIsMuted={setTempMuted}
                                // Pass apply/cancel functions to the internal component to handle button presses
                                onSave={handleApply} 
                                onExit={handleCancel}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// ----------------------------------------------------------------------------
// HELPER: Simulated Stats Card (No Change)
// ----------------------------------------------------------------------------

const SimulatedStatsCard = ({ label, value, icon: Icon }: { label: string, value: string, icon: any }) => (
    <ShimmerCard className="h-16 md:h-20 shrink-0">
        <div className="p-3 flex items-center justify-between h-full">
            <div className="flex flex-col">
                <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-gray-500">{label}</span>
                <span className="text-base md:text-lg font-bold text-white font-mono">{value}</span>
            </div>
            <Icon className="w-4 h-4 md:w-5 md:h-5 text-blue-400/50" />
        </div>
    </ShimmerCard>
);

// ----------------------------------------------------------------------------
// FixedBottomSaveBar (No Change - preserved for general dashboard actions)
// ----------------------------------------------------------------------------
const FixedBottomSaveBar = ({ activeThemeId, onSaveTheme, onExit, isMobileMenuOpen }: { 
    activeThemeId: string, 
    onSaveTheme: (themeId: string) => void,
    onExit: () => void,
    isMobileMenuOpen: boolean
}) => {
    return (
        <AnimatePresence>
            {!isMobileMenuOpen && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    // FIXED: z-50 to float above almost everything, fixed bottom-0
                    className="fixed bottom-0 left-0 right-0 z-50 lg:hidden p-4 bg-black/90 backdrop-blur-md border-t border-blue-500/30 shadow-[0_-5px_30px_rgba(37,99,235,0.2)]"
                >
                    <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                        {/* NOTE: This bar is for general actions now, not necessarily theme saving */}
                        <ShimmerButton icon={RefreshCw} onClick={() => alert("Simulated Refresh...")} className="h-10 text-xs text-yellow-500">
                            REFRESH DATA
                        </ShimmerButton>
                        <ShimmerButton icon={ArrowRight} onClick={onExit} className="h-10 text-xs">
                            EXIT
                        </ShimmerButton>
                    </div>
                    {/* Safe area padding for iPhone home bar */}
                    <div className="h-2 w-full" /> 
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ----------------------------------------------------------------------------
// ControlPanel (Sidebar Content - Desktop actions remain here, modified for modal trigger)
// ----------------------------------------------------------------------------
const ControlPanel = ({ 
    activeThemeId, onAction, onSaveTheme, onOpenConfig
}: {
    activeThemeId: string, 
    onAction: (action: string) => void,
    onSaveTheme: (themeId: string) => void,
    onOpenConfig: () => void // New prop to open the modal
}) => {
    // Simulated values for the sidebar
    const simulatedTraders = '18,451';
    const simulatedAssets = '$2.13B';

    return (
        <div className="flex flex-col h-full gap-4 overflow-y-auto custom-scrollbar">
            {/* TOP: CONFIG BUTTON CARD (New placement for modal trigger) */}
            <ShimmerCard className="h-24 md:h-28 shrink-0 cursor-pointer group" onClick={onOpenConfig}>
                <div className="p-4 md:p-5 flex flex-col justify-center h-full">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-sm tracking-wider text-blue-400 group-hover:text-blue-200 transition-colors">THEME/AUDIO CONFIG</span>
                        <Settings className="w-5 h-5 text-blue-500 group-hover:rotate-45 transition-transform" />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                        <GlowText text="Open Full Setup" className="text-[10px] md:text-xs"/>
                        <ArrowRight className="w-3 h-3 text-blue-500"/>
                    </div>
                </div>
            </ShimmerCard>

            {/* BOTTOM: QUICK OPS & SIMULATED STATS */}
            <ShimmerCard className="shrink-0">
                <div className="p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-yellow-400" /> <span className="font-bold text-xs tracking-wider text-gray-200">QUICK OPS & STATS</span>
                    </div>
                    
                    {/* Simulated Stats Section */}
                    <div className="grid grid-cols-2 gap-2 mb-4 pt-1 border-b border-white/5 pb-4">
                        <SimulatedStatsCard label="Simulated Traders" value={simulatedTraders} icon={Activity} />
                        <SimulatedStatsCard label="Simulated Assets" value={simulatedAssets} icon={DollarSign} />
                    </div>

                    {/* Action Buttons Section - Visible only on LG screens (Desktop Sidebar) */}
                    <div className="hidden lg:grid grid-cols-1 gap-3"> 
                        {/* Desktop Save/Exit is preserved for quick actions if needed, though full config is in modal */}
                        <ShimmerButton icon={Check} onClick={() => onSaveTheme(activeThemeId)} className="h-10 text-xs text-green-500">APPLY CURRENT THEME</ShimmerButton>
                        <ShimmerButton icon={ArrowRight} onClick={() => onAction('exit')} className="h-10 text-xs">EXIT TO DASHBOARD</ShimmerButton>
                    </div>
                </div>
            </ShimmerCard>
        </div>
    );
};


// ============================================================================
// 4. DATA ENGINES (No Change)
// ============================================================================

const TARGET_PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT'];
const LOWER_CASE_PAIRS = TARGET_PAIRS.map(p => p.toLowerCase());

export const useBinanceTickers = () => {
  const [tickers, setTickers] = useState<Record<string, TickerData>>({});
  const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let isMounted = true; 
    const streams = LOWER_CASE_PAIRS.map(p => `${p}@miniTicker`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`;
    if (isMounted) setStatus('CONNECTING');
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.onopen = () => { if (isMounted) setStatus('CONNECTED'); };
    const handleMessage = (event: MessageEvent) => { 
      const data = JSON.parse(event.data);
      if (isMounted) {
          setTickers(prev => {
            const symbol = data.s; const currentPrice = parseFloat(data.c || '0').toFixed(2); 
            return { ...prev, [symbol]: { symbol: data.s, price: currentPrice, percentChange: parseFloat(data.P || '0').toFixed(2), prevPrice: prev[symbol] ? prev[symbol].price : currentPrice } };
          });
      }
    };
    wsRef.current.onmessage = handleMessage;
    wsRef.current.onclose = () => { if (isMounted) setStatus('DISCONNECTED'); };
    wsRef.current.onerror = () => { if (isMounted) setStatus('DISCONNECTED'); };
    return () => { isMounted = false; if (wsRef.current) wsRef.current.close(); };
  }, []);
  return { tickers, status };
};

export const useBinanceChart = (symbol: string = 'BTCUSDT') => {
    const [chartData, setChartData] = useState<number[]>([]); 
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=24`);
                if (!res.ok) throw new Error("Binance API fetch failed");
                const data = await res.json();
                setChartData(data.map((d: any[]) => parseFloat(d[4])));
            } catch (e) { setChartData([]); }
        };
        fetchHistory();
        const intervalId = setInterval(fetchHistory, 3600000); 
        return () => clearInterval(intervalId);
    }, [symbol]);
    return chartData;
};

const LivePriceDisplay = ({ price, prevPrice }: { price: string, prevPrice: string }) => {
  const direction = parseFloat(price) > parseFloat(prevPrice) ? 'up' : parseFloat(price) < parseFloat(prevPrice) ? 'down' : 'neutral';
  return (
    <span className={`transition-colors duration-300 ${direction === 'up' ? 'text-green-400' : direction === 'down' ? 'text-red-400' : 'text-white'}`}>
      ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
};

const LiveTickerTape = ({ tickers }: { tickers: Record<string, TickerData> }) => {
  const tickerList = TARGET_PAIRS.map(symbol => tickers[symbol]).filter(Boolean);
  const displayList = tickerList.length > 0 ? tickerList : TARGET_PAIRS.map(p => ({ symbol: p, price: '---', percentChange: '0.00', prevPrice: '0' }));
  return (
    <div className="relative w-full h-8 md:h-10 shrink-0 z-50 bg-black border-b border-white/10">
      <div className="w-full h-full bg-neutral-950/80 backdrop-blur-sm flex items-center overflow-hidden">
        <motion.div className="flex whitespace-nowrap" animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }}>
          {[...displayList, ...displayList, ...displayList].map((t, i) => (
             <div key={`${t.symbol}-${i}`} className="flex items-center gap-3 px-6 border-r border-white/10 h-10">
                <span className="font-bold text-blue-500 text-[10px] md:text-xs">{t.symbol.replace('USDT', '')}</span>
                <span className="text-white font-mono text-[10px] md:text-xs">{t.price === '---' ? t.price : `$${t.price}`}</span>
                <span className={`text-[10px] ${parseFloat(t.percentChange) >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{parseFloat(t.percentChange) > 0 ? '+' : ''}{t.percentChange}%</span>
             </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MODIFIED WelcomeBackModal (Scrollable fix applied)
// ----------------------------------------------------------------------------
export const WelcomeBackModal = ({ isOpen, onContinue, onSkip }: { isOpen: boolean, onContinue: () => void, onSkip: () => void }) => (
    <AnimatePresence>
        {isOpen && (
            // FIX: Added overflow-y-auto to the backdrop and used items-start to enable content scrolling on small devices.
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                className="fixed inset-0 z-[100] flex items-start justify-center bg-black/95 backdrop-blur-md p-4 md:p-6 font-sans overflow-y-auto"
            >
                {/* Wrap content and add top/bottom margin for centering effect on large screens */}
                <div className="max-w-lg w-full mt-[10vh] mb-[10vh] flex-shrink-0"> 
                    <ShimmerCard className="p-0">
                        <div className="px-6 md:px-8 py-8 md:py-10 flex flex-col items-center justify-center text-center">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-shimmer-effect uppercase">Welcome Back</h2>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f172a] border border-blue-900/30 rounded-full mb-10 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>
                                <GlowText text="TERMINAL DETECTED" className="text-[10px] font-bold" />
                            </div>
                            <ShimmerButton onClick={onContinue} icon={ArrowRight}>CONTINUE SETUP</ShimmerButton>
                            <button onClick={onSkip} className="mt-6 flex items-center gap-2 group">
                                <GlowText text="Skip to Dashboard" className="text-xs group-hover:text-white transition-colors" />
                                <SkipForward className="w-3 h-3 text-blue-500 group-hover:text-white" />
                            </button>
                        </div>
                    </ShimmerCard>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

export const SupportWidget = () => (
    // FIXED: Adjusted z-index to be high but below modals
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[45]">
        <button className="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#050505] border border-blue-900/50 shadow-[0_0_30px_rgba(37,99,235,0.4)] overflow-hidden group hover:scale-110 transition-transform">
            <ShimmerBorder active={true} />
            <div className="absolute inset-[2px] rounded-full bg-black flex items-center justify-center z-10">
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-500 text-glow" />
            </div>
        </button>
    </div>
);

// ============================================================================
// 5. MAIN PAGE COMPONENT (Refactored to use Modal)
// ============================================================================

export default function FixedThemeConfigurator({ initialThemeId, onThemeChange }: { initialThemeId: string, onThemeChange: (themeId: string) => void }) {
    // --- HOOKS ---
    const { tickers, status: wsStatus } = useBinanceTickers();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const chartData = useBinanceChart('BTCUSDT'); 
    
    // --- STATE ---
    const [activeThemeId, setActiveThemeId] = useState<string>(initialThemeId);
    const [showWelcome, setShowWelcome] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
    const [isMuted, setIsMuted] = useState(true);
    // Initial state for config needs to be saved
    const [activeCategory, setActiveCategory] = useState<ThemeCategory>('SENTIMENT'); 
    const [currentSound, setCurrentSound] = useState<SoundProfile>('MECHANICAL');
    const [isMobile, setIsMobile] = useState(false); 
    // NEW: Modal State
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    
  const audioRef = useRef<HTMLAudioElement | null>(null);

    // --- DERIVED ---
    // UPDATED: Use ALL_THEMES
    const activeTheme = useMemo(() => ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0], [activeThemeId]);
    const btcData = tickers['BTCUSDT'] || { price: '0.00', percentChange: '0.00', prevPrice: '0' };
    const ethData = tickers['ETHUSDT'] || { price: '0.00', percentChange: '0.00', prevPrice: '0' };
    const portfolioValue = useMemo(() => (parseFloat(btcData.price) * 0.45) + (parseFloat(ethData.price) * 12.5) + 15240, [btcData.price, ethData.price]);
    
    // --- HANDLERS ---
    const handleSaveTheme = useCallback((themeId: string, sound: SoundProfile = currentSound, muted: boolean = isMuted) => {
        setActiveThemeId(themeId); 
        onThemeChange(themeId); 
        setCurrentSound(sound);
        setIsMuted(muted);
        setIsMobileMenuOpen(false); // Close mobile menu if open
        setIsConfigModalOpen(false); // Close modal if open
    }, [onThemeChange, currentSound, isMuted]);
    
    const handleExit = useCallback(() => {
        // In a real application, you would navigate away here.
        alert("Exiting to Dashboard... (Simulated Action)");
    }, []);

    // --- EFFECTS ---
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024); 
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if(audioRef.current) {
            audioRef.current.volume = 0.15;
            // NOTE: Ensure you have an actual audio file at /assets/ambient-drone.mp3
            !isMuted ? audioRef.current.play().catch(() => setIsMuted(true)) : audioRef.current.pause();
        }
    }, [isMuted]);

    return (
        // FIXED: pb-32 adds HUGE padding on mobile to ensure the fixed bottom bar never covers content. 
        // FIXED: overflow-x-hidden prevents accidental horizontal scrolling of the body.
        <main 
            className="relative min-h-screen bg-black font-sans selection:bg-blue-500/30 text-white pb-32 lg:pb-10 overflow-x-hidden"
            // Filter is applied to the entire main content
            style={{ filter: isMobile ? activeTheme.mobileFilter : activeTheme.filter, transition: 'filter 0.5s ease-in-out' }}
        >
            <GlobalSvgFilters />
            {/* FIXED: pointer-events-none ensures this layer never hijacks clicks or scrolls */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-50 mix-blend-overlay overflow-hidden"><IllusionLayer type={activeTheme.illusion} /></div>
            <audio ref={audioRef} loop src="/assets/ambient-drone.mp3" />

            {/* --- HEADER --- */}
            <header className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/10">
                <LiveTickerTape tickers={tickers} />
                <div className="h-12 md:h-14 flex items-center px-4 md:px-6 justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-blue-500 font-bold tracking-[0.2em] text-xs md:text-base">SYNTHESIS_OS</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-6">
                        <GlowText text={activeTheme.name.toUpperCase()} className="text-xs tracking-wider" />
                        <div className="flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10">
                            <Wifi className={`w-3 h-3 ${wsStatus === 'CONNECTED' ? 'text-green-500' : 'text-red-500'}`} />
                            <span className="text-[10px] font-mono text-gray-400">UPLINK: {wsStatus}</span>
                        </div>
                    </div>
                    {/* On mobile, use the menu button to open the config modal directly */}
                    <button onClick={() => setIsConfigModalOpen(true)} className="lg:hidden p-1 text-white">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* --- MOBILE DRAWER (REMOVED - Use Modal instead) --- 
            <AnimatePresence>...</AnimatePresence>
            */}

            <WelcomeBackModal isOpen={showWelcome} onContinue={() => { setShowWelcome(false); setIsMuted(false); }} onSkip={() => setShowWelcome(false)} />

            {/* --- MAIN DASHBOARD GRID --- */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-28 md:pt-32 px-4 md:px-6 min-h-[calc(100vh-8rem)] flex flex-col z-10 relative max-w-[1600px] mx-auto" style={{ filter: showWelcome ? 'blur(10px)' : 'none' }}>
                <div className="mb-4 md:mb-6 shrink-0">
                    <h1 className="text-2xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">COMMAND DECK</h1>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 min-h-0">
                    
                    {/* LEFT SECTION (9 COLUMNS on Desktop, Full width on Mobile) */}
                    <div className="lg:col-span-9 flex flex-col gap-4 md:gap-6 min-h-0">
                        {/* KPI Cards - Horizontal Scroll on Mobile (No Change) */}
                        <div className="flex overflow-x-auto gap-4 shrink-0 pb-2 md:pb-0 snap-x-mandatory no-scrollbar md:grid md:grid-cols-3 touch-scroll">
                            <div className="snap-center w-[85vw] md:w-auto flex-none">
                                <ShimmerCard className="h-32 md:h-40 w-full">
                                    <div className="p-4 md:p-6 flex flex-col justify-between h-full">
                                        <div className="flex justify-between items-start"><div className="p-1.5 rounded bg-blue-500/10 border border-blue-500/20"><TrendingUp className="w-4 h-4 text-blue-400" /></div><span className="text-green-400 text-xs font-bold">+4.2%</span></div>
                                        <div><div className="text-gray-500 text-[9px] uppercase tracking-widest mb-1">TOTAL TRADED</div><div className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-white"><LivePriceDisplay price={portfolioValue.toFixed(2)} prevPrice={(portfolioValue - 100).toString()} /></div></div>
                                    </div>
                                </ShimmerCard>
                            </div>
                            <div className="snap-center w-[85vw] md:w-auto flex-none">
                                <ShimmerCard className="h-32 md:h-40 w-full">
                                    <div className="p-4 md:p-6 flex flex-col justify-between h-full">
                                        <div className="flex justify-between items-start"><div className="flex items-center gap-2"><div className="p-1.5 rounded bg-[#F7931A]/20 border border-[#F7931A]/30"><DollarSign className="w-4 h-4 text-[#F7931A]" /></div><span className="font-bold text-xs">BTC</span></div><span className={`text-[10px] px-1.5 py-0.5 rounded ${parseFloat(btcData.percentChange) >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{btcData.percentChange}%</span></div>
                                        <div className="text-2xl md:text-3xl font-bold font-mono tracking-tight mt-auto"><LivePriceDisplay price={btcData.price} prevPrice={btcData.prevPrice} /></div>
                                    </div>
                                </ShimmerCard>
                            </div>
                            <div className="snap-center w-[85vw] md:w-auto flex-none">
                                <ShimmerCard className="h-32 md:h-40 w-full">
                                    <div className="p-4 md:p-6 flex flex-col justify-between h-full">
                                        <div className="flex justify-between items-start"><div className="flex items-center gap-2"><div className="p-1.5 rounded bg-blue-500/20 border border-blue-500/30"><Zap className="w-4 h-4 text-blue-400" /></div><span className="font-bold text-xs">ETH</span></div><span className={`text-[10px] px-1.5 py-0.5 rounded ${parseFloat(ethData.percentChange) >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{ethData.percentChange}%</span></div>
                                        <div className="text-2xl md:text-3xl font-bold font-mono tracking-tight mt-auto"><LivePriceDisplay price={ethData.price} prevPrice={ethData.prevPrice} /></div>
                                    </div>
                                </ShimmerCard>
                            </div>
                        </div>

                        {/* BIG THEME CONFIG REPLACED WITH A PLACEHOLDER/CHART */}
                        <div className="flex-1 w-full">
                            <ShimmerCard className="h-full">
                                <div className="p-5 h-full flex flex-col w-full items-center justify-center">
                                    <h2 className="text-xl font-bold text-blue-500 mb-2">Primary Chart/Data View</h2>
                                    <p className="text-gray-500 text-sm">Theme configuration is now accessed via the **Modal**</p>
                                    <ShimmerButton onClick={() => setIsConfigModalOpen(true)} icon={Settings} className="mt-6 max-w-sm">OPEN FULL CONFIGURATION</ShimmerButton>
                                </div>
                            </ShimmerCard>
                        </div>
                    </div>

                    {/* RIGHT SECTION (Sidebar on Desktop) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ duration: 0.5, delay: 0.4 }} 
                        className="hidden lg:flex flex-col w-full lg:w-auto lg:col-span-3 h-full min-h-0 gap-4"
                    >
                         <ControlPanel 
                            activeThemeId={activeThemeId} 
                            onAction={handleExit} 
                            onSaveTheme={(id) => handleSaveTheme(id)} // Use simplified save function
                            onOpenConfig={() => setIsConfigModalOpen(true)} // Modal Trigger
                         />
                    </motion.div>

                </div>
            </motion.div>
            
            {/* --- FIXED BOTTOM BAR (MOBILE ONLY) --- */}
            <FixedBottomSaveBar
                activeThemeId={activeThemeId}
                onSaveTheme={(id) => handleSaveTheme(id)}
                onExit={handleExit}
                isMobileMenuOpen={isMobileMenuOpen}
            />
            
            <SupportWidget />

            {/* --- THEME CONFIG MODAL (The new core feature) --- */}
            <ThemeConfigModal 
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                onSave={handleSaveTheme}
                initialThemeId={activeThemeId}
                initialCategory={activeCategory}
                initialSound={currentSound}
                initialMuted={isMuted}
                isMobile={isMobile}
            />
        </main>
    );
}