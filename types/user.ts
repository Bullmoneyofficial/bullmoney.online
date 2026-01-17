// User profile types for Bull Feed community platform

export type SubscriptionTier = 'free' | 'pro' | 'elite';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  reputation_score: number;
  win_rate: number | null;
  total_trades: number;
  winning_trades: number;
  is_verified: boolean;
  is_smart_money: boolean;
  subscription_tier: SubscriptionTier;
  created_at: string;
  updated_at: string;
}

export interface UserProfileInsert {
  id: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

export interface UserProfileUpdate {
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

// Auth state
export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Auth actions
export interface AuthActions {
  signUp: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: UserProfileUpdate) => Promise<{ success: boolean; error?: string }>;
}

// Price alert
export interface PriceAlert {
  id: string;
  user_id: string;
  analysis_id: string | null;
  symbol: string;
  target_price: number;
  direction: 'above' | 'below';
  is_triggered: boolean;
  triggered_at: string | null;
  created_at: string;
}

export interface PriceAlertInsert {
  analysis_id?: string | null;
  symbol: string;
  target_price: number;
  direction: 'above' | 'below';
}

// Copy trade tracking
export type TradeOutcome = 'pending' | 'win' | 'loss' | 'cancelled';

export interface CopyTrade {
  id: string;
  analysis_id: string;
  user_id: string;
  copied_at: string;
  entry_price: number | null;
  exit_price: number | null;
  outcome: TradeOutcome;
}

export interface CopyTradeInsert {
  analysis_id: string;
  entry_price?: number | null;
}

export interface CopyTradeUpdate {
  exit_price?: number | null;
  outcome?: TradeOutcome;
}
