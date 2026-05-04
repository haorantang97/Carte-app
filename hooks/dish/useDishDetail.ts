import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';

export type DishDetail = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  ingredients: Array<{ name: string; quantity?: string; note?: string } | string>;
  recipe: string | null;
  recipe_is_private: boolean;
  group_id: string;
  group_name: string;
  chef_id: string;
  chef_username: string;
  chef_avatar_url: string | null;
  likes_count: number;
  liked_by_me: boolean;
  created_at: string;
  // AI-extracted rich fields (all nullable for back-compat)
  cuisine: string | null;
  calories: number | null;
  nutrition: { protein_g?: number; fat_g?: number; carbs_g?: number; fiber_g?: number } | null;
  prep_steps: Array<{ order: number; instruction: string; duration_min?: number; tip?: string }> | null;
  cook_steps: Array<{ order: number; instruction: string; duration_min?: number; tip?: string }> | null;
  tools: string[] | null;
  tags: string[] | null;
  total_time_min: number | null;
  servings: number | null;
  difficulty: string | null;
  source_platform: string | null;
  source_url: string | null;
};

export const dishDetailKey = (dishId: string) => ['dish-detail', dishId] as const;

export function useDishDetail(dishId: string | undefined) {
  const { user } = useSession();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: dishId ? dishDetailKey(dishId) : ['dish-detail', 'noop'],
    enabled: !!dishId,
    queryFn: async (): Promise<DishDetail> => {
      const dishRes = await supabase
        .from('dishes')
        .select(
          `id, name, description, price, image_url, ingredients, recipe, recipe_is_private,
           cuisine, calories, nutrition, prep_steps, cook_steps, tools, tags,
           total_time_min, servings, difficulty, source_platform, source_url,
           group_id, created_at,
           menu_groups!inner (id, name, chef_id, profiles!menu_groups_chef_id_fkey!inner (id, username, avatar_url))`,
        )
        .eq('id', dishId!)
        .single();
      if (dishRes.error) throw dishRes.error;
      const d = dishRes.data as any;
      // !inner joins guarantee menu_groups + chef profile exist; if either
      // is missing we'd dereference null below. Surface the inconsistency.
      if (!d?.menu_groups) throw new Error('Menu group missing for dish ' + dishId);
      if (!d.menu_groups.profiles) {
        throw new Error('Chef profile missing for dish ' + dishId);
      }

      const [{ data: allLikes }, { data: myLikes }] = await Promise.all([
        supabase.from('dish_likes').select('user_id').eq('dish_id', dishId!),
        user?.id
          ? supabase
              .from('dish_likes')
              .select('user_id')
              .eq('dish_id', dishId!)
              .eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
      ]);

      // If recipe is private and viewer is not the chef, mask it
      const isChef = user?.id === d.menu_groups.chef_id;
      const recipe = d.recipe_is_private && !isChef ? null : d.recipe;

      return {
        id: d.id,
        name: d.name,
        description: d.description,
        price: Number(d.price ?? 0),
        image_url: d.image_url,
        ingredients: Array.isArray(d.ingredients) ? d.ingredients : [],
        recipe,
        recipe_is_private: d.recipe_is_private,
        group_id: d.menu_groups.id,
        group_name: d.menu_groups.name,
        chef_id: d.menu_groups.chef_id,
        chef_username: d.menu_groups.profiles.username,
        chef_avatar_url: d.menu_groups.profiles.avatar_url,
        likes_count: allLikes?.length ?? 0,
        liked_by_me: (myLikes ?? []).length > 0,
        created_at: d.created_at,
        cuisine: d.cuisine ?? null,
        calories: d.calories ?? null,
        nutrition: d.nutrition ?? null,
        prep_steps: Array.isArray(d.prep_steps) ? d.prep_steps : null,
        cook_steps: Array.isArray(d.cook_steps) ? d.cook_steps : null,
        tools: Array.isArray(d.tools) ? d.tools : null,
        tags: Array.isArray(d.tags) ? d.tags : null,
        total_time_min: d.total_time_min ?? null,
        servings: d.servings ?? null,
        difficulty: d.difficulty ?? null,
        source_platform: d.source_platform ?? null,
        source_url: d.source_url ?? null,
      };
    },
  });

  // Realtime: keep this dish's like count fresh while DishDetail is mounted.
  // Channel names need a nonce: under React StrictMode double-mount, the
  // first mount's removeChannel races with the second mount's subscribe;
  // re-using the same channel name makes the second .on() error out.
  useEffect(() => {
    if (!dishId) return;
    const nonce = Math.random().toString(36).slice(2, 8);
    const channel = supabase
      .channel(`dish_likes:detail:${dishId}:${user?.id ?? 'anon'}:${nonce}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dish_likes',
          filter: `dish_id=eq.${dishId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { user_id?: string } | undefined;
          qc.setQueryData<DishDetail | undefined>(dishDetailKey(dishId), (cur) => {
            if (!cur) return cur;
            const delta = payload.eventType === 'INSERT' ? 1 : payload.eventType === 'DELETE' ? -1 : 0;
            const isMine = row?.user_id === user?.id;
            return {
              ...cur,
              likes_count: Math.max(0, cur.likes_count + delta),
              liked_by_me: isMine
                ? payload.eventType === 'INSERT'
                : cur.liked_by_me,
            };
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [dishId, user?.id, qc]);

  return query;
}
