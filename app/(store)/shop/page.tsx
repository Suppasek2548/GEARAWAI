import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX, X } from "lucide-react";
import { getBrandsWithCounts, getCategoriesWithCounts, getShopProducts } from "@/lib/data/catalog";
import {
  hasActiveFilters,
  PAGE_SIZE,
  parseShopFilters,
  shopHref,
  type ShopFilters,
} from "@/lib/shop/filters";
import { formatTHB } from "@/lib/utils/format";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ProductCard, ProductGrid } from "@/components/products/product-card";
import { ShopToolbar } from "@/components/shop/shop-toolbar";
import { FilterSidebar } from "@/components/shop/filter-panel";
import { Pagination } from "@/components/shop/pagination";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Shop",
  description: "เลือกซื้อ Gaming Gear และอุปกรณ์ IT — ค้นหา กรองตามหมวดหมู่ แบรนด์ ราคา และสถานะสินค้า",
};

/** S03 Product Catalog + S04 Search & Filter — all state in the URL (S04-F12). */
export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <div className="container-page flex flex-col gap-6 py-8 md:py-10">
      <Suspense fallback={<ShopSkeleton />}>
        <ShopContent searchParams={searchParams} />
      </Suspense>
      <p className="text-center text-xs text-ink-muted">ราคาและข้อมูลสินค้าเป็นข้อมูลตัวอย่างสำหรับโครงงานการศึกษา</p>
    </div>
  );
}

async function ShopContent({ searchParams }: { searchParams: PageProps<"/shop">["searchParams"] }) {
  const filters = parseShopFilters(await searchParams);
  const [{ products, total }, categories, brands] = await Promise.all([
    getShopProducts(filters),
    getCategoriesWithCounts(),
    getBrandsWithCounts(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstItem = total === 0 ? 0 : (filters.page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(filters.page * PAGE_SIZE, total);
  const singleCategory =
    filters.categories.length === 1 ? categories.find((c) => c.slug === filters.categories[0]) : undefined;

  return (
    <>
      <header className="flex flex-col gap-2">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            ...(singleCategory ? [{ label: singleCategory.name }] : []),
          ]}
        />
        <h1 className="font-display text-3xl font-bold md:text-4xl">{singleCategory?.name ?? "Shop"}</h1>
      </header>

      <ShopToolbar categories={categories} brands={brands} />

      <div className="flex gap-8">
        <FilterSidebar categories={categories} brands={brands} />

        <section aria-label="รายการสินค้า" className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ActiveFilterChips filters={filters} categoryNames={categories} brandNames={brands} />
            <p className="shrink-0 text-sm text-ink-soft" aria-live="polite">
              {total > 0 ? `แสดง ${firstItem}–${lastItem} จาก ${total} รายการ` : "ไม่พบสินค้า"}
            </p>
          </div>

          {products.length > 0 ? (
            <ProductGrid withSidebar>
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 5} />
              ))}
            </ProductGrid>
          ) : (
            <EmptyState
              icon={SearchX}
              title="ไม่พบสินค้าที่ตรงกับเงื่อนไข"
              description={
                singleCategory && singleCategory.productCount === 0 && !filters.q
                  ? "หมวดหมู่นี้ยังไม่มีสินค้า เร็ว ๆ นี้"
                  : "ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองบางรายการ"
              }
              action={
                hasActiveFilters(filters) ? (
                  <ButtonLink href="/shop" variant="outline">
                    ล้างตัวกรอง
                  </ButtonLink>
                ) : undefined
              }
            />
          )}

          <Pagination
            page={Math.min(filters.page, totalPages)}
            totalPages={totalPages}
            hrefFor={(page) => shopHref({ ...filters, page })}
          />
        </section>
      </div>
    </>
  );
}

function ActiveFilterChips({
  filters,
  categoryNames,
  brandNames,
}: {
  filters: ShopFilters;
  categoryNames: { slug: string; name: string }[];
  brandNames: { slug: string; name: string }[];
}) {
  const chips: { label: string; next: Partial<ShopFilters> }[] = [];
  if (filters.q) chips.push({ label: `“${filters.q}”`, next: { q: "" } });
  for (const slug of filters.categories)
    chips.push({
      label: categoryNames.find((c) => c.slug === slug)?.name ?? slug,
      next: { categories: filters.categories.filter((s) => s !== slug) },
    });
  for (const slug of filters.brands)
    chips.push({
      label: brandNames.find((b) => b.slug === slug)?.name ?? slug,
      next: { brands: filters.brands.filter((s) => s !== slug) },
    });
  if (filters.min !== null || filters.max !== null)
    chips.push({
      label: `${filters.min !== null ? formatTHB(filters.min) : "฿0"} – ${filters.max !== null ? formatTHB(filters.max) : "ไม่จำกัด"}`,
      next: { min: null, max: null },
    });
  if (filters.stock)
    chips.push({ label: filters.stock === "in" ? "มีสินค้า" : "สินค้าหมด", next: { stock: null } });

  if (!chips.length) return <span />;
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="ตัวกรองที่ใช้อยู่">
      {chips.map((c) => (
        <li key={c.label}>
          <Link
            href={shopHref({ ...filters, ...c.next, page: 1 })}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-brand-accent/50 bg-brand-accent/10 pr-2 pl-3 text-sm hover:border-brand-accent"
            aria-label={`ลบตัวกรอง ${c.label}`}
          >
            {c.label}
            <X className="size-3.5" aria-hidden />
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={shopHref({
            ...filters,
            q: "",
            categories: [],
            brands: [],
            min: null,
            max: null,
            stock: null,
            page: 1,
          })}
          className="text-sm text-brand-accent hover:underline"
        >
          ล้างทั้งหมด
        </Link>
      </li>
    </ul>
  );
}

function ShopSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-11 w-full max-w-[400px]" />
      <div className="flex gap-8">
        <Skeleton className="hidden h-[480px] w-60 lg:block" />
        <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 desk:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-[340px]" />
          ))}
        </div>
      </div>
    </div>
  );
}
