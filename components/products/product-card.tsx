import Link from "next/link";
import type { CatalogProduct } from "@/lib/data/catalog";
import { Badge } from "@/components/ui/misc";
import { buttonClasses } from "@/components/ui/button";
import { ProductImage } from "./product-image";
import { Price, SaleBadge, StockStatus } from "./price";
import { AddToCartButton, WishlistButton } from "./product-actions";

/**
 * Product Card (UI §6.2): image 160×160 contain, brand, name (2 lines), effective price, stock,
 * Add to Cart / Wishlist / View Details (SPEC system 3).
 */
export function ProductCard({ product, priority = false }: { product: CatalogProduct; priority?: boolean }) {
  const href = `/shop/${product.slug}`;
  return (
    <article className="group relative flex min-w-0 flex-col rounded-card border border-brand-secondary/50 bg-surface p-3 transition-all duration-200 hover:-translate-y-1 hover:border-brand-accent hover:shadow-glow sm:p-4">
      <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1">
        <SaleBadge price={product.price} effectivePrice={product.effectivePrice} />
        {!product.inStock && <Badge tone="danger">Out of Stock</Badge>}
        {product.inStock && product.isLowStock && <Badge tone="warning">Low Stock</Badge>}
      </div>
      <WishlistButton productId={product.id} className="absolute top-2 right-2 z-10" />

      <Link href={href} className="flex flex-col gap-2" tabIndex={-1} aria-hidden>
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          sizes="160px"
          priority={priority}
          className="mx-auto mt-6 aspect-square w-full max-w-40 overflow-hidden rounded-btn"
        />
      </Link>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        <p className="text-xs font-semibold tracking-wider text-ink-muted uppercase">{product.brandName}</p>
        <h3 className="line-clamp-2 min-h-[2.75rem] leading-snug font-semibold">
          <Link href={href} className="after:absolute after:inset-0 hover:text-brand-accent">
            {product.name}
          </Link>
        </h3>
        <Price price={product.price} effectivePrice={product.effectivePrice} />
        <StockStatus inStock={product.inStock} isLowStock={product.isLowStock} />
      </div>

      {/* relative z-10 keeps buttons clickable above the stretched title link */}
      <div className="relative z-10 mt-3 grid grid-cols-[1fr_auto] gap-2">
        <AddToCartButton productId={product.id} inStock={product.inStock} className="w-full px-2" />
        <Link
          href={href}
          className={buttonClasses({ variant: "outline", size: "md", className: "px-3" })}
          aria-label={`ดูรายละเอียด ${product.name}`}
        >
          View
        </Link>
      </div>
    </article>
  );
}

/** Responsive grid — Desktop 5 / Laptop 4 / Tablet 3 / Mobile 2 (≥375px) columns (SPEC system 3, UI §6.6). */
export function ProductGrid({
  children,
  withSidebar = false,
}: {
  children: React.ReactNode;
  withSidebar?: boolean;
}) {
  return (
    <div
      className={
        withSidebar
          ? "grid grid-cols-1 gap-3 min-[375px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 desk:grid-cols-5"
          : "grid grid-cols-1 gap-3 min-[375px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 desk:grid-cols-5"
      }
    >
      {children}
    </div>
  );
}
