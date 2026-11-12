import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, CreditCard } from "lucide-react";
import { adminListPayments, slipSignedUrl } from "@/lib/data/admin";
import { createClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/lib/data/member";
import { formatTHB, formatThaiDateTime } from "@/lib/utils/format";
import { PaymentStatusBadge } from "@/components/orders/status-badge";
import { PaymentActions } from "@/components/admin/payment-actions";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Payments" };

const STATUSES: PaymentStatus[] = ["submitted", "verified", "rejected", "voided"];
const LABEL: Record<PaymentStatus, string> = {
  pending: "ยังไม่แจ้ง",
  submitted: "รอตรวจสอบ",
  verified: "ยืนยันแล้ว",
  rejected: "ปฏิเสธ",
  voided: "Voided",
};
const METHOD = { promptpay_demo: "PromptPay (Demo)", bank_transfer_demo: "โอนผ่านธนาคาร (Demo)" } as const;

/** ADMIN §4.8 Payment Verification — default filter: submitted. */
export default function AdminPaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <h1 className="font-display text-2xl font-bold">Payments</h1>
      <p
        role="note"
        className="flex items-center gap-2 rounded-btn border border-warning/40 bg-warning/10 p-3 text-sm text-warning"
      >
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        ระบบชำระเงินจำลอง — การยืนยันในหน้านี้ไม่ได้หมายถึงการได้รับเงินจริง
      </p>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <PaymentsTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PaymentsTable({
  searchParams,
}: {
  searchParams: PageProps<"/admin/payments">["searchParams"];
}) {
  const sp = await searchParams;
  const raw = typeof sp.status === "string" ? sp.status : "submitted";
  const status =
    raw === "all" ? null : STATUSES.includes(raw as PaymentStatus) ? (raw as PaymentStatus) : "submitted";
  const supabase = await createClient();
  const [payments, { count: awaiting }] = await Promise.all([
    adminListPayments(status),
    // orders not paid yet have no payment row until the customer presses "ยืนยันการแจ้งชำระ"
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending_payment"),
  ]);
  const slips = await Promise.all(payments.map((p) => slipSignedUrl(p.slip_path)));

  return (
    <>
      <nav aria-label="กรองตามสถานะ" className="flex flex-wrap gap-2">
        {[...STATUSES, "all" as const].map((s) => {
          const active = s === "all" ? status === null : s === status;
          return (
            <Link
              key={s}
              href={`/admin/payments?status=${s}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                active
                  ? "border-brand-lime bg-brand-lime text-canvas"
                  : "border-line hover:border-brand-accent",
              )}
            >
              {s === "all" ? "ทั้งหมด" : LABEL[s]}
            </Link>
          );
        })}
      </nav>

      {(awaiting ?? 0) > 0 && (
        <p className="rounded-btn border border-line bg-surface p-3 text-sm text-ink-soft">
          มีคำสั่งซื้อที่ลูกค้ายังไม่แจ้งชำระ <strong className="text-ink">{awaiting}</strong> รายการ —
          จะยังไม่แสดงในหน้านี้จนกว่าลูกค้ากด &quot;ยืนยันการแจ้งชำระ&quot; ·{" "}
          <Link href="/admin/orders?status=pending_payment" className="text-brand-accent hover:underline">
            ดูที่ Orders → รอชำระเงิน
          </Link>
        </p>
      )}

      {payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="ไม่มีรายการ" />
      ) : (
        <ul className="flex flex-col gap-3">
          {payments.map((p, i) => {
            const mismatch = p.orders && Number(p.amount) !== Number(p.orders.total_amount);
            return (
              <li
                key={p.id}
                className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 lg:flex-row lg:items-center"
              >
                <div className="min-w-0 flex-1 text-sm">
                  <Link
                    href={`/admin/orders/${p.orders?.id}`}
                    className="font-mono font-semibold text-brand-accent hover:underline"
                  >
                    {p.orders?.order_number}
                  </Link>
                  <p>
                    {p.orders?.profiles?.full_name}{" "}
                    <span className="text-ink-muted">· {p.orders?.profiles?.email}</span>
                  </p>
                  <p className="text-ink-soft">
                    {METHOD[p.method as keyof typeof METHOD]} ·{" "}
                    {formatThaiDateTime(p.submitted_at ?? p.created_at)}
                  </p>
                  {p.payer_note && <p className="text-ink-muted">หมายเหตุลูกค้า: {p.payer_note}</p>}
                  {p.reject_reason && <p className="text-danger">เหตุผลที่ปฏิเสธ: {p.reject_reason}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={cn("font-display text-lg font-bold", mismatch && "text-danger")}>
                    {formatTHB(p.amount)}
                    {mismatch && <span className="ml-1 text-xs">(ไม่ตรงยอด Order)</span>}
                  </span>
                  {slips[i] ? (
                    <a
                      href={slips[i]!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-accent hover:underline"
                    >
                      ดูสลิป
                    </a>
                  ) : (
                    <span className="text-sm text-ink-muted">ไม่มีสลิป</span>
                  )}
                  <PaymentStatusBadge status={p.status as PaymentStatus} />
                  {p.status === "submitted" && (
                    <PaymentActions paymentId={p.id} orderNumber={p.orders?.order_number ?? ""} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
