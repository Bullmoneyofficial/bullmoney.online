-- Add store_display_mode column to site_settings table
-- Controls whether the store shows 'global' (regular products), 'vip' products, or 'timer' (countdown) for all users
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS store_display_mode text DEFAULT 'global';

-- Add timer-related columns
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS store_timer_end timestamptz DEFAULT NULL;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS store_timer_headline text DEFAULT 'Something big is coming';

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS store_timer_subtext text DEFAULT 'New products dropping soon. Stay tuned.';

-- Ensure at least one row exists
INSERT INTO public.site_settings (site_name, site_tagline, store_display_mode)
SELECT 'BullMoney', 'Elite Trading Community', 'global'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings LIMIT 1);
