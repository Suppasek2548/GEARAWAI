import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createAddressAction } from "@/lib/actions/address";
import { AddressForm } from "@/components/dashboard/address-form";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "เพิ่มที่อยู่" };

/** D-24 — add a shipping address (manual fields only). */
export default function NewAddressPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">เพิ่มที่อยู่</h1>
        <ButtonLink href="/dashboard/addresses" variant="outline">
          <ArrowLeft className="size-4" aria-hidden /> กลับไปหน้าที่อยู่
        </ButtonLink>
      </div>
      <AddressForm action={createAddressAction} />
    </div>
  );
}
