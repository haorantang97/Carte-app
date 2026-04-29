import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import { cacheBus } from '@/lib/cacheKeys';

export function useLeaveKitchen() {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user?.id) throw new Error('Not signed in');
      const { error } = await supabase
        .from('menu_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('diner_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => cacheBus.afterCarteLeave(qc, user?.id),
  });
}
