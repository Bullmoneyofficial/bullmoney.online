// Full catalog of tradeable instruments for MetaTrader Quotes
// Sources: Binance WebSocket (crypto), API route (forex/metals)

export type InstrumentType = 'crypto' | 'forex' | 'metal' | 'index';

export interface Instrument {
  symbol: string;
  displayName: string;
  type: InstrumentType;
  category: string;
  digits: number;
  pipette: boolean;
  binanceSymbol?: string;
  forexBase?: string;
  forexQuote?: string;
  metalId?: string;
  indexId?: string;
  defaultSpreadPips: number;
  suffix: string;
  contractSize?: number;
}

// ─── CRYPTO (Binance WebSocket) ──────────────────────────────
const crypto = (
  symbol: string,
  displayName: string,
  binanceSymbol: string,
  digits: number,
  pipette: boolean,
  spreadPips: number
): Instrument => ({
  symbol: `${symbol}USD`,
  displayName,
  type: 'crypto',
  category: 'Crypto',
  digits,
  pipette,
  binanceSymbol,
  defaultSpreadPips: spreadPips,
  suffix: '#',
});

// ─── FOREX ───────────────────────────────────────────────────
const forex = (
  base: string,
  quote: string,
  displayName: string,
  digits: number,
  spreadPips: number
): Instrument => ({
  symbol: `${base}${quote}`,
  displayName,
  type: 'forex',
  category: 'Forex',
  digits,
  pipette: digits >= 5,
  forexBase: base,
  forexQuote: quote,
  defaultSpreadPips: spreadPips,
  suffix: '',
});

// ─── METALS ──────────────────────────────────────────────────
const metal = (
  symbol: string,
  displayName: string,
  metalId: string,
  digits: number,
  pipette: boolean,
  spreadPips: number
): Instrument => ({
  symbol,
  displayName,
  type: 'metal',
  category: 'Metals',
  digits,
  pipette,
  metalId,
  defaultSpreadPips: spreadPips,
  suffix: 'm#',
});

// ─── INDICES ─────────────────────────────────────────────────
const index = (
  symbol: string,
  displayName: string,
  indexId: string,
  digits: number,
  spreadPips: number
): Instrument => ({
  symbol,
  displayName,
  type: 'index',
  category: 'Indices',
  digits,
  pipette: false,
  indexId,
  defaultSpreadPips: spreadPips,
  suffix: '',
});

export const ALL_INSTRUMENTS: Instrument[] = [
  // ══════════════════════════════════════════════════════════
  // CRYPTO — Real-time via Binance WebSocket
  // ══════════════════════════════════════════════════════════
  crypto('BTC',    'Bitcoin',           'BTCUSDT',    2, false, 50),
  crypto('ETH',    'Ethereum',          'ETHUSDT',    2, false, 30),
  crypto('BNB',    'BNB',               'BNBUSDT',    2, false, 20),
  crypto('XRP',    'Ripple',            'XRPUSDT',    4, true,  8),
  crypto('SOL',    'Solana',            'SOLUSDT',    2, false, 15),
  crypto('DOGE',   'Dogecoin',          'DOGEUSDT',   5, true,  5),
  crypto('ADA',    'Cardano',           'ADAUSDT',    4, true,  6),
  crypto('AVAX',   'Avalanche',         'AVAXUSDT',   2, false, 12),
  crypto('DOT',    'Polkadot',          'DOTUSDT',    3, true,  8),
  crypto('LINK',   'Chainlink',         'LINKUSDT',   2, false, 10),
  crypto('TRX',    'TRON',              'TRXUSDT',    5, true,  3),
  crypto('MATIC',  'Polygon',           'MATICUSDT',  4, true,  5),
  crypto('LTC',    'Litecoin',          'LTCUSDT',    2, false, 10),
  crypto('SHIB',   'Shiba Inu',         'SHIBUSDT',   8, true,  2),
  crypto('UNI',    'Uniswap',           'UNIUSDT',    3, true,  5),
  crypto('ATOM',   'Cosmos',            'ATOMUSDT',   3, true,  8),
  crypto('XLM',    'Stellar',           'XLMUSDT',    5, true,  3),
  crypto('NEAR',   'NEAR Protocol',     'NEARUSDT',   3, true,  6),
  crypto('APT',    'Aptos',             'APTUSDT',    2, false, 8),
  crypto('SUI',    'Sui',               'SUIUSDT',    4, true,  4),
  crypto('ARB',    'Arbitrum',          'ARBUSDT',    4, true,  4),
  crypto('OP',     'Optimism',          'OPUSDT',     3, true,  5),
  crypto('INJ',    'Injective',         'INJUSDT',    2, false, 8),
  crypto('FIL',    'Filecoin',          'FILUSDT',    3, true,  6),
  crypto('RENDER', 'Render',            'RENDERUSDT', 3, true,  5),
  crypto('FET',    'Fetch.ai',          'FETUSDT',    4, true,  4),
  crypto('ICP',    'Internet Computer', 'ICPUSDT',    2, false, 8),
  crypto('VET',    'VeChain',           'VETUSDT',    5, true,  3),
  crypto('ALGO',   'Algorand',          'ALGOUSDT',   4, true,  4),
  crypto('HBAR',   'Hedera',            'HBARUSDT',   5, true,  3),
  crypto('AAVE',   'Aave',              'AAVEUSDT',   2, false, 15),
  crypto('GRT',    'The Graph',         'GRTUSDT',    4, true,  3),
  crypto('SAND',   'The Sandbox',       'SANDUSDT',   4, true,  4),
  crypto('MANA',   'Decentraland',      'MANAUSDT',   4, true,  4),
  crypto('AXS',    'Axie Infinity',     'AXSUSDT',    2, false, 8),
  crypto('EGLD',   'MultiversX',        'EGLDUSDT',   2, false, 10),
  crypto('EOS',    'EOS',               'EOSUSDT',    3, true,  5),
  crypto('XTZ',    'Tezos',             'XTZUSDT',    3, true,  5),
  crypto('THETA',  'Theta Network',     'THETAUSDT',  3, true,  5),
  crypto('FTM',    'Fantom',            'FTMUSDT',    4, true,  3),
  crypto('PEPE',   'Pepe',              'PEPEUSDT',   8, true,  1),
  crypto('WIF',    'dogwifhat',         'WIFUSDT',    4, true,  4),
  crypto('BONK',   'Bonk',              'BONKUSDT',   8, true,  1),
  crypto('FLOKI',  'Floki',             'FLOKIUSDT',  7, true,  1),
  crypto('SEI',    'Sei',               'SEIUSDT',    4, true,  3),
  crypto('TIA',    'Celestia',          'TIAUSDT',    3, true,  5),
  crypto('JUP',    'Jupiter',           'JUPUSDT',    4, true,  3),
  crypto('STX',    'Stacks',            'STXUSDT',    3, true,  5),
  crypto('RUNE',   'THORChain',         'RUNEUSDT',   3, true,  5),
  crypto('ENS',    'ENS',               'ENSUSDT',    2, false, 8),
  crypto('CRV',    'Curve DAO',         'CRVUSDT',    3, true,  4),
  crypto('MKR',    'Maker',             'MKRUSDT',    2, false, 20),
  crypto('SUSHI',  'SushiSwap',         'SUSHIUSDT',  3, true,  4),
  crypto('COMP',   'Compound',          'COMPUSDT',   2, false, 10),
  crypto('SNX',    'Synthetix',         'SNXUSDT',    3, true,  5),
  crypto('1INCH',  '1inch',             '1INCHUSDT',  3, true,  4),
  crypto('CAKE',   'PancakeSwap',       'CAKEUSDT',   3, true,  5),
  crypto('LDO',    'Lido DAO',          'LDOUSDT',    3, true,  5),
  crypto('DYDX',   'dYdX',              'DYDXUSDT',   3, true,  5),
  crypto('IMX',    'Immutable',         'IMXUSDT',    3, true,  4),
  crypto('GALA',   'Gala',              'GALAUSDT',   4, true,  3),

  // ══════════════════════════════════════════════════════════
  // FOREX — Polled via API route (ECB + free sources)
  // ══════════════════════════════════════════════════════════
  forex('EUR', 'USD', 'Euro / US Dollar',             5, 12),
  forex('GBP', 'USD', 'British Pound / US Dollar',    5, 14),
  forex('USD', 'JPY', 'US Dollar / Japanese Yen',     3, 12),
  forex('USD', 'CHF', 'US Dollar / Swiss Franc',      5, 15),
  forex('AUD', 'USD', 'Australian Dollar / US Dollar', 5, 14),
  forex('USD', 'CAD', 'US Dollar / Canadian Dollar',  5, 16),
  forex('NZD', 'USD', 'New Zealand Dollar / US Dollar', 5, 18),
  forex('EUR', 'GBP', 'Euro / British Pound',         5, 15),
  forex('EUR', 'JPY', 'Euro / Japanese Yen',          3, 18),
  forex('GBP', 'JPY', 'British Pound / Japanese Yen', 3, 22),
  forex('AUD', 'JPY', 'Australian Dollar / Yen',      3, 18),
  forex('EUR', 'CHF', 'Euro / Swiss Franc',           5, 18),
  forex('EUR', 'AUD', 'Euro / Australian Dollar',     5, 20),
  forex('GBP', 'AUD', 'British Pound / Australian Dollar', 5, 25),
  forex('USD', 'SGD', 'US Dollar / Singapore Dollar', 5, 20),
  forex('USD', 'HKD', 'US Dollar / Hong Kong Dollar', 5, 20),
  forex('USD', 'NOK', 'US Dollar / Norwegian Krone',  5, 30),
  forex('USD', 'SEK', 'US Dollar / Swedish Krona',    5, 30),
  forex('USD', 'TRY', 'US Dollar / Turkish Lira',     5, 50),
  forex('USD', 'ZAR', 'US Dollar / South African Rand', 5, 40),
  forex('USD', 'MXN', 'US Dollar / Mexican Peso',     5, 35),
  forex('EUR', 'NZD', 'Euro / New Zealand Dollar',    5, 25),
  forex('GBP', 'CHF', 'British Pound / Swiss Franc',  5, 22),
  forex('GBP', 'CAD', 'British Pound / Canadian Dollar', 5, 25),
  forex('AUD', 'NZD', 'Australian Dollar / NZ Dollar', 5, 22),
  forex('AUD', 'CAD', 'Australian Dollar / Canadian Dollar', 5, 22),
  forex('NZD', 'JPY', 'New Zealand Dollar / Yen',     3, 20),
  forex('CHF', 'JPY', 'Swiss Franc / Japanese Yen',   3, 20),
  forex('CAD', 'JPY', 'Canadian Dollar / Japanese Yen', 3, 20),

  // ══════════════════════════════════════════════════════════
  // METALS — Polled via API route
  // ══════════════════════════════════════════════════════════
  metal('XAUUSD', 'Gold',      'XAU', 2, false, 30),
  metal('XAGUSD', 'Silver',    'XAG', 3, true,  20),
  metal('XPTUSD', 'Platinum',  'XPT', 2, false, 50),
  metal('XPDUSD', 'Palladium', 'XPD', 2, false, 80),

  // ══════════════════════════════════════════════════════════
  // INDICES — Polled via API route
  // ══════════════════════════════════════════════════════════
  index('US100',  'NASDAQ 100',    'NQ=F',   1, 100),
  index('US30',   'Dow Jones 30',  'YM=F',   0, 150),
  index('US500',  'S&P 500',       'ES=F',   1, 50),
  index('DE40',   'DAX 40',        'FDAX=F', 1, 80),
  index('UK100',  'FTSE 100',      'Z=F',    1, 70),
  index('JP225',  'Nikkei 225',    'NI225=F',0, 100),
];

// ─── Lookup maps ────────────────────────────────────────────
export const INSTRUMENT_MAP = new Map(ALL_INSTRUMENTS.map((i) => [i.symbol, i]));

export const INSTRUMENTS_BY_TYPE: Record<InstrumentType, Instrument[]> = {
  crypto: ALL_INSTRUMENTS.filter((i) => i.type === 'crypto'),
  forex: ALL_INSTRUMENTS.filter((i) => i.type === 'forex'),
  metal: ALL_INSTRUMENTS.filter((i) => i.type === 'metal'),
  index: ALL_INSTRUMENTS.filter((i) => i.type === 'index'),
};

// Default watchlist for new users
export const DEFAULT_WATCHLIST = [
  'XAUUSD',
  'BTCUSD',
  'ETHUSD',
  'XRPUSD',
  'US100',
];
