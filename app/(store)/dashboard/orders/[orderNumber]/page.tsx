import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getMyOrderByNumber, type OrderStatus, type PaymentStatus } from "@/lib/data/member";
import { getCurrentUser } from "@/lib/auth/dal";
import { formatTHB, formatThaiDateTime } from "@/lib/utils/format";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { CancelOrderButton } from "@/components/orders/cancel-order-button";
import { ProductImage } from "@/components/products/product-image";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Order Detail" };

const METHOD = { promptpay_demo: "PromptPay (Demo)", bank_transfer_demo: "โอนผ่านธนาคาร (Demo)" } as const;

/** S14-F04 + S14-F10 — order detail, timeline, payments; pay / cancel while pending_payment. */
export default function OrderDetailPage({ params }: PageProps<"/dashboard/orders/[orderNumber]">) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<Skeleton className="h-[480px]" />}>
        <OrderDetail params={params} />
      </Suspense>
    </div>
  );
}

async function OrderDetail({ params }: { params: PageProps<"/dashboard/orders/[orderNumber]">["params"] }) {
  const { orderNumber } = await params;
  const [order, user] = await Promise.all([getMyOrderByNumber(orderNumber), getCurrentUser()]);
  // Admins can read every order through RLS, but this page is the member's own view
  if (!order || !user || order.user_id !== user.id) notFound();
  const status = order.status as OrderStatus;
  const payments = [...(order.payments ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Orders", href: "/dashboard/orders" },
          { label: order.order_number },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold md:text-3xl">{order.order_number}</h1>
          <p className="text-sm text-ink-muted">สั่งซื้อเมื่อ {formatThaiDateTime(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={status} />
          {status === "pending_payment" && (
            <>
              <ButtonLink href={`/checkout/payment/${order.order_number}`}>แจ้งชำระเงิน</ButtonLink>
              <CancelOrderButton orderId={order.id} orderNumber={order.order_number} />
            </>
          )}
        </div>
      </div>

      <OrderTimeline
        status={status}
        createdAt={order.created_at}
        paidAt={order.paid_at}
        shippedAt={order.shipped_at}
        completedAt={order.completed_at}
        cancelledAt={order.cancelled_at}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <section
          aria-labelledby="items-heading"
          className="rounded-card border border-line bg-surface p-4 md:p-6"
        >
          <h2 id="items-heading" className="mb-3 font-display text-lg font-semibold">
            รายการสินค้า
          </h2>
          <ul className="flex flex-col divide-y divide-line">
            {order.order_items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3">
                <ProductImage
                  src={i.product_image_url}
                  alt={i.product_name}
                  sizes="80px"
                  className="size-20 shrink-0 rounded-btn bg-canvas"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{i.product_name}</p>
                  <p className="text-xs text-ink-muted">
                    {i.product_sku} · {formatTHB(i.unit_price)} × {i.quantity}
                  </p>
                </div>
                <p className="font-semibold">{formatTHB(i.line_total)}</p>
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-4">
          <section className="rounded-card border border-line bg-surface p-5 text-sm">
            <h2 className="mb-2 font-display text-lg font-semibold">สรุปยอด</h2>
            <dl className="flex flex-col gap-1">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd>{formatTHB(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">
                  Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}
                </dt>
                <dd>−{formatTHB(order.discount_amount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Shipping</dt>
                <dd>{Number(order.shipping_fee) === 0 ? "ฟรี" : formatTHB(order.shipping_fee)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd className="text-brand-lime">{formatTHB(order.total_amount)}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-card border border-line bg-surface p-5 text-sm">
            <h2 className="mb-2 font-display text-lg font-semibold">จัดส่งถึง</h2>
            <p className="font-semibold">{order.recipient_name}</p>
            <p className="text-ink-soft">{order.recipient_phone}</p>
            <p className="whitespace-pre-line text-ink-soft">{order.shipping_address}</p>
            {order.note && <p className="mt-2 text-ink-muted">หมายเหตุ: {order.note}</p>}
            {order.tracking_number && <p className="mt-2">Tracking: {order.tracking_number}</p>}
            {order.cancelled_reason && (
              <p className="mt-2 text-danger">เหตุผลที่ยกเลิก: {order.cancelled_reason}</p>
            )}
          </section>
          <section className="rounded-card border border-line bg-surface p-5 text-sm">
            <h2 className="mb-2 font-display text-lg font-semibold">การแจ้งชำระเงิน (Demo)</h2>
            {payments.length ? (
              <ul className="flex flex-col gap-3">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-col gap-1 border-b border-line pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{METHOD[p.method as keyof typeof METHOD]}</span>
                      <PaymentStatusBadge status={p.status as PaymentStatus} />
                    </div>
                    <span className="text-ink-muted">
                      {formatTHB(p.amount)} · {formatThaiDateTime(p.submitted_at ?? p.created_at)}
                    </span>
                    {p.reject_reason && <span className="text-danger">เหตุผล: {p.reject_reason}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-soft">ยังไม่มีการแจ้งชำระ</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
