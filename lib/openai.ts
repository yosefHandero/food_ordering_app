import { CandidateItem, RecommendationRequest, RecommendationResult } from '@/type';
import { calculateContextAwareScores, generateWhyText } from './recommendations';

const HF_KEY =
  process.env.HUGGING_FACE_API_KEY ||
  process.env.HUGGINGFACE_API_KEY ||
  process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY ||
  process.env.EXPO_PUBLIC_HUGGING_FACE_API_KEY;

const HF_MODEL = process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';

// keep name if your app already imports it
export async function rankWithOpenAI(
  candidates: CandidateItem[],
  request: RecommendationRequest
): Promise<RecommendationResult[]> {
  if (!HF_KEY) throw new Error('Hugging Face API key not configured');
  if (!candidates.length) return [];

  const raw = await hfGenerate(buildPrompt(candidates, request));

  const parsed = safeJsonParse(raw);
  const aiResults = Array.isArray(parsed?.results) ? parsed.results : [];

  // Fast lookup maps
  const byId = new Map<string, CandidateItem>();
  for (const c of candidates) byId.set(`${c.restaurant.id}::${c.item.id}`, c);

  const mapped: RecommendationResult[] = aiResults
    .map((r: any) => {
      const key = `${r?.restaurant?.id}::${r?.item?.id}`;
      const c = byId.get(key);
      if (!c) return null;

      const scores = calculateContextAwareScores(c.item, c.restaurant, request);

      return {
        restaurant: {
          id: c.restaurant.id,
          name: c.restaurant.name,
          cuisine: c.restaurant.cuisine,
          rating: c.restaurant.rating,
          distanceMiles: c.restaurant.distanceMiles,
          deliveryTime: c.restaurant.deliveryTime,
          website: c.restaurant.website,
        },
        item: {
          id: c.item.id,
          name: c.item.name,
          price: c.item.price,
          calories: c.item.calories,
          protein: c.item.protein,
          sodium_mg: c.item.sodium_mg,
          sugar: c.item.sugar,
          carbs: c.item.carbs,
          fat: c.item.fat,
          fiber: c.item.fiber,
          health_score: scores.health,
        },
        why: typeof r?.why === 'string' && r.why.trim()
          ? r.why
          : generateWhyText(c.item, c.restaurant, request, scores),
        scores,
      } as RecommendationResult;
    })
    .filter(Boolean) as RecommendationResult[];

  // Enforce variety (unique item names) + cap 8
  const unique = uniqueByItemName(mapped).slice(0, 8);

  // Fill remaining with best local candidates
  if (unique.length < 8) {
    const usedItemIds = new Set(unique.map(x => x.item.id));
    const filler = candidates
      .filter(c => !usedItemIds.has(c.item.id))
      .map(c => {
        const scores = calculateContextAwareScores(c.item, c.restaurant, request);
        return {
          restaurant: {
            id: c.restaurant.id,
            name: c.restaurant.name,
            cuisine: c.restaurant.cuisine,
            rating: c.restaurant.rating,
            distanceMiles: c.restaurant.distanceMiles,
            deliveryTime: c.restaurant.deliveryTime,
            website: c.restaurant.website,
          },
          item: {
            id: c.item.id,
            name: c.item.name,
            price: c.item.price,
            calories: c.item.calories,
            protein: c.item.protein,
            sodium_mg: c.item.sodium_mg,
            sugar: c.item.sugar,
            carbs: c.item.carbs,
            fat: c.item.fat,
            fiber: c.item.fiber,
            health_score: scores.health,
          },
          why: generateWhyText(c.item, c.restaurant, request, scores),
          scores,
        } as RecommendationResult;
      });

    const filled = uniqueByItemName([...unique, ...filler]).slice(0, 8);
    return filled;
  }

  return unique;
}

/** ---------------- helpers ---------------- */

async function hfGenerate(prompt: string): Promise<string> {
  const url = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${HF_KEY}`,
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 1200, temperature: 0.5, return_full_text: false },
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    if (res.status === 503) {
      // model loading
      try {
        const e = JSON.parse(text);
        const t = e?.estimated_time ?? 10;
        throw new Error(`Model is loading. Please wait ${t}s and try again.`);
      } catch {
        throw new Error(`Model is loading. Please try again shortly.`);
      }
    }
    throw new Error(`Hugging Face API error: ${res.status} - ${text}`);
  }

  // HF router commonly returns JSON; but we already have text
  try {
    const data = JSON.parse(text);
    // supports: [{generated_text}], {generated_text}, string
    const out =
      (Array.isArray(data) && (data[0]?.generated_text ?? data[0])) ||
      data?.generated_text ||
      data?.[0]?.generated_text ||
      data;

    return typeof out === 'string' ? out : JSON.stringify(out);
  } catch {
    return text; // sometimes it’s already plain text
  }
}

function safeJsonParse(content: string) {
  let s = (content || '').trim();

  // strip markdown fences if model ignores instruction
  s = s.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  // try direct JSON
  try {
    return JSON.parse(s);
  } catch {}

  // extract first {...} block
  const match = s.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }

  throw new Error(`Failed to parse model JSON. Preview: ${s.slice(0, 200)}`);
}

function uniqueByItemName(results: RecommendationResult[]) {
  const seen = new Set<string>();
  const out: RecommendationResult[] = [];
  for (const r of results) {
    const k = r.item.name.toLowerCase().trim();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
    if (out.length >= 8) break;
  }
  return out;
}

function buildPrompt(candidates: CandidateItem[], request: RecommendationRequest) {
  // Keep prompt short: model ranks, you compute scores + fallback locally.
  const compactCandidates = candidates.map(c => ({
    restaurant: {
      id: c.restaurant.id,
      name: c.restaurant.name,
      cuisine: c.restaurant.cuisine,
      rating: c.restaurant.rating,
      distanceMiles: c.restaurant.distanceMiles,
      deliveryTime: c.restaurant.deliveryTime,
      website: c.restaurant.website,
    },
    item: {
      id: c.item.id,
      name: c.item.name,
      price: c.item.price,
      calories: c.item.calories,
      protein: c.item.protein,
      sodium_mg: c.item.sodium_mg,
      sugar: c.item.sugar,
      carbs: c.item.carbs,
      fat: c.item.fat,
      fiber: c.item.fiber,
      healthScore: c.item.healthScore,
      description: c.item.description,
    },
  }));

  return `
Return ONLY valid JSON.

Task: pick the best 8 items for this user request:
${JSON.stringify(request)}

Rules:
- Output format: {"results":[{restaurant:{id,name,cuisine,rating,deliveryTime,website}, item:{id,name,price,calories,protein,sodium_mg,sugar,health_score}, why}]}
- IDs must match candidates exactly.
- Use nutrition numbers exactly from candidates (don’t invent).
- MUST return 8 results if possible.
- Item names must be unique (case-insensitive).

Candidates:
${JSON.stringify(compactCandidates)}

Now return only JSON.
`.trim();
}
