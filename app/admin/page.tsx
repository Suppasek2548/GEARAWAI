import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  Gift,
  Mail,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import { parseRange } from "@/lib/admin/report-range";
import { getDashboard } from "@/lib/data/admin-reports";
import { formatTHB, formatThaiDate, formatThaiDateTime, thTodayISO } from "@/lib/utils/format";
import { CategoryDonut, SalesChart } from "@/components/admin/charts";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { AdminPageHeader, AdminShell, AdminTable, td, th } from "@/components/admin/ui";
import { OrderStatusBadge, orderStatusLabel } from "@/components/orders/status-badge";
import { Skeleton, StatCard } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard Overview" };

/** ADMIN §4.1 — numbers only from admin_dashboard_stats(); no data → 0 + empty charts. */
export default function AdminHomePage({ searchParams }: PageProps<"/admin">) {
  return (
    <AdminShell>
      <AdminPageHeader title="Dashboard Overview" />
      <Suspense fallback={<Skeleton className="h-[640px]" />}>
        <Overview searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

async function Overview({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await connection();
  const range = parseRange(await searchParams, thTodayISO());
  const d = await getDashboard(range);
  const breakdown = d.statusRows.map((r) => `${orderStatusLabel(r.status)} ${r.order_count}`).join(" · ");

  const tasks = [
    { href: "/admin/payments", label: "แจ้งชำระรอตรวจ", count: d.stats.pending_payments, icon: Banknote },
    { href: "/admin/bookings", label: "การจองรอยืนยัน", count: d.stats.pending_bookings, icon: CalendarClock },
    { href: "/admin/messages", label: "ข้อความใหม่", count: d.stats.new_messages, icon: Mail },
    { href: "/admin/rewards", label: "การแลกรางวัลรอส่งมอบ", count: d.redemptions, icon: Gift },
  ];

  return (
    <>
      <DateRangeFilter basePath="/admin" range={range} />
      <p className="text-sm text-ink-soft">
        ช่วงวันที่ {formatThaiDate(range.from)} – {formatThaiDate(range.to)} (เวลาไทย) · ยอดขายนับเฉพาะ Order
        ที่ชำระแล้ว/จัดส่ง/สำเร็จ
      </p>
      {d.error && (
        <p className="rounded-btn border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          โหลดข้อมูลสถิติไม่สำเร็จ — แสดงค่า 0
        </p>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        <StatCard label="Total Sales" value={formatTHB(d.stats.total_sales)} icon={Banknote} />
        <StatCard
          label="Total Orders"
          value={d.stats.total_orders.toLocaleString("th-TH")}
          icon={ShoppingBag}
        />
        <StatCard
          label="Total Customers"
          value={d.stats.total_customers.toLocaleString("th-TH")}
          icon={Users}
        />
        <StatCard
          label="Total Products"
          value={
            <span>
              {d.stats.total_products}
              <span className="ml-2 font-sans text-sm font-normal text-ink-muted">
                เปิดขาย {d.products.active} · ปิด {d.products.inactive}
              </span>
            </span>
          }
          icon={Package}
        />
      </div>
      {breakdown && <p className="-mt-2 text-xs text-ink-muted">Order ตามสถานะ: {breakdown}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="min-w-0 rounded-card border border-line bg-surface p-4">
          <h2 className="mb-3 font-display text-lg font-semibold">
            Sales Overview {range.group === "month" ? "(รายเดือน)" : "(รายวัน)"}
          </h2>
          <SalesChart rows={d.sales} group={range.group} />
        </section>
        <section className="min-w-0 rounded-card border border-line bg-surface p-4">
          <h2 className="mb-3 font-display text-lg font-semibold">Top Categories</h2>
          <CategoryDonut rows={d.categories} size={240} />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2 rounded-card border border-line bg-surface p-4">
          <h2 className="font-display text-lg font-semibold">Pending Tasks</h2>
          <ul className="flex flex-col divide-y divide-line">
            {tasks.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="flex items-center gap-3 py-2.5 hover:text-brand-accent">
                  <t.icon className="size-5 text-brand-accent" aria-hidden />
                  <span className="flex-1">{t.label}</span>
                  <span className={t.count ? "font-semibold text-warning" : "text-ink-muted"}>{t.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="flex min-w-0 flex-col gap-2 rounded-card border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Alerts — สต็อกต่ำ/หมด ({d.stats.low_stock})</h2>
            <Link href="/admin/stock" className="text-sm text-brand-accent hover:underline">
              Stock
            </Link>
          </div>
          {d.lowStock.length === 0 ? (
            <p className="text-sm text-ink-muted">ไม่มีสินค้าสต็อกต่ำ</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line text-sm">
              {d.lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-2 py-2">
                  <AlertTriangle
                    className={p.stock_quantity === 0 ? "size-4 text-danger" : "size-4 text-warning"}
                    aria-hidden
                  />
                  <Link
                    href={`/admin/stock?product=${p.id}`}
                    className="min-w-0 flex-1 truncate hover:text-brand-accent"
                  >
                    {p.name}
                  </Link>
                  <span className={p.stock_quantity === 0 ? "text-danger" : "text-warning"}>
                    {p.stock_quantity === 0 ? "หมด" : `เหลือ ${p.stock_quantity}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Recent Orders</h2>
          <ButtonLink href="/admin/orders" size="sm" variant="outline">
            ดูทั้งหมด
          </ButtonLink>
        </div>
        <AdminTable minWidth={720}>
          <thead className="bg-surface">
            <tr>
              <th className={th}>Order</th>
              <th className={th}>ลูกค้า</th>
              <th className={`${th} text-right`}>ยอด</th>
              <th className={th}>สถานะ</th>
              <th className={th}>วันที่</th>
              <th className={th}>
                <span className="sr-only">ดู</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {d.recent.map((o) => {
              const first = o.order_items[0];
              return (
                <tr key={o.id} className="border-t border-line">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-btn bg-elevated">
                        {first?.product_image_url && (
                          <Image
                            src={first.product_image_url}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <span className="font-medium">{o.order_number}</span>
                    </div>
                  </td>
                  <td className={td}>{o.profiles?.full_name ?? "—"}</td>
                  <td className={`${td} text-right tabular-nums`}>{formatTHB(o.total_amount)}</td>
                  <td className={td}>
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className={`${td} text-ink-soft`}>{formatThaiDateTime(o.created_at)}</td>
                  <td className={td}>
                    <ButtonLink href={`/admin/orders/${o.id}`} size="sm" variant="outline">
                      View
                    </ButtonLink>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
        {d.recent.length === 0 && <p className="text-sm text-ink-muted">ยังไม่มีคำสั่งซื้อ</p>}
      </section>
    </>
  );
}
