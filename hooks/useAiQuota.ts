/**
 * Mock AI-extraction monthly quota for the freemium tier.
 *
 * The real implementation will query a Supabase RPC counting this month's
 * `extract-recipe` invocations for the user. Until then, this hook returns a
 * stable stub so the UI surfaces (Profile usage block, AILimitSheet) can be
 * developed and reviewed end-to-end without backend wiring.
 */
export type AiQuota = {
  used: number;
  limit: number;
  remaining: number;
  isExceeded: boolean;
};

const MOCK_USED = 3;
const MOCK_LIMIT = 8;

export function useAiQuota(): AiQuota {
  const used = MOCK_USED;
  const limit = MOCK_LIMIT;
  const remaining = Math.max(0, limit - used);
  return { used, limit, remaining, isExceeded: remaining === 0 };
}
