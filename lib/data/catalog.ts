import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { Json } from "@/types/database.types";
import { isSlug, PAGE_SIZE, type ShopFilters } from "@/lib/shop/filters";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type CatalogProduct = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: number;
  salePrice: number | null;
  /** Lowest of price / sale_price / active promotion — calculated in the DB only (R-12) */
  effectivePrice: number;
  stockQuantity: number;
  inStock: boolean;
  isLowStock: boolean;
  soldCount: number;
  isFeatured: boolean;
  createdAt: string;
  brandName: string;
  brandSlug: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  imageUrl: string | null;
};

export type ProductDetail = CatalogProduct & {
  description: string | null;
  specifications: Record<string, string>;
  images: { url: string; alt: string }[];
};

const CARD_COLUMNS =
  "id, sku, name, slug, short_description, price, sale_price, effective_price, stock_quantity, in_stock, is_low_stock, sold_count, is_featured, created_at, brand_name, brand_slug, category_id, category_name, category_slug, primary_image_url";

type ViewRow = {
  id: string | null;
  sku: string | null;
  name: string | null;
  slug: string | null;
  short_description: string | null;
  price: number | null;
  sale_price: number | null;
  effective_price: number | null;
  stock_quantity: number | null;
  in_stock: boolean | null;
  is_low_stock: boolean | null;
  sold_count: number | null;
  is_featured: boolean | null;
  created_at: string | null;
  brand_name: string | null;
  brand_slug: string | null;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  primary_image_url: string | null;
};

function toProduct(r: ViewRow): CatalogProduct {
  return {
    id: r.id!,
    sku: r.sku!,
    name: r.name!,
    slug: r.slug!,
    shortDescription: r.short_description,
    price: Number(r.price),
    salePrice: r.sale_price === null ? null : Number(r.sale_price),
    effectivePrice: Number(r.effective_price),
    stockQuantity: r.stock_quantity ?? 0,
    inStock: Boolean(r.in_stock),
    isLowStock: Boolean(r.is_low_stock),
    soldCount: r.sold_count ?? 0,
    isFeatured: Boolean(r.is_featured),
    createdAt: r.created_at ?? "",
    brandName: r.brand_name ?? "",
    brandSlug: r.brand_slug ?? "",
    categoryId: r.category_id ?? "",
    categoryName: r.category_name ?? "",
    categorySlug: r.category_slug ?? "",
    imageUrl: r.primary_image_url,
  };
}

/* ------------------------------------------------------------------ */
/* Shop query (S03 + S04)                                              */
/* ------------------------------------------------------------------ */

/**
 * Remove LIKE wildcards and characters that could break out of a quoted PostgREST value.
 * The term is then double-quoted in the filter, so "." "," ":" "(" ")" are safe (e.g. "MK.2").
 */
function cleanSearchTerm(q: string) {
  return q
    .replace(/[*%_\\"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getShopProducts(f: ShopFilters) {
  const supabase = await createPublicClient();
  let query = supabase
    .from("v_product_catalog")
    .select(CARD_COLUMNS, { count: "exact" })
    .eq("status", "active");

  const term = cleanSearchTerm(f.q);
  if (term) query = query.or(`name.ilike."*${term}*",brand_name.ilike."*${term}*"`); // S04-F01/F02
  if (f.categories.length) query = query.in("category_slug", f.categories); // S04-F03
  if (f.brands.length) query = query.in("brand_slug", f.brands); // S04-F04
  if (f.min !== null) query = query.gte("effective_price", f.min); // S04-F05
  if (f.max !== null) query = query.lte("effective_price", f.max);
  if (f.stock) query = query.eq("in_stock", f.stock === "in"); // S04-F06

  switch (f.sort) {
    case "price_asc":
      query = query.order("effective_price", { ascending: true }).order("name");
      break;
    case "price_desc":
      query = query.order("effective_price", { ascending: false }).order("name");
      break;
    case "newest":
      query = query.order("created_at", { ascending: false }).order("name");
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    default: // popularity = sold_count (D-07)
      query = query.order("sold_count", { ascending: false }).order("name");
  }

  const from = (f.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) {
    // Requesting a page past the end returns 416 / PGRST103 — treat as empty
    if (error.code === "PGRST103") return { products: [], total: count ?? 0 };
    throw new Error("CATALOG_LOAD_FAILED");
  }
  return { products: (data ?? []).map(toProduct), total: count ?? 0 };
}

/* ------------------------------------------------------------------ */
/* Filter options, categories                                          */
/* ------------------------------------------------------------------ */

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
};
export type BrandOption = { name: string; slug: string; productCount: number };

export const getCategoriesWithCounts = cache(async (): Promise<CategoryOption[]> => {
  const supabase = await createPublicClient();
  const [{ data: cats }, { data: rows }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, description, image_url")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("v_product_catalog").select("category_slug").eq("status", "active"),
  ]);
  const counts = new Map<string, number>();
  for (const r of rows ?? []) counts.set(r.category_slug ?? "", (counts.get(r.category_slug ?? "") ?? 0) + 1);
  return (cats ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.image_url,
    productCount: counts.get(c.slug) ?? 0,
  }));
});

export async function getBrandsWithCounts(): Promise<BrandOption[]> {
  const supabase = await createPublicClient();
  const [{ data: brands }, { data: rows }] = await Promise.all([
    supabase.from("brands").select("name, slug").eq("is_active", true).order("name"),
    supabase.from("v_product_catalog").select("brand_slug").eq("status", "active"),
  ]);
  const counts = new Map<string, number>();
  for (const r of rows ?? []) counts.set(r.brand_slug ?? "", (counts.get(r.brand_slug ?? "") ?? 0) + 1);
  return (brands ?? []).map((b) => ({ ...b, productCount: counts.get(b.slug) ?? 0 }));
}

/* ------------------------------------------------------------------ */
/* Product detail (S03-F05/F06)                                        */
/* ------------------------------------------------------------------ */

function toSpecs(j: Json | null): Record<string, string> {
  if (!j || typeof j !== "object" || Array.isArray(j)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(j)) if (v !== null && v !== undefined) out[k] = String(v);
  return out;
}

/** Deduped per request (page + generateMetadata). */
export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  if (!isSlug(slug)) return null;
  const supabase = await createPublicClient();
  const { data } = await supabase
    .from("v_product_catalog")
    .select(`${CARD_COLUMNS}, description, specifications`)
    .eq("slug", slug)
    .eq("status", "active") // inactive → 404 (S03-F08)
    .maybeSingle();
  if (!data) return null;

  const { data: imgs } = await supabase
    .from("product_images")
    .select("image_url, alt_text, is_primary, sort_order")
    .eq("product_id", data.id!)
    .order("is_primary", { ascending: false })
    .order("sort_order");

  const base = toProduct(data);
  return {
    ...base,
    description: data.description,
    specifications: toSpecs(data.specifications),
    images: (imgs ?? []).map((i) => ({ url: i.image_url, alt: i.alt_text ?? base.name })),
  };
});

export async function getRelatedProducts(p: CatalogProduct, limit = 5): Promise<CatalogProduct[]> {
  const supabase = await createPublicClient();
  const { data } = await supabase
    .from("v_product_catalog")
    .select(CARD_COLUMNS)
    .eq("status", "active")
    .eq("category_id", p.categoryId)
    .neq("id", p.id)
    .order("sold_count", { ascending: false })
    .order("name")
    .limit(limit);
  return (data ?? []).map(toProduct);
}

export async function getFeaturedProducts(limit = 10): Promise<CatalogProduct[]> {
  const supabase = await createPublicClient();
  const { data } = await supabase
    .from("v_product_catalog")
    .select(CARD_COLUMNS)
    .eq("status", "active")
    .eq("is_featured", true)
    .order("sold_count", { ascending: false })
    .order("name")
    .limit(limit);
  return (data ?? []).map(toProduct);
}

/** Products whose effective price is below the normal price (sale_price or promotion) — /deals part 2 (R-27). */
export async function getDiscountedProducts(): Promise<CatalogProduct[]> {
  const supabase = await createPublicClient();
  const { data } = await supabase
    .from("v_product_catalog")
    .select(CARD_COLUMNS)
    .eq("status", "active")
    .order("name");
  return (data ?? []).map(toProduct).filter((p) => p.effectivePrice < p.price);
}

/* ------------------------------------------------------------------ */
/* Promotions (S19 storefront)                                         */
/* ------------------------------------------------------------------ */

export type ActivePromotion = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  startAt: string;
  endAt: string;
  showOnHomepage: boolean;
  bannerDesktopUrl: string | null;
  bannerMobileUrl: string | null;
  productCount: number;
  products: CatalogProduct[];
};

export async function getActivePromotions({ homepageOnly = false } = {}): Promise<ActivePromotion[]> {
  const supabase = await createPublicClient();
  let q = supabase.from("v_active_promotions").select("*").order("sort_order").order("end_at");
  if (homepageOnly) q = q.eq("show_on_homepage", true);
  const { data: promos } = await q;
  if (!promos?.length) return [];

  const ids = promos.map((p) => p.id!);
  const { data: links } = await supabase
    .from("promotion_products")
    .select("promotion_id, product_id")
    .in("promotion_id", ids);
  const productIds = [...new Set((links ?? []).map((l) => l.product_id))];
  const { data: rows } = productIds.length
    ? await supabase
        .from("v_product_catalog")
        .select(CARD_COLUMNS)
        .eq("status", "active")
        .in("id", productIds)
    : { data: [] as ViewRow[] };
  const byId = new Map((rows ?? []).map((r) => [r.id!, toProduct(r)]));

  return promos.map((p) => ({
    id: p.id!,
    name: p.name!,
    slug: p.slug!,
    description: p.description,
    discountType: p.discount_type!,
    discountValue: Number(p.discount_value),
    startAt: p.start_at!,
    endAt: p.end_at!,
    showOnHomepage: Boolean(p.show_on_homepage),
    bannerDesktopUrl: p.banner_desktop_url || null,
    bannerMobileUrl: p.banner_mobile_url || null,
    productCount: Number(p.product_count ?? 0),
    products: (links ?? [])
      .filter((l) => l.promotion_id === p.id)
      .map((l) => byId.get(l.product_id))
      .filter((x): x is CatalogProduct => Boolean(x)),
  }));
}
