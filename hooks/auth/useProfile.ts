import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Profile, ProfileUpdate } from '@/types/domain';
import { useSession } from './useSession';

const profileKey = (userId: string | undefined) => ['profile', userId] as const;

export function useProfile() {
  const { user } = useSession();
  return useQuery({
    queryKey: profileKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: ProfileUpdate) => {
      if (!user?.id) throw new Error('No session');
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKey(user?.id) });
    },
  });
}
