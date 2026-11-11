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
import { formToObject, localToIso, nullIfEmpty, zodErrors, type FormState } from "@/lib/admin/form";
import { toThaiError } from "@/lib/errors";

const bool = z.boolean().optional().default(false);
const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]+$/, "ใช้ได้เฉพาะ a-z 0-9 และ -")
  .max(80);
const optNum = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? Number(v) : null))
  .refine((v) => v === null || (Number.isFinite(v) && v > 0), "ต้องเป็นตัวเลขมากกว่า 0");

/* ================================================================== */
/* Promotions (ADMIN §4.12)                                            */
/* ================================================================== */

const promotionSchema = z
  .object({
    name: z.string().trim().min(1, "กรุณากรอกชื่อโปรโมชั่น").max(150),
    slug,
    description: z.string().trim().max(1000).optional(),
    discount_type: z.enum(["percentage", "fixed_amount"]),
    discount_value: z.coerce.number().positive("ส่วนลดต้องมากกว่า 0"),
    start_at: z.string().min(1, "กรุณาเลือกวันเริ่มต้น"),
    end_at: z.string().min(1, "กรุณาเลือกวันสิ้นสุด"),
    banner_desktop_url: z.string().trim().max(500).optional(),
    banner_mobile_url: z.string().trim().max(500).optional(),
    sort_order: z.coerce.number().int().min(0),
    is_active: bool,
    show_on_homepage: bool,
    is_demo: bool,
  })
  .superRefine((d, ctx) => {
    if (d.discount_type === "percentage" && d.discount_value > 100)
      ctx.addIssue({ code: "custom", path: ["discount_value"], message: "เปอร์เซ็นต์ต้องไม่เกิน 100" });
    if (d.start_at && d.end_at && d.end_at <= d.start_at)
      ctx.addIssue({ code: "custom", path: ["end_at"], message: "วันสิ้นสุดต้องหลังวันเริ่มต้น" });
  });

export async function savePromotionAction(
  id: string | null,
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const { denied } = await adminOrDenied();
  if (denied) return { status: "error", message: denied.message };
  const raw = formToObject(fd);
  const parsed = promotionSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: zodErrors(parsed.error), values: raw };
  const d = parsed.data;
  const row = {
    ...d,
    description: nullIfEmpty(d.description),
    banner_desktop_url: nullIfEmpty(d.banner_desktop_url),
    banner_mobile_url: nullIfEmpty(d.banner_mobile_url),
    start_at: localToIso(d.start_at)!,
    end_at: localToIso(d.end_at)!,
  };
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("promotions").update(row).eq("id", id);
    if (error) return { status: "error", message: adminError(error), values: raw };
    revalidateStorefront(...PATHS.promotions);
    return { status: "success", message: "บันทึกโปรโมชั่นแล้ว", redirect: "/admin/promotions" };
  }
  const { data, error } = await supabase.from("promotions").insert(row).select("id").single();
  if (error || !data)
    return { status: "error", message: error ? adminError(error) : "บันทึกไม่สำเร็จ", values: raw };
  revalidateStorefront(...PATHS.promotions);
  return {
    status: "success",
    message: "สร้างโปรโมชั่นแล้ว — เลือกสินค้าที่เข้าร่วมต่อได้เลย",
    redirect: `/admin/promotions/${data.id}#products`,
  };
}

export async function deletePromotionAction(id: string): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.from("promotions").delete().eq("id", id); // promotion_products CASCADE
  if (error) return { ok: false, message: adminError(error) };
  revalidateStorefront(...PATHS.promotions);
  return { ok: true, message: "ลบโปรโมชั่นแล้ว" };
}

/** Replace the set of participating products (S19-F07). */
export async function setPromotionProductsAction(
  promotionId: string,
  productIds: string[],
): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(promotionId) || productIds.some((p) => !UUID_RE.test(p)))
    return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("promotion_products")
    .select("product_id")
    .eq("promotion_id", promotionId);
  const have = new Set((current ?? []).map((c) => c.product_id));
  const want = new Set(productIds);
  const toAdd = [...want].filter((p) => !have.has(p));
  const toRemove = [...have].filter((p) => !want.has(p));
  if (toRemove.length) {
    const { error } = await supabase
      .from("promotion_products")
      .delete()
      .eq("promotion_id", promotionId)
      .in("product_id", toRemove);
    if (error) return { ok: false, message: adminError(error) };
  }
  if (toAdd.length) {
    const { error } = await supabase
      .from("promotion_products")
      .insert(toAdd.map((product_id) => ({ promotion_id: promotionId, product_id })));
    if (error) return { ok: false, message: adminError(error) };
  }
  revalidateStorefront(...PATHS.promotions);
  return { ok: true, message: `บันทึกสินค้าที่เข้าร่วมแล้ว (${want.size} รายการ)` };
}

/* ================================================================== */
/* Coupons (ADMIN §4.13)                                               */
/* ================================================================== */

const couponSchema = z
  .object({
    code: z.string().trim().toUpperCase().max(40).optional(),
    name: z.string().trim().min(1, "กรุณากรอกชื่อคูปอง").max(150),
    description: z.string().trim().max(500).optional(),
    coupon_type: z.enum(["general", "birthday"]),
    discount_type: z.enum(["percentage", "fixed_amount"]),
    discount_value: z.coerce.number().positive("ส่วนลดต้องมากกว่า 0"),
    max_discount_amount: optNum,
    min_order_amount: z.coerce.number().min(0, "ยอดขั้นต่ำต้องไม่ติดลบ"),
    usage_limit: optNum,
    per_user_limit: z.coerce.number().int().positive("ต้องมากกว่า 0"),
    valid_days_after_claim: optNum,
    start_at: z.string().optional(),
    end_at: z.string().optional(),
    is_active: bool,
    is_demo: bool,
  })
  .superRefine((d, ctx) => {
    if (d.coupon_type === "general" && !d.code)
      ctx.addIssue({ code: "custom", path: ["code"], message: "คูปองทั่วไปต้องมีรหัส" });
    if (d.code && !/^[A-Z0-9-]{3,40}$/.test(d.code))
      ctx.addIssue({ code: "custom", path: ["code"], message: "รหัสใช้ A-Z 0-9 และ - (3–40 ตัว)" });
    if (d.discount_type === "percentage" && d.discount_value > 100)
      ctx.addIssue({ code: "custom", path: ["discount_value"], message: "เปอร์เซ็นต์ต้องไม่เกิน 100" });
    if (d.start_at && d.end_at && d.end_at <= d.start_at)
      ctx.addIssue({ code: "custom", path: ["end_at"], message: "วันสิ้นสุดต้องหลังวันเริ่มต้น" });
  });

export async function saveCouponAction(id: string | null, _p: FormState, fd: FormData): Promise<FormState> {
  const { denied } = await adminOrDenied();
  if (denied) return { status: "error", message: denied.message };
  const raw = formToObject(fd);
  const parsed = couponSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: zodErrors(parsed.error), values: raw };
  const d = parsed.data;
  const row = {
    code: d.coupon_type === "birthday" ? nullIfEmpty(d.code) : d.code!,
    name: d.name,
    description: nullIfEmpty(d.description),
    coupon_type: d.coupon_type,
    discount_type: d.discount_type,
    discount_value: d.discount_value,
    max_discount_amount: d.max_discount_amount,
    min_order_amount: d.min_order_amount,
    usage_limit: d.usage_limit === null ? null : Math.floor(d.usage_limit),
    per_user_limit: d.per_user_limit,
    valid_days_after_claim: d.valid_days_after_claim === null ? null : Math.floor(d.valid_days_after_claim),
    start_at: localToIso(d.start_at ?? ""),
    end_at: localToIso(d.end_at ?? ""),
    is_active: d.is_active,
    is_demo: d.is_demo,
  };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("coupons").update(row).eq("id", id)
    : await supabase.from("coupons").insert(row);
  if (error) return { status: "error", message: adminError(error), values: raw };
  revalidateStorefront();
  return { status: "success", message: "บันทึกคูปองแล้ว", redirect: "/admin/coupons" };
}

/** Coupons that were ever used / issued cannot be deleted — deactivate them instead (ADMIN §4.13). */
export async function deleteCouponAction(id: string): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const [{ count: orders }, { count: issued }, { data: setting }] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("coupon_id", id),
    supabase.from("member_coupons").select("id", { count: "exact", head: true }).eq("coupon_id", id),
    supabase.from("site_settings").select("value").eq("key", "birthday_rule").maybeSingle(),
  ]);
  if (orders || issued) return { ok: false, message: "คูปองนี้เคยถูกใช้/ออกให้สมาชิกแล้ว — ปิดสถานะแทนการลบ" };
  if ((setting?.value as { coupon_id?: string } | null)?.coupon_id === id)
    return { ok: false, message: "คูปองนี้เป็นแม่แบบวันเกิดที่ผูกกับ Settings — ลบไม่ได้" };
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return { ok: false, message: adminError(error) };
  revalidateStorefront();
  return { ok: true, message: "ลบคูปองแล้ว" };
}

/* ================================================================== */
/* Services (ADMIN §4.14) & Bookings (ADMIN §4.15)                     */
/* ================================================================== */

const serviceSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อบริการ").max(150),
  slug,
  description: z.string().trim().max(1000).optional(),
  price: z.coerce.number().min(0, "ราคาต้องไม่ติดลบ"),
  duration_minutes: z.coerce.number().int().positive("ระยะเวลาต้องมากกว่า 0"),
  image_url: z.string().trim().max(500).optional(),
  sort_order: z.coerce.number().int().min(0),
  is_active: bool,
  is_demo: bool,
});

export async function saveServiceAction(id: string | null, _p: FormState, fd: FormData): Promise<FormState> {
  const { denied } = await adminOrDenied();
  if (denied) return { status: "error", message: denied.message };
  const raw = formToObject(fd);
  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: zodErrors(parsed.error), values: raw };
  const row = {
    ...parsed.data,
    description: nullIfEmpty(parsed.data.description),
    image_url: nullIfEmpty(parsed.data.image_url),
  };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("services").update(row).eq("id", id)
    : await supabase.from("services").insert(row);
  if (error) return { status: "error", message: adminError(error), values: raw };
  revalidateStorefront(...PATHS.services);
  return { status: "success", message: "บันทึกบริการแล้ว", redirect: "/admin/services" };
}

export async function deleteServiceAction(id: string): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error)
    return {
      ok: false,
      message: error.code === "23503" ? "บริการนี้มีการจองแล้ว — ปิดสถานะแทนการลบ" : adminError(error),
    };
  revalidateStorefront(...PATHS.services);
  return { ok: true, message: "ลบบริการแล้ว" };
}

/** pending → confirmed/cancelled · confirmed → completed/cancelled · note only (status undefined). */
export async function updateBookingAction(
  id: string,
  status: "confirmed" | "completed" | "cancelled" | null,
  note: string,
): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_booking", {
    p_booking_id: id,
    p_status: status ?? undefined,
    p_admin_note: note.trim().slice(0, 500) || undefined,
  });
  if (error) return { ok: false, message: toThaiError(error) };
  revalidateStorefront(...PATHS.services);
  const msg = {
    confirmed: "ยืนยันการจองแล้ว",
    completed: "บันทึกว่าเสร็จสิ้นแล้ว",
    cancelled: "ยกเลิกการจองแล้ว — ช่วงเวลากลับมาว่าง",
  };
  return { ok: true, message: status ? msg[status] : "บันทึกหมายเหตุแล้ว" };
}
