import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  deleteTeamMemberAction,
  saveAboutSettingsAction,
  saveBookingSettingsAction,
  saveCommerceSettingsAction,
  saveContactSettingsAction,
  savePaymentSettingsAction,
  saveStoreSettingsAction,
  saveUploadSettingsAction,
} from "@/lib/actions/admin-content";
import { ActionButton } from "@/components/admin/action-button";
import { EntityForm, type FieldDef } from "@/components/admin/entity-form";
import { AdminPageHeader, AdminShell, AdminTable, FilterLinks, sp1, td, th } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Settings" };

const TABS = [
  ["store", "Store"],
  ["about", "About"],
  ["contact", "Contact"],
  ["commerce", "Commerce"],
  ["payment", "Payment"],
  ["booking", "Booking"],
  ["uploads", "Uploads"],
] as const;
type Tab = (typeof TABS)[number][0];

/** ADMIN §4.18 — site_settings by tab; every save refreshes the affected storefront pages. */
export default function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  return (
    <AdminShell>
      <AdminPageHeader title="Settings" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

type V = Record<string, unknown>;

async function Content({ searchParams }: { searchParams: PageProps<"/admin/settings">["searchParams"] }) {
  const sp = await searchParams;
  const tab = (TABS.map((t) => t[0]) as string[]).includes(sp1(sp.tab)) ? (sp1(sp.tab) as Tab) : "store";
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value");
  const s = Object.fromEntries((data ?? []).map((r) => [r.key, (r.value ?? {}) as V])) as Record<string, V>;
  const g = (key: string) => s[key] ?? {};

  return (
    <>
      <FilterLinks
        current={tab}
        items={TABS.map(([k, l]) => ({ href: `/admin/settings?tab=${k}`, label: l, value: k }))}
      />

      {tab === "store" && (
        <EntityForm
          action={saveStoreSettingsAction}
          defaults={{ ...g("store_info"), ...g("hero_banner") } as Record<string, string>}
          fields={[
            { name: "name", label: "ชื่อร้าน", type: "text", required: true },
            { name: "slogan", label: "Slogan", type: "text", required: true },
            { name: "tagline", label: "Tagline (ข้อความรองบน Hero)", type: "text" },
            { name: "cta_label", label: "ข้อความปุ่ม Hero", type: "text", required: true },
            {
              name: "cta_href",
              label: "ลิงก์ปุ่ม Hero",
              type: "text",
              required: true,
              hint: "path ภายในเว็บ เช่น /shop",
            },
            { name: "desktop_url", label: "Hero Desktop (1920×700)", type: "image", category: "banner" },
            { name: "tablet_url", label: "Hero Tablet (1200×600)", type: "image", category: "banner" },
            { name: "mobile_url", label: "Hero Mobile (750×1000)", type: "image", category: "banner" },
            {
              name: "page_banner_url",
              label: "Page Banner (1920×300) — แถบหัวหน้า Deals / About / Contact / Categories / จองบริการ",
              type: "image",
              category: "banner",
            },
          ]}
        />
      )}

      {tab === "about" && (
        <>
          <EntityForm
            action={saveAboutSettingsAction}
            columns={1}
            defaults={{
              history: (g("about_content").history as string) ?? "",
              highlights: ((g("about_content").highlights as string[]) ?? []).join("\n"),
              history_image_url: (g("about_content").history_image_url as string) ?? "",
            }}
            fields={[
              {
                name: "history",
                label: "ประวัติร้าน (Store History)",
                type: "textarea",
                required: true,
                maxLength: 3000,
              },
              {
                // category "other" (not "gallery") so this picture does not also appear in Store Gallery
                name: "history_image_url",
                label: "ภาพประวัติร้าน (1200×800) — ไม่ใส่ = แสดงโลโก้บนพื้น Gradient",
                type: "image",
                category: "other",
              },
              {
                name: "highlights",
                label: "จุดเด่นของร้าน (1 บรรทัด = 1 ข้อ)",
                type: "textarea",
                required: true,
                maxLength: 2000,
              },
            ]}
          />
          <TeamTable supabase={supabase} />
          <p className="text-sm text-ink-soft">
            Store Gallery: อัปโหลดภาพหมวด <strong>gallery</strong> ที่{" "}
            <Link href="/admin/images?category=gallery" className="text-brand-accent hover:underline">
              Images
            </Link>{" "}
            — ภาพจะแสดงในหน้า About อัตโนมัติ
          </p>
        </>
      )}

      {tab === "contact" && (
        <EntityForm
          action={saveContactSettingsAction}
          defaults={
            { ...g("store_contact"), ...g("social_links") } as Record<string, string | boolean | null>
          }
          fields={
            [
              { name: "phone", label: "เบอร์โทร", type: "text" },
              { name: "email", label: "อีเมล", type: "email" },
              { name: "address", label: "ที่อยู่ (เว้นว่าง = ซ่อน)", type: "textarea", maxLength: 500 },
              { name: "map_embed_url", label: "Google Maps Embed URL (เว้นว่าง = ซ่อนแผนที่)", type: "url" },
              { name: "facebook", label: "Facebook URL", type: "url" },
              { name: "instagram", label: "Instagram URL", type: "url" },
              { name: "tiktok", label: "TikTok URL", type: "url" },
              { name: "youtube", label: "YouTube URL", type: "url" },
              { name: "is_sample", label: "เป็นข้อมูลตัวอย่าง (แสดงป้าย “ข้อมูลตัวอย่าง” บนเว็บ)", type: "checkbox" },
            ] satisfies FieldDef[]
          }
        />
      )}

      {tab === "commerce" && (
        <CommerceForm
          defaults={
            {
              ...g("shipping_rule"),
              ...g("points_rule"),
              birthday_coupon_id: g("birthday_rule").coupon_id,
            } as Record<string, string | number>
          }
          supabase={supabase}
        />
      )}

      {tab === "payment" && (
        <>
          <p className="rounded-btn border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            โหมดการชำระเงิน: <strong>demo</strong> (ล็อกไว้ — ยังไม่มีตัวเลือก live จนกว่าจะเชื่อม Payment Gateway จริง) ·
            ห้ามใช้ข้อมูลบัญชีจริง
          </p>
          <EntityForm
            action={savePaymentSettingsAction}
            defaults={
              {
                qr_image_url: g("payment_mode").qr_image_url as string,
                ...(g("payment_mode").bank_sample as V),
              } as Record<string, string>
            }
            fields={[
              { name: "bank", label: "ชื่อธนาคาร (ตัวอย่าง)", type: "text", required: true },
              { name: "account_name", label: "ชื่อบัญชี (ตัวอย่าง)", type: "text", required: true },
              { name: "account_no", label: "เลขที่บัญชี (ตัวอย่าง)", type: "text", required: true },
              {
                name: "qr_image_url",
                label: "ภาพ QR ตัวอย่าง (ไม่บังคับ — ไม่ใส่ = ใช้ QR จำลองที่ระบบสร้าง)",
                type: "image",
                category: "other",
              },
            ]}
          />
        </>
      )}

      {tab === "booking" && (
        <EntityForm
          action={saveBookingSettingsAction}
          defaults={{
            time_slots: ((g("booking_rule").time_slots as string[]) ?? []).join(", "),
            max_days_ahead: (g("booking_rule").max_days_ahead as number) ?? 30,
            closed_weekdays: ((g("booking_rule").closed_weekdays as number[]) ?? []).join(", "),
          }}
          fields={[
            { name: "time_slots", label: "ช่วงเวลา (HH:MM คั่นด้วย ,)", type: "text", required: true },
            { name: "max_days_ahead", label: "จองล่วงหน้าได้สูงสุด (วัน)", type: "number", required: true, min: 1 },
            { name: "closed_weekdays", label: "วันปิด (1=จันทร์ … 7=อาทิตย์, คั่นด้วย ,)", type: "text" },
          ]}
        />
      )}

      {tab === "uploads" && (
        <EntityForm
          action={saveUploadSettingsAction}
          defaults={{ max_mb: Number(g("upload_rule").max_bytes ?? 2097152) / 1024 / 1024 }}
          fields={[
            {
              name: "max_mb",
              label: "ขนาดไฟล์สูงสุด (MB)",
              type: "number",
              required: true,
              step: "0.1",
              min: 0.1,
              max: 2,
              hint: "ชนิดไฟล์: JPG / PNG / WebP · Storage bucket จำกัดไว้ที่ 2 MB",
            },
          ]}
        />
      )}
    </>
  );
}

type SB = Awaited<ReturnType<typeof createClient>>;

async function CommerceForm({
  defaults,
  supabase,
}: {
  defaults: Record<string, string | number>;
  supabase: SB;
}) {
  const { data: templates } = await supabase
    .from("coupons")
    .select("id, code, name")
    .eq("coupon_type", "birthday")
    .order("created_at");
  return (
    <EntityForm
      action={saveCommerceSettingsAction}
      defaults={defaults}
      fields={[
        { name: "flat_fee", label: "ค่าส่ง (บาท)", type: "number", required: true, step: "0.01", min: 0 },
        {
          name: "free_shipping_min",
          label: "ส่งฟรีเมื่อยอดสินค้าก่อนหักคูปอง ≥ (บาท)",
          type: "number",
          required: true,
          step: "0.01",
          min: 0,
        },
        {
          name: "baht_per_point",
          label: "กี่บาท = 1 คะแนน",
          type: "number",
          required: true,
          min: 1,
          hint: "คะแนน = (ยอดสินค้า − ส่วนลดคูปอง) ÷ ค่านี้ · ไม่รวมค่าส่ง (D-04)",
        },
        {
          name: "birthday_coupon_id",
          label: "คูปองแม่แบบวันเกิด (birthday_rule)",
          type: "select",
          required: true,
          hint: "ใช้ได้ทั้งเดือนเกิด · แก้ส่วนลด/เงื่อนไขที่เมนู Coupons",
          options: (templates ?? []).map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })),
        },
      ]}
    />
  );
}

async function TeamTable({ supabase }: { supabase: Awaited<ReturnType<typeof createClient>> }) {
  const { data } = await supabase
    .from("team_members")
    .select("id, full_name, position, sort_order, is_active, is_demo")
    .order("sort_order");
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Team Members</h2>
        <ButtonLink href="/admin/settings/team/new" size="sm">
          <Plus className="size-4" aria-hidden /> เพิ่ม
        </ButtonLink>
      </div>
      <AdminTable minWidth={560}>
        <thead className="bg-surface">
          <tr>
            <th className={th}>ชื่อ</th>
            <th className={th}>ตำแหน่ง</th>
            <th className={`${th} text-right`}>ลำดับ</th>
            <th className={th}>สถานะ</th>
            <th className={th}>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((t) => (
            <tr key={t.id} className="border-t border-line">
              <td className={td}>
                {t.full_name}
                {t.is_demo && <Badge className="ml-2">Demo</Badge>}
              </td>
              <td className={td}>{t.position}</td>
              <td className={`${td} text-right`}>{t.sort_order}</td>
              <td className={td}>
                <Badge tone={t.is_active ? "success" : "neutral"}>{t.is_active ? "แสดง" : "ซ่อน"}</Badge>
              </td>
              <td className={td}>
                <div className="flex gap-1">
                  <ButtonLink href={`/admin/settings/team/${t.id}`} size="sm" variant="outline">
                    แก้ไข
                  </ButtonLink>
                  <ActionButton
                    label="ลบ"
                    danger
                    confirm={{ title: `ลบ ${t.full_name}?`, confirmLabel: "ลบ" }}
                    run={async () => {
                      "use server";
                      return deleteTeamMemberAction(t.id);
                    }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </section>
  );
}
