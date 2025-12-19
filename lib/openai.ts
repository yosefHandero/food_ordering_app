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
  if (!HUGGINGFACE_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }

  const prompt = buildPrompt(candidates, request);
  const fullPrompt = `You are a nutrition and meal planning expert. Rank food recommendations based on user goals, time of day, and dietary context. Always respond with valid JSON only. Use the exact format specified.

${prompt}

Return only valid JSON, no additional text.`;

  try {
    // Use Hugging Face Inference API
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HUGGINGFACE_MODEL}`,
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
    
    // Handle Hugging Face response format
    let content: string;
    if (Array.isArray(data) && data[0]?.generated_text) {
      content = data[0].generated_text;
    } else if (data.generated_text) {
      content = data.generated_text;
    } else if (Array.isArray(data) && data[0] && typeof data[0] === 'object' && 'generated_text' in data[0]) {
      content = data[0].generated_text;
    } else if (typeof data === 'string') {
      content = data;
    } else {
      console.error('[Hugging Face] Unexpected response format:', JSON.stringify(data).substring(0, 500));
      throw new Error('Unexpected Hugging Face response format');
    }

    // Clean up the response - remove markdown code blocks if present
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    if (!content) {
      throw new Error('No content in Hugging Face response');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError: any) {
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error(`Failed to parse Hugging Face JSON response: ${parseError.message}`);
        }
      } else {
        throw new Error(`Failed to parse Hugging Face JSON response: ${parseError.message}`);
      }
    }
    
    const aiResults = parsed.results || [];
    
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
    
    const filteredResults = mappedResults.filter(Boolean);
    const finalResults = filteredResults.slice(0, 8);
    
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
  const context = `
User Goal: ${request.goal}
Time of Day: ${request.timeOfDay}
${request.lastMeal ? `Last Meal: ${request.lastMeal} (${request.lastMealTime || 'recently'})` : ''}
${request.activityLevel ? `Activity Level: ${request.activityLevel}` : ''}
${request.lastMealHeaviness ? `Last Meal Heaviness: ${request.lastMealHeaviness}` : ''}
Budget: $${request.budgetMax}
Radius: ${request.radiusMiles} miles

Candidates:
${candidates
  .map(
    (c, i) => `
${i + 1}. Restaurant ID: ${c.restaurant.id}
   Restaurant: ${c.restaurant.name} (${c.restaurant.cuisine || 'Various'})
   - Distance: ${c.restaurant.distanceMiles?.toFixed(1) || 'N/A'} mi
   - Rating: ${c.restaurant.rating || 'N/A'}/5
   - Delivery: ${c.restaurant.deliveryTime || 'N/A'}
   Item ID: ${c.item.id}
   Item: ${c.item.name}
   - Calories: ${c.item.calories || 'N/A'}
   - Protein: ${c.item.protein || 'N/A'}g
   - Sodium: ${c.item.sodium_mg || 'N/A'}mg
   - Sugar: ${c.item.sugar || 'N/A'}g
   - Price: $${c.item.price}
   - Health Score: ${c.item.healthScore || 'N/A'}/100
   - Description: ${c.item.description || 'N/A'}
`
  )
  .join('\n')}

Rank the top 8 recommendations based on priority order:
1. Health score (context-aware, considering time of day and last meal)
2. Goal alignment (${request.goal})
3. Time-of-day suitability (${request.timeOfDay})
4. Last meal compatibility (heaviness + time since last meal)
5. Price within budget
6. Distance

Apply context-aware adjustments based on time of day and last meal information.

IMPORTANT: You MUST include the exact Restaurant ID and Item ID from the candidates list above for each result. The IDs are critical for matching.

Return JSON in this exact format:
{
  "results": [
    {
      "restaurant": {
        "id": "restaurant-id",  // MUST match one of the Restaurant IDs from the candidates list
        "name": "Restaurant Name",
        "cuisine": "Italian",
        "rating": 4.5,
        "deliveryTime": "25-35 min"
      },
      "item": {
        "id": "item-id",  // MUST match one of the Item IDs from the candidates list
        "name": "Item Name",
        "price": 14.99,
        "calories": 450,
        "protein": 35,
        "sodium_mg": 800,
        "sugar": 10,
        "health_score": 75
      },
      "why": "1-2 lines explaining why this is a good choice"
    }
  ]
}
`;

  return context;
}

