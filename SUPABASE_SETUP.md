# Supabase Database Setup for BullMoney

## Required Tables

### 1. Livestream Videos Table

```sql
CREATE TABLE livestream_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  youtube_id VARCHAR(50) NOT NULL,
  is_live BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE livestream_videos ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access for livestream_videos" 
  ON livestream_videos FOR SELECT 
  USING (true);

-- Admin write access (you can add more specific policies later)
CREATE POLICY "Admin write access for livestream_videos" 
  ON livestream_videos FOR ALL 
  USING (true);
```

### 2. Livestream Config Table

```sql
CREATE TABLE livestream_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_url VARCHAR(500),
  current_video_id VARCHAR(50),
  is_live_now BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE livestream_config ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access for livestream_config" 
  ON livestream_config FOR SELECT 
  USING (true);

-- Admin write access
CREATE POLICY "Admin write access for livestream_config" 
  ON livestream_config FOR ALL 
  USING (true);
```

### 3. Analyses Table (Trade Analysis/Blog)

```sql
CREATE TABLE analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  market VARCHAR(50) DEFAULT 'forex',
  direction VARCHAR(20) DEFAULT 'neutral',
  pair VARCHAR(50),
  entry_price DECIMAL(20, 8),
  target_price DECIMAL(20, 8),
  stop_loss DECIMAL(20, 8),
  image_url TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Public read access for published analyses
CREATE POLICY "Public read access for published analyses" 
  ON analyses FOR SELECT 
  USING (is_published = true);

-- Admin full access
CREATE POLICY "Admin full access for analyses" 
  ON analyses FOR ALL 
  USING (true);

-- Index for faster queries
CREATE INDEX idx_analyses_published ON analyses(is_published);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_analyses_market ON analyses(market);
```

## Quick Setup Instructions

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run each CREATE TABLE statement above
4. The tables will be created with proper Row Level Security

## Environment Variables

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing

After creating the tables, test by:
1. Opening the Admin Modal and logging in
2. Going to Live Stream and adding a video
3. Going to Analysis and creating an analysis post
