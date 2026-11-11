import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type Crumb = { label: string; href?: string };

/** Breadcrumb "Home / …" (UI §1.6). Last item is the current page. */
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-ink-soft">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="inline-flex min-w-0 items-center gap-1">
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-ink hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn(last && "truncate text-ink")}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
