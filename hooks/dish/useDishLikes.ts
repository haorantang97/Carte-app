import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import { discoverFeedKey, type FeedPage } from '@/hooks/feed/useDiscoverFeed';

/**
 * Toggle a like with optimistic update applied to:
 *  - the discover-feed cache (so the heart fills immediately)
 *  - the dish-detail cache (Phase G)
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
      await qc.cancelQueries({ queryKey: discoverFeedKey });
      const prev = qc.getQueryData<InfiniteData<FeedPage>>(discoverFeedKey);
      qc.setQueryData<InfiniteData<FeedPage> | undefined>(discoverFeedKey, (cur) => {
        if (!cur) return cur;
        return {
          ...cur,
          pages: cur.pages.map((page) => ({
            ...page,
            items: page.items.map((d) =>
              d.id === dishId
                ? {
                    ...d,
                    liked_by_me: !liked,
                    likes_count: Math.max(0, d.likes_count + (liked ? -1 : 1)),
                  }
                : d,
            ),
          })),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(discoverFeedKey, ctx.prev);
    },
  });
}
