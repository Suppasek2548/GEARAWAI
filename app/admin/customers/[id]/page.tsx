import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { UUID_RE } from "@/lib/admin/guard";
import { setAccountStatusAction, setMemberBirthDateAction } from "@/lib/actions/admin-members";
import { formatTHB, formatThaiDate, formatThaiDateTime } from "@/lib/utils/format";
import type { OrderStatus } from "@/lib/data/member";
import { ActionButton } from "@/components/admin/action-button";
import { AdminShell } from "@/components/admin/ui";
import { MemberAvatar } from "@/components/dashboard/member-avatar";
import { OrderStatusBadge } from "@/components/orders/status-badge";
import { Badge, Skeleton } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Customer" };

/** ADMIN §4.9 detail: profile (read-only), birth date fix, suspend/activate, points, history. */
export default function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  return (
    <AdminShell>
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1 text-sm text-brand-accent hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden /> Customers
      </Link>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Detail params={params} />
      </Suspense>
    </AdminShell>
  );
}

async function Detail({ params }: { params: PageProps<"/admin/customers/[id]">["params"] }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const supabase = await createClient();
  const [
    { data: m },
    me,
    { data: orders },
    { data: points },
    { data: redemptions },
    { data: coupons },
    { data: bookings },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    getCurrentUser(),
    supabase
      .from("orders")
      .select("id, order_number, status, total_amount, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("points_transactions")
      .select("id, type, points, balance_after, note, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("reward_redemptions")
      .select("id, reward_name, points_used, status, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("member_coupons").select("id, code, expires_at, used_at").eq("user_id", id),
    supabase
      .from("bookings")
      .select("id, booking_number, booking_date, status")
      .eq("user_id", id)
      .order("booking_date", { ascending: false }),
  ]);
  if (!m) notFound();
  const isSelf = me?.id === m.id;

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <MemberAvatar name={m.full_name} url={m.avatar_url} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold">{m.full_name}</h1>
          <p className="text-ink-soft">{m.email}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge tone={m.role === "admin" ? "info" : "neutral"}>{m.role}</Badge>
            <Badge tone={m.account_status === "active" ? "success" : "danger"}>
              {m.account_status === "active" ? "ใช้งาน" : "ระงับ"}
            </Badge>
            {m.is_demo && <Badge>Demo</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSelf ? (
            <p className="text-sm text-ink-muted">เปลี่ยนสถานะบัญชีของตนเองไม่ได้</p>
          ) : (
            <ActionButton
              label={m.account_status === "active" ? "ระงับบัญชี" : "เปิดใช้งานบัญชี"}
              danger={m.account_status === "active"}
              variant="secondary"
              confirm={{
                title:
                  m.account_status === "active" ? `ระงับบัญชี ${m.full_name}?` : `เปิดใช้งานบัญชี ${m.full_name}?`,
                description:
                  m.account_status === "active"
                    ? "สมาชิกยังเข้าสู่ระบบได้ แต่สั่งซื้อ จองบริการ แลกรางวัล และรับคูปองไม่ได้"
                    : "สมาชิกจะใช้งานได้ตามปกติ",
              }}
              run={async () => {
                "use server";
                return setAccountStatusAction(id, m.account_status === "active" ? "suspended" : "active");
              }}
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-card border border-line bg-surface p-4 text-sm">
          <h2 className="mb-2 font-display text-lg font-semibold">ข้อมูลส่วนตัว</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-ink-soft">เบอร์</dt>
            <dd>{m.phone ?? "-"}</dd>
            <dt className="text-ink-soft">ที่อยู่</dt>
            <dd className="whitespace-pre-line">{m.address ?? "-"}</dd>
            <dt className="text-ink-soft">วันเกิด</dt>
            <dd>
              {m.birth_date ? formatThaiDate(`${m.birth_date}T00:00:00+07:00`, { dateStyle: "long" }) : "-"}
              <span className="ml-1 text-xs text-ink-muted">(แก้เองแล้ว {m.birth_date_change_count}/1)</span>
            </dd>
            <dt className="text-ink-soft">สมัครเมื่อ</dt>
            <dd>{formatThaiDate(m.created_at)}</dd>
          </dl>
          <div className="mt-3">
            <ActionButton
              label="แก้วันเกิด"
              input={{ label: "วันเกิดใหม่ (YYYY-MM-DD)", required: true }}
              confirm={{ title: "แก้วันเกิดสมาชิก", description: "ใช้กรณีสมาชิกขอแก้เกินสิทธิ์ที่แก้เองได้" }}
              run={async (date) => {
                "use server";
                return setMemberBirthDateAction(id, date.trim());
              }}
            />
          </div>
        </section>

        <section className="rounded-card border border-line bg-surface p-4 text-sm">
          <h2 className="mb-2 font-display text-lg font-semibold">
            คะแนน: {m.points_balance.toLocaleString("th-TH")}
          </h2>
          <ButtonLink href={`/admin/points?user=${id}`} size="sm" variant="outline">
            ปรับคะแนน
          </ButtonLink>
          <ul className="mt-3 flex flex-col gap-1">
            {(points ?? []).map((p) => (
              <li key={p.id} className="flex justify-between gap-2 text-xs">
                <span className="text-ink-muted">
                  {formatThaiDateTime(p.created_at)} · {p.type}
                </span>
                <span className={p.points > 0 ? "text-success" : "text-danger"}>
                  {p.points > 0 ? "+" : ""}
                  {p.points} → {p.balance_after}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-card border border-line bg-surface p-4 text-sm">
          <h2 className="mb-2 font-display text-lg font-semibold">แลกรางวัล / คูปอง / การจอง</h2>
          <ul className="flex flex-col gap-1 text-xs">
            {(redemptions ?? []).map((r) => (
              <li key={r.id}>
                🎁 {r.reward_name} (−{r.points_used}) · {r.status}
              </li>
            ))}
            {(coupons ?? []).map((c) => (
              <li key={c.id}>
                🎟 {c.code} · {c.used_at ? "ใช้แล้ว" : `หมดอายุ ${formatThaiDate(c.expires_at)}`}
              </li>
            ))}
            {(bookings ?? []).map((b) => (
              <li key={b.id}>
                📅 {b.booking_number} · {b.booking_date} · {b.status}
              </li>
            ))}
            {!redemptions?.length && !coupons?.length && !bookings?.length && (
              <li className="text-ink-muted">-</li>
            )}
          </ul>
        </section>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-semibold">คำสั่งซื้อ ({orders?.length ?? 0})</h2>
        <ul className="flex flex-col gap-2">
          {(orders ?? []).map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-3 text-sm hover:border-brand-accent"
              >
                <span className="font-mono font-semibold">{o.order_number}</span>
                <span className="text-ink-muted">{formatThaiDate(o.created_at)}</span>
                <span className="ml-auto font-semibold">{formatTHB(o.total_amount)}</span>
                <OrderStatusBadge status={o.status as OrderStatus} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
