import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/admin/guard";
import { formatThaiDateTime } from "@/lib/utils/format";
import { StockAdjustButton } from "@/components/admin/stock-adjust";
import { AdminPageHeader, AdminShell, AdminTable, FilterLinks, sp1, td, th } from "@/components/admin/ui";
import { Badge, Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Stock" };

const TYPE_LABEL: Record<string, string> = {
  initial: "เริ่มต้น",
  restock: "รับเข้า",
  order: "คำสั่งซื้อ",
  cancel_return: "คืนจากการยกเลิก",
  adjustment: "ปรับปรุง",
};

/** ADMIN §4.5 — stock changes only through admin_adjust_stock() / orders; every change is logged. */
export default function StockPage({ searchParams }: PageProps<"/admin/stock">) {
  return (
    <AdminShell>
      <AdminPageHeader
        title="Stock"
        description="สต็อกถูกตัด/คืนอัตโนมัติจากคำสั่งซื้อ — ใช้หน้านี้เมื่อรับสินค้าเข้าหรือแก้ยอดคงคลัง"
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <StockContent searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

async function StockContent({ searchParams }: { searchParams: PageProps<"/admin/stock">["searchParams"] }) {
  const sp = await searchParams;
  const filter = ["low", "out"].includes(sp1(sp.filter)) ? sp1(sp.filter) : null;
  const selected = UUID_RE.test(sp1(sp.product)) ? sp1(sp.product) : null;
  const supabase = await createClient();
  const [{ data }, history] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, sku, name, stock_quantity, low_stock_threshold, sold_count, status, stock_movements(created_at)",
      )
      .order("name"),
    selected
      ? supabase
          .from("stock_movements")
          .select(
            "id, movement_type, quantity_change, quantity_after, note, created_at, orders(order_number), profiles(full_name)",
          )
          .eq("product_id", selected)
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: null }),
  ]);
  let rows = data ?? [];
  if (filter === "low")
    rows = rows.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold);
  if (filter === "out") rows = rows.filter((p) => p.stock_quantity === 0);
  const selectedProduct = (data ?? []).find((p) => p.id === selected);

  return (
    <>
      <FilterLinks
        current={filter}
        items={[
          { href: "/admin/stock", label: "ทั้งหมด", value: null },
          { href: "/admin/stock?filter=low", label: "สต็อกต่ำ", value: "low" },
          { href: "/admin/stock?filter=out", label: "หมด", value: "out" },
        ]}
      />
      <div className="grid gap-4 2xl:grid-cols-[1fr_480px]">
        <AdminTable minWidth={760}>
          <thead className="bg-surface">
            <tr>
              <th className={th}>SKU</th>
              <th className={th}>สินค้า</th>
              <th className={`${th} text-right`}>คงเหลือ</th>
              <th className={`${th} text-right`}>เกณฑ์ต่ำ</th>
              <th className={th}>สถานะสต็อก</th>
              <th className={`${th} text-right`}>ขายแล้ว</th>
              <th className={th}>ปรับล่าสุด</th>
              <th className={th}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const out = p.stock_quantity === 0;
              const low = !out && p.stock_quantity <= p.low_stock_threshold;
              const last = p.stock_movements
                .map((m) => m.created_at)
                .sort()
                .pop();
              return (
                <tr key={p.id} className={cn("border-t border-line", p.id === selected && "bg-elevated/60")}>
                  <td className={`${td} font-mono text-xs`}>{p.sku}</td>
                  <td className={td}>
                    <Link
                      href={`/admin/stock?product=${p.id}${filter ? `&filter=${filter}` : ""}`}
                      className="font-semibold hover:text-brand-accent"
                    >
                      {p.name}
                    </Link>
                    {p.status === "inactive" && <Badge className="ml-2">inactive</Badge>}
                  </td>
                  <td
                    className={cn(
                      td,
                      "text-right font-bold",
                      out ? "text-danger" : low ? "text-warning" : "",
                    )}
                  >
                    {p.stock_quantity}
                  </td>
                  <td className={`${td} text-right text-ink-soft`}>{p.low_stock_threshold}</td>
                  <td className={td}>
                    <Badge tone={out ? "danger" : low ? "warning" : "success"}>
                      {out ? "หมด" : low ? "ต่ำ" : "ปกติ"}
                    </Badge>
                  </td>
                  <td className={`${td} text-right`}>{p.sold_count}</td>
                  <td className={`${td} text-xs text-ink-muted`}>{last ? formatThaiDateTime(last) : "-"}</td>
                  <td className={td}>
                    <StockAdjustButton productId={p.id} name={p.name} current={p.stock_quantity} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>

        {selectedProduct && history.data && (
          <section
            aria-labelledby="hist"
            className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4 text-sm"
          >
            <h2 id="hist" className="font-display text-lg font-semibold">
              ประวัติสต็อก: {selectedProduct.name}
            </h2>
            <ul className="flex flex-col divide-y divide-line">
              {history.data.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <span className="text-xs text-ink-muted">{formatThaiDateTime(m.created_at)}</span>
                  <Badge>{TYPE_LABEL[m.movement_type] ?? m.movement_type}</Badge>
                  <span
                    className={
                      m.quantity_change > 0 ? "font-semibold text-success" : "font-semibold text-danger"
                    }
                  >
                    {m.quantity_change > 0 ? "+" : ""}
                    {m.quantity_change}
                  </span>
                  <span>→ {m.quantity_after}</span>
                  {m.orders?.order_number && (
                    <span className="font-mono text-xs">{m.orders.order_number}</span>
                  )}
                  {m.profiles?.full_name && (
                    <span className="text-xs text-ink-muted">โดย {m.profiles.full_name}</span>
                  )}
                  {m.note && <span className="w-full text-xs text-ink-soft">{m.note}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
