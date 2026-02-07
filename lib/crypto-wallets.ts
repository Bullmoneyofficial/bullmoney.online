// ============================================================================
// CRYPTO WALLET CONFIGURATION - BullMoney Payment Addresses
// All wallet addresses for receiving crypto payments
// ============================================================================

export interface WalletAddress {
  id: string;
  coin: string;
  network: string;
  address: string;
  exchange: 'exodus' | 'binance' | 'base';
  symbol: string;
  color: string;
  icon: string; // CoinGecko icon ID or emoji
  decimals: number;
  minConfirmations: number;
  explorerUrl: (txHash: string) => string;
  addressExplorerUrl: string;
}

export interface CryptoPaymentMethod {
  id: string;
  name: string;
  description: string;
  coins: WalletAddress[];
}

// ── Exodus Wallet Addresses ────────────────────────────────────────────
const EXODUS_WALLETS: WalletAddress[] = [
  {
    id: 'exodus-eth',
    coin: 'ETH',
    network: 'Ethereum (ERC-20)',
    address: '0xfC851C016d1f4D4031f7d20320252cb283169DF3',
    exchange: 'exodus',
    symbol: 'Ξ',
    color: '#627EEA',
    icon: 'ethereum',
    decimals: 18,
    minConfirmations: 12,
    explorerUrl: (tx) => `https://etherscan.io/tx/${tx}`,
    addressExplorerUrl: 'https://etherscan.io/address/0xfC851C016d1f4D4031f7d20320252cb283169DF3',
  },
  {
    id: 'exodus-xrp',
    coin: 'XRP',
    network: 'XRP Ledger',
    address: 'rad8MFtd6UnBHwVcJZbK8LSG7WYNGHUCmB',
    exchange: 'exodus',
    symbol: '✕',
    color: '#00AAE4',
    icon: 'ripple',
    decimals: 6,
    minConfirmations: 1,
    explorerUrl: (tx) => `https://xrpscan.com/tx/${tx}`,
    addressExplorerUrl: 'https://xrpscan.com/account/rad8MFtd6UnBHwVcJZbK8LSG7WYNGHUCmB',
  },
  {
    id: 'exodus-usdt-eth',
    coin: 'USDT',
    network: 'Ethereum (ERC-20)',
    address: '0xfC851C016d1f4D4031f7d20320252cb283169DF3',
    exchange: 'exodus',
    symbol: '₮',
    color: '#26A17B',
    icon: 'tether',
    decimals: 6,
    minConfirmations: 12,
    explorerUrl: (tx) => `https://etherscan.io/tx/${tx}`,
    addressExplorerUrl: 'https://etherscan.io/address/0xfC851C016d1f4D4031f7d20320252cb283169DF3',
  },
  {
    id: 'exodus-usdt-tron',
    coin: 'USDT',
    network: 'Tron (TRC-20)',
    address: 'TZ4T5Z5RmjXVcWLfvpb6fQDibBFSFyEVoH',
    exchange: 'exodus',
    symbol: '₮',
    color: '#26A17B',
    icon: 'tether',
    decimals: 6,
    minConfirmations: 20,
    explorerUrl: (tx) => `https://tronscan.org/#/transaction/${tx}`,
    addressExplorerUrl: 'https://tronscan.org/#/address/TZ4T5Z5RmjXVcWLfvpb6fQDibBFSFyEVoH',
  },
  {
    id: 'exodus-sol',
    coin: 'SOL',
    network: 'Solana',
    address: 'BkELWyHiaCkw96k5iYK2iF4yZfhzDdQNzX8FcdK8zkWE',
    exchange: 'exodus',
    symbol: '◎',
    color: '#9945FF',
    icon: 'solana',
    decimals: 9,
    minConfirmations: 32,
    explorerUrl: (tx) => `https://solscan.io/tx/${tx}`,
    addressExplorerUrl: 'https://solscan.io/account/BkELWyHiaCkw96k5iYK2iF4yZfhzDdQNzX8FcdK8zkWE',
  },
  {
    id: 'exodus-doge',
    coin: 'DOGE',
    network: 'Dogecoin',
    address: 'DLcJqALLoAVcvTht2SGaEnTZXS3vR64MYe',
    exchange: 'exodus',
    symbol: 'Ð',
    color: '#C2A633',
    icon: 'dogecoin',
    decimals: 8,
    minConfirmations: 6,
    explorerUrl: (tx) => `https://dogechain.info/tx/${tx}`,
    addressExplorerUrl: 'https://dogechain.info/address/DLcJqALLoAVcvTht2SGaEnTZXS3vR64MYe',
  },
];

// ── Binance Wallet Addresses ──────────────────────────────────────────
const BINANCE_WALLETS: WalletAddress[] = [
  {
    id: 'binance-eth',
    coin: 'ETH',
    network: 'Ethereum (ERC-20)',
    address: '0xcd010464272d0190de122093bfc9106c5f37b1f3',
    exchange: 'binance',
    symbol: 'Ξ',
    color: '#627EEA',
    icon: 'ethereum',
    decimals: 18,
    minConfirmations: 12,
    explorerUrl: (tx) => `https://etherscan.io/tx/${tx}`,
    addressExplorerUrl: 'https://etherscan.io/address/0xcd010464272d0190de122093bfc9106c5f37b1f3',
  },
  {
    id: 'binance-btc',
    coin: 'BTC',
    network: 'Bitcoin (Taproot)',
    address: 'bc1purm66ng2asctqsl87jrjp6sk0sml6q8fpeymsl90pxdgsa70hm2qtramdl',
    exchange: 'binance',
    symbol: '₿',
    color: '#F7931A',
    icon: 'bitcoin',
    decimals: 8,
    minConfirmations: 3,
    explorerUrl: (tx) => `https://mempool.space/tx/${tx}`,
    addressExplorerUrl: 'https://mempool.space/address/bc1purm66ng2asctqsl87jrjp6sk0sml6q8fpeymsl90pxdgsa70hm2qtramdl',
  },
  {
    id: 'binance-sol',
    coin: 'SOL',
    network: 'Solana',
    address: 'AMRcDPbT5aM8iUabH5dFvFmSmyjpcd6eEpijnjytYrJ',
    exchange: 'binance',
    symbol: '◎',
    color: '#9945FF',
    icon: 'solana',
    decimals: 9,
    minConfirmations: 32,
    explorerUrl: (tx) => `https://solscan.io/tx/${tx}`,
    addressExplorerUrl: 'https://solscan.io/account/AMRcDPbT5aM8iUabH5dFvFmSmyjpcd6eEpijnjytYrJ',
  },
  {
    id: 'binance-doge',
    coin: 'DOGE',
    network: 'Dogecoin',
    address: 'DJX6PqD3y3cygeYtD9imbzHcEcuNScwenG',
    exchange: 'binance',
    symbol: 'Ð',
    color: '#C2A633',
    icon: 'dogecoin',
    decimals: 8,
    minConfirmations: 6,
    explorerUrl: (tx) => `https://dogechain.info/tx/${tx}`,
    addressExplorerUrl: 'https://dogechain.info/address/DJX6PqD3y3cygeYtD9imbzHcEcuNScwenG',
  },
  {
    id: 'binance-bnb',
    coin: 'BNB',
    network: 'BNB Smart Chain (BEP-20)',
    address: '0xcd010464272d0190de122093bfc9106c5f37b1f3',
    exchange: 'binance',
    symbol: '◆',
    color: '#F0B90B',
    icon: 'binancecoin',
    decimals: 18,
    minConfirmations: 15,
    explorerUrl: (tx) => `https://bscscan.com/tx/${tx}`,
    addressExplorerUrl: 'https://bscscan.com/address/0xcd010464272d0190de122093bfc9106c5f37b1f3',
  },
];

// ── Base Wallet Addresses ─────────────────────────────────────────────
const BASE_WALLETS: WalletAddress[] = [
  {
    id: 'base-eth',
    coin: 'ETH',
    network: 'Base (L2)',
    address: '0xa54530764D2FfAA8153E91389d877533c42D9f7e',
    exchange: 'base',
    symbol: 'Ξ',
    color: '#0052FF',
    icon: 'ethereum',
    decimals: 18,
    minConfirmations: 12,
    explorerUrl: (tx) => `https://basescan.org/tx/${tx}`,
    addressExplorerUrl: 'https://basescan.org/address/0xa54530764D2FfAA8153E91389d877533c42D9f7e',
  },
];

// ── UniSwap / DEX Address ─────────────────────────────────────────────
const UNISWAP_WALLETS: WalletAddress[] = [
  {
    id: 'uniswap-eth',
    coin: 'ETH',
    network: 'Uniswap / Base',
    address: '0x0Af36CCbFc528760D814C0B8a93B455359A542a2',
    exchange: 'base',
    symbol: 'Ξ',
    color: '#FF007A',
    icon: 'ethereum',
    decimals: 18,
    minConfirmations: 12,
    explorerUrl: (tx) => `https://basescan.org/tx/${tx}`,
    addressExplorerUrl: 'https://basescan.org/address/0x0Af36CCbFc528760D814C0B8a93B455359A542a2',
  },
];

// ── All wallets combined ──────────────────────────────────────────────
export const ALL_WALLETS: WalletAddress[] = [
  ...EXODUS_WALLETS,
  ...BINANCE_WALLETS,
  ...BASE_WALLETS,
  ...UNISWAP_WALLETS,
];

// ── Grouped by coin for easy lookup ───────────────────────────────────
export function getWalletsForCoin(coin: string): WalletAddress[] {
  return ALL_WALLETS.filter((w) => w.coin.toUpperCase() === coin.toUpperCase());
}

// ── Unique coins available ────────────────────────────────────────────
export const AVAILABLE_COINS = [
  { coin: 'BTC', name: 'Bitcoin', symbol: '₿', color: '#F7931A', icon: 'bitcoin' },
  { coin: 'ETH', name: 'Ethereum', symbol: 'Ξ', color: '#627EEA', icon: 'ethereum' },
  { coin: 'SOL', name: 'Solana', symbol: '◎', color: '#9945FF', icon: 'solana' },
  { coin: 'USDT', name: 'Tether', symbol: '₮', color: '#26A17B', icon: 'tether' },
  { coin: 'XRP', name: 'XRP', symbol: '✕', color: '#00AAE4', icon: 'ripple' },
  { coin: 'DOGE', name: 'Dogecoin', symbol: 'Ð', color: '#C2A633', icon: 'dogecoin' },
  { coin: 'BNB', name: 'BNB', symbol: '◆', color: '#F0B90B', icon: 'binancecoin' },
] as const;

// ── On-ramp providers for buying crypto ───────────────────────────────
export const ONRAMP_PROVIDERS = [
  {
    id: 'moonpay',
    name: 'MoonPay',
    description: 'Buy crypto with card or bank transfer',
    logo: 'https://www.moonpay.com/assets/logo-full-white.svg',
    color: '#7B61FF',
    getUrl: (coin: string, address: string, amount?: number) => {
      const params = new URLSearchParams({
        currencyCode: coin.toLowerCase(),
        walletAddress: address,
        ...(amount ? { baseCurrencyAmount: String(amount) } : {}),
      });
      return `https://www.moonpay.com/buy/${coin.toLowerCase()}?${params}`;
    },
  },
  {
    id: 'paybis',
    name: 'Paybis',
    description: 'Fast crypto purchases with low fees',
    logo: 'https://paybis.com/assets/paybis-logo-white.svg',
    color: '#00C26F',
    getUrl: (_coin: string, _address: string, _amount?: number) => {
      return 'https://paybis.com/';
    },
  },
] as const;

// ── Payment method options ────────────────────────────────────────────
export const CRYPTO_PAYMENT_METHODS: CryptoPaymentMethod[] = [
  {
    id: 'direct-send',
    name: 'Send Crypto Directly',
    description: 'Send from any wallet to our address',
    coins: ALL_WALLETS,
  },
  {
    id: 'buy-and-send',
    name: 'Buy Crypto & Pay',
    description: 'Purchase crypto via MoonPay or Paybis, then send',
    coins: ALL_WALLETS,
  },
];
