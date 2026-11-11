import "server-only";
import { createClient } from "@/lib/supabase/server";
import { thTodayISO } from "@/lib/utils/format";

/* S10 Points · S11 Birthday · S12 Rewards — read as the signed-in member (RLS). */

export async function getRewards() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rewards")
    .select("id, name, description, image_url, points_required, stock_quantity")
    .eq("is_active", true)
    .order("sort_order")
    .order("points_required");
  return data ?? [];
}

export async function getMyRedemptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reward_redemptions")
    .select("id, reward_name, points_used, status, admin_note, created_at, fulfilled_at, cancelled_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export const POINT_TYPES = ["earn", "redeem", "adjust", "reverse"] as const;
export type PointType = (typeof POINT_TYPES)[number];

export async function getMyPointTransactions(type: PointType | null, page: number, pageSize = 20) {
  const supabase = await createClient();
  let q = supabase
    .from("points_transactions")
    .select(
      "id, type, points, balance_after, note, created_at, orders(order_number), reward_redemptions(reward_name)",
      {
        count: "exact",
      },
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (type) q = q.eq("type", type);
  const from = (page - 1) * pageSize;
  const { data, count } = await q.range(from, from + pageSize - 1);
  return { rows: data ?? [], total: count ?? 0 };
}

export type MyCoupon = {
  id: string;
  code: string;
  name: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  maxDiscount: number | null;
  minOrder: number;
  cycleYear: number;
  claimedAt: string;
  expiresAt: string;
  usedAt: string | null;
  status: "available" | "used" | "expired";
};

/** member_coupons + their template (coupons_member_read policy, R-05). */
export async function getMyCoupons(): Promise<MyCoupon[]> {
  const supabase = await createClient(); // also marks this render as request-time before reading the clock
  const { data } = await supabase
    .from("member_coupons")
    .select(
      "id, code, cycle_year, claimed_at, expires_at, used_at, coupons(name, discount_type, discount_value, max_discount_amount, min_order_amount)",
    )
    .order("claimed_at", { ascending: false });
  const now = Date.now();
  return (data ?? []).map((m) => ({
    id: m.id,
    code: m.code,
    name: m.coupons?.name ?? "คูปอง",
    discountType: m.coupons?.discount_type ?? "percentage",
    discountValue: Number(m.coupons?.discount_value ?? 0),
    maxDiscount: m.coupons?.max_discount_amount == null ? null : Number(m.coupons.max_discount_amount),
    minOrder: Number(m.coupons?.min_order_amount ?? 0),
    cycleYear: m.cycle_year,
    claimedAt: m.claimed_at,
    expiresAt: m.expires_at,
    usedAt: m.used_at,
    status: m.used_at ? "used" : Date.parse(m.expires_at) <= now ? "expired" : "available",
  }));
}

/** Birthday window = the whole birth month in Thai time (D-05). */
export function birthdayState(birthDate: string | null) {
  const today = thTodayISO();
  const thisYear = Number(today.slice(0, 4));
  if (!birthDate) return { hasBirthDate: false as const, inBirthMonth: false, thisYear };
  return {
    hasBirthDate: true as const,
    inBirthMonth: birthDate.slice(5, 7) === today.slice(5, 7),
    thisYear,
  };
}
