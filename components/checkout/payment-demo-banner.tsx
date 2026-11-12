import { Suspense } from "react";
import { getPublicSettings } from "@/lib/data/site";
import { DemoBanner } from "@/components/ui/misc";

/** "Demo payment" warning on the checkout pages — hidden once Admin switches payments to live (D-22). */
export function PaymentDemoBanner() {
  return (
    <Suspense fallback={null}>
      <BannerWhenDemo />
    </Suspense>
  );
}

async function BannerWhenDemo() {
  const { payment_mode } = await getPublicSettings();
  return payment_mode.mode === "live" ? null : <DemoBanner />;
}
