import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { readEdgeError } from '@/lib/edgeError';

export interface RecipeIngredient {
  name: string;
  quantity?: string;
  note?: string;
}

export interface RecipeStep {
  order: number;
  instruction: string;
  duration_min?: number;
  tip?: string;
}

export interface ExtractedRecipe {
  name: string;
  name_en?: string;
  description: string;
  cuisine?: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  total_time_min?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface ExtractInput {
  url?: string;
  text?: string;
  imageBase64?: string;
  imageMimeType?: string;
}

interface ExtractResponse {
  recipe: ExtractedRecipe;
  source: {
    mode: 'text' | 'image' | 'native_gemini' | 'html_recipe_jsonld' | 'html_fetch' | 'html_fetch_simple' | 'apify';
    platform?: string;
    actor?: string;
  };
}

/**
 * Calls the `extract-recipe` Supabase Edge Function which:
 * 1. Routes a URL to the right extractor (Apify / native Gemini / JSON-LD / HTML)
 * 2. Or accepts raw text / image upload
 * 3. Fuses all signals via Gemini 2.5 Flash → structured recipe JSON
 *
 * Slow (10-90s end-to-end depending on path).
 */
export function useExtractRecipe() {
  return useMutation({
    mutationFn: async (input: ExtractInput): Promise<ExtractResponse> => {
      const hasAny = !!(input.url || input.text || input.imageBase64);
      if (!hasAny) {
        throw new Error('Provide url, text, or imageBase64');
      }
      const { data, error } = await supabase.functions.invoke<ExtractResponse>(
        'extract-recipe',
        {
          body: {
            url: input.url?.trim() || undefined,
            text: input.text?.trim() || undefined,
            imageBase64: input.imageBase64 || undefined,
            imageMimeType: input.imageMimeType || undefined,
          },
        },
      );
      if (error) {
        // 真正的错误信息在 error.context (Response body),不是 error.message
        const real = await readEdgeError(error);
        throw new Error(real);
      }
      if (!data?.recipe) throw new Error('No recipe in response');
      return data;
    },
  });
}

/**
 * Adapter: convert Edge Function recipe → DishSheet form fields.
 * Returns name, description, ingredients[], recipe (multi-line text from steps).
 */
export function recipeToFormFields(r: ExtractedRecipe): {
  name: string;
  description: string;
  ingredients: string[];
  recipe: string;
} {
  return {
    name: r.name,
    description: r.description,
    ingredients: r.ingredients.map((ing) =>
      ing.quantity ? `${ing.name} ${ing.quantity}` : ing.name,
    ),
    recipe: r.steps
      .sort((a, b) => a.order - b.order)
      .map(
        (s) =>
          `${s.order}. ${s.instruction}${s.tip ? `\n   💡 ${s.tip}` : ''}`,
      )
      .join('\n'),
  };
}
