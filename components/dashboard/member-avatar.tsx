import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/** Profile picture (100×100 on the dashboard) — initials on a brand gradient when there is no photo. */
export function MemberAvatar({
  name,
  url,
  size = 100,
  className,
}: {
  name: string;
  url: string | null;
  size?: number;
  className?: string;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-full bg-brand-gradient", className)}
      style={{ width: size, height: size }}
    >
      {url ? (
        <Image src={url} alt={`รูปโปรไฟล์ ${name}`} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span
          aria-hidden
          className="flex size-full items-center justify-center font-display font-bold"
          style={{ fontSize: size * 0.36 }}
        >
          {initials || "?"}
        </span>
      )}
    </div>
  );
}
