/**
 * Consolidated Scoring Module
 * All health scoring, recommendation ranking, and explanation generation
 */

import type { HealthScoreBreakdown, HealthScoreConfig, NutritionData, RecommendationRequest, RecommendationResult } from '@/type';

// ============================================================================
// Health Score Calculation
// ============================================================================

export function calculateHealthScore(item: NutritionData, goal?: string, timeOfDay?: string): number {
  const cal = item.calories || 0;
  const prot = item.protein || 0;
  const fib = item.fiber || 0;
  const sod = item.sodium_mg || 0;
  const sug = item.sugar || 0;
  const name = (item.name || '').toLowerCase();
  const isSoup = name.includes('soup');
  
  let score = 0;

  // Protein (up to 40 points)
  if (prot >= 30) score += 40;
  else if (prot >= 25) score += 35;
  else if (prot >= 20) score += 30;
  else if (prot >= 15) score += 25;
  else if (prot >= 10) score += 18;
  else if (prot >= 5) score += 10;
  else if (prot > 0) score += 5;

  // Calories (up to 30 points)
  if (cal > 0 && cal <= 300) score += 30;
  else if (cal <= 400) score += 25;
  else if (cal <= 500) score += 20;
  else if (cal <= 600) score += 15;
  else if (cal <= 700) score += 10;
  else if (cal <= 800) score += 5;
  else if (cal > 1000) score -= 15;
  else if (cal > 800) score -= 5;

  // Fiber (up to 20 points)
  if (fib >= 8) score += 20;
  else if (fib >= 6) score += 16;
  else if (fib >= 4) score += 12;
  else if (fib >= 3) score += 8;
  else if (fib >= 2) score += 5;
  else if (fib > 0) score += 2;

  // Sodium penalty (up to -20)
  if (sod > 1500) score -= isSoup ? 15 : 20;
  else if (sod > 1200) score -= isSoup ? 12 : 18;
  else if (sod > 1000) score -= isSoup ? 8 : 12;
  else if (sod > 800) score -= isSoup ? 4 : 6;
  else if (sod > 0 && sod < 500) score += 3;
  else if (sod >= 500 && sod < 600) score += 1;

  // Sugar penalty (up to -20)
  if (sug > 30) score -= 20;
  else if (sug > 20) score -= 14;
  else if (sug > 15) score -= 8;
  else if (sug > 10) score -= 4;
  else if (sug > 0 && sug < 5) score += 3;

  // Goal bonus (up to +5)
  if (goal) {
    if ((goal === 'high-protein' || goal === 'muscle-gain') && prot >= 20) score += 5;
    else if ((goal === 'low-calorie' || goal === 'weight-loss') && cal <= 500) score += 5;
    else if (goal === 'high-fiber' && fib >= 5) score += 5;
    else if (goal === 'heart-healthy' && sod < 600) score += 5;
    else if (goal === 'balanced' && prot >= 15 && cal >= 400 && cal <= 600) score += 3;
  }

  // Time-of-day bonus (up to +3)
  if (timeOfDay) {
    if (timeOfDay === 'breakfast' && cal <= 500 && prot >= 15) score += 3;
    else if (timeOfDay === 'lunch' && cal >= 400 && cal <= 700 && prot >= 15) score += 3;
    else if (timeOfDay === 'dinner' && cal >= 400 && cal <= 800 && sod < 1000) score += 3;
    else if (timeOfDay === 'snack' && cal <= 300 && (prot >= 5 || fib >= 3)) score += 3;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// Context-Aware Scoring
// ============================================================================

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
  const cal = item.calories || 0;
  const prot = item.protein || 0;
  const carbs = item.carbs || 0;
  const sod = item.sodium_mg || 0;
  const sug = item.sugar || 0;
  const fib = item.fiber || 0;
  const price = item.price || 0;
  const dist = restaurant.distanceMiles || 10;

  const healthScore = calculateHealthScore(item, request.goal, request.timeOfDay);

  // Goal fit
  let goalFit = 50;
  if (request.goal === 'high-protein' || request.goal === 'muscle-gain') {
    goalFit = Math.min(100, prot * 2 + (request.goal === 'muscle-gain' ? fib * 1.5 - sug * 0.5 : 0));
  } else if (request.goal === 'low-calorie' || request.goal === 'weight-loss') {
    goalFit = Math.max(0, 100 - cal / 10 + (request.goal === 'weight-loss' ? fib * 1.5 + prot * 0.3 : 0));
  } else if (request.goal === 'low-carb') {
    goalFit = Math.max(0, 100 - carbs * 2);
  } else if (request.goal === 'high-fiber') {
    goalFit = Math.min(100, fib * 8 + prot * 0.5);
  } else if (request.goal === 'heart-healthy') {
    goalFit = Math.max(0, Math.min(100, 100 - sod / 10 - sug * 0.5 + prot * 0.3 + fib * 1.5));
  } else if (request.goal === 'balanced') {
    goalFit = Math.max(0, Math.min(100, 50 + prot * 0.5 - cal / 20 + fib * 2));
  }

  // Time fit
  let timeFit = 50;
  const hour = new Date().getHours();
  const isLateDinner = request.timeOfDay === 'dinner' && hour >= 20;
  if (request.timeOfDay === 'breakfast') {
    timeFit = cal < 500 && prot > 15 ? 80 : cal > 700 ? 30 : 50;
  } else if (request.timeOfDay === 'lunch') {
    timeFit = cal >= 400 && cal <= 700 ? 80 : 50;
  } else if (request.timeOfDay === 'dinner') {
    timeFit = isLateDinner && cal > 600 ? 30 : cal >= 400 && cal <= 800 ? 80 : 50;
  } else if (request.timeOfDay === 'snack') {
    timeFit = cal < 300 ? 90 : cal > 400 ? 20 : 50;
  }

  // Last meal fit
  let lastMealFit = 50;
  if (request.lastMeal) {
    const isHeavy = request.lastMeal.toLowerCase().includes('pizza') || 
                    request.lastMeal.toLowerCase().includes('burger') ||
                    request.lastMealHeaviness === 'heavy';
    if (isHeavy) {
      if (cal > 600) lastMealFit -= 20;
      if (sod > 1000) lastMealFit -= 15;
    }
  }

  const priceFit = Math.max(0, 100 - (price / request.budgetMax) * 50);
  const distanceFit = Math.max(0, 100 - dist * 10);

  const total = healthScore * 0.35 + goalFit * 0.25 + timeFit * 0.15 + lastMealFit * 0.10 + priceFit * 0.08 + distanceFit * 0.07;

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

// ============================================================================
// Recommendation Ranking
// ============================================================================

export function rankRecommendations(
  restaurants: any[],
  menuItems: any[],
  request: RecommendationRequest
): RecommendationResult[] {
  const itemsByRestaurant = new Map<string, any[]>();
  menuItems.forEach((item) => {
    const rid = item.restaurant_id;
    if (!itemsByRestaurant.has(rid)) itemsByRestaurant.set(rid, []);
    itemsByRestaurant.get(rid)!.push(item);
  });

  const candidates: { restaurant: any; item: any }[] = [];
  restaurants.forEach((restaurant) => {
    const items = itemsByRestaurant.get(restaurant.id) || [];
    items.forEach((item) => candidates.push({ restaurant, item }));
  });

  // Deduplicate by item name
  const uniqueItems = new Map<string, { restaurant: any; item: any }>();
  candidates.forEach((c) => {
    const key = c.item.name.toLowerCase().trim();
    if (!uniqueItems.has(key)) uniqueItems.set(key, c);
  });

  const scored = Array.from(uniqueItems.values()).map(({ restaurant, item }) => {
    const scores = calculateContextAwareScores(item, restaurant, request);
    return { restaurant, item, scores };
  });

  scored.sort((a, b) => b.scores.total - a.scores.total);

  return scored.slice(0, 8).map(({ restaurant, item, scores }) => ({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      rating: restaurant.rating,
      distanceMiles: restaurant.distanceMiles,
      deliveryTime: restaurant.deliveryTime,
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

// ============================================================================
// Explanation Generation
// ============================================================================

function generateWhyText(
  item: any,
  restaurant: any,
  request: RecommendationRequest,
  scores: ReturnType<typeof calculateContextAwareScores>
): string {
  const parts: string[] = [];
  const name = item.name || 'this dish';
  const prot = item.protein || 0;
  const cal = item.calories || 0;
  const fib = item.fiber || 0;
  const sod = item.sodium_mg || 0;

  // Goal match
  if (request.goal === 'high-protein' && prot >= 25) {
    parts.push(`Perfect for your high-protein goal with ${prot}g of protein`);
  } else if (request.goal === 'low-calorie' && cal < 450) {
    parts.push(`Great for your low-calorie goal at ${cal} calories`);
  } else if (request.goal === 'high-fiber' && fib >= 5) {
    parts.push(`Excellent for your high-fiber goal with ${fib}g of fiber`);
  } else {
    parts.push(`${name} fits your ${request.goal} goal well`);
  }

  // Time fit
  if (scores.timeFit > 70) {
    parts.push(`perfect for ${request.timeOfDay}`);
  }

  // Restaurant quality
  if (restaurant.rating > 4) {
    parts.push('highly rated');
  }

  // Health benefits
  if (prot >= 20) parts.push('supports muscle maintenance');
  if (fib >= 5) parts.push('promotes digestive health');
  if (sod < 600) parts.push('heart-friendly with low sodium');

  return parts.slice(0, 4).join(', ') + '.';
}

// ============================================================================
// Utilities
// ============================================================================

// ============================================================================
// HEI-Inspired Health Score (0–100)
// ============================================================================

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const round = (n: number) => Math.round(n);

function isSaladName(itemName?: string) {
  return (itemName || "").toLowerCase().includes("salad");
}

/** Estimate saturated fat if not provided (simple name heuristics) */
function estimateSaturatedFatHEI(totalFat: number, itemName?: string): number {
  if (totalFat <= 0) return 0;
  const name = (itemName || "").toLowerCase();
  if (!name) return totalFat * 0.3;

  const high = ["bacon", "sausage", "butter", "cheese", "beef", "burger", "fried", "pizza", "cream", "lard"];
  const moderate = ["chicken", "pork", "salmon", "fish", "egg", "yogurt", "milk"];
  const creamySalad = ["caesar", "ranch", "blue cheese", "creamy"];

  if (high.some(k => name.includes(k))) return totalFat * 0.5;

  if (name.includes("salad")) {
    return totalFat * (creamySalad.some(k => name.includes(k)) ? 0.4 : 0.3);
  }

  if (moderate.some(k => name.includes(k))) return totalFat * 0.35;

  return totalFat * 0.25;
}

function getCfg(isSalad: boolean): HealthScoreConfig {
  return {
    proteinTarget: isSalad ? 15 : 25,
    fiberTarget: 5,
    sodiumTarget: isSalad ? 800 : 600,
    satFatTarget: isSalad ? 12 : 10,
    sugarTarget: 10,
    saladBonus: isSalad ? 8 : 0,

    // Calories (0–20)
    calorieRanges: isSalad
      ? [
          { min: 250, max: 700, points: 20 },
          { min: 200, max: 800, points: 18 },
          { min: 150, max: 900, points: 15 },
          { min: 0, max: 149, points: 10 },
          { min: 901, max: 1100, points: 10 },
          { min: 1101, max: 1300, points: 5 },
        ]
      : [
          { min: 300, max: 600, points: 20 },
          { min: 250, max: 700, points: 15 },
          { min: 200, max: 800, points: 10 },
          { min: 0, max: 199, points: 5 },
          { min: 801, max: 1000, points: 5 },
          { min: 1001, max: 1200, points: 0 },
        ],

    // Saturated fat (0–15)
    satFatRanges: isSalad
      ? [
          { max: 5, points: 15 },
          { max: 7, points: 12 },
          { max: 12, points: 10 },
          { max: 18, points: 8 },
          { max: 25, points: 5 },
          { max: Infinity, points: 2 },
        ]
      : [
          { max: 5, points: 15 },
          { max: 7, points: 12 },
          { max: 10, points: 10 },
          { max: 15, points: 5 },
          { max: 20, points: 0 },
          { max: Infinity, points: -5 },
        ],

    // Sodium (0–10)
    sodiumRanges: isSalad
      ? [
          { max: 300, points: 10 },
          { max: 450, points: 8 },
          { max: 800, points: 6 },
          { max: 1200, points: 5 },
          { max: 1600, points: 3 },
          { max: Infinity, points: 1 },
        ]
      : [
          { max: 300, points: 10 },
          { max: 450, points: 8 },
          { max: 600, points: 6 },
          { max: 900, points: 3 },
          { max: 1200, points: 0 },
          { max: Infinity, points: -3 },
        ],
  };
}

function inRange(n: number, min: number, max: number) {
  return n >= min && n <= max;
}

function pointsByMax(n: number, ranges: { max: number; points: number }[]) {
  for (const r of ranges) if (n <= r.max) return r.points;
  return 0;
}

function calcProteinPoints(protein: number, isSalad: boolean, target: number) {
  if (protein >= target) return 30;
  if (protein > 0) {
    if (isSalad && protein >= 10) return 25;
    if (isSalad && protein >= 5) return 20;
    return (protein / target) * 30;
  }
  return isSalad ? 5 : 0;
}

function calcFiberPoints(fiber: number, isSalad: boolean, target: number) {
  if (fiber >= target) return 20;
  if (fiber > 0) {
    if (isSalad && fiber >= 3) return 15;
    if (isSalad && fiber >= 2) return 12;
    return (fiber / target) * 20;
  }
  return isSalad ? 8 : 0;
}

function calcCaloriePoints(calories: number, isSalad: boolean, ranges: HealthScoreConfig["calorieRanges"]) {
  if (calories <= 0) return 0;

  // find first matching range
  for (const r of ranges) {
    if (inRange(calories, r.min, r.max)) return r.points;
  }

  // Non-salad excessive calories penalty (keeps original behavior)
  if (!isSalad && calories > 1200) return -5;

  // Salad: >1300 => 0 (no penalty, just no bonus)
  return 0;
}

function calcSugarPoints(sugar: number) {
  if (sugar <= 10) return sugar <= 5 ? 5 : 3;
  if (sugar <= 20) return 1;
  if (sugar <= 30) return 0;
  return -2;
}

export function getHealthScoreBreakdown(nutrition: NutritionData, itemName?: string): HealthScoreBreakdown {
  const calories = nutrition.calories ?? 0;
  const protein = nutrition.protein ?? 0;
  const fiber = nutrition.fiber ?? 0;
  const totalFat = nutrition.fat ?? 0;
  const sodium = nutrition.sodium_mg ?? 0;
  const sugar = nutrition.sugar ?? 0;

  const isSalad = isSaladName(itemName);
  const cfg = getCfg(isSalad);

  const saturatedFat = nutrition.saturatedFat ?? estimateSaturatedFatHEI(totalFat, itemName);

  const proteinPoints = calcProteinPoints(protein, isSalad, cfg.proteinTarget);
  const fiberPoints = calcFiberPoints(fiber, isSalad, cfg.fiberTarget);
  const caloriePoints = calcCaloriePoints(calories, isSalad, cfg.calorieRanges);
  const saturatedFatPoints = pointsByMax(saturatedFat, cfg.satFatRanges);
  const sodiumPoints = pointsByMax(sodium, cfg.sodiumRanges);
  const sugarPoints = calcSugarPoints(sugar);

  const total = proteinPoints + fiberPoints + caloriePoints + saturatedFatPoints + sodiumPoints + sugarPoints + cfg.saladBonus;
  const score = clamp(round(total), 0, 100);

  // Factors (kept similar to original)
  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];

  if (isSalad) positiveFactors.push("Vegetable-based (salad)");

  if (protein >= cfg.proteinTarget) positiveFactors.push(`High protein (${protein}g)`);
  else if (protein >= cfg.proteinTarget * 0.6) positiveFactors.push(`Good protein (${protein}g)`);
  else if (!isSalad && protein < cfg.proteinTarget * 0.3) negativeFactors.push(`Low protein (${protein}g)`);

  if (fiber >= cfg.fiberTarget) positiveFactors.push(`High fiber (${fiber}g)`);
  else if (fiber >= cfg.fiberTarget * 0.6) positiveFactors.push(`Good fiber (${fiber}g)`);
  else if (!isSalad && fiber > 0 && fiber < cfg.fiberTarget * 0.3) negativeFactors.push(`Low fiber (${fiber}g)`);

  if (isSalad) {
    if (calories >= 250 && calories <= 700) positiveFactors.push(`Reasonable calories (${calories})`);
    else if (calories > 1100) negativeFactors.push(`High calories (${calories})`);
  } else {
    if (calories >= 300 && calories <= 600) positiveFactors.push(`Reasonable calories (${calories})`);
    else if (calories > 800) negativeFactors.push(`High calories (${calories})`);
  }

  if (!isSalad && saturatedFat > cfg.satFatTarget * 1.5) negativeFactors.push(`High saturated fat (${saturatedFat.toFixed(1)}g)`);
  else if (saturatedFat <= cfg.satFatTarget * 0.5) positiveFactors.push(`Low saturated fat (${saturatedFat.toFixed(1)}g)`);

  if (!isSalad && sodium > cfg.sodiumTarget * 1.5) negativeFactors.push(`High sodium (${sodium}mg)`);
  else if (sodium <= cfg.sodiumTarget * 0.5) positiveFactors.push(`Low sodium (${sodium}mg)`);

  if (sugar > cfg.sugarTarget * 2) negativeFactors.push(`High sugar (${sugar}g)`);
  else if (sugar <= cfg.sugarTarget * 0.5) positiveFactors.push(`Low sugar (${sugar}g)`);

  return {
    score,
    components: {
      protein: {
        points: proteinPoints,
        maxPoints: 30,
        explanation:
          protein >= cfg.proteinTarget
            ? `Excellent protein (${protein}g meets target ${cfg.proteinTarget}g${isSalad ? " for salads" : ""})`
            : protein > 0
            ? `Protein: ${protein}g (target ${cfg.proteinTarget}g${isSalad ? " for salads" : ""})`
            : isSalad
            ? "Salad (vegetable-based)"
            : "No protein data available",
      },
      fiber: {
        points: fiberPoints,
        maxPoints: 20,
        explanation:
          fiber >= cfg.fiberTarget
            ? `Excellent fiber (${fiber}g meets target ${cfg.fiberTarget}g)`
            : fiber > 0
            ? `Fiber: ${fiber}g (target ${cfg.fiberTarget}g)`
            : isSalad
            ? "Salad (fiber credit applied)"
            : "No fiber data available",
      },
      calories: {
        points: caloriePoints,
        maxPoints: 20,
        explanation: isSalad
          ? calories > 0
            ? `Calories: ${calories} (ideal 250–700 for salads)`
            : "No calorie data available"
          : calories > 0
          ? `Calories: ${calories} (ideal 300–600)`
          : "No calorie data available",
      },
      saturatedFat: {
        points: saturatedFatPoints,
        maxPoints: 15,
        explanation:
          saturatedFat <= cfg.satFatTarget
            ? `Low sat fat (${saturatedFat.toFixed(1)}g, target <${cfg.satFatTarget}g${isSalad ? " for salads" : ""})`
            : `Sat fat: ${saturatedFat.toFixed(1)}g (target <${cfg.satFatTarget}g${isSalad ? " for salads" : ""})`,
      },
      sodium: {
        points: sodiumPoints,
        maxPoints: 10,
        explanation:
          sodium <= cfg.sodiumTarget
            ? `Low sodium (${sodium}mg, target <${cfg.sodiumTarget}mg${isSalad ? " for salads" : ""})`
            : `Sodium: ${sodium}mg (target <${cfg.sodiumTarget}mg${isSalad ? " for salads" : ""})`,
      },
      sugar: {
        points: sugarPoints,
        maxPoints: 5,
        explanation:
          sugar <= cfg.sugarTarget
            ? `Low sugar (${sugar}g, target <${cfg.sugarTarget}g)`
            : `Sugar: ${sugar}g (target <${cfg.sugarTarget}g)`,
      },
    },
    positiveFactors,
    negativeFactors,
  };
}

export function calculateHEIHealthScore(nutrition: NutritionData, itemName?: string): number {
  return getHealthScoreBreakdown(nutrition, itemName).score;
}

// Re-export types for backward compatibility
export type { HealthScoreBreakdown, NutritionData };

export function getHealthScoreLabel(score: number): string {
  if (score >= 90 && score <= 100) return "Excellent";
  if (score >= 80 && score <= 89) return "Very good";
  if (score >= 70 && score <= 79) return "Good";
  if (score >= 60 && score <= 69) return "Average";
  if (score >= 0 && score < 60) return "Below average";
  return "Unknown";
}

export function getHealthScoreColor(score: number): string {
  if (score >= 90 && score <= 100) return "#1A7A6D";
  if (score >= 80 && score <= 89) return "#2A9D8F";
  if (score >= 70 && score <= 79) return "#FFD700";
  if (score >= 60 && score <= 69) return "#F4A261";
  if (score >= 0 && score < 60) return "#E63946";
  return "#878787";
}

