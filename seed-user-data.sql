-- Supabase Database Seeding Script - User-Dependent Data
-- Run this AFTER users have been created through the app's sign-up flow
-- This script seeds addresses, orders, order_items, and reviews
-- 
-- NOTE: This script uses sample user IDs. Replace these with actual user IDs
-- from your auth.users table, or modify the script to use existing users.

-- ============================================
-- STEP 1: Get Sample User IDs
-- ============================================
-- First, get some user IDs from your auth.users table:
-- SELECT id, email FROM auth.users LIMIT 5;
-- 
-- Then replace the user IDs in the INSERT statements below with actual IDs,
-- or uncomment the following to use the first 5 users from auth.users:

-- ============================================
-- STEP 2: Seed Addresses (Optional)
-- ============================================
-- Uncomment and modify the following to seed addresses for existing users:

/*
-- Example: Seed addresses for the first user
DO $$
DECLARE
    sample_user_id UUID;
BEGIN
    -- Get the first user from auth.users
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        INSERT INTO addresses (id, user_id, address, city, postal_code, is_default, created_at) VALUES
        (gen_random_uuid(), sample_user_id, '123 Main St', 'New York', '10001', true, NOW()),
        (gen_random_uuid(), sample_user_id, '456 Oak Ave', 'New York', '10002', false, NOW())
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
*/

-- ============================================
-- STEP 3: Seed Orders (Optional)
-- ============================================
-- Orders require:
-- 1. A user_id from auth.users
-- 2. A restaurant_id from restaurants table
-- 3. A delivery_address (TEXT field)

/*
DO $$
DECLARE
    sample_user_id UUID;
    sample_restaurant_id UUID;
    sample_address TEXT;
BEGIN
    -- Get the first user
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    -- Get the first restaurant
    SELECT id INTO sample_restaurant_id FROM restaurants LIMIT 1;
    -- Set a sample address
    sample_address := '123 Main St, New York, NY 10001';
    
    IF sample_user_id IS NOT NULL AND sample_restaurant_id IS NOT NULL THEN
        INSERT INTO orders (id, user_id, restaurant_id, total, delivery_address, delivery_fee, status, created_at, updated_at) VALUES
        (gen_random_uuid(), sample_user_id, sample_restaurant_id, 25.98, sample_address, 5.00, 'delivered', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
        (gen_random_uuid(), sample_user_id, sample_restaurant_id, 32.97, sample_address, 5.00, 'preparing', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
        (gen_random_uuid(), sample_user_id, sample_restaurant_id, 18.99, sample_address, 5.00, 'pending', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
*/

-- ============================================
-- STEP 4: Seed Order Items (Optional)
-- ============================================
-- Order items require:
-- 1. An order_id from orders table
-- 2. A menu_item_id from menu_items table

/*
DO $$
DECLARE
    sample_order_id UUID;
    sample_menu_item_id UUID;
BEGIN
    -- Get the first order
    SELECT id INTO sample_order_id FROM orders LIMIT 1;
    -- Get the first menu item
    SELECT id INTO sample_menu_item_id FROM menu_items LIMIT 1;
    
    IF sample_order_id IS NOT NULL AND sample_menu_item_id IS NOT NULL THEN
        INSERT INTO order_items (id, order_id, menu_item_id, quantity, price, customizations, created_at) VALUES
        (gen_random_uuid(), sample_order_id, sample_menu_item_id, 2, 14.99, '[]'::jsonb, NOW()),
        (gen_random_uuid(), sample_order_id, sample_menu_item_id, 1, 8.99, '[{"name": "Extra cheese", "price": 1.5}]'::jsonb, NOW())
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
*/

-- ============================================
-- STEP 5: Seed Reviews (Optional)
-- ============================================
-- Reviews require:
-- 1. A user_id from auth.users
-- 2. A restaurant_id from restaurants table
-- 3. A menu_item_id from menu_items table (optional, can be NULL)

/*
DO $$
DECLARE
    sample_user_id UUID;
    sample_restaurant_id UUID;
    sample_menu_item_id UUID;
BEGIN
    -- Get the first user
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    -- Get the first restaurant
    SELECT id INTO sample_restaurant_id FROM restaurants LIMIT 1;
    -- Get the first menu item
    SELECT id INTO sample_menu_item_id FROM menu_items LIMIT 1;
    
    IF sample_user_id IS NOT NULL AND sample_restaurant_id IS NOT NULL THEN
        INSERT INTO reviews (id, user_id, restaurant_id, menu_item_id, rating, comment, created_at) VALUES
        (gen_random_uuid(), sample_user_id, sample_restaurant_id, sample_menu_item_id, 5, 'Great food, highly recommend!', NOW() - INTERVAL '3 days'),
        (gen_random_uuid(), sample_user_id, sample_restaurant_id, sample_menu_item_id, 4, 'Delicious and fresh ingredients.', NOW() - INTERVAL '1 day'),
        (gen_random_uuid(), sample_user_id, sample_restaurant_id, NULL, 5, 'Amazing restaurant, will order again!', NOW() - INTERVAL '5 days')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
*/

-- ============================================
-- Quick Verification
-- ============================================
-- Run this to see what data exists:
-- SELECT 
--   (SELECT COUNT(*) FROM addresses) as addresses_count,
--   (SELECT COUNT(*) FROM orders) as orders_count,
--   (SELECT COUNT(*) FROM order_items) as order_items_count,
--   (SELECT COUNT(*) FROM reviews) as reviews_count;


