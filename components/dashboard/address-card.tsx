"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAddressAction } from "@/lib/actions/address";
import type { MemberAddress } from "@/lib/data/member";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatAddressLines } from "@/lib/utils/address";

/** One saved address with edit + delete (delete asks first). */
export function AddressCard({ address }: { address: MemberAddress }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  const remove = () =>
    start(async () => {
      const res = await deleteAddressAction(address.id);
      setConfirm(false);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.message);
    });

  return (
    <li className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 sm:flex-row sm:items-start sm:justify-between md:p-5">
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="font-semibold text-ink">{address.full_name}</p>
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <Phone className="size-4 shrink-0 text-brand-accent" aria-hidden />
          {address.phone}
        </p>
        <p className="flex items-start gap-2 text-sm text-ink-soft">
          <MapPin className="mt-0.5 size-4 shrink-0 text-brand-accent" aria-hidden />
          <span className="whitespace-pre-line">{formatAddressLines(address).join("\n")}</span>
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <ButtonLink href={`/dashboard/addresses/${address.id}/edit`} size="sm" variant="outline">
          <Pencil className="size-4" aria-hidden /> แก้ไข
        </ButtonLink>
        <Button
          size="sm"
          variant="ghost"
          className="text-danger hover:text-danger"
          onClick={() => setConfirm(true)}
        >
          <Trash2 className="size-4" aria-hidden /> ลบ
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        title="ลบที่อยู่นี้?"
        description={`ที่อยู่ของ ${address.full_name} จะถูกลบออกจากบัญชีของคุณ`}
        confirmLabel="ลบที่อยู่"
        danger
        loading={pending}
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
      />
    </li>
  );
}
