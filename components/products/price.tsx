import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/misc";

/** Shows effective_price from the DB (R-12) and the normal price struck through when discounted. */
export function Price({
  price,
  effectivePrice,
  size = "md",
  className,
}: {
  price: number;
  effectivePrice: number;
  size?: "md" | "lg";
  className?: string;
}) {
  const discounted = effectivePrice < price;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span
        className={cn(
          "font-display font-bold text-brand-lime",
          size === "lg" ? "text-3xl" : "text-lg md:text-xl",
        )}
      >
        {formatTHB(effectivePrice)}
      </span>
      {discounted && (
        <span className={cn("text-ink-muted line-through", size === "lg" ? "text-lg" : "text-sm")}>
          <span className="sr-only">ราคาปกติ </span>
          {formatTHB(price)}
        </span>
      )}
    </div>
  );
}

export function discountPercent(price: number, effectivePrice: number) {
  if (effectivePrice >= price || price <= 0) return 0;
  return Math.round(((price - effectivePrice) / price) * 100);
}

export function SaleBadge({ price, effectivePrice }: { price: number; effectivePrice: number }) {
  const pct = discountPercent(price, effectivePrice);
  if (!pct) return null;
  return <Badge tone="sale">SALE -{pct}%</Badge>;
}

/** Stock status — always text + color (UI §16.5). */
export function StockStatus({
  inStock,
  isLowStock,
  quantity,
  showQuantity = false,
}: {
  inStock: boolean;
  isLowStock: boolean;
  quantity?: number;
  showQuantity?: boolean;
}) {
  if (!inStock)
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-danger">
        <span className="size-2 rounded-full bg-danger" aria-hidden />
        สินค้าหมด
      </span>
    );
  if (isLowStock)
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-warning">
        <span className="size-2 rounded-full bg-warning" aria-hidden />
        เหลือน้อย{showQuantity && quantity !== undefined ? ` (เหลือ ${quantity} ชิ้น)` : ""}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-success">
      <span className="size-2 rounded-full bg-success" aria-hidden />
      มีสินค้า{showQuantity && quantity !== undefined ? ` (เหลือ ${quantity} ชิ้น)` : ""}
    </span>
  );
}
