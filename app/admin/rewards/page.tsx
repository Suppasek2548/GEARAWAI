import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteRewardAction, updateRedemptionAction } from "@/lib/actions/admin-members";
import { formatThaiDateTime } from "@/lib/utils/format";
import { ActionButton } from "@/components/admin/action-button";
import { AdminPageHeader, AdminShell, AdminTable, FilterLinks, sp1, td, th } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Rewards" };

const STATUS = { requested: "รอส่งมอบ", fulfilled: "ส่งมอบแล้ว", cancelled: "ยกเลิก" } as const;

/** ADMIN §4.11 — physical rewards only (D-06) + redemption requests. */
export default function AdminRewardsPage({ searchParams }: PageProps<"/admin/rewards">) {
  return (
    <AdminShell>
      <AdminPageHeader
        title="Rewards"
        actions={
          <ButtonLink href="/admin/rewards/new">
            <Plus className="size-4" aria-hidden /> เพิ่มของรางวัล
          </ButtonLink>
        }
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/admin/rewards">["searchParams"] }) {
  const sp = await searchParams;
  const tab = sp1(sp.tab) === "rewards" ? "rewards" : "requests";
  const supabase = await createClient();

  return (
    <>
      <FilterLinks
        current={tab}
        items={[
          { href: "/admin/rewards", label: "คำขอแลก", value: "requests" },
          { href: "/admin/rewards?tab=rewards", label: "ของรางวัล", value: "rewards" },
        ]}
      />
      {tab === "rewards" ? <RewardList supabase={supabase} /> : <Requests supabase={supabase} />}
    </>
  );
}

type Sb = Awaited<ReturnType<typeof createClient>>;

async function RewardList({ supabase }: { supabase: Sb }) {
  const { data } = await supabase
    .from("rewards")
    .select("id, name, points_required, stock_quantity, sort_order, is_active, is_demo")
    .order("sort_order");
  return (
    <AdminTable minWidth={680}>
      <thead className="bg-surface">
        <tr>
          <th className={th}>ชื่อ</th>
          <th className={`${th} text-right`}>คะแนน</th>
          <th className={`${th} text-right`}>คงเหลือ</th>
          <th className={th}>สถานะ</th>
          <th className={th}>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        {(data ?? []).map((r) => (
          <tr key={r.id} className="border-t border-line">
            <td className={`${td} font-semibold`}>
              <Link href={`/admin/rewards/${r.id}`} className="hover:text-brand-accent">
                {r.name}
              </Link>
              {r.is_demo && <Badge className="ml-2">Demo</Badge>}
            </td>
            <td className={`${td} text-right`}>{r.points_required}</td>
            <td className={`${td} text-right ${r.stock_quantity === 0 ? "text-danger" : ""}`}>
              {r.stock_quantity}
            </td>
            <td className={td}>
              <Badge tone={r.is_active ? "success" : "neutral"}>{r.is_active ? "เปิด" : "ปิด"}</Badge>
            </td>
            <td className={td}>
              <div className="flex gap-1">
                <ButtonLink href={`/admin/rewards/${r.id}`} size="sm" variant="outline">
                  แก้ไข
                </ButtonLink>
                <ActionButton
                  label="ลบ"
                  danger
                  confirm={{
                    title: `ลบ “${r.name}”?`,
                    description: "ลบได้เฉพาะของรางวัลที่ยังไม่เคยมีการแลก",
                    confirmLabel: "ลบ",
                  }}
                  run={async () => {
                    "use server";
                    return deleteRewardAction(r.id);
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}

async function Requests({ supabase }: { supabase: Sb }) {
  const { data } = await supabase
    .from("reward_redemptions")
    .select("id, reward_name, points_used, status, admin_note, created_at, profiles(full_name, email)")
    .order("status")
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <AdminTable minWidth={820}>
      <thead className="bg-surface">
        <tr>
          <th className={th}>วันที่</th>
          <th className={th}>สมาชิก</th>
          <th className={th}>ของรางวัล</th>
          <th className={`${th} text-right`}>คะแนน</th>
          <th className={th}>สถานะ</th>
          <th className={th}>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        {(data ?? []).map((r) => (
          <tr key={r.id} className="border-t border-line">
            <td className={`${td} text-ink-soft`}>{formatThaiDateTime(r.created_at)}</td>
            <td className={td}>
              {r.profiles?.full_name}
              <span className="block text-xs text-ink-muted">{r.profiles?.email}</span>
            </td>
            <td className={td}>{r.reward_name}</td>
            <td className={`${td} text-right`}>{r.points_used}</td>
            <td className={td}>
              <Badge
                tone={r.status === "requested" ? "warning" : r.status === "fulfilled" ? "success" : "danger"}
              >
                {STATUS[r.status as keyof typeof STATUS]}
              </Badge>
              {r.admin_note && <span className="block text-xs text-ink-muted">{r.admin_note}</span>}
            </td>
            <td className={td}>
              {r.status === "requested" ? (
                <div className="flex gap-1">
                  <ActionButton
                    label="ส่งมอบแล้ว"
                    variant="primary"
                    confirm={{ title: `ยืนยันส่งมอบ “${r.reward_name}”?` }}
                    run={async () => {
                      "use server";
                      return updateRedemptionAction(r.id, "fulfilled", "");
                    }}
                  />
                  <ActionButton
                    label="ยกเลิก"
                    danger
                    input={{ label: "เหตุผลการยกเลิก", required: true }}
                    confirm={{
                      title: "ยกเลิกคำขอแลก?",
                      description: "ระบบจะคืนคะแนนให้สมาชิกและคืนจำนวนของรางวัล",
                    }}
                    run={async (note) => {
                      "use server";
                      return updateRedemptionAction(r.id, "cancelled", note);
                    }}
                  />
                </div>
              ) : (
                <span className="text-xs text-ink-muted">-</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}
