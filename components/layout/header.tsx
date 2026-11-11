import { Suspense } from "react";
import { getCartCount, getCurrentUser, getWishlistCount, isActiveAdmin } from "@/lib/auth/dal";
import { HeaderBar } from "./header-bar";

/**
 * Global header (UI §2.1). The bar itself renders instantly (static shell);
 * the signed-in part (account menu, cart/wishlist badges) streams in behind Suspense
 * because it reads the session cookie (Cache Components rule).
 */
export function Header() {
  return (
    <Suspense fallback={<HeaderBar user={undefined} />}>
      <HeaderWithUser />
    </Suspense>
  );
}

async function HeaderWithUser() {
  const user = await getCurrentUser();
  if (!user) return <HeaderBar user={null} />;
  const [cartCount, wishlistCount] = await Promise.all([getCartCount(), getWishlistCount()]);
  return (
    <HeaderBar user={{ fullName: user.fullName, isAdmin: isActiveAdmin(user), cartCount, wishlistCount }} />
  );
}
