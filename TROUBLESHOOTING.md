# Troubleshooting: Tables Not Created

## Issue: "Success. No rows returned" when verifying tables

This means the SQL script didn't create the tables. Here's how to fix it:

## Step-by-Step Fix

### 1. Check for Errors in SQL Editor

When you ran the script, did you see:

- ✅ **"Success. No rows returned"** - This is OK for CREATE TABLE statements
- ❌ **Any red error messages?** - This means something failed

### 2. Run the Script in Parts

If the full script didn't work, try running it in smaller chunks:

#### Part 1: Create Tables Only

Run just the table creation section (lines 1-100 of setup-database.sql):

```sql
-- Users table
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

-- Menu items table (CRITICAL - this is what's missing!)
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
  status TEXT DEFAULT 'pending',
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
```

#### Part 2: Enable RLS

After tables are created, run:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
```

#### Part 3: Create Policies

Finally, run the policy creation section from setup-database.sql.

### 3. Verify Tables Were Created

After running Part 1, run this query:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'restaurants', 'menu_items', 'categories', 'orders', 'order_items', 'addresses', 'reviews')
ORDER BY table_name;
```

**Expected Result:** You should see 8 rows with all table names.

**If you still see "No rows returned":**

- Check that you're in the correct Supabase project
- Make sure you clicked "Run" after pasting the SQL
- Check the "History" tab in SQL Editor for any error messages

### 4. Alternative: Use Table Editor

If SQL isn't working, you can create tables manually:

1. Go to **Table Editor** in Supabase dashboard
2. Click **New Table**
3. Create `menu_items` table with these columns:
   - `id` (uuid, primary key, default: gen_random_uuid())
   - `restaurant_id` (uuid, foreign key to restaurants)
   - `category_id` (uuid, foreign key to categories)
   - `name` (text, not null)
   - `description` (text)
   - `price` (numeric, not null)
   - `image_url` (text)
   - `calories` (integer)
   - `protein` (numeric)
   - `rating` (numeric)
   - `type` (text, default: 'food')
   - `created_at` (timestamptz, default: now())
   - `updated_at` (timestamptz, default: now())

### 5. Check Project Status

Make sure your Supabase project is:

- ✅ **Active** (not paused)
- ✅ **Fully provisioned** (check project settings)
- ✅ **Using the correct database** (not a read replica)

## Quick Test Query

Once tables are created, test with:

```sql
SELECT COUNT(*) FROM menu_items;
```

This should return `0` (empty table) not an error.

## Still Having Issues?

1. **Check Supabase Logs:**

   - Go to Logs → API Logs in Supabase dashboard
   - Look for any 404 or permission errors

2. **Verify Environment Variables:**

   - Make sure `.env.local` has correct `EXPO_PUBLIC_SUPABASE_URL`
   - URL should match your project URL exactly

3. **Check API Settings:**

   - Go to Settings → API in Supabase
   - Verify your project URL and anon key

4. **Try a Simple Query:**
   ```sql
   SELECT * FROM menu_items LIMIT 1;
   ```
   - If this works, tables exist but might be empty
   - If this fails, tables don't exist
