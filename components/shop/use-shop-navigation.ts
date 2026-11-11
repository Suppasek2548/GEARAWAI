"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseShopFilters, shopHref, type ShopFilters } from "@/lib/shop/filters";

/** Read the current filters from the URL and push updated ones (always back to page 1). */
export function useShopNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const filters = parseShopFilters(new URLSearchParams(searchParams.toString()));

  const update = useCallback(
    (patch: Partial<ShopFilters>, { replace = false } = {}) => {
      const current = parseShopFilters(new URLSearchParams(window.location.search));
      const next = { ...current, ...patch, page: patch.page ?? 1 };
      const href = shopHref(next);
      startTransition(() => {
        if (replace) router.replace(href, { scroll: false });
        else router.push(href, { scroll: false });
      });
    },
    [router],
  );

  return { filters, update, pending };
}
