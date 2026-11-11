import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { formatThaiDateTime } from "@/lib/utils/format";
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
import { Badge, Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";
import { MESSAGE_STATUS } from "@/lib/admin/labels";
import { localDayToIso } from "@/lib/admin/form";

export const metadata: Metadata = { title: "Contact Messages" };

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** ADMIN §4.17 — default filter: new. */
export default function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  return (
    <AdminShell>
      <AdminPageHeader title="Contact Messages" description="ตอบกลับผ่านอีเมลภายนอก แล้วทำเครื่องหมาย “ตอบแล้ว”" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <List searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

async function List({ searchParams }: { searchParams: PageProps<"/admin/messages">["searchParams"] }) {
  const sp = await searchParams;
  const raw = sp1(sp.status);
  const status = raw === "all" ? null : raw in MESSAGE_STATUS ? (raw as keyof typeof MESSAGE_STATUS) : "new";
  const q = sp1(sp.q)
    .replace(/[%_,()*"\\]/g, " ")
    .trim();
  const supabase = await createClient();
  let query = supabase
    .from("contact_messages")
    .select("id, name, email, subject, status, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const from = DAY_RE.test(sp1(sp.from)) ? sp1(sp.from) : "";
  const to = DAY_RE.test(sp1(sp.to)) ? sp1(sp.to) : "";
  if (from) query = query.gte("created_at", localDayToIso(from));
  if (to) query = query.lt("created_at", localDayToIso(to, 1));
  if (q) query = query.or(`name.ilike."*${q}*",email.ilike."*${q}*",subject.ilike."*${q}*"`);
  const { data } = await query;

  return (
    <>
      <FilterLinks
        current={status}
        items={[
          ...Object.entries(MESSAGE_STATUS).map(([k, v]) => ({
            href: `/admin/messages?status=${k}`,
            label: v.label,
            value: k,
          })),
          { href: "/admin/messages?status=all", label: "ทั้งหมด", value: null },
        ]}
      />
      <div className="flex flex-wrap items-end gap-3">
        <AdminSearch
          action="/admin/messages"
          q={q}
          placeholder="ชื่อ / อีเมล / หัวข้อ"
          hidden={{ status: status ?? "all", from, to }}
        />
        <form action="/admin/messages" className="flex flex-wrap items-end gap-2 text-sm">
          <input type="hidden" name="status" value={status ?? "all"} />
          {q && <input type="hidden" name="q" value={q} />}
          <label className="flex flex-col gap-1">
            <span className="text-ink-soft">ตั้งแต่</span>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="h-10 rounded-btn border border-line bg-surface px-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-ink-soft">ถึง</span>
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="h-10 rounded-btn border border-line bg-surface px-2"
            />
          </label>
          <button
            type="submit"
            className="h-10 cursor-pointer rounded-btn border border-line px-4 hover:border-brand-accent"
          >
            กรอง
          </button>
        </form>
      </div>
      <AdminTable minWidth={760}>
        <thead className="bg-surface">
          <tr>
            <th className={th}>สถานะ</th>
            <th className={th}>ผู้ส่ง</th>
            <th className={th}>หัวข้อ</th>
            <th className={th}>วันที่</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((m) => {
            const s = MESSAGE_STATUS[m.status as keyof typeof MESSAGE_STATUS];
            return (
              <tr key={m.id} className={cn("border-t border-line", m.status === "new" && "font-semibold")}>
                <td className={td}>
                  <Badge tone={s.tone}>{s.label}</Badge>
                </td>
                <td className={td}>
                  {m.name}
                  <span className="block text-xs font-normal text-ink-muted">
                    {m.email} · {m.user_id ? "สมาชิก" : "Guest"}
                  </span>
                </td>
                <td className={td}>
                  <Link href={`/admin/messages/${m.id}`} className="hover:text-brand-accent">
                    {m.subject}
                  </Link>
                </td>
                <td className={`${td} font-normal text-ink-soft`}>{formatThaiDateTime(m.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </AdminTable>
      {(data ?? []).length === 0 && <p className="text-ink-soft">ไม่มีข้อความ</p>}
    </>
  );
}
