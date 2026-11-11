import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { saveTeamMemberAction } from "@/lib/actions/admin-content";
import { UUID_RE } from "@/lib/admin/guard";
import { EntityForm, type FieldDef } from "@/components/admin/entity-form";
import { AdminPageHeader, AdminShell } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Team Member" };

const FIELDS: FieldDef[] = [
  {
    name: "full_name",
    label: "ชื่อ-นามสกุล",
    type: "text",
    required: true,
    maxLength: 100,
    hint: "ห้ามแต่งชื่อบุคคลจริงขึ้นเอง — ใช้ข้อมูลจริงของทีมหรือข้อมูลตัวอย่าง",
  },
  { name: "position", label: "ตำแหน่ง / หน้าที่", type: "text", required: true, maxLength: 100 },
  { name: "sort_order", label: "ลำดับ", type: "number", min: 0 },
  { name: "description", label: "คำอธิบายหน้าที่", type: "textarea", maxLength: 500 },
  { name: "image_url", label: "รูป (600×600)", type: "image", category: "team" },
  { name: "is_active", label: "แสดงในหน้า About", type: "checkbox" },
  { name: "is_demo", label: "ข้อมูลตัวอย่าง (แสดงป้าย)", type: "checkbox" },
];

export default function TeamMemberPage({ params }: PageProps<"/admin/settings/team/[id]">) {
  return (
    <AdminShell>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Editor params={params} />
      </Suspense>
    </AdminShell>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/settings/team/[id]">["params"] }) {
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !UUID_RE.test(id)) notFound();
  let defaults: Record<string, string | number | boolean | null> = { is_active: true, sort_order: 0 };
  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase.from("team_members").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    defaults = data;
  }
  return (
    <>
      <AdminPageHeader title={isNew ? "เพิ่มสมาชิกทีม" : `แก้ไข: ${defaults.full_name}`} />
      <EntityForm
        fields={FIELDS}
        defaults={defaults}
        action={saveTeamMemberAction.bind(null, isNew ? null : id)}
        cancelHref="/admin/settings?tab=about"
      />
    </>
  );
}
