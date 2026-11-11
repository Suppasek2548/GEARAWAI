import { ArrowRight, Gift, Search, ShieldCheck, Wrench } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

/**
 * S01 Homepage — Phase 1 shell: Hero (SPEC system 1 text) + store info strip.
 * Popular Categories / Featured Products / Promotions / Why Choose come in Phase 2 (data from the database).
 */
export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-gradient">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgb(227_239_79/0.18),transparent_45%)]"
        />
        <div className="relative container-page flex min-h-[520px] flex-col items-center justify-center gap-6 py-20 text-center md:items-start md:text-left lg:min-h-[560px] desk:min-h-[700px]">
          <p className="text-sm font-semibold tracking-[0.3em] text-brand-lime">GEARAWAI</p>
          <h1 className="font-display text-4xl leading-tight font-bold tracking-[0.04em] uppercase md:text-5xl desk:text-6xl">
            Level up your gear
          </h1>
          <p className="max-w-xl text-lg text-ink-soft">
            Upgrade your setup with premium gaming gear and IT accessories.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href="/shop" size="lg" className="w-full sm:w-auto">
              SHOP NOW <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/deals" size="lg" variant="outline" className="w-full sm:w-auto">
              View Deals
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Store info strip — only claims that match SPEC highlights (UI §4.1 note) */}
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
    </>
  );
}
