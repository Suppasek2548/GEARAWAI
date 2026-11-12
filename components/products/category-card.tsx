import Link from "next/link";
import Image from "next/image";
import type { CategoryOption } from "@/lib/data/catalog";
import { Badge } from "@/components/ui/misc";
import { CategoryIcon } from "./category-icon";

/** Category tile (image 600×600 when uploaded, otherwise the Lucide icon from UI §1.7). */
export function CategoryCard({ category }: { category: CategoryOption }) {
  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className="group flex h-full flex-col items-center gap-3 rounded-card border border-line bg-surface p-4 text-center transition-all hover:-translate-y-1 hover:border-brand-accent hover:shadow-glow"
    >
      <div className="relative flex aspect-square w-full max-w-36 items-center justify-center overflow-hidden rounded-card bg-brand-gradient">
        {category.imageUrl ? (
          <Image src={category.imageUrl} alt="" fill sizes="144px" className="object-cover" />
        ) : (
          <CategoryIcon
            slug={category.slug}
            className="size-14 text-ink transition-transform group-hover:scale-110"
          />
        )}
      </div>
      <div className="flex flex-col items-center gap-1">
        <h3 className="font-display font-semibold">{category.name}</h3>
        {category.productCount > 0 ? (
          <span className="text-sm text-ink-muted">{category.productCount} รายการ</span>
        ) : (
          <Badge tone="neutral">เร็ว ๆ นี้</Badge>
        )}
      </div>
    </Link>
  );
}
