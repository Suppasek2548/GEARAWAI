"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { errorCode, GENERIC_ERROR, toThaiError } from "@/lib/errors";
import { fieldErrors, type FieldErrors } from "@/lib/validation/auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ------------------------------------------------------------------ */
/* Coupon (S09-F03, S11-F05)                                            */
/* ------------------------------------------------------------------ */

export type CouponCheck =
  { valid: true; code: string; discount: number; subtotal: number } | { valid: false; message: string };

/** validate_coupon() evaluates against the CURRENT cart in the DB — nothing is saved. */
export async function validateCouponAction(rawCode: string): Promise<CouponCheck> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, message: toThaiError("COUPON_NO_CODE") };
  if (code.length > 40) return { valid: false, message: toThaiError("COUPON_INVALID_CODE") };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("validate_coupon", { p_code: code });
  if (error) return { valid: false, message: toThaiError(error) };
  const r = data as {
    valid: boolean;
    reason: string | null;
    code: string;
    discount: number;
    subtotal: number;
  };
  if (!r.valid) return { valid: false, message: toThaiError(`COUPON_${r.reason}`) };
  return { valid: true, code: r.code ?? code, discount: Number(r.discount), subtotal: Number(r.subtotal) };
}

/* ------------------------------------------------------------------ */
/* Place order (S09-F05)                                                */
/* ------------------------------------------------------------------ */

const orderSchema = z.object({
  recipientName: z.string().trim().min(1, "กรุณากรอกชื่อผู้รับ").max(100, "ชื่อยาวเกิน 100 ตัวอักษร"),
  recipientPhone: z
    .string()
    .trim()
    .regex(/^[0-9+ -]{9,15}$/, "กรุณากรอกเบอร์โทร 9–15 หลัก (ตัวเลข + - หรือเว้นวรรค)"),
  shippingAddress: z
    .string()
    .trim()
    .min(10, "กรุณากรอกที่อยู่จัดส่งอย่างน้อย 10 ตัวอักษร")
    .max(500, "ที่อยู่ยาวเกิน 500 ตัวอักษร"),
  note: z.string().trim().max(500, "หมายเหตุยาวเกิน 500 ตัวอักษร").optional(),
  couponCode: z.string().trim().max(40).optional(),
});

export type PlaceOrderState = {
  error?: string;
  outOfStockSku?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
};

/**
 * place_order() does everything in ONE transaction: lock products → check stock → price from
 * calc_effective_price → shipping → coupon → order + snapshot items → cut stock → clear cart.
 * The client never sends prices or totals.
 */
export async function placeOrderAction(_prev: PlaceOrderState, formData: FormData): Promise<PlaceOrderState> {
  const raw = {
    recipientName: String(formData.get("recipientName") ?? ""),
    recipientPhone: String(formData.get("recipientPhone") ?? ""),
    shippingAddress: String(formData.get("shippingAddress") ?? ""),
    note: String(formData.get("note") ?? ""),
    couponCode: String(formData.get("couponCode") ?? "").toUpperCase(),
  };
  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };

  const d = parsed.data;
  const supabase = await createClient();
  const { data: orderNumber, error } = await supabase.rpc("place_order", {
    p_recipient_name: d.recipientName,
    p_recipient_phone: d.recipientPhone,
    p_shipping_address: d.shippingAddress,
    p_note: d.note || undefined,
    p_coupon_code: d.couponCode || undefined,
  });

  if (error || !orderNumber) {
    const code = errorCode(error?.message);
    if (code === "OUT_OF_STOCK") {
      const sku = error!.message.split(":")[1]?.trim();
      return {
        error: `สินค้า ${sku ?? ""} มีไม่พอหรือไม่พร้อมจำหน่าย กรุณาตรวจสอบตะกร้าอีกครั้ง`,
        outOfStockSku: sku,
        values: raw,
      };
    }
    if (code?.startsWith("COUPON_")) return { fieldErrors: { couponCode: toThaiError(error) }, values: raw };
    return { error: error ? toThaiError(error) : GENERIC_ERROR, values: raw };
  }

  // place_order() emptied the cart. Refresh the client router so the redirect also re-renders the root
  // layout — otherwise the header keeps the old cart badge (the layout is reused on navigation).
  refresh();
  redirect(`/checkout/payment/${orderNumber}`);
}

/* ------------------------------------------------------------------ */
/* Demo payment (S09-F06–F08)                                           */
/* ------------------------------------------------------------------ */

export type SubmitPaymentResult = { ok: true } | { ok: false; message: string };

export async function submitPaymentAction(input: {
  orderId: string;
  method: "promptpay_demo" | "bank_transfer_demo";
  slipPath: string | null;
  note: string;
}): Promise<SubmitPaymentResult> {
  if (!UUID_RE.test(input.orderId)) return { ok: false, message: GENERIC_ERROR };
  if (input.method !== "promptpay_demo" && input.method !== "bank_transfer_demo")
    return { ok: false, message: GENERIC_ERROR };
  const note = input.note.trim();
  if (note.length > 300) return { ok: false, message: "หมายเหตุยาวเกิน 300 ตัวอักษร" };

  const supabase = await createClient();
  // The RPC copies the amount from orders.total_amount and checks the slip path belongs to this user/order
  const { error } = await supabase.rpc("submit_payment", {
    p_order_id: input.orderId,
    p_method: input.method,
    p_slip_path: input.slipPath ?? undefined,
    p_note: note || undefined,
  });
  if (error) return { ok: false, message: toThaiError(error) };
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Cancel (S14-F10 member: pending_payment only)                        */
/* ------------------------------------------------------------------ */

export async function cancelMyOrderAction(orderId: string, reason: string): Promise<SubmitPaymentResult> {
  if (!UUID_RE.test(orderId)) return { ok: false, message: GENERIC_ERROR };
  const why = reason.trim();
  if (!why) return { ok: false, message: toThaiError("REASON_REQUIRED") };
  if (why.length > 300) return { ok: false, message: "เหตุผลยาวเกิน 300 ตัวอักษร" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_order", { p_order_id: orderId, p_reason: why });
  if (error) return { ok: false, message: toThaiError(error) };
  refresh();
  return { ok: true };
}
