import type { Metadata } from "next";
import { Suspense } from "react";
import { WishlistView } from "@/components/cart/wishlist-view";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Wishlist" };

/** S14-F08 — same component as /wishlist (SYSTEM_ANALYSIS D04). */
export default function DashboardWishlistPage() {
  return (
    <div>
      <Suspense fallback={<Skeleton className="h-80" />}>
        <WishlistView />
      </Suspense>
    </div>
  );
}
