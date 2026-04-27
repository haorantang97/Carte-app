import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import { normalizeCarteCode } from '@/lib/carteCode';
import { joinedKitchensKey } from './useJoinedKitchens';

export type JoinError = 'NOT_FOUND' | 'PIN_REQUIRED' | 'WRONG_PIN' | 'OTHER';

export type FoundCarte = {
  group_id: string;
  group_name: string;
  is_private: boolean;
  chef_id: string;
  chef_username: string;
  chef_avatar_url: string | null;
};

export function useFindCarte() {
  return useMutation({
    mutationFn: async (rawCode: string): Promise<FoundCarte | null> => {
      const code = normalizeCarteCode(rawCode);
      const { data, error } = await supabase.rpc('find_group_by_access_code', { code });
      if (error) throw error;
      const row = data?.[0];
      return row ?? null;
    },
  });
}

export function useJoinKitchen() {
  const { user } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { code: string; pin?: string }): Promise<FoundCarte> => {
      if (!user?.id) throw new Error('Not signed in');
      const code = normalizeCarteCode(input.code);

      const { data: rows, error: findErr } = await supabase.rpc(
        'find_group_by_access_code',
        { code },
      );
      if (findErr) throw findErr;
      const found = rows?.[0] as FoundCarte | undefined;
      if (!found) {
        const e: Error & { kind: JoinError } = Object.assign(new Error('Carte not found'), {
          kind: 'NOT_FOUND' as const,
        });
        throw e;
      }

      if (found.is_private) {
        if (!input.pin) {
          const e: Error & { kind: JoinError } = Object.assign(new Error('PIN required'), {
            kind: 'PIN_REQUIRED' as const,
          });
          throw e;
        }
        const { data: ok, error: vErr } = await supabase.rpc('verify_carte_password', {
          check_group_id: found.group_id,
          pin: input.pin,
        });
        if (vErr) throw vErr;
        if (!ok) {
          const e: Error & { kind: JoinError } = Object.assign(new Error('Wrong PIN'), {
            kind: 'WRONG_PIN' as const,
          });
          throw e;
        }
      }

      const { error: insertErr } = await supabase
        .from('menu_group_members')
        .insert({ group_id: found.group_id, diner_id: user.id });
      // 23505 = unique_violation (already a member, idempotent OK)
      if (insertErr && insertErr.code !== '23505') throw insertErr;

      return found;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: joinedKitchensKey(user?.id) });
    },
  });
}
