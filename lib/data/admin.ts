import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentStatus } from "@/lib/data/member";

/* Admin reads — RLS lets is_admin() see every row; layout + RPCs guard the rest. */

export const ORDER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "payment_submitted",
  "paid",
  "shipped",
  "completed",
  "cancelled",
];

export async function adminListOrders(status: OrderStatus | null) {
  const supabase = await createClient();
  let q = supabase
    .from("orders")
    .select(
      "id, order_number, status, total_amount, created_at, is_demo, profiles(full_name, email), order_items(quantity), payments(status, created_at)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return data ?? [];
}

export async function adminGetOrder(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "*, profiles(full_name, email, phone), order_items(id, product_sku, product_name, product_image_url, unit_price, quantity, line_total), payments(id, method, amount, status, slip_path, payer_note, reject_reason, submitted_at, verified_at, created_at)",
    )
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function adminListPayments(status: PaymentStatus | null) {
  const supabase = await createClient();
  let q = supabase
    .from("payments")
    .select(
      "id, method, amount, status, slip_path, payer_note, reject_reason, submitted_at, created_at, orders(id, order_number, total_amount, status, profiles(full_name, email))",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return data ?? [];
}

/** Private bucket → short-lived signed URL (admin storage policy, DATABASE_DESIGN §8). */
export async function slipSignedUrl(path: string | null) {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from("payment-slips").createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

export async function adminPendingCounts() {
  const supabase = await createClient();
  const [payments, orders] = await Promise.all([
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
  ]);
  return { submittedPayments: payments.count ?? 0, toShip: orders.count ?? 0 };
}
