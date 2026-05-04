import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import { cacheBus, dishCommentsKey } from '@/lib/cacheKeys';

export type DishCommentRow = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
};

export { dishCommentsKey };

export function useDishComments(dishId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useSession();

  const query = useQuery({
    queryKey: dishId ? dishCommentsKey(dishId) : ['dish-comments', 'noop'],
    enabled: !!dishId,
    queryFn: async (): Promise<DishCommentRow[]> => {
      const { data, error } = await supabase
        .from('dish_comments')
        .select('id, content, created_at, user_id, profiles!inner(id, username, avatar_url)')
        .eq('dish_id', dishId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .filter((c: any) => c.profiles)
        .map((c: any) => ({
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          user_id: c.user_id,
          username: c.profiles.username,
          avatar_url: c.profiles.avatar_url,
        }));
    },
  });

  // Realtime: refetch on any change for this dish (cheap; comments per dish are small)
  useEffect(() => {
    if (!dishId) return;
    const nonce = Math.random().toString(36).slice(2, 8);
    const channel = supabase
      .channel(`dish_comments:${dishId}:${user?.id ?? 'anon'}:${nonce}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dish_comments',
          filter: `dish_id=eq.${dishId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: dishCommentsKey(dishId) });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [dishId, user?.id, qc]);

  return query;
}

export function usePostComment(dishId: string) {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error('Not signed in');
      const trimmed = content.trim();
      if (!trimmed) throw new Error('Empty');
      const { error } = await supabase
        .from('dish_comments')
        .insert({ dish_id: dishId, user_id: user.id, content: trimmed });
      if (error) throw error;
    },
    // Realtime in useDishComments handles the typical case, but we also
    // bust here for resilience (offline → realtime catches up only after reconnect).
    onSuccess: () => cacheBus.afterCommentMutate(qc, dishId),
  });
}

export function useDeleteComment(dishId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dish_comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => cacheBus.afterCommentMutate(qc, dishId),
  });
}
