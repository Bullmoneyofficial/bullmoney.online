# 🎬 How to Add Unlimited Images + YouTube Video to Product

## 🚀 Super Quick Method (Copy/Paste)

### Step 1: Find Your YouTube Video ID

From TJR's channel, copy the video URL:
```
https://www.youtube.com/watch?v=ABC123XYZ
                                 ^^^^^^^^^ 
                            This is the Video ID
```

### Step 2: Run This SQL (Supabase SQL Editor)

Open **`QUICK_ADD_MEDIA.sql`** and:

1. **Line 19**: Change YouTube video ID:
   ```sql
   v_youtube_id TEXT := 'YOUR_VIDEO_ID_HERE';
   ```

2. **Line 22**: Change product slug (optional):
   ```sql
   v_product_slug TEXT := 'premium-hoodie';  -- Your product
   ```

3. **Lines 11-20**: Add/remove image URLs (unlimited!):
   ```sql
   v_images TEXT[] := ARRAY[
     'https://image1.jpg',
     'https://image2.jpg',
     'https://image3.jpg'
     -- Add as many as you want!
   ];
   ```

4. **Run it!** (Cmd+Enter or click Run)

---

## 📋 Detailed Method (Full Control)

Use **`ADD_IMAGES_VIDEO_TO_PRODUCT.sql`** for:
- Step-by-step process
- Comments and explanations
- Multiple customization options
- Keeping existing media

---

## 🎯 Example: Add TJR Trading Video

### Find a TJR Video

Search YouTube for "TJR trading 2026" or use any TJR video URL, for example:
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

### Quick SQL Command

```sql
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  -- Get first product (or change WHERE clause)
  SELECT id INTO v_product_id FROM products WHERE slug = 'your-slug' LIMIT 1;
  
  -- Add 10 high-quality images
  PERFORM add_product_media(v_product_id, 'image', 'https://images.unsplash.com/photo-1609873963526-48b4adb346a7?w=900', NULL, 'Image 1', 'Showcase 1', true);
  PERFORM add_product_media(v_product_id, 'image', 'https://images.unsplash.com/photo-1583922606661-0822ed0bd916?w=900', NULL, 'Image 2', 'Showcase 2', false);
  PERFORM add_product_media(v_product_id, 'image', 'https://images.unsplash.com/photo-1556871739-a8578b26a7dd?w=900', NULL, 'Image 3', 'Showcase 3', false);
  PERFORM add_product_media(v_product_id, 'image', 'https://images.unsplash.com/photo-1726661025461-5635b785ec23?w=900', NULL, 'Image 4', 'Showcase 4', false);
  PERFORM add_product_media(v_product_id, 'image', 'https://images.unsplash.com/photo-1723095469034-c3cf31e32730?w=900', NULL, 'Image 5', 'Showcase 5', false);
  PERFORM add_product_media(v_product_id, 'image', 'https://images.unsplash.com/photo-1603665301175-57ba46f392bf?w=1287', NULL, 'Image 6', 'Showcase 6', false);
  PERFORM add_product_media(v_product_id, 'image', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900', NULL, 'Image 7', 'Showcase 7', false);
  PERFORM add_product_media(v_product_id, 'image', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900', NULL, 'Image 8', 'Showcase 8', false);
  PERFORM add_product_media(v_product_id, 'image', 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=900', NULL, 'Image 9', 'Showcase 9', false);
  PERFORM add_product_media(v_product_id, 'image', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=900', NULL, 'Image 10', 'Showcase 10', false);
  
  -- Add TJR YouTube video
  PERFORM add_product_media(
    v_product_id, 
    'video', 
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',  -- ← Change to TJR video ID
    'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    'TJR Trading Analysis 2026', 
    'TJR Deep Dive', 
    false
  );
  
  RAISE NOTICE 'Added 10 images + 1 video!';
END $$;
```

---

## 📝 Common Tasks

### Add Images to Specific Product
```sql
-- By product slug
SELECT id FROM products WHERE slug = 'premium-hoodie';

-- Then use that ID
SELECT add_product_media(
  'PRODUCT_ID_HERE'::uuid,
  'image',
  'https://your-image-url.jpg',
  NULL,
  'Image description',
  'Image Title',
  false
);
```

### Add Multiple Videos
```sql
-- Video 1: TJR Trading
SELECT add_product_media(
  (SELECT id FROM products WHERE slug = 'trading-course'),
  'video',
  'https://www.youtube.com/watch?v=VIDEO_ID_1',
  'https://img.youtube.com/vi/VIDEO_ID_1/maxresdefault.jpg',
  'TJR Trading 2026 Analysis',
  'Part 1',
  false
);

-- Video 2: TJR Market Update
SELECT add_product_media(
  (SELECT id FROM products WHERE slug = 'trading-course'),
  'video',
  'https://www.youtube.com/watch?v=VIDEO_ID_2',
  'https://img.youtube.com/vi/VIDEO_ID_2/maxresdefault.jpg',
  'Market Update by TJR',
  'Part 2',
  false
);
```

### Add 50+ Images at Once
```sql
DO $$
DECLARE
  v_product_id UUID;
  v_urls TEXT[] := ARRAY[
    'url1', 'url2', 'url3', 'url4', 'url5',
    -- ... add up to 1000+ URLs!
  ];
  i INTEGER;
BEGIN
  SELECT id INTO v_product_id FROM products WHERE slug = 'your-slug';
  
  FOR i IN 1..array_length(v_urls, 1) LOOP
    PERFORM add_product_media(
      v_product_id, 'image', v_urls[i], NULL,
      'Image ' || i, 'Showcase ' || i, i = 1
    );
  END LOOP;
END $$;
```

---

## 🎨 What You'll See

After adding media, when you click a product in the store:

```
┌────────────────────────────────────────┐
│  Product Quick View                     │
│                                         │
│  ╔═══════════════════╗                 │
│  ║  [  Image 1  ]    ║  Product Info   │
│  ║  ←           →    ║  • Name         │
│  ║  [🔍] [⛶] 1/10   ║  • Price        │
│  ╚═══════════════════╝  • Add to Cart  │
│                                         │
│  Thumbnails:                            │
│  [img] [img] [img] [▶️ video] ... more │
│                                         │
└────────────────────────────────────────┘
```

Features:
- ✅ 10 images in carousel
- ✅ YouTube video with thumbnail
- ✅ Click video thumbnail to watch
- ✅ Zoom images
- ✅ Fullscreen mode
- ✅ Smooth navigation

---

## 🔥 Pro Tips

1. **YouTube Thumbnails** - Always use:
   ```
   https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg
   ```

2. **Image Order** - First image added is always primary (shows in grid)

3. **Unlimited** - You can add 1000+ images/videos per product!

4. **Performance** - Images are lazy-loaded, so don't worry about page speed

5. **Video Embed** - Works with:
   - YouTube: `https://www.youtube.com/watch?v=ID`
   - Vimeo: `https://vimeo.com/12345`
   - Direct: `/videos/demo.mp4`

---

## ✅ Verification

Check if it worked:
```sql
SELECT 
  p.name,
  COUNT(pm.id) as media_count,
  json_agg(pm.media_type) as types
FROM products p
JOIN product_media pm ON p.id = pm.product_id
GROUP BY p.id, p.name;
```

You should see your product with media_count > 0!

---

## 🎉 Done!

Now visit your store and click any product to see the amazing carousel! 🚀
