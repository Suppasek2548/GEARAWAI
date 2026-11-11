"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";
import type { WishlistLine } from "@/lib/data/member";
import { moveWishlistToCartAction, removeWishlistItemAction, toggleWishlistAction } from "@/lib/actions/cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { ProductImage } from "@/components/products/product-image";
import { Price, StockStatus } from "@/components/products/price";
import { useWishlist } from "@/components/products/wishlist-context";

/** Wishlist card ~240×320 (UI §9): × removes with an Undo toast, Move to Cart = add 1 + remove (S06-F05). */
export function WishlistCard({ line }: { line: WishlistLine }) {
  const [pending, start] = useTransition();
  const { setInWishlist } = useWishlist();
  const unavailable = line.productStatus !== "active";

  const remove = () =>
    start(async () => {
      const res = await removeWishlistItemAction(line.wishlistItemId);
      if (!res.ok) {
        if (res.reason === "ERROR") toast.error(res.message);
        return;
      }
      setInWishlist(line.productId, false);
      toast.success("ลบออกจากรายการโปรดแล้ว", {
        action: {
          label: "เลิกทำ",
          onClick: async () => {
            const undo = await toggleWishlistAction(line.productId);
            if (undo.ok) setInWishlist(line.productId, true);
            else if (undo.reason === "ERROR") toast.error(undo.message);
          },
        },
      });
    });

  const move = () =>
    start(async () => {
      const res = await moveWishlistToCartAction(line.wishlistItemId, line.productId);
      if (res.ok) {
        setInWishlist(line.productId, false);
        toast.success(res.message);
      } else if (res.reason === "ERROR") toast.error(res.message);
    });

  return (
    <article className="relative flex min-w-0 flex-col rounded-card border border-brand-secondary/50 bg-surface p-4">
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label={`ลบ ${line.name} ออกจากรายการโปรด`}
        className="absolute top-2 right-2 z-10 inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-elevated hover:text-danger"
      >
        <X className="size-5" aria-hidden />
      </button>
      <Link href={`/shop/${line.slug}`} tabIndex={-1} aria-hidden>
        <ProductImage
          src={line.imageUrl}
          alt={line.name}
          sizes="160px"
          className="mx-auto mt-4 aspect-square w-full max-w-40"
        />
      </Link>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        <Link
          href={`/shop/${line.slug}`}
          className="line-clamp-2 min-h-[2.75rem] font-semibold hover:text-brand-accent"
        >
          {line.name}
        </Link>
        <Price price={line.price} effectivePrice={line.effectivePrice} />
        {unavailable ? (
          <Badge tone="warning" className="self-start">
            ไม่พร้อมจำหน่าย
          </Badge>
        ) : (
          <StockStatus inStock={line.stock > 0} isLowStock={line.stock > 0 && line.stock <= 5} />
        )}
      </div>
      <Button className="mt-3 w-full" loading={pending} disabled={!line.isPurchasable} onClick={move}>
        {!pending && <ShoppingCart className="size-4" aria-hidden />}
        {line.isPurchasable ? "Move to Cart" : unavailable ? "ไม่พร้อมจำหน่าย" : "สินค้าหมด"}
      </Button>
    </article>
  );
}

/** Optional "Move all to Cart" (UI §9.1 note) — adds each purchasable item, keeps the rest. */
export function MoveAllButton({ lines }: { lines: WishlistLine[] }) {
  const [pending, start] = useTransition();
  const { setInWishlist } = useWishlist();
  const movable = lines.filter((l) => l.isPurchasable);
  if (movable.length < 2) return null;
  return (
    <Button
      variant="outline"
      loading={pending}
      onClick={() =>
        start(async () => {
          let moved = 0;
          for (const l of movable) {
            const res = await moveWishlistToCartAction(l.wishlistItemId, l.productId);
            if (res.ok) {
              moved++;
              setInWishlist(l.productId, false);
            }
          }
          if (moved === movable.length) toast.success(`ย้าย ${moved} รายการไปตะกร้าแล้ว`);
          else toast.warning(`ย้ายได้ ${moved} จาก ${movable.length} รายการ (บางรายการสต็อกไม่พอ)`);
        })
      }
    >
      Move all to Cart
    </Button>
  );
}
