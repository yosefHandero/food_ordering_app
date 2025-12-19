# Database Seeding Guide

## Overview

This guide explains how to seed your Supabase database with realistic mock data for the food ordering app.

There are two methods available:

1. **SQL Scripts** (Recommended - Easiest) - Run directly in Supabase SQL Editor
2. **TypeScript Script** - Requires environment variables and npm

## Method 1: SQL Scripts (Recommended)

### Prerequisites

1. **Supabase Project Setup**: Ensure your Supabase project is created and the database schema is set up (run `setup-database.sql` in Supabase SQL Editor).

### Quick Start

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open and run `seed-data.sql` - This seeds:

   - **8 categories** (Burgers, Pizza, Pasta, Salads, Desserts, Drinks, Appetizers, Main Courses)
   - **12 restaurants** (Various cuisines: Italian, American, Mexican, Japanese, etc.)
   - **47+ menu items** (Items across all restaurants and categories)

4. (Optional) After users are created through your app, you can run `seed-user-data.sql` to seed:
   - Addresses
   - Orders
   - Order items
   - Reviews

### What Gets Seeded

The `seed-data.sql` script creates:

- **8 categories** - Food categories with descriptions and images
- **12 restaurants** - Various cuisines with ratings, delivery times, and addresses
- **47+ menu items** - Diverse menu items across all restaurants and categories

All data uses consistent UUIDs, so you can safely run the script multiple times (it uses `ON CONFLICT DO NOTHING`).

## Method 2: TypeScript Script

### Prerequisites

1. **Supabase Project Setup**: Ensure your Supabase project is created and the database schema is set up (run `setup-database.sql` in Supabase SQL Editor).

2. **Environment Variables**: Add the following to your `.env.local` file:

```env
# Supabase URL (can use EXPO_PUBLIC_SUPABASE_URL if already set)
SUPABASE_URL=your-project-url
# OR use existing:
# EXPO_PUBLIC_SUPABASE_URL=your-project-url

# Service Role Key (required for seeding - bypasses RLS)
# Get this from: Supabase Dashboard → Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important**: The service role key has admin privileges and bypasses Row Level Security (RLS). Keep it secret and never commit it to version control.

## Installation

Install the required dependencies:

```bash
npm install
```

This will install `ts-node` and `dotenv` as dev dependencies.

### Running the TypeScript Seeding Script

```bash
npm run seed:db
```

The script will:

- Connect to Supabase using the service role key
- Insert data in the correct order (respecting foreign key constraints)
- Use upsert operations (safe to run multiple times)
- Generate realistic mock data

### TypeScript Script Seeded Data

The TypeScript script generates:

- **10 users** - Realistic user profiles with names and emails
- **~20-30 addresses** - 1-3 addresses per user
- **8 categories** - Food categories (Burgers, Pizza, Pasta, Salads, Desserts, Drinks, Appetizers, Main Courses)
- **12 restaurants** - Various cuisines with ratings, delivery times, and addresses
- **~150 menu items** - 10-15 items per restaurant across different categories
- **30 orders** - Orders with various statuses (pending, confirmed, preparing, delivered, etc.)
- **~60-120 order items** - 1-4 items per order
- **~50 reviews** - Reviews for menu items

## Schema Notes

### Important Discrepancies

The seeding script matches the **actual database schema** in `setup-database.sql`, which differs slightly from the original requirements:

1. **Addresses Table**:

   - Schema uses: `address` (TEXT) field
   - Requirements mentioned: `street` and `label` fields
   - **Current implementation**: Uses `address` field as per actual schema

2. **Orders Table**:
   - Schema uses: `delivery_address` (TEXT) field
   - Requirements mentioned: `delivery_address_id` (UUID) field
   - **Current implementation**: Uses `delivery_address` (TEXT) as per actual schema

If you need to update the schema to match the original requirements, you'll need to:

1. Update the database schema in Supabase
2. Update the seeding script accordingly
3. Update the app code that references these fields

## Verifying Seeded Data

After running the script, you can verify the data in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to Table Editor
3. Check each table to see the seeded data

## Troubleshooting

### "Missing required environment variables"

- Ensure `.env.local` exists in the project root
- Verify `SUPABASE_URL` (or `EXPO_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` are set

### "Failed to insert users"

- This warning is expected if `auth.users` entries don't exist yet
- Users should be created through the app's sign-up flow
- The script will still seed other data successfully

### "Foreign key constraint violation"

- Ensure you've run `setup-database.sql` to create all tables
- Check that tables are created in the correct order
- Verify RLS policies allow the service role to insert data

### "Row Level Security policy violation"

- The service role key should bypass RLS
- If you see this error, verify the service role key is correct
- Check that you're using `SUPABASE_SERVICE_ROLE_KEY` (not the anon key)

## Re-running the Script

The script uses `upsert` operations, so it's safe to run multiple times:

- Existing records will be updated
- New records will be inserted
- No duplicate data will be created (based on primary keys)

## Next Steps

After seeding:

1. **Test the App**:

   - Browse restaurants and menu items
   - Filter by categories
   - Add items to cart and place orders
   - View past orders (if logged in as a seeded user)

2. **Create Test Users**:

   - Use the app's sign-up flow to create real users
   - These will be linked to the seeded data

3. **Update Mock Data** (if needed):
   - The home page (`app/(tabs)/index.tsx`) has hardcoded category IDs
   - Update these to match your seeded category IDs
   - Restaurant detail pages use mock data - consider fetching from the database

## Troubleshooting

### Tables Not Created

If you see "Success. No rows returned" when verifying tables, the SQL script may not have executed properly.

**Solution:**

1. Check Supabase SQL Editor for any error messages
2. Run `setup-database.sql` in parts:
   - First: Table creation (lines 1-100)
   - Second: Enable RLS
   - Third: Create policies
3. Verify tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('users', 'restaurants', 'menu_items', 'categories', 'orders', 'order_items', 'addresses', 'reviews');
   ```

### Foreign Key Constraint Violation

- Ensure you've run `setup-database.sql` to create all tables
- Check that tables are created in the correct order
- Verify RLS policies allow the service role to insert data

### Row Level Security Policy Violation

- The service role key should bypass RLS
- Verify the service role key is correct
- Check that you're using `SUPABASE_SERVICE_ROLE_KEY` (not the anon key)

### Missing Environment Variables

- Ensure `.env.local` exists with required variables
- Restart the Expo dev server after adding env variables
- Verify `EXPO_PUBLIC_SUPABASE_URL` matches your project URL exactly

### Still Having Issues?

1. Check Supabase Logs (Logs → API Logs in dashboard)
2. Verify environment variables in `.env.local`
3. Try a simple query: `SELECT * FROM menu_items LIMIT 1;`
4. Ensure Supabase project is active and fully provisioned

The core queries (`getMenu`, `getCategories`, `getRestaurants`, `createOrder`, `getUserOrders`) are already set up to work with the seeded data structure.
