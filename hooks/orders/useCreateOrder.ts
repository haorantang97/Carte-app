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

      // Atomic insert via RPC (migration 0016): order_session + N orders
      // wrapped in a single Postgres transaction. If anything fails the
      // whole thing rolls back — no orphan empty session rows. Replaces
      // the old client-side 2-step insert + best-effort rollback (which
      // had a race where partial failure left unrecoverable orphan).
      const { data: sessionId, error } = await supabase.rpc(
        'create_order_with_items',
        {
          p_group_id: input.groupId,
          p_tip: input.tip,
          p_notes: input.notes?.trim() || null,
          p_items: items.map((it) => ({
            dish_id: it.dishId,
            quantity: it.quantity,
            price: it.price,
          })),
        },
      );
      if (error) {
        // RPC throws 'dish_unavailable: ...' if a cart item was deleted
        // between rendering and submit. Sweep the cart locally so the
        // user can re-tap 下单 and succeed.
        if (error.message?.includes('dish_unavailable')) {
          const dishIds = items.map((it) => it.dishId);
          const { data: alive } = await supabase
            .from('dishes')
            .select('id')
            .in('id', dishIds);
          const aliveSet = new Set((alive ?? []).map((d) => d.id));
          const missing = dishIds.filter((id) => !aliveSet.has(id));
          for (const id of missing) cart.remove(input.groupId, id);
          throw new Error(
            `${missing.length} 个菜品已被下架,已从购物车移除,请重新下单`,
          );
        }
        throw error;
      }

      cart.clearGroup(input.groupId);
      return sessionId as string;
    },
    onSuccess: () => cacheBus.afterOrderCreate(qc, user?.id),
  });
}
