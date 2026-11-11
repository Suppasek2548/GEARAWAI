import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";
import type { Database } from "@/types/database.types";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Uses the signed-in user's session cookie, so every query runs under RLS as that user.
 * With Cache Components enabled, call this only inside a <Suspense> boundary or a Server Action.
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  // Supabase reads the clock (token expiry) — make sure this never runs during prerendering (Cache Components).
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component (read-only cookies). The proxy refreshes the session instead.
        }
      },
    },
  });
}
