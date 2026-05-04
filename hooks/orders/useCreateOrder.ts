import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import { useCart } from '@/stores/cartStore';
import { cacheBus } from '@/lib/cacheKeys';

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

      // Preflight: chef may have deleted a dish since user added it. Catch
      // it before we insert the session — otherwise a partial order leaves
      // an orphan session row even with the rollback below.
      const dishIds = items.map((it) => it.dishId);
      const { data: aliveDishes, error: dishCheckErr } = await supabase
        .from('dishes')
        .select('id')
        .in('id', dishIds);
      if (dishCheckErr) throw dishCheckErr;
      const aliveSet = new Set((aliveDishes ?? []).map((d) => d.id));
      const missing = dishIds.filter((id) => !aliveSet.has(id));
      if (missing.length > 0) {
        for (const id of missing) cart.remove(input.groupId, id);
        throw new Error(
          `${missing.length} 个菜品已被下架,已从购物车移除,请重新下单`,
        );
      }

      // Trim whitespace-only notes to null so we don't store junk.
      const cleanNotes = input.notes?.trim() || null;

      const { data: session, error: sessionErr } = await supabase
        .from('order_sessions')
        .insert({
          diner_id: user.id,
          menu_group_id: input.groupId,
          tip: input.tip,
          notes: cleanNotes,
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
        // Best-effort rollback. If THIS delete also fails (network blip),
        // we get an orphan empty session — caller already saw error toast.
        await supabase.from('order_sessions').delete().eq('id', session.id);
        throw ordersErr;
      }

      cart.clearGroup(input.groupId);
      return session.id;
    },
    onSuccess: () => cacheBus.afterOrderCreate(qc, user?.id),
  });
}
