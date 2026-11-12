import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/dal";
import { getMyOrderByNumber, type OrderStatus } from "@/lib/data/member";
import { getPublicSettings } from "@/lib/data/site";
import { formatTHB, formatThaiDateTime } from "@/lib/utils/format";
import { CheckoutStepper } from "@/components/checkout/stepper";
import { PaymentForm } from "@/components/checkout/payment-form";
import { OrderStatusBadge } from "@/components/orders/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { PaymentDemoBanner } from "@/components/checkout/payment-demo-banner";

export const metadata: Metadata = { title: "ชำระเงิน" };

/** S09 step 2 — owner only (RLS returns nothing for other users → 404). */
export default function PaymentPage({ params }: PageProps<"/checkout/payment/[orderNumber]">) {
  return (
    <>
      <PaymentDemoBanner />
      <div className="container-page flex flex-col gap-6 py-8 md:py-10">
        <h1 className="font-display text-3xl font-bold">ชำระเงิน</h1>
        <CheckoutStepper current={2} />
        <Suspense fallback={<Skeleton className="h-[520px]" />}>
          <PaymentContent params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function PaymentContent({
  params,
}: {
  params: PageProps<"/checkout/payment/[orderNumber]">["params"];
}) {
  const { orderNumber } = await params;
  const [order, user, settings] = await Promise.all([
    getMyOrderByNumber(orderNumber),
    getCurrentUser(),
    getPublicSettings(),
  ]);
  if (!order || !user || order.user_id !== user.id) notFound();

  const status = order.status as OrderStatus;
  const lastRejected = [...(order.payments ?? [])]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .find((p) => p.status === "rejected");

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-card border border-line bg-surface p-6">
        {status === "pending_payment" ? (
          <>
            {lastRejected?.reject_reason && (
              <p
                role="alert"
                className="mb-4 rounded-btn border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
              >
                การแจ้งชำระครั้งก่อนถูกปฏิเสธ: {lastRejected.reject_reason} — กรุณาแจ้งชำระใหม่
              </p>
            )}
            <PaymentForm
              orderId={order.id}
              orderNumber={order.order_number}
              userId={user.id}
              total={Number(order.total_amount)}
              bank={settings.payment_mode.bank_sample}
              live={settings.payment_mode.mode === "live"}
              qrImageUrl={settings.payment_mode.qr_image_url || null}
            />
          </>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p className="text-ink-soft">คำสั่งซื้อนี้ไม่อยู่ในสถานะรอชำระเงินแล้ว</p>
            <OrderStatusBadge status={status} />
            <ButtonLink href={`/dashboard/orders/${order.order_number}`} variant="outline">
              ดูรายละเอียดคำสั่งซื้อ
            </ButtonLink>
          </div>
        )}
      </section>

      <aside className="flex flex-col gap-3 rounded-card border border-line bg-surface p-6 text-sm">
        <h2 className="font-display text-lg font-semibold">คำสั่งซื้อ {order.order_number}</h2>
        <p className="text-ink-muted">{formatThaiDateTime(order.created_at)}</p>
        <ul className="flex flex-col gap-1 border-t border-line pt-3">
          {order.order_items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span className="line-clamp-1">
                {i.product_name} ×{i.quantity}
              </span>
              <span>{formatTHB(i.line_total)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1 border-t border-line pt-3">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd>{formatTHB(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt>
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
      </aside>
    </div>
  );
}
