"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { SORT_OPTIONS, type SortValue } from "@/lib/shop/filters";
import { useShopNavigation } from "./use-shop-navigation";
import { FilterDrawer } from "./filter-panel";
import type { BrandOption, CategoryOption } from "@/lib/data/catalog";

/** Search 400×44 (debounce 300ms) + Sort 160×40 + mobile "Filters (n)" button (UI §6.1, §6.6). */
export function ShopToolbar({ categories, brands }: { categories: CategoryOption[]; brands: BrandOption[] }) {
  const { filters, update, pending } = useShopNavigation();
  const [term, setTerm] = useState(filters.q);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const first = useRef(true);

  // Keep the box in sync when the URL changes (Back button, chips, header search)
  const [lastQ, setLastQ] = useState(filters.q);
  if (filters.q !== lastQ) {
    setLastQ(filters.q);
    setTerm(filters.q);
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (term.trim() !== filters.q) update({ q: term.trim() }, { replace: true });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const activeCount =
    filters.categories.length +
    filters.brands.length +
    (filters.min !== null || filters.max !== null ? 1 : 0) +
    (filters.stock ? 1 : 0);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <form
        role="search"
        className="relative w-full md:max-w-[400px]"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: term.trim() });
        }}
      >
        <label htmlFor="shop-search" className="sr-only">
          ค้นหาจากชื่อสินค้าหรือแบรนด์
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-6 -translate-y-1/2 text-ink-muted"
          aria-hidden
        />
        <input
          id="shop-search"
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ค้นหาสินค้า หรือแบรนด์..."
          maxLength={80}
          className="h-11 w-full rounded-btn border border-line bg-surface pr-10 pl-11 text-ink placeholder:text-ink-muted focus-visible:border-brand-lime [&::-webkit-search-cancel-button]:hidden"
        />
        {term && (
          <button
            type="button"
            aria-label="ล้างคำค้นหา"
            onClick={() => {
              setTerm("");
              update({ q: "" });
            }}
            className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-btn text-ink-muted hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </form>

      <div className="flex items-center gap-2 md:ml-auto">
        {pending && <Loader2 className="size-5 animate-spin text-brand-accent" aria-label="กำลังโหลด" />}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-btn border border-line bg-surface px-4 text-sm hover:border-brand-accent lg:hidden"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          ตัวกรอง{activeCount ? ` (${activeCount})` : ""}
        </button>
        <label htmlFor="shop-sort" className="sr-only">
          เรียงลำดับ
        </label>
        <select
          id="shop-sort"
          value={filters.sort}
          onChange={(e) => update({ sort: e.target.value as SortValue })}
          className="h-10 w-[160px] flex-1 cursor-pointer rounded-btn border border-line bg-surface px-3 text-sm text-ink md:flex-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}
