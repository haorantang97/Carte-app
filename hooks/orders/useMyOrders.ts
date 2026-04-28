import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import type { OrderStatus } from '@/types/domain';

/**
 * Outgoing orders: ones I (the diner) placed across all cartes.
 * Used in the unified Orders tab alongside useChefOrders (incoming).
 */
export type MyOrderRow = {
  id: string;
  status: OrderStatus;
  quantity: number;
  price_at_order: number;
  created_at: string;
  menu_group_id: string;
  dish_id: string;
  dish_name: string;
  dish_image_url: string | null;
  group_name: string;
  chef_username: string;
};

export const myOrdersKey = (userId: string | undefined) => ['my-orders', userId] as const;

export function useMyOrders() {
  const { user } = useSession();
  return useQuery({
    queryKey: myOrdersKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<MyOrderRow[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `id, status, quantity, price_at_order, created_at, menu_group_id, dish_id,
           dishes!inner (id, name, image_url),
           menu_groups!inner (id, name, chef_id, profiles!inner(id, username))`,
        )
        .eq('diner_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        status: r.status as OrderStatus,
        quantity: r.quantity,
        price_at_order: Number(r.price_at_order),
        created_at: r.created_at,
        menu_group_id: r.menu_group_id,
        dish_id: r.dish_id,
        dish_name: r.dishes.name,
        dish_image_url: r.dishes.image_url,
        group_name: r.menu_groups.name,
        chef_username: r.menu_groups.profiles.username,
      }));
    },
  });
}
