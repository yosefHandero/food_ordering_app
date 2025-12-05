# Supabase Migration Guide

## Overview
This app has been migrated from Appwrite to Supabase. Follow these steps to complete the setup.

## Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

## Step 2: Set Up Supabase Project

1. Go to https://app.supabase.com
2. Create a new project (or use existing)
3. Wait for project to finish provisioning

## Step 3: Create Database Tables

Run the SQL script in Supabase SQL Editor (Dashboard → SQL Editor):

```sql
-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  cuisine TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  delivery_time TEXT,
  distance TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  calories INTEGER,
  protein DECIMAL(5,2),
  rating DECIMAL(3,2) DEFAULT 0,
  type TEXT DEFAULT 'food',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id),
  total DECIMAL(10,2) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 5.00,
  status TEXT DEFAULT 'pending', -- pending, confirmed, preparing, out_for_delivery, delivered, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  customizations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Restaurants are public
CREATE POLICY "Restaurants are viewable by everyone" ON restaurants
  FOR SELECT USING (true);

-- Menu items are public
CREATE POLICY "Menu items are viewable by everyone" ON menu_items
  FOR SELECT USING (true);

-- Categories are public
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Users can only see their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see their own order items
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Users can only manage their own addresses
CREATE POLICY "Users can manage own addresses" ON addresses
  FOR ALL USING (auth.uid() = user_id);

-- Reviews are public to read, users can create their own
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Step 4: Set Up Storage Bucket

1. Go to Storage in Supabase dashboard
2. Create a new bucket named `food-images`
3. Set it to public (or configure proper policies)
4. Upload your food images here

## Step 5: Environment Variables

Create `.env.local` file with:

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET=food-images
```

See `ENV_VARIABLES.md` for detailed instructions.

## Step 6: Update Code References

All Appwrite references have been replaced with Supabase. The main changes:

- `lib/appwrite.ts` → `lib/supabase.ts` + `lib/supabase-auth.ts` + `lib/supabase-data.ts`
- `useAppwrite` → `useSupabase`
- Authentication methods updated
- Data fetching methods updated

## Step 7: Test the Migration

1. Start the app: `expo start`
2. Test sign up/sign in
3. Test fetching menu items
4. Test creating orders

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists and has correct values
- Restart Expo with `expo start --clear`

### "Row Level Security policy violation"
- Check that RLS policies are created correctly
- Verify user is authenticated for protected operations

### "Table does not exist"
- Run the SQL schema script in Supabase SQL Editor
- Check table names match in `lib/supabase.ts`

## Next Steps

1. Seed your database with sample restaurants and menu items
2. Configure image storage URLs
3. Set up real-time subscriptions for order tracking
4. Add push notifications for order updates

