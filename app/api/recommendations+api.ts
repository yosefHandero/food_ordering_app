import { getNearbyRestaurantsAndMenuItems } from '@/lib/external-apis';
import { rankWithOpenAI } from '@/lib/openai'; // Note: function name kept for compatibility, but uses Hugging Face
import {
  generateContextGuidance,
  localRankRecommendations
} from '@/lib/recommendations';
import { RecommendationRequest, RecommendationResponse, RecommendationResult } from '@/type';

/**
 * Normalize menu item name for comparison (remove extra spaces, lowercase, etc.)
 */
function normalizeItemName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Select the best restaurant when multiple restaurants have the same menu item.
 * Priority: 1) Less calories (or nearest location), 2) More protein, 3) Better rating, 4) Better price, 5) Random
 */
function selectBestRestaurantForItem(
  candidates: Array<{ restaurant: any; item: any }>,
  userLat?: number,
  userLng?: number
): { restaurant: any; item: any } {
  if (candidates.length === 1) {
    return candidates[0];
  }

  // Helper to calculate distance if we have user location
  const getDistance = (restaurant: any): number => {
    if (userLat !== undefined && userLng !== undefined && restaurant.lat && restaurant.lng) {
      const R = 3959; // Earth's radius in miles
      const dLat = ((restaurant.lat - userLat) * Math.PI) / 180;
      const dLon = ((restaurant.lng - userLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLat * Math.PI) / 180) *
          Math.cos((restaurant.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
    // Fall back to distanceMiles if available, otherwise use a large number
    return restaurant.distanceMiles ?? 999;
  };

  // Sort candidates based on priority criteria
  const sorted = [...candidates].sort((a, b) => {
    const itemA = a.item;
    const itemB = b.item;
    const restA = a.restaurant;
    const restB = b.restaurant;

    // 1. Less calories (or nearest location if calories are equal/unknown)
    const caloriesA = itemA.calories ?? 9999;
    const caloriesB = itemB.calories ?? 9999;
    if (caloriesA !== caloriesB) {
      return caloriesA - caloriesB; // Lower calories is better
    }

    // If calories are equal or both unknown, prefer nearest location
    const distanceA = getDistance(restA);
    const distanceB = getDistance(restB);
    if (Math.abs(distanceA - distanceB) > 0.1) { // Only if significantly different
      return distanceA - distanceB; // Closer is better
    }

    // 2. More protein
    const proteinA = itemA.protein ?? 0;
    const proteinB = itemB.protein ?? 0;
    if (proteinA !== proteinB) {
      return proteinB - proteinA; // Higher protein is better
    }

    // 3. Better rating
    const ratingA = restA.rating ?? 0;
    const ratingB = restB.rating ?? 0;
    if (ratingA !== ratingB) {
      return ratingB - ratingA; // Higher rating is better
    }

    // 4. Better price (lower is better)
    const priceA = itemA.price ?? 9999;
    const priceB = itemB.price ?? 9999;
    if (priceA !== priceB) {
      return priceA - priceB; // Lower price is better
    }

    // 5. Everything is the same - return 0 (will use random selection)
    return 0;
  });

  // If all criteria are equal, randomly select from the top candidates
  // (in case of ties, we might have multiple items with same scores)
  const topScore = {
    calories: sorted[0].item.calories ?? 9999,
    distance: getDistance(sorted[0].restaurant),
    protein: sorted[0].item.protein ?? 0,
    rating: sorted[0].restaurant.rating ?? 0,
    price: sorted[0].item.price ?? 9999,
  };

  // Find all candidates with the same top score
  const topCandidates = sorted.filter(c => {
    const cCalories = c.item.calories ?? 9999;
    const cDistance = getDistance(c.restaurant);
    const cProtein = c.item.protein ?? 0;
    const cRating = c.restaurant.rating ?? 0;
    const cPrice = c.item.price ?? 9999;

    return cCalories === topScore.calories &&
           Math.abs(cDistance - topScore.distance) < 0.1 &&
           cProtein === topScore.protein &&
           cRating === topScore.rating &&
           cPrice === topScore.price;
  });

  // Randomly select from top candidates if there are ties
  if (topCandidates.length > 1) {
    const randomIndex = Math.floor(Math.random() * topCandidates.length);
    return topCandidates[randomIndex];
  }

  return sorted[0];
}

/**
 * Deduplicate menu items - when multiple restaurants have the same item,
 * select the best one based on calories, distance, protein, rating, and price.
 */
function deduplicateMenuItems(
  candidates: Array<{ restaurant: any; item: any }>,
  userLat?: number,
  userLng?: number
): Array<{ restaurant: any; item: any }> {
  // Group candidates by normalized item name
  const itemsByName = new Map<string, Array<{ restaurant: any; item: any }>>();

  candidates.forEach(candidate => {
    const normalizedName = normalizeItemName(candidate.item.name);
    if (!itemsByName.has(normalizedName)) {
      itemsByName.set(normalizedName, []);
    }
    itemsByName.get(normalizedName)!.push(candidate);
  });

  // For each item name, select the best restaurant
  const deduplicated: Array<{ restaurant: any; item: any }> = [];
  
  itemsByName.forEach((candidatesForItem, normalizedName) => {
    const best = selectBestRestaurantForItem(candidatesForItem, userLat, userLng);
    deduplicated.push(best);
  });

  console.log('[Recommendations API] Deduplication:', {
    before: candidates.length,
    after: deduplicated.length,
    duplicatesRemoved: candidates.length - deduplicated.length
  });

  return deduplicated;
}

// GET endpoint for testing/health check
export async function GET() {
  return Response.json({ 
    status: 'ok', 
    message: 'Recommendations API is running',
    endpoint: '/api/recommendations',
    method: 'POST'
  });
}

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
    let restaurants: any[], menuItems: any[];
    try {
      const result = await getNearbyRestaurantsAndMenuItems(
        normalizedRequest.lat,
        normalizedRequest.lng,
        normalizedRequest.radiusMiles,
        normalizedRequest.budgetMax,
        {
          goal: normalizedRequest.goal,
          timeOfDay: normalizedRequest.timeOfDay,
          lastMeal: normalizedRequest.lastMeal,
          lastMealTime: normalizedRequest.lastMealTime,
        }
      );
      restaurants = result.restaurants;
      menuItems = result.menuItems;
      console.log('[Recommendations API] Fetched data:', {
        restaurantsCount: restaurants.length,
        menuItemsCount: menuItems.length
      });
    } catch (dbError: any) {
      console.error('[Recommendations API] Database error:', dbError);
      
      // Check if it's a network/DNS error
      const isNetworkError = 
        dbError.message === 'NETWORK_ERROR' ||
        dbError.isNetworkError === true ||
        dbError.message?.includes('fetch failed') ||
        dbError.message?.includes('ENOTFOUND') ||
        dbError.message?.includes('network') ||
        dbError.message?.includes('getaddrinfo') ||
        dbError.originalError?.message?.includes('ENOTFOUND');
      
      if (isNetworkError) {
        // Return graceful fallback instead of error
        console.warn('[Recommendations API] Network error detected, returning empty results with guidance');
        const contextObj = generateContextGuidance(normalizedRequest);
        // Extract guidance text - the function returns { guidancePreview: string, avoidChips: string[] }
        const guidanceText = contextObj && typeof contextObj === 'object' && 'guidancePreview' in contextObj
          ? String(contextObj.guidancePreview)
          : 'Recommendations optimized for your goal and time of day.';
        
        return Response.json({
          context: guidanceText + '\n\nNote: Database connection unavailable.',
          results: [],
          warning: 'Database connection unavailable. Recommendations are limited.',
        });
      }
      
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
      const contextObj = generateContextGuidance(normalizedRequest);
      return Response.json({
        context: contextObj.guidancePreview,
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

    // Deduplicate: if multiple restaurants have the same menu item, select the best one
    const deduplicatedCandidates = deduplicateMenuItems(
      allCandidates,
      normalizedRequest.lat,
      normalizedRequest.lng
    );

    // Limit to top 60 candidates based on initial health score + distance
    const scoredCandidates = deduplicatedCandidates
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
      const contextObj = generateContextGuidance(normalizedRequest);
      return Response.json({
        context: contextObj.guidancePreview,
        results: [],
      });
    }

    // Try Hugging Face ranking, fallback to local
    let results: RecommendationResult[];
    try {
      console.log('[Recommendations API] ===== USING HUGGING FACE API =====');
      console.log('[Recommendations API] Attempting Hugging Face ranking with', scoredCandidates.length, 'candidates');
      console.log('[Recommendations API] API Key check:', {
        hasHuggingFaceKey: !!(process.env.HUGGING_FACE_API_KEY || process.env.HUGGINGFACE_API_KEY),
        hasPublicKey: !!(process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY || process.env.EXPO_PUBLIC_HUGGING_FACE_API_KEY),
        model: process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2'
      });
      
      if (scoredCandidates.length === 0) {
        console.warn('[Recommendations API] WARNING: No candidates to rank! This means no restaurants/menu items were found.');
        console.warn('[Recommendations API] This is likely because the database is empty or the query returned no results.');
        results = [];
      } else {
        results = await rankWithOpenAI(scoredCandidates, normalizedRequest);
        console.log('[Recommendations API] ✅ Hugging Face ranking succeeded, got', results.length, 'results');
      }
    } catch (error: any) {
      console.error('[Recommendations API] ❌ Hugging Face ranking failed:', error.message);
      console.error('[Recommendations API] Error details:', {
        message: error.message,
        stack: error.stack?.substring(0, 300),
        name: error.name
      });
      console.log('[Recommendations API] Falling back to local ranking...');
      results = localRankRecommendations(
        restaurants,
        menuItems,
        normalizedRequest
      );
      console.log('[Recommendations API] Local fallback completed, got', results.length, 'results');
    }

    // Generate context guidance
    const contextObj = generateContextGuidance(normalizedRequest);
    
    console.log('[Recommendations API] Final response prepared:', {
      resultsCount: results.length,
      hasContext: !!contextObj.guidancePreview,
      sampleResult: results[0] ? {
        restaurant: results[0].restaurant.name,
        item: results[0].item.name
      } : null
    });

    const response: RecommendationResponse = {
      context: contextObj.guidancePreview,
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
