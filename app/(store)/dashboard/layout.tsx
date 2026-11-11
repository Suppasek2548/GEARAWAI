import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { Skeleton } from "@/components/ui/misc";

/**
 * S14 member area guard (layer 2 — Server Component). Layer 1 = proxy.ts redirect, layer 3 = RLS.
 * The session read sits behind Suspense (Cache Components); children render only for signed-in users.
 */
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <MemberGate>{children}</MemberGate>
    </Suspense>
  );
}

async function MemberGate({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard");
  return <>{children}</>;
}

function DashboardSkeleton() {
  return (
    <div className="container-page flex flex-col gap-6 py-10" aria-busy>
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[120px]" />
        ))}
      </div>
    </div>
  );
}
