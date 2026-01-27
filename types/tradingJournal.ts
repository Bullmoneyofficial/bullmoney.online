// Trading Journal Type Definitions

export interface TradeDB {
  id: string;
  user_id: string;
  trade_date: string;
  asset_symbol: string;
  asset_type: AssetType;
  direction: TradeDirection;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  leverage: number;
  entry_fee: number;
  exit_fee: number;
  funding_fees: number;
  status: TradeStatus;
  gross_pnl: number | null;
  net_pnl: number | null;
  pnl_percentage: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  risk_amount: number | null;
  reward_amount: number | null;
  risk_reward_ratio: number | null;
  strategy: string | null;
  timeframe: string | null;
  market_condition: string | null;
  entry_reason: string | null;
  exit_reason: string | null;
  outcome: TradeOutcome | null;
  mistake_made: boolean;
  mistake_notes: string | null;
  emotional_state: string | null;
  followed_plan: boolean;
  session_number: number | null;
  setup_quality: number | null;
  tags: string[] | null;
  notes: string | null;
  entry_time: string | null;
  exit_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradeImage {
  id: string;
  trade_id: string;
  user_id: string;
  image_url: string;
  image_type: 'entry_chart' | 'exit_chart' | 'analysis' | 'other';
  caption: string | null;
  order_index: number;
  created_at: string;
}

export type AssetType =
  | 'stock'
  | 'crypto'
  | 'forex'
  | 'options'
  | 'futures'
  | 'commodities'
  | 'bonds'
  | 'etf';

export type TradeDirection = 'long' | 'short';

export type TradeStatus = 'open' | 'closed' | 'partial';

export type TradeOutcome = 'win' | 'loss' | 'breakeven';

export interface NewTrade {
  trade_date: Date;
  asset_symbol: string;
  asset_type: AssetType;
  direction: TradeDirection;
  entry_price: number;
  exit_price?: number;
  quantity: number;
  leverage?: number;
  entry_fee?: number;
  exit_fee?: number;
  funding_fees?: number;
  stop_loss?: number;
  take_profit?: number;
  strategy?: string;
  timeframe?: string;
  market_condition?: string;
  entry_reason?: string;
  exit_reason?: string;
  emotional_state?: string;
  followed_plan?: boolean;
  session_number?: number;
  setup_quality?: number;
  tags?: string[];
  notes?: string;
  images?: File[];
}

export interface DailyStats {
  id: string;
  user_id: string;
  stat_date: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  breakeven_trades: number;
  gross_profit: number;
  gross_loss: number;
  net_pnl: number;
  win_rate: number;
  profit_factor: number;
  average_win: number;
  average_loss: number;
  largest_win: number;
  largest_loss: number;
  total_risk_taken: number;
  average_risk_reward: number;
  created_at: string;
  updated_at: string;
}

export interface UserTradingStats {
  id: string;
  user_id: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  breakeven_trades: number;
  total_gross_profit: number;
  total_gross_loss: number;
  total_net_pnl: number;
  win_rate: number;
  profit_factor: number;
  expectancy: number;
  sharpe_ratio: number;
  current_streak: number;
  current_streak_type: 'win' | 'loss' | null;
  longest_win_streak: number;
  longest_loss_streak: number;
  best_trade_pnl: number;
  worst_trade_pnl: number;
  average_win: number;
  average_loss: number;
  average_risk_reward: number;
  total_trading_days: number;
  profitable_days: number;
  created_at: string;
  updated_at: string;
}
