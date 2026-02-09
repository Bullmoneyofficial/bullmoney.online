-- Adds missing buy_url column used by admin/product APIs.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS buy_url TEXT;
