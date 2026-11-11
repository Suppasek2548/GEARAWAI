"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { GENERIC_ERROR, toThaiError } from "@/lib/errors";

export type ShopActionResult =
  | { ok: true; message: string; inWishlist?: boolean }
  | { ok: false; reason: "NEED_LOGIN" }
  | { ok: false; reason: "ERROR"; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_QTY = 99; // cart_items.quantity CHECK 1–99

/** Product state as the public sees it (active only) — used to validate stock before writing. */
async function getSellableProduct(supabase: Awaited<ReturnType<typeof createClient>>, productId: string) {
  const { data } = await supabase
    .from("v_product_catalog")
    .select("id, name, stock_quantity, status")
    .eq("id", productId)
    .maybeSingle();
  if (!data || data.status !== "active") return null;
  return { id: data.id!, name: data.name!, stock: data.stock_quantity ?? 0 };
}

/**
 * S07-F01 Add to Cart (adds to the existing quantity) + S07-F05 stock check.
 * Writes cart_items directly — RLS only allows the member's own cart and active products.
 */
export async function addToCartAction(productId: string, quantity = 1): Promise<ShopActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "NEED_LOGIN" };
  if (!UUID_RE.test(productId)) return { ok: false, reason: "ERROR", message: GENERIC_ERROR };
  const qty = Math.floor(quantity);
  if (!Number.isFinite(qty) || qty < 1) return { ok: false, reason: "ERROR", message: GENERIC_ERROR };

  const supabase = await createClient();
  const product = await getSellableProduct(supabase, productId);
  if (!product) return { ok: false, reason: "ERROR", message: "สินค้านี้ไม่พร้อมจำหน่าย" };

  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).maybeSingle();
  if (!cart) return { ok: false, reason: "ERROR", message: GENERIC_ERROR };

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
    .maybeSingle();

  const next = (existing?.quantity ?? 0) + qty;
  if (next > product.stock || next > MAX_QTY) {
    const left = Math.min(product.stock, MAX_QTY) - (existing?.quantity ?? 0);
    return {
      ok: false,
      reason: "ERROR",
      message:
        left > 0
          ? `สต็อกไม่พอ — เพิ่มได้อีกไม่เกิน ${left} ชิ้น`
          : product.stock === 0
            ? "สินค้าหมด"
            : "สต็อกไม่พอ — สินค้านี้อยู่ในตะกร้าครบจำนวนที่มีแล้ว",
    };
  }

  const { error } = existing
    ? await supabase.from("cart_items").update({ quantity: next }).eq("id", existing.id)
    : await supabase.from("cart_items").insert({ cart_id: cart.id, product_id: productId, quantity: qty });
  if (error) return { ok: false, reason: "ERROR", message: toThaiError(error) };

  refresh(); // header cart badge (S07-F06)
  return { ok: true, message: `เพิ่ม ${product.name} ลงตะกร้าแล้ว` };
}

/** S07-F02 change quantity (1 … stock, max 99). */
export async function updateCartQuantityAction(
  cartItemId: string,
  quantity: number,
): Promise<ShopActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "NEED_LOGIN" };
  if (!UUID_RE.test(cartItemId)) return { ok: false, reason: "ERROR", message: GENERIC_ERROR };
  const qty = Math.floor(quantity);
  if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY)
    return { ok: false, reason: "ERROR", message: "จำนวนไม่ถูกต้อง" };

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("cart_items")
    .select("id, product_id")
    .eq("id", cartItemId)
    .maybeSingle(); // RLS: own items only
  if (!item) return { ok: false, reason: "ERROR", message: GENERIC_ERROR };

  const product = await getSellableProduct(supabase, item.product_id);
  if (!product) return { ok: false, reason: "ERROR", message: "สินค้านี้ไม่พร้อมจำหน่าย กรุณาลบออกจากตะกร้า" };
  if (qty > product.stock)
    return { ok: false, reason: "ERROR", message: `สต็อกไม่พอ — มีสินค้า ${product.stock} ชิ้น` };

  const { error } = await supabase.from("cart_items").update({ quantity: qty }).eq("id", cartItemId);
  if (error) return { ok: false, reason: "ERROR", message: toThaiError(error) };
  refresh();
  return { ok: true, message: "อัปเดตจำนวนแล้ว" };
}

/** S07-F03 remove from cart. */
export async function removeCartItemAction(cartItemId: string): Promise<ShopActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "NEED_LOGIN" };
  if (!UUID_RE.test(cartItemId)) return { ok: false, reason: "ERROR", message: GENERIC_ERROR };
  const supabase = await createClient();
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
  if (error) return { ok: false, reason: "ERROR", message: toThaiError(error) };
  refresh();
  return { ok: true, message: "ลบสินค้าออกจากตะกร้าแล้ว" };
}

/* ------------------------------------------------------------------ */
/* Wishlist (S06)                                                      */
/* ------------------------------------------------------------------ */

async function getWishlistId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("wishlists").select("id").eq("user_id", userId).maybeSingle();
  return data?.id ?? null;
}

/** Product ids in the member's wishlist — lets heart icons show the filled state. */
export async function getMyWishlistIdsAction(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("wishlist_items").select("product_id");
  return (data ?? []).map((r) => r.product_id);
}

/** S06-F01 toggle: add if missing, remove if present (unique wishlist_id + product_id, S06-F06). */
export async function toggleWishlistAction(productId: string): Promise<ShopActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "NEED_LOGIN" };
  if (!UUID_RE.test(productId)) return { ok: false, reason: "ERROR", message: GENERIC_ERROR };

  const supabase = await createClient();
  const wishlistId = await getWishlistId(supabase, user.id);
  if (!wishlistId) return { ok: false, reason: "ERROR", message: GENERIC_ERROR };

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("wishlist_id", wishlistId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("wishlist_items").delete().eq("id", existing.id);
    if (error) return { ok: false, reason: "ERROR", message: toThaiError(error) };
    refresh();
    return { ok: true, message: "ลบออกจากรายการโปรดแล้ว", inWishlist: false };
  }

  const { error } = await supabase
    .from("wishlist_items")
    .insert({ wishlist_id: wishlistId, product_id: productId });
  if (error) {
    // RLS rejects inactive products
    return {
      ok: false,
      reason: "ERROR",
      message: error.code === "42501" ? "สินค้านี้ไม่พร้อมจำหน่าย" : toThaiError(error),
    };
  }
  refresh();
  return { ok: true, message: "เพิ่มในรายการโปรดแล้ว", inWishlist: true };
}

/** S06-F02 remove a wishlist row (from the Wishlist page). */
export async function removeWishlistItemAction(wishlistItemId: string): Promise<ShopActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "NEED_LOGIN" };
  if (!UUID_RE.test(wishlistItemId)) return { ok: false, reason: "ERROR", message: GENERIC_ERROR };
  const supabase = await createClient();
  const { error } = await supabase.from("wishlist_items").delete().eq("id", wishlistItemId);
  if (error) return { ok: false, reason: "ERROR", message: toThaiError(error) };
  refresh();
  return { ok: true, message: "ลบออกจากรายการโปรดแล้ว", inWishlist: false };
}

/** S06-F05 Move to Cart: add 1 to cart, then remove from wishlist (only if the cart add succeeded). */
export async function moveWishlistToCartAction(
  wishlistItemId: string,
  productId: string,
): Promise<ShopActionResult> {
  const added = await addToCartAction(productId, 1);
  if (!added.ok) return added;
  const removed = await removeWishlistItemAction(wishlistItemId);
  if (!removed.ok) return removed;
  return { ok: true, message: "ย้ายไปตะกร้าแล้ว", inWishlist: false };
}
