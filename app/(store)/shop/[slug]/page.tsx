import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Gift } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/catalog";
import { getPublicSettings } from "@/lib/data/site";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ProductGallery } from "@/components/products/product-gallery";
import { Price, SaleBadge, StockStatus } from "@/components/products/price";
import { ProductPurchase } from "@/components/products/product-purchase";
import { ProductTabs } from "@/components/products/product-tabs";
import { ProductCard, ProductGrid } from "@/components/products/product-card";
import { Skeleton } from "@/components/ui/misc";

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "ไม่พบสินค้า" };
  return { title: product.name, description: product.shortDescription ?? undefined };
}

/** S03-F05 Product Detail + S03-F06 Related Products. Inactive or unknown slug → 404. */
export default function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  return (
    <div className="container-page flex flex-col gap-10 py-8 pb-28 md:py-10 md:pb-10">
      <Suspense fallback={<DetailSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}

async function ProductDetail({ params }: { params: PageProps<"/shop/[slug]">["params"] }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, settings] = await Promise.all([getRelatedProducts(product), getPublicSettings()]);
  const rate = Number(settings.points_rule.baht_per_point) || 100;
  // Indicative only — real points come from the whole order once it is completed (S10, D-04)
  const approxPoints = Math.floor(product.effectivePrice / rate);

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.categoryName, href: `/shop?category=${product.categorySlug}` },
          { label: product.name },
        ]}
      />

      <div className="grid gap-8 md:grid-cols-[5fr_7fr] lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold tracking-wider text-ink-muted uppercase">
            <Link href={`/shop?brand=${product.brandSlug}`} className="hover:text-ink">
              {product.brandName}
            </Link>
            {" · "}
            <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-ink">
              {product.categoryName}
            </Link>
          </p>
          <h1 className="font-display text-3xl leading-tight font-bold md:text-4xl">{product.name}</h1>
          <p className="text-sm text-ink-muted">SKU: {product.sku}</p>

          <div className="flex flex-wrap items-center gap-3">
            <Price price={product.price} effectivePrice={product.effectivePrice} size="lg" />
            <SaleBadge price={product.price} effectivePrice={product.effectivePrice} />
          </div>

          <StockStatus
            inStock={product.inStock}
            isLowStock={product.isLowStock}
            quantity={product.stockQuantity}
            showQuantity
          />

          {product.shortDescription && <p className="text-ink-soft">{product.shortDescription}</p>}

          <ProductPurchase
            productId={product.id}
            stock={product.stockQuantity}
            effectivePrice={product.effectivePrice}
          />

          {approxPoints > 0 && (
            <p className="flex items-center gap-2 rounded-btn border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
              <Gift className="size-5 shrink-0 text-brand-lime" aria-hidden />
              ได้ประมาณ ~{approxPoints.toLocaleString("th-TH")} คะแนน เมื่อคำสั่งซื้อสำเร็จ
            </p>
          )}
        </div>
      </div>

      <ProductTabs description={product.description} specifications={product.specifications} />

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="flex flex-col gap-4">
          <h2 id="related-heading" className="font-display text-2xl font-bold">
            Related Products
          </h2>
          <ProductGrid>
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        </section>
      )}
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <Skeleton className="h-5 w-72" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
