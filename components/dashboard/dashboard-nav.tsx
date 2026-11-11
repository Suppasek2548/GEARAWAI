"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  Coins,
  Gift,
  Heart,
  LayoutDashboard,
  Package,
  Ticket,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LogoutButton } from "@/components/auth/logout-button";

// UI §11.1 sidebar menu
const ITEMS: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/orders", label: "My Orders", icon: Package },
  { href: "/dashboard/points", label: "Points", icon: Coins },
  { href: "/dashboard/rewards", label: "Rewards", icon: Gift },
  { href: "/dashboard/coupons", label: "Coupons", icon: Ticket },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarClock },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

/**
 * Desktop/Laptop: full labels (240px) · Tablet (md–lg): icons only (72px) with tooltips ·
 * Mobile: horizontal scrolling tabs under the header (UI §11.3).
 */
export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="เมนูสมาชิก">
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0">
        {ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                title={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-btn px-3 text-sm whitespace-nowrap transition-colors md:justify-center lg:justify-start",
                  active
                    ? "bg-brand-primary font-semibold text-ink"
                    : "border border-line text-ink-soft hover:bg-elevated hover:text-ink md:border-transparent",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="md:sr-only lg:not-sr-only">{label}</span>
              </Link>
            </li>
          );
        })}
        <li className="hidden shrink-0 md:block">
          <LogoutButton
            labelClassName="md:sr-only lg:not-sr-only"
            className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-btn px-3 text-sm text-ink-soft hover:bg-elevated hover:text-danger md:justify-center lg:justify-start [&>svg]:size-5"
          />
        </li>
      </ul>
    </nav>
  );
}
