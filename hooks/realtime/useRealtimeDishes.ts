import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import { chefGroupKey } from '@/lib/cacheKeys';

/**
 * 订阅某个 carte 下所有 dishes 的变更(INSERT/UPDATE/DELETE),
 * 命中即 invalidate chefGroupKey 让列表重取。
 *
 * 主要用于 AI 提取流程:edge function 在后台改 dish 字段,
 * 这里通过 realtime push 让 UI 自动刷新(占位卡 → 真实卡)。
 */
export function useRealtimeDishes(groupId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useSession();

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`dishes:${groupId}:${user?.id ?? 'anon'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dishes',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: chefGroupKey(groupId) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user?.id, qc]);
}
