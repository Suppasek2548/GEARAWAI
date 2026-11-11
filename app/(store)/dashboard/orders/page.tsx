import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Package } from "lucide-react";
import { getMyOrders, type OrderStatus, type PaymentStatus } from "@/lib/data/member";
import { formatTHB, formatThaiDate } from "@/lib/utils/format";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badge";
import { ProductImage } from "@/components/products/product-image";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "My Orders" };

/** S14-F03/F04 — order history (own rows only, RLS). */
export default function MyOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Orders" }]} />
      <h1 className="font-display text-3xl font-bold">My Orders</h1>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <OrderList />
      </Suspense>
    </div>
  );
}

async function OrderList() {
  const orders = await getMyOrders();
  if (!orders.length) {
    return (
      <EmptyState
        icon={Package}
        title="ยังไม่มีคำสั่งซื้อ"
        action={<ButtonLink href="/shop">เลือกซื้อสินค้า</ButtonLink>}
      />
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {orders.map((o) => {
        const lastPayment = [...(o.payments ?? [])].sort((a, b) =>
          b.created_at.localeCompare(a.created_at),
        )[0];
        const first = o.order_items[0];
        const more = o.order_items.length - 1;
        return (
          <li key={o.id}>
            <Link
              href={`/dashboard/orders/${o.order_number}`}
              className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 transition-colors hover:border-brand-accent sm:flex-row sm:items-center"
            >
              <ProductImage
                src={first?.product_image_url ?? null}
                alt=""
                sizes="80px"
                className="size-20 shrink-0 rounded-btn bg-canvas"
              />
              <div className="min-w-0 flex-1">
                <p className="font-mono font-semibold">{o.order_number}</p>
                <p className="truncate text-sm text-ink-soft">
                  {first?.product_name}
                  {more > 0 ? ` และอีก ${more} รายการ` : ""}
                </p>
                <p className="text-xs text-ink-muted">{formatThaiDate(o.created_at)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                <span className="font-display text-lg font-bold">{formatTHB(o.total_amount)}</span>
                <OrderStatusBadge status={o.status as OrderStatus} />
                {lastPayment && <PaymentStatusBadge status={lastPayment.status as PaymentStatus} />}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
