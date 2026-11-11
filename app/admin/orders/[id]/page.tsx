import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { adminGetOrder, slipSignedUrl } from "@/lib/data/admin";
import type { OrderStatus, PaymentStatus } from "@/lib/data/member";
import { formatTHB, formatThaiDateTime } from "@/lib/utils/format";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { AdminOrderActions } from "@/components/admin/order-actions";
import { ProductImage } from "@/components/products/product-image";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Order Detail" };

const METHOD = { promptpay_demo: "PromptPay (Demo)", bank_transfer_demo: "โอนผ่านธนาคาร (Demo)" } as const;

/** ADMIN §4.7 order detail: timeline, customer, shipping, items (snapshot), totals, payments, actions. */
export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-brand-accent hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden /> Orders
      </Link>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <OrderDetail params={params} />
      </Suspense>
    </div>
  );
}

async function OrderDetail({ params }: { params: PageProps<"/admin/orders/[id]">["params"] }) {
  const { id } = await params;
  const order = await adminGetOrder(id);
  if (!order) notFound();
  const status = order.status as OrderStatus;
  const payments = [...(order.payments ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const slipUrls = await Promise.all(payments.map((p) => slipSignedUrl(p.slip_path)));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-bold">{order.order_number}</h1>
          <OrderStatusBadge status={status} />
        </div>
        <AdminOrderActions orderId={order.id} status={status} />
      </div>
      <p className="text-sm text-ink-muted">สั่งซื้อเมื่อ {formatThaiDateTime(order.created_at)}</p>

      <OrderTimeline
        status={status}
        createdAt={order.created_at}
        paidAt={order.paid_at}
        shippedAt={order.shipped_at}
        completedAt={order.completed_at}
        cancelledAt={order.cancelled_at}
      />

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_380px]">
        <section className="rounded-card border border-line bg-surface p-4">
          <h2 className="mb-2 font-display text-lg font-semibold">รายการสินค้า (Snapshot)</h2>
          <ul className="divide-y divide-line">
            {order.order_items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3 text-sm">
                <ProductImage
                  src={i.product_image_url}
                  alt=""
                  sizes="64px"
                  className="size-16 shrink-0 rounded-btn bg-canvas"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{i.product_name}</p>
                  <p className="text-xs text-ink-muted">{i.product_sku}</p>
                </div>
                <span className="text-ink-soft">
                  {formatTHB(i.unit_price)} × {i.quantity}
                </span>
                <span className="w-24 text-right font-semibold">{formatTHB(i.line_total)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd>{formatTHB(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">คูปอง{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt>
              <dd>−{formatTHB(order.discount_amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">ค่าส่ง</dt>
              <dd>{formatTHB(order.shipping_fee)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>Total</dt>
              <dd className="text-brand-lime">{formatTHB(order.total_amount)}</dd>
            </div>
          </dl>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-card border border-line bg-surface p-4 text-sm">
            <h2 className="mb-2 font-display text-lg font-semibold">ลูกค้า</h2>
            <p className="font-semibold">{order.profiles?.full_name}</p>
            <p className="text-ink-soft">{order.profiles?.email}</p>
            {order.profiles?.phone && <p className="text-ink-soft">{order.profiles.phone}</p>}
          </section>
          <section className="rounded-card border border-line bg-surface p-4 text-sm">
            <h2 className="mb-2 font-display text-lg font-semibold">จัดส่ง</h2>
            <p className="font-semibold">{order.recipient_name}</p>
            <p className="text-ink-soft">{order.recipient_phone}</p>
            <p className="whitespace-pre-line text-ink-soft">{order.shipping_address}</p>
            {order.note && <p className="mt-2 text-ink-muted">หมายเหตุ: {order.note}</p>}
            {order.tracking_number && <p className="mt-2">Tracking: {order.tracking_number}</p>}
            {order.cancelled_reason && (
              <p className="mt-2 text-danger">เหตุผลที่ยกเลิก: {order.cancelled_reason}</p>
            )}
          </section>
          <section className="rounded-card border border-line bg-surface p-4 text-sm">
            <h2 className="mb-2 font-display text-lg font-semibold">การชำระเงิน (Demo)</h2>
            {payments.length ? (
              <ul className="flex flex-col gap-3">
                {payments.map((p, i) => (
                  <li key={p.id} className="flex flex-col gap-1 border-b border-line pb-3 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <span>{METHOD[p.method as keyof typeof METHOD]}</span>
                      <PaymentStatusBadge status={p.status as PaymentStatus} />
                    </div>
                    <span className="text-ink-muted">
                      {formatTHB(p.amount)} · {formatThaiDateTime(p.submitted_at ?? p.created_at)}
                    </span>
                    {p.payer_note && <span className="text-ink-soft">ลูกค้า: {p.payer_note}</span>}
                    {p.reject_reason && <span className="text-danger">เหตุผลที่ปฏิเสธ: {p.reject_reason}</span>}
                    {slipUrls[i] && (
                      <a
                        href={slipUrls[i]!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-accent hover:underline"
                      >
                        ดูสลิป (ลิงก์ชั่วคราว 10 นาที)
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-soft">ยังไม่มีการแจ้งชำระ</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
