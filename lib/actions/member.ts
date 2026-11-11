"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { GENERIC_ERROR, toThaiError } from "@/lib/errors";
import { fieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { thTodayISO } from "@/lib/utils/format";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type SimpleResult = { ok: true; message: string } | { ok: false; message: string };

/* ------------------------------------------------------------------ */
/* Profile (S14-F02) — members may only update full_name, phone, address, avatar_url (column GRANT, R-01) */
/* ------------------------------------------------------------------ */

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "กรุณากรอกชื่อ-นามสกุล").max(100, "ชื่อยาวเกิน 100 ตัวอักษร"),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[0-9+ -]{9,15}$/.test(v), "กรุณากรอกเบอร์โทร 9–15 หลัก (ตัวเลข + - หรือเว้นวรรค)"),
  address: z.string().trim().max(500, "ที่อยู่ยาวเกิน 500 ตัวอักษร"),
});

export type ProfileFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: FieldErrors;
};

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: toThaiError("NOT_AUTHENTICATED") };
  const parsed = profileSchema.safeParse({
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    })
    .eq("id", user.id);
  if (error) return { status: "error", message: toThaiError(error) };
  refresh();
  return { status: "success", message: "บันทึกข้อมูลแล้ว" };
}

/** Avatar: the file is uploaded by the browser to avatars/{uid}/… (storage policy); here we only store the URL. */
export async function setAvatarUrlAction(publicUrl: string | null): Promise<SimpleResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: toThaiError("NOT_AUTHENTICATED") };
  if (publicUrl !== null) {
    const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}/`;
    if (!publicUrl.startsWith(base)) return { ok: false, message: GENERIC_ERROR };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
  if (error) return { ok: false, message: toThaiError(error) };
  refresh();
  return { ok: true, message: publicUrl ? "อัปเดตรูปโปรไฟล์แล้ว" : "ลบรูปโปรไฟล์แล้ว" };
}

/** Birth date via set_my_birth_date(): first set always allowed, one change afterwards (S11-F01). */
export async function setBirthDateAction(date: string): Promise<SimpleResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date <= "1900-01-01" || date > thTodayISO()) {
    return { ok: false, message: toThaiError("INVALID_BIRTH_DATE") };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_my_birth_date", { p_birth_date: date });
  if (error) return { ok: false, message: toThaiError(error) };
  refresh();
  return { ok: true, message: "บันทึกวันเกิดแล้ว" };
}

/* ------------------------------------------------------------------ */
/* Birthday coupon (S11-F03)                                            */
/* ------------------------------------------------------------------ */

export type ClaimResult = { ok: true; code: string; expiresAt: string } | { ok: false; message: string };

export async function claimBirthdayCouponAction(): Promise<ClaimResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_birthday_coupon");
  if (error) return { ok: false, message: toThaiError(error) };
  const r = data as { code: string; expires_at: string };
  refresh();
  return { ok: true, code: r.code, expiresAt: r.expires_at };
}

/* ------------------------------------------------------------------ */
/* Rewards (S12-F04)                                                    */
/* ------------------------------------------------------------------ */

export async function redeemRewardAction(rewardId: string): Promise<SimpleResult> {
  if (!UUID_RE.test(rewardId)) return { ok: false, message: GENERIC_ERROR };
  const supabase = await createClient();
  // One transaction in the DB: check points + stock → redemption → deduct points → ledger → reward stock −1
  const { error } = await supabase.rpc("redeem_reward", { p_reward_id: rewardId });
  if (error) return { ok: false, message: toThaiError(error) };
  refresh();
  return { ok: true, message: "แลกของรางวัลสำเร็จ — รอร้านจัดเตรียมและส่งมอบ" };
}
