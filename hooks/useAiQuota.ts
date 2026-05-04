import { useQuery } from '@tanstack/react-query';

import { aiQuotaKey } from '@/lib/cacheKeys';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';

/**
 * Monthly AI-extraction quota for the freemium tier.
 *
 * Backed by the `get_user_ai_quota` RPC (migration 0014), which counts
 * dishes the chef owns where `extract_started_at` falls in the current
 * calendar month. The edge function (`extract-recipe`) sets that column
 * at job-start, so the RPC reflects every triggered AI call — including
 * ones that later fail.
 *
 * Degrades gracefully:
 *   - Pre sign-in / on RPC error → returns `{used:0, limit:8}` so the
 *     Profile usage block + AILimitSheet still render.
 *   - On extract trigger → callers `cacheBus.afterAiExtractStart(qc)` to
 *     force a refetch (already wired in the extract mutation hooks).
 */
export type AiQuota = {
  used: number;
  limit: number;
  remaining: number;
  isExceeded: boolean;
  /** ISO timestamp for the start of the counting window (current month). */
  periodStart: string | null;
  /** True while the first fetch is in flight (vs. degraded fallback). */
  isLoading: boolean;
};

interface RpcShape {
  used: number;
  limit: number;
  remaining: number;
  period_start: string;
}

const FALLBACK_LIMIT = 8;

export function useAiQuota(): AiQuota {
  const { user } = useSession();
  const userId = user?.id;

  const query = useQuery({
    queryKey: aiQuotaKey(userId),
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<RpcShape> => {
      const { data, error } = await supabase.rpc('get_user_ai_quota');
      if (error) throw error;
      return data as unknown as RpcShape;
    },
  });

  const used = query.data?.used ?? 0;
  const limit = query.data?.limit ?? FALLBACK_LIMIT;
  const remaining = Math.max(0, limit - used);
  return {
    used,
    limit,
    remaining,
    isExceeded: remaining === 0,
    periodStart: query.data?.period_start ?? null,
    isLoading: query.isLoading && !!userId,
  };
}
