import type { Metadata } from "next";
import { Suspense } from "react";
import { Tag } from "lucide-react";
import { getActivePromotions, getDiscountedProducts } from "@/lib/data/catalog";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ProductCard, ProductGrid } from "@/components/products/product-card";
import { PromotionCard } from "@/components/promotions/promotion-card";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Deals" };

/**
 * /deals (UI §14.5, R-27): ① active promotions (in date range + enabled) with their products
 * ② every discounted product (sale_price or promotion — effective_price < price).
 */
export default function DealsPage() {
  return (
    <>
      <PageHeader title="Deals">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Deals" }]} />
      </PageHeader>
      <div className="container-page flex flex-col gap-12 py-10">
        <Suspense fallback={<Skeleton className="h-64" />}>
          <DealsContent />
        </Suspense>
      </div>
    </>
  );
}

async function DealsContent() {
  const [promotions, discounted] = await Promise.all([getActivePromotions(), getDiscountedProducts()]);

  if (!promotions.length && !discounted.length) {
    return (
      <EmptyState
        icon={Tag}
        title="ยังไม่มีโปรโมชั่นในขณะนี้"
        description="ติดตามดีลใหม่ ๆ ได้เร็ว ๆ นี้"
        action={<ButtonLink href="/shop">เลือกซื้อสินค้า</ButtonLink>}
      />
    );
  }

  return (
    <>
      {promotions.length > 0 && (
        <section aria-labelledby="promo-heading" className="flex flex-col gap-8">
          <h2 id="promo-heading" className="font-display text-2xl font-bold md:text-3xl">
            โปรโมชั่น
          </h2>
          {promotions.map((p) => (
            <article key={p.id} id={p.slug} className="flex scroll-mt-28 flex-col gap-4">
              <div className="max-w-xl">
                <PromotionCard promotion={p} showCountdown />
              </div>
              {p.products.length > 0 ? (
                <ProductGrid>
                  {p.products.map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </ProductGrid>
              ) : (
                <p className="text-sm text-ink-soft">ยังไม่มีสินค้าที่ร่วมรายการ</p>
              )}
            </article>
          ))}
        </section>
      )}

      {discounted.length > 0 && (
        <section aria-labelledby="sale-heading" className="flex flex-col gap-4">
          <h2 id="sale-heading" className="font-display text-2xl font-bold md:text-3xl">
            สินค้าลดราคา
          </h2>
          <ProductGrid>
            {discounted.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        </section>
      )}
    </>
  );
}
