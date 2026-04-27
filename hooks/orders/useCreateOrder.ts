import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import { useCart } from '@/stores/cartStore';

interface SubmitInput {
  groupId: string;
  tip: number;
  notes?: string | null;
}

/**
 * 修复(对照原版):order_session 是新引入的 grouping 层 — 一次结账 = 一个 session,
 * 同时插入 N 个 order 行(每行 1 个 dish)。tip 只挂在 session 层。
 *
 * 也写入 price_at_order 快照,避免菜品涨价后历史订单显示新价。
 */
export function useCreateOrder() {
  const { user } = useSession();
  const cart = useCart();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitInput) => {
      if (!user?.id) throw new Error('Not signed in');
      const items = cart.getItems(input.groupId);
      if (items.length === 0) throw new Error('Cart is empty');

      const { data: session, error: sessionErr } = await supabase
        .from('order_sessions')
        .insert({
          diner_id: user.id,
          menu_group_id: input.groupId,
          tip: input.tip,
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (sessionErr) throw sessionErr;

      const orderRows = items.map((it) => ({
        session_id: session.id,
        dish_id: it.dishId,
        diner_id: user.id,
        menu_group_id: input.groupId,
        quantity: it.quantity,
        price_at_order: it.price,
        status: 'pending' as const,
      }));
      const { error: ordersErr } = await supabase.from('orders').insert(orderRows);
      if (ordersErr) {
        // Roll back the session if individual orders failed
        await supabase.from('order_sessions').delete().eq('id', session.id);
        throw ordersErr;
      }

      cart.clearGroup(input.groupId);
      return session.id;
    },
    onSuccess: (_id, vars) => {
      qc.invalidateQueries({ queryKey: ['my-orders', user?.id] });
      // Chef-side cache may be open in another tab/instance — invalidate for them too
      qc.invalidateQueries({ queryKey: ['chef-orders'] });
      // Realtime takes care of the chef notification
    },
  });
}
