import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';

/** Unified Carte item — covers both "I'm the chef" and "I joined as diner". */
export type MyCarte = {
  id: string;
  name: string;
  access_code: string;
  is_private: boolean;
  is_mine: boolean; // user.id === chef_id
  chef_id: string;
  chef_username: string;
  chef_avatar_url: string | null;
  /** Most recent timestamp to sort the merged list by */
  pinned_at: string;
};

export const myCartesKey = (userId: string | undefined) => ['my-cartes', userId] as const;

export function useMyCartes() {
  const { user } = useSession();
  return useQuery({
    queryKey: myCartesKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<MyCarte[]> => {
      const uid = user!.id;

      // Cartes I created
      // 修复:menu_groups 与 profiles 之间有两条 FK 路径(chef_id 直连 + 经
      // menu_group_members 的 M2M),PostgREST 不能自动消歧,必须显式指定
      // 走 menu_groups_chef_id_fkey,否则报 PGRST201。
      const ownRes = await supabase
        .from('menu_groups')
        .select(
          'id, name, access_code, is_private, chef_id, created_at, profiles!menu_groups_chef_id_fkey!inner(id, username, avatar_url)',
        )
        .eq('chef_id', uid)
        .order('created_at', { ascending: false });
      if (ownRes.error) throw ownRes.error;

      // Cartes I joined
      const joinedRes = await supabase
        .from('menu_group_members')
        .select(
          `joined_at,
           menu_groups!inner (id, name, access_code, is_private, chef_id, profiles!menu_groups_chef_id_fkey!inner(id, username, avatar_url))`,
        )
        .eq('diner_id', uid)
        .order('joined_at', { ascending: false });
      if (joinedRes.error) throw joinedRes.error;

      const own: MyCarte[] = (ownRes.data ?? []).map((g: any) => ({
        id: g.id,
        name: g.name,
        access_code: g.access_code,
        is_private: g.is_private,
        is_mine: true,
        chef_id: g.chef_id,
        chef_username: g.profiles.username,
        chef_avatar_url: g.profiles.avatar_url,
        pinned_at: g.created_at,
      }));

      // Filter out cartes where user is BOTH chef and member (shouldn't happen, but safe)
      const ownIds = new Set(own.map((c) => c.id));
      const joined: MyCarte[] = (joinedRes.data ?? [])
        .filter((m: any) => !ownIds.has(m.menu_groups.id))
        .map((m: any) => ({
          id: m.menu_groups.id,
          name: m.menu_groups.name,
          access_code: m.menu_groups.access_code,
          is_private: m.menu_groups.is_private,
          is_mine: false,
          chef_id: m.menu_groups.chef_id,
          chef_username: m.menu_groups.profiles.username,
          chef_avatar_url: m.menu_groups.profiles.avatar_url,
          pinned_at: m.joined_at,
        }));

      // Merge + sort by pinned_at desc
      return [...own, ...joined].sort((a, b) => (a.pinned_at < b.pinned_at ? 1 : -1));
    },
  });
}
