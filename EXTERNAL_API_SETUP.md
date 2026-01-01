# External API Setup for AI-Powered Food Discovery

This app now uses external APIs to discover nearby restaurants and generate intelligent food recommendations.

## Overview

The system uses:
1. **Google Places API** - To find nearby restaurants
2. **Hugging Face AI** - To intelligently rank and recommend food items based on user preferences

## Required Environment Variables

Add these to your `.env.local` file (or `.env`):

```env
# Google Places API (Required for restaurant discovery)
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
# OR for client-side access:
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Hugging Face API (Required for AI ranking)
HUGGING_FACE_API_KEY=your_hugging_face_api_key_here
# OR:
EXPO_PUBLIC_HUGGINGFACE_API_KEY=your_hugging_face_api_key_here

# Optional: Custom Hugging Face model
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

## Setting Up Google Places API

### Step 1: Get API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Places API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key

### Step 2: Restrict API Key (Recommended for Production)

For security, restrict your API key:

1. Click on your API key to edit it
2. Under "API restrictions", select "Restrict key"
3. Choose "Places API" only
4. Under "Application restrictions":
   - For web: Add your domain
   - For mobile: Add your app's package name/bundle ID

### Step 3: Add to Environment Variables

Add the API key to your `.env.local`:

```env
GOOGLE_PLACES_API_KEY=AIzaSy...your_key_here
```

## Setting Up Hugging Face API

### Step 1: Get API Key

1. Go to [Hugging Face](https://huggingface.co/)
2. Sign up or log in
3. Go to your [Settings](https://huggingface.co/settings/tokens)
4. Create a new token with "Read" permissions
5. Copy your token

### Step 2: Add to Environment Variables

```env
HUGGING_FACE_API_KEY=hf_...your_token_here
```

## How It Works

### 1. Restaurant Discovery

When a user requests recommendations:

1. The app calls Google Places API to find nearby restaurants
2. For each restaurant, the system generates menu item suggestions based on:
   - Cuisine type
   - Restaurant name
   - Price level
3. Nutritional information is estimated using intelligent algorithms

### 2. AI-Powered Ranking

The Hugging Face AI model:

1. Receives all candidate menu items with:
   - User's health goal (high-protein, low-cal, balanced, low-carb)
   - Time of day (breakfast, lunch, dinner, snack)
   - Last meal context (if provided)
   - Budget and distance constraints
2. Intelligently ranks items based on:
   - Goal alignment (flexible - suggests best alternatives if perfect matches aren't available)
   - Time-of-day suitability
   - Nutritional quality
   - Context awareness (last meal, activity level)
   - Price value
   - Distance
3. Returns top 8 recommendations with personalized explanations

### 3. Flexible Recommendations

The system is designed to be **intelligent and flexible**:

- ✅ **Prioritizes quality over strict filtering** - If no perfect match exists, suggests the best available alternative
- ✅ **Adapts to real-world availability** - Works with actual restaurants in the area
- ✅ **Provides helpful recommendations** - Better to suggest good options than return empty results
- ✅ **Considers context** - Takes into account meal timing, last meal, and user goals

## Features

### Intelligent Menu Item Generation

The system generates menu items based on:
- **Cuisine type**: Different suggestions for Italian, Asian, Mexican, Indian, Mediterranean, etc.
- **Price level**: Adjusts suggestions based on restaurant price level
- **Nutritional estimation**: Estimates calories, protein, sodium, sugar, carbs, fat, and fiber

### Flexible Goal Matching

- **High Protein**: Prioritizes 25g+ protein, but accepts 15-20g if other factors are excellent
- **Low Calorie**: Prioritizes <500 cal, but accepts 500-600 cal if nutritionally dense
- **Low Carb**: Prioritizes <30g carbs, but accepts 30-40g if high in protein/fiber
- **Balanced**: Looks for overall nutritional quality

### Context-Aware Adjustments

- **Late dinner**: Prioritizes lighter portions and lower sodium
- **Recent heavy meal**: Suggests lighter, lower-sodium options
- **Workout context**: Allows higher carbs for recovery
- **Snack time**: Focuses on small, nutrient-dense options

## Testing

1. Make sure your API keys are set in `.env.local`
2. Restart your development server
3. Open the app and navigate to the "Healthy Picks" feature
4. Set your location (or use default)
5. Select your preferences and click "Suggest the best healthy meal"
6. Check the console logs for debugging information

## Troubleshooting

### No restaurants found

- Check that `GOOGLE_PLACES_API_KEY` is set correctly
- Verify the API key has Places API enabled
- Check console logs for API errors
- Ensure location is set correctly

### No recommendations returned

- Check that `HUGGING_FACE_API_KEY` is set correctly
- Verify the API key has proper permissions
- Check console logs for Hugging Face errors
- The model may need to load on first request (wait 10-30 seconds)

### API errors

- Check API key restrictions in Google Cloud Console
- Verify API quotas haven't been exceeded
- Check network connectivity
- Review console logs for specific error messages

## Cost Considerations

### Google Places API

- **Nearby Search**: $32 per 1,000 requests
- **Photo**: $7 per 1,000 requests
- Free tier: $200 credit per month (first 90 days)

### Hugging Face

- **Inference API**: Free tier available with rate limits
- Paid plans available for higher usage

## Security Notes

- **Never commit API keys to version control**
- Use `.env.local` (which should be in `.gitignore`)
- For production, use environment variables on your hosting platform
- Restrict API keys to specific APIs and domains/apps
- Rotate API keys regularly

## Next Steps

1. Set up your API keys
2. Test the restaurant discovery
3. Test the AI recommendations
4. Adjust the prompt in `lib/openai.ts` if needed
5. Customize menu item generation in `lib/external-apis.ts` if needed

