import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { CalendarClock, Megaphone } from "lucide-react";
import type { ActivePromotion } from "@/lib/data/catalog";
import { formatTHB, formatThaiDate } from "@/lib/utils/format";
import { Countdown } from "./countdown";

export function discountLabel(p: Pick<ActivePromotion, "discountType" | "discountValue">) {
  return p.discountType === "percentage"
    ? `ลด ${Number(p.discountValue).toLocaleString("th-TH")}%`
    : `ลด ${formatTHB(p.discountValue)}`;
}

/** Promotion Card 320×220 (SPEC system 19) — banner when uploaded, gradient otherwise. */
export function PromotionCard({
  promotion,
  showCountdown = false,
}: {
  promotion: ActivePromotion;
  showCountdown?: boolean;
}) {
  return (
    <Link
      href={`/deals#${promotion.slug}`}
      className={cn(
        "group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-card border border-brand-secondary/60 bg-brand-gradient p-6 transition-all hover:-translate-y-1 hover:shadow-glow",
        // desktop (≥1024px): banner at full colour on the plain canvas — no brand-gradient wash
        promotion.bannerDesktopUrl && "lg:bg-canvas lg:bg-none",
      )}
    >
      {promotion.bannerDesktopUrl && (
        <>
          <picture className="absolute inset-0">
            {promotion.bannerMobileUrl && (
              <source media="(max-width: 767px)" srcSet={promotion.bannerMobileUrl} />
            )}
            {/* tablet/phone keep the 60% banner over the gradient; desktop shows it at full colour */}
            <img
              src={promotion.bannerDesktopUrl}
              alt=""
              className="size-full object-cover opacity-60 lg:opacity-100"
            />
          </picture>
          {/* readability shade (all sizes): dark from the bottom, where the name/description/date sit */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-canvas/90 via-canvas/45 to-transparent"
          />
        </>
      )}
      <div className="relative flex items-start justify-between gap-3">
        <Megaphone className="size-8 text-brand-lime" aria-hidden />
        <span className="rounded-full bg-brand-lime px-3 py-1 text-sm font-bold text-canvas">
          {discountLabel(promotion)}
        </span>
      </div>
      <div className="relative flex flex-col gap-1">
        <h3 className="font-display text-2xl font-bold">{promotion.name}</h3>
        {promotion.description && (
          <p className="line-clamp-2 text-sm text-ink-soft">{promotion.description}</p>
        )}
        <p className="mt-2 inline-flex items-center gap-2 text-sm text-ink-soft">
          <CalendarClock className="size-4" aria-hidden />
          ถึง {formatThaiDate(promotion.endAt)}
          {showCountdown && <Countdown endAt={promotion.endAt} />}
        </p>
        <p className="text-xs text-ink-muted">{promotion.productCount} สินค้าร่วมรายการ</p>
      </div>
    </Link>
  );
}
