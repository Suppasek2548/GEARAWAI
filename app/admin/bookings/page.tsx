import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { updateBookingAction } from "@/lib/actions/admin-marketing";
import { formatTHB, formatThaiDate } from "@/lib/utils/format";
import { ActionButton } from "@/components/admin/action-button";
import { AdminPageHeader, AdminShell, AdminTable, FilterLinks, sp1, td, th } from "@/components/admin/ui";
import { Badge, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Bookings" };

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
const LABEL = { pending: "รอยืนยัน", confirmed: "ยืนยันแล้ว", completed: "เสร็จสิ้น", cancelled: "ยกเลิก" } as const;
const TONE = { pending: "warning", confirmed: "info", completed: "success", cancelled: "danger" } as const;

/** ADMIN §4.15 — pending → confirmed/cancelled · confirmed → completed/cancelled (no skipping). */
export default function BookingsAdminPage({ searchParams }: PageProps<"/admin/bookings">) {
  return (
    <AdminShell>
      <AdminPageHeader title="Bookings" description="ช่วงเวลาที่ยกเลิกจะกลับมาว่างให้จองได้ทันที" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <List searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

async function List({ searchParams }: { searchParams: PageProps<"/admin/bookings">["searchParams"] }) {
  const sp = await searchParams;
  const raw = sp1(sp.status);
  const status =
    raw === "all"
      ? null
      : (STATUSES as readonly string[]).includes(raw)
        ? (raw as (typeof STATUSES)[number])
        : "pending";
  const service = sp1(sp.service);
  const supabase = await createClient();
  let q = supabase
    .from("bookings")
    .select(
      "id, booking_number, booking_date, time_slot, status, contact_name, contact_phone, contact_email, note, admin_note, price_snapshot, is_demo, services(name)",
    )
    .order("booking_date")
    .order("time_slot");
  if (status) q = q.eq("status", status);
  if (/^[0-9a-f-]{36}$/i.test(service)) q = q.eq("service_id", service);
  const [{ data }, { data: services }] = await Promise.all([
    q,
    supabase.from("services").select("id, name").order("sort_order"),
  ]);
  const href = (s: string | null, svc = service) => {
    const p = new URLSearchParams();
    p.set("status", s ?? "all");
    if (svc) p.set("service", svc);
    return `/admin/bookings?${p}`;
  };

  return (
    <>
      <FilterLinks
        current={status}
        items={[
          ...STATUSES.map((s) => ({ href: href(s), label: LABEL[s], value: s })),
          { href: href(null), label: "ทั้งหมด", value: null },
        ]}
      />
      <FilterLinks
        label="บริการ"
        current={service || null}
        items={[
          { href: href(status, ""), label: "ทุกบริการ", value: null },
          ...(services ?? []).map((s) => ({ href: href(status, s.id), label: s.name, value: s.id })),
        ]}
      />
      <AdminTable minWidth={980}>
        <thead className="bg-surface">
          <tr>
            <th className={th}>เลขที่</th>
            <th className={th}>บริการ</th>
            <th className={th}>วัน / เวลา</th>
            <th className={th}>ผู้จอง</th>
            <th className={th}>สถานะ</th>
            <th className={th}>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((b) => {
            const st = b.status as (typeof STATUSES)[number];
            return (
              <tr key={b.id} className="border-t border-line align-top">
                <td className={`${td} font-mono`}>
                  {b.booking_number}
                  {b.is_demo && <Badge className="ml-2">Demo</Badge>}
                </td>
                <td className={td}>
                  {b.services?.name}
                  <span className="block text-xs text-ink-muted">
                    {formatTHB(b.price_snapshot)} (ชำระที่ร้าน)
                  </span>
                </td>
                <td className={td}>
                  {formatThaiDate(`${b.booking_date}T00:00:00+07:00`, { dateStyle: "medium" })}
                  <span className="block font-semibold">{String(b.time_slot).slice(0, 5)} น.</span>
                </td>
                <td className={td}>
                  {b.contact_name}
                  <span className="block text-xs text-ink-muted">
                    {b.contact_phone} · {b.contact_email}
                  </span>
                  {b.note && <span className="block text-xs text-ink-soft">“{b.note}”</span>}
                </td>
                <td className={td}>
                  <Badge tone={TONE[st]}>{LABEL[st]}</Badge>
                  {b.admin_note && (
                    <span className="block text-xs text-ink-muted">หมายเหตุ: {b.admin_note}</span>
                  )}
                </td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1">
                    {st === "pending" && (
                      <ActionButton
                        label="ยืนยัน"
                        variant="primary"
                        run={async () => {
                          "use server";
                          return updateBookingAction(b.id, "confirmed", "");
                        }}
                      />
                    )}
                    {st === "confirmed" && (
                      <ActionButton
                        label="เสร็จสิ้น"
                        variant="primary"
                        confirm={{ title: `บันทึกว่า ${b.booking_number} เสร็จสิ้น?` }}
                        run={async () => {
                          "use server";
                          return updateBookingAction(b.id, "completed", "");
                        }}
                      />
                    )}
                    {(st === "pending" || st === "confirmed") && (
                      <ActionButton
                        label="ยกเลิก"
                        danger
                        input={{ label: "หมายเหตุถึงลูกค้า" }}
                        confirm={{
                          title: `ยกเลิก ${b.booking_number}?`,
                          description: "ช่วงเวลานี้จะกลับมาว่างให้ผู้อื่นจองได้",
                        }}
                        run={async (note) => {
                          "use server";
                          return updateBookingAction(b.id, "cancelled", note);
                        }}
                      />
                    )}
                    <ActionButton
                      label="หมายเหตุ"
                      variant="ghost"
                      input={{ label: "Admin Note", required: true }}
                      confirm={{ title: "บันทึกหมายเหตุ" }}
                      run={async (note) => {
                        "use server";
                        return updateBookingAction(b.id, null, note);
                      }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </AdminTable>
      {(data ?? []).length === 0 && <p className="text-ink-soft">ไม่มีรายการ</p>}
    </>
  );
}
