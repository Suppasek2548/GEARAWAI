import type { Metadata } from "next";
import { Suspense } from "react";
import { WishlistView } from "@/components/cart/wishlist-view";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Wishlist" };

/** S06 Wishlist — member only (proxy redirects guests). */
export default function WishlistPage() {
  return (
    <div className="container-page py-8 md:py-10">
      <Suspense fallback={<Skeleton className="h-80" />}>
        <WishlistView />
      </Suspense>
    </div>
  );
}
