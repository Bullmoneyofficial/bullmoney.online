#!/bin/bash
# ============================================================================
# MIGRATION RUNNER SCRIPT
# Run this script to apply all BullMoney Store migrations in correct order
# ============================================================================

set -e  # Exit on any error

echo "=========================================="
echo "BullMoney Store Migration Script"
echo "=========================================="

# Database connection (update with your Supabase connection string)
# Example: postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
DB_URL="${SUPABASE_DB_URL:-}"

if [ -z "$DB_URL" ]; then
  echo "ERROR: Please set SUPABASE_DB_URL environment variable"
  echo "Example: export SUPABASE_DB_URL='postgresql://postgres:password@...'"
  exit 1
fi

echo ""
echo "Step 0: Cleanup existing tables (if any)..."
psql "$DB_URL" -f supabase/migrations/20260204_000_cleanup.sql

echo ""
echo "Step 1: Creating recruits table..."
psql "$DB_URL" -f supabase/migrations/20260204_001_ensure_recruits_id.sql

echo ""
echo "Step 2: Creating store schema (products, orders, etc.)..."
psql "$DB_URL" -f supabase/migrations/20260204_002_bullmoney_store_schema.sql

echo ""
echo "Step 3: Adding foreign key constraints to recruits table..."
psql "$DB_URL" -f supabase/migrations/20260204_004_add_store_foreign_keys.sql

echo ""
echo "=========================================="
echo "✅ All migrations completed successfully!"
echo "=========================================="
