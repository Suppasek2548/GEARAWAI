import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertTriangle, CalendarClock, Coins, Heart, PackageCheck, PartyPopper } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, Skeleton, StatCard } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * S14 Overview — Phase 1 version: real numbers from the database only (no mock figures).
 * Sidebar, orders, points, rewards, coupons, bookings and profile pages arrive in Phase 4.
 */
export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <div className="container-page flex flex-col gap-6 py-10">
      <Suspense fallback={<Skeleton className="h-24" />}>
        <Overview searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Overview({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) return null; // layout already redirects guests

  const supabase = await createClient();
  // RLS returns only this member's rows
  const [orders, wishlist, bookings] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("wishlist_items").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
  ]);

  return (
    <>
      {params.welcome === "1" && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-card border border-success/40 bg-success/10 p-4 text-success"
        >
          <PartyPopper className="size-5 shrink-0" aria-hidden />
          สมัครสมาชิกสำเร็จ ยินดีต้อนรับสู่ GEARAWAI!
        </div>
      )}

      {user.accountStatus === "suspended" && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-card border border-danger/40 bg-danger/10 p-4 text-danger"
        >
          <AlertTriangle className="size-5 shrink-0" aria-hidden />
          บัญชีของคุณถูกระงับชั่วคราว — ยังเข้าสู่ระบบได้ แต่สั่งซื้อ จองบริการ หรือแลกรางวัลไม่ได้ กรุณาติดต่อร้าน
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-ink-muted">Member Dashboard</p>
          <h1 className="font-display text-3xl font-bold">สวัสดี, {user.fullName}</h1>
          <p className="text-sm text-ink-soft">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {user.role === "admin" && (
            <ButtonLink href="/admin" variant="secondary">
              Admin Panel
            </ButtonLink>
          )}
          <LogoutButton className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-btn px-4 text-sm text-ink-soft hover:bg-elevated hover:text-ink" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="คำสั่งซื้อ" value={orders.count ?? 0} icon={PackageCheck} />
        <StatCard label="คะแนนสะสม" value={user.pointsBalance.toLocaleString("th-TH")} icon={Coins} />
        <StatCard label="Wishlist" value={wishlist.count ?? 0} icon={Heart} />
        <StatCard label="การจอง" value={bookings.count ?? 0} icon={CalendarClock} />
      </div>

      <Card className="text-sm text-ink-soft">
        หน้า คำสั่งซื้อ · คะแนน · ของรางวัล · คูปอง · การจอง · โปรไฟล์ จะเปิดใช้งานใน Phase 4 (Member System)
      </Card>
    </>
  );
}
