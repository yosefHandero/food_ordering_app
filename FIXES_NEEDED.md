# Fixes Needed - Terminal Errors

## Issues Found

### 1. Missing Dependencies
**Error**: Supabase packages not installed

**Fix**: Run this command:
```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

### 2. TypeScript Config Issue
**Error**: `File 'expo/tsconfig.base' not found`

**Status**: This is usually fine - Expo should handle this. If you see errors, try:
```bash
npx expo install --fix
```

### 3. Old Appwrite Files (Can be ignored or removed)
- `lib/appwrite.ts` - Old Appwrite implementation (can be deleted)
- `lib/seed.ts` - Old seeding script (needs update for Supabase)
- `store/auth.store.ts` - Old store file (can be deleted if not used)

### 4. Type Definitions Updated
✅ Fixed `type.d.ts` to remove Appwrite Models.Document dependency

## Quick Fix Commands

```bash
# 1. Install Supabase dependencies
npm install @supabase/supabase-js @react-native-async-storage/async-storage

# 2. Create .env.local file (if not exists)
cp .env.local.example .env.local
# Then add your Supabase credentials

# 3. Clear cache and restart
expo start --clear
```

## Environment Variables Required

Make sure `.env.local` has:
1. EXPO_PUBLIC_SUPABASE_URL
2. EXPO_PUBLIC_SUPABASE_ANON_KEY  
3. EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET

## Common Runtime Errors & Solutions

### "Missing Supabase environment variables"
- Check `.env.local` exists in project root
- Verify variable names start with `EXPO_PUBLIC_`
- Restart Expo: `expo start --clear`

### "Module not found: @supabase/supabase-js"
- Run: `npm install @supabase/supabase-js @react-native-async-storage/async-storage`

### "Cannot find module '@/lib/supabase'"
- Make sure file exists: `lib/supabase.ts`
- Check TypeScript paths in `tsconfig.json`

### "Row Level Security policy violation"
- Run SQL schema from `SUPABASE_MIGRATION.md` in Supabase SQL Editor
- Check RLS policies are enabled

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up `.env.local` with Supabase credentials
3. ✅ Run Supabase SQL schema
4. ✅ Test the app

