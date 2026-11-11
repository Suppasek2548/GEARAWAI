import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteServiceAction } from "@/lib/actions/admin-marketing";
import { formatTHB } from "@/lib/utils/format";
import { ActionButton } from "@/components/admin/action-button";
import { AdminPageHeader, AdminShell, AdminTable, td, th } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Services" };

/** ADMIN §4.14 — time slots / closed days / max days ahead live in Settings → Booking. */
export default function ServicesAdminPage() {
  return (
    <AdminShell>
      <AdminPageHeader
        title="Services"
        description="ชำระค่าบริการที่ร้าน · ตั้งค่าช่วงเวลา วันปิด และจองล่วงหน้าสูงสุดได้ที่ Settings → Booking"
        actions={
          <ButtonLink href="/admin/services/new">
            <Plus className="size-4" aria-hidden /> เพิ่มบริการ
          </ButtonLink>
        }
      />
      <Suspense fallback={<Skeleton className="h-80" />}>
        <List />
      </Suspense>
    </AdminShell>
  );
}

async function List() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, name, slug, price, duration_minutes, is_active, is_demo, bookings(id)")
    .order("sort_order");
  return (
    <AdminTable minWidth={720}>
      <thead className="bg-surface">
        <tr>
          <th className={th}>บริการ</th>
          <th className={`${th} text-right`}>ราคา</th>
          <th className={`${th} text-right`}>นาที</th>
          <th className={`${th} text-right`}>การจอง</th>
          <th className={th}>สถานะ</th>
          <th className={th}>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        {(data ?? []).map((s) => (
          <tr key={s.id} className="border-t border-line">
            <td className={`${td} font-semibold`}>
              <Link href={`/admin/services/${s.id}`} className="hover:text-brand-accent">
                {s.name}
              </Link>
              {s.is_demo && <Badge className="ml-2">Demo</Badge>}
            </td>
            <td className={`${td} text-right`}>{formatTHB(s.price)}</td>
            <td className={`${td} text-right`}>{s.duration_minutes}</td>
            <td className={`${td} text-right`}>{s.bookings.length}</td>
            <td className={td}>
              <Badge tone={s.is_active ? "success" : "neutral"}>{s.is_active ? "เปิด" : "ปิด"}</Badge>
            </td>
            <td className={td}>
              <div className="flex gap-1">
                <ButtonLink href={`/admin/services/${s.id}`} size="sm" variant="outline">
                  แก้ไข
                </ButtonLink>
                <ActionButton
                  label="ลบ"
                  danger
                  confirm={{
                    title: `ลบบริการ “${s.name}”?`,
                    description: "ลบไม่ได้ถ้ามีการจองแล้ว — ปิดสถานะแทน",
                    confirmLabel: "ลบ",
                  }}
                  run={async () => {
                    "use server";
                    return deleteServiceAction(s.id);
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
