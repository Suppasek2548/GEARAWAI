import { Check, X } from "lucide-react";
import type { OrderStatus } from "@/lib/data/member";
import { formatThaiDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/** Status timeline following SYSTEM_ANALYSIS 6.1. */
export function OrderTimeline({
  status,
  createdAt,
  paidAt,
  shippedAt,
  completedAt,
  cancelledAt,
}: {
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}) {
  const rank: Record<OrderStatus, number> = {
    pending_payment: 0,
    payment_submitted: 1,
    paid: 2,
    shipped: 3,
    completed: 4,
    cancelled: -1,
  };
  const steps = [
    { label: "สั่งซื้อ", at: createdAt },
    { label: "แจ้งชำระ", at: null },
    { label: "ชำระแล้ว", at: paidAt },
    { label: "จัดส่ง", at: shippedAt },
    { label: "สำเร็จ", at: completedAt },
  ];
  const current = rank[status];

  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-card border border-danger/40 bg-danger/10 p-4 text-danger">
        <X className="size-5" aria-hidden />
        คำสั่งซื้อถูกยกเลิก{cancelledAt ? ` เมื่อ ${formatThaiDateTime(cancelledAt)}` : ""}
      </div>
    );
  }

  return (
    <ol
      className="grid grid-cols-5 gap-1 rounded-card border border-line bg-surface p-4"
      aria-label="สถานะคำสั่งซื้อ"
    >
      {steps.map((s, i) => {
        const done = i <= current;
        return (
          <li
            key={s.label}
            className="flex flex-col items-center gap-2 text-center"
            aria-current={i === current ? "step" : undefined}
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full border",
                done ? "border-success bg-success text-canvas" : "border-line text-ink-muted",
                i === current && "ring-2 ring-brand-lime ring-offset-2 ring-offset-surface",
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span className={cn("text-xs sm:text-sm", done ? "text-ink" : "text-ink-muted")}>{s.label}</span>
            {s.at && done && (
              <span className="hidden text-[11px] text-ink-muted md:block">{formatThaiDateTime(s.at)}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
