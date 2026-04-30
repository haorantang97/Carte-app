import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';

export type ChefWishlistRow = {
  id: string;
  content: string;
  votes: number;
  created_at: string;
  group_id: string;
  group_name: string;
  requester_username: string;
};

/**
 * 聚合 chef 所有 menu_group 的 wishlist,过去 7 天内,按票数 + 时间倒序。
 * 用于 chef 主页"本周愿望榜"卡片 — 让 chef 一眼看到 diners 想吃啥,决定加什么菜。
 */
export function useChefWishlists() {
  const { user } = useSession();
  return useQuery({
    queryKey: ['chef-wishlists', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<ChefWishlistRow[]> => {
      const { data: myGroups, error: gErr } = await supabase
        .from('menu_groups')
        .select('id, name')
        .eq('chef_id', user!.id);
      if (gErr) throw gErr;
      const groups = myGroups ?? [];
      if (groups.length === 0) return [];

      const groupIds = groups.map((g) => g.id);
      const groupMap = new Map(groups.map((g) => [g.id, g.name]));
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: items, error: wErr } = await supabase
        .from('wishlist')
        .select(
          'id, content, votes, created_at, group_id, requester_id, profiles!wishlist_requester_id_fkey!inner(username)',
        )
        .in('group_id', groupIds)
        .gte('created_at', sevenDaysAgo)
        .order('votes', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
      if (wErr) throw wErr;

      return (items ?? []).map((row: any): ChefWishlistRow => ({
        id: row.id,
        content: row.content,
        votes: row.votes,
        created_at: row.created_at,
        group_id: row.group_id,
        group_name: groupMap.get(row.group_id) ?? '',
        requester_username: row.profiles?.username ?? '',
      }));
    },
  });
}
