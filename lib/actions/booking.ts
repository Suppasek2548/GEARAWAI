"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { getCurrentUser } from "@/lib/auth/dal";
import { GENERIC_ERROR, toThaiError } from "@/lib/errors";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** S08-F04 — taken slots only (no booker data, R-03). Works for guests too. */
export async function getBookedSlotsAction(serviceId: string, date: string): Promise<string[]> {
  if (!UUID_RE.test(serviceId) || !DATE_RE.test(date)) return [];
  const supabase = await createPublicClient();
  const { data } = await supabase.rpc("get_booked_slots", { p_service_id: serviceId, p_date: date });
  return (data ?? []).map((r) => String(r.time_slot).slice(0, 5)); // "10:00:00" → "10:00"
}

const bookingSchema = z.object({
  serviceId: z.string().regex(UUID_RE, "กรุณาเลือกบริการ"),
  date: z.string().regex(DATE_RE, "กรุณาเลือกวันที่"),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, "กรุณาเลือกเวลา"),
  contactName: z.string().trim().min(1, "กรุณากรอกชื่อผู้จอง").max(100),
  contactPhone: z
    .string()
    .trim()
    .regex(/^[0-9+ -]{9,15}$/, "กรุณากรอกเบอร์โทร 9–15 หลัก"),
  contactEmail: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง").max(254),
  note: z.string().trim().max(500, "หมายเหตุยาวเกิน 500 ตัวอักษร").optional(),
});

export type BookingInput = z.input<typeof bookingSchema>;
export type BookingResult =
  | { ok: true; bookingNumber: string }
  | { ok: false; reason: "NEED_LOGIN" }
  | { ok: false; reason: "INVALID"; fieldErrors: Record<string, string> }
  | { ok: false; reason: "ERROR"; code: string | null; message: string };

/** S08-F06 — create_booking() validates date/slot/closed day/account and generates BK-YYYYMMDD-NNNN. */
export async function createBookingAction(input: BookingInput): Promise<BookingResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "NEED_LOGIN" };

  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] ??= i.message;
    return { ok: false, reason: "INVALID", fieldErrors: fe };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_booking", {
    p_service_id: d.serviceId,
    p_date: d.date,
    p_time_slot: d.timeSlot,
    p_contact_name: d.contactName,
    p_contact_phone: d.contactPhone,
    p_contact_email: d.contactEmail,
    p_note: d.note || undefined,
  });
  if (error || !data) {
    const code = error?.message.match(/^([A-Z_]+)/)?.[1] ?? null;
    return { ok: false, reason: "ERROR", code, message: error ? toThaiError(error) : GENERIC_ERROR };
  }
  refresh();
  return { ok: true, bookingNumber: data };
}

/** S08-F07 — member cancels own booking while pending. */
export async function cancelBookingAction(bookingId: string): Promise<{ ok: boolean; message: string }> {
  if (!UUID_RE.test(bookingId)) return { ok: false, message: GENERIC_ERROR };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_booking", { p_booking_id: bookingId });
  if (error) return { ok: false, message: toThaiError(error) };
  refresh();
  return { ok: true, message: "ยกเลิกการจองแล้ว" };
}
