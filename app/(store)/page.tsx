import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Gift,
  LayoutGrid,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingCart,
  Wrench,
} from "lucide-react";
import { getActivePromotions, getCategoriesWithCounts, getFeaturedProducts } from "@/lib/data/catalog";
import { getPublicSettings, type HeroBanner, type StoreInfo } from "@/lib/data/site";
import { getCurrentUser } from "@/lib/auth/dal";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { ProductCard, ProductGrid } from "@/components/products/product-card";
import { CategoryCard } from "@/components/products/category-card";
import { PromotionCard } from "@/components/promotions/promotion-card";

/**
 * S01 Homepage (UI §4): Hero → Store info → Popular Categories → Featured Products → Promotions →
 * Why Choose GEARAWAI → Register CTA (guests only). Every data section reads the database.
 */
export default function HomePage() {
  return (
    <>
      <Suspense fallback={<Hero />}>
        <HeroFromSettings />
      </Suspense>
      <StoreInfoStrip />

      <Section title="Popular Categories" href="/categories" linkLabel="ดูหมวดหมู่ทั้งหมด">
        <Suspense fallback={<GridSkeleton count={8} className="h-56" />}>
          <PopularCategories />
        </Suspense>
      </Section>

      <Section title="Featured Products" href="/shop" linkLabel="ดูสินค้าทั้งหมด">
        <Suspense fallback={<GridSkeleton count={5} className="h-[340px]" />}>
          <FeaturedProducts />
        </Suspense>
      </Section>

      <Suspense fallback={null}>
        <HomePromotions />
      </Suspense>

      <Suspense fallback={null}>
        <WhyChoose />
      </Suspense>

      <Suspense fallback={null}>
        <RegisterCta />
      </Suspense>
    </>
  );
}

/* ---------------- Hero (S01-F02) ---------------- */

const DEFAULT_INFO: StoreInfo = {
  name: "GEARAWAI",
  slogan: "LEVEL UP YOUR GEAR",
  tagline: "Upgrade your setup with premium gaming gear and IT accessories.",
};

async function HeroFromSettings() {
  const s = await getPublicSettings();
  return <Hero info={s.store_info} banner={s.hero_banner} />;
}

function Hero({ info = DEFAULT_INFO, banner }: { info?: StoreInfo; banner?: HeroBanner }) {
  const ctaHref = banner?.cta_href?.startsWith("/") ? banner.cta_href : "/shop";
  return (
    <section className="relative overflow-hidden bg-brand-gradient">
      {banner?.desktop_url ? (
        <picture className="absolute inset-0">
          {banner.mobile_url && <source media="(max-width: 767px)" srcSet={banner.mobile_url} />}
          {banner.tablet_url && <source media="(max-width: 1023px)" srcSet={banner.tablet_url} />}
          <img src={banner.desktop_url} alt="" className="size-full object-cover opacity-50" />
        </picture>
      ) : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgb(227_239_79/0.18),transparent_45%)]"
        />
      )}
      <div className="relative container-page flex min-h-[520px] flex-col items-center justify-center gap-6 py-20 text-center md:items-start md:text-left lg:min-h-[560px] desk:min-h-[700px]">
        <p className="text-sm font-semibold tracking-[0.3em] text-brand-lime">{info.name}</p>
        <h1 className="font-display text-4xl leading-tight font-bold tracking-[0.04em] uppercase md:text-5xl desk:text-6xl">
          {info.slogan}
        </h1>
        <p className="max-w-xl text-lg text-ink-soft">{info.tagline}</p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <ButtonLink href={ctaHref} size="lg" className="w-full sm:w-auto">
            {banner?.cta_label || "SHOP NOW"} <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
          <ButtonLink href="/deals" size="lg" variant="outline" className="w-full sm:w-auto">
            View Deals
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Store info strip (S01-F03) — only claims backed by SPEC highlights ---------------- */

function StoreInfoStrip() {
  return (
    <section aria-label="จุดเด่นของร้าน" className="border-b border-line bg-surface">
      <ul className="container-page grid grid-cols-1 gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: ShieldCheck, text: "ข้อมูลสินค้าครบถ้วน" },
          { icon: Search, text: "ค้นหาและกรองสินค้าง่าย" },
          { icon: Gift, text: "สะสมคะแนนแลกของรางวัล" },
          { icon: Wrench, text: "บริการประกอบและตรวจเช็กอุปกรณ์" },
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-sm text-ink-soft">
            <Icon className="size-6 shrink-0 text-brand-accent" aria-hidden />
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- Sections ---------------- */

function Section({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="container-page flex flex-col gap-6 py-12 md:py-16 desk:py-24">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-bold md:text-3xl">{title}</h2>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-accent hover:underline"
        >
          <span className="hidden sm:inline">{linkLabel}</span>
          <span className="sm:hidden">View all</span>
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      {children}
    </section>
  );
}

async function PopularCategories() {
  const categories = await getCategoriesWithCounts();
  return (
    // Mobile: horizontal scroll-snap (~2.5 cards) · Tablet/Laptop 4×2 · Desktop 8 columns (UI §4.4)
    <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 md:pb-0 desk:grid-cols-8">
      {categories.map((c) => (
        <li key={c.slug} className="w-[40%] shrink-0 snap-start md:w-auto">
          <CategoryCard category={c} />
        </li>
      ))}
    </ul>
  );
}

async function FeaturedProducts() {
  const products = await getFeaturedProducts(10);
  if (!products.length) return <p className="text-ink-soft">ยังไม่มีสินค้าแนะนำในขณะนี้</p>;
  return (
    <ProductGrid>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ProductGrid>
  );
}

async function HomePromotions() {
  const promotions = await getActivePromotions({ homepageOnly: true });
  if (!promotions.length) return null; // nothing active → hide the section (S01-F06)
  return (
    <section className="bg-surface/60">
      <div className="container-page flex flex-col gap-6 py-12 md:py-16 desk:py-24">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Promotions</h2>
          <Link
            href="/deals"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-accent hover:underline"
          >
            ดูดีลทั้งหมด <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {promotions.map((p) => (
            <li key={p.id}>
              <PromotionCard promotion={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const WHY_ICONS = [LayoutGrid, PackageSearch, Search, ShoppingCart, BadgeCheck];

async function WhyChoose() {
  const { about_content } = await getPublicSettings();
  const highlights = about_content.highlights ?? [];
  if (!highlights.length) return null;
  return (
    <section className="container-page flex flex-col gap-6 py-12 md:py-16 desk:py-24">
      <h2 className="text-center font-display text-2xl font-bold md:text-3xl">Why Choose GEARAWAI</h2>
      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {highlights.map((h, i) => {
          const Icon = WHY_ICONS[i % WHY_ICONS.length];
          return (
            <li
              key={h}
              className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface p-6 text-center"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-brand-primary">
                <Icon className="size-7 text-brand-lime" aria-hidden />
              </span>
              <p className="text-ink-soft">{h}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

async function RegisterCta() {
  const user = await getCurrentUser();
  if (user) return null; // hidden after login (UI §4.2)
  return (
    <section className="container-page pb-16">
      <div className="flex flex-col items-center gap-4 rounded-card bg-brand-gradient p-8 text-center md:flex-row md:justify-between md:p-10 md:text-left">
        <div>
          <h2 className="font-display text-2xl font-bold">สมัครสมาชิกเพื่อสะสมคะแนน</h2>
          <p className="text-ink-soft">รับคะแนนทุกคำสั่งซื้อ แลกของรางวัล และรับสิทธิพิเศษวันเกิด</p>
        </div>
        <ButtonLink href="/register" size="lg" className="w-full md:w-auto">
          Register
        </ButtonLink>
      </div>
    </section>
  );
}

function GridSkeleton({ count, className }: { count: number; className: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 desk:grid-cols-5" aria-busy>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  );
}
