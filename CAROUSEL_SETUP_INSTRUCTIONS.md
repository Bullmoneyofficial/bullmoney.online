# 🔧 SETUP INSTRUCTIONS - Product Media Carousel

## 🚨 IMPORTANT: Follow These Steps to See the Carousel

### Step 1: Run the Database Migration ✅

You need to run the migration SQL file to create the `product_media` table and add sample data:

**Option A: Using psql (Command Line)**
```bash
psql -h YOUR_SUPABASE_HOST \
     -U postgres \
     -d postgres \
     -f /Users/justin/Documents/newbullmoney/supabase/migrations/20260208_001_product_media_support.sql
```

**Option B: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Copy the contents of `20260208_001_product_media_support.sql`
4. Paste into the SQL editor
5. Click "Run" or press Cmd+Enter

**Option C: Using Supabase CLI**
```bash
cd /Users/justin/Documents/newbullmoney
supabase db push
```

### Step 2: Verify Migration Worked ✅

Run this test query in Supabase SQL Editor or psql:

```sql
-- Check if table exists and has data
SELECT COUNT(*) FROM product_media;

-- View products with media
SELECT 
  p.name,
  COUNT(pm.id) as media_count
FROM products p
LEFT JOIN product_media pm ON p.id = pm.product_id
GROUP BY p.id, p.name
ORDER BY media_count DESC
LIMIT 5;
```

You should see:
- ✅ `product_media` table exists
- ✅ At least 36 media items (6 images × 6 products)
- ✅ Products showing media_count > 0

### Step 3: Restart Your Dev Server 🔄

The API routes have been updated, so you need to restart Next.js:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
# or
yarn dev
# or
pnpm dev
```

### Step 4: Clear Browser Cache 🗑️

Sometimes the browser caches API responses:

**Chrome/Edge:**
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Or use incognito/private mode**

### Step 5: Test the Carousel 🎉

1. Go to your store page: `http://localhost:3000/store`
2. Click on any product card
3. The quick view modal should open with the **carousel**
4. You should see:
   - ✅ Multiple images in a carousel
   - ✅ Thumbnail strip at the bottom
   - ✅ Navigation arrows (left/right)
   - ✅ Zoom controls
   - ✅ Fullscreen button
   - ✅ Media counter (e.g., "3 / 6")

### Step 6: Troubleshooting 🔍

**If you still don't see the carousel:**

1. **Check browser console for errors:**
   - Open DevTools (F12) → Console tab
   - Look for any red errors

2. **Check Network tab:**
   - DevTools (F12) → Network tab
   - Refresh the page
   - Look for the API call to `/api/store/products`
   - Click on it and check the "Response" tab
   - Verify the response has a `media` array with data

3. **Check if migration ran:**
   ```sql
   -- Run this in Supabase SQL Editor
   SELECT * FROM product_media LIMIT 10;
   ```
   
   If you get "relation does not exist", the migration didn't run.

4. **Manually add media to a product:**
   ```sql
   -- Get a product ID
   SELECT id, name FROM products LIMIT 1;
   
   -- Add media (replace YOUR-PRODUCT-ID)
   SELECT add_product_media(
     'YOUR-PRODUCT-ID'::uuid,
     'image',
     'https://images.unsplash.com/photo-1609873963526-48b4adb346a7?w=900',
     NULL,
     'Test image 1',
     'Image 1',
     true
   );
   ```

5. **Check React component props:**
   - Add console.log in ProductCard.tsx:
   ```tsx
   console.log('Product media:', product.media);
   ```
   - Should show an array with media objects

---

## 📋 What Files Were Changed

### SQL Migrations (Run these first!)
- ✅ `supabase/migrations/20260208_001_product_media_support.sql` - Main migration
- ✅ `supabase/migrations/ADMIN_MEDIA_REFERENCE.sql` - SQL commands for admin
- ✅ `supabase/migrations/TEST_MEDIA.sql` - Test queries

### API Routes (Auto-updated)
- ✅ `app/api/store/products/route.ts` - List products API
- ✅ `app/api/store/products/[slug]/route.ts` - Single product API

### TypeScript Types (Auto-updated)
- ✅ `types/store.ts` - Added ProductMedia interface

### React Components (Auto-updated)
- ✅ `components/shop/ProductMediaCarousel.tsx` - NEW: World-class carousel
- ✅ `components/shop/ProductCard.tsx` - Uses carousel in quick view

### Documentation
- ✅ `docs/PRODUCT_MEDIA_SYSTEM_GUIDE.md` - Complete guide

---

## 🎯 Quick Test Commands

**Test in SQL:**
```sql
-- See products with media
SELECT 
  p.name,
  COUNT(pm.id) as media_count,
  json_agg(pm.url ORDER BY pm.sort_order) as urls
FROM products p
LEFT JOIN product_media pm ON p.id = pm.product_id
GROUP BY p.id, p.name
HAVING COUNT(pm.id) > 0
LIMIT 5;
```

**Test in Browser Console:**
```javascript
// Check API response
fetch('/api/store/products?limit=1')
  .then(r => r.json())
  .then(d => console.log('Product media:', d.data[0]?.media));
```

---

## ✨ Expected Result

When you click a product card, you should see:

```
┌─────────────────────────────────────────────────┐
│  [X Close]                                       │
│                                                  │
│  ┌─────────────────────┐   Product Info         │
│  │                     │   • Name                │
│  │    [ IMAGE ]        │   • Description         │
│  │    with nav         │   • Price               │
│  │    ← →             │   • Add to Cart         │
│  └─────────────────────┘                        │
│  [🔍] [⛶]  [1/6]                                │
│                                                  │
│  [thumb] [thumb] [thumb] [thumb] [thumb] [thumb]│
└─────────────────────────────────────────────────┘
```

Features:
- ✅ Multiple images in carousel
- ✅ Navigation arrows
- ✅ Thumbnail strip (clickable)
- ✅ Zoom button (🔍)
- ✅ Fullscreen button (⛶)
- ✅ Counter showing "1 / 6"
- ✅ Keyboard nav (←→ keys)
- ✅ Swipe on touch devices

---

## 📞 Still Not Working?

If after following all steps the carousel still doesn't appear:

1. **Check migration status:**
   ```sql
   SELECT COUNT(*) FROM product_media;
   ```
   Should return a number > 0

2. **Check API returns media:**
   Visit: `http://localhost:3000/api/store/products?limit=1`
   Look for `"media": [...]` in the JSON

3. **Check component renders:**
   Look for console errors in browser DevTools

4. **Use the test SQL:**
   Run the queries in `TEST_MEDIA.sql` file

5. **Read the full guide:**
   Open `docs/PRODUCT_MEDIA_SYSTEM_GUIDE.md`

---

## 🎉 Success Checklist

- [ ] Migration file ran without errors
- [ ] `product_media` table exists
- [ ] Products have media (check with SQL)
- [ ] API returns `media` array
- [ ] Dev server restarted
- [ ] Browser cache cleared
- [ ] Carousel appears in quick view
- [ ] Thumbnails work
- [ ] Navigation works
- [ ] Zoom works
- [ ] Fullscreen works

Once all checked ✅, the carousel is fully functional! 🚀
