-- ============================================================================
-- BULLMONEY STORE - FOREIGN KEY CONSTRAINTS
-- Add foreign key constraints linking store tables to recruits table
-- Run after 20260204_001_ensure_recruits_id.sql and 20260204_002_bullmoney_store_schema.sql
-- ============================================================================
-- This migration is idempotent and will only add constraints if:
-- 1. The target table exists
-- 2. The constraint doesn't already exist
-- Safe to run multiple times
-- ============================================================================

-- Add foreign key constraint for profiles table
-- profiles.id references recruits.id (one-to-one relationship)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'profiles'
      AND constraint_name = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_id_fkey 
      FOREIGN KEY (id) REFERENCES public.recruits(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint: profiles_id_fkey';
  END IF;
END $$;

-- Add foreign key constraint for admins table
-- admins.user_id references recruits.id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'admins'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'admins'
      AND constraint_name = 'admins_user_id_fkey'
  ) THEN
    ALTER TABLE public.admins 
      ADD CONSTRAINT admins_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.recruits(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint: admins_user_id_fkey';
  END IF;
END $$;

-- Add foreign key constraint for orders table
-- orders.user_id references recruits.id (nullable for guest checkout)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'orders'
      AND constraint_name = 'orders_user_id_fkey'
  ) THEN
    ALTER TABLE public.orders 
      ADD CONSTRAINT orders_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.recruits(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key constraint: orders_user_id_fkey';
  END IF;
END $$;

-- Add foreign key constraint for reviews table
-- reviews.user_id references recruits.id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'reviews'
      AND constraint_name = 'reviews_user_id_fkey'
  ) THEN
    ALTER TABLE public.reviews 
      ADD CONSTRAINT reviews_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.recruits(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint: reviews_user_id_fkey';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all foreign keys were added successfully
DO $$
DECLARE
  missing_fks TEXT[];
BEGIN
  -- Check each constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'profiles'
      AND constraint_name = 'profiles_id_fkey'
  ) THEN
    missing_fks := array_append(missing_fks, 'profiles_id_fkey');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'admins'
      AND constraint_name = 'admins_user_id_fkey'
  ) THEN
    missing_fks := array_append(missing_fks, 'admins_user_id_fkey');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'orders'
      AND constraint_name = 'orders_user_id_fkey'
  ) THEN
    missing_fks := array_append(missing_fks, 'orders_user_id_fkey');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'reviews'
      AND constraint_name = 'reviews_user_id_fkey'
  ) THEN
    missing_fks := array_append(missing_fks, 'reviews_user_id_fkey');
  END IF;

  -- Report results
  IF array_length(missing_fks, 1) > 0 THEN
    RAISE WARNING 'Some foreign keys could not be added: %', array_to_string(missing_fks, ', ');
  ELSE
    RAISE NOTICE 'All foreign key constraints added successfully!';
  END IF;
END $$;
