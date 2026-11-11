"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import type { BrandOption, CategoryOption } from "@/lib/data/catalog";
import type { ShopFilters } from "@/lib/shop/filters";
import { Button } from "@/components/ui/button";
import { useShopNavigation } from "./use-shop-navigation";

type Draft = Pick<ShopFilters, "categories" | "brands" | "min" | "max" | "stock">;

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * Filter controls (S04-F03–F06). `mode="instant"` (desktop sidebar 240px) applies each change immediately;
 * `mode="apply"` (mobile/tablet drawer) applies on [Apply] (UI §6.4).
 */
function FilterForm({
  categories,
  brands,
  mode,
  onDone,
}: {
  categories: CategoryOption[];
  brands: BrandOption[];
  mode: "instant" | "apply";
  onDone?: () => void;
}) {
  const { filters, update } = useShopNavigation();
  const fromUrl: Draft = {
    categories: filters.categories,
    brands: filters.brands,
    min: filters.min,
    max: filters.max,
    stock: filters.stock,
  };
  const [draft, setDraft] = useState<Draft>(fromUrl);
  const [minText, setMinText] = useState(filters.min?.toString() ?? "");
  const [maxText, setMaxText] = useState(filters.max?.toString() ?? "");
  const [priceError, setPriceError] = useState("");

  // Re-sync when the URL changes from elsewhere (chips, back button)
  const key = JSON.stringify(fromUrl);
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setDraft(fromUrl);
    setMinText(filters.min?.toString() ?? "");
    setMaxText(filters.max?.toString() ?? "");
    setPriceError("");
  }

  const change = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (mode === "instant") update(patch);
  };

  const readPrice = (): { min: number | null; max: number | null } | null => {
    const parse = (t: string) => (t.trim() === "" ? null : Number(t));
    const min = parse(minText);
    const max = parse(maxText);
    if (
      (min !== null && (!Number.isFinite(min) || min < 0)) ||
      (max !== null && (!Number.isFinite(max) || max < 0))
    ) {
      setPriceError("กรุณากรอกราคาเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");
      return null;
    }
    if (min !== null && max !== null && min > max) {
      setPriceError("ราคาต่ำสุดต้องไม่มากกว่าราคาสูงสุด");
      return null;
    }
    setPriceError("");
    return { min, max };
  };

  const applyPrice = () => {
    const p = readPrice();
    if (p) change(p);
  };

  const applyAll = () => {
    const p = readPrice();
    if (!p) return;
    update({ ...draft, ...p });
    onDone?.();
  };

  const reset = () => {
    const empty: Draft = { categories: [], brands: [], min: null, max: null, stock: null };
    setDraft(empty);
    setMinText("");
    setMaxText("");
    setPriceError("");
    update(empty);
    onDone?.();
  };

  const checkbox = "size-[18px] cursor-pointer accent-brand-lime";

  return (
    <div className="flex flex-col gap-1">
      <Group title="Category">
        {categories.map((c) => (
          <label
            key={c.slug}
            className="flex min-h-9 cursor-pointer items-center gap-3 text-sm text-ink-soft hover:text-ink"
          >
            <input
              type="checkbox"
              className={checkbox}
              checked={draft.categories.includes(c.slug)}
              onChange={() => change({ categories: toggle(draft.categories, c.slug) })}
            />
            <span className="flex-1">{c.name}</span>
            <span className="text-xs text-ink-muted">({c.productCount})</span>
          </label>
        ))}
      </Group>

      <Group title="Brand">
        {brands.map((b) => (
          <label
            key={b.slug}
            className="flex min-h-9 cursor-pointer items-center gap-3 text-sm text-ink-soft hover:text-ink"
          >
            <input
              type="checkbox"
              className={checkbox}
              checked={draft.brands.includes(b.slug)}
              onChange={() => change({ brands: toggle(draft.brands, b.slug) })}
            />
            <span className="flex-1">{b.name}</span>
            <span className="text-xs text-ink-muted">({b.productCount})</span>
          </label>
        ))}
      </Group>

      <Group title="Price (บาท)">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "instant") applyPrice();
            else applyAll();
          }}
        >
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`min-${mode}`}>
              ราคาต่ำสุด
            </label>
            <input
              id={`min-${mode}`}
              inputMode="decimal"
              placeholder="ต่ำสุด"
              value={minText}
              onChange={(e) => setMinText(e.target.value)}
              aria-invalid={Boolean(priceError) || undefined}
              className="h-10 w-full min-w-0 rounded-btn border border-line bg-canvas px-3 text-sm text-ink placeholder:text-ink-muted aria-invalid:border-danger"
            />
            <span className="text-ink-muted">–</span>
            <label className="sr-only" htmlFor={`max-${mode}`}>
              ราคาสูงสุด
            </label>
            <input
              id={`max-${mode}`}
              inputMode="decimal"
              placeholder="สูงสุด"
              value={maxText}
              onChange={(e) => setMaxText(e.target.value)}
              aria-invalid={Boolean(priceError) || undefined}
              className="h-10 w-full min-w-0 rounded-btn border border-line bg-canvas px-3 text-sm text-ink placeholder:text-ink-muted aria-invalid:border-danger"
            />
          </div>
          {priceError && (
            <p role="alert" className="text-xs text-danger">
              {priceError}
            </p>
          )}
          {mode === "instant" && (
            <Button type="submit" size="sm" variant="outline">
              ใช้ช่วงราคา
            </Button>
          )}
        </form>
      </Group>

      <Group title="Availability">
        {(
          [
            ["in", "มีสินค้า"],
            ["out", "สินค้าหมด"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className="flex min-h-9 cursor-pointer items-center gap-3 text-sm text-ink-soft hover:text-ink"
          >
            <input
              type="checkbox"
              className={checkbox}
              checked={draft.stock === value}
              onChange={() => change({ stock: draft.stock === value ? null : value })}
            />
            {label}
          </label>
        ))}
      </Group>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {mode === "apply" && (
          <Button size="lg" onClick={applyAll}>
            Apply
          </Button>
        )}
        <Button
          size={mode === "apply" ? "lg" : "md"}
          variant="ghost"
          onClick={reset}
          className={mode === "instant" ? "col-span-2" : ""}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group border-b border-line py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between font-display font-semibold">
        {title}
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-2 flex flex-col">{children}</div>
    </details>
  );
}

/** Desktop sidebar (≥1024px), 240px wide. */
export function FilterSidebar(props: { categories: CategoryOption[]; brands: BrandOption[] }) {
  return (
    <aside aria-label="ตัวกรองสินค้า" className="hidden w-60 shrink-0 lg:block">
      <h2 className="mb-1 font-display text-lg font-semibold">ตัวกรอง</h2>
      <FilterForm {...props} mode="instant" />
    </aside>
  );
}

/** Mobile/Tablet drawer — native <dialog> gives focus trap + Esc. */
export function FilterDrawer({
  open,
  onClose,
  ...props
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  brands: BrandOption[];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label="ตัวกรองสินค้า"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 mt-auto h-[90dvh] max-h-[90dvh] w-full max-w-none rounded-t-card border-t border-line bg-surface p-0 text-ink backdrop:bg-canvas/80 backdrop:backdrop-blur-sm md:mt-0 md:h-dvh md:max-h-dvh md:w-[360px] md:rounded-none md:border-t-0 md:border-r"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <h2 className="font-display text-lg font-semibold">ตัวกรอง</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดตัวกรอง"
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-btn hover:bg-elevated"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {open && <FilterForm {...props} mode="apply" onDone={onClose} />}
        </div>
      </div>
    </dialog>
  );
}
