import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Page title row with optional description and action buttons. */
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {description && <p className="text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 p-4 md:p-6">{children}</div>;
}

/** Tables scroll inside their own box on small screens — the page never overflows (UI §12.3). */
export function AdminTable({ children, minWidth = 760 }: { children: ReactNode; minWidth?: number }) {
  return (
    // `relative` keeps absolutely-positioned children (sr-only labels) inside the scroll box,
    // otherwise they escape it and widen the page on phones.
    <div className="relative overflow-x-auto rounded-card border border-line">
      <table className="w-full text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export const th = "p-3 text-left font-medium text-ink-soft";
export const td = "p-3 align-middle";

/** Status / filter chips that keep everything in the URL. */
export function FilterLinks({
  items,
  current,
  label = "ตัวกรอง",
}: {
  items: { href: string; label: string; value: string | null }[];
  current: string | null;
  label?: string;
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {items.map((i) => (
        <Link
          key={i.value ?? "all"}
          href={i.href}
          aria-current={i.value === current ? "page" : undefined}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm",
            i.value === current
              ? "border-brand-lime bg-brand-lime text-canvas"
              : "border-line hover:border-brand-accent",
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

/** GET search form (keeps other params as hidden inputs). */
export function AdminSearch({
  action,
  q,
  placeholder,
  hidden = {},
}: {
  action: string;
  q: string;
  placeholder: string;
  hidden?: Record<string, string | null | undefined>;
}) {
  return (
    <form action={action} role="search" className="flex w-full max-w-md gap-2">
      {Object.entries(hidden).map(([k, v]) =>
        v ? <input key={k} type="hidden" name={k} value={v} /> : null,
      )}
      <label htmlFor="admin-q" className="sr-only">
        ค้นหา
      </label>
      <input
        id="admin-q"
        name="q"
        type="search"
        defaultValue={q}
        placeholder={placeholder}
        className="h-10 min-w-0 flex-1 rounded-btn border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-muted"
      />
      <button
        type="submit"
        className="h-10 cursor-pointer rounded-btn border border-line px-4 text-sm hover:border-brand-accent"
      >
        ค้นหา
      </button>
    </form>
  );
}

export function sp1(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}
