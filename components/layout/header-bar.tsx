"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogIn,
  Menu,
  Search,
  ShieldCheck,
  ShoppingCart,
  UserPlus,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Logo } from "./logo";
import { MobileDrawer } from "./mobile-drawer";
import { CATEGORY_LINKS, MAIN_NAV, type HeaderUser } from "./nav-items";
import { LogoutButton } from "@/components/auth/logout-button";

/** `user`: undefined = still loading, null = guest. */
export function HeaderBar({ user }: { user: HeaderUser | undefined }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors",
        scrolled ? "border-line bg-surface/90 backdrop-blur" : "border-transparent bg-canvas",
      )}
    >
      <div className="container-page flex h-16 items-center gap-3 lg:h-20 lg:gap-6">
        <button
          type="button"
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-btn text-ink hover:bg-elevated lg:hidden"
          aria-label="เปิดเมนู"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          <Menu className="size-6" aria-hidden />
        </button>

        <Logo className="shrink-0" />

        <nav aria-label="เมนูหลัก" className="hidden lg:block">
          <ul className="flex items-center gap-1 desk:gap-2">
            {MAIN_NAV.map((item) =>
              item.href === "/categories" ? (
                <li key={item.href}>
                  <CategoriesMenu active={isActive(item.href)} />
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={navLinkClass(isActive(item.href))}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <SearchForm className="hidden lg:flex" />
          <Link
            href="/shop"
            className="inline-flex size-11 items-center justify-center rounded-btn text-ink hover:bg-elevated lg:hidden"
            aria-label="ค้นหาสินค้า"
          >
            <Search className="size-5" aria-hidden />
          </Link>
          <IconLink
            href="/wishlist"
            label="รายการโปรด"
            count={user?.wishlistCount}
            className="hidden sm:inline-flex"
          >
            <Heart className="size-5" aria-hidden />
          </IconLink>
          <IconLink href="/cart" label="ตะกร้าสินค้า" count={user?.cartCount}>
            <ShoppingCart className="size-5" aria-hidden />
          </IconLink>
          <AccountMenu user={user} />
        </div>
      </div>

      {/* Tablet: full-width search row under the header (UI §1.5) */}
      <div className="container-page hidden pb-3 md:block lg:hidden">
        <SearchForm className="flex w-full" />
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} pathname={pathname} />
    </header>
  );
}

function navLinkClass(active: boolean) {
  return cn(
    "relative inline-flex h-10 items-center px-3 text-sm font-medium transition-colors",
    "after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:transition-colors",
    active ? "text-ink after:bg-brand-lime" : "text-ink-soft hover:text-ink after:bg-transparent",
  );
}

function SearchForm({ className }: { className?: string }) {
  return (
    <form action="/shop" role="search" className={cn("relative items-center", className)}>
      <label htmlFor="header-search" className="sr-only">
        ค้นหาสินค้า
      </label>
      <Search className="pointer-events-none absolute left-3 size-5 text-ink-muted" aria-hidden />
      <input
        id="header-search"
        name="q"
        type="search"
        placeholder="Search products, brands..."
        className="h-11 w-full rounded-btn border border-line bg-surface pr-3 pl-10 text-sm text-ink placeholder:text-ink-muted focus-visible:border-brand-lime lg:w-56 desk:w-[400px]"
      />
    </form>
  );
}

function IconLink({
  href,
  label,
  count,
  className,
  children,
}: {
  href: string;
  label: string;
  count?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const showCount = typeof count === "number" && count > 0;
  return (
    <Link
      href={href}
      aria-label={showCount ? `${label} (${count})` : label}
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-btn text-ink hover:bg-elevated",
        className,
      )}
    >
      {children}
      {showCount && (
        <span className="absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-lime px-1 text-[11px] font-bold text-canvas">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

function CategoriesMenu({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={cn(navLinkClass(active), "cursor-pointer gap-1")}
      >
        Categories
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 grid w-[480px] grid-cols-2 gap-1 rounded-card border border-line bg-surface p-3 shadow-xl">
          {CATEGORY_LINKS.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              onClick={() => setOpen(false)}
              className="rounded-btn px-3 py-2 text-sm text-ink-soft hover:bg-elevated hover:text-ink"
            >
              {c.label}
            </Link>
          ))}
          <Link
            href="/categories"
            onClick={() => setOpen(false)}
            className="col-span-2 mt-1 rounded-btn px-3 py-2 text-sm font-semibold text-brand-accent hover:bg-elevated"
          >
            ดูหมวดหมู่ทั้งหมด →
          </Link>
        </div>
      )}
    </div>
  );
}

function AccountMenu({ user }: { user: HeaderUser | undefined }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (user === undefined) {
    return <span className="inline-flex size-11 animate-pulse rounded-btn bg-elevated/60" aria-hidden />;
  }

  const item =
    "flex items-center gap-2 rounded-btn px-3 py-2 text-sm text-ink-soft hover:bg-elevated hover:text-ink";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={user ? `บัญชีของ ${user.fullName}` : "บัญชีผู้ใช้"}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-btn px-2 text-ink hover:bg-elevated"
      >
        <UserRound className="size-5" aria-hidden />
        <ChevronDown className="hidden size-4 sm:block" aria-hidden />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-60 rounded-card border border-line bg-surface p-2 shadow-xl">
          {user ? (
            <>
              <p className="truncate px-3 py-2 text-sm font-semibold text-ink">{user.fullName}</p>
              <Link href="/dashboard" className={item} onClick={() => setOpen(false)}>
                <LayoutDashboard className="size-4" aria-hidden /> Dashboard
              </Link>
              <Link href="/dashboard/orders" className={item} onClick={() => setOpen(false)}>
                <ShoppingCart className="size-4" aria-hidden /> คำสั่งซื้อของฉัน
              </Link>
              {user.isAdmin && (
                <Link href="/admin" className={item} onClick={() => setOpen(false)}>
                  <ShieldCheck className="size-4" aria-hidden /> Admin Panel
                </Link>
              )}
              <div className="my-1 border-t border-line" />
              <LogoutButton className={cn(item, "w-full cursor-pointer")} />
            </>
          ) : (
            <>
              <Link href="/login" className={item} onClick={() => setOpen(false)}>
                <LogIn className="size-4" aria-hidden /> เข้าสู่ระบบ
              </Link>
              <Link href="/register" className={item} onClick={() => setOpen(false)}>
                <UserPlus className="size-4" aria-hidden /> สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
