import "server-only";
import { refresh, revalidatePath } from "next/cache";
import { getCurrentUser, isActiveAdmin, type CurrentUser } from "@/lib/auth/dal";
import { toThaiError } from "@/lib/errors";

export type AdminResult = { ok: true; message: string } | { ok: false; message: string };
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * UI-level admin check for Server Actions. The database is still the real guard:
 * RLS = is_admin() on writes and _assert_admin() inside every admin_* RPC (ADMIN_DESIGN §1).
 */
export async function adminOrDenied(): Promise<
  { user: CurrentUser; denied: null } | { user: null; denied: AdminResult }
> {
  const user = await getCurrentUser();
  if (isActiveAdmin(user)) return { user: user!, denied: null };
  return { user: null, denied: { ok: false, message: toThaiError("FORBIDDEN") } };
}

/** ADMIN_DESIGN §3.1 — refresh storefront pages affected by an admin save, then the admin page itself. */
export function revalidateStorefront(...paths: string[]) {
  for (const p of paths) {
    if (p.includes("[")) revalidatePath(p, "page");
    else revalidatePath(p);
  }
  refresh();
}

export const PATHS = {
  catalog: ["/", "/shop", "/shop/[slug]", "/deals", "/categories"],
  categories: ["/", "/shop", "/categories"],
  promotions: ["/", "/deals", "/shop", "/shop/[slug]"],
  settings: ["/", "/about", "/contact"],
  services: ["/booking"],
  rewards: ["/dashboard/rewards"],
} as const;

/** Supabase errors → Thai, with friendly text for common constraint violations. */
export function adminError(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "ข้อมูลซ้ำกับรายการที่มีอยู่แล้ว (เช่น ชื่อ / slug / SKU / รหัส)";
  if (error.code === "23503") return "ลบไม่ได้ เพราะมีข้อมูลอื่นอ้างอิงอยู่ — แนะนำให้ปิดการใช้งานแทน";
  if (error.code === "23514") return "ข้อมูลไม่ผ่านเงื่อนไขของระบบ กรุณาตรวจสอบค่าที่กรอก";
  return toThaiError(error);
}

const DUPLICATE_FIELD_TEXT: Record<string, string> = {
  sku: "SKU นี้ถูกใช้แล้ว",
  slug: "Slug นี้ถูกใช้แล้ว",
  name: "ชื่อนี้ถูกใช้แล้ว",
  code: "รหัสนี้ถูกใช้แล้ว",
};

/**
 * Unique violation (23505) → the form field it belongs to, read from Postgres' default
 * constraint name ("<table>_<column>_key"), e.g. products_sku_key → { sku: "SKU นี้ถูกใช้แล้ว" }.
 * Returns null for anything else so callers fall back to adminError().
 */
export function duplicateFieldError(
  error: { code?: string; message: string } | null,
): Record<string, string> | null {
  if (!error || error.code !== "23505") return null;
  const column = error.message.match(/"[a-z_]+?_([a-z]+)_key"/)?.[1];
  return column && DUPLICATE_FIELD_TEXT[column] ? { [column]: DUPLICATE_FIELD_TEXT[column] } : null;
}
