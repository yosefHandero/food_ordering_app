/**
 * Food images (local-first + optional remote upgrade)
 *
 * Fixes:
 * - Remove "any protein => burger image" (was causing salmon => burger)
 * - Provide getFoodImageLocal (sync) and getFoodImageRemote (async)
 * - Remote only attempts for salad/pizza/burger/wrap/bowl (you can tune)
 * - Remote requires foodType keyword + at least 1 canonical keyword hit
 *
 * Types live in @/type.d.ts (keep them there).
 */

import type {
  ClassifiedItem,
  FoodImage,
  FoodType,
  MenuItem,
  PrimaryProtein,
} from "@/type";
import type { ImageSourcePropType } from "react-native";

// ----------------------------------------------------------------------------
// Remote config (removed - no external image services)
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Local assets (add more if you want better matches)
// ----------------------------------------------------------------------------
const IMG = {
  burger: require("@/assets/images/burger-one.png"),
  pizza: require("@/assets/images/pizza-one.png"),
  salad: require("@/assets/images/salad.png"),
  burrito: require("@/assets/images/buritto.png"),
  fries: require("@/assets/images/fries.png"),
  onion: require("@/assets/images/onion-rings.png"),
  mozzarella: require("@/assets/images/mozarella-sticks.png"),
  food: require("@/assets/images/food-spread-background.png"),
} as const;

const SPECIFIC: Record<string, ImageSourcePropType> = {
  // salads
  "grilled chicken salad": IMG.salad,
  "caesar salad": IMG.salad,
  "cobb salad": IMG.salad,
  "greek salad": IMG.salad,

  // pizza
  pepperoni: IMG.pizza,
  margherita: IMG.pizza,

  // wraps/burritos
  "turkey wrap": IMG.burrito,
  burrito: IMG.burrito,
  taco: IMG.burrito,

  // sides
  fries: IMG.fries,
  "french fries": IMG.fries,
  "onion rings": IMG.onion,
  "mozzarella sticks": IMG.mozzarella,

  // NOTE: if you don’t have a fish/bowl asset, don’t pretend it’s a burger.
  // Better to use IMG.food than a wrong burger photo.
};

const CATEGORY: Record<string, ImageSourcePropType> = {
  salad: IMG.salad,
  pizza: IMG.pizza,
  burger: IMG.burger,
  wrap: IMG.burrito,
  burrito: IMG.burrito,
  taco: IMG.burrito,
  fries: IMG.fries,
  default: IMG.food,
};

function norm(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

const SPECIFIC_SORTED = Object.entries(SPECIFIC).sort(
  (a, b) => b[0].length - a[0].length
);

// ----------------------------------------------------------------------------
// Classifier (small + predictable)
// ----------------------------------------------------------------------------
const FOOD: Record<FoodType, string[]> = {
  salad: ["salad", "greens", "lettuce", "caesar", "cobb", "greek"],
  pizza: ["pizza", "slice", "pepperoni", "margherita"],
  burger: ["burger", "cheeseburger", "hamburger"],
  wrap: ["wrap", "tortilla"],
  bowl: ["bowl", "grain bowl", "rice bowl", "quinoa bowl", "protein bowl"],
  sandwich: ["sandwich", "club", "deli"],
  sub: ["sub", "footlong"],
  other: [],
};

const PROTEIN: [PrimaryProtein, string[]][] = [
  ["chicken", ["chicken", "poultry"]],
  ["salmon", ["salmon"]],
  ["fish", ["fish", "seafood", "shrimp"]],
  ["turkey", ["turkey"]],
  ["beef", ["beef"]],
  ["steak", ["steak"]],
  ["pork", ["pork", "bacon"]],
  ["tuna", ["tuna"]],
  ["veggie", ["veggie", "vegan", "tofu", "bean", "falafel"]],
];

export function classifyMenuItem(
  item: MenuItem | { name: string; description?: string }
): ClassifiedItem {
  const text = norm(`${item.name} ${item.description || ""}`);

  let foodType: FoodType = "other";
  for (const [type, words] of Object.entries(FOOD) as [FoodType, string[]][]) {
    if (type === "other") continue;
    if (words.some((w) => new RegExp(`\\b${w}\\b`, "i").test(text))) {
      foodType = type;
      break;
    }
  }

  let primaryProtein: PrimaryProtein = "unknown";
  for (const [p, words] of PROTEIN) {
    if (words.some((w) => new RegExp(`\\b${w}\\b`, "i").test(text))) {
      primaryProtein = p;
      break;
    }
  }

  const canonicalName = norm(item.name)
    .replace(/\b(menu|item|dish|food|meal|restaurant)\b/g, "")
    .trim();

  return { foodType, primaryProtein, canonicalName, modifiers: [] };
}

export function getSimilarityKey(
  item: MenuItem | { name: string; description?: string }
): string {
  const c = classifyMenuItem(item);
  const core = c.canonicalName.split(" ").filter(Boolean).slice(0, 6).join(" ");
  return `${c.foodType}:${c.primaryProtein}:${core}`.toLowerCase();
}

// ----------------------------------------------------------------------------
// Local (sync) — stop pretending fish/bowls are burgers
// ----------------------------------------------------------------------------
function pickLocalByText(name: string): ImageSourcePropType {
  const t = norm(name);

  for (const [k, img] of SPECIFIC_SORTED) {
    if (t.includes(k)) return img;
  }

  for (const [k, img] of Object.entries(CATEGORY)) {
    if (k !== "default" && t.includes(k)) return img;
  }

  return CATEGORY.default;
}

export function getFoodImageLocal(
  item: MenuItem | { name: string; description?: string }
): FoodImage {
  const cls = classifyMenuItem(item);

  // Strong type-based picks
  if (cls.foodType === "salad") return { kind: "local", source: IMG.salad };
  if (cls.foodType === "pizza") return { kind: "local", source: IMG.pizza };
  if (cls.foodType === "burger") return { kind: "local", source: IMG.burger };
  if (
    cls.foodType === "wrap" ||
    cls.foodType === "sub" ||
    cls.foodType === "sandwich"
  )
    return { kind: "local", source: IMG.burrito };

  // Bowls: if you don’t have a bowl asset, prefer generic food (NOT burrito)
  if (cls.foodType === "bowl") return { kind: "local", source: IMG.food };

  // Everything else: keyword fallback -> default
  return { kind: "local", source: pickLocalByText(item.name) };
}

// ----------------------------------------------------------------------------
// Remote (async) — disabled - no external image services
// ----------------------------------------------------------------------------
export async function getFoodImageRemote(
  _item: MenuItem | { name: string; description?: string }
): Promise<FoodImage | null> {
  // Remote image fetching disabled - no external image services
  return null;
}

// ----------------------------------------------------------------------------
// Single convenience API (kept for compatibility)
// ----------------------------------------------------------------------------
export async function getFoodImage(
  item: MenuItem | { name: string; description?: string }
): Promise<FoodImage> {
  const local = getFoodImageLocal(item);
  const remote = await getFoodImageRemote(item);
  return remote ?? local;
}

// Backward compatibility: some files still import resolveFoodImage
export async function resolveFoodImage(
  item: MenuItem | { name: string; description?: string }
): Promise<FoodImage> {
  return getFoodImage(item);
}

// Cache helpers (disabled - no remote images)
export const clearImageCache = () => {};
export const getCacheStats = () => ({ imageCount: 0 });
