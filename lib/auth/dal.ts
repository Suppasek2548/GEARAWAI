import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type Role = "member" | "admin";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  accountStatus: "active" | "suspended";
  avatarUrl: string | null;
  pointsBalance: number;
};

/**
 * Data Access Layer: the one place that reads the session + profile (deduped per request with React cache).
 * getUser() verifies the token with Supabase Auth — never trust the cookie alone.
 * Call only inside a <Suspense> boundary or a Server Action (Cache Components rule).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS: a member can only read their own profile row
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, account_status, avatar_url, points_balance")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: user.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role as Role,
    accountStatus: profile.account_status as CurrentUser["accountStatus"],
    avatarUrl: profile.avatar_url,
    pointsBalance: profile.points_balance,
  };
});

export function isActiveAdmin(user: CurrentUser | null): boolean {
  return Boolean(user && user.role === "admin" && user.accountStatus === "active");
}

/** Number of items in the member's cart for the header badge (RLS limits rows to the owner). */
export const getCartCount = cache(async (): Promise<number> => {
  if (!hasSupabaseEnv()) return 0;
  const supabase = await createClient();
  const { data } = await supabase.from("cart_items").select("quantity");
  return (data ?? []).reduce((sum, row) => sum + (row.quantity ?? 0), 0);
});

export const getWishlistCount = cache(async (): Promise<number> => {
  if (!hasSupabaseEnv()) return 0;
  const supabase = await createClient();
  const { count } = await supabase.from("wishlist_items").select("id", { count: "exact", head: true });
  return count ?? 0;
});
