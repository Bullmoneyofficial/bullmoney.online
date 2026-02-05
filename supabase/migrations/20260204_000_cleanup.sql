-- ============================================================================
-- CLEANUP SCRIPT - Run this FIRST to remove any partial migrations
-- This drops all store-related tables to allow clean migration
-- ============================================================================

-- Drop all views first (depend on tables)
DROP VIEW IF EXISTS v_orders_summary CASCADE;
DROP VIEW IF EXISTS v_products_with_category CASCADE;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS discount_codes CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS variants CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Drop enums
DROP TYPE IF EXISTS admin_role CASCADE;
DROP TYPE IF EXISTS product_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS decrease_inventory_on_order() CASCADE;
DROP FUNCTION IF EXISTS restore_inventory_on_cancel() CASCADE;
DROP FUNCTION IF EXISTS update_product_rating() CASCADE;
DROP FUNCTION IF EXISTS set_order_number() CASCADE;
DROP FUNCTION IF EXISTS update_timestamp() CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS is_admin(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS get_admin_role(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS get_current_recruit_id() CASCADE;
DROP FUNCTION IF EXISTS is_authenticated() CASCADE;
DROP FUNCTION IF EXISTS current_user_is_admin() CASCADE;
DROP FUNCTION IF EXISTS current_user_admin_role() CASCADE;
DROP FUNCTION IF EXISTS set_current_recruit(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS set_admin_recruit_id(BIGINT) CASCADE;

-- Note: This does NOT drop the recruits table (preserves existing user data)

SELECT 'Cleanup complete! Now run migrations in order: 001, 002, 004' AS status;
