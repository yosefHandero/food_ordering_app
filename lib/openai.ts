import { RecommendationRequest, RecommendationResult } from '@/type';
import { calculateContextAwareScores, generateWhyText } from './recommendations';

const HUGGINGFACE_API_KEY = process.env.HUGGING_FACE_API_KEY || process.env.HUGGINGFACE_API_KEY || process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY || process.env.EXPO_PUBLIC_HUGGING_FACE_API_KEY;
const HUGGINGFACE_MODEL = process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';

interface CandidateItem {
  restaurant: {
    id: string;
    name: string;
    distanceMiles?: number;
    rating?: number;
    deliveryTime?: string;
    cuisine?: string;
  };
  item: {
    id: string;
    name: string;
    calories?: number;
    protein?: number;
    price: number;
    sodium_mg?: number;
    sugar?: number;
    healthScore?: number; // camelCase to match actual data structure
    description?: string;
  };
}

/**
 * Call Hugging Face to rank and explain recommendations
 */
export async function rankWithOpenAI(
  candidates: CandidateItem[],
  request: RecommendationRequest
): Promise<RecommendationResult[]> {
  
  console.log('[Hugging Face] Starting ranking with:', {
    candidatesCount: candidates.length,
    goal: request.goal,
    timeOfDay: request.timeOfDay,
    hasApiKey: !!HUGGINGFACE_API_KEY,
    model: HUGGINGFACE_MODEL
  });

  if (!HUGGINGFACE_API_KEY) {
    console.error('[Hugging Face] API key not configured');
    throw new Error('Hugging Face API key not configured');
  }

  if (candidates.length === 0) {
    console.warn('[Hugging Face] No candidates provided, returning empty results');
    return [];
  }

  const prompt = buildPrompt(candidates, request);
  console.log('[Hugging Face] Prompt built, length:', prompt.length);
  const fullPrompt = `You are an expert nutritionist and meal planning specialist with deep knowledge of:
- Nutritional science and macronutrient requirements
- Meal timing and circadian nutrition
- Context-aware dietary recommendations
- Restaurant menu analysis and food composition

Your expertise includes understanding how different meal combinations, timing, and user goals interact to create optimal recommendations.

TASK: Analyze the provided candidate menu items and rank the top 8 that best match the user's specific goals, time of day, dietary context, and preferences. Provide detailed, personalized explanations for each recommendation.

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanatory text outside the JSON
2. Use the exact JSON structure specified in the prompt
3. Restaurant IDs and Item IDs must exactly match those from the candidates list
4. All nutritional values must match the candidate data exactly
5. Provide specific, personalized "why" explanations that reference the user's actual context

${prompt}

FINAL REMINDER: Return ONLY the JSON object. No additional text, explanations, or formatting outside the JSON structure.`;

  try {
    // Use Hugging Face Router API (new endpoint)
    const apiUrl = `https://router.huggingface.co/models/${HUGGINGFACE_MODEL}`;
    
    const response = await fetch(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 2000,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle model loading (503) - Hugging Face models load on first request
      if (response.status === 503) {
        const errorData = JSON.parse(errorText || '{}');
        const estimatedTime = errorData.estimated_time || 10;
        throw new Error(`Model is loading. Please wait ${estimatedTime} seconds and try again.`);
      }
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('[Hugging Face] Raw response received:', {
      isArray: Array.isArray(data),
      hasGeneratedText: !!(data.generated_text || (Array.isArray(data) && data[0]?.generated_text)),
      dataType: typeof data,
      dataKeys: Array.isArray(data) ? 'array' : Object.keys(data || {}),
      preview: JSON.stringify(data).substring(0, 200)
    });
    
    // Handle Hugging Face response format - support multiple response structures
    let content: string;
    if (Array.isArray(data)) {
      // Array response format
      if (data[0]?.generated_text) {
        content = data[0].generated_text;
      } else if (data[0] && typeof data[0] === 'string') {
        content = data[0];
      } else if (data[0] && typeof data[0] === 'object' && 'generated_text' in data[0]) {
        content = data[0].generated_text;
      } else {
        console.error('[Hugging Face] Unexpected array format:', JSON.stringify(data).substring(0, 500));
        throw new Error('Unexpected Hugging Face array response format');
      }
    } else if (data && typeof data === 'object') {
      // Object response format
      if (data.generated_text) {
        content = data.generated_text;
      } else if (data[0]?.generated_text) {
        content = data[0].generated_text;
      } else {
        console.error('[Hugging Face] Unexpected object format:', JSON.stringify(data).substring(0, 500));
        throw new Error('Unexpected Hugging Face object response format');
      }
    } else if (typeof data === 'string') {
      content = data;
    } else {
      console.error('[Hugging Face] Unexpected response format:', {
        type: typeof data,
        isArray: Array.isArray(data),
        data: JSON.stringify(data).substring(0, 500)
      });
      throw new Error('Unexpected Hugging Face response format');
    }

    if (!content || typeof content !== 'string') {
      console.error('[Hugging Face] Invalid content:', { content, type: typeof content });
      throw new Error('No valid content in Hugging Face response');
    }

    // Clean up the response - remove markdown code blocks if present
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    if (!content) {
      console.error('[Hugging Face] Content is empty after cleanup');
      throw new Error('No content in Hugging Face response after cleanup');
    }

    console.log('[Hugging Face] Extracted content preview:', content.substring(0, 200));

    let parsed;
    try {
      parsed = JSON.parse(content);
      console.log('[Hugging Face] Successfully parsed JSON');
    } catch (parseError: any) {
      console.warn('[Hugging Face] Direct JSON parse failed, trying to extract JSON from text:', parseError.message);
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          console.log('[Hugging Face] Successfully extracted and parsed JSON from text');
        } catch (extractError) {
          console.error('[Hugging Face] Failed to parse extracted JSON:', {
            originalError: parseError.message,
            extractError: extractError instanceof Error ? extractError.message : String(extractError),
            contentPreview: content.substring(0, 500)
          });
          throw new Error(`Failed to parse Hugging Face JSON response: ${parseError.message}. Content preview: ${content.substring(0, 200)}`);
        }
      } else {
        console.error('[Hugging Face] No JSON found in content:', {
          error: parseError.message,
          contentPreview: content.substring(0, 500)
        });
        throw new Error(`Failed to parse Hugging Face JSON response: ${parseError.message}. No JSON structure found in response.`);
      }
    }
    
    const aiResults = parsed.results || [];
    console.log('[Hugging Face] Parsed results count:', aiResults.length);
    
    if (!Array.isArray(aiResults)) {
      console.error('[Hugging Face] Results is not an array:', typeof aiResults, aiResults);
      throw new Error('Hugging Face response does not contain a results array');
    }
    
    if (aiResults.length === 0) {
      console.warn('[Hugging Face] AI returned empty results array. This might indicate:');
      console.warn('1. The model did not understand the prompt format');
      console.warn('2. The prompt was too complex');
      console.warn('3. The model returned results in an unexpected format');
      console.warn('Parsed object keys:', Object.keys(parsed));
      throw new Error('Hugging Face returned empty results. Check prompt format and model response.');
    }
    
    // Convert AI results to our format and calculate scores
    const mappedResults = aiResults.map((aiResult: any) => {
      let candidate = candidates.find(
        (c) => c.restaurant.id === aiResult.restaurant?.id && 
               c.item.id === aiResult.item?.id
      );
      
      // Fallback: try to match by name if ID match fails
      if (!candidate && aiResult.restaurant?.name && aiResult.item?.name) {
        candidate = candidates.find(
          (c) => c.restaurant.name === aiResult.restaurant?.name && 
                 c.item.name === aiResult.item?.name
        );
      }
      
      if (!candidate) {
        console.warn('[Hugging Face] Candidate not found for AI result:', {
          restaurantId: aiResult.restaurant?.id,
          restaurantName: aiResult.restaurant?.name,
          itemId: aiResult.item?.id,
          itemName: aiResult.item?.name,
          candidatesCount: candidates.length
        });
        return null;
      }
      
      const scores = calculateContextAwareScores(
        candidate.item,
        candidate.restaurant,
        request
      );
      
      return {
        restaurant: {
          id: candidate.restaurant.id,
          name: candidate.restaurant.name || aiResult.restaurant?.name,
          cuisine: candidate.restaurant.cuisine || aiResult.restaurant?.cuisine,
          rating: candidate.restaurant.rating || aiResult.restaurant?.rating,
          distanceMiles: candidate.restaurant.distanceMiles,
          deliveryTime: candidate.restaurant.deliveryTime || aiResult.restaurant?.deliveryTime,
        },
        item: {
          id: candidate.item.id,
          name: candidate.item.name || aiResult.item?.name,
          price: candidate.item.price || aiResult.item?.price,
          calories: candidate.item.calories || aiResult.item?.calories,
          protein: candidate.item.protein || aiResult.item?.protein,
          sodium_mg: candidate.item.sodium_mg || aiResult.item?.sodium_mg,
          sugar: candidate.item.sugar || aiResult.item?.sugar,
          health_score: candidate.item.healthScore, // Use camelCase from actual data
        },
        why: aiResult.why || generateWhyText(candidate.item, candidate.restaurant, request, scores),
        scores,
      };
    });
    
    const filteredResults = mappedResults.filter(Boolean) as RecommendationResult[];
    
    // Ensure variety - remove duplicates by item name (ensuring each item name appears only once)
    const seenItemNames = new Set<string>();
    const uniqueResults: RecommendationResult[] = [];
    
    // First pass: collect unique items by name
    for (const result of filteredResults) {
      const itemNameLower = result.item.name.toLowerCase();
      
      // Skip if we've already seen this item name (ensures variety)
      if (seenItemNames.has(itemNameLower)) {
        console.warn('[Hugging Face] Duplicate item name filtered out (ensuring variety):', result.item.name, 'from', result.restaurant.name);
        continue;
      }
      
      seenItemNames.add(itemNameLower);
      uniqueResults.push(result);
      
      // Stop once we have 8 unique items
      if (uniqueResults.length >= 8) break;
    }
    
    // If we don't have 8 unique results, try to fill from remaining candidates
    if (uniqueResults.length < 8) {
      console.warn('[Hugging Face] Only', uniqueResults.length, 'unique items found, trying to fill from remaining candidates');
      
      // Get remaining candidates that weren't selected by AI
      const selectedItemIds = new Set(uniqueResults.map(r => r.item.id));
      const remainingCandidates = candidates
        .filter(c => !selectedItemIds.has(c.item.id))
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
            },
            item: {
              id: c.item.id,
              name: c.item.name,
              price: c.item.price || 0,
              calories: c.item.calories,
              protein: c.item.protein,
              sodium_mg: c.item.sodium_mg,
              sugar: c.item.sugar,
              health_score: c.item.healthScore,
            },
            why: generateWhyText(c.item, c.restaurant, request, scores),
            scores,
          } as RecommendationResult;
        });
      
      // Add unique items from remaining candidates
      for (const candidate of remainingCandidates) {
        const itemNameLower = candidate.item.name.toLowerCase();
        if (!seenItemNames.has(itemNameLower) && uniqueResults.length < 8) {
          seenItemNames.add(itemNameLower);
          uniqueResults.push(candidate);
        }
      }
    }
    
    // Final validation: ensure absolutely no duplicate item names
    const finalItemNames = new Set<string>();
    const validatedResults = uniqueResults.filter(result => {
      const itemNameLower = result.item.name.toLowerCase().trim();
      if (finalItemNames.has(itemNameLower)) {
        console.warn('[Hugging Face] Duplicate item name in final results:', result.item.name, 'from', result.restaurant.name);
        return false;
      }
      finalItemNames.add(itemNameLower);
      return true;
    });
    
    const finalResults = validatedResults.slice(0, 8);
    
    console.log('[Hugging Face] Final results after mapping:', {
      aiResultsCount: aiResults.length,
      mappedCount: mappedResults.length,
      filteredCount: filteredResults.length,
      uniqueCount: uniqueResults.length,
      validatedCount: validatedResults.length,
      finalCount: finalResults.length,
      uniqueItems: finalResults.map(r => r?.item.name).filter(Boolean)
    });
    
    // Verify no duplicates in final results
    const finalNamesCheck = new Set<string>();
    const duplicates = finalResults.filter(r => {
      const name = r.item.name.toLowerCase().trim();
      if (finalNamesCheck.has(name)) {
        console.error('[Hugging Face] CRITICAL: Duplicate found in final results:', r.item.name);
        return true;
      }
      finalNamesCheck.add(name);
      return false;
    });
    
    if (duplicates.length > 0) {
      console.error('[Hugging Face] ERROR: Found', duplicates.length, 'duplicates in final results!');
    }
    
    if (finalResults.length === 0) {
      console.warn('[Hugging Face] No valid results after mapping. This might indicate:');
      console.warn('1. AI response format mismatch');
      console.warn('2. ID matching issues');
      console.warn('3. Empty AI results');
      console.warn('Candidates provided:', candidates.length);
      console.warn('AI results received:', aiResults.length);
    } else if (finalResults.length < 8) {
      console.warn('[Hugging Face] Only', finalResults.length, 'unique results found. Expected 8.');
    }
    
    return finalResults as RecommendationResult[];
  } catch (error: any) {
    console.error('Hugging Face ranking error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 200)
    });
    throw error;
  }
}

function buildPrompt(candidates: CandidateItem[], request: RecommendationRequest): string {
  // Build detailed goal context
  const goalContext = getGoalContext(request.goal);
  
  // Build time of day context
  const timeOfDayContext = getTimeOfDayContext(request.timeOfDay);
  
  // Build last meal context
  const lastMealContext = buildLastMealContext(request);
  
  // Build activity context
  const activityContext = request.activityLevel ? getActivityContext(request.activityLevel) : '';
  
  // Parse last meal time for better context
  const hoursSinceLastMeal = parseLastMealTimeForPrompt(request.lastMealTime);
  
  const context = `
## USER CONTEXT & PREFERENCES

**Primary Goal: ${request.goal.toUpperCase()}**
${goalContext}

**Time of Day: ${request.timeOfDay.toUpperCase()}**
${timeOfDayContext}

${lastMealContext}

${activityContext}

**Budget Constraint:** Maximum $${request.budgetMax} per item
**Search Radius:** ${request.radiusMiles} miles from user location

---

## CANDIDATE MENU ITEMS

Below are ${candidates.length} candidate menu items from nearby restaurants. Each item includes complete nutritional information, pricing, and restaurant details.

${candidates
  .map(
    (c, i) => `
### Candidate ${i + 1}
**Restaurant ID:** ${c.restaurant.id}
**Restaurant:** ${c.restaurant.name}${c.restaurant.cuisine ? ` (${c.restaurant.cuisine} cuisine)` : ''}
- Distance: ${c.restaurant.distanceMiles?.toFixed(1) || 'N/A'} miles
- Customer Rating: ${c.restaurant.rating ? `${c.restaurant.rating}/5.0` : 'N/A'}
- Estimated Delivery Time: ${c.restaurant.deliveryTime || 'N/A'}

**Item ID:** ${c.item.id}
**Item Name:** ${c.item.name}
- Price: $${c.item.price.toFixed(2)}
- Calories: ${c.item.calories !== undefined ? c.item.calories : 'N/A'}
- Protein: ${c.item.protein !== undefined ? `${c.item.protein}g` : 'N/A'}
- Sodium: ${c.item.sodium_mg !== undefined ? `${c.item.sodium_mg}mg` : 'N/A'}
- Sugar: ${c.item.sugar !== undefined ? `${c.item.sugar}g` : 'N/A'}
- Health Score: ${c.item.healthScore !== undefined ? `${c.item.healthScore}/100` : 'N/A'}
${c.item.description ? `- Description: ${c.item.description}` : ''}
`
  )
  .join('\n')}

---

## RANKING INSTRUCTIONS

You are an intelligent nutrition and meal planning expert. Your task is to **intelligently rank and recommend** the top 8 menu items that best serve the user's needs, even when perfect matches aren't available.

### 🎯 CORE PRINCIPLE: FLEXIBILITY & INTELLIGENCE

**Prioritize quality, relevance, and user benefit over strict filtering.** If no perfect match exists for the user's goal, intelligently suggest the **best available alternative** that still provides value. It's better to recommend a good option than to return empty results.

### Ranking Priority (in order of importance):

1. **OVERALL QUALITY & RELEVANCE** - Consider the complete picture:
   - How well does this item serve the user's primary goal (${request.goal})?
   - Is it suitable for ${request.timeOfDay}?
   - Does it provide good nutritional value?
   - Would the user benefit from this recommendation?
   - **If perfect matches are scarce, prioritize the best available options that still align with the user's intent**

2. **GOAL ALIGNMENT (${request.goal})** - ${getGoalRankingInstructions(request.goal)}
   - **Be flexible**: If exact matches aren't available, suggest items that partially meet the goal
   - For "high-protein": Prefer 20g+ protein, but 15-20g is acceptable if other factors are excellent
   - For "low-cal": Prefer <500 cal, but 500-600 cal is acceptable if nutritionally dense
   - For "low-carb": Prefer <30g carbs, but 30-40g is acceptable if high in protein/fiber
   - For "balanced": Look for overall nutritional quality, not perfection
   
3. **TIME-OF-DAY SUITABILITY (${request.timeOfDay})** - ${getTimeOfDayRankingInstructions(request.timeOfDay, hoursSinceLastMeal)}
   - Consider meal timing, but don't exclude good options just because they're slightly outside ideal ranges
   
4. **CONTEXT-AWARE HEALTH SCORE** - Consider:
   - Base nutritional quality (protein, fiber, vitamins)
   - Low sodium (< 800mg ideal, < 1200mg acceptable)
   - Low added sugar (< 25g ideal)
   - Appropriate calorie range for time of day
   - ${request.lastMeal ? 'Adjustments based on last meal context (see below)' : 'No last meal context provided'}
   - **Prioritize items with good overall nutrition, even if not perfect**
   
5. **LAST MEAL COMPATIBILITY**${request.lastMeal ? ` - ${getLastMealRankingInstructions(request, hoursSinceLastMeal)}` : ' - Not applicable (no last meal info)'}
   - Consider meal history, but don't be overly restrictive
   
6. **PRICE VALUE** - Items within budget ($${request.budgetMax}) are preferred
   - **Quality over price**: If an item is slightly over budget but significantly better, consider it
   - Items 10-15% over budget are acceptable if they're clearly superior
   
7. **DISTANCE & CONVENIENCE** - Closer restaurants are slightly preferred
   - **Quality over distance**: A great option 6 miles away beats a mediocre option 2 miles away

### 🧠 INTELLIGENT RECOMMENDATION STRATEGY:

- **If perfect matches exist**: Prioritize them, but still include variety
- **If perfect matches are limited**: Include the best available alternatives that still provide value
- **If no perfect matches exist**: Recommend the closest alternatives that align with the user's intent
- **Always aim for 8 recommendations**: Fill the list with the best available options, even if they're not perfect matches
- **Prioritize user benefit**: What would actually help the user most right now?

### Context-Aware Adjustments:

${getContextAdjustments(request, hoursSinceLastMeal)}

### "Why" Explanation Guidelines:

For each recommendation, provide a clear, concise 1-2 sentence explanation that:
- Highlights the primary reason it matches the user's goal (${request.goal})
- Mentions why it's suitable for ${request.timeOfDay}
${request.lastMeal ? `- Notes how it complements or contrasts with their last meal (${request.lastMeal})` : ''}
- Includes specific nutritional highlights (e.g., "high in protein", "low calorie", "rich in fiber")
- Mentions restaurant quality if rating > 4.0

Examples of good "why" explanations:
- "High-protein grilled chicken bowl (${request.goal === 'high-protein' ? '35g protein' : 'balanced macros'}) perfect for ${request.timeOfDay}, with fresh vegetables and whole grains."
- "Light, nutrient-dense option ideal for ${request.timeOfDay}${request.lastMeal ? ` after your recent ${request.lastMeal}` : ''}, featuring lean protein and minimal sodium."
- "Balanced meal with ${request.goal === 'low-cal' ? 'only 420 calories' : 'excellent nutritional profile'} and high fiber content, great for ${request.timeOfDay}."

---

## OUTPUT FORMAT

Return ONLY valid JSON in this exact structure. Do not include any markdown, code blocks, or explanatory text outside the JSON.

{
  "results": [
    {
      "restaurant": {
        "id": "restaurant-id-here",  // MUST exactly match Restaurant ID from candidates above
        "name": "Restaurant Name",
        "cuisine": "Cuisine Type",
        "rating": 4.5,
        "deliveryTime": "25-35 min"
      },
      "item": {
        "id": "item-id-here",  // MUST exactly match Item ID from candidates above
        "name": "Item Name",
        "price": 14.99,
        "calories": 450,
        "protein": 35,
        "sodium_mg": 800,
        "sugar": 10,
        "health_score": 75
      },
      "why": "Clear 1-2 sentence explanation of why this recommendation fits the user's goals and context"
    }
  ]
}

CRITICAL REQUIREMENTS: 
- **Return exactly 8 results** (or as many as possible if fewer candidates available)
- **Restaurant ID and Item ID must exactly match** those from the candidates list above
- **All nutritional values must match** the candidate data exactly (use the values provided, don't estimate)
- **The "why" field must be specific, informative, and personalized** to the user's context
- **ABSOLUTE VARIETY REQUIREMENT**: You MUST select 8 DIFFERENT menu items with DIFFERENT names. Do NOT return the same item name twice, even from different restaurants. Each item name must be unique across all 8 results.
- **Restaurant variety**: Prefer selecting items from different restaurants when possible
- **Item name uniqueness**: Before returning, verify that no two results have the same item name (case-insensitive). If you see duplicates, replace them with different items from the candidates list.
- **Diverse selection**: Include different restaurants, different cuisine types, and different menu items to give the user real variety
- **Be intelligent**: If an item doesn't perfectly match the goal but is still a good choice, include it with an explanation of why it's valuable

VALIDATION CHECKLIST BEFORE RETURNING:
1. Count unique item names - must be exactly 8 different names
2. Verify no duplicate item names (case-insensitive comparison)
3. Ensure items match the user's goal (${request.goal})
4. Confirm variety in restaurants and cuisine types

IMPORTANT: If you find duplicate item names in your results, you MUST replace them with different items from the candidates list. Variety is non-negotiable for user experience.

REMEMBER: The goal is to provide helpful, intelligent recommendations that adapt to real-world availability. Better to suggest good alternatives than to return empty results.
`;

  return context;
}

// Helper functions for building detailed context

function getGoalContext(goal: string): string {
  const contexts: Record<string, string> = {
    'high-protein': `The user wants to maximize protein intake. Prioritize items with:
- Protein content: 25g+ is excellent, 20-25g is good, 15-20g is acceptable
- Complete proteins (animal sources or complete plant combinations)
- Lower saturated fat when possible
- Protein-to-calorie ratio matters: aim for at least 1g protein per 20 calories`,
    'low-cal': `The user wants to minimize calorie intake. Prioritize items with:
- Calories: < 400 is excellent, 400-500 is good, 500-600 is acceptable
- High nutrient density (vitamins, minerals, fiber per calorie)
- Avoid calorie-dense items (fried foods, heavy sauces, high-fat items)
- Focus on lean proteins, vegetables, and whole grains`,
    'low-carb': `The user wants to minimize carbohydrate intake. Prioritize items with:
- Carbs: < 20g is excellent, 20-30g is good, 30-40g is acceptable
- Focus on protein and healthy fats
- Avoid bread, pasta, rice, potatoes, sugary items
- Prefer vegetables, lean meats, eggs, nuts`,
    'balanced': `The user wants a well-balanced meal. Prioritize items with:
- Moderate calories (400-700 range ideal)
- Good protein (15-30g)
- Complex carbs and fiber
- Healthy fats
- Variety of nutrients (vitamins, minerals)
- Not too high in sodium or added sugar`
  };
  return contexts[goal] || contexts['balanced'];
}

function getTimeOfDayContext(timeOfDay: string): string {
  const contexts: Record<string, string> = {
    'breakfast': `Breakfast considerations:
- Lighter to moderate portions (400-600 calories ideal)
- Protein-rich options help with satiety and energy
- Moderate sodium preferred (breakfast items can be high in sodium)
- Complex carbs for sustained energy
- Avoid overly heavy or greasy items`,
    'lunch': `Lunch considerations:
- Moderate portions (500-700 calories ideal)
- Balanced macronutrients for afternoon energy
- Can accommodate higher carbs if user is active
- Protein helps prevent afternoon crashes
- Avoid overly heavy meals that cause drowsiness`,
    'dinner': `Dinner considerations:
- Moderate to larger portions acceptable (500-800 calories)
- Consider time: late dinners (>8pm) should be lighter
- Lower sodium preferred, especially for late dinners
- Balanced meal to support recovery and sleep
- Avoid very heavy, high-fat meals late at night`,
    'snack': `Snack considerations:
- Small portions (150-300 calories ideal)
- Nutrient-dense options preferred
- Protein and fiber help with satiety
- Avoid empty calories (sugary drinks, chips)
- Should complement previous/upcoming meals`
  };
  return contexts[timeOfDay] || '';
}

function buildLastMealContext(request: RecommendationRequest): string {
  if (!request.lastMeal) {
    return '';
  }
  
  const hoursSince = parseLastMealTimeForPrompt(request.lastMealTime);
  const lastMealLower = request.lastMeal.toLowerCase();
  const isHeavy = lastMealLower.includes('pizza') ||
                  lastMealLower.includes('burger') ||
                  lastMealLower.includes('fried') ||
                  lastMealLower.includes('heavy') ||
                  request.lastMealHeaviness === 'heavy';
  
  let context = `**Last Meal Context:**\n`;
  context += `- Last meal: ${request.lastMeal}\n`;
  if (hoursSince !== null) {
    context += `- Time since last meal: ${hoursSince < 1 ? `${Math.round(hoursSince * 60)} minutes ago` : `${hoursSince.toFixed(1)} hours ago`}\n`;
  } else if (request.lastMealTime) {
    context += `- Time since last meal: ${request.lastMealTime}\n`;
  }
  
  if (isHeavy) {
    context += `- Heaviness: Heavy/rich meal\n`;
  }
  
  context += `\n**Implications:**\n`;
  if (isHeavy && hoursSince !== null && hoursSince < 3) {
    context += `- User recently had a heavy meal → prioritize lighter, lower-sodium options\n`;
    context += `- Avoid high-fat, fried, or very calorie-dense items\n`;
    context += `- Focus on fresh, nutrient-dense options with vegetables\n`;
  } else if (hoursSince !== null && hoursSince < 2) {
    context += `- Recent meal → lighter portions recommended\n`;
  } else if (hoursSince !== null && hoursSince > 5) {
    context += `- Long time since last meal → user may need more substantial meal\n`;
    context += `- Can accommodate higher calorie options if nutritionally sound\n`;
  } else {
    context += `- Consider meal timing when ranking recommendations\n`;
  }
  
  return context;
}

function getActivityContext(activityLevel: string): string {
  const contexts: Record<string, string> = {
    'workout': `**Activity Level: Workout**
- User is planning to or just completed a workout
- Higher protein needs for muscle recovery
- Can accommodate higher carbs for energy/replenishment
- Balanced meals with good protein-to-carb ratio preferred`,
    'light': `**Activity Level: Light Activity**
- User has light activity planned
- Standard nutritional recommendations apply
- Moderate portions appropriate`,
    'sedentary': `**Activity Level: Sedentary**
- User has minimal activity planned
- Lighter portions may be more appropriate
- Focus on nutrient density over calorie quantity`
  };
  return contexts[activityLevel] || '';
}

function getGoalRankingInstructions(goal: string): string {
  const instructions: Record<string, string> = {
    'high-protein': 'Prioritize items with highest protein content (25g+ ideal, 20-25g good, 15-20g acceptable). Consider protein quality and protein-to-calorie ratio. Items with complete proteins rank higher. If high-protein options are limited, include the best available protein sources.',
    'low-cal': 'Prioritize items with lowest calories while maintaining nutritional quality. Items under 500 calories rank highest, 500-600 calories are good, 600-700 calories acceptable if nutritionally dense. Avoid calorie-dense options, but don\'t exclude items that are slightly higher if they provide excellent nutrition.',
    'low-carb': 'Prioritize items with lowest carbohydrate content (< 30g ideal, 30-40g good, 40-50g acceptable if high in protein/fiber). Focus on protein and healthy fats. Avoid bread, pasta, rice, and sugary items, but be flexible if the item is otherwise excellent.',
    'balanced': 'Prioritize items with good balance of macronutrients, moderate calories (400-700 ideal, 300-800 acceptable), adequate protein (15-30g), and variety of micronutrients. Look for overall nutritional quality rather than perfection in any single metric.'
  };
  return instructions[goal] || instructions['balanced'];
}

function getTimeOfDayRankingInstructions(timeOfDay: string, hoursSinceLastMeal: number | null): string {
  const hour = new Date().getHours();
  const isLateDinner = timeOfDay === 'dinner' && hour >= 20;
  
  if (timeOfDay === 'breakfast') {
    return 'Prioritize lighter to moderate portions (400-600 cal). Protein-rich options rank higher. Moderate sodium preferred. Avoid overly heavy or greasy items.';
  } else if (timeOfDay === 'lunch') {
    return 'Prioritize moderate, balanced meals (500-700 cal). Can accommodate higher carbs if user is active. Protein helps prevent afternoon crashes.';
  } else if (timeOfDay === 'dinner') {
    if (isLateDinner) {
      return 'LATE DINNER (>8pm): Prioritize lighter portions (400-600 cal), lower sodium (< 800mg), and easily digestible options. Avoid heavy, high-fat meals.';
    }
    return 'Prioritize moderate to larger portions (500-800 cal). Lower sodium preferred. Balanced meal to support recovery and sleep.';
  } else if (timeOfDay === 'snack') {
    return 'Prioritize small, nutrient-dense options (150-300 cal). High protein and fiber rank higher. Avoid empty calories.';
  }
  return '';
}

function getLastMealRankingInstructions(request: RecommendationRequest, hoursSinceLastMeal: number | null): string {
  if (!request.lastMeal) return '';
  
  const lastMealLower = request.lastMeal.toLowerCase();
  const isHeavy = lastMealLower.includes('pizza') ||
                  lastMealLower.includes('burger') ||
                  lastMealLower.includes('fried') ||
                  lastMealLower.includes('heavy') ||
                  request.lastMealHeaviness === 'heavy';
  
  if (isHeavy && hoursSinceLastMeal !== null && hoursSinceLastMeal < 3) {
    return 'User recently had a heavy meal. Prioritize lighter options (< 500 cal), lower sodium (< 800mg), fresh vegetables, and avoid fried/high-fat items.';
  } else if (hoursSinceLastMeal !== null && hoursSinceLastMeal < 2) {
    return 'Recent meal. Prioritize lighter portions and nutrient-dense options.';
  } else if (hoursSinceLastMeal !== null && hoursSinceLastMeal > 5) {
    return 'Long time since last meal. User may need more substantial meal. Can accommodate higher calorie options if nutritionally sound.';
  }
  return 'Consider meal timing when ranking.';
}

function getContextAdjustments(request: RecommendationRequest, hoursSinceLastMeal: number | null): string {
  const hour = new Date().getHours();
  const isLateDinner = request.timeOfDay === 'dinner' && hour >= 20;
  const lastMealLower = request.lastMeal?.toLowerCase() || '';
  const isHeavyLastMeal = lastMealLower.includes('pizza') ||
                          lastMealLower.includes('burger') ||
                          lastMealLower.includes('fried') ||
                          lastMealLower.includes('heavy') ||
                          request.lastMealHeaviness === 'heavy';
  
  let adjustments = '';
  
  if (isLateDinner) {
    adjustments += '- **Late Dinner Adjustment:** Reduce scores for items > 600 calories, > 1000mg sodium, or high in saturated fat\n';
  }
  
  if (isHeavyLastMeal && hoursSinceLastMeal !== null && hoursSinceLastMeal < 3) {
    adjustments += '- **Heavy Recent Meal Adjustment:** Boost scores for items < 500 calories, < 800mg sodium, with fresh vegetables. Reduce scores for fried, high-fat, or very calorie-dense items\n';
  }
  
  if (request.goal === 'high-protein' && request.activityLevel === 'workout') {
    adjustments += '- **Workout + High Protein:** Boost scores for items with 30g+ protein and moderate carbs (40-60g) for recovery\n';
  }
  
  if (request.timeOfDay === 'snack') {
    adjustments += '- **Snack Adjustment:** Heavily penalize items > 400 calories. Boost scores for items with protein (10g+) and fiber (3g+)\n';
  }
  
  if (!adjustments) {
    adjustments = '- Apply standard nutritional guidelines based on goal and time of day\n';
  }
  
  return adjustments;
}

function parseLastMealTimeForPrompt(timeStr: string | null | undefined): number | null {
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
  
  return null;
}

