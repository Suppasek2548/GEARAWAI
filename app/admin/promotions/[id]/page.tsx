import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { savePromotionAction } from "@/lib/actions/admin-marketing";
import { UUID_RE } from "@/lib/admin/guard";
import { isoToLocal } from "@/lib/admin/form";
import { EntityForm, type FieldDef } from "@/components/admin/entity-form";
import { PromotionProducts } from "@/components/admin/promotion-products";
import { AdminPageHeader, AdminShell } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Promotion" };

const FIELDS: FieldDef[] = [
  { name: "name", label: "Promotion Name", type: "text", required: true, maxLength: 150 },
  { name: "slug", label: "Slug", type: "slug", source: "name", required: true },
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
  { name: "start_at", label: "Start (เวลาไทย)", type: "datetime-local", required: true },
  { name: "end_at", label: "End (เวลาไทย)", type: "datetime-local", required: true },
  { name: "sort_order", label: "ลำดับ", type: "number", min: 0 },
  { name: "description", label: "Promotion Description", type: "textarea", maxLength: 1000 },
  { name: "banner_desktop_url", label: "Banner Desktop (1200×600)", type: "image", category: "promotion" },
  { name: "banner_mobile_url", label: "Banner Mobile (750×1000)", type: "image", category: "promotion" },
  { name: "is_active", label: "เปิดใช้งาน (Promotion Status)", type: "checkbox" },
  { name: "show_on_homepage", label: "แสดงบนหน้าแรก", type: "checkbox" },
  { name: "is_demo", label: "ข้อมูลตัวอย่าง (Demo)", type: "checkbox" },
];

export default function PromotionEditPage({ params }: PageProps<"/admin/promotions/[id]">) {
  return (
    <AdminShell>
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <Editor params={params} />
      </Suspense>
    </AdminShell>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/promotions/[id]">["params"] }) {
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !UUID_RE.test(id)) notFound();
  const supabase = await createClient();
  const [promo, { data: products }] = await Promise.all([
    isNew
      ? Promise.resolve({ data: null })
      : supabase.from("promotions").select("*, promotion_products(product_id)").eq("id", id).maybeSingle(),
    supabase.from("products").select("id, name, sku, price, sale_price, categories(name)").order("name"),
  ]);
  if (!isNew && !promo.data) notFound();
  const p = promo.data;
  const defaults = p
    ? { ...p, start_at: isoToLocal(p.start_at), end_at: isoToLocal(p.end_at) }
    : { discount_type: "percentage", is_active: true, sort_order: 0 };

  return (
    <>
      <AdminPageHeader title={isNew ? "เพิ่มโปรโมชั่น" : `แก้ไขโปรโมชั่น: ${p!.name}`} />
      <EntityForm
        fields={FIELDS}
        defaults={defaults as Record<string, string | number | boolean | null>}
        action={savePromotionAction.bind(null, isNew ? null : id)}
        cancelHref="/admin/promotions"
      />
      {!isNew && (
        <PromotionProducts
          promotionId={id}
          discountType={p!.discount_type}
          discountValue={Number(p!.discount_value)}
          selected={p!.promotion_products.map((x) => x.product_id)}
          products={(products ?? []).map((x) => ({
            id: x.id,
            name: x.name,
            sku: x.sku,
            price: Number(x.price),
            sale_price: x.sale_price === null ? null : Number(x.sale_price),
            category: x.categories?.name ?? "",
          }))}
        />
      )}
    </>
  );
}
