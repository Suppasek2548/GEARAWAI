import type { Metadata } from "next";
import { Suspense } from "react";
import { Info, Mail, MapPin, Phone } from "lucide-react";
import { getPublicSettings, safeHttpsUrl } from "@/lib/data/site";
import { getCurrentUser } from "@/lib/auth/dal";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { SocialIcons } from "@/components/shared/social-icons";
import { ContactForm } from "@/components/forms/contact-form";
import { Logo } from "@/components/layout/logo";
import { Skeleton } from "@/components/ui/misc";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "ช่องทางติดต่อร้าน GEARAWAI และแบบฟอร์มติดต่อสอบถาม",
};

/** S13 Contact Us (info from site_settings) + S20 Contact Form. */
export default function ContactPage() {
  return (
    <>
      <PageHeader title="Contact Us">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact Us" }]} />
      </PageHeader>
      <div className="container-page flex flex-col gap-8 py-10">
        <div className="grid gap-8 lg:grid-cols-[5fr_7fr]">
          <Suspense fallback={<Skeleton className="h-[250px]" />}>
            <ContactInfo />
          </Suspense>
          <section
            aria-labelledby="form-heading"
            className="rounded-card border border-line bg-surface p-6 md:p-8"
          >
            <h2 id="form-heading" className="mb-4 font-display text-2xl font-bold">
              ส่งข้อความถึงเรา
            </h2>
            <Suspense fallback={<ContactForm />}>
              <ContactFormForUser />
            </Suspense>
          </section>
        </div>
        <Suspense fallback={null}>
          <MapEmbed />
        </Suspense>
      </div>
    </>
  );
}

async function ContactInfo() {
  const { store_contact: c, social_links, store_info } = await getPublicSettings();
  const telHref = c.phone ? `tel:${c.phone.replace(/[^0-9+]/g, "")}` : null;
  return (
    <section
      aria-labelledby="info-heading"
      className="flex flex-col gap-5 rounded-card border border-line bg-surface p-6 md:p-8"
    >
      <Logo />
      <h2 id="info-heading" className="sr-only">
        ข้อมูลติดต่อ {store_info.name}
      </h2>
      <ul className="flex flex-col gap-4">
        {c.phone && telHref && (
          <li>
            <a href={telHref} className="inline-flex items-center gap-3 text-ink hover:text-brand-accent">
              <Phone
                className="size-8 shrink-0 rounded-btn bg-elevated p-1.5 text-brand-accent"
                aria-hidden
              />
              {c.phone}
            </a>
          </li>
        )}
        {c.email && (
          <li>
            <a
              href={`mailto:${c.email}`}
              className="inline-flex items-center gap-3 break-all text-ink hover:text-brand-accent"
            >
              <Mail className="size-8 shrink-0 rounded-btn bg-elevated p-1.5 text-brand-accent" aria-hidden />
              {c.email}
            </a>
          </li>
        )}
        {c.address && (
          <li className="inline-flex items-start gap-3 text-ink-soft">
            <MapPin className="size-8 shrink-0 rounded-btn bg-elevated p-1.5 text-brand-accent" aria-hidden />
            {c.address}
          </li>
        )}
      </ul>
      <SocialIcons links={social_links} />
      {c.is_sample && (
        <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
          <Info className="size-4" aria-hidden /> ข้อมูลติดต่อเป็นข้อมูลตัวอย่าง (จะแก้ไขเมื่อได้ข้อมูลร้านจริง)
        </p>
      )}
    </section>
  );
}

async function ContactFormForUser() {
  const user = await getCurrentUser();
  // Members: name/email pre-filled from the profile, still editable (S20-F01)
  return <ContactForm defaultName={user?.fullName} defaultEmail={user?.email} />;
}

async function MapEmbed() {
  const { store_contact } = await getPublicSettings();
  const src = safeHttpsUrl(store_contact.map_embed_url);
  // Shown only when a real address/map is configured (S13-F05)
  if (!src || !src.startsWith("https://www.google.com/maps/embed")) return null;
  return (
    <iframe
      src={src}
      title="แผนที่ร้าน GEARAWAI"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className="h-[280px] w-full rounded-card border border-line md:h-[400px]"
    />
  );
}
