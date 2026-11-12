import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getMyAddress } from "@/lib/data/member";
import { updateAddressAction } from "@/lib/actions/address";
import { AddressForm } from "@/components/dashboard/address-form";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "แก้ไขที่อยู่" };

/** D-24 — edit one of the member's own addresses (someone else's id → 404). */
export default function EditAddressPage({ params }: PageProps<"/dashboard/addresses/[id]/edit">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">แก้ไขที่อยู่</h1>
        <ButtonLink href="/dashboard/addresses" variant="outline">
          <ArrowLeft className="size-4" aria-hidden /> กลับไปหน้าที่อยู่
        </ButtonLink>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <EditForm params={params} />
      </Suspense>
    </div>
  );
}

async function EditForm({ params }: { params: PageProps<"/dashboard/addresses/[id]/edit">["params"] }) {
  const { id } = await params;
  const address = await getMyAddress(id);
  if (!address) notFound();
  return (
    <AddressForm
      action={updateAddressAction.bind(null, address.id)}
      initial={address}
      submitLabel="บันทึกการแก้ไข"
    />
  );
}
