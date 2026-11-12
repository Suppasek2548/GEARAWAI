import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertTriangle, MapPinned, Plus } from "lucide-react";
import { getMyAddresses } from "@/lib/data/member";
import { MAX_ADDRESSES } from "@/lib/validation/address";
import { AddressCard } from "@/components/dashboard/address-card";
import { AddressSavedToast } from "@/components/dashboard/address-saved-toast";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "ที่อยู่สำหรับจัดส่ง" };

/** D-24 — the signed-in member's own shipping addresses (list / empty state). */
export default function AddressesPage({ searchParams }: PageProps<"/dashboard/addresses">) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<Skeleton className="h-64" />}>
        <AddressList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AddressList({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard/addresses">["searchParams"];
}) {
  const [sp, { addresses, error }] = await Promise.all([searchParams, getMyAddresses()]);
  const saved = typeof sp.saved === "string" ? sp.saved : undefined;
  const full = addresses.length >= MAX_ADDRESSES;

  return (
    <>
      <AddressSavedToast saved={saved} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">ที่อยู่สำหรับจัดส่ง</h1>
        {!error && !full && (
          <ButtonLink href="/dashboard/addresses/new">
            <Plus className="size-4" aria-hidden /> เพิ่มที่อยู่
          </ButtonLink>
        )}
      </div>

      {error ? (
        <EmptyState
          icon={AlertTriangle}
          title="ยังโหลดที่อยู่ไม่ได้"
          description="ระบบที่อยู่ยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลังหรือติดต่อร้าน"
        />
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="คุณยังไม่มีที่อยู่สำหรับจัดส่ง"
          description="เพิ่มที่อยู่ไว้ล่วงหน้า เพื่อใช้เป็นข้อมูลสำหรับการจัดส่งสินค้า"
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {addresses.map((a) => (
              <AddressCard key={a.id} address={a} />
            ))}
          </ul>
          {full && (
            <p className="text-sm text-ink-muted">
              บันทึกที่อยู่ได้สูงสุด {MAX_ADDRESSES} รายการ — ลบที่อยู่เก่าเพื่อเพิ่มที่อยู่ใหม่
            </p>
          )}
        </>
      )}
    </>
  );
}
