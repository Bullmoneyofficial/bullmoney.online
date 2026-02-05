-- ============================================================================
-- BULLMONEY STORE - SEED DATA
-- Dummy products for BullMoney trading brand
-- Run after 20260204_bullmoney_store_schema.sql
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'categories'
  ) THEN
    RAISE EXCEPTION 'BullMoney store tables not found. Run 20260204_bullmoney_store_schema.sql first.';
  END IF;
END $$;

-- ============================================================================
-- CATEGORIES
-- ============================================================================

INSERT INTO categories (id, name, slug, description, image_url, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Apparel', 'apparel', 'Premium BullMoney branded clothing for traders', 'https://placehold.co/600x400/1a1a2e/d4af37?text=BullMoney+Apparel', 1),
  ('22222222-2222-2222-2222-222222222222', 'Accessories', 'accessories', 'Trading desk accessories and lifestyle items', 'https://placehold.co/600x400/1a1a2e/d4af37?text=BullMoney+Accessories', 2),
  ('33333333-3333-3333-3333-333333333333', 'Tech & Gear', 'tech-gear', 'High-performance tech for serious traders', 'https://placehold.co/600x400/1a1a2e/d4af37?text=BullMoney+Tech', 3),
  ('44444444-4444-4444-4444-444444444444', 'Home Office', 'home-office', 'Professional trading setup essentials', 'https://placehold.co/600x400/1a1a2e/d4af37?text=BullMoney+Office', 4),
  ('55555555-5555-5555-5555-555555555555', 'Drinkware', 'drinkware', 'Stay hydrated during market hours', 'https://placehold.co/600x400/1a1a2e/d4af37?text=BullMoney+Drinkware', 5),
  ('66666666-6666-6666-6666-666666666666', 'Limited Edition', 'limited-edition', 'Exclusive collector items for BullMoney members', 'https://placehold.co/600x400/1a1a2e/d4af37?text=Limited+Edition', 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;

-- ============================================================================
-- PRODUCTS - APPAREL
-- ============================================================================

INSERT INTO products (id, name, slug, description, short_description, base_price, compare_at_price, category_id, status, featured, tags, details) VALUES
-- T-Shirts
('a1111111-1111-1111-1111-111111111111', 
 'BullMoney Bull Logo Tee', 
 'bullmoney-bull-logo-tee',
 'Rep your trading tribe with our signature bull logo tee. Made from premium 100% organic cotton with a soft hand feel. Features the iconic BullMoney charging bull emblem on the front with "Trade The Trend" on the back.',
 'Signature bull logo premium cotton tee',
 34.99, 44.99,
 '11111111-1111-1111-1111-111111111111',
 'ACTIVE', TRUE,
 ARRAY['tshirt', 'apparel', 'bestseller', 'cotton'],
 '{"material": "100% Organic Cotton", "fit": "Regular", "care": "Machine wash cold", "weight": "180gsm"}'::jsonb),

('a1111111-1111-1111-1111-111111111112', 
 'Green Candle Club Tee', 
 'green-candle-club-tee',
 'For the traders who live for green candles. This premium tee features a candlestick chart design with our signature green gradient. Perfect for celebrating those winning trades.',
 'Candlestick chart design trader tee',
 29.99, 39.99,
 '11111111-1111-1111-1111-111111111111',
 'ACTIVE', TRUE,
 ARRAY['tshirt', 'apparel', 'trading', 'candlestick'],
 '{"material": "Cotton Blend", "fit": "Relaxed", "care": "Machine wash cold"}'::jsonb),

('a1111111-1111-1111-1111-111111111113', 
 'Diamond Hands Hoodie', 
 'diamond-hands-hoodie',
 'Show your commitment with our Diamond Hands hoodie. Heavy-weight fleece with embroidered diamond and bull logo. Kangaroo pocket perfect for keeping your phone ready for alerts. The ultimate comfort for late-night trading sessions.',
 'Premium embroidered diamond hands hoodie',
 79.99, 99.99,
 '11111111-1111-1111-1111-111111111111',
 'ACTIVE', TRUE,
 ARRAY['hoodie', 'apparel', 'premium', 'embroidered'],
 '{"material": "80% Cotton, 20% Polyester", "weight": "400gsm", "fit": "Oversized", "features": ["Kangaroo pocket", "Embroidered logo", "Ribbed cuffs"]}'::jsonb),

('a1111111-1111-1111-1111-111111111114', 
 'Market Hours Crewneck', 
 'market-hours-crewneck',
 'Cozy crewneck featuring market open/close times across global exchanges. Tokyo, London, New York - always know when the action happens. Soft fleece interior.',
 'Global market hours crewneck sweater',
 59.99, 74.99,
 '11111111-1111-1111-1111-111111111111',
 'ACTIVE', FALSE,
 ARRAY['sweater', 'apparel', 'market-hours', 'global'],
 '{"material": "Cotton/Polyester Blend", "fit": "Regular", "care": "Machine wash cold"}'::jsonb),

('a1111111-1111-1111-1111-111111111115', 
 'Pip Hunter Snapback', 
 'pip-hunter-snapback',
 'Premium structured snapback cap with "Pip Hunter" embroidery. Gold BullMoney bull logo on the side. Adjustable snap closure fits all sizes.',
 'Embroidered pip hunter snapback cap',
 32.99, 42.99,
 '11111111-1111-1111-1111-111111111111',
 'ACTIVE', FALSE,
 ARRAY['hat', 'cap', 'snapback', 'forex'],
 '{"material": "Wool Blend", "closure": "Snapback", "fit": "One Size"}'::jsonb),

-- ============================================================================
-- PRODUCTS - ACCESSORIES
-- ============================================================================

('a2222222-2222-2222-2222-222222222221', 
 'Trading Desk Mat XXL', 
 'trading-desk-mat-xxl',
 'Dominate your desk with our XXL trading mat. Full desk coverage (900x400mm) with BullMoney bull pattern. Non-slip rubber base, water-resistant surface. Perfect for multi-monitor setups.',
 'XXL desk mat with BullMoney bull pattern',
 49.99, 69.99,
 '22222222-2222-2222-2222-222222222222',
 'ACTIVE', TRUE,
 ARRAY['desk-mat', 'mousepad', 'office', 'xxl'],
 '{"dimensions": {"width": 900, "height": 400, "thickness": 4}, "material": "Premium cloth top, rubber base", "features": ["Water resistant", "Non-slip", "Stitched edges"]}'::jsonb),

('a2222222-2222-2222-2222-222222222222', 
 'Bull & Bear Enamel Pin Set', 
 'bull-bear-enamel-pin-set',
 'Collector enamel pin set featuring gold bull and silver bear designs. Hard enamel with butterfly clutch backs. Perfect for your trading jacket or backpack.',
 'Gold bull & silver bear enamel pin set',
 19.99, 24.99,
 '22222222-2222-2222-2222-222222222222',
 'ACTIVE', FALSE,
 ARRAY['pins', 'enamel', 'collector', 'bull-bear'],
 '{"material": "Hard Enamel", "backing": "Butterfly Clutch", "set_includes": 2}'::jsonb),

('a2222222-2222-2222-2222-222222222223', 
 'Crypto Hodler Leather Wallet', 
 'crypto-hodler-leather-wallet',
 'Premium full-grain leather wallet with embossed BullMoney logo. RFID blocking technology protects your cards like you protect your crypto. 8 card slots, 2 bill compartments, ID window.',
 'RFID blocking leather wallet with embossed logo',
 69.99, 89.99,
 '22222222-2222-2222-2222-222222222222',
 'ACTIVE', TRUE,
 ARRAY['wallet', 'leather', 'rfid', 'crypto'],
 '{"material": "Full Grain Leather", "features": ["RFID Blocking", "8 Card Slots", "2 Bill Compartments"], "dimensions": {"width": 11, "height": 9}}'::jsonb),

('a2222222-2222-2222-2222-222222222224', 
 'Trading Journal Notebook', 
 'trading-journal-notebook',
 'Professional trading journal with pre-formatted pages for logging trades. Includes sections for entry/exit, position size, emotions, and post-trade analysis. 200 pages of premium paper.',
 'Pre-formatted professional trading journal',
 24.99, 34.99,
 '22222222-2222-2222-2222-222222222222',
 'ACTIVE', FALSE,
 ARRAY['journal', 'notebook', 'trading-log', 'paper'],
 '{"pages": 200, "paper": "100gsm Premium", "binding": "Lay-flat", "features": ["Trade templates", "Monthly reviews", "Goal tracking"]}'::jsonb),

('a2222222-2222-2222-2222-222222222225', 
 'Chart Pattern Sticker Pack', 
 'chart-pattern-sticker-pack',
 'Pack of 30 vinyl stickers featuring popular chart patterns. Head & shoulders, double tops, triangles, flags, and more. Waterproof, perfect for laptops, water bottles, and trading stations.',
 '30 vinyl stickers with chart patterns',
 14.99, 19.99,
 '22222222-2222-2222-2222-222222222222',
 'ACTIVE', FALSE,
 ARRAY['stickers', 'vinyl', 'chart-patterns', 'laptop'],
 '{"quantity": 30, "material": "Vinyl", "features": ["Waterproof", "UV resistant", "Removable"]}'::jsonb),

-- ============================================================================
-- PRODUCTS - TECH & GEAR
-- ============================================================================

('a3333333-3333-3333-3333-333333333331', 
 'TradeAlert Pro Smartwatch Band', 
 'tradealert-pro-watch-band',
 'Custom BullMoney watch band compatible with Apple Watch and Samsung Galaxy Watch. Premium silicone with laser-engraved bull logo. Stay connected to your alerts in style.',
 'Premium silicone smartwatch band',
 29.99, 39.99,
 '33333333-3333-3333-3333-333333333333',
 'ACTIVE', FALSE,
 ARRAY['watchband', 'apple-watch', 'samsung', 'tech'],
 '{"material": "Medical-grade Silicone", "compatibility": ["Apple Watch 38-49mm", "Samsung Galaxy Watch"], "features": ["Quick release", "Laser engraved"]}'::jsonb),

('a3333333-3333-3333-3333-333333333332', 
 'Dual Monitor Stand - Gold Edition', 
 'dual-monitor-stand-gold',
 'Premium dual monitor stand with gold accents. Supports two monitors up to 32". Gas spring arms for easy positioning. Cable management system keeps your desk clean. BullMoney logo plate included.',
 'Premium dual monitor stand with gold accents',
 189.99, 249.99,
 '33333333-3333-3333-3333-333333333333',
 'ACTIVE', TRUE,
 ARRAY['monitor-stand', 'dual', 'gold', 'premium'],
 '{"max_size": "32 inches", "arms": 2, "weight_capacity": "9kg per arm", "features": ["Gas spring", "360° rotation", "Cable management", "VESA compatible"]}'::jsonb),

('a3333333-3333-3333-3333-333333333333', 
 'Wireless Charging Pad - Bull', 
 'wireless-charging-pad-bull',
 'Keep your devices charged between trading sessions. 15W fast wireless charging with BullMoney bull design. LED ring indicates charging status. Compatible with all Qi-enabled devices.',
 '15W fast wireless charger with bull design',
 39.99, 54.99,
 '33333333-3333-3333-3333-333333333333',
 'ACTIVE', FALSE,
 ARRAY['charger', 'wireless', 'qi', 'phone'],
 '{"power": "15W", "compatibility": "Qi-enabled devices", "features": ["LED indicator", "Foreign object detection", "Temperature control"]}'::jsonb),

('a3333333-3333-3333-3333-333333333334', 
 'USB-C Trading Hub 7-in-1', 
 'usb-c-trading-hub-7in1',
 'Essential hub for the mobile trader. 7 ports including HDMI 4K, USB-A, USB-C PD, SD card slots. Compact aluminum body with BullMoney logo. Perfect for laptop trading setups.',
 '7-in-1 USB-C hub for traders',
 59.99, 79.99,
 '33333333-3333-3333-3333-333333333333',
 'ACTIVE', FALSE,
 ARRAY['usb-hub', 'usb-c', 'hdmi', 'laptop'],
 '{"ports": ["HDMI 4K@60Hz", "USB-A 3.0 x2", "USB-C PD 100W", "SD", "microSD", "3.5mm Audio"], "material": "Aluminum", "cable_length": "15cm"}'::jsonb),

-- ============================================================================
-- PRODUCTS - HOME OFFICE
-- ============================================================================

('a4444444-4444-4444-4444-444444444441', 
 'LED Price Ticker Display', 
 'led-price-ticker-display',
 'Real-time scrolling LED display showing live crypto and forex prices. WiFi connected, customizable watchlist via app. 24" wide, wall mount or desk stand included. BullMoney app integration.',
 'WiFi LED ticker with live prices',
 299.99, 399.99,
 '44444444-4444-4444-4444-444444444444',
 'ACTIVE', TRUE,
 ARRAY['led-display', 'ticker', 'crypto', 'forex', 'wifi'],
 '{"width": "24 inches", "connectivity": "WiFi", "power": "USB-C", "features": ["App controlled", "Custom watchlists", "Multiple data sources", "Brightness control"]}'::jsonb),

('a4444444-4444-4444-4444-444444444442', 
 'Trading Floor Neon Sign', 
 'trading-floor-neon-sign',
 'Light up your trading room with our custom LED neon sign. "Trade Like A Bull" in gold and green. Dimmable, wall-mountable, low heat LEDs. Makes any room look like a trading floor.',
 'LED neon sign - Trade Like A Bull',
 149.99, 199.99,
 '44444444-4444-4444-4444-444444444444',
 'ACTIVE', TRUE,
 ARRAY['neon', 'led', 'sign', 'decor'],
 '{"dimensions": {"width": 50, "height": 30}, "power": "12V adapter included", "features": ["Dimmable", "Remote control", "Wall mount kit"]}'::jsonb),

('a4444444-4444-4444-4444-444444444443', 
 'Bull Statue - Gold Finish', 
 'bull-statue-gold-finish',
 'Iconic charging bull statue with premium gold finish. 12" tall, solid resin construction. Heavy weighted base. The ultimate desk centerpiece for any serious trader.',
 'Gold charging bull desk statue 12"',
 89.99, 119.99,
 '44444444-4444-4444-4444-444444444444',
 'ACTIVE', FALSE,
 ARRAY['statue', 'bull', 'gold', 'decor', 'desk'],
 '{"height": "12 inches", "material": "Resin with gold finish", "weight": "1.5kg", "base": "Weighted"}'::jsonb),

('a4444444-4444-4444-4444-444444444444', 
 'Candlestick Chart Wall Art', 
 'candlestick-chart-wall-art',
 'Premium metal wall art featuring an ascending candlestick chart. 36" wide brushed aluminum with gold and green accents. Adds sophistication to any trading room or home office.',
 'Metal wall art candlestick chart 36"',
 179.99, 229.99,
 '44444444-4444-4444-4444-444444444444',
 'ACTIVE', FALSE,
 ARRAY['wall-art', 'metal', 'candlestick', 'decor'],
 '{"width": "36 inches", "material": "Brushed Aluminum", "mounting": "Keyhole brackets included", "finish": "Gold and Green accents"}'::jsonb),

-- ============================================================================
-- PRODUCTS - DRINKWARE
-- ============================================================================

('a5555555-5555-5555-5555-555555555551', 
 'Trader''s Insulated Tumbler', 
 'traders-insulated-tumbler',
 'Keep your coffee hot through the morning session and your water cold during afternoon volatility. 20oz double-wall vacuum insulated tumbler with BullMoney bull logo. Leak-proof lid.',
 '20oz insulated tumbler with bull logo',
 29.99, 39.99,
 '55555555-5555-5555-5555-555555555555',
 'ACTIVE', TRUE,
 ARRAY['tumbler', 'insulated', 'coffee', 'water'],
 '{"capacity": "20oz", "insulation": "Double-wall vacuum", "material": "Stainless Steel", "features": ["Leak-proof lid", "BPA-free", "Fits cup holders"]}'::jsonb),

('a5555555-5555-5555-5555-555555555552', 
 'Buy The Dip Coffee Mug', 
 'buy-the-dip-coffee-mug',
 'Start your trading day right with our "Buy The Dip" ceramic mug. 15oz capacity with comfortable handle. Microwave and dishwasher safe. Features chart pattern dipping design.',
 '15oz ceramic mug - Buy The Dip',
 18.99, 24.99,
 '55555555-5555-5555-5555-555555555555',
 'ACTIVE', FALSE,
 ARRAY['mug', 'ceramic', 'coffee', 'buy-the-dip'],
 '{"capacity": "15oz", "material": "Ceramic", "care": "Dishwasher & Microwave safe"}'::jsonb),

('a5555555-5555-5555-5555-555555555553', 
 'Profit Taker Water Bottle', 
 'profit-taker-water-bottle',
 'Stay hydrated, take profits. 32oz stainless steel water bottle with time markers to track your hydration. "Take Profits, Stay Hydrated" motto. Flip-top lid with carry loop.',
 '32oz water bottle with hydration tracker',
 34.99, 44.99,
 '55555555-5555-5555-5555-555555555555',
 'ACTIVE', FALSE,
 ARRAY['water-bottle', 'stainless', 'hydration', 'fitness'],
 '{"capacity": "32oz", "material": "Stainless Steel", "features": ["Time markers", "Flip-top lid", "Carry loop", "Gradient design"]}'::jsonb),

('a5555555-5555-5555-5555-555555555554', 
 'Market Open Shot Glass Set', 
 'market-open-shot-glass-set',
 'Celebrate your wins (responsibly). Set of 4 shot glasses with trading slogans: "To The Moon", "Diamond Hands", "HODL", "Lambo Soon". Premium weighted glass, gold rim.',
 'Set of 4 trading slogan shot glasses',
 24.99, 34.99,
 '55555555-5555-5555-5555-555555555555',
 'ACTIVE', FALSE,
 ARRAY['shot-glass', 'glassware', 'party', 'set'],
 '{"quantity": 4, "material": "Premium Glass", "capacity": "1.5oz each", "finish": "Gold rim"}'::jsonb),

-- ============================================================================
-- PRODUCTS - LIMITED EDITION
-- ============================================================================

('a6666666-6666-6666-6666-666666666661', 
 'Founders Collection Jacket', 
 'founders-collection-jacket',
 'Ultra-limited Founders Collection bomber jacket. Premium satin exterior with embroidered BullMoney crest. Numbered edition (001-500). Certificate of authenticity included. For true believers only.',
 'Limited numbered bomber jacket',
 249.99, 349.99,
 '66666666-6666-6666-6666-666666666666',
 'ACTIVE', TRUE,
 ARRAY['jacket', 'limited', 'founders', 'numbered', 'collector'],
 '{"material": "Premium Satin", "edition_size": 500, "features": ["Embroidered crest", "Numbered", "Certificate included", "Satin lining"]}'::jsonb),

('a6666666-6666-6666-6666-666666666662', 
 '24K Gold Plated Bull Pendant', 
 '24k-gold-plated-bull-pendant',
 'Make a statement with our 24K gold plated charging bull pendant. Detailed 3D design, 20" chain included. Limited run of 200 pieces. Comes in premium gift box.',
 '24K gold plated bull pendant necklace',
 149.99, 199.99,
 '66666666-6666-6666-6666-666666666666',
 'ACTIVE', TRUE,
 ARRAY['jewelry', 'pendant', 'gold', 'limited', 'necklace'],
 '{"material": "24K Gold Plated Sterling Silver", "chain_length": "20 inches", "edition_size": 200, "packaging": "Premium gift box"}'::jsonb),

('a6666666-6666-6666-6666-666666666663', 
 'VIP Member Poker Set', 
 'vip-member-poker-set',
 'Exclusive to BullMoney VIP members. Professional 500-chip poker set in aluminum case. Custom BullMoney chip designs. Includes 2 decks of cards with trading theme.',
 'VIP exclusive 500-chip poker set',
 199.99, 299.99,
 '66666666-6666-6666-6666-666666666666',
 'ACTIVE', FALSE,
 ARRAY['poker', 'vip', 'exclusive', 'games', 'chips'],
 '{"chips": 500, "case": "Aluminum", "includes": ["2 Card decks", "Dealer button", "Blinds buttons"], "weight": "11.5g chips"}'::jsonb),

('a6666666-6666-6666-6666-666666666664', 
 'Anniversary Collector Box 2026', 
 'anniversary-collector-box-2026',
 'Celebrate with our 2026 Anniversary Collector Box. Includes: Limited tee, enamel pin set, trading journal, sticker pack, and mystery item. Numbered wooden box with certificate.',
 'Anniversary edition collector box set',
 149.99, 199.99,
 '66666666-6666-6666-6666-666666666666',
 'ACTIVE', FALSE,
 ARRAY['collector', 'anniversary', 'box-set', 'limited', 'gift'],
 '{"edition_year": 2026, "includes": ["Limited tee", "Enamel pins", "Trading journal", "Sticker pack", "Mystery item"], "packaging": "Numbered wooden box"}'::jsonb)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  short_description = EXCLUDED.short_description,
  base_price = EXCLUDED.base_price,
  compare_at_price = EXCLUDED.compare_at_price,
  category_id = EXCLUDED.category_id,
  status = EXCLUDED.status,
  featured = EXCLUDED.featured,
  tags = EXCLUDED.tags,
  details = EXCLUDED.details,
  updated_at = NOW();

-- ============================================================================
-- PRODUCT IMAGES
-- ============================================================================

INSERT INTO product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES
-- Bull Logo Tee
('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Bull+Logo+Tee', 'BullMoney Bull Logo Tee - Front', 0, TRUE),
('b1111111-1111-1111-1111-111111111112', 'a1111111-1111-1111-1111-111111111111', 'https://placehold.co/800x800/1a1a2e/ffffff?text=Bull+Logo+Tee+Back', 'BullMoney Bull Logo Tee - Back', 1, FALSE),

-- Green Candle Tee
('b1111111-1111-1111-1111-111111111121', 'a1111111-1111-1111-1111-111111111112', 'https://placehold.co/800x800/1a1a2e/00ff88?text=Green+Candle+Tee', 'Green Candle Club Tee - Front', 0, TRUE),
('b1111111-1111-1111-1111-111111111122', 'a1111111-1111-1111-1111-111111111112', 'https://placehold.co/800x800/1a1a2e/00ff88?text=Green+Candle+Detail', 'Green Candle Club Tee - Detail', 1, FALSE),

-- Diamond Hands Hoodie
('b1111111-1111-1111-1111-111111111131', 'a1111111-1111-1111-1111-111111111113', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Diamond+Hands+Hoodie', 'Diamond Hands Hoodie - Front', 0, TRUE),
('b1111111-1111-1111-1111-111111111132', 'a1111111-1111-1111-1111-111111111113', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Hoodie+Embroidery', 'Diamond Hands Hoodie - Embroidery Detail', 1, FALSE),

-- Market Hours Crewneck
('b1111111-1111-1111-1111-111111111141', 'a1111111-1111-1111-1111-111111111114', 'https://placehold.co/800x800/1a1a2e/00bfff?text=Market+Hours+Crew', 'Market Hours Crewneck - Front', 0, TRUE),

-- Pip Hunter Snapback
('b1111111-1111-1111-1111-111111111151', 'a1111111-1111-1111-1111-111111111115', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Pip+Hunter+Cap', 'Pip Hunter Snapback - Front', 0, TRUE),

-- Desk Mat XXL
('b2222222-2222-2222-2222-222222222211', 'a2222222-2222-2222-2222-222222222221', 'https://placehold.co/800x400/1a1a2e/d4af37?text=Trading+Desk+Mat+XXL', 'Trading Desk Mat XXL', 0, TRUE),
('b2222222-2222-2222-2222-222222222212', 'a2222222-2222-2222-2222-222222222221', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Desk+Mat+Detail', 'Trading Desk Mat - Pattern Detail', 1, FALSE),

-- Enamel Pin Set
('b2222222-2222-2222-2222-222222222221', 'a2222222-2222-2222-2222-222222222222', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Bull+Bear+Pins', 'Bull & Bear Enamel Pin Set', 0, TRUE),

-- Leather Wallet
('b2222222-2222-2222-2222-222222222231', 'a2222222-2222-2222-2222-222222222223', 'https://placehold.co/800x800/2d2d44/d4af37?text=Leather+Wallet', 'Crypto Hodler Leather Wallet - Closed', 0, TRUE),
('b2222222-2222-2222-2222-222222222232', 'a2222222-2222-2222-2222-222222222223', 'https://placehold.co/800x800/2d2d44/d4af37?text=Wallet+Open', 'Crypto Hodler Leather Wallet - Open', 1, FALSE),

-- Trading Journal
('b2222222-2222-2222-2222-222222222241', 'a2222222-2222-2222-2222-222222222224', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Trading+Journal', 'Trading Journal Notebook', 0, TRUE),

-- Sticker Pack
('b2222222-2222-2222-2222-222222222251', 'a2222222-2222-2222-2222-222222222225', 'https://placehold.co/800x800/1a1a2e/00ff88?text=Sticker+Pack', 'Chart Pattern Sticker Pack', 0, TRUE),

-- Watch Band
('b3333333-3333-3333-3333-333333333311', 'a3333333-3333-3333-3333-333333333331', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Watch+Band', 'TradeAlert Pro Smartwatch Band', 0, TRUE),

-- Monitor Stand
('b3333333-3333-3333-3333-333333333321', 'a3333333-3333-3333-3333-333333333332', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Monitor+Stand', 'Dual Monitor Stand - Gold Edition', 0, TRUE),
('b3333333-3333-3333-3333-333333333322', 'a3333333-3333-3333-3333-333333333332', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Stand+Side+View', 'Dual Monitor Stand - Side View', 1, FALSE),

-- Wireless Charger
('b3333333-3333-3333-3333-333333333331', 'a3333333-3333-3333-3333-333333333333', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Wireless+Charger', 'Wireless Charging Pad - Bull Design', 0, TRUE),

-- USB Hub
('b3333333-3333-3333-3333-333333333341', 'a3333333-3333-3333-3333-333333333334', 'https://placehold.co/800x800/2d2d44/d4af37?text=USB-C+Hub', 'USB-C Trading Hub 7-in-1', 0, TRUE),

-- LED Ticker
('b4444444-4444-4444-4444-444444444411', 'a4444444-4444-4444-4444-444444444441', 'https://placehold.co/800x400/000000/00ff88?text=LED+Price+Ticker', 'LED Price Ticker Display', 0, TRUE),
('b4444444-4444-4444-4444-444444444412', 'a4444444-4444-4444-4444-444444444441', 'https://placehold.co/800x800/1a1a2e/00ff88?text=Ticker+Setup', 'LED Price Ticker - Desk Setup', 1, FALSE),

-- Neon Sign
('b4444444-4444-4444-4444-444444444421', 'a4444444-4444-4444-4444-444444444442', 'https://placehold.co/800x600/0a0a14/d4af37?text=Trade+Like+A+Bull+Neon', 'Trading Floor Neon Sign', 0, TRUE),

-- Bull Statue
('b4444444-4444-4444-4444-444444444431', 'a4444444-4444-4444-4444-444444444443', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Gold+Bull+Statue', 'Bull Statue - Gold Finish', 0, TRUE),

-- Wall Art
('b4444444-4444-4444-4444-444444444441', 'a4444444-4444-4444-4444-444444444444', 'https://placehold.co/800x600/1a1a2e/d4af37?text=Candlestick+Wall+Art', 'Candlestick Chart Wall Art', 0, TRUE),

-- Tumbler
('b5555555-5555-5555-5555-555555555511', 'a5555555-5555-5555-5555-555555555551', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Insulated+Tumbler', 'Trader''s Insulated Tumbler', 0, TRUE),

-- Coffee Mug
('b5555555-5555-5555-5555-555555555521', 'a5555555-5555-5555-5555-555555555552', 'https://placehold.co/800x800/ffffff/1a1a2e?text=Buy+The+Dip+Mug', 'Buy The Dip Coffee Mug', 0, TRUE),

-- Water Bottle
('b5555555-5555-5555-5555-555555555531', 'a5555555-5555-5555-5555-555555555553', 'https://placehold.co/800x800/1a1a2e/00bfff?text=Water+Bottle', 'Profit Taker Water Bottle', 0, TRUE),

-- Shot Glass Set
('b5555555-5555-5555-5555-555555555541', 'a5555555-5555-5555-5555-555555555554', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Shot+Glass+Set', 'Market Open Shot Glass Set', 0, TRUE),

-- Founders Jacket
('b6666666-6666-6666-6666-666666666611', 'a6666666-6666-6666-6666-666666666661', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Founders+Jacket', 'Founders Collection Jacket - Front', 0, TRUE),
('b6666666-6666-6666-6666-666666666612', 'a6666666-6666-6666-6666-666666666661', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Jacket+Back+Crest', 'Founders Collection Jacket - Back Crest', 1, FALSE),

-- Gold Pendant
('b6666666-6666-6666-6666-666666666621', 'a6666666-6666-6666-6666-666666666662', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Gold+Bull+Pendant', '24K Gold Plated Bull Pendant', 0, TRUE),

-- Poker Set
('b6666666-6666-6666-6666-666666666631', 'a6666666-6666-6666-6666-666666666663', 'https://placehold.co/800x800/1a1a2e/d4af37?text=VIP+Poker+Set', 'VIP Member Poker Set', 0, TRUE),
('b6666666-6666-6666-6666-666666666632', 'a6666666-6666-6666-6666-666666666663', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Poker+Chips', 'VIP Poker Set - Custom Chips', 1, FALSE),

-- Anniversary Box
('b6666666-6666-6666-6666-666666666641', 'a6666666-6666-6666-6666-666666666664', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Anniversary+Box+2026', 'Anniversary Collector Box 2026', 0, TRUE),
('b6666666-6666-6666-6666-666666666642', 'a6666666-6666-6666-6666-666666666664', 'https://placehold.co/800x800/1a1a2e/d4af37?text=Box+Contents', 'Anniversary Box - Contents', 1, FALSE)

ON CONFLICT (id) DO UPDATE SET
  url = EXCLUDED.url,
  alt_text = EXCLUDED.alt_text,
  sort_order = EXCLUDED.sort_order,
  is_primary = EXCLUDED.is_primary;

-- ============================================================================
-- PRODUCT VARIANTS
-- ============================================================================

-- Bull Logo Tee Variants (Sizes)
INSERT INTO variants (id, product_id, sku, name, options, price_adjustment, inventory_count) VALUES
('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'BM-TEE-BULL-S', 'Small', '{"size": "S"}'::jsonb, 0, 50),
('c1111111-1111-1111-1111-111111111112', 'a1111111-1111-1111-1111-111111111111', 'BM-TEE-BULL-M', 'Medium', '{"size": "M"}'::jsonb, 0, 100),
('c1111111-1111-1111-1111-111111111113', 'a1111111-1111-1111-1111-111111111111', 'BM-TEE-BULL-L', 'Large', '{"size": "L"}'::jsonb, 0, 100),
('c1111111-1111-1111-1111-111111111114', 'a1111111-1111-1111-1111-111111111111', 'BM-TEE-BULL-XL', 'X-Large', '{"size": "XL"}'::jsonb, 0, 75),
('c1111111-1111-1111-1111-111111111115', 'a1111111-1111-1111-1111-111111111111', 'BM-TEE-BULL-2XL', '2X-Large', '{"size": "2XL"}'::jsonb, 5.00, 50),

-- Green Candle Tee Variants
('c1111111-1111-1111-1111-111111111121', 'a1111111-1111-1111-1111-111111111112', 'BM-TEE-GC-S', 'Small', '{"size": "S"}'::jsonb, 0, 40),
('c1111111-1111-1111-1111-111111111122', 'a1111111-1111-1111-1111-111111111112', 'BM-TEE-GC-M', 'Medium', '{"size": "M"}'::jsonb, 0, 80),
('c1111111-1111-1111-1111-111111111123', 'a1111111-1111-1111-1111-111111111112', 'BM-TEE-GC-L', 'Large', '{"size": "L"}'::jsonb, 0, 80),
('c1111111-1111-1111-1111-111111111124', 'a1111111-1111-1111-1111-111111111112', 'BM-TEE-GC-XL', 'X-Large', '{"size": "XL"}'::jsonb, 0, 60),

-- Diamond Hands Hoodie Variants
('c1111111-1111-1111-1111-111111111131', 'a1111111-1111-1111-1111-111111111113', 'BM-HOOD-DH-S', 'Small - Black', '{"size": "S", "color": "Black"}'::jsonb, 0, 30),
('c1111111-1111-1111-1111-111111111132', 'a1111111-1111-1111-1111-111111111113', 'BM-HOOD-DH-M', 'Medium - Black', '{"size": "M", "color": "Black"}'::jsonb, 0, 60),
('c1111111-1111-1111-1111-111111111133', 'a1111111-1111-1111-1111-111111111113', 'BM-HOOD-DH-L', 'Large - Black', '{"size": "L", "color": "Black"}'::jsonb, 0, 60),
('c1111111-1111-1111-1111-111111111134', 'a1111111-1111-1111-1111-111111111113', 'BM-HOOD-DH-XL', 'X-Large - Black', '{"size": "XL", "color": "Black"}'::jsonb, 0, 45),
('c1111111-1111-1111-1111-111111111135', 'a1111111-1111-1111-1111-111111111113', 'BM-HOOD-DH-2XL', '2X-Large - Black', '{"size": "2XL", "color": "Black"}'::jsonb, 10.00, 30),

-- Market Hours Crewneck
('c1111111-1111-1111-1111-111111111141', 'a1111111-1111-1111-1111-111111111114', 'BM-CREW-MH-S', 'Small', '{"size": "S"}'::jsonb, 0, 25),
('c1111111-1111-1111-1111-111111111142', 'a1111111-1111-1111-1111-111111111114', 'BM-CREW-MH-M', 'Medium', '{"size": "M"}'::jsonb, 0, 50),
('c1111111-1111-1111-1111-111111111143', 'a1111111-1111-1111-1111-111111111114', 'BM-CREW-MH-L', 'Large', '{"size": "L"}'::jsonb, 0, 50),
('c1111111-1111-1111-1111-111111111144', 'a1111111-1111-1111-1111-111111111114', 'BM-CREW-MH-XL', 'X-Large', '{"size": "XL"}'::jsonb, 0, 40),

-- Pip Hunter Snapback (One Size)
('c1111111-1111-1111-1111-111111111151', 'a1111111-1111-1111-1111-111111111115', 'BM-CAP-PH-BLK', 'Black', '{"color": "Black"}'::jsonb, 0, 100),
('c1111111-1111-1111-1111-111111111152', 'a1111111-1111-1111-1111-111111111115', 'BM-CAP-PH-NVY', 'Navy', '{"color": "Navy"}'::jsonb, 0, 75),

-- Desk Mat (Single variant)
('c2222222-2222-2222-2222-222222222211', 'a2222222-2222-2222-2222-222222222221', 'BM-MAT-XXL', 'XXL - 900x400mm', '{"size": "XXL"}'::jsonb, 0, 150),

-- Enamel Pin Set
('c2222222-2222-2222-2222-222222222221', 'a2222222-2222-2222-2222-222222222222', 'BM-PIN-BB', 'Bull & Bear Set', '{}'::jsonb, 0, 200),

-- Leather Wallet
('c2222222-2222-2222-2222-222222222231', 'a2222222-2222-2222-2222-222222222223', 'BM-WALLET-BLK', 'Black', '{"color": "Black"}'::jsonb, 0, 75),
('c2222222-2222-2222-2222-222222222232', 'a2222222-2222-2222-2222-222222222223', 'BM-WALLET-BRN', 'Brown', '{"color": "Brown"}'::jsonb, 0, 50),

-- Trading Journal
('c2222222-2222-2222-2222-222222222241', 'a2222222-2222-2222-2222-222222222224', 'BM-JOURNAL-STD', 'Standard', '{}'::jsonb, 0, 120),

-- Sticker Pack
('c2222222-2222-2222-2222-222222222251', 'a2222222-2222-2222-2222-222222222225', 'BM-STICKER-30', '30 Pack', '{}'::jsonb, 0, 300),

-- Watch Band
('c3333333-3333-3333-3333-333333333311', 'a3333333-3333-3333-3333-333333333331', 'BM-BAND-38', '38-41mm (Apple)', '{"size": "38-41mm", "compatibility": "Apple Watch"}'::jsonb, 0, 60),
('c3333333-3333-3333-3333-333333333312', 'a3333333-3333-3333-3333-333333333331', 'BM-BAND-45', '44-49mm (Apple)', '{"size": "44-49mm", "compatibility": "Apple Watch"}'::jsonb, 0, 80),
('c3333333-3333-3333-3333-333333333313', 'a3333333-3333-3333-3333-333333333331', 'BM-BAND-SAM', 'Samsung Galaxy', '{"compatibility": "Samsung Galaxy Watch"}'::jsonb, 0, 50),

-- Monitor Stand
('c3333333-3333-3333-3333-333333333321', 'a3333333-3333-3333-3333-333333333332', 'BM-STAND-DUAL', 'Dual Monitor', '{}'::jsonb, 0, 35),

-- Wireless Charger
('c3333333-3333-3333-3333-333333333331', 'a3333333-3333-3333-3333-333333333333', 'BM-CHRG-15W', '15W Fast Charge', '{}'::jsonb, 0, 100),

-- USB Hub
('c3333333-3333-3333-3333-333333333341', 'a3333333-3333-3333-3333-333333333334', 'BM-HUB-7IN1', '7-in-1 Hub', '{}'::jsonb, 0, 80),

-- LED Ticker
('c4444444-4444-4444-4444-444444444411', 'a4444444-4444-4444-4444-444444444441', 'BM-TICKER-24', '24 Inch', '{}'::jsonb, 0, 25),

-- Neon Sign
('c4444444-4444-4444-4444-444444444421', 'a4444444-4444-4444-4444-444444444442', 'BM-NEON-BULL', 'Trade Like A Bull', '{}'::jsonb, 0, 40),

-- Bull Statue
('c4444444-4444-4444-4444-444444444431', 'a4444444-4444-4444-4444-444444444443', 'BM-STATUE-12', '12 Inch Gold', '{}'::jsonb, 0, 50),

-- Wall Art
('c4444444-4444-4444-4444-444444444441', 'a4444444-4444-4444-4444-444444444444', 'BM-ART-36', '36 Inch', '{}'::jsonb, 0, 30),

-- Tumbler
('c5555555-5555-5555-5555-555555555511', 'a5555555-5555-5555-5555-555555555551', 'BM-TUMBLER-20', '20oz', '{}'::jsonb, 0, 150),

-- Coffee Mug
('c5555555-5555-5555-5555-555555555521', 'a5555555-5555-5555-5555-555555555552', 'BM-MUG-BTD', '15oz', '{}'::jsonb, 0, 200),

-- Water Bottle
('c5555555-5555-5555-5555-555555555531', 'a5555555-5555-5555-5555-555555555553', 'BM-BOTTLE-32', '32oz', '{}'::jsonb, 0, 120),

-- Shot Glass Set
('c5555555-5555-5555-5555-555555555541', 'a5555555-5555-5555-5555-555555555554', 'BM-SHOT-4PK', '4 Pack', '{}'::jsonb, 0, 80),

-- Founders Jacket
('c6666666-6666-6666-6666-666666666611', 'a6666666-6666-6666-6666-666666666661', 'BM-JACKET-S', 'Small', '{"size": "S"}'::jsonb, 0, 15),
('c6666666-6666-6666-6666-666666666612', 'a6666666-6666-6666-6666-666666666661', 'BM-JACKET-M', 'Medium', '{"size": "M"}'::jsonb, 0, 25),
('c6666666-6666-6666-6666-666666666613', 'a6666666-6666-6666-6666-666666666661', 'BM-JACKET-L', 'Large', '{"size": "L"}'::jsonb, 0, 25),
('c6666666-6666-6666-6666-666666666614', 'a6666666-6666-6666-6666-666666666661', 'BM-JACKET-XL', 'X-Large', '{"size": "XL"}'::jsonb, 0, 20),

-- Gold Pendant
('c6666666-6666-6666-6666-666666666621', 'a6666666-6666-6666-6666-666666666662', 'BM-PENDANT-24K', '24K Gold Plated', '{}'::jsonb, 0, 30),

-- Poker Set
('c6666666-6666-6666-6666-666666666631', 'a6666666-6666-6666-6666-666666666663', 'BM-POKER-500', '500 Chip Set', '{}'::jsonb, 0, 20),

-- Anniversary Box
('c6666666-6666-6666-6666-666666666641', 'a6666666-6666-6666-6666-666666666664', 'BM-BOX-2026', '2026 Edition', '{}'::jsonb, 0, 100)

ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  options = EXCLUDED.options,
  price_adjustment = EXCLUDED.price_adjustment,
  inventory_count = EXCLUDED.inventory_count,
  updated_at = NOW();

-- ============================================================================
-- DISCOUNT CODES
-- ============================================================================

INSERT INTO discount_codes (id, code, description, discount_type, discount_value, min_order_amount, max_uses, starts_at, expires_at, is_active) VALUES
('d1111111-1111-1111-1111-111111111111', 'NEWTRADER', 'New trader welcome discount - 15% off', 'PERCENTAGE', 15, 50, 1000, '2026-01-01'::timestamptz, '2026-12-31'::timestamptz, TRUE),
('d2222222-2222-2222-2222-222222222222', 'BULLRUN2026', 'Bull Run 2026 - 20% off $100+', 'PERCENTAGE', 20, 100, 500, '2026-01-01'::timestamptz, '2026-03-31'::timestamptz, TRUE),
('d3333333-3333-3333-3333-333333333333', 'VIP25', 'VIP Member exclusive - 25% off', 'PERCENTAGE', 25, 0, NULL, '2026-01-01'::timestamptz, '2026-12-31'::timestamptz, TRUE),
('d4444444-4444-4444-4444-444444444444', 'FREESHIP', 'Free shipping on orders $75+', 'FIXED', 9.99, 75, NULL, '2026-01-01'::timestamptz, '2026-12-31'::timestamptz, TRUE),
('d5555555-5555-5555-5555-555555555555', 'HODL10', 'Diamond hands discount - $10 off', 'FIXED', 10, 50, 2000, '2026-01-01'::timestamptz, '2026-06-30'::timestamptz, TRUE)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Categories: 6 (Apparel, Accessories, Tech & Gear, Home Office, Drinkware, Limited Edition)
-- Products: 24 trading-themed products
-- Images: 35+ product images (using placehold.co for dummy images)
-- Variants: 50+ size/color variants with inventory
-- Discount Codes: 5 promotional codes
-- ============================================================================
