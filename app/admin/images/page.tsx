import type { Metadata } from "next";
import { Suspense } from "react";
import { listMediaAction } from "@/lib/actions/admin-media";
import { MEDIA_CATEGORIES, type MediaCategory } from "@/lib/admin/media-types";
import { MediaLibrary } from "@/components/admin/media-library";
import { AdminPageHeader, AdminShell, FilterLinks, sp1 } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Images" };

/** S16 Image Management — Supabase Storage + media_files. */
export default function ImagesPage({ searchParams }: PageProps<"/admin/images">) {
  return (
    <AdminShell>
      <AdminPageHeader title="Images" description="คลังรูปภาพของเว็บไซต์ (Supabase Storage)" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Library searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

async function Library({ searchParams }: { searchParams: PageProps<"/admin/images">["searchParams"] }) {
  const sp = await searchParams;
  const raw = sp1(sp.category);
  const category = (MEDIA_CATEGORIES as string[]).includes(raw) ? (raw as MediaCategory) : null;
  const q = sp1(sp.q).toLowerCase();
  const items = (await listMediaAction(category)).filter((m) => !q || m.fileName.toLowerCase().includes(q));

  return (
    <>
      <FilterLinks
        current={category}
        items={[
          { href: "/admin/images", label: "ทั้งหมด", value: null },
          ...MEDIA_CATEGORIES.map((c) => ({ href: `/admin/images?category=${c}`, label: c, value: c })),
        ]}
      />
      <form action="/admin/images" role="search" className="flex max-w-md gap-2">
        {category && <input type="hidden" name="category" value={category} />}
        <label htmlFor="img-q" className="sr-only">
          ค้นหาชื่อไฟล์
        </label>
        <input
          id="img-q"
          name="q"
          defaultValue={q}
          placeholder="ค้นหาชื่อไฟล์"
          className="h-10 min-w-0 flex-1 rounded-btn border border-line bg-surface px-3 text-sm"
        />
      </form>
      <MediaLibrary items={items} defaultCategory={category ?? "product"} />
    </>
  );
}
