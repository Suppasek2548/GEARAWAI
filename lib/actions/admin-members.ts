"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  adminError,
  adminOrDenied,
  PATHS,
  revalidateStorefront,
  UUID_RE,
  type AdminResult,
} from "@/lib/admin/guard";
import { formToObject, nullIfEmpty, zodErrors, type FormState } from "@/lib/admin/form";
import { toThaiError } from "@/lib/errors";
import { thTodayISO } from "@/lib/utils/format";

/* ---------------- Customers (ADMIN §4.9) ---------------- */

/** admin_set_account_status() blocks changing yourself and suspending the last admin (R-25). */
export async function setAccountStatusAction(
  userId: string,
  status: "active" | "suspended",
): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(userId)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_account_status", { p_user_id: userId, p_status: status });
  if (error) return { ok: false, message: toThaiError(error) };
  revalidateStorefront();
  return { ok: true, message: status === "suspended" ? "ระงับบัญชีแล้ว" : "เปิดใช้งานบัญชีแล้ว" };
}

/** For members who already used their one self-service change (S11). */
export async function setMemberBirthDateAction(userId: string, date: string): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (
    !UUID_RE.test(userId) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    date > thTodayISO() ||
    date <= "1900-01-01"
  )
    return { ok: false, message: toThaiError("INVALID_BIRTH_DATE") + " (รูปแบบ YYYY-MM-DD)" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_member_birth_date", {
    p_user_id: userId,
    p_birth_date: date,
  });
  if (error) return { ok: false, message: toThaiError(error) };
  revalidateStorefront();
  return { ok: true, message: "แก้ไขวันเกิดแล้ว" };
}

/* ---------------- Points (ADMIN §4.10) ---------------- */

export async function adjustPointsAction(userId: string, points: number, note: string): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(userId) || !Number.isInteger(points) || points === 0)
    return { ok: false, message: "จำนวนคะแนนต้องเป็นจำนวนเต็มที่ไม่ใช่ 0" };
  if (!note.trim()) return { ok: false, message: "กรุณาระบุเหตุผล" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_adjust_points", {
    p_user_id: userId,
    p_points: points,
    p_note: note.trim().slice(0, 300),
  });
  if (error) {
    if (/points_balance|check|NEGATIVE|INSUFFICIENT/i.test(error.message))
      return { ok: false, message: "คะแนนหลังปรับต้องไม่ติดลบ" };
    return { ok: false, message: toThaiError(error) };
  }
  revalidateStorefront();
  return { ok: true, message: `ปรับคะแนนแล้ว — คงเหลือ ${data}` };
}

/* ---------------- Rewards (ADMIN §4.11) ---------------- */

const rewardSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อของรางวัล").max(150),
  description: z.string().trim().max(1000).optional(),
  image_url: z.string().trim().max(500).optional(),
  points_required: z.coerce.number().int("ต้องเป็นจำนวนเต็ม").positive("คะแนนต้องมากกว่า 0"),
  stock_quantity: z.coerce.number().int("ต้องเป็นจำนวนเต็ม").min(0, "จำนวนต้องไม่ติดลบ"),
  sort_order: z.coerce.number().int().min(0),
  is_active: z.boolean().optional().default(false),
  is_demo: z.boolean().optional().default(false),
});

export async function saveRewardAction(id: string | null, _p: FormState, fd: FormData): Promise<FormState> {
  const { denied } = await adminOrDenied();
  if (denied) return { status: "error", message: denied.message };
  const raw = formToObject(fd);
  const parsed = rewardSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: zodErrors(parsed.error), values: raw };
  const row = {
    ...parsed.data,
    description: nullIfEmpty(parsed.data.description),
    image_url: nullIfEmpty(parsed.data.image_url),
  };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("rewards").update(row).eq("id", id)
    : await supabase.from("rewards").insert(row);
  if (error) return { status: "error", message: adminError(error), values: raw };
  revalidateStorefront(...PATHS.rewards);
  return { status: "success", message: "บันทึกของรางวัลแล้ว", redirect: "/admin/rewards" };
}

export async function deleteRewardAction(id: string): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.from("rewards").delete().eq("id", id);
  if (error)
    return {
      ok: false,
      message: error.code === "23503" ? "ของรางวัลนี้มีประวัติการแลกแล้ว — ปิดสถานะแทนการลบ" : adminError(error),
    };
  revalidateStorefront(...PATHS.rewards);
  return { ok: true, message: "ลบของรางวัลแล้ว" };
}

/** requested → fulfilled, or cancelled (returns points as 'reverse' + reward stock) — admin_update_redemption(). */
export async function updateRedemptionAction(
  id: string,
  status: "fulfilled" | "cancelled",
  note: string,
): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  if (status === "cancelled" && !note.trim()) return { ok: false, message: "กรุณาระบุเหตุผลการยกเลิก" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_redemption", {
    p_redemption_id: id,
    p_status: status,
    p_note: note.trim().slice(0, 300) || undefined,
  });
  if (error) return { ok: false, message: toThaiError(error) };
  revalidateStorefront(...PATHS.rewards);
  return {
    ok: true,
    message: status === "fulfilled" ? "บันทึกการส่งมอบแล้ว" : "ยกเลิกแล้ว — คืนคะแนนและจำนวนรางวัลเรียบร้อย",
  };
}
