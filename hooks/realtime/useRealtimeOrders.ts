import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import { chefOrdersKey } from '@/hooks/chef/useChefOrders';
import { playOrderNotification } from '@/lib/notification-sound';
import { showToast } from '@/components/ui/Toast';
import i18n from '@/lib/i18n';

/**
 * Chef-side realtime: when a new order INSERTs into a menu_group I own,
 * play the haptic, toast, invalidate the orders query, and push a local
 * notification(在 app 后台仍活着时也能瞄到锁屏)。
 *
 * 限制:RN 后台久了 socket 会断 → 真"灭屏推送"要服务端 APNs。本地通知只兜
 * "app 还在但没在前台"那段。
 */
export function useRealtimeOrders(menuGroupIds: string[]) {
  const qc = useQueryClient();
  const { user } = useSession();
  const idsKey = menuGroupIds.join(',');

  useEffect(() => {
    if (!user?.id || menuGroupIds.length === 0) return;
    const idSet = new Set(menuGroupIds);

    const nonce = Math.random().toString(36).slice(2, 8);
    const channel = supabase
      .channel(`orders:chef:${user.id}:${nonce}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as { menu_group_id?: string };
          if (!newOrder.menu_group_id || !idSet.has(newOrder.menu_group_id)) return;
          playOrderNotification();
          showToast.info(i18n.t('orders.newOrderReceived'));
          qc.invalidateQueries({ queryKey: chefOrdersKey(user.id) });
          // 本地通知 — app 在后台时仍能看到
          Notifications.scheduleNotificationAsync({
            content: {
              title: '🍳 新订单',
              body: i18n.t('orders.newOrderReceived'),
              sound: 'default',
            },
            trigger: null, // 立即推送
          }).catch(() => {});
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, idsKey]);
}
