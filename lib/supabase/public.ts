import "server-only";
import { connection } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";
import type { Database } from "@/types/database.types";

/**
 * Cookie-less client for public storefront data (catalog, categories, promotions, settings).
 * Every visitor — guest, member or admin — sees exactly what the `anon` role may see (RLS),
 * so an admin browsing the shop never sees inactive products by accident.
 * Rendered at request time so Admin edits show up immediately (SPEC §9, ADMIN §3.1).
 */
export async function createPublicClient() {
  await connection();
  const { url, anonKey } = getSupabaseEnv();
  return createSupabaseClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
