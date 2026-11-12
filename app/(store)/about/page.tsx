import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { BadgeCheck, LayoutGrid, PackageSearch, Search, ShoppingCart } from "lucide-react";
import { getGallery, getPublicSettings, getTeamMembers } from "@/lib/data/site";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/misc";
import { PageHeader } from "@/components/layout/page-header";
import { Logo } from "@/components/layout/logo";

export const metadata: Metadata = {
  title: "About Us",
  description: "ประวัติร้าน จุดเด่น และทีมงาน GEARAWAI",
};

/** S02 About Us: header + breadcrumb, history, 5 highlights, team, gallery (RPC), CTA. */
export default function AboutPage() {
  return (
    <>
      <PageHeader title="About GEARAWAI">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About Us" }]} />
      </PageHeader>
      <Suspense
        fallback={
          <div className="container-page py-12">
            <Skeleton className="h-80" />
          </div>
        }
      >
        <HistoryAndHighlights />
      </Suspense>
      <Suspense fallback={null}>
        <Team />
      </Suspense>
      <Suspense fallback={null}>
        <Gallery />
      </Suspense>
      <section className="container-page py-12 md:py-16">
        <div className="flex flex-col items-center gap-4 rounded-card bg-brand-gradient p-8 text-center md:p-12">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Ready to Level Up Your Gear?</h2>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href="/shop" size="lg">
              SHOP NOW
            </ButtonLink>
            <ButtonLink href="/contact" size="lg" variant="outline">
              Contact Us
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

const ICONS = [LayoutGrid, PackageSearch, Search, ShoppingCart, BadgeCheck];

async function HistoryAndHighlights() {
  const { about_content } = await getPublicSettings();
  return (
    <>
      <section className="container-page grid items-center gap-8 py-12 md:py-16 lg:grid-cols-2">
        {/* Store history image 1200×800 (Settings → About, D-21) — brand panel when none is set */}
        <div className="relative flex aspect-[3/2] items-center justify-center overflow-hidden rounded-card border border-line bg-brand-gradient">
          {about_content.history_image_url ? (
            <Image
              src={about_content.history_image_url}
              alt="ภาพประกอบบรรยากาศร้าน GEARAWAI"
              fill
              sizes="(min-width:1024px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <Logo className="scale-150" />
          )}
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Store History</h2>
          <p className="leading-relaxed text-ink-soft">{about_content.history}</p>
        </div>
      </section>

      {about_content.highlights.length > 0 && (
        <section className="container-page flex flex-col gap-6 pb-12 md:pb-16">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Store Highlights</h2>
          <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {about_content.highlights.map((h, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <li key={h} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
                  <Icon className="size-8 text-brand-lime" aria-hidden />
                  <p className="text-ink-soft">{h}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

async function Team() {
  const team = await getTeamMembers();
  if (!team.length) return null;
  return (
    <section className="border-y border-line bg-surface/60">
      <div className="container-page flex flex-col gap-6 py-12 md:py-16">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Team Members</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m) => (
            <li
              key={m.id}
              className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface p-6 text-center"
            >
              <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-full bg-brand-gradient">
                {m.imageUrl ? (
                  <Image src={m.imageUrl} alt={m.fullName} fill sizes="112px" className="object-cover" />
                ) : (
                  <span className="font-display text-3xl font-bold" aria-hidden>
                    {m.fullName
                      .replace(/\(.*\)/, "")
                      .trim()
                      .split(/\s+/)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">{m.fullName}</h3>
                <p className="text-sm font-semibold text-brand-accent">{m.position}</p>
              </div>
              {m.description && <p className="text-sm text-ink-soft">{m.description}</p>}
              {m.isDemo && <Badge tone="neutral">ข้อมูลตัวอย่าง</Badge>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

async function Gallery() {
  const images = await getGallery();
  if (!images.length) return null; // hide the whole section when empty (UI §5.2)
  return (
    <section className="container-page flex flex-col gap-6 py-12 md:py-16">
      <h2 className="font-display text-2xl font-bold md:text-3xl">Store Gallery</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img) => (
          <li key={img.id} className="relative aspect-[3/2] overflow-hidden rounded-card border border-line">
            <Image
              src={img.public_url}
              alt={img.alt_text ?? ""}
              fill
              sizes="(min-width:1024px) 33vw, 100vw"
              className="object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
