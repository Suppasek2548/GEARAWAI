"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { addToCartAction, toggleWishlistAction, type ShopActionResult } from "@/lib/actions/cart";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { useWishlist } from "./wishlist-context";

function useShopAction() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();

  const run = (
    fn: () => Promise<ShopActionResult>,
    onOk?: (res: Extract<ShopActionResult, { ok: true }>) => void,
  ) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message);
        onOk?.(res);
      } else if (res.reason === "NEED_LOGIN") {
        // Guest → login, then come back here (UI §15 Redirect after Login)
        const back = `${pathname}${window.location.search}`;
        router.push(`/login?redirect=${encodeURIComponent(back)}`);
      } else toast.error(res.message);
    });

  return { pending, run, router };
}

export function AddToCartButton({
  productId,
  inStock,
  quantity = 1,
  compact = false,
  size = "md",
  className,
}: {
  productId: string;
  inStock: boolean;
  quantity?: number;
  compact?: boolean;
  size?: "md" | "lg";
  className?: string;
}) {
  const { pending, run } = useShopAction();
  if (!inStock) {
    return (
      <Button size={size} disabled className={className} aria-label="สินค้าหมด">
        {compact ? <ShoppingCart className="size-4" aria-hidden /> : "สินค้าหมด"}
      </Button>
    );
  }
  return (
    <Button
      size={size}
      loading={pending}
      className={className}
      aria-label="เพิ่มลงตะกร้า"
      onClick={() => run(() => addToCartAction(productId, quantity))}
    >
      {!pending && <ShoppingCart className="size-4" aria-hidden />}
      {!compact && "Add to Cart"}
    </Button>
  );
}

/** BUY NOW: add the selected quantity, then go straight to the cart (UI §7.2). */
export function BuyNowButton({
  productId,
  inStock,
  quantity = 1,
  className,
}: {
  productId: string;
  inStock: boolean;
  quantity?: number;
  className?: string;
}) {
  const { pending, run, router } = useShopAction();
  return (
    <Button
      size="lg"
      variant="outline"
      disabled={!inStock}
      loading={pending}
      className={className}
      onClick={() =>
        run(
          () => addToCartAction(productId, quantity),
          () => router.push("/cart"),
        )
      }
    >
      {!pending && <Zap className="size-4" aria-hidden />}
      BUY NOW
    </Button>
  );
}

export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const { pending, run } = useShopAction();
  const { ids, setInWishlist } = useWishlist();
  const saved = ids?.has(productId) ?? false;
  return (
    <button
      type="button"
      aria-label={saved ? "ลบออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
      aria-pressed={saved}
      disabled={pending}
      onClick={() =>
        run(
          () => toggleWishlistAction(productId),
          (res) => setInWishlist(productId, Boolean(res.inWishlist)),
        )
      }
      className={cn(
        "inline-flex size-10 cursor-pointer items-center justify-center rounded-full border bg-canvas/80 backdrop-blur transition-colors disabled:opacity-50",
        saved
          ? "border-danger/60 text-danger"
          : "border-line text-ink-soft hover:border-brand-accent hover:text-danger",
        className,
      )}
    >
      <Heart className={cn("size-5", saved && "fill-current")} aria-hidden />
    </button>
  );
}
