import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings } from "@/lib/data/site";
import { UUID_RE } from "@/lib/admin/guard";
import { formatTHB, formatThaiDateTime } from "@/lib/utils/format";
import { PointsAdjustForm } from "@/components/admin/points-adjust-form";
import { AdminPageHeader, AdminShell, AdminTable, sp1, td, th } from "@/components/admin/ui";
import { Badge, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Points" };

/** ADMIN §4.10 — rule (edit in Settings → Commerce), manual adjustment, full ledger. */
export default function AdminPointsPage({ searchParams }: PageProps<"/admin/points">) {
  return (
    <AdminShell>
      <AdminPageHeader title="Points" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/admin/points">["searchParams"] }) {
  const sp = await searchParams;
  const userId = UUID_RE.test(sp1(sp.user)) ? sp1(sp.user) : null;
  const supabase = await createClient();
  let ledger = supabase
    .from("points_transactions")
    .select(
      "id, type, points, balance_after, note, created_at, profiles!points_transactions_user_id_fkey(full_name, email), orders(order_number), reward_redemptions(reward_name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (userId) ledger = ledger.eq("user_id", userId);
  const [settings, { data: members }, { data: rows }] = await Promise.all([
    getPublicSettings(),
    supabase.from("profiles").select("id, full_name, email, points_balance").order("full_name"),
    ledger,
  ]);
  const rate = Number(settings.points_rule.baht_per_point) || 100;

  return (
    <>
      <section className="rounded-card border border-line bg-surface p-4 text-sm">
        <p>
          สูตร: <strong>คะแนน = (ยอดสินค้า − ส่วนลดคูปอง) ÷ {rate}</strong> (ไม่รวมค่าส่ง, ปัดลง, ได้เมื่อคำสั่งซื้อ “สำเร็จ”)
          — D-04
        </p>
        <p className="text-ink-soft">
          ตัวอย่าง: ยอดสินค้า {formatTHB(4990)} ไม่มีคูปอง → {Math.floor(4990 / rate)} คะแนน ·{" "}
          <Link href="/admin/settings?tab=commerce" className="text-brand-accent hover:underline">
            แก้อัตราที่ Settings → Commerce
          </Link>
        </p>
      </section>

      <PointsAdjustForm
        defaultUserId={userId}
        members={(members ?? []).map((m) => ({
          id: m.id,
          label: `${m.full_name} · ${m.email}`,
          balance: m.points_balance,
        }))}
      />

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">
          ประวัติคะแนน{userId ? " (สมาชิกที่เลือก)" : " (ล่าสุด 100 รายการ)"}
        </h2>
        {userId && (
          <Link href="/admin/points" className="text-sm text-brand-accent hover:underline">
            ดูทั้งหมด
          </Link>
        )}
      </div>
      <AdminTable minWidth={860}>
        <thead className="bg-surface">
          <tr>
            <th className={th}>วันที่</th>
            <th className={th}>สมาชิก</th>
            <th className={th}>ประเภท</th>
            <th className={`${th} text-right`}>+/−</th>
            <th className={`${th} text-right`}>คงเหลือ</th>
            <th className={th}>อ้างอิง / หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((r) => (
            <tr key={r.id} className="border-t border-line">
              <td className={`${td} text-ink-soft`}>{formatThaiDateTime(r.created_at)}</td>
              <td className={td}>{r.profiles?.full_name}</td>
              <td className={td}>
                <Badge>{r.type}</Badge>
              </td>
              <td
                className={`${td} text-right font-semibold ${r.points > 0 ? "text-success" : "text-danger"}`}
              >
                {r.points > 0 ? "+" : ""}
                {r.points}
              </td>
              <td className={`${td} text-right`}>{r.balance_after}</td>
              <td className={`${td} text-ink-soft`}>
                {r.orders?.order_number ?? r.reward_redemptions?.reward_name ?? ""}{" "}
                {r.note ? `· ${r.note}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </>
  );
}
