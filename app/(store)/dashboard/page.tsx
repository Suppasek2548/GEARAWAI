import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarClock, Coins, Heart, PackageCheck, PartyPopper } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getRewards } from "@/lib/data/loyalty";
import { getBirthdayCard } from "@/lib/data/birthday";
import { getMyOrders, type OrderStatus } from "@/lib/data/member";
import { formatTHB, formatThaiDate } from "@/lib/utils/format";
import { BirthdayCard } from "@/components/dashboard/birthday-card";
import { PendingPaymentReminder } from "@/components/orders/pending-payment-reminder";
import { OrderStatusBadge } from "@/components/orders/status-badge";
import { ProductImage } from "@/components/products/product-image";
import { Skeleton, StatCard } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Dashboard" };

/** S14-F01 Overview (UI §11.1) — every number comes from the database (no mock figures). */
export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Overview searchParams={searchParams} />
    </Suspense>
  );
}

async function Overview({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) return null; // layout redirects guests

  const supabase = await createClient();
  const [orders, wishlist, bookings, rewards, birthday, recent] = await Promise.all([
    // explicit user_id: RLS would also count every customer's rows for an admin.
    // Count orders from "paid" onward (paid → shipped → completed). Awaiting payment, payment
    // submitted but not yet verified, and cancelled orders are not counted.
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["paid", "shipped", "completed"]),
    supabase.from("wishlist_items").select("id", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["pending", "confirmed"]),
    getRewards(),
    getBirthdayCard(user),
    getMyOrders(),
  ]);

  // Next reward = cheapest reward that is still in stock and needs more points than the member has
  const next = rewards
    .filter((r) => r.stock_quantity > 0 && r.points_required > user.pointsBalance)
    .sort((a, b) => a.points_required - b.points_required)[0];
  const progress = next ? Math.min(100, Math.round((user.pointsBalance / next.points_required) * 100)) : 100;

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

      <div>
        <p className="text-sm text-ink-muted">Member Dashboard</p>
        <h1 className="font-display text-3xl font-bold">สวัสดี, {user.fullName}</h1>
      </div>

      <PendingPaymentReminder />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Link href="/dashboard/orders" className="rounded-card hover:shadow-glow">
          <StatCard label="คำสั่งซื้อ" value={orders.count ?? 0} icon={PackageCheck} />
        </Link>
        <Link href="/dashboard/points" className="rounded-card hover:shadow-glow">
          <StatCard label="คะแนนสะสม" value={user.pointsBalance.toLocaleString("th-TH")} icon={Coins} />
        </Link>
        <Link href="/dashboard/wishlist" className="rounded-card hover:shadow-glow">
          <StatCard label="Wishlist" value={wishlist.count ?? 0} icon={Heart} />
        </Link>
        <Link href="/dashboard/bookings" className="rounded-card hover:shadow-glow">
          <StatCard label="การจองที่รออยู่" value={bookings.count ?? 0} icon={CalendarClock} />
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        {/* Birthday card is highlighted during the birth month; otherwise it reminds or shows the claimed code */}
        <BirthdayCard state={birthday.state} discountLabel={birthday.label} />

        <section
          aria-labelledby="points-heading"
          className="flex flex-col justify-between gap-3 rounded-card border border-line bg-surface p-6"
        >
          <div className="flex items-center justify-between">
            <h2 id="points-heading" className="font-display text-xl font-semibold">
              Points
            </h2>
            <Link href="/dashboard/rewards" className="text-sm text-brand-accent hover:underline">
              แลกของรางวัล →
            </Link>
          </div>
          <p className="font-display text-4xl font-bold text-brand-lime">
            {user.pointsBalance.toLocaleString("th-TH")} <span className="text-lg text-ink-soft">pts</span>
          </p>
          <div
            className="h-3 overflow-hidden rounded-full bg-elevated"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="ความคืบหน้าไปยังของรางวัลถัดไป"
          >
            <div className="h-full rounded-full bg-brand-lime" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-ink-soft">
            {next
              ? `อีก ${(next.points_required - user.pointsBalance).toLocaleString("th-TH")} คะแนน ถึง “${next.name}”`
              : rewards.length
                ? "คะแนนของคุณพอแลกของรางวัลทุกชิ้นที่มีอยู่แล้ว"
                : "ยังไม่มีของรางวัลให้แลกในขณะนี้"}
          </p>
        </section>
      </div>

      <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 id="recent-heading" className="font-display text-xl font-semibold">
            Recent Orders
          </h2>
          <Link href="/dashboard/orders" className="text-sm text-brand-accent hover:underline">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-card border border-line bg-surface p-6 text-ink-soft">
            ยังไม่มีคำสั่งซื้อ —{" "}
            <Link href="/shop" className="text-brand-accent hover:underline">
              เลือกซื้อสินค้า
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.slice(0, 3).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/dashboard/orders/${o.order_number}`}
                  className="flex items-center gap-3 rounded-card border border-line bg-surface p-3 hover:border-brand-accent"
                >
                  <ProductImage
                    src={o.order_items[0]?.product_image_url ?? null}
                    alt=""
                    sizes="80px"
                    className="size-20 shrink-0 rounded-btn bg-canvas"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold">{o.order_number}</p>
                    <p className="text-xs text-ink-muted">{formatThaiDate(o.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold">{formatTHB(o.total_amount)}</span>
                    <OrderStatusBadge status={o.status as OrderStatus} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
