// Feed and analysis types for Bull Feed community platform

import type { UserProfile } from './user';

// Content types
export type ContentType = 'deep_dive' | 'market_pulse' | 'blog_post';
export type MarketType = 'forex' | 'crypto' | 'stocks' | 'indices';
export type Direction = 'bullish' | 'bearish' | 'neutral';
export type ReactionType = 'bull' | 'bear' | 'save';

// TipTap rich content JSON structure
export interface RichContent {
  type: 'doc';
  content: RichContentNode[];
}

export interface RichContentNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichContentNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

// Attachment types
export type AttachmentType = 'image' | 'pdf' | 'csv' | 'excel';

export interface Attachment {
  url: string;
  type: AttachmentType;
  name: string;
  size?: number;
}

// TradingView chart config
export interface ChartConfig {
  symbol: string; // e.g., "BINANCE:BTCUSDT", "FX:EURUSD"
  interval?: string; // e.g., "1H", "4H", "D"
  theme?: 'dark' | 'light';
}

// Analysis (post) types
export interface Analysis {
  id: string;
  author_id: string | null;
  title: string;
  content: string; // Plain text fallback
  rich_content: RichContent | null; // TipTap JSON
  market: MarketType;
  direction: Direction;
  pair: string; // e.g., 'EUR/USD', 'BTC/USD'
  entry_price: number | null;
  target_price: number | null;
  stop_loss: number | null;
  confidence_score: number; // 1-10
  content_type: ContentType;
  chart_config: ChartConfig | null;
  attachments: Attachment[];
  tickers: string[]; // $AAPL, $BTC
  image_url: string | null; // Legacy single image
  view_count: number;
  bull_score: number; // Calculated ranking score
  is_published: boolean;
  is_pro_only: boolean;
  created_at: string;
  updated_at: string | null;
  // Joined data
  author?: UserProfile | null;
  reaction_counts?: ReactionCounts;
  comment_count?: number;
  user_reaction?: ReactionType | null; // Current user's reaction
}

export interface AnalysisInsert {
  title: string;
  content: string;
  rich_content?: RichContent | null;
  market: MarketType;
  direction: Direction;
  pair: string;
  entry_price?: number | null;
  target_price?: number | null;
  stop_loss?: number | null;
  confidence_score?: number;
  content_type?: ContentType;
  chart_config?: ChartConfig | null;
  attachments?: Attachment[];
  tickers?: string[];
  image_url?: string | null;
  is_published?: boolean;
  is_pro_only?: boolean;
}

export interface AnalysisUpdate {
  title?: string;
  content?: string;
  rich_content?: RichContent | null;
  market?: MarketType;
  direction?: Direction;
  pair?: string;
  entry_price?: number | null;
  target_price?: number | null;
  stop_loss?: number | null;
  confidence_score?: number;
  content_type?: ContentType;
  chart_config?: ChartConfig | null;
  attachments?: Attachment[];
  tickers?: string[];
  image_url?: string | null;
  is_published?: boolean;
  is_pro_only?: boolean;
}

// Reaction counts
export interface ReactionCounts {
  bull: number;
  bear: number;
  save: number;
}

// Reaction
export interface AnalysisReaction {
  id: string;
  analysis_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

// Comment types
export interface AnalysisComment {
  id: string;
  analysis_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  rich_content: RichContent | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: UserProfile | null;
  replies?: AnalysisComment[];
  reply_count?: number;
}

export interface CommentInsert {
  analysis_id: string;
  parent_id?: string | null;
  content: string;
  rich_content?: RichContent | null;
  image_url?: string | null;
}

export interface CommentUpdate {
  content?: string;
  rich_content?: RichContent | null;
  image_url?: string | null;
}

// Feed filter types
export type FeedFilter = 'hot' | 'top' | 'smart_money' | 'fresh';
export type ContentFilter = ContentType | 'all';

export interface FeedParams {
  filter: FeedFilter;
  content_type?: ContentFilter;
  ticker?: string; // Filter by $cashtag
  cursor?: string; // Pagination cursor (analysis ID)
  limit?: number;
}

export interface FeedResponse {
  analyses: Analysis[];
  next_cursor: string | null;
  has_more: boolean;
}

// Feed state for Zustand store
export interface FeedState {
  analyses: Analysis[];
  filter: FeedFilter;
  contentType: ContentFilter;
  ticker: string | null;
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface FeedActions {
  setFilter: (filter: FeedFilter) => void;
  setContentType: (contentType: ContentFilter) => void;
  setTicker: (ticker: string | null) => void;
  fetchFeed: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  addOptimisticReaction: (analysisId: string, type: ReactionType) => void;
  removeOptimisticReaction: (analysisId: string, type: ReactionType) => void;
  incrementCommentCount: (analysisId: string) => void;
}

// Market colors for UI
export const MARKET_COLORS: Record<MarketType, string> = {
  forex: 'bg-green-500',
  crypto: 'bg-orange-500',
  stocks: 'bg-blue-500',
  indices: 'bg-purple-500',
};

// Direction colors
export const DIRECTION_COLORS: Record<Direction, { bg: string; text: string; border: string }> = {
  bullish: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  bearish: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  neutral: { bg: 'bg-neutral-500/20', text: 'text-neutral-400', border: 'border-neutral-500/30' },
};

// Content type labels
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  deep_dive: 'Deep Dive',
  market_pulse: 'Market Pulse',
  blog_post: 'Blog Post',
};

// Max character limits
export const MAX_MARKET_PULSE_CHARS = 280;
export const MAX_TITLE_CHARS = 200;
