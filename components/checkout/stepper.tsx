import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const STEPS = ["ข้อมูลจัดส่ง", "ชำระเงิน", "เสร็จสิ้น"];

/** Checkout stepper ① ข้อมูลจัดส่ง ─ ② ชำระเงิน ─ ③ เสร็จสิ้น (UI §14.1). */
export function CheckoutStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="ขั้นตอนการสั่งซื้อ">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li
            key={label}
            className="flex flex-1 items-center gap-2"
            aria-current={active ? "step" : undefined}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border font-semibold",
                done && "border-success bg-success text-canvas",
                active && "border-brand-lime bg-brand-lime text-canvas",
                !done && !active && "border-line text-ink-muted",
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : n}
            </span>
            <span className={cn("hidden sm:inline", active ? "font-semibold text-ink" : "text-ink-soft")}>
              {label}
            </span>
            {n < STEPS.length && <span className="h-px flex-1 bg-line" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
