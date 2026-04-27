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
  ingredients: string[];
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
          `id, name, description, price, image_url, ingredients, recipe, recipe_is_private, group_id, created_at,
           menu_groups!inner (id, name, chef_id, profiles!inner (id, username, avatar_url))`,
        )
        .eq('id', dishId!)
        .single();
      if (dishRes.error) throw dishRes.error;
      const d = dishRes.data as any;

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
        price: Number(d.price),
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
      };
    },
  });

  // Realtime: keep this dish's like count fresh while DishDetail is mounted
  useEffect(() => {
    if (!dishId) return;
    const channel = supabase
      .channel(`dish_likes:detail:${dishId}:${user?.id ?? 'anon'}`)
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
