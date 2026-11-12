import { Suspense } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { getMyPendingPaymentOrders } from "@/lib/data/member";
import { formatTHB, formatThaiDateTime } from "@/lib/utils/format";

/**
 * "You still have orders waiting for payment" — the cart is emptied when an order is placed (place_order),
 * so after leaving the payment page this is the customer's way back. Renders nothing when there are none.
 */
export function PendingPaymentReminder() {
  return (
    <Suspense fallback={null}>
      <Reminder />
    </Suspense>
  );
}

async function Reminder() {
  const orders = await getMyPendingPaymentOrders();
  if (!orders.length) return null;
  const shown = orders.slice(0, 3);
  return (
    <section
      aria-labelledby="pending-pay-heading"
      className="flex flex-col gap-3 rounded-card border border-warning/50 bg-warning/10 p-4"
    >
      <h2 id="pending-pay-heading" className="flex items-center gap-2 font-semibold text-warning">
        <Clock className="size-5 shrink-0" aria-hidden />
        คุณมีคำสั่งซื้อรอชำระเงิน {orders.length} รายการ
      </h2>
      <ul className="flex flex-col gap-2">
        {shown.map((o) => (
          <li
            key={o.order_number}
            className="flex flex-wrap items-center justify-between gap-2 rounded-btn bg-surface px-3 py-2 text-sm"
          >
            <span>
              <span className="font-mono font-semibold">{o.order_number}</span>
              <span className="text-ink-muted"> · {formatThaiDateTime(o.created_at)}</span>
            </span>
            <span className="flex items-center gap-3">
              <span className="font-semibold text-brand-lime">{formatTHB(Number(o.total_amount))}</span>
              <Link
                href={`/checkout/payment/${o.order_number}`}
                className="rounded-btn bg-brand-lime px-3 py-1 text-sm font-semibold text-canvas hover:brightness-95"
              >
                ชำระเงิน
              </Link>
            </span>
          </li>
        ))}
      </ul>
      <Link href="/dashboard/orders" className="self-start text-sm text-brand-accent hover:underline">
        {orders.length > shown.length ? `ดูทั้งหมด ${orders.length} รายการ` : "ดูคำสั่งซื้อทั้งหมด"} →
      </Link>
    </section>
  );
}
