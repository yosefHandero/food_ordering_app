# Environment Variables Required - Complete List

## Required Variables (Must Have)

### 1. EXPO_PUBLIC_SUPABASE_URL
- **Description**: Your Supabase project URL
- **Where to get**: Supabase Dashboard → Settings → API → Project URL
- **Format**: `https://xxxxxxxxxxxxx.supabase.co`
- **Example**: `https://abcdefghijklmnop.supabase.co`

### 2. EXPO_PUBLIC_SUPABASE_ANON_KEY
- **Description**: Your Supabase anonymous/public API key (safe for client-side)
- **Where to get**: Supabase Dashboard → Settings → API → Project API keys → anon/public
- **Format**: Long JWT token starting with `eyJ...`
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3. EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET
- **Description**: Name of your Supabase storage bucket for food images
- **Where to get**: Supabase Dashboard → Storage → Create bucket or use existing
- **Format**: String (bucket name)
- **Example**: `food-images`
- **Default**: `food-images`

## Optional Variables (Recommended)

### 4. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
- **Description**: Google Maps API key for location services and delivery tracking
- **Where to get**: Google Cloud Console → APIs & Services → Credentials → Create API Key
- **When needed**: If implementing maps, location search, or delivery tracking
- **Format**: String starting with `AIza...`
- **Example**: `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 5. EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
- **Description**: Stripe publishable key for payment processing
- **Where to get**: Stripe Dashboard → Developers → API keys → Publishable key
- **When needed**: If implementing payment processing
- **Format**: String starting with `pk_test_...` (test) or `pk_live_...` (production)
- **Example**: `pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 6. EXPO_PUBLIC_SENTRY_DSN
- **Description**: Sentry DSN for error tracking and monitoring
- **Where to get**: Sentry.io → Create Project → Copy DSN
- **When needed**: For production error tracking
- **Format**: URL string
- **Example**: `https://xxxxxxxxxxxxx@xxxxxxxxxxxxx.ingest.sentry.io/xxxxxxxxxxxxx`

## Optional Variables (Advanced)

### 7. EXPO_PUBLIC_ENVIRONMENT
- **Description**: Environment identifier for conditional logic
- **Values**: `development`, `staging`, `production`
- **Default**: `development`
- **Example**: `production`

### 8. EXPO_PUBLIC_API_URL
- **Description**: Custom backend API URL (if using separate backend)
- **When needed**: If you have a custom backend API separate from Supabase
- **Format**: Full URL
- **Example**: `https://api.yourdomain.com`

### 9. EXPO_PUSH_TOKEN
- **Description**: Expo push notification token
- **Where to get**: Generated automatically by Expo when using push notifications
- **When needed**: For push notifications
- **Format**: Expo push token string
- **Example**: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`

## Server-Side Only (Never in .env.local)

### ⚠️ SUPABASE_SERVICE_ROLE_KEY
- **Description**: Supabase service role key (admin privileges)
- **⚠️ WARNING**: NEVER expose this in client-side code!
- **Where to use**: Server-side functions, edge functions, or backend only
- **Where to get**: Supabase Dashboard → Settings → API → service_role key

## Quick Setup Checklist

- [ ] Create Supabase project at https://app.supabase.com
- [ ] Copy Project URL → `EXPO_PUBLIC_SUPABASE_URL`
- [ ] Copy anon key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Create storage bucket → `EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET`
- [ ] Create `.env.local` file in project root
- [ ] Add all required variables
- [ ] Restart Expo: `expo start --clear`

## Example .env.local File

```env
# Required
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET=food-images

# Optional
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_ENVIRONMENT=development
```

## Security Notes

1. ✅ **Safe to expose**: All `EXPO_PUBLIC_*` variables are bundled into your app
2. ⚠️ **Use RLS**: Enable Row Level Security in Supabase to protect data
3. 🔒 **Never commit**: `.env.local` should be in `.gitignore`
4. 📝 **Rotate keys**: Regularly rotate API keys in production
5. 🛡️ **Validate input**: Always validate user input on server-side

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` exists in project root
- Verify variable names start with `EXPO_PUBLIC_`
- Restart Expo with `expo start --clear`

### "Invalid API key"
- Verify you copied the correct key (anon key, not service role)
- Check for extra spaces or quotes
- Ensure key is from the correct Supabase project

### "Storage bucket not found"
- Create bucket in Supabase Dashboard → Storage
- Verify bucket name matches exactly (case-sensitive)
- Check bucket permissions are set correctly

