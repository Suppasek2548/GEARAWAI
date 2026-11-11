import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { saveCouponAction } from "@/lib/actions/admin-marketing";
import { UUID_RE } from "@/lib/admin/guard";
import { isoToLocal } from "@/lib/admin/form";
import { EntityForm, type FieldDef } from "@/components/admin/entity-form";
import { AdminPageHeader, AdminShell } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Coupon" };

const FIELDS: FieldDef[] = [
  {
    name: "code",
    label: "รหัส (ตัวพิมพ์ใหญ่)",
    type: "text",
    maxLength: 40,
    uppercase: true,
    hint: "บังคับสำหรับคูปองทั่วไป · แม่แบบวันเกิดเว้นว่าง (ระบบออกรหัสให้สมาชิก)",
  },
  { name: "name", label: "ชื่อคูปอง", type: "text", required: true, maxLength: 150 },
  {
    name: "coupon_type",
    label: "ประเภท",
    type: "select",
    required: true,
    options: [
      { value: "general", label: "general — ทั่วไป" },
      { value: "birthday", label: "birthday — แม่แบบวันเกิด" },
    ],
  },
  {
    name: "discount_type",
    label: "Discount Type",
    type: "select",
    required: true,
    options: [
      { value: "percentage", label: "เปอร์เซ็นต์ (%)" },
      { value: "fixed_amount", label: "จำนวนเงิน (บาท)" },
    ],
  },
  { name: "discount_value", label: "Discount Value", type: "number", required: true, step: "0.01", min: 0 },
  { name: "max_discount_amount", label: "เพดานส่วนลด (บาท)", type: "number", step: "0.01", min: 0 },
  { name: "min_order_amount", label: "ยอดขั้นต่ำ (บาท)", type: "number", step: "0.01", min: 0 },
  { name: "usage_limit", label: "จำกัดจำนวนครั้งรวม", type: "number", min: 1, hint: "เว้นว่าง = ไม่จำกัด" },
  { name: "per_user_limit", label: "จำกัดต่อคน", type: "number", required: true, min: 1 },
  {
    name: "valid_days_after_claim",
    label: "ใช้ได้กี่วันหลังรับ (วันเกิด)",
    type: "number",
    min: 1,
    hint: "เว้นว่าง = หมดอายุต้นเดือนถัดไป",
  },
  { name: "start_at", label: "เริ่ม (เวลาไทย)", type: "datetime-local" },
  { name: "end_at", label: "สิ้นสุด (เวลาไทย)", type: "datetime-local" },
  { name: "description", label: "คำอธิบาย", type: "textarea", maxLength: 500 },
  { name: "is_active", label: "เปิดใช้งาน", type: "checkbox" },
  { name: "is_demo", label: "ข้อมูลตัวอย่าง (Demo)", type: "checkbox" },
];

export default function CouponEditPage({ params }: PageProps<"/admin/coupons/[id]">) {
  return (
    <AdminShell>
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <Editor params={params} />
      </Suspense>
    </AdminShell>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/coupons/[id]">["params"] }) {
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !UUID_RE.test(id)) notFound();
  let defaults: Record<string, string | number | boolean | null> = {
    coupon_type: "general",
    discount_type: "percentage",
    min_order_amount: 0,
    per_user_limit: 1,
    is_active: true,
  };
  let used = 0;
  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase.from("coupons").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    used = data.used_count;
    defaults = { ...data, start_at: isoToLocal(data.start_at), end_at: isoToLocal(data.end_at) };
  }
  return (
    <>
      <AdminPageHeader
        title={isNew ? "เพิ่มคูปอง" : `แก้ไขคูปอง: ${defaults.code ?? defaults.name}`}
        description={!isNew ? `ใช้ไปแล้ว ${used} ครั้ง (อ่านอย่างเดียว — ระบบนับให้อัตโนมัติ)` : undefined}
      />
      <EntityForm
        fields={FIELDS}
        defaults={defaults}
        action={saveCouponAction.bind(null, isNew ? null : id)}
        cancelHref="/admin/coupons"
      />
    </>
  );
}
