/**
 * External API Integration for Restaurant Discovery
 * Supports Google Places API and fallback options
 */

interface Restaurant {
  id: string;
  name: string;
  cuisine?: string;
  rating?: number;
  distanceMiles?: number;
  deliveryTime?: string;
  address?: string;
  phone?: string;
  imageUrl?: string;
  priceLevel?: number; // 0-4, where 4 is most expensive
  lat?: number;
  lng?: number;
}

interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  price: number;
  calories?: number;
  protein?: number;
  sodium_mg?: number;
  sugar?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  healthScore?: number;
  imageUrl?: string;
}

interface ExternalAPIResult {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
}

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_ENABLED = !!GOOGLE_PLACES_API_KEY;

/**
 * Convert meters to miles
 */
function metersToMiles(meters: number): number {
  return meters * 0.000621371;
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
 * Estimate calories and nutrition based on dish name and cuisine
 */
function estimateNutrition(
  dishName: string,
  cuisine: string,
  price: number
): {
  calories?: number;
  protein?: number;
  sodium_mg?: number;
  sugar?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
} {
  const name = dishName.toLowerCase();
  const cuisineLower = cuisine?.toLowerCase() || '';

  // Base estimates by dish type
  let calories = 400; // Default
  let protein = 20;
  let sodium = 600;
  let sugar = 10;
  let carbs = 40;
  let fat = 15;
  let fiber = 3;

  // Adjust based on keywords - prioritize high-protein items
  if (name.includes('grilled chicken') || name.includes('chicken breast')) {
    calories = 350;
    protein = 40; // Higher protein for grilled chicken
    carbs = 5;
    fat = 10;
  } else if (name.includes('grilled salmon') || name.includes('salmon')) {
    calories = 400;
    protein = 39; // High protein in salmon
    carbs = 0;
    fat = 18;
  } else if (name.includes('steak') || name.includes('beef')) {
    calories = 450;
    protein = 42; // High protein in steak
    carbs = 0;
    fat = 20;
  } else if (name.includes('turkey') || name.includes('turkey breast')) {
    calories = 300;
    protein = 35; // High protein in turkey
    carbs = 5;
    fat = 8;
  } else if (name.includes('tuna') || name.includes('fish')) {
    calories = 350;
    protein = 38; // High protein in fish
    carbs = 0;
    fat = 12;
  } else if (name.includes('salad') || name.includes('green')) {
    calories = 200;
    protein = 10;
    carbs = 15;
    fat = 8;
    fiber = 5;
  } else if (name.includes('burger') || name.includes('sandwich')) {
    calories = 600;
    protein = 25;
    carbs = 50;
    fat = 25;
  } else if (name.includes('pizza')) {
    calories = 300; // per slice estimate
    protein = 12;
    carbs = 35;
    fat = 12;
  } else if (name.includes('pasta') || name.includes('noodles')) {
    calories = 500;
    protein = 15;
    carbs = 70;
    fat = 12;
  } else if (name.includes('soup')) {
    calories = 150;
    protein = 8;
    carbs = 20;
    fat = 5;
    sodium = 800; // Soups are typically high in sodium
  } else if (name.includes('smoothie') || name.includes('juice')) {
    calories = 200;
    protein = 2;
    carbs = 45;
    sugar = 35;
    fiber = 2;
  }

  // Adjust based on cuisine
  if (cuisineLower.includes('indian') || cuisineLower.includes('curry')) {
    calories += 100;
    sodium += 300;
  } else if (cuisineLower.includes('chinese') || cuisineLower.includes('asian')) {
    calories += 50;
    sodium += 400;
  } else if (cuisineLower.includes('mexican') || cuisineLower.includes('taco')) {
    calories += 80;
    carbs += 15;
  }

  // Adjust based on price (more expensive = potentially larger portions)
  if (price > 20) {
    calories = Math.round(calories * 1.2);
    protein = Math.round(protein * 1.1);
  } else if (price < 10) {
    calories = Math.round(calories * 0.9);
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    sodium_mg: Math.round(sodium),
    sugar: Math.round(sugar),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fiber: Math.round(fiber),
  };
}

/**
 * Calculate health score based on estimated nutrition
 */
function calculateHealthScore(nutrition: {
  calories?: number;
  protein?: number;
  sodium_mg?: number;
  sugar?: number;
  fiber?: number;
}): number {
  const calories = nutrition.calories || 0;
  const protein = nutrition.protein || 0;
  const fiber = nutrition.fiber || 0;
  const sugar = nutrition.sugar || 0;
  const sodium = nutrition.sodium_mg || 0;

  let score = protein * 1.2;
  score += Math.max(0, (700 - calories) * 0.04);
  score += fiber * 2.5;
  score -= sodium * 0.02;
  score -= sugar * 0.9;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Fetch nearby restaurants using Google Places API
 */
async function fetchGooglePlacesRestaurants(
  latitude: number,
  longitude: number,
  radiusMiles: number,
  budgetMax: number,
  request?: {
    goal?: string;
    timeOfDay?: string;
    lastMeal?: string | null;
    lastMealTime?: string | null;
  }
): Promise<ExternalAPIResult> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('Google Places API key not configured');
  }

  const radiusMeters = Math.round(radiusMiles * 1609.34); // Convert miles to meters

  try {
    // Step 1: Search for nearby restaurants
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusMeters}&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`;

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`Google Places API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${searchData.status} - ${searchData.error_message || ''}`);
    }

    const places = searchData.results || [];

    // Step 2: Filter and process restaurants
    const restaurants: Restaurant[] = [];
    const menuItems: MenuItem[] = [];

    for (const place of places.slice(0, 20)) {
      // Calculate distance
      const distance = calculateDistance(
        latitude,
        longitude,
        place.geometry.location.lat,
        place.geometry.location.lng
      );

      // Filter by radius
      if (distance > radiusMiles) continue;

      // Estimate price level (Google uses 0-4, where 4 is most expensive)
      const priceLevel = place.price_level || 2;
      const estimatedAvgPrice = priceLevel === 0 ? 10 : priceLevel === 1 ? 15 : priceLevel === 2 ? 25 : priceLevel === 3 ? 40 : 60;

      // Filter by budget if price level suggests it's too expensive
      if (estimatedAvgPrice > budgetMax * 1.5) continue;

      const restaurant: Restaurant = {
        id: place.place_id,
        name: place.name,
        cuisine: place.types?.find((t: string) => 
          t.includes('restaurant') && !t.includes('food') && !t.includes('meal')
        )?.replace(/_/g, ' ') || place.types?.[0]?.replace(/_/g, ' ') || 'Restaurant',
        rating: place.rating || 0,
        distanceMiles: Math.round(distance * 10) / 10,
        address: place.vicinity || place.formatted_address,
        priceLevel: priceLevel,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        imageUrl: place.photos?.[0] 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
          : undefined,
      };

      // Estimate delivery time (based on distance)
      if (distance < 2) {
        restaurant.deliveryTime = '15-25 min';
      } else if (distance < 5) {
        restaurant.deliveryTime = '25-35 min';
      } else {
        restaurant.deliveryTime = '35-45 min';
      }

      restaurants.push(restaurant);

      // Step 3: Generate menu items for this restaurant
      // Since Google Places doesn't provide menu data, we'll generate suggestions
      const cuisine = restaurant.cuisine?.toLowerCase() || '';
      const menuSuggestions = generateMenuSuggestions(
        cuisine, 
        restaurant.name, 
        estimatedAvgPrice,
        request
      );

      menuSuggestions.forEach((suggestion, index) => {
        const nutrition = estimateNutrition(suggestion.name, cuisine, suggestion.price);
        const healthScore = calculateHealthScore(nutrition);

        const menuItem: MenuItem = {
          id: `${place.place_id}_${index}`,
          restaurant_id: place.place_id,
          name: suggestion.name,
          description: suggestion.description,
          price: suggestion.price,
          ...nutrition,
          healthScore,
        };

        menuItems.push(menuItem);
      });
    }

    return { restaurants, menuItems };
  } catch (error: any) {
    console.error('[External APIs] Google Places error:', error);
    throw error;
  }
}

/**
 * Check if restaurant name suggests a specific cuisine type
 */
function getRestaurantCuisineType(restaurantName: string, cuisine: string): string {
  // Normalize name - remove special characters and convert to lowercase
  const nameNormalized = restaurantName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  // Fast food chains - NO salmon, NO fancy items
  if (nameNormalized.includes('mcdonald')) return 'fast-food';
  if (nameNormalized.includes('burger king') || nameNormalized.includes('bk ')) return 'fast-food';
  if (nameNormalized.includes('wendy')) return 'fast-food';
  if (nameNormalized.includes('taco bell')) return 'mexican-fast-food';
  if (nameNormalized.includes('kfc') || nameNormalized.includes('kentucky')) return 'fast-food';
  if (nameNormalized.includes('subway')) return 'sandwich';
  if (nameNormalized.includes('pizza hut') || nameNormalized.includes('domino') || 
      nameNormalized.includes('papa john') || nameNormalized.includes('papa murphy')) return 'pizza-chain';
  if (nameNormalized.includes('goodcents') || nameNormalized.includes('good cents')) return 'sandwich';
  if (nameNormalized.includes('twisters')) return 'fast-food';
  if (nameNormalized.includes('quiktrip') || nameNormalized.includes('quick trip')) return 'fast-food';
  if (nameNormalized.includes('casey') && nameNormalized.includes('general')) return 'fast-food';
  if (nameNormalized.includes('7-eleven') || nameNormalized.includes('7 eleven')) return 'fast-food';
  if (nameNormalized.includes('waffle house')) return 'fast-food';
  if (nameNormalized.includes('taco john')) return 'mexican-fast-food';
  if (nameNormalized.includes('dairy queen')) return 'fast-food';
  if (nameNormalized.includes('kelley') && nameNormalized.includes('grill')) return 'american'; // Grill & Bar can have more variety
  
  // Pizza places
  if (nameNormalized.includes('pizza')) return 'pizza';
  
  // Mexican
  if (nameNormalized.includes('mexican') || nameNormalized.includes('taco') || nameNormalized.includes('burrito')) return 'mexican';
  
  // Asian
  if (nameNormalized.includes('chinese') || nameNormalized.includes('japanese') || nameNormalized.includes('thai') || 
      nameNormalized.includes('sushi') || nameNormalized.includes('asian')) return 'asian';
  
  // Italian
  if (nameNormalized.includes('italian') || nameNormalized.includes('pasta')) return 'italian';
  
  // Indian
  if (nameNormalized.includes('indian') || nameNormalized.includes('curry')) return 'indian';
  
  // Mediterranean/Greek
  if (nameNormalized.includes('mediterranean') || nameNormalized.includes('greek') || nameNormalized.includes('gyro')) return 'mediterranean';
  
  // Seafood
  if (nameNormalized.includes('seafood') || nameNormalized.includes('fish') || nameNormalized.includes('crab')) return 'seafood';
  
  // Use provided cuisine if no specific match
  return cuisine || 'american';
}

/**
 * Generate menu item suggestions based on cuisine, restaurant name, and user preferences
 */
function generateMenuSuggestions(
  cuisine: string,
  restaurantName: string,
  avgPrice: number,
  request?: {
    goal?: string;
    timeOfDay?: string;
    lastMeal?: string | null;
    lastMealTime?: string | null;
  }
): { name: string; description?: string; price: number }[] {
  const suggestions: { name: string; description?: string; price: number }[] = [];
  
  // Determine actual restaurant type - prioritize name over cuisine
  const restaurantType = getRestaurantCuisineType(restaurantName, cuisine);

  // Generate menu items based on ACTUAL restaurant type - ensure items match restaurant
  if (restaurantType === 'fast-food') {
    // Fast food chains - burgers, chicken sandwiches, salads, wraps (NO salmon, NO fancy items)
    suggestions.push(
      { name: 'Grilled Chicken Sandwich', description: 'Grilled chicken breast on bun', price: Math.round(avgPrice * 0.7) },
      { name: 'Grilled Chicken Salad', description: 'Mixed greens with grilled chicken', price: Math.round(avgPrice * 0.8) },
      { name: 'Chicken Wrap', description: 'Grilled chicken in tortilla wrap', price: Math.round(avgPrice * 0.75) },
      { name: 'Egg White Delight', description: 'Egg whites, turkey, cheese on English muffin', price: Math.round(avgPrice * 0.6) },
      { name: 'Grilled Chicken Nuggets', description: 'Grilled chicken pieces', price: Math.round(avgPrice * 0.65) },
      { name: 'Fruit & Yogurt Parfait', description: 'Yogurt with fresh fruit', price: Math.round(avgPrice * 0.5) },
      { name: 'Chicken Caesar Salad', description: 'Romaine, grilled chicken, parmesan', price: Math.round(avgPrice * 0.75) },
      { name: 'Turkey Club Sandwich', description: 'Turkey, bacon, lettuce, tomato', price: Math.round(avgPrice * 0.8) }
    );
  } else if (restaurantType === 'pizza-chain' || restaurantType === 'pizza') {
    // Pizza places - salads, wings, breadsticks (NO salmon, NO fancy entrees)
    suggestions.push(
      { name: 'Grilled Chicken Salad', description: 'Mixed greens with grilled chicken', price: Math.round(avgPrice * 0.8) },
      { name: 'Caesar Salad', description: 'Romaine lettuce, parmesan, croutons', price: Math.round(avgPrice * 0.7) },
      { name: 'Grilled Chicken Wings', description: 'Grilled chicken wings', price: Math.round(avgPrice * 0.9) },
      { name: 'Greek Salad', description: 'Tomatoes, cucumbers, olives, feta', price: Math.round(avgPrice * 0.7) },
      { name: 'Chicken Caesar Wrap', description: 'Chicken caesar in tortilla wrap', price: Math.round(avgPrice * 0.75) },
      { name: 'Vegetable Salad', description: 'Fresh mixed vegetables', price: Math.round(avgPrice * 0.6) },
      { name: 'Buffalo Chicken Salad', description: 'Grilled chicken, buffalo sauce, mixed greens', price: Math.round(avgPrice * 0.85) },
      { name: 'Antipasto Salad', description: 'Mixed greens, meats, cheeses', price: Math.round(avgPrice * 0.9) }
    );
  } else if (restaurantType === 'sandwich') {
    // Sandwich shops - subs, wraps, salads
    suggestions.push(
      { name: 'Turkey Breast Sub', description: 'Lean turkey on whole grain bread', price: Math.round(avgPrice * 0.85) },
      { name: 'Grilled Chicken Sub', description: 'Grilled chicken on whole grain bread', price: Math.round(avgPrice * 0.9) },
      { name: 'Grilled Chicken Salad', description: 'Mixed greens with grilled chicken', price: Math.round(avgPrice * 0.8) },
      { name: 'Turkey Wrap', description: 'Turkey breast in tortilla wrap', price: Math.round(avgPrice * 0.8) },
      { name: 'Veggie Delite Salad', description: 'Fresh vegetables and greens', price: Math.round(avgPrice * 0.7) },
      { name: 'Chicken & Veggie Wrap', description: 'Grilled chicken with vegetables', price: Math.round(avgPrice * 0.85) }
    );
  } else if (restaurantType === 'italian' || cuisine.includes('italian') || cuisine.includes('pizza')) {
    suggestions.push(
      { name: 'Margherita Pizza', description: 'Fresh mozzarella, tomato sauce, basil', price: Math.round(avgPrice * 0.8) },
      { name: 'Caesar Salad', description: 'Romaine lettuce, parmesan, croutons', price: Math.round(avgPrice * 0.6) },
      { name: 'Pasta Carbonara', description: 'Spaghetti, bacon, eggs, parmesan', price: Math.round(avgPrice * 0.9) },
      { name: 'Grilled Chicken Breast', description: 'Herb-marinated chicken with vegetables', price: Math.round(avgPrice * 1.1) },
      { name: 'Minestrone Soup', description: 'Vegetable soup with beans and pasta', price: Math.round(avgPrice * 0.5) }
    );
  } else if (cuisine.includes('asian') || cuisine.includes('chinese') || cuisine.includes('japanese') || cuisine.includes('thai')) {
    suggestions.push(
      { name: 'Chicken Teriyaki Bowl', description: 'Grilled chicken, rice, vegetables', price: Math.round(avgPrice * 0.9) },
      { name: 'Vegetable Spring Rolls', description: 'Fresh vegetables wrapped in rice paper', price: Math.round(avgPrice * 0.5) },
      { name: 'Miso Soup', description: 'Traditional Japanese soup', price: Math.round(avgPrice * 0.4) },
      { name: 'Pad Thai', description: 'Stir-fried noodles with vegetables', price: Math.round(avgPrice * 0.85) },
      { name: 'Steamed Dumplings', description: 'Pork and vegetable dumplings', price: Math.round(avgPrice * 0.7) }
    );
  } else if (cuisine.includes('mexican') || cuisine.includes('taco') || cuisine.includes('burrito')) {
    suggestions.push(
      { name: 'Grilled Chicken Burrito Bowl', description: 'Chicken, rice, beans, vegetables', price: Math.round(avgPrice * 0.9) },
      { name: 'Fresh Guacamole & Chips', description: 'Avocado dip with tortilla chips', price: Math.round(avgPrice * 0.5) },
      { name: 'Vegetable Quesadilla', description: 'Cheese and vegetables in tortilla', price: Math.round(avgPrice * 0.7) },
      { name: 'Chicken Tacos', description: 'Grilled chicken in soft tortillas', price: Math.round(avgPrice * 0.8) },
      { name: 'Black Bean Soup', description: 'Hearty bean soup with vegetables', price: Math.round(avgPrice * 0.6) }
    );
  } else if (cuisine.includes('indian') || cuisine.includes('curry')) {
    suggestions.push(
      { name: 'Chicken Tikka Masala', description: 'Creamy tomato curry with chicken', price: Math.round(avgPrice * 0.95) },
      { name: 'Vegetable Biryani', description: 'Spiced rice with mixed vegetables', price: Math.round(avgPrice * 0.85) },
      { name: 'Lentil Dal', description: 'Spiced lentil soup', price: Math.round(avgPrice * 0.6) },
      { name: 'Tandoori Chicken', description: 'Yogurt-marinated grilled chicken', price: Math.round(avgPrice * 1.0) },
      { name: 'Samosas', description: 'Spiced potato pastries', price: Math.round(avgPrice * 0.4) }
    );
  } else if (cuisine.includes('mediterranean') || cuisine.includes('greek') || cuisine.includes('middle eastern')) {
    suggestions.push(
      { name: 'Grilled Chicken Gyro', description: 'Chicken, vegetables, tzatziki in pita', price: Math.round(avgPrice * 0.9) },
      { name: 'Greek Salad', description: 'Tomatoes, cucumbers, olives, feta', price: Math.round(avgPrice * 0.7) },
      { name: 'Hummus & Pita', description: 'Chickpea dip with warm pita bread', price: Math.round(avgPrice * 0.5) },
      { name: 'Grilled Salmon', description: 'Fresh salmon with vegetables', price: Math.round(avgPrice * 1.2) },
      { name: 'Falafel Wrap', description: 'Chickpea fritters in pita with vegetables', price: Math.round(avgPrice * 0.8) }
    );
  } else if (restaurantType === 'seafood') {
    // Seafood restaurants - fish, salmon, shrimp, etc.
    suggestions.push(
      { name: 'Grilled Salmon', description: 'Fresh salmon with roasted vegetables', price: Math.round(avgPrice * 1.2) },
      { name: 'Grilled Fish', description: 'Fresh fish with vegetables', price: Math.round(avgPrice * 1.1) },
      { name: 'Tuna Salad', description: 'Fresh tuna with mixed greens', price: Math.round(avgPrice * 0.9) },
      { name: 'Grilled Shrimp Salad', description: 'Grilled shrimp with vegetables', price: Math.round(avgPrice * 1.0) },
      { name: 'Fish & Vegetables', description: 'Grilled fish with steamed vegetables', price: Math.round(avgPrice * 1.05) },
      { name: 'Seafood Salad Bowl', description: 'Mixed seafood with greens', price: Math.round(avgPrice * 1.1) }
    );
  } else {
    // Generic/American/Grill restaurants - can have salmon, steaks, etc.
    suggestions.push(
      { name: 'Grilled Chicken Salad', description: 'Mixed greens, grilled chicken, vegetables', price: Math.round(avgPrice * 0.9) },
      { name: 'Turkey Avocado Sandwich', description: 'Whole grain bread, turkey, avocado', price: Math.round(avgPrice * 0.85) },
      { name: 'Vegetable Soup', description: 'Seasonal vegetables in broth', price: Math.round(avgPrice * 0.6) },
      { name: 'Grilled Salmon', description: 'Fresh salmon with roasted vegetables', price: Math.round(avgPrice * 1.1) },
      { name: 'Quinoa Bowl', description: 'Quinoa, vegetables, protein option', price: Math.round(avgPrice * 0.9) },
      { name: 'Caesar Salad', description: 'Romaine, parmesan, croutons', price: Math.round(avgPrice * 0.7) },
      { name: 'Grilled Chicken Breast', description: 'Herb-marinated chicken with vegetables', price: Math.round(avgPrice * 1.0) },
      { name: 'Grilled Steak Salad', description: 'Lean steak, mixed greens', price: Math.round(avgPrice * 1.1) }
    );
  }

  // Filter and prioritize based on user goals
  let filteredSuggestions = suggestions;
  
  if (request?.goal) {
    // Filter suggestions based on goal
    if (request.goal === 'high-protein') {
      // Prioritize high-protein items, ensure variety
      const highProteinItems = [
        { name: 'Grilled Chicken Breast', description: 'Lean chicken with vegetables', price: Math.round(avgPrice * 1.0) },
        { name: 'Grilled Salmon', description: 'Fresh salmon with roasted vegetables', price: Math.round(avgPrice * 1.2) },
        { name: 'Turkey Breast Wrap', description: 'Lean turkey, whole grain wrap', price: Math.round(avgPrice * 0.9) },
        { name: 'Greek Chicken Bowl', description: 'Grilled chicken, quinoa, vegetables', price: Math.round(avgPrice * 1.0) },
        { name: 'Protein Power Bowl', description: 'Chicken, eggs, beans, vegetables', price: Math.round(avgPrice * 0.95) },
        { name: 'Grilled Steak Salad', description: 'Lean steak, mixed greens', price: Math.round(avgPrice * 1.1) },
        { name: 'Tuna Salad Bowl', description: 'Fresh tuna, vegetables, quinoa', price: Math.round(avgPrice * 0.9) },
        { name: 'Chicken & Rice Bowl', description: 'Grilled chicken, brown rice, vegetables', price: Math.round(avgPrice * 0.85) },
        { name: 'Beef & Broccoli Bowl', description: 'Lean beef with broccoli and vegetables', price: Math.round(avgPrice * 1.05) },
        { name: 'Egg White Scramble Bowl', description: 'Egg whites, vegetables, turkey', price: Math.round(avgPrice * 0.85) },
      ];
      // Filter high-protein items to match restaurant type (no salmon for fast-food/pizza)
      const restaurantTypeLower = restaurantType.toLowerCase();
      const nameLower = restaurantName.toLowerCase();
      const isFastFoodOrPizza = restaurantTypeLower === 'fast-food' || 
                               restaurantTypeLower === 'pizza-chain' || 
                               restaurantTypeLower === 'pizza' ||
                               restaurantTypeLower === 'sandwich' ||
                               nameLower.includes('mcdonald') ||
                               nameLower.includes('pizza hut') ||
                               nameLower.includes('papa murphy') ||
                               nameLower.includes('domino') ||
                               nameLower.includes('goodcents');
      
      const appropriateHighProteinItems = highProteinItems.filter(item => {
        const itemNameLower = item.name.toLowerCase();
        // Fast food/pizza chains shouldn't have salmon, steak, tuna, or fancy entrees
        if (isFastFoodOrPizza) {
          const isInappropriate = itemNameLower.includes('salmon') || 
                                 itemNameLower.includes('steak') || 
                                 itemNameLower.includes('tuna') ||
                                 itemNameLower.includes('beef') ||
                                 itemNameLower.includes('scramble');
          if (isInappropriate) {
            console.log('[DEBUG] Filtered out inappropriate item for', restaurantName, ':', item.name);
          }
          return !isInappropriate;
        }
        return true; // Other restaurants can have any high-protein items
      });
      
      // Remove duplicates from cuisine suggestions, then mix
      const cuisineItemsFiltered = suggestions.filter(s => 
        !appropriateHighProteinItems.some(hp => hp.name.toLowerCase() === s.name.toLowerCase())
      );
      
      // Combine and deduplicate to ensure no duplicate item names
      const combined = [...appropriateHighProteinItems, ...cuisineItemsFiltered];
      const seenNames = new Set<string>();
      const uniqueCombined = combined.filter(item => {
        const nameLower = item.name.toLowerCase();
        if (seenNames.has(nameLower)) {
          return false; // Skip duplicates
        }
        seenNames.add(nameLower);
        return true;
      });
      
      // Take 6-8 unique items for variety
      filteredSuggestions = uniqueCombined.slice(0, 8);
    } else if (request.goal === 'low-cal') {
      // Prioritize low-calorie items
      const lowCalItems = [
        { name: 'Grilled Chicken Salad', description: 'Mixed greens, grilled chicken', price: Math.round(avgPrice * 0.8) },
        { name: 'Vegetable Soup', description: 'Seasonal vegetables in broth', price: Math.round(avgPrice * 0.5) },
        { name: 'Greek Salad', description: 'Tomatoes, cucumbers, olives, feta', price: Math.round(avgPrice * 0.7) },
        { name: 'Caesar Salad', description: 'Romaine, parmesan, light dressing', price: Math.round(avgPrice * 0.7) },
        { name: 'Quinoa Salad Bowl', description: 'Quinoa, vegetables, light dressing', price: Math.round(avgPrice * 0.75) },
        { name: 'Miso Soup & Salad', description: 'Japanese soup with mixed greens', price: Math.round(avgPrice * 0.6) },
        { name: 'Vegetable Wrap', description: 'Fresh vegetables in whole grain wrap', price: Math.round(avgPrice * 0.7) },
        { name: 'Grilled Fish & Vegetables', description: 'Light fish with steamed vegetables', price: Math.round(avgPrice * 1.0) },
      ];
      // Combine and deduplicate
      const combinedLowCal = [...lowCalItems, ...suggestions];
      const seenNamesLowCal = new Set<string>();
      const uniqueLowCal = combinedLowCal.filter(item => {
        const nameLower = item.name.toLowerCase();
        if (seenNamesLowCal.has(nameLower)) return false;
        seenNamesLowCal.add(nameLower);
        return true;
      });
      filteredSuggestions = uniqueLowCal.slice(0, 8);
    } else if (request.goal === 'low-carb') {
      // Prioritize low-carb items
      const lowCarbItems = [
        { name: 'Grilled Chicken & Vegetables', description: 'Chicken with non-starchy vegetables', price: Math.round(avgPrice * 1.0) },
        { name: 'Caesar Salad with Chicken', description: 'Romaine, chicken, parmesan, no croutons', price: Math.round(avgPrice * 0.9) },
        { name: 'Grilled Salmon & Asparagus', description: 'Salmon with asparagus and vegetables', price: Math.round(avgPrice * 1.2) },
        { name: 'Steak & Broccoli', description: 'Grilled steak with broccoli', price: Math.round(avgPrice * 1.1) },
        { name: 'Greek Salad with Grilled Chicken', description: 'Greek salad with protein', price: Math.round(avgPrice * 0.95) },
        { name: 'Cobb Salad', description: 'Mixed greens, eggs, bacon, avocado', price: Math.round(avgPrice * 0.9) },
        { name: 'Grilled Chicken Caesar', description: 'Chicken, romaine, parmesan', price: Math.round(avgPrice * 0.9) },
        { name: 'Protein Bowl', description: 'Chicken, vegetables, no grains', price: Math.round(avgPrice * 0.95) },
      ];
      // Combine and deduplicate
      const combinedLowCarb = [...lowCarbItems, ...suggestions];
      const seenNamesLowCarb = new Set<string>();
      const uniqueLowCarb = combinedLowCarb.filter(item => {
        const nameLower = item.name.toLowerCase();
        if (seenNamesLowCarb.has(nameLower)) return false;
        seenNamesLowCarb.add(nameLower);
        return true;
      });
      filteredSuggestions = uniqueLowCarb.slice(0, 8);
    }
  }
  
  // Adjust for last meal context (lighter options if recent heavy meal)
  if (request?.lastMeal && request?.lastMealTime) {
    const lastMealLower = request.lastMeal.toLowerCase();
    const isHeavy = lastMealLower.includes('pizza') || 
                    lastMealLower.includes('burger') || 
                    lastMealLower.includes('fried') || 
                    lastMealLower.includes('heavy');
    
    // Parse time (simple check for "h" or "m")
    const timeMatch = request.lastMealTime.match(/(\d+)\s*(h|m)/i);
    const isRecent = timeMatch && (
      (timeMatch[2].toLowerCase().startsWith('h') && parseInt(timeMatch[1]) < 3) ||
      (timeMatch[2].toLowerCase().startsWith('m') && parseInt(timeMatch[1]) < 180)
    );
    
    if (isHeavy && isRecent) {
      // Filter to lighter options
      filteredSuggestions = filteredSuggestions.filter(s => {
        const name = s.name.toLowerCase();
        return !name.includes('pizza') && 
               !name.includes('burger') && 
               !name.includes('fried') &&
               !name.includes('heavy') &&
               (name.includes('salad') || 
                name.includes('soup') || 
                name.includes('grilled') ||
                name.includes('bowl') ||
                name.includes('wrap'));
      });
      
      // Add more light options if filtered too much
      if (filteredSuggestions.length < 4) {
        const lightOptions = [
          { name: 'Mixed Green Salad', description: 'Fresh greens with light dressing', price: Math.round(avgPrice * 0.6) },
          { name: 'Vegetable Soup', description: 'Light vegetable broth', price: Math.round(avgPrice * 0.5) },
          { name: 'Grilled Chicken Salad', description: 'Light salad with grilled chicken', price: Math.round(avgPrice * 0.8) },
          { name: 'Quinoa Bowl', description: 'Light quinoa with vegetables', price: Math.round(avgPrice * 0.75) },
        ];
        filteredSuggestions = [...lightOptions, ...filteredSuggestions].slice(0, 8);
      }
    }
  }

  // Final filter: Remove inappropriate items based on restaurant type
  // Use normalized name matching to catch all variations
  const nameNormalizedFinal = restaurantName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const restaurantTypeLower = restaurantType.toLowerCase();
  
  const isFastFoodOrPizza = restaurantTypeLower === 'fast-food' || 
                             restaurantTypeLower === 'pizza-chain' || 
                             restaurantTypeLower === 'pizza' ||
                             restaurantTypeLower === 'sandwich' ||
                             nameNormalizedFinal.includes('mcdonald') ||
                             nameNormalizedFinal.includes('pizza hut') ||
                             nameNormalizedFinal.includes('papa murphy') ||
                             nameNormalizedFinal.includes('domino') ||
                             nameNormalizedFinal.includes('goodcents') ||
                             nameNormalizedFinal.includes('subway') ||
                             nameNormalizedFinal.includes('quiktrip') ||
                             nameNormalizedFinal.includes('7 eleven') ||
                             nameNormalizedFinal.includes('waffle house') ||
                             nameNormalizedFinal.includes('taco john') ||
                             nameNormalizedFinal.includes('dairy queen') ||
                             nameNormalizedFinal.includes('casey');
  
  // Remove inappropriate items for fast-food/pizza chains
  let finalFilteredSuggestions = filteredSuggestions;
  if (isFastFoodOrPizza) {
    finalFilteredSuggestions = filteredSuggestions.filter(s => {
      const itemNameLower = s.name.toLowerCase();
      const isInappropriate = itemNameLower.includes('salmon') || 
                             itemNameLower.includes('steak') || 
                             itemNameLower.includes('tuna') ||
                             (itemNameLower.includes('beef') && !itemNameLower.includes('broccoli')) ||
                             itemNameLower.includes('scramble') ||
                             itemNameLower.includes('quinoa bowl'); // Fast food typically doesn't have quinoa bowls
      return !isInappropriate;
    });
  }
  
  // Ensure prices are within reasonable range and remove duplicates by name
  // Use a Set to track seen names for more efficient deduplication
  const seenItemNames = new Set<string>();
  const uniqueSuggestions = finalFilteredSuggestions
    .map(s => ({
      ...s,
      price: Math.max(5, Math.min(50, s.price)) // Clamp between $5 and $50
    }))
    .filter(s => {
      const nameLower = s.name.toLowerCase().trim();
      // Remove exact duplicates (case-insensitive)
      if (seenItemNames.has(nameLower)) {
        return false; // Duplicate found
      }
      seenItemNames.add(nameLower);
      return true;
    });
  
  // Return 6-8 diverse suggestions, ensuring variety
  const finalSuggestions = uniqueSuggestions.slice(0, 8);
  
  // Final validation: ensure no duplicates in returned suggestions
  const finalNames = new Set<string>();
  const validatedSuggestions = finalSuggestions.filter(s => {
    const nameLower = s.name.toLowerCase().trim();
    if (finalNames.has(nameLower)) {
      console.warn('[Menu Generation] Duplicate item detected in final suggestions:', s.name);
      return false;
    }
    finalNames.add(nameLower);
    return true;
  });
  
  return validatedSuggestions;
}

/**
 * Main function to fetch nearby restaurants and menu items
 * Uses Google Places API if available, otherwise returns empty results
 */
export async function getNearbyRestaurantsAndMenuItems(
  latitude: number,
  longitude: number,
  radiusMiles: number,
  budgetMax: number,
  request?: {
    goal?: string;
    timeOfDay?: string;
    lastMeal?: string | null;
    lastMealTime?: string | null;
  }
): Promise<ExternalAPIResult> {
  console.log('[External APIs] Fetching restaurants:', {
    lat: latitude,
    lng: longitude,
    radius: radiusMiles,
    budget: budgetMax,
    hasGooglePlaces: GOOGLE_PLACES_ENABLED
  });

  if (GOOGLE_PLACES_ENABLED) {
    try {
      return await fetchGooglePlacesRestaurants(latitude, longitude, radiusMiles, budgetMax, request);
    } catch (error: any) {
      console.error('[External APIs] Google Places failed:', error);
      // Return empty results instead of throwing to allow fallback
      return { restaurants: [], menuItems: [] };
    }
  }

  // No external API configured
  console.warn('[External APIs] No external API configured. Set GOOGLE_PLACES_API_KEY to enable restaurant discovery.');
  return { restaurants: [], menuItems: [] };
}

