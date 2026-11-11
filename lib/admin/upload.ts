"use client";

import { createClient } from "@/lib/supabase/client";
import { registerMediaAction } from "@/lib/actions/admin-media";
import type { MediaCategory, MediaItem } from "@/lib/admin/media-types";

export const UPLOAD_MIME = ["image/jpeg", "image/png", "image/webp"];
export const UPLOAD_MAX = 2 * 1024 * 1024;

// Recommended sizes per image category (SPEC system 16, ADMIN §4.6)
export const RECOMMENDED: Record<MediaCategory, [number, number] | null> = {
  product: [800, 800],
  banner: [1920, 700],
  promotion: [1200, 600],
  category: [600, 600],
  gallery: [1200, 800],
  team: [600, 600],
  service: [600, 400],
  reward: [600, 600],
  other: null,
};

async function readSize(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const bmp = await createImageBitmap(file);
    const out = { width: bmp.width, height: bmp.height };
    bmp.close();
    return out;
  } catch {
    return null;
  }
}

/**
 * Validate (type, ≤ 2 MB), upload to Storage as admin, then register in media_files.
 * Returns a warning (not an error) when the aspect ratio differs from the recommended size (ADMIN §4.6).
 */
export async function uploadImage(
  file: File,
  category: MediaCategory,
  alt = "",
): Promise<{ ok: true; item: MediaItem; warning: string | null } | { ok: false; message: string }> {
  if (!UPLOAD_MIME.includes(file.type)) return { ok: false, message: "รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP" };
  if (file.size > UPLOAD_MAX) return { ok: false, message: "ไฟล์ต้องมีขนาดไม่เกิน 2 MB" };

  const size = await readSize(file);
  const rec = RECOMMENDED[category];
  let warning: string | null = null;
  if (size && rec && Math.abs(size.width / size.height - rec[0] / rec[1]) > 0.05) {
    warning = `สัดส่วนภาพ ${size.width}×${size.height} ต่างจากขนาดแนะนำ ${rec[0]}×${rec[1]}`;
  }

  const bucket = category === "product" ? "product-images" : "site-media";
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const folder = category === "product" ? "products" : category;
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
  if (error) return { ok: false, message: "อัปโหลดไม่สำเร็จ กรุณาลองใหม่" };

  const res = await registerMediaAction({
    bucket,
    path,
    fileName: file.name,
    mime: file.type,
    size: file.size,
    width: size?.width ?? null,
    height: size?.height ?? null,
    category,
    alt,
  });
  if (!res.ok) {
    await supabase.storage.from(bucket).remove([path]); // keep Storage and DB in sync
    return res;
  }
  return { ok: true, item: res.item, warning };
}
