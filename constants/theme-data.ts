import { 
  Zap, DollarSign, Activity, Shield, Lock, Monitor, Hash, 
  MapPin, Sun, Brain, Smile, Layers 
} from 'lucide-react';

// --- 1. UPDATED TYPES ---
export type SoundProfile = 'MECHANICAL' | 'SOROS' | 'SCI-FI' | 'SILENT' | 'ORGANIC' | 'DISTORTED' | 'RETRO'; 

export type ThemeCategory = 
  | 'SPECIAL' | 'SENTIMENT' | 'ASSETS' | 'CRYPTO' 
  | 'HISTORICAL' | 'OPTICS' | 'GLITCH' | 'EXOTIC' 
  | 'LOCATION' | 'ELEMENTAL' | 'CONCEPTS' | 'MEME'
  | 'SEASONAL'; 

export type Theme = { 
  id: string; 
  name: string; 
  description: string; 
  filter: string; 
  mobileFilter: string; 
  category: ThemeCategory; 
  isLight?: boolean; 
  illusion?: 'SCANLINES' | 'VIGNETTE' | 'NOISE' | 'NONE' | 'GLITCH' | 'CRT'; 
  overlay?: 'SNOW' | 'HEARTS' | 'CONFETTI' | 'EGGS' | 'LEAVES' | 'PUMPKINS' | 'RAIN' | 'FIREWORKS' | 'NONE' | 'BUBBLES' | 'ASH';
  bgImage?: string; 
  bgBlendMode?: 'overlay' | 'soft-light' | 'screen' | 'multiply' | 'color-dodge' | 'normal' | 'hard-light';
  bgOpacity?: number; 
  accentColor?: string; 
  status: 'AVAILABLE' | 'UNAVAILABLE';
  
  // --- AUDIO ENGINE: ALL THEMES MUST HAVE THESE ---
  audioUrl: string;    // CLICK / INTERACT Sound (SFX)
  hoverUrl: string;    // HOVER Sound (SFX)
  bgMusicUrl?: string; // Standard MP3 Loop (Fallback/Simple BGM)
  youtubeId?: string;  // ⬅️ CRITICAL: YouTube Video ID (For Contextual BGM/Hidden Player)
};

export type TickerData = { 
  symbol: string; 
  price: string; 
  percentChange: string; 
  prevPrice: string; 
};

// --- HELPER: COMMON SFX LINKS ---
const SFX = {
  click: {
    scifi: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3', // Digital Click
    mech: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8b829532c.mp3', // Simple Click
    water: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_cda839211d.mp3', // Water Drop
    error: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_c6ccf3232f.mp3', // Error Buzz
    coin: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_03d2572f88.mp3', // Coin Clink
    paper: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c3b0067332.mp3', // Paper Crumple
    fire: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_5b82e22c9c.mp3', // Fire/Whoosh
    sparkle: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_804e38692c.mp3', // Sparkle/Chime
  },
  hover: {
    scifi: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2434522961.mp3', // High pitch blip/Swoosh
    low: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_a777659546.mp3',   // Low thud/Static
    wind: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1e65.mp3',  // Wind woosh
    metal: 'https://cdn.pixabay.com/download/audio/2022/03/19/audio_823336d396.mp3', // Light Metal
  }
}

// --- NEW YouTube ID Assignments ---
// Sourcing new, distinct IDs for better variety:
const NEW_YOUTUBE_IDS = {
    TRADING_FLOOR: 'B_79U36a4r8',      // Bull Market trading floor ambient
    LOFI_STUDY: 'jfKfPfyJRdk',         // Lofi Girl Study
    CYBERPUNK_DRIVE: 'k0CjYFhF-r4',    // Cyberpunk Drive Phonk/Synth
    DARK_AMBIENT: 'gA7hH-p201Y',       // Tension / Dark Drone
    OCEAN_AMBIENT: 'Z-2D5jN366A',      // Deep ocean soundscape
    EPIC_CINEMATIC: 'G1G4-g8c3Lw',     // Epic Orchestral
    TENSION_DRONE: 'aY511L-W-F8',      // Dramatic tension/Crash sound
    DREAMY_SYNTH: 'l1KqfT-N0gA',       // Dreamy Synth Pop
    FRANTIC_TECHNO: 'n1S4L5_Qe-s',     // Frantic techno/EDM
    EIGHTIES_SYNTH: 'Qv1cO_G_a8w',     // 80s Retrowave/Synth
    SPACE_AMBIENCE: '9w2Vw9x2a44',     // Deep Space Ambience
    MELANCHOLY_LOFI: 'KzQ2_iO7Wk0',    // Sad Piano / Melancholy Lofi
    TERMINAL_LOFI: '3n0Ff3mQ4-c',      // Clean Terminal Sound Ambient
    UPBEAT_CORPORATE: 'h7JvR2yOQ6s',   // Triumph/Upbeat Corporate Music
    INDUSTRIAL_NOISE: 'z2YkRjG7g1w',   // Rekt Industrial Noise Drone
    CYBERDECK_AMBIENT: '8gw-QYl0jJc',  // Cyberdeck Terminal Ambient
    BITCOIN_AMBIENT: 'S5A03_nN6-8',    // Ambient Mining Sound
    ETH_AMBIENT: 'Jg_1T0f_y94',        // Ethereum Merge Ambient/Context
    XRP_TECHNO: '6U-o8i-95uE',         // XRP Ledger Techno Ambient
    SOLANA_TECHNO: 'yFp8Jb3qS9k',      // High Tempo Techno / Solana Velocity
    CARDANO_LOFI: '5-E8a2g02pA',       // Cardano Academic Lofi
    BINANCE_AMBIENT: 'rC4N66iF-aA',    // Trading Floor Soundscape (General)
    POLKADOT_SYNTH: 'o2uA-M5W4sI',      // Polkadot Interconnected Synth
    ORACLE_DATA: '4I5rGkQ7b_g',        // Chainlink Oracle Data Music
    AVALANCHE_TECHNO: 'A03_h1B1h0o',    // Avalanche Subnet Speed Techno
    VAULT_AMBIENT: 'q-9c4Lg1G2o',      // Gold Bullion Vault Ambient Sound
    METAL_PRESS: 'xS-l-z2o2nI',        // Industrial Metal Pressing Soundscape
    OIL_RIG_DRONE: 'Y9j2O8X6S7Q',      // Oil Rig Machinery Drone
    OFFICE_JAZZ: '8lR7C4N-K-M',        // Real Estate Office Ambient Jazz
    FOREX_TRADING: 'q0q4aHw0F3c',      // Forex Market Trading Music
    CITY_AMBIENT: 'sF7L-69t4gI',       // Wall Street Busy City Ambient
    TOKYO_NEON: 'z2h_4iL-4q4',         // Tokyo Neon Cyberpunk Music
    RAIN_JAZZ: 'oN21w5x1Y-w',          // London Rain Cafe Jazz
    DUBAI_LUXURY: '8h5r8o5M-2w',       // Dubai Luxury Hotel Ambient
    BEACH_WAVES: '9gJ0_0u93Lw',        // Bitcoin Beach Waves
    HISTORICAL_AUDIO: 'j8T90c-A1bQ',   // 1929 Stock Market Historical Audio
    CHIPTUNE_LOOP: 'dJ5tV3b2g5U',      // Gameboy Chiptune Loop
    GLITCH_STATIC: 'Q-9T-5Q-9lU',      // Y2K Internet Dial Up Ambience / Glitch
    ARCHITECT_AMBIENT: '7Q3Z8_a-5wA',  // Blueprint Architect Design Ambient
    JAZZ_LOOP: 'Y-0C7c7b8Cg',          // Roaring 20s Jazz Background Loop
    WILD_WEST: 'A8B2d9z8j3w',          // Wild West Whistle Acoustic Loop
    THUNDERSTORM: 'oN21w5x1Y-w',       // Thunderstorm Lightning Soundscape (Reused Rain/Monsoon)
    RELAXATION_AMBIENT: '5E4hWp3h90U',  // Coping/Relaxation Lofi Beat
    PATRIOTIC_MUSIC: 'G1G4-g8c3Lw',    // Liberty Fireworks Patriotic Music
};

// --- 2. BASE THEMES (SPECIAL & SENTIMENT) ---
export const BASE_THEMES: Theme[] = [
  { 
    id: 'bull-money-special', name: 'Bull Money Chrome', description: 'Institutional Grade', category: 'SPECIAL', 
    filter: 'grayscale(1) brightness(1.2) contrast(1.2) drop-shadow(0 0 1px rgba(0,255,255,0.8))', 
    mobileFilter: 'grayscale(1) brightness(1.1) contrast(1.1)', 
    illusion: 'NONE', accentColor: '#00FFFF', status: 'AVAILABLE',
    bgImage: 'https://images.unsplash.com/photo-1548685913-fe6678babe8d?auto=format&fit=crop&q=80&w=1000',
    bgBlendMode: 'overlay', bgOpacity: 0.15,
    audioUrl: SFX.click.scifi,
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.TRADING_FLOOR // Retained
  },
  { 
    id: 'spec02', name: 'Whale Watch', description: 'Deep Ocean Liquidity', category: 'SPECIAL', 
    filter: 'sepia(1) hue-rotate(180deg) saturate(3) contrast(1.2)', 
    mobileFilter: 'sepia(1) hue-rotate(180deg)', illusion: 'VIGNETTE', accentColor: '#00008B', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.4, 
    audioUrl: SFX.click.water,
    hoverUrl: SFX.hover.scifi, 
    youtubeId: NEW_YOUTUBE_IDS.OCEAN_AMBIENT // Retained
  },
  { 
    id: 'spec03', name: 'Black Swan', description: 'Market Crash Event', category: 'SPECIAL', 
    filter: 'grayscale(1) brightness(0.5) contrast(2)', 
    mobileFilter: 'grayscale(1) contrast(1.5)', illusion: 'NOISE', accentColor: '#000000', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.6, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_3f3b92606e.mp3', 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.TENSION_DRONE // Retained
  },
  { 
    id: 'spec04', name: 'Unicorn', description: '1 Billion Valuation', category: 'SPECIAL', 
    filter: 'saturate(2) hue-rotate(300deg) brightness(1.2)', 
    mobileFilter: 'saturate(2)', illusion: 'GLITCH', accentColor: '#FF69B4', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.3, 
    audioUrl: SFX.click.sparkle,
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.DREAMY_SYNTH // Retained
  },
  { 
    id: 'spec05', name: 'Phoenix', description: 'Rebirth', category: 'SPECIAL', 
    filter: 'sepia(1) hue-rotate(320deg) saturate(5) contrast(1.3)', 
    mobileFilter: 'sepia(1) hue-rotate(320deg)', illusion: 'NONE', accentColor: '#FF4500', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1496360938681-9a9189d557dc?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.4, 
    audioUrl: SFX.click.fire,
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.EPIC_CINEMATIC // Retained
  },

  // SENTIMENT
  { 
    id: 'sent01', name: 'FOMO Frenzy', description: 'Buy High Sell Low', category: 'SENTIMENT', 
    filter: 'saturate(4) contrast(1.2) hue-rotate(10deg)', 
    mobileFilter: 'saturate(3)', illusion: 'GLITCH', accentColor: '#22C55E', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.3, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_734289569f.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.FRANTIC_TECHNO // Retained
  },
  { 
    id: 'sent02', name: 'Diamond Hands', description: 'Never Selling', category: 'SENTIMENT', 
    filter: 'brightness(1.5) contrast(0.8) sepia(1) hue-rotate(180deg)', 
    mobileFilter: 'brightness(1.2)', illusion: 'NONE', accentColor: '#B9F2FF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'hard-light', bgOpacity: 0.5, 
    audioUrl: SFX.click.sparkle, 
    hoverUrl: SFX.hover.metal,
    youtubeId: NEW_YOUTUBE_IDS.RELAXATION_AMBIENT // Used Lofi/Relaxation
  },
  { 
    id: 'sent03', name: 'Paper Hands', description: 'Weak', category: 'SENTIMENT', 
    filter: 'grayscale(0.8) blur(0.5px) opacity(0.8)', 
    mobileFilter: 'grayscale(0.8)', illusion: 'VIGNETTE', accentColor: '#D3D3D3', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1586075010923-2dd45eeed858?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.2, 
    audioUrl: SFX.click.paper,
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.MELANCHOLY_LOFI // Retained
  },
  { 
    id: 'sent04', name: 'Moon Mission', description: 'Parabolic', category: 'SENTIMENT', 
    filter: 'invert(0.9) hue-rotate(200deg)', 
    mobileFilter: 'invert(0.9)', illusion: 'NONE', accentColor: '#F0F0F0', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1532630571098-79a3d222b00d?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.4, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_b22f22d4f2.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.SPACE_AMBIENCE // Retained
  },
  { 
    id: 'sent05', name: 'Copium', description: 'It Will Recover', category: 'SENTIMENT', 
    filter: 'sepia(0.5) hue-rotate(250deg) saturate(0.5) blur(1px)', 
    mobileFilter: 'sepia(0.5) hue-rotate(250deg)', illusion: 'VIGNETTE', accentColor: '#9370DB', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1516557070061-c3d1653fa646?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'soft-light', bgOpacity: 0.3, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_34b3956329.mp3', 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.RELAXATION_AMBIENT // Retained
  },
  
  // Existing Base Themes
  { 
    id: 't01', name: 'Clean Slate', description: 'Standard Terminal', category: 'SENTIMENT', 
    filter: 'none', mobileFilter: 'none', illusion: 'NONE', accentColor: '#ffffff', status: 'AVAILABLE', bgImage: undefined, 
    audioUrl: SFX.click.mech,
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.TERMINAL_LOFI // Retained
  },
  { 
    id: 't02', name: 'God Candle', description: 'Max Bidding', category: 'SENTIMENT', 
    filter: 'sepia(1) hue-rotate(100deg) saturate(4) brightness(1.1) contrast(1.1)', 
    mobileFilter: 'sepia(1) hue-rotate(100deg) saturate(3)', illusion: 'VIGNETTE', accentColor: '#10B981', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'soft-light', bgOpacity: 0.2, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/19/audio_97af2892a3.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.UPBEAT_CORPORATE // Retained
  },
  { 
    id: 't03', name: 'Rekt City', description: 'Max Pain', category: 'SENTIMENT', 
    filter: 'sepia(1) hue-rotate(320deg) saturate(6) contrast(1.5) brightness(0.9)', 
    mobileFilter: 'sepia(1) hue-rotate(320deg) saturate(4)', illusion: 'NOISE', accentColor: '#EF4444', status: 'UNAVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1519638831568-d9897f54ed69?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.3, 
    audioUrl: SFX.click.error,
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.INDUSTRIAL_NOISE // Retained
  },
  { 
    id: 'o04', name: 'Cyberdeck', description: 'Netrunner Interface', category: 'OPTICS', 
    filter: 'hue-rotate(190deg) saturate(2) contrast(1.2) brightness(0.8)', 
    mobileFilter: 'hue-rotate(190deg) saturate(1.5)', illusion: 'SCANLINES', accentColor: '#0EA5E9', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.15, 
    audioUrl: SFX.click.scifi,
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.CYBERDECK_AMBIENT // Retained
  },
];

// --- 3. CRYPTO ASSET THEMES ---
export const CRYPTO_THEMES: Theme[] = [
  { 
    id: 'c01', name: 'Bitcoin Core', description: 'Digital Gold', category: 'CRYPTO', 
    filter: 'sepia(1) hue-rotate(15deg) saturate(4) contrast(1.1)', 
    mobileFilter: 'sepia(1) hue-rotate(15deg) saturate(3)', illusion: 'NONE', accentColor: '#F7931A', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.25, 
    audioUrl: SFX.click.coin,
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.BITCOIN_AMBIENT // Retained
  },
  { 
    id: 'c02', name: 'Ethereum Gas', description: 'Ultrasound Money', category: 'CRYPTO', 
    filter: 'sepia(1) hue-rotate(190deg) saturate(3) brightness(1.1) drop-shadow(0 0 2px #627EEA)', 
    mobileFilter: 'sepia(1) hue-rotate(190deg) saturate(2)', illusion: 'VIGNETTE', accentColor: '#627EEA', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'color-dodge', bgOpacity: 0.3, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2434522961.mp3', 
    hoverUrl: SFX.hover.metal, 
    youtubeId: NEW_YOUTUBE_IDS.ETH_AMBIENT // Retained
  },
  { 
    id: 'c06', name: 'XRP Ledger', description: 'The Standard', category: 'CRYPTO', 
    filter: 'sepia(1) hue-rotate(180deg) saturate(4) contrast(1.2) brightness(0.9)', 
    mobileFilter: 'sepia(1) hue-rotate(180deg) saturate(3)', illusion: 'NONE', accentColor: '#00AAE4', status: 'AVAILABLE', 
    audioUrl: SFX.click.water,
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.XRP_TECHNO // Retained
  },
  { 
    id: 'c07', name: 'Solana Velocity', description: 'Proof of History', category: 'CRYPTO', 
    filter: 'invert(1) hue-rotate(240deg) saturate(2) contrast(1.1)', 
    mobileFilter: 'invert(1) hue-rotate(240deg)', illusion: 'GLITCH', accentColor: '#9945FF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1504194098488-82db3332077e?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.4, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_734289569f.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.SOLANA_TECHNO // Retained
  },
  { 
    id: 'c11', name: 'Monero Privacy', description: 'Stealth Mode', category: 'CRYPTO', 
    filter: 'grayscale(1) invert(0.9) contrast(2) brightness(0.6)', 
    mobileFilter: 'grayscale(1) invert(0.9)', illusion: 'NOISE', accentColor: '#FF6600', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.4, 
    audioUrl: SFX.hover.low, 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.DARK_AMBIENT // Retained
  },
  { 
    id: 'c12', name: 'Cardano Ada', description: 'Academic Rigor', category: 'CRYPTO', 
    filter: 'sepia(1) hue-rotate(200deg) saturate(2) brightness(1.1)', 
    mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#0033AD', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.2, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_34b3956329.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.CARDANO_LOFI // Retained
  },
  { 
    id: 'c13', name: 'Binance Chain', description: 'CeDeFi Power', category: 'CRYPTO', 
    filter: 'sepia(1) hue-rotate(45deg) saturate(5) contrast(1.1)', 
    mobileFilter: 'sepia(1) hue-rotate(45deg)', illusion: 'VIGNETTE', accentColor: '#F3BA2F', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'soft-light', bgOpacity: 0.3, 
    audioUrl: SFX.click.coin,
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.BINANCE_AMBIENT // Retained
  },
  { 
    id: 'c14', name: 'Polkadot', description: 'Interoperability', category: 'CRYPTO', 
    filter: 'hue-rotate(300deg) saturate(2) contrast(1.2)', 
    mobileFilter: 'hue-rotate(300deg)', illusion: 'SCANLINES', accentColor: '#E6007A', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1506318137071-a8bcbf6d919d?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.2, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2434522961.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.POLKADOT_SYNTH // Retained
  },
  { 
    id: 'c15', name: 'Chainlink', description: 'The Oracle', category: 'CRYPTO', 
    filter: 'hue-rotate(220deg) saturate(3) brightness(0.8)', 
    mobileFilter: 'hue-rotate(220deg)', illusion: 'CRT', accentColor: '#2A5ADA', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.3, 
    audioUrl: SFX.click.scifi,
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.ORACLE_DATA // Retained
  },
  { 
    id: 'c16', name: 'Avalanche', description: 'Subnet Speed', category: 'CRYPTO', 
    filter: 'sepia(1) hue-rotate(320deg) saturate(4) brightness(1.2)', 
    mobileFilter: 'sepia(1) hue-rotate(320deg)', illusion: 'NONE', accentColor: '#E84142', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1519865885898-a54a6f2c7eea?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.3, 
    audioUrl: SFX.click.fire, 
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.AVALANCHE_TECHNO // Retained
  },
];

// --- 4. ASSETS THEMES ---
export const ASSET_THEMES: Theme[] = [
  { 
    id: 'ass01', name: 'Gold Bullion', description: 'Store of Value', category: 'ASSETS', 
    filter: 'sepia(1) saturate(5) brightness(1.1) contrast(1.2)', 
    mobileFilter: 'sepia(1) saturate(4)', illusion: 'NONE', accentColor: '#FFD700', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'soft-light', bgOpacity: 0.4, 
    audioUrl: SFX.click.coin,
    hoverUrl: SFX.hover.metal,
    youtubeId: NEW_YOUTUBE_IDS.VAULT_AMBIENT // Retained
  },
  { 
    id: 'ass02', name: 'Silver Stack', description: 'Industrial Metal', category: 'ASSETS', 
    filter: 'grayscale(1) brightness(1.3) contrast(1.4)', 
    mobileFilter: 'grayscale(1) brightness(1.2)', illusion: 'NONE', accentColor: '#C0C0C0', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1624365172764-135d5eed6b51?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.3, 
    audioUrl: SFX.hover.metal, 
    hoverUrl: SFX.hover.metal,
    youtubeId: NEW_YOUTUBE_IDS.METAL_PRESS // Retained
  },
  { 
    id: 'ass03', name: 'Oil Tycoon', description: 'Black Gold', category: 'ASSETS', 
    filter: 'sepia(1) hue-rotate(350deg) saturate(0.5) contrast(2) brightness(0.6)', 
    mobileFilter: 'sepia(1) hue-rotate(350deg) contrast(1.5)', illusion: 'VIGNETTE', accentColor: '#363636', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1620216773357-194165d2109e?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.5, 
    audioUrl: SFX.click.fire, 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.OIL_RIG_DRONE // Retained
  },
  { 
    id: 'ass04', name: 'Real Estate', description: 'Prime Property', category: 'ASSETS', 
    filter: 'invert(1) hue-rotate(200deg) contrast(1.2)', 
    mobileFilter: 'invert(1) hue-rotate(200deg)', illusion: 'SCANLINES', accentColor: '#007FFF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.3, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_34b3956329.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.OFFICE_JAZZ // Retained
  },
  { 
    id: 'ass05', name: 'Forex Blue', description: 'Fiat Liquidity', category: 'ASSETS', 
    filter: 'hue-rotate(210deg) saturate(2) brightness(1.1)', 
    mobileFilter: 'hue-rotate(210deg)', illusion: 'NONE', accentColor: '#85bb65', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.3, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/19/audio_97af2892a3.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.FOREX_TRADING // Retained
  },
];

// --- 5. LOCATION THEMES ---
export const LOCATION_THEMES: Theme[] = [
  { 
    id: 'loc01', name: 'Wall Street', description: 'New York City', category: 'LOCATION', 
    filter: 'sepia(1) hue-rotate(200deg) saturate(1.5) contrast(1.2)', 
    mobileFilter: 'hue-rotate(200deg)', illusion: 'NONE', accentColor: '#1D4ED8', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1617155093730-a8bf47e3179d?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.3, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_59663e0ac1ad.mp3', 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.CITY_AMBIENT // Retained
  },
  { 
    id: 'loc02', name: 'Tokyo Neon', description: 'Cyberpunk City', category: 'LOCATION', 
    filter: 'hue-rotate(280deg) saturate(3) contrast(1.3) brightness(0.8)', 
    mobileFilter: 'hue-rotate(280deg) saturate(2)', illusion: 'GLITCH', accentColor: '#FF00FF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.4, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2434522961.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.TOKYO_NEON // Retained
  },
  { 
    id: 'loc03', name: 'London Fog', description: 'Old Money', category: 'LOCATION', 
    filter: 'grayscale(0.8) sepia(0.2) contrast(1.1) brightness(0.9)', 
    mobileFilter: 'grayscale(0.8)', illusion: 'NOISE', accentColor: '#708090', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.3, 
    audioUrl: SFX.click.water, 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.RAIN_JAZZ // Retained
  },
  { 
    id: 'loc04', name: 'Dubai Gold', description: 'Oil Wealth', category: 'LOCATION', 
    filter: 'sepia(1) hue-rotate(40deg) saturate(3) brightness(1.2)', 
    mobileFilter: 'sepia(1) hue-rotate(40deg)', illusion: 'NONE', accentColor: '#D4AF37', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1512453979798-5ea936a79402?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'soft-light', bgOpacity: 0.4, 
    audioUrl: SFX.click.fire, 
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.DUBAI_LUXURY // Retained
  },
  { 
    id: 'loc05', name: 'El Salvador', description: 'Bitcoin Beach', category: 'LOCATION', 
    filter: 'saturate(2) hue-rotate(160deg) contrast(1.1)', 
    mobileFilter: 'saturate(2)', illusion: 'VIGNETTE', accentColor: '#40E0D0', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1572506488737-013898285519?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.3, 
    audioUrl: SFX.click.water, 
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.BEACH_WAVES // Retained
  },
];

// --- 6. HISTORICAL ERAS ---
export const HISTORICAL_THEMES: Theme[] = [
  { 
    id: 'hist01', name: '1929 Crash', description: 'The Great Depression', category: 'HISTORICAL', 
    filter: 'grayscale(1) sepia(0.5) contrast(1.5) brightness(0.9) drop-shadow(0 0 1px black)', 
    mobileFilter: 'grayscale(1) sepia(0.5)', illusion: 'NOISE', overlay: 'ASH', accentColor: '#5C4033', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1586075010923-2dd45eeed858?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.4, 
    audioUrl: SFX.click.paper, 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.HISTORICAL_AUDIO // Retained
  },
  { 
    id: 'hist02', name: 'Retro 80s', description: 'Miami Vice', category: 'HISTORICAL', 
    filter: 'saturate(3) hue-rotate(300deg) contrast(1.2) brightness(1.1)', 
    mobileFilter: 'saturate(2) hue-rotate(300deg)', illusion: 'VIGNETTE', accentColor: '#FF00FF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.25, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2434522961.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.EIGHTIES_SYNTH // Retained
  },
  { 
    id: 'hist03', name: 'Gameboy 90s', description: 'Dot Matrix', category: 'HISTORICAL', 
    filter: 'sepia(1) hue-rotate(60deg) saturate(6) contrast(2) brightness(0.8)', 
    mobileFilter: 'sepia(1) hue-rotate(60deg) saturate(4)', illusion: 'SCANLINES', accentColor: '#8BAC0F', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.1, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/19/audio_97af2892a3.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.CHIPTUNE_LOOP // Retained
  },
  { 
    id: 'hist04', name: 'Y2K Blues', description: 'System Crash', category: 'HISTORICAL', 
    filter: 'hue-rotate(180deg) saturate(0.5) contrast(1.5) brightness(1.3)', 
    mobileFilter: 'hue-rotate(180deg) contrast(1.2)', illusion: 'GLITCH', accentColor: '#A5F3FC', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1492551557933-34265f7af79e?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.2, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_734289569f.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.GLITCH_STATIC // Retained
  },
  { 
    id: 'hist05', name: 'Blueprint', description: 'Architect', category: 'HISTORICAL', 
    filter: 'invert(1) hue-rotate(190deg) saturate(3) contrast(1.2)', 
    mobileFilter: 'invert(1) hue-rotate(190deg)', illusion: 'NONE', accentColor: '#FFFFFF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.2, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_34b3956329.mp3', 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.ARCHITECT_AMBIENT // Retained
  },
  { 
    id: 'hist06', name: 'Roaring 20s', description: 'Art Deco', category: 'HISTORICAL', 
    filter: 'sepia(1) contrast(1.5) brightness(0.8) drop-shadow(0 0 2px gold)', 
    mobileFilter: 'sepia(1) contrast(1.2)', illusion: 'NONE', accentColor: '#FFD700', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1550136513-548af4445338?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.3, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/19/audio_14271735a2.mp3', 
    hoverUrl: SFX.click.sparkle,
    youtubeId: NEW_YOUTUBE_IDS.JAZZ_LOOP // Retained
  },
  { 
    id: 'hist07', name: 'Wild West', description: 'Gold Rush', category: 'HISTORICAL', 
    filter: 'sepia(1) hue-rotate(340deg) saturate(2) contrast(1.3)', 
    mobileFilter: 'sepia(1) hue-rotate(340deg)', illusion: 'NOISE', accentColor: '#8B4513', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1533167649158-6d508895b680?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.4, 
    audioUrl: SFX.click.fire, 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.WILD_WEST // Retained
  },
  { 
    id: 'hist08', name: 'Steampunk', description: 'Victorian Gear', category: 'HISTORICAL', 
    filter: 'sepia(1) hue-rotate(350deg) saturate(2) contrast(1.4) brightness(0.9)', 
    mobileFilter: 'sepia(1) hue-rotate(350deg)', illusion: 'VIGNETTE', accentColor: '#cd7f32', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1544252899-722a472d7335?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.4, 
    audioUrl: SFX.click.fire, 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.ARCHITECT_AMBIENT // Reused Architect for Steampunk gear ambient
  },
  { 
    id: 'hist09', name: 'Ancient Rome', description: 'Marble & Stone', category: 'HISTORICAL', 
    filter: 'grayscale(0.5) brightness(1.2) contrast(1.1)', 
    mobileFilter: 'grayscale(0.5)', illusion: 'NONE', accentColor: '#F5F5DC', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1529309486214-dc48184d0354?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'soft-light', bgOpacity: 0.3, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_34b3956329.mp3', 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.CITY_AMBIENT // Reused City ambient
  },
  { 
    id: 'hist10', name: 'Cyber 2077', description: 'High Tech Low Life', category: 'HISTORICAL', 
    filter: 'hue-rotate(290deg) saturate(3) contrast(1.3)', 
    mobileFilter: 'hue-rotate(290deg) saturate(2)', illusion: 'GLITCH', accentColor: '#FFFF00', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1515630278258-407f66498911?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.3, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2434522961.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.TOKYO_NEON // Reused Tokyo Neon
  },
];

// --- 7. CONCEPTS THEMES ---
export const CONCEPT_THEMES: Theme[] = [
  { 
    id: 'con01', name: 'Leverage', description: '100x Long', category: 'CONCEPTS', 
    filter: 'sepia(1) hue-rotate(90deg) saturate(4) contrast(1.5)', 
    mobileFilter: 'sepia(1) hue-rotate(90deg) saturate(3)', illusion: 'VIGNETTE', accentColor: '#39FF14', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.3, 
    audioUrl: SFX.click.fire, 
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.FRANTIC_TECHNO // Reused Frantic Techno
  },
  { 
    id: 'con02', name: 'Liquidity', description: 'Flow State', category: 'CONCEPTS', 
    filter: 'hue-rotate(180deg) saturate(2) brightness(1.1)', 
    mobileFilter: 'hue-rotate(180deg)', illusion: 'NONE', accentColor: '#00BFFF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1505569127510-77cb70402ae8?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'soft-light', bgOpacity: 0.4, 
    audioUrl: SFX.click.water, 
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.OCEAN_AMBIENT // Reused Ocean Ambient
  },
  { 
    id: 'con03', name: 'HODL', description: 'Stone Hands', category: 'CONCEPTS', 
    filter: 'grayscale(1) contrast(1.5) brightness(0.8)', 
    mobileFilter: 'grayscale(1) contrast(1.2)', illusion: 'NOISE', accentColor: '#808080', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1444858345149-8f4088233975?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.5, 
    audioUrl: SFX.hover.low, 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.DARK_AMBIENT // Reused Dark Ambient
  },
  { 
    id: 'con04', name: 'DeFi Blocks', description: 'Money Legos', category: 'CONCEPTS', 
    filter: 'saturate(3) hue-rotate(10deg) brightness(1.2)', 
    mobileFilter: 'saturate(2)', illusion: 'NONE', accentColor: '#FF4500', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.3, 
    audioUrl: SFX.click.coin, 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.CYBERDECK_AMBIENT // Reused Cyberdeck Ambient
  },
  { 
    id: 'con05', name: 'Yield Farm', description: 'Harvest Season', category: 'CONCEPTS', 
    filter: 'sepia(1) hue-rotate(60deg) saturate(3) brightness(1.1)', 
    mobileFilter: 'sepia(1) hue-rotate(60deg)', illusion: 'NONE', accentColor: '#7CFC00', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.3, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/19/audio_14271735a2.mp3', 
    hoverUrl: SFX.click.sparkle,
    youtubeId: NEW_YOUTUBE_IDS.BEACH_WAVES // Reused Beach Waves (Nature ambiance)
  },
];

// --- 8. GLITCH THEMES ---
export const GLITCH_THEMES: Theme[] = [
  { 
    id: 'glt01', name: 'BSOD', description: 'Fatal Error', category: 'GLITCH', 
    filter: 'invert(1) hue-rotate(180deg) contrast(1.5) brightness(0.8)', 
    mobileFilter: 'invert(1) hue-rotate(180deg)', illusion: 'GLITCH', accentColor: '#0000AA', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.4, 
    audioUrl: SFX.click.error,
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.TENSION_DRONE // Reused Tension Drone for error state
  },
  { 
    id: 'glt02', name: 'Missing Texture', description: 'Null Object', category: 'GLITCH', 
    filter: 'saturate(0) drop-shadow(4px 4px 0 #FF00FF)', 
    mobileFilter: 'saturate(0)', illusion: 'CRT', accentColor: '#FF00FF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.3, 
    audioUrl: SFX.click.scifi, 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.TERMINAL_LOFI // Reused Terminal Lofi
  },
  { 
    id: 'glt03', name: 'Deep Fried', description: 'Overclocked', category: 'GLITCH', 
    filter: 'saturate(10) contrast(2) brightness(1.2) hue-rotate(-20deg)', 
    mobileFilter: 'saturate(5) contrast(1.5)', illusion: 'NOISE', accentColor: '#FFA500', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1501619951397-5ba40d0f75da?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.5, 
    audioUrl: SFX.click.error, 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.INDUSTRIAL_NOISE // Reused Industrial Noise
  },
  { 
    id: 'glt04', name: 'Datamosh', description: 'Pixel Bleed', category: 'GLITCH', 
    filter: 'hue-rotate(90deg) blur(1px) contrast(1.5)', 
    mobileFilter: 'hue-rotate(90deg)', illusion: 'GLITCH', accentColor: '#00FF00', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1510511233900-1982d92bd635?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'soft-light', bgOpacity: 0.4, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2434522961.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.GLITCH_STATIC // Reused Glitch Static
  },
  { 
    id: 'glt05', name: 'Static Void', description: 'No Signal', category: 'GLITCH', 
    filter: 'grayscale(1) contrast(2) brightness(1.5) invert(1)', 
    mobileFilter: 'grayscale(1) invert(1)', illusion: 'NOISE', accentColor: '#FFFFFF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.2, 
    audioUrl: SFX.hover.low, 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.BINANCE_AMBIENT // Reused Trading Floor Ambient for noise
  },
];

// --- 9. ELEMENTAL THEMES ---
export const ELEMENTAL_THEMES: Theme[] = [
  { 
    id: 'elm01', name: 'Inferno', description: 'Fire Style', category: 'ELEMENTAL', 
    filter: 'sepia(1) hue-rotate(320deg) saturate(5) contrast(1.3)', 
    mobileFilter: 'sepia(1) hue-rotate(320deg)', illusion: 'VIGNETTE', accentColor: '#FF4500', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1496360938681-9a9189d557dc?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.4, 
    audioUrl: SFX.click.fire, 
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.OIL_RIG_DRONE // Reused Oil Rig Drone (Machinery/Heat)
  },
  { 
    id: 'elm02', name: 'Ocean Depth', description: 'Water Style', category: 'ELEMENTAL', 
    filter: 'sepia(1) hue-rotate(190deg) saturate(3) brightness(0.8)', 
    mobileFilter: 'sepia(1) hue-rotate(190deg)', illusion: 'NONE', overlay: 'BUBBLES', accentColor: '#00BFFF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.4, 
    audioUrl: SFX.click.water, 
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.OCEAN_AMBIENT // Retained
  },
  { 
    id: 'elm03', name: 'Terra Firma', description: 'Earth Style', category: 'ELEMENTAL', 
    filter: 'sepia(1) hue-rotate(50deg) saturate(2) contrast(1.2)', 
    mobileFilter: 'sepia(1) hue-rotate(50deg)', illusion: 'NOISE', accentColor: '#228B22', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.3, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/19/audio_14271735a2.mp3', 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.BEACH_WAVES // Reused Beach Waves (Nature ambiance)
  },
  { 
    id: 'elm04', name: 'Zephyr', description: 'Air Style', category: 'ELEMENTAL', 
    filter: 'brightness(1.2) saturate(0.5) hue-rotate(180deg)', 
    mobileFilter: 'brightness(1.1)', illusion: 'NONE', accentColor: '#E0FFFF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.3, 
    audioUrl: SFX.click.fire, 
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.WILD_WEST // Reused Wild West (Wind sounds/open space)
  },
  { 
    id: 'elm05', name: 'Stormborn', description: 'Lightning Style', category: 'ELEMENTAL', 
    filter: 'invert(1) hue-rotate(240deg) contrast(1.3)', 
    mobileFilter: 'invert(1) hue-rotate(240deg)', illusion: 'GLITCH', accentColor: '#9370DB', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'soft-light', bgOpacity: 0.3, 
    audioUrl: SFX.click.sparkle, 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.RAIN_JAZZ // Reused Rain/Jazz (Thunderstorm ambiance)
  },
];

// --- 10. MEME THEMES ---
export const MEME_THEMES: Theme[] = [
  { 
    id: 'c09', name: 'Doge', description: '1 DOGE = 1 DOGE', category: 'MEME', 
    filter: 'sepia(1) saturate(3) hue-rotate(35deg) brightness(1.2)', 
    mobileFilter: 'sepia(1) saturate(2) hue-rotate(35deg)', illusion: 'NONE', overlay: 'CONFETTI', accentColor: '#BA9F33', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.5, 
    audioUrl: SFX.hover.low, 
    hoverUrl: SFX.click.sparkle,
    youtubeId: NEW_YOUTUBE_IDS.LOFI_STUDY // Reused Lofi Girl (Playful/Chill)
  },
  { 
    id: 'mem01', name: 'Pepe Rare', description: 'Feels Good Man', category: 'MEME', 
    filter: 'saturate(5) hue-rotate(90deg) contrast(1.2)', 
    mobileFilter: 'saturate(3) hue-rotate(90deg)', illusion: 'NONE', accentColor: '#4C9F45', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'soft-light', bgOpacity: 0.3, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_34b3956329.mp3', 
    hoverUrl: SFX.click.mech,
    youtubeId: NEW_YOUTUBE_IDS.RELAXATION_AMBIENT // Reused Relaxation Ambient
  },
  { 
    id: 'mem02', name: 'Shiba Inu', description: 'Doge Killer', category: 'MEME', 
    filter: 'sepia(1) hue-rotate(15deg) saturate(3) contrast(1.3)', 
    mobileFilter: 'sepia(1) hue-rotate(15deg)', illusion: 'NOISE', accentColor: '#FFA500', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1583511655826-05700442b31b?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.3, 
    audioUrl: SFX.hover.low, 
    hoverUrl: SFX.click.sparkle,
    youtubeId: NEW_YOUTUBE_IDS.UPBEAT_CORPORATE // Reused Upbeat Corporate
  },
  { 
    id: 'mem03', name: 'Stonks', description: 'Only Go Up', category: 'MEME', 
    filter: 'invert(1) hue-rotate(180deg) saturate(0.5)', 
    mobileFilter: 'invert(1) hue-rotate(180deg)', illusion: 'GLITCH', accentColor: '#0000FF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.2, 
    audioUrl: SFX.click.coin, 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.FRANTIC_TECHNO // Reused Frantic Techno
  },
  { 
    id: 'mem04', name: 'Laser Eyes', description: 'Maximalist', category: 'MEME', 
    filter: 'sepia(1) hue-rotate(350deg) saturate(6) contrast(1.5)', 
    mobileFilter: 'sepia(1) hue-rotate(350deg) saturate(4)', illusion: 'VIGNETTE', accentColor: '#FF0000', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1535378437321-203846f205ce?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.4, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_734289569f.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.SOLANA_TECHNO // Reused Solana Techno (Intense Synth)
  },
  { 
    id: 'mem05', name: 'To The Moon', description: 'Rocket Ship', category: 'MEME', 
    filter: 'grayscale(1) brightness(1.5) contrast(1.2)', 
    mobileFilter: 'grayscale(1) brightness(1.2)', illusion: 'NONE', accentColor: '#FFFFFF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.3, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_b22f22d4f2.mp3', 
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.SPACE_AMBIENCE // Reused Space Ambience
  },
];

// --- 11. TRIPPY FX & OPTICS ---
export const TRIPPY_FX_THEMES: Theme[] = [
  { 
    id: 'fx01', name: 'Anaglyph 3D', description: 'Red/Blue Shift', category: 'OPTICS', 
    filter: 'drop-shadow(-4px 0 0 rgba(255,0,0,0.5)) drop-shadow(4px 0 0 rgba(0,255,255,0.5)) contrast(1.2)', 
    mobileFilter: 'drop-shadow(-2px 0 0 rgba(255,0,0,0.5)) drop-shadow(2px 0 0 rgba(0,255,255,0.5))', illusion: 'GLITCH', accentColor: '#FF0055', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1542241647-9cbbada2b300?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.1, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2434522961.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.POLKADOT_SYNTH // Reused Polkadot Synth (Digital/Interconnected)
  },
  { 
    id: 'fx02', name: 'Night Ops', description: 'Phosphor Green', category: 'OPTICS', 
    filter: 'sepia(1) hue-rotate(80deg) saturate(10) contrast(2) brightness(0.6)', 
    mobileFilter: 'sepia(1) hue-rotate(80deg) saturate(5)', illusion: 'NOISE', accentColor: '#33FF00', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1517480448885-d60216698f1e?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.1, 
    audioUrl: SFX.click.fire, 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.DARK_AMBIENT // Reused Dark Ambient
  },
  { 
    id: 'fx03', name: 'LSD Trip', description: 'Ego Death', category: 'EXOTIC', 
    filter: 'hue-rotate(90deg) saturate(8) invert(1) contrast(1.5)', 
    mobileFilter: 'hue-rotate(90deg) saturate(4) invert(1)', illusion: 'GLITCH', accentColor: '#FF00FF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'color-dodge', bgOpacity: 0.3, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2434522961.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.DREAMY_SYNTH // Reused Dreamy Synth
  },
  { 
    id: 'fx05', name: 'Purple Haze', description: 'Deep Relaxation', category: 'ELEMENTAL', 
    filter: 'sepia(1) hue-rotate(240deg) saturate(3) contrast(1.1) brightness(0.8)', 
    mobileFilter: 'sepia(1) hue-rotate(240deg) saturate(2)', illusion: 'VIGNETTE', overlay: 'BUBBLES', accentColor: '#9D00FF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1536534596706-538d6df73786?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.3, 
    audioUrl: SFX.click.water, 
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.RELAXATION_AMBIENT // Reused Relaxation Ambient
  },
  { 
    id: 'e05', name: 'The Matrix', description: 'Source Code', category: 'EXOTIC', 
    filter: 'sepia(1) hue-rotate(70deg) saturate(6) contrast(1.5) brightness(0.6)', 
    mobileFilter: 'sepia(1) hue-rotate(70deg) saturate(4)', illusion: 'SCANLINES', accentColor: '#22C55E', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.2, 
    audioUrl: SFX.click.scifi, 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.ORACLE_DATA // Reused Oracle Data (Code/Data flow)
  },
  { 
    id: 'fx06', name: 'Thermal', description: 'Heat Signature', category: 'OPTICS', 
    filter: 'invert(1) hue-rotate(180deg) saturate(5) contrast(2)', 
    mobileFilter: 'invert(1) hue-rotate(180deg)', illusion: 'NONE', accentColor: '#FFA500', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1504333638930-c8787321eee0?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'hard-light', bgOpacity: 0.4, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2434522961.mp3', 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.OIL_RIG_DRONE // Reused Oil Rig Drone (Heat/Machinery)
  },
  { 
    id: 'fx07', name: 'X-Ray', description: 'Bone View', category: 'OPTICS', 
    filter: 'grayscale(1) invert(1) brightness(1.2) contrast(1.5)', 
    mobileFilter: 'grayscale(1) invert(1)', illusion: 'NONE', accentColor: '#FFFFFF', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.2, 
    audioUrl: SFX.click.fire, 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.HISTORICAL_AUDIO // Reused Historical Audio (Static/Scanner)
  },
  { 
    id: 'fx08', name: 'Kaleidoscope', description: 'Fractal', category: 'EXOTIC', 
    filter: 'hue-rotate(45deg) saturate(3) contrast(1.2)', 
    mobileFilter: 'hue-rotate(45deg)', illusion: 'GLITCH', accentColor: '#FF1493', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1549492423-40025948e75f?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.5, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/19/audio_97af2892a3.mp3', 
    hoverUrl: SFX.click.sparkle,
    youtubeId: NEW_YOUTUBE_IDS.DREAMY_SYNTH // Reused Dreamy Synth
  },
  { 
    id: 'fx09', name: 'Vaporwave', description: 'Aesthetics', category: 'EXOTIC', 
    filter: 'sepia(1) hue-rotate(280deg) saturate(2) brightness(1.1)', 
    mobileFilter: 'sepia(1) hue-rotate(280deg)', illusion: 'CRT', accentColor: '#FF69B4', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.4, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2434522961.mp3', 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.EIGHTIES_SYNTH // Reused 80s Synth
  },
  { 
    id: 'fx10', name: 'Nebula', description: 'Deep Space', category: 'EXOTIC', 
    filter: 'hue-rotate(240deg) saturate(2) contrast(1.2) brightness(0.7)', 
    mobileFilter: 'hue-rotate(240deg)', illusion: 'NONE', accentColor: '#9400D3', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.5, 
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_34b3956329.mp3', 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.SPACE_AMBIENCE // Reused Space Ambience
  },
];

// --- 12. SEASONAL THEMES ---
export const SEASONAL_THEMES: Theme[] = [
  // WINTER / CHRISTMAS
  { 
    id: 'szn01', name: 'Silent Night', description: 'Christmas Eve/Winter Chill', category: 'SEASONAL', 
    filter: 'saturate(0.5) brightness(1.3) hue-rotate(190deg) drop-shadow(0 0 5px white)', 
    mobileFilter: 'saturate(0.5) brightness(1.2)', illusion: 'VIGNETTE', overlay: 'SNOW', accentColor: '#A5F3FC', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1483664852095-d6cc68707056?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'soft-light', bgOpacity: 0.4,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/19/audio_97af2892a3.mp3', 
    hoverUrl: SFX.click.sparkle,
    youtubeId: NEW_YOUTUBE_IDS.MELANCHOLY_LOFI // Reused Melancholy Lofi (Quiet/Snow)
  },
  { 
    id: 'szn16', name: 'Winter Solstice', description: 'Deepest Winter', category: 'SEASONAL', 
    filter: 'grayscale(0.6) brightness(0.9) contrast(1.2) hue-rotate(200deg)', 
    mobileFilter: 'grayscale(0.6) brightness(0.9)', illusion: 'NOISE', overlay: 'SNOW', accentColor: '#DDA0DD', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1490610309990-25e24c6c9a2c?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.3,
    audioUrl: SFX.click.fire, 
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.WILD_WEST // Reused Wild West (Cold Wind sounds)
  },

  // VALENTINE'S DAY
  { 
    id: 'szn02', name: 'Love Potion', description: 'Valentine\'s Day', category: 'SEASONAL', 
    filter: 'sepia(1) hue-rotate(320deg) saturate(3) contrast(1.1)', 
    mobileFilter: 'sepia(1) hue-rotate(320deg)', illusion: 'NONE', overlay: 'HEARTS', accentColor: '#FF69B4', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'soft-light', bgOpacity: 0.3,
    audioUrl: SFX.click.sparkle, 
    hoverUrl: SFX.click.sparkle,
    youtubeId: NEW_YOUTUBE_IDS.DREAMY_SYNTH // Reused Dreamy Synth
  },

  // EASTER / SPRING
  { 
    id: 'szn11', name: 'Spring Bloom', description: 'Easter / Spring Sakura', category: 'SEASONAL', 
    filter: 'sepia(0.5) hue-rotate(310deg) saturate(2) brightness(1.2) contrast(1.1)', 
    mobileFilter: 'hue-rotate(310deg)', illusion: 'NONE', overlay: 'EGGS', accentColor: '#FFB7C5', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.3,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/19/audio_14271735a2.mp3', 
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.BEACH_WAVES // Reused Beach Waves (Nature ambiance)
  },

  // SUMMER / HOLIDAYS
  { 
    id: 'szn13', name: 'Midsummer', description: 'Summer Solstice', category: 'SEASONAL', 
    filter: 'sepia(1) hue-rotate(40deg) saturate(4) brightness(1.3) contrast(1.2)', 
    mobileFilter: 'sepia(1) hue-rotate(40deg)', illusion: 'NONE', overlay: 'NONE', accentColor: '#FFD700', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1501436513145-30f24e19fccb?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.3,
    audioUrl: SFX.click.water, 
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.DUBAI_LUXURY // Reused Dubai Luxury (Lounge music)
  },
  { 
    id: 'szn06', name: 'Liberty', description: 'National Holidays (July 4th)', category: 'SEASONAL', 
    filter: 'saturate(3) contrast(1.4) brightness(1.1)', 
    mobileFilter: 'saturate(2)', illusion: 'GLITCH', overlay: 'FIREWORKS', accentColor: '#EF4444', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1498931299472-f7a63a029763?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.3, 
    audioUrl: SFX.click.fire, 
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.EPIC_CINEMATIC // Reused Epic Cinematic
  },

  // AUTUMN / HALLOWEEN
  { 
    id: 'szn07', name: 'Harvest', description: 'Autumn / Falling Leaves', category: 'SEASONAL', 
    filter: 'sepia(1) hue-rotate(350deg) saturate(3) contrast(1.3) brightness(0.9)', 
    mobileFilter: 'sepia(1) hue-rotate(350deg) saturate(2)', illusion: 'NOISE', overlay: 'LEAVES', accentColor: '#EA580C', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1507371341162-63b7ef3c7e1e?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'soft-light', bgOpacity: 0.3,
    audioUrl: SFX.click.fire, 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.HISTORICAL_AUDIO // Reused Historical Audio (Ambient/Dullness)
  },
  { 
    id: 'szn08', name: 'Hallows Eve', description: 'Halloween', category: 'SEASONAL', 
    filter: 'invert(1) hue-rotate(260deg) contrast(1.5) brightness(0.7)', 
    mobileFilter: 'invert(1) hue-rotate(260deg)', illusion: 'GLITCH', overlay: 'PUMPKINS', accentColor: '#A855F7', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1509557965875-b88c97052f0e?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'overlay', bgOpacity: 0.4,
    audioUrl: SFX.click.error, 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.TENSION_DRONE // Reused Tension Drone
  },

  // ECONOMIC / SPECIAL EVENTS (USING YOUTUBE IDS)
  { 
    id: 'szn17', name: 'Fed Rate Cuts', description: 'Dovish Policy Shift', category: 'SEASONAL', 
    filter: 'sepia(1) hue-rotate(180deg) saturate(1.5) contrast(1.1) brightness(1.2)', 
    mobileFilter: 'sepia(1) hue-rotate(180deg)', illusion: 'NONE', overlay: 'BUBBLES', accentColor: '#00C9A7', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1505798577917-a6515a81e26f?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.2,
    audioUrl: SFX.click.mech,
    hoverUrl: SFX.hover.scifi,
    youtubeId: NEW_YOUTUBE_IDS.CARDANO_LOFI // Reused Cardano Lofi (Calm/Dovish)
  },
  { 
    id: 'szn18', name: 'Fed Hike', description: 'Hawkish Policy Shift', category: 'SEASONAL', 
    filter: 'grayscale(0.8) sepia(1) hue-rotate(320deg) contrast(1.3) brightness(0.9)', 
    mobileFilter: 'grayscale(0.8) sepia(1) hue-rotate(320deg)', illusion: 'NOISE', overlay: 'ASH', accentColor: '#A50000', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1582213782531-fae8b152d116?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.4,
    audioUrl: SFX.click.error, 
    hoverUrl: SFX.hover.low,
    youtubeId: NEW_YOUTUBE_IDS.DARK_AMBIENT // Reused Dark Ambient (Tense/Hawkish)
  },
  
  // EXISTING BUT LESS SPECIFIC SEASONAL
  { 
    id: 'szn10', name: 'Gatsby', description: 'New Year', category: 'SEASONAL', 
    filter: 'sepia(1) saturate(1) contrast(2) brightness(0.8) drop-shadow(0 0 3px gold)', 
    mobileFilter: 'sepia(1) contrast(1.5)', illusion: 'NONE', overlay: 'CONFETTI', accentColor: '#FACC15', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1516055532857-79cd811a4dfc?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'screen', bgOpacity: 0.4,
    audioUrl: SFX.click.sparkle, 
    hoverUrl: SFX.click.sparkle,
    youtubeId: NEW_YOUTUBE_IDS.JAZZ_LOOP // Retained
  },
  { 
    id: 'szn12', name: 'Monsoon', description: 'Rainy Season', category: 'SEASONAL', 
    filter: 'grayscale(1) brightness(0.8) contrast(1.2) blur(0.5px)', 
    mobileFilter: 'grayscale(1)', illusion: 'VIGNETTE', overlay: 'RAIN', accentColor: '#778899', status: 'AVAILABLE', 
    bgImage: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&q=80&w=1000', bgBlendMode: 'multiply', bgOpacity: 0.4,
    audioUrl: SFX.click.water, 
    hoverUrl: SFX.hover.wind,
    youtubeId: NEW_YOUTUBE_IDS.RAIN_JAZZ // Retained
  },
];

// --- 13. EXPORT ALL ---
export const ALL_THEMES: Theme[] = [
  ...BASE_THEMES, 
  ...CRYPTO_THEMES, 
  ...ASSET_THEMES,
  ...LOCATION_THEMES,
  ...HISTORICAL_THEMES,
  ...CONCEPT_THEMES,
  ...GLITCH_THEMES,
  ...ELEMENTAL_THEMES,
  ...MEME_THEMES,
  ...TRIPPY_FX_THEMES,
  ...SEASONAL_THEMES
];