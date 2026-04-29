import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import { cacheBus, menuGroupsKey } from '@/lib/cacheKeys';
import type { MenuGroup } from '@/types/domain';

export { menuGroupsKey };

export function useMenuGroups() {
  const { user } = useSession();
  return useQuery({
    queryKey: menuGroupsKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<MenuGroup[]> => {
      const { data, error } = await supabase
        .from('menu_groups')
        .select('*')
        .eq('chef_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateMenuGroup() {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; access_code: string }) => {
      if (!user?.id) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('menu_groups')
        .insert({
          chef_id: user.id,
          name: input.name,
          access_code: input.access_code,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => cacheBus.afterCarteCreate(qc, user?.id),
  });
}

export function useUpdateMenuGroup() {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; access_code?: string }) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from('menu_groups')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => cacheBus.afterCarteUpdate(qc, user?.id, data.id),
  });
}

export function useDeleteMenuGroup() {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('menu_groups').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => cacheBus.afterCarteDelete(qc, user?.id, id),
  });
}

/**
 * Sets the PIN for a private carte via SECURITY DEFINER RPC.
 * Empty pin → makes the carte public again.
 */
export function useSetCartePassword() {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { groupId: string; pin: string }) => {
      const { data, error } = await supabase.rpc('set_carte_password', {
        check_group_id: input.groupId,
        pin: input.pin,
      });
      if (error) throw error;
      if (!data) throw new Error('Failed to set PIN');
      return input.groupId;
    },
    onSuccess: (groupId) => cacheBus.afterCarteUpdate(qc, user?.id, groupId),
  });
}
