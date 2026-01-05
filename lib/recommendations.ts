import type { RecommendationRequest, RecommendationResult } from "@/type";

const clamp = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, n));
const r2 = (n: number) => Math.round(n * 100) / 100;
const hash = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

const pts = (v: number, rules: { max: number; points: number }[]) =>
  rules.find(r => v <= r.max)?.points ?? 0;

const inRange = (v: number, min: number, max: number) => v >= min && v <= max;

/** Supports: "2h ago", "30m", "10:30am", "HH:MM" */
function parseLastMealTime(s?: string | null): number | null {
  if (!s) return null;
  const t = s.trim().toLowerCase();

  const ago = t.match(/(\d+)\s*(h|hr|hour|m|min|minute)/);
  if (ago) {
    const n = Number(ago[1]);
    return ago[2].startsWith("h") ? n : n / 60;
  }

  const tm = t.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/);
  if (!tm) return null;

  let h = Number(tm[1]);
  const m = Number(tm[2]);
  const p = tm[3];

  if (p === "pm" && h !== 12) h += 12;
  if (p === "am" && h === 12) h = 0;

  const now = new Date();
  const meal = new Date();
  meal.setHours(h, m, 0, 0);

  let diff = (now.getTime() - meal.getTime()) / 36e5;
  if (diff < 0) diff += 24; // yesterday
  return diff;
}

/** Quick sat-fat heuristic */
function estimateSaturatedFat(totalFat: number, name?: string): number {
  if (totalFat <= 0) return 0;
  const n = (name || "").toLowerCase();

  const high = ["bacon", "sausage", "butter", "cheese", "beef", "burger", "fried", "pizza"];
  const mid = ["chicken", "pork", "salmon", "fish", "egg", "yogurt"];

  if (high.some(k => n.includes(k))) return totalFat * 0.5;
  if (mid.some(k => n.includes(k))) return totalFat * 0.35;
  return totalFat * 0.25;
}

/**
 * Health score (0–100)
 * Base: protein + calories + fiber
 * Penalties/bonuses: sat fat, sodium, goal, time-of-day
 */
export function calculateHealthScore(
  item: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium_mg?: number;
    name?: string;
  },
  goal?: string,
  timeOfDay?: string
): number {
  const calories = item.calories ?? 0;
  const protein = item.protein ?? 0;
  const fiber = item.fiber ?? 0;
  const fat = item.fat ?? 0;
  const sodium = item.sodium_mg ?? 0;
  const name = item.name || "";
  const isSoup = /soup|miso/i.test(name);
  const sat = estimateSaturatedFat(fat, name);

  let score = 0;

  // Protein (0–40)
  score += pts(protein, [
    { max: 0, points: 0 },
    { max: 4, points: 5 },
    { max: 9, points: 10 },
    { max: 14, points: 18 },
    { max: 19, points: 25 },
    { max: 24, points: 30 },
    { max: 29, points: 35 },
    { max: Infinity, points: 40 },
  ]);

  // Calories (≈ -15..30)
  score += pts(calories, [
    { max: 0, points: 0 },
    { max: 300, points: 30 },
    { max: 400, points: 25 },
    { max: 500, points: 20 },
    { max: 600, points: 15 },
    { max: 700, points: 10 },
    { max: 800, points: 5 },
    { max: 1000, points: -5 },
    { max: Infinity, points: -15 },
  ]);

  // Fiber (0–20)
  score += pts(fiber, [
    { max: 0, points: 0 },
    { max: 1, points: 2 },
    { max: 2, points: 5 },
    { max: 3, points: 8 },
    { max: 5, points: 12 },
    { max: 7, points: 16 },
    { max: Infinity, points: 20 },
  ]);

  // Sat fat (≈ -20..+3)
  score += pts(sat, [
    { max: 0, points: 0 },
    { max: 5, points: 3 },
    { max: 8, points: 0 },
    { max: 10, points: -5 },
    { max: 12, points: -10 },
    { max: 15, points: -15 },
    { max: Infinity, points: -20 },
  ]);

  // Sodium (≈ -20..+3) soups get gentler penalties
  const sodiumRules = isSoup
    ? [
        { max: 0, points: 0 },
        { max: 499, points: 3 },
        { max: 599, points: 1 },
        { max: 800, points: 0 },
        { max: 1000, points: -4 },
        { max: 1200, points: -8 },
        { max: 1500, points: -12 },
        { max: Infinity, points: -15 },
      ]
    : [
        { max: 0, points: 0 },
        { max: 499, points: 3 },
        { max: 599, points: 1 },
        { max: 800, points: 0 },
        { max: 1000, points: -6 },
        { max: 1200, points: -12 },
        { max: 1500, points: -18 },
        { max: Infinity, points: -20 },
      ];
  score += pts(sodium, sodiumRules);

  // Goal bonus (0..+5)
  if (goal) {
    const g = goal.toLowerCase();
    if ((g === "high-protein" || g === "muscle-gain") && protein >= 20) score += 5;
    else if ((g === "low-calorie" || g === "weight-loss") && calories <= 500) score += 5;
    else if (g === "high-fiber" && fiber >= 5) score += 5;
    else if (g === "heart-healthy" && sodium < 600 && sat <= 8) score += 5;
    else if (g === "balanced" && protein >= 15 && inRange(calories, 400, 600)) score += 3;
  }

  // Time-of-day bonus (0..+3)
  if (timeOfDay) {
    const t = timeOfDay.toLowerCase();
    if (t === "breakfast" && calories <= 500 && protein >= 15) score += 3;
    else if (t === "lunch" && inRange(calories, 400, 700) && protein >= 15) score += 3;
    else if (t === "dinner" && inRange(calories, 400, 800) && sodium < 1000) score += 3;
    else if (t === "snack" && calories <= 300 && (protein >= 5 || fiber >= 3)) score += 3;
  }

  return clamp(Math.round(score));
}

export function generateHealthScoreExplanation(
  item: { calories?: number; protein?: number; fiber?: number; fat?: number; sodium_mg?: number; name?: string },
  score: number
): string {
  const calories = item.calories ?? 0;
  const protein = item.protein ?? 0;
  const fiber = item.fiber ?? 0;
  const sodium = item.sodium_mg ?? 0;
  const sat = estimateSaturatedFat(item.fat ?? 0, item.name);

  const tags: string[] = [];
  if (protein >= 25) tags.push(`high protein (${protein}g)`);
  else if (protein >= 15) tags.push(`good protein (${protein}g)`);

  if (calories > 0 && calories <= 400) tags.push(`reasonable calories (${calories})`);
  else if (calories <= 500 && calories > 0) tags.push(`moderate calories (${calories})`);

  if (fiber >= 5) tags.push(`high fiber (${fiber}g)`);
  else if (fiber >= 3) tags.push(`decent fiber (${fiber}g)`);

  if (sat > 12) tags.push("high saturated fat");
  else if (sat > 10) tags.push("moderate saturated fat");

  if (sodium > 1200) tags.push(`high sodium (${sodium}mg)`);
  else if (sodium > 1000) tags.push(`moderate-high sodium (${sodium}mg)`);

  const top = tags.slice(0, score >= 50 ? 2 : 4).join(", ");
  if (score >= 80) return top ? `Excellent nutrition: ${top}.` : "Excellent nutrition profile.";
  if (score >= 70) return top ? `Good nutrition: ${top}.` : "Good nutrition profile.";
  if (score >= 60) return top ? `Decent nutrition: ${top}.` : "Decent nutrition profile.";
  if (score >= 50) return top ? `Average nutrition: ${top}.` : "Average nutrition profile.";
  return top ? `Below average: ${top}.` : "Below average nutrition profile.";
}

/** Supabase removed */
export async function getNearbyRestaurantsAndMenuItems(
  _latitude: number,
  _longitude: number,
  _radiusMiles: number,
  _budgetMax: number
) {
  return { restaurants: [], menuItems: [] };
}

/** Haversine miles */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  const calories = item.calories ?? 0;
  const protein = item.protein ?? 0;
  const carbs = item.carbs ?? 0;
  const fat = item.fat ?? 0;
  const sodium = item.sodium_mg ?? 0;
  const sugar = item.sugar ?? 0;
  const fiber = item.fiber ?? 0;

  const price = item.price ?? 0;
  const distanceMiles = restaurant.distanceMiles ?? 10;

  const hour = new Date().getHours();
  const isLateDinner = request.timeOfDay === "dinner" && hour >= 20;

  const health = calculateHealthScore(item, request.goal, request.timeOfDay);

  // Goal fit (0..100)
  let goalFit = 50;
  switch (request.goal) {
    case "high-protein":
      goalFit = Math.min(100, protein * 2);
      break;
    case "muscle-gain":
      goalFit = clamp(protein * 2 + fiber * 1.5 - sugar * 0.5, 0, 100);
      break;
    case "low-calorie":
      goalFit = Math.max(0, 100 - calories / 10);
      break;
    case "weight-loss":
      goalFit = Math.max(0, 100 - calories / 10 + fiber * 1.5 + protein * 0.3);
      break;
    case "low-carb":
      goalFit = Math.max(0, 100 - carbs * 2);
      break;
    case "high-fiber":
      goalFit = Math.min(100, fiber * 8 + protein * 0.5);
      break;
    case "heart-healthy":
      goalFit = clamp(100 - sodium / 10 - sugar * 0.5 + protein * 0.3 + fiber * 1.5, 0, 100);
      break;
    case "energy-boost": {
      goalFit = clamp(50 + protein * 0.4 + fiber * 2 - sugar * 1.2 + (inRange(calories, 400, 700) ? 10 : 0), 0, 100);
      break;
    }
    case "clean-eating":
      goalFit = clamp(50 + protein * 0.5 + fiber * 2.5 - sugar * 1 - sodium * 0.01 + (inRange(calories, 300, 700) ? 10 : 0), 0, 100);
      break;
    default:
      goalFit = clamp(50 + protein * 0.5 - calories / 20 + fiber * 2, 0, 100);
  }

  // Time fit (0..100)
  let timeFit = 50;
  switch (request.timeOfDay) {
    case "breakfast":
      timeFit = calories < 500 && protein > 15 ? 80 : calories > 700 ? 30 : 50;
      break;
    case "lunch":
      timeFit = request.activityLevel === "workout" && carbs > 40 ? 80 : inRange(calories, 400, 700) ? 80 : 50;
      break;
    case "dinner":
      timeFit = isLateDinner && calories > 600 ? 30 : inRange(calories, 400, 800) ? 80 : 50;
      break;
    case "snack":
      timeFit = calories < 300 ? 90 : calories > 400 ? 20 : 50;
      break;
  }

  // Last meal fit (0..100)
  let lastMealFit = 50;
  if (request.lastMeal) {
    const last = request.lastMeal.toLowerCase();
    const heavy =
      request.lastMealHeaviness === "heavy" || /pizza|burger|fried|heavy/.test(last);
    const hours = parseLastMealTime(request.lastMealTime);

    if (heavy) {
      if (calories > 600) lastMealFit -= 20;
      if (sodium > 1000) lastMealFit -= 15;
      if (fat > 30) lastMealFit -= 10;
    }

    if (hours != null) {
      if (hours < 2) {
        if (calories < 500) lastMealFit += 15;
        else if (calories > 700) lastMealFit -= 20;
      } else if (hours > 5 && calories > 400) {
        lastMealFit += 10;
      }
    }

    lastMealFit = clamp(lastMealFit, 0, 100);
  }

  const budget = request.budgetMax || 1;
  const priceFit = Math.max(0, 100 - (price / budget) * 50);
  const distanceFit = Math.max(0, 100 - distanceMiles * 10);

  const total =
    health * 0.35 +
    goalFit * 0.25 +
    timeFit * 0.15 +
    lastMealFit * 0.1 +
    priceFit * 0.08 +
    distanceFit * 0.07;

  return {
    total: r2(total),
    health: r2(health),
    goalFit: r2(goalFit),
    timeFit: r2(timeFit),
    lastMealFit: r2(lastMealFit),
    priceFit: r2(priceFit),
    distanceFit: r2(distanceFit),
  };
}

function getHealthBenefits(item: any): string[] {
  const protein = item.protein ?? 0;
  const fiber = item.fiber ?? 0;
  const calories = item.calories ?? 0;
  const sodium = item.sodium_mg ?? 0;
  const sugar = item.sugar ?? 0;

  const out: string[] = [];
  if (protein >= 25) out.push("supports muscle maintenance and satiety");
  else if (protein >= 15) out.push("provides quality protein for sustained energy");

  if (fiber >= 8) out.push("promotes digestive health and helps maintain stable blood sugar");
  else if (fiber >= 5) out.push("supports healthy digestion");

  if (calories > 0 && calories < 500) out.push("calorie-conscious while maintaining nutritional value");

  if (sodium > 0 && sodium < 600) out.push("heart-friendly with low sodium content");
  else if (sodium > 0 && sodium < 800) out.push("moderate sodium for cardiovascular health");

  if (sugar > 0 && sugar < 10) out.push("low in added sugars, preventing energy crashes");

  if (protein >= 15 && fiber >= 3 && inRange(calories, 400, 700)) out.push("balanced macronutrients for optimal nutrition");
  return out;
}

export function generateWhyText(
  item: any,
  restaurant: any,
  request: RecommendationRequest,
  scores: ReturnType<typeof calculateContextAwareScores>
): string {
  const name = item.name || "this dish";
  const h = hash(name);
  const openings = [`${name} is`, `${name} offers`, `${name} delivers`, `This dish provides`];
  const opening = openings[h % openings.length];

  const protein = item.protein ?? 0;
  const calories = item.calories ?? 0;
  const carbs = item.carbs ?? 0;
  const fiber = item.fiber ?? 0;
  const sodium = item.sodium_mg ?? 0;
  const sugar = item.sugar ?? 0;

  let goalLine = "";
  switch (request.goal) {
    case "high-protein":
    case "muscle-gain":
      if (protein >= 30) goalLine = `${protein}g protein—excellent for your goal`;
      else if (protein >= 20) goalLine = `${protein}g protein—strong fit for your goal`;
      else if (protein >= 15) goalLine = `${protein}g protein—decent fit for your goal`;
      break;
    case "low-calorie":
    case "weight-loss":
      if (calories < 350) goalLine = `${calories} calories—great for your goal`;
      else if (calories < 550) goalLine = `${calories} calories—moderate fit for your goal`;
      break;
    case "low-carb":
      if (carbs < 15) goalLine = `${carbs}g carbs—ideal for low-carb`;
      else if (carbs < 25) goalLine = `${carbs}g carbs—good for low-carb`;
      break;
    case "high-fiber":
      if (fiber >= 8) goalLine = `${fiber}g fiber—excellent for high-fiber`;
      else if (fiber >= 5) goalLine = `${fiber}g fiber—good for high-fiber`;
      break;
    case "heart-healthy":
      if (sodium < 700) goalLine = `${sodium}mg sodium—great for heart-healthy`;
      break;
    case "energy-boost":
      goalLine = `balanced energy profile (fiber ${fiber}g, sugar ${sugar}g)`;
      break;
    case "clean-eating":
      goalLine = `cleaner profile (fiber ${fiber}g, sugar ${sugar}g, sodium ${sodium}mg)`;
      break;
    default:
      goalLine = `balanced pick for your goals`;
  }

  const parts: string[] = [];
  if (goalLine) parts.push(`${opening} ${goalLine}`);
  if (scores.timeFit > 70) parts.push(`great for ${request.timeOfDay}`);
  if (scores.lastMealFit > 60 && request.lastMeal) parts.push("pairs well with your last meal");
  if ((restaurant.rating ?? 0) > 4) parts.push("from a highly rated restaurant");

  const benefits = getHealthBenefits(item).slice(0, 2);
  if (benefits.length) parts.push(benefits.join(" and "));

  // Extra highlights if not already implied
  if (protein >= 20 && !goalLine.includes("protein")) parts.push(`provides ${protein}g protein`);
  if (fiber >= 6 && !goalLine.includes("fiber")) parts.push(`includes ${fiber}g fiber`);
  if (sodium < 500 && !goalLine.includes("sodium")) parts.push(`low sodium (${sodium}mg)`);

  return (parts.length ? parts.join(", ") : `${name} is a good ${request.timeOfDay} option.`) + ".";
}

export function generateContextGuidance(request: RecommendationRequest): {
  guidancePreview: string;
  avoidChips: string[];
} {
  const hour = new Date().getHours();
  const isLateDinner = request.timeOfDay === "dinner" && hour >= 20;

  const chips: string[] = [];
  const addChip = (c: string) => !chips.includes(c) && chips.push(c);

  let guidance = "Recommendations optimized for your goal and time of day.";

  if (request.lastMeal && request.lastMealTime) {
    const last = request.lastMeal.toLowerCase();
    const heavy = /pizza|burger|fried|heavy/.test(last);
    const hrs = parseLastMealTime(request.lastMealTime);
    if (heavy && hrs != null && hrs < 3) guidance = "Last meal was heavy and recent → lighter, lower-sodium picks ranked higher.";
  }

  if (request.timeOfDay === "lunch" && request.activityLevel === "workout") {
    guidance = "Lunch + workout → protein-forward balanced meals ranked higher.";
  }

  if (isLateDinner) guidance = "Late dinner → lighter portions and lower sodium prioritized.";

  if (isLateDinner || (request.timeOfDay === "dinner" && hour >= 18)) {
    addChip("very high sodium");
    addChip("fried");
    addChip("heavy portions");
  }

  if (request.lastMeal) {
    const last = request.lastMeal.toLowerCase();
    const heavy = /pizza|burger|fried|heavy/.test(last);
    const hrs = parseLastMealTime(request.lastMealTime);
    const recent = hrs != null && hrs < 3;
    if (heavy || recent) {
      addChip("heavy portions");
      addChip("fried");
    }
  }

  if (request.goal === "low-calorie" || request.goal === "weight-loss") {
    addChip("sugary drinks");
    addChip("fried");
  }
  if (request.goal === "heart-healthy") {
    addChip("high sodium");
    addChip("saturated fats");
  }
  if (request.goal === "clean-eating") {
    addChip("processed foods");
    addChip("artificial ingredients");
  }

  return { guidancePreview: guidance, avoidChips: chips.slice(0, 3) };
}

const normName = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");

function selectBestRestaurantForItem(
  candidates: { restaurant: any; item: any }[],
  userLat?: number,
  userLng?: number
): { restaurant: any; item: any } {
  if (candidates.length === 1) return candidates[0];

  const dist = (r: any) => {
    if (userLat != null && userLng != null && r?.lat && r?.lng) return calculateDistance(userLat, userLng, r.lat, r.lng);
    return r?.distanceMiles ?? 999;
  };

  const sorted = [...candidates].sort((a, b) => {
    const ca = a.item?.calories ?? 9999;
    const cb = b.item?.calories ?? 9999;
    if (ca !== cb) return ca - cb;

    const da = dist(a.restaurant);
    const db = dist(b.restaurant);
    if (Math.abs(da - db) > 0.1) return da - db;

    const pa = a.item?.protein ?? 0;
    const pb = b.item?.protein ?? 0;
    if (pa !== pb) return pb - pa;

    const ra = a.restaurant?.rating ?? 0;
    const rb = b.restaurant?.rating ?? 0;
    if (ra !== rb) return rb - ra;

    const pra = a.item?.price ?? 9999;
    const prb = b.item?.price ?? 9999;
    return pra - prb;
  });

  // If exact ties, pick random among top-equivalent
  const top = sorted[0];
  const topSig = {
    c: top.item?.calories ?? 9999,
    d: dist(top.restaurant),
    p: top.item?.protein ?? 0,
    r: top.restaurant?.rating ?? 0,
    pr: top.item?.price ?? 9999,
  };

  const tied = sorted.filter(x => {
    const sig = {
      c: x.item?.calories ?? 9999,
      d: dist(x.restaurant),
      p: x.item?.protein ?? 0,
      r: x.restaurant?.rating ?? 0,
      pr: x.item?.price ?? 9999,
    };
    return sig.c === topSig.c && Math.abs(sig.d - topSig.d) < 0.1 && sig.p === topSig.p && sig.r === topSig.r && sig.pr === topSig.pr;
  });

  return tied.length > 1 ? tied[Math.floor(Math.random() * tied.length)] : top;
}

function deduplicateMenuItems(
  candidates: { restaurant: any; item: any }[],
  userLat?: number,
  userLng?: number
): { restaurant: any; item: any }[] {
  const map = new Map<string, { restaurant: any; item: any }[]>();
  for (const c of candidates) {
    const key = normName(c.item?.name || "");
    map.set(key, [...(map.get(key) || []), c]);
  }
  return [...map.values()].map(group => selectBestRestaurantForItem(group, userLat, userLng));
}

export function localRankRecommendations(
  restaurants: any[],
  menuItems: any[],
  request: RecommendationRequest
): RecommendationResult[] {
  const itemsByRestaurant = new Map<string, any[]>();
  for (const it of menuItems) {
    const id = it.restaurant_id;
    if (!itemsByRestaurant.has(id)) itemsByRestaurant.set(id, []);
    itemsByRestaurant.get(id)!.push(it);
  }

  const all: { restaurant: any; item: any }[] = [];
  for (const r of restaurants) {
    const items = itemsByRestaurant.get(r.id) || [];
    for (const it of items) all.push({ restaurant: r, item: it });
  }

  const deduped = deduplicateMenuItems(all, request.lat, request.lng);

  const scored = deduped
    .map(({ restaurant, item }) => {
      const scores = calculateContextAwareScores(item, restaurant, request);
      return { restaurant, item, scores };
    })
    .sort((a, b) => b.scores.total - a.scores.total)
    .slice(0, 60);

  return scored.slice(0, 8).map(({ restaurant, item, scores }) => ({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      rating: restaurant.rating,
      distanceMiles: restaurant.distanceMiles,
      deliveryTime: restaurant.delivery_time,
      website: restaurant.website,
    },
    item: {
      id: item.id,
      name: item.name,
      price: item.price || 0,
      calories: item.calories,
      protein: item.protein,
      sodium_mg: item.sodium_mg,
      sugar: item.sugar,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber,
      health_score: scores.health,
    },
    why: generateWhyText(item, restaurant, request, scores),
    scores,
  }));
}
