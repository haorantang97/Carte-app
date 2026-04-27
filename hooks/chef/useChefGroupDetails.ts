import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Category, Dish, MenuGroup } from '@/types/domain';

export const chefGroupKey = (groupId: string) => ['chef-group', groupId] as const;

export interface ChefGroupBundle {
  group: MenuGroup;
  categories: Category[];
  dishes: Dish[];
}

export function useChefGroupDetails(groupId: string | undefined) {
  return useQuery({
    queryKey: groupId ? chefGroupKey(groupId) : ['chef-group', 'noop'],
    enabled: !!groupId,
    queryFn: async (): Promise<ChefGroupBundle> => {
      const [groupRes, categoriesRes, dishesRes] = await Promise.all([
        supabase.from('menu_groups').select('*').eq('id', groupId!).single(),
        supabase
          .from('categories')
          .select('*')
          .eq('group_id', groupId!)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('dishes')
          .select('*')
          .eq('group_id', groupId!)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
      ]);
      if (groupRes.error) throw groupRes.error;
      return {
        group: groupRes.data,
        categories: categoriesRes.data ?? [],
        dishes: dishesRes.data ?? [],
      };
    },
  });
}
