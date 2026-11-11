import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { saveBrandAction } from "@/lib/actions/admin-catalog";
import { UUID_RE } from "@/lib/admin/guard";
import { EntityForm, type FieldDef } from "@/components/admin/entity-form";
import { AdminPageHeader, AdminShell } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Brand" };

const FIELDS: FieldDef[] = [
  { name: "name", label: "ชื่อแบรนด์", type: "text", required: true, maxLength: 80 },
  { name: "slug", label: "Slug", type: "slug", source: "name", required: true },
  { name: "logo_url", label: "โลโก้ (ไม่บังคับ)", type: "image", category: "other" },
  { name: "is_active", label: "เปิดใช้งาน", type: "checkbox" },
  { name: "is_demo", label: "ข้อมูลตัวอย่าง (Demo)", type: "checkbox" },
];

export default function BrandEditPage({ params }: PageProps<"/admin/brands/[id]">) {
  return (
    <AdminShell>
      <Suspense fallback={<Skeleton className="h-80" />}>
        <Editor params={params} />
      </Suspense>
    </AdminShell>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/brands/[id]">["params"] }) {
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !UUID_RE.test(id)) notFound();
  let defaults: Record<string, string | number | boolean | null> = { is_active: true };
  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase.from("brands").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    defaults = data;
  }
  return (
    <>
      <AdminPageHeader title={isNew ? "เพิ่มแบรนด์" : `แก้ไขแบรนด์: ${defaults.name}`} />
      <EntityForm
        fields={FIELDS}
        defaults={defaults}
        action={saveBrandAction.bind(null, isNew ? null : id)}
        cancelHref="/admin/brands"
      />
    </>
  );
}
