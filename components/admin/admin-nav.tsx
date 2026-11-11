"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, LayoutDashboard, ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Phase 3 subset of ADMIN_DESIGN §2 — the remaining menus arrive in Phase 5
const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, badgeKey: "payments" as const },
];

export function AdminNav({ counts }: { counts: { payments: number } }) {
  const pathname = usePathname();
  return (
    <nav aria-label="เมนูผู้ดูแล" className="flex gap-1 overflow-x-auto md:flex-col">
      {ITEMS.map(({ href, label, icon: Icon, exact, badgeKey }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        const badge = badgeKey ? counts[badgeKey] : 0;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 shrink-0 items-center gap-3 rounded-btn px-3 text-sm whitespace-nowrap",
              active
                ? "bg-brand-primary font-semibold text-ink"
                : "text-ink-soft hover:bg-elevated hover:text-ink",
            )}
          >
            <Icon className="size-5" aria-hidden />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="rounded-full bg-brand-lime px-2 text-xs font-bold text-canvas">{badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
