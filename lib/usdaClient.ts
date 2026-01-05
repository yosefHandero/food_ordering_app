/**
 * USDA FoodData Central API Client
 * Provides typed data layer for food search and nutrition data
 * API Documentation: https://fdc.nal.usda.gov/api-guide.html
 */

const USDA_API_KEY = process.env.USDA_API_KEY || process.env.EXPO_PUBLIC_USDA_API_KEY;
const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';

// Validate API key at startup
if (!USDA_API_KEY) {
  console.warn('[USDA Client] USDA_API_KEY not configured. USDA features will be unavailable.');
}

import { NormalizedFood, USDASearchResponse, USDASearchResult, USDANutrient, USDAFoodDetail, ExtendedNutrition } from '@/type';

/**
 * Normalized food data structure for internal use
 */
export type { NormalizedFood };

/**
 * Map USDA nutrient IDs to our nutrition fields
 */
const NUTRIENT_MAP: Record<number, keyof ExtendedNutrition> = {
  1008: 'calories', // Energy (kcal)
  1003: 'protein', // Protein
  1005: 'carbs', // Carbohydrate, by difference
  1004: 'fat', // Total lipid (fat)
  1079: 'fiber', // Fiber, total dietary
  1093: 'sodium', // Sodium, Na (in mg)
  2000: 'sugar', // Sugars, total including NLEA
};

// In-memory cache for search and detail calls
const searchCache = new Map<string, USDASearchResult[]>();
const detailCache = new Map<number, USDAFoodDetail>();

// Cache TTL: 1 hour
const CACHE_TTL = 60 * 60 * 1000;
const cacheTimestamps = new Map<string, number>();

/**
 * Check if cache entry is still valid
 */
function isCacheValid(key: string): boolean {
  const timestamp = cacheTimestamps.get(key);
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_TTL;
}

/**
 * Search for foods in USDA database
 * @param query - Search query string
 * @param pageSize - Number of results per page (default: 10, max: 200)
 * @returns Array of search results
 */
export async function searchFoods(
  query: string,
  pageSize: number = 10
): Promise<NormalizedFood[]> {
  if (!USDA_API_KEY) {
    console.warn('[USDA Client] API key not configured');
    return [];
  }

  const cacheKey = `search:${query}:${pageSize}`;
  
  // Check cache
  if (searchCache.has(cacheKey) && isCacheValid(cacheKey)) {
    const cached = searchCache.get(cacheKey)!;
    return cached.map(normalizeFood);
  }

  try {
    const url = `${USDA_API_BASE}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=${Math.min(pageSize, 200)}&dataType=Foundation,SR%20Legacy`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
    }

    const data: USDASearchResponse = await response.json();
    const results = data.foods || [];

    // Cache results
    searchCache.set(cacheKey, results);
    cacheTimestamps.set(cacheKey, Date.now());

    return results.map(normalizeFood);
  } catch (error: any) {
    console.error('[USDA Client] Search error:', error.message);
    return [];
  }
}

/**
 * Get detailed food information by FDC ID
 * @param fdcId - FoodData Central ID
 * @returns Normalized food data or null if not found
 */
export async function getFoodDetails(fdcId: number | string): Promise<NormalizedFood | null> {
  if (!USDA_API_KEY) {
    console.warn('[USDA Client] API key not configured');
    return null;
  }

  const id = typeof fdcId === 'string' ? parseInt(fdcId, 10) : fdcId;
  if (isNaN(id)) {
    console.error('[USDA Client] Invalid FDC ID:', fdcId);
    return null;
  }

  const cacheKey = `detail:${id}`;
  
  // Check cache
  if (detailCache.has(id) && isCacheValid(cacheKey)) {
    const cached = detailCache.get(id)!;
    return normalizeFood(cached);
  }

  try {
    const url = `${USDA_API_BASE}/food/${id}?api_key=${USDA_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
    }

    const food: USDAFoodDetail = await response.json();

    // Cache result
    detailCache.set(id, food);
    cacheTimestamps.set(cacheKey, Date.now());

    return normalizeFood(food);
  } catch (error: any) {
    console.error('[USDA Client] Get details error:', error.message);
    return null;
  }
}

/**
 * Normalize USDA food data to consistent internal shape
 * @param food - USDA food data (from search or detail endpoint)
 * @returns Normalized food object
 */
export function normalizeFood(food: USDASearchResult | USDAFoodDetail): NormalizedFood {
  const nutrition: ExtendedNutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  // Extract nutrients
  if (food.foodNutrients && Array.isArray(food.foodNutrients)) {
    food.foodNutrients.forEach((nutrient: USDANutrient) => {
      const field = NUTRIENT_MAP[nutrient.nutrientId];
      if (field && nutrient.value !== null && nutrient.value !== undefined) {
        let value = nutrient.value;
        
        // Convert sodium from grams to mg if needed
        if (field === 'sodium' && nutrient.unitName?.toLowerCase() === 'g') {
          value = value * 1000;
        }
        
        // Round to 2 decimal places for all values
        (nutrition as any)[field] = Math.round(value * 100) / 100;
      }
    });
  }

  // Handle ingredients - use "Not provided" if missing
  let ingredients: string | undefined = food.ingredients;
  if (!ingredients || ingredients.trim() === '') {
    ingredients = undefined; // We'll handle "Not provided" in UI
  }

  return {
    id: food.fdcId.toString(),
    name: food.description || 'Unknown Food',
    brand: food.brandOwner || undefined,
    ingredients,
    calories: Math.round(nutrition.calories || 0),
    protein: Math.round((nutrition.protein || 0) * 100) / 100,
    carbs: Math.round((nutrition.carbs || 0) * 100) / 100,
    fat: Math.round((nutrition.fat || 0) * 100) / 100,
    fiber: nutrition.fiber !== undefined ? Math.round((nutrition.fiber || 0) * 100) / 100 : undefined,
    sodium: nutrition.sodium !== undefined ? Math.round((nutrition.sodium || 0) * 100) / 100 : undefined,
    sugar: nutrition.sugar !== undefined ? Math.round((nutrition.sugar || 0) * 100) / 100 : undefined,
    // USDA doesn't provide images
    imageUrl: undefined,
  };
}

/**
 * Check if USDA API is available
 */
export function isUSDAAvailable(): boolean {
  return !!USDA_API_KEY;
}

/**
 * Clear all caches (useful for testing or forced refresh)
 */
export function clearCache(): void {
  searchCache.clear();
  detailCache.clear();
  cacheTimestamps.clear();
}

