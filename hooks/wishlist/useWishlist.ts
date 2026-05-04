import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import { cacheBus, wishlistKey } from '@/lib/cacheKeys';

export type WishlistRow = {
  id: string;
  content: string;
  votes: number;
  created_at: string;
  requester_id: string;
  requester_username: string;
  requester_avatar_url: string | null;
  voted_by_me: boolean;
};

export function useWishlist(groupId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useSession();

  const query = useQuery({
    queryKey: groupId ? wishlistKey(groupId) : ['wishlist', 'noop'],
    enabled: !!groupId,
    queryFn: async (): Promise<WishlistRow[]> => {
      const [{ data: items, error }, { data: myVotes }] = await Promise.all([
        supabase
          .from('wishlist')
          .select(
            // wishlist <-> profiles 也是双路径(requester_id 直连 + wishlist_votes M2M),
            // 必须指定 wishlist_requester_id_fkey 否则 PGRST201。
            'id, content, votes, created_at, requester_id, profiles!wishlist_requester_id_fkey!inner(id, username, avatar_url)',
          )
          .eq('group_id', groupId!)
          .order('votes', { ascending: false })
          .order('created_at', { ascending: false }),
        user?.id
          ? supabase
              .from('wishlist_votes')
              .select('wishlist_id')
              .eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
      ]);
      if (error) throw error;
      const mineSet = new Set((myVotes ?? []).map((v: any) => v.wishlist_id));
      return (items ?? []).map((row: any): WishlistRow => ({
        id: row.id,
        content: row.content,
        votes: row.votes,
        created_at: row.created_at,
        requester_id: row.requester_id,
        requester_username: row.profiles.username,
        requester_avatar_url: row.profiles.avatar_url,
        voted_by_me: mineSet.has(row.id),
      }));
    },
  });

  // Realtime: refetch on any wishlist change for this group
  useEffect(() => {
    if (!groupId) return;
    const nonce = Math.random().toString(36).slice(2, 8);
    const channel = supabase
      .channel(`wishlist:${groupId}:${user?.id ?? 'anon'}:${nonce}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wishlist',
          filter: `group_id=eq.${groupId}`,
        },
        () => qc.invalidateQueries({ queryKey: wishlistKey(groupId) }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wishlist_votes' },
        () => qc.invalidateQueries({ queryKey: wishlistKey(groupId) }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user?.id, qc]);

  return query;
}

export function useCreateWishlistItem(groupId: string) {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error('Not signed in');
      const trimmed = content.trim();
      if (!trimmed) throw new Error('Empty');
      const { error } = await supabase.from('wishlist').insert({
        group_id: groupId,
        requester_id: user.id,
        content: trimmed,
      });
      if (error) throw error;
    },
    onSuccess: () => cacheBus.afterWishlistMutate(qc, groupId),
  });
}

export function useToggleWishlistVote(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (wishlistId: string) => {
      const { error } = await supabase.rpc('toggle_wishlist_vote', {
        check_wishlist_id: wishlistId,
      });
      if (error) throw error;
    },
    onSuccess: () => cacheBus.afterWishlistMutate(qc, groupId),
  });
}
