"use server";

import { getCurrentUser } from "@/lib/auth/dal";

export type ShopActionResult =
  | { ok: true; message: string }
  | { ok: false; reason: "NEED_LOGIN" }
  | { ok: false; reason: "NOT_READY"; message: string }
  | { ok: false; reason: "ERROR"; message: string };

const PHASE3 = "ระบบตะกร้าสินค้าและรายการโปรดจะเปิดใช้งานใน Phase 3 (Shopping System)";

/**
 * S07-F01 Add to Cart — entry point used by every product card / detail page.
 * Phase 2: guests are sent to /login (UI §6.4); signed-in members get a notice until Phase 3 implements the
 * insert into cart_items (RLS: own cart + active product) with stock checks.
 */
export async function addToCartAction(productId: string, quantity = 1): Promise<ShopActionResult> {
  void productId;
  void quantity;
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "NEED_LOGIN" };
  return { ok: false, reason: "NOT_READY", message: PHASE3 };
}

/** S06-F01 Wishlist toggle — same Phase 2 behaviour as addToCartAction. */
export async function toggleWishlistAction(productId: string): Promise<ShopActionResult> {
  void productId;
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "NEED_LOGIN" };
  return { ok: false, reason: "NOT_READY", message: PHASE3 };
}
