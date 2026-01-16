-- ===========================================
-- Playlist Migration for LiveStream Videos
-- Run this in Supabase SQL Editor
-- ===========================================

-- 1. Create the livestream_playlists table
CREATE TABLE IF NOT EXISTS livestream_playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add playlist_id column to livestream_videos if it doesn't exist
ALTER TABLE livestream_videos 
ADD COLUMN IF NOT EXISTS playlist_id UUID REFERENCES livestream_playlists(id) ON DELETE SET NULL;

-- 3. Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_livestream_videos_playlist_id ON livestream_videos(playlist_id);

-- 4. Enable Row Level Security (optional but recommended)
ALTER TABLE livestream_playlists ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for public read access
CREATE POLICY "Allow public read access on playlists" 
    ON livestream_playlists 
    FOR SELECT 
    USING (true);

-- 6. Create policies for all operations (for admin use via service key)
CREATE POLICY "Allow all operations on playlists" 
    ON livestream_playlists 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- ===========================================
-- Sample Playlists (optional)
-- ===========================================
INSERT INTO livestream_playlists (name, description) VALUES
    ('Beginner Trading', 'Essential videos for new traders'),
    ('Live Sessions', 'Past and current live trading sessions'),
    ('Market Analysis', 'Daily and weekly market breakdowns'),
    ('Trading Psychology', 'Mindset and discipline videos')
ON CONFLICT DO NOTHING;
