"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMyWishlistIdsAction } from "@/lib/actions/cart";

type WishlistState = {
  /** null until loaded (or for guests before the first check) */
  ids: Set<string> | null;
  setInWishlist: (productId: string, value: boolean) => void;
};

const WishlistContext = createContext<WishlistState>({ ids: null, setInWishlist: () => {} });

/**
 * Loads the member's wishlist product ids once on the client, so every heart icon can show
 * the filled state (UI §1.7) without making catalog pages depend on the session.
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    let alive = true;
    getMyWishlistIdsAction()
      .then((list) => alive && setIds(new Set(list)))
      .catch(() => alive && setIds(new Set()));
    return () => {
      alive = false;
    };
  }, []);

  const setInWishlist = useCallback((productId: string, value: boolean) => {
    setIds((prev) => {
      const next = new Set(prev ?? []);
      if (value) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ ids, setInWishlist }), [ids, setInWishlist]);
  return <WishlistContext value={value}>{children}</WishlistContext>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}
