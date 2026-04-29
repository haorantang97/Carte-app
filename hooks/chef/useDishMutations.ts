import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DishInsert, DishUpdate } from '@/types/domain';
import { cacheBus } from '@/lib/cacheKeys';

export function useCreateDish(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<DishInsert, 'group_id'>) => {
      const { error } = await supabase
        .from('dishes')
        .insert({ ...input, group_id: groupId });
      if (error) throw error;
    },
    onSuccess: () => cacheBus.afterDishMutate(qc, groupId),
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
      return input.id;
    },
    onSuccess: (dishId) => cacheBus.afterDishMutate(qc, groupId, dishId),
  });
}

export function useDeleteDish(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dishes').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => cacheBus.afterDishDelete(qc, groupId, id),
  });
}
