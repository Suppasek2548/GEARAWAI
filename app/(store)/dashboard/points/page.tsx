import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Coins } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";
import { getMyPointTransactions, POINT_TYPES, type PointType } from "@/lib/data/loyalty";
import { getPublicSettings } from "@/lib/data/site";
import { formatTHB, formatThaiDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Pagination } from "@/components/shop/pagination";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Points" };

const TYPE_LABEL: Record<PointType, { label: string; tone: "success" | "info" | "warning" | "neutral" }> = {
  earn: { label: "ได้รับ", tone: "success" },
  redeem: { label: "แลกรางวัล", tone: "info" },
  adjust: { label: "ปรับโดยร้าน", tone: "warning" },
  reverse: { label: "คืนคะแนน", tone: "neutral" },
};
const PAGE_SIZE = 20;

/** S10 Points: balance, earning rule (from site_settings), full history with type filter + pagination. */
export default function PointsPage({ searchParams }: PageProps<"/dashboard/points">) {
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Points</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <PointsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PointsContent({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard/points">["searchParams"];
}) {
  const sp = await searchParams;
  const rawType = typeof sp.type === "string" ? sp.type : "";
  const type = (POINT_TYPES as readonly string[]).includes(rawType) ? (rawType as PointType) : null;
  const page = Math.max(1, Math.floor(Number(sp.page) || 1));
  const [user, settings, { rows, total }] = await Promise.all([
    getCurrentUser(),
    getPublicSettings(),
    getMyPointTransactions(type, page, PAGE_SIZE),
  ]);
  if (!user) return null;
  const rate = Number(settings.points_rule.baht_per_point) || 100;
  const href = (t: PointType | null, p = 1) => {
    const q = new URLSearchParams();
    if (t) q.set("type", t);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/dashboard/points?${s}` : "/dashboard/points";
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <section className="flex min-h-40 items-center gap-4 rounded-card bg-brand-gradient p-6">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-card bg-canvas/40">
            <Coins className="size-9 text-brand-lime" aria-hidden />
          </span>
          <div>
            <p className="text-sm text-ink-soft">คะแนนคงเหลือ</p>
            <p className="font-display text-4xl font-bold text-brand-lime">
              {user.pointsBalance.toLocaleString("th-TH")}
            </p>
            <Link href="/dashboard/rewards" className="text-sm font-semibold hover:underline">
              แลกของรางวัล →
            </Link>
          </div>
        </section>
        <section
          aria-labelledby="rule-heading"
          className="rounded-card border border-line bg-surface p-6 text-sm"
        >
          <h2 id="rule-heading" className="mb-2 font-display text-lg font-semibold">
            เงื่อนไขการสะสมคะแนน
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-ink-soft">
            <li>ทุก {formatTHB(rate)} ของยอดสินค้า (หลังหักส่วนลดคูปอง ไม่รวมค่าจัดส่ง) = 1 คะแนน</li>
            <li>ได้รับคะแนนเมื่อคำสั่งซื้อมีสถานะ “สำเร็จ”</li>
            <li>1 คำสั่งซื้อได้รับคะแนนเพียงครั้งเดียว</li>
            <li>ใช้คะแนนแลกของรางวัลได้เท่านั้น (ใช้แทนส่วนลดไม่ได้) และคะแนนไม่มีวันหมดอายุ</li>
          </ul>
        </section>
      </div>

      <section aria-labelledby="hist-heading" className="flex flex-col gap-3">
        <h2 id="hist-heading" className="font-display text-xl font-semibold">
          ประวัติคะแนน
        </h2>
        <nav aria-label="กรองประเภท" className="flex flex-wrap gap-2">
          {[null, ...POINT_TYPES].map((t) => (
            <Link
              key={t ?? "all"}
              href={href(t)}
              aria-current={t === type ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                t === type
                  ? "border-brand-lime bg-brand-lime text-canvas"
                  : "border-line hover:border-brand-accent",
              )}
            >
              {t ? TYPE_LABEL[t].label : "ทั้งหมด"}
            </Link>
          ))}
        </nav>

        {rows.length === 0 ? (
          <EmptyState icon={Coins} title="ยังไม่มีประวัติคะแนน" description="คะแนนจะเข้าเมื่อคำสั่งซื้อของคุณสำเร็จ" />
        ) : (
          <div className="overflow-x-auto rounded-card border border-line">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-surface text-left text-ink-soft">
                <tr>
                  <th className="p-3 font-medium">วันที่</th>
                  <th className="p-3 font-medium">ประเภท</th>
                  <th className="p-3 text-right font-medium">คะแนน</th>
                  <th className="p-3 text-right font-medium">คงเหลือ</th>
                  <th className="p-3 font-medium">อ้างอิง</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const t = TYPE_LABEL[r.type as PointType];
                  return (
                    <tr key={r.id} className="border-t border-line">
                      <td className="p-3 text-ink-soft">{formatThaiDateTime(r.created_at)}</td>
                      <td className="p-3">
                        <Badge tone={t.tone}>{t.label}</Badge>
                      </td>
                      <td
                        className={cn(
                          "p-3 text-right font-semibold",
                          r.points > 0 ? "text-success" : "text-danger",
                        )}
                      >
                        {r.points > 0 ? "+" : "−"}
                        {Math.abs(r.points).toLocaleString("th-TH")}
                      </td>
                      <td className="p-3 text-right">{r.balance_after.toLocaleString("th-TH")}</td>
                      <td className="p-3 text-ink-soft">
                        {r.orders?.order_number ? (
                          <Link
                            href={`/dashboard/orders/${r.orders.order_number}`}
                            className="font-mono text-brand-accent hover:underline"
                          >
                            {r.orders.order_number}
                          </Link>
                        ) : (
                          (r.reward_redemptions?.reward_name ?? r.note ?? "-")
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          hrefFor={(p) => href(type, p)}
        />
      </section>
    </>
  );
}
