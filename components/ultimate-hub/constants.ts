// Auto-extracted from UltimateHub for modular structure
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Bitcoin,
  Coins,
  Cpu,
  Crown,
  Gauge,
  Globe,
  GraduationCap,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Shield,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Tv,
  Target,
  Users,
  User,
  Wifi,
  Chrome,
  Zap,
} from 'lucide-react';
import type { CalendarCountry, ChannelKey, DevicePanelTab, UnifiedHubTab } from './types';

export const TRADING_SYMBOLS = [
  { id: 'xauusd', name: 'XAUUSD', displayName: 'Gold', abbr: 'Gold', symbol: 'OANDA:XAUUSD', icon: Coins },
  { id: 'btcusd', name: 'BTCUSD', displayName: 'Bitcoin', abbr: 'BTC', symbol: 'BITSTAMP:BTCUSD', icon: Bitcoin },
  { id: 'eurusd', name: 'EURUSD', displayName: 'EUR/USD', abbr: 'EUR', symbol: 'FX:EURUSD', icon: Globe },
  { id: 'gbpusd', name: 'GBPUSD', displayName: 'GBP/USD', abbr: 'GBP', symbol: 'FX:GBPUSD', icon: Globe },
  { id: 'usdjpy', name: 'USDJPY', displayName: 'USD/JPY', abbr: 'JPY', symbol: 'FX:USDJPY', icon: Globe },
  { id: 'ethusd', name: 'ETHUSD', displayName: 'Ethereum', abbr: 'ETH', symbol: 'BITSTAMP:ETHUSD', icon: Coins },
] as const;

export const TELEGRAM_CHANNELS = {
  trades: { name: 'FREE TRADES', handle: 'bullmoneywebsite', icon: TrendingUp, color: 'cyan', requiresVip: false },
  main: { name: 'LIVESTREAMS', handle: 'bullmoneyfx', icon: MessageCircle, color: 'blue', requiresVip: false },
  shop: { name: 'NEWS', handle: 'Bullmoneyshop', icon: ShoppingBag, color: 'emerald', requiresVip: false },
  vip: { name: 'VIP TRADES', handle: '+yW5jIfxJpv9hNmY0', icon: Crown, color: 'blue', requiresVip: true, isPrivate: true },
  vip2: { name: 'VIP SETUPS', handle: '+uvegzpHfYdU2ZTZk', icon: Crown, color: 'blue', requiresVip: true, isPrivate: true },
} as const;

// Extended channel type that includes admin
export type ExtendedChannelKey = ChannelKey | 'admin' | 'vip2';

// Channel keys array for carousel navigation (includes admin)
export const EXTENDED_CHANNEL_KEYS: ExtendedChannelKey[] = ['trades', 'shop', 'vip2', 'vip', 'admin'];

// Extended channel info (only the ones we show in carousel)
export const EXTENDED_CHANNELS: { [key in ExtendedChannelKey]?: { name: string; icon: typeof TrendingUp; color: string; requiresVip?: boolean; isAdmin?: boolean } } = {
  trades: { name: 'FREE GROUPS', icon: TrendingUp, color: 'blue' },
  shop: { name: 'NEWS', icon: Newspaper, color: 'blue' },
  vip2: { name: 'VIP SETUPS', icon: Crown, color: 'blue', requiresVip: true },
  vip: { name: 'VIP GROUP', icon: Crown, color: 'blue', requiresVip: true },
  admin: { name: 'ADMIN', icon: Shield, color: 'blue', isAdmin: true },
};

// ============================================================================

export const BROWSERS = [
  {
    id: 'chrome', name: 'Chrome', fullName: 'Google Chrome', icon: Chrome,
    deepLink: {
      ios: (url: string) => url.startsWith('https') ? `googlechromes://${url.replace(/^https:\/\//, '')}` : `googlechrome://${url.replace(/^http:\/\//, '')}`,
      android: (url: string) => `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`,
      desktop: (url: string) => url
    },
    downloadUrl: 'https://www.google.com/chrome/',
    iosAppStore: 'https://apps.apple.com/app/id535886823',
    androidPlayStore: 'https://play.google.com/store/apps/details?id=com.android.chrome'
  },
  {
    id: 'firefox', name: 'Firefox', fullName: 'Firefox', icon: Globe,
    deepLink: {
      ios: (url: string) => `firefox://open-url?url=${encodeURIComponent(url)}`,
      android: (url: string) => `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=org.mozilla.firefox;end`,
      desktop: (url: string) => url
    },
    downloadUrl: 'https://www.mozilla.org/firefox/browsers/mobile/',
    iosAppStore: 'https://apps.apple.com/app/id989804926',
    androidPlayStore: 'https://play.google.com/store/apps/details?id=org.mozilla.firefox'
  },
  {
    id: 'safari', name: 'Safari', fullName: 'Safari', icon: Globe,
    deepLink: { ios: (url: string) => url, android: (url: string) => url, desktop: (url: string) => url },
    downloadUrl: 'https://support.apple.com/downloads/safari',
    iosAppStore: '', androidPlayStore: ''
  },
  {
    id: 'edge', name: 'Edge', fullName: 'Microsoft Edge', icon: Globe,
    deepLink: {
      ios: (url: string) => url.startsWith('https') ? `microsoft-edge-https://${url.replace(/^https:\/\//, '')}` : `microsoft-edge-http://${url.replace(/^http:\/\//, '')}`,
      android: (url: string) => `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.microsoft.emmx;end`,
      desktop: (url: string) => url
    },
    downloadUrl: 'https://www.microsoft.com/edge',
    iosAppStore: 'https://apps.apple.com/app/id1288723196',
    androidPlayStore: 'https://play.google.com/store/apps/details?id=com.microsoft.emmx'
  },
] as const;

export const TRADING_TIPS = [
  "Check the price out! 📈", "Gold often moves inverse to USD 💰", "Watch for support & resistance levels",
  "Use RSI for overbought/oversold signals", "MACD crossovers signal trend changes", "Volume confirms price movements",
  "Higher highs = bullish trend 🟢", "Lower lows = bearish trend 🔴", "200+ chart analysis tools inside!",
  "Set stop losses to manage risk", "News events move markets fast ⚡", "Fibonacci levels mark key zones",
  "Bollinger Bands show volatility", "Moving averages smooth price action", "Candlestick patterns reveal sentiment",
  "Doji = market indecision", "Engulfing candles signal reversals", "Head & shoulders = trend reversal",
  "Double tops/bottoms are key patterns", "Triangles precede breakouts", "Always check the daily timeframe",
  "Correlation: Gold vs DXY inverse 📊", "BTC leads crypto market moves", "London & NY sessions = high volume",
  "Asian session = range-bound trading", "NFP Fridays = major USD moves", "FOMC meetings = volatility spikes",
  "Risk management > prediction", "1% risk per trade is wise", "Trend is your friend 🎯",
  "Don't fight the Fed", "Buy the rumor, sell the news", "Patience is a trader's virtue",
  "Emotions kill trading accounts", "Journal every trade you make", "Backtest before going live",
  "Paper trade to learn first", "ATR measures true volatility", "Pivot points mark intraday levels",
  "VWAP is institutional favorite", "Order flow reveals big players", "Liquidity pools attract price",
  "Fair value gaps get filled", "Market structure = key concept", "Break of structure = momentum",
  "Change of character = reversal", "Smart money concepts work", "ICT methodology is powerful",
  "Supply & demand zones matter", "Imbalances create opportunities"
];

export const FEATURED_VIDEOS = ['Q3dSjSP3t8I', 'xvP1FJt-Qto'];

export const TRADING_LIVE_CHANNELS = [
  { id: 'UCrp_UI8XtuYfpiqluWLD7Lw', name: 'The Trading Channel' },
  { id: 'UCGnHwBJHZ0JCN8t8EA0PLQA', name: 'Rayner Teo' },
  { id: 'UC2C_jShtL725hvbm1arSV9w', name: 'Matt Kohrs' },
  { id: 'UCduLPLzWNkL-8aCJohrmJhw', name: 'Ziptrader' },
  { id: 'UCnqZ2hx679O1JBIRDlJNzKA', name: 'TradeZella' },
  { id: 'UCU8WjbDkHFUfIGBnrkA6zRg', name: 'Humbled Trader' },
  { id: 'UCpmAlqg4X-UdHcSL4aPTPqw', name: 'Warrior Trading' },
];

// Device Panel Tab Config
export const DEVICE_PANEL_TABS: { id: DevicePanelTab; label: string; icon: typeof Cpu }[] = [
  { id: 'overview', label: 'Overview', icon: Smartphone },
  { id: 'network', label: 'Network', icon: Wifi },
  { id: 'performance', label: 'Performance', icon: Gauge },
  { id: 'account', label: 'Account', icon: User },
];

// Calendar Countries
export const CALENDAR_COUNTRIES: { id: CalendarCountry; name: string; flag: string }[] = [
  { id: 'all', name: 'All', flag: '🌍' },
  { id: 'USD', name: 'USD', flag: '🇺🇸' },
  { id: 'EUR', name: 'EUR', flag: '🇪🇺' },
  { id: 'GBP', name: 'GBP', flag: '🇬🇧' },
  { id: 'JPY', name: 'JPY', flag: '🇯🇵' },
  { id: 'AUD', name: 'AUD', flag: '🇦🇺' },
  { id: 'CAD', name: 'CAD', flag: '🇨🇦' },
  { id: 'CHF', name: 'CHF', flag: '🇨🇭' },
  { id: 'NZD', name: 'NZD', flag: '🇳🇿' },
];

export const UNIFIED_HUB_TABS: { id: UnifiedHubTab; label: string; icon: typeof TrendingUp; color: string }[] = [
  { id: 'community', label: 'Social', icon: MessageSquare, color: 'blue' },
  { id: 'indicators', label: 'Indicators', icon: BarChart3, color: 'blue' },
  { id: 'news', label: 'News', icon: Newspaper, color: 'blue' },
  { id: 'trading', label: 'Trade', icon: TrendingUp, color: 'blue' },
  { id: 'livestream', label: 'Live TV', icon: Tv, color: 'blue' },
  { id: 'analysis', label: 'Analysis', icon: Target, color: 'blue' },
  { id: 'posts', label: 'Posts', icon: Users, color: 'blue' },
  { id: 'journal', label: 'Journal', icon: Calendar, color: 'blue' },
  { id: 'course', label: 'Course', icon: GraduationCap, color: 'blue' },
  { id: 'device', label: 'Device', icon: Smartphone, color: 'blue' },
  { id: 'logs', label: 'Logs', icon: AlertTriangle, color: 'blue' },
  { id: 'broker', label: 'Broker', icon: Zap, color: 'blue' },
];
