import type { Metadata } from "next";
import { Suspense } from "react";
import { Ticket } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";
import { getMyCoupons } from "@/lib/data/loyalty";
import { couponDiscountLabel, getBirthdayCard } from "@/lib/data/birthday";
import { formatThaiDateTime } from "@/lib/utils/format";
import { BirthdayCard } from "@/components/dashboard/birthday-card";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Coupons" };

const STATUS = {
  available: { label: "ใช้ได้", tone: "success" },
  used: { label: "ใช้แล้ว", tone: "neutral" },
  expired: { label: "หมดอายุ", tone: "danger" },
} as const;

/** S11 — birthday privilege card + all coupons the member has received (R-05: details from own templates). */
export default function CouponsPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Coupons</h1>
      <Suspense fallback={<Skeleton className="h-80" />}>
        <CouponsContent />
      </Suspense>
    </>
  );
}

async function CouponsContent() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [birthday, coupons] = await Promise.all([getBirthdayCard(user), getMyCoupons()]);

  return (
    <>
      <BirthdayCard state={birthday.state} discountLabel={birthday.label} />

      <section aria-labelledby="my-coupons" className="flex flex-col gap-3">
        <h2 id="my-coupons" className="font-display text-xl font-semibold">
          คูปองของฉัน
        </h2>
        {coupons.length === 0 ? (
          <EmptyState icon={Ticket} title="ยังไม่มีคูปอง" description="คูปองวันเกิดจะแสดงที่นี่หลังกดรับสิทธิ์" />
        ) : (
          <ul className="flex flex-col gap-2">
            {coupons.map((c) => {
              const s = STATUS[c.status];
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-4"
                >
                  <Ticket className="size-6 text-brand-lime" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-ink-soft">{couponDiscountLabel(c)}</p>
                    <p className="text-xs text-ink-muted">
                      {c.status === "used" && c.usedAt
                        ? `ใช้เมื่อ ${formatThaiDateTime(c.usedAt)}`
                        : `หมดอายุ ${formatThaiDateTime(c.expiresAt)}`}
                    </p>
                  </div>
                  <code className="rounded-btn border border-dashed border-line px-3 py-1.5 font-mono font-semibold">
                    {c.code}
                  </code>
                  <Badge tone={s.tone}>{s.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
