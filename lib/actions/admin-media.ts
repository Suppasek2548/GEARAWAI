"use server";

import { createClient } from "@/lib/supabase/server";
import {
  adminError,
  adminOrDenied,
  revalidateStorefront,
  UUID_RE,
  type AdminResult,
} from "@/lib/admin/guard";
import { MEDIA_CATEGORIES, type MediaCategory, type MediaItem } from "@/lib/admin/media-types";

const BUCKETS = ["product-images", "site-media"] as const;
const MIME = ["image/jpeg", "image/png", "image/webp"];

/** Called after the browser uploaded the file to Storage (admin storage policy). Adds the media_files row. */
export async function registerMediaAction(input: {
  bucket: (typeof BUCKETS)[number];
  path: string;
  fileName: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  category: MediaCategory;
  alt: string;
}): Promise<{ ok: true; item: MediaItem } | { ok: false; message: string }> {
  const { denied } = await adminOrDenied();
  if (denied) return { ok: false, message: denied.message };
  if (
    !BUCKETS.includes(input.bucket) ||
    !MIME.includes(input.mime) ||
    input.size <= 0 ||
    input.size > 2097152
  )
    return { ok: false, message: "ไฟล์ไม่ถูกต้อง (JPG/PNG/WebP ไม่เกิน 2 MB)" };
  if (
    !MEDIA_CATEGORIES.includes(input.category) ||
    !/^[a-z0-9-]+\/[0-9a-f-]+\.(jpg|png|webp)$/.test(input.path)
  )
    return { ok: false, message: "ข้อมูลไฟล์ไม่ถูกต้อง" };

  const supabase = await createClient();
  const publicUrl = supabase.storage.from(input.bucket).getPublicUrl(input.path).data.publicUrl;
  const { data, error } = await supabase
    .from("media_files")
    .insert({
      bucket: input.bucket,
      storage_path: input.path,
      public_url: publicUrl,
      file_name: input.fileName.slice(0, 200),
      mime_type: input.mime,
      size_bytes: input.size,
      width: input.width,
      height: input.height,
      category: input.category,
      alt_text: input.alt.trim().slice(0, 200) || null,
    })
    .select("id, public_url, file_name, category, alt_text, width, height, size_bytes, created_at")
    .single();
  if (error || !data) return { ok: false, message: error ? adminError(error) : "บันทึกไม่สำเร็จ" };
  return { ok: true, item: toItem(data) };
}

function toItem(m: {
  id: string;
  public_url: string;
  file_name: string;
  category: MediaCategory;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number;
  created_at: string;
}): MediaItem {
  return {
    id: m.id,
    url: m.public_url,
    fileName: m.file_name,
    category: m.category,
    alt: m.alt_text,
    width: m.width,
    height: m.height,
    sizeBytes: m.size_bytes,
    createdAt: m.created_at,
  };
}

export async function listMediaAction(category: MediaCategory | null): Promise<MediaItem[]> {
  const { denied } = await adminOrDenied();
  if (denied) return [];
  const supabase = await createClient();
  let q = supabase
    .from("media_files")
    .select("id, public_url, file_name, category, alt_text, width, height, size_bytes, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (category) q = q.eq("category", category);
  const { data } = await q;
  return (data ?? []).map(toItem);
}

/** S16-F05 — edit alt text / category. */
export async function updateMediaAction(
  id: string,
  alt: string,
  category: MediaCategory,
): Promise<AdminResult> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id) || !MEDIA_CATEGORIES.includes(category)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("media_files")
    .update({ alt_text: alt.trim().slice(0, 200) || null, category })
    .eq("id", id);
  if (error) return { ok: false, message: adminError(error) };
  revalidateStorefront("/about");
  return { ok: true, message: "บันทึกข้อมูลภาพแล้ว" };
}

/** S16-F06 / R-28 — refuse to delete an image that is still used anywhere. */
export async function deleteMediaAction(id: string): Promise<AdminResult & { usage?: string[] }> {
  const { denied } = await adminOrDenied();
  if (denied) return denied;
  if (!UUID_RE.test(id)) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { data: usage, error: uErr } = await supabase.rpc("media_usage", { p_media_id: id });
  if (uErr) return { ok: false, message: adminError(uErr) };
  if (usage && usage.length) {
    const where = usage.map((u) => `${u.source}: ${u.ref}`);
    return { ok: false, message: `ลบไม่ได้ — ภาพนี้ยังถูกใช้อยู่ที่ ${where.join(", ")}`, usage: where };
  }
  const { data: m } = await supabase.from("media_files").select("bucket, storage_path").eq("id", id).single();
  if (!m) return { ok: false, message: "ไม่พบภาพ" };
  const { error: sErr } = await supabase.storage.from(m.bucket).remove([m.storage_path]);
  if (sErr) return { ok: false, message: "ลบไฟล์ใน Storage ไม่สำเร็จ" };
  const { error } = await supabase.from("media_files").delete().eq("id", id);
  if (error) return { ok: false, message: adminError(error) };
  revalidateStorefront("/about");
  return { ok: true, message: "ลบภาพแล้ว" };
}
