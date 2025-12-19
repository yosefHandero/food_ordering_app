-- Supabase Database Seeding Script
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- This script seeds the database with realistic mock data for a food ordering app
--
-- Pexels API Key: CFDh0ZZk2DwIaBnFmiXLj9djYNrIyCoHG9Niqj2Tj8JyY8Y4T817OnrT
-- Images are sourced from Pexels (https://www.pexels.com)
-- To fetch new images via API: https://api.pexels.com/v1/search?query={food_name}&per_page=1

-- ============================================
-- STEP 1: Clear existing data (optional)
-- ============================================
-- Uncomment the following lines if you want to clear existing data first
-- DELETE FROM reviews;
-- DELETE FROM order_items;
-- DELETE FROM orders;
-- DELETE FROM addresses;
-- DELETE FROM menu_items;
-- DELETE FROM restaurants;
-- DELETE FROM categories;
-- DELETE FROM users WHERE id NOT IN (SELECT id FROM auth.users);

-- ============================================
-- STEP 2: Seed Categories
-- ============================================

INSERT INTO categories (id, name, description, image_url, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Burgers', 'Juicy burgers made with premium ingredients', 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Pizza', 'Authentic Italian and American style pizzas', 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=400', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Pasta', 'Fresh pasta dishes with rich sauces', 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=400', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Salads', 'Fresh and healthy salad options', 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=400', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Desserts', 'Sweet treats to satisfy your cravings', 'https://images.pexels.com/photos/1028706/pexels-photo-1028706.jpeg?auto=compress&cs=tinysrgb&w=400', NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'Drinks', 'Refreshing beverages and soft drinks', 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=400', NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'Appetizers', 'Perfect starters for your meal', 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'Main Courses', 'Hearty main dishes for every appetite', 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 3: Seed Restaurants
-- ============================================

INSERT INTO restaurants (id, name, description, image_url, cuisine, rating, delivery_time, distance, address, phone, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Bella Italia', 'Authentic Italian cuisine with traditional recipes passed down through generations', 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800', 'Italian', 4.5, '25-35 min', '1.2 km', '123 Main St, New York, NY 10001', '+1-555-0101', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', 'Burger Paradise', 'Gourmet burgers made with premium beef and fresh ingredients', 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=800', 'American', 4.7, '20-30 min', '0.8 km', '456 Oak Ave, New York, NY 10002', '+1-555-0102', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440003', 'Taco Fiesta', 'Fresh Mexican street food with authentic flavors', 'https://images.pexels.com/photos/2087748/pexels-photo-2087748.jpeg?auto=compress&cs=tinysrgb&w=800', 'Mexican', 4.3, '15-25 min', '1.5 km', '789 Park Blvd, New York, NY 10003', '+1-555-0103', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440004', 'Sushi Zen', 'Premium Japanese sushi and sashimi with the freshest fish', 'https://images.pexels.com/photos/1052189/pexels-photo-1052189.jpeg?auto=compress&cs=tinysrgb&w=800', 'Japanese', 4.8, '30-40 min', '2.1 km', '321 Elm St, New York, NY 10004', '+1-555-0104', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440005', 'Mediterranean Delight', 'Healthy Mediterranean dishes with fresh vegetables and olive oil', 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=800', 'Mediterranean', 4.4, '25-35 min', '1.8 km', '654 Maple Dr, New York, NY 10005', '+1-555-0105', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440006', 'Curry House', 'Authentic Indian curries with aromatic spices', 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800', 'Indian', 4.6, '30-40 min', '2.3 km', '987 Cedar Ln, New York, NY 10006', '+1-555-0106', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440007', 'Ramen Express', 'Hot and flavorful ramen bowls with rich broths', 'https://images.pexels.com/photos/1907228/pexels-photo-1907228.jpeg?auto=compress&cs=tinysrgb&w=800', 'Japanese', 4.5, '20-30 min', '1.0 km', '147 Pine Rd, New York, NY 10007', '+1-555-0107', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440008', 'Thai Garden', 'Spicy and aromatic Thai cuisine with fresh herbs', 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800', 'Thai', 4.7, '25-35 min', '1.6 km', '258 First St, New York, NY 10008', '+1-555-0108', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440009', 'Paris Bistro', 'Classic French bistro fare with elegant presentation', 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800', 'French', 4.6, '30-40 min', '2.5 km', '369 Second Ave, New York, NY 10009', '+1-555-0109', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440010', 'Smokehouse BBQ', 'Slow-smoked meats and classic barbecue sides', 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800', 'BBQ', 4.8, '35-45 min', '2.8 km', '741 Third St, New York, NY 10010', '+1-555-0110', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440011', 'Ocean Fresh', 'Fresh seafood and fish dishes prepared daily', 'https://images.pexels.com/photos/1052189/pexels-photo-1052189.jpeg?auto=compress&cs=tinysrgb&w=800', 'Seafood', 4.5, '25-35 min', '1.9 km', '852 Fourth Ave, New York, NY 10011', '+1-555-0111', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440012', 'Green Leaf Cafe', 'Plant-based dishes with organic ingredients', 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=800', 'Vegetarian', 4.4, '20-30 min', '1.3 km', '963 Fifth Ave, New York, NY 10012', '+1-555-0112', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 4: Seed Menu Items
-- ============================================

-- Bella Italia (Italian) - Pizza, Pasta, Salads, Appetizers
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image_url, calories, protein, rating, type, created_at, updated_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Margherita Pizza', 'Classic pizza with fresh mozzarella, tomato sauce, and basil', 14.99, 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=400', 850, 35.0, 4.5, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Pepperoni Pizza', 'Traditional pepperoni pizza with mozzarella cheese', 16.99, 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=400', 920, 38.0, 4.7, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Spaghetti Carbonara', 'Creamy pasta with bacon, eggs, and parmesan cheese', 18.99, 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=400', 780, 28.0, 4.6, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Fettuccine Alfredo', 'Rich and creamy fettuccine with parmesan sauce', 17.99, 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=400', 820, 25.0, 4.4, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'Caesar Salad', 'Fresh romaine lettuce with caesar dressing and croutons', 12.99, 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=400', 320, 15.0, 4.3, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', 'Mozzarella Sticks', 'Breaded mozzarella with marinara sauce', 8.99, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', 450, 20.0, 4.5, 'food', NOW(), NOW()),

-- Burger Paradise (American) - Burgers, Appetizers, Drinks
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Classic Burger', 'Juicy beef patty with lettuce, tomato, and special sauce', 12.99, 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400', 680, 35.0, 4.6, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Cheese Burger', 'Classic burger with melted cheddar cheese', 13.99, 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400', 720, 38.0, 4.7, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Bacon Burger', 'Beef patty with crispy bacon and BBQ sauce', 15.99, 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400', 850, 42.0, 4.8, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007', 'Onion Rings', 'Crispy golden onion rings with dipping sauce', 6.99, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', 380, 8.0, 4.4, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 'Coca Cola', 'Refreshing cola drink', 2.99, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=400', 140, 0.0, 4.0, 'drink', NOW(), NOW()),

-- Taco Fiesta (Mexican) - Main Courses, Appetizers
('770e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 'Beef Tacos', 'Three soft shell tacos with seasoned beef, lettuce, and cheese', 11.99, 'https://images.pexels.com/photos/2087748/pexels-photo-2087748.jpeg?auto=compress&cs=tinysrgb&w=400', 520, 28.0, 4.5, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 'Chicken Burrito', 'Large burrito with grilled chicken, rice, beans, and salsa', 13.99, 'https://images.pexels.com/photos/2087748/pexels-photo-2087748.jpeg?auto=compress&cs=tinysrgb&w=400', 650, 35.0, 4.6, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440007', 'Nachos', 'Tortilla chips with cheese, jalapeños, and sour cream', 9.99, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', 580, 18.0, 4.4, 'food', NOW(), NOW()),

-- Sushi Zen (Japanese) - Main Courses, Appetizers
('770e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440008', 'Salmon Sashimi', 'Fresh salmon sashimi (8 pieces)', 18.99, 'https://images.pexels.com/photos/1052189/pexels-photo-1052189.jpeg?auto=compress&cs=tinysrgb&w=400', 240, 40.0, 4.8, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440008', 'Dragon Roll', 'Eel, cucumber, and avocado topped with eel sauce', 16.99, 'https://images.pexels.com/photos/1052189/pexels-photo-1052189.jpeg?auto=compress&cs=tinysrgb&w=400', 420, 22.0, 4.7, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440007', 'Edamame', 'Steamed soybeans with sea salt', 5.99, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', 120, 12.0, 4.3, 'food', NOW(), NOW()),

-- Mediterranean Delight - Salads, Main Courses
('770e8400-e29b-41d4-a716-446655440018', '660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'Greek Salad', 'Fresh vegetables with feta cheese, olives, and olive oil', 13.99, 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=400', 280, 12.0, 4.5, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440019', '660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440008', 'Grilled Chicken', 'Marinated grilled chicken with vegetables and rice', 19.99, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', 520, 45.0, 4.6, 'food', NOW(), NOW()),

-- Curry House (Indian) - Main Courses
('770e8400-e29b-41d4-a716-446655440020', '660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440008', 'Chicken Tikka Masala', 'Creamy tomato curry with tender chicken pieces', 17.99, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', 580, 38.0, 4.7, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440021', '660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440008', 'Vegetable Curry', 'Mixed vegetables in aromatic curry sauce', 14.99, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', 320, 12.0, 4.4, 'food', NOW(), NOW()),

-- Ramen Express - Main Courses
('770e8400-e29b-41d4-a716-446655440022', '660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440008', 'Tonkotsu Ramen', 'Rich pork bone broth with chashu and soft-boiled egg', 15.99, 'https://images.pexels.com/photos/1907228/pexels-photo-1907228.jpeg?auto=compress&cs=tinysrgb&w=400', 680, 32.0, 4.8, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440023', '660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440008', 'Miso Ramen', 'Savory miso broth with vegetables and tofu', 14.99, 'https://images.pexels.com/photos/1907228/pexels-photo-1907228.jpeg?auto=compress&cs=tinysrgb&w=400', 520, 18.0, 4.6, 'food', NOW(), NOW()),

-- Thai Garden - Main Courses
('770e8400-e29b-41d4-a716-446655440024', '660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 'Pad Thai', 'Stir-fried rice noodles with shrimp, tofu, and peanuts', 16.99, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', 580, 28.0, 4.7, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440025', '660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 'Green Curry', 'Spicy green curry with chicken and vegetables', 17.99, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', 520, 30.0, 4.6, 'food', NOW(), NOW()),

-- Paris Bistro (French) - Main Courses, Desserts
('770e8400-e29b-41d4-a716-446655440026', '660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440008', 'Coq au Vin', 'Classic French chicken braised in wine', 24.99, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', 620, 42.0, 4.7, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440027', '660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440005', 'Crème Brûlée', 'Classic French dessert with caramelized sugar', 8.99, 'https://images.pexels.com/photos/1028706/pexels-photo-1028706.jpeg?auto=compress&cs=tinysrgb&w=400', 320, 6.0, 4.8, 'food', NOW(), NOW()),

-- Smokehouse BBQ - Main Courses
('770e8400-e29b-41d4-a716-446655440028', '660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440008', 'BBQ Ribs', 'Slow-smoked pork ribs with BBQ sauce', 22.99, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', 850, 48.0, 4.8, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440029', '660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440008', 'Pulled Pork Sandwich', 'Tender pulled pork with coleslaw on brioche bun', 15.99, 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400', 680, 35.0, 4.7, 'food', NOW(), NOW()),

-- Ocean Fresh - Main Courses
('770e8400-e29b-41d4-a716-446655440030', '660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440008', 'Grilled Salmon', 'Fresh Atlantic salmon with lemon and herbs', 23.99, 'https://images.pexels.com/photos/1052189/pexels-photo-1052189.jpeg?auto=compress&cs=tinysrgb&w=400', 420, 38.0, 4.7, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440031', '660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440008', 'Fish & Chips', 'Beer-battered cod with crispy fries', 16.99, 'https://images.pexels.com/photos/1052189/pexels-photo-1052189.jpeg?auto=compress&cs=tinysrgb&w=400', 720, 32.0, 4.6, 'food', NOW(), NOW()),

-- Green Leaf Cafe - Salads, Main Courses
('770e8400-e29b-41d4-a716-446655440032', '660e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440004', 'Quinoa Salad', 'Nutritious quinoa with vegetables and tahini dressing', 13.99, 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=400', 380, 14.0, 4.5, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440033', '660e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440008', 'Veggie Burger', 'Plant-based burger with avocado and special sauce', 14.99, 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400', 420, 18.0, 4.4, 'food', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 5: Seed Additional Menu Items for More Variety
-- ============================================

-- Add more items to each restaurant
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image_url, calories, protein, rating, type, created_at, updated_at) VALUES
-- More Burgers
('770e8400-e29b-41d4-a716-446655440034', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Veggie Burger', 'Plant-based patty with fresh vegetables', 13.99, 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400', 420, 15.0, 4.3, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440035', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Double Deluxe Burger', 'Two beef patties with double cheese', 18.99, 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400', 1200, 65.0, 4.8, 'food', NOW(), NOW()),

-- More Pizza
('770e8400-e29b-41d4-a716-446655440036', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Hawaiian Pizza', 'Ham, pineapple, and mozzarella', 16.99, 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=400', 880, 32.0, 4.4, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440037', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Meat Lovers Pizza', 'Pepperoni, sausage, ham, and bacon', 19.99, 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=400', 1100, 48.0, 4.7, 'food', NOW(), NOW()),

-- More Pasta
('770e8400-e29b-41d4-a716-446655440038', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Lasagna', 'Layered pasta with meat sauce and cheese', 19.99, 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=400', 850, 38.0, 4.6, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440039', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Penne Arrabbiata', 'Spicy tomato sauce with penne pasta', 16.99, 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=400', 680, 22.0, 4.5, 'food', NOW(), NOW()),

-- More Salads
('770e8400-e29b-41d4-a716-446655440040', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'Caprese Salad', 'Fresh mozzarella, tomatoes, and basil', 13.99, 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=400', 280, 18.0, 4.4, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440041', '660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'Cobb Salad', 'Mixed greens with chicken, bacon, and eggs', 15.99, 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=400', 520, 35.0, 4.6, 'food', NOW(), NOW()),

-- Desserts
('770e8400-e29b-41d4-a716-446655440042', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 9.99, 'https://images.pexels.com/photos/1028706/pexels-photo-1028706.jpeg?auto=compress&cs=tinysrgb&w=400', 380, 8.0, 4.7, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440043', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'Chocolate Cake', 'Rich chocolate cake with frosting', 7.99, 'https://images.pexels.com/photos/1028706/pexels-photo-1028706.jpeg?auto=compress&cs=tinysrgb&w=400', 520, 6.0, 4.6, 'food', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440044', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'Ice Cream', 'Vanilla, chocolate, or strawberry', 5.99, 'https://images.pexels.com/photos/1028706/pexels-photo-1028706.jpeg?auto=compress&cs=tinysrgb&w=400', 240, 4.0, 4.5, 'food', NOW(), NOW()),

-- More Drinks
('770e8400-e29b-41d4-a716-446655440045', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 'Orange Juice', 'Fresh squeezed orange juice', 3.99, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=400', 110, 2.0, 4.3, 'drink', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440046', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 'Lemonade', 'Fresh lemonade with mint', 3.49, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=400', 120, 0.0, 4.4, 'drink', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440047', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 'Iced Tea', 'Refreshing iced tea', 2.99, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=400', 80, 0.0, 4.2, 'drink', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Verification Query (optional)
-- ============================================
-- Run this to verify the data was inserted:
-- SELECT 
--   (SELECT COUNT(*) FROM categories) as categories_count,
--   (SELECT COUNT(*) FROM restaurants) as restaurants_count,
--   (SELECT COUNT(*) FROM menu_items) as menu_items_count;


-- ============================================================
-- Supabase Database Seeding Script (FULL, FIXED)
-- ============================================================
-- Safe to run in Supabase Dashboard → SQL Editor

-- ============================================================
-- STEP 0: Extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- STEP 1: Schema upgrades (non-destructive)
-- ============================================================

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS latitude  double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS geo geography(Point, 4326);

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS carbs numeric,
  ADD COLUMN IF NOT EXISTS fat numeric,
  ADD COLUMN IF NOT EXISTS fiber numeric,
  ADD COLUMN IF NOT EXISTS sugar numeric,
  ADD COLUMN IF NOT EXISTS sodium_mg numeric,
  ADD COLUMN IF NOT EXISTS health_score integer,
  ADD COLUMN IF NOT EXISTS meal_tags text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_restaurants_geo ON restaurants USING GIST (geo);
CREATE INDEX IF NOT EXISTS idx_menu_items_health_score ON menu_items (health_score);
CREATE INDEX IF NOT EXISTS idx_menu_items_price ON menu_items (price);

-- ============================================================
-- STEP 2: Categories
-- ============================================================

INSERT INTO categories (id, name, description, image_url, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Burgers', 'Juicy burgers', 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Pizza', 'Italian & American pizzas', 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=400', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Pasta', 'Fresh pasta dishes', 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=400', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Salads', 'Healthy salads', 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=400', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Desserts', 'Sweet treats', 'https://images.pexels.com/photos/1028706/pexels-photo-1028706.jpeg?auto=compress&cs=tinysrgb&w=400', NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'Drinks', 'Beverages', 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=400', NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'Appetizers', 'Starters', 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'Main Courses', 'Main dishes', 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 3: Restaurants
-- ============================================================

INSERT INTO restaurants (id, name, description, image_url, cuisine, rating, delivery_time, distance, address, phone, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Bella Italia', 'Authentic Italian cuisine', 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800', 'Italian', 4.5, '25-35 min', '1.2 km', '123 Main St, NY', '+1-555-0101', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', 'Burger Paradise', 'Gourmet burgers', 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=800', 'American', 4.7, '20-30 min', '0.8 km', '456 Oak Ave, NY', '+1-555-0102', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440004', 'Sushi Zen', 'Premium sushi', 'https://images.pexels.com/photos/1052189/pexels-photo-1052189.jpeg?auto=compress&cs=tinysrgb&w=800', 'Japanese', 4.8, '30-40 min', '2.1 km', '321 Elm St, NY', '+1-555-0104', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440005', 'Mediterranean Delight', 'Healthy Mediterranean dishes', 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=800', 'Mediterranean', 4.4, '25-35 min', '1.8 km', '654 Maple Dr, NY', '+1-555-0105', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440012', 'Green Leaf Cafe', 'Plant-based meals', 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=800', 'Vegetarian', 4.4, '20-30 min', '1.3 km', '963 Fifth Ave, NY', '+1-555-0112', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 4: Menu Items (subset, clean)
-- ============================================================

INSERT INTO menu_items
(id, restaurant_id, category_id, name, description, price, image_url, calories, protein, rating, type, created_at, updated_at)
VALUES
('770e8400-e29b-41d4-a716-446655440001','660e8400-e29b-41d4-a716-446655440001','550e8400-e29b-41d4-a716-446655440002','Margherita Pizza','Classic pizza',14.99,'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=400',850,35,4.5,'food',NOW(),NOW()),
('770e8400-e29b-41d4-a716-446655440007','660e8400-e29b-41d4-a716-446655440002','550e8400-e29b-41d4-a716-446655440001','Classic Burger','Beef burger',12.99,'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400',680,35,4.6,'food',NOW(),NOW()),
('770e8400-e29b-41d4-a716-446655440015','660e8400-e29b-41d4-a716-446655440004','550e8400-e29b-41d4-a716-446655440008','Salmon Sashimi','Fresh salmon',18.99,'https://images.pexels.com/photos/1052189/pexels-photo-1052189.jpeg?auto=compress&cs=tinysrgb&w=400',240,40,4.8,'food',NOW(),NOW()),
('770e8400-e29b-41d4-a716-446655440018','660e8400-e29b-41d4-a716-446655440005','550e8400-e29b-41d4-a716-446655440004','Greek Salad','Feta & veggies',13.99,'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=400',280,12,4.5,'food',NOW(),NOW()),
('770e8400-e29b-41d4-a716-446655440032','660e8400-e29b-41d4-a716-446655440012','550e8400-e29b-41d4-a716-446655440004','Quinoa Salad','Quinoa & vegetables',13.99,'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=400',380,14,4.5,'food',NOW(),NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 5: Restaurant coordinates (UUID FIXED)
-- ============================================================

UPDATE restaurants
SET latitude = v.lat,
    longitude = v.lng
FROM (
  VALUES
    ('660e8400-e29b-41d4-a716-446655440001'::uuid, 40.7505, -73.9934),
    ('660e8400-e29b-41d4-a716-446655440002'::uuid, 40.7218, -73.9876),
    ('660e8400-e29b-41d4-a716-446655440004'::uuid, 40.7430, -73.9822),
    ('660e8400-e29b-41d4-a716-446655440005'::uuid, 40.7411, -73.9897),
    ('660e8400-e29b-41d4-a716-446655440012'::uuid, 40.7295, -73.9973)
) AS v(id, lat, lng)
WHERE restaurants.id = v.id;

UPDATE restaurants
SET geo = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================
-- STEP 6: Nutrition + meal tagging
-- ============================================================

UPDATE menu_items
SET
  carbs = CASE WHEN name ILIKE '%salad%' THEN 25 WHEN name ILIKE '%sashimi%' THEN 2 ELSE 55 END,
  fat = CASE WHEN name ILIKE '%salad%' THEN 12 WHEN name ILIKE '%sashimi%' THEN 8 ELSE 30 END,
  fiber = CASE WHEN name ILIKE '%salad%' THEN 8 ELSE 3 END,
  sugar = 6,
  sodium_mg = CASE WHEN name ILIKE '%salad%' THEN 600 ELSE 1100 END;

UPDATE menu_items
SET meal_tags =
  CASE
    WHEN name ILIKE '%salad%' THEN ARRAY['lunch','dinner']
    WHEN name ILIKE '%sashimi%' THEN ARRAY['lunch','dinner']
    ELSE ARRAY['lunch','dinner']
  END;

UPDATE menu_items
SET health_score =
  GREATEST(0, LEAST(100,
    (protein * 1.2)
    + ((700 - calories) * 0.04)
    + (fiber * 2.5)
    - (sodium_mg * 0.02)
    - (sugar * 0.9)
  ))::int;

-- ============================================================
-- Verification
-- ============================================================
-- SELECT name, health_score FROM menu_items ORDER BY health_score DESC;
