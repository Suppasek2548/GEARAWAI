import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteProductAction, setProductFlagAction } from "@/lib/actions/admin-catalog";
import { formatTHB } from "@/lib/utils/format";
import { ActionButton } from "@/components/admin/action-button";
import { AdminPageHeader, AdminShell, AdminTable, FilterLinks, sp1, td, th } from "@/components/admin/ui";
import { ProductImage } from "@/components/products/product-image";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Products" };

/** ADMIN §4.2 Product Management. */
export default function ProductsAdminPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <AdminShell>
      <AdminPageHeader
        title="Products"
        description="“ขายแล้ว” นับเฉพาะคำสั่งซื้อที่ยืนยันการชำระแล้ว (D-07) · สต็อกปรับได้ที่เมนู Stock"
        actions={
          <ButtonLink href="/admin/products/new">
            <Plus className="size-4" aria-hidden /> เพิ่มสินค้า
          </ButtonLink>
        }
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <List searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

const SORTS = {
  name: { label: "ชื่อ", col: "name", asc: true },
  price: { label: "ราคา", col: "price", asc: true },
  stock: { label: "สต็อก", col: "stock_quantity", asc: true },
  sold: { label: "ขายแล้ว", col: "sold_count", asc: false },
  newest: { label: "วันที่สร้าง", col: "created_at", asc: false },
} as const;

async function List({ searchParams }: { searchParams: PageProps<"/admin/products">["searchParams"] }) {
  const sp = await searchParams;
  const q = sp1(sp.q)
    .replace(/[%_,()*"\\]/g, " ")
    .trim();
  const category = sp1(sp.category);
  const brand = sp1(sp.brand);
  const status = sp1(sp.status);
  const stock = sp1(sp.stock);
  const featured = sp1(sp.featured) === "1";
  const demo = sp1(sp.demo);
  const sortKey =
    (sp1(sp.sort) as keyof typeof SORTS) in SORTS ? (sp1(sp.sort) as keyof typeof SORTS) : "name";
  const sort = SORTS[sortKey];

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(
      "id, sku, name, slug, price, sale_price, stock_quantity, low_stock_threshold, sold_count, status, is_featured, is_demo, brands(name), categories(name), product_images(image_url, is_primary)",
    )
    .order(sort.col, { ascending: sort.asc });
  if (q) query = query.or(`name.ilike."*${q}*",sku.ilike."*${q}*"`);
  if (category) query = query.eq("category_id", category);
  if (brand) query = query.eq("brand_id", brand);
  if (status === "active" || status === "inactive") query = query.eq("status", status);
  if (featured) query = query.eq("is_featured", true);
  if (demo === "1") query = query.eq("is_demo", true);
  if (demo === "0") query = query.eq("is_demo", false);
  if (stock === "out") query = query.eq("stock_quantity", 0);

  const [{ data }, { data: cats }, { data: brands }] = await Promise.all([
    query,
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("brands").select("id, name").order("name"),
  ]);
  let rows = data ?? [];
  if (stock === "low")
    rows = rows.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold);
  if (stock === "normal") rows = rows.filter((p) => p.stock_quantity > p.low_stock_threshold);

  const params = { q, category, brand, status, stock, featured: featured ? "1" : "", demo, sort: sortKey };
  const href = (patch: Partial<typeof params>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...patch })) if (v) p.set(k, String(v));
    const s = p.toString();
    return s ? `/admin/products?${s}` : "/admin/products";
  };

  return (
    <>
      <form action="/admin/products" className="flex flex-wrap items-end gap-2" role="search">
        <label className="flex flex-col gap-1 text-xs text-ink-soft">
          ค้นหาชื่อ / SKU
          <input
            name="q"
            defaultValue={q}
            className="h-10 w-56 rounded-btn border border-line bg-surface px-3 text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-soft">
          หมวดหมู่
          <select
            name="category"
            defaultValue={category}
            className="h-10 rounded-btn border border-line bg-surface px-2 text-sm text-ink"
          >
            <option value="">ทั้งหมด</option>
            {(cats ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-soft">
          แบรนด์
          <select
            name="brand"
            defaultValue={brand}
            className="h-10 rounded-btn border border-line bg-surface px-2 text-sm text-ink"
          >
            <option value="">ทั้งหมด</option>
            {(brands ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-soft">
          สถานะ
          <select
            name="status"
            defaultValue={status}
            className="h-10 rounded-btn border border-line bg-surface px-2 text-sm text-ink"
          >
            <option value="">ทั้งหมด</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-soft">
          สต็อก
          <select
            name="stock"
            defaultValue={stock}
            className="h-10 rounded-btn border border-line bg-surface px-2 text-sm text-ink"
          >
            <option value="">ทั้งหมด</option>
            <option value="normal">ปกติ</option>
            <option value="low">ต่ำ</option>
            <option value="out">หมด</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-soft">
          Demo
          <select
            name="demo"
            defaultValue={demo}
            className="h-10 rounded-btn border border-line bg-surface px-2 text-sm text-ink"
          >
            <option value="">ทั้งหมด</option>
            <option value="1">เฉพาะ Demo</option>
            <option value="0">ซ่อน Demo</option>
          </select>
        </label>
        <label className="flex h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="featured"
            value="1"
            defaultChecked={featured}
            className="size-[18px] accent-brand-lime"
          />
          Featured
        </label>
        <input type="hidden" name="sort" value={sortKey} />
        <button
          type="submit"
          className="h-10 cursor-pointer rounded-btn border border-line px-4 text-sm hover:border-brand-accent"
        >
          กรอง
        </button>
      </form>

      <FilterLinks
        label="เรียงตาม"
        current={sortKey}
        items={Object.entries(SORTS).map(([k, s]) => ({
          href: href({ sort: k as keyof typeof SORTS }),
          label: `เรียง: ${s.label}`,
          value: k,
        }))}
      />
      <p className="text-sm text-ink-soft">{rows.length} รายการ</p>

      <AdminTable minWidth={1100}>
        <thead className="bg-surface">
          <tr>
            <th className={th}>ภาพ</th>
            <th className={th}>SKU</th>
            <th className={th}>ชื่อสินค้า</th>
            <th className={th}>แบรนด์ / หมวด</th>
            <th className={`${th} text-right`}>ราคา / ลด</th>
            <th className={`${th} text-right`}>สต็อก</th>
            <th className={`${th} text-right`}>ขายแล้ว</th>
            <th className={th}>สถานะ</th>
            <th className={th}>Featured</th>
            <th className={th}>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const img =
              p.product_images.find((i) => i.is_primary)?.image_url ?? p.product_images[0]?.image_url ?? null;
            const out = p.stock_quantity === 0;
            const low = !out && p.stock_quantity <= p.low_stock_threshold;
            return (
              <tr key={p.id} className="border-t border-line">
                <td className={td}>
                  <ProductImage src={img} alt="" sizes="64px" className="size-16 rounded-btn bg-canvas" />
                </td>
                <td className={`${td} font-mono text-xs`}>{p.sku}</td>
                <td className={`${td} font-semibold`}>
                  <Link href={`/admin/products/${p.id}`} className="hover:text-brand-accent">
                    {p.name}
                  </Link>
                  {p.is_demo && <Badge className="ml-2">Demo</Badge>}
                </td>
                <td className={`${td} text-ink-soft`}>
                  {p.brands?.name}
                  <br />
                  <span className="text-xs">{p.categories?.name}</span>
                </td>
                <td className={`${td} text-right`}>
                  {formatTHB(p.price)}
                  {p.sale_price && <div className="text-xs text-brand-lime">{formatTHB(p.sale_price)}</div>}
                </td>
                <td
                  className={cn(
                    td,
                    "text-right font-semibold",
                    out ? "text-danger" : low ? "text-warning" : "",
                  )}
                >
                  {p.stock_quantity}
                </td>
                <td className={`${td} text-right`}>{p.sold_count}</td>
                <td className={td}>
                  <ActionButton
                    label={p.status === "active" ? "active" : "inactive"}
                    variant={p.status === "active" ? "secondary" : "outline"}
                    ariaLabel={`สลับสถานะ ${p.name}`}
                    confirm={{
                      title: p.status === "active" ? `ปิดการขาย “${p.name}”?` : `เปิดการขาย “${p.name}”?`,
                      description:
                        p.status === "active"
                          ? "สินค้าจะหายจากหน้าร้านทันที และสินค้าในตะกร้าลูกค้าจะแสดง “ไม่พร้อมจำหน่าย”"
                          : "สินค้าจะกลับมาแสดงบนหน้าร้าน",
                    }}
                    run={async () => {
                      "use server";
                      return setProductFlagAction(p.id, "status", p.status !== "active");
                    }}
                  />
                </td>
                <td className={td}>
                  <ActionButton
                    label={p.is_featured ? "★" : "☆"}
                    variant="ghost"
                    ariaLabel={p.is_featured ? `นำ ${p.name} ออกจากสินค้าแนะนำ` : `ตั้ง ${p.name} เป็นสินค้าแนะนำ`}
                    className={p.is_featured ? "text-brand-lime" : ""}
                    run={async () => {
                      "use server";
                      return setProductFlagAction(p.id, "is_featured", !p.is_featured);
                    }}
                  />
                </td>
                <td className={td}>
                  <div className="flex gap-1">
                    <ButtonLink href={`/admin/products/${p.id}`} size="sm" variant="outline">
                      แก้ไข
                    </ButtonLink>
                    <ButtonLink
                      href={`/shop/${p.slug}`}
                      size="sm"
                      variant="ghost"
                      target="_blank"
                      aria-label={`ดูหน้าร้าน ${p.name}`}
                    >
                      <ExternalLink className="size-4" aria-hidden />
                    </ButtonLink>
                    <ActionButton
                      label="ลบ"
                      danger
                      confirm={{
                        title: `ลบสินค้า “${p.name}”?`,
                        description: "ลบได้เฉพาะสินค้าที่ไม่เคยถูกสั่งซื้อ — ถ้าเคยขายแล้ว ให้ปิดการขายแทน",
                        confirmLabel: "ลบ",
                      }}
                      run={async () => {
                        "use server";
                        return deleteProductAction(p.id);
                      }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </AdminTable>
    </>
  );
}
