"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  BarChart3,
  Boxes,
  CalendarClock,
  Coins,
  CreditCard,
  Gift,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  Megaphone,
  Package,
  ReceiptText,
  Settings,
  Tags,
  Ticket,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type AdminCounts = {
  payments: number;
  bookings: number;
  messages: number;
  lowStock: number;
  redemptions: number;
};
type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean; badge?: keyof AdminCounts };

// ADMIN_DESIGN §2 — 17 menus from SPEC §6 + Stock, grouped
const GROUPS: { title: string | null; items: Item[] }[] = [
  { title: null, items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
  {
    title: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: Tags },
      { href: "/admin/brands", label: "Brands", icon: BadgeCheck },
      { href: "/admin/stock", label: "Stock", icon: Boxes, badge: "lowStock" },
      { href: "/admin/images", label: "Images", icon: ImageIcon },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ReceiptText },
      { href: "/admin/payments", label: "Payments", icon: CreditCard, badge: "payments" },
    ],
  },
  {
    title: "Customers",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/points", label: "Points", icon: Coins },
      { href: "/admin/rewards", label: "Rewards", icon: Gift, badge: "redemptions" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/promotions", label: "Promotions", icon: Megaphone },
      { href: "/admin/coupons", label: "Coupons", icon: Ticket },
    ],
  },
  {
    title: "Services",
    items: [
      { href: "/admin/services", label: "Services", icon: Wrench },
      { href: "/admin/bookings", label: "Bookings", icon: CalendarClock, badge: "bookings" },
    ],
  },
  { title: "Insights", items: [{ href: "/admin/reports", label: "Reports", icon: BarChart3 }] },
  {
    title: "Content",
    items: [
      { href: "/admin/messages", label: "Contact Messages", icon: Mail, badge: "messages" },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

/** Desktop: 240px grouped sidebar · Tablet: 72px icons · Mobile: horizontal scroll strip (UI §12.3). */
export function AdminNav({ counts }: { counts: AdminCounts }) {
  const pathname = usePathname();
  return (
    <nav aria-label="เมนูผู้ดูแล" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {GROUPS.map((g) => (
        <div key={g.title ?? "top"} className="flex gap-1 md:flex-col">
          {g.title && (
            <p className="mt-3 mb-1 hidden px-3 text-[11px] font-semibold tracking-wider text-ink-muted uppercase lg:block">
              {g.title}
            </p>
          )}
          {g.items.map(({ href, label, icon: Icon, exact, badge }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            const n = badge ? counts[badge] : 0;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-10 shrink-0 items-center gap-3 rounded-btn px-3 text-sm whitespace-nowrap md:justify-center lg:justify-start",
                  active
                    ? "bg-brand-primary font-semibold text-ink"
                    : "text-ink-soft hover:bg-elevated hover:text-ink",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="md:sr-only lg:not-sr-only lg:flex-1">{label}</span>
                {n > 0 && (
                  <span
                    className="rounded-full bg-brand-lime px-1.5 text-[11px] font-bold text-canvas md:absolute md:top-0.5 md:right-0.5 lg:static"
                    aria-label={`${n} รายการรอดำเนินการ`}
                  >
                    {n}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
