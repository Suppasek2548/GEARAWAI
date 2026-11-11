"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Cake, Check, Copy, Gift } from "lucide-react";
import { toast } from "sonner";
import { claimBirthdayCouponAction } from "@/lib/actions/member";
import { formatThaiDateTime } from "@/lib/utils/format";
import { Button, ButtonLink } from "@/components/ui/button";

export type BirthdayCardState =
  | { kind: "no-birth-date" }
  | { kind: "not-birth-month" }
  | { kind: "can-claim" }
  | { kind: "claimed"; code: string; expiresAt: string; used: boolean };

/** S11 privilege card (360×220): gift icon 64×64, coupon code 240×48, copy button, expiry in Thai time. */
export function BirthdayCard({ state, discountLabel }: { state: BirthdayCardState; discountLabel: string }) {
  const [current, setCurrent] = useState(state);
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  const claim = () =>
    start(async () => {
      const res = await claimBirthdayCouponAction();
      if (res.ok) {
        setCurrent({ kind: "claimed", code: res.code, expiresAt: res.expiresAt, used: false });
        toast.success("รับสิทธิ์วันเกิดแล้ว 🎉");
      } else toast.error(res.message);
    });

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("คัดลอกรหัสแล้ว");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("คัดลอกไม่สำเร็จ กรุณาคัดลอกด้วยตนเอง");
    }
  };

  return (
    <section
      aria-labelledby="bday-heading"
      className="relative flex min-h-[220px] w-full max-w-[420px] flex-col justify-between gap-4 overflow-hidden rounded-card border border-brand-lime/40 bg-brand-gradient p-6"
    >
      <div className="flex items-start gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-card bg-canvas/40">
          {current.kind === "claimed" ? (
            <Gift className="size-9 text-brand-lime" aria-hidden />
          ) : (
            <Cake className="size-9 text-brand-lime" aria-hidden />
          )}
        </span>
        <div>
          <h2 id="bday-heading" className="font-display text-xl font-bold">
            สิทธิพิเศษวันเกิด
          </h2>
          <p className="text-sm text-ink-soft">{discountLabel}</p>
        </div>
      </div>

      {current.kind === "no-birth-date" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">เพิ่มวันเกิดเพื่อรับสิทธิ์ในเดือนเกิดของคุณ</p>
          <ButtonLink href="/dashboard/profile#birth-date" variant="outline" size="md">
            เพิ่มวันเกิด
          </ButtonLink>
        </div>
      )}

      {current.kind === "not-birth-month" && (
        <p className="text-sm text-ink-soft">รับสิทธิ์ได้ในเดือนเกิดของคุณ (ปีละ 1 ครั้ง)</p>
      )}

      {current.kind === "can-claim" && (
        <Button size="lg" onClick={claim} loading={pending} className="self-start">
          รับสิทธิ์วันเกิด
        </Button>
      )}

      {current.kind === "claimed" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <code className="flex h-12 w-60 max-w-full items-center justify-center rounded-btn border border-dashed border-brand-lime bg-canvas/60 font-mono text-lg font-bold tracking-wider">
              {current.code}
            </code>
            <Button
              variant="ghost"
              size="icon"
              aria-label="คัดลอกรหัสคูปอง"
              onClick={() => copy(current.code)}
              disabled={current.used}
            >
              {copied ? (
                <Check className="size-5 text-success" aria-hidden />
              ) : (
                <Copy className="size-5" aria-hidden />
              )}
            </Button>
          </div>
          <p className="text-xs text-ink-soft">
            {current.used ? "ใช้สิทธิ์แล้ว" : `ใช้ได้ถึง ${formatThaiDateTime(current.expiresAt)} (เวลาไทย)`}
          </p>
          {!current.used && (
            <Link href="/cart" className="text-sm font-semibold text-brand-lime hover:underline">
              ใช้ตอนนี้ →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
