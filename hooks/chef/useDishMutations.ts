import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DishInsert, DishUpdate } from '@/types/domain';
import { chefGroupKey } from './useChefGroupDetails';

export function useCreateDish(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<DishInsert, 'group_id'>) => {
      const { error } = await supabase
        .from('dishes')
        .insert({ ...input, group_id: groupId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chefGroupKey(groupId) }),
  });
}

export function useUpdateDish(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: DishUpdate }) => {
      const { error } = await supabase
        .from('dishes')
        .update(input.patch)
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chefGroupKey(groupId) }),
  });
}

export function useDeleteDish(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dishes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chefGroupKey(groupId) }),
  });
}
