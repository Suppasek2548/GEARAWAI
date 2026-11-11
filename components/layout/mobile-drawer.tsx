"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Logo } from "./logo";
import { CATEGORY_LINKS, MAIN_NAV, type HeaderUser } from "./nav-items";
import { ButtonLink } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";

/**
 * Mobile/Tablet drawer (UI §2.2): 85% width (max 360px), opens from the left,
 * closes on backdrop tap / X / Esc. Native <dialog> provides the focus trap.
 */
export function MobileDrawer({
  open,
  onClose,
  user,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  user: HeaderUser | undefined;
  pathname: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Close when the route changes
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const link = (active: boolean) =>
    cn(
      "flex h-12 items-center rounded-btn px-3 text-base",
      active ? "bg-elevated font-semibold text-ink" : "text-ink-soft hover:bg-elevated hover:text-ink",
    );

  return (
    <dialog
      ref={ref}
      aria-label="เมนู"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 h-dvh max-h-dvh w-[85%] max-w-[360px] border-r border-line bg-surface p-0 text-ink backdrop:bg-canvas/80 backdrop:backdrop-blur-sm"
    >
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดเมนู"
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-btn hover:bg-elevated"
          >
            <X className="size-6" aria-hidden />
          </button>
        </div>

        <form action="/shop" role="search" className="relative px-4 pt-4">
          <label htmlFor="drawer-search" className="sr-only">
            ค้นหาสินค้า
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-7 mt-2 size-5 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            id="drawer-search"
            name="q"
            type="search"
            placeholder="ค้นหาสินค้า แบรนด์..."
            className="h-12 w-full rounded-btn border border-line bg-canvas pr-3 pl-10 text-ink placeholder:text-ink-muted"
          />
        </form>

        <nav aria-label="เมนูหลัก (มือถือ)" className="flex flex-col gap-1 p-4">
          {MAIN_NAV.filter((i) => i.href !== "/categories").map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={link(active)}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
          <details className="group">
            <summary className="flex h-12 cursor-pointer list-none items-center justify-between rounded-btn px-3 text-base text-ink-soft hover:bg-elevated hover:text-ink">
              Categories
              <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="flex flex-col gap-1 pt-1 pl-3">
              {CATEGORY_LINKS.map((c) => (
                <Link key={c.slug} href={`/shop?category=${c.slug}`} className={link(false)}>
                  {c.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>

        <div className="mt-auto border-t border-line p-4">
          {user === undefined ? null : user ? (
            <div className="flex flex-col gap-2">
              <p className="truncate text-sm text-ink-soft">
                เข้าสู่ระบบเป็น <span className="font-semibold text-ink">{user.fullName}</span>
              </p>
              <ButtonLink href="/dashboard" variant="outline" size="lg">
                Dashboard
              </ButtonLink>
              {user.isAdmin && (
                <ButtonLink href="/admin" variant="secondary" size="lg">
                  Admin Panel
                </ButtonLink>
              )}
              <LogoutButton className="h-12 w-full cursor-pointer rounded-btn text-ink-soft hover:bg-elevated hover:text-ink" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <ButtonLink href="/login" variant="outline" size="lg">
                Login
              </ButtonLink>
              <ButtonLink href="/register" variant="primary" size="lg">
                Register
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
