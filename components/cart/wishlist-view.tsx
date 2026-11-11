import { Heart } from "lucide-react";
import { getMyWishlist } from "@/lib/data/member";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { MoveAllButton, WishlistCard } from "./wishlist-card";

/** Shared by /wishlist and /dashboard/wishlist (D04: one component, two routes). */
export async function WishlistView({ headingLevel = "h1" }: { headingLevel?: "h1" | "h2" }) {
  const lines = await getMyWishlist();
  const Heading = headingLevel;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading className="font-display text-3xl font-bold">
          My Wishlist <span className="text-lg text-ink-soft">({lines.length})</span>
        </Heading>
        <MoveAllButton lines={lines} />
      </div>
      {lines.length ? (
        <ul className="grid grid-cols-1 gap-3 min-[375px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 desk:grid-cols-5">
          {lines.map((l) => (
            <li key={l.wishlistItemId}>
              <WishlistCard line={l} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Heart}
          title="ยังไม่มีรายการโปรด"
          description="กดไอคอนหัวใจบนสินค้าเพื่อบันทึกไว้ดูภายหลัง"
          action={<ButtonLink href="/shop">เลือกดูสินค้า</ButtonLink>}
        />
      )}
    </div>
  );
}
