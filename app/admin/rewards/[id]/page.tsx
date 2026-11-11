import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { saveRewardAction } from "@/lib/actions/admin-members";
import { UUID_RE } from "@/lib/admin/guard";
import { EntityForm, type FieldDef } from "@/components/admin/entity-form";
import { AdminPageHeader, AdminShell } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Reward" };

const FIELDS: FieldDef[] = [
  { name: "name", label: "ชื่อของรางวัล", type: "text", required: true, maxLength: 150 },
  { name: "points_required", label: "คะแนนที่ใช้", type: "number", required: true, min: 1 },
  { name: "stock_quantity", label: "จำนวนคงเหลือ", type: "number", required: true, min: 0 },
  { name: "sort_order", label: "ลำดับ", type: "number", min: 0 },
  { name: "description", label: "รายละเอียด", type: "textarea", maxLength: 1000 },
  { name: "image_url", label: "ภาพ (600×600)", type: "image", category: "reward" },
  { name: "is_active", label: "เปิดให้แลก", type: "checkbox" },
  { name: "is_demo", label: "ข้อมูลตัวอย่าง (Demo)", type: "checkbox" },
];

/** D-06: rewards are physical items only (no coupon-type rewards). */
export default function RewardEditPage({ params }: PageProps<"/admin/rewards/[id]">) {
  return (
    <AdminShell>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Editor params={params} />
      </Suspense>
    </AdminShell>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/rewards/[id]">["params"] }) {
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !UUID_RE.test(id)) notFound();
  let defaults: Record<string, string | number | boolean | null> = {
    is_active: true,
    sort_order: 0,
    stock_quantity: 0,
  };
  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase.from("rewards").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    defaults = data;
  }
  return (
    <>
      <AdminPageHeader
        title={isNew ? "เพิ่มของรางวัล" : `แก้ไข: ${defaults.name}`}
        description="ของรางวัลเป็นของที่จับต้องได้เท่านั้น (D-06)"
      />
      <EntityForm
        fields={FIELDS}
        defaults={defaults}
        action={saveRewardAction.bind(null, isNew ? null : id)}
        cancelHref="/admin/rewards?tab=rewards"
      />
    </>
  );
}
