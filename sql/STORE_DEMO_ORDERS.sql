-- =============================================
-- DEMO ORDERS FOR MRBULLMONEY@GMAIL.COM
-- Run this in Supabase SQL Editor
-- =============================================

-- Delete any existing demo orders for this email (optional, for clean seeding)
DELETE FROM public.store_orders WHERE email = 'mrbullmoney@gmail.com' AND order_number LIKE 'DEMO-%';

-- Insert demo orders
INSERT INTO public.store_orders (
  order_number,
  email,
  customer_name,
  items,
  subtotal,
  shipping_cost,
  tax_amount,
  total_amount,
  status,
  payment_status,
  fulfillment_status,
  tracking_number,
  carrier,
  shipped_at,
  delivered_at,
  shipping_address,
  created_at
) VALUES 
-- Order 1: Shipped via FedEx (2 days ago)
(
  'DEMO-001-A7B3C9D2',
  'mrbullmoney@gmail.com',
  'Mr Bull Money',
  '[
    {"name": "Bull Money Premium Hoodie", "quantity": 1, "price": 69.99, "image": "/store/hoodie.jpg"},
    {"name": "Trading Sticker Pack", "quantity": 1, "price": 20.00, "image": "/store/stickers.jpg"}
  ]'::JSONB,
  89.99,
  0.00,
  0.00,
  89.99,
  'shipped',
  'paid',
  'partial',
  '794644790000',
  'fedex',
  NOW() - INTERVAL '1 day',
  NULL,
  '{"name": "Mr Bull Money", "line1": "123 Trading Ave", "city": "New York", "state": "NY", "postal_code": "10001", "country": "US"}'::JSONB,
  NOW() - INTERVAL '2 days'
),

-- Order 2: Delivered via The Courier Guy (7 days ago)
(
  'DEMO-002-E4F5G6H7',
  'mrbullmoney@gmail.com',
  'Mr Bull Money',
  '[
    {"name": "Trader Desk Setup Kit", "quantity": 1, "price": 129.99, "image": "/store/desk-kit.jpg"},
    {"name": "Bull Money Cap", "quantity": 1, "price": 20.00, "image": "/store/cap.jpg"}
  ]'::JSONB,
  149.99,
  0.00,
  0.00,
  149.99,
  'delivered',
  'paid',
  'fulfilled',
  'TCG1234567890',
  'courier_guy',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '3 days',
  '{"name": "Mr Bull Money", "line1": "45 Sandton Drive", "city": "Johannesburg", "state": "Gauteng", "postal_code": "2196", "country": "ZA"}'::JSONB,
  NOW() - INTERVAL '7 days'
),

-- Order 3: Delivered via SA Post Office (14 days ago)
(
  'DEMO-003-I8J9K0L1',
  'mrbullmoney@gmail.com',
  'Mr Bull Money',
  '[
    {"name": "Trading Journal Notebook", "quantity": 2, "price": 15.00, "image": "/store/journal.jpg"},
    {"name": "Chart Analysis Poster", "quantity": 1, "price": 15.00, "image": "/store/poster.jpg"}
  ]'::JSONB,
  45.00,
  0.00,
  0.00,
  45.00,
  'delivered',
  'paid',
  'fulfilled',
  'RR123456789ZA',
  'sapo',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '10 days',
  '{"name": "Mr Bull Money", "line1": "789 Long Street", "city": "Cape Town", "state": "Western Cape", "postal_code": "8001", "country": "ZA"}'::JSONB,
  NOW() - INTERVAL '14 days'
)
ON CONFLICT (order_number) DO UPDATE SET
  status = EXCLUDED.status,
  tracking_number = EXCLUDED.tracking_number,
  shipped_at = EXCLUDED.shipped_at,
  delivered_at = EXCLUDED.delivered_at;

-- Verify the orders were inserted
SELECT order_number, email, status, total_amount, created_at 
FROM public.store_orders 
WHERE email = 'mrbullmoney@gmail.com'
ORDER BY created_at DESC;
