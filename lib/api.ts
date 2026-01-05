/**
 * External APIs (compact)
 * - Google Places (restaurants)
 * - USDA (nutrition)
 * - OSM Nominatim (reverse geocode)
 */

import { ExternalAPIResult, MenuItem, NormalizedFood, Request, Restaurant } from '@/type';

const env = (...keys: string[]) => keys.map(k => process.env[k]).find(Boolean) || '';

const KEYS = {
  google: env('GOOGLE_PLACES_API_KEY', 'EXPO_PUBLIC_GOOGLE_PLACES_API_KEY'),
  usda: env('USDA_API_KEY', 'EXPO_PUBLIC_USDA_API_KEY'),
  hf: env('HUGGINGFACE_API_KEY', 'HUGGING_FACE_API_KEY', 'EXPO_PUBLIC_HUGGINGFACE_API_KEY', 'EXPO_PUBLIC_HUGGING_FACE_API_KEY'),
  hfModel: env('HUGGINGFACE_MODEL') || 'mistralai/Mistral-7B-Instruct-v0.2',
};

export const isGooglePlacesAvailable = () => !!KEYS.google;
export const isUSDAAvailable = () => !!KEYS.usda;
export const isHuggingFaceAvailable = () => !!KEYS.hf;

/** ---------- tiny TTL cache ---------- */
const ttlCache = <T>() => {
  const m = new Map<string, { v: T; t: number }>();
  const get = (k: string, ttlMs: number) => {
    const hit = m.get(k);
    if (!hit) return undefined;
    if (Date.now() - hit.t > ttlMs) return void m.delete(k);
    return hit.v;
  };
  const set = (k: string, v: T) => m.set(k, { v, t: Date.now() });
  const clear = () => m.clear();
  return { get, set, clear, _m: m };
};

/** ---------- USDA ---------- */
const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';
const USDA_TTL = 60 * 60 * 1000;
const usdaCache = ttlCache<any>();

const NUTRIENT_MAP: Record<number, keyof Pick<NormalizedFood, 'calories'|'protein'|'carbs'|'fat'|'fiber'|'sodium'|'sugar'>> = {
  1008: 'calories',
  1003: 'protein',
  1005: 'carbs',
  1004: 'fat',
  1079: 'fiber',
  1093: 'sodium',
  2000: 'sugar',
};

async function usdaFetch<T>(path: string): Promise<T | null> {
  if (!KEYS.usda) return null;
  const url = `${USDA_BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${KEYS.usda}`;
  const cached = usdaCache.get(url, USDA_TTL);
  if (cached) return cached as T;

  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const json = await r.json();
    usdaCache.set(url, json);
    return json as T;
  } catch {
    return null;
  }
}

function normalizeFood(food: any): NormalizedFood {
  const n: any = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (const x of food.foodNutrients || []) {
    const field = NUTRIENT_MAP[x.nutrientId];
    if (!field || x.value == null) continue;
    let v = x.value;
    if (field === 'sodium' && String(x.unitName || '').toLowerCase() === 'g') v *= 1000;
    n[field] = Math.round(v * 100) / 100;
  }

  return {
    id: String(food.fdcId),
    name: food.description || 'Unknown Food',
    brand: food.brandOwner || undefined,
    ingredients: food.ingredients || undefined,
    calories: Math.round(n.calories || 0),
    protein: Math.round((n.protein || 0) * 100) / 100,
    carbs: Math.round((n.carbs || 0) * 100) / 100,
    fat: Math.round((n.fat || 0) * 100) / 100,
    fiber: n.fiber ?? undefined,
    sodium: n.sodium ?? undefined,
    sugar: n.sugar ?? undefined,
  };
}

export async function searchFoods(query: string, pageSize = 10): Promise<NormalizedFood[]> {
  const data = await usdaFetch<any>(
    `/foods/search?query=${encodeURIComponent(query)}&pageSize=${Math.min(pageSize, 200)}&dataType=Foundation,SR%20Legacy`
  );
  return (data?.foods || []).map(normalizeFood);
}

export async function getFoodDetails(fdcId: number | string): Promise<NormalizedFood | null> {
  const id = Number(fdcId);
  if (!Number.isFinite(id)) return null;
  const food = await usdaFetch<any>(`/food/${id}`);
  return food ? normalizeFood(food) : null;
}

/** ---------- Google Places ---------- */
export async function fetchNearbyRestaurants(
  latitude: number,
  longitude: number,
  radiusMiles: number,
  budgetMax: number,
  request?: { goal?: string; timeOfDay?: string; lastMeal?: string | null; lastMealTime?: string | null }
): Promise<{ restaurants: Restaurant[]; menuItems: MenuItem[] }> {
  if (!KEYS.google) return { restaurants: [], menuItems: [] };

  const radiusMeters = Math.round(radiusMiles * 1609.34);

  try {
    const nearbyUrl =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${latitude},${longitude}&radius=${radiusMeters}&type=restaurant&key=${KEYS.google}`;

    const r = await fetch(nearbyUrl);
    if (!r.ok) return { restaurants: [], menuItems: [] };
    const data = await r.json();

    const places = (data.results || []).slice(0, 20);
    const restaurants: Restaurant[] = [];
    const menuItems: MenuItem[] = [];

    for (const p of places) {
      const dist = calculateDistance(latitude, longitude, p.geometry.location.lat, p.geometry.location.lng);
      if (dist > radiusMiles) continue;

      const priceLevel = p.price_level || 2;
      const estimatedAvgPrice = [10, 15, 25, 40, 60][priceLevel] || 25;
      if (estimatedAvgPrice > budgetMax * 1.5) continue;

      let website: string | undefined;
      try {
        const detailsUrl =
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=website&key=${KEYS.google}`;
        const dr = await fetch(detailsUrl);
        if (dr.ok) {
          const dd = await dr.json();
          website = dd?.result?.website || undefined;
        }
      } catch {}

      const cuisine =
        p.types?.find((t: string) => t.includes('restaurant') && !t.includes('food'))?.replace(/_/g, ' ') || 'Restaurant';

      const restaurant: Restaurant = {
        id: p.place_id,
        name: p.name,
        cuisine,
        rating: p.rating || 0,
        distanceMiles: Math.round(dist * 10) / 10,
        address: p.vicinity || p.formatted_address,
        website,
        priceLevel,
        lat: p.geometry.location.lat,
        lng: p.geometry.location.lng,
        imageUrl: p.photos?.[0]
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${KEYS.google}`
          : undefined,
        deliveryTime: dist < 2 ? '15-25 min' : dist < 5 ? '25-35 min' : '35-45 min',
      };

      restaurants.push(restaurant);

      const suggestions = generateMenuSuggestions(cuisine.toLowerCase(), restaurant.name, estimatedAvgPrice);
      for (let i = 0; i < suggestions.length; i++) {
        const s = suggestions[i];
        const nutrition = await getNutritionData(s.name, cuisine, s.price);
        menuItems.push({
          $id: `${p.place_id}_${i}`,
          id: `${p.place_id}_${i}`,
          restaurant_id: p.place_id,
          name: s.name,
          description: s.description,
          price: s.price,
          image_url: '',
          ...nutrition,
          health_score: 0,
        });
      }
    }

    return { restaurants, menuItems };
  } catch {
    return { restaurants: [], menuItems: [] };
  }
}

/** ---------- Nutrition fallback ---------- */
async function getNutritionData(dishName: string, cuisine: string, price: number) {
  if (isUSDAAvailable()) {
    const r = await searchFoods(dishName, 5);
    if (r[0]) {
      const f = r[0];
      const mult = price > 20 ? 1.2 : price < 10 ? 0.9 : 1.0;
      return {
        calories: f.calories ? Math.round(f.calories * mult) : undefined,
        protein: f.protein ? Math.round(f.protein * mult) : undefined,
        sodium_mg: f.sodium ? Math.round(f.sodium * mult) : undefined,
        sugar: f.sugar ? Math.round(f.sugar * mult) : undefined,
        carbs: f.carbs ? Math.round(f.carbs * mult) : undefined,
        fat: f.fat ? Math.round(f.fat * mult) : undefined,
        fiber: f.fiber ? Math.round(f.fiber * mult) : undefined,
      };
    }
  }
  return estimateNutrition(dishName, cuisine, price);
}

function estimateNutrition(dishName: string, _cuisine: string, price: number) {
  const n = dishName.toLowerCase();
  let cal = 400, prot = 20, sod = 600, sug = 10, carb = 40, fat = 15, fib = 3;

  if (n.includes('salad')) { cal = 200; prot = 10; carb = 15; fat = 8; fib = 5; }
  else if (n.includes('burger')) { cal = 600; prot = 25; carb = 50; fat = 25; }
  else if (n.includes('grilled chicken')) { cal = 350; prot = 40; carb = 5; fat = 10; }
  else if (n.includes('salmon')) { cal = 400; prot = 39; carb = 0; fat = 18; }
  else if (n.includes('pasta')) { cal = 500; prot = 15; carb = 70; fat = 12; }

  if (price > 20) { cal = Math.round(cal * 1.2); prot = Math.round(prot * 1.1); }
  return { calories: cal, protein: prot, sodium_mg: sod, sugar: sug, carbs: carb, fat, fiber: fib };
}

function generateMenuSuggestions(_cuisine: string, _restaurantName: string, avgPrice: number) {
  const items = [
    { name: 'Grilled Chicken Salad', description: 'Mixed greens, grilled chicken', price: Math.round(avgPrice * 0.8) },
    { name: 'Caesar Salad', description: 'Romaine, parmesan, croutons', price: Math.round(avgPrice * 0.7) },
    { name: 'Grilled Salmon', description: 'Fresh salmon with vegetables', price: Math.round(avgPrice * 1.2) },
    { name: 'Turkey Wrap', description: 'Turkey breast in tortilla wrap', price: Math.round(avgPrice * 0.8) },
    { name: 'Quinoa Bowl', description: 'Quinoa, vegetables, protein', price: Math.round(avgPrice * 0.9) },
  ];
  return items.slice(0, 8);
}

/** ---------- Images (removed - no external image services) ---------- */
export async function fetchFoodImage(_foodName: string): Promise<string> {
  return '';
}

/** ---------- Location (OSM reverse) ---------- */
const locCache = ttlCache<string>();
const LOC_TTL = 7 * 24 * 60 * 60 * 1000;

export async function getLocationName(lat: number, lng: number): Promise<string | null> {
  const k = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = locCache.get(k, LOC_TTL);
  if (cached) return cached;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`;
    const r = await fetch(url, { headers: { 'User-Agent': 'MealHop/1.0' } });
    if (!r.ok) return null;
    const data = await r.json();

    const a = data?.address || {};
    const city = a.city || a.town || a.village;
    const state = a.state;
    const name = city && state ? `Near ${city}, ${state}` : city || state || null;

    if (name) locCache.set(k, name);
    return name;
  } catch {
    return null;
  }
}

export function formatCoordinates(lat: number, lng: number) {
  if (lat >= 37 && lat <= 40 && lng >= -102 && lng <= -94.6) return 'Near Kansas, USA';
  if (lat >= 40.5 && lat <= 40.9 && lng >= -74.1 && lng <= -73.7) return 'Near New York, NY';
  return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
}

export async function getLocationDisplayName(lat: number, lng: number) {
  return (await getLocationName(lat, lng)) || formatCoordinates(lat, lng);
}

/** ---------- Utils ---------- */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function clearAllCaches() {
  usdaCache.clear();
  locCache.clear();
}

// ============================================================================
// External APIs Integration (merged from external-apis.ts)
// ============================================================================

const milesToMeters = (m: number) => Math.round(m * 1609.34);
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/** ---------- nutrition (from external-apis.ts) ---------- */
async function getNutritionDataExternal(dishName: string, _cuisine: string, price: number) {
  if (isUSDAAvailable()) {
    try {
      const [hit] = await searchFoods(dishName, 5);
      if (hit?.calories || hit?.protein) {
        const mult = price > 20 ? 1.2 : price < 10 ? 0.9 : 1.0;
        return {
          calories: hit.calories ? Math.round(hit.calories * mult) : undefined,
          protein: hit.protein ? Math.round(hit.protein * mult) : undefined,
          sodium_mg: hit.sodium ? Math.round(hit.sodium * mult) : undefined,
          sugar: hit.sugar ? Math.round(hit.sugar * mult) : undefined,
          carbs: hit.carbs ? Math.round(hit.carbs * mult) : undefined,
          fat: hit.fat ? Math.round(hit.fat * mult) : undefined,
          fiber: hit.fiber ? Math.round(hit.fiber * mult) : undefined,
        };
      }
    } catch {}
  }
  return estimateNutritionExternal(dishName, price);
}

function estimateNutritionExternal(dishName: string, price: number) {
  const n = dishName.toLowerCase();
  let calories = 400, protein = 20, sodium = 600, sugar = 10, carbs = 40, fat = 15, fiber = 3;

  if (n.includes('salad')) { calories = 200; protein = 10; carbs = 15; fat = 8; fiber = 5; }
  else if (n.includes('burger') || n.includes('sandwich')) { calories = 600; protein = 25; carbs = 50; fat = 25; }
  else if (n.includes('pizza')) { calories = 300; protein = 12; carbs = 35; fat = 12; }
  else if (n.includes('pasta') || n.includes('noodle')) { calories = 500; protein = 15; carbs = 70; fat = 12; }
  else if (n.includes('soup')) { calories = 150; protein = 8; carbs = 20; fat = 5; sodium = 800; }
  else if (n.includes('salmon')) { calories = 400; protein = 39; carbs = 0; fat = 18; }
  else if (n.includes('chicken')) { calories = 350; protein = 40; carbs = 5; fat = 10; }

  if (price > 20) { calories = Math.round(calories * 1.2); protein = Math.round(protein * 1.1); }
  if (price < 10) calories = Math.round(calories * 0.9);

  return { calories, protein, sodium_mg: sodium, sugar, carbs, fat, fiber };
}

function healthScoreExternal(n: { calories?: number; protein?: number; sodium_mg?: number; sugar?: number; fiber?: number }) {
  const cal = n.calories ?? 0, pro = n.protein ?? 0, sod = n.sodium_mg ?? 0, sug = n.sugar ?? 0, fib = n.fiber ?? 0;
  let s = 35;
  s += Math.min(30, pro * 1.0);
  s += cal ? (cal <= 300 ? 15 : cal <= 500 ? 8 : cal <= 700 ? 0 : -10) : 0;
  s += Math.min(12, fib * 2.5);
  s -= sod > 1500 ? 20 : sod > 1200 ? 14 : sod > 1000 ? 10 : sod > 800 ? 6 : 0;
  s -= sug > 30 ? 20 : sug > 20 ? 14 : sug > 15 ? 8 : sug > 10 ? 4 : 0;
  return clamp(Math.round(s), 0, 100);
}

/** ---------- menu suggestions (data-driven) ---------- */

interface Suggestion {
  name: string;
  description: string;
  price: number;
}

const BASE: Suggestion[] = [
  { name: 'Grilled Chicken Salad', description: 'Mixed greens, grilled chicken', price: 0.8 },
  { name: 'Caesar Salad', description: 'Romaine, parmesan, croutons', price: 0.7 },
  { name: 'Turkey Wrap', description: 'Turkey in tortilla wrap', price: 0.8 },
  { name: 'Quinoa Bowl', description: 'Quinoa, vegetables, protein', price: 0.9 },
  { name: 'Grilled Salmon', description: 'Salmon with vegetables', price: 1.2 },
];

const GOAL_PRESETS: Record<string, Suggestion[]> = {
  'high-protein': [
    { name: 'Grilled Chicken Breast', description: 'Lean chicken with vegetables', price: 1.0 },
    { name: 'Protein Power Bowl', description: 'Protein + veggies + grains', price: 1.0 },
    { name: 'Turkey Breast Wrap', description: 'Lean turkey wrap', price: 0.9 },
  ],
  'low-calorie': [
    { name: 'Mixed Green Salad', description: 'Fresh greens, light dressing', price: 0.6 },
    { name: 'Vegetable Soup', description: 'Light vegetable broth', price: 0.5 },
  ],
  'low-carb': [
    { name: 'Grilled Chicken & Vegetables', description: 'Chicken with veggies', price: 1.0 },
    { name: 'Greek Salad with Chicken', description: 'Salad + protein', price: 0.95 },
  ],
};

function cuisineHint(name: string) {
  const n = name.toLowerCase();
  if (/mcdonald|burger king|wendy|kfc|dairy queen|7[- ]?eleven|waffle house|quik\s?trip|taco bell|taco john/i.test(n)) return 'fast-food';
  if (/subway|goodcents/i.test(n)) return 'sandwich';
  if (/pizza hut|domino|papa john|papa murphy|pizza/i.test(n)) return 'pizza';
  return '';
}

function buildSuggestions(cuisine: string, restaurantName: string, avgPrice: number, req?: Request): Suggestion[] {
  const type = cuisineHint(restaurantName) || cuisine;
  const goal = req?.goal && GOAL_PRESETS[req.goal] ? GOAL_PRESETS[req.goal] : [];
  const list = [...goal, ...BASE];

  // fast-food/pizza: avoid fancy proteins
  const isFast = /fast-food|pizza|sandwich/.test(type.toLowerCase());
  const filtered = isFast
    ? list.filter(s => !/salmon|steak|tuna|scramble/i.test(s.name))
    : list;

  // make prices real + unique
  const seen = new Set<string>();
  return filtered
    .map(s => ({ ...s, price: clamp(Math.round(avgPrice * s.price), 5, 50) }))
    .filter(s => {
      const k = s.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 8);
}

/** ---------- google places (from external-apis.ts) ---------- */
async function fetchGooglePlacesRestaurants(
  latitude: number,
  longitude: number,
  radiusMiles: number,
  budgetMax: number,
  req?: Request
): Promise<ExternalAPIResult> {
  if (!KEYS.google) throw new Error('Google Places API key not configured');

  const radius = milesToMeters(radiusMiles);
  const url =
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${latitude},${longitude}&radius=${radius}&type=restaurant&key=${KEYS.google}`;

  const r = await fetch(url);
  if (!r.ok) return { restaurants: [], menuItems: [] };
  const data = await r.json();

  const places = (data.results || []).slice(0, 20);
  const restaurants: Restaurant[] = [];
  const menuItems: MenuItem[] = [];

  for (const p of places) {
    const dist = haversineMiles(latitude, longitude, p.geometry.location.lat, p.geometry.location.lng);
    if (dist > radiusMiles) continue;

    const priceLevel = p.price_level || 2;
    const avgPrice = [10, 15, 25, 40, 60][priceLevel] || 25;
    if (avgPrice > budgetMax * 1.5) continue;

    const cuisine =
      p.types?.find((t: string) => t.includes('restaurant') && !t.includes('food') && !t.includes('meal'))?.replace(/_/g, ' ')
      || p.types?.[0]?.replace(/_/g, ' ')
      || 'Restaurant';

    const restaurant: Restaurant = {
      id: p.place_id,
      name: p.name,
      cuisine,
      rating: p.rating || 0,
      distanceMiles: Math.round(dist * 10) / 10,
      address: p.vicinity || p.formatted_address,
      priceLevel,
      lat: p.geometry.location.lat,
      lng: p.geometry.location.lng,
      imageUrl: p.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${KEYS.google}`
        : undefined,
      deliveryTime: dist < 2 ? '15-25 min' : dist < 5 ? '25-35 min' : '35-45 min',
    };

    restaurants.push(restaurant);

    const suggestions = buildSuggestions(cuisine.toLowerCase(), restaurant.name, avgPrice, req);
    const nutritions = await Promise.all(suggestions.map(s => getNutritionDataExternal(s.name, cuisine, s.price)));

    suggestions.forEach((s, i) => {
      const n = nutritions[i] || {};
      menuItems.push({
        $id: `${p.place_id}_${i}`,
        id: `${p.place_id}_${i}`,
        restaurant_id: p.place_id,
        name: s.name,
        description: s.description,
        price: s.price,
        image_url: '',
        ...n,
        health_score: healthScoreExternal(n),
      });
    });
  }

  return { restaurants, menuItems };
}

/** ---------- public API (from external-apis.ts) ---------- */
export async function getNearbyRestaurantsAndMenuItems(
  latitude: number,
  longitude: number,
  radiusMiles: number,
  budgetMax: number,
  request?: Request
): Promise<ExternalAPIResult> {
  if (!isGooglePlacesAvailable()) return { restaurants: [], menuItems: [] };
  try {
    return await fetchGooglePlacesRestaurants(latitude, longitude, radiusMiles, budgetMax, request);
  } catch {
    return { restaurants: [], menuItems: [] };
  }
}
