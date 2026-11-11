import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";
import { formatThaiDate } from "@/lib/utils/format";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { MemberAvatar } from "@/components/dashboard/member-avatar";
import { Skeleton } from "@/components/ui/misc";

/**
 * S14 member area. Guard = layer 2 (Server Component); layer 1 = proxy.ts, layer 3 = RLS.
 * Layout (UI §11.3): sidebar 240px (lg+) · icon rail 72px (md) · tabs under the header (mobile).
 */
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <MemberShell>{children}</MemberShell>
    </Suspense>
  );
}

async function MemberShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard");

  return (
    <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-6 py-6 md:grid-cols-[72px_minmax(0,1fr)] md:py-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
      <aside className="flex min-w-0 flex-col gap-4 md:sticky md:top-28 md:self-start">
        <div className="hidden flex-col items-center gap-2 text-center lg:flex">
          <MemberAvatar name={user.fullName} url={user.avatarUrl} />
          <p className="font-display text-lg font-semibold break-all">{user.fullName}</p>
          <p className="text-xs text-ink-muted">
            Member since {formatThaiDate(user.createdAt, { year: "numeric", month: "short" })}
          </p>
        </div>
        <div className="hidden justify-center md:flex lg:hidden">
          <MemberAvatar name={user.fullName} url={user.avatarUrl} size={48} />
        </div>
        <DashboardNav />
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        {user.accountStatus === "suspended" && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-card border border-danger/40 bg-danger/10 p-4 text-danger"
          >
            <AlertTriangle className="size-5 shrink-0" aria-hidden />
            บัญชีของคุณถูกระงับชั่วคราว — ยังเข้าสู่ระบบได้ แต่สั่งซื้อ จองบริการ หรือแลกรางวัลไม่ได้ กรุณาติดต่อร้าน
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container-page grid gap-6 py-10 lg:grid-cols-[240px_1fr]" aria-busy>
      <Skeleton className="hidden h-96 lg:block" />
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      </div>
    </div>
  );
}
