"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { addToCartAction, toggleWishlistAction, type ShopActionResult } from "@/lib/actions/cart";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

function useShopAction() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<ShopActionResult>) =>
    start(async () => {
      const res = await fn();
      if (res.ok) toast.success(res.message);
      else if (res.reason === "NEED_LOGIN") {
        // Guest → login, then come back here (UI §15 Redirect after Login)
        const back = `${pathname}${window.location.search}`;
        router.push(`/login?redirect=${encodeURIComponent(back)}`);
      } else toast.info(res.message);
    });

  return { pending, run };
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

export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const { pending, run } = useShopAction();
  return (
    <button
      type="button"
      aria-label="เพิ่มในรายการโปรด"
      disabled={pending}
      onClick={() => run(() => toggleWishlistAction(productId))}
      className={cn(
        "inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-line bg-canvas/80 text-ink-soft backdrop-blur transition-colors hover:border-brand-accent hover:text-danger disabled:opacity-50",
        className,
      )}
    >
      <Heart className="size-5" aria-hidden />
    </button>
  );
}
