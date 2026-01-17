-- Bull Feed Community Platform Schema
-- Run this migration in Supabase SQL Editor

-- ============================================
-- 1. USER PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  reputation_score INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2),
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_smart_money BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'elite')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- ============================================
-- 2. EXTEND ANALYSES TABLE
-- ============================================

-- Add new columns to existing analyses table
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT 5 CHECK (confidence_score BETWEEN 1 AND 10);
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'deep_dive' CHECK (content_type IN ('deep_dive', 'market_pulse', 'blog_post'));
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS rich_content JSONB;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS chart_config JSONB;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS tickers TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS bull_score INTEGER DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS is_pro_only BOOLEAN DEFAULT false;

-- Indexes for feed queries
CREATE INDEX IF NOT EXISTS idx_analyses_author ON analyses(author_id);
CREATE INDEX IF NOT EXISTS idx_analyses_content_type ON analyses(content_type);
CREATE INDEX IF NOT EXISTS idx_analyses_bull_score ON analyses(bull_score DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_is_published ON analyses(is_published);

-- ============================================
-- 3. ANALYSIS REACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS analysis_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('bull', 'bear', 'save')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(analysis_id, user_id, reaction_type)
);

-- Indexes for reaction queries
CREATE INDEX IF NOT EXISTS idx_reactions_analysis ON analysis_reactions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON analysis_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON analysis_reactions(reaction_type);

-- ============================================
-- 4. ANALYSIS COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS analysis_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES analysis_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rich_content JSONB,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for comment queries
CREATE INDEX IF NOT EXISTS idx_comments_analysis ON analysis_comments(analysis_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON analysis_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON analysis_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON analysis_comments(created_at DESC);

-- ============================================
-- 5. PRICE ALERTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  target_price DECIMAL(20,8) NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('above', 'below')),
  is_triggered BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for alert queries
CREATE INDEX IF NOT EXISTS idx_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON price_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered ON price_alerts(is_triggered);

-- ============================================
-- 6. COPY TRADES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS copy_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  copied_at TIMESTAMPTZ DEFAULT NOW(),
  entry_price DECIMAL(20,8),
  exit_price DECIMAL(20,8),
  outcome TEXT DEFAULT 'pending' CHECK (outcome IN ('pending', 'win', 'loss', 'cancelled')),
  UNIQUE(analysis_id, user_id)
);

-- Indexes for copy trade queries
CREATE INDEX IF NOT EXISTS idx_copy_trades_analysis ON copy_trades(analysis_id);
CREATE INDEX IF NOT EXISTS idx_copy_trades_user ON copy_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_copy_trades_outcome ON copy_trades(outcome);

-- ============================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_trades ENABLE ROW LEVEL SECURITY;

-- USER PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- ANALYSIS REACTIONS POLICIES
CREATE POLICY "Reactions are viewable by everyone"
  ON analysis_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reactions"
  ON analysis_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON analysis_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ANALYSIS COMMENTS POLICIES
CREATE POLICY "Comments are viewable by everyone"
  ON analysis_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON analysis_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON analysis_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON analysis_comments FOR DELETE
  USING (auth.uid() = user_id);

-- PRICE ALERTS POLICIES
CREATE POLICY "Users can view their own alerts"
  ON price_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts"
  ON price_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON price_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON price_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- COPY TRADES POLICIES
CREATE POLICY "Copy trades are viewable by everyone"
  ON copy_trades FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own copy trades"
  ON copy_trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own copy trades"
  ON copy_trades FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update user win rate
CREATE OR REPLACE FUNCTION update_user_win_rate(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total INTEGER;
  v_wins INTEGER;
  v_rate DECIMAL(5,2);
BEGIN
  -- Count completed trades for analyses by this user
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE outcome = 'win')
  INTO v_total, v_wins
  FROM copy_trades ct
  JOIN analyses a ON ct.analysis_id = a.id
  WHERE a.author_id = p_user_id
    AND ct.outcome IN ('win', 'loss');

  IF v_total > 0 THEN
    v_rate := (v_wins::DECIMAL / v_total) * 100;
  ELSE
    v_rate := NULL;
  END IF;

  UPDATE user_profiles
  SET
    win_rate = v_rate,
    total_trades = v_total,
    winning_trades = v_wins,
    is_smart_money = (v_rate >= 65 AND v_total >= 20),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate bull score
CREATE OR REPLACE FUNCTION calculate_bull_score(p_analysis_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_views INTEGER;
  v_bulls INTEGER;
  v_bears INTEGER;
  v_comments INTEGER;
  v_saves INTEGER;
  v_author_rep INTEGER;
  v_score INTEGER;
BEGIN
  -- Get view count
  SELECT COALESCE(view_count, 0) INTO v_views
  FROM analyses WHERE id = p_analysis_id;

  -- Get reaction counts
  SELECT
    COUNT(*) FILTER (WHERE reaction_type = 'bull'),
    COUNT(*) FILTER (WHERE reaction_type = 'bear'),
    COUNT(*) FILTER (WHERE reaction_type = 'save')
  INTO v_bulls, v_bears, v_saves
  FROM analysis_reactions WHERE analysis_id = p_analysis_id;

  -- Get comment count
  SELECT COUNT(*) INTO v_comments
  FROM analysis_comments WHERE analysis_id = p_analysis_id;

  -- Get author reputation
  SELECT COALESCE(p.reputation_score, 0) INTO v_author_rep
  FROM analyses a
  LEFT JOIN user_profiles p ON a.author_id = p.id
  WHERE a.id = p_analysis_id;

  -- Calculate score: (views*0.1) + (bulls*1) + (bears*0.5) + (comments*2) + (saves*3) + (rep*0.01)
  v_score := ROUND(
    (v_views * 0.1) +
    (v_bulls * 1) +
    (v_bears * 0.5) +
    (v_comments * 2) +
    (v_saves * 3) +
    (v_author_rep * 0.01)
  );

  -- Update the analysis
  UPDATE analyses SET bull_score = v_score WHERE id = p_analysis_id;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get reaction counts for an analysis
CREATE OR REPLACE FUNCTION get_reaction_counts(p_analysis_id UUID)
RETURNS TABLE (bull BIGINT, bear BIGINT, save BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE reaction_type = 'bull') AS bull,
    COUNT(*) FILTER (WHERE reaction_type = 'bear') AS bear,
    COUNT(*) FILTER (WHERE reaction_type = 'save') AS save
  FROM analysis_reactions
  WHERE analysis_id = p_analysis_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 9. VIEWS FOR COMMON QUERIES
-- ============================================

-- View for analyses with author and engagement data
CREATE OR REPLACE VIEW analyses_with_engagement AS
SELECT
  a.*,
  p.username AS author_username,
  p.display_name AS author_display_name,
  p.avatar_url AS author_avatar_url,
  p.reputation_score AS author_reputation,
  p.win_rate AS author_win_rate,
  p.is_verified AS author_is_verified,
  p.is_smart_money AS author_is_smart_money,
  (SELECT COUNT(*) FROM analysis_reactions WHERE analysis_id = a.id AND reaction_type = 'bull') AS bull_count,
  (SELECT COUNT(*) FROM analysis_reactions WHERE analysis_id = a.id AND reaction_type = 'bear') AS bear_count,
  (SELECT COUNT(*) FROM analysis_reactions WHERE analysis_id = a.id AND reaction_type = 'save') AS save_count,
  (SELECT COUNT(*) FROM analysis_comments WHERE analysis_id = a.id) AS comment_count
FROM analyses a
LEFT JOIN user_profiles p ON a.author_id = p.id;

-- ============================================
-- 10. INITIAL DATA / DEFAULTS
-- ============================================

-- No initial data needed; existing analyses table data will be preserved
