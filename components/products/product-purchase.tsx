"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { AddToCartButton, BuyNowButton, WishlistButton } from "./product-actions";
import { formatTHB } from "@/lib/utils/format";

/**
 * Quantity selector (32×32 buttons, 1…stock) + Add to Cart + Wishlist (UI §7.2).
 * Also renders the mobile sticky bottom bar (UI §7.3).
 */
export function ProductPurchase({
  productId,
  stock,
  effectivePrice,
}: {
  productId: string;
  stock: number;
  effectivePrice: number;
}) {
  const [qty, setQty] = useState(1);
  const inStock = stock > 0;
  const max = Math.min(stock, 99);

  return (
    <>
      {inStock ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-soft">จำนวน</span>
          <div className="inline-flex items-center rounded-btn border border-line">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="ลดจำนวน"
              className="inline-flex size-11 cursor-pointer items-center justify-center text-ink disabled:cursor-not-allowed disabled:opacity-40 md:size-8"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <output aria-live="polite" className="w-10 text-center font-semibold">
              {qty}
            </output>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(max, q + 1))}
              disabled={qty >= max}
              aria-label="เพิ่มจำนวน"
              className="inline-flex size-11 cursor-pointer items-center justify-center text-ink disabled:cursor-not-allowed disabled:opacity-40 md:size-8"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        <p className="font-semibold text-danger">สินค้าหมดชั่วคราว</p>
      )}

      <div className="hidden items-center gap-3 md:flex">
        <AddToCartButton
          productId={productId}
          inStock={inStock}
          quantity={qty}
          size="lg"
          className="flex-1"
        />
        <WishlistButton productId={productId} className="size-12" />
      </div>
      <BuyNowButton
        productId={productId}
        inStock={inStock}
        quantity={qty}
        className="hidden w-full md:inline-flex"
      />

      {/* Mobile sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
        <span className="font-display text-lg font-bold text-brand-lime">{formatTHB(effectivePrice)}</span>
        <AddToCartButton productId={productId} inStock={inStock} quantity={qty} className="flex-1" />
        <WishlistButton productId={productId} className="size-11" />
      </div>
    </>
  );
}
