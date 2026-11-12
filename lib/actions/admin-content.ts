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
import type { Json } from "@/types/database.types";

/* ================================================================== */
/* Contact messages (ADMIN §4.17)                                      */
/* ================================================================== */

export async function setMessageStatusAction(
  id: string,
  status: "read" | "replied" | "archived" | "new",
): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const now = new Date().toISOString();
  const patch =
    status === "read"
      ? { status, read_at: now }
      : status === "replied"
        ? { status, replied_at: now }
        : { status };
  const { error } = await supabase.from("contact_messages").update(patch).eq("id", id);
  if (error) return { ok: false, message: adminError(error) };
  revalidateStorefront();
  const msg = {
    read: "ทำเครื่องหมายว่าอ่านแล้ว",
    replied: "ทำเครื่องหมายว่าตอบแล้ว",
    archived: "เก็บถาวรแล้ว",
    new: "ทำเครื่องหมายว่ายังไม่อ่าน",
  };
  return { ok: true, message: msg[status] };
}

/** Opening a new message marks it read (ADMIN §4.17) — called once from the detail page. */
export async function markMessageReadIfNewAction(id: string): Promise<void> {
  const { denied } = await adminOrDenied();
  if (denied || !UUID_RE.test(id)) return;
  const supabase = await createClient();
  await supabase
    .from("contact_messages")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "new");
}

export async function setMessageNoteAction(id: string, note: string): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_messages")
    .update({ admin_note: note.trim().slice(0, 1000) || null })
    .eq("id", id);
  if (error) return { ok: false, message: adminError(error) };
  revalidateStorefront();
  return { ok: true, message: "บันทึกหมายเหตุแล้ว" };
}

export async function deleteMessageAction(id: string): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) return { ok: false, message: adminError(error) };
  revalidateStorefront();
  return { ok: true, message: "ลบข้อความแล้ว" };
}

/* ================================================================== */
/* Settings (ADMIN §4.18) — one Server Action per tab                  */
/* ================================================================== */

async function writeSettings(entries: Record<string, Json>, paths: readonly string[]): Promise<FormState> {
  const supabase = await createClient();
  for (const [key, value] of Object.entries(entries)) {
    const { error } = await supabase.from("site_settings").update({ value }).eq("key", key);
    if (error) return { status: "error", message: adminError(error) };
  }
  revalidateStorefront(...paths);
  return { status: "success", message: "บันทึกการตั้งค่าแล้ว" };
}

async function readSetting(key: string): Promise<Record<string, Json>> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as Record<string, Json>) ?? {};
}

const https = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => v === "" || v.startsWith("https://") || v.startsWith("/"),
    "ต้องเป็นลิงก์ https:// หรือ path ภายในเว็บ",
  );

export async function saveStoreSettingsAction(_p: FormState, fd: FormData): Promise<FormState> {
  const { denied } = await adminOrDenied();
  if (denied) return { status: "error", message: denied.message };
  const raw = formToObject(fd);
  const parsed = z
    .object({
      name: z.string().trim().min(1, "กรุณากรอกชื่อร้าน").max(80),
      slogan: z.string().trim().min(1).max(120),
      tagline: z.string().trim().max(200),
      desktop_url: https,
      tablet_url: https,
      mobile_url: https,
      page_banner_url: https,
      cta_label: z.string().trim().min(1).max(30),
      cta_href: z
        .string()
        .trim()
        .regex(/^\/[a-z0-9/?=&_-]*$/i, "ลิงก์ปุ่มต้องเป็น path ภายในเว็บ เช่น /shop"),
    })
    .safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: zodErrors(parsed.error), values: raw };
  const d = parsed.data;
  return writeSettings(
    {
      store_info: { name: d.name, slogan: d.slogan, tagline: d.tagline },
      hero_banner: {
        desktop_url: d.desktop_url,
        tablet_url: d.tablet_url,
        mobile_url: d.mobile_url,
        page_banner_url: d.page_banner_url,
        cta_label: d.cta_label,
        cta_href: d.cta_href,
      },
    },
    PATHS.settings,
  );
}

export async function saveAboutSettingsAction(_p: FormState, fd: FormData): Promise<FormState> {
  const { denied } = await adminOrDenied();
  if (denied) return { status: "error", message: denied.message };
  const raw = formToObject(fd);
  const parsed = z
    .object({
      history: z.string().trim().min(1, "กรุณากรอกประวัติร้าน").max(3000),
      highlights: z.string().trim().min(1, "กรุณากรอกจุดเด่นอย่างน้อย 1 ข้อ").max(2000),
      history_image_url: https,
    })
    .safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: zodErrors(parsed.error), values: raw };
  const highlights = parsed.data.highlights
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
  return writeSettings(
    {
      about_content: {
        history: parsed.data.history,
        highlights,
        history_image_url: parsed.data.history_image_url,
      },
    },
    PATHS.settings,
  );
}

export async function saveContactSettingsAction(_p: FormState, fd: FormData): Promise<FormState> {
  const { denied } = await adminOrDenied();
  if (denied) return { status: "error", message: denied.message };
  const raw = formToObject(fd);
  const httpsOnly = z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || v.startsWith("https://"), "ต้องขึ้นต้นด้วย https://");
  const parsed = z
    .object({
      phone: z
        .string()
        .trim()
        .refine((v) => v === "" || /^[0-9+ -]{9,15}$/.test(v), "เบอร์ไม่ถูกต้อง"),
      email: z
        .string()
        .trim()
        .refine((v) => v === "" || z.string().email().safeParse(v).success, "อีเมลไม่ถูกต้อง"),
      address: z.string().trim().max(500),
      map_embed_url: z
        .string()
        .trim()
        .refine(
          (v) => v === "" || v.startsWith("https://www.google.com/maps/embed"),
          "ใช้ลิงก์ Embed ของ Google Maps (https://www.google.com/maps/embed…)",
        ),
      is_sample: z.boolean().optional().default(false),
      facebook: httpsOnly,
      instagram: httpsOnly,
      tiktok: httpsOnly,
      youtube: httpsOnly,
    })
    .safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: zodErrors(parsed.error), values: raw };
  const d = parsed.data;
  return writeSettings(
    {
      store_contact: {
        phone: nullIfEmpty(d.phone),
        email: nullIfEmpty(d.email),
        address: nullIfEmpty(d.address),
        map_embed_url: nullIfEmpty(d.map_embed_url),
        is_sample: d.is_sample,
      },
      social_links: {
        facebook: nullIfEmpty(d.facebook),
        instagram: nullIfEmpty(d.instagram),
        tiktok: nullIfEmpty(d.tiktok),
        youtube: nullIfEmpty(d.youtube),
      },
    },
    [...PATHS.settings, "/contact"],
  );
}

export async function saveCommerceSettingsAction(_p: FormState, fd: FormData): Promise<FormState> {
  const { denied } = await adminOrDenied();
  if (denied) return { status: "error", message: denied.message };
  const raw = formToObject(fd);
  const parsed = z
    .object({
      flat_fee: z.coerce.number().min(0, "ค่าส่งต้องไม่ติดลบ"),
      free_shipping_min: z.coerce.number().min(0, "ต้องไม่ติดลบ"),
      baht_per_point: z.coerce.number().positive("ต้องมากกว่า 0"),
      birthday_coupon_id: z.string().regex(UUID_RE, "เลือกคูปองแม่แบบวันเกิด"),
    })
    .safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: zodErrors(parsed.error), values: raw };
  const supabase = await createClient();
  const { data: tpl } = await supabase
    .from("coupons")
    .select("id")
    .eq("id", parsed.data.birthday_coupon_id)
    .eq("coupon_type", "birthday")
    .maybeSingle();
  if (!tpl)
    return { status: "error", fieldErrors: { birthday_coupon_id: "ต้องเป็นคูปองประเภท birthday" }, values: raw };
  const [points, birthday] = await Promise.all([readSetting("points_rule"), readSetting("birthday_rule")]);
  return writeSettings(
    {
      shipping_rule: { flat_fee: parsed.data.flat_fee, free_shipping_min: parsed.data.free_shipping_min },
      points_rule: { ...points, baht_per_point: parsed.data.baht_per_point },
      birthday_rule: { ...birthday, coupon_id: parsed.data.birthday_coupon_id },
    },
    ["/cart", "/checkout", "/dashboard/points", "/dashboard/coupons", "/shop/[slug]"],
  );
}

export async function savePaymentSettingsAction(_p: FormState, fd: FormData): Promise<FormState> {
  const { denied } = await adminOrDenied();
  if (denied) return { status: "error", message: denied.message };
  const raw = formToObject(fd);
  const parsed = z
    .object({
      qr_image_url: https,
      bank: z.string().trim().min(1).max(80),
      account_name: z.string().trim().min(1).max(80),
      account_no: z.string().trim().min(1).max(40),
      live: z.boolean().optional().default(false),
    })
    .safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: zodErrors(parsed.error), values: raw };
  const d = parsed.data;
  // D-22: the owner may switch to "live" — real QR/bank shown, slips still checked by hand (no gateway)
  return writeSettings(
    {
      payment_mode: {
        mode: d.live ? "live" : "demo",
        qr_image_url: d.qr_image_url,
        bank_sample: { bank: d.bank, account_name: d.account_name, account_no: d.account_no },
      },
    },
    ["/checkout", "/dashboard/orders"],
  );
}

export async function saveBookingSettingsAction(_p: FormState, fd: FormData): Promise<FormState> {
  const { denied } = await adminOrDenied();
  if (denied) return { status: "error", message: denied.message };
  const raw = formToObject(fd);
  const parsed = z
    .object({
      time_slots: z
        .string()
        .trim()
        .refine(
          (v) => v.split(",").every((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t.trim())),
          "รูปแบบเวลา HH:MM คั่นด้วย , เช่น 10:00, 13:00",
        ),
      max_days_ahead: z.coerce.number().int().min(1, "อย่างน้อย 1 วัน").max(365),
      closed_weekdays: z
        .string()
        .trim()
        .refine(
          (v) => v === "" || v.split(",").every((d) => /^[1-7]$/.test(d.trim())),
          "ใช้ตัวเลข 1–7 (1=จันทร์ … 7=อาทิตย์) คั่นด้วย ,",
        ),
    })
    .safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: zodErrors(parsed.error), values: raw };
  const slots = [...new Set(parsed.data.time_slots.split(",").map((t) => t.trim()))].sort();
  const closed = parsed.data.closed_weekdays
    ? [...new Set(parsed.data.closed_weekdays.split(",").map((d) => Number(d.trim())))].sort()
    : [];
  return writeSettings(
    {
      booking_rule: {
        time_slots: slots,
        max_days_ahead: parsed.data.max_days_ahead,
        closed_weekdays: closed,
      },
    },
    PATHS.services,
  );
}

export async function saveUploadSettingsAction(_p: FormState, fd: FormData): Promise<FormState> {
  const { denied } = await adminOrDenied();
  if (denied) return { status: "error", message: denied.message };
  const raw = formToObject(fd);
  const parsed = z
    .object({ max_mb: z.coerce.number().positive().max(2, "Storage bucket จำกัดไว้ที่ 2 MB") })
    .safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: zodErrors(parsed.error), values: raw };
  return writeSettings(
    {
      upload_rule: {
        max_bytes: Math.round(parsed.data.max_mb * 1024 * 1024),
        mime: ["image/jpeg", "image/png", "image/webp"],
      },
    },
    [],
  );
}

/* ---------------- Team members (About tab) ---------------- */

const teamSchema = z.object({
  full_name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(100),
  position: z.string().trim().min(1, "กรุณากรอกตำแหน่ง").max(100),
  description: z.string().trim().max(500).optional(),
  image_url: z.string().trim().max(500).optional(),
  sort_order: z.coerce.number().int().min(0),
  is_active: z.boolean().optional().default(false),
  is_demo: z.boolean().optional().default(false),
});

export async function saveTeamMemberAction(
  id: string | null,
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const { denied } = await adminOrDenied();
  if (denied) return { status: "error", message: denied.message };
  const raw = formToObject(fd);
  const parsed = teamSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: zodErrors(parsed.error), values: raw };
  const row = {
    ...parsed.data,
    description: nullIfEmpty(parsed.data.description),
    image_url: nullIfEmpty(parsed.data.image_url),
  };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("team_members").update(row).eq("id", id)
    : await supabase.from("team_members").insert(row);
  if (error) return { status: "error", message: adminError(error), values: raw };
  revalidateStorefront("/about");
  return { status: "success", message: "บันทึกข้อมูลทีมงานแล้ว", redirect: "/admin/settings?tab=about" };
}

export async function deleteTeamMemberAction(id: string): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) return { ok: false, message: adminError(error) };
  revalidateStorefront("/about");
  return { ok: true, message: "ลบสมาชิกทีมแล้ว" };
}
