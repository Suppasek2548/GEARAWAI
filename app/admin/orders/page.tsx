import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ReceiptText } from "lucide-react";
import { adminListOrders, ORDER_STATUSES } from "@/lib/data/admin";
import type { OrderStatus, PaymentStatus } from "@/lib/data/member";
import { formatTHB, formatThaiDateTime } from "@/lib/utils/format";
import { OrderStatusBadge, PaymentStatusBadge, orderStatusLabel } from "@/components/orders/status-badge";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Orders" };

/** ADMIN §4.7 — order list with status filter (basic version, Phase 3). */
export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <h1 className="font-display text-2xl font-bold">Orders</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <OrdersTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrdersTable({ searchParams }: { searchParams: PageProps<"/admin/orders">["searchParams"] }) {
  const sp = await searchParams;
  const raw = typeof sp.status === "string" ? sp.status : "";
  const status = (ORDER_STATUSES as string[]).includes(raw) ? (raw as OrderStatus) : null;
  const orders = await adminListOrders(status);

  return (
    <>
      <nav aria-label="กรองตามสถานะ" className="flex flex-wrap gap-2">
        {[null, ...ORDER_STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/orders?status=${s}` : "/admin/orders"}
            aria-current={s === status ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              s === status
                ? "border-brand-lime bg-brand-lime text-canvas"
                : "border-line hover:border-brand-accent",
            )}
          >
            {s ? orderStatusLabel(s) : "ทั้งหมด"}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <EmptyState icon={ReceiptText} title="ไม่มีคำสั่งซื้อ" />
      ) : (
        // Table scrolls inside its own box on small screens (UI §12.3)
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface text-left text-ink-soft">
              <tr>
                <th className="p-3 font-medium">เลขที่</th>
                <th className="p-3 font-medium">วันที่</th>
                <th className="p-3 font-medium">ลูกค้า</th>
                <th className="p-3 text-right font-medium">ชิ้น</th>
                <th className="p-3 text-right font-medium">ยอดรวม</th>
                <th className="p-3 font-medium">สถานะ</th>
                <th className="p-3 font-medium">การชำระล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const last = [...(o.payments ?? [])].sort((a, b) =>
                  b.created_at.localeCompare(a.created_at),
                )[0];
                return (
                  <tr key={o.id} className="border-t border-line hover:bg-elevated/50">
                    <td className="p-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono font-semibold text-brand-accent hover:underline"
                      >
                        {o.order_number}
                      </Link>
                      {o.is_demo && <Badge className="ml-2">Demo</Badge>}
                    </td>
                    <td className="p-3 text-ink-soft">{formatThaiDateTime(o.created_at)}</td>
                    <td className="p-3">
                      <div>{o.profiles?.full_name}</div>
                      <div className="text-xs text-ink-muted">{o.profiles?.email}</div>
                    </td>
                    <td className="p-3 text-right">{o.order_items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td className="p-3 text-right font-semibold">{formatTHB(o.total_amount)}</td>
                    <td className="p-3">
                      <OrderStatusBadge status={o.status as OrderStatus} />
                    </td>
                    <td className="p-3">
                      {last ? <PaymentStatusBadge status={last.status as PaymentStatus} /> : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
