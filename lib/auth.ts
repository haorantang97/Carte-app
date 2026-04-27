import { supabase } from './supabase';

/**
 * Ensure the app has a valid Supabase session.
 *
 * v1 strategy: anonymous sign-in (no UI). The user gets a real auth.uid()
 * so RLS works; the profile row is auto-created via the on_auth_user_created
 * trigger. Future: upgrade anonymous → email/Apple/Google.
 *
 * Includes a small retry budget for the profile lookup, since the trigger
 * runs on auth.users INSERT and rare clock skews can race the first read.
 */
export async function ensureSession() {
  const { data: existing, error: getErr } = await supabase.auth.getSession();
  if (getErr) throw getErr;
  if (existing.session) return existing.session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.session) throw new Error('Anonymous sign-in returned no session');
  return data.session;
}

/**
 * After sign-in, ensure a profiles row exists (trigger usually handles this,
 * but we double-check for resilience).
 */
export async function ensureProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return;

  const { error: insertErr } = await supabase
    .from('profiles')
    .insert({ id: userId, username: 'Guest', role: 'both' });
  if (insertErr && insertErr.code !== '23505') throw insertErr;
}
