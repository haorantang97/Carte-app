import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import { joinedKitchensKey } from '@/lib/cacheKeys';

export type JoinedKitchen = {
  groupId: string;
  groupName: string;
  joinedAt: string;
  chefId: string;
  chefUsername: string;
  chefAvatarUrl: string | null;
};

export function useJoinedKitchens() {
  const { user } = useSession();
  return useQuery({
    queryKey: joinedKitchensKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<JoinedKitchen[]> => {
      const { data, error } = await supabase
        .from('menu_group_members')
        .select(
          `group_id, joined_at,
           menu_groups!inner (id, name, chef_id,
             profiles!menu_groups_chef_id_fkey!inner (id, username, avatar_url))`,
        )
        .eq('diner_id', user!.id)
        .order('joined_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((m: any) => ({
        groupId: m.group_id,
        joinedAt: m.joined_at,
        groupName: m.menu_groups.name,
        chefId: m.menu_groups.chef_id,
        chefUsername: m.menu_groups.profiles.username,
        chefAvatarUrl: m.menu_groups.profiles.avatar_url,
      }));
    },
  });
}
