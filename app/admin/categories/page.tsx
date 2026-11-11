import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteCategoryAction } from "@/lib/actions/admin-catalog";
import { ActionButton } from "@/components/admin/action-button";
import { AdminPageHeader, AdminShell, AdminTable, td, th } from "@/components/admin/ui";
import { CategoryIcon } from "@/components/products/category-icon";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Categories" };

/** ADMIN §4.3 */
export default function CategoriesAdminPage() {
  return (
    <AdminShell>
      <AdminPageHeader
        title="Categories"
        description="ปิดหมวด = ซ่อนหมวดและสินค้าในหมวดจากหน้าร้าน · ลบได้เฉพาะหมวดที่ไม่มีสินค้า"
        actions={
          <ButtonLink href="/admin/categories/new">
            <Plus className="size-4" aria-hidden /> เพิ่มหมวดหมู่
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
  const [{ data: cats }, { data: prods }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, image_url, sort_order, is_active, is_demo")
      .order("sort_order"),
    supabase.from("products").select("category_id"),
  ]);
  const count = (id: string) => (prods ?? []).filter((p) => p.category_id === id).length;

  return (
    <AdminTable minWidth={700}>
      <thead className="bg-surface">
        <tr>
          <th className={th}>ภาพ</th>
          <th className={th}>ชื่อ</th>
          <th className={th}>slug</th>
          <th className={`${th} text-right`}>สินค้า</th>
          <th className={`${th} text-right`}>ลำดับ</th>
          <th className={th}>สถานะ</th>
          <th className={th}>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        {(cats ?? []).map((c) => (
          <tr key={c.id} className="border-t border-line">
            <td className={td}>
              <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-btn bg-brand-gradient">
                {c.image_url ? (
                  <Image src={c.image_url} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                  <CategoryIcon slug={c.slug} className="size-6" />
                )}
              </div>
            </td>
            <td className={`${td} font-semibold`}>
              <Link href={`/admin/categories/${c.id}`} className="hover:text-brand-accent">
                {c.name}
              </Link>
              {c.is_demo && <Badge className="ml-2">Demo</Badge>}
            </td>
            <td className={`${td} font-mono text-ink-soft`}>{c.slug}</td>
            <td className={`${td} text-right`}>{count(c.id)}</td>
            <td className={`${td} text-right`}>{c.sort_order}</td>
            <td className={td}>
              <Badge tone={c.is_active ? "success" : "neutral"}>{c.is_active ? "เปิด" : "ปิด"}</Badge>
            </td>
            <td className={td}>
              <div className="flex gap-1">
                <ButtonLink href={`/admin/categories/${c.id}`} size="sm" variant="outline">
                  แก้ไข
                </ButtonLink>
                <ActionButton
                  label="ลบ"
                  danger
                  confirm={{
                    title: `ลบหมวด “${c.name}”?`,
                    description: "ลบได้เฉพาะหมวดที่ไม่มีสินค้า",
                    confirmLabel: "ลบ",
                  }}
                  run={async () => {
                    "use server";
                    return deleteCategoryAction(c.id);
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
