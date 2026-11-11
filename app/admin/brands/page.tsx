import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteBrandAction } from "@/lib/actions/admin-catalog";
import { ActionButton } from "@/components/admin/action-button";
import { AdminPageHeader, AdminShell, AdminTable, td, th } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Brands" };

/** ADMIN §4.4 */
export default function BrandsAdminPage() {
  return (
    <AdminShell>
      <AdminPageHeader
        title="Brands"
        description="มีผลกับตัวกรองแบรนด์และการค้นหาจากชื่อแบรนด์ · ลบได้เฉพาะแบรนด์ที่ไม่มีสินค้า"
        actions={
          <ButtonLink href="/admin/brands/new">
            <Plus className="size-4" aria-hidden /> เพิ่มแบรนด์
          </ButtonLink>
        }
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <List />
      </Suspense>
    </AdminShell>
  );
}

async function List() {
  const supabase = await createClient();
  const [{ data: brands }, { data: prods }] = await Promise.all([
    supabase.from("brands").select("id, name, slug, is_active, is_demo").order("name"),
    supabase.from("products").select("brand_id"),
  ]);
  return (
    <AdminTable minWidth={560}>
      <thead className="bg-surface">
        <tr>
          <th className={th}>ชื่อ</th>
          <th className={th}>slug</th>
          <th className={`${th} text-right`}>สินค้า</th>
          <th className={th}>สถานะ</th>
          <th className={th}>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        {(brands ?? []).map((b) => (
          <tr key={b.id} className="border-t border-line">
            <td className={`${td} font-semibold`}>
              <Link href={`/admin/brands/${b.id}`} className="hover:text-brand-accent">
                {b.name}
              </Link>
              {b.is_demo && <Badge className="ml-2">Demo</Badge>}
            </td>
            <td className={`${td} font-mono text-ink-soft`}>{b.slug}</td>
            <td className={`${td} text-right`}>{(prods ?? []).filter((p) => p.brand_id === b.id).length}</td>
            <td className={td}>
              <Badge tone={b.is_active ? "success" : "neutral"}>{b.is_active ? "เปิด" : "ปิด"}</Badge>
            </td>
            <td className={td}>
              <div className="flex gap-1">
                <ButtonLink href={`/admin/brands/${b.id}`} size="sm" variant="outline">
                  แก้ไข
                </ButtonLink>
                <ActionButton
                  label="ลบ"
                  danger
                  confirm={{ title: `ลบแบรนด์ “${b.name}”?`, confirmLabel: "ลบ" }}
                  run={async () => {
                    "use server";
                    return deleteBrandAction(b.id);
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
