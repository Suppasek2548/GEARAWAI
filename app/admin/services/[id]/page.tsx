import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { saveServiceAction } from "@/lib/actions/admin-marketing";
import { UUID_RE } from "@/lib/admin/guard";
import { EntityForm, type FieldDef } from "@/components/admin/entity-form";
import { AdminPageHeader, AdminShell } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Service" };

const FIELDS: FieldDef[] = [
  { name: "name", label: "ชื่อบริการ", type: "text", required: true, maxLength: 150 },
  { name: "slug", label: "Slug", type: "slug", source: "name", required: true },
  { name: "price", label: "ราคา (บาท, ชำระที่ร้าน)", type: "number", required: true, step: "0.01", min: 0 },
  { name: "duration_minutes", label: "ระยะเวลา (นาที)", type: "number", required: true, min: 1 },
  { name: "sort_order", label: "ลำดับ", type: "number", min: 0 },
  { name: "description", label: "รายละเอียด", type: "textarea", maxLength: 1000 },
  { name: "image_url", label: "ภาพบริการ (600×400)", type: "image", category: "service" },
  { name: "is_active", label: "เปิดให้จอง", type: "checkbox" },
  { name: "is_demo", label: "ข้อมูลตัวอย่าง (Demo)", type: "checkbox" },
];

export default function ServiceEditPage({ params }: PageProps<"/admin/services/[id]">) {
  return (
    <AdminShell>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Editor params={params} />
      </Suspense>
    </AdminShell>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/services/[id]">["params"] }) {
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !UUID_RE.test(id)) notFound();
  let defaults: Record<string, string | number | boolean | null> = {
    is_active: true,
    sort_order: 0,
    price: 0,
    duration_minutes: 60,
  };
  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase.from("services").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    defaults = data;
  }
  return (
    <>
      <AdminPageHeader title={isNew ? "เพิ่มบริการ" : `แก้ไขบริการ: ${defaults.name}`} />
      <EntityForm
        fields={FIELDS}
        defaults={defaults}
        action={saveServiceAction.bind(null, isNew ? null : id)}
        cancelHref="/admin/services"
      />
    </>
  );
}
