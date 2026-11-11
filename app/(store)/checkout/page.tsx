import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getMyCart, getMyProfileForForms } from "@/lib/data/member";
import { getPublicSettings } from "@/lib/data/site";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CheckoutStepper } from "@/components/checkout/stepper";
import { DemoBanner, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Checkout" };

/** S09 step 1 — shipping details + coupon. Always rendered per request (live price/stock). */
export default function CheckoutPage() {
  return (
    <>
      <DemoBanner />
      <div className="container-page flex flex-col gap-6 py-8 md:py-10">
        <h1 className="font-display text-3xl font-bold">Checkout</h1>
        <CheckoutStepper current={1} />
        <Suspense fallback={<Skeleton className="h-[480px]" />}>
          <CheckoutContent />
        </Suspense>
      </div>
    </>
  );
}

async function CheckoutContent() {
  const [lines, settings, profile] = await Promise.all([
    getMyCart(),
    getPublicSettings(),
    getMyProfileForForms(),
  ]);
  // Nothing to buy, or something needs fixing first (S07-F05 check again at checkout)
  if (!lines.length || lines.some((l) => !l.isPurchasable)) redirect("/cart");

  return (
    <CheckoutForm
      lines={lines}
      subtotal={lines.reduce((s, l) => s + l.lineTotal, 0)}
      shipping={{
        flatFee: Number(settings.shipping_rule.flat_fee),
        freeMin: Number(settings.shipping_rule.free_shipping_min),
      }}
      profile={{
        fullName: profile?.full_name ?? "",
        phone: profile?.phone ?? null,
        address: profile?.address ?? null,
      }}
    />
  );
}
