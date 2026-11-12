import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/** Set by /auth/callback only after a password-recovery code was exchanged successfully. */
export const RECOVERY_COOKIE = "gw_pw_recovery";
export const RECOVERY_COOKIE_MAX_AGE = 15 * 60; // seconds — the reset form must be used soon after the link

/**
 * True only when the current session came from a password-reset e-mail link. The main signal is our
 * short-lived httpOnly cookie, written by /auth/callback right after the recovery code was exchanged
 * and bound to that user id. A "recovery" entry in the token's `amr` claim is accepted too, in case a
 * Supabase version reports it (current supabase-js lists no such method, so it is not relied on).
 */
export async function hasRecoverySession(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return false;
  const amr = (claims.amr ?? []) as Array<{ method?: string } | string>;
  if (amr.some((a) => (typeof a === "string" ? a : a?.method) === "recovery")) return true;
  const store = await cookies();
  return store.get(RECOVERY_COOKIE)?.value === claims.sub;
}
