-- ============================================
-- Print Products & Digital Art Tables
-- Run in Supabase SQL Editor
-- ============================================

-- ─── PRINT PRODUCTS ───
CREATE TABLE IF NOT EXISTS print_products (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('poster','banner','wallpaper','canvas','tshirt','cap','hoodie','pants','sticker','business-card','window-design')),
  base_price    NUMERIC(10,2) NOT NULL DEFAULT 0,
  image         TEXT NOT NULL,
  description   TEXT,
  customizable  BOOLEAN DEFAULT true,
  printer_compatible TEXT[] DEFAULT '{}',
  sizes         JSONB NOT NULL DEFAULT '[]',
  sort_order    INT DEFAULT 0,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── DIGITAL ART ───
CREATE TABLE IF NOT EXISTS digital_art (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  artist        TEXT,
  price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  image         TEXT NOT NULL,
  thumbnail     TEXT,
  description   TEXT,
  category      TEXT NOT NULL CHECK (category IN ('illustration','abstract','photography','graphic-design','3d-art','animation')),
  file_formats  TEXT[] DEFAULT '{}',
  resolution    TEXT DEFAULT '4K',
  dimensions    JSONB,
  tags          TEXT[] DEFAULT '{}',
  downloads     INT DEFAULT 0,
  featured      BOOLEAN DEFAULT false,
  sort_order    INT DEFAULT 0,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── UPDATE CHECK CONSTRAINTS (safe to re-run) ───
-- Drop old type constraint and re-add with full list
ALTER TABLE print_products DROP CONSTRAINT IF EXISTS print_products_type_check;
ALTER TABLE print_products ADD CONSTRAINT print_products_type_check
  CHECK (type IN ('poster','banner','wallpaper','canvas','tshirt','cap','hoodie','pants','sticker','business-card','window-design'));

ALTER TABLE digital_art DROP CONSTRAINT IF EXISTS digital_art_category_check;
ALTER TABLE digital_art ADD CONSTRAINT digital_art_category_check
  CHECK (category IN ('illustration','abstract','photography','graphic-design','3d-art','animation'));

-- ─── INDEXES ───
CREATE INDEX IF NOT EXISTS idx_print_products_type ON print_products(type);
CREATE INDEX IF NOT EXISTS idx_print_products_active ON print_products(active);
CREATE INDEX IF NOT EXISTS idx_digital_art_category ON digital_art(category);
CREATE INDEX IF NOT EXISTS idx_digital_art_active ON digital_art(active);
CREATE INDEX IF NOT EXISTS idx_digital_art_featured ON digital_art(featured);

-- ─── RLS (Row Level Security) ───
ALTER TABLE print_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_art ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public read print_products" ON print_products;
DROP POLICY IF EXISTS "Public read digital_art" ON digital_art;
DROP POLICY IF EXISTS "Service role manage print_products" ON print_products;
DROP POLICY IF EXISTS "Service role manage digital_art" ON digital_art;

-- Public read access
CREATE POLICY "Public read print_products" ON print_products FOR SELECT USING (true);
CREATE POLICY "Public read digital_art" ON digital_art FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role manage print_products" ON print_products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manage digital_art" ON digital_art FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- SEED: Print Products (working Unsplash photos)
-- ============================================
INSERT INTO print_products (slug, name, type, base_price, image, description, customizable, printer_compatible, sizes, sort_order) VALUES

('premium-poster',
 'Premium Poster Print',
 'poster',
 19.99,
 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
 'High-quality poster prints on premium 200gsm matte paper with vivid color reproduction.',
 true,
 ARRAY['Roland','Mimaki'],
 '[{"label":"Small","width":12,"height":18,"price":19.99},{"label":"Medium","width":18,"height":24,"price":29.99},{"label":"Large","width":24,"height":36,"price":49.99},{"label":"X-Large","width":36,"height":48,"price":79.99}]'::jsonb,
 1),

('vinyl-banner',
 'Vinyl Banner',
 'banner',
 49.99,
 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
 'Durable heavy-duty vinyl banners for indoor and outdoor display. UV & weather resistant.',
 true,
 ARRAY['Roland','Mimaki'],
 '[{"label":"Small","width":24,"height":36,"price":49.99},{"label":"Medium","width":36,"height":60,"price":89.99},{"label":"Large","width":48,"height":96,"price":149.99}]'::jsonb,
 2),

('stretched-canvas',
 'Stretched Canvas',
 'canvas',
 59.99,
 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
 'Museum-quality canvas prints hand-stretched on 1.5" solid pine frames with gallery wrap.',
 true,
 ARRAY['Roland'],
 '[{"label":"Small","width":12,"height":16,"price":59.99},{"label":"Medium","width":18,"height":24,"price":89.99},{"label":"Large","width":24,"height":36,"price":149.99}]'::jsonb,
 3),

('custom-wallpaper',
 'Custom Wallpaper',
 'wallpaper',
 99.99,
 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800&q=80',
 'Peel-and-stick removable wallpaper panels. Repositionable and residue-free.',
 true,
 ARRAY['Roland'],
 '[{"label":"Single Panel","width":24,"height":96,"price":99.99},{"label":"Double Panel","width":48,"height":96,"price":179.99},{"label":"Full Wall","width":96,"height":96,"price":299.99}]'::jsonb,
 4),

('custom-tshirt',
 'Custom T-Shirt',
 'tshirt',
 24.99,
 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80',
 'Premium ring-spun cotton tees with DTG full-color printing. Pre-shrunk and soft-washed.',
 true,
 ARRAY['Heat Press'],
 '[{"label":"S","price":24.99},{"label":"M","price":24.99},{"label":"L","price":24.99},{"label":"XL","price":27.99},{"label":"2XL","price":29.99}]'::jsonb,
 5),

('embroidered-cap',
 'Embroidered Cap',
 'cap',
 19.99,
 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800&q=80',
 'Structured cotton twill caps with precision multi-thread embroidery. Adjustable strap.',
 true,
 ARRAY['Embroidery Machine'],
 '[{"label":"One Size","price":19.99},{"label":"Adjustable","price":22.99}]'::jsonb,
 6),

('custom-hoodie',
 'Custom Hoodie',
 'hoodie',
 44.99,
 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
 'Heavyweight fleece hoodie with premium prints and soft interior lining.',
 true,
 ARRAY['Heat Press'],
 '[{"label":"S","price":44.99},{"label":"M","price":44.99},{"label":"L","price":44.99},{"label":"XL","price":49.99},{"label":"2XL","price":54.99}]'::jsonb,
 7),

('custom-joggers',
 'Custom Joggers',
 'pants',
 39.99,
 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&q=80',
 'Soft joggers with precise print placement and tapered fit.',
 true,
 ARRAY['Heat Press'],
 '[{"label":"S","price":39.99},{"label":"M","price":39.99},{"label":"L","price":39.99},{"label":"XL","price":44.99}]'::jsonb,
 8),

('sticker-pack',
 'Sticker Pack',
 'sticker',
 9.99,
 'https://images.unsplash.com/photo-1521540216272-a50305cd4421?w=800&q=80',
 'Matte vinyl stickers with weatherproof laminate finish.',
 true,
 ARRAY['Roland'],
 '[{"label":"Small","width":3,"height":3,"price":9.99},{"label":"Medium","width":5,"height":5,"price":14.99},{"label":"Large","width":7,"height":7,"price":19.99}]'::jsonb,
 9),

('business-cards',
 'Business Cards',
 'business-card',
 24.99,
 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&q=80',
 'Premium 16pt matte business cards with smooth edges.',
 true,
 ARRAY['Roland'],
 '[{"label":"Standard","width":3.5,"height":2,"price":24.99},{"label":"Square","width":2.5,"height":2.5,"price":29.99}]'::jsonb,
 10),

('window-graphics',
 'Window Graphics',
 'window-design',
 79.99,
 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
 'Perforated window graphics for storefronts and studios.',
 true,
 ARRAY['Mimaki'],
 '[{"label":"Small","width":24,"height":36,"price":79.99},{"label":"Medium","width":36,"height":60,"price":129.99},{"label":"Large","width":48,"height":96,"price":199.99}]'::jsonb,
 11)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  base_price = EXCLUDED.base_price,
  image = EXCLUDED.image,
  description = EXCLUDED.description,
  customizable = EXCLUDED.customizable,
  printer_compatible = EXCLUDED.printer_compatible,
  sizes = EXCLUDED.sizes,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ============================================
-- SEED: Digital Art (working Unsplash photos)
-- ============================================
INSERT INTO digital_art (slug, name, artist, price, image, thumbnail, description, category, file_formats, resolution, dimensions, tags, downloads, featured, sort_order) VALUES

('neon-dreams',
 'Neon Dreams',
 'Alex Chen',
 49.99,
 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80',
 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80',
 'A vibrant cyberpunk-inspired digital illustration featuring neon lights and futuristic cityscapes.',
 'illustration',
 ARRAY['PNG','JPG','PSD'],
 '4K',
 '{"width":3840,"height":2160}'::jsonb,
 ARRAY['cyberpunk','neon','futuristic','city'],
 234, true, 1),

('abstract-waves',
 'Abstract Waves',
 'Sarah Johnson',
 39.99,
 'https://images.unsplash.com/photo-1567095761054-7a02e69e5571?w=1200&q=80',
 'https://images.unsplash.com/photo-1567095761054-7a02e69e5571?w=600&q=80',
 'Flowing abstract patterns with rich gradient colors perfect for modern digital designs.',
 'abstract',
 ARRAY['PNG','SVG','AI'],
 '8K',
 '{"width":7680,"height":4320}'::jsonb,
 ARRAY['abstract','waves','gradient','modern'],
 456, true, 2),

('golden-hour-landscape',
 'Golden Hour Landscape',
 'Mike Torres',
 29.99,
 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
 'Breathtaking mountain landscape captured during golden hour with stunning natural light.',
 'photography',
 ARRAY['JPG','PNG'],
 '4K',
 '{"width":4096,"height":2730}'::jsonb,
 ARRAY['landscape','mountains','golden-hour','nature'],
 189, false, 3),

('geometric-brand-kit',
 'Geometric Brand Kit',
 'Emma Wilson',
 34.99,
 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&q=80',
 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&q=80',
 'Professional geometric pattern pack for branding, social media, and background design.',
 'graphic-design',
 ARRAY['PNG','SVG','AI','PDF'],
 '8K',
 '{"width":8000,"height":8000}'::jsonb,
 ARRAY['geometric','pattern','branding','design'],
 567, false, 4),

('crystal-prism-render',
 'Crystal Prism Render',
 'David Kim',
 59.99,
 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&q=80',
 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&q=80',
 'Photo-realistic 3D crystal render with volumetric lighting and caustic reflections.',
 '3d-art',
 ARRAY['PNG','JPG'],
 '4K',
 '{"width":4000,"height":4000}'::jsonb,
 ARRAY['3d','crystal','render','lighting'],
 123, true, 5),

('motion-elements-pack',
 'Motion Elements Pack',
 'Lisa Martinez',
 79.99,
 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&q=80',
 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80',
 'Curated collection of animated motion graphics elements and transitions for video projects.',
 'animation',
 ARRAY['PNG','GIF'],
 '1080p',
 '{"width":1920,"height":1080}'::jsonb,
 ARRAY['animation','motion','video','transitions'],
 345, false, 6)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  artist = EXCLUDED.artist,
  price = EXCLUDED.price,
  image = EXCLUDED.image,
  thumbnail = EXCLUDED.thumbnail,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  file_formats = EXCLUDED.file_formats,
  resolution = EXCLUDED.resolution,
  dimensions = EXCLUDED.dimensions,
  tags = EXCLUDED.tags,
  downloads = EXCLUDED.downloads,
  featured = EXCLUDED.featured,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
