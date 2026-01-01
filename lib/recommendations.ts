import { RecommendationRequest, RecommendationResult } from '@/type';

/**
 * Parse last meal time string to hours ago
 * Supports: "2h ago", "30m ago", "10:30am", "HH:MM" format
 */
function parseLastMealTime(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null;
  
  const trimmed = timeStr.trim().toLowerCase();
  
  // Pattern: "Xh ago" or "Xm ago"
  const timeAgoMatch = trimmed.match(/(\d+)\s*(h|m|hour|minute|hr|min)/);
  if (timeAgoMatch) {
    const value = parseInt(timeAgoMatch[1]);
    const unit = timeAgoMatch[2];
    if (unit.startsWith('h')) {
      return value;
    } else if (unit.startsWith('m')) {
      return value / 60; // Convert minutes to hours
    }
  }
  
  // Pattern: "HH:MMam/pm" or "HH:MM"
  const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3];
    
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    const mealTime = new Date();
    mealTime.setHours(hours, minutes, 0, 0);
    const now = new Date();
    const diffMs = now.getTime() - mealTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // If negative, assume it was yesterday
    if (diffHours < 0) {
      return diffHours + 24;
    }
    return diffHours;
  }
  
  return null; // Unparseable
}

/**
 * Calculate health score based on macros and calories
 */
export function calculateHealthScore(item: {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium_mg?: number;
}): number {
  const calories = item.calories || 0;
  const protein = item.protein || 0;
  const fiber = item.fiber || 0;
  const sugar = item.sugar || 0;
  const sodium = item.sodium_mg || 0;

  // Health score formula: higher is better
  // Base score from protein (important for health)
  let score = protein * 1.2;
  
  // Bonus for lower calories (up to 700 cal range)
  score += Math.max(0, (700 - calories) * 0.04);
  
  // Bonus for fiber
  score += fiber * 2.5;
  
  // Penalties for high sodium and sugar
  score -= sodium * 0.02;
  score -= sugar * 0.9;
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get nearby restaurants and menu items within radius
 */
export async function getNearbyRestaurantsAndMenuItems(
  latitude: number,
  longitude: number,
  radiusMiles: number,
  budgetMax: number
) {
  // Return empty data since Supabase has been removed
  return {
    restaurants: [],
    menuItems: [],
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate context-aware scores for a menu item
 */
export function calculateContextAwareScores(
  item: any,
  restaurant: any,
  request: RecommendationRequest
): {
  total: number;
  health: number;
  goalFit: number;
  timeFit: number;
  lastMealFit: number;
  priceFit: number;
  distanceFit: number;
} {
  const calories = item.calories || 0;
  const protein = item.protein || 0;
  const carbs = item.carbs || 0;
  const fat = item.fat || 0;
  const sodium = item.sodium_mg || 0;
  const sugar = item.sugar || 0;
  const fiber = item.fiber || 0;
  const price = item.price || 0;
  const distanceMiles = restaurant.distanceMiles || 10;
  
  // 1. Health score (context-aware)
  let healthScore = calculateHealthScore(item);
  
  // Time-of-day adjustments to health score
  const hour = new Date().getHours();
  const isLateDinner = request.timeOfDay === 'dinner' && hour >= 20;
  const isBreakfast = request.timeOfDay === 'breakfast';
  const isSnack = request.timeOfDay === 'snack';
  
  // Apply context-aware adjustments based on time of day
  if (isBreakfast) {
    // Breakfast: lighter sodium penalty, moderate protein bonus
    healthScore += Math.max(0, (30 - sodium / 100) * 0.1);
    healthScore += protein * 0.1;
  } else if (isLateDinner) {
    // Late dinner: stronger sodium + portion penalty
    healthScore -= Math.min(20, sodium / 50);
    if (calories > 600) healthScore -= (calories - 600) * 0.02;
  } else if (isSnack) {
    // Snack: strong portion penalty; emphasize low calorie and protein/fiber
    if (calories > 300) healthScore -= (calories - 300) * 0.05;
    healthScore += protein * 0.15;
    healthScore += fiber * 3;
  }
  
  healthScore = Math.max(0, Math.min(100, healthScore));
  
  // 2. Goal alignment
  let goalFit = 0;
  if (request.goal === 'high-protein') {
    goalFit = Math.min(100, protein * 2);
  } else if (request.goal === 'low-cal') {
    goalFit = Math.max(0, 100 - (calories / 10));
  } else if (request.goal === 'low-carb') {
    goalFit = Math.max(0, 100 - (carbs * 2));
  } else {
    // balanced
    goalFit = 50 + (protein * 0.5) - (calories / 20) + (fiber * 2);
    goalFit = Math.max(0, Math.min(100, goalFit));
  }
  
  // 3. Time-of-day suitability
  let timeFit = 50; // Base
  if (request.timeOfDay === 'breakfast') {
    // Breakfast: prefer lighter, protein-rich
    if (calories < 500 && protein > 15) timeFit = 80;
    else if (calories > 700) timeFit = 30;
  } else if (request.timeOfDay === 'lunch') {
    // Lunch: balanced, allow higher carbs if workout
    if (request.activityLevel === 'workout' && carbs > 40) timeFit = 80;
    else if (calories >= 400 && calories <= 700) timeFit = 80;
  } else if (request.timeOfDay === 'dinner') {
    // Dinner: moderate portions, especially late
    if (isLateDinner && calories > 600) timeFit = 30;
    else if (calories >= 400 && calories <= 800) timeFit = 80;
  } else if (request.timeOfDay === 'snack') {
    // Snack: small portions, low calorie
    if (calories < 300) timeFit = 90;
    else if (calories > 400) timeFit = 20;
  }
  
  // 4. Last meal compatibility
  let lastMealFit = 50; // Neutral if no last meal info
  if (request.lastMeal) {
    const lastMealLower = request.lastMeal.toLowerCase();
    const isHeavyLastMeal = lastMealLower.includes('pizza') ||
                            lastMealLower.includes('burger') ||
                            lastMealLower.includes('fried') ||
                            lastMealLower.includes('heavy');
    
    const hoursSinceLastMeal = parseLastMealTime(request.lastMealTime);
    
    // Heaviness adjustment
    if (request.lastMealHeaviness === 'heavy' || isHeavyLastMeal) {
      // Heavy last meal: penalize high fat/sodium/calories
      if (calories > 600) lastMealFit -= 20;
      if (sodium > 1000) lastMealFit -= 15;
      if (fat > 30) lastMealFit -= 10;
    } else if (request.lastMealHeaviness === 'light') {
      // Light last meal: normal scoring
      lastMealFit = 50;
    }
    
    // Time since last meal adjustment
    if (hoursSinceLastMeal !== null) {
      if (hoursSinceLastMeal < 2) {
        // Very recent: prefer lighter
        if (calories < 500) lastMealFit += 15;
        else if (calories > 700) lastMealFit -= 20;
      } else if (hoursSinceLastMeal > 5) {
        // Long time: can handle heavier meals
        if (calories > 400) lastMealFit += 10;
      }
    }
    
    lastMealFit = Math.max(0, Math.min(100, lastMealFit));
  }
  
  // 5. Price within budget
  const priceFit = Math.max(0, 100 - ((price / request.budgetMax) * 50));
  
  // 6. Distance
  const distanceFit = Math.max(0, 100 - (distanceMiles * 10));
  
  // Calculate total score with priority weights
  // Priority: 1) Health, 2) Goal, 3) Time, 4) Last Meal, 5) Price, 6) Distance
  const total = 
    healthScore * 0.35 +
    goalFit * 0.25 +
    timeFit * 0.15 +
    lastMealFit * 0.10 +
    priceFit * 0.08 +
    distanceFit * 0.07;
  
  return {
    total: Math.round(total * 100) / 100,
    health: Math.round(healthScore * 100) / 100,
    goalFit: Math.round(goalFit * 100) / 100,
    timeFit: Math.round(timeFit * 100) / 100,
    lastMealFit: Math.round(lastMealFit * 100) / 100,
    priceFit: Math.round(priceFit * 100) / 100,
    distanceFit: Math.round(distanceFit * 100) / 100,
  };
}

/**
 * Generate "why" explanation for a recommendation
 */
export function generateWhyText(
  item: any,
  restaurant: any,
  request: RecommendationRequest,
  scores: ReturnType<typeof calculateContextAwareScores>
): string {
  const reasons: string[] = [];
  
  if (scores.health > 70) {
    reasons.push('excellent health score');
  }
  
  if (request.goal === 'high-protein' && item.protein > 25) {
    reasons.push(`high protein (${item.protein}g)`);
  } else if (request.goal === 'low-cal' && item.calories < 500) {
    reasons.push(`low calorie (${item.calories} cal)`);
  } else if (request.goal === 'low-carb' && (item.carbs || 0) < 30) {
    reasons.push('low carbohydrate');
  }
  
  if (scores.timeFit > 70) {
    reasons.push(`great for ${request.timeOfDay}`);
  }
  
  if (scores.lastMealFit > 60 && request.lastMeal) {
    reasons.push('complements your last meal well');
  }
  
  if (restaurant.rating && restaurant.rating > 4) {
    reasons.push('highly rated');
  }
  
  if (reasons.length === 0) {
    return `Good ${request.timeOfDay} option with balanced nutrition.`;
  }
  
  return reasons.slice(0, 2).join(' and ') + '.';
}

/**
 * Generate guidance preview and avoid chips
 */
export function generateContextGuidance(request: RecommendationRequest): {
  guidancePreview: string;
  avoidChips: string[];
} {
  const chips: string[] = [];
  const hour = new Date().getHours();
  const isLateDinner = request.timeOfDay === 'dinner' && hour >= 20;
  
  // Guidance preview
  let guidance = '';
  
  if (request.lastMeal && request.lastMealTime) {
    const lastMealLower = request.lastMeal.toLowerCase();
    const isHeavy = lastMealLower.includes('pizza') ||
                    lastMealLower.includes('burger') ||
                    lastMealLower.includes('fried') ||
                    lastMealLower.includes('heavy');
    const hoursSince = parseLastMealTime(request.lastMealTime);
    const isRecent = hoursSince !== null && hoursSince < 3;
    
    if (isHeavy && isRecent) {
      guidance = 'Last meal was heavy and recent → lighter, lower-sodium picks ranked higher.';
    }
  }
  
  if (!guidance && request.timeOfDay === 'lunch' && request.activityLevel === 'workout') {
    guidance = 'Lunch + workout → protein-forward balanced meals ranked higher.';
  }
  
  if (!guidance && isLateDinner) {
    guidance = 'Late dinner → lighter portions and lower sodium prioritized.';
  }
  
  if (!guidance) {
    guidance = 'Recommendations optimized for your goal and time of day.';
  }
  
  // Avoid chips
  if (isLateDinner || (request.timeOfDay === 'dinner' && hour >= 18)) {
    chips.push('very high sodium');
    chips.push('fried');
    chips.push('heavy portions');
  }
  
  if (request.lastMeal) {
    const lastMealLower = request.lastMeal.toLowerCase();
    const isHeavy = lastMealLower.includes('pizza') ||
                    lastMealLower.includes('burger') ||
                    lastMealLower.includes('fried') ||
                    lastMealLower.includes('heavy');
    const hoursSince = parseLastMealTime(request.lastMealTime);
    const isRecent = hoursSince !== null && hoursSince < 3;
    
    if (isHeavy || isRecent) {
      if (!chips.includes('heavy portions')) chips.push('heavy portions');
      if (!chips.includes('fried')) chips.push('fried');
    }
  }
  
  if (request.goal === 'low-cal') {
    if (!chips.includes('sugary drinks')) chips.push('sugary drinks');
    if (!chips.includes('fried')) chips.push('fried');
  }
  
  return {
    guidancePreview: guidance,
    avoidChips: chips.slice(0, 3),
  };
}

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
  
  itemsByName.forEach((candidatesForItem) => {
    const best = selectBestRestaurantForItem(candidatesForItem, userLat, userLng);
    deduplicated.push(best);
  });

  return deduplicated;
}

/**
 * Local ranking fallback when OpenAI fails
 */
export function localRankRecommendations(
  restaurants: any[],
  menuItems: any[],
  request: RecommendationRequest
): RecommendationResult[] {
  // Group menu items by restaurant
  const itemsByRestaurant = new Map<string, any[]>();
  menuItems.forEach((item) => {
    const restaurantId = item.restaurant_id;
    if (!itemsByRestaurant.has(restaurantId)) {
      itemsByRestaurant.set(restaurantId, []);
    }
    itemsByRestaurant.get(restaurantId)!.push(item);
  });

  // Prepare all candidates
  const allCandidates: Array<{ restaurant: any; item: any }> = [];
  restaurants.forEach((restaurant) => {
    const items = itemsByRestaurant.get(restaurant.id) || [];
    if (items.length === 0) return;
    items.forEach((item) => {
      allCandidates.push({ restaurant, item });
    });
  });

  // Deduplicate: if multiple restaurants have the same menu item, select the best one
  const deduplicatedCandidates = deduplicateMenuItems(
    allCandidates,
    request.lat,
    request.lng
  );

  // Score and rank all items
  const scored: Array<{
    restaurant: any;
    item: any;
    scores: ReturnType<typeof calculateContextAwareScores>;
  }> = [];

  deduplicatedCandidates.forEach(({ restaurant, item }) => {
    const scores = calculateContextAwareScores(item, restaurant, request);
    scored.push({
      restaurant,
      item,
      scores,
    });
  });

  // Sort by total score and take top candidates (limit to 60 as per requirements)
  scored.sort((a, b) => b.scores.total - a.scores.total);
  const topCandidates = scored.slice(0, 60);

  // Return top 8 with new format
  return topCandidates.slice(0, 8).map(({ restaurant, item, scores }) => ({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      rating: restaurant.rating,
      distanceMiles: restaurant.distanceMiles,
      deliveryTime: restaurant.delivery_time,
    },
    item: {
      id: item.id,
      name: item.name,
      price: item.price || 0,
      calories: item.calories,
      protein: item.protein,
      sodium_mg: item.sodium_mg,
      sugar: item.sugar,
      health_score: item.healthScore,
    },
    why: generateWhyText(item, restaurant, request, scores),
    scores,
  }));
}

