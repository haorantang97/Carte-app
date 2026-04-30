import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';

export type ChefRecentCommentRow = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  dish_id: string;
  dish_name: string;
  dish_image_url: string | null;
  group_name: string;
};

/**
 * Chef 主页"最新反馈"卡片 — 聚合 chef 所有 dish 的最新评论(排除 chef 自己留的)。
 * 让 chef 一眼看到 diners 在说什么(夸 / 吐槽 / 建议)。
 */
export function useChefRecentComments(limit = 5) {
  const { user } = useSession();
  return useQuery({
    queryKey: ['chef-recent-comments', user?.id, limit],
    enabled: !!user?.id,
    queryFn: async (): Promise<ChefRecentCommentRow[]> => {
      // 1. 拿 chef 所有 dish_ids(via menu_groups.chef_id)
      const { data: dishRows, error: dErr } = await supabase
        .from('dishes')
        .select('id, name, image_url, menu_groups!inner(id, name, chef_id)')
        .eq('menu_groups.chef_id', user!.id);
      if (dErr) throw dErr;
      const dishes = dishRows ?? [];
      if (dishes.length === 0) return [];

      const dishIds = dishes.map((d: any) => d.id);
      const dishMap = new Map<string, { name: string; image_url: string | null; group_name: string }>(
        dishes.map((d: any) => [
          d.id,
          {
            name: d.name,
            image_url: d.image_url,
            group_name: d.menu_groups?.name ?? '',
          },
        ]),
      );

      // 2. 查这些 dish 的最新评论(排除 chef 自己)
      const { data: comments, error: cErr } = await supabase
        .from('dish_comments')
        .select(
          'id, content, created_at, user_id, dish_id, profiles!inner(id, username, avatar_url)',
        )
        .in('dish_id', dishIds)
        .neq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (cErr) throw cErr;

      return (comments ?? []).map((c: any): ChefRecentCommentRow => {
        const dish = dishMap.get(c.dish_id);
        return {
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          user_id: c.user_id,
          username: c.profiles.username,
          avatar_url: c.profiles.avatar_url,
          dish_id: c.dish_id,
          dish_name: dish?.name ?? '',
          dish_image_url: dish?.image_url ?? null,
          group_name: dish?.group_name ?? '',
        };
      });
    },
  });
}
