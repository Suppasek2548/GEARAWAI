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

const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]+$/, "ใช้ได้เฉพาะ a-z 0-9 และ -")
  .max(80);
const urlOrEmpty = z.string().trim().max(500).optional();
const bool = z.boolean().optional().default(false);
const intMin0 = (msg: string) => z.coerce.number().int(msg).min(0, msg);

/* ================================================================== */
/* Categories (ADMIN §4.3)                                             */
/* ================================================================== */

const categorySchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อหมวดหมู่").max(80),
  slug,
  description: z.string().trim().max(500).optional(),
  image_url: urlOrEmpty,
  sort_order: intMin0("ลำดับต้องเป็นจำนวนเต็มตั้งแต่ 0"),
  is_active: bool,
  is_demo: bool,
});

export async function saveCategoryAction(id: string | null, _p: FormState, fd: FormData): Promise<FormState> {
  const { denied } = await adminOrDenied();
  if (denied) return { status: "error", message: denied.message };
  const raw = formToObject(fd);
  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: zodErrors(parsed.error), values: raw };
  const d = parsed.data;
  const row = { ...d, description: nullIfEmpty(d.description), image_url: nullIfEmpty(d.image_url) };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("categories").update(row).eq("id", id)
    : await supabase.from("categories").insert(row);
  if (error) return { status: "error", message: adminError(error), values: raw };
  revalidateStorefront(...PATHS.categories);
  return { status: "success", message: "บันทึกหมวดหมู่แล้ว", redirect: "/admin/categories" };
}

export async function deleteCategoryAction(id: string): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if (count) return { ok: false, message: `ย้ายสินค้า ${count} รายการออกจากหมวดนี้ก่อน (หรือปิดการใช้งานหมวดแทน)` };
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, message: adminError(error) };
  revalidateStorefront(...PATHS.categories);
  return { ok: true, message: "ลบหมวดหมู่แล้ว" };
}

/* ================================================================== */
/* Brands (ADMIN §4.4)                                                 */
/* ================================================================== */

const brandSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อแบรนด์").max(80),
  slug,
  logo_url: urlOrEmpty,
  is_active: bool,
  is_demo: bool,
});

export async function saveBrandAction(id: string | null, _p: FormState, fd: FormData): Promise<FormState> {
  const { denied } = await adminOrDenied();
  if (denied) return { status: "error", message: denied.message };
  const raw = formToObject(fd);
  const parsed = brandSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: zodErrors(parsed.error), values: raw };
  const row = { ...parsed.data, logo_url: nullIfEmpty(parsed.data.logo_url) };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("brands").update(row).eq("id", id)
    : await supabase.from("brands").insert(row);
  if (error) return { status: "error", message: adminError(error), values: raw };
  revalidateStorefront(...PATHS.catalog);
  return { status: "success", message: "บันทึกแบรนด์แล้ว", redirect: "/admin/brands" };
}

export async function deleteBrandAction(id: string): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", id);
  if (count) return { ok: false, message: `แบรนด์นี้มีสินค้า ${count} รายการ — ลบไม่ได้ (ปิดการใช้งานแทน)` };
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return { ok: false, message: adminError(error) };
  revalidateStorefront(...PATHS.catalog);
  return { ok: true, message: "ลบแบรนด์แล้ว" };
}

/* ================================================================== */
/* Products (ADMIN §4.2)                                               */
/* ================================================================== */

const productSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^GA-[A-Z]{2}-[0-9]{3}$/, "รูปแบบ SKU: GA-XX-000"),
    name: z.string().trim().min(1, "กรุณากรอกชื่อสินค้า").max(150),
    slug,
    brand_id: z.string().regex(UUID_RE, "กรุณาเลือกแบรนด์"),
    category_id: z.string().regex(UUID_RE, "กรุณาเลือกหมวดหมู่"),
    short_description: z.string().trim().max(200, "คำอธิบายสั้นไม่เกิน 200 ตัวอักษร").optional(),
    description: z.string().trim().max(5000).optional(),
    specifications: z.string().optional(),
    price: z.coerce.number({ message: "กรุณากรอกราคา" }).positive("ราคาต้องมากกว่า 0").max(99999999),
    sale_price: z.string().trim().optional(),
    stock_quantity: z.string().optional(),
    low_stock_threshold: intMin0("เกณฑ์สต็อกต่ำต้องเป็นจำนวนเต็มตั้งแต่ 0"),
    status: z.enum(["active", "inactive"]),
    is_featured: bool,
    is_demo: bool,
  })
  .superRefine((d, ctx) => {
    if (d.sale_price) {
      const sp = Number(d.sale_price);
      if (!Number.isFinite(sp) || sp <= 0 || sp >= d.price)
        ctx.addIssue({ code: "custom", path: ["sale_price"], message: "ราคาลดต้องมากกว่า 0 และน้อยกว่าราคาปกติ" });
    }
    if (d.specifications) {
      try {
        const j = JSON.parse(d.specifications);
        if (typeof j !== "object" || Array.isArray(j) || j === null) throw new Error();
      } catch {
        ctx.addIssue({ code: "custom", path: ["specifications"], message: "ข้อมูล Specifications ไม่ถูกต้อง" });
      }
    }
  });

export async function saveProductAction(id: string | null, _p: FormState, fd: FormData): Promise<FormState> {
  const { denied } = await adminOrDenied();
  if (denied) return { status: "error", message: denied.message };
  const raw = formToObject(fd);
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: zodErrors(parsed.error), values: raw };
  const d = parsed.data;

  const common = {
    sku: d.sku,
    name: d.name,
    slug: d.slug,
    brand_id: d.brand_id,
    category_id: d.category_id,
    short_description: nullIfEmpty(d.short_description),
    description: nullIfEmpty(d.description),
    specifications: d.specifications ? JSON.parse(d.specifications) : {},
    price: d.price,
    sale_price: d.sale_price ? Number(d.sale_price) : null,
    low_stock_threshold: d.low_stock_threshold,
    status: d.status,
    is_featured: d.is_featured,
    is_demo: d.is_demo,
  };

  const supabase = await createClient();
  if (id) {
    // stock_quantity is NOT updatable here — the DB has no UPDATE grant on it; use the Stock menu (ADMIN §4.2)
    const { error } = await supabase.from("products").update(common).eq("id", id);
    if (error) return { status: "error", message: adminError(error), values: raw };
    revalidateStorefront(...PATHS.catalog);
    return { status: "success", message: "บันทึกสินค้าแล้ว", redirect: "/admin/products" };
  }

  const initial = Number(d.stock_quantity || 0);
  if (!Number.isInteger(initial) || initial < 0)
    return { status: "error", fieldErrors: { stock_quantity: "สต็อกเริ่มต้นต้องเป็นจำนวนเต็มตั้งแต่ 0" }, values: raw };
  const { data, error } = await supabase
    .from("products")
    .insert({ ...common, stock_quantity: initial }) // trigger writes stock_movements('initial')
    .select("id")
    .single();
  if (error || !data)
    return { status: "error", message: error ? adminError(error) : "บันทึกไม่สำเร็จ", values: raw };
  revalidateStorefront(...PATHS.catalog);
  // Next: add pictures on the edit page
  return {
    status: "success",
    message: "เพิ่มสินค้าแล้ว — เพิ่มรูปภาพต่อได้เลย",
    redirect: `/admin/products/${data.id}#images`,
  };
}

/** Allowed only if the product was never ordered (order_items RESTRICT, R-10). */
export async function deleteProductAction(id: string): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") return { ok: false, message: "สินค้านี้มีประวัติการสั่งซื้อ แนะนำให้ปิดการขายแทน" };
    return { ok: false, message: adminError(error) };
  }
  revalidateStorefront(...PATHS.catalog);
  return { ok: true, message: "ลบสินค้าแล้ว" };
}

export async function setProductFlagAction(
  id: string,
  field: "status" | "is_featured",
  value: boolean,
): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const patch =
    field === "status"
      ? { status: value ? ("active" as const) : ("inactive" as const) }
      : { is_featured: value };
  const { error } = await supabase.from("products").update(patch).eq("id", id);
  if (error) return { ok: false, message: adminError(error) };
  revalidateStorefront(...PATHS.catalog);
  return {
    ok: true,
    message:
      field === "status"
        ? value
          ? "เปิดการขายแล้ว"
          : "ปิดการขายแล้ว"
        : value
          ? "ตั้งเป็นสินค้าแนะนำ"
          : "นำออกจากสินค้าแนะนำ",
  };
}

/* ---------- Product images (S16-F07) ---------- */

export async function addProductImageAction(
  productId: string,
  url: string,
  mediaId: string | null,
  alt: string,
): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(productId) || !url) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    image_url: url,
    media_id: mediaId && UUID_RE.test(mediaId) ? mediaId : null,
    alt_text: alt.slice(0, 150),
    sort_order: count ?? 0,
    is_primary: !count, // first picture becomes the primary one
  });
  if (error) return { ok: false, message: adminError(error) };
  revalidateStorefront(...PATHS.catalog);
  return { ok: true, message: "เพิ่มรูปแล้ว" };
}

export async function productImageAction(
  imageId: string,
  op: "primary" | "remove" | "up" | "down",
): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(imageId)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { data: img } = await supabase
    .from("product_images")
    .select("id, product_id, sort_order, is_primary")
    .eq("id", imageId)
    .single();
  if (!img) return { ok: false, message: "ไม่พบรูป" };

  if (op === "primary") {
    // trigger ensure_single_primary_image() clears the previous primary
    const { error } = await supabase.from("product_images").update({ is_primary: true }).eq("id", imageId);
    if (error) return { ok: false, message: adminError(error) };
  } else if (op === "remove") {
    const { error } = await supabase.from("product_images").delete().eq("id", imageId);
    if (error) return { ok: false, message: adminError(error) };
    if (img.is_primary) {
      const { data: next } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", img.product_id)
        .order("sort_order")
        .limit(1)
        .maybeSingle();
      if (next) await supabase.from("product_images").update({ is_primary: true }).eq("id", next.id);
    }
  } else {
    const { data: all } = await supabase
      .from("product_images")
      .select("id, sort_order")
      .eq("product_id", img.product_id)
      .order("sort_order")
      .order("created_at");
    const list = all ?? [];
    const i = list.findIndex((x) => x.id === imageId);
    const j = op === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return { ok: true, message: "ไม่มีการเปลี่ยนแปลง" };
    [list[i], list[j]] = [list[j], list[i]];
    for (let k = 0; k < list.length; k++) {
      await supabase.from("product_images").update({ sort_order: k }).eq("id", list[k].id);
    }
  }
  revalidateStorefront(...PATHS.catalog);
  return {
    ok: true,
    message: op === "primary" ? "ตั้งเป็นภาพหลักแล้ว" : op === "remove" ? "ลบรูปแล้ว" : "จัดลำดับแล้ว",
  };
}

/* ================================================================== */
/* Stock (ADMIN §4.5) — admin_adjust_stock() logs stock_movements      */
/* ================================================================== */

export async function adjustStockAction(
  productId: string,
  type: "restock" | "adjustment",
  change: number,
  note: string,
): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(productId) || !Number.isInteger(change) || change === 0)
    return { ok: false, message: "จำนวนต้องเป็นจำนวนเต็มที่ไม่ใช่ 0" };
  if (type === "restock" && change < 0) return { ok: false, message: "รับเข้า (restock) ต้องเป็นจำนวนบวก" };
  if (type === "adjustment" && !note.trim()) return { ok: false, message: "กรุณาระบุเหตุผลการปรับสต็อก" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_adjust_stock", {
    p_product_id: productId,
    p_change: change,
    p_type: type,
    p_note: note.trim() || undefined,
  });
  if (error) {
    if (/stock_quantity|check|negative|NEGATIVE/i.test(error.message))
      return { ok: false, message: "สต็อกหลังปรับต้องไม่ติดลบ" };
    return { ok: false, message: adminError(error) };
  }
  revalidateStorefront(...PATHS.catalog);
  return { ok: true, message: `ปรับสต็อกแล้ว — คงเหลือ ${data}` };
}
