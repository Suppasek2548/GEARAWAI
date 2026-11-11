import "server-only";
import { createClient } from "@/lib/supabase/server";

/* Member-scoped reads — every query runs as the signed-in user, so RLS / RPC limit rows to their own (S14). */

export type CartLine = {
  cartItemId: string;
  productId: string;
  sku: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  price: number;
  effectivePrice: number;
  stock: number;
  productStatus: "active" | "inactive";
  quantity: number;
  lineTotal: number;
  isPurchasable: boolean;
};

/** S07 — get_my_cart() also returns products that were switched off, flagged not purchasable (R-04). */
export async function getMyCart(): Promise<CartLine[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_cart");
  if (error) throw new Error("CART_LOAD_FAILED");
  return (data ?? []).map((r) => ({
    cartItemId: r.cart_item_id,
    productId: r.product_id,
    sku: r.sku,
    name: r.name,
    slug: r.slug,
    imageUrl: r.image_url,
    price: Number(r.price),
    effectivePrice: Number(r.effective_price),
    stock: r.stock_quantity,
    productStatus: r.product_status,
    quantity: r.quantity,
    lineTotal: Number(r.line_total),
    isPurchasable: r.is_purchasable,
  }));
}

export type WishlistLine = Omit<CartLine, "cartItemId" | "quantity" | "lineTotal"> & {
  wishlistItemId: string;
};

/** S06-F03 — via get_my_wishlist() (R-04). */
export async function getMyWishlist(): Promise<WishlistLine[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_wishlist");
  if (error) throw new Error("WISHLIST_LOAD_FAILED");
  return (data ?? []).map((r) => ({
    wishlistItemId: r.wishlist_item_id,
    productId: r.product_id,
    sku: r.sku,
    name: r.name,
    slug: r.slug,
    imageUrl: r.image_url,
    price: Number(r.price),
    effectivePrice: Number(r.effective_price),
    stock: r.stock_quantity,
    productStatus: r.product_status,
    isPurchasable: r.is_purchasable,
  }));
}

export async function getMyProfileForForms() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email, phone, address")
    .eq("id", user.id)
    .maybeSingle();
  return data;
}

/* ------------------------------------------------------------------ */
/* Orders (S09 / S14-F03, F04)                                          */
/* ------------------------------------------------------------------ */

export type OrderStatus =
  "pending_payment" | "payment_submitted" | "paid" | "shipped" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "submitted" | "verified" | "rejected" | "voided";

export async function getMyOrders() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, total_amount, created_at, order_items(product_name, product_image_url, quantity), payments(status, created_at)",
    )
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMyOrderByNumber(orderNumber: string) {
  if (!/^GA-\d{8}-\d{4,}$/.test(orderNumber)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "*, order_items(id, product_id, product_sku, product_name, product_image_url, unit_price, quantity, line_total), payments(id, method, amount, status, slip_path, payer_note, reject_reason, submitted_at, verified_at, created_at)",
    )
    .eq("order_number", orderNumber)
    .maybeSingle(); // RLS: owner (or admin)
  return data;
}

/* ------------------------------------------------------------------ */
/* Bookings (S08-F07)                                                   */
/* ------------------------------------------------------------------ */

export async function getMyBookings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, booking_number, booking_date, time_slot, status, price_snapshot, note, admin_note, created_at, services(name)",
    )
    .order("booking_date", { ascending: false })
    .order("time_slot", { ascending: false });
  return data ?? [];
}
