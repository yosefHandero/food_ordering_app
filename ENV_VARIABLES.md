# Environment Variables Required for Food Ordering App

## Required Variables (Must Have)

### 1. EXPO_PUBLIC_SUPABASE_URL
- **Description**: Your Supabase project URL
- **Where to get it**: 
  1. Go to https://app.supabase.com
  2. Select your project
  3. Go to Settings → API
  4. Copy the "Project URL"
- **Format**: `https://xxxxxxxxxxxxx.supabase.co`
- **Example**: `https://abcdefghijklmnop.supabase.co`

### 2. EXPO_PUBLIC_SUPABASE_ANON_KEY
- **Description**: Your Supabase anonymous/public API key (safe for client-side)
- **Where to get it**:
  1. Go to https://app.supabase.com
  2. Select your project
  3. Go to Settings → API
  4. Copy the "anon" or "public" key under "Project API keys"
- **Format**: Long string starting with `eyJ...`
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET (Optional but Recommended)
- **Description**: Name of your Supabase storage bucket for food images
- **Where to get it**:
  1. Go to https://app.supabase.com
  2. Select your project
  3. Go to Storage
  4. Create a bucket named "food-images" or use existing bucket name
- **Default**: `food-images`
- **Example**: `food-images`

## Optional Variables (Nice to Have)

### 4. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
- **Description**: Google Maps API key for restaurant locations and delivery tracking
- **Where to get it**:
  1. Go to https://console.cloud.google.com
  2. Create a project or select existing
  3. Enable "Maps SDK for Android" and "Maps SDK for iOS"
  4. Go to Credentials → Create Credentials → API Key
- **When needed**: If implementing map features, delivery tracking, or location-based search

### 5. EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
- **Description**: Stripe publishable key for payment processing
- **Where to get it**:
  1. Go to https://dashboard.stripe.com
  2. Go to Developers → API keys
  3. Copy "Publishable key" (use test key for development: `pk_test_...`)
- **When needed**: If implementing payment processing

### 6. EXPO_PUBLIC_SENTRY_DSN
- **Description**: Sentry DSN for error tracking and monitoring
- **Where to get it**:
  1. Go to https://sentry.io
  2. Create a project
  3. Copy the DSN from project settings
- **When needed**: For production error tracking

## Setup Instructions

1. **Copy the example file**:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Fill in your values**:
   - Open `.env.local`
   - Replace all placeholder values with your actual keys
   - Remove the `#` from lines you want to use

3. **Restart your development server**:
   ```bash
   expo start --clear
   ```

## Security Notes

- ✅ **Safe to expose**: `EXPO_PUBLIC_*` variables are bundled into your app and visible to users
- ⚠️ **Never expose**: Service role keys, secret keys, or any keys with admin privileges
- 🔒 **Use Row Level Security (RLS)**: Enable RLS in Supabase to protect your data
- 📝 **Add to .gitignore**: Make sure `.env.local` is in your `.gitignore` file

## Supabase Database Schema Setup

After setting up your environment variables, you'll need to create these tables in Supabase:

1. **users** - User profiles
2. **restaurants** - Restaurant information
3. **menu_items** - Food items
4. **categories** - Food categories
5. **orders** - Order records
6. **order_items** - Items in each order
7. **addresses** - User delivery addresses
8. **reviews** - Restaurant/dish reviews

See `SUPABASE_SCHEMA.sql` for detailed schema definitions.

