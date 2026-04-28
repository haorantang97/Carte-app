import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface GenerateInput {
  name: string;
  description?: string;
}

interface GenerateResponse {
  url: string;
  path: string;
}

/**
 * Calls the `generate-dish-image` Supabase Edge Function which:
 *   1. Sends prompt (locked Cloud-Dancer doodle style + dish name + optional desc)
 *      to OpenClaw API (/v1/responses, model=gpt-5.4 + image_generation tool)
 *   2. Uploads the returned PNG to menu-images storage as the caller's user
 *   3. Returns the public URL
 *
 * Slow (~60-90s end-to-end). Mutation surface:
 *   - `mutate({ name, description })`
 *   - On success: returns the public URL string for the new image
 */
export function useGenerateDishImage() {
  return useMutation({
    mutationFn: async (input: GenerateInput): Promise<string> => {
      const trimmedName = input.name?.trim();
      if (!trimmedName) throw new Error('Missing dish name');

      const { data, error } = await supabase.functions.invoke<GenerateResponse>(
        'generate-dish-image',
        {
          body: {
            name: trimmedName,
            description: input.description?.trim() || undefined,
          },
        },
      );

      if (error) {
        throw new Error(error.message ?? 'Edge function failed');
      }
      if (!data?.url) {
        throw new Error('No image URL returned');
      }
      return data.url;
    },
  });
}
