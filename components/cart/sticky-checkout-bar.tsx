"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Mobile sticky checkout bar (UI §8.3). It slides away while the Order Summary's own CHECKOUT button
 * (element `targetId`) is on screen, so the page never shows two CHECKOUT buttons at once.
 */
export function StickyCheckoutBar({ targetId, children }: { targetId: string; children: ReactNode }) {
  const [targetVisible, setTargetVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    // Hide only once the whole button is on screen — a thin sliver at the bottom edge is easy to miss.
    const io = new IntersectionObserver(([entry]) => setTargetVisible(entry.intersectionRatio >= 0.99), {
      threshold: [0, 0.99],
    });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);

  return (
    <div
      inert={targetVisible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur transition-transform duration-200 motion-reduce:transition-none lg:hidden",
        targetVisible && "translate-y-full",
      )}
    >
      {children}
    </div>
  );
}
