import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Clock } from "lucide-react";
import { getMyOrderByNumber, type OrderStatus } from "@/lib/data/member";
import { CheckoutStepper } from "@/components/checkout/stepper";
import { OrderStatusBadge } from "@/components/orders/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { DemoBanner, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "ส่งข้อมูลแจ้งชำระแล้ว" };

/** S09 step 3 — never says "ชำระเงินสำเร็จ" (SPEC system 9, UI §14.3). */
export default function SuccessPage({ params }: PageProps<"/checkout/success/[orderNumber]">) {
  return (
    <>
      <DemoBanner />
      <div className="container-page flex flex-col gap-6 py-8 md:py-10">
        <CheckoutStepper current={3} />
        <Suspense fallback={<Skeleton className="h-64" />}>
          <SuccessContent params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function SuccessContent({
  params,
}: {
  params: PageProps<"/checkout/success/[orderNumber]">["params"];
}) {
  const { orderNumber } = await params;
  const order = await getMyOrderByNumber(orderNumber);
  if (!order) notFound();
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-card border border-line bg-surface p-8 text-center">
      <Clock className="size-16 text-brand-accent" aria-hidden strokeWidth={1.5} />
      <h1 className="font-display text-2xl font-bold">ส่งข้อมูลการแจ้งชำระเรียบร้อย รอผู้ดูแลตรวจสอบ</h1>
      <p className="text-ink-soft">
        เลขที่คำสั่งซื้อ <span className="font-mono font-semibold text-ink">{order.order_number}</span>
      </p>
      <OrderStatusBadge status={order.status as OrderStatus} />
      <p className="text-sm text-ink-muted">ระบบชำระเงินจำลอง — ไม่มีการตัดเงินจริง</p>
      <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <ButtonLink href={`/dashboard/orders/${order.order_number}`}>ดูคำสั่งซื้อ</ButtonLink>
        <ButtonLink href="/shop" variant="outline">
          เลือกซื้อต่อ
        </ButtonLink>
      </div>
    </section>
  );
}
