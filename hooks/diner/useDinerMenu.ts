import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DinerMenuChef {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface DinerMenuGroup {
  id: string;
  name: string;
  access_code: string;
  is_private: boolean;
  chef: DinerMenuChef;
}

export interface DinerCategory {
  id: string;
  name: string;
  sort_order: number;
}

export interface DinerDish {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  ingredients: string[];
  cuisine: string | null;
  total_time_min: number | null;
  calories: number | null;
}

export const dinerMenuKey = (groupId: string) => ['diner-menu', groupId] as const;

export function useDinerMenu(groupId: string | undefined) {
  return useQuery({
    queryKey: groupId ? dinerMenuKey(groupId) : ['diner-menu', 'noop'],
    enabled: !!groupId,
    queryFn: async (): Promise<{
      group: DinerMenuGroup;
      categories: DinerCategory[];
      dishes: DinerDish[];
    }> => {
      const [groupRes, categoriesRes, dishesRes] = await Promise.all([
        supabase
          .from('menu_groups')
          .select(
            'id, name, access_code, is_private, chef_id, profiles!menu_groups_chef_id_fkey!inner(id, username, avatar_url)',
          )
          .eq('id', groupId!)
          .single(),
        supabase
          .from('categories')
          .select('id, name, sort_order')
          .eq('group_id', groupId!)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('dishes')
          .select(
            'id, category_id, name, description, price, image_url, ingredients, cuisine, total_time_min, calories',
          )
          .eq('group_id', groupId!)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
      ]);
      if (groupRes.error) throw groupRes.error;
      const g = groupRes.data as any;
      // FK is enforced + !inner above; if `profiles` is still missing the
      // row was deleted between the query plan and result — surface it
      // instead of silently rendering "Diner".
      if (!g?.profiles) throw new Error('Chef profile missing for group ' + groupId);
      return {
        group: {
          id: g.id,
          name: g.name,
          access_code: g.access_code,
          is_private: g.is_private,
          chef: {
            id: g.profiles.id,
            username: g.profiles.username,
            avatar_url: g.profiles.avatar_url,
          },
        },
        categories: categoriesRes.data ?? [],
        dishes: (dishesRes.data ?? []).map((d: any) => ({
          ...d,
          price: Number(d.price ?? 0),
          ingredients: Array.isArray(d.ingredients) ? d.ingredients : [],
        })),
      };
    },
  });
}
