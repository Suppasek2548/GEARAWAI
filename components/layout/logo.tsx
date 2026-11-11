import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Temporary text logo (180×60 slot, SPEC system 13) — the GEARAWAI logo file is not in docs/ yet (gap G4).
 */
export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      aria-label="GEARAWAI หน้าแรก"
      className={cn("group inline-flex flex-col leading-none", className)}
    >
      <span className="font-display text-2xl font-bold tracking-[0.08em] text-ink">
        GEAR<span className="text-brand-lime">AWAI</span>
      </span>
      <span className="mt-1 text-[10px] font-semibold tracking-[0.3em] text-brand-accent">
        LEVEL UP YOUR GEAR
      </span>
    </Link>
  );
}
