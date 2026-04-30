import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/hooks/auth/useSession';
import { supabase } from '@/lib/supabase';
import type { OrderStatus } from '@/types/domain';

import type { ChefOrderRow } from './useChefOrders';

/**
 * Completed/cancelled chef orders — fuel for the 后厨 tab's "历史" sub-section.
 * Same row shape as `useChefOrders` so the same OrderListItem can render either.
 */
export function useChefOrderHistory(limit = 100) {
  const { user } = useSession();
  return useQuery({
    queryKey: ['chef-order-history', user?.id, limit],
    enabled: !!user?.id,
    queryFn: async (): Promise<ChefOrderRow[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `id, status, quantity, price_at_order, created_at, menu_group_id, session_id, dish_id, diner_id,
           dishes!inner (id, name, image_url, ingredients),
           order_sessions!inner (id, tip),
           menu_groups!inner (id, name, chef_id)`,
        )
        .eq('menu_groups.chef_id', user!.id)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const dinerIds = Array.from(new Set(rows.map((r) => r.diner_id)));
      const dinerMap = new Map<string, { username: string; avatar_url: string | null }>();
      if (dinerIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', dinerIds);
        for (const p of profs ?? []) {
          dinerMap.set(p.id, { username: p.username, avatar_url: p.avatar_url });
        }
      }
      return rows.map((r): ChefOrderRow => ({
        id: r.id,
        status: r.status as OrderStatus,
        quantity: r.quantity,
        price_at_order: Number(r.price_at_order),
        created_at: r.created_at,
        menu_group_id: r.menu_group_id,
        session_id: r.session_id,
        dish_id: r.dish_id,
        diner_id: r.diner_id,
        dish_name: r.dishes.name,
        dish_image_url: r.dishes.image_url,
        dish_ingredients: r.dishes.ingredients ?? [],
        group_name: r.menu_groups.name,
        diner_username: dinerMap.get(r.diner_id)?.username ?? '匿名',
        diner_avatar_url: dinerMap.get(r.diner_id)?.avatar_url ?? null,
        tip: Number(r.order_sessions?.tip ?? 0),
      }));
    },
    staleTime: 60_000,
  });
}
