"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isActiveAdmin } from "@/lib/auth/dal";
import { GENERIC_ERROR, toThaiError } from "@/lib/errors";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type AdminResult = { ok: true; message: string } | { ok: false; message: string };

/** UI-level check only — every admin_* RPC re-checks is_admin() in the database (ADMIN_DESIGN §1). */
async function requireAdmin(): Promise<AdminResult | null> {
  const user = await getCurrentUser();
  return isActiveAdmin(user) ? null : { ok: false, message: toThaiError("FORBIDDEN") };
}

/** S09-F10 / ADMIN §4.8 — approve → payment verified + order paid + sold_count; reject needs a reason. */
export async function verifyPaymentAction(
  paymentId: string,
  approve: boolean,
  reason = "",
): Promise<AdminResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!UUID_RE.test(paymentId)) return { ok: false, message: GENERIC_ERROR };
  if (!approve && !reason.trim()) return { ok: false, message: toThaiError("REASON_REQUIRED") };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_verify_payment", {
    p_payment_id: paymentId,
    p_approve: approve,
    p_reason: approve ? undefined : reason.trim(),
  });
  if (error) return { ok: false, message: toThaiError(error) };
  refresh();
  return { ok: true, message: approve ? "ยืนยันการชำระแล้ว — คำสั่งซื้อเป็น 'ชำระแล้ว'" : "ปฏิเสธการแจ้งชำระแล้ว" };
}

/** ADMIN §4.7 — paid → shipped (tracking optional) · shipped → completed (awards points). */
export async function updateOrderStatusAction(
  orderId: string,
  status: "shipped" | "completed",
  tracking = "",
): Promise<AdminResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!UUID_RE.test(orderId) || (status !== "shipped" && status !== "completed"))
    return { ok: false, message: GENERIC_ERROR };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_order_status", {
    p_order_id: orderId,
    p_status: status,
    p_tracking: tracking.trim().slice(0, 100) || undefined,
  });
  if (error) return { ok: false, message: toThaiError(error) };
  refresh();
  return {
    ok: true,
    message: status === "shipped" ? "บันทึกการจัดส่งแล้ว" : "ปิดงานแล้ว — ระบบให้คะแนนสมาชิกอัตโนมัติ",
  };
}

/** Admin cancel before shipping — returns stock, coupon; payment → voided (R-20). */
export async function adminCancelOrderAction(orderId: string, reason: string): Promise<AdminResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!UUID_RE.test(orderId)) return { ok: false, message: GENERIC_ERROR };
  if (!reason.trim()) return { ok: false, message: toThaiError("REASON_REQUIRED") };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_order", {
    p_order_id: orderId,
    p_reason: reason.trim().slice(0, 300),
  });
  if (error) return { ok: false, message: toThaiError(error) };
  refresh();
  return { ok: true, message: "ยกเลิกคำสั่งซื้อแล้ว — คืนสต็อกและคูปองเรียบร้อย" };
}
