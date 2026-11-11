import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { saveCategoryAction } from "@/lib/actions/admin-catalog";
import { UUID_RE } from "@/lib/admin/guard";
import { EntityForm, type FieldDef } from "@/components/admin/entity-form";
import { AdminPageHeader, AdminShell } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Category" };

const FIELDS: FieldDef[] = [
  { name: "name", label: "ชื่อหมวดหมู่", type: "text", required: true, maxLength: 80 },
  { name: "slug", label: "Slug", type: "slug", source: "name", required: true },
  { name: "description", label: "คำอธิบาย", type: "textarea", maxLength: 500 },
  { name: "image_url", label: "ภาพหมวดหมู่ (600×600)", type: "image", category: "category" },
  { name: "sort_order", label: "ลำดับ", type: "number", min: 0 },
  { name: "is_active", label: "เปิดใช้งาน", type: "checkbox" },
  { name: "is_demo", label: "ข้อมูลตัวอย่าง (Demo)", type: "checkbox" },
];

export default function CategoryEditPage({ params }: PageProps<"/admin/categories/[id]">) {
  return (
    <AdminShell>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Editor params={params} />
      </Suspense>
    </AdminShell>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/categories/[id]">["params"] }) {
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !UUID_RE.test(id)) notFound();
  let defaults: Record<string, string | number | boolean | null> = { sort_order: 0, is_active: true };
  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    defaults = data;
  }
  return (
    <>
      <AdminPageHeader title={isNew ? "เพิ่มหมวดหมู่" : `แก้ไขหมวดหมู่: ${defaults.name}`} />
      <EntityForm
        fields={FIELDS}
        defaults={defaults}
        action={saveCategoryAction.bind(null, isNew ? null : id)}
        cancelHref="/admin/categories"
      />
    </>
  );
}
