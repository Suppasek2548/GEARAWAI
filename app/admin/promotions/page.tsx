import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deletePromotionAction } from "@/lib/actions/admin-marketing";
import { promotionState } from "@/lib/admin/form";
import { formatTHB, formatThaiDateTime } from "@/lib/utils/format";
import { ActionButton } from "@/components/admin/action-button";
import { AdminPageHeader, AdminShell, AdminTable, td, th } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Promotions" };

/** ADMIN §4.12 — computed state: running / scheduled / expired / off. */
export default function PromotionsAdminPage() {
  return (
    <AdminShell>
      <AdminPageHeader
        title="Promotions"
        description="แสดงบนหน้าแรกและ /deals เฉพาะช่วงวันที่และเมื่อเปิดใช้งาน · ราคาในร้านใช้ราคาต่ำสุด (price / sale_price / โปรโมชั่น)"
        actions={
          <>
            <ButtonLink href="/deals" variant="ghost" target="_blank">
              Preview หน้า Deals <ExternalLink className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/admin/promotions/new">
              <Plus className="size-4" aria-hidden /> เพิ่มโปรโมชั่น
            </ButtonLink>
          </>
        }
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <List />
      </Suspense>
    </AdminShell>
  );
}

async function List() {
  const supabase = await createClient(); // request-time before reading the clock
  const { data } = await supabase
    .from("promotions")
    .select(
      "id, name, slug, discount_type, discount_value, start_at, end_at, is_active, show_on_homepage, is_demo, promotion_products(product_id)",
    )
    .order("sort_order")
    .order("start_at", { ascending: false });

  return (
    <AdminTable minWidth={900}>
      <thead className="bg-surface">
        <tr>
          <th className={th}>ชื่อ</th>
          <th className={th}>ส่วนลด</th>
          <th className={th}>ช่วงเวลา (เวลาไทย)</th>
          <th className={`${th} text-right`}>สินค้า</th>
          <th className={th}>สถานะ</th>
          <th className={th}>หน้าแรก</th>
          <th className={th}>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        {(data ?? []).map((p) => {
          const s = promotionState(p);
          return (
            <tr key={p.id} className="border-t border-line">
              <td className={`${td} font-semibold`}>
                <Link href={`/admin/promotions/${p.id}`} className="hover:text-brand-accent">
                  {p.name}
                </Link>
                {p.is_demo && <Badge className="ml-2">Demo</Badge>}
              </td>
              <td className={td}>
                {p.discount_type === "percentage"
                  ? `${Number(p.discount_value)}%`
                  : formatTHB(p.discount_value)}
              </td>
              <td className={`${td} text-xs text-ink-soft`}>
                {formatThaiDateTime(p.start_at)} –<br />
                {formatThaiDateTime(p.end_at)}
              </td>
              <td className={`${td} text-right`}>{p.promotion_products.length}</td>
              <td className={td}>
                <Badge tone={s.tone}>{s.label}</Badge>
              </td>
              <td className={td}>{p.show_on_homepage ? "✓" : "-"}</td>
              <td className={td}>
                <div className="flex gap-1">
                  <ButtonLink href={`/admin/promotions/${p.id}`} size="sm" variant="outline">
                    แก้ไข
                  </ButtonLink>
                  <ActionButton
                    label="ลบ"
                    danger
                    confirm={{
                      title: `ลบโปรโมชั่น “${p.name}”?`,
                      description: "รายการสินค้าที่เข้าร่วมจะถูกลบไปด้วย",
                      confirmLabel: "ลบ",
                    }}
                    run={async () => {
                      "use server";
                      return deletePromotionAction(p.id);
                    }}
                  />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </AdminTable>
  );
}
