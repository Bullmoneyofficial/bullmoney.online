# YouTube LiveStream Integration Setup

## Overview
The LiveStream tab now monitors your YouTube channels for live streams and videos related to geopolitics, war, markets, and trading. It auto-updates every 30 seconds and shows a "Breaking Live" indicator when you go live.

## YouTube API Configuration

### Step 1: Get YouTube API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "YouTube Data API v3"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

### Step 2: Add API Key to Environment
Add to your `.env.local` file:
```bash
YOUTUBE_API_KEY=your_api_key_here
```

### Step 3: Get Your Channel IDs
You need to find the channel IDs for your YouTube channels:
- @bullmoney.streams
- @bullmoney.online
- @bullmoney.gaming

#### Option A: Using YouTube Studio
1. Go to [YouTube Studio](https://studio.youtube.com/)
2. Click on your profile
3. Click "Settings" → "Advanced settings"
4. Your Channel ID will be displayed

#### Option B: Using a URL
1. Go to your channel page
2. Look at the URL - it will contain your channel ID after `/channel/`
3. Example: `youtube.com/channel/UCxxxxxxxxxxxxx`

### Step 4: Update Channel IDs
Edit `/app/api/youtube/channel-videos/route.ts` and update the `CHANNEL_HANDLE_TO_ID` object:

```typescript
const CHANNEL_HANDLE_TO_ID: Record<string, string> = {
  '@bullmoney.streams': 'UCxxxxxxxxxxxxx',  // Replace with actual ID
  '@bullmoney.online': 'UCxxxxxxxxxxxxx',   // Replace with actual ID
  '@bullmoney.gaming': 'UCxxxxxxxxxxxxx',   // Replace with actual ID
};
```

## Features

### Auto-Detection
- **Live Streams**: Automatically detected when you go live
- **New Videos**: Featured tab updates when you upload new videos
- **Content Filtering**: Only shows videos related to:
  - Trading (forex, gold, bitcoin, crypto, stocks, charts, analysis)
  - Geopolitics (war, conflict, military, elections, politics)
  - Economics (Fed, interest rates, inflation, markets, currencies, oil)

### Breaking Live Indicator
When you go live on any of your channels:
- Red "Breaking Live" badge appears in header
- Auto-switches to "Live" tab
- Pulsing red dot notification
- Live indicator on video thumbnail

### Performance
- Auto-refreshes every 30 seconds
- Checks all 3 channels simultaneously
- Caches channel IDs for 1 hour
- Caches video data for 30 seconds

## Database Tables

If you want to manually add featured videos to the database:

```sql
-- Create livestream_videos table (if not exists)
CREATE TABLE IF NOT EXISTS livestream_videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  is_live BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert featured videos
INSERT INTO livestream_videos (title, youtube_id, is_live, order_index) VALUES
('Market Analysis Live', 'Q3dSjSP3t8I', false, 1),
('Trading Strategy Deep Dive', 'xvP1FJt-Qto', false, 2);
```

## Analysis Tab - Admin Features

The Analysis tab now has full admin controls accessible only to admin users:

### Admin Capabilities
- ✏️ **Create**: Add new analysis posts
- 📝 **Edit**: Modify existing analysis (title, content, market, direction, pair, prices, confidence)
- 🗑️ **Delete**: Remove analysis posts
- 👁️ **Publish**: Toggle published status

### Edit Fields
When editing, admins can modify:
- Title and content
- Market type (Forex, Crypto, Stocks, Indices)
- Direction (Bullish, Bearish, Neutral)
- Currency pair
- Entry/Target/Stop prices
- Confidence score (0-10 slider)
- Published status

## Community Posts Tab

New tab for user-generated trading posts:

### Features
- User trade submissions from Enhanced Analysis Modal
- Filter by: All, Open, Won, Loss
- Trade details: Entry, Exit, TP, SL, P/L
- User profiles with ranks and avatars
- Engagement: Likes, Comments, Views
- Trade screenshots/charts

### Database Table
```sql
CREATE TABLE IF NOT EXISTS community_trade_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  position_size NUMERIC,
  leverage INTEGER,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed_win', 'closed_loss', 'closed_breakeven')),
  profit_loss NUMERIC,
  profit_loss_percent NUMERIC,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Add index for faster queries
CREATE INDEX idx_community_posts_user_id ON community_trade_posts(user_id);
CREATE INDEX idx_community_posts_status ON community_trade_posts(status);
CREATE INDEX idx_community_posts_created_at ON community_trade_posts(created_at DESC);
```

## Troubleshooting

### No videos showing up
1. Check your API key is correct in `.env.local`
2. Verify channel IDs are correct
3. Check browser console for errors
4. Ensure YouTube Data API v3 is enabled

### API quota exceeded
- YouTube API has daily quota limits
- Reduce refresh interval if needed
- Consider caching responses longer

### Videos not filtered correctly
- Check if video titles/descriptions contain relevant keywords
- Add more keywords to `CONTENT_KEYWORDS` array if needed

## Testing

1. Open Ultimate Hub
2. Click "Live TV" tab
3. Should see videos from your channels
4. Go live on one of your YouTube channels
5. Within 30 seconds, "Breaking Live" indicator should appear
6. Tab should auto-switch to show your live stream

## Support

For issues:
1. Check browser console for errors
2. Verify all environment variables are set
3. Test API key with YouTube Data API directly
4. Check Supabase logs for database errors
