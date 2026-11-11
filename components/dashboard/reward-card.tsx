"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Coins, Gift } from "lucide-react";
import { toast } from "sonner";
import { redeemRewardAction } from "@/lib/actions/member";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Reward = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points_required: number;
  stock_quantity: number;
};

/** Reward Card 240×320 (SPEC system 12): image, name, points (32×32 icon), stock; redeem 140×40 + confirm 420×300. */
export function RewardCard({ reward, balance }: { reward: Reward; balance: number }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const out = reward.stock_quantity <= 0;
  const short = balance < reward.points_required;

  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-card bg-brand-gradient">
        {reward.image_url ? (
          <Image src={reward.image_url} alt={reward.name} fill sizes="240px" className="object-cover" />
        ) : (
          <Gift className="size-16 text-brand-lime" aria-hidden strokeWidth={1.5} />
        )}
      </div>
      <h3 className="line-clamp-2 min-h-[2.75rem] font-semibold">{reward.name}</h3>
      {reward.description && <p className="line-clamp-2 text-sm text-ink-soft">{reward.description}</p>}
      <div className="mt-auto flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-1 font-display text-lg font-bold text-brand-lime">
          <Coins className="size-5" aria-hidden />
          {reward.points_required.toLocaleString("th-TH")}
        </span>
        <span className={out ? "text-danger" : "text-ink-muted"}>
          {out ? "หมด" : `เหลือ ${reward.stock_quantity}`}
        </span>
      </div>
      <Button className="h-10 w-full" disabled={out || short} onClick={() => setOpen(true)}>
        {out
          ? "ของรางวัลหมด"
          : short
            ? `ขาดอีก ${(reward.points_required - balance).toLocaleString("th-TH")} คะแนน`
            : "แลกรางวัล"}
      </Button>

      <ConfirmDialog
        open={open}
        title={`แลก “${reward.name}”?`}
        description={
          <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-sm">
            <dt className="text-ink-soft">ใช้คะแนน</dt>
            <dd className="text-right font-semibold">{reward.points_required.toLocaleString("th-TH")}</dd>
            <dt className="text-ink-soft">คะแนนคงเหลือหลังแลก</dt>
            <dd className="text-right font-semibold">
              {(balance - reward.points_required).toLocaleString("th-TH")}
            </dd>
            <dd className="col-span-2 mt-2 text-xs text-ink-muted">รับของรางวัลที่ร้าน หรือจัดส่งพร้อมคำสั่งซื้อถัดไป</dd>
          </dl>
        }
        confirmLabel="ยืนยันการแลก"
        loading={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() =>
          start(async () => {
            const res = await redeemRewardAction(reward.id);
            setOpen(false);
            if (res.ok) toast.success(res.message);
            else toast.error(res.message);
          })
        }
      />
    </article>
  );
}
