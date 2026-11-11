import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteCouponAction } from "@/lib/actions/admin-marketing";
import { formatTHB, formatThaiDate, formatThaiDateTime } from "@/lib/utils/format";
import { ActionButton } from "@/components/admin/action-button";
import { AdminPageHeader, AdminShell, AdminTable, FilterLinks, sp1, td, th } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Coupons" };

/** ADMIN §4.13 — general coupons + the birthday template + coupons issued to members. */
export default function CouponsAdminPage({ searchParams }: PageProps<"/admin/coupons">) {
  return (
    <AdminShell>
      <AdminPageHeader
        title="Coupons"
        description="ใช้ได้ 1 ใบต่อคำสั่งซื้อ · ยอดขั้นต่ำเทียบกับยอดสินค้าก่อนหักคูปอง · ใช้ไปแล้ว นับเฉพาะคำสั่งซื้อที่ไม่ถูกยกเลิก"
        actions={
          <ButtonLink href="/admin/coupons/new">
            <Plus className="size-4" aria-hidden /> เพิ่มคูปอง
          </ButtonLink>
        }
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/admin/coupons">["searchParams"] }) {
  const sp = await searchParams;
  const tab = sp1(sp.tab) === "issued" ? "issued" : "coupons";
  const supabase = await createClient();
  return (
    <>
      <FilterLinks
        current={tab}
        items={[
          { href: "/admin/coupons", label: "คูปอง", value: "coupons" },
          { href: "/admin/coupons?tab=issued", label: "ที่ออกให้สมาชิก (วันเกิด)", value: "issued" },
        ]}
      />
      {tab === "coupons" ? <Coupons supabase={supabase} /> : <Issued supabase={supabase} />}
    </>
  );
}

type Sb = Awaited<ReturnType<typeof createClient>>;

async function Coupons({ supabase }: { supabase: Sb }) {
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .order("coupon_type")
    .order("created_at", { ascending: false });
  return (
    <AdminTable minWidth={960}>
      <thead className="bg-surface">
        <tr>
          <th className={th}>รหัส / ชื่อ</th>
          <th className={th}>ประเภท</th>
          <th className={th}>ส่วนลด</th>
          <th className={`${th} text-right`}>ขั้นต่ำ</th>
          <th className={`${th} text-right`}>ใช้ไป / จำกัด</th>
          <th className={th}>ช่วงเวลา</th>
          <th className={th}>สถานะ</th>
          <th className={th}>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        {(data ?? []).map((c) => (
          <tr key={c.id} className="border-t border-line">
            <td className={td}>
              <Link
                href={`/admin/coupons/${c.id}`}
                className="font-mono font-semibold hover:text-brand-accent"
              >
                {c.code ?? "(แม่แบบวันเกิด)"}
              </Link>
              <span className="block text-xs text-ink-soft">{c.name}</span>
            </td>
            <td className={td}>
              <Badge tone={c.coupon_type === "birthday" ? "info" : "neutral"}>{c.coupon_type}</Badge>
            </td>
            <td className={td}>
              {c.discount_type === "percentage"
                ? `${Number(c.discount_value)}%`
                : formatTHB(c.discount_value)}
              {c.max_discount_amount && (
                <span className="block text-xs text-ink-muted">สูงสุด {formatTHB(c.max_discount_amount)}</span>
              )}
            </td>
            <td className={`${td} text-right`}>{formatTHB(c.min_order_amount)}</td>
            <td className={`${td} text-right`}>
              {c.used_count} / {c.usage_limit ?? "∞"}
              <span className="block text-xs text-ink-muted">ต่อคน {c.per_user_limit}</span>
            </td>
            <td className={`${td} text-xs text-ink-soft`}>
              {c.start_at ? formatThaiDateTime(c.start_at) : "ไม่กำหนด"} –{" "}
              {c.end_at ? formatThaiDateTime(c.end_at) : "ไม่กำหนด"}
            </td>
            <td className={td}>
              <Badge tone={c.is_active ? "success" : "neutral"}>{c.is_active ? "เปิด" : "ปิด"}</Badge>
            </td>
            <td className={td}>
              <div className="flex gap-1">
                <ButtonLink href={`/admin/coupons/${c.id}`} size="sm" variant="outline">
                  แก้ไข
                </ButtonLink>
                <ActionButton
                  label="ลบ"
                  danger
                  confirm={{
                    title: `ลบคูปอง ${c.code ?? c.name}?`,
                    description: "ลบไม่ได้ถ้าเคยถูกใช้ — ให้ปิดสถานะแทน",
                    confirmLabel: "ลบ",
                  }}
                  run={async () => {
                    "use server";
                    return deleteCouponAction(c.id);
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

async function Issued({ supabase }: { supabase: Sb }) {
  const { data } = await supabase
    .from("member_coupons")
    .select(
      "id, code, cycle_year, claimed_at, expires_at, used_at, profiles(full_name, email), orders(order_number)",
    )
    .order("claimed_at", { ascending: false });
  return (
    <AdminTable minWidth={820}>
      <thead className="bg-surface">
        <tr>
          <th className={th}>สมาชิก</th>
          <th className={th}>รหัส</th>
          <th className={th}>ปี</th>
          <th className={th}>รับเมื่อ</th>
          <th className={th}>หมดอายุ</th>
          <th className={th}>ใช้แล้ว / Order</th>
        </tr>
      </thead>
      <tbody>
        {(data ?? []).map((m) => (
          <tr key={m.id} className="border-t border-line">
            <td className={td}>
              {m.profiles?.full_name}
              <span className="block text-xs text-ink-muted">{m.profiles?.email}</span>
            </td>
            <td className={`${td} font-mono`}>{m.code}</td>
            <td className={td}>{m.cycle_year}</td>
            <td className={`${td} text-ink-soft`}>{formatThaiDate(m.claimed_at)}</td>
            <td className={`${td} text-ink-soft`}>{formatThaiDateTime(m.expires_at)}</td>
            <td className={td}>{m.used_at ? `✓ ${m.orders?.order_number ?? ""}` : "-"}</td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}
