import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getCurrentUser, isActiveAdmin } from "@/lib/auth/dal";
import { Logo } from "@/components/layout/logo";
import { Skeleton } from "@/components/ui/misc";
import { ForbiddenView } from "@/components/auth/forbidden-view";
import { LogoutButton } from "@/components/auth/logout-button";
import { AdminNav } from "@/components/admin/admin-nav";
import { adminPendingCounts } from "@/lib/data/admin";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | GEARAWAI Admin" },
  robots: { index: false },
};

/**
 * Admin guard (ADMIN_DESIGN §1):
 *  1. proxy.ts — guests → /login?redirect=/admin…
 *  2. this Server Component layout — non-admin members see 403 (children are never rendered)
 *  3. database — GRANT + RLS + is_admin() inside every admin_* RPC (the real enforcement)
 * Full sidebar (18 menus) is built in Phase 5.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin");
  if (!isActiveAdmin(user)) {
    return (
      <div className="flex min-h-dvh flex-col">
        <ForbiddenView />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-line bg-surface px-4 md:px-6 print:hidden">
        <Logo href="/admin" />
        <span className="hidden rounded-full bg-brand-primary px-2.5 py-0.5 text-xs font-semibold sm:inline">
          Admin
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden max-w-48 truncate text-sm text-ink-soft md:inline">{user.fullName}</span>
          <Link
            href="/"
            target="_blank"
            className="inline-flex h-10 items-center gap-1 rounded-btn px-3 text-sm text-ink-soft hover:bg-elevated hover:text-ink"
          >
            View Store <ExternalLink className="size-4" aria-hidden />
          </Link>
          <LogoutButton className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-btn px-3 text-sm text-ink-soft hover:bg-elevated hover:text-ink" />
        </div>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="border-b border-line bg-surface p-3 md:w-[72px] md:shrink-0 md:border-r md:border-b-0 lg:w-60 print:hidden">
          <AdminNav counts={await adminPendingCounts()} />
        </aside>
        <main id="main" className="flex min-w-0 flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col" aria-busy>
      <div className="h-16 border-b border-line bg-surface" />
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
