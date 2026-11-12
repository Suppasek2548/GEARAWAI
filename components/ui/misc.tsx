import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ---------------- Card ---------------- */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-card border border-line bg-surface p-6", className)} {...props} />;
}

/* ---------------- Badge (UI §1.6 — always text, never color alone §16.5) ---------------- */
type BadgeTone = "sale" | "success" | "warning" | "danger" | "info" | "neutral";
const tones: Record<BadgeTone, string> = {
  sale: "bg-brand-lime text-canvas",
  success: "bg-success/15 text-success border border-success/40",
  warning: "bg-warning/15 text-warning border border-warning/40",
  danger: "bg-danger/15 text-danger border border-danger/40",
  info: "bg-brand-accent/15 text-brand-accent border border-brand-accent/40",
  neutral: "bg-elevated text-ink-soft border border-line",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/* ---------------- Skeleton ---------------- */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div aria-hidden className={cn("animate-pulse rounded-btn bg-elevated", className)} {...props} />;
}

/* ---------------- Empty State (icon 64×64 + text + action) ---------------- */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-4 py-16 text-center", className)}>
      <Icon className="size-16 text-brand-accent" aria-hidden strokeWidth={1.5} />
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {description && <p className="max-w-md text-ink-soft">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ---------------- Demo Banner (all payment pages — SPEC system 9) ---------------- */
export function DemoBanner({ children }: { children?: ReactNode }) {
  return (
    <div role="note" className="w-full border-y border-warning/40 bg-warning/10 text-warning">
      <div className="container-page flex items-center gap-2 py-2 text-sm">
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        <span>{children ?? "ระบบชำระเงินจำลองเพื่อการศึกษา — ไม่มีการตัดเงินจริง"}</span>
      </div>
    </div>
  );
}

/* ---------------- Stat Card 220×120 (Member/Admin dashboards) ---------------- */
export function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[120px] min-w-0 flex-col justify-between rounded-card border border-line bg-surface p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 text-sm text-ink-soft">
        <span>{label}</span>
        {Icon && <Icon className="size-5 text-brand-accent" aria-hidden />}
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
