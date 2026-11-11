import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Prev/Next + page numbers (UI §1.6). `hrefFor(page)` keeps the other URL params. */
export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );
  const item = "inline-flex h-10 min-w-10 items-center justify-center rounded-btn border px-3 text-sm";

  return (
    <nav aria-label="เลขหน้า" className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className={cn(item, "border-line hover:border-brand-accent")}
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(item, "border-line opacity-40")} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}
      {pages.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-ink-muted">…</span>}
          <Link
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              item,
              p === page
                ? "border-brand-lime bg-brand-lime font-semibold text-canvas"
                : "border-line hover:border-brand-accent",
            )}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className={cn(item, "border-line hover:border-brand-accent")}
          aria-label="หน้าถัดไป"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(item, "border-line opacity-40")} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
