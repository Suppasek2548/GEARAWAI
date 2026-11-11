import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategoriesWithCounts } from "@/lib/data/catalog";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { CategoryCard } from "@/components/products/category-card";
import { PageHeader, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Categories" };

/** S03-F04 — all categories; empty ones show "เร็ว ๆ นี้" and still open an empty Shop (M16). */
export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="Categories">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Categories" }]} />
      </PageHeader>
      <div className="container-page py-10">
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-60" />
              ))}
            </div>
          }
        >
          <CategoryGrid />
        </Suspense>
      </div>
    </>
  );
}

async function CategoryGrid() {
  const categories = await getCategoriesWithCounts();
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {categories.map((c) => (
        <li key={c.slug}>
          <CategoryCard category={c} />
        </li>
      ))}
    </ul>
  );
}
