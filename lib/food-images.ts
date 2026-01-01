/**
 * Utility functions for fetching unique food images based on food names
 * Uses Pexels photo IDs for semantic, relevant images
 */

// Cache to store fetched image URLs to avoid repeated calculations
const imageCache = new Map<string, string>();

/**
 * Semantic mapping of food names to relevant Pexels photo IDs
 * Maps specific food items to appropriate food images
 */
const FOOD_NAME_TO_PHOTO_ID: Record<string, number> = {
  // Appetizers
  'mozzarella sticks': 35017889, // Crispy mozzarella sticks
  'onion rings': 18976848, // Close-up of onion rings
  'nachos': 7613435, // Nachos with salsa
  'edamame': 1640777, // Steamed soybeans (using generic healthy food)
  'chicken wings': 1640777,
  'bruschetta': 1640777,
  'spring rolls': 1640777,
  'garlic bread': 1640777,
  
  // Burgers - using hash-based selection for uniqueness
  'burger': 1633578,
  'classic burger': 1633578,
  'cheese burger': 1633578,
  'bacon burger': 1633578,
  'veggie burger': 1633578,
  'chicken burger': 1633578,
  'bbq burger': 1633578,
  'mushroom swiss burger': 1633578,
  'double deluxe burger': 1633578,
  
  // Pizza - using specific photo IDs for different types
  'pizza': 2147491,
  'margherita pizza': 30478775, // Artisanal Margherita pizza
  'pepperoni pizza': 803290, // Classic pepperoni pizza
  'hawaiian pizza': 2147491, // Generic pizza (will use hash for uniqueness)
  'vegetarian pizza': 2147491,
  'meat lovers pizza': 31300965, // Delicious pepperoni pizza with fresh ingredients
  'bbq chicken pizza': 2147491,
  'supreme pizza': 2147491,
  'white pizza': 2147491,
  
  // Pasta - using specific photo IDs for each dish type to ensure uniqueness
  'pasta': 11220209, // Generic pasta
  'spaghetti': 29039082, // Spaghetti carbonara
  'spaghetti carbonara': 29039082, // Spaghetti carbonara dish
  'fettuccine': 32640766, // Fettuccine alfredo (close-up)
  'fettuccine alfredo': 11220209, // Traditional Italian fettuccine alfredo
  'penne': 11654235, // Penne all'Amatriciana
  'penne arrabbiata': 31261500, // Vegetarian penne pasta (different from regular penne)
  'lasagna': 9586229, // Lasagna with cheese
  'ravioli': 11220209, // Generic pasta
  'mac & cheese': 11220209, // Generic pasta/cheese dish
  'penne vodka': 11654235, // Penne pasta
  'linguine': 11220209, // Generic pasta
  
  // Salads - using specific photo IDs for different types
  'salad': 1211887, // Will use hash from salads array
  'caesar salad': 6107787, // Close-up of Caesar salad (specific ID)
  'greek salad': 1211887, // Will use hash from salads array for uniqueness
  'cobb salad': 30700803, // Delicious Cobb salad (specific ID)
  'garden salad': 1211887, // Will use hash from salads array
  'caprese salad': 1211887, // Will use hash from salads array
  'asian salad': 1211887, // Will use hash from salads array
  'quinoa salad': 32640678, // Healthy vegetable salad with quinoa (specific ID)
  'spinach salad': 1211887, // Will use hash from salads array
  'grilled chicken salad': 1211887, // Salad with grilled chicken
  'chicken salad': 1211887, // Chicken salad
  
  // Sushi & Japanese - using hash for uniqueness within category
  'sushi': 1052189,
  'sashimi': 1052189,
  'salmon sashimi': 1052189,
  'dragon roll': 1052189, // Will use hash for uniqueness
  'ramen': 1907228,
  'tonkotsu ramen': 1907228,
  'miso ramen': 1907228,
  
  // Mexican - using specific photo IDs
  'tacos': 2087748,
  'beef tacos': 32335663, // Delicious Mexican enchiladas and tacos
  'chicken tacos': 2087748,
  'burrito': 29007122, // Delicious Mexican burrito with pico de gallo
  'chicken burrito': 31922719, // Appetizing chicken burrito
  
  // BBQ & Grilled - using specific photo IDs
  'bbq': 1640777, // Will use hash from bbq array
  'bbq ribs': 27599997, // Close-up of BBQ ribs
  'ribs': 27599997,
  'pulled pork': 1633578, // Will use hash from burgers array (similar to sandwich)
  'pulled pork sandwich': 1633578, // Will use hash from burgers array
  'grilled chicken': 1640777, // Will use hash from main courses array
  
  // Seafood - using specific photo IDs
  'salmon': 842142, // Grilled salmon fish on grilled vegetables
  'grilled salmon': 842142,
  'fish': 1052189,
  'fish & chips': 29617469, // Delicious seafood dish with grilled fish
  'shrimp': 29617469,
  'shrimp scampi': 29617469,
  
  // Desserts - using specific photo IDs for different types
  'dessert': 1028706,
  'cake': 32645232, // Decadent chocolate cake
  'chocolate cake': 31918529, // Chocolate cake and ice cream
  'cheesecake': 1028706, // Will use hash for uniqueness
  'ice cream': 1028706, // Will use hash for uniqueness
  'tiramisu': 28573151, // Delicious tiramisu with vanilla ice cream
  'brownie': 1028706, // Will use hash for uniqueness
  'apple pie': 1028706, // Will use hash for uniqueness
  'cookie': 1028706, // Will use hash for uniqueness
  'chocolate chip cookie': 1028706, // Will use hash for uniqueness
  'creme brulee': 1028706, // Will use hash for uniqueness
  'crème brûlée': 1028706, // Will use hash for uniqueness
  
  // Drinks - using hash for uniqueness within category
  'drink': 1435735, // Will use hash from drinks array
  'cola': 1435735, // Will use hash from drinks array
  'coca cola': 1435735, // Will use hash from drinks array
  'pepsi': 1435735, // Will use hash from drinks array
  'juice': 1435735, // Will use hash from drinks array
  'orange juice': 16416071, // Iced coffee and orange juice (specific ID)
  'lemonade': 1435735, // Will use hash from drinks array for uniqueness
  'iced tea': 16416071, // Iced tea (same as orange juice - will use hash for uniqueness)
  'coffee': 1435735, // Will use hash from drinks array
  'smoothie': 1435735, // Will use hash from drinks array
  'water': 1435735, // Will use hash from drinks array
  
  // Asian & Thai - these will use hash-based selection from main courses category
  'pad thai': 1640777, // Will use hash from main courses array
  'green curry': 1640777, // Will use hash from main courses array
  'curry': 1640777, // Will use hash from main courses array
  'chicken tikka masala': 1640777, // Will use hash from main courses array
  'vegetable curry': 1640777, // Will use hash from main courses array
  
  // French
  'coq au vin': 1640777, // Will use hash from main courses array
  
  // Other Main Courses
  'steak': 1640777, // Will use hash from main courses array
  'pork chops': 1640777, // Will use hash from main courses array
  'lamb chops': 1640777, // Will use hash from main courses array
  'soup': 1640777, // Will use hash from main courses array
};

/**
 * Category-based fallback mapping
 * Used when specific food name is not found
 */
const CATEGORY_TO_PHOTO_IDS: Record<string, number[]> = {
  'burgers': [1633578, 1639557, 1639562],
  'pizza': [2147491, 30478775, 803290, 31300965, 33951750, 32405090], // Multiple pizza types
  'pasta': [11220209, 29039082, 9586229, 11654235, 31261500, 32640766], // Correct pasta photo IDs
  'salads': [1211887, 6107787, 30700803, 32640678, 1211888, 1211889], // Multiple salad types
  'desserts': [1028706, 31918529, 28573151, 32645232, 33674414, 33674416], // Multiple dessert types
  'drinks': [1435735, 16416071, 1435736, 1435737, 1435738, 1435739], // Multiple drink types (expanded)
  'appetizers': [35017889, 18976848, 7613435, 1640777],
  'main courses': [1640777, 1907228, 2087748, 1052189, 842142, 27599997, 32335663, 29007122, 29617469], // Expanded with more variety
  'main': [1640777, 1907228, 2087748, 1052189, 842142, 27599997, 32335663, 29007122, 29617469], // Alias for 'main courses'
  'courses': [1640777, 1907228, 2087748, 1052189, 842142, 27599997, 32335663, 29007122, 29617469], // Alias for 'main courses'
  'sushi': [1052189, 1052190, 1052191],
  'mexican': [2087748, 32335663, 29007122, 31922719, 2087749, 2087750],
  'bbq': [27599997, 1640777, 1907228],
  'asian': [1907228, 1640777, 2087748],
  'seafood': [842142, 29617469, 1052189, 1052190],
};

/**
 * Generic fallback photo IDs for unknown foods
 */
const FALLBACK_PHOTO_IDS = [
  1633578, 2147491, 11220209, 1211887, 1028706, 1435735, 1640777, 1052189, 2087748, 1907228
];

/**
 * Normalize food name for lookup
 * Converts to lowercase and removes special characters
 */
function normalizeFoodName(foodName: string): string {
  return foodName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract category keywords from food name
 */
function extractCategoryKeywords(foodName: string): string[] {
  const normalized = normalizeFoodName(foodName);
  const keywords: string[] = [];
  
  // Check for category keywords
  const categoryKeywords = [
    'burger', 'pizza', 'pasta', 'salad', 'dessert', 'drink', 'appetizer',
    'sushi', 'sashimi', 'ramen', 'taco', 'burrito', 'nachos', 'curry',
    'bbq', 'ribs', 'chicken', 'salmon', 'fish', 'seafood', 'mexican',
    'asian', 'thai', 'japanese', 'italian', 'french'
  ];
  
  for (const keyword of categoryKeywords) {
    if (normalized.includes(keyword)) {
      keywords.push(keyword);
    }
  }
  
  // Special handling for Main Courses - if no specific category keyword found,
  // but it's a main dish (not a burger, pizza, pasta, salad, dessert, drink, appetizer)
  const mainCourseIndicators = ['tikka', 'masala', 'curry', 'ramen', 'pad thai', 'coq au vin', 
    'grilled', 'roasted', 'braised', 'steak', 'pork', 'lamb', 'ribs'];
  const isMainCourse = mainCourseIndicators.some(indicator => normalized.includes(indicator)) &&
    !keywords.some(k => ['burger', 'pizza', 'pasta', 'salad', 'dessert', 'drink', 'appetizer'].includes(k));
  
  if (isMainCourse) {
    keywords.push('main'); // Add 'main' keyword to help match 'main courses'
    keywords.push('courses'); // Also add 'courses' keyword
  }
  
  // Special handling for Drinks - add drink-related keywords
  if (normalized.includes('juice') || normalized.includes('tea') || normalized.includes('coffee') || 
      normalized.includes('smoothie') || normalized.includes('cola') || normalized.includes('lemonade')) {
    if (!keywords.includes('drink')) {
      keywords.push('drink'); // Ensure 'drink' keyword is present
    }
  }
  
  return keywords;
}

/**
 * Generate a deterministic hash from a string
 * Uses multiple hash algorithms combined for better uniqueness
 */
function hashString(str: string): number {
  let hash1 = 0;
  let hash2 = 5381; // DJB2 hash initial value
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1) + char;
    hash1 = hash1 & hash1;
    hash2 = ((hash2 << 5) + hash2) + char;
  }
  
  const combined = Math.abs(hash1) ^ Math.abs(hash2);
  const lengthFactor = str.length * 31;
  const firstChar = str.charCodeAt(0) || 0;
  const lastChar = str.charCodeAt(str.length - 1) || 0;
  
  return combined + lengthFactor + (firstChar * 17) + (lastChar * 23);
}

/**
 * Get a semantic, relevant image URL for a food item
 * Uses semantic mapping to match food names to appropriate images
 * 
 * @param foodName - The name of the food item
 * @param width - Image width (default: 400)
 * @param height - Image height (default: 400)
 * @returns A relevant image URL for the food item
 */
export function getFoodImageUrlSync(
  foodName: string,
  width: number = 400,
  height: number = 400
): string {
  // Check cache first
  const cacheKey = `${foodName}-${width}-${height}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  const normalizedName = normalizeFoodName(foodName);
  let photoId: number | null = null;
  let matchedCategory: string | null = null;

  // Step 1: Try exact match in semantic mapping
  if (FOOD_NAME_TO_PHOTO_ID[normalizedName]) {
    photoId = FOOD_NAME_TO_PHOTO_ID[normalizedName];
    // Check if this photo ID is shared by multiple items - if so, use hash for uniqueness
    const itemsWithSamePhoto = Object.entries(FOOD_NAME_TO_PHOTO_ID)
      .filter(([_, id]) => id === photoId);
    if (itemsWithSamePhoto.length > 1) {
      // Multiple items share this photo ID, use hash to select from category array
      const categoryKeywords = extractCategoryKeywords(foodName);
      let foundCategory = false;
      
      for (const keyword of categoryKeywords) {
        // Check all category keys to find one that matches the keyword and contains the photo ID
        for (const [category, ids] of Object.entries(CATEGORY_TO_PHOTO_IDS)) {
          if ((category.includes(keyword) || keyword.includes(category)) && ids.includes(photoId!)) {
            const hash = hashString(foodName);
            photoId = ids[Math.abs(hash) % ids.length];
            matchedCategory = category;
            foundCategory = true;
            break;
          }
        }
        if (foundCategory) break;
      }
      
      // If no category found but photo ID is shared, try to find any category containing this photo ID
      if (!foundCategory) {
        for (const [category, ids] of Object.entries(CATEGORY_TO_PHOTO_IDS)) {
          if (ids.includes(photoId!)) {
            // Check if any keyword matches this category
            for (const keyword of categoryKeywords) {
              if (category.includes(keyword) || keyword.includes(category)) {
                const hash = hashString(foodName);
                photoId = ids[Math.abs(hash) % ids.length];
                matchedCategory = category;
                foundCategory = true;
                break;
              }
            }
            if (foundCategory) break;
          }
        }
      }
    }
  } else {
    // Step 2: Try partial match (prioritize longer, more specific matches)
    // Sort keys by length (longest first) to match more specific terms first
    const sortedEntries = Object.entries(FOOD_NAME_TO_PHOTO_ID)
      .sort(([a], [b]) => b.length - a.length);
    
    for (const [key, id] of sortedEntries) {
      // Check if the normalized name contains the key (e.g., "fettuccine alfredo" contains "fettuccine alfredo")
      // or if the key contains the normalized name (for shorter names)
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        photoId = id;
        // Check if this photo ID is shared - if so, use hash for uniqueness
        const itemsWithSamePhoto = Object.entries(FOOD_NAME_TO_PHOTO_ID)
          .filter(([_, photoIdValue]) => photoIdValue === id);
        if (itemsWithSamePhoto.length > 1) {
          const categoryKeywords = extractCategoryKeywords(foodName);
          let foundCategory = false;
          
          for (const keyword of categoryKeywords) {
            // Check all category keys to find one that matches the keyword and contains the photo ID
            for (const [category, ids] of Object.entries(CATEGORY_TO_PHOTO_IDS)) {
              if ((category.includes(keyword) || keyword.includes(category)) && ids.includes(id)) {
                const hash = hashString(foodName);
                photoId = ids[Math.abs(hash) % ids.length];
                matchedCategory = category;
                foundCategory = true;
                break;
              }
            }
            if (foundCategory) break;
          }
          
          // If no category found but photo ID is shared, try to find any category containing this photo ID
          if (!foundCategory) {
            for (const [category, ids] of Object.entries(CATEGORY_TO_PHOTO_IDS)) {
              if (ids.includes(id)) {
                // Check if any keyword matches this category
                for (const keyword of categoryKeywords) {
                  if (category.includes(keyword) || keyword.includes(category)) {
                    const hash = hashString(foodName);
                    photoId = ids[Math.abs(hash) % ids.length];
                    matchedCategory = category;
                    foundCategory = true;
                    break;
                  }
                }
                if (foundCategory) break;
              }
            }
          }
        }
        break;
      }
    }
  }

  // Step 3: Try category-based fallback (only if no photo ID found yet)
  if (!photoId) {
    const categoryKeywords = extractCategoryKeywords(foodName);
    for (const keyword of categoryKeywords) {
      // Check category mappings
      for (const [category, ids] of Object.entries(CATEGORY_TO_PHOTO_IDS)) {
        if (category.includes(keyword) || keyword.includes(category)) {
          const hash = hashString(foodName);
          photoId = ids[Math.abs(hash) % ids.length];
          matchedCategory = category;
          break;
        }
      }
      if (photoId) break;
    }
  }

  // Step 4: Use hash-based fallback from generic list
  if (!photoId) {
    const hash = hashString(foodName);
    photoId = FALLBACK_PHOTO_IDS[Math.abs(hash) % FALLBACK_PHOTO_IDS.length];
  }
  
  // Construct Pexels image URL with the selected photo ID
  const imageUrl = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`;

  // Cache the result
  imageCache.set(cacheKey, imageUrl);
  
  return imageUrl;
}
