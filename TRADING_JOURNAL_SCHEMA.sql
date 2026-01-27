-- Trading Journal Tables for Supabase
-- Comprehensive trading journal system with support for all tradable assets

-- Main trades table
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Trade Basic Info
    trade_date TIMESTAMP WITH TIME ZONE NOT NULL,
    asset_symbol VARCHAR(50) NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- 'stock', 'crypto', 'forex', 'options', 'futures', 'commodities', 'bonds', 'etf'
    direction VARCHAR(10) NOT NULL, -- 'long' or 'short'
    
    -- Trade Execution
    entry_price DECIMAL(20, 8) NOT NULL,
    exit_price DECIMAL(20, 8),
    quantity DECIMAL(20, 8) NOT NULL,
    leverage DECIMAL(10, 2) DEFAULT 1.0,
    
    -- Fees & Costs
    entry_fee DECIMAL(20, 8) DEFAULT 0,
    exit_fee DECIMAL(20, 8) DEFAULT 0,
    funding_fees DECIMAL(20, 8) DEFAULT 0, -- For perpetual futures
    
    -- Trade Status
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'closed', 'partial'
    
    -- P&L Calculations
    gross_pnl DECIMAL(20, 8),
    net_pnl DECIMAL(20, 8),
    pnl_percentage DECIMAL(10, 4),
    
    -- Risk Management
    stop_loss DECIMAL(20, 8),
    take_profit DECIMAL(20, 8),
    risk_amount DECIMAL(20, 8),
    reward_amount DECIMAL(20, 8),
    risk_reward_ratio DECIMAL(10, 4),
    
    -- Trade Analysis
    strategy VARCHAR(100),
    timeframe VARCHAR(20), -- '1m', '5m', '15m', '1h', '4h', '1d', etc.
    market_condition VARCHAR(50), -- 'trending', 'ranging', 'volatile', 'calm'
    entry_reason TEXT,
    exit_reason TEXT,
    
    -- Trade Outcome
    outcome VARCHAR(20), -- 'win', 'loss', 'breakeven'
    mistake_made BOOLEAN DEFAULT false,
    mistake_notes TEXT,
    
    -- Emotions & Psychology
    emotional_state VARCHAR(50), -- 'confident', 'fearful', 'greedy', 'disciplined', 'revenge'
    followed_plan BOOLEAN DEFAULT true,
    
    -- Session Info
    session_number INTEGER,
    setup_quality INTEGER CHECK (setup_quality BETWEEN 1 AND 5), -- 1-5 rating
    
    -- Tags & Notes
    tags TEXT[], -- Array of custom tags
    notes TEXT,
    
    -- Timestamps
    entry_time TIMESTAMP WITH TIME ZONE,
    exit_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade images/screenshots table
CREATE TABLE IF NOT EXISTS public.trade_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    image_url TEXT NOT NULL,
    image_type VARCHAR(50), -- 'entry_chart', 'exit_chart', 'analysis', 'other'
    caption TEXT,
    order_index INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily trading statistics (aggregated)
CREATE TABLE IF NOT EXISTS public.daily_trading_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stat_date DATE NOT NULL,
    
    -- Daily Metrics
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    breakeven_trades INTEGER DEFAULT 0,
    
    -- P&L
    gross_profit DECIMAL(20, 8) DEFAULT 0,
    gross_loss DECIMAL(20, 8) DEFAULT 0,
    net_pnl DECIMAL(20, 8) DEFAULT 0,
    
    -- Performance Metrics
    win_rate DECIMAL(10, 4),
    profit_factor DECIMAL(10, 4),
    average_win DECIMAL(20, 8),
    average_loss DECIMAL(20, 8),
    largest_win DECIMAL(20, 8),
    largest_loss DECIMAL(20, 8),
    
    -- Risk Metrics
    total_risk_taken DECIMAL(20, 8),
    average_risk_reward DECIMAL(10, 4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, stat_date)
);

-- Overall user trading statistics
CREATE TABLE IF NOT EXISTS public.user_trading_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- All-Time Metrics
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    breakeven_trades INTEGER DEFAULT 0,
    
    -- P&L
    total_gross_profit DECIMAL(20, 8) DEFAULT 0,
    total_gross_loss DECIMAL(20, 8) DEFAULT 0,
    total_net_pnl DECIMAL(20, 8) DEFAULT 0,
    
    -- Advanced Metrics
    win_rate DECIMAL(10, 4),
    profit_factor DECIMAL(10, 4),
    expectancy DECIMAL(20, 8),
    sharpe_ratio DECIMAL(10, 4),
    
    -- Streak Tracking
    current_streak INTEGER DEFAULT 0,
    current_streak_type VARCHAR(10), -- 'win' or 'loss'
    longest_win_streak INTEGER DEFAULT 0,
    longest_loss_streak INTEGER DEFAULT 0,
    
    -- Best/Worst
    best_trade_pnl DECIMAL(20, 8),
    worst_trade_pnl DECIMAL(20, 8),
    average_win DECIMAL(20, 8),
    average_loss DECIMAL(20, 8),
    
    -- Risk Management
    average_risk_reward DECIMAL(10, 4),
    
    -- Trading Days
    total_trading_days INTEGER DEFAULT 0,
    profitable_days INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_trade_date ON public.trades(trade_date);
CREATE INDEX IF NOT EXISTS idx_trades_user_date ON public.trades(user_id, trade_date);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trade_images_trade_id ON public.trade_images(trade_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_trading_stats(user_id, stat_date);

-- Row Level Security (RLS) Policies
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_trading_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trading_stats ENABLE ROW LEVEL SECURITY;

-- Trades policies
CREATE POLICY "Users can view their own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" ON public.trades
    FOR DELETE USING (auth.uid() = user_id);

-- Trade images policies
CREATE POLICY "Users can view their own trade images" ON public.trade_images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trade images" ON public.trade_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trade images" ON public.trade_images
    FOR DELETE USING (auth.uid() = user_id);

-- Daily stats policies
CREATE POLICY "Users can view their own daily stats" ON public.daily_trading_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily stats" ON public.daily_trading_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily stats" ON public.daily_trading_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- User stats policies
CREATE POLICY "Users can view their own stats" ON public.user_trading_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON public.user_trading_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.user_trading_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- Functions to auto-update statistics
CREATE OR REPLACE FUNCTION update_trading_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user_trading_stats when a trade is inserted or updated
    INSERT INTO public.user_trading_stats (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Recalculate statistics (simplified version, extend as needed)
    UPDATE public.user_trading_stats
    SET 
        total_trades = (SELECT COUNT(*) FROM public.trades WHERE user_id = NEW.user_id AND status = 'closed'),
        winning_trades = (SELECT COUNT(*) FROM public.trades WHERE user_id = NEW.user_id AND status = 'closed' AND outcome = 'win'),
        losing_trades = (SELECT COUNT(*) FROM public.trades WHERE user_id = NEW.user_id AND status = 'closed' AND outcome = 'loss'),
        total_net_pnl = (SELECT COALESCE(SUM(net_pnl), 0) FROM public.trades WHERE user_id = NEW.user_id AND status = 'closed'),
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update statistics
CREATE TRIGGER trade_statistics_trigger
    AFTER INSERT OR UPDATE ON public.trades
    FOR EACH ROW
    EXECUTE FUNCTION update_trading_statistics();

-- Function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON public.daily_trading_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON public.user_trading_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
