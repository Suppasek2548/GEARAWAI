"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch, Search, X } from "lucide-react";
import { toast } from "sonner";
import { setPromotionProductsAction } from "@/lib/actions/admin-marketing";
import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/products/product-image";

type P = {
  id: string;
  name: string;
  sku: string;
  price: number;
  sale_price: number | null;
  category: string;
  brand: string;
  active: boolean;
  createdAt: string;
  image: string | null;
  otherPromotions: string[];
};

type StatusFilter = "all" | "active" | "inactive";
type MemberFilter = "all" | "in" | "out";
type SortKey = "name" | "price-asc" | "price-desc" | "newest";

const PAGE = 50; // rows rendered at a time — keeps the DOM light when the catalog grows

const SORTS: Record<SortKey, { label: string; cmp: (a: P, b: P) => number }> = {
  name: { label: "ชื่อ A–Z", cmp: (a, b) => a.name.localeCompare(b.name, "th") },
  "price-asc": { label: "ราคา น้อย → มาก", cmp: (a, b) => a.price - b.price || a.name.localeCompare(b.name) },
  "price-desc": { label: "ราคา มาก → น้อย", cmp: (a, b) => b.price - a.price || a.name.localeCompare(b.name) },
  newest: { label: "เพิ่มล่าสุด", cmp: (a, b) => b.createdAt.localeCompare(a.createdAt) },
};

const selectCls = "h-10 w-full rounded-btn border border-line bg-canvas px-3 text-sm text-ink";

/**
 * S19-F07 — choose participating products: search, filter (category / brand / sale status / membership),
 * sort, multi-select. Saving sends the whole set; setPromotionProductsAction adds/removes only the
 * difference and the (promotion_id, product_id) primary key rules out duplicates. Prices shown are a
 * preview only — the storefront price is always calc_effective_price() in the database (R-12).
 */
export function PromotionProducts({
  promotionId,
  products,
  selected,
  discountType,
  discountValue,
}: {
  promotionId: string;
  products: P[];
  selected: string[];
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
}) {
  const router = useRouter();
  const saved = useMemo(() => new Set(selected), [selected]);
  const [chosen, setChosen] = useState(() => new Set(selected));
  const [q, setQ] = useState("");
  const query = useDeferredValue(q);
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [member, setMember] = useState<MemberFilter>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [limit, setLimit] = useState(PAGE);
  const [pending, start] = useTransition();

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [products],
  );
  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const promoPrice = (p: P) =>
    discountType === "percentage"
      ? Math.round(p.price * (1 - discountValue / 100) * 100) / 100
      : Math.max(p.price - discountValue, 0);

  const list = useMemo(() => {
    // every word must appear somewhere in name / SKU / brand — partial words are fine
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return products
      .filter((p) => {
        const hay = `${p.name} ${p.sku} ${p.brand}`.toLowerCase();
        if (words.some((w) => !hay.includes(w))) return false;
        if (category && p.category !== category) return false;
        if (brand && p.brand !== brand) return false;
        if (status === "active" && !p.active) return false;
        if (status === "inactive" && p.active) return false;
        // membership uses the SAVED state, so ticking a box does not make the row jump out of view
        if (member === "in" && !saved.has(p.id)) return false;
        if (member === "out" && saved.has(p.id)) return false;
        return true;
      })
      .sort(SORTS[sort].cmp);
  }, [products, query, category, brand, status, member, sort, saved]);

  const shown = list.slice(0, limit);
  const filtersOn = Boolean(q || category || brand || status !== "all" || member !== "all");
  const shownSelected = list.filter((p) => chosen.has(p.id)).length;
  const dirty = chosen.size !== saved.size || [...chosen].some((id) => !saved.has(id));

  const resetFilters = () => {
    setQ("");
    setCategory("");
    setBrand("");
    setStatus("all");
    setMember("all");
    setLimit(PAGE);
  };
  const toggle = (id: string) => {
    const n = new Set(chosen);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setChosen(n);
  };
  const selectShown = () => setChosen(new Set([...chosen, ...list.map((p) => p.id)]));
  const unselectShown = () => {
    const drop = new Set(list.map((p) => p.id));
    setChosen(new Set([...chosen].filter((id) => !drop.has(id))));
  };

  const save = () =>
    start(async () => {
      const res = await setPromotionProductsAction(promotionId, [...chosen]);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.message);
    });

  return (
    <section
      id="products"
      aria-labelledby="pp-heading"
      className="flex scroll-mt-24 flex-col gap-4 rounded-card border border-line bg-surface p-4 md:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="pp-heading" className="font-display text-lg font-semibold">
          สินค้าที่เข้าร่วม
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span
            className="rounded-full bg-brand-lime/15 px-3 py-1 font-semibold text-brand-lime"
            aria-live="polite"
          >
            เลือกแล้ว {chosen.size} รายการ
          </span>
          {dirty && (
            <span className="rounded-full bg-warning/15 px-3 py-1 text-warning">มีการเปลี่ยนแปลงที่ยังไม่บันทึก</span>
          )}
        </div>
      </div>

      {/* Search + filters */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
        <label className="relative col-span-2">
          <span className="sr-only">ค้นหาสินค้า</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="ค้นหาชื่อสินค้า / SKU / แบรนด์"
            className="h-10 w-full rounded-btn border border-line bg-canvas pr-3 pl-9 text-sm text-ink"
          />
        </label>
        <select
          aria-label="หมวดหมู่"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={selectCls}
        >
          <option value="">ทุกหมวดหมู่</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          aria-label="แบรนด์"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className={selectCls}
        >
          <option value="">ทุกแบรนด์</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          aria-label="สถานะสินค้า"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className={selectCls}
        >
          <option value="all">สถานะสินค้า: ทั้งหมด</option>
          <option value="active">เปิดขาย</option>
          <option value="inactive">ปิดขาย</option>
        </select>
        <select
          aria-label="สถานะในโปรโมชันนี้"
          value={member}
          onChange={(e) => setMember(e.target.value as MemberFilter)}
          className={selectCls}
        >
          <option value="all">ในโปรนี้: ทั้งหมด</option>
          <option value="in">อยู่ในโปรนี้ (บันทึกแล้ว)</option>
          <option value="out">ยังไม่อยู่ในโปรนี้</option>
        </select>
      </div>

      {/* Result bar: sort + bulk actions */}
      <div className="flex flex-col gap-2 border-y border-line py-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-soft">
          แสดง {list.length} จาก {products.length} รายการ
          {list.length > 0 && ` · เลือกอยู่ ${shownSelected} รายการในผลลัพธ์นี้`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="เรียงลำดับ"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={cn(selectCls, "w-auto")}
          >
            {(Object.keys(SORTS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                เรียง: {SORTS[k].label}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={selectShown} disabled={!list.length}>
            เลือกทั้งหมดที่แสดง
          </Button>
          <Button size="sm" variant="ghost" onClick={unselectShown} disabled={!shownSelected}>
            ยกเลิกที่แสดง
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setChosen(new Set())} disabled={!chosen.size}>
            ล้างที่เลือกทั้งหมด
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line p-8 text-center">
          <PackageSearch className="size-10 text-ink-muted" aria-hidden />
          <p className="font-semibold">ไม่พบสินค้าที่ตรงกับเงื่อนไข</p>
          {filtersOn && (
            <Button size="sm" variant="outline" onClick={resetFilters}>
              <X className="size-4" aria-hidden /> ล้างตัวกรอง
            </Button>
          )}
        </div>
      ) : (
        <ul className="flex max-h-[520px] flex-col gap-1 overflow-y-auto pr-1">
          {shown.map((p) => {
            const after = promoPrice(p);
            const saleLower = p.sale_price !== null && p.sale_price <= after;
            const fixedTooBig = discountType === "fixed_amount" && discountValue >= p.price;
            const on = chosen.has(p.id);
            return (
              <li key={p.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-btn border px-2 py-2 text-sm transition-colors",
                    on ? "border-brand-lime/50 bg-brand-lime/5" : "border-transparent hover:bg-elevated",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(p.id)}
                    className="size-[18px] shrink-0 accent-brand-lime"
                  />
                  <ProductImage
                    src={p.image}
                    alt=""
                    sizes="48px"
                    className="size-12 shrink-0 overflow-hidden rounded-btn bg-canvas"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-medium text-ink">{p.name}</span>
                    <span className="text-xs text-ink-muted">
                      <span className="font-mono">{p.sku}</span>
                      {p.brand && ` · ${p.brand}`}
                      {p.category && ` · ${p.category}`}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      {!p.active && (
                        <span className="rounded-full bg-danger/15 px-2 text-xs text-danger">ปิดขาย</span>
                      )}
                      {p.otherPromotions.length > 0 && (
                        <span
                          className="rounded-full bg-brand-accent/15 px-2 text-xs text-brand-accent"
                          title={p.otherPromotions.join(", ")}
                        >
                          อยู่ในโปรอื่น: {p.otherPromotions.join(", ")}
                        </span>
                      )}
                      {saleLower && (
                        <span className="text-xs text-warning">
                          sale_price {formatTHB(p.sale_price)} ต่ำกว่าอยู่แล้ว (ระบบใช้ราคาต่ำสุด)
                        </span>
                      )}
                      {fixedTooBig && <span className="text-xs text-danger">ส่วนลดมากกว่าราคาสินค้า</span>}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs sm:text-sm">
                    <span className="block text-ink-muted line-through">{formatTHB(p.price)}</span>
                    <strong className="text-brand-lime">{formatTHB(after)}</strong>
                  </span>
                </label>
              </li>
            );
          })}
          {list.length > shown.length && (
            <li className="pt-2 text-center">
              <Button size="sm" variant="outline" onClick={() => setLimit(limit + PAGE)}>
                แสดงเพิ่ม ({list.length - shown.length} รายการ)
              </Button>
            </li>
          )}
        </ul>
      )}

      <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-wrap items-center gap-2 rounded-b-card border-t border-line bg-surface px-4 py-3 md:-mx-5 md:-mb-5 md:px-5">
        <Button loading={pending} onClick={save} disabled={!dirty}>
          บันทึกสินค้าที่เข้าร่วม ({chosen.size})
        </Button>
        {dirty && (
          <Button variant="ghost" onClick={() => setChosen(new Set(saved))} disabled={pending}>
            ยกเลิกการเปลี่ยนแปลง
          </Button>
        )}
      </div>
    </section>
  );
}
