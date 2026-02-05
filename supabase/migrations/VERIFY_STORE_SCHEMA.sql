-- ============================================================================
-- VERIFICATION QUERIES FOR BULLMONEY STORE SCHEMA
-- Run these after migration to verify everything is working
-- ============================================================================

-- 1. Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'categories', 'products', 'product_images', 'variants', 
  'profiles', 'admins', 'orders', 'order_items', 
  'reviews', 'discount_codes'
)
ORDER BY table_name;

-- Expected: 10 rows

-- 2. Check seed data - Categories
SELECT COUNT(*) as total_categories, 
       COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
       COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories
FROM categories;

-- Expected: 10 total (6 main + 4 subcategories)

-- 3. Check seed data - Products
SELECT 
  status,
  featured,
  COUNT(*) as count,
  MIN(base_price) as min_price,
  MAX(base_price) as max_price
FROM products
GROUP BY status, featured
ORDER BY status, featured;

-- Expected: 10 ACTIVE products, 3 featured

-- 4. Check seed data - Product Images
SELECT COUNT(*) as total_images,
       COUNT(DISTINCT product_id) as products_with_images,
       COUNT(CASE WHEN is_primary THEN 1 END) as primary_images
FROM product_images;

-- Expected: 19 images, 10 products with images, 10 primary images

-- 5. Check seed data - Variants
SELECT COUNT(*) as total_variants,
       SUM(inventory_count) as total_inventory,
       AVG(inventory_count)::int as avg_inventory_per_variant,
       MIN(inventory_count) as min_inventory,
       MAX(inventory_count) as max_inventory
FROM variants;

-- Expected: 38 variants, substantial inventory

-- 6. Check seed data - Discount Codes
SELECT code, discount_type, discount_value, is_active,
       CASE 
         WHEN expires_at < NOW() THEN 'Expired'
         WHEN starts_at > NOW() THEN 'Scheduled'
         ELSE 'Active'
       END as status
FROM discount_codes
ORDER BY code;

-- Expected: 6 discount codes, all active

-- 7. Test product with full details (sample query the API will use)
SELECT 
  p.id,
  p.name,
  p.slug,
  p.base_price,
  p.status,
  p.featured,
  c.name as category_name,
  c.slug as category_slug,
  COUNT(DISTINCT pi.id) as image_count,
  COUNT(DISTINCT v.id) as variant_count,
  SUM(v.inventory_count) as total_inventory
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_images pi ON pi.product_id = p.id
LEFT JOIN variants v ON v.product_id = p.id
WHERE p.status = 'ACTIVE'
GROUP BY p.id, p.name, p.slug, p.base_price, p.status, p.featured, c.name, c.slug
ORDER BY p.featured DESC, p.created_at DESC
LIMIT 5;

-- Expected: 5 products with full details, featured products first

-- 8. Test variant options (JSONB query)
SELECT 
  p.name as product_name,
  v.name as variant_name,
  v.options,
  v.inventory_count,
  (p.base_price + v.price_adjustment) as final_price
FROM variants v
JOIN products p ON p.id = v.product_id
WHERE v.options ? 'color'  -- Has color option
LIMIT 10;

-- Expected: Variants with color options, properly calculated prices

-- 9. Test RLS policies are enabled
SELECT tablename, 
       rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('products', 'categories', 'orders', 'variants', 'reviews')
ORDER BY tablename;

-- Expected: All tables should have rls_enabled = true

-- 10. Test custom functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'generate_order_number',
  'decrease_inventory_on_order',
  'restore_inventory_on_cancel',
  'update_product_rating',
  'get_current_recruit_id',
  'is_admin',
  'current_user_is_admin'
)
ORDER BY routine_name;

-- Expected: All 7 functions should exist

-- 11. Test views exist
SELECT table_name, table_type
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('v_products_with_category', 'v_orders_summary')
ORDER BY table_name;

-- Expected: 2 views

-- 12. Featured products query (what the store homepage will show)
SELECT 
  p.name,
  p.base_price,
  p.compare_at_price,
  COALESCE(
    (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
    (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1)
  ) as primary_image_url,
  (SELECT SUM(inventory_count) FROM variants WHERE product_id = p.id) as total_stock
FROM products p
WHERE p.status = 'ACTIVE' AND p.featured = true
ORDER BY p.created_at DESC;

-- Expected: 3 featured products with images and inventory

-- ============================================================================
-- SAMPLE DATA QUERIES
-- ============================================================================

-- Get BullMoney Premium Hoodie with all details
SELECT 
  p.*,
  jsonb_pretty(p.details) as product_details,
  array_agg(DISTINCT jsonb_build_object(
    'url', pi.url,
    'alt_text', pi.alt_text,
    'is_primary', pi.is_primary
  )) as images,
  array_agg(DISTINCT jsonb_build_object(
    'name', v.name,
    'sku', v.sku,
    'options', v.options,
    'price', p.base_price + v.price_adjustment,
    'inventory', v.inventory_count
  )) as variants
FROM products p
LEFT JOIN product_images pi ON pi.product_id = p.id
LEFT JOIN variants v ON v.product_id = p.id
WHERE p.slug = 'bullmoney-premium-hoodie'
GROUP BY p.id;

-- ============================================================================
-- SUCCESS INDICATORS
-- ============================================================================
-- ✅ All 10 tables exist
-- ✅ 10 categories (6 main + 4 sub)
-- ✅ 10 products (all ACTIVE)
-- ✅ 19 product images
-- ✅ 38 variants with inventory
-- ✅ 6 active discount codes
-- ✅ RLS enabled on all tables
-- ✅ All custom functions exist
-- ✅ 2 views created
-- ✅ Sample queries return expected data
