"use client";

import { useEffect } from "react";

/**
 * Scrolls to the element named in the URL hash once it exists. Render it inside streamed (Suspense)
 * content: on `/deals#slug` the browser looks for the anchor before the promotions have loaded, finds
 * nothing and stays at the top. Mounting with the content fixes both a fresh load and a client-side
 * navigation from a promotion card. The target's `scroll-mt-*` keeps it clear of the sticky header.
 */
export function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    // wait one frame so layout (images, grids) has settled before measuring
    const raf = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}
