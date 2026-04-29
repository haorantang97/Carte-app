/**
 * Helper:把 supabase-js `functions.invoke` 抛回来的 FunctionsHttpError 还原成
 * 真实的 server 错误消息。
 *
 * supabase-js 在 status != 2xx 时,error.message 永远只是 "Edge Function returned
 * a non-2xx status code" 这种通用文案,真实的 JSON body 藏在 error.context (Response 对象)
 * 里。需要 `await error.context.json()` 才能拿到。
 *
 * 不修这一层的话,所有 edge function 报的错(closed_platform / apify_failed / 各种
 * 业务错误)在 client 全显示成同一句通用话,debug 几乎不可能。
 */

export async function readEdgeError(error: unknown): Promise<string> {
  if (!error) return 'Unknown error';
  // FunctionsHttpError: status != 2xx,context 是 Response
  // FunctionsRelayError / FunctionsFetchError 走 context 是 plain object 的分支
  const e = error as { message?: string; context?: unknown; name?: string };
  const ctx = e.context as Response | undefined;
  if (ctx && typeof ctx === 'object' && 'json' in ctx && typeof ctx.json === 'function') {
    try {
      const body = await (ctx as Response).clone().json();
      if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        // edge function 约定:{ error: string, message?: string, details?: ... }
        const errStr = typeof b.error === 'string' ? b.error : '';
        const msgStr = typeof b.message === 'string' ? b.message : '';
        const combined = [errStr, msgStr].filter(Boolean).join(': ');
        if (combined) return combined;
        return JSON.stringify(body).slice(0, 300);
      }
    } catch {
      // body 不是 JSON,降级到 text
      try {
        const txt = await (ctx as Response).clone().text();
        if (txt) return txt.slice(0, 300);
      } catch {
        // ignore
      }
    }
  }
  return e.message ?? String(error);
}
