import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import type { OrderStatus } from '@/types/domain';

export type ChefOrderRow = {
  id: string;
  status: OrderStatus;
  quantity: number;
  price_at_order: number;
  created_at: string;
  menu_group_id: string;
  session_id: string;
  dish_id: string;
  diner_id: string;
  dish_name: string;
  dish_image_url: string | null;
  dish_ingredients: string[];
  group_name: string;
  diner_username: string;
  diner_avatar_url: string | null;
  tip: number;
};

const STATUS_FLOW: OrderStatus[] = ['pending', 'preparing', 'ready', 'completed'];

export function nextStatus(s: OrderStatus): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf(s);
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

export const chefOrdersKey = (userId: string | undefined) =>
  ['chef-orders', userId] as const;

export function useChefOrders() {
  const { user } = useSession();
  return useQuery({
    queryKey: chefOrdersKey(user?.id),
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
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = data ?? [];
      const dinerIds = Array.from(new Set(rows.map((r: any) => r.diner_id)));
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
      return rows.map((r: any): ChefOrderRow => ({
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
        dish_ingredients: Array.isArray(r.dishes.ingredients) ? r.dishes.ingredients : [],
        group_name: r.menu_groups.name,
        tip: Number(r.order_sessions.tip ?? 0),
        diner_username: dinerMap.get(r.diner_id)?.username ?? 'Diner',
        diner_avatar_url: dinerMap.get(r.diner_id)?.avatar_url ?? null,
      }));
    },
  });
}

export function useUpdateOrderStatus() {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: input.status })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chefOrdersKey(user?.id) }),
  });
}

export function useDeleteOrder() {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chefOrdersKey(user?.id) }),
  });
}
