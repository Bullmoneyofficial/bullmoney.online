-- =============================================
-- DASHBOARD PREFERENCES
-- Add dashboard settings columns to recruits table
-- =============================================

-- Add dashboard preference columns to recruits table
ALTER TABLE public.recruits 
ADD COLUMN IF NOT EXISTS dashboard_preferences JSONB DEFAULT '{
  "quotes": {
    "autoRefresh": true,
    "notifications": false,
    "soundEnabled": false,
    "refreshInterval": 30000,
    "category": "all"
  },
  "news": {
    "autoRefresh": true,
    "notifications": true,
    "soundEnabled": true,
    "refreshInterval": 60000,
    "priority": "all",
    "pullInterval": 300000
  },
  "telegram": {
    "autoRefresh": true,
    "notifications": true,
    "soundEnabled": false,
    "refreshInterval": 45000,
    "visibility": "all",
    "enabledGroups": ["vip", "free", "signals"],
    "notifyGroups": ["vip"]
  },
  "watchlist": []
}'::jsonb;

-- Create index for faster queries on dashboard preferences
CREATE INDEX IF NOT EXISTS idx_recruits_dashboard_prefs 
ON public.recruits USING GIN (dashboard_preferences);

-- Update existing rows to have default preferences if NULL
UPDATE public.recruits 
SET dashboard_preferences = '{
  "quotes": {
    "autoRefresh": true,
    "notifications": false,
    "soundEnabled": false,
    "refreshInterval": 30000,
    "category": "all"
  },
  "news": {
    "autoRefresh": true,
    "notifications": true,
    "soundEnabled": true,
    "refreshInterval": 60000,
    "priority": "all",
    "pullInterval": 300000
  },
  "telegram": {
    "autoRefresh": true,
    "notifications": true,
    "soundEnabled": false,
    "refreshInterval": 45000,
    "visibility": "all",
    "enabledGroups": ["vip", "free", "signals"],
    "notifyGroups": ["vip"]
  },
  "watchlist": []
}'::jsonb
WHERE dashboard_preferences IS NULL;

COMMENT ON COLUMN public.recruits.dashboard_preferences IS 'User dashboard settings including refresh intervals, notifications, and preferences for quotes, news, and telegram sections';
