import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { saveProductAction } from "@/lib/actions/admin-catalog";
import { UUID_RE } from "@/lib/admin/guard";
import { EntityForm, type FieldDef } from "@/components/admin/entity-form";
import { ProductImagesEditor } from "@/components/admin/product-images-editor";
import { AdminPageHeader, AdminShell } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Product" };

export default function ProductEditPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <AdminShell>
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <Editor params={params} />
      </Suspense>
    </AdminShell>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/products/[id]">["params"] }) {
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !UUID_RE.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: cats }, { data: brands }, product] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("brands").select("id, name").order("name"),
    isNew
      ? Promise.resolve({ data: null })
      : supabase
          .from("products")
          .select("*, product_images(id, image_url, is_primary, sort_order)")
          .eq("id", id)
          .maybeSingle(),
  ]);
  if (!isNew && !product.data) notFound();
  const p = product.data;

  const fields: FieldDef[] = [
    {
      name: "sku",
      label: "SKU (Product ID)",
      type: "text",
      required: true,
      maxLength: 9,
      placeholder: "GA-MS-001",
      uppercase: true,
    },
    { name: "name", label: "ชื่อสินค้า", type: "text", required: true, maxLength: 150 },
    { name: "slug", label: "Slug (URL)", type: "slug", source: "name", required: true },
    {
      name: "brand_id",
      label: "แบรนด์",
      type: "select",
      required: true,
      options: (brands ?? []).map((b) => ({ value: b.id, label: b.name })),
    },
    {
      name: "category_id",
      label: "หมวดหมู่",
      type: "select",
      required: true,
      options: (cats ?? []).map((c) => ({ value: c.id, label: c.name })),
    },
    { name: "price", label: "ราคา (บาท)", type: "number", required: true, step: "0.01", min: 0 },
    {
      name: "sale_price",
      label: "ราคาลด (ไม่บังคับ)",
      type: "number",
      step: "0.01",
      min: 0,
      hint: "ต้องน้อยกว่าราคาปกติ",
    },
    ...(isNew
      ? ([
          {
            name: "stock_quantity",
            label: "สต็อกเริ่มต้น",
            type: "number",
            min: 0,
            hint: "หลังสร้างแล้วปรับได้ที่เมนู Stock เท่านั้น",
          },
        ] as FieldDef[])
      : []),
    { name: "low_stock_threshold", label: "เกณฑ์สต็อกต่ำ", type: "number", min: 0 },
    {
      name: "status",
      label: "สถานะ",
      type: "select",
      required: true,
      options: [
        { value: "active", label: "active — แสดงในร้าน" },
        { value: "inactive", label: "inactive — ปิดการขาย" },
      ],
    },
    { name: "short_description", label: "คำอธิบายสั้น (บน Card, ≤ 200)", type: "textarea", maxLength: 200 },
    { name: "description", label: "รายละเอียด", type: "textarea", maxLength: 5000 },
    { name: "specifications", label: "Specifications", type: "kv" },
    { name: "is_featured", label: "Featured — แสดงในสินค้าแนะนำหน้าแรก", type: "checkbox" },
    { name: "is_demo", label: "ข้อมูลตัวอย่าง (Demo)", type: "checkbox" },
  ];

  const defaults = p
    ? { ...p, specifications: (p.specifications ?? {}) as Record<string, string> }
    : { status: "active", low_stock_threshold: 5, stock_quantity: 0 };

  return (
    <>
      <AdminPageHeader
        title={isNew ? "เพิ่มสินค้า" : `แก้ไขสินค้า: ${p!.name}`}
        description={!isNew ? `สต็อกปัจจุบัน ${p!.stock_quantity} ชิ้น · ขายแล้ว ${p!.sold_count}` : undefined}
        actions={
          !isNew ? (
            <>
              <ButtonLink href={`/admin/stock?product=${id}`} variant="outline">
                ปรับสต็อก
              </ButtonLink>
              <ButtonLink href={`/shop/${p!.slug}`} variant="ghost" target="_blank">
                ดูหน้าร้าน ↗
              </ButtonLink>
            </>
          ) : undefined
        }
      />
      <EntityForm
        fields={fields}
        defaults={defaults as Record<string, string | number | boolean | null | Record<string, string>>}
        action={saveProductAction.bind(null, isNew ? null : id)}
        cancelHref="/admin/products"
      />
      {!isNew && (
        <ProductImagesEditor
          productId={id}
          productName={p!.name}
          images={[...(p!.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)}
        />
      )}
    </>
  );
}
