import { rankWithOpenAI } from '@/lib/openai'; // Note: function name kept for compatibility, but uses Hugging Face
import {
    generateContextGuidance,
    getNearbyRestaurantsAndMenuItems,
    localRankRecommendations
} from '@/lib/recommendations';
import { RecommendationRequest, RecommendationResponse } from '@/type';

export async function POST(request: Request) {
  try {
    const body: any = await request.json();

    // Validate required inputs
    if (!body.goal || !body.timeOfDay || !body.budgetMax || !body.radiusMiles) {
      return Response.json(
        { error: 'Missing required fields: goal, timeOfDay, budgetMax, radiusMiles' },
        { status: 400 }
      );
    }

    if (body.lat === undefined || body.lng === undefined) {
      return Response.json(
        { error: 'Location is required: lat and lng' },
        { status: 400 }
      );
    }

    // Validate enums
    const validGoals = ['high-protein', 'low-cal', 'balanced', 'low-carb'];
    const validTimeOfDay = ['breakfast', 'lunch', 'dinner', 'snack'];
    const validActivityLevel = ['sedentary', 'light', 'workout', null];
    const validHeaviness = ['light', 'medium', 'heavy', null];

    if (!validGoals.includes(body.goal)) {
      return Response.json(
        { error: `Invalid goal. Must be one of: ${validGoals.join(', ')}` },
        { status: 400 }
      );
    }

    if (!validTimeOfDay.includes(body.timeOfDay)) {
      return Response.json(
        { error: `Invalid timeOfDay. Must be one of: ${validTimeOfDay.join(', ')}` },
        { status: 400 }
      );
    }

    if (body.activityLevel !== undefined && !validActivityLevel.includes(body.activityLevel)) {
      return Response.json(
        { error: `Invalid activityLevel. Must be one of: ${validActivityLevel.join(', ')}` },
        { status: 400 }
      );
    }

    if (body.lastMealHeaviness !== undefined && !validHeaviness.includes(body.lastMealHeaviness)) {
      return Response.json(
        { error: `Invalid lastMealHeaviness. Must be one of: ${validHeaviness.join(', ')}` },
        { status: 400 }
      );
    }

    // Build normalized request
    const normalizedRequest: RecommendationRequest = {
      goal: body.goal,
      timeOfDay: body.timeOfDay,
      lastMeal: body.lastMeal || null,
      lastMealTime: body.lastMealTime || null,
      activityLevel: body.activityLevel || null,
      lastMealHeaviness: body.lastMealHeaviness || null,
      budgetMax: parseFloat(body.budgetMax) || 30,
      radiusMiles: parseFloat(body.radiusMiles) || 5,
      lat: parseFloat(body.lat),
      lng: parseFloat(body.lng),
    };

    // Fetch nearby restaurants and menu items
    let restaurants, menuItems;
    try {
      const result = await getNearbyRestaurantsAndMenuItems(
        normalizedRequest.lat,
        normalizedRequest.lng,
        normalizedRequest.radiusMiles,
        normalizedRequest.budgetMax
      );
      restaurants = result.restaurants;
      menuItems = result.menuItems;
      console.log('[Recommendations API] Fetched data:', {
        restaurantsCount: restaurants.length,
        menuItemsCount: menuItems.length
      });
    } catch (dbError: any) {
      console.error('[Recommendations API] Database error:', dbError);
      return Response.json(
        { 
          error: 'Failed to fetch restaurants. Please check your database connection.',
          details: dbError.message 
        },
        { status: 500 }
      );
    }

    if (restaurants.length === 0 || menuItems.length === 0) {
      console.warn('[Recommendations API] No restaurants or menu items found:', {
        restaurantsCount: restaurants.length,
        menuItemsCount: menuItems.length,
        lat: normalizedRequest.lat,
        lng: normalizedRequest.lng,
        radius: normalizedRequest.radiusMiles
      });
      const context = generateContextGuidance(normalizedRequest);
      return Response.json({
        context,
        results: [],
      });
    }

    // Prepare candidates (limit to top 60 menu items across nearest restaurants)
    // Score all items and take top 60
    const allCandidates: {
      restaurant: any;
      item: any;
    }[] = [];

    restaurants.forEach((restaurant) => {
      const restaurantItems = menuItems.filter(
        (item) => item.restaurant_id === restaurant.id
      );
      restaurantItems.forEach((item) => {
        allCandidates.push({ restaurant, item });
      });
    });

    // Limit to top 60 candidates based on initial health score + distance
    const scoredCandidates = allCandidates
      .map(({ restaurant, item }) => {
        const baseScore = (item.healthScore || 0) + 
                         (restaurant.rating || 0) * 10 - 
                         (restaurant.distanceMiles || 10) * 2;
        return { restaurant, item, baseScore };
      })
      .sort((a, b) => b.baseScore - a.baseScore)
      .slice(0, 60)
      .map(({ restaurant, item }) => ({ restaurant, item }));

    if (scoredCandidates.length === 0) {
      const context = generateContextGuidance(normalizedRequest);
      return Response.json({
        context,
        results: [],
      });
    }

    // Try Hugging Face ranking, fallback to local
    let results;
    try {
      console.log('[Recommendations API] Attempting Hugging Face ranking with', scoredCandidates.length, 'candidates');
      console.log('[Recommendations API] API Key check:', {
        hasHuggingFaceKey: !!(process.env.HUGGING_FACE_API_KEY || process.env.HUGGINGFACE_API_KEY),
        hasPublicKey: !!(process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY || process.env.EXPO_PUBLIC_HUGGING_FACE_API_KEY),
        model: process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2'
      });
      results = await rankWithOpenAI(scoredCandidates, normalizedRequest);
      console.log('[Recommendations API] Hugging Face ranking succeeded, got', results.length, 'results');
    } catch (error: any) {
      console.warn('[Recommendations API] Hugging Face ranking failed, using local fallback:', error.message);
      console.warn('[Recommendations API] Error details:', error);
      results = localRankRecommendations(
        restaurants,
        menuItems,
        normalizedRequest
      );
      console.log('[Recommendations API] Local fallback completed, got', results.length, 'results');
    }

    // Generate context guidance
    const context = generateContextGuidance(normalizedRequest);

    console.log('[Recommendations API] Final response prepared:', {
      resultsCount: results.length,
      hasContext: !!context,
      sampleResult: results[0] ? {
        restaurant: results[0].restaurant.name,
        item: results[0].item.name
      } : null
    });

    const response: RecommendationResponse = {
      context,
      results,
    };

    return Response.json(response);
  } catch (error: any) {
    console.error('Recommendation API error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
