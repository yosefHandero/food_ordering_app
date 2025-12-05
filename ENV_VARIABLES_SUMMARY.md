# Environment Variables - Quick Reference

## Required Variables (Must Have)

1. **EXPO_PUBLIC_SUPABASE_URL** - Your Supabase project URL
   - Get from: Supabase Dashboard → Settings → API → Project URL
   - Format: `https://xxxxxxxxxxxxx.supabase.co`

2. **EXPO_PUBLIC_SUPABASE_ANON_KEY** - Your Supabase anonymous/public API key
   - Get from: Supabase Dashboard → Settings → API → anon/public key
   - Format: JWT token starting with `eyJ...`

3. **EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET** - Storage bucket name for images
   - Get from: Supabase Dashboard → Storage → Create bucket
   - Default: `food-images`

## Optional Variables (Recommended)

4. **EXPO_PUBLIC_GOOGLE_MAPS_API_KEY** - For maps and location services
5. **EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY** - For payment processing
6. **EXPO_PUBLIC_SENTRY_DSN** - For error tracking
7. **EXPO_PUBLIC_ENVIRONMENT** - Environment identifier (development/staging/production)

## Setup Steps

1. Create `.env.local` file in project root
2. Add the 3 required variables
3. Install dependencies: `npm install @supabase/supabase-js @react-native-async-storage/async-storage`
4. Restart Expo: `expo start --clear`

See `ENV_VARIABLES_LIST.md` for detailed instructions.

