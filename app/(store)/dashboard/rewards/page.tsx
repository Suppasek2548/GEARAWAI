import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Coins, Gift, History } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";
import { getMyRedemptions, getRewards } from "@/lib/data/loyalty";
import { formatThaiDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { RewardCard } from "@/components/dashboard/reward-card";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Rewards" };

const STATUS = {
  requested: { label: "รอส่งมอบ", tone: "warning" },
  fulfilled: { label: "ส่งมอบแล้ว", tone: "success" },
  cancelled: { label: "ยกเลิก (คืนคะแนนแล้ว)", tone: "danger" },
} as const;

/** S12 Rewards: list (redeem via RPC) + redemption history tab. */
export default function RewardsPage({ searchParams }: PageProps<"/dashboard/rewards">) {
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Rewards</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <RewardsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function RewardsContent({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard/rewards">["searchParams"];
}) {
  const sp = await searchParams;
  const tab = sp.tab === "history" ? "history" : "rewards";
  const [user, rewards, history] = await Promise.all([getCurrentUser(), getRewards(), getMyRedemptions()]);
  if (!user) return null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 rounded-full border border-brand-lime/40 bg-brand-lime/10 px-4 py-2 font-semibold text-brand-lime">
          <Coins className="size-5" aria-hidden /> คะแนนคงเหลือ {user.pointsBalance.toLocaleString("th-TH")}
        </p>
        <nav aria-label="แท็บ" className="flex gap-1 rounded-btn border border-line p-1">
          {(
            [
              ["rewards", "ของรางวัล", Gift],
              ["history", "ประวัติการแลก", History],
            ] as const
          ).map(([key, label, Icon]) => (
            <Link
              key={key}
              href={key === "history" ? "/dashboard/rewards?tab=history" : "/dashboard/rewards"}
              aria-current={tab === key ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-btn px-3 text-sm",
                tab === key ? "bg-brand-primary font-semibold" : "text-ink-soft hover:text-ink",
              )}
            >
              <Icon className="size-4" aria-hidden /> {label}
            </Link>
          ))}
        </nav>
      </div>

      {tab === "rewards" ? (
        rewards.length ? (
          <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 desk:grid-cols-4">
            {rewards.map((r) => (
              <li key={r.id}>
                <RewardCard reward={r} balance={user.pointsBalance} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Gift} title="ยังไม่มีของรางวัลในขณะนี้" />
        )
      ) : history.length ? (
        <ul className="flex flex-col gap-2">
          {history.map((h) => {
            const s = STATUS[h.status as keyof typeof STATUS];
            return (
              <li
                key={h.id}
                className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-4"
              >
                <Gift className="size-6 text-brand-accent" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{h.reward_name}</p>
                  <p className="text-xs text-ink-muted">{formatThaiDateTime(h.created_at)}</p>
                  {h.admin_note && <p className="text-xs text-ink-soft">หมายเหตุจากร้าน: {h.admin_note}</p>}
                </div>
                <span className="text-sm text-ink-soft">−{h.points_used.toLocaleString("th-TH")} คะแนน</span>
                <Badge tone={s.tone}>{s.label}</Badge>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={History} title="ยังไม่มีประวัติการแลกรางวัล" />
      )}
    </>
  );
}
