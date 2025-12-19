# Troubleshooting: Recommendations Not Showing

## Quick Checklist

### 1. Environment Variables

Check that `.env.local` exists and contains:

```
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key (optional, will use local fallback if missing)
```

**To verify:**

- Check if `.env.local` file exists in project root
- Restart Expo dev server after adding/changing env variables
- For web: env variables must start with `EXPO_PUBLIC_` to be accessible

### 2. Database Setup

Ensure your Supabase database has:

- `restaurants` table with data
- `menu_items` table with data
- Tables have proper RLS policies (or disable RLS for testing)

**To verify:**

- Go to Supabase Dashboard → Table Editor
- Check if `restaurants` and `menu_items` tables have rows
- If empty, run `seed-data.sql` in Supabase SQL Editor

### 3. API Route

The API route should be at: `app/api/recommendations/route.ts`

**To verify:**

- Check browser console (F12) for 404 errors
- Check terminal for API route errors
- API should be accessible at: `http://localhost:8081/api/recommendations` (or your dev server URL)

### 4. Check Console Logs

After clicking "Suggest the best healthy meal", check:

**Browser Console (F12 → Console):**

- Look for `[Recommendations]` log messages
- Check for error messages
- Note the API URL being called
- Check response status and data

**Terminal/Server Logs:**

- Look for `[Recommendations API]` log messages
- Check for database errors
- Check for OpenAI API errors (if using OpenAI)

### 5. Common Issues

**Issue: "No recommendations found"**

- **Cause**: No restaurants/menu items in database, or location filter too strict
- **Fix**: Seed database or adjust location/radius

**Issue: 404 Error**

- **Cause**: API route not found
- **Fix**: Ensure `app/api/recommendations/route.ts` exists, restart dev server

**Issue: Database connection error**

- **Cause**: Missing or incorrect Supabase credentials
- **Fix**: Check `.env.local` has correct `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Issue: Empty results array**

- **Cause**: No menu items match the budget/location criteria
- **Fix**: Increase budget or radius, or seed more data

### 6. Testing Steps

1. **Check Environment:**

   ```bash
   # Verify .env.local exists
   ls -la .env.local
   ```

2. **Check Database:**

   - Open Supabase Dashboard
   - Go to Table Editor
   - Verify `restaurants` and `menu_items` have data

3. **Test API Route:**

   - Open browser console (F12)
   - Click "Suggest the best healthy meal"
   - Watch console for logs
   - Check Network tab for API call

4. **Check Terminal:**
   - Look for server-side logs
   - Check for errors in API route execution

### 7. Debug Mode

The code now includes extensive logging. Check:

- Browser console for `[Recommendations]` logs
- Terminal for `[Recommendations API]` logs
- Network tab for API request/response

If you see errors, share:

1. The exact error message
2. Browser console logs
3. Terminal/server logs
4. Network request details (status, response body)
