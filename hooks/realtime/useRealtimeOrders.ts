import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import { chefOrdersKey } from '@/hooks/chef/useChefOrders';
import { playOrderNotification } from '@/lib/notification-sound';
import { showToast } from '@/components/ui/Toast';
import i18n from '@/lib/i18n';

/**
 * Chef-side realtime: when a new order INSERTs into a menu_group I own,
 * play the haptic, toast, and invalidate the orders query.
 *
 * 修复:原版 channel 命名简单可能多用户冲突;新版统一带 user_id 后缀。
 */
export function useRealtimeOrders(menuGroupIds: string[]) {
  const qc = useQueryClient();
  const { user } = useSession();
  const idsKey = menuGroupIds.join(',');

  useEffect(() => {
    if (!user?.id || menuGroupIds.length === 0) return;
    const idSet = new Set(menuGroupIds);

    const channel = supabase
      .channel(`orders:chef:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as { menu_group_id?: string };
          if (!newOrder.menu_group_id || !idSet.has(newOrder.menu_group_id)) return;
          playOrderNotification();
          showToast.info(i18n.t('orders.newOrderReceived'));
          qc.invalidateQueries({ queryKey: chefOrdersKey(user.id) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, idsKey]);
}
