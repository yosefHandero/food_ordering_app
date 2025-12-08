# Database Seeding Guide

## Overview

This guide explains how to seed your Supabase database with realistic mock data for the food ordering app.

## Prerequisites

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

## Running the Seeding Script

```bash
npm run seed:db
```

The script will:

- Connect to Supabase using the service role key
- Insert data in the correct order (respecting foreign key constraints)
- Use upsert operations (safe to run multiple times)
- Generate realistic mock data

## Seeded Data

The script generates:

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

## Notes on App Compatibility

The following pages may need updates to fully use seeded data:

1. **Home Page** (`app/(tabs)/index.tsx`):

   - Has hardcoded category IDs in `handlePress` function
   - Should fetch categories dynamically

2. **Restaurant Detail** (`app/restaurants/[id].tsx`):

   - Uses mock restaurant data
   - Should use `getRestaurantById` and `getRestaurantMenu` from `lib/supabase-data.ts`

3. **Dish Detail** (`app/restaurants/[id]/menu/[dishId].tsx`):
   - Uses mock dish data
   - Should use `getDishById` from `lib/supabase-data.ts`

The core queries (`getMenu`, `getCategories`, `getRestaurants`, `createOrder`, `getUserOrders`) are already set up to work with the seeded data structure.
