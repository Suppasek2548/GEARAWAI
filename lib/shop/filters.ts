/**
 * Shop URL state (S04-F12): /shop?q=&category=a,b&brand=&min=&max=&stock=in|out&sort=&page=
 * Shared by Server Components (query + links) and Client Components (filter controls).
 */
export const SORT_OPTIONS = [
  { value: "popular", label: "ยอดนิยม" },
  { value: "price_asc", label: "ราคา ต่ำ → สูง" },
  { value: "price_desc", label: "ราคา สูง → ต่ำ" },
  { value: "newest", label: "มาใหม่ล่าสุด" },
  { value: "name", label: "ชื่อ A–Z" },
] as const;
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZE = 20; // UI §6.3

export type ShopFilters = {
  q: string;
  categories: string[];
  brands: string[];
  min: number | null;
  max: number | null;
  stock: "in" | "out" | null;
  sort: SortValue;
  page: number;
};

const SLUG_RE = /^[a-z0-9-]+$/;
export const isSlug = (s: string) => SLUG_RE.test(s);

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

export function parseShopFilters(sp: RawParams): ShopFilters {
  const one = (k: string) => {
    const v = sp instanceof URLSearchParams ? sp.get(k) : sp[k];
    return ((Array.isArray(v) ? v[0] : v) ?? "").trim();
  };
  const list = (k: string) =>
    [
      ...new Set(
        one(k)
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(isSlug),
      ),
    ].slice(0, 20);
  const num = (k: string) => {
    const raw = one(k);
    if (raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  let min = num("min");
  let max = num("max");
  if (min !== null && max !== null && min > max) [min, max] = [max, min];
  const stock = one("stock");
  const sort = one("sort") as SortValue;
  return {
    q: one("q").slice(0, 80),
    categories: list("category"),
    brands: list("brand"),
    min,
    max,
    stock: stock === "in" || stock === "out" ? stock : null,
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : "popular",
    page: Math.max(1, Math.floor(Number(one("page")) || 1)),
  };
}

export const EMPTY_FILTERS: ShopFilters = {
  q: "",
  categories: [],
  brands: [],
  min: null,
  max: null,
  stock: null,
  sort: "popular",
  page: 1,
};

/** Build a /shop URL; omits defaults so links stay short and shareable. */
export function shopHref(f: ShopFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.categories.length) p.set("category", f.categories.join(","));
  if (f.brands.length) p.set("brand", f.brands.join(","));
  if (f.min !== null) p.set("min", String(f.min));
  if (f.max !== null) p.set("max", String(f.max));
  if (f.stock) p.set("stock", f.stock);
  if (f.sort !== "popular") p.set("sort", f.sort);
  if (f.page > 1) p.set("page", String(f.page));
  const s = p.toString();
  return s ? `/shop?${s}` : "/shop";
}

export function hasActiveFilters(f: ShopFilters) {
  return Boolean(
    f.q || f.categories.length || f.brands.length || f.min !== null || f.max !== null || f.stock,
  );
}
