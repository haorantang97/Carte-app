import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import { showToast } from '@/components/ui/Toast';
import i18n from '@/lib/i18n';

/**
 * Diner-side realtime: when one of MY orders has its status changed,
 * surface a toast like "Your order is now Ready".
 *
 * 修复:原版 Chef 改状态后 Diner 端无任何反馈。这个 hook 装进 root layout,
 * 全局监听本人订单的 UPDATE 事件,filter 直接走 Postgres。
 */
export function useRealtimeOrderStatus() {
  const { user } = useSession();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`orders:diner:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `diner_id=eq.${user.id}`,
        },
        (payload) => {
          const next = (payload.new as { status?: string })?.status;
          const prev = (payload.old as { status?: string })?.status;
          if (!next || next === prev) return;
          if (next === 'completed' || next === 'cancelled') return; // skip terminal noise
          showToast.info(
            i18n.t('orders.orderStatusUpdated', {
              status: i18n.t(`orders.${next}` as any),
            }),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}
