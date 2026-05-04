import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import { dishDetailKey } from '@/lib/cacheKeys';
import { type DishDetail } from '@/hooks/dish/useDishDetail';

/**
 * Toggle a like, optimistically updating the dish-detail cache.
 * (Discover feed was removed in the P0 IA refactor.)
 */
export function useToggleDishLike() {
  const { user } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ dishId, liked }: { dishId: string; liked: boolean }) => {
      if (!user?.id) throw new Error('Not signed in');
      if (liked) {
        const { error } = await supabase
          .from('dish_likes')
          .delete()
          .eq('dish_id', dishId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('dish_likes')
          .insert({ dish_id: dishId, user_id: user.id });
        if (error && error.code !== '23505') throw error;
      }
    },
    onMutate: async ({ dishId, liked }) => {
      await qc.cancelQueries({ queryKey: dishDetailKey(dishId) });
      const prev = qc.getQueryData<DishDetail>(dishDetailKey(dishId));
      qc.setQueryData<DishDetail | undefined>(dishDetailKey(dishId), (cur) =>
        cur
          ? {
              ...cur,
              liked_by_me: !liked,
              likes_count: Math.max(0, cur.likes_count + (liked ? -1 : 1)),
            }
          : cur,
      );
      return { prev, dishId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(dishDetailKey(ctx.dishId), ctx.prev);
    },
  });
}
