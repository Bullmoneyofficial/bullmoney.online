export type ThemeCategory = 
  | 'SPECIAL' 
  | 'SENTIMENT' 
  | 'ASSETS' 
  | 'CRYPTO' 
  | 'HISTORICAL' 
  | 'OPTICS' 
  | 'GLITCH' 
  | 'EXOTIC' 
  | 'LOCATION' 
  | 'ELEMENTAL' 
  | 'CONCEPTS' 
  | 'MEME';

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
};

export const THEMES: Theme[] = [
  // --- SPECIAL ---
  { 
    id: 'bull-money-special', 
    name: 'Bull Money Chrome', 
    description: 'Premium Logic', 
    category: 'SPECIAL', 
    // FIXED: Removed url() distortion. Added high contrast + low saturation for metallic look.
    filter: 'saturate(1.5) contrast(1.2) brightness(1.1) hue-rotate(10deg) sepia(0.1)', 
    mobileFilter: 'saturate(1.5) contrast(1.2)', 
    illusion: 'NONE', 
    accentColor: '#00FFFF' 
  },

  // --- CRYPTO EXPANSION (Altcoins & L1s) ---
  { id: 'c21', name: 'Tron Legacy', description: 'Justin Sun', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(180deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(180deg)', illusion: 'SCANLINES', accentColor: '#FF0013' },
  { id: 'c22', name: 'Stellar Lumens', description: 'XLM', category: 'CRYPTO', filter: 'grayscale(1) brightness(1.2) sepia(0.2)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#CFD8DC' },
  { id: 'c23', name: 'VeChain Thor', description: 'Supply Chain', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(190deg) saturate(2) brightness(1.1)', mobileFilter: 'hue-rotate(190deg)', illusion: 'NONE', accentColor: '#00C2FF' },
  { id: 'c24', name: 'Algorand', description: 'Pure PoS', category: 'CRYPTO', filter: 'invert(1) hue-rotate(180deg) brightness(0.8)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#000000' },
  { id: 'c25', name: 'Tezos', description: 'Baking', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(200deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#2C7DF7' },
  { id: 'c26', name: 'EOS', description: 'Dan Larimer', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(340deg) saturate(1.5)', mobileFilter: 'hue-rotate(340deg)', illusion: 'VIGNETTE', accentColor: '#D1D5DB' },
  { id: 'c27', name: 'Monero Clean', description: 'XMR White', category: 'CRYPTO', filter: 'grayscale(1) brightness(1.5) contrast(1.1)', mobileFilter: 'grayscale(1)', isLight: true, illusion: 'NONE', accentColor: '#FF6600' },
  { id: 'c28', name: 'Aptos', description: 'Move', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(320deg) saturate(1) brightness(0.9)', mobileFilter: 'hue-rotate(320deg)', illusion: 'NONE', accentColor: '#1F2937' },
  { id: 'c29', name: 'Sui Water', description: 'Fluid', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(170deg) saturate(3) brightness(1.1)', mobileFilter: 'hue-rotate(170deg)', illusion: 'NONE', accentColor: '#6BA1FF' },
  { id: 'c30', name: 'Arbitrum', description: 'Optimistic', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(200deg) saturate(2) contrast(1.2)', mobileFilter: 'hue-rotate(200deg)', illusion: 'SCANLINES', accentColor: '#2D374B' },
  { id: 'c31', name: 'Optimism', description: 'OP Stack', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(320deg) saturate(4) brightness(1.1)', mobileFilter: 'hue-rotate(320deg)', illusion: 'NONE', accentColor: '#FF0420' },
  { id: 'c32', name: 'Base', description: 'Coinbase', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(210deg) saturate(3) contrast(1.1)', mobileFilter: 'hue-rotate(210deg)', illusion: 'NONE', accentColor: '#0052FF' },
  { id: 'c33', name: 'Celestia', description: 'Modular', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(260deg) saturate(3) brightness(1.2)', mobileFilter: 'hue-rotate(260deg)', illusion: 'NOISE', accentColor: '#7B2BF9' },
  { id: 'c34', name: 'Injective', description: 'Finance', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(160deg) saturate(2) contrast(1.3)', mobileFilter: 'hue-rotate(160deg)', illusion: 'SCANLINES', accentColor: '#00F2FF' },
  { id: 'c35', name: 'Sei', description: 'Fastest', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(340deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NONE', accentColor: '#9D1F32' },
  { id: 'c36', name: 'Render', description: 'GPU', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(320deg) saturate(3) contrast(1.5)', mobileFilter: 'hue-rotate(320deg)', illusion: 'SCANLINES', accentColor: '#FF4D4D' },
  { id: 'c37', name: 'Filecoin', description: 'Storage', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(180deg) saturate(1.5) brightness(0.8)', mobileFilter: 'hue-rotate(180deg)', illusion: 'NONE', accentColor: '#0090FF' },
  { id: 'c38', name: 'Arweave', description: 'Permaweb', category: 'CRYPTO', filter: 'invert(1) grayscale(1) brightness(0.8)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NOISE', accentColor: '#000000' },
  { id: 'c39', name: 'Hedera', description: 'Hashgraph', category: 'CRYPTO', filter: 'grayscale(1) contrast(1.5) brightness(0.6)', mobileFilter: 'grayscale(1)', illusion: 'SCANLINES', accentColor: '#4A4A4A' },
  { id: 'c40', name: 'Thorchain', description: 'Rune', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(140deg) saturate(3) brightness(1.1)', mobileFilter: 'hue-rotate(140deg)', illusion: 'NONE', accentColor: '#33FF99' },
  { id: 'c41', name: 'MakerDAO', description: 'DAI', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(150deg) saturate(2) brightness(0.9)', mobileFilter: 'hue-rotate(150deg)', illusion: 'NONE', accentColor: '#1AAB9B' },
  { id: 'c42', name: 'Aave Ghost', description: 'Lending', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(270deg) saturate(1.5) contrast(1.1)', mobileFilter: 'hue-rotate(270deg)', illusion: 'VIGNETTE', accentColor: '#B6509E' },
  { id: 'c43', name: 'Compound', description: 'Interest', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(120deg) saturate(2) brightness(1.2)', mobileFilter: 'hue-rotate(120deg)', illusion: 'NONE', accentColor: '#00D395' },
  { id: 'c44', name: 'Curve', description: 'Stable', category: 'CRYPTO', filter: 'hue-rotate(45deg) contrast(1.5) brightness(0.6)', mobileFilter: 'hue-rotate(45deg)', illusion: 'GLITCH', accentColor: '#FF0000' },
  { id: 'c45', name: 'Lido', description: 'Staked', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(190deg) saturate(2) brightness(1.3)', mobileFilter: 'hue-rotate(190deg)', illusion: 'NONE', accentColor: '#00A3FF' },
  { id: 'c46', name: 'Bonk', description: 'Dog Coin', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(20deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(20deg)', illusion: 'NOISE', accentColor: '#FF8800' },
  { id: 'c47', name: 'WIF', description: 'Hat', category: 'CRYPTO', filter: 'sepia(0.8) hue-rotate(350deg) brightness(1.1)', mobileFilter: 'sepia(0.8)', illusion: 'NONE', accentColor: '#BCA38A' },
  { id: 'c48', name: 'Floki', description: 'Viking', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(40deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(40deg)', illusion: 'NONE', accentColor: '#FACC15' },
  { id: 'c49', name: 'Ordinals', description: 'Inscription', category: 'CRYPTO', filter: 'grayscale(1) contrast(2) brightness(0.5) drop-shadow(0 0 2px orange)', mobileFilter: 'grayscale(1)', illusion: 'NOISE', accentColor: '#F7931A' },
  { id: 'c50', name: 'Stacks', description: 'L2 BTC', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(260deg) saturate(3) contrast(1.3)', mobileFilter: 'hue-rotate(260deg)', illusion: 'NONE', accentColor: '#5546FF' },

  // --- TRADING CONCEPTS & LINGO ---
  { id: 'cp01', name: 'Black Swan', description: 'Unexpected', category: 'CONCEPTS', filter: 'grayscale(1) brightness(0.3) contrast(1.5)', mobileFilter: 'grayscale(1) brightness(0.5)', illusion: 'VIGNETTE', accentColor: '#171717' },
  { id: 'cp02', name: 'Golden Cross', description: 'Bullish', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(45deg) saturate(5) brightness(1.2) drop-shadow(0 0 5px gold)', mobileFilter: 'hue-rotate(45deg)', illusion: 'NONE', accentColor: '#FFD700' },
  { id: 'cp03', name: 'Death Cross', description: 'Bearish', category: 'CONCEPTS', filter: 'grayscale(1) drop-shadow(0 0 5px red) brightness(0.5)', mobileFilter: 'grayscale(1)', illusion: 'VIGNETTE', accentColor: '#991B1B' },
  { id: 'cp04', name: 'Dead Cat', description: 'Bounce', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(100deg) saturate(1) contrast(1.5) brightness(0.7)', mobileFilter: 'hue-rotate(100deg)', illusion: 'NOISE', accentColor: '#4ADE80' },
  { id: 'cp05', name: 'Bollinger', description: 'Bands', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(180deg) saturate(2) opacity(0.8)', mobileFilter: 'hue-rotate(180deg)', illusion: 'SCANLINES', accentColor: '#60A5FA' },
  { id: 'cp06', name: 'Fibonacci', description: 'Golden Ratio', category: 'CONCEPTS', filter: 'sepia(0.8) hue-rotate(30deg) contrast(1.1)', mobileFilter: 'sepia(0.8)', illusion: 'NONE', accentColor: '#D97706' },
  { id: 'cp07', name: 'Ichimoku', description: 'Cloud', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(150deg) saturate(1.5) brightness(1.1)', mobileFilter: 'hue-rotate(150deg)', illusion: 'VIGNETTE', accentColor: '#34D399' },
  { id: 'cp08', name: 'RSI Divergence', description: 'Reversal', category: 'CONCEPTS', filter: 'invert(1) hue-rotate(250deg) saturate(2)', mobileFilter: 'invert(1)', isLight: true, illusion: 'SCANLINES', accentColor: '#818CF8' },
  { id: 'cp09', name: 'MACD', description: 'Momentum', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(300deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(300deg)', illusion: 'NONE', accentColor: '#F472B6' },
  { id: 'cp10', name: 'Order Book', description: 'Depth', category: 'CONCEPTS', filter: 'contrast(1.4) brightness(0.6) saturate(0)', mobileFilter: 'contrast(1.2)', illusion: 'SCANLINES', accentColor: '#FFFFFF' },
  { id: 'cp11', name: 'Leverage', description: '100x', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(340deg) saturate(5) contrast(1.3)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NOISE', accentColor: '#EF4444' },
  { id: 'cp12', name: 'Spot Market', description: '1:1', category: 'CONCEPTS', filter: 'grayscale(1) brightness(1.2) contrast(1)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#E5E5E5' },
  { id: 'cp13', name: 'Whale Alert', description: 'Movement', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(200deg) saturate(3) drop-shadow(0 0 4px cyan)', mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#06B6D4' },
  { id: 'cp14', name: 'Bag Holder', description: 'Heavy', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(20deg) saturate(0.5) brightness(0.6)', mobileFilter: 'hue-rotate(20deg)', illusion: 'VIGNETTE', accentColor: '#78350F' },
  { id: 'cp15', name: 'Paper Hands', description: 'Weak', category: 'CONCEPTS', filter: 'opacity(0.6) grayscale(1)', mobileFilter: 'opacity(0.8)', illusion: 'NOISE', accentColor: '#D1D5DB' },
  { id: 'cp16', name: 'FOMO', description: 'Ape In', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(110deg) saturate(4) brightness(1.2)', mobileFilter: 'hue-rotate(110deg)', illusion: 'GLITCH', accentColor: '#84CC16' },
  { id: 'cp17', name: 'REKT', description: 'Liquidated', category: 'CONCEPTS', filter: 'saturate(5) contrast(2) hue-rotate(320deg) drop-shadow(0 0 5px red)', mobileFilter: 'saturate(3)', illusion: 'GLITCH', accentColor: '#DC2626' },
  { id: 'cp18', name: 'WAGMI', description: 'Community', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(240deg) saturate(2) brightness(1.2)', mobileFilter: 'hue-rotate(240deg)', illusion: 'NONE', accentColor: '#60A5FA' },
  { id: 'cp19', name: 'NGMI', description: 'Despair', category: 'CONCEPTS', filter: 'grayscale(1) brightness(0.4) contrast(1.5)', mobileFilter: 'grayscale(1)', illusion: 'VIGNETTE', accentColor: '#374151' },
  { id: 'cp20', name: 'Alpha', description: 'Insider', category: 'CONCEPTS', filter: 'sepia(1) hue-rotate(290deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(290deg)', illusion: 'NONE', accentColor: '#D946EF' },

  // --- ASSETS & FOREX EXPANSION ---
  { id: 'a16', name: 'Palladium', description: 'Catalyst', category: 'ASSETS', filter: 'grayscale(1) brightness(1.1) sepia(0.3) hue-rotate(180deg)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#9CA3AF' },
  { id: 'a17', name: 'Platinum', description: 'Precious', category: 'ASSETS', filter: 'grayscale(1) brightness(1.4) drop-shadow(0 0 3px white)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#FFFFFF' },
  { id: 'a18', name: 'Wheat', description: 'Bushel', category: 'ASSETS', filter: 'sepia(1) hue-rotate(40deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(40deg)', illusion: 'NONE', accentColor: '#EAB308' },
  { id: 'a19', name: 'Soybean', description: 'Meal', category: 'ASSETS', filter: 'sepia(1) hue-rotate(60deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(60deg)', illusion: 'NOISE', accentColor: '#65A30D' },
  { id: 'a20', name: 'Sugar', description: 'Softs', category: 'ASSETS', filter: 'invert(1) sepia(0.2) contrast(0.8)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#F9A8D4' },
  { id: 'a21', name: 'Lumber', description: 'Timber', category: 'ASSETS', filter: 'sepia(1) hue-rotate(340deg) saturate(1) brightness(0.6)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NONE', accentColor: '#78350F' },
  { id: 'a22', name: 'Cotton', description: 'Fiber', category: 'ASSETS', filter: 'grayscale(1) brightness(1.6) contrast(0.8)', mobileFilter: 'grayscale(1)', isLight: true, illusion: 'NONE', accentColor: '#E5E5E5' },
  { id: 'a23', name: 'Orange Juice', description: 'Frozen', category: 'ASSETS', filter: 'sepia(1) hue-rotate(10deg) saturate(4) brightness(1.1)', mobileFilter: 'hue-rotate(10deg)', illusion: 'NONE', accentColor: '#F97316' },
  { id: 'a24', name: 'Cocoa', description: 'Bean', category: 'ASSETS', filter: 'sepia(1) saturate(1.5) brightness(0.4)', mobileFilter: 'sepia(1)', illusion: 'NOISE', accentColor: '#451A03' },
  { id: 'a25', name: 'Live Cattle', description: 'Feeder', category: 'ASSETS', filter: 'sepia(0.6) hue-rotate(350deg) contrast(1.2)', mobileFilter: 'sepia(0.6)', illusion: 'NONE', accentColor: '#9F1239' },
  { id: 'a26', name: 'AUD Dollar', description: 'Aussie', category: 'ASSETS', filter: 'sepia(1) hue-rotate(130deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(130deg)', illusion: 'NONE', accentColor: '#059669' },
  { id: 'a27', name: 'CAD Dollar', description: 'Loonie', category: 'ASSETS', filter: 'sepia(1) hue-rotate(330deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(330deg)', illusion: 'NONE', accentColor: '#DC2626' },
  { id: 'a28', name: 'NZD Dollar', description: 'Kiwi', category: 'ASSETS', filter: 'sepia(1) hue-rotate(300deg) saturate(1) brightness(0.8)', mobileFilter: 'hue-rotate(300deg)', illusion: 'NONE', accentColor: '#111827' },
  { id: 'a29', name: 'CHF Franc', description: 'Swiss', category: 'ASSETS', filter: 'grayscale(1) brightness(1.3) contrast(1.1) drop-shadow(0 0 2px red)', mobileFilter: 'grayscale(1)', isLight: true, illusion: 'NONE', accentColor: '#B91C1C' },
  { id: 'a30', name: 'ZAR Rand', description: 'South Africa', category: 'ASSETS', filter: 'sepia(1) hue-rotate(70deg) saturate(3) brightness(0.9)', mobileFilter: 'hue-rotate(70deg)', illusion: 'NONE', accentColor: '#16A34A' },
  { id: 'a31', name: 'CNY Yuan', description: 'Renminbi', category: 'ASSETS', filter: 'sepia(1) hue-rotate(340deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NONE', accentColor: '#B91C1C' },
  { id: 'a32', name: 'INR Rupee', description: 'India', category: 'ASSETS', filter: 'sepia(1) hue-rotate(20deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(20deg)', illusion: 'NONE', accentColor: '#EA580C' },
  { id: 'a33', name: 'BRL Real', description: 'Brazil', category: 'ASSETS', filter: 'sepia(1) hue-rotate(90deg) saturate(4) brightness(0.8)', mobileFilter: 'hue-rotate(90deg)', illusion: 'NONE', accentColor: '#15803D' },
  { id: 'a34', name: 'MXN Peso', description: 'Mexico', category: 'ASSETS', filter: 'sepia(1) hue-rotate(140deg) saturate(2) contrast(1.2)', mobileFilter: 'hue-rotate(140deg)', illusion: 'NONE', accentColor: '#047857' },
  { id: 'a35', name: 'KRW Won', description: 'Korea', category: 'ASSETS', filter: 'sepia(1) hue-rotate(200deg) saturate(1.5) brightness(1.1)', mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#2563EB' },
  { id: 'a36', name: 'Nasdaq', description: 'Tech 100', category: 'ASSETS', filter: 'sepia(1) hue-rotate(210deg) saturate(3) contrast(1.1)', mobileFilter: 'hue-rotate(210deg)', illusion: 'SCANLINES', accentColor: '#3B82F6' },
  { id: 'a37', name: 'S&P 500', description: 'Large Cap', category: 'ASSETS', filter: 'grayscale(1) brightness(1.1) contrast(1.1)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#6B7280' },
  { id: 'a38', name: 'Dow Jones', description: 'Industrial', category: 'ASSETS', filter: 'sepia(1) hue-rotate(220deg) saturate(1) brightness(0.7)', mobileFilter: 'hue-rotate(220deg)', illusion: 'NONE', accentColor: '#1E3A8A' },
  { id: 'a39', name: 'Dax 40', description: 'Germany', category: 'ASSETS', filter: 'sepia(1) hue-rotate(50deg) saturate(2) brightness(0.5)', mobileFilter: 'hue-rotate(50deg)', illusion: 'NONE', accentColor: '#FCD34D' },
  { id: 'a40', name: 'FTSE 100', description: 'UK', category: 'ASSETS', filter: 'grayscale(1) sepia(0.3) brightness(0.8)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#4B5563' },
  { id: 'a41', name: 'Nikkei 225', description: 'Japan', category: 'ASSETS', filter: 'invert(1) hue-rotate(320deg) contrast(1.2)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#BE123C' },
  { id: 'a42', name: 'Hang Seng', description: 'HK', category: 'ASSETS', filter: 'sepia(1) hue-rotate(340deg) saturate(2) brightness(0.6)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NONE', accentColor: '#991B1B' },
  { id: 'a43', name: 'VIX', description: 'Fear Index', category: 'ASSETS', filter: 'contrast(2) brightness(0.5) grayscale(1)', mobileFilter: 'contrast(1.5)', illusion: 'NOISE', accentColor: '#FFFFFF' },
  { id: 'a44', name: 'Bonds 10Y', description: 'Yield', category: 'ASSETS', filter: 'sepia(1) hue-rotate(200deg) saturate(0.5) brightness(1.2)', mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#93C5FD' },
  { id: 'a45', name: 'DXY', description: 'Dollar Index', category: 'ASSETS', filter: 'sepia(1) hue-rotate(120deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(120deg)', illusion: 'NONE', accentColor: '#10B981' },

  // --- LOCATION (Trading Hubs) ---
  { id: 'l01', name: 'Wall Street', description: 'New York', category: 'LOCATION', filter: 'sepia(1) hue-rotate(200deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#1D4ED8' },
  { id: 'l02', name: 'The City', description: 'London', category: 'LOCATION', filter: 'grayscale(1) brightness(0.6) sepia(0.2)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#475569' },
  { id: 'l03', name: 'Ginza', description: 'Tokyo', category: 'LOCATION', filter: 'sepia(1) hue-rotate(300deg) saturate(3) brightness(0.5) drop-shadow(0 0 5px pink)', mobileFilter: 'hue-rotate(300deg)', illusion: 'VIGNETTE', accentColor: '#EC4899' },
  { id: 'l04', name: 'Marina Bay', description: 'Singapore', category: 'LOCATION', filter: 'sepia(1) hue-rotate(180deg) saturate(2) contrast(1.2)', mobileFilter: 'hue-rotate(180deg)', illusion: 'NONE', accentColor: '#3B82F6' },
  { id: 'l05', name: 'DIFC', description: 'Dubai', category: 'LOCATION', filter: 'sepia(1) hue-rotate(40deg) saturate(2) brightness(1.2) drop-shadow(0 0 5px gold)', mobileFilter: 'hue-rotate(40deg)', illusion: 'NONE', accentColor: '#FACC15' },
  { id: 'l06', name: 'Silicon Valley', description: 'Palo Alto', category: 'LOCATION', filter: 'invert(1) hue-rotate(200deg) saturate(2)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#2563EB' },
  { id: 'l07', name: 'Shenzhen', description: 'Hardware', category: 'LOCATION', filter: 'sepia(1) hue-rotate(320deg) saturate(4) brightness(0.6)', mobileFilter: 'hue-rotate(320deg)', illusion: 'SCANLINES', accentColor: '#DC2626' },
  { id: 'l08', name: 'Zug', description: 'Crypto Valley', category: 'LOCATION', filter: 'grayscale(1) brightness(1.4) contrast(1.1)', mobileFilter: 'grayscale(1)', isLight: true, illusion: 'NONE', accentColor: '#EF4444' },
  { id: 'l09', name: 'El Salvador', description: 'Bitcoin City', category: 'LOCATION', filter: 'sepia(1) hue-rotate(220deg) saturate(3) brightness(0.7)', mobileFilter: 'hue-rotate(220deg)', illusion: 'VIGNETTE', accentColor: '#0EA5E9' },
  { id: 'l10', name: 'Seoul', description: 'Kimchi', category: 'LOCATION', filter: 'sepia(1) hue-rotate(350deg) saturate(1.5) contrast(1.1)', mobileFilter: 'hue-rotate(350deg)', illusion: 'NONE', accentColor: '#E11D48' },
  { id: 'l11', name: 'Mumbai', description: 'Dalal St', category: 'LOCATION', filter: 'sepia(1) hue-rotate(20deg) saturate(3) brightness(0.9)', mobileFilter: 'hue-rotate(20deg)', illusion: 'NOISE', accentColor: '#EA580C' },
  { id: 'l12', name: 'Sydney', description: 'ASX', category: 'LOCATION', filter: 'sepia(1) hue-rotate(200deg) saturate(3) brightness(1.1)', mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#2563EB' },
  { id: 'l13', name: 'Frankfurt', description: 'ECB', category: 'LOCATION', filter: 'sepia(1) hue-rotate(210deg) saturate(1) brightness(0.6)', mobileFilter: 'hue-rotate(210deg)', illusion: 'NONE', accentColor: '#1E3A8A' },
  { id: 'l14', name: 'Chicago', description: 'Merc', category: 'LOCATION', filter: 'grayscale(1) contrast(1.3) brightness(0.8)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#6B7280' },
  { id: 'l15', name: 'Shanghai', description: 'Bund', category: 'LOCATION', filter: 'sepia(1) hue-rotate(330deg) saturate(3) brightness(0.8)', mobileFilter: 'hue-rotate(330deg)', illusion: 'NONE', accentColor: '#B91C1C' },

  // --- RETRO TECH & OPTICS ---
  { id: 'o16', name: 'Commodore', description: '64', category: 'OPTICS', filter: 'sepia(1) hue-rotate(240deg) saturate(2) brightness(0.7) contrast(1.2)', mobileFilter: 'hue-rotate(240deg)', illusion: 'SCANLINES', accentColor: '#4F46E5' },
  { id: 'o17', name: 'Amiga', description: 'Workbench', category: 'OPTICS', filter: 'sepia(1) hue-rotate(180deg) saturate(1) brightness(1.2)', mobileFilter: 'hue-rotate(180deg)', isLight: true, illusion: 'NONE', accentColor: '#60A5FA' },
  { id: 'o18', name: 'MS-DOS', description: 'C:\\>', category: 'OPTICS', filter: 'grayscale(1) brightness(1.5) contrast(2) drop-shadow(0 0 2px white)', mobileFilter: 'grayscale(1)', illusion: 'SCANLINES', accentColor: '#FFFFFF' },
  { id: 'o19', name: 'Phosphor P3', description: 'Amber', category: 'OPTICS', filter: 'sepia(1) hue-rotate(20deg) saturate(4) brightness(1.1) contrast(1.2)', mobileFilter: 'hue-rotate(20deg)', illusion: 'SCANLINES', accentColor: '#F59E0B' },
  { id: 'o20', name: 'Phosphor P1', description: 'Green', category: 'OPTICS', filter: 'sepia(1) hue-rotate(80deg) saturate(4) brightness(1.1) contrast(1.2)', mobileFilter: 'hue-rotate(80deg)', illusion: 'SCANLINES', accentColor: '#22C55E' },
  { id: 'o21', name: 'Win 95', description: 'Teal', category: 'OPTICS', filter: 'sepia(1) hue-rotate(140deg) saturate(1) brightness(1.2)', mobileFilter: 'hue-rotate(140deg)', illusion: 'NONE', accentColor: '#008080' },
  { id: 'o22', name: 'Mac OS 9', description: 'Platinum', category: 'OPTICS', filter: 'grayscale(1) brightness(1.3) contrast(1)', mobileFilter: 'grayscale(1)', isLight: true, illusion: 'NONE', accentColor: '#E5E5E5' },
  { id: 'o23', name: 'Teletext', description: 'Ceefax', category: 'OPTICS', filter: 'contrast(2) saturate(3)', mobileFilter: 'contrast(1.5)', illusion: 'NOISE', accentColor: '#FFFF00' },
  { id: 'o24', name: 'BIOS', description: 'Setup', category: 'OPTICS', filter: 'sepia(1) hue-rotate(200deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(200deg)', illusion: 'SCANLINES', accentColor: '#0000FF' },
  { id: 'o25', name: 'Mainframe', description: 'Server', category: 'OPTICS', filter: 'sepia(1) hue-rotate(20deg) saturate(0.5) brightness(0.4)', mobileFilter: 'hue-rotate(20deg)', illusion: 'NONE', accentColor: '#78350F' },
  { id: 'o26', name: 'LCARS', description: 'Starfleet', category: 'OPTICS', filter: 'sepia(1) hue-rotate(25deg) saturate(3) contrast(1.1)', mobileFilter: 'hue-rotate(25deg)', illusion: 'NONE', accentColor: '#F59E0B' },
  { id: 'o27', name: 'Pip-Boy', description: 'Wasteland', category: 'OPTICS', filter: 'sepia(1) hue-rotate(60deg) saturate(3) brightness(1.2) drop-shadow(0 0 5px #4ADE80)', mobileFilter: 'hue-rotate(60deg)', illusion: 'SCANLINES', accentColor: '#4ADE80' },
  { id: 'o28', name: 'Hal 9000', description: 'AI', category: 'OPTICS', filter: 'sepia(1) hue-rotate(340deg) saturate(3) brightness(0.6)', mobileFilter: 'hue-rotate(340deg)', illusion: 'VIGNETTE', accentColor: '#DC2626' },
  { id: 'o29', name: 'Synth', description: 'Modular', category: 'OPTICS', filter: 'sepia(1) hue-rotate(260deg) saturate(3) contrast(1.1)', mobileFilter: 'hue-rotate(260deg)', illusion: 'NONE', accentColor: '#7C3AED' },
  { id: 'o30', name: 'VHS Pause', description: 'Tracking', category: 'OPTICS', filter: 'sepia(0.5) hue-rotate(220deg) blur(0.5px) contrast(1.5)', mobileFilter: 'sepia(0.5)', illusion: 'GLITCH', accentColor: '#22D3EE' },
  { id: 'o31', name: 'Polaroid', description: 'Instant', category: 'OPTICS', filter: 'sepia(0.4) contrast(1.1) brightness(1.1) saturate(1.2)', mobileFilter: 'sepia(0.4)', illusion: 'VIGNETTE', accentColor: '#FDE047' },
  { id: 'o32', name: 'Daguerreotype', description: '1850s', category: 'OPTICS', filter: 'sepia(1) contrast(1.5) brightness(0.8) grayscale(0.5)', mobileFilter: 'sepia(1)', illusion: 'NOISE', accentColor: '#A16207' },
  { id: 'o33', name: 'Anaglyph', description: '3D Red/Blue', category: 'OPTICS', filter: 'sepia(1) hue-rotate(280deg) saturate(2) drop-shadow(2px 0 0 red) drop-shadow(-2px 0 0 cyan)', mobileFilter: 'hue-rotate(280deg)', illusion: 'NONE', accentColor: '#DB2777' },
  { id: 'o34', name: 'Technicolor', description: 'Cinema', category: 'OPTICS', filter: 'saturate(2.5) contrast(1.2) sepia(0.2)', mobileFilter: 'saturate(2)', illusion: 'NONE', accentColor: '#EF4444' },
  { id: 'o35', name: 'EGA', description: '16 Colors', category: 'OPTICS', filter: 'contrast(1.8) saturate(2)', mobileFilter: 'contrast(1.5)', illusion: 'NOISE', accentColor: '#10B981' },

  // --- ELEMENTAL & NATURE ---
  { id: 'n01', name: 'Deep Ocean', description: 'Mariana', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(190deg) saturate(3) brightness(0.5)', mobileFilter: 'hue-rotate(190deg)', illusion: 'NONE', accentColor: '#0E7490' },
  { id: 'n02', name: 'Volcano', description: 'Magma', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(350deg) saturate(3) brightness(0.7) contrast(1.3)', mobileFilter: 'hue-rotate(350deg)', illusion: 'NOISE', accentColor: '#9F1239' },
  { id: 'n03', name: 'Rainforest', description: 'Canopy', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(90deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(90deg)', illusion: 'NONE', accentColor: '#15803D' },
  { id: 'n04', name: 'Arctic', description: 'Tundra', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(180deg) saturate(0.5) brightness(1.2)', mobileFilter: 'hue-rotate(180deg)', isLight: true, illusion: 'NONE', accentColor: '#BAE6FD' },
  { id: 'n05', name: 'Desert', description: 'Dune', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(25deg) saturate(2) brightness(1.1)', mobileFilter: 'hue-rotate(25deg)', illusion: 'NOISE', accentColor: '#D97706' },
  { id: 'n06', name: 'Storm', description: 'Thunder', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(220deg) saturate(0.5) brightness(0.6) contrast(1.5)', mobileFilter: 'hue-rotate(220deg)', illusion: 'VIGNETTE', accentColor: '#475569' },
  { id: 'n07', name: 'Sunset', description: 'Horizon', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(320deg) saturate(2) brightness(0.9)', mobileFilter: 'hue-rotate(320deg)', illusion: 'NONE', accentColor: '#BE123C' },
  { id: 'n08', name: 'Aurora', description: 'Borealis', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(130deg) saturate(3) brightness(0.8) drop-shadow(0 0 5px #4ADE80)', mobileFilter: 'hue-rotate(130deg)', illusion: 'NONE', accentColor: '#4ADE80' },
  { id: 'n09', name: 'Midnight', description: 'Stars', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(230deg) saturate(3) brightness(0.3)', mobileFilter: 'hue-rotate(230deg)', illusion: 'NOISE', accentColor: '#1E1B4B' },
  { id: 'n10', name: 'Swamp', description: 'Murky', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(70deg) saturate(1.5) brightness(0.5)', mobileFilter: 'hue-rotate(70deg)', illusion: 'NONE', accentColor: '#3F6212' },
  { id: 'n11', name: 'Glacier', description: 'Ice', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(170deg) saturate(1) brightness(1.1) contrast(1.1)', mobileFilter: 'hue-rotate(170deg)', illusion: 'NONE', accentColor: '#7DD3FC' },
  { id: 'n12', name: 'Space', description: 'Void', category: 'ELEMENTAL', filter: 'grayscale(1) brightness(0.2) contrast(1.2)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#000000' },
  { id: 'n13', name: 'Mars', description: 'Red Planet', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(340deg) saturate(1.5) brightness(0.8)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NOISE', accentColor: '#9F1239' },
  { id: 'n14', name: 'Moon', description: 'Crater', category: 'ELEMENTAL', filter: 'grayscale(1) brightness(0.8) contrast(1.2)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#D1D5DB' },
  { id: 'n15', name: 'Sun', description: 'Solar', category: 'ELEMENTAL', filter: 'sepia(1) hue-rotate(30deg) saturate(4) brightness(1.2) contrast(1.1)', mobileFilter: 'hue-rotate(30deg)', illusion: 'NONE', accentColor: '#FDBA74' },

  // --- AESTHETICS & EXOTIC EXTENDED ---
  { id: 'e17', name: 'Pastel Goth', description: 'Soft Dark', category: 'EXOTIC', filter: 'sepia(0.5) hue-rotate(260deg) saturate(1) brightness(1.1)', mobileFilter: 'sepia(0.5)', illusion: 'NONE', accentColor: '#C4B5FD' },
  { id: 'e18', name: 'Outrun', description: 'Synthwave', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(300deg) saturate(4) contrast(1.2)', mobileFilter: 'hue-rotate(300deg)', illusion: 'SCANLINES', accentColor: '#F0ABFC' },
  { id: 'e19', name: 'Solarpunk', description: 'Eco', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(70deg) saturate(2) brightness(1.2)', mobileFilter: 'hue-rotate(70deg)', illusion: 'NONE', accentColor: '#84CC16' },
  { id: 'e20', name: 'Dieselpunk', description: 'Grease', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(10deg) saturate(0.5) brightness(0.5) contrast(1.3)', mobileFilter: 'hue-rotate(10deg)', illusion: 'NOISE', accentColor: '#57534E' },
  { id: 'e21', name: 'Biopunk', description: 'Genetic', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(110deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(110deg)', illusion: 'VIGNETTE', accentColor: '#4ADE80' },
  { id: 'e22', name: 'Gothic', description: 'Cathedral', category: 'EXOTIC', filter: 'grayscale(1) brightness(0.4) contrast(1.3)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#111827' },
  { id: 'e23', name: 'Baroque', description: 'Ornate', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(30deg) saturate(2) contrast(1.1)', mobileFilter: 'hue-rotate(30deg)', illusion: 'NONE', accentColor: '#D97706' },
  { id: 'e24', name: 'Minimalist', description: 'Clean', category: 'EXOTIC', filter: 'grayscale(1) brightness(1.2) contrast(0.9)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#E5E5E5' },
  { id: 'e25', name: 'Maximalist', description: 'Chaos', category: 'EXOTIC', filter: 'saturate(4) contrast(1.5)', mobileFilter: 'saturate(3)', illusion: 'NOISE', accentColor: '#F59E0B' },
  { id: 'e26', name: 'Brutalist', description: 'Concrete', category: 'EXOTIC', filter: 'grayscale(1) brightness(0.8) contrast(1.5)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#525252' },
  { id: 'e27', name: 'Pop Art', description: 'Warhol', category: 'EXOTIC', filter: 'saturate(3) contrast(1.5) hue-rotate(180deg)', mobileFilter: 'saturate(2)', illusion: 'NONE', accentColor: '#3B82F6' },
  { id: 'e28', name: 'Lo-Fi', description: 'Study', category: 'EXOTIC', filter: 'sepia(0.6) hue-rotate(330deg) saturate(0.8) brightness(0.9)', mobileFilter: 'sepia(0.6)', illusion: 'NOISE', accentColor: '#FDA4AF' },
  { id: 'e29', name: 'High Contrast', description: 'Accessibility', category: 'EXOTIC', filter: 'contrast(2) grayscale(1) brightness(1.2)', mobileFilter: 'contrast(1.5)', illusion: 'NONE', accentColor: '#FFFFFF' },
  { id: 'e30', name: 'Sepia Tone', description: 'Old Photo', category: 'EXOTIC', filter: 'sepia(1) contrast(1.1)', mobileFilter: 'sepia(1)', illusion: 'NONE', accentColor: '#D97706' },
  { id: 'e31', name: 'Inverted', description: 'Negative', category: 'EXOTIC', filter: 'invert(1) hue-rotate(180deg)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#FFFFFF' },
  { id: 'e32', name: 'Dream', description: 'Soft', category: 'EXOTIC', filter: 'sepia(0.3) hue-rotate(240deg) brightness(1.2) blur(0.5px)', mobileFilter: 'sepia(0.3)', illusion: 'NONE', accentColor: '#C4B5FD' },
  { id: 'e33', name: 'Nightmare', description: 'Dark', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(340deg) saturate(2) brightness(0.3) contrast(1.5)', mobileFilter: 'hue-rotate(340deg)', illusion: 'VIGNETTE', accentColor: '#7F1D1D' },
  { id: 'e34', name: 'Neon City', description: 'Lights', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(280deg) saturate(4) contrast(1.1)', mobileFilter: 'hue-rotate(280deg)', illusion: 'NONE', accentColor: '#E879F9' },
  { id: 'e35', name: 'Toxic', description: 'Waste', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(80deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(80deg)', illusion: 'NOISE', accentColor: '#A3E635' },
  { id: 'e36', name: 'Rust', description: 'Oxide', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(350deg) saturate(2) brightness(0.6)', mobileFilter: 'hue-rotate(350deg)', illusion: 'NOISE', accentColor: '#9A3412' },
  { id: 'e37', name: 'Mint', description: 'Fresh', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(130deg) saturate(1.5) brightness(1.1)', mobileFilter: 'hue-rotate(130deg)', illusion: 'NONE', accentColor: '#6EE7B7' },
  { id: 'e38', name: 'Berry', description: 'Fruit', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(300deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(300deg)', illusion: 'NONE', accentColor: '#C026D3' },
  { id: 'e39', name: 'Lemon', description: 'Zest', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(45deg) saturate(3) brightness(1.2)', mobileFilter: 'hue-rotate(45deg)', illusion: 'NONE', accentColor: '#FDE047' },
  { id: 'e40', name: 'Bubblegum', description: 'Pop', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(310deg) saturate(1.5) brightness(1.1)', mobileFilter: 'hue-rotate(310deg)', illusion: 'NONE', accentColor: '#F472B6' },

  // --- MEME & FUN ---
  { id: 'm01', name: 'Nyan Cat', description: 'Rainbow', category: 'MEME', filter: 'hue-rotate(90deg) saturate(3) contrast(1.2)', mobileFilter: 'hue-rotate(90deg)', illusion: 'NONE', accentColor: '#FF0000' },
  { id: 'm02', name: 'Matrix 2', description: 'Reloaded', category: 'MEME', filter: 'sepia(1) hue-rotate(90deg) saturate(4) contrast(1.5) brightness(0.6)', mobileFilter: 'hue-rotate(90deg)', illusion: 'SCANLINES', accentColor: '#22C55E' },
  { id: 'm03', name: 'HackerMan', description: '1337', category: 'MEME', filter: 'invert(1) contrast(2) grayscale(1)', mobileFilter: 'invert(1)', isLight: true, illusion: 'SCANLINES', accentColor: '#000000' },
  { id: 'm04', name: 'UwU', description: 'Soft', category: 'MEME', filter: 'sepia(0.5) hue-rotate(310deg) brightness(1.1)', mobileFilter: 'sepia(0.5)', illusion: 'NONE', accentColor: '#F9A8D4' },
  { id: 'm05', name: 'Laser Eyes', description: 'Bitcoin', category: 'MEME', filter: 'sepia(1) hue-rotate(10deg) saturate(4) drop-shadow(0 0 5px red)', mobileFilter: 'hue-rotate(10deg)', illusion: 'VIGNETTE', accentColor: '#EF4444' },
  { id: 'm06', name: 'Stonks', description: 'Up', category: 'MEME', filter: 'invert(1) hue-rotate(200deg)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#3B82F6' },
  { id: 'm07', name: 'Not Stonks', description: 'Down', category: 'MEME', filter: 'sepia(1) hue-rotate(340deg) saturate(3)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NONE', accentColor: '#EF4444' },
  { id: 'm08', name: 'This is Fine', description: 'Fire', category: 'MEME', filter: 'sepia(1) hue-rotate(20deg) saturate(3) brightness(1.2)', mobileFilter: 'hue-rotate(20deg)', illusion: 'NONE', accentColor: '#F97316' },
  { id: 'm09', name: 'NPC', description: 'Grey', category: 'MEME', filter: 'grayscale(1) contrast(0.8) brightness(1.1)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#9CA3AF' },
  { id: 'm10', name: 'Chad', description: 'Giga', category: 'MEME', filter: 'grayscale(1) contrast(1.5) brightness(1.1)', mobileFilter: 'grayscale(1)', illusion: 'NONE', accentColor: '#FFFFFF' },

  // --- HISTORICAL ERAS EXTENDED ---
  { id: 'h11', name: 'Y2K', description: 'Bug', category: 'HISTORICAL', filter: 'sepia(1) hue-rotate(220deg) saturate(3) brightness(0.8)', mobileFilter: 'hue-rotate(220deg)', illusion: 'GLITCH', accentColor: '#06B6D4' },
  { id: 'h12', name: 'Cold War', description: 'Spy', category: 'HISTORICAL', filter: 'grayscale(1) brightness(0.6) sepia(0.2)', mobileFilter: 'grayscale(1)', illusion: 'NOISE', accentColor: '#475569' },
  { id: 'h13', name: 'Roaring 20s', description: 'Gatsby', category: 'HISTORICAL', filter: 'sepia(1) hue-rotate(40deg) saturate(1.5) contrast(1.1)', mobileFilter: 'hue-rotate(40deg)', illusion: 'NONE', accentColor: '#F59E0B' },
  { id: 'h14', name: 'Victorian', description: 'Steam', category: 'HISTORICAL', filter: 'sepia(1) hue-rotate(350deg) saturate(0.5) contrast(1.2)', mobileFilter: 'hue-rotate(350deg)', illusion: 'VIGNETTE', accentColor: '#78350F' },
  { id: 'h15', name: 'Renaissance', description: 'Art', category: 'HISTORICAL', filter: 'sepia(0.8) hue-rotate(20deg) brightness(1.1)', mobileFilter: 'sepia(0.8)', illusion: 'NONE', accentColor: '#B45309' },
  { id: 'h16', name: 'Medieval', description: 'Dark Ages', category: 'HISTORICAL', filter: 'sepia(1) hue-rotate(340deg) saturate(0.5) brightness(0.4)', mobileFilter: 'hue-rotate(340deg)', illusion: 'NOISE', accentColor: '#451A03' },
  { id: 'h17', name: 'Ancient', description: 'Rome', category: 'HISTORICAL', filter: 'sepia(1) hue-rotate(350deg) saturate(1) contrast(1.1)', mobileFilter: 'hue-rotate(350deg)', illusion: 'NONE', accentColor: '#B91C1C' },
  { id: 'h18', name: 'Future', description: '3000', category: 'HISTORICAL', filter: 'invert(1) hue-rotate(180deg) brightness(1.2)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#E5E5E5' },
  { id: 'h19', name: 'Industrial', description: 'Revolution', category: 'HISTORICAL', filter: 'grayscale(1) brightness(0.5) contrast(1.5)', mobileFilter: 'grayscale(1)', illusion: 'NOISE', accentColor: '#171717' },
  { id: 'h20', name: 'Space Race', description: '1969', category: 'HISTORICAL', filter: 'grayscale(1) brightness(1.2) contrast(1.2) drop-shadow(0 0 2px white)', mobileFilter: 'grayscale(1)', illusion: 'NOISE', accentColor: '#FFFFFF' }
];