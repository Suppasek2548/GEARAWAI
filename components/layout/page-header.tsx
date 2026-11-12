import { Suspense, type ReactNode } from "react";
import Image from "next/image";
import { getPublicSettings } from "@/lib/data/site";

/**
 * Page heading band shared by Deals, About, Contact, Categories and Booking (SPEC system 13: banner
 * 1920×300). Brand gradient, plus the Admin-set image (Settings → Store → Page Banner) when uploaded.
 * The image is decorative and dimmed so the white title and breadcrumb stay readable (D-20).
 */
export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-brand-gradient">
      <Suspense fallback={null}>
        <PageBannerImage />
      </Suspense>
      <div className="relative container-page flex flex-col gap-2 py-10 md:py-14">
        <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
        {children}
      </div>
    </div>
  );
}

async function PageBannerImage() {
  const { hero_banner } = await getPublicSettings();
  if (!hero_banner.page_banner_url) return null;
  return (
    // object-right keeps the gear (right side of the artwork) in view when narrow screens crop the sides
    <Image
      src={hero_banner.page_banner_url}
      alt=""
      fill
      sizes="100vw"
      className="object-cover object-right opacity-50"
    />
  );
}
