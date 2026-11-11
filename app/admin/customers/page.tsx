import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { formatTHB, formatThaiDate } from "@/lib/utils/format";
import {
  AdminPageHeader,
  AdminSearch,
  AdminShell,
  AdminTable,
  FilterLinks,
  sp1,
  td,
  th,
} from "@/components/admin/ui";
import { MemberAvatar } from "@/components/dashboard/member-avatar";
import { Badge, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Customers" };

/** ADMIN §4.9 — members (no role editing here; first admin is set with SQL only). */
export default function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  return (
    <AdminShell>
      <AdminPageHeader
        title="Customers"
        description="Admin ไม่เห็นรหัสผ่าน (อยู่ใน Supabase Auth) · เปลี่ยนบทบาทเป็น Admin ได้ด้วย SQL เท่านั้น"
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <List searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

async function List({ searchParams }: { searchParams: PageProps<"/admin/customers">["searchParams"] }) {
  const sp = await searchParams;
  const q = sp1(sp.q)
    .replace(/[%_,()*"\\]/g, " ")
    .trim();
  const role = ["member", "admin"].includes(sp1(sp.role)) ? sp1(sp.role) : null;
  const status = ["active", "suspended"].includes(sp1(sp.status)) ? sp1(sp.status) : null;
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, role, account_status, points_balance, avatar_url, is_demo, created_at, orders(total_amount, status)",
    )
    .order("created_at", { ascending: false });
  if (q) query = query.or(`full_name.ilike."*${q}*",email.ilike."*${q}*",phone.ilike."*${q}*"`);
  if (role) query = query.eq("role", role as "member" | "admin");
  if (status) query = query.eq("account_status", status as "active" | "suspended");
  const { data } = await query;

  const href = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, role, status, ...patch })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/customers?${s}` : "/admin/customers";
  };

  return (
    <>
      <AdminSearch action="/admin/customers" q={q} placeholder="ชื่อ / อีเมล / เบอร์" hidden={{ role, status }} />
      <div className="flex flex-wrap gap-4">
        <FilterLinks
          label="บทบาท"
          current={role}
          items={[
            { href: href({ role: null }), label: "ทุกบทบาท", value: null },
            { href: href({ role: "member" }), label: "Member", value: "member" },
            { href: href({ role: "admin" }), label: "Admin", value: "admin" },
          ]}
        />
        <FilterLinks
          label="สถานะบัญชี"
          current={status}
          items={[
            { href: href({ status: null }), label: "ทุกสถานะ", value: null },
            { href: href({ status: "active" }), label: "ใช้งาน", value: "active" },
            { href: href({ status: "suspended" }), label: "ระงับ", value: "suspended" },
          ]}
        />
      </div>
      <AdminTable minWidth={900}>
        <thead className="bg-surface">
          <tr>
            <th className={th}>สมาชิก</th>
            <th className={th}>เบอร์</th>
            <th className={th}>บทบาท</th>
            <th className={th}>สถานะ</th>
            <th className={`${th} text-right`}>คะแนน</th>
            <th className={`${th} text-right`}>Order</th>
            <th className={`${th} text-right`}>ยอดซื้อรวม*</th>
            <th className={th}>สมัครเมื่อ</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((m) => {
            const spent = m.orders
              .filter((o) => ["paid", "shipped", "completed"].includes(o.status))
              .reduce((s, o) => s + Number(o.total_amount), 0);
            return (
              <tr key={m.id} className="border-t border-line">
                <td className={td}>
                  <Link
                    href={`/admin/customers/${m.id}`}
                    className="flex items-center gap-3 hover:text-brand-accent"
                  >
                    <MemberAvatar name={m.full_name} url={m.avatar_url} size={36} />
                    <span>
                      <span className="font-semibold">{m.full_name}</span>
                      <span className="block text-xs text-ink-muted">{m.email}</span>
                    </span>
                  </Link>
                </td>
                <td className={`${td} text-ink-soft`}>{m.phone ?? "-"}</td>
                <td className={td}>
                  <Badge tone={m.role === "admin" ? "info" : "neutral"}>{m.role}</Badge>
                </td>
                <td className={td}>
                  <Badge tone={m.account_status === "active" ? "success" : "danger"}>
                    {m.account_status === "active" ? "ใช้งาน" : "ระงับ"}
                  </Badge>
                </td>
                <td className={`${td} text-right`}>{m.points_balance.toLocaleString("th-TH")}</td>
                <td className={`${td} text-right`}>{m.orders.length}</td>
                <td className={`${td} text-right`}>{formatTHB(spent)}</td>
                <td className={`${td} text-ink-soft`}>{formatThaiDate(m.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </AdminTable>
      <p className="text-xs text-ink-muted">*ยอดซื้อรวมนับเฉพาะคำสั่งซื้อที่ชำระแล้ว / จัดส่ง / สำเร็จ</p>
    </>
  );
}
